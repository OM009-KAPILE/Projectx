import re
import math
from typing import List, Dict, Any, Tuple
from app.models.schemas import (
    AnalyzeProjectRequest,
    AnalyzeProjectResponse,
    RoleRequirement,
    SkillRequirement,
    MilestoneRecommendation,
    SkillGapRequest,
    SkillGapResponse,
    FilledRoleInfo,
    OpenGapInfo,
    TeamMemberProfile,
    CandidateMatchRequest,
    CandidateMatchResponse,
    CandidateMatchResult,
    MatchedSkillDetail,
    ProjectHealthRequest,
    ProjectHealthResponse,
)

# =========================================================================
# Domain Knowledge Graph & Skill Taxonomy
# =========================================================================

DOMAIN_PATTERNS = {
    "Robotics & Autonomous Systems": [
        "drone", "uav", "robot", "ros", "px4", "slam", "lidar", "autonomous", "flight", "quadrotor", "embedded"
    ],
    "Healthcare & Medical AI": [
        "health", "medical", "mri", "patient", "clinical", "hospital", "dicom", "cancer", "biomedical", "disease"
    ],
    "FinTech & Decentralized Finance": [
        "finance", "trading", "payment", "bank", "crypto", "defi", "blockchain", "solidity", "arbitrage", "portfolio"
    ],
    "Climate & CleanTech": [
        "energy", "grid", "solar", "carbon", "climate", "battery", "sustainability", "emission", "ev", "power"
    ],
    "EdTech & Learning Platforms": [
        "education", "student", "learn", "course", "tutoring", "quiz", "classroom", "curriculum", "study"
    ],
    "Developer Tools & Infrastructure": [
        "devops", "cloud", "compiler", "database", "distributed", "kubernetes", "engine", "profiler", "observability"
    ],
    "Computer Vision & Media": [
        "image", "video", "segmentation", "detection", "nerf", "rendering", "3d", "camera", "graphics"
    ],
}

SKILL_ROLE_MAPPINGS = {
    "AI/ML": {
        "Graph Neural Networks": ("GNN & Optimization Specialist", "Train spatio-temporal graph models for relational routing and combinatorial optimization.", 5),
        "Computer Vision": ("Computer Vision & Perception Engineer", "Build real-time vision pipelines, object detection, and spatial understanding.", 5),
        "NLP & Transformers": ("NLP & LLM Systems Engineer", "Develop specialized transformer architectures, fine-tuning, and retrieval systems.", 4),
        "PyTorch": ("Deep Learning Specialist", "Design and optimize neural network training pipelines and loss functions.", 4),
    },
    "Hardware & IoT": {
        "ROS / Robotics": ("Robotics & Autonomous Systems Lead", "Interface control algorithms with ROS2 nodes, actuator telemetry, and simulation.", 5),
        "Embedded C++": ("Firmware & Embedded Systems Engineer", "Implement low-latency firmware on microcontrollers with real-time sensor loops.", 4),
    },
    "Backend": {
        "Go": ("Distributed Backend Architect", "Build high-throughput microservices, consensus coordinators, and gRPC endpoints.", 4),
        "PostgreSQL": ("Data Infrastructure Engineer", "Design relational schemas, spatial query optimization, and storage indexing.", 4),
        "FastAPI": ("API & Inference Backend Engineer", "Construct asynchronous REST APIs and low-latency inference endpoints.", 3),
        "Node.js": ("Full-Stack / Backend Engineer", "Build reactive WebSocket event streams and RESTful domain services.", 3),
    },
    "Frontend": {
        "React": ("Frontend & UX Engineer", "Develop responsive web dashboards, real-time telemetry HUDs, and interactive interfaces.", 4),
        "TypeScript": ("Full-Stack TypeScript Specialist", "Ensure strict type-safety across client-server DTOs and state management.", 4),
        "UI/UX Design & Figma": ("Product & UI/UX Designer", "Design user journeys, accessible design systems, and design tokens.", 4),
        "Flutter": ("Mobile Application Developer", "Craft smooth cross-platform iOS and Android client applications.", 4),
    },
    "DevOps & Cloud": {
        "Docker & Kubernetes": ("Cloud & DevOps Engineer", "Automate containerized orchestration, CI/CD runners, and cluster scaling.", 4),
        "AWS / Cloud Architecture": ("Cloud Infrastructure Lead", "Architect resilient cloud topology, VPC peering, and object storage.", 4),
    },
}

