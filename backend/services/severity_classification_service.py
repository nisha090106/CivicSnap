import base64
import json
import logging
import math
import mimetypes
import re
from pathlib import Path
from typing import Any, Dict

from services.report_generator_service import NVIDIA_API_KEY, get_nvidia_client
from services.storage_service import get_presigned_image_url


logger = logging.getLogger(__name__)
VISION_MODEL = "meta/llama-3.2-11b-vision-instruct"
SEVERITY_CLASSES = {"low", "medium", "high", "critical"}


def _image_input(image_url: str) -> str:
    if not image_url:
        raise ValueError("No image URL was provided")

    if image_url.startswith("data:image/"):
        return image_url

    if image_url.startswith(("https://", "http://", "s3://")):
        resolved_url = get_presigned_image_url(image_url) if "amazonaws.com" in image_url or image_url.startswith("s3://") else image_url
        if resolved_url.startswith(("https://", "http://")):
            return resolved_url
        raise ValueError("Image URL could not be made accessible to the vision model")

    backend_root = Path(__file__).resolve().parent.parent
    image_path = Path(image_url)
    if not image_path.is_absolute():
        image_path = backend_root / image_url.lstrip("/\\")
    elif image_url.startswith(("/uploads/", "/static/")):
        image_path = backend_root / image_url.lstrip("/")

    image_bytes = image_path.read_bytes()
    mime_type = mimetypes.guess_type(image_path.name)[0] or "image/jpeg"
    encoded_image = base64.b64encode(image_bytes).decode("ascii")
    return f"data:{mime_type};base64,{encoded_image}"


def _parse_response(content: Any) -> Dict[str, Any]:
    if isinstance(content, list):
        content = "".join(
            item.get("text", "") for item in content if isinstance(item, dict)
        )
    if not isinstance(content, str):
        raise ValueError("Vision model returned no text response")

    response_text = content.strip()
    if response_text.startswith("```"):
        response_text = response_text.split("\n", 1)[-1]
        if response_text.endswith("```"):
            response_text = response_text[:-3].strip()

    try:
        parsed = json.loads(response_text)
    except json.JSONDecodeError:
        json_start = response_text.find("{")
        json_end = response_text.rfind("}")
        if json_start < 0 or json_end <= json_start:
            parsed = _parse_labeled_response(response_text)
        else:
            try:
                parsed = json.loads(response_text[json_start : json_end + 1])
            except json.JSONDecodeError:
                parsed = _parse_labeled_response(response_text)

    if not isinstance(parsed, dict):
        raise ValueError("Vision model response was not a JSON object")

    severity_class = str(parsed.get("severity_class", "")).strip().lower()
    if severity_class not in SEVERITY_CLASSES:
        raise ValueError("Vision model returned an invalid severity class")

    confidence_score = float(parsed.get("confidence_score"))
    if not math.isfinite(confidence_score):
        raise ValueError("Vision model returned an invalid confidence score")

    reasoning = parsed.get("reasoning")
    if not isinstance(reasoning, str) or not reasoning.strip():
        raise ValueError("Vision model returned no severity reasoning")
    normalized_reasoning = reasoning.strip().casefold()
    is_template_sentence = (
        normalized_reasoning
        == "one or two plain-language sentences grounded in visible evidence."
    )
    if is_template_sentence or normalized_reasoning.startswith("example only:"):
        raise ValueError("Vision model returned example text instead of image-specific reasoning")

    urgency_flag = parsed.get("urgency_flag")
    if isinstance(urgency_flag, str) and urgency_flag.strip().lower() in {"true", "false"}:
        urgency_flag = urgency_flag.strip().lower() == "true"
    if not isinstance(urgency_flag, bool):
        raise ValueError("Vision model returned an invalid urgency flag")

    urgency_flag = urgency_flag or severity_class in {"high", "critical"}
    return {
        "severity_class": severity_class,
        "confidence_score": min(1.0, max(0.0, confidence_score)),
        "reasoning": reasoning.strip(),
        "urgency_flag": urgency_flag,
        "source": "ai",
    }


