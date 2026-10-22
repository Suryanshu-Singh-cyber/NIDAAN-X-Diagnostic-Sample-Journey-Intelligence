"""
NIDAAN-X Configuration
Supports environment-based configuration for production deployment.
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "NIDAAN-X"
    APP_VERSION: str = "2.0.0"
    APP_ENV: str = "development"  # development | staging | production
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./nidaan.db"
    # For production: postgresql://user:pass@localhost:5432/nidaan
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]
    
    # ADD THIS LINE:
   
    # ... (other settings)
    # REMOVE: XAI_API_KEY
    GROQ_API_KEY: str = "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" # ADD THIS
    # Anomaly Detection Thresholds (based on NHM India guidelines)
    P95_MULTIPLIER: float = 1.5
    STUCK_HOURS: int = 4
    DELAY_CRITICAL_MULTIPLIER: float = 2.0
    DELAY_HIGH_MULTIPLIER: float = 1.2
    
    # Real Data Integration
    FHIR_BASE_URL: Optional[str] = None  # e.g., http://hospital-fhir-server/fhir
    FHIR_AUTH_TOKEN: Optional[str] = None
    USE_REAL_DATA: bool = False
    
    # Data Retention
    EVENT_RETENTION_DAYS: int = 90
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()