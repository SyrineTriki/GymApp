from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from auth_utils import require_role
from database import get_db
from models import WorkoutPlan, PlanExercise, Exercise
from schemas import (
    PlanCreateRequest, PlanUpdateRequest, PlanResponse, PlanSummaryResponse,
    PlanExerciseResponse, ExerciseSummary,
)

router = APIRouter(prefix="/plans", tags=["plans"])


def _exercise_summary(e: Exercise) -> ExerciseSummary:
    return ExerciseSummary(
        id=e.id, name=e.name, body_part=e.body_part, equipment=e.equipment,
        target_muscle=e.target_muscle, image_filename=e.image_filename,
    )


def _plan_response(plan: WorkoutPlan) -> PlanResponse:
    return PlanResponse(
        id=str(plan.id), name=plan.name, description=plan.description,
        created_at=plan.created_at.isoformat(), updated_at=plan.updated_at.isoformat(),
        exercises=[
            PlanExerciseResponse(
                id=str(pe.id), exercise=_exercise_summary(pe.exercise), order_index=pe.order_index,
                sets=pe.sets, reps=pe.reps, rest_seconds=pe.rest_seconds, notes=pe.notes,
            )
            for pe in plan.exercises
        ],
    )


async def _get_owned_plan(db: AsyncSession, plan_id: str, athlete_id) -> WorkoutPlan:
    result = await db.execute(
        select(WorkoutPlan)
        .options(selectinload(WorkoutPlan.exercises).selectinload(PlanExercise.exercise))
        .where(WorkoutPlan.id == plan_id, WorkoutPlan.athlete_id == athlete_id)
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found.")
    return plan


async def _validate_exercise_ids(db: AsyncSession, exercise_ids: list[str]) -> None:
    if not exercise_ids:
        return
    result = await db.execute(select(Exercise.id).where(Exercise.id.in_(set(exercise_ids))))
    found = {r[0] for r in result.all()}
    missing = set(exercise_ids) - found
    if missing:
        raise HTTPException(status_code=400, detail=f"Unknown exercise id(s): {', '.join(sorted(missing))}")


# ── List (own plans) ──────────────────────────────────────────────────────────

@router.get("", response_model=list[PlanSummaryResponse])
async def list_plans(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("athlete")),
):
    result = await db.execute(
        select(WorkoutPlan)
        .options(selectinload(WorkoutPlan.exercises))
        .where(WorkoutPlan.athlete_id == current_user.id)
        .order_by(WorkoutPlan.updated_at.desc())
    )
    plans = result.scalars().all()
    return [
        PlanSummaryResponse(
            id=str(p.id), name=p.name, description=p.description,
            exercise_count=len(p.exercises), updated_at=p.updated_at.isoformat(),
        )
        for p in plans
    ]


# ── Create ─────────────────────────────────────────────────────────────────────

@router.post("", response_model=PlanResponse, status_code=201)
async def create_plan(
    body: PlanCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("athlete")),
):
    await _validate_exercise_ids(db, [e.exercise_id for e in body.exercises])

    plan = WorkoutPlan(athlete_id=current_user.id, name=body.name, description=body.description)
    plan.exercises = [
        PlanExercise(
            exercise_id=item.exercise_id, order_index=i, sets=item.sets,
            reps=item.reps, rest_seconds=item.rest_seconds, notes=item.notes,
        )
        for i, item in enumerate(body.exercises)
    ]
    db.add(plan)
    await db.commit()
    return _plan_response(await _get_owned_plan(db, str(plan.id), current_user.id))


# ── Detail ─────────────────────────────────────────────────────────────────────

@router.get("/{plan_id}", response_model=PlanResponse)
async def get_plan(
    plan_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("athlete")),
):
    plan = await _get_owned_plan(db, plan_id, current_user.id)
    return _plan_response(plan)


# ── Update ─────────────────────────────────────────────────────────────────────
# When `exercises` is provided it fully replaces the plan's exercise list (this is
# what the mobile routine-builder sends on every save — simplest way to support
# reordering, add, remove and edit in one round trip).

@router.put("/{plan_id}", response_model=PlanResponse)
async def update_plan(
    plan_id: str,
    body: PlanUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("athlete")),
):
    plan = await _get_owned_plan(db, plan_id, current_user.id)

    if body.name is not None:
        plan.name = body.name
    if body.description is not None:
        plan.description = body.description
    if body.exercises is not None:
        await _validate_exercise_ids(db, [e.exercise_id for e in body.exercises])
        plan.exercises = [
            PlanExercise(
                exercise_id=item.exercise_id, order_index=i, sets=item.sets,
                reps=item.reps, rest_seconds=item.rest_seconds, notes=item.notes,
            )
            for i, item in enumerate(body.exercises)
        ]

    await db.commit()
    return _plan_response(await _get_owned_plan(db, plan_id, current_user.id))


# ── Delete ─────────────────────────────────────────────────────────────────────

@router.delete("/{plan_id}")
async def delete_plan(
    plan_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("athlete")),
):
    plan = await _get_owned_plan(db, plan_id, current_user.id)
    await db.delete(plan)
    await db.commit()
    return {"message": f"'{plan.name}' deleted."}
