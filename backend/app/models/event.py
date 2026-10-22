from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    specimen_id = Column(String, ForeignKey("specimens.id"), index=True)
    activity = Column(String, index=True)  # collection, labeling, dispatch, etc.
    location = Column(String)
    operator = Column(String)
    timestamp = Column(DateTime(timezone=True), index=True)
    scan_type = Column(String, default="qr")  # qr, barcode, manual
    notes = Column(String, nullable=True)
    
    specimen = relationship("Specimen", back_populates="events")