def _parse_labeled_response(response_text: str) -> Dict[str, Any]:
    response_text = response_text.replace("**", "")

    def field(pattern, field_name):
        match = re.search(pattern, response_text, re.IGNORECASE | re.MULTILINE)
        if not match:
            raise ValueError(
                f"Vision model response did not contain a valid {field_name} field"
            )
        return match

    severity_class = field(
        r"^\s*(?:[*\-•]\s*)?severity\s+class\s*:\s*"
        r"(low|medium|high|critical)\b",
        "severity class",
    ).group(1)
    confidence = field(
        r"^\s*(?:[*\-•]\s*)?confidence(?:\s+score)?\s*:\s*"
        r"(\d+(?:\.\d+)?)\s*(%)?",
        "confidence score",
    )
    confidence_score = float(confidence.group(1))
    if confidence.group(2):
        confidence_score /= 100.0
    if confidence_score > 1 and confidence_score <= 100:
        confidence_score /= 100.0

    reasoning_field = field(
        r"^\s*(?:[*\-•]\s*)?reasoning\s*:\s*(.*)$",
        "reasoning",
    )
    reasoning_start = reasoning_field.start(1)
    following_text = response_text[reasoning_start:]
    next_field = re.search(
        r"^\s*(?:[*\-•]\s*)?(?:urgency\s+flag|confidence(?:\s+score)?|"
        r"severity\s+class)\s*:",
        following_text,
        re.IGNORECASE | re.MULTILINE,
    )
    if next_field:
        following_text = following_text[: next_field.start()]
    reasoning = re.sub(r"(?m)^\s*(?:[*\-•]\s*)+", "", following_text)
    reasoning = re.sub(r"\*\*", "", reasoning).strip()
    reasoning = " ".join(line.strip() for line in reasoning.splitlines() if line.strip())
    if not reasoning:
        raise ValueError("Vision model response did not contain a valid reasoning field")

    urgency = re.search(
        r"^\s*(?:[*\-•]\s*)?urgency\s+flag\s*:\s*(true|false)\b",
        response_text,
        re.IGNORECASE | re.MULTILINE,
    )
    severity_class = severity_class.lower()
    return {
        "severity_class": severity_class,
        "confidence_score": confidence_score,
        "reasoning": reasoning,
        "urgency_flag": (
            urgency.group(1).lower() == "true"
            if urgency
            else severity_class in {"high", "critical"}
        ),
    }


def _static_fallback(category: str, failure_reason: str) -> Dict[str, Any]:
    from services.multimodal_service import static_severity_for_category

    severity_class = static_severity_for_category(category).lower()
    logger.warning(
        "Image severity category fallback used for %r: %s",
        category or "unknown",
        failure_reason,
    )
    return {
        "severity_class": severity_class,
        "confidence_score": 0.0,
        "reasoning": (
            "Image-based severity analysis was unavailable; this level uses the "
            f"category-based fallback for '{category or 'unknown'}'."
        ),
        "urgency_flag": False,
        "source": "category_fallback",
    }


def classify_image_severity(
    image_url: str,
    category: str,
    description: str,
) -> Dict[str, Any]:
    """Classify issue severity from the report image, with a safe category fallback."""
    try:
        client = get_nvidia_client(strict=True)
        if client is None:
            reason = (
                "NVIDIA_API_KEY is not configured"
                if not NVIDIA_API_KEY
                else "NVIDIA client initialization failed; see the NVIDIA LLM Init Error log"
            )
            return _static_fallback(category, reason)

        model_image = _image_input(image_url)
        prompt = f"""Assess the severity of the civic issue shown in the attached image.
Assess visible evidence and the likely immediate harm using risk factors appropriate
to this type of issue; do not judge every report only by physical damage or affected
area. Use the category to identify the relevant risk domain, but do not assign
severity from the category alone. For food, sanitation, and environmental-health
issues, visible pests or insects on food, contamination, mold, or unsanitary handling
are direct health hazards and should generally be rated High when clearly visible,
even if the affected area looks small or there is no structural damage. Use Critical
when the image shows an especially severe, imminent, or potentially widespread
life-threatening hazard requiring immediate action. Reserve Medium for limited or
uncertain hazards without clear evidence of a direct serious health risk, and Low
for minor conditions with little immediate risk. Base the assessment on what is
visible; do not claim exposure or harm that the image cannot establish. A High or
Critical assessment must set urgency_flag to true.

Category: {category or 'unspecified'}
Citizen description: {description or 'No description provided'}

Return exactly one valid JSON object and no analysis, headings, markdown, or other text.
Keep reasoning to one or two short sentences (at most 45 words), grounded in visible
evidence. The following is an illustrative FORMAT EXAMPLE only; replace every value
with your own image-specific assessment and do not copy the example wording.
{{
  "severity_class": "medium",
  "confidence_score": 0.75,
  "reasoning": "Example only: [replace with a concrete observation from this image].",
  "urgency_flag": false
}}
severity_class must be one of: low, medium, high, critical.
"""
        completion = client.chat.completions.create(
            model=VISION_MODEL,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": model_image}},
                    ],
                }
            ],
            temperature=0.0,
            max_tokens=512,
        )
        content = completion.choices[0].message.content
        return _parse_response(content)
    except Exception as error:
        error_type = f"{type(error).__module__}.{type(error).__name__}"
        try:
            return _static_fallback(category, f"{error_type}: {error}")
        except Exception:
            logger.exception(
                "Image severity category fallback also failed for %r",
                category or "unknown",
            )
            return {
                "severity_class": "low",
                "confidence_score": 0.0,
                "reasoning": "Image severity analysis was unavailable; manual review is recommended.",
                "urgency_flag": False,
                "source": "category_fallback",
            }