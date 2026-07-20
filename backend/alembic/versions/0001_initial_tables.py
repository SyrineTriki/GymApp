"""initial tables

Revision ID: 0001
Revises:
Create Date: 2026-06-24

"""
from typing import Sequence, Union
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── RoleEnum type ──────────────────────────────────────────────────────────
    role_enum = postgresql.ENUM("athlete", "coach", name="roleenum", create_type=True)
    role_enum.create(op.get_bind(), checkfirst=True)

    # ── users ──────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("date_of_birth", sa.Date(), nullable=False),
        sa.Column("role", sa.Enum("athlete", "coach", name="roleenum"), nullable=False),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("verification_token", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    # ── athlete_profiles ───────────────────────────────────────────────────────
    op.create_table(
        "athlete_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
    )

    # ── coach_profiles ─────────────────────────────────────────────────────────
    op.create_table(
        "coach_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("years_of_experience", sa.Integer(), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("certification_filename", sa.String(255), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("coach_profiles")
    op.drop_table("athlete_profiles")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS roleenum")
