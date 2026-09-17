import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error-handler.js';
import { enqueueEmails } from '../queue/email-queue.js';
import { planSchedule } from '../scheduling/schedule-plan.js';
import { indexEmailsByIds } from '../search/email-index.js';
import { dedupeRecipients, type Recipient } from './recipients.js';

export interface CreateCampaignInput {
  userId: string;
  senderId: string;
  subject: string;
  bodyHtml: string;
  recipients: Recipient[];
  startAt: Date;
  delayMs: number;
  hourlyLimit: number;
}

export interface CreateCampaignResult {
  campaignId: string;
  total: number;
  firstAt: Date;
  lastAt: Date;
  effective: { delayMs: number; hourlyLimit: number };
  /** False if Redis rejected the jobs; the rows exist and the worker enqueues them on boot. */
  queued: boolean;
}

const INSERT_CHUNK = 500;

/**
 * Creates the campaign and one email row per recipient, then enqueues one delayed job per row.
 *
 * Database first, queue second: if the process dies between the two, the rows exist without
 * jobs and the worker's boot reconciler enqueues them. The reverse order could produce jobs
 * for rows that were never written, which nothing could repair.
 */
export async function createCampaign(input: CreateCampaignInput): Promise<CreateCampaignResult> {
  const sender = await prisma.sender.findFirst({
    where: { id: input.senderId, userId: input.userId },
  });
  if (!sender) {
    throw new HttpError(400, 'Unknown sender', [{ path: 'senderId', message: 'not one of yours' }]);
  }

  const recipients = dedupeRecipients(input.recipients);
  if (recipients.length === 0) {
    throw new HttpError(400, 'No valid recipients');
  }

  // The user may be stricter than the system, never looser.
  const effective = {
    delayMs: Math.max(input.delayMs, env.MIN_DELAY_BETWEEN_EMAILS_MS),
    hourlyLimit: Math.min(input.hourlyLimit, env.MAX_EMAILS_PER_HOUR_PER_SENDER),
  };

  const times = planSchedule({
    startAt: input.startAt,
    count: recipients.length,
    delayMs: effective.delayMs,
    hourlyLimit: effective.hourlyLimit,
  });

  const campaign = await prisma.$transaction(async (tx) => {
    const created = await tx.campaign.create({
      data: {
        userId: input.userId,
        senderId: sender.id,
        subject: input.subject,
        bodyHtml: input.bodyHtml,
        startAt: input.startAt,
        delayMs: effective.delayMs,
        hourlyLimit: effective.hourlyLimit,
        totalCount: recipients.length,
      },
    });

    const rows = recipients.map((recipient, i) => ({
      campaignId: created.id,
      userId: input.userId,
      senderId: sender.id,
      toEmail: recipient.email,
      toName: recipient.name,
      scheduledAt: times[i] ?? input.startAt,
    }));

    for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
      await tx.email.createMany({ data: rows.slice(i, i + INSERT_CHUNK) });
    }

    return created;
  });

  const emails = await prisma.email.findMany({
    where: { campaignId: campaign.id },
    select: { id: true, scheduledAt: true },
  });

  let queued = true;
  try {
    await enqueueEmails(emails.map((e) => ({ emailId: e.id, scheduledAt: e.scheduledAt })));
  } catch (err) {
    queued = false;
    logger.error({ err, campaignId: campaign.id }, 'rows saved but jobs could not be queued');
  }

  // Search indexing is best effort and never fails the request.
  void indexEmailsByIds(emails.map((e) => e.id)).catch((err) =>
    logger.warn({ err, campaignId: campaign.id }, 'indexing new campaign failed'),
  );

  logger.info(
    { campaignId: campaign.id, total: emails.length, senderId: sender.id, effective },
    'campaign scheduled',
  );

  return {
    campaignId: campaign.id,
    total: emails.length,
    firstAt: times[0] ?? input.startAt,
    lastAt: times[times.length - 1] ?? input.startAt,
    effective,
    queued,
  };
}
