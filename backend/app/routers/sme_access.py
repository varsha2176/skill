from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_active_user, require_role, require_sme
from app.models.user import User
from app.models.skill import Skill
from app.models.sme_access_request import SMEAccessRequest
from app.models.sme_expertise import SMEExpertise
from app.models.notification import Notification


router = APIRouter(prefix="/sme-access", tags=["SME Capability Access"])


class SMERequestCreate(BaseModel):
    requested_skills: Optional[str] = None
    skill_id: Optional[int] = None
    reason: str
    experience: Optional[str] = None


class SMEReviewAction(BaseModel):
    approved: Optional[bool] = True
    review_comment: Optional[str] = None


@router.post("/request")
def request_sme_access(
    payload: SMERequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Normal Employee applies for SME capability.
    Creates a request in PENDING status for manager approval.
    """
    if current_user.role != "EMPLOYEE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Employees can request SME capability",
        )

    # Check for existing pending request
    existing = db.query(SMEAccessRequest).filter(
        SMEAccessRequest.employee_id == current_user.id,
        SMEAccessRequest.status == "PENDING"
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a pending SME access request",
        )

    requested_skills_val = payload.requested_skills
    if payload.skill_id and not requested_skills_val:
        sk = db.query(Skill).filter(Skill.id == payload.skill_id).first()
        if sk:
            requested_skills_val = sk.name

    req = SMEAccessRequest(
        employee_id=current_user.id,
        manager_id=current_user.manager_id,
        requested_skills=requested_skills_val,
        reason=payload.reason,
        experience=payload.experience or "Demonstrated professional competency",
        status="PENDING",
        created_at=datetime.utcnow(),
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    # Notify manager if present
    if current_user.manager_id:
        notif = Notification(
            user_id=current_user.manager_id,
            title="New SME Access Request",
            message=f"{current_user.name} has submitted an SME Access Request for review.",
            type="SME_REQUEST",
            created_at=datetime.utcnow(),
        )
        db.add(notif)
        db.commit()

    return {
        "id": req.id,
        "employee_id": req.employee_id,
        "status": req.status,
        "requested_skills": req.requested_skills,
        "reason": req.reason,
        "created_at": req.created_at,
    }


@router.get("/my-status")
def get_my_sme_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get the current user's SME status and recent request."""
    latest = db.query(SMEAccessRequest).filter(
        SMEAccessRequest.employee_id == current_user.id
    ).order_by(SMEAccessRequest.created_at.desc()).first()

    has_pending = bool(latest and latest.status == "PENDING")
    return {
        "is_sme": bool(current_user.is_sme),
        "role": current_user.role,
        "has_pending_request": has_pending,
        "latest_request": {
            "id": latest.id,
            "status": latest.status,
            "requested_skills": latest.requested_skills,
            "created_at": latest.created_at,
            "reviewed_at": latest.reviewed_at,
            "review_comment": latest.review_comment,
        } if latest else None,
    }


@router.get("/pending")
def get_pending_sme_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGER", "ADMIN")),
):
    """Manager or Admin lists pending SME capability requests."""
    query = db.query(SMEAccessRequest).filter(SMEAccessRequest.status == "PENDING")
    if current_user.role == "MANAGER":
        # Check team members or department
        team_ids = [u.id for u in db.query(User).filter(
            (User.manager_id == current_user.id) | (User.department == current_user.department)
        ).all()]
        query = query.filter(SMEAccessRequest.employee_id.in_(team_ids))

    requests = query.all()
    out = []
    for r in requests:
        emp = r.employee
        out.append({
            "id": r.id,
            "employee_id": r.employee_id,
            "employee_name": emp.name if emp else "Unknown",
            "employee_email": emp.email if emp else "",
            "department": emp.department if emp else "",
            "requested_skills": r.requested_skills,
            "reason": r.reason,
            "experience": r.experience,
            "status": r.status,
            "created_at": r.created_at,
        })
    return out


