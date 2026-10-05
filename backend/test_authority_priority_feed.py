import os
import sys
import uuid
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from fastapi import HTTPException

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import main
import models


DEPARTMENTS = (
    "Road & Transport",
    "Garbage & Waste Management",
    "Food & Drug Authority",
    "Forest Department",
    "Municipal Corporation",
    "Nagar Panchayat",
    "Gram Panchayat",
)


class FakeQuery:
    def __init__(self, model, reports, clusters):
        self.model = model
        self.rows = reports if model is models.Report else clusters

    def filter(self, *criteria):
        if self.model is models.Report:
            for criterion in criteria:
                department = criterion.right.value
                self.rows = [
                    row for row in self.rows
                    if row.department.strip().lower() == department
                ]
        elif self.model is models.ReportCluster:
            cluster_ids = next(iter(criteria)).right.value
            self.rows = [row for row in self.rows if row.cluster_id in cluster_ids]
        return self

    def order_by(self, *_args):
        return self

    def group_by(self, *_args):
        return self

    def all(self):
        return self.rows


class FakeDatabase:
    def __init__(self, reports, clusters):
        self.reports = reports
        self.clusters = clusters

    def query(self, model, *_columns):
        if model is models.ReportClusterMember.cluster_id:
            return FakeQuery(model, [], [])
        return FakeQuery(model, self.reports, self.clusters)


@pytest.mark.parametrize("department", DEPARTMENTS)
def test_authority_priority_fields_are_scoped_for_every_department(department):
    report_id = uuid.uuid4()
    cluster_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    reports = [
        SimpleNamespace(
            report_id=report_id if other_department == department else uuid.uuid4(),
            cluster_id=cluster_id if other_department == department else uuid.uuid4(),
            department=other_department,
            category="Test",
            description="test",
            status="pending",
            latitude=1.0,
            longitude=2.0,
            image_url=None,
            city_name="Test City",
            soap_transcript=None,
            complaint_report=None,
            critic_verdict=None,
            email_status="pending",
            severity_level="High",
            ai_severity_confidence=0.9,
            ai_severity_reasoning="Test evidence",
            urgency_flagged=True,
            urgency_notified_at=None,
            created_at=now,
            vote_count=0,
        )
        for other_department in DEPARTMENTS
    ]
    priority_breakdown = {"unique_upvotes": 2, "severity_factor": 0.75}
    clusters = [
        SimpleNamespace(
            cluster_id=cluster_id,
            priority_class="high",
            priority_score=0.6,
            priority_score_breakdown=priority_breakdown,
        )
    ]
    db = FakeDatabase(reports, clusters)

    with patch.object(main, "compute_priority_score", return_value=(
        0.6, "high", priority_breakdown, "test-version"
    )), patch.object(main, "get_presigned_image_url", return_value=None):
        response = main.get_authority_reports(
            db=db,
            user={"department": department, "isApproved": True},
        )

    assert response["department"] == department
    assert response["count"] == 1
    assert response["reports"][0]["department"] == department
    assert response["reports"][0]["priority_score"] == 0.6
    assert response["reports"][0]["priority_class"] == "high"
    assert response["reports"][0]["score_breakdown"] == priority_breakdown
    assert response["reports"][0]["ai_severity_source"] == "ai"


def test_authority_priority_feed_rejects_missing_department():
    with pytest.raises(HTTPException) as error:
        main.get_authority_reports(db=FakeDatabase([], []), user={"isApproved": True})

    assert error.value.status_code == 403


def test_authority_priority_feed_returns_empty_reports_for_empty_department():
    response = main.get_authority_reports(
        db=FakeDatabase([], []),
        user={"department": "Gram Panchayat", "isApproved": True},
    )

    assert response["count"] == 0
    assert response["reports"] == []


def test_fallback_severity_is_not_normalized_as_urgent_ai():
    result = main._normalize_severity_result({
        "severity_class": "high",
        "confidence_score": 0.0,
        "reasoning": "Category fallback.",
        "urgency_flag": True,
        "source": "category_fallback",
    })

    assert result["source"] == "category_fallback"
    assert result["urgency_flag"] is False
