from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth_utils import require_role, hash_password
from database import get_db
from models import User, RoleEnum
from schemas import CreateAdminRequest, MessageResponse, UserResponse

router = APIRouter(prefix="/super-admin", tags=["super-admin"])


# ── List all admins ────────────────────────────────────────────────────────────

@router.get("/admins", response_model=list[UserResponse])
async def list_admins(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin")),
):
    result = await db.execute(select(User).where(User.role == RoleEnum.admin))
    admins = result.scalars().all()
    return [
        UserResponse(
            id=str(a.id), name=a.name, email=a.email,
            role=a.role.value, is_verified=a.is_verified,
            created_at=a.created_at.isoformat(),
        )
        for a in admins
    ]


# ── Create admin ───────────────────────────────────────────────────────────────

@router.post("/admins", response_model=MessageResponse, status_code=201)
async def create_admin(
    body: CreateAdminRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin")),
):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already in use.")

    admin = User(
        name=body.name,
        email=body.email,
        hashed_password=hash_password(body.password),
        role=RoleEnum.admin,
        is_verified=True,   # admins don't need email verification
    )
    db.add(admin)
    await db.commit()
    return {"message": f"Admin account created for {body.name}."}


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
