import math
import os
import re
from datetime import datetime, timedelta, timezone
from difflib import SequenceMatcher

from sqlalchemy.orm import Session

import models


CATEGORY_ALIASES = {
    "road damage": "Road / Pothole",
    "pothole": "Road / Pothole",
    "road / pothole": "Road / Pothole",
    "waste": "Waste / Garbage",
    "garbage": "Waste / Garbage",
    "waste / garbage": "Waste / Garbage",
    "water": "Water Leakage",
    "water leakage": "Water Leakage",
    "street light": "Street Light / Electrical",
    "electrical": "Street Light / Electrical",
    "street light / electrical": "Street Light / Electrical",
    "food": "Food / Sanitation",
    "food / sanitation": "Food / Sanitation",
    "forest": "Forest / Wildlife",
    "wildlife": "Forest / Wildlife",
    "forest / wildlife": "Forest / Wildlife",
}


def _float_setting(name, default):
    try:
        return float(os.getenv(name, default))
    except (TypeError, ValueError):
        return float(default)


def _int_setting(name, default):
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        return int(default)


def _settings():
    return {
        "radius_meters": _float_setting("DEDUP_RADIUS_METERS", 50),
        "confidence_threshold": _float_setting("DEDUP_CONFIDENCE_THRESHOLD", 0.85),
        "time_window_hours": _int_setting("DEDUP_TIME_WINDOW_HOURS", 168),
        "resolved_grace_hours": _int_setting("DEDUP_RESOLVED_GRACE_HOURS", 24),
    }


def _normalized_text(value):
    return re.sub(r"[^a-z0-9 ]+", " ", (value or "").lower()).strip()


def normalize_report(report):
    """Return controlled category and normalized reason/description text."""
    category = (getattr(report, "category", None) or "").strip().lower()
    normalized_category = CATEGORY_ALIASES.get(category, category.title() if category else "Unknown")
    reason = getattr(report, "reason", None) or getattr(report, "description", None) or ""
    return {
        "category": normalized_category,
        "text": _normalized_text(reason),
    }


def _distance_meters(latitude_one, longitude_one, latitude_two, longitude_two):
    earth_radius_meters = 6371000
    lat_one = math.radians(latitude_one)
    lat_two = math.radians(latitude_two)
    delta_lat = math.radians(latitude_two - latitude_one)
    delta_lng = math.radians(longitude_two - longitude_one)
    haversine = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat_one) * math.cos(lat_two) * math.sin(delta_lng / 2) ** 2
    )
    return 2 * earth_radius_meters * math.asin(math.sqrt(haversine))


def _time_compatible(report, candidate, settings):
    report_created = getattr(report, "created_at", None)
    candidate_created = getattr(candidate, "created_at", None)
    if not report_created or not candidate_created:
        return True
    if abs(report_created - candidate_created) > timedelta(hours=settings["time_window_hours"]):
        return False
    candidate_status = (getattr(candidate, "status", None) or "").lower()
    if candidate_status in {"resolved", "closed"}:
        resolved_cutoff = datetime.now(timezone.utc) - timedelta(hours=settings["resolved_grace_hours"])
        if candidate_created < resolved_cutoff:
            return False
    return True


def find_candidate_matches(db: Session, report):
    """Find nearby, category-compatible, temporally relevant reports."""
    settings = _settings()
    latitude = getattr(report, "latitude", None)
    longitude = getattr(report, "longitude", None)
    if latitude is None or longitude is None:
        return []

    latitude_delta = settings["radius_meters"] / 111000
    longitude_delta = settings["radius_meters"] / (111000 * max(abs(math.cos(math.radians(latitude))), 0.01))
    normalized_category = normalize_report(report)["category"]
    minimum_created_at = getattr(report, "created_at", None)
    if minimum_created_at:
        minimum_created_at -= timedelta(hours=settings["time_window_hours"])

    query = db.query(models.Report).filter(
        models.Report.report_id != report.report_id,
        models.Report.latitude.between(latitude - latitude_delta, latitude + latitude_delta),
        models.Report.longitude.between(longitude - longitude_delta, longitude + longitude_delta),
    )
    if minimum_created_at:
        query = query.filter(models.Report.created_at >= minimum_created_at)

    candidates = []
    for candidate in query.all():
        if normalize_report(candidate)["category"] != normalized_category:
            continue
        if not _time_compatible(report, candidate, settings):
            continue
        if _distance_meters(latitude, longitude, candidate.latitude, candidate.longitude) <= settings["radius_meters"]:
            candidates.append(candidate)
    return candidates


def score_match(report, candidate):
    """Return confidence and explainable location/category/text matches."""
    settings = _settings()
    if report.latitude is None or report.longitude is None or candidate.latitude is None or candidate.longitude is None:
        return 0.0, {"location_distance_meters": None, "category_match": False, "text_similarity": 0.0, "time_compatible": False}

    distance = _distance_meters(report.latitude, report.longitude, candidate.latitude, candidate.longitude)
    category_match = normalize_report(report)["category"] == normalize_report(candidate)["category"]
    report_text = normalize_report(report)["text"]
    candidate_text = normalize_report(candidate)["text"]
    text_similarity = SequenceMatcher(None, report_text, candidate_text).ratio() if report_text and candidate_text else 0.0
    time_compatible = _time_compatible(report, candidate, settings)
    location_score = max(0.0, 1.0 - distance / settings["radius_meters"])
    confidence = (location_score * 0.5) + (float(category_match) * 0.3) + (text_similarity * 0.2)
    if not time_compatible:
        confidence = 0.0

    return round(confidence, 4), {
        "location_distance_meters": round(distance, 2),
        "category_match": category_match,
        "text_similarity": round(text_similarity, 4),
        "time_compatible": time_compatible,
    }


def suggest_merge(db: Session, report):
    """Write a deduplication suggestion to audit_log without mutating the report."""
    settings = _settings()
    suggestions = []
    for candidate in find_candidate_matches(db, report):
        confidence, matched_fields = score_match(report, candidate)
        candidate_cluster_id = candidate.cluster_id or candidate.report_id
        decision = "auto_merge_candidate" if confidence >= settings["confidence_threshold"] else "needs_review"
        audit_entry = models.AuditLog(
            entity_type="report_cluster",
            entity_id=candidate_cluster_id,
            action="deduplication_suggestion",
            actor_id="deduplication_service",
            details={
                "source_report_id": str(report.report_id),
                "candidate_cluster_id": str(candidate_cluster_id),
                "confidence_score": confidence,
                "matched_fields": matched_fields,
                "decision": decision,
                "shadow_mode": True,
            },
        )
        db.add(audit_entry)
        suggestions.append({"candidate_cluster_id": str(candidate_cluster_id), "confidence_score": confidence, "decision": decision})

    if suggestions:
        db.commit()
    return suggestions
