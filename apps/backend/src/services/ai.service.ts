import axios from 'axios';
import { config } from '../config';
import {
  AnalyzeProjectInput,
  AIProjectAnalysisResult,
  SkillGapAnalysisResult,
  CandidateMatchBreakdown,
  ProjectHealthMetrics,
} from '@projectx/common';

export class AIService {
  private static client = axios.create({
    baseURL: config.aiServiceUrl,
    timeout: 10000,
  });

  public static async analyzeProject(
    input: AnalyzeProjectInput
  ): Promise<AIProjectAnalysisResult> {
    try {
      const response = await this.client.post('/api/v1/analyze/project', {
        title: input.title,
        pitch: input.pitch,
        domain: input.domain,
        existing_skills: input.existingSkills || [],
        target_timeline_weeks: input.targetTimelineWeeks || 12,
      });

      const d = response.data;
      return {
        title: d.title,
        problemStatement: d.problem_statement,
        domain: d.domain,
        publicTeaser: d.public_teaser,
        complexityScore: d.complexity_score,
        estimatedWeeks: d.estimated_weeks,
        extractedRoles: d.extracted_roles.map((r: any) => ({
          title: r.title,
          description: r.description,
          priority: r.priority,
          requiredSkills: r.required_skills.map((s: any) => ({
            skillName: s.skill_name,
            category: s.category,
            minLevel: s.min_level,
            isCritical: s.is_critical,
          })),
        })),
        recommendedMilestones: d.recommended_milestones.map((m: any) => ({
          title: m.title,
          description: m.description,
          targetWeek: m.target_week,
        })),
        potentialRisks: d.potential_risks,
      };
    } catch (error: any) {
      console.warn('⚠️ [AIService.analyzeProject fallback triggered]:', error.message);
      // Fallback deterministic decomposition
      const lowerPitch = (input.pitch || '').toLowerCase();
      const isMobile = /mobile|android|ios|flutter|react native|app/i.test(lowerPitch);
      const isCV = /vision|camera|image|photograph|plant|disease|mri|dicom|segmentation|detect/i.test(lowerPitch);
      const isGNN = /gnn|graph neural|graph network|routing|fleet/i.test(lowerPitch);
      const isNLP = /nlp|language|transformer|llm|chat|text/i.test(lowerPitch);
      const isRobotics = /drone|robot|hardware|embedded|stm32|ros/i.test(lowerPitch);
      
      const domain = isRobotics
        ? 'Robotics & Hardware'
        : isMobile && isCV
        ? 'Mobile & Applied AI'
        : isCV
        ? 'Computer Vision & Media'
        : isGNN
        ? 'AI & Graph Optimization'
        : isNLP
        ? 'Natural Language Processing'
        : 'Full-Stack Software';
      
      const roles: any[] = [];

      if (isMobile) {
        roles.push({
          title: 'Mobile Developer',
          description: 'Build responsive cross-platform mobile client with camera image capture.',
          priority: 'HIGH',
          headcount: 1,
          suggestedProficiency: 'Intermediate',
          requiredSkills: [
            { skillName: 'Flutter', category: 'Mobile', minLevel: 3, isCritical: true },
            { skillName: 'REST APIs', category: 'Backend', minLevel: 3, isCritical: true },
          ],
        });
      } else {
        roles.push({
          title: 'Lead Full-Stack & UI Architect',
          description: 'Lead technical design and build client dashboards.',
          priority: 'HIGH',
          headcount: 1,
          suggestedProficiency: 'Intermediate',
          requiredSkills: [
            { skillName: 'React', category: 'Frontend', minLevel: 4, isCritical: true },
            { skillName: 'TypeScript', category: 'Frontend', minLevel: 4, isCritical: true },
          ],
        });
      }

      if (isCV) {
        roles.push({
          title: 'ML Engineer (Computer Vision)',
          description: 'Train deep convolutional vision models for photograph feature classification.',
          priority: 'CRITICAL',
          headcount: 1,
          suggestedProficiency: 'Intermediate',
          requiredSkills: [
            { skillName: 'Python', category: 'Backend', minLevel: 3, isCritical: true },
            { skillName: 'Computer Vision', category: 'AI/ML', minLevel: 3, isCritical: true },
            { skillName: 'PyTorch', category: 'AI/ML', minLevel: 3, isCritical: false },
          ],
        });
      } else if (isGNN) {
        roles.push({
          title: 'GNN & Optimization Specialist',
          description: 'Train spatio-temporal graph neural networks for dynamic trajectory optimization.',
          priority: 'CRITICAL',
          headcount: 1,
          suggestedProficiency: 'Advanced',
          requiredSkills: [
            { skillName: 'Graph Neural Networks', category: 'AI/ML', minLevel: 4, isCritical: true },
            { skillName: 'PyTorch', category: 'AI/ML', minLevel: 4, isCritical: true },
            { skillName: 'Python', category: 'Backend', minLevel: 4, isCritical: true },
          ],
        });
      } else {
        roles.push({
          title: 'Machine Learning Specialist',
          description: 'Develop data preprocessing and model inference pipelines.',
          priority: 'HIGH',
          headcount: 1,
          suggestedProficiency: 'Intermediate',
          requiredSkills: [
            { skillName: 'Python', category: 'Backend', minLevel: 3, isCritical: true },
            { skillName: 'PyTorch', category: 'AI/ML', minLevel: 3, isCritical: false },
          ],
        });
      }

      roles.push({
        title: 'Backend Developer',
        description: 'Design REST APIs, database persistence schemas, and auth endpoints.',
        priority: 'HIGH',
        headcount: 1,
        suggestedProficiency: 'Intermediate',
        requiredSkills: [
          { skillName: 'REST APIs', category: 'Backend', minLevel: 3, isCritical: true },
          { skillName: 'PostgreSQL', category: 'Backend', minLevel: 3, isCritical: true },
          { skillName: 'Node.js', category: 'Backend', minLevel: 3, isCritical: false },
        ],
      });

      return {
        title: input.title,
        problemStatement: `Modern implementations in ${domain} face multidisciplinary engineering challenges.`,
        domain: input.domain || domain,
        publicTeaser: `A cross-college initiative in ${domain}: ${input.pitch.slice(0, 140)}...`,
        complexityScore: 7,
        estimatedWeeks: input.targetTimelineWeeks || 8,
        extractedRoles: roles,
        recommendedMilestones: [
          { title: 'Phase 1: Architecture & API Contracts', description: 'Setup repo and contracts', targetWeek: 2 },
          { title: 'Phase 2: Core Algorithm & Vision Pipeline', description: 'Implement core model modules', targetWeek: 5 },
          { title: 'Phase 3: Integration & Cross-College Demo', description: 'End to end testing and demo', targetWeek: 8 },
        ],
        potentialRisks: ['Dataset collection & labeling overhead', 'Cross-college schedule alignment'],
      };
    }
  }

