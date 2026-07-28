"""add gyms table

Revision ID: 0006
Revises: 0005
Create Date: 2026-07-28

"""
from typing import Sequence, Union

from alembic import op

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # IF NOT EXISTS: Base.metadata.create_all() on app startup may already have
    # created this table from the updated models.py before this migration runs.
    op.execute("""
        CREATE TABLE IF NOT EXISTS gyms (
            id UUID NOT NULL PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            address VARCHAR(255),
            phone VARCHAR(30),
            capacity INTEGER,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
        )
    """)


def downgrade() -> None:
    op.drop_table("gyms")
