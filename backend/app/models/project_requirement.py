from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class ProjectRequirement(Base):
    __tablename__ = "project_requirements"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False, index=True)
    required_people = Column(Integer, nullable=False, default=1)  # headcount
    minimum_level = Column(Integer, nullable=False, default=3)  # required_level (1-5)
    current_availability = Column(Integer, default=0)
    gap = Column(Integer, default=0)
    training_hours_needed = Column(Integer, default=0)

    # Relationships
    project = relationship("Project", back_populates="requirements")
    skill = relationship("Skill", back_populates="project_requirements")
