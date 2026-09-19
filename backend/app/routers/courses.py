from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_active_user, require_role
from app.models.course import Course
from app.models.learning_progress import LearningProgress
from app.models.user import User
from app.models.skill import Skill
from app.schemas.course import CourseCreate, CourseUpdate, LearningProgressCreate, LearningProgressUpdate
from app.services.recommendation_service import get_recommended_courses

router = APIRouter(tags=["Courses"])


@router.get("/courses")
@router.get("/courses/")
def list_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all courses."""
    courses = db.query(Course).all()
    return [{
        "id": c.id,
        "course_code": c.course_code,
        "title": c.title,
        "description": c.description,
        "skill_id": c.skill_id,
        "skill_name": c.skill.name if c.skill else None,
        "skill_category": c.skill.category if c.skill else None,
        "difficulty": c.difficulty,
        "duration_hours": c.duration_hours,
        "provider": getattr(c, "platform", None) or "SkillSync Academy",
        "platform": getattr(c, "platform", None) or "SkillSync Academy",
        "rating": getattr(c, "rating", 4.5),
        "enrolled_students": getattr(c, "enrolled_students", 0),
        "url": c.url,
        "created_at": c.created_at,
    } for c in courses]


@router.post("/courses", status_code=201)
@router.post("/courses/", status_code=201)
def create_course(
    course_data: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Create a new course. Admin only."""
    skill = db.query(Skill).filter(Skill.id == course_data.skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    course = Course(**course_data.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return {"id": course.id, "title": course.title, "skill_name": course.skill.name if course.skill else None}


@router.put("/courses/{course_id}")
def update_course(
    course_id: int,
    course_data: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Update a course. Admin only."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    for field, value in course_data.model_dump(exclude_none=True).items():
        setattr(course, field, value)

    db.commit()
    db.refresh(course)
    return {"id": course.id, "title": course.title}


@router.delete("/courses/{course_id}", status_code=204)
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Delete a course. Admin only."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()
    return None


@router.get("/courses/recommended/{employee_id}")
def get_recommendations(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get recommended courses for an employee based on skill gaps."""
    if current_user.role == "EMPLOYEE" and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return get_recommended_courses(employee_id, db)


@router.get("/learning-progress/{employee_id}")
def get_learning_progress(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get learning progress for an employee."""
    if current_user.role == "EMPLOYEE" and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    progress_list = db.query(LearningProgress).filter(
        LearningProgress.employee_id == employee_id
    ).all()

    return [{
        "id": p.id,
        "employee_id": p.employee_id,
        "course_id": p.course_id,
        "course_title": p.course.title if p.course else None,
        "skill_name": p.course.skill.name if p.course and p.course.skill else None,
        "progress_percentage": p.progress_percentage,
        "status": p.status,
        "started_at": p.started_at,
        "completed_at": p.completed_at,
    } for p in progress_list]


@router.post("/learning-progress", status_code=201)
def start_course(
    progress_data: LearningProgressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Start or enroll in a course."""
    employee_id = progress_data.employee_id or current_user.id

    # Check existing
    existing = db.query(LearningProgress).filter(
        LearningProgress.employee_id == employee_id,
        LearningProgress.course_id == progress_data.course_id,
    ).first()
    if existing:
        return {"id": existing.id, "status": existing.status, "progress": existing.progress_percentage}

    progress = LearningProgress(
        employee_id=employee_id,
        course_id=progress_data.course_id,
        status="IN_PROGRESS",
        progress_percentage=0.0,
        started_at=datetime.utcnow(),
    )
    db.add(progress)
    db.commit()
    db.refresh(progress)
    return {"id": progress.id, "status": progress.status, "progress": progress.progress_percentage}


@router.put("/learning-progress/{progress_id}")
def update_progress(
    progress_id: int,
    update_data: LearningProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update learning progress."""
    progress = db.query(LearningProgress).filter(LearningProgress.id == progress_id).first()
    if not progress:
        raise HTTPException(status_code=404, detail="Progress record not found")

    if current_user.id != progress.employee_id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")

    if update_data.progress_percentage is not None:
        progress.progress_percentage = min(update_data.progress_percentage, 100.0)

    if update_data.status is not None:
        progress.status = update_data.status
        if update_data.status == "COMPLETED":
            progress.progress_percentage = 100.0
            progress.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(progress)
    return {"id": progress.id, "status": progress.status, "progress": progress.progress_percentage}
