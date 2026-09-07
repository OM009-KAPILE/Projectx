import { Request, Response, NextFunction } from 'express';
import { prisma } from '@projectx/db';
import { AppError } from '../../middleware/errorHandler';
import { emitToProject } from '../../sockets';
import {
  CreateTaskInput,
  UpdateTaskStatusInput,
  SendChatMessageInput,
  NotificationType,
} from '@projectx/common';
import { NotificationService } from '../../services/notification.service';
import { HealthEngine } from '../health/health-engine';

export class WorkspaceController {
  // Helper to ensure user is member or creator
  private static async verifyMembership(projectId: string, userId: string) {
    const isMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });
    if (!isMember) {
      const isCreator = await prisma.project.findFirst({
        where: { id: projectId, creatorId: userId },
      });
      if (!isCreator) {
        throw new AppError('Forbidden: You must be an accepted team member to access this workspace.', 403);
      }
    }
  }

  // Recalculate health metrics and broadcast to all connected workspace clients
  private static async recalculateAndBroadcastHealth(projectId: string) {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          creator: {
            include: {
              college: true,
              skills: { include: { skill: true } },
            },
          },
          members: {
            include: {
              user: {
                include: {
                  college: true,
                  skills: { include: { skill: true } },
                },
              },
            },
          },
          requiredRoles: {
            include: {
              requiredSkills: { include: { skill: true } },
            },
          },
          tasks: {
            orderBy: { createdAt: 'desc' },
          },
          milestones: {
            orderBy: { dueDate: 'asc' },
          },
          chatMessages: {
            take: 50,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (project) {
        const healthReport = HealthEngine.evaluate({ project });
        await prisma.project.update({
          where: { id: projectId },
          data: {
            healthStatus: healthReport.healthStatus,
            healthScore: healthReport.healthScore,
            healthSuggestions: JSON.stringify(healthReport.actionableSuggestions),
          },
        });
        emitToProject(projectId, 'health_updated', healthReport);
        return healthReport;
      }
    } catch (err) {
      console.error('Error recalculating project health:', err);
    }
  }

  public static async getWorkspaceOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const userId = req.user!.userId;
      await WorkspaceController.verifyMembership(projectId, userId);

      const [project, tasks, milestones, files, membersCount] = await Promise.all([
        prisma.project.findUnique({
          where: { id: projectId },
          include: { creator: { include: { college: true } } },
        }),
        prisma.task.findMany({
          where: { projectId },
          select: { id: true, status: true, priority: true, weight: true, progress: true },
        }),
        prisma.milestone.findMany({
          where: { projectId },
          orderBy: { dueDate: 'asc' },
        }),
        prisma.projectFile.findMany({
          where: { projectId },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.projectMember.count({ where: { projectId } }),
      ]);

      if (!project) {
        throw new AppError('Project not found.', 404);
      }

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
      const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
      const inReviewTasks = tasks.filter((t) => t.status === 'IN_REVIEW').length;
      const todoTasks = tasks.filter((t) => t.status === 'TODO').length;

      // Weighted progress calculation
      const totalExplicitWeight = tasks.reduce((sum, t) => sum + (t.weight || 0), 0);
      let calculatedProgress = 0;

      if (totalTasks > 0) {
        if (totalExplicitWeight > 0) {
          calculatedProgress = tasks.reduce((sum, t) => {
            const w = t.weight || 0;
            const prog = t.progress !== undefined && t.progress !== null
              ? t.progress
              : (t.status === 'DONE' ? 100 : t.status === 'IN_REVIEW' ? 75 : t.status === 'IN_PROGRESS' ? 50 : 0);
            return sum + (w * (prog / 100));
          }, 0);
        } else {
          calculatedProgress = tasks.reduce((sum, t) => {
            const prog = t.progress !== undefined && t.progress !== null
              ? t.progress
              : (t.status === 'DONE' ? 100 : t.status === 'IN_REVIEW' ? 75 : t.status === 'IN_PROGRESS' ? 50 : 0);
            return sum + ((100 / totalTasks) * (prog / 100));
          }, 0);
        }
      }

      const progressPercentage = Math.min(100, Math.max(0, Math.round(calculatedProgress)));
      const nextMilestone = milestones.find((m) => !m.isCompleted) || null;

      return res.status(200).json({
        success: true,
        data: {
          projectId: project.id,
          projectTitle: project.title,
          domain: project.domain,
          healthStatus: project.healthStatus,
          healthScore: project.healthScore,
          totalTasks,
          completedTasks,
          inProgressTasks,
          inReviewTasks,
          todoTasks,
          progressPercentage,
          totalMembers: membersCount + 1, // creator + members
          nextMilestone: nextMilestone
            ? {
                id: nextMilestone.id,
                title: nextMilestone.title,
                dueDate: nextMilestone.dueDate.toISOString(),
                isCompleted: nextMilestone.isCompleted,
              }
            : null,
          recentFilesCount: files.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const userId = req.user!.userId;
      await WorkspaceController.verifyMembership(projectId, userId);

      const tasks = await prisma.task.findMany({
        where: { projectId },
        include: {
          assignee: {
            include: { college: true },
          },
          milestone: true,
          comments: {
            include: {
              user: { include: { college: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: [{ status: 'asc' }, { orderIndex: 'asc' }, { createdAt: 'desc' }],
      });

      const totalExplicitWeight = tasks.reduce((sum, t) => sum + (t.weight || 0), 0);

      const formattedTasks = tasks.map((t) => {
        const effectiveWeight = totalExplicitWeight > 0
          ? (t.weight || 0)
          : (tasks.length > 0 ? Math.round((100 / tasks.length) * 10) / 10 : 0);
        const effectiveProgress = t.progress !== undefined && t.progress !== null
          ? t.progress
          : (t.status === 'DONE' ? 100 : t.status === 'IN_REVIEW' ? 75 : t.status === 'IN_PROGRESS' ? 50 : 0);
        const weightedContribution = Math.round((effectiveWeight * (effectiveProgress / 100)) * 10) / 10;

        return {
          id: t.id,
          projectId: t.projectId,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          weight: t.weight ?? 0,
          progress: t.progress ?? 0,
          weightedContribution,
          assignee: t.assignee
            ? {
                id: t.assignee.id,
                name: t.assignee.name,
                avatarUrl: t.assignee.avatarUrl,
                college: t.assignee.college.name,
              }
            : null,
          milestoneId: t.milestoneId,
          milestoneTitle: t.milestone?.title || null,
          dueDate: t.dueDate ? t.dueDate.toISOString() : null,
          comments: t.comments.map((c) => ({
            id: c.id,
            content: c.content,
            authorName: c.user.name,
            authorAvatar: c.user.avatarUrl,
            authorCollege: c.user.college.name,
            createdAt: c.createdAt.toISOString(),
          })),
          orderIndex: t.orderIndex,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        };
      });

      return res.status(200).json({
        success: true,
        data: formattedTasks,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const userId = req.user!.userId;
      await WorkspaceController.verifyMembership(projectId, userId);

      const input: CreateTaskInput = req.body;

      // Check task weight budget if weight is specified
      if (input.weight !== undefined && input.weight > 0) {
        const existingTasks = await prisma.task.findMany({
          where: { projectId },
          select: { weight: true },
        });
        const currentTotalWeight = existingTasks.reduce((acc, t) => acc + (t.weight || 0), 0);
        if (currentTotalWeight + input.weight > 100) {
          const available = Math.max(0, 100 - currentTotalWeight);
          throw new AppError(
            `Total task weight cannot exceed 100%. Currently used: ${currentTotalWeight}%, Available: ${available}%, Attempted: ${input.weight}%.`,
            400
          );
        }
      }

      const count = await prisma.task.count({
        where: { projectId, status: 'TODO' },
      });

      const initialProgress = input.progress !== undefined ? Math.max(0, Math.min(100, input.progress)) : 0;
      let initialStatus = 'TODO';
      if (initialProgress === 100) {
        initialStatus = 'DONE';
      } else if (initialProgress > 0) {
        initialStatus = 'IN_PROGRESS';
      }

      const task = await prisma.task.create({
        data: {
          projectId,
          title: input.title,
          description: input.description || null,
          priority: input.priority || 'MEDIUM',
          assigneeId: input.assigneeId || null,
          milestoneId: input.milestoneId || null,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          orderIndex: count,
          status: initialStatus as any,
          weight: input.weight !== undefined ? input.weight : 0,
          progress: initialProgress,
        },
        include: {
          assignee: { include: { college: true } },
          milestone: true,
        },
      });

      const allTasks = await prisma.task.findMany({
        where: { projectId },
        select: { weight: true },
      });
      const totalExplicitWeight = allTasks.reduce((sum, t) => sum + (t.weight || 0), 0);
      const effectiveWeight = totalExplicitWeight > 0
        ? (task.weight || 0)
        : (allTasks.length > 0 ? Math.round((100 / allTasks.length) * 10) / 10 : 0);
      const weightedContribution = Math.round((effectiveWeight * ((task.progress || 0) / 100)) * 10) / 10;

      const formatted = {
        id: task.id,
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        weight: task.weight ?? 0,
        progress: task.progress ?? 0,
        weightedContribution,
        assignee: task.assignee
          ? {
              id: task.assignee.id,
              name: task.assignee.name,
              avatarUrl: task.assignee.avatarUrl,
              college: task.assignee.college.name,
            }
          : null,
        milestoneId: task.milestoneId,
        milestoneTitle: task.milestone?.title || null,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        comments: [],
        orderIndex: task.orderIndex,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      };

      emitToProject(projectId, 'task_created', formatted);

      // Recalculate health and broadcast
      await WorkspaceController.recalculateAndBroadcastHealth(projectId);

      // Dispatch TASK_ASSIGNED notification if assigned to a team member
      if (task.assigneeId && task.assigneeId !== userId) {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        NotificationService.dispatch({
          userId: task.assigneeId,
          type: NotificationType.TASK_ASSIGNED,
          title: 'New Task Assigned 📋',
          message: `You were assigned task "${task.title}" on project "${project?.title || 'Workspace'}".`,
          link: `/workspace/${projectId}`,
          metadata: { taskId: task.id, projectId },
        }).catch((err) => console.error('Task notification error:', err));
      }

      return res.status(201).json({
        success: true,
        data: formatted,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateTaskStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId } = req.params;
      const userId = req.user!.userId;
      const input: UpdateTaskStatusInput = req.body;

      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { project: true },
      });

      if (!task) {
        throw new AppError('Task not found.', 404);
      }

      await WorkspaceController.verifyMembership(task.projectId, userId);

      const isLead = task.project.creatorId === userId;
      const isAssignee = task.assigneeId === userId;

      // Access control:
      // Lead can update any field (status, progress, weight, assigneeId, etc.)
      // Assignee can update status and progress of their own assigned task.
      // Other members cannot update this task.
      if (!isLead && !isAssignee) {
        throw new AppError('Forbidden: You can only update tasks assigned to you.', 403);
      }

      // If user is not lead, they cannot reassign or change weight
      if (!isLead) {
        if (input.weight !== undefined && input.weight !== task.weight) {
          throw new AppError('Forbidden: Only the project lead can adjust task weights.', 403);
        }
        if (input.assigneeId !== undefined && input.assigneeId !== task.assigneeId) {
          throw new AppError('Forbidden: Only the project lead can reassign tasks.', 403);
        }
      }

      // Check weight budget if weight is being updated
      if (input.weight !== undefined && input.weight !== task.weight) {
        const existingTasks = await prisma.task.findMany({
          where: { projectId: task.projectId, id: { not: taskId } },
          select: { weight: true },
        });
        const currentOtherWeights = existingTasks.reduce((acc, t) => acc + (t.weight || 0), 0);
        if (currentOtherWeights + input.weight > 100) {
          const available = Math.max(0, 100 - currentOtherWeights);
          throw new AppError(
            `Total task weight cannot exceed 100%. Currently used by other tasks: ${currentOtherWeights}%, Available: ${available}%, Attempted: ${input.weight}%.`,
            400
          );
        }
      }

      // Determine synchronized status and progress
      let newProgress = input.progress !== undefined ? input.progress : task.progress;
      let newStatus = input.status || task.status;

      // If progress changed explicitly without explicit status change:
      if (input.progress !== undefined && input.status === undefined) {
        if (newProgress === 100) {
          newStatus = 'DONE';
        } else if (newProgress === 0) {
          newStatus = 'TODO';
        } else {
          newStatus = 'IN_PROGRESS';
        }
      } else if (input.status !== undefined && input.progress === undefined) {
        // If status changed explicitly without explicit progress change:
        if (newStatus === 'DONE') {
          newProgress = 100;
        } else if (newStatus === 'TODO') {
          newProgress = 0;
        } else if (newStatus === 'IN_PROGRESS' && newProgress === 0) {
          newProgress = 50;
        }
      }

      // Clamp progress between 0 and 100
      newProgress = Math.max(0, Math.min(100, newProgress));

      const updateData: any = {
        status: newStatus,
        progress: newProgress,
      };

      if (isLead) {
        if (input.weight !== undefined) updateData.weight = input.weight;
        if (input.assigneeId !== undefined) updateData.assigneeId = input.assigneeId || null;
        if (input.orderIndex !== undefined) updateData.orderIndex = input.orderIndex;
      }

      const updated = await prisma.task.update({
        where: { id: taskId },
        data: updateData,
        include: {
          assignee: { include: { college: true } },
          milestone: true,
        },
      });

      // Calculate contribution
      const allTasks = await prisma.task.findMany({
        where: { projectId: task.projectId },
        select: { weight: true },
      });
      const totalExplicitWeight = allTasks.reduce((sum, t) => sum + (t.weight || 0), 0);
      const effectiveWeight = totalExplicitWeight > 0
        ? (updated.weight || 0)
        : (allTasks.length > 0 ? Math.round((100 / allTasks.length) * 10) / 10 : 0);
      const weightedContribution = Math.round((effectiveWeight * ((updated.progress || 0) / 100)) * 10) / 10;

      const formatted = {
        id: updated.id,
        projectId: updated.projectId,
        title: updated.title,
        description: updated.description,
        status: updated.status,
        priority: updated.priority,
        weight: updated.weight ?? 0,
        progress: updated.progress ?? 0,
        weightedContribution,
        assignee: updated.assignee
          ? {
              id: updated.assignee.id,
              name: updated.assignee.name,
              avatarUrl: updated.assignee.avatarUrl,
              college: updated.assignee.college.name,
            }
          : null,
        milestoneId: updated.milestoneId,
        milestoneTitle: updated.milestone?.title || null,
        dueDate: updated.dueDate ? updated.dueDate.toISOString() : null,
        orderIndex: updated.orderIndex,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };

      emitToProject(task.projectId, 'task_updated', formatted);

      // Recalculate health and broadcast
      await WorkspaceController.recalculateAndBroadcastHealth(task.projectId);

      return res.status(200).json({
        success: true,
        data: formatted,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async addTaskComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId } = req.params;
      const userId = req.user!.userId;
      const { content } = req.body;

      if (!content || !content.trim()) {
        throw new AppError('Comment content is required.', 400);
      }

      const task = await prisma.task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new AppError('Task not found.', 404);
      }

      await WorkspaceController.verifyMembership(task.projectId, userId);

      const comment = await prisma.taskComment.create({
        data: {
          taskId,
          userId,
          content: content.trim(),
        },
        include: {
          user: { include: { college: true } },
        },
      });

      const formatted = {
        id: comment.id,
        taskId,
        content: comment.content,
        authorName: comment.user.name,
        authorAvatar: comment.user.avatarUrl,
        authorCollege: comment.user.college.name,
        createdAt: comment.createdAt.toISOString(),
      };

      emitToProject(task.projectId, 'task_comment_added', formatted);

      return res.status(201).json({
        success: true,
        data: formatted,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const userId = req.user!.userId;
      await WorkspaceController.verifyMembership(projectId, userId);

      const files = await prisma.projectFile.findMany({
        where: { projectId },
        include: {
          uploader: { include: { college: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({
        success: true,
        data: files.map((f) => ({
          id: f.id,
          projectId: f.projectId,
          name: f.name,
          url: f.url,
          category: f.category,
          sizeBytes: f.sizeBytes,
          uploaderName: f.uploader.name,
          uploaderCollege: f.uploader.college.name,
          createdAt: f.createdAt.toISOString(),
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async addFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const userId = req.user!.userId;
      await WorkspaceController.verifyMembership(projectId, userId);

      const { name, url, category, sizeBytes } = req.body;

      if (!name || !url) {
        throw new AppError('File name and URL are required.', 400);
      }

      const file = await prisma.projectFile.create({
        data: {
          projectId,
          uploaderId: userId,
          name,
          url,
          category: category || 'DOC',
          sizeBytes: sizeBytes || 0,
        },
        include: {
          uploader: { include: { college: true } },
        },
      });

      const formatted = {
        id: file.id,
        projectId: file.projectId,
        name: file.name,
        url: file.url,
        category: file.category,
        sizeBytes: file.sizeBytes,
        uploaderName: file.uploader.name,
        uploaderCollege: file.uploader.college.name,
        createdAt: file.createdAt.toISOString(),
      };

      emitToProject(projectId, 'file_added', formatted);

      return res.status(201).json({
        success: true,
        data: formatted,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { fileId } = req.params;
      const userId = req.user!.userId;

      const file = await prisma.projectFile.findUnique({
        where: { id: fileId },
        include: { project: true },
      });

      if (!file) {
        throw new AppError('File not found.', 404);
      }

      const isOwner = file.project.creatorId === userId;
      const isUploader = file.uploaderId === userId;

      if (!isOwner && !isUploader) {
        throw new AppError('Forbidden: Only the uploader or project owner can delete files.', 403);
      }

      await prisma.projectFile.delete({
        where: { id: fileId },
      });

      return res.status(200).json({
        success: true,
        message: 'File removed successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMilestones(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const userId = req.user!.userId;
      await WorkspaceController.verifyMembership(projectId, userId);

      const milestones = await prisma.milestone.findMany({
        where: { projectId },
        include: { tasks: true },
        orderBy: { dueDate: 'asc' },
      });

      return res.status(200).json({
        success: true,
        data: milestones.map((m) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          dueDate: m.dueDate.toISOString(),
          isCompleted: m.isCompleted,
          totalTasks: m.tasks.length,
          completedTasks: m.tasks.filter((t) => t.status === 'DONE').length,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createMilestone(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const userId = req.user!.userId;
      await WorkspaceController.verifyMembership(projectId, userId);

      const { title, description, dueDate } = req.body;

      const milestone = await prisma.milestone.create({
        data: {
          projectId,
          title,
          description: description || null,
          dueDate: new Date(dueDate),
        },
      });

      return res.status(201).json({
        success: true,
        data: milestone,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateMilestoneStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { milestoneId } = req.params;
      const userId = req.user!.userId;
      const { isCompleted } = req.body;

      const milestone = await prisma.milestone.findUnique({
        where: { id: milestoneId },
      });

      if (!milestone) {
        throw new AppError('Milestone not found.', 404);
      }

      await WorkspaceController.verifyMembership(milestone.projectId, userId);

      const updated = await prisma.milestone.update({
        where: { id: milestoneId },
        data: { isCompleted },
      });

      if (isCompleted) {
        const project = await prisma.project.findUnique({
          where: { id: milestone.projectId },
          include: { members: true },
        });

        if (project) {
          const recipientIds = [project.creatorId, ...project.members.map((m) => m.userId)];
          for (const rId of recipientIds) {
            NotificationService.dispatch({
              userId: rId,
              type: NotificationType.MILESTONE_COMPLETED,
              title: 'Project Milestone Completed! 🚀',
              message: `Milestone "${milestone.title}" was marked as completed on "${project.title}".`,
              link: `/workspace/${project.id}`,
              metadata: { milestoneId, projectId: project.id },
            }).catch((err) => console.error('Milestone notification error:', err));
          }
        }
      }

      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getChatMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const userId = req.user!.userId;
      await WorkspaceController.verifyMembership(projectId, userId);

      const messages = await prisma.chatMessage.findMany({
        where: { projectId },
        include: {
          sender: {
            include: { college: true },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 100,
      });

      return res.status(200).json({
        success: true,
        data: messages.map((m) => ({
          id: m.id,
          projectId: m.projectId,
          sender: {
            id: m.sender.id,
            name: m.sender.name,
            avatarUrl: m.sender.avatarUrl,
            college: m.sender.college.name,
          },
          content: m.content,
          createdAt: m.createdAt.toISOString(),
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async sendChatMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const userId = req.user!.userId;
      await WorkspaceController.verifyMembership(projectId, userId);

      const input: SendChatMessageInput = req.body;

      const message = await prisma.chatMessage.create({
        data: {
          projectId,
          senderId: userId,
          content: input.content,
        },
        include: {
          sender: { include: { college: true } },
        },
      });

      const formatted = {
        id: message.id,
        projectId: message.projectId,
        sender: {
          id: message.sender.id,
          name: message.sender.name,
          avatarUrl: message.sender.avatarUrl,
          college: message.sender.college.name,
        },
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      };

      emitToProject(projectId, 'new_message', formatted);

      return res.status(201).json({
        success: true,
        data: formatted,
      });
    } catch (error) {
      next(error);
    }
  }
}