@router.put("/{request_id}/approve")
def approve_sme_access(
    request_id: int,
    action: Optional[SMEReviewAction] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGER", "ADMIN")),
):
    """
    Manager approves SME capability application.
    Updates User.is_sme = True and registers SME expertise.
    """
    req = db.query(SMEAccessRequest).filter(SMEAccessRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="SME request not found")

    req.status = "APPROVED"
    req.reviewed_at = datetime.utcnow()
    req.review_comment = action.review_comment if action else "Approved by manager"

    # Set employee is_sme = True (DO NOT CHANGE system_role)
    employee = db.query(User).filter(User.id == req.employee_id).first()
    if employee:
        employee.is_sme = True

        # Parse requested skills and add to SMEExpertise
        if req.requested_skills:
            skill_names = [s.strip() for s in req.requested_skills.split(",") if s.strip()]
            for sname in skill_names:
                skill = db.query(Skill).filter(
                    (Skill.name.ilike(sname)) | (Skill.skill_code == sname)
                ).first()
                if skill:
                    existing_exp = db.query(SMEExpertise).filter(
                        SMEExpertise.employee_id == employee.id,
                        SMEExpertise.skill_id == skill.id
                    ).first()
                    if not existing_exp:
                        exp = SMEExpertise(
                            employee_id=employee.id,
                            skill_id=skill.id,
                            skill_level=4,
                            approved_by=current_user.id,
                            approved_at=datetime.utcnow()
                        )
                        db.add(exp)

        # Create notification for employee
        notif = Notification(
            user_id=employee.id,
            title="SME Capability Approved",
            message="Congratulations! Your SME access request has been approved. You now have access to the SME Hub.",
            type="SME_APPROVED",
            created_at=datetime.utcnow()
        )
        db.add(notif)

    db.commit()
    return {"message": "SME access approved successfully", "status": "APPROVED", "is_sme": True, "request_id": req.id}


@router.put("/{request_id}/reject")
def reject_sme_access(
    request_id: int,
    action: Optional[SMEReviewAction] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("MANAGER", "ADMIN")),
):
    """
    Manager rejects SME capability application.
    Updates request status to REJECTED, ensures User.is_sme = False.
    """
    req = db.query(SMEAccessRequest).filter(SMEAccessRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="SME request not found")

    req.status = "REJECTED"
    req.reviewed_at = datetime.utcnow()
    req.review_comment = action.review_comment if action else "Declined at this time"

    employee = db.query(User).filter(User.id == req.employee_id).first()
    if employee:
        employee.is_sme = False
        notif = Notification(
            user_id=employee.id,
            title="SME Capability Request Update",
            message=f"Your SME access request was not approved: {req.review_comment}",
            type="SME_REJECTED",
            created_at=datetime.utcnow()
        )
        db.add(notif)

    db.commit()
    return {"message": "SME access rejected", "status": "REJECTED", "is_sme": False, "request_id": req.id}


@router.get("/catalog-skills")
@router.get("/skills")
def get_sme_skills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    If the user is an SME, returns their registered SME expertise skills.
    If the user is a normal employee applying for SME, returns skills available for application.
    """
    if current_user.is_sme:
        expertises = db.query(SMEExpertise).filter(SMEExpertise.employee_id == current_user.id).all()
        if expertises:
            return [{
                "id": exp.id,
                "skill_id": exp.skill_id,
                "name": exp.skill.name if exp.skill else "Unknown",
                "skill_name": exp.skill.name if exp.skill else "Unknown",
                "category": exp.skill.category if exp.skill else "Unknown",
                "level": exp.skill_level,
                "approved_at": exp.approved_at,
            } for exp in expertises]

    # For employees applying or general catalog
    skills = db.query(Skill).order_by(Skill.name).all()
    return [{
        "id": s.id,
        "name": s.name,
        "skill_code": s.skill_code,
        "category": s.category,
        "description": s.description,
    } for s in skills]
