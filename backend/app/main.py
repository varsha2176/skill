from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import engine, Base
import app.models  # noqa: F401 - Import all models to register them with Base

# Import all routers
from app.routers import auth, users, skills, employee_skills, targets, courses
from app.routers import training, validation, projects, dashboard, notifications, reports, skill_gaps, sme_access

# Create FastAPI app
app = FastAPI(
    title="Skill Sync API",
    description="Intelligent Talent & Market Readiness Engine",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
cors_origins = settings.CORS_ORIGINS.split(",") if settings.CORS_ORIGINS else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins + ["http://localhost:5173", "http://localhost:3000", "http://localhost:80"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create all tables on startup
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)


# Include all routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(skills.router)
app.include_router(employee_skills.router)
app.include_router(targets.router)
app.include_router(courses.router)
app.include_router(training.router)
app.include_router(validation.router)
app.include_router(projects.router)
app.include_router(dashboard.router)
app.include_router(notifications.router)
app.include_router(reports.router)
app.include_router(skill_gaps.router)
app.include_router(sme_access.router)


@app.get("/")
def root():
    return {
        "message": "Skill Sync API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
