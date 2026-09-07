from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import analyzer, skill_gap, matcher, health

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI Intelligence Microservice for ProjectX: Skill-Gap Detection, Matching & Progressive Disclosure",
)

# Enable CORS for local backend and frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(analyzer.router, prefix=settings.API_V1_STR)
app.include_router(skill_gap.router, prefix=settings.API_V1_STR)
app.include_router(matcher.router, prefix=settings.API_V1_STR)
app.include_router(health.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "service": "ProjectX AI Microservice",
        "status": "online",
        "version": settings.VERSION,
        "endpoints": [
            f"{settings.API_V1_STR}/analyze/project",
            f"{settings.API_V1_STR}/skill-gap/detect",
            f"{settings.API_V1_STR}/match/candidates",
            f"{settings.API_V1_STR}/health/evaluate",
        ],
    }

@app.get("/healthz")
def healthz():
    return {"status": "ok"}
