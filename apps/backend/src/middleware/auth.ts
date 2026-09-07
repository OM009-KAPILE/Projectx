import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '@projectx/db';
import { AppError } from './errorHandler';

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: string;
  collegeId: string;
  collegeDomain: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Missing or malformed token.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { college: true },
    });

    if (!user) {
      throw new AppError('User belonging to this token no longer exists.', 401);
    }

    if (user.isSuspended) {
      throw new AppError(`Account suspended: ${user.suspendedReason || 'Terms of service violation.'}`, 403);
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      collegeId: user.collegeId,
      collegeDomain: user.college.domain,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Access token expired. Please refresh your session.', 401));
    }
    if (error.name === 'JsonWebTokenError' || error.name === 'NotBeforeError' || error instanceof jwt.JsonWebTokenError || error instanceof SyntaxError) {
      return next(new AppError('Invalid or malformed access token.', 401));
    }
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('Authentication failed. Invalid token.', 401));
  }
}

export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { college: true },
      });
      if (user) {
        req.user = {
          userId: user.id,
          email: user.email,
          role: user.role,
          collegeId: user.collegeId,
          collegeDomain: user.college.domain,
        };
      }
    }
    next();
  } catch (error) {
    // Optional auth does not block anonymous requests
    next();
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Forbidden: Insufficient platform permissions.', 403));
    }
    next();
  };
}
