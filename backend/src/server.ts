import 'dotenv/config';
import http from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { redis } from './lib/redis.js';

const server = http.createServer(createApp());

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'api listening');
});

function shutdown(signal: NodeJS.Signals): void {
  logger.info({ signal }, 'shutting down');

  server.close(() => {
    void Promise.allSettled([prisma.$disconnect(), redis.quit()]).then(() => process.exit(0));
  });

  // Don't hang forever if a connection refuses to close.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
