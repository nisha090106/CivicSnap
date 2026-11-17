import base64
import os
import unittest
from unittest.mock import Mock, patch

import httpx
from fastapi import HTTPException

from services import supabase_storage


class SupabaseStorageTests(unittest.TestCase):
    def setUp(self):
        self.environment = patch.dict(
            os.environ,
            {
                "SUPABASE_URL": "https://example.supabase.co",
                "SUPABASE_SERVICE_ROLE_KEY": "test-service-key",
                "SUPABASE_STORAGE_BUCKET": "report-images",
            },
            clear=False,
        )
        self.environment.start()
        self.addCleanup(self.environment.stop)

    def test_upload_saves_valid_image_to_report_scoped_storage_path(self):
        response = Mock()
        response.raise_for_status.return_value = None
        image_data = "data:image/png;base64," + base64.b64encode(b"test-image").decode("ascii")

        with patch.object(supabase_storage.httpx, "post", return_value=response) as post:
            stored_path = supabase_storage.upload_report_evidence(image_data, "report-123")

        self.assertTrue(stored_path.startswith("supabase://report-images/reports/report-123/"))
        self.assertTrue(stored_path.endswith(".png"))
        self.assertEqual(post.call_args.kwargs["content"], b"test-image")
        self.assertEqual(post.call_args.kwargs["headers"]["Content-Type"], "image/png")
        self.assertEqual(post.call_args.kwargs["headers"]["Authorization"], "Bearer test-service-key")
        self.assertEqual(post.call_args.kwargs["headers"]["apikey"], "test-service-key")

    def test_upload_logs_supabase_error_details_but_returns_clean_error(self):
        response = httpx.Response(
            status_code=400,
            json={"error": "Bucket not found", "details": "No report-images bucket exists"},
            request=httpx.Request("POST", "https://example.supabase.co/storage/v1/object/report-images/photo.png"),
        )
        image_data = "data:image/png;base64," + base64.b64encode(b"test-image").decode("ascii")

        with (
            patch.object(supabase_storage.httpx, "post", return_value=response),
            self.assertLogs(supabase_storage.logger, level="ERROR") as captured,
        ):
            with self.assertRaises(HTTPException) as error:
                supabase_storage.upload_report_evidence(image_data, "report-123")

        self.assertEqual(error.exception.status_code, 502)
        self.assertEqual(error.exception.detail, "The photo could not be uploaded. Please try again.")
        self.assertIn("status_code=400", captured.output[0])
        self.assertIn("Bucket not found", captured.output[0])
        self.assertIn("No report-images bucket exists", captured.output[0])
        self.assertNotIn("test-service-key", captured.output[0])

    def test_upload_rejects_unsupported_photo_types(self):
        with self.assertRaises(HTTPException) as error:
            supabase_storage.upload_report_evidence("data:image/gif;base64,Z2lm", "report-123")

        self.assertEqual(error.exception.status_code, 415)

    def test_upload_rejects_photos_over_ten_megabytes(self):
        oversized_data = "data:image/jpeg;base64," + ("a" * (((supabase_storage.MAX_IMAGE_BYTES + 2) // 3) * 4 + 4))

        with self.assertRaises(HTTPException) as error:
            supabase_storage.upload_report_evidence(oversized_data, "report-123")

        self.assertEqual(error.exception.status_code, 413)

    def test_upload_reports_missing_storage_configuration(self):
        with patch.dict(os.environ, {"SUPABASE_URL": "", "SUPABASE_SERVICE_ROLE_KEY": ""}):
            with self.assertRaises(HTTPException) as error:
                supabase_storage.upload_report_evidence(
                    "data:image/jpeg;base64," + base64.b64encode(b"photo").decode("ascii"),
                    "report-123",
                )

        self.assertEqual(error.exception.status_code, 503)

    def test_signed_url_uses_supabase_storage_signing_endpoint(self):
        response = Mock()
        response.raise_for_status.return_value = None
        response.json.return_value = {"signedURL": "/object/sign/report-images/reports/report-123/photo.jpg?token=abc"}

        with patch.object(supabase_storage.httpx, "post", return_value=response) as post:
            image_url = supabase_storage.get_report_evidence_url(
                "supabase://report-images/reports/report-123/photo.jpg"
            )

        self.assertEqual(
            image_url,
            "https://example.supabase.co/storage/v1/object/sign/report-images/reports/report-123/photo.jpg?token=abc",
        )
        self.assertEqual(post.call_args.kwargs["json"], {"expiresIn": 3600})

    def test_missing_url_scheme_is_normalized_to_https(self):
        with patch.dict(os.environ, {"SUPABASE_URL": "example.supabase.co"}):
            base_url, _service_key, bucket = supabase_storage._storage_settings()

        self.assertEqual(base_url, "https://example.supabase.co")
        self.assertEqual(bucket, "report-images")

    def test_invalid_supabase_url_fails_with_actionable_configuration_error(self):
        with patch.dict(os.environ, {"SUPABASE_URL": "not a url"}):
            with self.assertRaises(HTTPException) as error:
                supabase_storage._storage_settings()

        self.assertEqual(error.exception.status_code, 503)


if __name__ == "__main__":
    unittest.main()
