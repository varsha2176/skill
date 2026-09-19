from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Certification(Base):
    __tablename__ = "certifications"

    id = Column(Integer, primary_key=True, index=True)
    certification_code = Column(String(50), unique=True, index=True, nullable=True)  # e.g. "CERT-0001"
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=True, index=True)
    skill_name = Column(String(200), nullable=True)
    title = Column(String(300), nullable=False)
    issuer = Column(String(200), nullable=True)
    platform = Column(String(100), nullable=True)
    url = Column(String(500), nullable=True)
    issued_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="certifications")
    skill = relationship("Skill", back_populates="certifications")
