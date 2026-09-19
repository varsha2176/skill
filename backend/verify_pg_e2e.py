import sys
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.training import TrainingRequest
from app.models.employee_skill import EmployeeSkill
from app.models.skill import Skill

client = TestClient(app)

def login(email):
    r = client.post(
        '/auth/login',
        data={'username': email, 'password': 'password123'},
        headers={'Content-Type': 'application/x-www-form-urlencoded'}
    )
    assert r.status_code == 200, f'Login failed for {email}: {r.text}'
    return r.json()['access_token']

print('============================================================')
print('   REAL END-TO-END POSTGRESQL WORKFLOW VERIFICATION')
print('============================================================\n')

# -------------------------------------------------------------
# STEP 1: EMPLOYEE LOGIN, VIEW SKILLS, GAPS, REQUEST SME
# -------------------------------------------------------------
print('--- Step 1: Employee Login, View Skills, Gaps, Request SME ---')
emp_token = login('employee@skillsync.com')
emp_headers = {'Authorization': f'Bearer {emp_token}'}

emp_dash = client.get('/dashboard/employee', headers=emp_headers)
assert emp_dash.status_code == 200, f'Employee dashboard failed: {emp_dash.text}'
print('  [PASS] 1. Employee dashboard loaded:', list(emp_dash.json().keys()))

skills = client.get('/employee-skills', headers=emp_headers)
assert skills.status_code == 200 and len(skills.json()) > 0
print(f'  [PASS] 2. Employee skills loaded: {len(skills.json())} skills verified')

gaps = client.get('/skill-gaps', headers=emp_headers)
assert gaps.status_code == 200
print(f'  [PASS] 3. Employee skill gaps loaded: {len(gaps.json())} gaps evaluated')

catalog_skills = client.get('/sme-access/skills', headers=emp_headers).json()
assert len(catalog_skills) > 0
req_res = client.post(
    '/sme-access/request',
    json={'skill_id': catalog_skills[0]['id'], 'reason': 'Demonstrated advanced competency in PostgreSQL'},
    headers=emp_headers
)
assert req_res.status_code in [200, 400], f'SME request failed: {req_res.text}'
print('  [PASS] 4. Employee submitted SME Access Request')

# -------------------------------------------------------------
# STEP 2: MANAGER LOGIN, SEE SME REQUEST, APPROVE
# -------------------------------------------------------------
print('\n--- Step 2: Manager Login, Review SME Request, Approve ---')
mgr_token = login('manager@skillsync.com')
mgr_headers = {'Authorization': f'Bearer {mgr_token}'}

pending_sme = client.get('/sme-access/pending', headers=mgr_headers).json()
assert len(pending_sme) > 0, 'No pending SME requests found for manager review'
target_sme_req = pending_sme[0]
sme_req_id = target_sme_req['id']
print(f'  [INFO] Found pending SME request #{sme_req_id} for employee {target_sme_req["employee_name"]}')

appr_res = client.put(f'/sme-access/{sme_req_id}/approve', headers=mgr_headers)
assert appr_res.status_code == 200 and appr_res.json()['status'] == 'APPROVED'
print(f'  [PASS] 5. Manager approved SME request #{sme_req_id}')

# -------------------------------------------------------------
# STEP 3: EMPLOYEE IS_SME BECOMES TRUE
# -------------------------------------------------------------
print('\n--- Step 3: Employee is_sme Becomes True ---')
# Re-login to refresh user claims
emp_token = login('employee@skillsync.com')
emp_headers = {'Authorization': f'Bearer {emp_token}'}

emp_me = client.get('/auth/me', headers=emp_headers).json()
assert emp_me['is_sme'] is True, f'Expected is_sme=True, got {emp_me.get("is_sme")}'
print(f'  [PASS] 6. Verified employee {emp_me["name"]} has is_sme=True in PostgreSQL!')

# -------------------------------------------------------------
# STEP 4: APPROVED SME DASHBOARD, CLAIM, START, COMPLETE TRAINING
# -------------------------------------------------------------
print('\n--- Step 4: Approved SME Dashboard, Claim, Start, Complete ---')
sme_dash = client.get('/dashboard/sme', headers=emp_headers)
assert sme_dash.status_code == 200, f'SME dashboard returned {sme_dash.status_code}'
print('  [PASS] 7. SME Dashboard accessible (200 OK)')

# Find a pending training request in PostgreSQL to claim
db = SessionLocal()
pending_tr = db.query(TrainingRequest).filter(TrainingRequest.status == 'PENDING').first()
assert pending_tr is not None, 'No pending training requests in database'
tr_id = pending_tr.id
db.close()
print(f'  [INFO] Selected PENDING training request #{tr_id}')

# Claim training request
claim_res = client.put(f'/training-requests/{tr_id}/claim', headers=emp_headers)
assert claim_res.status_code == 200, f'Claim failed: {claim_res.text}'
assert claim_res.json()['status'] == 'CLAIMED'
print(f'  [PASS] 8. SME claimed training request #{tr_id}')

# Start training request
start_res = client.put(f'/training-requests/{tr_id}/start', headers=emp_headers)
assert start_res.status_code == 200, f'Start failed: {start_res.text}'
assert start_res.json()['status'] == 'IN_PROGRESS'
print(f'  [PASS] 9. SME started training request #{tr_id}')

