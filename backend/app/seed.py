"""
Seed script for Skill Sync database.
Creates all demo accounts, skills, courses, and relationships.
Run with: python -m app.seed
"""
import sys
import os
from datetime import datetime, date, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.skill import Skill
from app.models.employee_skill import EmployeeSkill
from app.models.target_skill import TargetSkill
from app.models.course import Course
from app.models.training import TrainingRequest
from app.models.training_assignment import TrainingAssignment
from app.models.skill_validation import SkillValidation
from app.models.learning_progress import LearningProgress
from app.models.project import Project
from app.models.project_requirement import ProjectRequirement
from app.models.notification import Notification
import app.models  # noqa - register all models


def seed():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        existing = db.query(User).filter(User.email == "admin@skillsync.com").first()
        if existing:
            print("Database already seeded. Skipping...")
            return

        print("Seeding database...")

        # =====================
        # SKILLS
        # =====================
        skills_data = [
            {"name": "Python", "category": "Programming", "description": "Python programming language"},
            {"name": "SQL", "category": "Database", "description": "Structured Query Language"},
            {"name": "Docker", "category": "DevOps", "description": "Container platform"},
            {"name": "Kubernetes", "category": "DevOps", "description": "Container orchestration"},
            {"name": "AWS", "category": "Cloud", "description": "Amazon Web Services"},
            {"name": "React", "category": "Frontend", "description": "React.js framework"},
            {"name": "FastAPI", "category": "Programming", "description": "Modern Python web framework"},
            {"name": "Machine Learning", "category": "Data Science", "description": "ML algorithms and models"},
            {"name": "Data Analysis", "category": "Data Science", "description": "Data analysis and visualization"},
            {"name": "Cloud Architecture", "category": "Cloud", "description": "Cloud systems design"},
            {"name": "Java", "category": "Programming", "description": "Java programming language"},
            {"name": "JavaScript", "category": "Programming", "description": "JavaScript programming"},
            {"name": "Node.js", "category": "Backend", "description": "Node.js runtime"},
            {"name": "Angular", "category": "Frontend", "description": "Angular framework"},
            {"name": "DevOps", "category": "DevOps", "description": "Development operations practices"},
            {"name": "CI/CD", "category": "DevOps", "description": "Continuous integration and deployment"},
            {"name": "Security", "category": "Infrastructure", "description": "Application security"},
            {"name": "MongoDB", "category": "Database", "description": "NoSQL database"},
            {"name": "Redis", "category": "Database", "description": "In-memory data store"},
            {"name": "Microservices", "category": "Architecture", "description": "Microservices architecture"},
        ]

        skills = {}
        for sd in skills_data:
            skill = Skill(**sd)
            db.add(skill)
            db.flush()
            skills[sd["name"]] = skill

        db.flush()

        # =====================
        # USERS: Admin
        # =====================
        admin = User(
            name="Admin User",
            email="admin@skillsync.com",
            password_hash=get_password_hash("password123"),
            role="ADMIN",
            department="IT",
            location="Bangalore",
            experience_level="Senior",
            is_active=True,
        )
        db.add(admin)
        db.flush()

        # =====================
        # USERS: Managers
        # =====================
        priya = User(
            name="Priya Sharma",
            email="manager@skillsync.com",
            password_hash=get_password_hash("password123"),
            role="MANAGER",
            department="Engineering",
            location="Bangalore",
            experience_level="Senior",
            is_active=True,
        )
        db.add(priya)
        db.flush()

        manager2 = User(
            name="Rajesh Kumar",
            email="rajesh@skillsync.com",
            password_hash=get_password_hash("password123"),
            role="MANAGER",
            department="Data Science",
            location="Mumbai",
            experience_level="Senior",
            is_active=True,
        )
        db.add(manager2)
        db.flush()

        manager3 = User(
            name="Sunita Patel",
            email="sunita@skillsync.com",
            password_hash=get_password_hash("password123"),
            role="MANAGER",
            department="DevOps",
            location="Hyderabad",
            experience_level="Senior",
            is_active=True,
        )
        db.add(manager3)
        db.flush()

        # =====================
        # USERS: SMEs
        # =====================
        arun = User(
            name="Arun Kumar",
            email="sme@skillsync.com",
            password_hash=get_password_hash("password123"),
            role="SME",
            department="Engineering",
            location="Bangalore",
            experience_level="Senior",
            manager_id=priya.id,
            is_active=True,
        )
        db.add(arun)
        db.flush()

        sme2 = User(
            name="Deepa Nair",
            email="deepa@skillsync.com",
            password_hash=get_password_hash("password123"),
            role="SME",
            department="Data Science",
            location="Chennai",
            experience_level="Senior",
            manager_id=manager2.id,
            is_active=True,
        )
        db.add(sme2)
        db.flush()

        sme3 = User(
            name="Vivek Singh",
            email="vivek@skillsync.com",
            password_hash=get_password_hash("password123"),
            role="SME",
            department="DevOps",
            location="Pune",
            experience_level="Senior",
            manager_id=manager3.id,
            is_active=True,
        )
        db.add(sme3)
        db.flush()

        sme4 = User(
            name="Meera Reddy",
            email="meera@skillsync.com",
            password_hash=get_password_hash("password123"),
            role="SME",
            department="Engineering",
            location="Bangalore",
            experience_level="Mid",
            manager_id=priya.id,
            is_active=True,
        )
        db.add(sme4)
        db.flush()

        sme5 = User(
            name="Ankit Sharma",
            email="ankit@skillsync.com",
            password_hash=get_password_hash("password123"),
            role="SME",
            department="Cloud",
            location="Delhi",
            experience_level="Senior",
            manager_id=priya.id,
            is_active=True,
        )
        db.add(sme5)
        db.flush()

        # =====================
        # USERS: Employees
        # =====================
        # Main demo employee: Rahul Kumar - under Priya Sharma
        rahul = User(
            name="Rahul Kumar",
            email="employee@skillsync.com",
            password_hash=get_password_hash("password123"),
            role="EMPLOYEE",
            department="Engineering",
            location="Bangalore",
            experience_level="Mid",
            manager_id=priya.id,
            is_active=True,
        )
        db.add(rahul)
        db.flush()

        emp2 = User(
            name="Anjali Gupta",
            email="anjali@skillsync.com",
            password_hash=get_password_hash("password123"),
            role="EMPLOYEE",
            department="Engineering",
            location="Bangalore",
            experience_level="Junior",
            manager_id=priya.id,
            is_active=True,
        )
        db.add(emp2)
        db.flush()

        emp3 = User(
            name="Suresh Menon",
            email="suresh@skillsync.com",
            password_hash=get_password_hash("password123"),
            role="EMPLOYEE",
            department="Data Science",
            location="Mumbai",
            experience_level="Mid",
            manager_id=manager2.id,
            is_active=True,
        )
        db.add(emp3)
        db.flush()

        emp4 = User(
            name="Kavya Reddy",
            email="kavya@skillsync.com",
            password_hash=get_password_hash("password123"),
            role="EMPLOYEE",
            department="DevOps",
            location="Hyderabad",
            experience_level="Junior",
            manager_id=manager3.id,
            is_active=True,
        )
        db.add(emp4)
        db.flush()

        emp5 = User(
            name="Vikram Joshi",
            email="vikram@skillsync.com",
            password_hash=get_password_hash("password123"),
            role="EMPLOYEE",
            department="Engineering",
            location="Pune",
            experience_level="Senior",
            manager_id=priya.id,
            is_active=True,
        )
        db.add(emp5)
        db.flush()

        emp6 = User(
            name="Pooja Iyer",
            email="pooja@skillsync.com",
            password_hash=get_password_hash("password123"),
            role="EMPLOYEE",
            department="Data Science",
            location="Chennai",
            experience_level="Mid",
            manager_id=manager2.id,
            is_active=True,
        )
        db.add(emp6)
        db.flush()

        emp7 = User(
            name="Kiran Shah",
            email="kiran@skillsync.com",
            password_hash=get_password_hash("password123"),
            role="EMPLOYEE",
            department="DevOps",
            location="Ahmedabad",
            experience_level="Junior",
            manager_id=manager3.id,
            is_active=True,
        )
        db.add(emp7)
        db.flush()

        emp8 = User(
            name="Raju Pillai",
            email="raju@skillsync.com",
            password_hash=get_password_hash("password123"),
            role="EMPLOYEE",
            department="Engineering",
            location="Kochi",
            experience_level="Mid",
            manager_id=priya.id,
            is_active=True,
        )
        db.add(emp8)
        db.flush()

        emp9 = User(
            name="Nisha Bose",
            email="nisha@skillsync.com",
            password_hash=get_password_hash("password123"),
            role="EMPLOYEE",
            department="Cloud",
            location="Kolkata",
            experience_level="Senior",
            manager_id=priya.id,
            is_active=True,
        )
        db.add(emp9)
        db.flush()

        emp10 = User(
            name="Dev Chopra",
            email="dev@skillsync.com",
            password_hash=get_password_hash("password123"),
            role="EMPLOYEE",
            department="Engineering",
            location="Noida",
            experience_level="Junior",
            manager_id=manager2.id,
            is_active=True,
        )
        db.add(emp10)
        db.flush()

        # =====================
        # EMPLOYEE SKILLS - Rahul Kumar
        # Python=4, SQL=4, Docker=2, Kubernetes=1, AWS=2
        # =====================
        rahul_skills = [
            (skills["Python"], 4, True, priya.id),
            (skills["SQL"], 4, True, priya.id),
            (skills["Docker"], 2, False, None),
            (skills["Kubernetes"], 1, False, None),
            (skills["AWS"], 2, False, None),
            (skills["React"], 3, True, priya.id),
        ]
        rahul_skill_objs = {}
        for skill, level, validated, validator_id in rahul_skills:
            es = EmployeeSkill(
                employee_id=rahul.id,
                skill_id=skill.id,
                current_level=level,
                validated=validated,
                validated_by=validator_id,
                validated_at=datetime(2024, 1, 15) if validated else None,
            )
            db.add(es)
            db.flush()
            rahul_skill_objs[skill.name] = es

        # =====================
        # TARGET SKILLS - Rahul Kumar
        # Docker=4, Kubernetes=4, AWS=3
        # =====================
        rahul_targets = [
            (skills["Docker"], 4, date(2025, 6, 30)),
            (skills["Kubernetes"], 4, date(2025, 6, 30)),
            (skills["AWS"], 3, date(2025, 3, 31)),
        ]
        for skill, target_level, deadline in rahul_targets:
            ts = TargetSkill(
                employee_id=rahul.id,
                skill_id=skill.id,
                target_level=target_level,
                deadline=deadline,
                assigned_by=priya.id,
                status="ACTIVE",
            )
            db.add(ts)

        db.flush()

        # =====================
        # EMPLOYEE SKILLS - Arun Kumar (SME)
        # Kubernetes=5, Docker=5, AWS=4, Python=5, FastAPI=4
        # All validated
        # =====================
        arun_skills = [
            (skills["Kubernetes"], 5),
            (skills["Docker"], 5),
            (skills["AWS"], 4),
            (skills["Python"], 5),
            (skills["FastAPI"], 4),
            (skills["Microservices"], 4),
            (skills["CI/CD"], 4),
        ]
        for skill, level in arun_skills:
            es = EmployeeSkill(
                employee_id=arun.id,
                skill_id=skill.id,
                current_level=level,
                validated=True,
                validated_by=priya.id,
                validated_at=datetime(2024, 1, 10),
            )
            db.add(es)

        # =====================
        # EMPLOYEE SKILLS - Other employees
        # =====================
        # Anjali
        for skill, level in [(skills["Python"], 2), (skills["React"], 3), (skills["JavaScript"], 3)]:
            db.add(EmployeeSkill(employee_id=emp2.id, skill_id=skill.id, current_level=level,
                                  validated=True, validated_by=priya.id, validated_at=datetime(2024, 2, 1)))

        # Suresh
        for skill, level in [(skills["Python"], 3), (skills["Machine Learning"], 3), (skills["Data Analysis"], 4)]:
            db.add(EmployeeSkill(employee_id=emp3.id, skill_id=skill.id, current_level=level,
                                  validated=True, validated_by=manager2.id, validated_at=datetime(2024, 2, 5)))

        # Kavya
        for skill, level in [(skills["Docker"], 3), (skills["Kubernetes"], 2), (skills["CI/CD"], 3)]:
            db.add(EmployeeSkill(employee_id=emp4.id, skill_id=skill.id, current_level=level,
                                  validated=True, validated_by=manager3.id, validated_at=datetime(2024, 2, 10)))

        # Vikram
        for skill, level in [(skills["Java"], 5), (skills["Python"], 4), (skills["AWS"], 3), (skills["Docker"], 4)]:
            db.add(EmployeeSkill(employee_id=emp5.id, skill_id=skill.id, current_level=level,
                                  validated=True, validated_by=priya.id, validated_at=datetime(2024, 1, 20)))

        # Pooja
        for skill, level in [(skills["Data Analysis"], 5), (skills["Machine Learning"], 4), (skills["Python"], 4), (skills["SQL"], 4)]:
            db.add(EmployeeSkill(employee_id=emp6.id, skill_id=skill.id, current_level=level,
                                  validated=True, validated_by=manager2.id, validated_at=datetime(2024, 2, 15)))

        # Kiran
        for skill, level in [(skills["Docker"], 2), (skills["CI/CD"], 2), (skills["Security"], 2)]:
            db.add(EmployeeSkill(employee_id=emp7.id, skill_id=skill.id, current_level=level,
                                  validated=False))

        # Raju
        for skill, level in [(skills["Python"], 3), (skills["FastAPI"], 3), (skills["SQL"], 4)]:
            db.add(EmployeeSkill(employee_id=emp8.id, skill_id=skill.id, current_level=level,
                                  validated=True, validated_by=priya.id, validated_at=datetime(2024, 3, 1)))

        # Nisha
        for skill, level in [(skills["AWS"], 5), (skills["Cloud Architecture"], 4), (skills["Kubernetes"], 4), (skills["Docker"], 4)]:
            db.add(EmployeeSkill(employee_id=emp9.id, skill_id=skill.id, current_level=level,
                                  validated=True, validated_by=priya.id, validated_at=datetime(2024, 3, 5)))

        # Dev
        for skill, level in [(skills["JavaScript"], 2), (skills["React"], 2), (skills["Node.js"], 2)]:
            db.add(EmployeeSkill(employee_id=emp10.id, skill_id=skill.id, current_level=level,
                                  validated=False))

        # SME skills
        # Deepa - Data Science SME
        for skill, level in [(skills["Machine Learning"], 5), (skills["Data Analysis"], 5), (skills["Python"], 4), (skills["SQL"], 5)]:
            db.add(EmployeeSkill(employee_id=sme2.id, skill_id=skill.id, current_level=level,
                                  validated=True, validated_by=manager2.id, validated_at=datetime(2024, 1, 5)))

        # Vivek - DevOps SME
        for skill, level in [(skills["Docker"], 5), (skills["Kubernetes"], 4), (skills["CI/CD"], 5), (skills["DevOps"], 5)]:
            db.add(EmployeeSkill(employee_id=sme3.id, skill_id=skill.id, current_level=level,
                                  validated=True, validated_by=manager3.id, validated_at=datetime(2024, 1, 5)))

        # Meera - Full Stack SME
        for skill, level in [(skills["React"], 5), (skills["Node.js"], 4), (skills["JavaScript"], 5), (skills["Python"], 3)]:
            db.add(EmployeeSkill(employee_id=sme4.id, skill_id=skill.id, current_level=level,
                                  validated=True, validated_by=priya.id, validated_at=datetime(2024, 1, 5)))

        # Ankit - Cloud SME
        for skill, level in [(skills["AWS"], 5), (skills["Cloud Architecture"], 5), (skills["Kubernetes"], 5), (skills["Docker"], 4)]:
            db.add(EmployeeSkill(employee_id=sme5.id, skill_id=skill.id, current_level=level,
                                  validated=True, validated_by=priya.id, validated_at=datetime(2024, 1, 5)))

        db.flush()

        # =====================
        # TARGET SKILLS - Other employees
        # =====================
        db.add(TargetSkill(employee_id=emp2.id, skill_id=skills["Python"].id, target_level=4,
                            assigned_by=priya.id, status="ACTIVE", deadline=date(2025, 6, 30)))
        db.add(TargetSkill(employee_id=emp2.id, skill_id=skills["Docker"].id, target_level=3,
                            assigned_by=priya.id, status="ACTIVE", deadline=date(2025, 3, 31)))

        db.add(TargetSkill(employee_id=emp4.id, skill_id=skills["Kubernetes"].id, target_level=4,
                            assigned_by=manager3.id, status="ACTIVE", deadline=date(2025, 6, 30)))

        db.add(TargetSkill(employee_id=emp7.id, skill_id=skills["Docker"].id, target_level=4,
                            assigned_by=manager3.id, status="ACTIVE", deadline=date(2025, 9, 30)))
        db.add(TargetSkill(employee_id=emp7.id, skill_id=skills["Kubernetes"].id, target_level=3,
                            assigned_by=manager3.id, status="ACTIVE", deadline=date(2025, 9, 30)))

        db.flush()

        # =====================
        # COURSES
        # =====================
        courses_data = [
            # Python courses
            {"title": "Python for Beginners", "skill_id": skills["Python"].id, "difficulty": "Beginner",
             "duration_hours": 10.0, "provider": "Coursera", "description": "Introduction to Python programming",
             "url": "https://coursera.org/python-beginners"},
            {"title": "Python Intermediate", "skill_id": skills["Python"].id, "difficulty": "Intermediate",
             "duration_hours": 20.0, "provider": "Udemy", "description": "Python intermediate concepts",
             "url": "https://udemy.com/python-intermediate"},
            {"title": "Advanced Python Patterns", "skill_id": skills["Python"].id, "difficulty": "Advanced",
             "duration_hours": 15.0, "provider": "Pluralsight", "description": "Advanced Python programming patterns",
             "url": "https://pluralsight.com/python-advanced"},
            # Docker courses
            {"title": "Docker Fundamentals", "skill_id": skills["Docker"].id, "difficulty": "Beginner",
             "duration_hours": 8.0, "provider": "Linux Foundation", "description": "Docker basics and containers",
             "url": "https://training.linuxfoundation.org/docker"},
            {"title": "Docker in Production", "skill_id": skills["Docker"].id, "difficulty": "Intermediate",
             "duration_hours": 12.0, "provider": "A Cloud Guru", "description": "Production-grade Docker deployment",
             "url": "https://acloudguru.com/docker-production"},
            {"title": "Docker Advanced Networking", "skill_id": skills["Docker"].id, "difficulty": "Advanced",
             "duration_hours": 8.0, "provider": "Udemy", "description": "Advanced Docker networking",
             "url": "https://udemy.com/docker-networking"},
            # Kubernetes courses
            {"title": "Kubernetes for Beginners", "skill_id": skills["Kubernetes"].id, "difficulty": "Beginner",
             "duration_hours": 12.0, "provider": "Coursera", "description": "Introduction to Kubernetes",
             "url": "https://coursera.org/kubernetes-beginners"},
            {"title": "Kubernetes Administrator (CKA)", "skill_id": skills["Kubernetes"].id, "difficulty": "Advanced",
             "duration_hours": 25.0, "provider": "Linux Foundation", "description": "CKA certification prep",
             "url": "https://training.linuxfoundation.org/cka"},
            {"title": "Kubernetes Intermediate", "skill_id": skills["Kubernetes"].id, "difficulty": "Intermediate",
             "duration_hours": 15.0, "provider": "A Cloud Guru", "description": "Intermediate Kubernetes concepts",
             "url": "https://acloudguru.com/kubernetes"},
            # AWS courses
            {"title": "AWS Cloud Practitioner", "skill_id": skills["AWS"].id, "difficulty": "Beginner",
             "duration_hours": 10.0, "provider": "AWS Training", "description": "AWS fundamentals",
             "url": "https://aws.amazon.com/training/cloud-practitioner"},
            {"title": "AWS Solutions Architect", "skill_id": skills["AWS"].id, "difficulty": "Intermediate",
             "duration_hours": 30.0, "provider": "A Cloud Guru", "description": "AWS Solutions Architect Associate",
             "url": "https://acloudguru.com/aws-sa"},
            # ML courses
            {"title": "Machine Learning Fundamentals", "skill_id": skills["Machine Learning"].id, "difficulty": "Intermediate",
             "duration_hours": 40.0, "provider": "Coursera", "description": "Andrew Ng's ML course",
             "url": "https://coursera.org/ml"},
            # React courses
            {"title": "React Complete Guide", "skill_id": skills["React"].id, "difficulty": "Intermediate",
             "duration_hours": 30.0, "provider": "Udemy", "description": "Complete React developer course",
             "url": "https://udemy.com/react-complete"},
            # SQL courses
            {"title": "SQL for Data Analysis", "skill_id": skills["SQL"].id, "difficulty": "Intermediate",
             "duration_hours": 15.0, "provider": "Coursera", "description": "SQL for data analysts",
             "url": "https://coursera.org/sql-data"},
            # FastAPI courses
            {"title": "FastAPI Complete Course", "skill_id": skills["FastAPI"].id, "difficulty": "Intermediate",
             "duration_hours": 10.0, "provider": "Udemy", "description": "Build APIs with FastAPI",
             "url": "https://udemy.com/fastapi"},
        ]

        course_objs = []
        for cd in courses_data:
            course = Course(**cd, created_at=datetime.utcnow())
            db.add(course)
            course_objs.append(course)

        db.flush()

        # =====================
        # TRAINING REQUESTS
        # =====================
        # Rahul's Kubernetes training request (PENDING)
        kubernetes_req = TrainingRequest(
            employee_id=rahul.id,
            skill_id=skills["Kubernetes"].id,
            requested_level=4,
            message="I need to improve my Kubernetes skills for the upcoming cloud migration project.",
            priority="HIGH",
            status="PENDING",
            created_at=datetime(2024, 3, 10),
        )
        db.add(kubernetes_req)

        # Anjali's Python request
        python_req = TrainingRequest(
            employee_id=emp2.id,
            skill_id=skills["Python"].id,
            requested_level=3,
            message="Need to improve Python skills for automation tasks.",
            priority="MEDIUM",
            status="COMPLETED",
            created_at=datetime(2024, 2, 5),
        )
        db.add(python_req)
        db.flush()

        # Completed assignment for Anjali's request
        python_assignment = TrainingAssignment(
            training_request_id=python_req.id,
            sme_id=arun.id,
            status="COMPLETED",
            duration_hours=3.0,
            completed_at=datetime(2024, 2, 20),
            created_at=datetime(2024, 2, 10),
        )
        db.add(python_assignment)

        # Kavya's Docker request
        docker_req = TrainingRequest(
            employee_id=emp4.id,
            skill_id=skills["Docker"].id,
            requested_level=4,
            message="Need Docker training for DevOps pipeline improvement.",
            priority="HIGH",
            status="IN_PROGRESS",
            created_at=datetime(2024, 3, 1),
        )
        db.add(docker_req)
        db.flush()

        # In-progress assignment for Kavya's request
        docker_assignment = TrainingAssignment(
            training_request_id=docker_req.id,
            sme_id=sme3.id,
            status="ACTIVE",
            created_at=datetime(2024, 3, 5),
        )
        db.add(docker_assignment)

        # Kiran's Kubernetes request
        k8s_req2 = TrainingRequest(
            employee_id=emp7.id,
            skill_id=skills["Kubernetes"].id,
            requested_level=3,
            message="Beginner Kubernetes training needed.",
            priority="MEDIUM",
            status="PENDING",
            created_at=datetime(2024, 3, 8),
        )
        db.add(k8s_req2)

        # More training requests for realism
        for emp, skill_name, level, priority, status in [
            (emp3, "Machine Learning", 4, "HIGH", "PENDING"),
            (emp6, "Cloud Architecture", 4, "MEDIUM", "CLAIMED"),
            (emp8, "FastAPI", 4, "MEDIUM", "COMPLETED"),
            (emp9, "AWS", 5, "LOW", "COMPLETED"),
            (emp10, "React", 3, "MEDIUM", "PENDING"),
            (emp5, "Kubernetes", 4, "HIGH", "PENDING"),
            (rahul, "Docker", 4, "MEDIUM", "PENDING"),
            (rahul, "AWS", 3, "MEDIUM", "PENDING"),
        ]:
            req = TrainingRequest(
                employee_id=emp.id,
                skill_id=skills[skill_name].id,
                requested_level=level,
                message=f"Requesting training for {skill_name} to meet target level.",
                priority=priority,
                status=status,
                created_at=datetime(2024, 2, 15) + timedelta(days=emp.id),
            )
            db.add(req)

        db.flush()

        # =====================
        # COMPLETED TRAINING ASSIGNMENTS (for impact scores)
        # =====================
        # Arun's completed sessions
        completed_reqs = db.query(TrainingRequest).filter(
            TrainingRequest.status == "COMPLETED",
            TrainingRequest.skill_id.in_([skills["Python"].id, skills["FastAPI"].id])
        ).all()

        for req in completed_reqs[:5]:
            ta = TrainingAssignment(
                training_request_id=req.id,
                sme_id=arun.id,
                status="COMPLETED",
                duration_hours=2.5,
                completed_at=datetime(2024, 3, 1),
                created_at=datetime(2024, 2, 20),
            )
            db.add(ta)

        db.flush()

        # =====================
        # LEARNING PROGRESS
        # =====================
        # Rahul's course progress
        if course_objs:
            for course in course_objs[:3]:
                if course.skill_id in [skills["Kubernetes"].id, skills["Docker"].id]:
                    lp = LearningProgress(
                        employee_id=rahul.id,
                        course_id=course.id,
                        progress_percentage=35.0,
                        status="IN_PROGRESS",
                        started_at=datetime(2024, 3, 1),
                    )
                    db.add(lp)

        db.flush()

        # =====================
        # PROJECTS
        # =====================
        project1 = Project(
            name="AI Banking Platform",
            description="Next-generation AI-powered banking platform with microservices architecture",
            manager_id=priya.id,
            status="ACTIVE",
            created_at=datetime(2024, 3, 1),
        )
        db.add(project1)
        db.flush()

        # Project requirements: Python, Docker, Kubernetes, AWS
        req_data = [
            (skills["Python"], 5, 4),
            (skills["Docker"], 4, 3),
            (skills["Kubernetes"], 4, 3),
            (skills["AWS"], 3, 3),
        ]
        for skill, req_people, min_level in req_data:
            pr = ProjectRequirement(
                project_id=project1.id,
                skill_id=skill.id,
                required_people=req_people,
                minimum_level=min_level,
            )
            db.add(pr)

        project2 = Project(
            name="Data Analytics Dashboard",
            description="Enterprise data analytics and visualization platform",
            manager_id=manager2.id,
            status="ACTIVE",
            created_at=datetime(2024, 2, 15),
        )
        db.add(project2)
        db.flush()

        for skill, req_people, min_level in [
            (skills["Python"], 4, 3),
            (skills["Machine Learning"], 3, 3),
            (skills["Data Analysis"], 3, 4),
            (skills["SQL"], 4, 3),
        ]:
            pr = ProjectRequirement(
                project_id=project2.id,
                skill_id=skill.id,
                required_people=req_people,
                minimum_level=min_level,
            )
            db.add(pr)

        db.flush()

        # =====================
        # NOTIFICATIONS
        # =====================
        notifications = [
            # Rahul's notifications
            (rahul.id, "Welcome to Skill Sync! 👋", "Your account is ready. Start by adding your skills.", "WELCOME"),
            (rahul.id, "Training Request Pending", "Your Kubernetes training request is waiting for an SME to claim.", "TRAINING_UPDATE"),
            (rahul.id, "Skill Validated ✓", "Your Python skill has been validated by Priya Sharma.", "SKILL_VALIDATED"),
            (rahul.id, "Target Skill Set", "Docker target level 4 has been assigned by your manager.", "TARGET_SET"),
            # Arun's notifications
            (arun.id, "New Training Request Available", "A Kubernetes training request is available for you to claim.", "NEW_REQUEST"),
            (arun.id, "Training Completed", "You have completed 15 training sessions this month. Great work!", "MILESTONE"),
            # Priya's notifications
            (priya.id, "Pending Skill Validations", "You have 3 employee skills waiting for validation.", "PENDING_VALIDATION"),
            (priya.id, "Team Report Ready", "Your team's skill gap report for Q1 is ready.", "REPORT_READY"),
            # Admin notifications
            (admin.id, "System Status", "Skill Sync is running smoothly. 18 users active.", "SYSTEM"),
        ]

        for user_id, title, message, notif_type in notifications:
            notif = Notification(
                user_id=user_id,
                title=title,
                message=message,
                type=notif_type,
                is_read=False,
                created_at=datetime.utcnow() - timedelta(hours=notifications.index((user_id, title, message, notif_type))),
            )
            db.add(notif)

        db.commit()
        print("[SUCCESS] Database seeded successfully!")
        print(f"  Admin: admin@skillsync.com / password123")
        print(f"  Manager (Priya): manager@skillsync.com / password123")
        print(f"  SME (Arun): sme@skillsync.com / password123")
        print(f"  Employee (Rahul): employee@skillsync.com / password123")
        print(f"  Users: {db.query(User).count()}")
        print(f"  Skills: {db.query(Skill).count()}")
        print(f"  Courses: {db.query(Course).count()}")
        print(f"  Training Requests: {db.query(TrainingRequest).count()}")

    except Exception as e:
        print(f"[ERROR] Seeding failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
