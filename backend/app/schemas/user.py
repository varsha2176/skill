from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


class UserBase(BaseModel):
    name: str
    email: str
    role: str
    department: Optional[str] = None
    location: Optional[str] = None
    experience_level: Optional[str] = None
    manager_id: Optional[int] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    experience_level: Optional[str] = None
    manager_id: Optional[int] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: str
    department: Optional[str] = None
    location: Optional[str] = None
    experience_level: Optional[str] = None
    manager_id: Optional[int] = None
    manager_name: Optional[str] = None
    is_active: bool
    created_at: datetime


class UserListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    users: list[UserResponse]
    total: int
