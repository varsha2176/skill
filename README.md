# SkillSync — Intelligent Talent & Market Readiness Engine

SkillSync is an enterprise AI talent mobility and skill gap acceleration engine. It bridges internal organizational capabilities with real-time market benchmarks, driving project staffing readiness, automated mentorship pairing, training lifecycles, and managerial validation.

---

## 1. System Roles & Security Architecture

The platform strictly enforces **three system roles**:
- **`ADMIN`**: Platform administration, taxonomy management, course catalog, user provisioning, global analytics.
- **`MANAGER`**: Team capability management, skill validations, team skill gaps, project staffing readiness, SME application approvals.
- **`EMPLOYEE`**: Individual skill profile, gap analysis, career roadmap, course catalog, training requests, and SME capability application.

### SME Capability Model (Not a 4th Role)
Subject Matter Expert (SME) status is **not a system authentication role**. Instead, it is an **approved capability of an Employee**:
- `users.role` remains `EMPLOYEE`
- `users.is_sme` is `True` when approved
- `sme_expertise` records domain-specific skills certified by a manager

### SME Access Approval Lifecycle
1. **Employee applies**: Navigates to *My Profile* -> *Request SME Capability*, submits domain skill and justification (`POST /sme-access/request`).
2. **Pending Queue**: Application enters `PENDING` status.
3. **Manager review**: Manager views applications under *Skill Validations* -> *SME Applications* (`GET /sme-access/pending`).
4. **Approval**: Manager approves (`PUT /sme-access/{id}/approve`), toggling `is_sme=True`, registering `sme_expertise`, and notifying the employee.
5. **Rejection**: Manager rejects with feedback (`PUT /sme-access/{id}/reject`), maintaining `is_sme=False`.
6. **Access Control**: Backend enforces `403 Forbidden` on SME routes (`/dashboard/sme`, claiming training sessions) for regular employees. Approved employees gain access to the dedicated SME Hub tab.

---

## 2. Integrated Dataset Metrics (Source of Truth)

All platform records are imported directly from the official hackathon dataset (`SkillSync_Datasets.xlsx`):

| Dataset Sheet | Database Entity | Total Records Ingested |
| :--- | :--- | :--- |
| `Users` | `User` | **51** (50 dataset + demo seed accounts) |
| `Skills_Reference` | `Skill` | **28** |
| `Market_Benchmarks` | `MarketBenchmark` | **28** |
| `Skill_Profiles` | `EmployeeSkill` | **558** |
| `Courses` | `Course` | **15** |
| `Course_Progress` | `LearningProgress` | **100** |
| `Certifications` | `Certification` | **37** |
| `Project_Requirements` | `Project` & `ProjectRequirement` | **15 Projects / 44 Requirements** |
| `Training_Requests` | `TrainingRequest` | **40** |
| `Mentorship_Records` | `MentorshipRecord` | **50** |
| `Impact_Scores` | `ImpactScore` | **3** |
| `Quiz_Questions` | `QuizQuestion` | **68** |
| `Quiz_Results` | `QuizResult` | **100** |
| `Notifications` | `Notification` | **157** |

---

## 3. Technology Stack

- **Backend**: FastAPI, SQLAlchemy, Pydantic, Python-JOSE (JWT), Passlib / Bcrypt, OpenPyXL (Excel dataset ingestion).
- **Frontend**: React 18, Vite 5, Tailwind CSS, Heroicons, Recharts, Axios, React Router 6, React Hot Toast.
- **Database Engine**: **PostgreSQL 15.3** (Active Runtime Database) with multi-dialect fallback support for SQLite.

---

## 4. Manager SkillHeatmap Integration

The Manager Dashboard preserves the resilient `SkillHeatmap.jsx` component:
- Dynamically resolves `current_level`, `validated_level`, and `proficiency_level`.
- Handles multiple data formats: nested arrays, map objects, or standalone fallback matrices.
- Normalizes diverse employee fields (`employee_id`, `id`, `name`, `full_name`) and skill fields (`skill_id`, `id`, `skill_name`, `name`).
- Provides empty-state messaging when no team skills are declared.

---

## 5. Demo Credentials

All accounts are provisioned with real hashed passwords (`password123`). The login interface includes a one-click demo persona selector:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Employee** | `employee@skillsync.com` | `password123` | Regular employee (`is_sme=False`), can apply for SME capability |
| **SME Employee** | `sme@skillsync.com` | `password123` | Approved SME employee (`is_sme=True`), full SME Hub access |
| **Manager** | `manager@skillsync.com` | `password123` | Validates skills, approves/rejects SME requests, reviews team heatmap |
| **Admin** | `admin@skillsync.com` | `password123` | Global user, skill taxonomy, and course catalog management |

---

## 6. Setup & Execution Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- PostgreSQL 15+ (running on port 5432)

### Starting PostgreSQL Server
```powershell
# Initialize and launch PostgreSQL daemon (local cluster)
g:\ag\pgsql\bin\postgres.exe -D g:\ag\pgdata
```

### Backend Setup
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run dataset ingestion into PostgreSQL
python -c "from app.data_importer import import_dataset; import_dataset(reset=True)"

# Start API server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Running Backend Tests Against PostgreSQL
```bash
cd backend
.venv\Scripts\pytest -q
# Output: 16 passed
```

### Running Real End-to-End Workflow Against PostgreSQL
```bash
cd backend
.venv\Scripts\python.exe verify_pg_e2e.py
# Output: === ALL POSTGRESQL E2E WORKFLOW CHECKS PASSED 100% ===
```

### Building Frontend
```bash
cd frontend
npm run build
# Output: 0 errors, generated dist/ bundle
```

---

## 7. Environment Variables Configuration

In `backend/.env`:
```ini
DATABASE_URL=postgresql://skillsync@127.0.0.1:5432/skillsync
SECRET_KEY=supersecretkey-change-in-production-2024
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```
For offline SQLite fallback when PostgreSQL service is inactive:
```ini
DATABASE_URL=sqlite:///./skillsync.db
```
