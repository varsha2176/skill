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


def test_three_system_roles_enforcement():
    """Verify strictly 3 system roles: ADMIN, MANAGER, EMPLOYEE. SME is capability on EMPLOYEE."""
    # 1. Admin login
    admin_token = get_token("admin@skillsync.com")
    admin_me = client.get("/auth/me", headers={"Authorization": f"Bearer {admin_token}"}).json()
    assert admin_me["role"] == "ADMIN"
    assert admin_me["is_sme"] is False

    # 2. Manager login
    mgr_token = get_token("manager@skillsync.com")
    mgr_me = client.get("/auth/me", headers={"Authorization": f"Bearer {mgr_token}"}).json()
    assert mgr_me["role"] == "MANAGER"
    assert mgr_me["is_sme"] is False

    # 3. Regular employee login
    emp_token = get_token("employee@skillsync.com")
    emp_me = client.get("/auth/me", headers={"Authorization": f"Bearer {emp_token}"}).json()
    assert emp_me["role"] == "EMPLOYEE"
    assert emp_me["is_sme"] is False

    # 4. Approved SME employee login
    sme_token = get_token("sme@skillsync.com")
    sme_me = client.get("/auth/me", headers={"Authorization": f"Bearer {sme_token}"}).json()
    assert sme_me["role"] == "EMPLOYEE"
    assert sme_me["is_sme"] is True


def test_sme_endpoint_authorization():
    """Regular employee is 403 forbidden on SME dashboard; approved SME is 200."""
    emp_token = get_token("employee@skillsync.com")
    resp_forbidden = client.get("/dashboard/sme", headers={"Authorization": f"Bearer {emp_token}"})
    assert resp_forbidden.status_code == 403

    sme_token = get_token("sme@skillsync.com")
    resp_allowed = client.get("/dashboard/sme", headers={"Authorization": f"Bearer {sme_token}"})
    assert resp_allowed.status_code == 200
    assert "claimable_requests" in resp_allowed.json()


def test_cross_role_authorization_matrix():
    """Verify unauthorized role access is forbidden (403)."""
    emp_token = get_token("employee@skillsync.com")
    mgr_token = get_token("manager@skillsync.com")

    # Employee cannot access manager or admin endpoints
    assert client.get("/dashboard/manager", headers={"Authorization": f"Bearer {emp_token}"}).status_code == 403
    assert client.get("/dashboard/admin", headers={"Authorization": f"Bearer {emp_token}"}).status_code == 403

    # Manager cannot access admin endpoints
    assert client.get("/dashboard/admin", headers={"Authorization": f"Bearer {mgr_token}"}).status_code == 403

    # Unauthenticated requests return 401
    assert client.get("/dashboard/employee").status_code == 401
    assert client.get("/skills").status_code == 401


def test_sme_access_request_lifecycle():
    """Test employee requesting SME access, manager pending list, approval and rejection."""
    # Find or use an employee who is not an SME
    emp_token = get_token("employee@skillsync.com")
    mgr_token = get_token("manager@skillsync.com")

    # 1. Employee checks skills available for SME request
    skills_resp = client.get("/sme-access/skills", headers={"Authorization": f"Bearer {emp_token}"})
    assert skills_resp.status_code == 200
    skills = skills_resp.json()
    assert len(skills) > 0
    test_skill_id = skills[0]["id"]

    # 2. Employee submits SME access request
    req_resp = client.post(
        "/sme-access/request",
        json={"skill_id": test_skill_id, "reason": "5 years industry expertise and conference speaker"},
        headers={"Authorization": f"Bearer {emp_token}"},
    )
    # May succeed or return 400 if already pending from earlier
    assert req_resp.status_code in [200, 400]

    # 3. Employee checks status
    status_resp = client.get("/sme-access/my-status", headers={"Authorization": f"Bearer {emp_token}"})
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["has_pending_request"] is True

    # 4. Manager views pending requests
    pending_resp = client.get("/sme-access/pending", headers={"Authorization": f"Bearer {mgr_token}"})
    assert pending_resp.status_code == 200
    pending_list = pending_resp.json()
    assert len(pending_list) > 0

    # Find the request
    req_item = pending_list[0]
    req_id = req_item["id"]

    # 5. Manager approves request
    appr_resp = client.put(f"/sme-access/{req_id}/approve", headers={"Authorization": f"Bearer {mgr_token}"})
    assert appr_resp.status_code == 200
    assert appr_resp.json()["status"] == "APPROVED"

    # 6. Verify employee is now an SME
    emp_me = client.get("/auth/me", headers={"Authorization": f"Bearer {emp_token}"}).json()
    assert emp_me["is_sme"] is True

    # 7. Employee can now access SME dashboard
    sme_dash = client.get("/dashboard/sme", headers={"Authorization": f"Bearer {emp_token}"})
    assert sme_dash.status_code == 200

    # 8. Reset is_sme back to False for clean idempotent state and test rejection flow
    rej_resp = client.put(f"/sme-access/{req_id}/reject", headers={"Authorization": f"Bearer {mgr_token}"})
    assert rej_resp.status_code == 200
    assert rej_resp.json()["status"] == "REJECTED"
    assert rej_resp.json()["is_sme"] is False

    emp_me_after = client.get("/auth/me", headers={"Authorization": f"Bearer {emp_token}"}).json()
    assert emp_me_after["is_sme"] is False