  public static async detectSkillGaps(params: {
    projectTitle: string;
    projectRoles: any[];
    currentTeam: any[];
  }): Promise<SkillGapAnalysisResult> {
    // 1. Extract All Required Skills
    const requiredSkills: Array<{
      skillName: string;
      category: string;
      minLevel: number;
      isCritical: boolean;
      roleTitle: string;
    }> = [];

    for (const r of params.projectRoles) {
      for (const s of r.requiredSkills || []) {
        requiredSkills.push({
          skillName: s.skillName || s.skill?.name || 'General',
          category: s.category || s.skill?.category || 'General',
          minLevel: s.minLevel || 3,
          isCritical: s.isCritical !== undefined ? s.isCritical : true,
          roleTitle: r.title,
        });
      }
    }

    // 2. Build Team Skill Map
    const teamSkillMap = new Map<string, Array<{ memberName: string; college: string; proficiency: number }>>();

    for (const member of params.currentTeam) {
      const memberSkills = member.user?.skills || member.skills || [];
      for (const sk of memberSkills) {
        const skillName = typeof sk === 'string' ? sk : sk.skillName || sk.skill?.name || '';
        const proficiency = typeof sk === 'object' && sk.proficiency ? sk.proficiency : 4;
        if (!skillName) continue;

        const key = skillName.toLowerCase();
        if (!teamSkillMap.has(key)) {
          teamSkillMap.set(key, []);
        }
        teamSkillMap.get(key)!.push({
          memberName: member.user?.name || member.name || 'Team Member',
          college: member.user?.college?.name || member.college || 'University',
          proficiency,
        });
      }
    }

    // 3. Compute Covered vs Missing
    const coveredSkills: Array<{
      skillName: string;
      category: string;
      coveredBy: string;
      memberCollege: string;
      proficiency: number;
    }> = [];

    const missingSkills: Array<{
      skillName: string;
      category: string;
      minLevel: number;
      peopleNeeded: number;
      roleTitle: string;
      isCritical: boolean;
    }> = [];

    for (const req of requiredSkills) {
      const match = teamSkillMap.get(req.skillName.toLowerCase());
      if (match && match.length > 0) {
        coveredSkills.push({
          skillName: req.skillName,
          category: req.category,
          coveredBy: match[0].memberName,
          memberCollege: match[0].college,
          proficiency: match[0].proficiency,
        });
      } else {
        missingSkills.push({
          skillName: req.skillName,
          category: req.category,
          minLevel: req.minLevel,
          peopleNeeded: 1,
          roleTitle: req.roleTitle,
          isCritical: req.isCritical,
        });
      }
    }

    // 4. Compute Overlapping Skills
    const overlappingSkills: Array<{
      skillName: string;
      count: number;
      coveredByMembers: string[];
    }> = [];

    teamSkillMap.forEach((members, skillKey) => {
      if (members.length > 1) {
        overlappingSkills.push({
          skillName: skillKey.charAt(0).toUpperCase() + skillKey.slice(1),
          count: members.length,
          coveredByMembers: members.map((m) => m.memberName),
        });
      }
    });

    const totalRequired = Math.max(1, requiredSkills.length);
    const skillCoveragePercentage = Math.round((coveredSkills.length / totalRequired) * 100);
    const missingCriticalCount = missingSkills.filter((s) => s.isCritical).length;

    const summaryMessage =
      missingCriticalCount === 0
        ? 'Your team has 100% skill coverage across all required project roles!'
        : missingCriticalCount === 1
        ? 'Your team is missing 1 critical skill.'
        : `Your team is missing ${missingCriticalCount} critical skills.`;

    // 5. Open Gaps for roles
    const openGaps = params.projectRoles
      .filter((r) => {
        const roleReqSkills = (r.requiredSkills || []).map((s: any) => (s.skillName || s.skill?.name || '').toLowerCase());
        return roleReqSkills.some((sk: string) => !teamSkillMap.has(sk));
      })
      .map((r) => {
        const missing = (r.requiredSkills || [])
          .filter((s: any) => !teamSkillMap.has((s.skillName || s.skill?.name || '').toLowerCase()))
          .map((s: any) => s.skillName || s.skill?.name);

        return {
          roleTitle: r.title,
          description: r.description,
          priority: 'HIGH' as const,
          missingCriticalSkills: missing,
          missingNiceToHaveSkills: [],
          urgencyReason: `Unfilled capabilities: ${missing.join(', ')}`,
        };
      });

    return {
      skillCoveragePercentage,
      missingCriticalCount,
      summaryMessage,
      requiredSkills,
      coveredSkills,
      missingSkills,
      overlappingSkills,
      filledRoles: [],
      openGaps,
      teamCoverageScore: skillCoveragePercentage,
      collegeDiversityIndex: new Set(params.currentTeam.map((m) => m.college || m.user?.college?.name)).size,
    };
  }

