from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, check_db_connection
from auth import get_current_user, require_citizen, require_authority
import models

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
def get_citizen_reports(user: dict = Depends(require_citizen)):
    """Citizen-only protected endpoint"""
    return {
        "role": "citizen",
        "user_id": user.get("id"),
        "reports": []
    }

@app.get("/api/reports/authority")
def get_authority_reports(user: dict = Depends(require_authority)):
    """Approved Authority-only protected endpoint"""
    return {
        "role": "authority",
        "department": user.get("department"),
        "isApproved": user.get("isApproved"),
        "reports": []
    }
