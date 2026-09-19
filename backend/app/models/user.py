from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    user_code = Column(String(50), unique=True, index=True, nullable=True)  # e.g. "USR-0001"
    name = Column(String(200), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # Exactly 3 system roles: ADMIN, MANAGER, EMPLOYEE
    department = Column(String(100), nullable=True)
    location = Column(String(100), nullable=True)
    experience_level = Column(String(50), nullable=True)  # Junior, Mid, Senior
    experience_years = Column(Integer, default=0)
    is_sme = Column(Boolean, default=False, nullable=False)  # SME is an approved capability of an EMPLOYEE
    bandwidth = Column(Integer, default=5)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Self-referential manager/direct reports relationship
    manager = relationship("User", remote_side=[id], back_populates="team_members", foreign_keys=[manager_id])
    team_members = relationship("User", back_populates="manager", foreign_keys=[manager_id])

    # Other relationships
    employee_skills = relationship("EmployeeSkill", back_populates="employee", foreign_keys="EmployeeSkill.employee_id", cascade="all, delete-orphan")
    validated_skills = relationship("EmployeeSkill", back_populates="validator", foreign_keys="EmployeeSkill.validated_by")
    target_skills = relationship("TargetSkill", back_populates="employee", foreign_keys="TargetSkill.employee_id", cascade="all, delete-orphan")
    assigned_targets = relationship("TargetSkill", back_populates="assigner", foreign_keys="TargetSkill.assigned_by")
    training_requests = relationship("TrainingRequest", back_populates="employee", foreign_keys="TrainingRequest.employee_id", cascade="all, delete-orphan")
    training_assignments = relationship("TrainingAssignment", back_populates="sme", foreign_keys="TrainingAssignment.sme_id")
    learning_progress = relationship("LearningProgress", back_populates="employee", cascade="all, delete-orphan")
    managed_projects = relationship("Project", back_populates="manager", foreign_keys="Project.manager_id")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    managed_validations = relationship("SkillValidation", back_populates="manager")
    sme_access_requests = relationship("SMEAccessRequest", back_populates="employee", foreign_keys="SMEAccessRequest.employee_id", cascade="all, delete-orphan")
    sme_expertise = relationship("SMEExpertise", back_populates="employee", foreign_keys="SMEExpertise.employee_id", cascade="all, delete-orphan")
    certifications = relationship("Certification", back_populates="user", cascade="all, delete-orphan")
    mentorships_as_mentor = relationship("MentorshipRecord", back_populates="mentor", foreign_keys="MentorshipRecord.mentor_id")
    mentorships_as_mentee = relationship("MentorshipRecord", back_populates="mentee", foreign_keys="MentorshipRecord.mentee_id")
    impact_scores = relationship("ImpactScore", back_populates="mentor", foreign_keys="ImpactScore.mentor_id")
    quiz_results = relationship("QuizResult", back_populates="user", cascade="all, delete-orphan")
