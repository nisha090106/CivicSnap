import base64
import binascii
import logging
import os
import uuid
from pathlib import Path
from urllib.parse import quote, urlsplit

import httpx
from dotenv import load_dotenv
from fastapi import HTTPException


load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=False)

logger = logging.getLogger(__name__)
MAX_IMAGE_BYTES = 10 * 1024 * 1024
DEFAULT_STORAGE_BUCKET = "report-images"
ALLOWED_IMAGE_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}


def _storage_settings():
    base_url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    bucket = os.getenv("SUPABASE_STORAGE_BUCKET", DEFAULT_STORAGE_BUCKET).strip()

    if base_url and "://" not in base_url:
        base_url = f"https://{base_url}"
    parsed_url = urlsplit(base_url)
    if (
        parsed_url.scheme not in {"http", "https"}
        or not parsed_url.hostname
        or any(character.isspace() for character in parsed_url.netloc)
        or parsed_url.username
        or parsed_url.password
        or parsed_url.path not in {"", "/"}
        or parsed_url.query
        or parsed_url.fragment
    ):
        raise HTTPException(
            status_code=503,
            detail="Report photo storage is not configured. Set SUPABASE_URL to the project URL.",
        )
    try:
        parsed_url.port
    except ValueError as error:
        raise HTTPException(
            status_code=503,
            detail="Report photo storage is not configured. Set SUPABASE_URL to a valid project URL.",
        ) from error
    if not service_key or not bucket:
        raise HTTPException(
            status_code=503,
            detail="Report photo storage is not configured. Set SUPABASE_SERVICE_ROLE_KEY and SUPABASE_STORAGE_BUCKET.",
        )
    return f"{parsed_url.scheme}://{parsed_url.netloc}", service_key, bucket


def _log_storage_configuration():
    try:
        base_url, service_key, bucket = _storage_settings()
        hostname = urlsplit(base_url).hostname
        logger.info(
            "Supabase Storage configuration loaded: host=%s service_role_key_configured=%s bucket=%s",
            hostname,
            bool(service_key),
            bucket,
        )
    except HTTPException:
        logger.warning(
            "Supabase Storage configuration is incomplete or invalid: url_configured=%s "
            "service_role_key_configured=%s bucket=%s",
            bool(os.getenv("SUPABASE_URL")),
            bool(os.getenv("SUPABASE_SERVICE_ROLE_KEY")),
            os.getenv("SUPABASE_STORAGE_BUCKET", DEFAULT_STORAGE_BUCKET),
        )


_log_storage_configuration()


def upload_report_evidence(image_data: str, report_id: str) -> str:
    if not image_data:
        raise HTTPException(status_code=400, detail="Choose a photo before submitting.")

    header, separator, encoded = image_data.partition(",")
    if not separator or not header.startswith("data:") or ";base64" not in header:
        raise HTTPException(status_code=400, detail="The selected photo could not be read.")
    if len(encoded) > ((MAX_IMAGE_BYTES + 2) // 3) * 4:
        raise HTTPException(status_code=413, detail="Choose a photo smaller than 10 MB.")

    content_type = header[5:].split(";", 1)[0].lower()
    extension = ALLOWED_IMAGE_TYPES.get(content_type)
    if not extension:
        raise HTTPException(status_code=415, detail="Choose a JPEG, PNG, or WebP photo.")

    try:
        image_bytes = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError) as error:
        raise HTTPException(status_code=400, detail="The selected photo could not be read.") from error
    if not image_bytes or len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Choose a photo smaller than 10 MB.")

    base_url, service_key, bucket = _storage_settings()
    object_path = f"reports/{report_id}/{uuid.uuid4().hex}.{extension}"
    object_url = (
        f"{base_url}/storage/v1/object/{quote(bucket, safe='')}/"
        f"{quote(object_path, safe='/')}"
    )
    try:
        response = httpx.post(
            object_url,
            content=image_bytes,
            headers={
                "Authorization": f"Bearer {service_key}",
                "apikey": service_key,
                "Content-Type": content_type,
                "x-upsert": "false",
            },
            timeout=30,
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as error:
        storage_response = error.response
        logger.error(
            "Supabase Storage upload failed: bucket=%s object_path=%s status_code=%s "
            "message=%s details=%s",
            bucket,
            object_path,
            storage_response.status_code,
            storage_response.reason_phrase,
            storage_response.text,
        )
        raise HTTPException(
            status_code=502,
            detail="The photo could not be uploaded. Please try again.",
        ) from error
    except httpx.RequestError as error:
        logger.exception(
            "Supabase Storage upload request failed: bucket=%s object_path=%s error=%s",
            bucket,
            object_path,
            error,
        )
        raise HTTPException(
            status_code=502,
            detail="The photo could not be uploaded. Please try again.",
        ) from error
    return f"supabase://{bucket}/{object_path}"


def get_report_evidence_url(storage_path: str) -> str:
    if not storage_path or not storage_path.startswith("supabase://"):
        return storage_path

    base_url, service_key, default_bucket = _storage_settings()
    bucket_and_path = storage_path[len("supabase://"):]
    bucket, separator, object_path = bucket_and_path.partition("/")
    if not separator or not bucket or not object_path:
        raise HTTPException(status_code=500, detail="Stored report photo reference is invalid.")
    if bucket != default_bucket:
        raise HTTPException(status_code=500, detail="Stored report photo bucket does not match configuration.")

    sign_url = (
        f"{base_url}/storage/v1/object/sign/{quote(bucket, safe='')}/"
        f"{quote(object_path, safe='/')}"
    )
    try:
        response = httpx.post(
            sign_url,
            json={"expiresIn": 3600},
            headers={
                "Authorization": f"Bearer {service_key}",
                "apikey": service_key,
            },
            timeout=15,
        )
        response.raise_for_status()
        signed_path = response.json().get("signedURL")
    except httpx.HTTPStatusError as error:
        storage_response = error.response
        logger.error(
            "Supabase Storage signed URL request failed: bucket=%s object_path=%s "
            "status_code=%s message=%s details=%s",
            bucket,
            object_path,
            storage_response.status_code,
            storage_response.reason_phrase,
            storage_response.text,
        )
        raise HTTPException(
            status_code=502,
            detail="A report photo could not be loaded right now.",
        ) from error
    except httpx.RequestError as error:
        logger.exception(
            "Supabase Storage signed URL request failed: bucket=%s object_path=%s error=%s",
            bucket,
            object_path,
            error,
        )
        raise HTTPException(
            status_code=502,
            detail="A report photo could not be loaded right now.",
        ) from error
    except ValueError as error:
        logger.exception(
            "Supabase Storage returned an invalid signed URL response: bucket=%s object_path=%s",
            bucket,
            object_path,
        )
        raise HTTPException(
            status_code=502,
            detail="A report photo could not be loaded right now.",
        ) from error

    if not isinstance(signed_path, str) or not signed_path:
        raise HTTPException(status_code=502, detail="A report photo could not be loaded right now.")
    if signed_path.startswith("http://") or signed_path.startswith("https://"):
        return signed_path
    if signed_path.startswith("/storage/v1/"):
        return f"{base_url}{signed_path}"
    return f"{base_url}/storage/v1/{signed_path.lstrip('/')}"
