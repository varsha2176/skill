from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class SMEAccessRequest(Base):
    __tablename__ = "sme_access_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    requested_skills = Column(String(500), nullable=True)  # Comma-separated or JSON list of skill names/IDs
    reason = Column(Text, nullable=False)
    experience = Column(Text, nullable=False)
    status = Column(String(50), default="PENDING", nullable=False)  # PENDING, APPROVED, REJECTED
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    review_comment = Column(Text, nullable=True)

    # Relationships
    employee = relationship("User", foreign_keys=[employee_id], back_populates="sme_access_requests")
    manager = relationship("User", foreign_keys=[manager_id])
