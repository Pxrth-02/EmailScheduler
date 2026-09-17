import type { NextFunction, Request, Response } from 'express';
import { HttpError } from './error-handler.js';

/** Rejects requests without a logged-in session. Downstream handlers can rely on `req.session.userId`. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    next(new HttpError(401, 'Authentication required'));
    return;
  }
  next();
}

/** Typed accessor so route handlers do not repeat the non-null assertion. */
export function currentUserId(req: Request): string {
  const userId = req.session.userId;
  if (!userId) {
    throw new HttpError(401, 'Authentication required');
  }
  return userId;
}
