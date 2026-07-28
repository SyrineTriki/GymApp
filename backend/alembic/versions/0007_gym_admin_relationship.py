"""gym-admin relationship: gym owner/location/price, admin.gym_id

Revision ID: 0007
Revises: 0006
Create Date: 2026-07-28

"""
from typing import Sequence, Union

from alembic import op

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # New gym fields — added with temporary defaults so this is safe even if the
    # gyms table already has rows from the previous (address/phone/capacity) shape.
    op.execute("ALTER TABLE gyms ADD COLUMN IF NOT EXISTS owner_name VARCHAR(150) NOT NULL DEFAULT 'Unknown'")
    op.execute("ALTER TABLE gyms ADD COLUMN IF NOT EXISTS location VARCHAR(255) NOT NULL DEFAULT 'Unknown'")
    op.execute("ALTER TABLE gyms ADD COLUMN IF NOT EXISTS price_per_month NUMERIC(10, 2) NOT NULL DEFAULT 0")

    # Drop the old gym fields this replaces.
    op.execute("ALTER TABLE gyms DROP COLUMN IF EXISTS address")
    op.execute("ALTER TABLE gyms DROP COLUMN IF EXISTS phone")
    op.execute("ALTER TABLE gyms DROP COLUMN IF EXISTS capacity")

    # Every admin belongs to exactly one gym; a gym can have many admins.
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES gyms(id) ON DELETE SET NULL")


def downgrade() -> None:
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS gym_id")
    op.execute("ALTER TABLE gyms ADD COLUMN IF NOT EXISTS address VARCHAR(255)")
    op.execute("ALTER TABLE gyms ADD COLUMN IF NOT EXISTS phone VARCHAR(30)")
    op.execute("ALTER TABLE gyms ADD COLUMN IF NOT EXISTS capacity INTEGER")
    op.execute("ALTER TABLE gyms DROP COLUMN IF EXISTS price_per_month")
    op.execute("ALTER TABLE gyms DROP COLUMN IF EXISTS location")
    op.execute("ALTER TABLE gyms DROP COLUMN IF EXISTS owner_name")
