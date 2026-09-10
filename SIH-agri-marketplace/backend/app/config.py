"""Configuration module for the Agricultural Marketplace Backend.
Manages environment variables, database connections, and JWT security settings.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "SIH 2026 Agricultural Marketplace API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database Configuration (PostgreSQL default)
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/agri_marketplace"

    # JWT Authentication & Security
    SECRET_KEY: str = "sih2026-production-super-secret-jwt-key-change-in-production-environment-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
