import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ErrorTracker } from '../services/error-tracker.service';

export class AppError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode: number = 400, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Handle Zod Validation Error
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Handle Custom AppError (Operational expected errors)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }

  // Handle Prisma Known Request Errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'A unique constraint violation occurred (record already exists).',
      target: err.meta?.target,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Requested resource not found.',
    });
  }

  // Unhandled / 500 error: Track via ErrorTracker
  ErrorTracker.captureException(err, {
    userId: req.user?.userId,
    email: req.user?.email,
    path: req.originalUrl || req.path,
    method: req.method,
  });

  // Generic 500 error (production safe: never leak internal stack or db details)
  const isProduction = process.env.NODE_ENV === 'production';
  return res.status(500).json({
    success: false,
    message: isProduction
      ? 'An unexpected error occurred. Please try again later or contact support.'
      : err.message || 'Internal Server Error',
  });
}
