import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "running"


def test_login_demo_accounts():
    roles = [
        ("admin@skillsync.com", "ADMIN", False),
        ("manager@skillsync.com", "MANAGER", False),
        ("sme@skillsync.com", "EMPLOYEE", True),  # Approved SME is an EMPLOYEE with is_sme=True
        ("employee@skillsync.com", "EMPLOYEE", False),
    ]
    for email, expected_role, expected_sme in roles:
        response = client.post(
            "/auth/login",
            data={"username": email, "password": "password123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert response.status_code == 200, f"Failed login for {email}: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["role"] == expected_role
        assert data["is_sme"] == expected_sme

        # Verify /auth/me
        token = data["access_token"]
        me_resp = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert me_resp.status_code == 200
        me = me_resp.json()
        assert me["email"] == email
        assert me["role"] == expected_role
        assert me["is_sme"] == expected_sme


def get_token(email="admin@skillsync.com"):
    resp = client.post(
        "/auth/login",
        data={"username": email, "password": "password123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    return resp.json()["access_token"]


def test_skills_endpoints():
    token = get_token("admin@skillsync.com")
    headers = {"Authorization": f"Bearer {token}"}

    # List skills
    resp = client.get("/skills", headers=headers)
    assert resp.status_code == 200
    skills = resp.json()
    assert len(skills) >= 20


def test_dashboards():
    # Employee
    emp_token = get_token("employee@skillsync.com")
    resp = client.get("/dashboard/employee", headers={"Authorization": f"Bearer {emp_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "overall_readiness" in data
    assert "total_skills" in data

    # Manager
    mgr_token = get_token("manager@skillsync.com")
    resp = client.get("/dashboard/manager", headers={"Authorization": f"Bearer {mgr_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "team_count" in data

    # SME
    sme_token = get_token("sme@skillsync.com")
    resp = client.get("/dashboard/sme", headers={"Authorization": f"Bearer {sme_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "claimable_requests" in data

    # Admin
    admin_token = get_token("admin@skillsync.com")
    resp = client.get("/dashboard/admin", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "total_users" in data


def test_skill_gaps():
    emp_token = get_token("employee@skillsync.com")
    resp = client.get("/skill-gaps/", headers={"Authorization": f"Bearer {emp_token}"})
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_courses_and_training():
    token = get_token("employee@skillsync.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/courses", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 10

    resp = client.get("/training-requests", headers=headers)
    assert resp.status_code == 200
