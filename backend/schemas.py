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


class AdminForgotPasswordRequest(BaseModel):
    email: EmailStr


class AdminResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8: raise ValueError("Password must be at least 8 characters.")
        if not re.search(r"[A-Z]", v): raise ValueError("Add at least one uppercase letter.")
        if not re.search(r"\d", v): raise ValueError("Add at least one digit.")
        return v


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
    gym_id: str   # every admin belongs to exactly one gym


class AdminResponse(BaseModel):
    id: str
    name: str
    email: str
    is_verified: bool
    created_at: str
    gym_id: Optional[str] = None
    gym_name: Optional[str] = None

    model_config = {"from_attributes": True}


class AdminCreateAthleteRequest(BaseModel):
    name: str
    email: EmailStr

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v):
        v = v.strip()
        if len(v) < 2: raise ValueError("Name must be at least 2 characters.")
        return v


# ── Food database ────────────────────────────────────────────────────────────

class FoodCreateRequest(BaseModel):
    name: str
    category: Literal["protein", "carbs", "fats", "produce", "dairy", "supplement"]
    price: float
    currency: str = "TND"
    unit: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v):
        v = v.strip()
        if len(v) < 1: raise ValueError("Name is required.")
        return v

    @field_validator("price")
    @classmethod
    def price_positive(cls, v):
        if v <= 0: raise ValueError("Price must be greater than 0.")
        return v


class FoodUpdateRequest(BaseModel):
    name: Optional[str] = None
    category: Optional[Literal["protein", "carbs", "fats", "produce", "dairy", "supplement"]] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    unit: Optional[str] = None


class FoodResponse(BaseModel):
    id: str
    name: str
    category: str
    price: float
    currency: str
    unit: str
    trend: str
    updated_at: str

    model_config = {"from_attributes": True}


# ── Stats ──────────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_athletes: int
    total_coaches: int
    pending_coaches: int
    approved_coaches: int
    rejected_coaches: int
    total_admins: Optional[int] = None


# ── Gyms ──────────────────────────────────────────────────────────────────────

class GymCreateRequest(BaseModel):
    name: str
    owner_name: str
    location: str
    price_per_month: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    email: EmailStr
    phone_number: str

    @field_validator("name", "owner_name", "location", "phone_number")
    @classmethod
    def not_empty(cls, v):
        v = v.strip()
        if len(v) < 1: raise ValueError("This field is required.")
        return v

    @field_validator("price_per_month")
    @classmethod
    def price_positive(cls, v):
        if v <= 0: raise ValueError("Price per month must be greater than 0.")
        return v


class GymUpdateRequest(BaseModel):
    name: Optional[str] = None
    owner_name: Optional[str] = None
    location: Optional[str] = None
    price_per_month: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None


class GymResponse(BaseModel):
    id: str
    name: str
    owner_name: str
    location: str
    price_per_month: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    admin_count: int = 0
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


# ── Analytics ─────────────────────────────────────────────────────────────────

class SignupPoint(BaseModel):
    date: str
    athletes: int
    coaches: int


class CoachStatusBreakdown(BaseModel):
    pending: int
    approved: int
    rejected: int


class FoodCategoryBreakdown(BaseModel):
    category: str
    count: int
    avg_price: float


class AnalyticsResponse(BaseModel):
    signups_by_day: List[SignupPoint]
    coach_status_breakdown: CoachStatusBreakdown
    food_category_breakdown: List[FoodCategoryBreakdown]
    total_gyms: int
    total_admins: int


# ── Exercise library ──────────────────────────────────────────────────────────

class ExerciseSummary(BaseModel):
    id: str
    name: str
    body_part: str
    equipment: str
    target_muscle: str
    image_filename: Optional[str] = None

    model_config = {"from_attributes": True}


class ExerciseResponse(ExerciseSummary):
    secondary_muscles: List[str] = []
    instructions: List[str] = []
    gif_filename: Optional[str] = None


class ExerciseListResponse(BaseModel):
    items: List[ExerciseSummary]
    total: int
    limit: int
    offset: int


class ExerciseFiltersResponse(BaseModel):
    body_parts: List[str]
    equipment: List[str]


# ── Plans (routine builder) ──────────────────────────────────────────────────

class PlanExerciseInput(BaseModel):
    exercise_id: str
    sets: int = 3
    reps: str = "10"
    rest_seconds: Optional[int] = None
    notes: Optional[str] = None

    @field_validator("sets")
    @classmethod
    def sets_positive(cls, v):
        if v < 1: raise ValueError("Sets must be at least 1.")
        return v

    @field_validator("reps")
    @classmethod
    def reps_not_empty(cls, v):
        v = v.strip()
        if not v: raise ValueError("Reps is required.")
        return v


class PlanCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    exercises: List[PlanExerciseInput] = []

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v):
        v = v.strip()
        if len(v) < 1: raise ValueError("Plan name is required.")
        return v


class PlanUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    exercises: Optional[List[PlanExerciseInput]] = None   # when present, replaces the full exercise list (order preserved)


class PlanExerciseResponse(BaseModel):
    id: str
    exercise: ExerciseSummary
    order_index: int
    sets: int
    reps: str
    rest_seconds: Optional[int] = None
    notes: Optional[str] = None


class PlanResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    created_at: str
    updated_at: str
    exercises: List[PlanExerciseResponse] = []


class PlanSummaryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    exercise_count: int
    updated_at: str