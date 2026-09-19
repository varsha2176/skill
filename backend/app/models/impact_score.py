from datetime import datetime
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class ImpactScore(Base):
    __tablename__ = "impact_scores"

    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    total_mentees = Column(Integer, default=0)
    level_ups_achieved = Column(Integer, default=0)
    avg_improvement = Column(Float, default=0.0)
    total_sessions = Column(Integer, default=0)
    impact_score = Column(Float, default=0.0)
    last_calculated_at = Column(DateTime, nullable=True)

    # Relationships
    mentor = relationship("User", foreign_keys=[mentor_id], back_populates="impact_scores")
