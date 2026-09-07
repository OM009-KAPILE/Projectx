import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticateToken } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  UpdateProfileSchema,
  UserSkillCreateSchema,
  OnboardingSchema,
  StudentExperienceSchema,
  StudentHackathonSchema,
  StudentPastProjectSchema,
  UpdatePrivacySettingsSchema,
  UpdateAppearanceSchema,
  ConnectGitHubSchema,
} from '@projectx/common';

export const usersRouter = Router();

usersRouter.get('/search', UsersController.searchStudents);
usersRouter.post('/onboarding', authenticateToken, validate(OnboardingSchema), UsersController.completeOnboarding);
usersRouter.get('/completion', authenticateToken, UsersController.getProfileCompletion);
usersRouter.get('/:id', UsersController.getProfile);
usersRouter.patch('/me', authenticateToken, validate(UpdateProfileSchema), UsersController.updateProfile);

// GitHub Integration & Evidence Confidence
usersRouter.post('/me/github', authenticateToken, validate(ConnectGitHubSchema), UsersController.connectGitHub);
usersRouter.delete('/me/github', authenticateToken, UsersController.disconnectGitHub);
usersRouter.get('/:id/github', UsersController.getGitHubData);
usersRouter.get('/:id/evidence-confidence', UsersController.getEvidenceConfidenceBreakdown);

// Skills with evidence & verification
usersRouter.post('/me/skills', authenticateToken, validate(UserSkillCreateSchema), UsersController.addSkill);
usersRouter.patch('/me/skills/:skillId', authenticateToken, UsersController.updateSkill);
usersRouter.delete('/me/skills/:skillId', authenticateToken, UsersController.removeSkill);

// Experiences
usersRouter.post('/me/experiences', authenticateToken, validate(StudentExperienceSchema), UsersController.addExperience);
usersRouter.patch('/me/experiences/:id', authenticateToken, UsersController.updateExperience);
usersRouter.delete('/me/experiences/:id', authenticateToken, UsersController.deleteExperience);

// Hackathons
usersRouter.post('/me/hackathons', authenticateToken, validate(StudentHackathonSchema), UsersController.addHackathon);
usersRouter.patch('/me/hackathons/:id', authenticateToken, UsersController.updateHackathon);
usersRouter.delete('/me/hackathons/:id', authenticateToken, UsersController.deleteHackathon);

// Past Projects
usersRouter.post('/me/projects', authenticateToken, validate(StudentPastProjectSchema), UsersController.addPastProject);
usersRouter.patch('/me/projects/:id', authenticateToken, UsersController.updatePastProject);
usersRouter.delete('/me/projects/:id', authenticateToken, UsersController.deletePastProject);

// Privacy & Appearance Settings
usersRouter.get('/me/privacy', authenticateToken, UsersController.getPrivacySettings);
usersRouter.patch('/me/privacy', authenticateToken, validate(UpdatePrivacySettingsSchema), UsersController.updatePrivacySettings);
usersRouter.patch('/me/appearance', authenticateToken, validate(UpdateAppearanceSchema), UsersController.updateAppearance);
usersRouter.delete('/me/account', authenticateToken, UsersController.deleteAccount);

