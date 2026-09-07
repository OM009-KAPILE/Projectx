import { Request, Response, NextFunction } from 'express';
import { prisma } from '@projectx/db';
import { AppError } from '../../middleware/errorHandler';
import { HealthEngine } from './health-engine';

export class HealthController {
  public static async getProjectHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;

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

      if (!project) {
        throw new AppError('Project not found.', 404);
      }

      // Enforce access control on detailed internal project health diagnostics
      const currentUserId = req.user?.userId;
      const isAuthorized =
        project.creatorId === currentUserId ||
        project.members.some((m) => m.userId === currentUserId) ||
        req.user?.role === 'ADMIN';

      if (!isAuthorized) {
        throw new AppError('Forbidden: Only accepted project members or creators can view internal project health diagnostics.', 403);
      }

      // Evaluate Project Health using real project data
      const healthReport = HealthEngine.evaluate({ project });

      // Persist updated health back to DB
      await prisma.project.update({
        where: { id: projectId },
        data: {
          healthStatus: healthReport.healthStatus,
          healthScore: healthReport.healthScore,
          healthSuggestions: JSON.stringify(healthReport.actionableSuggestions),
        },
      });

      return res.status(200).json({
        success: true,
        data: healthReport,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getSystemHealth(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    let dbStatus = 'healthy';
    let dbLatencyMs = 0;

    // 1. Check Database Health
    try {
      const dbStart = Date.now();
      await prisma.user.count({ take: 1 });
      dbLatencyMs = Date.now() - dbStart;
    } catch (err) {
      dbStatus = 'unhealthy';
    }

    const memoryUsage = process.memoryUsage();
    const isHealthy = dbStatus === 'healthy';

    const healthData = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startTime,
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
      },
      system: {
        memoryHeapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        memoryHeapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        memoryRssMB: Math.round(memoryUsage.rss / 1024 / 1024),
        nodeVersion: process.version,
      },
    };

    return res.status(isHealthy ? 200 : 503).json(healthData);
  }
}

