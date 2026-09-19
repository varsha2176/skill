from sqlalchemy.orm import Session
from app.models.user import User
from app.models.employee_skill import EmployeeSkill
from app.models.target_skill import TargetSkill
from app.models.training import TrainingRequest
from app.models.training_assignment import TrainingAssignment
from app.models.project import Project
from app.models.skill import Skill
from app.models.notification import Notification
from app.services.skill_gap_service import calculate_skill_gaps, calculate_overall_readiness
from app.services.matching_service import get_matching_requests, get_sme_impact_score
from app.services.project_readiness_service import calculate_project_readiness


def get_employee_dashboard(employee_id: int, db: Session) -> dict:
    user = db.query(User).filter(User.id == employee_id).first()
    if not user:
        return {}

    # Skill gaps
    gaps = calculate_skill_gaps(employee_id, db)
    overall_readiness = calculate_overall_readiness(employee_id, db)

    # Total employee skills
    total_skills = db.query(EmployeeSkill).filter(
        EmployeeSkill.employee_id == employee_id
    ).count()

    # Skill gaps count (gap > 0)
    gaps_count = sum(1 for g in gaps if g["gap"] > 0)

    # Training requests count
    training_count = db.query(TrainingRequest).filter(
        TrainingRequest.employee_id == employee_id
    ).count()

    # Radar data - from employee skills (use all skills employee has)
    emp_skills = db.query(EmployeeSkill).filter(
        EmployeeSkill.employee_id == employee_id
    ).all()

    radar_data = []
    for es in emp_skills:
        # Find target level if exists
        target = db.query(TargetSkill).filter(
            TargetSkill.employee_id == employee_id,
            TargetSkill.skill_id == es.skill_id,
            TargetSkill.status == "ACTIVE"
        ).first()
        radar_data.append({
            "skill": es.skill.name if es.skill else "Unknown",
            "current": es.current_level,
            "target": target.target_level if target else es.current_level,
        })

    # Recent training requests
    recent_training = db.query(TrainingRequest).filter(
        TrainingRequest.employee_id == employee_id
    ).order_by(TrainingRequest.created_at.desc()).limit(5).all()

    recent_training_data = []
    for tr in recent_training:
        sme_name = None
        if tr.assignments:
            latest = sorted(tr.assignments, key=lambda a: a.created_at, reverse=True)
            if latest:
                sme_name = latest[0].sme.name if latest[0].sme else None
        recent_training_data.append({
            "id": tr.id,
            "skill_name": tr.skill.name if tr.skill else "Unknown",
            "requested_level": tr.requested_level,
            "priority": tr.priority,
            "status": tr.status,
            "sme_name": sme_name,
            "created_at": tr.created_at.isoformat() if tr.created_at else None,
        })

    # Recent notifications
    recent_notifs = db.query(Notification).filter(
        Notification.user_id == employee_id
    ).order_by(Notification.created_at.desc()).limit(5).all()

    notif_data = [{
        "id": n.id,
        "title": n.title,
        "message": n.message,
        "type": n.type,
        "is_read": n.is_read,
        "created_at": n.created_at.isoformat() if n.created_at else None,
    } for n in recent_notifs]

    # Target skills with gap info
    target_data = []
    for gap in gaps:
        target_data.append({
            "skill_id": gap["skill_id"],
            "skill_name": gap["skill_name"],
            "skill_category": gap["skill_category"],
            "current_level": gap["current_level"],
            "target_level": gap["target_level"],
            "gap": gap["gap"],
            "gap_status": gap["gap_status"],
            "readiness_percentage": gap["readiness_percentage"],
            "validated": gap.get("validated", False),
        })

    return {
        "user_id": employee_id,
        "user_name": user.name,
        "overall_readiness": overall_readiness,
        "total_skills": total_skills,
        "skill_gaps_count": gaps_count,
        "training_requests_count": training_count,
        "radar_data": radar_data,
        "skill_gaps": gaps,
        "recent_training_requests": recent_training_data,
        "recent_notifications": notif_data,
        "target_skills": target_data,
    }


