import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from './logger.js';

/**
 * Creates a Redis connection. Every consumer (sessions, rate limiter, queue) gets its
 * own connection through this so the options stay in one place.
 *
 * `maxRetriesPerRequest: null` is what BullMQ requires: commands wait for a reconnect
 * instead of failing after 20 retries, which is the behaviour we want for a queue.
 */
export function createRedisConnection(name: string): Redis {
  const connection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    connectionName: name,
  });

  // ioredis emits one error per failed attempt while reconnecting; log the reason, not a stack each time.
  connection.on('error', (err: NodeJS.ErrnoException) =>
    logger.error({ connection: name, code: err.code, message: err.message }, 'redis error'),
  );
  connection.on('ready', () => logger.info({ connection: name }, 'redis ready'));

  return connection;
}

export const redis = createRedisConnection('api');
