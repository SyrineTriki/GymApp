from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth_utils import (
    generate_otp, otp_expiry, hash_password, verify_password,
    save_certification, send_verification_email, create_access_token,
    send_password_reset_email,
)
from database import get_db
from models import AthleteProfile, CoachProfile, CoachStatusEnum, RoleEnum, User
from schemas import (
    MessageResponse, VerifyCodeRequest, ResendCodeRequest,
    AdminForgotPasswordRequest, AdminResetPasswordRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])

ALLOWED_CERT_TYPES = {"application/pdf", "image/jpeg", "image/png"}
MAX_CERT_SIZE_MB = 5


async def _email_taken(db: AsyncSession, email: str) -> bool:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none() is not None


# ── Register Athlete — Step 1: send OTP ───────────────────────────────────────

@router.post("/register/athlete/send-code", response_model=MessageResponse, status_code=201)
async def athlete_send_code(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    date_of_birth: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    from schemas import AthleteRegisterRequest
    try:
        data = AthleteRegisterRequest(name=name, email=email, password=password, date_of_birth=date_of_birth)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    existing = await db.execute(select(User).where(User.email == data.email))
    existing_user = existing.scalar_one_or_none()

    code = generate_otp()

    if existing_user:
        if existing_user.is_verified:
            raise HTTPException(status_code=409, detail="An account with this email already exists.")
        # Resend code to unverified user, update password in case they changed it
        existing_user.name            = data.name
        existing_user.hashed_password = hash_password(data.password)
        existing_user.date_of_birth   = data.date_of_birth
        existing_user.verification_code = code
        existing_user.verification_code_expires_at = otp_expiry()
        await db.commit()
    else:
        user = User(
            name=data.name, email=data.email,
            hashed_password=hash_password(data.password),
            date_of_birth=data.date_of_birth,
            role=RoleEnum.athlete,
            verification_code=code,
            verification_code_expires_at=otp_expiry(),
        )
        db.add(user)
        await db.flush()
        db.add(AthleteProfile(user_id=user.id))
        await db.commit()

    await send_verification_email(data.email, data.name, code)
    return {"message": "Verification code sent to your email."}


# ── Register Coach — Step 1: send OTP ─────────────────────────────────────────

@router.post("/register/coach/send-code", response_model=MessageResponse, status_code=201)
async def coach_send_code(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    date_of_birth: str = Form(...),
    years_of_experience: Optional[int] = Form(None),
    bio: Optional[str] = Form(None),
    certification: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
):
    from schemas import CoachRegisterRequest
    try:
        data = CoachRegisterRequest(
            name=name, email=email, password=password, date_of_birth=date_of_birth,
            years_of_experience=years_of_experience, bio=bio,
        )
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    existing = await db.execute(select(User).where(User.email == data.email))
    existing_user = existing.scalar_one_or_none()

    cert_filename: Optional[str] = None
    if certification and certification.filename:
        if certification.content_type not in ALLOWED_CERT_TYPES:
            raise HTTPException(status_code=400, detail="Certification must be PDF, JPEG, or PNG.")
        file_bytes = await certification.read()
        if len(file_bytes) > MAX_CERT_SIZE_MB * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"File must be under {MAX_CERT_SIZE_MB} MB.")
        cert_filename = save_certification(file_bytes, certification.filename)

    code = generate_otp()

    if existing_user:
        if existing_user.is_verified:
            raise HTTPException(status_code=409, detail="An account with this email already exists.")
        existing_user.name            = data.name
        existing_user.hashed_password = hash_password(data.password)
        existing_user.date_of_birth   = data.date_of_birth
        existing_user.verification_code = code
        existing_user.verification_code_expires_at = otp_expiry()
        if existing_user.coach_profile:
            existing_user.coach_profile.years_of_experience = data.years_of_experience
            existing_user.coach_profile.bio = data.bio
            if cert_filename:
                existing_user.coach_profile.certification_filename = cert_filename
        await db.commit()
    else:
        user = User(
            name=data.name, email=data.email,
            hashed_password=hash_password(data.password),
            date_of_birth=data.date_of_birth,
            role=RoleEnum.coach,
            verification_code=code,
            verification_code_expires_at=otp_expiry(),
        )
        db.add(user)
        await db.flush()
        db.add(CoachProfile(
            user_id=user.id,
            years_of_experience=data.years_of_experience,
            bio=data.bio,
            certification_filename=cert_filename,
            status=CoachStatusEnum.pending,
        ))
        await db.commit()

    await send_verification_email(data.email, data.name, code)
    return {"message": "Verification code sent to your email."}


