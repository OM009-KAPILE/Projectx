import {
  HealthStatus,
  HealthRiskLevel,
  HealthMetricBreakdown,
  HealthRecommendation,
  ProjectHealthMetrics,
} from '@projectx/common';

export interface HealthEngineInput {
  project: {
    id: string;
    title: string;
    status: string;
    createdAt: Date;
    targetCompletionDate?: Date | null;
    creator: {
      id: string;
      name: string;
      skills: { skill: { name: string }; proficiency: number }[];
      college: { name: string };
    };
    members: {
      id: string;
      userId: string;
      roleTitle: string;
      user: {
        id: string;
        name: string;
        skills: { skill: { name: string }; proficiency: number }[];
        college: { name: string };
      };
    }[];
    requiredRoles: {
      id: string;
      title: string;
      isFilled: boolean;
      requiredSkills: {
        skill: { name: string };
        minLevel: number;
        isCritical: boolean;
      }[];
    }[];
    tasks: {
      id: string;
      title: string;
      status: string;
      priority: string;
      weight?: number;
      progress?: number;
      assigneeId?: string | null;
      dueDate?: Date | null;
      createdAt: Date;
    }[];
    milestones: {
      id: string;
      title: string;
      dueDate: Date;
      isCompleted: boolean;
    }[];
    chatMessages: {
      id: string;
      createdAt: Date;
    }[];
  };
}

