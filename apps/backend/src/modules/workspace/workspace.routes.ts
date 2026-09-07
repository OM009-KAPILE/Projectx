import { Router } from 'express';
import { WorkspaceController } from './workspace.controller';
import { authenticateToken } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  CreateTaskSchema,
  UpdateTaskStatusSchema,
  SendChatMessageSchema,
} from '@projectx/common';

export const workspaceRouter = Router();

workspaceRouter.use(authenticateToken);

workspaceRouter.get('/projects/:projectId/overview', WorkspaceController.getWorkspaceOverview);
workspaceRouter.get('/projects/:projectId/tasks', WorkspaceController.getTasks);
workspaceRouter.post('/projects/:projectId/tasks', validate(CreateTaskSchema), WorkspaceController.createTask);
workspaceRouter.patch('/tasks/:taskId/status', validate(UpdateTaskStatusSchema), WorkspaceController.updateTaskStatus);
workspaceRouter.post('/tasks/:taskId/comments', WorkspaceController.addTaskComment);

workspaceRouter.get('/projects/:projectId/files', WorkspaceController.getFiles);
workspaceRouter.post('/projects/:projectId/files', WorkspaceController.addFile);
workspaceRouter.delete('/files/:fileId', WorkspaceController.deleteFile);

workspaceRouter.get('/projects/:projectId/milestones', WorkspaceController.getMilestones);
workspaceRouter.post('/projects/:projectId/milestones', WorkspaceController.createMilestone);
workspaceRouter.patch('/milestones/:milestoneId/status', WorkspaceController.updateMilestoneStatus);

workspaceRouter.get('/projects/:projectId/chat', WorkspaceController.getChatMessages);
workspaceRouter.post('/projects/:projectId/chat', validate(SendChatMessageSchema), WorkspaceController.sendChatMessage);
