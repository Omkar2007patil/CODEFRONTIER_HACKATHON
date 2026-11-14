"""Server-side authentication and RBAC for Apex Handover Platform.
Uses PyJWT with HMAC-SHA256, secure token verification, and role-based policies.
"""

import os
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.db import get_db_connection, verify_password, hash_password
from app.schemas import UserProfile, UserRole

JWT_SECRET = os.environ.get("JWT_SECRET", "apex-handover-dev-secret-key-change-in-prod-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Creates a signed JWT with expiration timestamp and user claims."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=JWT_EXPIRE_HOURS))
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decodes and cryptographically verifies JWT."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token signature or payload.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_user_by_id(user_id: str) -> Optional[UserProfile]:
    """Retrieves user profile from database by ID."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, email, full_name, role, created_at FROM users WHERE id = ?", (user_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return UserProfile(
        id=row["id"],
        email=row["email"],
        full_name=row["full_name"],
        role=row["role"],
        created_at=row["created_at"],
    )


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Retrieves full user row by email including password hash."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, email, password_hash, salt, full_name, role, created_at FROM users WHERE LOWER(email) = LOWER(?)",
        (email.strip(),),
    )
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return dict(row)


def authenticate_user(email: str, password: str) -> Optional[UserProfile]:
    """Validates user credentials against stored salt and hash."""
    user = get_user_by_email(email)
    if not user:
        return None
    if not verify_password(password, user["password_hash"], user["salt"]):
        return None
    return UserProfile(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        created_at=user["created_at"],
    )


def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> UserProfile:
    """Dependency: enforces valid authenticated session."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided. Include 'Authorization: Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token claims.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account associated with this token no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_optional_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[UserProfile]:
    """Dependency: returns user if valid token present, otherwise None without failing."""
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if user_id:
            return get_user_by_id(user_id)
    except Exception:
        pass
    return None


def require_roles(allowed_roles: List[str]):
    """Role-based access control dependency factory."""
    def role_checker(current_user: UserProfile = Depends(get_current_user)) -> UserProfile:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Forbidden: Action requires one of roles {allowed_roles}, "
                    f"but user '{current_user.email}' has role '{current_user.role}'."
                ),
            )
        return current_user

    return role_checker
