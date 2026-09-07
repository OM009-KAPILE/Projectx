import { Router } from 'express';
import { ProjectsController } from './projects.controller';
import { authenticateToken, optionalAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { AnalyzeProjectSchema, CreateProjectSchema } from '@projectx/common';

export const projectsRouter = Router();

projectsRouter.post('/ai-analyze', authenticateToken, validate(AnalyzeProjectSchema), ProjectsController.analyzeIdea);
projectsRouter.post('/', authenticateToken, validate(CreateProjectSchema), ProjectsController.createProject);
projectsRouter.get('/feed/home', optionalAuth, ProjectsController.getHomeFeed);
projectsRouter.get('/user/created', authenticateToken, ProjectsController.getMyCreatedProjects);
projectsRouter.get('/user/joined', authenticateToken, ProjectsController.getMyJoinedProjects);
projectsRouter.get('/', optionalAuth, ProjectsController.listProjects);
projectsRouter.get('/:id', optionalAuth, ProjectsController.getProjectById);
projectsRouter.get('/:id/team', optionalAuth, ProjectsController.getTeamOverview);
projectsRouter.patch('/:id/members/:memberId/role', authenticateToken, ProjectsController.assignMemberRole);
projectsRouter.post('/:id/invitations', authenticateToken, ProjectsController.inviteCandidate);
projectsRouter.patch('/:id/visibility', authenticateToken, ProjectsController.updateVisibility);
projectsRouter.delete('/:id/members/:memberId', authenticateToken, ProjectsController.revokeMemberAccess);
projectsRouter.get('/:id/gaps', optionalAuth, ProjectsController.getSkillGaps);
projectsRouter.get('/:id/matches', optionalAuth, ProjectsController.getProjectMatches);
