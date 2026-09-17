import path from 'node:path';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { BULL_BOARD_PATH, bullBoardRouter, requireAuthPage } from './modules/admin/bull-board.js';
import { authRouter } from './modules/auth/auth.router.js';
import { sessionMiddleware } from './modules/auth/session.js';
import { campaignsRouter } from './modules/campaigns/campaigns.router.js';
import { emailsRouter } from './modules/emails/emails.router.js';
import { sendersRouter } from './modules/senders/senders.router.js';
import { slackApiRouter, slackOAuthRouter } from './modules/slack/slack.router.js';
import { healthRouter } from './routes/health.js';

export function createApp(): express.Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === '/health' },
      serializers: {
        req: (req) => ({ method: req.method, url: req.url }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
      customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
      customErrorMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
    }),
  );
  // Bull Board's UI uses inline scripts, so the CSP header is left to a reverse proxy.
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(express.json({ limit: '5mb' }));
  app.use(sessionMiddleware);

  app.use('/health', healthRouter);
  app.use('/auth', authRouter);
  app.use('/slack', slackOAuthRouter);

  app.use('/api/senders', sendersRouter);
  app.use('/api/campaigns', campaignsRouter);
  app.use('/api/emails', emailsRouter);
  app.use('/api/slack', slackApiRouter);

  app.use(BULL_BOARD_PATH, requireAuthPage, bullBoardRouter);

  if (env.STATIC_DIR) {
    app.use(serveFrontend(path.resolve(env.STATIC_DIR)));
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

const API_PREFIXES = ['/api', '/auth', '/slack', '/admin', '/health'];

/**
 * Production only: the built React app is served by the API itself, so the browser talks to
 * one origin and the session cookie, OAuth callbacks and Bull Board all just work. Hashed
 * assets are cached for a year; index.html never is, so a new deploy is picked up on reload.
 * Any GET that is not an API path falls back to index.html for client-side routing.
 */
function serveFrontend(staticDir: string): express.Router {
  const router = express.Router();
  const indexFile = path.join(staticDir, 'index.html');

  router.use(
    express.static(staticDir, {
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }),
  );

  router.get('/{*path}', (req, res, next) => {
    if (API_PREFIXES.some((prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`))) {
      next();
      return;
    }
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(indexFile);
  });

  return router;
}
