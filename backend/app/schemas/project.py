from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class ProjectRequirementCreate(BaseModel):
    skill_id: int
    required_people: int
    minimum_level: int


class ProjectRequirementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    skill_id: int
    skill_name: Optional[str] = None
    required_people: int
    minimum_level: int
    available_people: Optional[int] = None
    gap: Optional[int] = None
    readiness_percentage: Optional[float] = None
    status: Optional[str] = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str] = None
    manager_id: int
    manager_name: Optional[str] = None
    status: str
    created_at: datetime
    requirements: Optional[List[ProjectRequirementResponse]] = []
    overall_readiness: Optional[float] = None


class ProjectReadinessResponse(BaseModel):
    project_id: int
    project_name: str
    overall_readiness: float
    requirements: List[ProjectRequirementResponse]
