from sqlalchemy.orm import Session
from app.models.course import Course
from app.models.learning_progress import LearningProgress
from app.services.skill_gap_service import calculate_skill_gaps


DIFFICULTY_MAP = {
    1: "Beginner",
    2: "Basic",
    3: "Intermediate",
    4: "Advanced",
    5: "Expert",
}


def get_appropriate_difficulty(gap: int, current_level: int) -> list:
    """Return list of appropriate difficulty levels based on gap and current level."""
    if current_level <= 1:
        return ["Beginner", "Intermediate"]
    elif current_level <= 2:
        return ["Beginner", "Intermediate"]
    elif current_level <= 3:
        return ["Intermediate", "Advanced"]
    else:
        return ["Advanced", "Expert"]


def get_recommended_courses(employee_id: int, db: Session) -> list:
    """
    Rule-based recommendation engine.
    For every skill gap, find matching courses, select by difficulty, prefer shorter duration.
    Returns top 3 courses per skill gap.
    """
    gaps = calculate_skill_gaps(employee_id, db)
    recommendations = []

    for gap_info in gaps:
        if gap_info["gap"] <= 0:
            continue  # No gap, no recommendation needed

        skill_id = gap_info["skill_id"]
        current_level = gap_info["current_level"]
        gap = gap_info["gap"]

        # Get appropriate difficulty levels
        preferred_difficulties = get_appropriate_difficulty(gap, current_level)

        # Find courses for this skill
        courses = db.query(Course).filter(Course.skill_id == skill_id).all()

        if not courses:
            continue

        # Score courses: prefer matching difficulty, shorter duration
        scored_courses = []
        for course in courses:
            difficulty_score = 1 if course.difficulty in preferred_difficulties else 0
            duration_score = 1.0 / (course.duration_hours + 1)  # lower duration = higher score
            total_score = difficulty_score * 10 + duration_score
            scored_courses.append((total_score, course))

        # Sort by score descending
        scored_courses.sort(key=lambda x: x[0], reverse=True)

        # Take top 3
        top_courses = [c for _, c in scored_courses[:3]]

        for course in top_courses:
            # Check existing progress
            progress = db.query(LearningProgress).filter(
                LearningProgress.employee_id == employee_id,
                LearningProgress.course_id == course.id
            ).first()

            recommendations.append({
                "course_id": course.id,
                "course_title": course.title,
                "course_description": course.description,
                "skill_id": skill_id,
                "skill_name": gap_info["skill_name"],
                "skill_category": gap_info["skill_category"],
                "difficulty": course.difficulty,
                "duration_hours": course.duration_hours,
                "provider": course.provider,
                "url": course.url,
                "skill_gap": gap,
                "current_level": current_level,
                "target_level": gap_info["target_level"],
                "progress_id": progress.id if progress else None,
                "progress_percentage": progress.progress_percentage if progress else 0.0,
                "progress_status": progress.status if progress else "NOT_STARTED",
            })

    return recommendations