export class HealthEngine {
  /**
   * Evaluates project health using transparent deterministic rules and real database data.
   * Structured so a future ML model or neural evaluator can replace or augment the scoring.
   */
  public static evaluate(input: HealthEngineInput): ProjectHealthMetrics {
    const { project } = input;
    const now = new Date();

    const recommendations: HealthRecommendation[] = [];
    const blockerAlerts: string[] = [];

    // -------------------------------------------------------------
    // 1. TEAM COMPLETENESS (Weight: 20%)
    // -------------------------------------------------------------
    const totalRequiredRoles = project.requiredRoles.length;
    const filledRoles = project.requiredRoles.filter((r) => r.isFilled).length;
    let teamCompletenessScore = 100;
    let teamStatus: HealthMetricBreakdown['status'] = 'EXCELLENT';
    let teamDetails = 'All predefined team roles filled';

    if (totalRequiredRoles > 0) {
      teamCompletenessScore = Math.round((filledRoles / totalRequiredRoles) * 100);
      if (teamCompletenessScore < 50) {
        teamStatus = 'CRITICAL';
        teamDetails = `${filledRoles} of ${totalRequiredRoles} roles filled. Critical staffing gap.`;
        const openRole = project.requiredRoles.find((r) => !r.isFilled);
        recommendations.push({
          id: 'rec_team_staffing_critical',
          type: 'TEAM',
          severity: 'HIGH',
          message: `Role "${openRole?.title || 'Open Role'}" is still open. Find matching candidates to complete your team.`,
          actionLabel: 'Find Candidates',
          actionTab: 'team',
        });
        blockerAlerts.push(`Project has ${totalRequiredRoles - filledRoles} unfilled role(s).`);
      } else if (teamCompletenessScore < 100) {
        teamStatus = 'FAIR';
        teamDetails = `${filledRoles} of ${totalRequiredRoles} roles filled (${totalRequiredRoles - filledRoles} open)`;
        const openRole = project.requiredRoles.find((r) => !r.isFilled);
        recommendations.push({
          id: 'rec_team_open_role',
          type: 'TEAM',
          severity: 'MEDIUM',
          message: `Consider recruiting candidate for "${openRole?.title || 'open role'}" to reach full team velocity.`,
          actionLabel: 'Invite Student',
          actionTab: 'team',
        });
      }
    } else {
      const activeMembers = project.members.length + 1; // creator + members
      teamCompletenessScore = activeMembers >= 2 ? 100 : 70;
      teamDetails = `${activeMembers} active builder${activeMembers > 1 ? 's' : ''}`;
    }

    const teamCompleteness: HealthMetricBreakdown = {
      label: 'Team Completeness',
      score: teamCompletenessScore,
      weightPercentage: 20,
      status: teamStatus,
      details: teamDetails,
    };

    // -------------------------------------------------------------
    // 2. TASK PROGRESS (Weight: 20%)
    // -------------------------------------------------------------
    const totalTasks = project.tasks.length;
    const todoTasks = project.tasks.filter((t) => t.status === 'TODO').length;
    const inProgressTasks = project.tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const inReviewTasks = project.tasks.filter((t) => t.status === 'IN_REVIEW').length;
    const doneTasks = project.tasks.filter((t) => t.status === 'DONE').length;

    let taskProgressScore = 100;
    let taskStatus: HealthMetricBreakdown['status'] = 'EXCELLENT';
    let taskDetails = 'All sprint tasks completed';

    if (totalTasks > 0) {
      // Calculate weighted completion percentage
      const totalExplicitWeight = project.tasks.reduce((sum, t) => sum + (t.weight || 0), 0);
      let calculatedProgress = 0;

      if (totalExplicitWeight > 0) {
        calculatedProgress = project.tasks.reduce((sum, t) => {
          const w = t.weight || 0;
          const prog = t.progress !== undefined && t.progress !== null
            ? t.progress
            : (t.status === 'DONE' ? 100 : t.status === 'IN_REVIEW' ? 75 : t.status === 'IN_PROGRESS' ? 50 : 0);
          return sum + (w * (prog / 100));
        }, 0);
      } else {
        calculatedProgress = project.tasks.reduce((sum, t) => {
          const prog = t.progress !== undefined && t.progress !== null
            ? t.progress
            : (t.status === 'DONE' ? 100 : t.status === 'IN_REVIEW' ? 75 : t.status === 'IN_PROGRESS' ? 50 : 0);
          return sum + ((100 / totalTasks) * (prog / 100));
        }, 0);
      }

      taskProgressScore = Math.min(100, Math.max(0, Math.round(calculatedProgress)));

      if (doneTasks === 0 && inProgressTasks === 0 && taskProgressScore === 0 && totalTasks > 2) {
        taskStatus = 'AT_RISK';
        taskDetails = `0% completed. All ${totalTasks} tasks in backlog.`;
        recommendations.push({
          id: 'rec_task_start_sprint',
          type: 'TASK',
          severity: 'MEDIUM',
          message: 'Sprint is inactive. Move initial backlog tasks into "In Progress".',
          actionLabel: 'View Tasks',
          actionTab: 'tasks',
        });
      } else if (taskProgressScore >= 75) {
        taskStatus = 'EXCELLENT';
        taskDetails = `${doneTasks} of ${totalTasks} tasks completed (${taskProgressScore}% weighted progress)`;
      } else if (taskProgressScore >= 45) {
        taskStatus = 'GOOD';
        taskDetails = `${doneTasks} completed, ${inProgressTasks + inReviewTasks} active (${taskProgressScore}% weighted progress)`;
      } else {
        taskStatus = 'FAIR';
        taskDetails = `${doneTasks} completed out of ${totalTasks} total tasks (${taskProgressScore}% weighted progress)`;
      }

      if (inReviewTasks >= 3) {
        recommendations.push({
          id: 'rec_task_review_bottleneck',
          type: 'TASK',
          severity: 'MEDIUM',
          message: `${inReviewTasks} tasks are awaiting review. Code review bottleneck may slow sprint momentum.`,
          actionLabel: 'Review Tasks',
          actionTab: 'tasks',
        });
      }
    } else {
      taskProgressScore = 80;
      taskDetails = 'No tasks registered in sprint backlog';
      recommendations.push({
        id: 'rec_task_empty',
        type: 'TASK',
        severity: 'LOW',
        message: 'Create initial sprint tasks to start tracking team delivery velocity.',
        actionLabel: 'Create Task',
        actionTab: 'tasks',
      });
    }

    const taskProgress: HealthMetricBreakdown = {
      label: 'Task Progress',
      score: taskProgressScore,
      weightPercentage: 20,
      status: taskStatus,
      details: taskDetails,
    };

    // -------------------------------------------------------------
    // 3. DEADLINE RISK & OVERDUE TASKS (Weight: 20%)
    // -------------------------------------------------------------
    const overdueTasks = project.tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
    );

