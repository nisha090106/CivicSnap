import os
import math
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from fastapi import FastAPI, HTTPException, status, Depends, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse, RedirectResponse, FileResponse
from botocore.config import Config

from database import engine, Base, SessionLocal, check_db_connection, get_db
from sqlalchemy.orm import Session
from sqlalchemy import cast, String, text, or_, func
from sqlalchemy.exc import IntegrityError
from auth import get_current_user, get_optional_user, require_citizen, require_authority
import models

from services.storage_service import save_report_image, calculate_ttl_expiration, cleanup_expired_storage, get_presigned_image_url
from services.multimodal_service import analyze_and_generate_soap_transcript
from services.report_generator_service import generate_llm_complaint_report
from services.email_service import draft_official_email, anti_hallucination_critic, dispatch_email_worker, send_status_update_notification_to_citizen
from services.classification_service import classify_multimodal_issue
from services.severity_classification_service import classify_image_severity
from services.deduplication_service import suggest_merge

FEATURE_AI_SEVERITY = os.getenv("FEATURE_AI_SEVERITY", "false").strip().lower() in {
    "1", "true", "yes", "on"
}

FEATURE_COMMUNITY_MAP = os.getenv("FEATURE_COMMUNITY_MAP", "false").strip().lower() in {
    "1", "true", "yes", "on"
}


def _run_shadow_deduplication(report_id):
    shadow_db = SessionLocal()
    try:
        report = shadow_db.get(models.Report, report_id)
        if report is not None:
            suggest_merge(shadow_db, report)
    except Exception as e:
        shadow_db.rollback()
        print(f"[Deduplication Shadow Error]: {e}")
    finally:
        shadow_db.close()


def _normalize_severity_result(severity_result):
    if not isinstance(severity_result, dict):
        return None

    severity_class = str(severity_result.get("severity_class", "")).strip().lower()
    if severity_class not in {"low", "medium", "high", "critical"}:
        return None

    try:
        confidence_score = float(severity_result.get("confidence_score"))
    except (TypeError, ValueError):
        return None
    if not math.isfinite(confidence_score):
        return None

    reasoning = severity_result.get("reasoning")
    urgency_flag = severity_result.get("urgency_flag")
    if not isinstance(reasoning, str) or not reasoning.strip() or not isinstance(urgency_flag, bool):
        return None

    return {
        "severity_class": severity_class,
        "confidence_score": min(1.0, max(0.0, confidence_score)),
        "reasoning": reasoning.strip(),
        "urgency_flag": urgency_flag or severity_class in {"high", "critical"},
    }


def _apply_severity_result_to_soap(soap_data, severity_result):
    severity_level = severity_result["severity_class"].title()
    soap_structure = soap_data["soap_structure"]
    old_assessment = soap_structure["A"]
    impact_marker = ". Municipal Impact:"
    _, marker_found, impact_details = old_assessment.partition(impact_marker)

    assessment = f"Severity: {severity_level}. AI visual assessment: {severity_result['reasoning']}."
    if marker_found:
        assessment += f"{impact_marker}{impact_details}"
    soap_structure["A"] = assessment

    soap_data["severity"] = severity_level
    soap_data["ai_severity_confidence"] = severity_result["confidence_score"]
    soap_data["ai_severity_reasoning"] = severity_result["reasoning"]
    soap_data["urgency_flag"] = severity_result["urgency_flag"]
    soap_data["soap_transcript"] = "\n".join(
        f"{key} ({label}): {soap_structure[key]}"
        for key, label in (("S", "Subjective"), ("O", "Objective"), ("A", "Assessment"), ("P", "Plan"))
    )

# Initialize database schema
try:
    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE reports ADD COLUMN IF NOT EXISTS email_id VARCHAR(255)"))
        connection.execute(text("ALTER TABLE reports ADD COLUMN IF NOT EXISTS citizen_email VARCHAR(255)"))
    print("Database tables initialized / verified successfully.")
except Exception as e:
    print(f"Database initialization notice: {e}")


