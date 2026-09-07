import { AIService } from '../../src/services/ai.service';

describe('Skill Gap Detection Unit Tests', () => {
  const sampleProjectRoles = [
    {
      id: 'role-1',
      title: 'Full Stack Architect',
      description: 'Lead backend and web development',
      requiredSkills: [
        { skillName: 'React', category: 'Frontend', minLevel: 3, isCritical: true },
        { skillName: 'Node.js', category: 'Backend', minLevel: 3, isCritical: true },
      ],
    },
    {
      id: 'role-2',
      title: 'AI/ML Specialist',
      description: 'Model training and deployment',
      requiredSkills: [
        { skillName: 'PyTorch', category: 'AI/ML', minLevel: 4, isCritical: true },
        { skillName: 'Docker', category: 'DevOps', minLevel: 2, isCritical: false },
      ],
    },
  ];

  it('should return 100% skill coverage score when team covers all required skills', async () => {
    const fullTeam = [
      {
        name: 'Alice',
        college: 'Stanford',
        skills: [
          { skillName: 'React', proficiency: 4 },
          { skillName: 'Node.js', proficiency: 4 },
        ],
      },
      {
        name: 'Bob',
        college: 'MIT',
        skills: [
          { skillName: 'PyTorch', proficiency: 5 },
          { skillName: 'Docker', proficiency: 3 },
        ],
      },
    ];

    const result = await AIService.detectSkillGaps({
      projectTitle: 'Test AI Project',
      projectRoles: sampleProjectRoles,
      currentTeam: fullTeam,
    });

    expect(result.skillCoveragePercentage).toBe(100);
    expect(result.missingCriticalCount).toBe(0);
    expect(result.missingSkills).toHaveLength(0);
    expect(result.coveredSkills).toHaveLength(4);
    expect(result.summaryMessage).toContain('100% skill coverage');
    expect(result.collegeDiversityIndex).toBe(2);
  });

  it('should identify missing critical skills and generate open gaps with high urgency', async () => {
    const partialTeam = [
      {
        name: 'Alice',
        college: 'Stanford',
        skills: [{ skillName: 'React', proficiency: 4 }],
      },
    ];

    const result = await AIService.detectSkillGaps({
      projectTitle: 'Test AI Project',
      projectRoles: sampleProjectRoles,
      currentTeam: partialTeam,
    });

    expect(result.skillCoveragePercentage).toBeLessThan(100);
    expect(result.missingCriticalCount).toBeGreaterThan(0);
    expect(result.missingSkills.some((s: any) => s.skillName === 'Node.js' && s.isCritical)).toBe(true);
    expect(result.missingSkills.some((s: any) => s.skillName === 'PyTorch' && s.isCritical)).toBe(true);
    expect(result.openGaps.length).toBeGreaterThan(0);
  });

  it('should calculate overlapping skills when multiple team members share a skill', async () => {
    const redundantTeam = [
      {
        name: 'Alice',
        college: 'Stanford',
        skills: [{ skillName: 'React', proficiency: 4 }, { skillName: 'Python', proficiency: 4 }],
      },
      {
        name: 'Bob',
        college: 'MIT',
        skills: [{ skillName: 'React', proficiency: 5 }, { skillName: 'Python', proficiency: 3 }],
      },
    ];

    const result = await AIService.detectSkillGaps({
      projectTitle: 'Test AI Project',
      projectRoles: sampleProjectRoles,
      currentTeam: redundantTeam,
    });

    expect(result.overlappingSkills.length).toBeGreaterThan(0);
    const reactOverlap = result.overlappingSkills.find((o: any) => o.skillName.toLowerCase() === 'react');
    expect(reactOverlap).toBeDefined();
    expect(reactOverlap?.count).toBe(2);
    expect(reactOverlap?.coveredByMembers).toContain('Alice');
    expect(reactOverlap?.coveredByMembers).toContain('Bob');
  });

  it('should handle an empty team returning 0% coverage and all skills as missing', async () => {
    const result = await AIService.detectSkillGaps({
      projectTitle: 'Test AI Project',
      projectRoles: sampleProjectRoles,
      currentTeam: [],
    });

    expect(result.skillCoveragePercentage).toBe(0);
    expect(result.coveredSkills).toHaveLength(0);
    expect(result.missingSkills.length).toBe(4);
    expect(result.collegeDiversityIndex).toBe(0);
  });
});
