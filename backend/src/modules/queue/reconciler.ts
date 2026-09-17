import { logger } from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';
import { emailJobId, emailQueue, enqueueEmails } from './email-queue.js';
import { markInterrupted, releaseEmail } from './email-transitions.js';

const BATCH = 200;

/** A row may sit in `sending` for this long before we assume its worker died. */
const STALE_SENDING_MS = 5 * 60 * 1000;

export interface ReconcileReport {
  scheduledChecked: number;
  reEnqueued: number;
  staleSending: number;
  interrupted: number;
  requeued: number;
}

/**
 * Makes Redis agree with MySQL after a restart.
 *
 * MySQL is the source of truth for what should still be sent. Normally every `scheduled`
 * row has a delayed job in Redis, but a wiped Redis, a crash between the DB write and
 * `addBulk`, or a lost AOF second can leave rows without jobs. Re-adding with the same jobId
 * is a no-op for rows that still have one, so this is safe to run on every boot.
 *
 * Rows stuck in `sending` belong to a worker that died mid-send. If their job is gone they
 * are marked failed rather than re-sent, because SMTP may already have accepted the message.
 */
export async function reconcileQueue(): Promise<ReconcileReport> {
  const report: ReconcileReport = {
    scheduledChecked: 0,
    reEnqueued: 0,
    staleSending: 0,
    interrupted: 0,
    requeued: 0,
  };

  let cursor: string | undefined;
  for (;;) {
    const rows = await prisma.email.findMany({
      where: { status: 'scheduled' },
      select: { id: true, scheduledAt: true },
      orderBy: { id: 'asc' },
      take: BATCH,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (rows.length === 0) break;
    cursor = rows[rows.length - 1]?.id;
    report.scheduledChecked += rows.length;

    const jobs = await Promise.all(rows.map((row) => emailQueue.getJob(emailJobId(row.id))));
    const missing = rows.filter((_, i) => jobs[i] === undefined);
    if (missing.length > 0) {
      await enqueueEmails(
        missing.map((row) => ({ emailId: row.id, scheduledAt: row.scheduledAt })),
      );
      report.reEnqueued += missing.length;
    }
  }

  const stale = await prisma.email.findMany({
    where: { status: 'sending', updatedAt: { lt: new Date(Date.now() - STALE_SENDING_MS) } },
    select: { id: true },
  });
  report.staleSending = stale.length;

  for (const row of stale) {
    const job = await emailQueue.getJob(emailJobId(row.id));
    const state = job ? await job.getState() : 'missing';

    if (state === 'active') continue; // a live worker still holds it

    if (state === 'waiting' || state === 'delayed' || state === 'prioritized') {
      // BullMQ will deliver it again; put the row back so the next claim can win.
      await releaseEmail(row.id);
      report.requeued++;
    } else {
      await markInterrupted(row.id);
      report.interrupted++;
    }
  }

  logger.info(report, 'queue reconciled with database');
  return report;
}
