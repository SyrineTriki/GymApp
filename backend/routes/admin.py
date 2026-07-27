from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from auth_utils import (
    get_current_user, require_role, hash_password, send_coach_approval_email, send_coach_rejection_email,
    generate_otp, otp_expiry, generate_temp_password, send_admin_created_athlete_email,
)
from database import get_db
from models import User, CoachProfile, AthleteProfile, RoleEnum, CoachStatusEnum, Food, FoodTrendEnum
from schemas import (
    CoachResponse, AthleteResponse, UserResponse, CoachApprovalRequest, DashboardStats, MessageResponse,
    CreateAdminRequest, AdminCreateAthleteRequest, FoodCreateRequest, FoodUpdateRequest, FoodResponse,
)

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Dashboard stats ────────────────────────────────────────────────────────────

@router.get("/stats", response_model=DashboardStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin", "super_admin")),
):
    athlete_query = select(func.count()).where(User.role == RoleEnum.athlete)
    if current_user.role == RoleEnum.admin:
        athlete_query = athlete_query.where(User.created_by == current_user.id)
    athletes  = await db.execute(athlete_query)
    coaches   = await db.execute(select(func.count()).where(User.role == RoleEnum.coach))
    pending   = await db.execute(select(func.count()).select_from(CoachProfile).where(CoachProfile.status == CoachStatusEnum.pending))
    approved  = await db.execute(select(func.count()).select_from(CoachProfile).where(CoachProfile.status == CoachStatusEnum.approved))
    rejected  = await db.execute(select(func.count()).select_from(CoachProfile).where(CoachProfile.status == CoachStatusEnum.rejected))

    stats = {
        "total_athletes":   athletes.scalar(),
        "total_coaches":    coaches.scalar(),
        "pending_coaches":  pending.scalar(),
        "approved_coaches": approved.scalar(),
        "rejected_coaches": rejected.scalar(),
    }

    if current_user.role == RoleEnum.super_admin:
        admins = await db.execute(select(func.count()).where(User.role == RoleEnum.admin))
        stats["total_admins"] = admins.scalar()

    return stats


# ── List coaches (with status filter) ─────────────────────────────────────────

