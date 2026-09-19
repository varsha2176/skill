from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.services.skill_gap_service import calculate_skill_gaps, calculate_overall_readiness

router = APIRouter(prefix="/skill-gaps", tags=["Skill Gaps"])


@router.get("")
@router.get("/")
def get_skill_gaps(
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get skill gaps for an employee (defaults to current user)."""
    target_id = employee_id if employee_id else current_user.id

    if current_user.role == "EMPLOYEE" and current_user.id != target_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return calculate_skill_gaps(target_id, db)


@router.get("/overall")
def get_overall_readiness(
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    target_id = employee_id if employee_id else current_user.id
    if current_user.role == "EMPLOYEE" and current_user.id != target_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    readiness = calculate_overall_readiness(target_id, db)
    return {"readiness_percentage": readiness}