app = FastAPI(
    title="CivicSnap Backend API",
    description="FastAPI microservice implementing full multi-modal civic reporting architecture",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads directory & static assets directory for serving evidence photos & default fallback images
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

class ClassifyReportRequest(BaseModel):
    image_data: Optional[str] = None
    description: Optional[str] = ""

class ReportSubmitRequest(BaseModel):
    image_data: Optional[str] = None
    category: Optional[str] = "auto"
    latitude: Optional[float] = 19.0760
    longitude: Optional[float] = 72.8777
    description: Optional[str] = ""
    disclose_identity: Optional[bool] = False
    citizen_name: Optional[str] = None
    citizen_email: Optional[str] = None
    language: Optional[str] = "en"
    complaint_report: Optional[str] = None
    severity_result: Optional[Dict[str, Any]] = None


class ReportPreviewRequest(BaseModel):
    image_data: Optional[str] = None
    category: Optional[str] = "auto"
    latitude: Optional[float] = 19.0760
    longitude: Optional[float] = 72.8777
    description: Optional[str] = ""
    disclose_identity: Optional[bool] = False
    citizen_name: Optional[str] = None
    language: Optional[str] = "en"
    severity_result: Optional[Dict[str, Any]] = None
    severity_only: Optional[bool] = False

class StatusUpdateRequest(BaseModel):
    status: str

@app.get("/")
def read_root():
    return {
        "service": "CivicSnap FastAPI Backend",
        "status": "online",
        "stage": "Stage 3 — Full Architecture (SOAP, Multi-modal, Routing & Email Critic)"
    }

@app.get("/health")
@app.get("/api/health")
def health_check():
    connected, message = check_db_connection()
    if not connected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"status": "unhealthy", "database": "disconnected", "error": message}
        )
    return {
        "status": "healthy",
        "database": "connected",
        "message": message,
        "service": "FastAPI Backend"
    }

@app.get("/api/me")
def get_user_profile(user: dict = Depends(get_current_user)):
    return {"authenticated": True, "user": user}

# 0. MULTI-MODAL MULTI-CLASS CLASSIFICATION ENDPOINT: POST /api/reports/classify
@app.post("/api/reports/classify")
def classify_civic_report(req: ClassifyReportRequest):
    """
    Multi-Modal Multi-Class Issue Classification & Authority Routing Endpoint.
    Analyzes visual image evidence & text description to auto-detect issue category & target authority.
    """
    try:
        return classify_multimodal_issue(
            image_data=req.image_data,
            description=req.description
        )
    except Exception as e:
        print(f"[Classification Endpoint Error]: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Classification failed: {str(e)}"
        )

# 1. LIVE MULTI-LINGUAL PREVIEW ENDPOINT: POST /api/reports/preview
@app.post("/api/reports/preview")
def preview_civic_report(
    req: ReportPreviewRequest,
    user: Optional[dict] = Depends(get_optional_user)
):
    """
    Generate instant Multi-lingual Formal Letter Preview before final report filing.
    """
    try:
        category_to_use = req.category
        if not category_to_use or category_to_use == "auto":
            class_res = classify_multimodal_issue(image_data=req.image_data, description=req.description)
            category_to_use = class_res.get("detected_category") or "pothole"

        soap_data = analyze_and_generate_soap_transcript(
            image_url="/static/default_issue.jpg",
            category=category_to_use,
            lat=req.latitude or 19.0760,
            lng=req.longitude or 72.8777,
            user_notes=req.description or ""
        )

        severity_result = _normalize_severity_result(req.severity_result)
        if severity_result is None:
            try:
                severity_result = _normalize_severity_result(classify_image_severity(
                    req.image_data or "/static/default_issue.jpg",
                    category_to_use,
                    req.description or ""
                ))
            except Exception as error:
                print(f"[Preview Image Severity Error] Using category fallback: {error}")

        if severity_result is None:
            fallback_severity = soap_data["severity"].lower()
            severity_result = {
                "severity_class": fallback_severity,
                "confidence_score": 0.0,
                "reasoning": "Image severity analysis was unavailable; category-based severity was used.",
                "urgency_flag": fallback_severity in {"high", "critical"},
            }

        if req.severity_only:
            return {
                "success": True,
                "severity_class": severity_result["severity_class"].title(),
                "confidence_score": round(severity_result["confidence_score"] * 100, 1),
                "reasoning": severity_result["reasoning"],
                "urgency_flag": severity_result["urgency_flag"],
                "severity_result": severity_result,
            }

        _apply_severity_result_to_soap(soap_data, severity_result)

        citizen_name = req.citizen_name or (user.get("name") if user else None) or "Anonymous Citizen"

        complaint_data = generate_llm_complaint_report(
            soap_data=soap_data,
            image_url="/static/default_issue.jpg",
            user_notes=req.description or "",
            disclose_identity=req.disclose_identity or False,
            citizen_name=citizen_name,
            language=req.language or "en",
            severity_result=severity_result
        )

        return {
            "success": True,
            "formal_letter": complaint_data["complaint_report"],
            "soap_transcript": soap_data["soap_transcript"],
            "authority_name": complaint_data["authority_name"],
            "header_notice": complaint_data["header_notice"],
            "city_name": soap_data["city_name"],
            "severity_class": severity_result["severity_class"].title(),
            "confidence_score": round(severity_result["confidence_score"] * 100, 1),
            "reasoning": severity_result["reasoning"],
            "urgency_flag": severity_result["urgency_flag"],
            "severity_result": severity_result,
            "language": req.language or "en",
            "disclose_identity": req.disclose_identity
        }
    except Exception as e:
        print(f"[Report Preview Error]: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report preview failed: {str(e)}"
        )

