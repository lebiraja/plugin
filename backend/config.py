"""
Configuration settings for the application.

Every setting below is authoritative: services read URLs and credentials from
here, never from hardcoded literals. Values come from environment variables (or
a local ``.env``); ``AliasChoices`` lets a single setting bind to any of the
historical env var names so Docker Compose and bare-metal dev both work.
"""

from typing import List, Union

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    # LLM Backends. OLLAMA_HOST is the var Docker images conventionally set, so
    # we accept it as an alias for OLLAMA_URL.
    ollama_url: str = Field(
        default="http://localhost:11434",
        validation_alias=AliasChoices("OLLAMA_URL", "OLLAMA_HOST"),
    )
    lmstudio_url: str = Field(
        default="http://localhost:1234",
        validation_alias=AliasChoices("LMSTUDIO_URL", "LMSTUDIO_HOST"),
    )

    # Web search (optional; falls back to DuckDuckGo when unset)
    serper_api_key: str = Field(
        default="", validation_alias=AliasChoices("SERPER_API_KEY")
    )

    # Vector Database
    vector_db_path: str = Field(
        default="./vector_db", validation_alias=AliasChoices("VECTOR_DB_PATH")
    )

    # MongoDB. Different deployments have used MONGO_URL / MONGODB_URI; bind them all.
    mongodb_url: str = Field(
        default="mongodb://localhost:27017",
        validation_alias=AliasChoices("MONGODB_URL", "MONGO_URL", "MONGODB_URI"),
    )
    mongodb_db_name: str = Field(
        default="plugin_chat_db", validation_alias=AliasChoices("MONGODB_DB_NAME")
    )

    # File Upload
    upload_dir: str = Field(default="./uploads", validation_alias=AliasChoices("UPLOAD_DIR"))
    max_file_size: int = Field(
        default=10485760, validation_alias=AliasChoices("MAX_FILE_SIZE")  # 10MB
    )

    # CORS - comma-separated string from env or list
    cors_origins: Union[str, List[str]] = Field(
        default="http://localhost:3000,http://localhost:5173",
        validation_alias=AliasChoices("CORS_ORIGINS"),
    )

    # Server
    host: str = Field(default="0.0.0.0", validation_alias=AliasChoices("HOST"))
    port: int = Field(default=2000, validation_alias=AliasChoices("PORT"))

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            if not v or v.strip() == "":
                return ["http://localhost:3000", "http://localhost:5173"]
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v


settings = Settings()
