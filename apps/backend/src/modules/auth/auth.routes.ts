import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authenticateToken } from '../../middleware/auth';
import {
  RegisterSchema,
  LoginSchema,
  VerifyEmailSchema,
  ResendVerificationSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  GoogleAuthSchema,
  ChangePasswordSchema,
  ChangeEmailSchema,
} from '@projectx/common';

import { passwordResetLimiter } from '../../middleware/rateLimiter';

export const authRouter = Router();

authRouter.post('/register', validate(RegisterSchema), AuthController.register);
authRouter.post('/verify-email', validate(VerifyEmailSchema), AuthController.verifyEmail);
authRouter.post('/resend-verification', passwordResetLimiter, validate(ResendVerificationSchema), AuthController.resendVerification);
authRouter.post('/login', validate(LoginSchema), AuthController.login);
authRouter.post('/google', validate(GoogleAuthSchema), AuthController.googleAuth);
authRouter.post('/forgot-password', passwordResetLimiter, validate(ForgotPasswordSchema), AuthController.forgotPassword);
authRouter.post('/reset-password', passwordResetLimiter, validate(ResetPasswordSchema), AuthController.resetPassword);
authRouter.post('/refresh', AuthController.refreshToken);
authRouter.get('/me', authenticateToken, AuthController.getMe);
authRouter.get('/colleges', AuthController.getColleges);

// Settings - Account & Security
authRouter.post('/change-password', authenticateToken, validate(ChangePasswordSchema), AuthController.changePassword);
authRouter.post('/change-email', authenticateToken, validate(ChangeEmailSchema), AuthController.changeEmail);
authRouter.get('/sessions', authenticateToken, AuthController.getActiveSessions);
authRouter.post('/logout', authenticateToken, AuthController.logout);
authRouter.post('/logout-all', authenticateToken, AuthController.logoutAll);

