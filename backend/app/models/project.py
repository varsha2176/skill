from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    project_code = Column(String(50), unique=True, index=True, nullable=True)  # e.g. "PRJ-0001"
    name = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    department = Column(String(100), nullable=True)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    deadline = Column(String(50), nullable=True)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, COMPLETED, ON_HOLD, PIPELINE
    priority = Column(String(50), default="MEDIUM")  # CRITICAL, HIGH, MEDIUM, LOW
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    manager = relationship("User", back_populates="managed_projects")
    requirements = relationship("ProjectRequirement", back_populates="project", cascade="all, delete-orphan")
