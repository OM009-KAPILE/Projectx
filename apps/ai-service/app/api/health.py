from fastapi import APIRouter, HTTPException
from app.models.schemas import ProjectHealthRequest, ProjectHealthResponse
from app.core.engine import AIEngine

router = APIRouter(prefix="/health", tags=["Project Health Analyzer"])

@router.post("/evaluate", response_model=ProjectHealthResponse)
def evaluate_project_health(req: ProjectHealthRequest):
    """
    Analyzes project task throughput, activity cadence, member engagement,
    and returns momentum score, blocker alerts, and actionable recommendations.
    """
    try:
        return AIEngine.evaluate_project_health(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
