from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.core.database import Base


class TrainingAssignment(Base):
    __tablename__ = "training_assignments"

    id = Column(Integer, primary_key=True, index=True)
    training_request_id = Column(Integer, ForeignKey("training_requests.id"), nullable=False, index=True)
    sme_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    scheduled_date = Column(Date, nullable=True)
    duration_hours = Column(Float, nullable=True)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, COMPLETED, CANCELLED
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    training_request = relationship("TrainingRequest", back_populates="assignments")
    sme = relationship("User", back_populates="training_assignments")
