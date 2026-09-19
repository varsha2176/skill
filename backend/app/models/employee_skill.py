from datetime import datetime
from sqlalchemy import Column, Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class EmployeeSkill(Base):
    __tablename__ = "employee_skills"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False, index=True)
    current_level = Column(Integer, nullable=False, default=1)  # 1-5 (prioritizes current_level / validated_level)
    self_assessment = Column(Float, nullable=True)
    validated_level = Column(Float, nullable=True)
    target_level = Column(Float, nullable=True)
    level_change_12mo = Column(Float, nullable=True)
    market_average = Column(Float, nullable=True)
    market_percentile = Column(Float, nullable=True)
    above_market = Column(Boolean, default=False)
    market_gap = Column(Float, nullable=True)
    has_certification = Column(Boolean, default=False)
    has_mentorship = Column(Boolean, default=False)
    last_assessed = Column(DateTime, nullable=True)
    validated = Column(Boolean, default=False)
    validated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    validated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employee = relationship("User", back_populates="employee_skills", foreign_keys=[employee_id])
    skill = relationship("Skill", back_populates="employee_skills")
    validator = relationship("User", back_populates="validated_skills", foreign_keys=[validated_by])
    validations = relationship("SkillValidation", back_populates="employee_skill", cascade="all, delete-orphan")
