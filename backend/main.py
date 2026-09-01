import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from fastapi import FastAPI, HTTPException, status, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse, RedirectResponse, FileResponse
from botocore.config import Config

from database import engine, Base, check_db_connection, get_db
from sqlalchemy.orm import Session
from sqlalchemy import cast, String
from auth import get_current_user, get_optional_user, require_citizen, require_authority
import models

from services.storage_service import save_report_image, calculate_ttl_expiration, cleanup_expired_storage, get_presigned_image_url
from services.multimodal_service import analyze_and_generate_soap_transcript
from services.report_generator_service import generate_llm_complaint_report
from services.email_service import draft_official_email, anti_hallucination_critic, dispatch_email_worker

# Initialize database schema
try:
    Base.metadata.create_all(bind=engine)
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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads directory for serving uploaded evidence photos
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

class ReportSubmitRequest(BaseModel):
    image_data: Optional[str] = None
    category: Optional[str] = "pothole"
    latitude: Optional[float] = 19.0760
    longitude: Optional[float] = 72.8777
    description: Optional[str] = ""
    disclose_identity: Optional[bool] = False
    citizen_name: Optional[str] = None
    language: Optional[str] = "en"

class ReportPreviewRequest(BaseModel):
    image_data: Optional[str] = None
    category: Optional[str] = "pothole"
    latitude: Optional[float] = 19.0760
    longitude: Optional[float] = 72.8777
    description: Optional[str] = ""
    disclose_identity: Optional[bool] = False
    citizen_name: Optional[str] = None
    language: Optional[str] = "en"

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
        soap_data = analyze_and_generate_soap_transcript(
            image_url="/static/default_issue.jpg",
            category=req.category,
            lat=req.latitude or 19.0760,
            lng=req.longitude or 72.8777,
            user_notes=req.description or ""
        )

        citizen_name = req.citizen_name or (user.get("name") if user else None) or "Anonymous Citizen"

        complaint_data = generate_llm_complaint_report(
            soap_data=soap_data,
            image_url="/static/default_issue.jpg",
            user_notes=req.description or "",
            disclose_identity=req.disclose_identity or False,
            citizen_name=citizen_name,
            language=req.language or "en"
        )

        return {
            "success": True,
            "formal_letter": complaint_data["complaint_report"],
            "soap_transcript": soap_data["soap_transcript"],
            "authority_name": complaint_data["authority_name"],
            "header_notice": complaint_data["header_notice"],
            "city_name": soap_data["city_name"],
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
        soap_data = analyze_and_generate_soap_transcript(
            image_url=image_url,
            category=req.category,
            lat=req.latitude or 19.0760,
            lng=req.longitude or 72.8777,
            user_notes=req.description or ""
        )

        citizen_name = req.citizen_name or (user.get("name") if user else None) or "Anonymous Citizen"

        # Step 4 & 5: Multi-Lingual Formal Letter Generation & Authority Routing
        complaint_data = generate_llm_complaint_report(
            soap_data=soap_data,
            image_url=image_url,
            user_notes=req.description or "",
            disclose_identity=req.disclose_identity or False,
            citizen_name=citizen_name,
            language=req.language or "en"
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
            severity_level=soap_data["severity"],
            ttl_expires_at=calculate_ttl_expiration(15),
            email_draft=critic_result["verified_body"],
            critic_verdict=critic_result["verdict"],
            email_status=worker_res["status"],
            email_sent_at=datetime.now(timezone.utc)
        )

        db.add(new_report)
        db.commit()
        db.refresh(new_report)

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
            "ttl_expires_at": new_report.ttl_expires_at.isoformat() if new_report.ttl_expires_at else None
        }
    except Exception as err:
        db.rollback()
        print(f"[Report Submission Error]: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report submission failed: {str(err)}"
        )

# 2. CITIZEN REPORTS FEED: GET /api/reports/citizen
@app.get("/api/reports/citizen")
def get_citizen_reports(
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(get_optional_user)
):
    try:
        query = db.query(models.Report)
        if user and user.get("id"):
            query = query.filter(models.Report.citizen_id == user.get("id"))
        
        reports = query.order_by(models.Report.created_at.desc()).all()
        
        return {
            "role": "citizen",
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

    return RedirectResponse(url="/static/default_issue.jpg")

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

        report.status = req.status
        db.commit()
        db.refresh(report)

        return {
            "success": True,
            "message": f"Report status updated to '{req.status}'",
            "report_id": str(report.report_id),
            "status": report.status
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

