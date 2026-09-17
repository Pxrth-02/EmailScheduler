import { Router } from 'express';
import { env, slackEnabled } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { HttpError } from '../../middleware/error-handler.js';
import { currentUserId, requireAuth } from '../../middleware/require-auth.js';
import {
  completeSlackInstall,
  consumeInstallState,
  createInstallState,
  disconnectSlack,
  getSlackConnection,
  slackInstallUrl,
  toPublicConnection,
} from './slack.service.js';

/** Browser-facing OAuth endpoints, mounted at /slack. */
export const slackOAuthRouter = Router();

slackOAuthRouter.get('/install', requireAuth, async (req, res) => {
  if (!slackEnabled) throw new HttpError(503, 'Slack integration is not configured');
  const state = await createInstallState(currentUserId(req));
  res.redirect(slackInstallUrl(state));
});

/**
 * Where Slack sends the browser after the user approves. Deliberately not behind
 * `requireAuth`: this request lands on SLACK_REDIRECT_URI's host, which in development is a
 * tunnel the session cookie does not cover. The state token identifies the user instead
 * (see `createInstallState`), and every outcome redirects back to the dashboard.
 */
slackOAuthRouter.get('/oauth/callback', async (req, res) => {
  const { code, state, error } = req.query as Record<string, string | undefined>;
  const userId = typeof state === 'string' ? await consumeInstallState(state) : null;

  if (error || !code || !userId) {
    logger.warn({ error, stateKnown: userId !== null }, 'slack callback rejected');
    res.redirect(`${env.FRONTEND_URL}/?slack=error`);
    return;
  }

  try {
    const connection = await completeSlackInstall(userId, code);
    logger.info({ userId, team: connection.teamName }, 'slack connected');
    res.redirect(`${env.FRONTEND_URL}/?slack=connected`);
  } catch (err) {
    logger.error({ err }, 'slack install failed');
    res.redirect(`${env.FRONTEND_URL}/?slack=error`);
  }
});

/** JSON endpoints for the dashboard, mounted at /api/slack. */
export const slackApiRouter = Router();

slackApiRouter.use(requireAuth);

slackApiRouter.get('/connection', async (req, res) => {
  const connection = await getSlackConnection(currentUserId(req));
  res.json({
    available: slackEnabled,
    connection: connection ? toPublicConnection(connection) : { connected: false as const },
  });
});

slackApiRouter.delete('/connection', async (req, res) => {
  await disconnectSlack(currentUserId(req));
  res.status(204).end();
});
