from fastapi import APIRouter, HTTPException
from app.models.schemas import SkillGapRequest, SkillGapResponse
from app.core.engine import AIEngine

router = APIRouter(prefix="/skill-gap", tags=["Skill Gap Detection"])

@router.post("/detect", response_model=SkillGapResponse)
def detect_skill_gaps(req: SkillGapRequest):
    """
    Evaluates current team capabilities against required project roles,
    pinpointing exact critical gaps, coverage percentage, and urgency metrics.
    """
    try:
        return AIEngine.detect_skill_gaps(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
