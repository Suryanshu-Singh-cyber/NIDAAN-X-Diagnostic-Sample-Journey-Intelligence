from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Anomaly(Base):
    __tablename__ = "anomalies"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    specimen_id = Column(String, ForeignKey("specimens.id"), index=True)
    anomaly_type = Column(String)  # delay, missing_handoff, stuck, duplicate
    severity = Column(String)      # low, medium, high, critical
    stage = Column(String)
    expected_value = Column(Float)  # minutes
    actual_value = Column(Float)
    deviation_pct = Column(Float)
    message = Column(String)
    detected_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="open")  # open, acknowledged, resolved
    
    specimen = relationship("Specimen", back_populates="anomalies")