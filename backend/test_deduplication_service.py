import sys
import os
import uuid
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.deduplication_service import score_match


NOW = datetime.now(timezone.utc)


def report(category, latitude, longitude, description, status="pending", created_at=NOW):
    return SimpleNamespace(
        report_id=uuid.uuid4(),
        category=category,
        latitude=latitude,
        longitude=longitude,
        description=description,
        status=status,
        created_at=created_at,
        cluster_id=None,
    )


def test_score_match_clear_nearby_match():
    source = report("Pothole", 18.520400, 73.856700, "large pothole near school")
    candidate = report("Road / Pothole", 18.520450, 73.856720, "large pothole near school")

    confidence, matched_fields = score_match(source, candidate)

    assert confidence > 0.85
    assert matched_fields["category_match"] is True
    assert matched_fields["time_compatible"] is True
    assert matched_fields["location_distance_meters"] < 10


def test_score_match_nearby_different_category_is_not_clear_match():
    source = report("Pothole", 18.520400, 73.856700, "large pothole")
    candidate = report("Garbage", 18.520401, 73.856701, "overflowing waste")

    confidence, matched_fields = score_match(source, candidate)

    assert matched_fields["category_match"] is False
    assert confidence < 0.85


def test_score_match_resolved_long_ago_is_rejected():
    source = report("Pothole", 18.520400, 73.856700, "large pothole")
    candidate = report(
        "Road / Pothole",
        18.520401,
        73.856701,
        "large pothole",
        status="resolved",
        created_at=NOW - timedelta(days=14),
    )

    confidence, matched_fields = score_match(source, candidate)

    assert confidence == 0.0
    assert matched_fields["time_compatible"] is False
