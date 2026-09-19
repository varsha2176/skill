from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_active_user, require_role, require_sme
from app.models.training import TrainingRequest
from app.models.training_assignment import TrainingAssignment
from app.models.employee_skill import EmployeeSkill
from app.models.user import User
from app.models.sme_expertise import SMEExpertise
from app.schemas.training import TrainingRequestCreate
from app.services.matching_service import get_matching_requests
from app.services.notification_service import (
    notify_training_claimed, notify_training_started,
    notify_training_completed, notify_new_training_request
)

router = APIRouter(tags=["Training"])


def build_request_response(req: TrainingRequest) -> dict:
    sme_name = None
    sme_id = req.claimed_by_sme_id
    if req.claimed_by:
        sme_name = req.claimed_by.name
    elif req.assignments:
        latest = sorted(req.assignments, key=lambda a: a.created_at, reverse=True)
        if latest and latest[0].sme:
            sme_name = latest[0].sme.name
            sme_id = latest[0].sme_id

    return {
        "id": req.id,
        "request_code": req.request_code or f"REQ-{req.id:04d}",
        "employee_id": req.employee_id,
        "employee_name": req.employee.name if req.employee else None,
        "skill_id": req.skill_id,
        "skill_name": req.skill.name if req.skill else None,
        "requested_level": req.requested_level,
        "message": req.message or req.notes,
        "notes": req.notes or req.message,
        "priority": req.priority,
        "status": req.status,
        "request_type": req.request_type or "online_session",
        "sme_id": sme_id,
        "sme_name": sme_name,
        "claimed_by_sme_id": sme_id,
        "claimed_by_sme_name": sme_name,
        "requested_date": req.requested_date,
        "preferred_date": req.preferred_date,
        "created_at": req.created_at,
        "updated_at": req.updated_at,
    }


@router.post("/training-requests", status_code=201)
@router.post("/training-requests/", status_code=201)
def create_training_request(
    request_data: TrainingRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a training request."""
    if current_user.role not in ["EMPLOYEE", "MANAGER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    req = TrainingRequest(
        employee_id=current_user.id,
        skill_id=request_data.skill_id,
        requested_level=request_data.requested_level,
        message=request_data.message,
        notes=request_data.message,
        priority=request_data.priority or "MEDIUM",
        status="PENDING",
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    # Notify eligible SMEs (users where is_sme == True)
    smes = db.query(User).filter(User.is_sme == True, User.is_active == True).all()
    eligible_sme_ids = []
    for sme in smes:
        sme_skill = db.query(EmployeeSkill).filter(
            EmployeeSkill.employee_id == sme.id,
            EmployeeSkill.skill_id == request_data.skill_id,
            EmployeeSkill.current_level >= request_data.requested_level,
        ).first()
        if sme_skill:
            eligible_sme_ids.append(sme.id)

    if eligible_sme_ids and req.skill:
        notify_new_training_request(req.skill.name, eligible_sme_ids, db)

    return build_request_response(req)


@router.get("/training-requests/available")
def get_available_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_sme),
):
    """List pending training requests eligible for current SME."""
    matching = get_matching_requests(current_user.id, db)
    return [build_request_response(r) for r in matching]


@router.get("/training-requests/my-requests")
def get_my_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List training requests created by the current user."""
    requests = db.query(TrainingRequest).filter(
        TrainingRequest.employee_id == current_user.id
    ).order_by(TrainingRequest.created_at.desc()).all()
    return [build_request_response(r) for r in requests]


@router.get("/training-requests/sme-active")
def get_sme_active_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_sme),
):
    """List active / in-progress training sessions claimed by this SME."""
    requests = db.query(TrainingRequest).filter(
        (TrainingRequest.claimed_by_sme_id == current_user.id) |
        (TrainingRequest.id.in_(
            db.query(TrainingAssignment.training_request_id).filter(
                TrainingAssignment.sme_id == current_user.id,
                TrainingAssignment.status == "ACTIVE"
            )
        )),
        TrainingRequest.status.in_(["CLAIMED", "IN_PROGRESS"])
    ).order_by(TrainingRequest.updated_at.desc()).all()
    return [build_request_response(r) for r in requests]


@router.get("/training-requests/sme-history")
def get_sme_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_sme),
):
    """List completed training sessions conducted by this SME."""
    requests = db.query(TrainingRequest).filter(
        (TrainingRequest.claimed_by_sme_id == current_user.id) |
        (TrainingRequest.id.in_(
            db.query(TrainingAssignment.training_request_id).filter(
                TrainingAssignment.sme_id == current_user.id
            )
        )),
        TrainingRequest.status == "COMPLETED"
    ).order_by(TrainingRequest.updated_at.desc()).all()
    return [build_request_response(r) for r in requests]


