import { calculateSkillConfidence, GitHubRepositoryItem } from '@projectx/common';

describe('Skill Evidence & Confidence Engine Unit Tests', () => {
  const sampleRepos: GitHubRepositoryItem[] = [
    {
      id: 101,
      name: 'aeroroute-pytorch-gnn',
      fullName: 'alice/aeroroute-pytorch-gnn',
      url: 'https://github.com/alice/aeroroute-pytorch-gnn',
      language: 'Python',
      stars: 12,
      forks: 2,
      description: 'GNN routing models in PyTorch',
      topics: ['pytorch', 'gnn', 'machine-learning'],
      updatedAt: '2026-01-01',
    },
    {
      id: 102,
      name: 'vision-transformer-experiments',
      fullName: 'alice/vision-transformer-experiments',
      url: 'https://github.com/alice/vision-transformer-experiments',
      language: 'Python',
      stars: 5,
      forks: 0,
      description: 'PyTorch vision transformer code',
      topics: ['pytorch', 'computer-vision'],
      updatedAt: '2026-02-01',
    },
    {
      id: 103,
      name: 'react-frontend-dashboard',
      fullName: 'alice/react-frontend-dashboard',
      url: 'https://github.com/alice/react-frontend-dashboard',
      language: 'TypeScript',
      stars: 2,
      forks: 1,
      description: 'React TypeScript dashboard',
      topics: ['react', 'typescript'],
      updatedAt: '2026-03-01',
    },
  ];

  it('should compute HIGH evidence confidence (75-88%) for multiple relevant GitHub repositories', () => {
    const skill = {
      skillName: 'PyTorch',
      proficiency: 4,
    };

    const result = calculateSkillConfidence(skill, sampleRepos);

    expect(result.confidenceScore).toBeGreaterThanOrEqual(75);
    expect(result.confidenceLevel).toBe('HIGH');
    expect(result.verificationStatus).toBe('EVIDENCE_SUPPORTED');
    expect(result.matchedRepositories).toHaveLength(2);
    // CRITICAL REQUIREMENT: "Do not automatically label someone verified simply because they have GitHub"
    expect(result.isVerified).toBe(false);
  });

  it('should compute MEDIUM evidence confidence (60-70%) for a single relevant repository or evidence URL', () => {
    const skill = {
      skillName: 'React',
      proficiency: 4,
      evidenceUrl: 'https://alice.dev/projects/dashboard',
    };

    const result = calculateSkillConfidence(skill, sampleRepos);

    expect(result.confidenceScore).toBeGreaterThanOrEqual(60);
    expect(result.confidenceScore).toBeLessThanOrEqual(75);
    expect(result.confidenceLevel).toBe('MEDIUM');
    expect(result.verificationStatus).toBe('EVIDENCE_SUPPORTED');
    expect(result.isVerified).toBe(false);
  });

  it('should assign LOW confidence (30-40%) and SELF_DECLARED status when no evidence or matched repos exist', () => {
    const skill = {
      skillName: 'Rust',
      proficiency: 5,
    };

    const result = calculateSkillConfidence(skill, sampleRepos);

    expect(result.confidenceScore).toBeLessThanOrEqual(40);
    expect(['LOW', 'NONE']).toContain(result.confidenceLevel);
    expect(result.verificationStatus).toBe('SELF_DECLARED');
    expect(result.matchedRepositories).toHaveLength(0);
    expect(result.isVerified).toBe(false);
  });

  it('should only mark verified when official institutional audit or platform verification is present', () => {
    const verifiedSkill = {
      skillName: 'Python',
      proficiency: 5,
      isVerified: true,
      verificationStatus: 'VERIFIED',
    };

    const result = calculateSkillConfidence(verifiedSkill, sampleRepos);

    expect(result.confidenceScore).toBe(95);
    expect(result.confidenceLevel).toBe('STRONG');
    expect(result.verificationStatus).toBe('VERIFIED');
    expect(result.isVerified).toBe(true);
  });
});
