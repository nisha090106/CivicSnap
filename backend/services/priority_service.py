import math
import os
from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

import models


SCORE_VERSION = "civicsnap-priority-v2-demo-tiers"
WEIGHTS = {
    "civic_support": 0.50,
    "external_support": 0.20,
    "severity_factor": 0.20,
    "age_factor": 0.10,
}
SEVERITY_FACTORS = {
    "low": 0.25,
    "medium": 0.50,
    "high": 0.75,
    "critical": 1.00,
}
AGE_PLATEAU_DAYS = 7
DEFAULT_VOTE_TIERS = {
    "low": 2,
    "medium": 4,
    "high": 6,
    "highest": 8,
}
CLASS_RANKS = {
    "lowest": 0,
    "low": 1,
    "medium": 2,
    "high": 3,
    "highest": 4,
}
SEVERITY_FLOORS = {
    "high": "low",
    "critical": "medium",
}


def _float_setting(name, default):
    try:
        return float(os.getenv(name, default))
    except (TypeError, ValueError):
        return float(default)


def _vote_tiers():
    tiers = {}
    for priority_class, default in DEFAULT_VOTE_TIERS.items():
        setting = f"PRIORITY_TIER_{priority_class.upper()}"
        try:
            tiers[priority_class] = int(os.getenv(setting, default))
        except (TypeError, ValueError) as error:
            raise ValueError(f"{setting} must be a non-negative integer") from error

    values = [tiers[name] for name in ("low", "medium", "high", "highest")]
    if any(value < 0 for value in values) or values != sorted(set(values)):
        raise ValueError("Priority vote tiers must be strictly increasing non-negative integers")
    return tiers


def capped_log(value, cap=None):
    """Normalize logarithmic support to 0..1, saturating at the configured cap."""
    cap = cap if cap is not None else _float_setting("PRIORITY_SUPPORT_LOG_CAP", 100)
    if cap <= 1:
        raise ValueError("Logarithmic support cap must be greater than 1")
    bounded_value = min(max(float(value), 1.0), cap)
    return math.log(bounded_value) / math.log(cap)


def _unique_vote_count(cluster_id, db: Session):
    return int(
        db.query(func.count(models.Vote.vote_id))
        .filter(models.Vote.cluster_id == cluster_id)
        .scalar()
        or 0
    )


def compute_civic_support(cluster_id, db: Session):
    """Count unique cluster votes and apply capped logarithmic scaling."""
    return capped_log(1 + _unique_vote_count(cluster_id, db))


def compute_severity_factor(cluster, db: Session = None):
    """Map canonical report severity to 0..1, weighting it by AI confidence when present."""
    report = getattr(cluster, "canonical_report", None)
    if report is None and db is not None and cluster.canonical_report_id:
        report = db.get(models.Report, cluster.canonical_report_id)
    if report is None:
        return SEVERITY_FACTORS["medium"]

    severity = (report.severity_level or "medium").strip().lower()
    base_factor = SEVERITY_FACTORS.get(severity, SEVERITY_FACTORS["medium"])
    confidence = report.ai_severity_confidence
    if confidence is None or confidence <= 0:
        return base_factor
    confidence = min(1.0, max(0.0, float(confidence)))
    return base_factor * confidence


def _age_hours(cluster, now=None):
    created_at = cluster.created_at
    if created_at is None:
        return 0.0
    now = now or datetime.now(timezone.utc)
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    return max(0.0, (now - created_at).total_seconds() / 3600)


def compute_age_factor(cluster):
    """Increase linearly with age, plateauing at 1 after seven days."""
    plateau_hours = AGE_PLATEAU_DAYS * 24
    return min(_age_hours(cluster) / plateau_hours, 1.0)


