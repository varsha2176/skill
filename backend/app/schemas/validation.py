from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ValidationApprovalRequest(BaseModel):
    new_level: int
    comment: Optional[str] = None
    approved: bool = True


class PendingValidationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    employee_skill_id: int
    employee_id: int
    employee_name: str
    skill_id: int
    skill_name: str
    skill_category: str
    current_level: int
    validated: bool
    created_at: datetime


class SkillValidationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_skill_id: int
    manager_id: int
    manager_name: Optional[str] = None
    previous_level: int
    new_level: int
    comment: Optional[str] = None
    validated_at: datetime
