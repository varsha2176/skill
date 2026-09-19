from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class SkillValidation(Base):
    __tablename__ = "skill_validations"

    id = Column(Integer, primary_key=True, index=True)
    employee_skill_id = Column(Integer, ForeignKey("employee_skills.id"), nullable=False, index=True)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    previous_level = Column(Integer, nullable=False)
    new_level = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    validated_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employee_skill = relationship("EmployeeSkill", back_populates="validations")
    manager = relationship("User", back_populates="managed_validations")
