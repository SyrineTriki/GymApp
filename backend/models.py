import enum
import uuid
from datetime import datetime, date
from sqlalchemy import (
    Column, String, Boolean, DateTime, Date, Integer,
    Text, Enum as SAEnum, ForeignKey, Numeric
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from database import Base


class RoleEnum(str, enum.Enum):
    athlete     = "athlete"
    coach       = "coach"
    admin       = "admin"
    super_admin = "super_admin"


class CoachStatusEnum(str, enum.Enum):
    pending  = "pending"   # waiting for admin approval
    approved = "approved"
    rejected = "rejected"


class FoodCategoryEnum(str, enum.Enum):
    protein    = "protein"
    carbs      = "carbs"
    fats       = "fats"
    produce    = "produce"
    dairy      = "dairy"
    supplement = "supplement"


class FoodTrendEnum(str, enum.Enum):
    up   = "up"
    down = "down"
    flat = "flat"


class User(Base):
    __tablename__ = "users"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name             = Column(String(150), nullable=False)
    email            = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password  = Column(String(255), nullable=False)
    date_of_birth    = Column(Date, nullable=True)   # nullable for admin/super_admin
    role             = Column(SAEnum(RoleEnum), nullable=False)

    is_verified              = Column(Boolean, default=False, nullable=False)
    verification_code        = Column(String(6),   nullable=True)   # 6-digit OTP
    verification_code_expires_at = Column(DateTime, nullable=True)

    reset_password_code = Column(String(10), nullable=True)
    reset_password_code_expires_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Set when an admin creates the account on the athlete's behalf (vs. self-registration).
    # Admins can only see/manage athletes where created_by == their own id.
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Every admin belongs to exactly one gym (set at admin-account creation time).
    gym_id = Column(UUID(as_uuid=True), ForeignKey("gyms.id", ondelete="SET NULL"), nullable=True)
    gym = relationship("Gym", back_populates="admins", foreign_keys=[gym_id])

    athlete_profile = relationship("AthleteProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    coach_profile   = relationship("CoachProfile",   back_populates="user", uselist=False, cascade="all, delete-orphan")


class AthleteProfile(Base):
    __tablename__ = "athlete_profiles"

    id      = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    user = relationship("User", back_populates="athlete_profile")


class CoachProfile(Base):
    __tablename__ = "coach_profiles"

    id      = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    years_of_experience    = Column(Integer,      nullable=True)
    bio                    = Column(Text,         nullable=True)
    certification_filename = Column(String(255),  nullable=True)
    status = Column(SAEnum(CoachStatusEnum), default=CoachStatusEnum.pending, nullable=False)
    rejection_reason       = Column(Text,         nullable=True)

    user = relationship("User", back_populates="coach_profile")


class Food(Base):
    __tablename__ = "foods"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name       = Column(String(150), nullable=False)
    category   = Column(SAEnum(FoodCategoryEnum), nullable=False)
    price      = Column(Numeric(10, 2), nullable=False)
    currency   = Column(String(10), nullable=False, default="TND")
    unit       = Column(String(30), nullable=False)    # e.g. "kg", "500 g", "L", "12"
    trend      = Column(SAEnum(FoodTrendEnum), nullable=False, default=FoodTrendEnum.flat)

    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Gym(Base):
    __tablename__ = "gyms"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name             = Column(String(150), nullable=False)
    owner_name       = Column(String(150), nullable=False)
    location         = Column(String(255), nullable=False)
    price_per_month  = Column(Numeric(10, 2), nullable=False)   # athlete membership price
    latitude         = Column(Numeric(10, 7), nullable=True)
    longitude        = Column(Numeric(10, 7), nullable=True)
    email            = Column(String(255), nullable=True)
    phone_number     = Column(String(30), nullable=True)

    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # A gym has one or more admins; every admin belongs to exactly one gym.
    admins = relationship("User", back_populates="gym", foreign_keys="User.gym_id")


# ── Exercise library ─────────────────────────────────────────────────────────
# Seeded at startup from data/exercises.json (the free exercise-db dataset also
# used by openGym). id is that dataset's own string id (e.g. "0001") so re-seeding
# is an idempotent upsert instead of a fresh set of UUIDs every deploy.

class Exercise(Base):
    __tablename__ = "exercises"

    id                = Column(String(10), primary_key=True)
    name              = Column(String(150), nullable=False, index=True)
    body_part         = Column(String(50), nullable=False, index=True)
    equipment         = Column(String(50), nullable=False, index=True)
    target_muscle     = Column(String(50), nullable=False)
    secondary_muscles = Column(ARRAY(String), nullable=False, default=list)
    instructions      = Column(ARRAY(Text), nullable=False, default=list)
    image_filename    = Column(String(120), nullable=True)
    gif_filename      = Column(String(120), nullable=True)


# ── Plans (athlete-built routines) ───────────────────────────────────────────

class WorkoutPlan(Base):
    __tablename__ = "workout_plans"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    athlete_id  = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name        = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    exercises = relationship(
        "PlanExercise", back_populates="plan",
        cascade="all, delete-orphan", order_by="PlanExercise.order_index",
    )


class PlanExercise(Base):
    __tablename__ = "plan_exercises"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plan_id      = Column(UUID(as_uuid=True), ForeignKey("workout_plans.id", ondelete="CASCADE"), nullable=False)
    exercise_id  = Column(String(10), ForeignKey("exercises.id", ondelete="RESTRICT"), nullable=False)
    order_index  = Column(Integer, nullable=False, default=0)
    sets         = Column(Integer, nullable=False, default=3)
    reps         = Column(String(20), nullable=False, default="10")   # free text: "10", "8-12", "AMRAP"
    rest_seconds = Column(Integer, nullable=True)
    notes        = Column(Text, nullable=True)

    plan     = relationship("WorkoutPlan", back_populates="exercises")
    exercise = relationship("Exercise")