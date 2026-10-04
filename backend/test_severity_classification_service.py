import json
import tempfile
import unittest
from types import SimpleNamespace
from pathlib import Path
from unittest.mock import patch

from services import severity_classification_service as severity_service
from services import report_generator_service
from services import multimodal_service


class SeverityClassificationTests(unittest.TestCase):
    def test_classify_image_severity_sends_image_to_vision_model(self):
        response = {
            "severity_class": "critical",
            "confidence_score": 0.91,
            "reasoning": "The image shows a live electrical wire down across a public walkway.",
            "urgency_flag": True,
        }

        class FakeCompletions:
            request = None

            def create(self, **kwargs):
                self.request = kwargs
                message = SimpleNamespace(content=json.dumps(response))
                return SimpleNamespace(choices=[SimpleNamespace(message=message)])

        completions = FakeCompletions()
        client = SimpleNamespace(chat=SimpleNamespace(completions=completions))
        with tempfile.TemporaryDirectory() as directory:
            image_path = Path(directory) / "evidence.png"
            image_path.write_bytes(b"test image bytes")
            with patch.object(severity_service, "get_nvidia_client", return_value=client):
                result = severity_service.classify_image_severity(
                    str(image_path), "electricity", "A wire is down near a footpath"
                )

        self.assertEqual(result, response)
        request_content = completions.request["messages"][0]["content"]
        self.assertEqual(completions.request["model"], severity_service.VISION_MODEL)
        self.assertEqual(request_content[1]["type"], "image_url")
        self.assertTrue(request_content[1]["image_url"]["url"].startswith("data:image/png;base64,"))

    def test_classify_image_severity_uses_static_fallback_without_client(self):
        with patch.object(severity_service, "get_nvidia_client", return_value=None):
            result = severity_service.classify_image_severity("/missing.png", "pothole", "")

        self.assertEqual(result["severity_class"], "high")
        self.assertEqual(result["confidence_score"], 0.0)
        self.assertTrue(result["urgency_flag"])
        self.assertIn("category-based fallback", result["reasoning"])

    def test_parse_response_validates_and_clamps_fields(self):
        result = severity_service._parse_response(
            '```json\n{"severity_class":"HIGH","confidence_score":1.4,'
            '"reasoning":"Major visible damage.","urgency_flag":false}\n```'
        )

        self.assertEqual(
            result,
            {
                "severity_class": "high",
                "confidence_score": 1.0,
                "reasoning": "Major visible damage.",
                "urgency_flag": True,
            },
        )

    def test_malformed_model_response_uses_category_fallback(self):
        message = SimpleNamespace(content="severity is high, but no JSON was returned")
        completion = SimpleNamespace(choices=[SimpleNamespace(message=message)])
        client = SimpleNamespace(
            chat=SimpleNamespace(
                completions=SimpleNamespace(create=lambda **kwargs: completion)
            )
        )
        with patch.object(severity_service, "get_nvidia_client", return_value=client):
            result = severity_service.classify_image_severity(
                "data:image/jpeg;base64,dGVzdA==", "water", ""
            )

        self.assertEqual(result["severity_class"], "high")
        self.assertIn("category-based fallback", result["reasoning"])

    def test_soap_keeps_legacy_static_severity(self):
        soap_data = multimodal_service.analyze_and_generate_soap_transcript(
            image_url="unused-image.jpg",
            category="pothole",
            lat=19.0,
            lng=72.8,
            user_notes="Large road hazard",
        )

        self.assertEqual(soap_data["severity"], "High")
        self.assertNotIn("AI severity assessment", soap_data["soap_transcript"])

    def test_letter_prompt_uses_classified_severity_and_reasoning(self):
        severity_result = {
            "severity_class": "critical",
            "confidence_score": 0.94,
            "reasoning": "The image shows a collapsed road surface spanning a traffic lane.",
            "urgency_flag": True,
        }
        soap_data = {
            "city_name": "Mumbai",
            "taluka_name": "Mumbai City",
            "department": "Road & Transport",
            "category": "Road & Pothole",
            "soap_structure": {
                "S": "Citizen reported road damage.",
                "O": "Road surface damage observed.",
                "A": "Severity: High. Static category severity.",
                "P": "Dispatch a repair team.",
            },
        }

        class FakeCompletions:
            request = None

            def create(self, **kwargs):
                self.request = kwargs
                message = SimpleNamespace(content="Generated complaint letter")
                return SimpleNamespace(choices=[SimpleNamespace(message=message)])

        completions = FakeCompletions()
        client = SimpleNamespace(chat=SimpleNamespace(completions=completions))
        with patch.object(report_generator_service, "get_nvidia_client", return_value=client):
            report_generator_service.generate_llm_formal_letter_nvidia(
                soap_data, language="en", severity_result=severity_result
            )

        prompt = completions.request["messages"][0]["content"]
        self.assertIn("severity as 'Critical'", prompt)
        self.assertIn(severity_result["reasoning"], prompt)
        self.assertIn("do not substitute a category-based severity", prompt)

    def test_template_letter_includes_classified_severity_reasoning(self):
        letter = report_generator_service.generate_formal_letter(
            {
                "city_name": "Mumbai",
                "taluka_name": "Mumbai City",
                "department": "Road & Transport",
                "category": "Road & Pothole",
                "soap_structure": {},
            },
            severity_result={
                "severity_class": "critical",
                "reasoning": "The image shows a collapsed road surface.",
            },
        )

        self.assertIn("Severity is Critical", letter)
        self.assertIn("The image shows a collapsed road surface.", letter)


if __name__ == "__main__":
    unittest.main()