def get_sme_dashboard(sme_id: int, db: Session) -> dict:
    user = db.query(User).filter(User.id == sme_id).first()
    if not user:
        return {}

    # Impact metrics
    impact = get_sme_impact_score(sme_id, db)

    # Claimable requests
    matching = get_matching_requests(sme_id, db)

    # SME's own skills
    sme_skills = db.query(EmployeeSkill).filter(
        EmployeeSkill.employee_id == sme_id
    ).all()

    sme_skills_data = [{
        "skill_name": es.skill.name if es.skill else "Unknown",
        "skill_category": es.skill.category if es.skill else "Unknown",
        "current_level": es.current_level,
        "validated": es.validated,
    } for es in sme_skills]

    # Available requests
    available_data = []
    for req in matching[:10]:
        available_data.append({
            "id": req.id,
            "employee_name": req.employee.name if req.employee else "Unknown",
            "skill_name": req.skill.name if req.skill else "Unknown",
            "requested_level": req.requested_level,
            "priority": req.priority,
            "message": req.message,
            "status": req.status,
            "created_at": req.created_at.isoformat() if req.created_at else None,
        })

    # Active assignments
    active_assignments = db.query(TrainingAssignment).filter(
        TrainingAssignment.sme_id == sme_id,
        TrainingAssignment.status == "ACTIVE"
    ).all()

    active_data = []
    for ta in active_assignments:
        req = ta.training_request
        if req:
            active_data.append({
                "assignment_id": ta.id,
                "request_id": req.id,
                "employee_name": req.employee.name if req.employee else "Unknown",
                "skill_name": req.skill.name if req.skill else "Unknown",
                "requested_level": req.requested_level,
                "status": req.status,
                "created_at": ta.created_at.isoformat() if ta.created_at else None,
            })

    return {
        "user_id": sme_id,
        "user_name": user.name,
        "claimable_requests": len(matching),
        "sessions_completed": impact["sessions_completed"],
        "learners_helped": impact["learners_helped"],
        "impact_score": impact["impact_score"],
        "training_hours": impact["training_hours"],
        "sme_skills": sme_skills_data,
        "available_requests": available_data,
        "active_assignments": active_data,
    }


