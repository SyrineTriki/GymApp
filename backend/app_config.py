from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/gymapp"

    # JWT (for future auth step)
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Email (FastAPI-Mail)
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = "noreply@gymapp.com"
    MAIL_FROM_NAME: str = "GymApp"
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False

    # App
    FRONTEND_URL: str = "http://localhost:4200"
    UPLOAD_DIR: str = "uploads/certifications"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
