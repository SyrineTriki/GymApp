from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app_config import settings
from database import init_db
from routes.auth        import router as auth_router
from routes.admin       import router as admin_router
from routes.super_admin import router as super_admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(title="GymApp API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://localhost:3000", settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth_router,        prefix="/api/v1")
app.include_router(admin_router,       prefix="/api/v1")
app.include_router(super_admin_router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok"}
