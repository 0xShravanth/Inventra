from pathlib import Path

from pydantic import ConfigDict
from pydantic_settings import BaseSettings


BACKEND_DIR = Path(__file__).resolve().parents[1]
ENV_FILE_PATH = BACKEND_DIR / ".env"


class Settings(BaseSettings):
    DATABASE_URL: str

    model_config = ConfigDict(
        env_prefix="",
        env_file=str(ENV_FILE_PATH) if ENV_FILE_PATH.exists() else None,
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

