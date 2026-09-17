import { Router } from 'express';
import { logger } from '../../lib/logger.js';
import { HttpError } from '../../middleware/error-handler.js';
import { currentUserId, requireAuth } from '../../middleware/require-auth.js';
import { findUserById } from '../auth/auth.service.js';
import { ensureSendersForUser, listSenders, toPublicSender } from './senders.service.js';

export const sendersRouter = Router();

sendersRouter.use(requireAuth);

sendersRouter.get('/', async (req, res) => {
  const userId = currentUserId(req);
  let senders = await listSenders(userId);

  // Provisioning after login runs in the background; if the user got here first, do it now.
  if (senders.length === 0) {
    const user = await findUserById(userId);
    if (!user) throw new HttpError(401, 'Authentication required');
    try {
      senders = await ensureSendersForUser(user);
    } catch (err) {
      logger.error({ err, userId }, 'sender provisioning failed');
      throw new HttpError(503, 'Could not create sender accounts right now, try again shortly');
    }
  }

  res.json({ senders: senders.map(toPublicSender) });
});
