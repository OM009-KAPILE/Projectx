import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticateToken, requireRole } from '../../middleware/auth';

export const adminRouter = Router();

// 1. Dashboard & Telemetry
adminRouter.get('/dashboard', authenticateToken, requireRole(['ADMIN']), AdminController.getDashboardStats);
adminRouter.get('/metrics', AdminController.getPlatformMetrics); // public or admin telemetry

// 2. Users Management
adminRouter.get('/users', authenticateToken, requireRole(['ADMIN']), AdminController.listUsers);
adminRouter.patch('/users/:id/suspend', authenticateToken, requireRole(['ADMIN']), AdminController.suspendUser);
adminRouter.patch('/users/:id/restore', authenticateToken, requireRole(['ADMIN']), AdminController.restoreUser);
adminRouter.patch('/users/:id/role', authenticateToken, requireRole(['ADMIN']), AdminController.changeUserRole);

// 3. Colleges Management
adminRouter.get('/colleges', authenticateToken, requireRole(['ADMIN']), AdminController.listColleges);
adminRouter.post('/colleges', authenticateToken, requireRole(['ADMIN']), AdminController.createCollege);
adminRouter.patch('/colleges/:id', authenticateToken, requireRole(['ADMIN']), AdminController.updateCollege);
adminRouter.delete('/colleges/:id', authenticateToken, requireRole(['ADMIN']), AdminController.deleteCollege);

// 4. Projects Moderation
adminRouter.get('/projects', authenticateToken, requireRole(['ADMIN']), AdminController.listProjects);
adminRouter.patch('/projects/:id/remove', authenticateToken, requireRole(['ADMIN']), AdminController.removeProject);
adminRouter.patch('/projects/:id/restore', authenticateToken, requireRole(['ADMIN']), AdminController.restoreProject);
adminRouter.delete('/projects/:id', authenticateToken, requireRole(['ADMIN']), AdminController.deleteProjectPermanently);

// 5. Applications Telemetry
adminRouter.get('/applications', authenticateToken, requireRole(['ADMIN']), AdminController.listApplications);

// 6. Reports Moderation
adminRouter.get('/reports', authenticateToken, requireRole(['ADMIN']), AdminController.listReports);
adminRouter.patch('/reports/:id', authenticateToken, requireRole(['ADMIN']), AdminController.updateReport);

// 7. Skills & Categories Management
adminRouter.get('/skills', authenticateToken, requireRole(['ADMIN']), AdminController.listSkills);
adminRouter.post('/skills', authenticateToken, requireRole(['ADMIN']), AdminController.createSkill);
adminRouter.delete('/skills/:id', authenticateToken, requireRole(['ADMIN']), AdminController.deleteSkill);
adminRouter.get('/categories', authenticateToken, requireRole(['ADMIN']), AdminController.listCategories);
adminRouter.post('/categories', authenticateToken, requireRole(['ADMIN']), AdminController.createCategory);
adminRouter.delete('/categories/:id', authenticateToken, requireRole(['ADMIN']), AdminController.deleteCategory);

// 8. System Settings
adminRouter.get('/settings', authenticateToken, requireRole(['ADMIN']), AdminController.getSystemSettings);
adminRouter.put('/settings', authenticateToken, requireRole(['ADMIN']), AdminController.updateSystemSetting);

// 9. SIH Judge Live Database View (Authenticated Admin / Demo Lead)
adminRouter.get('/database-view', authenticateToken, AdminController.getDatabaseView);

