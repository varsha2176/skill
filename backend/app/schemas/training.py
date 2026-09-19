from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, ConfigDict


class TrainingRequestCreate(BaseModel):
    skill_id: int
    requested_level: int
    message: Optional[str] = None
    priority: Optional[str] = "MEDIUM"


class TrainingRequestUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    message: Optional[str] = None


class TrainingAssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    training_request_id: int
    sme_id: int
    sme_name: Optional[str] = None
    scheduled_date: Optional[date] = None
    duration_hours: Optional[float] = None
    status: str
    completed_at: Optional[datetime] = None
    created_at: datetime


class TrainingRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_id: int
    employee_name: Optional[str] = None
    skill_id: int
    skill_name: Optional[str] = None
    requested_level: int
    message: Optional[str] = None
    priority: str
    status: str
    sme_id: Optional[int] = None
    sme_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
