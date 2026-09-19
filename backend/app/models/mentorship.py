from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class MentorshipRecord(Base):
    __tablename__ = "mentorship_records"

    id = Column(Integer, primary_key=True, index=True)
    mentorship_code = Column(String(50), unique=True, index=True, nullable=True)  # e.g. "MENT-0001"
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    mentee_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=True, index=True)
    skill_name = Column(String(200), nullable=True)
    start_level = Column(Float, nullable=True)
    end_level = Column(Float, nullable=True)
    improvement = Column(Float, nullable=True)
    sessions_completed = Column(Integer, default=0)
    status = Column(String(50), default="COMPLETED")  # COMPLETED, ACTIVE, CANCELLED
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    mentee_rating = Column(Float, nullable=True)
    impact_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    mentor = relationship("User", foreign_keys=[mentor_id], back_populates="mentorships_as_mentor")
    mentee = relationship("User", foreign_keys=[mentee_id], back_populates="mentorships_as_mentee")
    skill = relationship("Skill")
