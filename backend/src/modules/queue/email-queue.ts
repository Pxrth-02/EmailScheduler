import { Queue } from 'bullmq';
import { env } from '../../config/env.js';
import { redis } from '../../lib/redis.js';

export interface EmailJobData {
  emailId: string;
  /**
   * Set by the worker when the job had to wait for a send slot. On the next run the slot is
   * already paid for (counted in its hour window), so it must not be reserved again.
   */
  reservedSlot?: number;
}

export const EMAIL_JOB_NAME = 'send';

export const emailQueue = new Queue<EmailJobData>(env.EMAIL_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: env.JOB_ATTEMPTS,
    backoff: { type: 'exponential', delay: env.JOB_BACKOFF_MS },
    // Keep recent history visible in Bull Board without letting Redis grow forever.
    removeOnComplete: { age: 24 * 60 * 60, count: 5_000 },
    removeOnFail: { age: 7 * 24 * 60 * 60 },
  },
});

/**
 * One deterministic id per email row. BullMQ treats a second `add` with the same jobId as a
 * no-op, which is what makes every re-enqueue path (retries, the boot reconciler) idempotent.
 * (BullMQ reserves ":" in ids, hence the dash.)
 */
export function emailJobId(emailId: string): string {
  return `email-${emailId}`;
}

export interface EnqueueItem {
  emailId: string;
  scheduledAt: Date;
}

/** Adds delayed jobs for a batch of emails in a single round trip. */
export async function enqueueEmails(items: EnqueueItem[], now = Date.now()): Promise<void> {
  if (items.length === 0) return;

  await emailQueue.addBulk(
    items.map(({ emailId, scheduledAt }) => ({
      name: EMAIL_JOB_NAME,
      data: { emailId },
      opts: {
        jobId: emailJobId(emailId),
        delay: Math.max(0, scheduledAt.getTime() - now),
      },
    })),
  );
}
