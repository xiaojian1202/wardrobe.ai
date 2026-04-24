import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

# Get the base directory of the backend folder
BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    """
    Centralized configuration management for the FitCheck AI backend.
    Inherits from Pydantic BaseSettings to automatically load .env files
    and provide type-safe configuration.
    """
    # Look for .env in the backend/ folder, regardless of where the app is started
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8", 
        extra="ignore"
    )

    # TritonAI Gateway Configuration (Will be pulled from .env)
    triton_api_key: str 
    triton_base_url: str
    triton_model: str

    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: list[str] = ["http://localhost:5173"]

    # Storage Configuration
    data_dir: str = "data"
    test_images_dir: str = "data/test_images"
    uploads_dir: str = "storage/uploads"
    
    # Database Configuration
    database_url: str = "sqlite:///data/fitcheck.db"

# Single instance of settings for application-wide use
settings = Settings()