@router.get("/training-requests")
@router.get("/training-requests/")
def list_training_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List training requests based on role."""
    if current_user.role == "EMPLOYEE":
        if current_user.is_sme:
            # SME sees: their claimed/in_progress + matching pending
            matching = get_matching_requests(current_user.id, db)
            claimed = db.query(TrainingRequest).join(
                TrainingAssignment,
                TrainingRequest.id == TrainingAssignment.training_request_id
            ).filter(
                TrainingAssignment.sme_id == current_user.id,
                TrainingRequest.status.in_(["CLAIMED", "IN_PROGRESS", "COMPLETED"])
            ).all()
            all_ids = {r.id for r in matching} | {r.id for r in claimed}
            requests = db.query(TrainingRequest).filter(TrainingRequest.id.in_(all_ids)).all()
        else:
            requests = db.query(TrainingRequest).filter(
                TrainingRequest.employee_id == current_user.id
            ).order_by(TrainingRequest.created_at.desc()).all()
    elif current_user.role == "MANAGER":
        team_ids = [m.id for m in db.query(User).filter(
            (User.manager_id == current_user.id) | (User.department == current_user.department)
        ).all()]
        requests = db.query(TrainingRequest).filter(
            TrainingRequest.employee_id.in_(team_ids)
        ).order_by(TrainingRequest.created_at.desc()).all()
    else:  # ADMIN
        requests = db.query(TrainingRequest).order_by(TrainingRequest.created_at.desc()).all()

    return [build_request_response(r) for r in requests]


@router.get("/training-requests/{request_id}")
def get_training_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a specific training request."""
    req = db.query(TrainingRequest).filter(TrainingRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Training request not found")
    return build_request_response(req)


@router.put("/training-requests/{request_id}/claim")
@router.post("/training-requests/{request_id}/claim")
def claim_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_sme),
):
    """Approved SME claims a training request."""
    req = db.query(TrainingRequest).filter(TrainingRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Training request not found")

    if req.status not in ["PENDING", "open"]:
        raise HTTPException(status_code=400, detail=f"Cannot claim request in status: {req.status}")

    # Create assignment
    assignment = TrainingAssignment(
        training_request_id=req.id,
        sme_id=current_user.id,
        status="ACTIVE",
    )
    db.add(assignment)

    req.status = "CLAIMED"
    req.claimed_by_sme_id = current_user.id
    req.updated_at = datetime.utcnow()
    db.commit()

    # Notify employee
    if req.skill:
        notify_training_claimed(req.employee_id, req.skill.name, current_user.name, db)

    db.refresh(req)
    return build_request_response(req)


@router.put("/training-requests/{request_id}/start")
@router.post("/training-requests/{request_id}/start")
def start_training(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_sme),
):
    """Approved SME starts training."""
    req = db.query(TrainingRequest).filter(TrainingRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Training request not found")

    if req.status != "CLAIMED":
        raise HTTPException(status_code=400, detail=f"Cannot start request in status: {req.status}")

    # Verify this SME is assigned
    assignment = db.query(TrainingAssignment).filter(
        TrainingAssignment.training_request_id == req.id,
        TrainingAssignment.sme_id == current_user.id,
    ).first()

    if not assignment and req.claimed_by_sme_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not assigned to this request")

    req.status = "IN_PROGRESS"
    req.updated_at = datetime.utcnow()
    db.commit()

    if req.skill:
        notify_training_started(req.employee_id, req.skill.name, current_user.name, db)

    db.refresh(req)
    return build_request_response(req)


@router.put("/training-requests/{request_id}/complete")
@router.post("/training-requests/{request_id}/complete")
def complete_training(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_sme),
):
    """Approved SME completes training."""
    req = db.query(TrainingRequest).filter(TrainingRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Training request not found")

    if req.status not in ["IN_PROGRESS", "CLAIMED"]:
        raise HTTPException(status_code=400, detail=f"Cannot complete request in status: {req.status}")

    assignment = db.query(TrainingAssignment).filter(
        TrainingAssignment.training_request_id == req.id,
        TrainingAssignment.sme_id == current_user.id,
    ).first()

    if assignment:
        assignment.status = "COMPLETED"
        assignment.completed_at = datetime.utcnow()
        assignment.duration_hours = 2.0

    req.status = "COMPLETED"
    req.updated_at = datetime.utcnow()
    db.commit()

    if req.skill:
        notify_training_completed(req.employee_id, req.skill.name, db)

    db.refresh(req)
    return build_request_response(req)


@router.put("/training-requests/{request_id}/cancel")
@router.post("/training-requests/{request_id}/cancel")
def cancel_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Cancel a training request."""
    req = db.query(TrainingRequest).filter(TrainingRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Training request not found")

    if req.status in ["COMPLETED", "CANCELLED"]:
        raise HTTPException(status_code=400, detail="Cannot cancel a completed or already cancelled request")

    if current_user.role != "ADMIN" and req.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    req.status = "CANCELLED"
    req.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(req)
    return build_request_response(req)
