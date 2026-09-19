from sqlalchemy.orm import Session
from app.models.employee_skill import EmployeeSkill
from app.models.training import TrainingRequest


def get_matching_requests(sme_id: int, db: Session) -> list:
    """
    Returns training requests the SME can handle.
    SME can handle requests where:
    - SME has validated skill at level >= requested_level
    - Request status is PENDING
    """
    # Get SME's validated skills
    sme_skills = db.query(EmployeeSkill).filter(
        EmployeeSkill.employee_id == sme_id,
        EmployeeSkill.validated == True
    ).all()

    sme_skill_map = {es.skill_id: es.current_level for es in sme_skills}

    # Get pending requests
    pending_requests = db.query(TrainingRequest).filter(
        TrainingRequest.status == "PENDING"
    ).all()

    matching = []
    for request in pending_requests:
        # Skip own requests (employee cannot be their own SME)
        if request.employee_id == sme_id:
            continue

        # Check if SME has the skill at required level
        sme_level = sme_skill_map.get(request.skill_id, 0)
        if sme_level >= request.requested_level:
            matching.append(request)

    return matching


def get_sme_impact_score(sme_id: int, db: Session) -> dict:
    """
    Calculate SME impact score deterministically.
    Formula based on: learners helped, completed sessions, training hours.
    Score is normalized 0-100.
    """
    from app.models.training_assignment import TrainingAssignment
    from app.models.training import TrainingRequest

    # Get all completed assignments by this SME
    completed = db.query(TrainingAssignment).filter(
        TrainingAssignment.sme_id == sme_id,
        TrainingAssignment.status == "COMPLETED"
    ).all()

    sessions_completed = len(completed)

    # Unique learners helped (via training requests)
    learner_ids = set()
    total_hours = 0.0
    for assignment in completed:
        request = assignment.training_request
        if request:
            learner_ids.add(request.employee_id)
        if assignment.duration_hours:
            total_hours += assignment.duration_hours

    learners_helped = len(learner_ids)

    # All active/completed assignments
    all_assignments = db.query(TrainingAssignment).filter(
        TrainingAssignment.sme_id == sme_id
    ).all()

    # Normalize score: max 100
    # Formula: 40% sessions (capped at 20 sessions) + 40% learners (capped at 20) + 20% hours (capped at 100h)
    session_score = min(sessions_completed / 20.0, 1.0) * 40
    learner_score = min(learners_helped / 20.0, 1.0) * 40
    hours_score = min(total_hours / 100.0, 1.0) * 20

    impact_score = round(session_score + learner_score + hours_score, 1)

    return {
        "impact_score": impact_score,
        "sessions_completed": sessions_completed,
        "learners_helped": learners_helped,
        "training_hours": round(total_hours, 1),
    }
