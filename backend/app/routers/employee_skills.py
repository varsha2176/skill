from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.employee_skill import EmployeeSkill
from app.models.user import User
from app.models.skill import Skill
from app.schemas.skill import EmployeeSkillCreate, EmployeeSkillUpdate

router = APIRouter(tags=["Employee Skills"])


def build_emp_skill_response(es: EmployeeSkill) -> dict:
    return {
        "id": es.id,
        "employee_id": es.employee_id,
        "skill_id": es.skill_id,
        "skill_name": es.skill.name if es.skill else "Unknown",
        "skill_category": es.skill.category if es.skill else "Unknown",
        "current_level": es.current_level,
        "validated": es.validated,
        "validated_by": es.validated_by,
        "validated_by_name": es.validator.name if es.validator else None,
        "validated_at": es.validated_at,
        "created_at": es.created_at,
    }


@router.get("/employees/{employee_id}/skills")
def get_employee_skills(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get all skills for an employee."""
    # Check authorization
    if current_user.role == "EMPLOYEE" and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if current_user.role == "SME" and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if current_user.role == "MANAGER":
        target = db.query(User).filter(User.id == employee_id).first()
        if target and target.manager_id != current_user.id and current_user.id != employee_id:
            raise HTTPException(status_code=403, detail="Not authorized")

    skills = db.query(EmployeeSkill).filter(
        EmployeeSkill.employee_id == employee_id
    ).all()
    return [build_emp_skill_response(es) for es in skills]


@router.post("/employees/{employee_id}/skills", status_code=201)
def add_employee_skill(
    employee_id: int,
    skill_data: EmployeeSkillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Add a skill to an employee. Employee can add their own skills."""
    # Employees can only add to themselves
    if current_user.role not in ["ADMIN", "MANAGER"] and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Validate level
    if not 1 <= skill_data.current_level <= 5:
        raise HTTPException(status_code=422, detail="Skill level must be between 1 and 5")

    # Check skill exists
    skill = db.query(Skill).filter(Skill.id == skill_data.skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    # Check if employee already has this skill
    existing = db.query(EmployeeSkill).filter(
        EmployeeSkill.employee_id == employee_id,
        EmployeeSkill.skill_id == skill_data.skill_id,
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Employee already has this skill")

    emp_skill = EmployeeSkill(
        employee_id=employee_id,
        skill_id=skill_data.skill_id,
        current_level=skill_data.current_level,
        validated=False,  # Starts unvalidated
    )
    db.add(emp_skill)
    db.commit()
    db.refresh(emp_skill)
    return build_emp_skill_response(emp_skill)


@router.put("/employee-skills/{skill_id}")
def update_employee_skill(
    skill_id: int,
    skill_data: EmployeeSkillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update an employee skill."""
    emp_skill = db.query(EmployeeSkill).filter(EmployeeSkill.id == skill_id).first()
    if not emp_skill:
        raise HTTPException(status_code=404, detail="Employee skill not found")

    # Authorization check
    if current_user.role not in ["ADMIN", "MANAGER"] and current_user.id != emp_skill.employee_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if skill_data.current_level is not None:
        if not 1 <= skill_data.current_level <= 5:
            raise HTTPException(status_code=422, detail="Skill level must be between 1 and 5")
        emp_skill.current_level = skill_data.current_level
        # When level changes by employee, reset validation
        if current_user.role not in ["ADMIN", "MANAGER"]:
            emp_skill.validated = False
            emp_skill.validated_by = None
            emp_skill.validated_at = None

    db.commit()
    db.refresh(emp_skill)
    return build_emp_skill_response(emp_skill)


@router.delete("/employee-skills/{skill_id}", status_code=204)
def delete_employee_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete an employee skill."""
    emp_skill = db.query(EmployeeSkill).filter(EmployeeSkill.id == skill_id).first()
    if not emp_skill:
        raise HTTPException(status_code=404, detail="Employee skill not found")

    if current_user.role not in ["ADMIN"] and current_user.id != emp_skill.employee_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(emp_skill)
    db.commit()
    return None


@router.get("/employee-skills")
@router.get("/employee-skills/")
def get_employee_skills_alias(
    employee_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    target_id = employee_id if employee_id else current_user.id
    return get_employee_skills(target_id, db, current_user)


@router.post("/employee-skills", status_code=201)
@router.post("/employee-skills/", status_code=201)
def add_employee_skill_alias(
    skill_data: EmployeeSkillCreate,
    employee_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    target_id = employee_id if (employee_id and current_user.role in ["ADMIN", "MANAGER"]) else current_user.id
    return add_employee_skill(target_id, skill_data, db, current_user)


@router.get("/employee-skills/pending-validations")
def pending_validations_alias(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    from app.routers.validation import get_pending_validations
    return get_pending_validations(db, current_user)


@router.post("/employee-skills/{employee_skill_id}/validate")
def validate_skill_alias(
    employee_skill_id: int,
    approval: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    from app.routers.validation import validate_skill
    from app.schemas.validation import ValidationApprovalRequest
    req = ValidationApprovalRequest(
        approved=approval.get("approved", True),
        new_level=approval.get("validated_level", approval.get("new_level", 3)),
        comment=approval.get("comment", ""),
    )
    return validate_skill(employee_skill_id, req, db, current_user)


@router.get("/employee-skills/team")
def get_team_skills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role == "MANAGER":
        team = db.query(User).filter(User.manager_id == current_user.id, User.is_active == True).all()
        team_ids = [m.id for m in team]
    else:
        team = db.query(User).filter(User.role.in_(["EMPLOYEE", "SME"]), User.is_active == True).all()
        team_ids = [u.id for u in team]

    skills = db.query(EmployeeSkill).filter(EmployeeSkill.employee_id.in_(team_ids)).all()
    user_map = {u.id: u for u in team}
    return [{
        **build_emp_skill_response(es),
        "employee_name": user_map.get(es.employee_id).name if user_map.get(es.employee_id) else "Unknown",
        "department": user_map.get(es.employee_id).department if user_map.get(es.employee_id) else "Unknown",
    } for es in skills]