class AIEngine:
    @staticmethod
    def detect_domain(text: str, user_domain: str = None) -> str:
        if user_domain and len(user_domain.strip()) > 2:
            return user_domain.strip()
        lower_text = text.lower()
        for domain, keywords in DOMAIN_PATTERNS.items():
            if any(k in lower_text for k in keywords):
                return domain
        return "Applied Software & Systems"

    @staticmethod
    def generate_sanitized_teaser(title: str, domain: str, pitch: str) -> str:
        """Progressive Disclosure: Sanitizes raw proprietary text into an engaging, safe public teaser."""
        sentences = [s.strip() for s in re.split(r'[.!?]+', pitch) if len(s.strip()) > 10]
        first_sentence = sentences[0] if sentences else pitch[:120]
        # Remove direct repo links or private tokens if present
        clean_teaser = re.sub(r'https?://\S+', '', first_sentence).strip()
        if not clean_teaser.endswith('.'):
            clean_teaser += '.'
        return f"A cross-institutional initiative in {domain}: {clean_teaser} Fostering interdisciplinary collaboration across top engineering colleges."

    @staticmethod
    def analyze_project(req: AnalyzeProjectRequest) -> AnalyzeProjectResponse:
        domain = AIEngine.detect_domain(f"{req.title} {req.pitch}", req.domain)
        public_teaser = AIEngine.generate_sanitized_teaser(req.title, domain, req.pitch)
        
        lower_text = f"{req.title} {req.pitch}".lower()
        extracted_roles: List[RoleRequirement] = []
        
        # Detect patterns
        is_mobile = any(w in lower_text for w in ["mobile", "android", "ios", "flutter", "react native", "phone", "app"])
        has_gnn = any(w in lower_text for w in ["gnn", "graph neural", "graph network", "routing", "combinatorial"])
        has_cv = any(w in lower_text for w in ["vision", "camera", "image", "photograph", "plant", "disease", "mri", "dicom", "segmentation", "lidar", "slam", "detect"])
        has_nlp = any(w in lower_text for w in ["nlp", "language", "transformer", "llm", "chat", "text", "speech"])
        has_robotics = any(w in lower_text for w in ["drone", "robot", "ros", "px4", "sensor", "actuator", "hardware", "stm32"])
        has_dist_backend = any(w in lower_text for w in ["distributed", "throughput", "concurrency", "golang", "go", "grpc", "raft"])
        
        # Role 1: Client / Frontend / Mobile
        if is_mobile:
            extracted_roles.append(
                RoleRequirement(
                    title="Mobile Developer",
                    description="Develop cross-platform mobile UI, camera integration, and offline-first client telemetry.",
                    priority="HIGH",
                    headcount=1,
                    suggested_proficiency="Intermediate",
                    required_skills=[
                        SkillRequirement(skill_name="Flutter", category="Mobile", min_level=3, is_critical=True),
                        SkillRequirement(skill_name="REST APIs", category="Backend", min_level=3, is_critical=True),
                    ]
                )
            )
        else:
            extracted_roles.append(
                RoleRequirement(
                    title="Lead Full-Stack & UI Architect",
                    description="Lead platform UI/UX development, state orchestration, and real-time client visualization.",
                    priority="HIGH",
                    headcount=1,
                    suggested_proficiency="Intermediate",
                    required_skills=[
                        SkillRequirement(skill_name="React", category="Frontend", min_level=4, is_critical=True),
                        SkillRequirement(skill_name="TypeScript", category="Frontend", min_level=4, is_critical=True),
                        SkillRequirement(skill_name="Tailwind CSS", category="Frontend", min_level=3, is_critical=False),
                    ]
                )
            )

        # Role 2: Specialized AI / Machine Learning Role
        if has_cv:
            extracted_roles.append(
                RoleRequirement(
                    title="ML Engineer (Computer Vision)",
                    description="Train convolutional neural networks and vision transformers for real-time anomaly and disease classification.",
                    priority="CRITICAL",
                    headcount=1,
                    suggested_proficiency="Intermediate",
                    required_skills=[
                        SkillRequirement(skill_name="Python", category="Backend", min_level=3, is_critical=True),
                        SkillRequirement(skill_name="Computer Vision", category="AI/ML", min_level=3, is_critical=True),
                        SkillRequirement(skill_name="PyTorch", category="AI/ML", min_level=3, is_critical=False),
                    ]
                )
            )
        elif has_gnn:
            extracted_roles.append(
                RoleRequirement(
                    title="GNN & Optimization Specialist",
                    description="Train spatio-temporal graph neural networks in PyTorch Geometric for dynamic multi-agent trajectory optimization.",
                    priority="CRITICAL",
                    headcount=1,
                    suggested_proficiency="Advanced",
                    required_skills=[
                        SkillRequirement(skill_name="Graph Neural Networks", category="AI/ML", min_level=4, is_critical=True),
                        SkillRequirement(skill_name="PyTorch", category="AI/ML", min_level=4, is_critical=True),
                        SkillRequirement(skill_name="Python", category="Backend", min_level=4, is_critical=True),
                    ]
                )
            )
        elif has_nlp:
            extracted_roles.append(
                RoleRequirement(
                    title="NLP & Transformer Specialist",
                    description="Build fine-tuned neural retrieval models and latency-optimized prompt chains.",
                    priority="CRITICAL",
                    headcount=1,
                    suggested_proficiency="Advanced",
                    required_skills=[
                        SkillRequirement(skill_name="NLP & Transformers", category="AI/ML", min_level=4, is_critical=True),
                        SkillRequirement(skill_name="Python", category="Backend", min_level=4, is_critical=True),
                    ]
                )
            )
        else:
            extracted_roles.append(
                RoleRequirement(
                    title="Machine Learning & Data Specialist",
                    description="Develop statistical data processing and predictive machine learning models.",
                    priority="HIGH",
                    headcount=1,
                    suggested_proficiency="Intermediate",
                    required_skills=[
                        SkillRequirement(skill_name="Python", category="Backend", min_level=3, is_critical=True),
                        SkillRequirement(skill_name="PyTorch", category="AI/ML", min_level=3, is_critical=False),
                    ]
                )
            )

        # Role 3: Systems / Hardware / Backend
        if has_robotics:
            extracted_roles.append(
                RoleRequirement(
                    title="Embedded Systems & ROS2 Engineer",
                    description="Implement real-time microcontroller drivers, MAVLink telemetry, and ROS2 sensor bridges.",
                    priority="CRITICAL",
                    headcount=1,
                    suggested_proficiency="Advanced",
                    required_skills=[
                        SkillRequirement(skill_name="ROS / Robotics", category="Hardware & IoT", min_level=4, is_critical=True),
                        SkillRequirement(skill_name="Embedded C++", category="Hardware & IoT", min_level=4, is_critical=True),
                    ]
                )
            )
        elif has_dist_backend:
            extracted_roles.append(
                RoleRequirement(
                    title="Distributed Systems Backend Architect",
                    description="Design scalable microservices, low-latency gRPC APIs, and resilient data persistence.",
                    priority="CRITICAL",
                    headcount=1,
                    suggested_proficiency="Advanced",
                    required_skills=[
                        SkillRequirement(skill_name="Go", category="Backend", min_level=4, is_critical=True),
                        SkillRequirement(skill_name="PostgreSQL", category="Backend", min_level=4, is_critical=True),
                    ]
                )
            )
        else:
            extracted_roles.append(
                RoleRequirement(
                    title="Backend Developer",
                    description="Design relational database schemas, REST APIs, and authentication endpoints.",
                    priority="HIGH",
                    headcount=1,
                    suggested_proficiency="Intermediate",
                    required_skills=[
                        SkillRequirement(skill_name="REST APIs", category="Backend", min_level=3, is_critical=True),
                        SkillRequirement(skill_name="PostgreSQL", category="Backend", min_level=3, is_critical=True),
                        SkillRequirement(skill_name="Node.js", category="Backend", min_level=3, is_critical=False),
                    ]
                )
            )

        # Calculate complexity
        complexity = min(10, max(4, len(extracted_roles) * 2 + (2 if has_robotics or has_gnn else 0)))
        weeks = req.target_timeline_weeks or 12

        # Recommended Milestones
        milestones = [
            MilestoneRecommendation(
                title="Phase 1: Architecture Specification & Core Prototypes",
                description="Finalize interface contracts, mock synthetic data streams, and build initial skeleton.",
                target_week=max(2, math.ceil(weeks * 0.25)),
            ),
            MilestoneRecommendation(
                title="Phase 2: Core Algorithm & Pipeline Integration",
                description="Train baseline models, integrate telemetry endpoints, and link frontend with backend services.",
                target_week=max(4, math.ceil(weeks * 0.60)),
            ),
            MilestoneRecommendation(
                title="Phase 3: Validation, Benchmark Testing & Deployment",
                description="Hardware/hardware-in-the-loop or edge benchmark trials, latency profiling, and public demo.",
                target_week=weeks,
            ),
        ]

        risks = [
            "Cross-college coordination across differing academic schedules and timezones.",
            "Hardware/cloud GPU quota constraints during peak model training phases.",
            "Interface drift between backend telemetry protocol and frontend client rendering.",
        ]

        problem_stmt = f"Current solutions in {domain} lack integrated cross-domain synergy, resulting in fragile prototypes and siloed research."

        return AnalyzeProjectResponse(
            title=req.title,
            problem_statement=problem_stmt,
            domain=domain,
            public_teaser=public_teaser,
            complexity_score=complexity,
            estimated_weeks=weeks,
            extracted_roles=extracted_roles,
            recommended_milestones=milestones,
            potential_risks=risks,
        )

    @staticmethod
    def detect_skill_gaps(req: SkillGapRequest) -> SkillGapResponse:
        filled_roles: List[FilledRoleInfo] = []
        open_gaps: List[OpenGapInfo] = []
        
        assigned_user_ids = set()
        colleges = set()

        for member in req.current_team:
            colleges.add(member.college)

        for role in req.project_roles:
            best_member = None
            best_score = 0
            best_matched_skills = []
            
            critical_skills = [s.skill_name for s in role.required_skills if s.is_critical]
            nice_skills = [s.skill_name for s in role.required_skills if not s.is_critical]
            all_req_skills = critical_skills + nice_skills

            for member in req.current_team:
                if member.id in assigned_user_ids:
                    continue
                
                member_skill_set = set(member.skills)
                matched = [s for s in all_req_skills if s in member_skill_set]
                
                # Check critical coverage
                critical_matched = [s for s in critical_skills if s in member_skill_set]
                
                score = 0
                if critical_skills:
                    score += int((len(critical_matched) / len(critical_skills)) * 70)
                if nice_skills:
                    score += int((len([s for s in nice_skills if s in member_skill_set]) / len(nice_skills)) * 30)
                elif not critical_skills:
                    score = 100

                if score > best_score:
                    best_score = score
                    best_member = member
                    best_matched_skills = matched

            # Threshold for considering a role filled
            if best_member and best_score >= 60:
                assigned_user_ids.add(best_member.id)
                filled_roles.append(
                    FilledRoleInfo(
                        role_title=role.title,
                        assigned_user={
                            "id": best_member.id,
                            "name": best_member.name,
                            "college": best_member.college,
                        },
                        match_score=best_score,
                        matching_skills=best_matched_skills,
                    )
                )
            else:
                # Open Gap!
                missing_crit = [s for s in critical_skills if not best_member or s not in best_member.skills]
                missing_nice = [s for s in nice_skills if not best_member or s not in best_member.skills]
                
                urgency = (
                    f"Missing critical skill(s): {', '.join(missing_crit)}. "
                    f"Without this role, progress on {role.title} will be completely blocked."
                )
                open_gaps.append(
                    OpenGapInfo(
                        role_title=role.title,
                        description=role.description,
                        priority=role.priority,
                        missing_critical_skills=missing_crit,
                        missing_nice_to_have_skills=missing_nice,
                        urgency_reason=urgency,
                    )
                )

        total_roles = max(1, len(req.project_roles))
        coverage_score = int((len(filled_roles) / total_roles) * 100)
        diversity_index = len(colleges)

        return SkillGapResponse(
            filled_roles=filled_roles,
            open_gaps=open_gaps,
            team_coverage_score=coverage_score,
            college_diversity_index=diversity_index,
        )

    @staticmethod
    def match_candidates(req: CandidateMatchRequest) -> CandidateMatchResponse:
        results: List[CandidateMatchResult] = []
        target_role = req.target_role
        
        crit_skills = {s.skill_name: s.min_level for s in target_role.required_skills if s.is_critical}
        nice_skills = {s.skill_name: s.min_level for s in target_role.required_skills if not s.is_critical}
        all_required = {**crit_skills, **nice_skills}

        for candidate in req.candidates:
            cand_skill_map = {s.name: s for s in candidate.skills}
            
            matched_skill_details: List[MatchedSkillDetail] = []
            missing_skills: List[str] = []
            
            crit_score = 0.0
            total_crit = max(1, len(crit_skills))
            
            for skill_name, min_lvl in crit_skills.items():
                if skill_name in cand_skill_map:
                    cs = cand_skill_map[skill_name]
                    # Proficiency factor
                    prof_factor = min(1.0, cs.proficiency / max(1, min_lvl))
                    crit_score += prof_factor
                    matched_skill_details.append(
                        MatchedSkillDetail(
                            name=skill_name,
                            proficiency=cs.proficiency,
                            has_evidence=cs.has_evidence,
                            evidence_url=cs.evidence_url,
                        )
                    )
                else:
                    missing_skills.append(skill_name)
                    
            nice_score = 0.0
            total_nice = max(1, len(nice_skills)) if nice_skills else 1
            for skill_name, min_lvl in nice_skills.items():
                if skill_name in cand_skill_map:
                    cs = cand_skill_map[skill_name]
                    prof_factor = min(1.0, cs.proficiency / max(1, min_lvl))
                    nice_score += prof_factor
                    matched_skill_details.append(
                        MatchedSkillDetail(
                            name=skill_name,
                            proficiency=cs.proficiency,
                            has_evidence=cs.has_evidence,
                            evidence_url=cs.evidence_url,
                        )
                    )
                else:
                    missing_skills.append(skill_name)

            # 1. Base Skill Score (0-100)
            if crit_skills:
                if nice_skills:
                    skill_score = int(((crit_score / total_crit) * 75) + ((nice_score / total_nice) * 25))
                else:
                    skill_score = int((crit_score / total_crit) * 100)
            else:
                skill_score = int((nice_score / total_nice) * 100)
            skill_score = min(100, max(0, skill_score))

            # 2. Evidence Confidence (0-100)
            evidence_count = sum(1 for m in matched_skill_details if m.has_evidence)
            evidence_score = int((evidence_count / max(1, len(matched_skill_details))) * 100) if matched_skill_details else 0

            # 3. Cross-College Diversity Boost (0 or 100)
            is_different_college = candidate.college_domain.lower() != req.creator_college_domain.lower()
            diversity_boost = 100 if is_different_college else 40

            # 4. Overall Weighted Score (50% Skill, 20% Evidence, 15% Diversity, 15% Profile completeness)
            profile_score = 100 if candidate.github_url and candidate.portfolio_url else (70 if candidate.github_url else 50)
            
            overall = int(
                (skill_score * 0.50) +
                (evidence_score * 0.20) +
                (diversity_boost * 0.15) +
                (profile_score * 0.15)
            )
            overall = min(99, max(10, overall))

            # Build explanation
            explanation_parts = []
            if skill_score >= 80:
                explanation_parts.append(f"Strong skill match ({skill_score}%) in required domain tools.")
            elif skill_score >= 50:
                explanation_parts.append(f"Moderate skill overlap ({skill_score}%), covering {len(matched_skill_details)} core capabilities.")
            else:
                explanation_parts.append(f"Emerging candidate with {skill_score}% skill alignment.")

            if evidence_score >= 75:
                explanation_parts.append("Has verified project repositories and concrete code evidence.")
            
            if is_different_college:
                explanation_parts.append(f"Fosters cross-college synergy between {req.creator_college_domain} and {candidate.college_name}.")

            explanation = " ".join(explanation_parts)

            results.append(
                CandidateMatchResult(
                    candidate_id=candidate.id,
                    candidate_name=candidate.name,
                    candidate_email=candidate.email,
                    candidate_avatar=candidate.avatar_url,
                    college_name=candidate.college_name,
                    college_domain=candidate.college_domain,
                    major=candidate.major,
                    graduation_year=candidate.graduation_year,
                    overall_match_score=overall,
                    skill_match_score=skill_score,
                    evidence_confidence_score=evidence_score,
                    diversity_boost=diversity_boost,
                    matched_skills=matched_skill_details,
                    missing_skills_for_role=missing_skills,
                    match_explanation=explanation,
                    github_url=candidate.github_url,
                    portfolio_url=candidate.portfolio_url,
                )
            )

        # Sort by overall match score descending
        results.sort(key=lambda x: x.overall_match_score, reverse=True)
        return CandidateMatchResponse(target_role_title=target_role.title, matches=results)

    @staticmethod
    def evaluate_project_health(req: ProjectHealthRequest) -> ProjectHealthResponse:
        tasks = req.tasks
        total_tasks = max(1, tasks.total)
        done_ratio = tasks.done / total_tasks
        in_progress_ratio = tasks.in_progress / total_tasks
        
        # Momentum score (0 - 100)
        # Factor in completion ratio and active task movement
        momentum = int((done_ratio * 60) + (in_progress_ratio * 30) + (10 if req.days_since_last_activity <= 3 else 0))
        momentum = min(100, max(0, momentum))

        # Collaboration index (0 - 100)
        collab = int(
            min(40, req.active_members_count * 15) +
            min(30, req.distinct_colleges_count * 15) +
            min(30, req.recent_messages_count * 3)
        )
        collab = min(100, max(0, collab))

        # Overall Health Score
        health_score = int((momentum * 0.55) + (collab * 0.45))
        
        # Adjust for inactivity penalty
        if req.days_since_last_activity > 7:
            health_score = max(20, health_score - 25)
        elif req.days_since_last_activity > 4:
            health_score = max(35, health_score - 10)

        # Determine Health Status and Risk Level
        if health_score >= 75:
            status = "EXCELLENT" if health_score >= 88 else "HEALTHY"
            risk_level = "LOW"
        elif health_score >= 50:
            status = "AT_RISK"
            risk_level = "MEDIUM"
        else:
            status = "CRITICAL"
            risk_level = "HIGH"

        # Blockers & Suggestions
        blockers = []
        suggestions = []

        if tasks.todo > tasks.done * 2 and total_tasks > 3:
            blockers.append("High backlog of pending TODO tasks relative to completed milestones.")
        
        if req.days_since_last_activity >= 5:
            blockers.append(f"No task updates or workspace activity recorded in {req.days_since_last_activity} days.")
            suggestions.append("Schedule a quick asynchronous check-in or weekly milestone standup.")

        if tasks.in_review > 2:
            blockers.append(f"{tasks.in_review} tasks awaiting review. Review bottleneck may stall team velocity.")
            suggestions.append("Prioritize code reviews and milestone acceptance to unblock dependent tasks.")

        if req.distinct_colleges_count > 1:
            suggestions.append(f"Great cross-college collaboration across {req.distinct_colleges_count} institutions! Keep communication asynchronous and documented.")
        else:
            suggestions.append("Consider recruiting a partner student from another university to broaden domain expertise.")

        if not suggestions:
            suggestions.append("Project momentum is strong. Continue tracking tasks against upcoming milestone deadlines.")

        return ProjectHealthResponse(
            health_status=status,
            health_score=health_score,
            risk_level=risk_level,
            momentum_score=momentum,
            collaboration_index=collab,
            blocker_alerts=blockers,
            actionable_suggestions=suggestions,
        )
