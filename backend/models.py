import enum
import uuid
from datetime import datetime, date
from sqlalchemy import (
    Column, String, Boolean, DateTime, Date, Integer,
    Text, Enum as SAEnum, ForeignKey, Numeric
)
from sqlalchemy.dialects.postgresql import UUID
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

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Set when an admin creates the account on the athlete's behalf (vs. self-registration).
    # Admins can only see/manage athletes where created_by == their own id.
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

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
