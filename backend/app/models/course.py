from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String(50), unique=True, index=True, nullable=True)  # e.g. "CRS-001"
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False, index=True)
    category = Column(String(100), nullable=True)
    difficulty = Column(String(50), nullable=False)  # Beginner, Intermediate, Advanced
    platform = Column(String(100), nullable=True)
    duration_hours = Column(Float, nullable=False, default=10.0)
    rating = Column(Float, nullable=True)
    enrolled_students = Column(Integer, nullable=True)
    completion_rate = Column(Float, nullable=True)
    prerequisite_skills = Column(String(300), nullable=True)
    certification_provided = Column(Boolean, default=False)
    url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    skill = relationship("Skill", back_populates="courses")
    progress_records = relationship("LearningProgress", back_populates="course", cascade="all, delete-orphan")
