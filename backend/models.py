import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, String, Float, Text, Integer, DateTime, text
from sqlalchemy.dialects.postgresql import UUID
from database import Base

class Report(Base):
    __tablename__ = "reports"

    report_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()")
    )
    citizen_id = Column(String(100), nullable=True)
    image_url = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    department = Column(String(100), nullable=True)
    status = Column(String(50), nullable=True, default="pending", server_default="pending")
    created_at = Column(
        DateTime(timezone=True),
        nullable=True,
        default=lambda: datetime.now(timezone.utc),
        server_default=text("now()")
    )
    vote_count = Column(Integer, nullable=True, default=0, server_default="0")

    # --- Architecture Diagram Expanded Metadata Fields ---
    city_name = Column(String(100), nullable=True)
    taluka_name = Column(String(100), nullable=True)
    district_name = Column(String(100), nullable=True)
    state_name = Column(String(100), nullable=True, default="Maharashtra")
    
    # SOAP Note Format Transcript (Subjective, Objective, Assessment, Plan)
    soap_transcript = Column(Text, nullable=True)
    
    # LLM Generated Complaint Report for Authorities
    complaint_report = Column(Text, nullable=True)
    severity_level = Column(String(50), nullable=True, default="Medium")
    
    # Storage 15-Day Time-To-Live (TTL) timestamp
    ttl_expires_at = Column(
        DateTime(timezone=True),
        nullable=True,
        default=lambda: datetime.now(timezone.utc) + timedelta(days=15)
    )
    
    # Emailing Subsystem Auditing
    email_draft = Column(Text, nullable=True)
    critic_verdict = Column(Text, nullable=True)
    email_status = Column(String(50), nullable=True, default="pending")
    email_id = Column(String(255), nullable=True)
    email_sent_at = Column(DateTime(timezone=True), nullable=True)

