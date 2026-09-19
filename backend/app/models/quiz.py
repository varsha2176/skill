from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_code = Column(String(50), unique=True, index=True, nullable=True)  # e.g. "QUIZ-0001"
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=True, index=True)
    skill_name = Column(String(200), nullable=True)
    question = Column(Text, nullable=False)
    option_a = Column(Text, nullable=True)
    option_b = Column(Text, nullable=True)
    option_c = Column(Text, nullable=True)
    option_d = Column(Text, nullable=True)
    correct_answer = Column(String(10), nullable=True)
    points = Column(Integer, default=10)

    # Relationships
    skill = relationship("Skill")
    results = relationship("QuizResult", back_populates="quiz", cascade="all, delete-orphan")


class QuizResult(Base):
    __tablename__ = "quiz_results"

    id = Column(Integer, primary_key=True, index=True)
    result_code = Column(String(50), unique=True, index=True, nullable=True)  # e.g. "RES-0001"
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    quiz_id = Column(Integer, ForeignKey("quiz_questions.id"), nullable=True, index=True)
    skill_name = Column(String(200), nullable=True)
    score_percent = Column(Float, default=0.0)
    points_earned = Column(Float, default=0.0)
    total_points = Column(Float, default=0.0)
    passed = Column(Boolean, default=False)
    attempted_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="quiz_results")
    quiz = relationship("QuizQuestion", back_populates="results")
