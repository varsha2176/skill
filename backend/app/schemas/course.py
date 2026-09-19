from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    skill_id: int
    difficulty: str
    duration_hours: float
    provider: Optional[str] = None
    url: Optional[str] = None


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    skill_id: Optional[int] = None
    difficulty: Optional[str] = None
    duration_hours: Optional[float] = None
    provider: Optional[str] = None
    url: Optional[str] = None


class CourseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str] = None
    skill_id: int
    skill_name: Optional[str] = None
    skill_category: Optional[str] = None
    difficulty: str
    duration_hours: float
    provider: Optional[str] = None
    url: Optional[str] = None
    created_at: datetime


class LearningProgressCreate(BaseModel):
    course_id: int
    employee_id: Optional[int] = None


class LearningProgressUpdate(BaseModel):
    progress_percentage: Optional[float] = None
    status: Optional[str] = None


class LearningProgressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_id: int
    course_id: int
    course_title: Optional[str] = None
    skill_name: Optional[str] = None
    progress_percentage: float
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class RecommendedCourseResponse(BaseModel):
    course: CourseResponse
    skill_gap: int
    skill_name: str
    current_level: int
    target_level: int
    progress: Optional[LearningProgressResponse] = None
