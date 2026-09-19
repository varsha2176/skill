from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_active_user, require_role, require_sme
from app.models.user import User
from app.services.dashboard_service import (
    get_employee_dashboard,
    get_sme_dashboard,
    get_manager_dashboard,
    get_admin_dashboard,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/employee")
def employee_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("EMPLOYEE", "MANAGER", "ADMIN")),
):
    """Get employee dashboard data for the current user."""
    return get_employee_dashboard(current_user.id, db)


@router.get("/sme")
def sme_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_sme),
):
    """Get SME dashboard data (requires is_sme=True)."""
    return get_sme_dashboard(current_user.id, db)


@router.get("/manager")
def manager_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGER", "ADMIN")),
):
    """Get manager dashboard data."""
    return get_manager_dashboard(current_user.id, db)


@router.get("/admin")
def admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Get admin dashboard data."""
    return get_admin_dashboard(db)

