import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import { errorHandler } from './middleware/errorHandler';
import { authLimiter, generalApiLimiter } from './middleware/rateLimiter';
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { projectsRouter } from './modules/projects/projects.routes';
import { applicationsRouter } from './modules/applications/applications.routes';
import { workspaceRouter } from './modules/workspace/workspace.routes';
import { healthRouter } from './modules/health/health.routes';
import { messagesRouter } from './modules/messages/messages.routes';
import { notificationsRouter } from './modules/notifications/notifications.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { supportRouter } from './modules/support/support.routes';
import { collegesRouter } from './modules/colleges/colleges.routes';

import { HealthController } from './modules/health/health.controller';

export function createApp(): Express {
  const app = express();

  // Core Security & Utilities
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: false,
    })
  );
  app.use(cors({ origin: '*', credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Healthchecks (Excluded from rate limiting for cluster probes & ALBs)
  app.get('/healthz', HealthController.getSystemHealth);
  app.get('/api/healthz', HealthController.getSystemHealth);

  // General API Rate Limiting
  app.use('/api/', generalApiLimiter);

  // Static uploads directory
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  // API v1 Routes (Auth has specialized strict rate limits)
  app.use('/api/v1/auth', authLimiter, authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/projects', projectsRouter);
  app.use('/api/v1/applications', applicationsRouter);
  app.use('/api/v1/workspace', workspaceRouter);
  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/messages', messagesRouter);
  app.use('/api/v1/notifications', notificationsRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/support', supportRouter);
  app.use('/api/v1/colleges', collegesRouter);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
