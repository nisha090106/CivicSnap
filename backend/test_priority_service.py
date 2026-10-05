import os
import sys
from datetime import datetime, timezone
from types import SimpleNamespace

import pytest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import models
from services import priority_service


@pytest.mark.parametrize(
    ("votes", "expected"),
    [
        (0, "lowest"),
        (1, "lowest"),
        (2, "low"),
        (3, "low"),
        (4, "medium"),
        (5, "medium"),
        (6, "high"),
        (7, "high"),
        (8, "highest"),
        (15, "highest"),
    ],
)
def test_vote_tier_boundaries(votes, expected):
    assert priority_service.classify_priority(votes) == expected


@pytest.mark.parametrize(
    ("severity", "expected"),
    [
        ("Critical", "medium"),
        ("High", "low"),
        ("Low", "lowest"),
        (None, "lowest"),
    ],
)
def test_severity_floor_for_zero_votes(severity, expected):
    assert priority_service.classify_priority(0, severity) == expected


@pytest.mark.parametrize("severity", ["Critical", "High"])
def test_category_fallback_severity_does_not_apply_priority_floor(severity):
    assert priority_service.classify_priority(
        0,
        severity,
        severity_source="category_fallback",
    ) == "lowest"


def test_critical_with_high_vote_count_stays_highest():
    assert priority_service.classify_priority(8, "Critical") == "highest"


def test_vote_tiers_can_be_overridden_by_environment(monkeypatch):
    monkeypatch.setenv("PRIORITY_TIER_LOW", "3")
    monkeypatch.setenv("PRIORITY_TIER_MEDIUM", "5")
    monkeypatch.setenv("PRIORITY_TIER_HIGH", "7")
    monkeypatch.setenv("PRIORITY_TIER_HIGHEST", "9")

    assert priority_service.classify_priority(2) == "lowest"
    assert priority_service.classify_priority(3) == "low"
    assert priority_service.classify_priority(9) == "highest"


def test_invalid_vote_tier_configuration_is_reported(monkeypatch):
    monkeypatch.setenv("PRIORITY_TIER_MEDIUM", "2")

    with pytest.raises(ValueError, match="strictly increasing"):
        priority_service.classify_priority(0)


class FakeVoteQuery:
    def __init__(self, vote_count):
        self.vote_count = vote_count

    def filter(self, *_criteria):
        return self

    def scalar(self):
        return self.vote_count


class FakePriorityDatabase:
    def __init__(self, cluster, report, vote_count):
        self.cluster = cluster
        self.report = report
        self.vote_count = vote_count

    def get(self, model, _identity):
        if model is models.ReportCluster:
            return self.cluster
        if model is models.Report:
            return self.report
        return None

    def query(self, *_args):
        return FakeVoteQuery(self.vote_count)


def test_score_and_breakdown_keep_explainability_fields():
    report = SimpleNamespace(
        severity_level="Critical",
        ai_severity_confidence=None,
        ai_severity_source="category_fallback",
    )
    cluster = SimpleNamespace(
        cluster_id="cluster-id",
        canonical_report_id="report-id",
        created_at=datetime.now(timezone.utc),
    )
    db = FakePriorityDatabase(cluster, report, vote_count=0)

    score, priority_class, breakdown, version = priority_service.compute_priority_score(
        cluster.cluster_id, db
    )

    assert score == 0.2
    assert priority_class == "lowest"
    assert breakdown["vote_class"] == "lowest"
    assert breakdown["severity_floor_class"] is None
    assert breakdown["final_class"] == "lowest"
    assert breakdown["class_decided_by"] == "votes"
    assert breakdown["weights"] == priority_service.WEIGHTS
    assert version == "civicsnap-priority-v2-demo-tiers"