    let deadlineScore = 100;
    let deadlineStatus: HealthMetricBreakdown['status'] = 'EXCELLENT';
    let deadlineDetails = 'All task deadlines on schedule';

    if (overdueTasks.length > 0) {
      deadlineScore = Math.max(10, 100 - overdueTasks.length * 20);
      deadlineStatus = overdueTasks.length >= 2 ? 'CRITICAL' : 'AT_RISK';
      deadlineDetails = `${overdueTasks.length} task${overdueTasks.length > 1 ? 's are' : ' is'} overdue`;
      blockerAlerts.push(`${overdueTasks.length} task${overdueTasks.length > 1 ? 's are' : ' is'} past target due date.`);
      recommendations.push({
        id: 'rec_deadline_overdue',
        type: 'TASK',
        severity: 'HIGH',
        message: `${overdueTasks.length === 1 ? 'One task is' : `${overdueTasks.length} tasks are`} overdue. Review sprint blockers or adjust due dates.`,
        actionLabel: 'Inspect Overdue',
        actionTab: 'tasks',
      });
    }

    // Check project targetCompletionDate proximity
    if (project.targetCompletionDate) {
      const daysUntilTarget = Math.ceil(
        (new Date(project.targetCompletionDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilTarget < 7 && totalTasks > 0 && doneTasks / totalTasks < 0.6) {
        deadlineScore = Math.max(15, deadlineScore - 25);
        deadlineStatus = 'CRITICAL';
        deadlineDetails += ` • Target completion in ${daysUntilTarget} day(s) with ${totalTasks - doneTasks} tasks remaining`;
        recommendations.push({
          id: 'rec_deadline_proximity',
          type: 'MILESTONE',
          severity: 'HIGH',
          message: `Project delivery deadline is in ${daysUntilTarget} days with ${totalTasks - doneTasks} pending tasks.`,
          actionLabel: 'View Roadmap',
          actionTab: 'milestones',
        });
      }
    }

    const deadlineRisk: HealthMetricBreakdown = {
      label: 'Deadline Risk',
      score: deadlineScore,
      weightPercentage: 20,
      status: deadlineStatus,
      details: deadlineDetails,
    };

    // -------------------------------------------------------------
    // 4. SKILL COVERAGE (Weight: 20%)
    // -------------------------------------------------------------
    // Aggregate collective team skills
    const teamSkillMap = new Map<string, number>();
    for (const us of project.creator.skills || []) {
      const sName = us.skill.name.toLowerCase();
      teamSkillMap.set(sName, Math.max(teamSkillMap.get(sName) || 0, us.proficiency));
    }
    for (const m of project.members || []) {
      for (const us of m.user.skills || []) {
        const sName = us.skill.name.toLowerCase();
        teamSkillMap.set(sName, Math.max(teamSkillMap.get(sName) || 0, us.proficiency));
      }
    }

    const allRequiredSkills: { skillName: string; minLevel: number; isCritical: boolean }[] = [];
    for (const role of project.requiredRoles || []) {
      for (const reqSkill of role.requiredSkills || []) {
        allRequiredSkills.push({
          skillName: reqSkill.skill.name,
          minLevel: reqSkill.minLevel,
          isCritical: reqSkill.isCritical,
        });
      }
    }

    let skillCoverageScore = 100;
    let skillStatus: HealthMetricBreakdown['status'] = 'EXCELLENT';
    let skillDetails = '100% of required technical skills covered';

    if (allRequiredSkills.length > 0) {
      let coveredCount = 0;
      const missingCriticalSkills: string[] = [];

      for (const req of allRequiredSkills) {
        const sLevel = teamSkillMap.get(req.skillName.toLowerCase()) || 0;
        if (sLevel >= req.minLevel) {
          coveredCount++;
        } else if (req.isCritical) {
          missingCriticalSkills.push(req.skillName);
        }
      }

      skillCoverageScore = Math.round((coveredCount / allRequiredSkills.length) * 100);

      if (missingCriticalSkills.length > 0) {
        skillStatus = 'AT_RISK';
        skillDetails = `${skillCoverageScore}% covered (Missing: ${missingCriticalSkills.join(', ')})`;
        recommendations.push({
          id: 'rec_skill_missing_critical',
          type: 'SKILL',
          severity: 'HIGH',
          message: `Your team is missing critical skill: ${missingCriticalSkills[0]}. Find matching students to fill the gap.`,
          actionLabel: 'Find Matches',
          actionTab: 'team',
        });
      } else if (skillCoverageScore < 100) {
        skillStatus = 'GOOD';
        skillDetails = `${skillCoverageScore}% covered across required stack`;
      }
    } else {
      skillCoverageScore = 90;
      skillDetails = 'No specific skill constraints configured';
    }

    const skillCoverage: HealthMetricBreakdown = {
      label: 'Skill Coverage',
      score: skillCoverageScore,
      weightPercentage: 20,
      status: skillStatus,
      details: skillDetails,
    };

    // -------------------------------------------------------------
    // 5. MILESTONE PROGRESS (Weight: 10%)
    // -------------------------------------------------------------
    const totalMilestones = project.milestones.length;
    const completedMilestones = project.milestones.filter((m) => m.isCompleted).length;
    const overdueMilestones = project.milestones.filter(
      (m) => !m.isCompleted && new Date(m.dueDate) < now
    );

    let milestoneScore = 100;
    let milestoneStatus: HealthMetricBreakdown['status'] = 'EXCELLENT';
    let milestoneDetails = 'All milestones achieved or on schedule';

    if (totalMilestones > 0) {
      milestoneScore = Math.round((completedMilestones / totalMilestones) * 100);
      if (overdueMilestones.length > 0) {
        milestoneScore = Math.max(10, milestoneScore - overdueMilestones.length * 25);
        milestoneStatus = 'CRITICAL';
        milestoneDetails = `Milestone "${overdueMilestones[0].title}" is behind schedule`;
        recommendations.push({
          id: 'rec_milestone_behind',
          type: 'MILESTONE',
          severity: 'HIGH',
          message: `Milestone "${overdueMilestones[0].title}" is behind schedule.`,
          actionLabel: 'Update Roadmap',
          actionTab: 'milestones',
        });
      } else if (milestoneScore === 100) {
        milestoneStatus = 'EXCELLENT';
        milestoneDetails = `${completedMilestones} of ${totalMilestones} milestones completed (100%)`;
      } else {
        milestoneStatus = 'GOOD';
        milestoneDetails = `${completedMilestones} of ${totalMilestones} milestones achieved`;
      }
    } else {
      milestoneScore = 85;
      milestoneDetails = 'No roadmap milestones defined yet';
    }

    const milestoneProgress: HealthMetricBreakdown = {
      label: 'Milestone Progress',
      score: milestoneScore,
      weightPercentage: 10,
      status: milestoneStatus,
      details: milestoneDetails,
    };

    // -------------------------------------------------------------
    // 6. WORKLOAD DISTRIBUTION (Weight: 10%)
    // -------------------------------------------------------------
    const openTasks = project.tasks.filter((t) => t.status !== 'DONE');
    let workloadScore = 100;
    let workloadStatus: HealthMetricBreakdown['status'] = 'EXCELLENT';
    let workloadDetails = 'Workload balanced across active members';

    if (openTasks.length > 0) {
      const assigneeCounts = new Map<string, number>();
      let unassignedCount = 0;

      for (const t of openTasks) {
        if (!t.assigneeId) {
          unassignedCount++;
        } else {
          assigneeCounts.set(t.assigneeId, (assigneeCounts.get(t.assigneeId) || 0) + 1);
        }
      }

      // Check if majority of tasks are unassigned
      if (unassignedCount > openTasks.length * 0.5 && openTasks.length > 2) {
        workloadScore = 60;
        workloadStatus = 'FAIR';
        workloadDetails = `${unassignedCount} open tasks unassigned`;
        recommendations.push({
          id: 'rec_workload_unassigned',
          type: 'WORKLOAD',
          severity: 'MEDIUM',
          message: 'Several tasks are unassigned. Distribute sprint backlog across team members.',
          actionLabel: 'Assign Tasks',
          actionTab: 'tasks',
        });
      } else {
        // Check for severe member overload
        const counts = Array.from(assigneeCounts.values());
        const maxTasksOnSingleMember = counts.length > 0 ? Math.max(...counts) : 0;
        if (maxTasksOnSingleMember >= openTasks.length * 0.75 && openTasks.length >= 3 && project.members.length >= 1) {
          workloadScore = 50;
          workloadStatus = 'AT_RISK';
          workloadDetails = 'High concentration bottleneck on a single member';
          recommendations.push({
            id: 'rec_workload_overload',
            type: 'WORKLOAD',
            severity: 'MEDIUM',
            message: 'Task load is concentrated heavily on one member. Consider reassigning tasks to balance sprint velocity.',
            actionLabel: 'Reassign Tasks',
            actionTab: 'tasks',
          });
        }
      }
    }

    const workloadDistribution: HealthMetricBreakdown = {
      label: 'Workload Balance',
      score: workloadScore,
      weightPercentage: 10,
      status: workloadStatus,
      details: workloadDetails,
    };

    // -------------------------------------------------------------
    // OVERALL PROJECT HEALTH SCORE (0 - 100)
    // -------------------------------------------------------------
    const weightedHealth =
      teamCompletenessScore * 0.20 +
      taskProgressScore * 0.20 +
      deadlineScore * 0.20 +
      skillCoverageScore * 0.20 +
      milestoneScore * 0.10 +
      workloadScore * 0.10;

    const healthScore = Math.min(100, Math.max(0, Math.round(weightedHealth)));

    // Risk Level Calculation
    let riskLevel: HealthRiskLevel = 'LOW';
    let healthStatus: HealthStatus = HealthStatus.HEALTHY;

    if (healthScore >= 75) {
      riskLevel = 'LOW';
      healthStatus = healthScore >= 88 ? HealthStatus.EXCELLENT : HealthStatus.HEALTHY;
    } else if (healthScore >= 50) {
      riskLevel = 'MEDIUM';
      healthStatus = HealthStatus.AT_RISK;
    } else {
      riskLevel = 'HIGH';
      healthStatus = HealthStatus.CRITICAL;
    }

    if (recommendations.length === 0) {
      recommendations.push({
        id: 'rec_general_optimal',
        type: 'GENERAL',
        severity: 'LOW',
        message: 'Project velocity and team coordination are optimal. Continue executing on track!',
      });
    }

    const distinctColleges = Array.from(
      new Set([
        project.creator.college?.name || 'College',
        ...(project.members || []).map((m) => m.user.college?.name).filter(Boolean),
      ])
    );

    const summary = `Project Health: ${healthScore}% (${riskLevel} Risk). ${teamDetails}. ${taskDetails}. ${deadlineDetails}.`;

    return {
      healthStatus,
      healthScore,
      riskLevel,
      teamCompleteness,
      taskProgress,
      deadlineRisk,
      skillCoverage,
      milestoneProgress,
      workloadDistribution,
      momentumScore: Math.min(100, Math.round((taskProgressScore * 0.6) + (deadlineScore * 0.4))),
      collaborationIndex: Math.min(100, distinctColleges.length * 35 + (project.members.length + 1) * 15),
      blockerAlerts,
      actionableSuggestions: recommendations.map((r) => r.message),
      recommendations,
      summary,
      taskStats: {
        total: totalTasks,
        todo: todoTasks,
        inProgress: inProgressTasks,
        inReview: inReviewTasks,
        done: doneTasks,
        overdue: overdueTasks.length,
        completionPercentage: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      },
      teamDiversity: {
        totalMembers: project.members.length + 1,
        distinctColleges: distinctColleges.length,
        collegeNames: distinctColleges,
      },
    };
  }
}
