import base64
import json
import math
import mimetypes
from pathlib import Path
from typing import Any, Dict

from services.report_generator_service import get_nvidia_client
from services.storage_service import get_presigned_image_url


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
            raise ValueError("Vision model response did not contain a JSON object")
        parsed = json.loads(response_text[json_start : json_end + 1])

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
    }


def _static_fallback(category: str) -> Dict[str, Any]:
    from services.multimodal_service import static_severity_for_category

    severity_class = static_severity_for_category(category).lower()
    return {
        "severity_class": severity_class,
        "confidence_score": 0.0,
        "reasoning": (
            "Image-based severity analysis was unavailable; this level uses the "
            f"category-based fallback for '{category or 'unknown'}'."
        ),
        "urgency_flag": severity_class in {"high", "critical"},
    }


def classify_image_severity(
    image_url: str,
    category: str,
    description: str,
) -> Dict[str, Any]:
    """Classify issue severity from the report image, with a safe category fallback."""
    try:
        client = get_nvidia_client()
        if client is None:
            return _static_fallback(category)

        model_image = _image_input(image_url)
        prompt = f"""Assess the severity of the civic issue shown in the attached image.
Judge the visible damage, extent, and immediate risk from the image itself. Use the
category and citizen description only as context; do not assign severity from the
category alone. A high or critical assessment must set urgency_flag to true.

Category: {category or 'unspecified'}
Citizen description: {description or 'No description provided'}

Return only one JSON object with exactly these fields:
{{"severity_class":"medium","confidence_score":0.75,"reasoning":"One or two plain-language sentences grounded in visible evidence.","urgency_flag":false}}
severity_class must be one of: low, medium, high, critical.
"""
        completion = client.chat.completions.create(
            model=VISION_MODEL,
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
            max_tokens=256,
        )
        content = completion.choices[0].message.content
        return _parse_response(content)
    except Exception as error:
        error_type = f"{type(error).__module__}.{type(error).__name__}"
        print(f"[Image Severity Notice] Using category fallback ({error_type}): {error!r}")
        try:
            return _static_fallback(category)
        except Exception as fallback_error:
            print(f"[Image Severity Fallback Error] {fallback_error}")
            return {
                "severity_class": "low",
                "confidence_score": 0.0,
                "reasoning": "Image severity analysis was unavailable; manual review is recommended.",
                "urgency_flag": False,
            }