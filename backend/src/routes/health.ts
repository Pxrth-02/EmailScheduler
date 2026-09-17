import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';

type ServiceState = 'up' | 'down';

const PROBE_TIMEOUT_MS = 2_000;

/**
 * Runs a dependency check with a hard timeout. The Redis client is configured to
 * retry commands forever (that is what the queue needs), so without a timeout a
 * health check would hang instead of reporting the dependency as down.
 */
async function probe(check: () => Promise<unknown>): Promise<ServiceState> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('probe timed out')), PROBE_TIMEOUT_MS);
  });

  try {
    await Promise.race([check(), timeout]);
    return 'up';
  } catch {
    return 'down';
  } finally {
    clearTimeout(timer);
  }
}

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  const [mysql, cache] = await Promise.all([
    probe(() => prisma.$queryRaw`SELECT 1`),
    probe(() => redis.ping()),
  ]);

  const healthy = mysql === 'up' && cache === 'up';

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    services: { mysql, redis: cache },
    uptimeSeconds: Math.round(process.uptime()),
  });
});
