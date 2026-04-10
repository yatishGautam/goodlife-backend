import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { sendError } from '@/utils/apiResponse';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      sendError(
        res,
        'VALIDATION_ERROR',
        result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
        400,
      );
      return;
    }
    req.body = result.data;
    next();
  };
}
