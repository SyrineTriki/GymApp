"""add admin password reset fields

Revision ID: 0005
Revises: 0004
Create Date: 2026-07-27

"""
from typing import Sequence, Union

from alembic import op

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_code VARCHAR(10)")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_code_expires_at TIMESTAMP WITHOUT TIME ZONE")


def downgrade() -> None:
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS reset_password_code_expires_at")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS reset_password_code")
