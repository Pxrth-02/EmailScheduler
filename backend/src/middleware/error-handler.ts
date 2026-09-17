import type { NextFunction, Request, Response } from 'express';
import { logger } from '../lib/logger.js';

export class HttpError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
}

// Express only treats a middleware as an error handler when it declares four parameters.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }

  // express.json() throws a SyntaxError with a `body` property on malformed input
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Malformed JSON body' });
    return;
  }

  logger.error({ err, method: req.method, url: req.originalUrl }, 'unhandled error');
  res.status(500).json({ error: 'Internal server error' });
}
