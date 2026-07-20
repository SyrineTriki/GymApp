"""switch to 6-digit verification code

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-27

"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remove old token column
    op.drop_column("users", "verification_token")

    # Add new code columns
    op.add_column("users", sa.Column("verification_code", sa.String(6), nullable=True))
    op.add_column("users", sa.Column("verification_code_expires_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "verification_code_expires_at")
    op.drop_column("users", "verification_code")
    op.add_column("users", sa.Column("verification_token", sa.String(255), nullable=True))