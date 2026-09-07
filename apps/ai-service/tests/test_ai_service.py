import pytest
from app.models.schemas import (
    AnalyzeProjectRequest,
    SkillGapRequest,
    RoleRequirement,
    SkillRequirement,
    TeamMemberProfile,
    CandidateMatchRequest,
    CandidateProfile,
    CandidateSkill,
    ProjectHealthRequest,
    TaskSummary,
)
from app.core.engine import AIEngine

def test_project_analysis_and_progressive_disclosure():
    req = AnalyzeProjectRequest(
        title="AeroRoute AI",
        pitch="Autonomous drone fleet trajectory planner using Graph Neural Networks and PX4 autopilot telemetry.",
        target_timeline_weeks=12
    )
    res = AIEngine.analyze_project(req)
    
    assert res.title == "AeroRoute AI"
    assert "Robotics" in res.domain or "Systems" in res.domain
    assert len(res.public_teaser) > 20
    assert "A cross-institutional initiative" in res.public_teaser
    assert len(res.extracted_roles) >= 2
    
    # Check that critical skills are extracted
    all_skills = [s.skill_name for r in res.extracted_roles for s in r.required_skills]
    assert any("Graph" in s or "PyTorch" in s or "ROS" in s for s in all_skills)

def test_skill_gap_detection():
    roles = [
        RoleRequirement(
            title="Lead Web UI",
            description="Frontend Lead",
            priority="HIGH",
            required_skills=[
                SkillRequirement(skill_name="React", category="Frontend", min_level=4, is_critical=True),
                SkillRequirement(skill_name="TypeScript", category="Frontend", min_level=4, is_critical=True),
            ]
        ),
        RoleRequirement(
            title="GNN & Optimization Specialist",
            description="Graph AI Engineer",
            priority="CRITICAL",
            required_skills=[
                SkillRequirement(skill_name="Graph Neural Networks", category="AI/ML", min_level=4, is_critical=True),
                SkillRequirement(skill_name="PyTorch", category="AI/ML", min_level=4, is_critical=True),
            ]
        ),
    ]

    # Team currently only has Alice (Frontend)
    team = [
        TeamMemberProfile(
            id="u1",
            name="Alice Chen",
            college="Stanford University",
            role_title="Project Lead",
            skills=["React", "TypeScript", "Tailwind CSS"],
        )
    ]

    req = SkillGapRequest(
        project_title="AeroRoute AI",
        project_roles=roles,
        current_team=team,
    )

    res = AIEngine.detect_skill_gaps(req)

    # Alice fills Web UI, but GNN is open gap
    assert len(res.filled_roles) == 1
    assert res.filled_roles[0].role_title == "Lead Web UI"
    assert len(res.open_gaps) == 1
    assert res.open_gaps[0].role_title == "GNN & Optimization Specialist"
    assert "Graph Neural Networks" in res.open_gaps[0].missing_critical_skills
    assert res.team_coverage_score == 50

def test_cross_college_candidate_matching():
    target_role = RoleRequirement(
        title="GNN & Optimization Specialist",
        description="Graph AI Engineer",
        priority="CRITICAL",
        required_skills=[
            SkillRequirement(skill_name="Graph Neural Networks", category="AI/ML", min_level=4, is_critical=True),
            SkillRequirement(skill_name="PyTorch", category="AI/ML", min_level=4, is_critical=True),
        ]
    )

    candidates = [
        CandidateProfile(
            id="cand1",
            name="Bob Miller",
            email="bob@mit.edu",
            college_name="Massachusetts Institute of Technology",
            college_domain="mit.edu",
            github_url="https://github.com/bobmiller-ai",
            skills=[
                CandidateSkill(name="Graph Neural Networks", proficiency=5, has_evidence=True, evidence_url="https://github.com/bob/gnn"),
                CandidateSkill(name="PyTorch", proficiency=5, has_evidence=True, evidence_url="https://github.com/bob/torch"),
            ]
        ),
        CandidateProfile(
            id="cand2",
            name="John Doe",
            email="john@stanford.edu",
            college_name="Stanford University",
            college_domain="stanford.edu",
            skills=[
                CandidateSkill(name="Python", proficiency=3),
            ]
        ),
    ]

    req = CandidateMatchRequest(
        target_role=target_role,
        creator_college_domain="stanford.edu",
        candidates=candidates,
    )

    res = AIEngine.match_candidates(req)

    assert len(res.matches) == 2
    # Bob (MIT) should rank top with high score & cross-college boost
    assert res.matches[0].candidate_id == "cand1"
    assert res.matches[0].overall_match_score >= 85
    assert res.matches[0].diversity_boost == 100
    assert "Strong skill match" in res.matches[0].match_explanation

def test_project_health_evaluation():
    req = ProjectHealthRequest(
        project_title="AeroRoute AI",
        status="IN_PROGRESS",
        created_at="2026-08-01",
        tasks=TaskSummary(total=10, todo=2, in_progress=3, in_review=1, done=4),
        active_members_count=3,
        distinct_colleges_count=2,
        recent_messages_count=15,
        days_since_last_activity=1,
    )

    res = AIEngine.evaluate_project_health(req)

    assert res.health_status in ["HEALTHY", "EXCELLENT"]
    assert res.health_score >= 60
    assert res.momentum_score >= 40
    assert len(res.actionable_suggestions) > 0
