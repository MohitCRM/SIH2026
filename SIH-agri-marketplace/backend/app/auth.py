"""Authentication and security module.
Handles password hashing, JWT generation/validation, user session injection,
and Role-Based Access Control (RBAC) dependencies.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Sequence
import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User, UserRole

# Cryptographic password hashing setup using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 Bearer token extraction pointing to the login endpoint
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
    description="JWT Bearer token. Use phone number as the username in the login flow.",
    auto_error=True,
)


# ==============================================================================
# 1. Password Hashing Utilities
# ==============================================================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against a stored bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generates a secure salted bcrypt hash for a plaintext password."""
    return pwd_context.hash(password)


# ==============================================================================
# 2. JWT Generation & Verification
# ==============================================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generates an encoded HS256 JWT access token with a 24-hour default expiration."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_HOURS)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """Decodes and validates the signature and expiration of an access token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


# ==============================================================================
# 3. Authentication Dependency (get_current_user)
# ==============================================================================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency to extract, decode, and fetch the authenticated User model.
    Validates token integrity, user existence, and active account status.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: Optional[str] = payload.get("sub")
        if not user_id_str:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    try:
        user_uuid = uuid.UUID(user_id_str)
    except (ValueError, TypeError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_uuid).first()
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive or suspended",
        )

    return user


# ==============================================================================
# 4. Role-Based Access Control (RBAC) Dependency Factory
# ==============================================================================

class RoleChecker:
    """Callable dependency class that verifies the authenticated user possesses
    one of the allowed roles for the requested route.
    """

    def __init__(self, allowed_roles: Sequence[UserRole]):
        self.allowed_roles = set(allowed_roles)

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            role_names = [role.value for role in self.allowed_roles]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Access forbidden: Operation requires one of the following roles: {role_names}. "
                    f"Current user role: '{current_user.role.value}'."
                ),
            )
        return current_user


def require_roles(allowed_roles: Sequence[UserRole]):
    """FastAPI RBAC dependency builder.

    Usage Example:
        @router.get("/farmer/analytics")
        def get_analytics(user: User = Depends(require_roles([UserRole.FARMER]))):
            ...
    """
    return RoleChecker(allowed_roles)
