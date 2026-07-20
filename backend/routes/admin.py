from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from auth_utils import get_current_user, require_role, hash_password, send_coach_approval_email, send_coach_rejection_email
from database import get_db
from models import User, CoachProfile, AthleteProfile, RoleEnum, CoachStatusEnum
from schemas import CoachResponse, AthleteResponse, UserResponse, CoachApprovalRequest, DashboardStats, MessageResponse, CreateAdminRequest

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Dashboard stats ────────────────────────────────────────────────────────────

@router.get("/stats", response_model=DashboardStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin", "super_admin")),
):
    athletes  = await db.execute(select(func.count()).where(User.role == RoleEnum.athlete))
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

@router.get("/athletes", response_model=list[AthleteResponse])
async def list_athletes(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin", "super_admin")),
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
