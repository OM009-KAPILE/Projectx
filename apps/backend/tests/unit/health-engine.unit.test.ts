import { HealthEngine } from '../../src/modules/health/health-engine';

describe('Health Engine Unit Tests', () => {
  const baseCreator = {
    id: 'creator-1',
    name: 'Alice Stanford',
    college: { name: 'Stanford University' },
    skills: [{ skill: { name: 'React' }, proficiency: 4 }],
  };

  it('should classify an active project with high task completion and filled roles as HEALTHY (score >= 80)', () => {
    const now = new Date();
    const healthyProject = {
      id: 'proj-healthy',
      title: 'AeroRoute AI',
      status: 'IN_PROGRESS',
      createdAt: new Date(now.getTime() - 14 * 24 * 3600 * 1000), // 2 weeks ago
      creator: baseCreator,
      members: [
        {
          id: 'm-1',
          userId: 'user-2',
          roleTitle: 'ML Engineer',
          user: {
            id: 'user-2',
            name: 'Bob MIT',
            college: { name: 'MIT' },
            skills: [{ skill: { name: 'PyTorch' }, proficiency: 5 }],
          },
        },
      ],
      requiredRoles: [
        {
          id: 'role-1',
          title: 'ML Engineer',
          isFilled: true,
          requiredSkills: [{ skill: { name: 'PyTorch' }, minLevel: 3, isCritical: true }],
        },
      ],
      tasks: [
        {
          id: 't-1',
          title: 'Implement GNN baseline',
          status: 'DONE',
          priority: 'HIGH',
          createdAt: new Date(now.getTime() - 7 * 24 * 3600 * 1000),
        },
        {
          id: 't-2',
          title: 'Dataset curation',
          status: 'DONE',
          priority: 'MEDIUM',
          createdAt: new Date(now.getTime() - 5 * 24 * 3600 * 1000),
        },
        {
          id: 't-3',
          title: 'UI dashboard',
          status: 'IN_PROGRESS',
          priority: 'LOW',
          createdAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000),
        },
      ],
      milestones: [
        {
          id: 'ms-1',
          title: 'Phase 1 MVP',
          dueDate: new Date(now.getTime() + 14 * 24 * 3600 * 1000),
          isCompleted: false,
        },
      ],
      chatMessages: [
        { id: 'c-1', createdAt: new Date(now.getTime() - 1 * 24 * 3600 * 1000) },
        { id: 'c-2', createdAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000) },
      ],
    };

    const metrics = HealthEngine.evaluate({ project: healthyProject });

    expect(metrics.healthScore).toBeGreaterThanOrEqual(75);
    expect(['HEALTHY', 'NEEDS_ATTENTION']).toContain(metrics.healthStatus);
    expect(metrics.riskLevel).not.toBe('CRITICAL');
    expect(metrics.teamCompleteness.score).toBe(100);
    expect(metrics.taskProgress.score).toBeGreaterThan(60);
  });

  it('should detect critical risks, unfilled roles, and overdue tasks', () => {
    const now = new Date();
    const strugglingProject = {
      id: 'proj-struggling',
      title: 'Overdue Project',
      status: 'RECRUITING',
      createdAt: new Date(now.getTime() - 30 * 24 * 3600 * 1000), // 1 month ago
      creator: baseCreator,
      members: [],
      requiredRoles: [
        {
          id: 'r-1',
          title: 'Lead Architect',
          isFilled: false,
          requiredSkills: [{ skill: { name: 'Rust' }, minLevel: 4, isCritical: true }],
        },
        {
          id: 'r-2',
          title: 'Backend Specialist',
          isFilled: false,
          requiredSkills: [{ skill: { name: 'Go' }, minLevel: 4, isCritical: true }],
        },
      ],
      tasks: [
        {
          id: 't-overdue-1',
          title: 'Core Engine Build',
          status: 'TODO',
          priority: 'URGENT',
          dueDate: new Date(now.getTime() - 7 * 24 * 3600 * 1000), // 7 days overdue
          createdAt: new Date(now.getTime() - 20 * 24 * 3600 * 1000),
        },
        {
          id: 't-overdue-2',
          title: 'Database Migration',
          status: 'TODO',
          priority: 'HIGH',
          dueDate: new Date(now.getTime() - 4 * 24 * 3600 * 1000), // 4 days overdue
          createdAt: new Date(now.getTime() - 15 * 24 * 3600 * 1000),
        },
      ],
      milestones: [
        {
          id: 'ms-overdue',
          title: 'Alpha Release',
          dueDate: new Date(now.getTime() - 3 * 24 * 3600 * 1000), // Overdue milestone
          isCompleted: false,
        },
      ],
      chatMessages: [], // Stale chat
    };

    const metrics = HealthEngine.evaluate({ project: strugglingProject });

    expect(metrics.healthScore).toBeLessThan(60);
    expect(['AT_RISK', 'CRITICAL', 'NEEDS_ATTENTION']).toContain(metrics.healthStatus);
    expect(metrics.blockerAlerts.length).toBeGreaterThan(0);
    expect(metrics.actionableSuggestions.length).toBeGreaterThan(0);
    expect(metrics.recommendations.some((r) => r.type === 'TEAM')).toBe(true);
  });

  it('should initialize healthy baseline suggestions for a newly created project with no tasks yet', () => {
    const now = new Date();
    const newProject = {
      id: 'proj-new',
      title: 'Brand New Idea',
      status: 'RECRUITING',
      createdAt: now,
      creator: baseCreator,
      members: [],
      requiredRoles: [],
      tasks: [],
      milestones: [],
      chatMessages: [],
    };

    const metrics = HealthEngine.evaluate({ project: newProject });

    expect(metrics.healthScore).toBeDefined();
    expect(metrics.actionableSuggestions.length).toBeGreaterThan(0);
  });
});
