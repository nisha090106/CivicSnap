import os
import uuid
import base64
from datetime import datetime, timezone, timedelta
from sqlalchemy import text
from database import SessionLocal
import models

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_STORAGE_BUCKET_NAME = os.getenv("AWS_STORAGE_BUCKET_NAME")
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")

def calculate_ttl_expiration(days: int = 15) -> datetime:
    """Calculate 15-day TTL expiration timestamp from current time."""
    return datetime.now(timezone.utc) + timedelta(days=days)

def upload_to_s3(file_bytes: bytes, filename: str, content_type: str = "image/jpeg") -> str:
    """
    Attempts to upload image bytes to AWS S3 bucket if credentials are configured.
    Returns S3 public URL if successful, else None.
    """
    if not (AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and AWS_STORAGE_BUCKET_NAME):
        return None
    
    try:
        import boto3
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
        s3_key = f"civicsnap/{filename}"
        s3_client.put_object(
            Bucket=AWS_STORAGE_BUCKET_NAME,
            Key=s3_key,
            Body=file_bytes,
            ContentType=content_type
        )
        s3_url = f"https://{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
        print(f"[AWS S3 Storage] Successfully uploaded {filename} to AWS S3: {s3_url}")
        return s3_url
    except Exception as e:
        print(f"[AWS S3 Storage Warning] S3 upload failed: {e}. Falling back to local storage.")
        return None

def save_report_image(image_data: str) -> str:
    """
    Save image to AWS S3 storage if configured, else save locally with 15-day TTL.
    Returns image URL path.
    """
    if not image_data:
        return "/static/default_issue.jpg"
        
    try:
        # Check if base64 data string
        if "," in image_data:
            header, encoded = image_data.split(",", 1)
            extension = "png" if "png" in header else "jpg"
            mime_type = "image/png" if "png" in header else "image/jpeg"
        else:
            encoded = image_data
            extension = "jpg"
            mime_type = "image/jpeg"

        file_bytes = base64.b64decode(encoded)
        filename = f"civic_{uuid.uuid4().hex[:12]}.{extension}"

        # 1. Try AWS S3 Upload First
        s3_url = upload_to_s3(file_bytes, filename, content_type=mime_type)
        if s3_url:
            return s3_url

        # 2. Local Storage Fallback
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(file_bytes)

        return f"/uploads/{filename}"
    except Exception as e:
        print(f"[Storage Service Warning] Error saving image: {e}")
        return "/static/default_issue.jpg"

from botocore.config import Config

def get_presigned_image_url(image_url: str) -> str:
    """
    Retrieves an accessible report image URL using AWS S3 v4 signature.
    If image_url is stored in AWS S3, generates a temporary presigned regional AWS S3 GET URL (24h validity).
    If local/fallback URL, returns image_url directly.
    """
    if not image_url:
        return "/static/default_issue.jpg"

    if "amazonaws.com" in image_url or image_url.startswith("s3://"):
        if not (AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and AWS_STORAGE_BUCKET_NAME):
            return image_url
        try:
            import boto3
            if "amazonaws.com/" in image_url:
                s3_key = image_url.split("amazonaws.com/")[-1]
            else:
                s3_key = image_url.replace(f"s3://{AWS_STORAGE_BUCKET_NAME}/", "")

            s3_client = boto3.client(
                "s3",
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                region_name=AWS_REGION,
                config=Config(signature_version="s3v4")
            )
            presigned_url = s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": AWS_STORAGE_BUCKET_NAME, "Key": s3_key},
                ExpiresIn=86400 # 24 hours
            )
            return presigned_url
        except Exception as e:
            print(f"[AWS S3 Presigned URL Warning] Failed to generate presigned URL: {e}")
            return image_url

    return image_url

def cleanup_expired_storage():
    """
    15-Day TTL Storage Worker:
    Scans database for expired report images (ttl_expires_at < now)
    and removes expired image files to enforce 15-day retention policy.
    """
    db = SessionLocal()
    cleaned_count = 0
    try:
        now = datetime.now(timezone.utc)
        expired_reports = db.query(models.Report).filter(
            models.Report.ttl_expires_at <= now,
            models.Report.image_url.like("/uploads/%")
        ).all()

        for report in expired_reports:
            filename = os.path.basename(report.image_url)
            filepath = os.path.join(UPLOAD_DIR, filename)
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                    cleaned_count += 1
                except Exception as ex:
                    print(f"[TTL Cleanup Error] Failed to delete {filepath}: {ex}")
            report.image_url = "/static/expired_image.jpg"
        
        if cleaned_count > 0:
            db.commit()
            print(f"[Storage Service TTL] Successfully cleaned up {cleaned_count} expired report images (>15 days old).")
    except Exception as e:
        print(f"[Storage Service TTL Error]: {e}")
    finally:
        db.close()
    return cleaned_count