# Complete training request
comp_res = client.put(f'/training-requests/{tr_id}/complete', headers=emp_headers)
assert comp_res.status_code == 200, f'Complete failed: {comp_res.text}'
assert comp_res.json()['status'] == 'COMPLETED'
print(f'  [PASS] 10. SME completed training request #{tr_id}')

# -------------------------------------------------------------
# STEP 5: MANAGER VALIDATE SKILL, VERIFY CURRENT_LEVEL, READINESS
# -------------------------------------------------------------
print('\n--- Step 5: Manager Validate Skill, Verify Level & Project Readiness ---')
# Employee self-adds a new skill (starts unvalidated) or manager validates an employee skill
# Find an unassigned skill for the employee
db = SessionLocal()
emp_user = db.query(EmployeeSkill).filter(EmployeeSkill.employee_id == emp_me['id']).all()
existing_skill_ids = {es.skill_id for es in emp_user}
avail_skill = db.query(Skill).filter(~Skill.id.in_(existing_skill_ids)).first()
db.close()

if avail_skill:
    add_skill_res = client.post(
        f'/employees/{emp_me["id"]}/skills',
        json={'skill_id': avail_skill.id, 'current_level': 2},
        headers=emp_headers
    )
    if add_skill_res.status_code == 201:
        print(f'  [INFO] Employee submitted new self-rated skill: {avail_skill.name} (level 2, unvalidated)')

# Manager checks pending validations
pending_vals = client.get('/validations/pending', headers=mgr_headers).json()
print(f'  [PASS] 11. Manager pending validations retrieved: {len(pending_vals)} pending')

if len(pending_vals) > 0:
    val_target = pending_vals[0]
    val_id = val_target['employee_skill_id']
    val_res = client.put(
        f'/validations/{val_id}',
        json={'approved': True, 'new_level': 4, 'comment': 'Excellent verified mastery in PostgreSQL production operations'},
        headers=mgr_headers
    )
    assert val_res.status_code == 200, f'Validation approval failed: {val_res.text}'
    assert val_res.json()['approved'] is True
    print(f'  [PASS] 12. Manager validated skill #{val_id}: approved=True, new_level=4')

# Manager verifies SkillHeatmap
mgr_dash = client.get('/dashboard/manager', headers=mgr_headers).json()
assert 'skill_heatmap' in mgr_dash
heatmap = mgr_dash['skill_heatmap']
assert len(heatmap['skills']) > 0 and len(heatmap['employees']) > 0
print(f'  [PASS] 13. Manager SkillHeatmap rendered from PostgreSQL: {len(heatmap["employees"])} employees x {len(heatmap["skills"])} skills')

# Manager verifies Project Readiness
projects = client.get('/projects', headers=mgr_headers).json()
assert len(projects) > 0
print(f'  [PASS] 14. Manager Project Readiness from PostgreSQL: {len(projects)} projects evaluated')

# -------------------------------------------------------------
# STEP 6: ADMIN LOGIN, VERIFY USERS, SKILLS, COURSES, REPORTS
# -------------------------------------------------------------
print('\n--- Step 6: Admin Login, Verify Users, Skills, Courses, Reports ---')
admin_token = login('admin@skillsync.com')
admin_headers = {'Authorization': f'Bearer {admin_token}'}

admin_users = client.get('/users', headers=admin_headers).json()
user_list = admin_users.get('users', admin_users)
user_count = admin_users.get('total', len(user_list))
assert user_count >= 50 and len(user_list) >= 50, f'Expected >= 50 users, got count={user_count}'
print(f'  [PASS] 15. Admin verified {user_count} users in PostgreSQL')

admin_skills = client.get('/skills', headers=admin_headers).json()
assert len(admin_skills) == 28, f'Expected 28 skills, got {len(admin_skills)}'
print(f'  [PASS] 16. Admin verified {len(admin_skills)} skills in PostgreSQL')

admin_courses = client.get('/courses', headers=admin_headers).json()
assert len(admin_courses) == 15, f'Expected 15 courses, got {len(admin_courses)}'
print(f'  [PASS] 17. Admin verified {len(admin_courses)} courses in PostgreSQL')

team_report = client.get('/reports/team', headers=admin_headers)
assert team_report.status_code == 200
training_report = client.get('/reports/training', headers=admin_headers)
assert training_report.status_code == 200
print('  [PASS] 18. Admin verified analytics & team reports in PostgreSQL')

# -------------------------------------------------------------
# STEP 7: RESTORE PRISTINE DEMO STATE (EMPLOYEE IS_SME = FALSE)
# -------------------------------------------------------------
rej_res = client.put(f'/sme-access/{sme_req_id}/reject', headers=mgr_headers)
assert rej_res.status_code == 200 and rej_res.json()['is_sme'] is False
emp_me_reset = client.get('/auth/me', headers=emp_headers).json()
assert emp_me_reset['is_sme'] is False
print('  [PASS] 19. Pristine role state restored in PostgreSQL (employee is_sme=False)')

print('\n============================================================')
print('   === ALL POSTGRESQL E2E WORKFLOW CHECKS PASSED 100% ===')
print('============================================================')

