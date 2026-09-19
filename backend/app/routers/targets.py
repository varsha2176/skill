from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_active_user, require_role
from app.models.target_skill import TargetSkill
from app.models.employee_skill import EmployeeSkill
from app.models.user import User
from app.schemas.skill import TargetSkillCreate, TargetSkillUpdate
from app.services.skill_gap_service import get_readiness_percentage, get_gap_status

router = APIRouter(tags=["Target Skills"])


def build_target_response(ts: TargetSkill, db: Session) -> dict:
    # Get current level
    emp_skill = db.query(EmployeeSkill).filter(
        EmployeeSkill.employee_id == ts.employee_id,
        EmployeeSkill.skill_id == ts.skill_id,
    ).first()
    current_level = emp_skill.current_level if emp_skill else 0
    gap = ts.target_level - current_level
    readiness = get_readiness_percentage(current_level, ts.target_level)
    gap_status = get_gap_status(gap)

    return {
        "id": ts.id,
        "employee_id": ts.employee_id,
        "skill_id": ts.skill_id,
        "skill_name": ts.skill.name if ts.skill else "Unknown",
        "skill_category": ts.skill.category if ts.skill else "Unknown",
        "target_level": ts.target_level,
        "deadline": ts.deadline,
        "assigned_by": ts.assigned_by,
        "assigned_by_name": ts.assigner.name if ts.assigner else None,
        "status": ts.status,
        "current_level": current_level,
        "gap": gap,
        "readiness_percentage": readiness,
        "gap_status": gap_status,
        "created_at": ts.created_at,
    }


@router.get("/employees/{employee_id}/targets")
def get_targets(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get target skills for an employee."""
    if current_user.role == "EMPLOYEE" and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    targets = db.query(TargetSkill).filter(
        TargetSkill.employee_id == employee_id,
        TargetSkill.status == "ACTIVE"
    ).all()
    return [build_target_response(t, db) for t in targets]


@router.post("/employees/{employee_id}/targets", status_code=201)
def create_target(
    employee_id: int,
    target_data: TargetSkillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGER", "ADMIN")),
):
    """Create a target skill for an employee. Manager/Admin only."""
    # Check if target already exists
    existing = db.query(TargetSkill).filter(
        TargetSkill.employee_id == employee_id,
        TargetSkill.skill_id == target_data.skill_id,
        TargetSkill.status == "ACTIVE",
    ).first()

    if existing:
        # Update existing
        existing.target_level = target_data.target_level
        if target_data.deadline:
            existing.deadline = target_data.deadline
        existing.assigned_by = current_user.id
        db.commit()
        db.refresh(existing)
        return build_target_response(existing, db)

    target = TargetSkill(
        employee_id=employee_id,
        skill_id=target_data.skill_id,
        target_level=target_data.target_level,
        deadline=target_data.deadline,
        assigned_by=current_user.id,
        status="ACTIVE",
    )
    db.add(target)
    db.commit()
    db.refresh(target)
    return build_target_response(target, db)


@router.put("/targets/{target_id}")
def update_target(
    target_id: int,
    target_data: TargetSkillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGER", "ADMIN")),
):
    """Update a target skill."""
    target = db.query(TargetSkill).filter(TargetSkill.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target skill not found")

    for field, value in target_data.model_dump(exclude_none=True).items():
        setattr(target, field, value)

    db.commit()
    db.refresh(target)
    return build_target_response(target, db)


@router.delete("/targets/{target_id}", status_code=204)
def delete_target(
    target_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGER", "ADMIN")),
):
    """Delete/deactivate a target skill."""
    target = db.query(TargetSkill).filter(TargetSkill.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target skill not found")

    target.status = "CANCELLED"
    db.commit()
    return None


@router.get("/target-skills")
@router.get("/target-skills/")
def get_target_skills_alias(
    employee_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    target_id = employee_id if employee_id else current_user.id
    return get_targets(target_id, db, current_user)


@router.post("/target-skills", status_code=201)
@router.post("/target-skills/", status_code=201)
def add_target_skill_alias(
    target_data: TargetSkillCreate,
    employee_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    target_emp_id = employee_id or current_user.id
    return create_target(target_emp_id, target_data, db, current_user)


@router.put("/target-skills/{target_id}")
def update_target_skill_alias(
    target_id: int,
    target_data: TargetSkillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return update_target(target_id, target_data, db, current_user)


@router.delete("/target-skills/{target_id}", status_code=204)
def delete_target_skill_alias(
    target_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return delete_target(target_id, db, current_user)