@router.get("/coaches", response_model=list[CoachResponse])
async def list_coaches(
    status: str = "all",
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin", "super_admin")),
):
    query = (
        select(User, CoachProfile)
        .join(CoachProfile, CoachProfile.user_id == User.id)
        .where(User.role == RoleEnum.coach)
    )
    if status != "all":
        try:
            status_enum = CoachStatusEnum(status)
            query = query.where(CoachProfile.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status filter.")

    result = await db.execute(query)
    rows = result.all()

    return [
        CoachResponse(
            id=str(user.id),
            name=user.name,
            email=user.email,
            is_verified=user.is_verified,
            created_at=user.created_at.isoformat(),
            status=coach.status.value,
            years_of_experience=coach.years_of_experience,
            bio=coach.bio,
            certification_filename=coach.certification_filename,
        )
        for user, coach in rows
    ]


# ── Approve / reject coach ────────────────────────────────────────────────────

@router.post("/coaches/{coach_id}/review", response_model=MessageResponse)
async def review_coach(
    coach_id: str,
    body: CoachApprovalRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin", "super_admin")),
):
    result = await db.execute(
        select(User, CoachProfile)
        .join(CoachProfile, CoachProfile.user_id == User.id)
        .where(User.id == coach_id, User.role == RoleEnum.coach)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Coach not found.")

    user, coach = row

    if body.action == "approve":
        coach.status = CoachStatusEnum.approved
        coach.rejection_reason = None
        await db.commit()
        await send_coach_approval_email(user.email, user.name)
        return {"message": f"{user.name}'s account has been approved."}
    else:
        if not body.reason:
            raise HTTPException(status_code=400, detail="Rejection reason is required.")
        coach.status = CoachStatusEnum.rejected
        coach.rejection_reason = body.reason
        await db.commit()
        await send_coach_rejection_email(user.email, user.name, body.reason)
        return {"message": f"{user.name}'s account has been rejected."}


# ── List athletes ──────────────────────────────────────────────────────────────
# Admins only see athletes they personally created; super_admins see everyone.

@router.get("/athletes", response_model=list[AthleteResponse])
async def list_athletes(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin", "super_admin")),
):
    query = select(User).where(User.role == RoleEnum.athlete)
    if current_user.role == RoleEnum.admin:
        query = query.where(User.created_by == current_user.id)

    result = await db.execute(query)
    users = result.scalars().all()
    return [
        AthleteResponse(
            id=str(u.id), name=u.name, email=u.email,
            is_verified=u.is_verified, created_at=u.created_at.isoformat(),
        )
        for u in users
    ]


# ── Admin creates an athlete account on their behalf ───────────────────────────
# Account stays inactive (is_verified=False) until the athlete verifies their email.

@router.post("/athletes", response_model=MessageResponse, status_code=201)
async def admin_create_athlete(
    body: AdminCreateAthleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin", "super_admin")),
):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already in use.")

    temp_password = generate_temp_password()
    code = generate_otp()

    user = User(
        name=body.name,
        email=body.email,
        hashed_password=hash_password(temp_password),
        role=RoleEnum.athlete,
        is_verified=False,
        created_by=current_user.id,
        verification_code=code,
        verification_code_expires_at=otp_expiry(),
    )
    db.add(user)
    await db.flush()
    db.add(AthleteProfile(user_id=user.id))
    await db.commit()

    await send_admin_created_athlete_email(body.email, body.name, code, temp_password)
    return {"message": f"Athlete account created for {body.name}. They must verify their email to activate it."}


# ── Delete user (admin or super_admin only) ───────────────────────────────────

@router.delete("/users/{user_id}", response_model=MessageResponse)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin", "super_admin")),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.role in (RoleEnum.admin, RoleEnum.super_admin) and current_user.role != RoleEnum.super_admin:
        raise HTTPException(status_code=403, detail="Only super admins can delete admin accounts.")
    await db.delete(user)
    await db.commit()
    return {"message": f"User {user.name} deleted."}


# ── Food database ────────────────────────────────────────────────────────────
# Shared by admins and super_admins; any admin can manage the shared catalog.

def _food_response(f: Food) -> FoodResponse:
    return FoodResponse(
        id=str(f.id),
        name=f.name,
        category=f.category.value,
        price=float(f.price),
        currency=f.currency,
        unit=f.unit,
        trend=f.trend.value,
        updated_at=f.updated_at.isoformat(),
    )


@router.get("/food", response_model=list[FoodResponse])
async def list_food(
    category: str = "all",
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin", "super_admin")),
):
    query = select(Food)
    if category != "all":
        try:
            query = query.where(Food.category == category)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid category filter.")
    query = query.order_by(Food.name)
    result = await db.execute(query)
    return [_food_response(f) for f in result.scalars().all()]


@router.post("/food", response_model=FoodResponse, status_code=201)
async def create_food(
    body: FoodCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin", "super_admin")),
):
    food = Food(
        name=body.name,
        category=body.category,
        price=body.price,
        currency=body.currency,
        unit=body.unit,
        trend=FoodTrendEnum.flat,
        created_by=current_user.id,
    )
    db.add(food)
    await db.commit()
    await db.refresh(food)
    return _food_response(food)


@router.put("/food/{food_id}", response_model=FoodResponse)
async def update_food(
    food_id: str,
    body: FoodUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin", "super_admin")),
):
    result = await db.execute(select(Food).where(Food.id == food_id))
    food = result.scalar_one_or_none()
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found.")

    if body.price is not None and float(food.price) != body.price:
        food.trend = FoodTrendEnum.up if body.price > float(food.price) else FoodTrendEnum.down
        food.price = body.price
    if body.name is not None:
        food.name = body.name
    if body.category is not None:
        food.category = body.category
    if body.currency is not None:
        food.currency = body.currency
    if body.unit is not None:
        food.unit = body.unit

    await db.commit()
    await db.refresh(food)
    return _food_response(food)


@router.delete("/food/{food_id}", response_model=MessageResponse)
async def delete_food(
    food_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin", "super_admin")),
):
    result = await db.execute(select(Food).where(Food.id == food_id))
    food = result.scalar_one_or_none()
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found.")
    await db.delete(food)
    await db.commit()
    return {"message": f"{food.name} deleted."}
