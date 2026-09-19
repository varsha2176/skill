from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class SMEExpertise(Base):
    __tablename__ = "sme_expertise"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    skill_level = Column(Integer, nullable=False)  # 1 to 5
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employee = relationship("User", foreign_keys=[employee_id], back_populates="sme_expertise")
    skill = relationship("Skill")
    approver = relationship("User", foreign_keys=[approved_by])
