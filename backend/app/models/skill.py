from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    skill_code = Column(String(50), unique=True, index=True, nullable=True)  # e.g. "SKL-PYTHON"
    name = Column(String(200), unique=True, nullable=False, index=True)
    category = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    min_level = Column(Integer, default=1)
    max_level = Column(Integer, default=5)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employee_skills = relationship("EmployeeSkill", back_populates="skill", cascade="all, delete-orphan")
    target_skills = relationship("TargetSkill", back_populates="skill", cascade="all, delete-orphan")
    courses = relationship("Course", back_populates="skill", cascade="all, delete-orphan")
    training_requests = relationship("TrainingRequest", back_populates="skill", cascade="all, delete-orphan")
    project_requirements = relationship("ProjectRequirement", back_populates="skill", cascade="all, delete-orphan")
    certifications = relationship("Certification", back_populates="skill")
