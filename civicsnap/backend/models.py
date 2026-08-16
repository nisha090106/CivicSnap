import uuid
from datetime import datetime, timezone
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
    citizen_id = Column(UUID(as_uuid=True), nullable=True)
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
