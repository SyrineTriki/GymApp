import bcrypt as _bcrypt
import random
import secrets
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from fastapi_mail import FastMail, MessageSchema, MessageType, ConnectionConfig
from jose import JWTError, jwt

from app_config import settings


# ── Password ───────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    pw_bytes = password.encode("utf-8")[:72]
    return _bcrypt.hashpw(pw_bytes, _bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return _bcrypt.checkpw(plain.encode("utf-8")[:72], hashed.encode("utf-8"))
    except Exception:
        return False


# ── 6-digit OTP ────────────────────────────────────────────────────────────────

def generate_otp() -> str:
    return str(random.randint(100000, 999999))


def otp_expiry() -> datetime:
    return datetime.utcnow() + timedelta(minutes=15)


# ── JWT ────────────────────────────────────────────────────────────────────────

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)):
    from sqlalchemy import select
    from database import async_session
    from models import User

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    async with async_session() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise credentials_exception
        return user


def require_role(*roles):
    async def checker(current_user=Depends(get_current_user)):
        if current_user.role.value not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions.")
        return current_user
    return checker


# ── Email ──────────────────────────────────────────────────────────────────────

def _get_fastmail() -> FastMail:
    config = ConnectionConfig(
        MAIL_USERNAME=settings.MAIL_USERNAME,
        MAIL_PASSWORD=settings.MAIL_PASSWORD,
        MAIL_FROM=settings.MAIL_FROM,
        MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
        MAIL_PORT=settings.MAIL_PORT,
        MAIL_SERVER=settings.MAIL_SERVER,
        MAIL_STARTTLS=settings.MAIL_STARTTLS,
        MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
        USE_CREDENTIALS=bool(settings.MAIL_USERNAME),
        VALIDATE_CERTS=True,
    )
    return FastMail(config)


async def send_verification_email(email: str, name: str, code: str) -> None:
    html_body = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;background:#0d0d0d;color:#f0f0f0;border-radius:12px;">
      <h2 style="color:#ef4444;">Welcome to GymApp, {name}! 💪</h2>
      <p style="color:#888;">Use the code below to verify your email. It expires in 15 minutes.</p>
      <div style="font-size:36px;font-weight:900;letter-spacing:12px;color:#ef4444;margin:24px 0;text-align:center;">{code}</div>
      <p style="font-size:12px;color:#555;">If you didn't create an account, ignore this email.</p>
    </div>
    """
    message = MessageSchema(
        subject="Your GymApp verification code",
        recipients=[email],
        body=html_body,
        subtype=MessageType.html,
    )
    await _get_fastmail().send_message(message)


async def send_coach_approval_email(email: str, name: str) -> None:
    html_body = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;background:#0d0d0d;color:#f0f0f0;border-radius:12px;">
      <h2 style="color:#4ade80;">You're approved, {name}! 🎉</h2>
      <p style="color:#888;">Your coach account has been approved. You can now log in to GymApp.</p>
    </div>
    """
    message = MessageSchema(
        subject="Your GymApp coach account has been approved",
        recipients=[email],
        body=html_body,
        subtype=MessageType.html,
    )
    await _get_fastmail().send_message(message)


async def send_coach_rejection_email(email: str, name: str, reason: str) -> None:
    html_body = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;background:#0d0d0d;color:#f0f0f0;border-radius:12px;">
      <h2 style="color:#f87171;">Application not approved</h2>
      <p style="color:#888;">Hi {name}, unfortunately your coach application was not approved.</p>
      <p style="color:#888;"><strong>Reason:</strong> {reason}</p>
    </div>
    """
    message = MessageSchema(
        subject="GymApp coach application update",
        recipients=[email],
        body=html_body,
        subtype=MessageType.html,
    )
    await _get_fastmail().send_message(message)


# ── File upload ────────────────────────────────────────────────────────────────

def save_certification(file_bytes: bytes, original_filename: str) -> str:
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    ext = Path(original_filename).suffix.lower()
    unique_name = f"{secrets.token_hex(16)}{ext}"
    (upload_dir / unique_name).write_bytes(file_bytes)
    return unique_name