def _priority_class_details(vote_count, severity_level=None, severity_source="ai"):
    tiers = _vote_tiers()
    if vote_count >= tiers["highest"]:
        vote_class = "highest"
    elif vote_count >= tiers["high"]:
        vote_class = "high"
    elif vote_count >= tiers["medium"]:
        vote_class = "medium"
    elif vote_count >= tiers["low"]:
        vote_class = "low"
    else:
        vote_class = "lowest"

    normalized_severity = (
        severity_level.strip().lower()
        if isinstance(severity_level, str)
        else ""
    )
    severity_floor_class = (
        SEVERITY_FLOORS.get(normalized_severity)
        if severity_source == "ai"
        else None
    )
    if (
        severity_floor_class
        and CLASS_RANKS[severity_floor_class] > CLASS_RANKS[vote_class]
    ):
        final_class = severity_floor_class
        class_decided_by = "severity_floor"
    else:
        final_class = vote_class
        class_decided_by = "votes"

    return {
        "vote_class": vote_class,
        "severity_floor_class": severity_floor_class,
        "final_class": final_class,
        "class_decided_by": class_decided_by,
    }


def classify_priority(vote_count, severity_level=None, severity_source="ai"):
    """Classify unique votes into demo tiers, then apply the AI severity floor."""
    return _priority_class_details(
        vote_count,
        severity_level,
        severity_source,
    )["final_class"]


def compute_priority_score(cluster_id, db: Session):
    cluster = db.get(models.ReportCluster, cluster_id)
    if cluster is None:
        raise ValueError(f"Report cluster {cluster_id} was not found")

    unique_upvotes = _unique_vote_count(cluster.cluster_id, db)
    civic_support = capped_log(1 + unique_upvotes)
    external_support = 0.0
    canonical_report = db.get(models.Report, cluster.canonical_report_id) if cluster.canonical_report_id else None
    severity_factor = compute_severity_factor(cluster, db)
    severity_source = getattr(canonical_report, "ai_severity_source", None)
    if severity_source not in {"ai", "category_fallback"}:
        confidence = getattr(canonical_report, "ai_severity_confidence", None)
        severity_source = (
            "ai"
            if confidence is not None and confidence > 0
            else "category_fallback"
        ) if canonical_report else None
    age_hours = _age_hours(cluster)
    age_factor = min(age_hours / (AGE_PLATEAU_DAYS * 24), 1.0)

    score = (
        WEIGHTS["civic_support"] * civic_support
        + WEIGHTS["external_support"] * external_support
        + WEIGHTS["severity_factor"] * severity_factor
        + WEIGHTS["age_factor"] * age_factor
    )
    breakdown = {
        "unique_upvotes": unique_upvotes,
        "verified_x_engagement": 0,
        "civic_support": round(civic_support, 6),
        "external_support": external_support,
        "severity_level": canonical_report.severity_level if canonical_report else None,
        "ai_severity_confidence": canonical_report.ai_severity_confidence if canonical_report else None,
        "ai_severity_source": severity_source,
        "severity_factor": round(severity_factor, 6),
        "age_factor": round(age_factor, 6),
        "age_hours": round(age_hours, 2),
        "weights": WEIGHTS.copy(),
    }
    class_details = _priority_class_details(
        unique_upvotes,
        canonical_report.severity_level if canonical_report else None,
        severity_source,
    )
    breakdown.update(class_details)
    return round(score, 6), class_details["final_class"], breakdown, SCORE_VERSION


def recalculate_cluster_priority(cluster_id, db: Session):
    """Recompute and persist a cluster's score; repeated calls are idempotent."""
    try:
        cluster = db.get(models.ReportCluster, cluster_id)
        if cluster is None:
            raise ValueError(f"Report cluster {cluster_id} was not found")

        score, priority_class, breakdown, version = compute_priority_score(cluster_id, db)
        cluster.priority_score = score
        cluster.priority_class = priority_class
        cluster.score_version = version
        cluster.priority_score_breakdown = breakdown
        cluster.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(cluster)
        return cluster
    except Exception:
        db.rollback()
        raise