from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_active_user, require_role
from app.models.user import User
from app.services.report_service import (
    get_employee_report,
    get_team_report,
    get_training_report,
    get_admin_report,
    generate_pdf_report,
)

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/employee")
@router.get("/employee/me")
def employee_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Employee skill report."""
    if current_user.role == "MANAGER":
        return get_employee_report(db, manager_id=current_user.id)
    elif current_user.role == "EMPLOYEE":
        return get_employee_report(db, manager_id=None)
    else:
        return get_employee_report(db)


@router.get("/employee/{employee_id}")
def employee_report_by_id(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGER", "ADMIN")),
):
    """Employee skill report by ID for managers/admins."""
    target_emp = db.query(User).filter(User.id == employee_id).first()
    if not target_emp:
        return []
    return get_employee_report(db, manager_id=current_user.id if current_user.role == "MANAGER" else None)


@router.get("/team")
def team_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGER", "ADMIN")),
):
    """Team skill report."""
    return get_team_report(current_user.id, db)


@router.get("/training")
def training_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Training requests report."""
    if current_user.role == "MANAGER":
        return get_training_report(db, manager_id=current_user.id)
    else:
        return get_training_report(db)


@router.get("/employee/pdf")
def employee_report_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Download employee skill report as PDF."""
    data = get_employee_report(db, manager_id=current_user.id if current_user.role == "MANAGER" else None)
    headers = ["Employee", "Skill", "Category", "Current Level", "Target Level", "Gap", "Status"]
    rows = [[
        d["employee_name"], d["skill_name"], d["skill_category"],
        d["current_level_label"], d["target_level_label"],
        d["gap"], d["gap_status"]
    ] for d in data]

    pdf_buffer = generate_pdf_report("Employee Skill Report", headers, rows)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=employee_skill_report.pdf"}
    )


@router.get("/team/pdf")
def team_report_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGER", "ADMIN")),
):
    """Download team skill report as PDF."""
    data = get_team_report(current_user.id, db)
    headers = ["Skill", "Category", "Employee Count", "Avg Level", "Avg Gap"]
    rows = [[d["skill_name"], d["category"], d["employee_count"], d["average_level_label"], d["average_gap"]] for d in data]

    pdf_buffer = generate_pdf_report("Team Skill Report", headers, rows)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=team_skill_report.pdf"}
    )


@router.get("/training/pdf")
def training_report_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Download training report as PDF."""
    data = get_training_report(db, manager_id=current_user.id if current_user.role == "MANAGER" else None)
    headers = ["Request ID", "Employee", "Skill", "Level", "Priority", "Status", "SME", "Created"]
    rows = [[
        d["request_id"], d["employee_name"], d["skill_name"],
        d["requested_level_label"], d["priority"], d["status"],
        d["sme_name"], (d["created_at"] or "")[:10]
    ] for d in data]

    pdf_buffer = generate_pdf_report("Training Report", headers, rows)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=training_report.pdf"}
    )


@router.get("/admin")
def admin_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Enterprise intelligence and talent readiness report for admins."""
    return get_admin_report(db)


@router.get("/admin/pdf")
def admin_report_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Download enterprise intelligence report as PDF."""
    data = get_admin_report(db)
    headers = ["Department", "Headcount", "Avg Skills / Person", "Readiness Level"]
    rows = [[
        d["department"], d["user_count"], d["avg_skills_per_user"], d["readiness"]
    ] for d in data.get("department_breakdown", [])]

    pdf_buffer = generate_pdf_report("Enterprise Intelligence & Talent Readiness Report", headers, rows)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=enterprise_intelligence_report.pdf"}
    )
