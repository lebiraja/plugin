"""
Configuration settings for the application
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # LLM Backends
    ollama_url: str = "http://localhost:11434"
    lmstudio_url: str = "http://localhost:1234"
    
    # OpenAI (optional)
    openai_api_key: str = ""
    
    # Vector Database
    vector_db_path: str = "./vector_db"
    
    # File Upload
    upload_dir: str = "./uploads"
    max_file_size: int = 10485760  # 10MB
    
    # CORS
    cors_origins: List[str] = ["http://localhost:3000"]
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    class Config:
        env_file = ".env"


settings = Settings()
