"""add exercise library and athlete workout plans

Revision ID: 0010
Revises: 0009
Create Date: 2026-08-19

"""
from typing import Sequence, Union

from alembic import op

revision: str = "0010"
down_revision: Union[str, None] = "0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # IF NOT EXISTS: Base.metadata.create_all() on app startup may already have
    # created these tables from the updated models.py before this migration runs.
    op.execute("""
        CREATE TABLE IF NOT EXISTS exercises (
            id VARCHAR(10) NOT NULL PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            body_part VARCHAR(50) NOT NULL,
            equipment VARCHAR(50) NOT NULL,
            target_muscle VARCHAR(50) NOT NULL,
            secondary_muscles VARCHAR[] NOT NULL DEFAULT '{}',
            instructions TEXT[] NOT NULL DEFAULT '{}',
            image_filename VARCHAR(120),
            gif_filename VARCHAR(120)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_exercises_name ON exercises (name)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_exercises_body_part ON exercises (body_part)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_exercises_equipment ON exercises (equipment)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS workout_plans (
            id UUID NOT NULL PRIMARY KEY,
            athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(150) NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_workout_plans_athlete_id ON workout_plans (athlete_id)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS plan_exercises (
            id UUID NOT NULL PRIMARY KEY,
            plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
            exercise_id VARCHAR(10) NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
            order_index INTEGER NOT NULL DEFAULT 0,
            sets INTEGER NOT NULL DEFAULT 3,
            reps VARCHAR(20) NOT NULL DEFAULT '10',
            rest_seconds INTEGER,
            notes TEXT
        )
    """)


def downgrade() -> None:
    op.drop_table("plan_exercises")
    op.drop_table("workout_plans")
    op.drop_table("exercises")
