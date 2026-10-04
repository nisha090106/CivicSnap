import os
import sys
import uuid
from datetime import datetime, timezone

import jwt
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import main
import models
from auth import JWT_SECRET
from database import SessionLocal


pytestmark = pytest.mark.skipif(
    os.getenv("RUN_DEDUP_INTEGRATION") != "1",
    reason="Set RUN_DEDUP_INTEGRATION=1 to run against the configured database",
)


def test_submit_reports_and_review_shadow_suggestions(monkeypatch):
    created_report_ids = []

    monkeypatch.setattr(main, "save_report_image", lambda image_data: "/static/test.jpg")
    monkeypatch.setattr(main, "analyze_and_generate_soap_transcript", lambda **kwargs: {
        "category": kwargs["category"],
        "department": "Municipal Corporation",
        "city_name": "Pune",
        "taluka_name": "Haveli",
        "district_name": "Pune",
        "state_name": "Maharashtra",
        "soap_transcript": "test transcript",
        "severity": "Medium",
    })
    monkeypatch.setattr(main, "draft_official_email", lambda *args, **kwargs: {
        "contact_email": "test@example.com",
        "subject": "Test report",
        "body": "Test report",
    })
    monkeypatch.setattr(main, "anti_hallucination_critic", lambda *args, **kwargs: {
        "verified_subject": "Test report",
        "verified_body": "Test report",
        "verdict": "PASSED",
    })
    monkeypatch.setattr(main, "dispatch_email_worker", lambda **kwargs: {
        "status": "queued",
        "email_id": None,
    })
    monkeypatch.setattr(main, "cleanup_expired_storage", lambda: None)

    client = TestClient(main.app)
    reports = [
        {"category": "Pothole", "latitude": 18.520400, "longitude": 73.856700, "description": "large pothole near school"},
        {"category": "Road / Pothole", "latitude": 18.520450, "longitude": 73.856720, "description": "large pothole near school"},
        {"category": "Pothole", "latitude": 18.520430, "longitude": 73.856710, "description": "large pothole near school"},
        {"category": "Garbage", "latitude": 19.076000, "longitude": 72.877700, "description": "overflowing waste container"},
    ]

    try:
        for report in reports:
            response = client.post("/api/reports/submit", json=report)
            assert response.status_code == 200, response.text
            created_report_ids.append(uuid.UUID(response.json()["report_id"]))

        token = jwt.encode(
            {"id": "integration-authority", "role": "authority", "isApproved": True},
            JWT_SECRET,
            algorithm="HS256",
        )
        response = client.get(
            "/api/reports/dedup-suggestions",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200, response.text

        suggestions = response.json()["suggestions"]
        source_ids = {item["source_report_id"] for item in suggestions}
        near_duplicate_ids = {str(report_id) for report_id in created_report_ids[1:3]}
        unrelated_id = str(created_report_ids[3])
        matching_suggestions = [item for item in suggestions if item["source_report_id"] in near_duplicate_ids]

        assert matching_suggestions
        assert all(item["confidence_score"] is not None for item in matching_suggestions)
        assert all(item["decision"] in {"auto_merge_candidate", "needs_review"} for item in matching_suggestions)
        assert unrelated_id not in source_ids
        assert max(item["confidence_score"] for item in matching_suggestions) > 0

        db = SessionLocal()
        try:
            assert all(db.get(models.Report, report_id).cluster_id is None for report_id in created_report_ids)
        finally:
            db.close()
    finally:
        db = SessionLocal()
        try:
            audit_entries = db.query(models.AuditLog).all()
            for entry in audit_entries:
                details = entry.details or {}
                if details.get("source_report_id") in {str(report_id) for report_id in created_report_ids}:
                    db.delete(entry)
            for report_id in created_report_ids:
                report = db.get(models.Report, report_id)
                if report:
                    db.delete(report)
            db.commit()
        finally:
            db.close()
