from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, cast, Date
from sqlalchemy.ext.asyncio import AsyncSession

from auth_utils import require_role, hash_password
from database import get_db
from models import User, RoleEnum, CoachProfile, CoachStatusEnum, Gym, Food, FoodCategoryEnum
from schemas import (
    CreateAdminRequest, AdminResponse, MessageResponse, AthleteResponse,
    GymCreateRequest, GymUpdateRequest, GymResponse,
    AnalyticsResponse, SignupPoint, CoachStatusBreakdown, FoodCategoryBreakdown,
)

router = APIRouter(prefix="/super-admin", tags=["super-admin"])


# ── List all admins (with their gym) ────────────────────────────────────────────

@router.get("/admins", response_model=list[AdminResponse])
async def list_admins(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin")),
):
    result = await db.execute(
        select(User, Gym.name)
        .outerjoin(Gym, User.gym_id == Gym.id)
        .where(User.role == RoleEnum.admin)
    )
    return [
        AdminResponse(
            id=str(a.id), name=a.name, email=a.email,
            is_verified=a.is_verified, created_at=a.created_at.isoformat(),
            gym_id=str(a.gym_id) if a.gym_id else None,
            gym_name=gym_name,
        )
        for a, gym_name in result.all()
    ]


# ── Create admin (must be assigned to an existing gym) ──────────────────────────

@router.post("/admins", response_model=MessageResponse, status_code=201)
async def create_admin(
    body: CreateAdminRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin")),
):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already in use.")

    gym_result = await db.execute(select(Gym).where(Gym.id == body.gym_id))
    gym = gym_result.scalar_one_or_none()
    if not gym:
        raise HTTPException(status_code=404, detail="Gym not found.")

    admin = User(
        name=body.name,
        email=body.email,
        hashed_password=hash_password(body.password),
        role=RoleEnum.admin,
        is_verified=True,   # admins don't need email verification
        gym_id=gym.id,
    )
    db.add(admin)
    await db.commit()
    return {"message": f"Admin account created for {body.name} at {gym.name}."}


# ── Reassign an admin to a different gym ────────────────────────────────────────

@router.put("/admins/{admin_id}/gym", response_model=MessageResponse)
async def reassign_admin_gym(
    admin_id: str,
    gym_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin")),
):
    admin_result = await db.execute(select(User).where(User.id == admin_id))
    admin = admin_result.scalar_one_or_none()
    if not admin or admin.role != RoleEnum.admin:
        raise HTTPException(status_code=404, detail="Admin not found.")

    gym_result = await db.execute(select(Gym).where(Gym.id == gym_id))
    gym = gym_result.scalar_one_or_none()
    if not gym:
        raise HTTPException(status_code=404, detail="Gym not found.")

    admin.gym_id = gym.id
    await db.commit()
    return {"message": f"{admin.name} moved to {gym.name}."}


# ── Delete admin ───────────────────────────────────────────────────────────────

@router.delete("/admins/{admin_id}", response_model=MessageResponse)
async def delete_admin(
    admin_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin")),
):
    result = await db.execute(select(User).where(User.id == admin_id))
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found.")
    if admin.role != RoleEnum.admin:
        raise HTTPException(status_code=400, detail="User is not an admin.")
    await db.delete(admin)
    await db.commit()
    return {"message": f"Admin {admin.name} deleted."}


# ── Users (all athletes, unscoped — super_admin sees everyone) ─────────────────

@router.get("/users", response_model=list[AthleteResponse])
async def list_all_users(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin")),
):
    result = await db.execute(select(User).where(User.role == RoleEnum.athlete))
    users = result.scalars().all()
    return [
        AthleteResponse(
            id=str(u.id), name=u.name, email=u.email,
            is_verified=u.is_verified, created_at=u.created_at.isoformat(),
        )
        for u in users
    ]


# ── Gyms ──────────────────────────────────────────────────────────────────────

def _gym_response(g: Gym, admin_count: int = 0) -> GymResponse:
    return GymResponse(
        id=str(g.id), name=g.name, owner_name=g.owner_name, location=g.location,
        price_per_month=float(g.price_per_month),
        latitude=float(g.latitude) if g.latitude is not None else None,
        longitude=float(g.longitude) if g.longitude is not None else None,
        admin_count=admin_count,
        created_at=g.created_at.isoformat(), updated_at=g.updated_at.isoformat(),
    )


