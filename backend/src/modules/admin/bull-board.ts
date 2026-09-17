import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env.js';
import { emailQueue } from '../queue/email-queue.js';

export const BULL_BOARD_PATH = '/admin/queues';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath(BULL_BOARD_PATH);

createBullBoard({
  queues: [new BullMQAdapter(emailQueue, { readOnlyMode: false })],
  serverAdapter,
  options: { uiConfig: { boardTitle: 'Email queue' } },
});

/** Live view of waiting / delayed / active / completed / failed jobs. */
export const bullBoardRouter = serverAdapter.getRouter();

/** Browser-friendly guard: an anonymous visitor is sent to the login page, not a JSON 401. */
export function requireAuthPage(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.redirect(`${env.FRONTEND_URL}/login`);
    return;
  }
  next();
}
