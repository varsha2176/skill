from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class LearningProgress(Base):
    __tablename__ = "learning_progress"

    id = Column(Integer, primary_key=True, index=True)
    progress_code = Column(String(50), unique=True, index=True, nullable=True)  # e.g. "PROG-0001"
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False, index=True)
    progress_percentage = Column(Float, default=0.0)  # 0 to 100
    status = Column(String(50), default="NOT_STARTED")  # NOT_STARTED, IN_PROGRESS, COMPLETED
    hours_spent = Column(Float, default=0.0)
    certificate_obtained = Column(Boolean, default=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employee = relationship("User", back_populates="learning_progress")
    course = relationship("Course", back_populates="progress_records")