def get_manager_dashboard(manager_id: int, db: Session) -> dict:
    user = db.query(User).filter(User.id == manager_id).first()
    if not user:
        return {}

    # Team members
    team = db.query(User).filter(
        User.manager_id == manager_id,
        User.is_active == True
    ).all()

    team_count = len(team)

    # Total unique skills across team
    team_ids = [m.id for m in team]
    if team_ids:
        total_skills = db.query(EmployeeSkill).filter(
            EmployeeSkill.employee_id.in_(team_ids)
        ).count()

        # Critical gaps across team
        critical_gaps = 0
        for member_id in team_ids:
            gaps = calculate_skill_gaps(member_id, db)
            critical_gaps += sum(1 for g in gaps if g["gap_status"] == "CRITICAL")

        # Pending validations (unvalidated skills of team members)
        pending_validations = db.query(EmployeeSkill).filter(
            EmployeeSkill.employee_id.in_(team_ids),
            EmployeeSkill.validated == False
        ).count()

        # Active training requests in team
        active_training = db.query(TrainingRequest).filter(
            TrainingRequest.employee_id.in_(team_ids),
            TrainingRequest.status.in_(["PENDING", "CLAIMED", "IN_PROGRESS"])
        ).count()
    else:
        total_skills = 0
        critical_gaps = 0
        pending_validations = 0
        active_training = 0

    # Team member data
    team_data = []
    for member in team:
        gaps = calculate_skill_gaps(member.id, db)
        readiness = calculate_overall_readiness(member.id, db)
        team_data.append({
            "id": member.id,
            "name": member.name,
            "email": member.email,
            "department": member.department,
            "experience_level": member.experience_level,
            "overall_readiness": readiness,
            "critical_gaps": sum(1 for g in gaps if g["gap_status"] == "CRITICAL"),
            "skill_count": len([es for es in member.employee_skills]),
        })

    # Skill heatmap data
    # Get all unique skills across team
    all_skill_ids = set()
    for member in team:
        for es in member.employee_skills:
            all_skill_ids.add(es.skill_id)

    heatmap_skills = []
    for sid in list(all_skill_ids)[:10]:  # limit to 10 skills for display
        skill = db.query(Skill).filter(Skill.id == sid).first()
        if skill:
            heatmap_skills.append({"id": sid, "name": skill.name})

    heatmap_employees = []
    for member in team:
        emp_skill_map = {es.skill_id: es.current_level for es in member.employee_skills}
        skills_row = []
        for hs in heatmap_skills:
            level = emp_skill_map.get(hs["id"], 0)
            if level >= 4:
                status = "Strong"
            elif level >= 2:
                status = "Medium"
            elif level == 0:
                status = "Missing"
            else:
                status = "Gap"
            skills_row.append({"skill_id": hs["id"], "level": level, "status": status})
        heatmap_employees.append({
            "employee_id": member.id,
            "employee_name": member.name,
            "skills": skills_row,
        })

    return {
        "user_id": manager_id,
        "user_name": user.name,
        "team_count": team_count,
        "total_skills": total_skills,
        "critical_gaps": critical_gaps,
        "pending_validations": pending_validations,
        "active_training": active_training,
        "team_members": team_data,
        "skill_heatmap": {
            "skills": heatmap_skills,
            "employees": heatmap_employees,
        },
        "recent_validations": [],
    }


def get_admin_dashboard(db: Session) -> dict:
    total_users = db.query(User).filter(User.is_active == True).count()
    from app.models.skill import Skill
    from app.models.course import Course
    total_skills = db.query(Skill).count()
    total_courses = db.query(Course).count()
    total_training = db.query(TrainingRequest).count()

    # Users by role (strictly ADMIN, MANAGER, EMPLOYEE system roles, plus SME capability count)
    users_by_role = {
        "ADMIN": db.query(User).filter(User.role == "ADMIN", User.is_active == True).count(),
        "MANAGER": db.query(User).filter(User.role == "MANAGER", User.is_active == True).count(),
        "EMPLOYEE": db.query(User).filter(User.role == "EMPLOYEE", User.is_active == True).count(),
        "SME Capability": db.query(User).filter(User.is_sme == True, User.is_active == True).count(),
    }

    # Users by department
    users_by_dept = {}
    all_users = db.query(User).filter(User.is_active == True).all()
    for u in all_users:
        dept = u.department or "Unknown"
        users_by_dept[dept] = users_by_dept.get(dept, 0) + 1

    # Training by status
    statuses = ["PENDING", "CLAIMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]
    training_by_status = {}
    for status in statuses:
        training_by_status[status] = db.query(TrainingRequest).filter(
            TrainingRequest.status == status
        ).count()

    # Recent activity - last 10 training requests
    recent = db.query(TrainingRequest).order_by(
        TrainingRequest.created_at.desc()
    ).limit(10).all()
    recent_data = [{
        "id": tr.id,
        "employee_name": tr.employee.name if tr.employee else "Unknown",
        "skill_name": tr.skill.name if tr.skill else "Unknown",
        "status": tr.status,
        "created_at": tr.created_at.isoformat() if tr.created_at else None,
    } for tr in recent]

    return {
        "total_users": total_users,
        "total_skills": total_skills,
        "total_courses": total_courses,
        "total_training_requests": total_training,
        "users_by_role": users_by_role,
        "users_by_department": users_by_dept,
        "training_by_status": training_by_status,
        "recent_activity": recent_data,
    }
