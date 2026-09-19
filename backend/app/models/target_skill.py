from datetime import datetime, date
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.core.database import Base


class TargetSkill(Base):
    __tablename__ = "target_skills"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False, index=True)
    target_level = Column(Integer, nullable=False)  # 1-5
    deadline = Column(Date, nullable=True)
    assigned_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, ACHIEVED, CANCELLED
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employee = relationship("User", back_populates="target_skills", foreign_keys=[employee_id])
    skill = relationship("Skill", back_populates="target_skills")
    assigner = relationship("User", back_populates="assigned_targets", foreign_keys=[assigned_by])
