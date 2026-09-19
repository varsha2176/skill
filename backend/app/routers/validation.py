from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_role
from app.models.employee_skill import EmployeeSkill
from app.models.skill_validation import SkillValidation
from app.models.user import User
from app.schemas.validation import ValidationApprovalRequest
from app.services.notification_service import notify_skill_validated

router = APIRouter(prefix="/validations", tags=["Validation"])


@router.get("/pending")
def get_pending_validations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGER", "ADMIN")),
):
    """Get unvalidated skills for manager's team members."""
    if current_user.role == "MANAGER":
        team = db.query(User).filter(
            User.manager_id == current_user.id,
            User.is_active == True
        ).all()
        team_ids = [m.id for m in team]
    else:
        # Admin sees all pending
        team_ids = [u.id for u in db.query(User).filter(User.role == "EMPLOYEE").all()]

    pending = db.query(EmployeeSkill).filter(
        EmployeeSkill.employee_id.in_(team_ids),
        EmployeeSkill.validated == False
    ).all()

    return [{
        "employee_skill_id": es.id,
        "employee_id": es.employee_id,
        "employee_name": es.employee.name if es.employee else "Unknown",
        "skill_id": es.skill_id,
        "skill_name": es.skill.name if es.skill else "Unknown",
        "skill_category": es.skill.category if es.skill else "Unknown",
        "current_level": es.current_level,
        "validated": es.validated,
        "created_at": es.created_at,
    } for es in pending]


@router.put("/{employee_skill_id}")
def validate_skill(
    employee_skill_id: int,
    approval: ValidationApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGER", "ADMIN")),
):
    """Approve or reject a skill validation."""
    emp_skill = db.query(EmployeeSkill).filter(EmployeeSkill.id == employee_skill_id).first()
    if not emp_skill:
        raise HTTPException(status_code=404, detail="Employee skill not found")

    # Check manager owns this employee
    if current_user.role == "MANAGER":
        employee = db.query(User).filter(User.id == emp_skill.employee_id).first()
        if not employee or employee.manager_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to validate this employee's skill")

    previous_level = emp_skill.current_level

    # Create validation record
    validation = SkillValidation(
        employee_skill_id=employee_skill_id,
        manager_id=current_user.id,
        previous_level=previous_level,
        new_level=approval.new_level if approval.approved else previous_level,
        comment=approval.comment,
        validated_at=datetime.utcnow(),
    )
    db.add(validation)

    if approval.approved:
        emp_skill.validated = True
        emp_skill.validated_by = current_user.id
        emp_skill.validated_at = datetime.utcnow()
        emp_skill.current_level = approval.new_level
    # If rejected, skill stays unvalidated but we record the attempt

    db.commit()

    # Notify employee
    skill_name = emp_skill.skill.name if emp_skill.skill else "Unknown"
    notify_skill_validated(
        emp_skill.employee_id,
        skill_name,
        current_user.name,
        approval.approved,
        db
    )

    return {
        "success": True,
        "approved": approval.approved,
        "employee_skill_id": employee_skill_id,
        "new_level": approval.new_level if approval.approved else previous_level,
        "validated_level": approval.new_level if approval.approved else previous_level,
        "validated": approval.approved,
    }


@router.get("/history/{employee_id}")
def get_validation_history(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGER", "ADMIN")),
):
    """Get validation history for an employee."""
    emp_skills = db.query(EmployeeSkill).filter(
        EmployeeSkill.employee_id == employee_id
    ).all()
    emp_skill_ids = [es.id for es in emp_skills]

    validations = db.query(SkillValidation).filter(
        SkillValidation.employee_skill_id.in_(emp_skill_ids)
    ).order_by(SkillValidation.validated_at.desc()).all()

    return [{
        "id": v.id,
        "employee_skill_id": v.employee_skill_id,
        "skill_name": v.employee_skill.skill.name if v.employee_skill and v.employee_skill.skill else "Unknown",
        "manager_name": v.manager.name if v.manager else "Unknown",
        "previous_level": v.previous_level,
        "new_level": v.new_level,
        "comment": v.comment,
        "validated_at": v.validated_at,
    } for v in validations]
