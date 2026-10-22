from sqlalchemy import Column, String, DateTime, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Specimen(Base):
    __tablename__ = "specimens"
    
    id = Column(String, primary_key=True, index=True)  # S-2026-1047
    patient_id = Column(String, index=True)
    sample_type = Column(String)  # Blood, Urine, Tissue
    test_type = Column(String)    # CBC, LFT, Biopsy
    collection_location = Column(String)
    priority = Column(String, default="routine")  # routine, urgent, stat
    current_stage = Column(String, default="collected")
    status = Column(String, default="in_progress")  # in_progress, completed, flagged
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    events = relationship("Event", back_populates="specimen", cascade="all, delete-orphan")
    anomalies = relationship("Anomaly", back_populates="specimen", cascade="all, delete-orphan")