# ── Verify OTP — Step 2 ────────────────────────────────────────────────────────

@router.post("/verify-code", response_model=MessageResponse)
async def verify_code(body: VerifyCodeRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.is_verified:
        return {"message": "Email already verified."}
    if user.verification_code != body.code:
        raise HTTPException(status_code=400, detail="Invalid verification code.")
    if not user.verification_code_expires_at or datetime.utcnow() > user.verification_code_expires_at:
        raise HTTPException(status_code=400, detail="Verification code has expired.")

    user.is_verified = True
    user.verification_code = None
    user.verification_code_expires_at = None
    await db.commit()

    msg = "Email verified! Your account is now active." if user.role == RoleEnum.athlete else \
          "Email verified! Your coach application is pending admin approval."
    return {"message": msg}


# ── Resend OTP ─────────────────────────────────────────────────────────────────

@router.post("/resend-code", response_model=MessageResponse)
async def resend_code(body: ResendCodeRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified.")

    code = generate_otp()
    user.verification_code = code
    user.verification_code_expires_at = otp_expiry()
    await db.commit()
    await send_verification_email(user.email, user.name, code)
    return {"message": "New verification code sent."}


# ── Login ──────────────────────────────────────────────────────────────────────

@router.post("/login")
async def login(
    username: str = Form(...),
    password: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your email first.")

    # Coach must be approved
    if user.role == RoleEnum.coach:
        if user.coach_profile and user.coach_profile.status == CoachStatusEnum.pending:
            raise HTTPException(status_code=403, detail="Your coach account is pending admin approval.")
        if user.coach_profile and user.coach_profile.status == CoachStatusEnum.rejected:
            raise HTTPException(status_code=403, detail="Your coach account was rejected.")

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return {"access_token": token, "token_type": "bearer", "role": user.role.value, "name": user.name}


# ── Admin/super_admin forgot password — Step 1: send reset code ────────────────
# Scoped to admin & super_admin only (coach/athlete accounts don't use this flow).
# Always returns the same generic message so emails can't be enumerated.

_GENERIC_FORGOT_MSG = "If an admin account exists with that email, a reset code has been sent."


@router.post("/admin/forgot-password", response_model=MessageResponse)
async def admin_forgot_password(body: AdminForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user and user.role in (RoleEnum.admin, RoleEnum.super_admin) and user.is_verified:
        code = generate_otp()
        user.reset_password_code = code
        user.reset_password_code_expires_at = otp_expiry()
        await db.commit()
        await send_password_reset_email(user.email, user.name, code)

    return {"message": _GENERIC_FORGOT_MSG}


# ── Admin/super_admin forgot password — Step 2: verify code + set new password ─

@router.post("/admin/reset-password", response_model=MessageResponse)
async def admin_reset_password(body: AdminResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or user.role not in (RoleEnum.admin, RoleEnum.super_admin):
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")
    if not user.reset_password_code or user.reset_password_code != body.code:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")
    if not user.reset_password_code_expires_at or datetime.utcnow() > user.reset_password_code_expires_at:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")

    user.hashed_password = hash_password(body.new_password)
    user.reset_password_code = None
    user.reset_password_code_expires_at = None
    await db.commit()

    return {"message": "Password updated. You can now sign in with your new password."}