from sqlalchemy.orm import Session
from app.models.employee_skill import EmployeeSkill
from app.models.target_skill import TargetSkill
from app.models.skill import Skill


def get_gap_status(gap: int) -> str:
    if gap <= 0:
        return "READY"
    elif gap == 1:
        return "NEEDS_IMPROVEMENT"
    elif gap == 2:
        return "SKILL_GAP"
    else:
        return "CRITICAL"


def get_readiness_percentage(current: int, target: int) -> float:
    if target <= 0:
        return 100.0
    return min(round((current / target) * 100, 1), 100.0)


def calculate_skill_gaps(employee_id: int, db: Session) -> list:
    """
    Returns list of skill gaps for an employee based on their target skills.
    gap = target_level - current_level
    """
    targets = db.query(TargetSkill).filter(
        TargetSkill.employee_id == employee_id,
        TargetSkill.status == "ACTIVE"
    ).all()

    gaps = []
    for target in targets:
        emp_skill = db.query(EmployeeSkill).filter(
            EmployeeSkill.employee_id == employee_id,
            EmployeeSkill.skill_id == target.skill_id
        ).first()

        current_level = emp_skill.current_level if emp_skill else 0
        gap = target.target_level - current_level
        readiness = get_readiness_percentage(current_level, target.target_level)
        status = get_gap_status(gap)

        gaps.append({
            "skill_id": target.skill_id,
            "skill_name": target.skill.name if target.skill else "Unknown",
            "skill_category": target.skill.category if target.skill else "Unknown",
            "current_level": current_level,
            "target_level": target.target_level,
            "gap": gap,
            "gap_status": status,
            "readiness_percentage": readiness,
            "employee_skill_id": emp_skill.id if emp_skill else None,
            "validated": emp_skill.validated if emp_skill else False,
        })

    return gaps


def calculate_overall_readiness(employee_id: int, db: Session) -> float:
    """
    Returns overall skill readiness percentage as average of all target skill readiness.
    """
    gaps = calculate_skill_gaps(employee_id, db)
    if not gaps:
        return 0.0
    total = sum(g["readiness_percentage"] for g in gaps)
    return round(total / len(gaps), 1)
