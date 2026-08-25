from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, status, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base, check_db_connection, get_db
from auth import get_current_user, require_citizen, require_authority
import models
import os
import uuid
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://spxihllztqedtitwlsdw.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("SUPABASE_KEY", ""))

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"Failed to initialize Supabase client: {e}")
    supabase = None

# Initialize database schema
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized / verified successfully.")
except Exception as e:
    print(f"Database initialization notice: {e}")

app = FastAPI(
    title="CivicSnap Backend API",
    description="FastAPI service for CivicSnap AI-powered civic issue reporting platform",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    return {
        "service": "CivicSnap FastAPI Backend",
        "status": "online",
        "stage": "Stage 2 — Authentication & JWT Route Protection"
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
    """Return authenticated user profile claims resolved via Better Auth JWT"""
    return {
        "authenticated": True,
        "user": user
    }

@app.get("/api/reports/citizen")
def get_citizen_reports(user: dict = Depends(require_citizen), db = Depends(get_db)):
    """Citizen-only protected endpoint"""
    reports = db.query(models.Report).filter(models.Report.citizen_id == user.get("id")).order_by(models.Report.created_at.desc()).all()
    return {
        "role": "citizen",
        "user_id": user.get("id"),
        "reports": reports
    }

@app.post("/api/reports")
async def create_report(
    image: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    user: dict = Depends(require_citizen),
    db = Depends(get_db)
):
    if not supabase:
        # Fallback to local storage if keys are not provided
        os.makedirs("static/report-images", exist_ok=True)
        file_ext = image.filename.split('.')[-1] if '.' in image.filename else 'jpg'
        file_name = f"{uuid.uuid4()}.{file_ext}"
        filepath = f"static/report-images/{file_name}"
        with open(filepath, "wb") as f:
            f.write(await image.read())
        public_url = f"http://localhost:5000/static/report-images/{file_name}"
    else:
        bucket_name = "report-images"
        try:
            supabase.storage.get_bucket(bucket_name)
        except Exception:
            try:
                supabase.storage.create_bucket(bucket_name, {"public": True})
            except Exception:
                pass

        file_ext = image.filename.split('.')[-1] if '.' in image.filename else 'jpg'
        file_name = f"{uuid.uuid4()}.{file_ext}"
        file_bytes = await image.read()
        
        try:
            res = supabase.storage.from_(bucket_name).upload(file_name, file_bytes, {"content-type": image.content_type})
            public_url = supabase.storage.from_(bucket_name).get_public_url(file_name)
        except Exception as e:
            raise HTTPException(500, f"Storage upload failed: {str(e)}")
        
    new_report = models.Report(
        citizen_id=user.get("id"),
        image_url=public_url,
        latitude=latitude,
        longitude=longitude,
        status="processing"
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return {"message": "Report created", "report": new_report}

@app.get("/api/reports/authority")
def get_authority_reports(user: dict = Depends(require_authority)):
    """Approved Authority-only protected endpoint"""
    return {
        "role": "authority",
        "department": user.get("department"),
        "isApproved": user.get("isApproved"),
        "reports": []
    }
