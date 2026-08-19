import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from database import async_session
from models import Exercise

DATA_PATH = Path(__file__).parent / "data" / "exercises.json"


async def seed_exercises() -> None:
    """Upserts the free exercise-db dataset into the exercises table.
    Runs on every startup; cheap no-op after the first time since the id is stable
    and ON CONFLICT DO NOTHING skips rows that already exist."""
    if not DATA_PATH.exists():
        return

    raw = json.loads(DATA_PATH.read_text())

    async with async_session() as db:
        existing = await db.execute(select(Exercise.id))
        existing_ids = {r[0] for r in existing.all()}
        if len(existing_ids) >= len(raw):
            return   # already fully seeded

        rows = [
            {
                "id": e["id"],
                "name": e["n"],
                "body_part": e["bp"],
                "equipment": e["eq"],
                "target_muscle": e["tg"],
                "secondary_muscles": e.get("sm") or [],
                "instructions": e.get("st") or [],
                "image_filename": e.get("img"),
                "gif_filename": e.get("gif"),
            }
            for e in raw
        ]

        stmt = pg_insert(Exercise).values(rows)
        stmt = stmt.on_conflict_do_nothing(index_elements=["id"])
        await db.execute(stmt)
        await db.commit()
