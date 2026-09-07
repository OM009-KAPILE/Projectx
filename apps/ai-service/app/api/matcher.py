from fastapi import APIRouter, HTTPException
from app.models.schemas import CandidateMatchRequest, CandidateMatchResponse
from app.core.engine import AIEngine

router = APIRouter(prefix="/match", tags=["Cross-College Candidate Matcher"])

@router.post("/candidates", response_model=CandidateMatchResponse)
def match_candidates(req: CandidateMatchRequest):
    """
    Ranks candidate profiles for a given project role using skill coverage,
    verified repository evidence, and cross-college institutional diversity factors.
    """
    try:
        return AIEngine.match_candidates(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
