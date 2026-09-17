import 'dotenv/config';
import { Worker } from 'bullmq';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { createRedisConnection, redis } from './lib/redis.js';
import { closeTransports } from './modules/mail/mailer.js';
import { createEmailProcessor } from './modules/queue/email-processor.js';
import type { EmailJobData } from './modules/queue/email-queue.js';
import { reconcileQueue } from './modules/queue/reconciler.js';
import { ensureEmailIndex } from './modules/search/email-index.js';
import { registerReservationCommand } from './modules/throughput/slot-reservation.js';

/**
 * The sending process. Runs separately from the HTTP API so the two can be scaled and
 * restarted independently; several copies can run at once because every decision that
 * matters (claiming a row, reserving a slot) happens in MySQL or Redis, never in memory.
 */
async function main(): Promise<void> {
  registerReservationCommand(redis);
  await ensureEmailIndex();
  await reconcileQueue();

  const worker = new Worker<EmailJobData>(env.EMAIL_QUEUE_NAME, createEmailProcessor(redis), {
    connection: createRedisConnection('worker'),
    concurrency: env.WORKER_CONCURRENCY,
    lockDuration: 60_000,
  });

  worker.on('ready', () =>
    logger.info(
      {
        queue: env.EMAIL_QUEUE_NAME,
        concurrency: env.WORKER_CONCURRENCY,
        minGapMs: env.MIN_DELAY_BETWEEN_EMAILS_MS,
        hourlyCap: env.MAX_EMAILS_PER_HOUR_PER_SENDER,
      },
      'worker ready',
    ),
  );
  worker.on('failed', (job, err) =>
    logger.warn(
      { jobId: job?.id, attemptsMade: job?.attemptsMade, err: err.message },
      'job failed',
    ),
  );
  worker.on('error', (err) => logger.error({ err }, 'worker error'));

  const shutdown = async (signal: NodeJS.Signals) => {
    logger.info({ signal }, 'worker shutting down');
    // close() waits for in-flight jobs to finish, so a restart never abandons a half-sent email.
    await worker.close();
    closeTransports();
    await Promise.allSettled([prisma.$disconnect(), redis.quit()]);
    process.exit(0);
  };

  process.on('SIGINT', (signal) => void shutdown(signal));
  process.on('SIGTERM', (signal) => void shutdown(signal));
}

main().catch((err) => {
  logger.fatal({ err }, 'worker failed to start');
  process.exit(1);
});
