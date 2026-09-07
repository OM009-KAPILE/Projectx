from fastapi import APIRouter, HTTPException
from app.models.schemas import AnalyzeProjectRequest, AnalyzeProjectResponse
from app.core.engine import AIEngine

router = APIRouter(prefix="/analyze", tags=["Project Analyzer"])

@router.post("/project", response_model=AnalyzeProjectResponse)
def analyze_project(req: AnalyzeProjectRequest):
    """
    Decomposes a raw project pitch into structured roles, skill requirements,
    and a sanitized public teaser for progressive disclosure.
    """
    try:
        return AIEngine.analyze_project(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
