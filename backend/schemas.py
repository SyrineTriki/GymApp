from datetime import date
from typing import Optional, Literal, List
from uuid import UUID
from pydantic import BaseModel, EmailStr, field_validator
import re


class MessageResponse(BaseModel):
    message: str


# ── Auth ──────────────────────────────────────────────────────────────────────

class AthleteRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    date_of_birth: date

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v):
        v = v.strip()
        if len(v) < 2: raise ValueError("Name must be at least 2 characters.")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8: raise ValueError("Password must be at least 8 characters.")
        if not re.search(r"[A-Z]", v): raise ValueError("Add at least one uppercase letter.")
        if not re.search(r"\d", v): raise ValueError("Add at least one digit.")
        return v

    @field_validator("date_of_birth")
    @classmethod
    def must_be_adult(cls, v):
        from datetime import date as d
        age = (d.today() - v).days // 365
        if age < 14: raise ValueError("You must be at least 14 years old.")
        return v


class CoachRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    date_of_birth: date
    years_of_experience: Optional[int] = None
    bio: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v):
        v = v.strip()
        if len(v) < 2: raise ValueError("Name must be at least 2 characters.")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8: raise ValueError("Password must be at least 8 characters.")
        if not re.search(r"[A-Z]", v): raise ValueError("Add at least one uppercase letter.")
        if not re.search(r"\d", v): raise ValueError("Add at least one digit.")
        return v


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str


class ResendCodeRequest(BaseModel):
    email: EmailStr


class LoginRequest(BaseModel):
    username: str   # email
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str


# ── User responses ─────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    is_verified: bool
    created_at: str

    model_config = {"from_attributes": True}


class CoachResponse(BaseModel):
    id: str
    name: str
    email: str
    is_verified: bool
    created_at: str
    status: str
    years_of_experience: Optional[int] = None
    bio: Optional[str] = None
    certification_filename: Optional[str] = None

    model_config = {"from_attributes": True}


class AthleteResponse(BaseModel):
    id: str
    name: str
    email: str
    is_verified: bool
    created_at: str

    model_config = {"from_attributes": True}


# ── Admin actions ──────────────────────────────────────────────────────────────

class CoachApprovalRequest(BaseModel):
    action: Literal["approve", "reject"]
    reason: Optional[str] = None   # required when rejecting


class CreateAdminRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


# ── Stats ──────────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_athletes: int
    total_coaches: int
    pending_coaches: int
    approved_coaches: int
    rejected_coaches: int
    total_admins: Optional[int] = None
