import { AIService } from '../../src/services/ai.service';

describe('Matching Engine Unit Tests', () => {
  const sampleRole = {
    title: 'Computer Vision & PyTorch Engineer',
    description: 'Implement real-time vision pipelines with deep neural networks.',
    requiredSkills: [
      { skillName: 'Python', category: 'Backend', minLevel: 4, isCritical: true },
      { skillName: 'PyTorch', category: 'AI/ML', minLevel: 3, isCritical: true },
      { skillName: 'OpenCV', category: 'AI/ML', minLevel: 3, isCritical: false },
    ],
  };

  it('should score a candidate with 100% critical skill coverage and high proficiency near the top (>= 85%)', async () => {
    const perfectCandidate = {
      id: 'cand-1',
      name: 'Alice Top Gun',
      email: 'alice@stanford.edu',
      college: { name: 'Stanford University', domain: 'stanford.edu' },
      graduationYear: 2026,
      weeklyAvailability: '15 hours/week',
      interests: 'Computer Vision, Robotics, Deep Learning',
      skills: [
        { skill: { name: 'Python', category: 'Backend' }, proficiency: 5, isVerified: true },
        { skill: { name: 'PyTorch', category: 'AI/ML' }, proficiency: 4, isVerified: true },
        { skill: { name: 'OpenCV', category: 'AI/ML' }, proficiency: 4, isVerified: false },
      ],
      experiences: [{ title: 'ML Researcher', company: 'Stanford AI Lab', isCurrent: true }],
      hackathons: [{ title: 'TreeHacks', award: '1st Place Winner' }],
      pastProjects: [{ title: 'Drone Vision', technologies: 'PyTorch, OpenCV' }],
    };

    const results = await AIService.matchCandidates({
      targetRole: sampleRole,
      creatorCollegeDomain: 'stanford.edu',
      candidates: [perfectCandidate],
    });

    expect(results).toHaveLength(1);
    const match = results[0];
    expect(match.candidateId).toBe('cand-1');
    expect(match.overallMatchScore).toBeGreaterThanOrEqual(80);
    expect(match.scoreBreakdown.skillMatchScore).toBeGreaterThanOrEqual(85);
    expect(match.missingSkillsForRole).toHaveLength(0);
    expect(match.matchedSkills.length).toBeGreaterThanOrEqual(2);
  });

  it('should heavily penalize candidate missing critical skills (< 60%)', async () => {
    const unqualifiedCandidate = {
      id: 'cand-2',
      name: 'Bob Frontend Only',
      email: 'bob@mit.edu',
      college: { name: 'MIT', domain: 'mit.edu' },
      graduationYear: 2028,
      weeklyAvailability: '5 hours/week',
      interests: 'Frontend, CSS',
      skills: [
        { skill: { name: 'HTML/CSS', category: 'Frontend' }, proficiency: 5, isVerified: false },
        { skill: { name: 'Figma', category: 'Design' }, proficiency: 3, isVerified: false },
      ],
      experiences: [],
      hackathons: [],
      pastProjects: [],
    };

    const results = await AIService.matchCandidates({
      targetRole: sampleRole,
      creatorCollegeDomain: 'stanford.edu',
      candidates: [unqualifiedCandidate],
    });

    expect(results).toHaveLength(1);
    const match = results[0];
    expect(match.overallMatchScore).toBeLessThan(60);
    expect(match.missingSkillsForRole).toContain('Python');
    expect(match.missingSkillsForRole).toContain('PyTorch');
  });

  it('should handle an empty candidates list gracefully', async () => {
    const results = await AIService.matchCandidates({
      targetRole: sampleRole,
      creatorCollegeDomain: 'stanford.edu',
      candidates: [],
    });

    expect(results).toEqual([]);
  });

  it('should support custom matching weights properly', async () => {
    const candidate = {
      id: 'cand-3',
      name: 'Charlie Balanced',
      email: 'charlie@berkeley.edu',
      college: { name: 'UC Berkeley', domain: 'berkeley.edu' },
      skills: [
        { skill: { name: 'Python', category: 'Backend' }, proficiency: 4, isVerified: true },
      ],
      experiences: [{ title: 'Intern', company: 'Tech Inc' }],
    };

    // Weight 100% on skills
    const skillHeavy = await AIService.matchCandidates({
      targetRole: sampleRole,
      creatorCollegeDomain: 'stanford.edu',
      candidates: [candidate],
      weights: {
        skillMatch: 1.0,
        experience: 0.0,
        availability: 0.0,
        interestAlignment: 0.0,
        projectStageSuitability: 0.0,
        teamCompatibility: 0.0,
      },
    });

    expect(skillHeavy[0].overallMatchScore).toBeDefined();
    expect(skillHeavy[0].scoreBreakdown.skillMatchScore).toBeDefined();
  });
});
