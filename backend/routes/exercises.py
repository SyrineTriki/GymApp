from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, distinct
from sqlalchemy.ext.asyncio import AsyncSession

from auth_utils import get_current_user
from database import get_db
from models import Exercise
from schemas import ExerciseResponse, ExerciseSummary, ExerciseListResponse, ExerciseFiltersResponse

router = APIRouter(prefix="/exercises", tags=["exercises"])


def _summary(e: Exercise) -> ExerciseSummary:
    return ExerciseSummary(
        id=e.id, name=e.name, body_part=e.body_part, equipment=e.equipment,
        target_muscle=e.target_muscle, image_filename=e.image_filename,
    )


# ── List / search / filter ────────────────────────────────────────────────────
# Any authenticated user can browse the shared exercise catalogue (it's read-only,
# no gym/role scoping needed).

@router.get("", response_model=ExerciseListResponse)
async def list_exercises(
    q: Optional[str] = None,
    body_part: Optional[str] = None,
    equipment: Optional[str] = None,
    limit: int = 30,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    limit = max(1, min(limit, 100))
    offset = max(0, offset)

    query = select(Exercise)
    if q:
        query = query.where(Exercise.name.ilike(f"%{q.strip()}%"))
    if body_part and body_part != "all":
        query = query.where(Exercise.body_part == body_part)
    if equipment and equipment != "all":
        query = query.where(Exercise.equipment == equipment)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()

    query = query.order_by(Exercise.name).limit(limit).offset(offset)
    result = await db.execute(query)
    items = result.scalars().all()

    return ExerciseListResponse(items=[_summary(e) for e in items], total=total, limit=limit, offset=offset)


# ── Filter chip options ───────────────────────────────────────────────────────

@router.get("/filters", response_model=ExerciseFiltersResponse)
async def get_filters(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    bp_result = await db.execute(select(distinct(Exercise.body_part)).order_by(Exercise.body_part))
    eq_result = await db.execute(select(distinct(Exercise.equipment)).order_by(Exercise.equipment))
    return ExerciseFiltersResponse(
        body_parts=[r[0] for r in bp_result.all()],
        equipment=[r[0] for r in eq_result.all()],
    )


# ── Detail ─────────────────────────────────────────────────────────────────────

@router.get("/{exercise_id}", response_model=ExerciseResponse)
async def get_exercise(
    exercise_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(Exercise).where(Exercise.id == exercise_id))
    ex = result.scalar_one_or_none()
    if not ex:
        raise HTTPException(status_code=404, detail="Exercise not found.")
    return ExerciseResponse(
        id=ex.id, name=ex.name, body_part=ex.body_part, equipment=ex.equipment,
        target_muscle=ex.target_muscle, image_filename=ex.image_filename,
        secondary_muscles=ex.secondary_muscles or [], instructions=ex.instructions or [],
        gif_filename=ex.gif_filename,
    )
