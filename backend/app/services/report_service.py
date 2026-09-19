from io import BytesIO
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from app.models.user import User
from app.models.employee_skill import EmployeeSkill
from app.models.target_skill import TargetSkill
from app.models.training import TrainingRequest
from app.models.training_assignment import TrainingAssignment
from app.models.skill import Skill
from app.models.learning_progress import LearningProgress
from app.services.skill_gap_service import calculate_skill_gaps


LEVEL_LABELS = {1: "Beginner", 2: "Basic", 3: "Intermediate", 4: "Advanced", 5: "Expert"}


def get_employee_report(db: Session, manager_id: int = None) -> list:
    """Get employee skill report data."""
    query = db.query(User).filter(User.role == "EMPLOYEE", User.is_active == True)
    if manager_id:
        query = query.filter(User.manager_id == manager_id)
    employees = query.all()

    report = []
    for emp in employees:
        gaps = calculate_skill_gaps(emp.id, db)
        for gap in gaps:
            report.append({
                "employee_name": emp.name,
                "employee_email": emp.email,
                "department": emp.department or "N/A",
                "skill_name": gap["skill_name"],
                "skill_category": gap["skill_category"],
                "current_level": gap["current_level"],
                "current_level_label": LEVEL_LABELS.get(gap["current_level"], "N/A"),
                "target_level": gap["target_level"],
                "target_level_label": LEVEL_LABELS.get(gap["target_level"], "N/A"),
                "gap": gap["gap"],
                "gap_status": gap["gap_status"],
                "readiness_percentage": gap["readiness_percentage"],
            })

    return report


def get_team_report(manager_id: int, db: Session) -> list:
    """Get team-level skill report."""
    team = db.query(User).filter(
        User.manager_id == manager_id,
        User.is_active == True
    ).all()

    # Aggregate by skill
    skill_data = {}
    for member in team:
        emp_skills = db.query(EmployeeSkill).filter(
            EmployeeSkill.employee_id == member.id
        ).all()
        for es in emp_skills:
            sname = es.skill.name if es.skill else "Unknown"
            scat = es.skill.category if es.skill else "Unknown"
            if sname not in skill_data:
                skill_data[sname] = {"category": scat, "levels": [], "gaps": []}
            skill_data[sname]["levels"].append(es.current_level)

            # Check gap
            target = db.query(TargetSkill).filter(
                TargetSkill.employee_id == member.id,
                TargetSkill.skill_id == es.skill_id,
                TargetSkill.status == "ACTIVE"
            ).first()
            if target:
                gap = target.target_level - es.current_level
                skill_data[sname]["gaps"].append(gap)

    report = []
    for skill_name, data in skill_data.items():
        levels = data["levels"]
        gaps = data["gaps"]
        avg_level = sum(levels) / len(levels) if levels else 0
        avg_gap = sum(gaps) / len(gaps) if gaps else 0
        report.append({
            "skill_name": skill_name,
            "category": data["category"],
            "employee_count": len(levels),
            "average_level": round(avg_level, 1),
            "average_level_label": LEVEL_LABELS.get(round(avg_level), "N/A"),
            "average_gap": round(avg_gap, 1),
        })

    return report


def get_training_report(db: Session, manager_id: int = None) -> list:
    """Get training requests report."""
    query = db.query(TrainingRequest)
    if manager_id:
        team = db.query(User).filter(User.manager_id == manager_id).all()
        team_ids = [m.id for m in team]
        query = query.filter(TrainingRequest.employee_id.in_(team_ids))

    requests = query.order_by(TrainingRequest.created_at.desc()).all()

    report = []
    for req in requests:
        sme_name = None
        completed_at = None
        if req.assignments:
            latest = sorted(req.assignments, key=lambda a: a.created_at, reverse=True)
            if latest:
                sme_name = latest[0].sme.name if latest[0].sme else None
                completed_at = latest[0].completed_at.isoformat() if latest[0].completed_at else None

        report.append({
            "request_id": req.id,
            "employee_name": req.employee.name if req.employee else "Unknown",
            "skill_name": req.skill.name if req.skill else "Unknown",
            "requested_level": req.requested_level,
            "requested_level_label": LEVEL_LABELS.get(req.requested_level, "N/A"),
            "priority": req.priority,
            "status": req.status,
            "sme_name": sme_name or "Unassigned",
            "created_at": req.created_at.isoformat() if req.created_at else None,
            "completed_at": completed_at,
        })

    return report


def get_admin_report(db: Session) -> dict:
    """Get enterprise intelligence and talent readiness summary."""
    total_users = db.query(User).filter(User.is_active == True).count()
    total_skills = db.query(Skill).count()

    # Distinct departments
    raw_depts = db.query(User.department).filter(User.department.isnot(None), User.department != "").distinct().all()
    departments_list = [d[0] for d in raw_depts if d[0]]
    departments_count = len(departments_list)

    # Course completion rate
    total_progress = db.query(LearningProgress).count()
    completed_progress = db.query(LearningProgress).filter(LearningProgress.status == "COMPLETED").count()
    completion_rate = round((completed_progress / total_progress * 100), 1) if total_progress > 0 else 0.0

    department_breakdown = []
    for dept in sorted(departments_list):
        dept_users = db.query(User).filter(User.department == dept, User.is_active == True).all()
        user_count = len(dept_users)
        dept_user_ids = [u.id for u in dept_users]
        if user_count > 0:
            skills_count = db.query(EmployeeSkill).filter(EmployeeSkill.employee_id.in_(dept_user_ids)).count()
            avg_skills = round(skills_count / user_count, 1)
        else:
            avg_skills = 0.0

        department_breakdown.append({
            "department": dept,
            "user_count": user_count,
            "avg_skills_per_user": avg_skills,
            "readiness": "Healthy" if avg_skills >= 8.0 else "Developing"
        })

    return {
        "total_users": total_users,
        "total_skills": total_skills,
        "departments_count": departments_count,
        "completion_rate": completion_rate,
        "department_breakdown": department_breakdown,
    }


def generate_pdf_report(title: str, headers: list, rows: list) -> BytesIO:
    """Generate a PDF report using reportlab."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch)
    styles = getSampleStyleSheet()

    elements = []

    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=20,
    )
    elements.append(Paragraph(f"Skill Sync — {title}", title_style))
    elements.append(Spacer(1, 0.2*inch))

    # Table data
    table_data = [headers]
    for row in rows:
        table_data.append([str(v) if v is not None else "" for v in row])

    if len(table_data) > 1:
        col_widths = [letter[0] / len(headers) - 0.2*inch] * len(headers)

        t = Table(table_data, colWidths=col_widths, repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#374151')),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t)
    else:
        elements.append(Paragraph("No data available.", styles['Normal']))

    doc.build(elements)
    buffer.seek(0)
    return buffer
