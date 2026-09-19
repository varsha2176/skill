import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_token(email, password="password123"):
    resp = client.post(
        "/auth/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 200, f"Login failed for {email}: {resp.text}"
    return resp.json()["access_token"]

def test_manager_dashboard_and_heatmap_data():
    token = get_token("manager@skillsync.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/dashboard/manager", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert "skill_heatmap" in data
    heatmap = data["skill_heatmap"]
    assert "skills" in heatmap
    assert "employees" in heatmap
    assert len(heatmap["skills"]) > 0, "No skills in manager heatmap"
    assert len(heatmap["employees"]) > 0, "No employees in manager heatmap"

    first_emp = heatmap["employees"][0]
    assert "employee_id" in first_emp
    assert "employee_name" in first_emp
    assert "skills" in first_emp
    assert isinstance(first_emp["skills"], list)

    # Check that skills in employee row have level information
    first_skill = first_emp["skills"][0]
    assert "skill_id" in first_skill
    assert "level" in first_skill
    assert isinstance(first_skill["level"], int)

def test_manager_workflows():
    token = get_token("manager@skillsync.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Team members
    resp = client.get("/users?role=EMPLOYEE", headers=headers)
    assert resp.status_code == 200

    # Pending validations
    resp = client.get("/validations/pending", headers=headers)
    assert resp.status_code == 200

    # Projects
    resp = client.get("/projects", headers=headers)
    assert resp.status_code == 200

    # Team reports
    resp = client.get("/reports/team", headers=headers)
    assert resp.status_code == 200

    # Training report
    resp = client.get("/reports/training", headers=headers)
    assert resp.status_code == 200

def test_employee_workflows():
    token = get_token("employee@skillsync.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Employee dashboard
    resp = client.get("/dashboard/employee", headers=headers)
    assert resp.status_code == 200

    # Skills
    resp = client.get("/employee-skills", headers=headers)
    assert resp.status_code == 200

    # Skill gaps
    resp = client.get("/skill-gaps", headers=headers)
    assert resp.status_code == 200

    # Overall readiness
    resp = client.get("/skill-gaps/overall", headers=headers)
    assert resp.status_code == 200

    # Training requests
    resp = client.get("/training-requests", headers=headers)
    assert resp.status_code == 200

def test_sme_workflows():
    token = get_token("sme@skillsync.com")
    headers = {"Authorization": f"Bearer {token}"}

    # SME dashboard
    resp = client.get("/dashboard/sme", headers=headers)
    assert resp.status_code == 200

    # Training requests visible to SME
    resp = client.get("/training-requests", headers=headers)
    assert resp.status_code == 200

def test_admin_workflows():
    token = get_token("admin@skillsync.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Admin dashboard
    resp = client.get("/dashboard/admin", headers=headers)
    assert resp.status_code == 200

    # Users
    resp = client.get("/users", headers=headers)
    assert resp.status_code == 200

    # Skills
    resp = client.get("/skills", headers=headers)
    assert resp.status_code == 200

    # Courses
    resp = client.get("/courses", headers=headers)
    assert resp.status_code == 200
