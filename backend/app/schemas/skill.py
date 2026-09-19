from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, ConfigDict


class SkillBase(BaseModel):
    name: str
    category: str
    description: Optional[str] = None


class SkillCreate(SkillBase):
    pass


class SkillUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None


class SkillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: str
    description: Optional[str] = None
    created_at: datetime


# Employee Skill Schemas
class EmployeeSkillCreate(BaseModel):
    skill_id: int
    current_level: int


class EmployeeSkillUpdate(BaseModel):
    current_level: Optional[int] = None
    validated: Optional[bool] = None


class EmployeeSkillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_id: int
    skill_id: int
    skill_name: str
    skill_category: str
    current_level: int
    validated: bool
    validated_by: Optional[int] = None
    validated_by_name: Optional[str] = None
    validated_at: Optional[datetime] = None
    created_at: datetime


# Target Skill Schemas
class TargetSkillCreate(BaseModel):
    skill_id: int
    target_level: int
    deadline: Optional[date] = None


class TargetSkillUpdate(BaseModel):
    target_level: Optional[int] = None
    deadline: Optional[date] = None
    status: Optional[str] = None


class TargetSkillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_id: int
    skill_id: int
    skill_name: str
    skill_category: str
    target_level: int
    deadline: Optional[date] = None
    assigned_by: Optional[int] = None
    assigned_by_name: Optional[str] = None
    status: str
    current_level: Optional[int] = None
    gap: Optional[int] = None
    readiness_percentage: Optional[float] = None
    gap_status: Optional[str] = None
    created_at: datetime


# Skill Gap Schema
class SkillGapResponse(BaseModel):
    skill_id: int
    skill_name: str
    skill_category: str
    current_level: int
    target_level: int
    gap: int
    gap_status: str
    readiness_percentage: float
