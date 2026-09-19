from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_active_user, require_role
from app.models.project import Project
from app.models.project_requirement import ProjectRequirement
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectRequirementCreate
from app.services.project_readiness_service import calculate_project_readiness

router = APIRouter(prefix="/projects", tags=["Projects"])


def build_project_response(project: Project, db: Session, include_readiness: bool = False) -> dict:
    requirements = []
    if include_readiness and project.requirements:
        readiness_data = calculate_project_readiness(project.id, db)
        requirements = readiness_data.get("requirements", [])
        overall_readiness = readiness_data.get("overall_readiness", 0.0)
    else:
        requirements = [{
            "id": r.id,
            "project_id": r.project_id,
            "skill_id": r.skill_id,
            "skill_name": r.skill.name if r.skill else "Unknown",
            "required_people": r.required_people,
            "minimum_level": r.minimum_level,
        } for r in project.requirements]
        overall_readiness = None

    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "manager_id": project.manager_id,
        "manager_name": project.manager.name if project.manager else None,
        "status": project.status,
        "created_at": project.created_at,
        "requirements": requirements,
        "overall_readiness": overall_readiness,
    }


@router.get("")
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGER", "ADMIN")),
):
    """List all projects."""
    if current_user.role == "MANAGER":
        projects = db.query(Project).filter(
            (Project.manager_id == current_user.id) |
            (Project.department == current_user.department)
        ).all()
        if not projects:
            projects = db.query(Project).all()
    else:
        projects = db.query(Project).all()

    return [build_project_response(p, db) for p in projects]


@router.post("", status_code=201)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGER", "ADMIN")),
):
    """Create a new project."""
    project = Project(
        name=project_data.name,
        description=project_data.description,
        manager_id=current_user.id,
        status="ACTIVE",
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return build_project_response(project, db)


@router.get("/{project_id}")
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGER", "ADMIN")),
):
    """Get project details with requirements."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.role == "MANAGER" and project.manager_id != current_user.id and project.department != current_user.department:
        raise HTTPException(status_code=403, detail="Not authorized")

    return build_project_response(project, db)


@router.get("/{project_id}/readiness")
def get_project_readiness(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGER", "ADMIN")),
):
    """Get project readiness calculations."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.role == "MANAGER" and project.manager_id != current_user.id and project.department != current_user.department:
        raise HTTPException(status_code=403, detail="Not authorized")

    return calculate_project_readiness(project_id, db)


@router.post("/{project_id}/requirements", status_code=201)
def add_requirement(
    project_id: int,
    req_data: ProjectRequirementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGER", "ADMIN")),
):
    """Add a skill requirement to a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.role == "MANAGER" and project.manager_id != current_user.id and project.department != current_user.department:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Check if requirement already exists for this skill
    existing = db.query(ProjectRequirement).filter(
        ProjectRequirement.project_id == project_id,
        ProjectRequirement.skill_id == req_data.skill_id,
    ).first()

    if existing:
        existing.required_people = req_data.required_people
        existing.minimum_level = req_data.minimum_level
        db.commit()
        db.refresh(existing)
        return {
            "id": existing.id,
            "project_id": existing.project_id,
            "skill_id": existing.skill_id,
            "skill_name": existing.skill.name if existing.skill else None,
            "required_people": existing.required_people,
            "minimum_level": existing.minimum_level,
        }

    req = ProjectRequirement(
        project_id=project_id,
        skill_id=req_data.skill_id,
        required_people=req_data.required_people,
        minimum_level=req_data.minimum_level,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return {
        "id": req.id,
        "project_id": req.project_id,
        "skill_id": req.skill_id,
        "skill_name": req.skill.name if req.skill else None,
        "required_people": req.required_people,
        "minimum_level": req.minimum_level,
    }


@router.delete("/{project_id}/requirements/{req_id}", status_code=204)
def delete_requirement(
    project_id: int,
    req_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGER", "ADMIN")),
):
    """Remove a skill requirement from a project."""
    req = db.query(ProjectRequirement).filter(
        ProjectRequirement.id == req_id,
        ProjectRequirement.project_id == project_id,
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requirement not found")

    db.delete(req)
    db.commit()
    return None
