"""
Configuration settings for the application
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union
from pydantic import field_validator


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # LLM Backends
    ollama_url: str = "http://localhost:11434"
    lmstudio_url: str = "http://localhost:1234"

    # OpenAI (optional)
    openai_api_key: str = ""

    # Vector Database
    vector_db_path: str = "./vector_db"

    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "plugin_chat_db"

    # File Upload
    upload_dir: str = "./uploads"
    max_file_size: int = 10485760  # 10MB

    # CORS - can be comma-separated string from env or list
    cors_origins: Union[str, List[str]] = "http://localhost:3000,http://localhost:5173"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            # Handle empty string
            if not v or v.strip() == "":
                return ["http://localhost:3000", "http://localhost:5173"]
            # Parse comma-separated string from env var
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # Server
    host: str = "0.0.0.0"
    port: int = 8000


settings = Settings()
