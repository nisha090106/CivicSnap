import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    text as sql_text,
)
from sqlalchemy.dialects.postgresql import UUID
from database import Base

class Report(Base):
    __tablename__ = "reports"
    __table_args__ = (
        Index("ix_reports_latitude_longitude", "latitude", "longitude"),
        Index("ix_reports_category", "category"),
        Index("ix_reports_status", "status"),
        Index("ix_reports_cluster_id", "cluster_id"),
    )

    report_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=sql_text("gen_random_uuid()")
    )
    citizen_id = Column(String(100), nullable=True)
    citizen_email = Column(String(255), nullable=True)
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
        server_default=sql_text("now()")
    )
    vote_count = Column(Integer, nullable=True, default=0, server_default="0")
    cluster_id = Column(UUID(as_uuid=True), ForeignKey("report_clusters.cluster_id"), nullable=True)
    source = Column(String(50), nullable=False, default="civicsnap", server_default="civicsnap")

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
    ai_severity_confidence = Column(Float, nullable=True)
    ai_severity_reasoning = Column(Text, nullable=True)
    urgency_flagged = Column(Boolean, nullable=False, default=False, server_default="false")
    urgency_notified_at = Column(DateTime(timezone=True), nullable=True)
    
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


class ReportCluster(Base):
    __tablename__ = "report_clusters"
    __table_args__ = (Index("ix_report_clusters_priority_score", "priority_score"),)

    cluster_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=sql_text("gen_random_uuid()"))
    canonical_report_id = Column(UUID(as_uuid=True), ForeignKey("reports.report_id"), nullable=True)
    status = Column(String(50), nullable=False, default="active", server_default="active")
    merge_confidence = Column(Float, nullable=True)
    merge_reason = Column(Text, nullable=True)
    priority_score = Column(Float, nullable=True)
    priority_class = Column(String(50), nullable=True)
    score_version = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=sql_text("now()"))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=sql_text("now()"))


class ReportClusterMember(Base):
    __tablename__ = "report_cluster_members"

    member_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=sql_text("gen_random_uuid()"))
    report_id = Column(UUID(as_uuid=True), ForeignKey("reports.report_id"), nullable=False)
    cluster_id = Column(UUID(as_uuid=True), ForeignKey("report_clusters.cluster_id"), nullable=False)
    match_score = Column(Float, nullable=True)
    matched_fields = Column(JSON, nullable=True)
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=sql_text("now()"))


class Vote(Base):
    __tablename__ = "votes"
    __table_args__ = (
        UniqueConstraint("cluster_id", "citizen_id", name="uq_votes_cluster_citizen"),
        Index("ix_votes_cluster_id", "cluster_id"),
    )

    vote_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=sql_text("gen_random_uuid()"))
    cluster_id = Column(UUID(as_uuid=True), ForeignKey("report_clusters.cluster_id"), nullable=False)
    citizen_id = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=sql_text("now()"))


class Comment(Base):
    __tablename__ = "comments"

    comment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=sql_text("gen_random_uuid()"))
    cluster_id = Column(UUID(as_uuid=True), ForeignKey("report_clusters.cluster_id"), nullable=False)
    author_id = Column(String(100), nullable=False)
    text = Column(Text, nullable=False)
    is_hidden = Column(Boolean, nullable=False, default=False, server_default="false")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=sql_text("now()"))


class AuditLog(Base):
    __tablename__ = "audit_log"

    audit_log_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=sql_text("gen_random_uuid()"))
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    action = Column(String(100), nullable=False)
    actor_id = Column(String(100), nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=sql_text("now()"))


class ExternalReport(Base):
    __tablename__ = "external_reports"
    __table_args__ = (
        UniqueConstraint("provider", "external_id", name="uq_external_reports_provider_external"),
    )

    external_report_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=sql_text("gen_random_uuid()"))
    provider = Column(String(100), nullable=False)
    external_id = Column(String(255), nullable=False)
    canonical_url = Column(Text, nullable=True)
    content_metadata = Column(JSON, nullable=True)
    retrieval_state = Column(String(50), nullable=False, default="pending", server_default="pending")
    retrieved_at = Column(DateTime(timezone=True), nullable=True)


class ExternalReportLink(Base):
    __tablename__ = "external_report_links"
    __table_args__ = (
        UniqueConstraint("external_report_id", "cluster_id", name="uq_external_report_links_pair"),
    )

    external_report_link_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=sql_text("gen_random_uuid()"))
    external_report_id = Column(UUID(as_uuid=True), ForeignKey("external_reports.external_report_id"), nullable=False)
    cluster_id = Column(UUID(as_uuid=True), ForeignKey("report_clusters.cluster_id"), nullable=False)
    match_confidence = Column(Float, nullable=True)
    match_status = Column(String(50), nullable=False, default="pending", server_default="pending")
    reviewer_id = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=sql_text("now()"))


class ExternalEngagementSnapshot(Base):
    __tablename__ = "external_engagement_snapshots"

    snapshot_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=sql_text("gen_random_uuid()"))
    external_report_id = Column(UUID(as_uuid=True), ForeignKey("external_reports.external_report_id"), nullable=False)
    like_count = Column(Integer, nullable=False, default=0, server_default="0")
    repost_count = Column(Integer, nullable=False, default=0, server_default="0")
    reply_count = Column(Integer, nullable=False, default=0, server_default="0")
    quote_count = Column(Integer, nullable=False, default=0, server_default="0")
    captured_at = Column(DateTime(timezone=True), nullable=False, server_default=sql_text("now()"))

