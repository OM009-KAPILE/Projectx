import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Clean up expired records periodically (every 5 mins)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (record.resetAt <= now) {
      memoryStore.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) {
  const {
    windowMs,
    max,
    message = 'Too many requests. Please slow down and try again later.',
    keyGenerator = (req: Request) => req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown',
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting during automated tests and development
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      return next();
    }

    const key = `${req.baseUrl || req.path}:${keyGenerator(req)}`;
    const now = Date.now();
    const record = memoryStore.get(key);

    if (!record || record.resetAt <= now) {
      memoryStore.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', max - 1);
      res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));
      return next();
    }

    if (record.count >= max) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));
      return next(new AppError(message, 429, { retryAfterSeconds: retryAfter }));
    }

    record.count += 1;
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));
    next();
  };
}

// Pre-configured standard rate limiters
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 30, // 30 requests per 15 min per IP
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

export const passwordResetLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 10,
  message: 'Too many password reset requests. Please check your email or try again later.',
});

export const generalApiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 600, // 600 requests per 15 min
  message: 'API rate limit exceeded. Please try again in a few moments.',
});
