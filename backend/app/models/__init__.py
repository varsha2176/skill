# Import all models so SQLAlchemy can discover them for metadata/migrations
from app.models.user import User
from app.models.skill import Skill
from app.models.employee_skill import EmployeeSkill
from app.models.target_skill import TargetSkill
from app.models.course import Course
from app.models.training import TrainingRequest
from app.models.training_assignment import TrainingAssignment
from app.models.skill_validation import SkillValidation
from app.models.learning_progress import LearningProgress
from app.models.project import Project
from app.models.project_requirement import ProjectRequirement
from app.models.notification import Notification
from app.models.market_benchmark import MarketBenchmark
from app.models.certification import Certification
from app.models.mentorship import MentorshipRecord
from app.models.impact_score import ImpactScore
from app.models.quiz import QuizQuestion, QuizResult
from app.models.sme_access_request import SMEAccessRequest
from app.models.sme_expertise import SMEExpertise

__all__ = [
    "User",
    "Skill",
    "EmployeeSkill",
    "TargetSkill",
    "Course",
    "TrainingRequest",
    "TrainingAssignment",
    "SkillValidation",
    "LearningProgress",
    "Project",
    "ProjectRequirement",
    "Notification",
    "MarketBenchmark",
    "Certification",
    "MentorshipRecord",
    "ImpactScore",
    "QuizQuestion",
    "QuizResult",
    "SMEAccessRequest",
    "SMEExpertise",
]
