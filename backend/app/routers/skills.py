from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_active_user, require_role
from app.models.skill import Skill
from app.models.user import User
from app.schemas.skill import SkillCreate, SkillUpdate, SkillResponse

router = APIRouter(prefix="/skills", tags=["Skills"])


@router.get("")
@router.get("/")
def list_skills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all skills. All authenticated users."""
    skills = db.query(Skill).order_by(Skill.category, Skill.name).all()
    return [{
        "id": s.id,
        "name": s.name,
        "category": s.category,
        "description": s.description,
        "created_at": s.created_at,
    } for s in skills]


@router.post("", status_code=201)
@router.post("/", status_code=201)
def create_skill(
    skill_data: SkillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Create a new skill. Admin only."""
    existing = db.query(Skill).filter(Skill.name == skill_data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Skill already exists")

    skill = Skill(**skill_data.model_dump())
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return {"id": skill.id, "name": skill.name, "category": skill.category, "description": skill.description}


@router.put("/{skill_id}")
def update_skill(
    skill_id: int,
    skill_data: SkillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Update a skill. Admin only."""
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    for field, value in skill_data.model_dump(exclude_none=True).items():
        setattr(skill, field, value)

    db.commit()
    db.refresh(skill)
    return {"id": skill.id, "name": skill.name, "category": skill.category, "description": skill.description}


@router.delete("/{skill_id}", status_code=204)
def delete_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Delete a skill. Admin only."""
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    db.delete(skill)
    db.commit()
    return None
