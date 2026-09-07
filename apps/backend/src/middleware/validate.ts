import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodTypeAny } from 'zod';

export function validate(schema: ZodSchema | ZodTypeAny) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req.body);
      req.body = parsed;
      next();
    } catch (error) {
      next(error);
    }
  };
}
