"""add gym email and phone number

Revision ID: 0009
Revises: 0008
Create Date: 2026-07-28

"""
from typing import Sequence, Union

from alembic import op

revision: str = "0009"
down_revision: Union[str, None] = "0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE gyms ADD COLUMN IF NOT EXISTS email VARCHAR(255)")
    op.execute("ALTER TABLE gyms ADD COLUMN IF NOT EXISTS phone_number VARCHAR(30)")


def downgrade() -> None:
    op.execute("ALTER TABLE gyms DROP COLUMN IF EXISTS phone_number")
    op.execute("ALTER TABLE gyms DROP COLUMN IF EXISTS email")