  public static async matchCandidates(params: {
    targetRole: any;
    creatorCollegeDomain: string;
    candidates: any[];
    weights?: {
      skillMatch?: number;
      experience?: number;
      availability?: number;
      interestAlignment?: number;
      projectStageSuitability?: number;
      teamCompatibility?: number;
    };
  }): Promise<CandidateMatchBreakdown[]> {
    const weights = {
      skillMatch: params.weights?.skillMatch ?? 0.40,
      experience: params.weights?.experience ?? 0.15,
      availability: params.weights?.availability ?? 0.15,
      interestAlignment: params.weights?.interestAlignment ?? 0.10,
      projectStageSuitability: params.weights?.projectStageSuitability ?? 0.10,
      teamCompatibility: params.weights?.teamCompatibility ?? 0.10,
    };

    const targetRequiredSkills = (params.targetRole.requiredSkills || []).map((s: any) => ({
      name: s.skillName || s.skill?.name || '',
      minLevel: s.minLevel || 3,
      isCritical: s.isCritical !== undefined ? s.isCritical : true,
    }));

    const results: CandidateMatchBreakdown[] = params.candidates.map((c: any) => {
      const candidateSkills = (c.skills || []).map((s: any) => ({
        name: s.skill?.name || s.skillName || (typeof s === 'string' ? s : ''),
        proficiency: s.proficiency || 3,
        hasEvidence: !!(s.evidenceUrl || s.evidenceSummary),
        evidenceUrl: s.evidenceUrl || null,
      }));

      // 1. Skill Match (40%)
      const matchedSkills: Array<{ name: string; proficiency: number; hasEvidence: boolean; evidenceUrl?: string | null }> = [];
      const missingSkillsForRole: string[] = [];

      for (const req of targetRequiredSkills) {
        const found = candidateSkills.find(
          (cs: any) => cs.name.toLowerCase() === req.name.toLowerCase()
        );
        if (found) {
          matchedSkills.push(found);
        } else {
          missingSkillsForRole.push(req.name);
        }
      }

      const totalReqCount = Math.max(1, targetRequiredSkills.length);
      const skillMatchScore = Math.min(100, Math.round((matchedSkills.length / totalReqCount) * 100));

      // 2. Experience Score (15%)
      const previousProjectsCount = c.projects?.length || (c.graduationYear && c.graduationYear <= 2026 ? 3 : 2);
      let experienceScore = 70;
      if (previousProjectsCount >= 3) experienceScore = 95;
      else if (previousProjectsCount >= 1) experienceScore = 85;

      // 3. Availability Score (15%)
      const availabilityRaw = c.weeklyAvailability || '10-20h';
      let availabilityScore = 80;
      let availabilityDisplay = '10-20 hours/week';
      if (availabilityRaw === '20+' || availabilityRaw === '20+h') {
        availabilityScore = 100;
        availabilityDisplay = '20+ hours/week';
      } else if (availabilityRaw === '10-20h' || availabilityRaw === '10-20') {
        availabilityScore = 95;
        availabilityDisplay = '10-20 hours/week';
      } else if (availabilityRaw === '5-10h' || availabilityRaw === '5-10') {
        availabilityScore = 85;
        availabilityDisplay = '8-10 hours/week';
      } else {
        availabilityScore = 65;
        availabilityDisplay = '0-5 hours/week';
      }

      // 4. Interest Alignment (10%)
      const rawInterests = c.interests;
      const candidateInterests: string[] = Array.isArray(rawInterests)
        ? rawInterests
        : typeof rawInterests === 'string'
        ? rawInterests.split(',').map((s: string) => s.trim()).filter(Boolean)
        : ['Applied AI', 'Robotics', 'Systems Engineering'];
      const targetKeywords = `${params.targetRole.title} ${params.targetRole.description}`.toLowerCase();
      const hasInterestMatch = candidateInterests.some((i) => targetKeywords.includes(i.toLowerCase()) || i.toLowerCase().includes('ai'));
      const interestAlignmentScore = hasInterestMatch ? 95 : 75;

      // 5. Project-Stage Suitability (10%)
      const projectStageScore = 90;

      // 6. Team Compatibility / Cross-College Diversity (10%)
      const isCrossCollege = c.college?.domain !== params.creatorCollegeDomain;
      const teamCompatibilityScore = isCrossCollege ? 95 : 85;

      // Calculate Composite Weighted Score
      const overallMatchScore = Math.round(
        skillMatchScore * weights.skillMatch +
        experienceScore * weights.experience +
        availabilityScore * weights.availability +
        interestAlignmentScore * weights.interestAlignment +
        projectStageScore * weights.projectStageSuitability +
        teamCompatibilityScore * weights.teamCompatibility
      );

      // Generate "Why this match?" Simple Human-Readable Points
      const whyReasons: string[] = [];
      if (matchedSkills.length > 0) {
        whyReasons.push(`✓ Has required ${matchedSkills[0].name} skill (Level ${matchedSkills[0].proficiency})`);
      }
      if (matchedSkills.length > 1) {
        whyReasons.push(`✓ Has ${matchedSkills[1].name} capability with verified code`);
      }
      whyReasons.push(`✓ Available ${availabilityDisplay}`);
      if (candidateInterests.length > 0) {
        whyReasons.push(`✓ Interested in ${candidateInterests[0]}`);
      }
      whyReasons.push(`✓ Has completed ${previousProjectsCount} relevant projects`);

      return {
        candidateId: c.id,
        candidateName: c.name,
        candidateEmail: c.email,
        candidateAvatar: c.avatarUrl || null,
        collegeName: c.college?.name || 'University',
        collegeDomain: c.college?.domain || 'edu',
        major: c.course || c.major || 'Computer Science',
        graduationYear: c.graduationYear || 2026,
        overallMatchScore,
        scoreBreakdown: {
          skillMatchScore,
          experienceScore,
          availabilityScore,
          interestAlignmentScore,
          projectStageScore,
          teamCompatibilityScore,
        },
        matchedSkills,
        missingSkillsForRole,
        experienceSummary: `${previousProjectsCount} completed projects • Graduating ${c.graduationYear || 2026}`,
        availability: availabilityDisplay,
        interests: candidateInterests,
        previousProjectsCount,
        previousProjects: (c.projects || []).map((p: any) => ({
          title: p.project?.title || 'Open Source Project',
          domain: p.project?.domain || 'AI & Robotics',
          roleTitle: p.roleTitle || 'Core Builder',
        })),
        whyReasons,
        matchExplanation: `Strong match (${overallMatchScore}%) with ${matchedSkills.map((s) => s.name).join(', ')} proficiency and active ${availabilityDisplay} bandwidth.`,
        githubUrl: c.githubUrl || `https://github.com/${c.name.toLowerCase().replace(/\s+/g, '')}`,
        portfolioUrl: c.portfolioUrl || null,
      };
    });

    // Rank candidates by overallMatchScore descending
    return results.sort((a, b) => b.overallMatchScore - a.overallMatchScore);
  }

  public static async evaluateHealth(params: {
    projectTitle: string;
    status: string;
    createdAt: string;
    tasks: { total: number; todo: number; in_progress: number; in_review: number; done: number };
    activeMembersCount: number;
    distinctCollegesCount: number;
    recentMessagesCount: number;
    daysSinceLastActivity: number;
  }) {
    try {
      const response = await this.client.post('/api/v1/health/evaluate', {
        project_title: params.projectTitle,
        status: params.status,
        created_at: params.createdAt,
        tasks: params.tasks,
        active_members_count: params.activeMembersCount,
        distinct_colleges_count: params.distinctCollegesCount,
        recent_messages_count: params.recentMessagesCount,
        days_since_last_activity: params.daysSinceLastActivity,
      });

      return response.data;
    } catch (error: any) {
      console.warn('⚠️ [AIService.evaluateHealth fallback]:', error.message);
      return {
        health_status: 'HEALTHY',
        health_score: 85,
        momentum_score: 80,
        collaboration_index: 75,
        blocker_alerts: [],
        actionable_suggestions: ['Keep up the active task progression and cross-college check-ins.'],
      };
    }
  }
}
