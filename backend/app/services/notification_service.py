from datetime import datetime
from sqlalchemy.orm import Session
from app.models.notification import Notification


def create_notification(user_id: int, title: str, message: str, notif_type: str, db: Session) -> Notification:
    """Create a new notification for a user."""
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notif_type,
        is_read=False,
        created_at=datetime.utcnow(),
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def notify_skill_validated(employee_id: int, skill_name: str, manager_name: str, approved: bool, db: Session):
    """Notify employee that their skill was validated or rejected."""
    if approved:
        title = "Skill Validated ✓"
        message = f"Your {skill_name} skill has been validated by {manager_name}."
    else:
        title = "Skill Validation Rejected"
        message = f"Your {skill_name} skill validation was not approved by {manager_name}. Please review."
    create_notification(employee_id, title, message, "SKILL_VALIDATED", db)


def notify_training_claimed(employee_id: int, skill_name: str, sme_name: str, db: Session):
    """Notify employee that their training request was claimed."""
    title = "Training Request Claimed"
    message = f"Your {skill_name} training request has been claimed by {sme_name}."
    create_notification(employee_id, title, message, "TRAINING_CLAIMED", db)


def notify_training_started(employee_id: int, skill_name: str, sme_name: str, db: Session):
    """Notify employee that their training has started."""
    title = "Training Started 🎓"
    message = f"Your {skill_name} training has been started by {sme_name}."
    create_notification(employee_id, title, message, "TRAINING_STARTED", db)


def notify_training_completed(employee_id: int, skill_name: str, db: Session):
    """Notify employee that their training is complete."""
    title = "Training Completed 🎉"
    message = f"Your {skill_name} training has been completed. Great job!"
    create_notification(employee_id, title, message, "TRAINING_COMPLETED", db)


def notify_new_training_request(skill_name: str, sme_user_ids: list, db: Session):
    """Notify eligible SMEs about a new training request."""
    title = "New Training Request Available"
    message = f"A new {skill_name} training request is available for you to claim."
    for sme_id in sme_user_ids:
        create_notification(sme_id, title, message, "NEW_REQUEST", db)


def notify_pending_validations(manager_id: int, count: int, db: Session):
    """Notify manager about pending skill validations."""
    title = "Pending Skill Validations"
    message = f"You have {count} employee skill{'s' if count != 1 else ''} waiting for validation."
    create_notification(manager_id, title, message, "PENDING_VALIDATION", db)
