"""add gym latitude/longitude

Revision ID: 0008
Revises: 0007
Create Date: 2026-07-28

"""
from typing import Sequence, Union

from alembic import op

revision: str = "0008"
down_revision: Union[str, None] = "0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE gyms ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7)")
    op.execute("ALTER TABLE gyms ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7)")


def downgrade() -> None:
    op.execute("ALTER TABLE gyms DROP COLUMN IF EXISTS longitude")
    op.execute("ALTER TABLE gyms DROP COLUMN IF EXISTS latitude")
