from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_active_user, require_role, get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


def build_user_response(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "department": user.department,
        "location": user.location,
        "experience_level": user.experience_level,
        "manager_id": user.manager_id,
        "manager_name": user.manager.name if user.manager else None,
        "is_active": user.is_active,
        "created_at": user.created_at,
    }


@router.get("")
def list_users(
    role: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List users. Admins see all; Managers see their team."""
    if current_user.role not in ["ADMIN", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    query = db.query(User).filter(User.is_active == True)

    if current_user.role == "MANAGER":
        # Managers can only see their team members + themselves
        query = query.filter(
            (User.manager_id == current_user.id) | (User.id == current_user.id)
        )

    if role:
        query = query.filter(User.role == role)
    if department:
        query = query.filter(User.department == department)
    if search:
        query = query.filter(
            (User.name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
        )

    total = query.count()
    users = query.offset(skip).limit(limit).all()

    return {
        "users": [build_user_response(u) for u in users],
        "total": total,
    }


@router.get("/team")
def get_current_user_team(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get team members for current manager or all employees for admin."""
    if current_user.role == "MANAGER":
        team = db.query(User).filter(
            User.manager_id == current_user.id,
            User.is_active == True
        ).all()
    else:
        team = db.query(User).filter(
            User.role == "EMPLOYEE",
            User.is_active == True
        ).all()
    return [build_user_response(u) for u in team]


@router.get("/departments")
def get_departments_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get list of distinct departments."""
    raw_depts = db.query(User.department).filter(User.department.isnot(None), User.department != "").distinct().all()
    return sorted([d[0] for d in raw_depts if d[0]])


@router.get("/{user_id}")
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a specific user. Users can get their own profile; managers can get team members."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Authorization check
    if current_user.role == "EMPLOYEE" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if current_user.role == "SME" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if current_user.role == "MANAGER":
        if current_user.id != user_id and user.manager_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")

    return build_user_response(user)


@router.post("", status_code=201)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Create a new user. Admin only."""
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role,
        department=user_data.department,
        location=user_data.location,
        experience_level=user_data.experience_level,
        manager_id=user_data.manager_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return build_user_response(user)


@router.put("/{user_id}")
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update user. Admins can update any; employees can update themselves."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role != "ADMIN" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if user_data.name is not None:
        user.name = user_data.name
    if user_data.email is not None:
        user.email = user_data.email
    if user_data.role is not None and current_user.role == "ADMIN":
        user.role = user_data.role
    if user_data.department is not None:
        user.department = user_data.department
    if user_data.location is not None:
        user.location = user_data.location
    if user_data.experience_level is not None:
        user.experience_level = user_data.experience_level
    if user_data.manager_id is not None and current_user.role == "ADMIN":
        user.manager_id = user_data.manager_id
    if user_data.is_active is not None and current_user.role == "ADMIN":
        user.is_active = user_data.is_active
    if user_data.password is not None:
        user.password_hash = get_password_hash(user_data.password)

    db.commit()
    db.refresh(user)
    return build_user_response(user)


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Delete user. Admin only."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    user.is_active = False  # Soft delete
    db.commit()
    return None


@router.get("/{user_id}/team")
def get_team(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get team members for a manager."""
    if current_user.role not in ["ADMIN", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if current_user.role == "MANAGER" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    team = db.query(User).filter(
        User.manager_id == user_id,
        User.is_active == True
    ).all()
    return [build_user_response(u) for u in team]
