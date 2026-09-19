from typing import Optional, List, Any, Dict
from pydantic import BaseModel


class EmployeeDashboardResponse(BaseModel):
    user_id: int
    user_name: str
    overall_readiness: float
    total_skills: int
    skill_gaps_count: int
    training_requests_count: int
    radar_data: List[Dict[str, Any]]
    skill_gaps: List[Dict[str, Any]]
    recent_training_requests: List[Dict[str, Any]]
    recent_notifications: List[Dict[str, Any]]
    target_skills: List[Dict[str, Any]]


class SMEDashboardResponse(BaseModel):
    user_id: int
    user_name: str
    claimable_requests: int
    sessions_completed: int
    learners_helped: int
    impact_score: float
    training_hours: float
    sme_skills: List[Dict[str, Any]]
    available_requests: List[Dict[str, Any]]
    active_assignments: List[Dict[str, Any]]


class ManagerDashboardResponse(BaseModel):
    user_id: int
    user_name: str
    team_count: int
    total_skills: int
    critical_gaps: int
    pending_validations: int
    active_training: int
    team_members: List[Dict[str, Any]]
    skill_heatmap: Dict[str, Any]
    recent_validations: List[Dict[str, Any]]


class AdminDashboardResponse(BaseModel):
    total_users: int
    total_skills: int
    total_courses: int
    total_training_requests: int
    users_by_role: Dict[str, int]
    users_by_department: Dict[str, int]
    training_by_status: Dict[str, int]
    recent_activity: List[Dict[str, Any]]


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: Optional[str] = None
    is_read: bool
    created_at: Any
