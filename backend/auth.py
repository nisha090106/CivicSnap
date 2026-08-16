import os
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "super_secret_jwt_key_civicsnap_2026")
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token has expired"
        )
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}"
        )

def require_citizen(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "citizen":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Citizen access required"
        )
    return current_user

def require_authority(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "authority":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authority access required"
        )
    if not current_user.get("isApproved", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authority account is pending approval"
        )
    return current_user
