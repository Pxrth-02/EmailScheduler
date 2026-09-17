import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { HttpError } from './error-handler.js';

/**
 * Validates the request body against a zod schema and replaces it with the parsed value,
 * so handlers work with typed, coerced data instead of raw JSON.
 */
export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(validationError(result.error.issues));
      return;
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validates the query string. Express 5 exposes `req.query` through a getter, so the
 * parsed copy lives in `res.locals.query`; read it back with `parsedQuery(res)`.
 */
export function validateQuery<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(validationError(result.error.issues));
      return;
    }
    res.locals.query = result.data;
    next();
  };
}

export function parsedQuery<T>(res: Response): T {
  return res.locals.query as T;
}

function validationError(issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>) {
  return new HttpError(
    400,
    'Validation failed',
    issues.map((issue) => ({ path: issue.path.map(String).join('.'), message: issue.message })),
  );
}