@router.get("/gyms", response_model=list[GymResponse])
async def list_gyms(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin")),
):
    result = await db.execute(
        select(Gym, func.count(User.id))
        .outerjoin(User, (User.gym_id == Gym.id) & (User.role == RoleEnum.admin))
        .group_by(Gym.id)
        .order_by(Gym.name)
    )
    return [_gym_response(g, count) for g, count in result.all()]


@router.post("/gyms", response_model=GymResponse, status_code=201)
async def create_gym(
    body: GymCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin")),
):
    gym = Gym(
        name=body.name, owner_name=body.owner_name, location=body.location,
        price_per_month=body.price_per_month, latitude=body.latitude, longitude=body.longitude,
        created_by=current_user.id,
    )
    db.add(gym)
    await db.commit()
    await db.refresh(gym)
    return _gym_response(gym, admin_count=0)


@router.put("/gyms/{gym_id}", response_model=GymResponse)
async def update_gym(
    gym_id: str,
    body: GymUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin")),
):
    result = await db.execute(select(Gym).where(Gym.id == gym_id))
    gym = result.scalar_one_or_none()
    if not gym:
        raise HTTPException(status_code=404, detail="Gym not found.")

    if body.name is not None: gym.name = body.name
    if body.owner_name is not None: gym.owner_name = body.owner_name
    if body.location is not None: gym.location = body.location
    if body.price_per_month is not None: gym.price_per_month = body.price_per_month
    if body.latitude is not None: gym.latitude = body.latitude
    if body.longitude is not None: gym.longitude = body.longitude

    await db.commit()
    await db.refresh(gym)

    count = (await db.execute(
        select(func.count()).where(User.gym_id == gym.id, User.role == RoleEnum.admin)
    )).scalar() or 0
    return _gym_response(gym, admin_count=count)


@router.delete("/gyms/{gym_id}", response_model=MessageResponse)
async def delete_gym(
    gym_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin")),
):
    result = await db.execute(select(Gym).where(Gym.id == gym_id))
    gym = result.scalar_one_or_none()
    if not gym:
        raise HTTPException(status_code=404, detail="Gym not found.")

    admin_count = (await db.execute(
        select(func.count()).where(User.gym_id == gym.id, User.role == RoleEnum.admin)
    )).scalar() or 0
    if admin_count > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Can't delete {gym.name} — {admin_count} admin(s) are still assigned to it. Reassign them first.",
        )

    await db.delete(gym)
    await db.commit()
    return {"message": f"{gym.name} deleted."}


# ── Analytics ─────────────────────────────────────────────────────────────────
# Built from real data: signups are bucketed from each user's actual created_at,
# not synthetic/sample numbers.

@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin")),
):
    # Signups per day, last 30 days, split by role
    signup_rows = await db.execute(
        select(cast(User.created_at, Date).label("day"), User.role, func.count())
        .where(User.role.in_([RoleEnum.athlete, RoleEnum.coach]))
        .group_by("day", User.role)
        .order_by("day")
    )
    by_day: dict[str, dict[str, int]] = {}
    for day, role, count in signup_rows.all():
        key = day.isoformat()
        by_day.setdefault(key, {"athletes": 0, "coaches": 0})
        by_day[key]["athletes" if role == RoleEnum.athlete else "coaches"] = count
    signups_by_day = [
        SignupPoint(date=day, athletes=v["athletes"], coaches=v["coaches"])
        for day, v in sorted(by_day.items())
    ]

    # Coach approval funnel
    status_rows = await db.execute(
        select(CoachProfile.status, func.count()).group_by(CoachProfile.status)
    )
    status_counts = {s.value: 0 for s in CoachStatusEnum}
    for status, count in status_rows.all():
        status_counts[status.value] = count

    # Food catalog: count + average price per category
    food_rows = await db.execute(
        select(Food.category, func.count(), func.avg(Food.price)).group_by(Food.category)
    )
    food_breakdown = [
        FoodCategoryBreakdown(category=cat.value, count=count, avg_price=round(float(avg_price or 0), 2))
        for cat, count, avg_price in food_rows.all()
    ]

    total_gyms = (await db.execute(select(func.count()).select_from(Gym))).scalar() or 0
    total_admins = (await db.execute(
        select(func.count()).where(User.role == RoleEnum.admin)
    )).scalar() or 0

    return AnalyticsResponse(
        signups_by_day=signups_by_day,
        coach_status_breakdown=CoachStatusBreakdown(**status_counts),
        food_category_breakdown=food_breakdown,
        total_gyms=total_gyms,
        total_admins=total_admins,
    )