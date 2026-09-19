from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class TrainingRequest(Base):
    __tablename__ = "training_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_code = Column(String(50), unique=True, index=True, nullable=True)  # e.g. "REQ-0001"
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False, index=True)
    requested_level = Column(Integer, nullable=False, default=3)  # Target level 1-5
    request_type = Column(String(100), default="online_session")
    priority = Column(String(50), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(50), default="PENDING")  # PENDING, CLAIMED, IN_PROGRESS, COMPLETED, CANCELLED
    claimed_by_sme_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    requested_date = Column(String(50), nullable=True)
    preferred_date = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    message = Column(Text, nullable=True)
    preferred_sme_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    employee = relationship("User", back_populates="training_requests", foreign_keys=[employee_id])
    claimed_by = relationship("User", foreign_keys=[claimed_by_sme_id])
    skill = relationship("Skill", back_populates="training_requests")
    assignments = relationship("TrainingAssignment", back_populates="training_request", cascade="all, delete-orphan")
