import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { HttpError } from '../../middleware/error-handler.js';
import { requireAuth, currentUserId } from '../../middleware/require-auth.js';
import { validateBody } from '../../middleware/validate.js';
import { ensureSendersForUser } from '../senders/senders.service.js';
import {
  findUserById,
  loginWithPassword,
  registerWithPassword,
  toPublicUser,
  upsertGoogleUser,
} from './auth.service.js';
import { exchangeGoogleCode, googleAuthUrl } from './google.js';
import { destroySession, regenerateSession, saveSession } from './session.js';

export const authRouter = Router();

const credentialsSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

/** Establishes a fresh session for a user (new session id, so a pre-login id cannot be reused). */
async function signIn(req: Express.Request, userId: string): Promise<void> {
  await regenerateSession(req);
  req.session.userId = userId;
  await saveSession(req);
}

authRouter.get('/google', async (req, res) => {
  const state = randomBytes(16).toString('hex');
  req.session.oauthState = state;
  await saveSession(req);
  res.redirect(googleAuthUrl(state));
});

authRouter.get('/google/callback', async (req, res) => {
  const { code, state, error } = req.query as Record<string, string | undefined>;
  const expectedState = req.session.oauthState;
  delete req.session.oauthState;

  if (error || !code || !state || !expectedState || state !== expectedState) {
    logger.warn({ error, stateMatches: state === expectedState }, 'google callback rejected');
    res.redirect(`${env.FRONTEND_URL}/login?error=google`);
    return;
  }

  try {
    const profile = await exchangeGoogleCode(code);
    const user = await upsertGoogleUser(profile);
    await signIn(req, user.id);

    // Not awaited on purpose: creating Ethereal accounts is slow and must not hold up login.
    void ensureSendersForUser(user).catch((err) =>
      logger.error({ err, userId: user.id }, 'failed to provision senders after login'),
    );

    res.redirect(env.FRONTEND_URL);
  } catch (err) {
    logger.error({ err }, 'google code exchange failed');
    res.redirect(`${env.FRONTEND_URL}/login?error=google`);
  }
});

authRouter.post('/register', validateBody(credentialsSchema), async (req, res) => {
  const { email, password } = req.body as z.infer<typeof credentialsSchema>;
  const user = await registerWithPassword(email, password);
  await signIn(req, user.id);
  void ensureSendersForUser(user).catch((err) =>
    logger.error({ err, userId: user.id }, 'failed to provision senders after signup'),
  );
  res.status(201).json({ user: toPublicUser(user) });
});

authRouter.post('/login', validateBody(credentialsSchema), async (req, res) => {
  const { email, password } = req.body as z.infer<typeof credentialsSchema>;
  const user = await loginWithPassword(email, password);
  await signIn(req, user.id);
  res.json({ user: toPublicUser(user) });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await findUserById(currentUserId(req));
  if (!user) {
    // The session outlived the account; treat it as logged out.
    await destroySession(req);
    throw new HttpError(401, 'Authentication required');
  }
  res.json({ user: toPublicUser(user) });
});

authRouter.post('/logout', async (req, res) => {
  await destroySession(req);
  res.clearCookie('sid');
  res.status(204).end();
});
