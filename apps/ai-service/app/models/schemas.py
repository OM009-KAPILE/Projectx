from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# ====================================================
# 1. Project Analysis & Decomposition Schemas
# ====================================================

class AnalyzeProjectRequest(BaseModel):
    title: str = Field(..., min_length=3, description="Working title of the project")
    pitch: str = Field(..., min_length=10, description="Raw student idea or project pitch")
    domain: Optional[str] = Field(None, description="Optional domain context")
    existing_skills: Optional[List[str]] = Field(default_factory=list, description="Skills creator already possesses")
    target_timeline_weeks: Optional[int] = Field(12, description="Target duration in weeks")

class SkillRequirement(BaseModel):
    skill_name: str
    category: str
    min_level: int = Field(3, ge=1, le=5)
    is_critical: bool = True

class RoleRequirement(BaseModel):
    title: str
    description: str
    priority: str = Field("HIGH", description="CRITICAL | HIGH | MEDIUM")
    headcount: int = Field(1, ge=1, le=10, description="Suggested number of people for this role")
    suggested_proficiency: str = Field("Intermediate", description="Beginner | Intermediate | Advanced | Expert")
    required_skills: List[SkillRequirement]

class MilestoneRecommendation(BaseModel):
    title: str
    description: str
    target_week: int

class AnalyzeProjectResponse(BaseModel):
    title: str
    problem_statement: str
    domain: str
    public_teaser: str  # Progressive Disclosure Sanitized Summary
    complexity_score: int = Field(..., ge=1, le=10)
    estimated_weeks: int
    extracted_roles: List[RoleRequirement]
    recommended_milestones: List[MilestoneRecommendation]
    potential_risks: List[str]

# ====================================================
# 2. Skill Gap Detection Schemas
# ====================================================

class TeamMemberProfile(BaseModel):
    id: str
    name: str
    college: str
    role_title: str
    skills: List[str]

class SkillGapRequest(BaseModel):
    project_title: str
    project_roles: List[RoleRequirement]
    current_team: List[TeamMemberProfile]

class FilledRoleInfo(BaseModel):
    role_title: str
    assigned_user: Dict[str, str]
    match_score: int
    matching_skills: List[str]

class OpenGapInfo(BaseModel):
    role_title: str
    description: str
    priority: str
    missing_critical_skills: List[str]
    missing_nice_to_have_skills: List[str]
    urgency_reason: str

class SkillGapResponse(BaseModel):
    filled_roles: List[FilledRoleInfo]
    open_gaps: List[OpenGapInfo]
    team_coverage_score: int
    college_diversity_index: int

# ====================================================
# 3. Candidate Match Schemas
# ====================================================

class CandidateSkill(BaseModel):
    name: str
    proficiency: int
    has_evidence: bool = False
    evidence_url: Optional[str] = None
    evidence_summary: Optional[str] = None

class CandidateProfile(BaseModel):
    id: str
    name: str
    email: str
    avatar_url: Optional[str] = None
    college_name: str
    college_domain: str
    major: Optional[str] = None
    graduation_year: Optional[int] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    skills: List[CandidateSkill]

class CandidateMatchRequest(BaseModel):
    target_role: RoleRequirement
    creator_college_domain: str
    candidates: List[CandidateProfile]

class MatchedSkillDetail(BaseModel):
    name: str
    proficiency: int
    has_evidence: bool
    evidence_url: Optional[str] = None

class CandidateMatchResult(BaseModel):
    candidate_id: str
    candidate_name: str
    candidate_email: str
    candidate_avatar: Optional[str] = None
    college_name: str
    college_domain: str
    major: Optional[str] = None
    graduation_year: Optional[int] = None
    overall_match_score: int
    skill_match_score: int
    evidence_confidence_score: int
    diversity_boost: int
    matched_skills: List[MatchedSkillDetail]
    missing_skills_for_role: List[str]
    match_explanation: str
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None

class CandidateMatchResponse(BaseModel):
    target_role_title: str
    matches: List[CandidateMatchResult]

# ====================================================
# 4. Project Health Prediction Schemas
# ====================================================

class TaskSummary(BaseModel):
    total: int
    todo: int
    in_progress: int
    in_review: int
    done: int

class ProjectHealthRequest(BaseModel):
    project_title: str
    status: str
    created_at: str
    tasks: TaskSummary
    active_members_count: int
    distinct_colleges_count: int
    recent_messages_count: int
    days_since_last_activity: int

class ProjectHealthResponse(BaseModel):
    health_status: str  # EXCELLENT | HEALTHY | AT_RISK | CRITICAL
    health_score: int
    risk_level: Optional[str] = "LOW"  # LOW | MEDIUM | HIGH
    momentum_score: int
    collaboration_index: int
    blocker_alerts: List[str]
    actionable_suggestions: List[str]
