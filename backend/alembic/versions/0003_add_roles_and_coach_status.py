"""add admin roles and coach approval status

Revision ID: 0003
Revises: 0002
Create Date: 2026-07-04

"""
from typing import Sequence, Union
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. Add admin / super_admin to roleenum ────────────────────────────────
    # Must commit between ADD VALUE calls in PostgreSQL < 14
    op.execute("ALTER TYPE roleenum ADD VALUE IF NOT EXISTS 'admin'")
    op.execute("ALTER TYPE roleenum ADD VALUE IF NOT EXISTS 'super_admin'")

    # ── 2. Create coachstatusenum (safe, won't fail if already exists) ────────
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE coachstatusenum AS ENUM ('pending', 'approved', 'rejected');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # ── 3. Make date_of_birth nullable (admins won't have one) ───────────────
    op.execute("ALTER TABLE users ALTER COLUMN date_of_birth DROP NOT NULL")

    # ── 4. Drop old verification_token if it still exists ────────────────────
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS verification_token")

    # ── 5. Add coach status column (safe, won't fail if already exists) ──────
    op.execute("""
        DO $$ BEGIN
            ALTER TABLE coach_profiles
                ADD COLUMN status coachstatusenum NOT NULL DEFAULT 'pending';
        EXCEPTION
            WHEN duplicate_column THEN null;
        END $$;
    """)

    # ── 6. Add rejection_reason column (safe) ────────────────────────────────
    op.execute("ALTER TABLE coach_profiles ADD COLUMN IF NOT EXISTS rejection_reason TEXT")


def downgrade() -> None:
    op.execute("ALTER TABLE coach_profiles DROP COLUMN IF EXISTS rejection_reason")
    op.execute("ALTER TABLE coach_profiles DROP COLUMN IF EXISTS status")
    op.execute("ALTER TABLE users ALTER COLUMN date_of_birth SET NOT NULL")