# 2. CORE ARCHITECTURE ENDPOINT: POST /api/reports/submit
@app.post("/api/reports/submit")
def submit_civic_report(
    req: ReportSubmitRequest,
    background_tasks: BackgroundTasks,
    user: Optional[dict] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Core Architecture Pipeline:
    1. AWS S3 Storage & 15-Day TTL Assignment
    2. Multi-modal Visual Classification & Geocoding
    3. SOAP Note Format Transcript Generator
    4. Multi-Lingual Formal Letter Complaint Generator
    5. Multi-Tier Authority Routing Engine
    6. Emailing Service (Drafting LLM -> Anti-Hallucination Critic -> Email Worker)
    """
    try:
        # Step 1: Save Image Evidence (AWS S3 with local TTL fallback)
        image_url = save_report_image(req.image_data)

        # Step 2 & 3: Multi-modal Visual Classification & SOAP Transcript Generation
        category_to_use = req.category
        if not category_to_use or category_to_use == "auto":
            class_res = classify_multimodal_issue(image_data=req.image_data, description=req.description)
            category_to_use = class_res.get("detected_category") or "pothole"

        soap_data = analyze_and_generate_soap_transcript(
            image_url=image_url,
            category=category_to_use,
            lat=req.latitude or 19.0760,
            lng=req.longitude or 72.8777,
            user_notes=req.description or ""
        )

        severity_result = _normalize_severity_result(req.severity_result)
        if severity_result is None and FEATURE_AI_SEVERITY:
            try:
                severity_result = _normalize_severity_result(classify_image_severity(
                    image_url,
                    category_to_use,
                    req.description or ""
                ))
            except Exception as error:
                print(f"[Image Severity Error] Using SOAP category fallback: {error}")

        if severity_result is not None:
            _apply_severity_result_to_soap(soap_data, severity_result)
            severity_level = severity_result["severity_class"].title()
            severity_confidence = severity_result["confidence_score"]
            severity_reasoning = severity_result["reasoning"]
            urgency_flagged = severity_result["urgency_flag"]
        else:
            severity_level = soap_data["severity"]
            severity_confidence = None
            severity_reasoning = None
            urgency_flagged = False

        citizen_name = req.citizen_name or (user.get("name") if user else None) or "Anonymous Citizen"
        citizen_email = req.citizen_email or (user.get("email") if user else None)

        # Step 4 & 5: Multi-Lingual Formal Letter Generation & Authority Routing
        # Re-use pre-generated letter from preview if provided by frontend to avoid double LLM calls
        if req.complaint_report and req.complaint_report.strip():
            print("[Report Submit] Re-using pre-generated complaint letter from preview cache (0-latency)")
            complaint_data = {
                "complaint_report": req.complaint_report.strip(),
                "authority_name": soap_data.get("department", "Municipal Authority"),
                "contact_email": os.getenv("TEST_EMAIL_OVERRIDE", "roadtransport@civicsnap.gov.in"),
                "header_notice": f"The Report is sent {'Disclosed as ' + citizen_name if req.disclose_identity else 'Anonymously'} via CivicSnap"
            }
        else:
            complaint_data = generate_llm_complaint_report(
                soap_data=soap_data,
                image_url=image_url,
                user_notes=req.description or "",
                disclose_identity=req.disclose_identity or False,
                citizen_name=citizen_name,
                language=req.language or "en",
                severity_result=severity_result
            )

        # Step 6: Emailing Subsystem Pipeline
        email_draft = draft_official_email(complaint_data, soap_data, image_url=get_presigned_image_url(image_url))
        critic_result = anti_hallucination_critic(email_draft, soap_data)

        # Async Email Dispatch Worker
        worker_res = dispatch_email_worker(
            target_email=complaint_data["contact_email"],
            subject=critic_result["verified_subject"],
            body=critic_result["verified_body"],
            critic_verdict=critic_result["verdict"]
        )

        # Trigger 15-day TTL storage cleanup in background
        background_tasks.add_task(cleanup_expired_storage)

        # Step 7: Create & Save Report Record in Supabase PostgreSQL
        new_report = models.Report(
            citizen_id=user.get("id") if user else None,
            citizen_email=citizen_email,
            image_url=image_url,
            category=soap_data["category"],
            latitude=req.latitude,
            longitude=req.longitude,
            description=req.description,
            department=soap_data["department"],
            status="pending",
            city_name=soap_data["city_name"],
            taluka_name=soap_data["taluka_name"],
            district_name=soap_data["district_name"],
            state_name=soap_data["state_name"],
            soap_transcript=soap_data["soap_transcript"],
            complaint_report=complaint_data["complaint_report"],
            severity_level=severity_level,
            ai_severity_confidence=severity_confidence,
            ai_severity_reasoning=severity_reasoning,
            urgency_flagged=urgency_flagged,
            ttl_expires_at=calculate_ttl_expiration(15),
            email_draft=critic_result["verified_body"],
            critic_verdict=critic_result["verdict"],
            email_status=worker_res["status"],
            email_id=worker_res.get("email_id"),
            email_sent_at=datetime.now(timezone.utc) if worker_res["status"] == "sent" else None
        )


        db.add(new_report)
        db.commit()
        db.refresh(new_report)

        if urgency_flagged:
            try:
                confidence_label = f"{severity_confidence:.0%}" if severity_confidence is not None else "unavailable"
                urgent_subject = (
                    f"[URGENT] CivicSnap {severity_level} severity "
                    f"{new_report.category} in {new_report.city_name}"
                )
                urgent_body = f"""Urgent civic issue notification for {complaint_data.get('authority_name', new_report.department)}.

Severity: {severity_level}
AI confidence: {confidence_label}
Reason: {severity_reasoning or 'Urgent issue requires prompt authority review.'}
Category: {new_report.category}
Department: {new_report.department}
Location: {new_report.city_name}, {new_report.taluka_name}, {new_report.district_name}
Citizen description: {req.description or 'No description provided'}
Evidence image: {get_presigned_image_url(image_url)}

Please prioritize review and dispatch an appropriate response."""
                urgent_worker_res = dispatch_email_worker(
                    target_email=complaint_data.get("contact_email"),
                    subject=urgent_subject,
                    body=urgent_body,
                    critic_verdict="Urgent AI severity notification; factual details copied from the report."
                )
                if urgent_worker_res.get("status") == "sent":
                    new_report.urgency_notified_at = datetime.now(timezone.utc)
                    db.commit()
                    db.refresh(new_report)
            except Exception as error:
                db.rollback()
                print(f"[Urgent Authority Notification Error]: {error}")

        background_tasks.add_task(_run_shadow_deduplication, new_report.report_id)

        return {
            "success": True,
            "message": "Report registered & routed to authority department",
            "report_id": str(new_report.report_id),
            "department": new_report.department,
            "authority_name": complaint_data["authority_name"],
            "city_name": new_report.city_name,
            "anonymous_disclaimer": complaint_data["header_notice"],
            "soap_transcript": new_report.soap_transcript,
            "critic_verdict": new_report.critic_verdict,
            "email_status": new_report.email_status,
            "email_id": new_report.email_id,
            "ttl_expires_at": new_report.ttl_expires_at.isoformat() if new_report.ttl_expires_at else None
        }
    except Exception as err:
        db.rollback()
        print(f"[Report Submission Error]: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report submission failed: {str(err)}"
        )

# 2. CITIZEN REPORTS FEED: GET /api/reports/citizen (STRICT CITIZEN ISOLATION)
@app.get("/api/reports/citizen")
def get_citizen_reports(
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(get_optional_user)
):
    try:
        if not user:
            return {"role": "citizen", "count": 0, "reports": []}

        user_id = user.get("id")
        user_email = user.get("email")

        filters = []
        if user_id:
            filters.append(models.Report.citizen_id == str(user_id))
        if user_email:
            filters.append(models.Report.citizen_email.ilike(user_email.strip()))

        if not filters:
            return {"role": "citizen", "count": 0, "reports": []}

        query = db.query(models.Report).filter(or_(*filters))
        reports = query.order_by(models.Report.created_at.desc()).all()
        
        return {
            "role": "citizen",
            "citizen_email": user_email,
            "count": len(reports),
            "reports": [
                {
                    "id": str(r.report_id),
                    "report_id": str(r.report_id),
                    "category": r.category,
                    "department": r.department,
                    "description": r.description,
                    "status": r.status or "Pending",
                    "latitude": r.latitude,
                    "longitude": r.longitude,
                    "image_url": get_presigned_image_url(r.image_url),
                    "city_name": r.city_name,
                    "soap_transcript": r.soap_transcript,
                    "complaint_report": r.complaint_report,
                    "critic_verdict": r.critic_verdict,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                    "vote_count": r.vote_count or 0
                }
                for r in reports
            ]
        }
    except Exception as e:
        print(f"[Citizen Reports Error]: {e}")
        return {"role": "citizen", "count": 0, "reports": []}

# 2B. PUBLIC ALL REPORTS FEED (FOR MAP & LIVE FEED): GET /api/reports/public
@app.get("/api/reports/public")
@app.get("/api/reports/all")
def get_public_all_reports(db: Session = Depends(get_db)):
    try:
        reports = db.query(models.Report).order_by(models.Report.created_at.desc()).all()
        return {
            "count": len(reports),
            "reports": [
                {
                    "id": str(r.report_id),
                    "report_id": str(r.report_id),
                    "category": r.category,
                    "department": r.department,
                    "description": r.description,
                    "status": r.status or "Pending",
                    "latitude": r.latitude,
                    "longitude": r.longitude,
                    "image_url": get_presigned_image_url(r.image_url),
                    "city_name": r.city_name,
                    "soap_transcript": r.soap_transcript,
                    "complaint_report": r.complaint_report,
                    "critic_verdict": r.critic_verdict,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                    "vote_count": r.vote_count or 0
                }
                for r in reports
            ]
        }
    except Exception as e:
        print(f"[Public Reports Error]: {e}")
        return {"count": 0, "reports": []}


def _community_map_enabled():
    if not FEATURE_COMMUNITY_MAP:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community map is disabled")


def _community_report_payload(report, cluster_id, upvote_count, include_description=False):
    payload = {
        "cluster_id": str(cluster_id),
        "category": report.category,
        "latitude": report.latitude,
        "longitude": report.longitude,
        "status": report.status or "Pending",
        "created_at": report.created_at.isoformat() if report.created_at else None,
        "upvote_count": upvote_count,
    }
    if include_description:
        payload["description"] = report.description
    return payload


def _community_reports_query(
    db: Session,
    category: Optional[str] = None,
    report_status: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: Optional[float] = None,
    include_description: bool = False,
):
    if any(value is not None for value in (lat, lng, radius_km)) and not all(
        value is not None for value in (lat, lng, radius_km)
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="lat, lng, and radius_km must be provided together",
        )

    reports = db.query(models.Report).order_by(models.Report.created_at.desc()).all()
    reports_by_id = {report.report_id: report for report in reports}
    grouped_reports = {}

    for report in reports:
        # Transitional fallback: until deduplication backfills cluster_id, expose
        # each raw report as a singleton cluster so the map remains populated.
        group_id = report.cluster_id or report.report_id
        grouped_reports.setdefault(group_id, []).append(report)

    cluster_ids = list({report.cluster_id for report in reports if report.cluster_id})
    clusters_by_id = {
        cluster.cluster_id: cluster
        for cluster in db.query(models.ReportCluster)
        .filter(models.ReportCluster.cluster_id.in_(cluster_ids))
        .all()
    } if cluster_ids else {}

    try:
        vote_counts = dict(
            db.query(models.Vote.cluster_id, func.count(models.Vote.vote_id))
            .group_by(models.Vote.cluster_id)
            .all()
        )
    except Exception as e:
        print(f"[Community Vote Count Notice]: {e}")
        vote_counts = {}
    results = []

    for group_id, group in grouped_reports.items():
        cluster = clusters_by_id.get(group_id)
        canonical_report = None
        if cluster and cluster.canonical_report_id:
            canonical_report = reports_by_id.get(cluster.canonical_report_id)
        canonical_report = canonical_report or group[0]

        if category and (canonical_report.category or "").lower() != category.lower():
            continue
        if report_status and (canonical_report.status or "Pending").lower() != report_status.lower():
            continue
        if canonical_report.latitude is None or canonical_report.longitude is None:
            continue
        if lat is not None and lng is not None and radius_km is not None:
            lat_delta = radius_km / 111.0
            lng_delta = radius_km / (111.0 * max(abs(math.cos(math.radians(lat))), 0.01))
            if not (
                lat - lat_delta <= canonical_report.latitude <= lat + lat_delta
                and lng - lng_delta <= canonical_report.longitude <= lng + lng_delta
            ):
                continue

        results.append(
            _community_report_payload(
                canonical_report,
                group_id,
                vote_counts.get(group_id, 0),
                include_description,
            )
        )
    return results


@app.get("/api/community/reports")
def get_community_reports(
    category: Optional[str] = None,
    report_status: Optional[str] = Query(default=None, alias="status"),
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: Optional[float] = Query(default=None, gt=0),
    db: Session = Depends(get_db),
):
    _community_map_enabled()
    try:
        reports = _community_reports_query(db, category, report_status, lat, lng, radius_km)
        return {"count": len(reports), "reports": reports}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Community Reports Error]: {e}")
        return {"count": 0, "reports": []}


@app.get("/api/community/reports/{cluster_id}")
def get_community_report(cluster_id: uuid.UUID, db: Session = Depends(get_db)):
    _community_map_enabled()
    try:
        reports = _community_reports_query(db, include_description=True)
        for report in reports:
            if report["cluster_id"] == str(cluster_id):
                return report
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community report not found")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Community Report Error]: {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community report not found")


@app.get("/api/reports/dedup-suggestions")
def get_deduplication_suggestions(
    decision: Optional[str] = None,
    min_confidence: Optional[float] = Query(default=None, ge=0, le=1),
    db: Session = Depends(get_db),
    user: dict = Depends(require_authority),
):
    try:
        audit_entries = db.query(models.AuditLog).filter(
            models.AuditLog.entity_type == "report_cluster",
            models.AuditLog.action == "deduplication_suggestion",
        ).order_by(models.AuditLog.created_at.desc()).all()

        suggestions = []
        for entry in audit_entries:
            details = entry.details or {}
            entry_decision = details.get("decision")
            confidence = details.get("confidence_score")
            if decision and entry_decision != decision:
                continue
            if min_confidence is not None and (confidence is None or confidence < min_confidence):
                continue
            suggestions.append({
                "source_report_id": details.get("source_report_id"),
                "candidate_cluster_id": details.get("candidate_cluster_id"),
                "confidence_score": confidence,
                "matched_fields": details.get("matched_fields", {}),
                "decision": entry_decision,
                "created_at": entry.created_at.isoformat() if entry.created_at else None,
            })
        return {"count": len(suggestions), "suggestions": suggestions}
    except Exception as e:
        print(f"[Deduplication Suggestions Error]: {e}")
        return {"count": 0, "suggestions": []}


@app.post("/api/community/reports/{cluster_id}/upvote")
def upvote_community_report(
    cluster_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: dict = Depends(require_citizen),
):
    try:
        cluster = db.get(models.ReportCluster, cluster_id)
        if cluster is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community report not found")

        citizen_id = user.get("id") or user.get("user_id") or user.get("sub")
        if not citizen_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Citizen identity is missing")

        db.add(models.Vote(cluster_id=cluster_id, citizen_id=str(citizen_id)))
        db.commit()
        return {"success": True, "cluster_id": str(cluster_id)}
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Citizen has already upvoted this report")
    except Exception as e:
        db.rollback()
        print(f"[Community Upvote Error]: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to record upvote")

# 3. AUTHORITY DEPARTMENT FEED: GET /api/reports/authority
@app.get("/api/reports/authority")
def get_authority_reports(
    db: Session = Depends(get_db),
    user: dict = Depends(require_authority)
):
    try:
        dept = user.get("department")
        query = db.query(models.Report)
        if dept:
            query = query.filter(models.Report.department.ilike(f"%{dept}%"))

        reports = query.order_by(models.Report.created_at.desc()).all()

        return {
            "role": "authority",
            "department": dept,
            "isApproved": user.get("isApproved", True),
            "count": len(reports),
            "reports": [
                {
                    "id": str(r.report_id),
                    "report_id": str(r.report_id),
                    "category": r.category,
                    "department": r.department,
                    "description": r.description,
                    "status": r.status or "Pending",
                    "latitude": r.latitude,
                    "longitude": r.longitude,
                    "image_url": get_presigned_image_url(r.image_url),
                    "city_name": r.city_name,
                    "soap_transcript": r.soap_transcript,
                    "complaint_report": r.complaint_report,
                    "critic_verdict": r.critic_verdict,
                    "email_status": r.email_status,
                    "severity_level": r.severity_level,
                    "ai_severity_confidence": r.ai_severity_confidence,
                    "ai_severity_reasoning": r.ai_severity_reasoning,
                    "urgency_flagged": r.urgency_flagged,
                    "urgency_notified_at": r.urgency_notified_at.isoformat() if r.urgency_notified_at else None,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                    "vote_count": r.vote_count or 0
                }
                for r in reports
            ]
        }
    except Exception as e:
        print(f"[Authority Reports Error]: {e}")
        return {"role": "authority", "department": user.get("department"), "count": 0, "reports": []}

def find_report_by_id(db: Session, report_id: str):
    """Robust report finder by UUID or string representation."""
    if not report_id:
        return None
    try:
        r_uuid = uuid.UUID(str(report_id))
        report = db.query(models.Report).filter(models.Report.report_id == r_uuid).first()
        if report:
            return report
    except Exception:
        pass
    return db.query(models.Report).filter(cast(models.Report.report_id, String) == str(report_id)).first()

# 4. FETCH S3 REPORT IMAGE ACCESS: GET /api/reports/s3-image/{report_id}
@app.get("/api/reports/s3-image/{report_id}")
@app.get("/api/reports/{report_id}/image")
def get_report_image_s3(
    report_id: str,
    db: Session = Depends(get_db)
):
    """
    Fetches accessible S3 image URL or local storage URL for a specific report.
    Returns presigned AWS S3 URL valid for 24 hours if stored in S3.
    """
    report = find_report_by_id(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    accessible_url = get_presigned_image_url(report.image_url)
    is_s3 = "amazonaws.com" in (report.image_url or "")

    return {
        "report_id": report_id,
        "image_url": accessible_url,
        "raw_image_url": report.image_url,
        "storage_provider": "AWS_S3" if is_s3 else "LOCAL_TTL",
        "aws_bucket": os.getenv("AWS_STORAGE_BUCKET_NAME", "civicsnap-dtplm") if is_s3 else None
    }

# 5. STREAM S3 REPORT IMAGE BINARY: GET /api/reports/stream-image/{report_id}
@app.get("/api/reports/stream-image/{report_id}")
@app.get("/api/reports/image-stream/{report_id}")
def stream_report_image_binary(
    report_id: str,
    db: Session = Depends(get_db)
):
    """
    Streams image binary directly from AWS S3 or local disk.
    Acts as a fail-safe proxy for frontend img tags.
    """
    report = find_report_by_id(db, report_id)
    if not report or not report.image_url:
        raise HTTPException(status_code=404, detail="Report image not found")

    image_url = report.image_url
    bucket_name = os.getenv("AWS_STORAGE_BUCKET_NAME", "civicsnap-dtplm")
    region = os.getenv("AWS_REGION", "ap-south-1")
    access_key = os.getenv("AWS_ACCESS_KEY_ID")
    secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")

    if "amazonaws.com" in image_url or image_url.startswith("s3://"):
        try:
            import boto3
            if "amazonaws.com/" in image_url:
                s3_key = image_url.split("amazonaws.com/")[-1]
            else:
                s3_key = image_url.replace(f"s3://{bucket_name}/", "")

            s3_client = boto3.client(
                "s3",
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
                region_name=region,
                config=Config(signature_version="s3v4")
            )
            s3_obj = s3_client.get_object(Bucket=bucket_name, Key=s3_key)
            media_type = s3_obj.get("ContentType", "image/jpeg")
            return StreamingResponse(s3_obj["Body"], media_type=media_type)
        except Exception as e:
            print(f"[Image Proxy S3 Error]: {e}")
            presigned = get_presigned_image_url(image_url)
            return RedirectResponse(url=presigned)

    # Local storage fallback
    from services.storage_service import UPLOAD_DIR
    filename = os.path.basename(image_url)
    filepath = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(filepath):
        return FileResponse(filepath)

    default_path = os.path.join(STATIC_DIR, "default_issue.jpg")
    if os.path.exists(default_path):
        return FileResponse(default_path)

    return RedirectResponse(url="/static/default_issue.jpg")

# Static report-images fallback route (prevents 404 for missing legacy report-images)
@app.get("/static/report-images/{image_name:path}")
def serve_static_report_image(image_name: str):
    file_path = os.path.join(STATIC_DIR, "report-images", image_name)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    default_path = os.path.join(STATIC_DIR, "default_issue.jpg")
    if os.path.exists(default_path):
        return FileResponse(default_path)
    raise HTTPException(status_code=404, detail="Image not found")

# 5. UPDATE REPORT STATUS: POST /api/reports/{report_id}/status
@app.post("/api/reports/{report_id}/status")
def update_report_status(
    report_id: str,
    req: StatusUpdateRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(require_authority)
):
    try:
        report = db.query(models.Report).filter(models.Report.report_id == report_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        old_status = report.status or "pending"
        new_status = req.status

        report.status = new_status
        db.commit()
        db.refresh(report)

        # Dispatch automated status update email notification to the reporting citizen if status changed
        email_notification_result = None
        if old_status.lower() != new_status.lower():
            target_citizen_email = report.citizen_email
            
            # If citizen_email not stored directly on report, look up citizen_id in database users table
            if not target_citizen_email and report.citizen_id:
                try:
                    user_row = db.execute(
                        text("SELECT email FROM users WHERE id = :cid OR user_id = :cid LIMIT 1"),
                        {"cid": str(report.citizen_id)}
                    ).fetchone()
                    if user_row and user_row[0]:
                        target_citizen_email = user_row[0]
                except Exception as e:
                    print(f"[Citizen Email Lookup Notice]: {e}")

            # Fallback to test override only if no citizen email found
            if not target_citizen_email and os.getenv("TEST_EMAIL_OVERRIDE"):
                target_citizen_email = os.getenv("TEST_EMAIL_OVERRIDE")
            
            authority_name = user.get("name") or user.get("department") or "Municipal Authority"
            
            if target_citizen_email:
                email_notification_result = send_status_update_notification_to_citizen(
                    target_email=target_citizen_email,
                    report_id=str(report.report_id),
                    category=report.category or "Civic Issue",
                    department=report.department or "Municipal Corporation",
                    city_name=report.city_name or "Mumbai",
                    old_status=old_status,
                    new_status=new_status,
                    authority_user=authority_name
                )


        return {
            "success": True,
            "message": f"Report status updated from '{old_status}' to '{new_status}'",
            "report_id": str(report.report_id),
            "status": report.status,
            "citizen_email_notification": email_notification_result
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

