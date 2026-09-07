import { Router } from 'express';
import { HealthController } from './health.controller';
import { authenticateToken } from '../../middleware/auth';

export const healthRouter = Router();

healthRouter.get('/system', HealthController.getSystemHealth);
healthRouter.get('/projects/:projectId/health', authenticateToken, HealthController.getProjectHealth);
