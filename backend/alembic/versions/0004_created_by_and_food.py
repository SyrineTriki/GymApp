"""add created_by tracking and food database

Revision ID: 0004
Revises: 0003
Create Date: 2026-07-26

"""
import uuid
from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


SEED_FOODS = [
    # (name, category, price, unit)
    ("Chicken breast",        "protein",    17,  "kg"),
    ("Chicken thighs",        "protein",    11,  "kg"),
    ("Turkey breast",         "protein",    19,  "kg"),
    ("Lean beef",             "protein",    42,  "kg"),
    ("Salmon",                "protein",    65,  "kg"),
    ("Eggs",                  "protein",    5.5, "12"),
    ("Greek yogurt",          "dairy",      4.5, "500 g"),
    ("Whole milk",            "dairy",      2.3, "L"),
    ("Spaghetti",             "carbs",      2.5, "500 g"),
    ("Penne",                 "carbs",      2.8, "500 g"),
    ("White rice",            "carbs",      5.5, "kg"),
    ("Oats",                  "carbs",      6.5, "500 g"),
    ("Olive oil",             "fats",       24,  "L"),
    ("Bananas",               "produce",    11,  "kg"),
    ("Spinach",               "produce",    3.5, "bunch"),
    ("Whey Protein",          "supplement", 180, "2 kg"),
    ("Creatine Monohydrate",  "supplement", 90,  "300 g"),
]


def upgrade() -> None:
    # ── 1. created_by tracking on users (admin who created an athlete account) ──
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL")

    # ── 2. Food category / trend enums (safe create) ────────────────────────────
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE foodcategoryenum AS ENUM ('protein', 'carbs', 'fats', 'produce', 'dairy', 'supplement');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE foodtrendenum AS ENUM ('up', 'down', 'flat');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # ── 3. foods table ────────────────────────────────────────────────────────
    op.create_table(
        "foods",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("category", postgresql.ENUM("protein", "carbs", "fats", "produce", "dairy", "supplement",
                                               name="foodcategoryenum", create_type=False), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(10), nullable=False, server_default="TND"),
        sa.Column("unit", sa.String(30), nullable=False),
        sa.Column("trend", postgresql.ENUM("up", "down", "flat", name="foodtrendenum", create_type=False),
                  nullable=False, server_default="flat"),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )

    # ── 4. Seed initial catalog ───────────────────────────────────────────────
    conn = op.get_bind()
    now = datetime.utcnow()
    for name, category, price, unit in SEED_FOODS:
        conn.execute(
            sa.text("""
                INSERT INTO foods (id, name, category, price, currency, unit, trend, created_at, updated_at)
                VALUES (:id, :name, :category, :price, 'TND', :unit, 'flat', :now, :now)
            """),
            {"id": str(uuid.uuid4()), "name": name, "category": category, "price": price, "unit": unit, "now": now},
        )


def downgrade() -> None:
    op.drop_table("foods")
    op.execute("DROP TYPE IF EXISTS foodtrendenum")
    op.execute("DROP TYPE IF EXISTS foodcategoryenum")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS created_by")
