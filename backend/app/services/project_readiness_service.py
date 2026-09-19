from sqlalchemy.orm import Session
from app.models.project import Project
from app.models.project_requirement import ProjectRequirement
from app.models.employee_skill import EmployeeSkill


def calculate_project_readiness(project_id: int, db: Session) -> dict:
    """
    For each required skill:
    - Count employees with validated skill level >= minimum_level
    - gap = required_people - available_people
    - readiness = min(available_people / required_people * 100, 100)
    Overall = average of all skill readiness percentages
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return {}

    requirements = db.query(ProjectRequirement).filter(
        ProjectRequirement.project_id == project_id
    ).all()

    requirement_results = []
    readiness_percentages = []

    for req in requirements:
        # Count employees with validated skill >= minimum level
        available = db.query(EmployeeSkill).filter(
            EmployeeSkill.skill_id == req.skill_id,
            EmployeeSkill.current_level >= req.minimum_level,
            EmployeeSkill.validated == True
        ).count()

        gap = max(req.required_people - available, 0)
        readiness = min(available / req.required_people * 100, 100.0) if req.required_people > 0 else 100.0

        if readiness >= 100:
            status = "Ready"
        elif readiness >= 75:
            status = "Near Ready"
        elif readiness >= 50:
            status = "Shortage"
        else:
            status = "Critical"

        readiness_percentages.append(readiness)

        requirement_results.append({
            "id": req.id,
            "project_id": project_id,
            "skill_id": req.skill_id,
            "skill_name": req.skill.name if req.skill else "Unknown",
            "required_people": req.required_people,
            "available_people": available,
            "gap": gap,
            "minimum_level": req.minimum_level,
            "readiness_percentage": round(readiness, 1),
            "status": status,
        })

    overall_readiness = round(
        sum(readiness_percentages) / len(readiness_percentages), 1
    ) if readiness_percentages else 0.0

    return {
        "project_id": project_id,
        "project_name": project.name,
        "overall_readiness": overall_readiness,
        "requirements": requirement_results,
    }
