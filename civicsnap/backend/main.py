from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, check_db_connection
import models

# Initialize database schema (create reports table if it doesn't exist)
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized / verified successfully.")
except Exception as e:
    print(f"Database initialization notice: {e}")

app = FastAPI(
    title="CivicSnap Backend API",
    description="FastAPI service for CivicSnap AI-powered civic issue reporting platform",
    version="1.0.0"
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
        "stage": "Stage 1 — Project Scaffolding & Database"
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
