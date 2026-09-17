import { DelayedError, type Job } from 'bullmq';
import type { Redis } from 'ioredis';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { sendEmail } from '../mail/mailer.js';
import { indexEmail } from '../search/email-index.js';
import { notifyRateLimitHit } from '../slack/rate-limit-notifier.js';
import { reserveSendSlot } from '../throughput/slot-reservation.js';
import type { EmailJobData } from './email-queue.js';
import { claimEmail, completeEmail, failEmail, releaseEmail } from './email-transitions.js';

/** A slot this close to "now" is sent immediately rather than re-delayed. */
const SLOT_TOLERANCE_MS = 500;

export type ProcessOutcome = 'sent' | 'skipped';

/**
 * The body of the worker. One invocation = one attempt to send one email.
 *
 *   1. Claim the row (scheduled -> sending). Losing the claim means another worker, a
 *      duplicate delivery, or a row that is no longer scheduled: return quietly.
 *   2. Reserve a send slot for the sender unless this job already holds one. A slot in the
 *      future means "not yet": put the row back, remember the slot on the job, and ask
 *      BullMQ to wake us at that time.
 *   3. Send. Success completes the row; a failure releases it for BullMQ's retry, or marks
 *      it failed if this was the last attempt.
 */
export function createEmailProcessor(redis: Redis) {
  return async function processEmailJob(
    job: Job<EmailJobData>,
    token?: string,
  ): Promise<ProcessOutcome> {
    const { emailId } = job.data;
    const log = logger.child({ jobId: job.id, emailId, attempt: job.attemptsMade + 1 });

    const email = await claimEmail(emailId);
    if (!email) {
      log.info('claim lost, nothing to do');
      return 'skipped';
    }

    try {
      if (job.data.reservedSlot === undefined) {
        const reservation = await reserveSendSlot(redis, {
          senderId: email.senderId,
          campaignId: email.campaignId,
          gapMs: env.MIN_DELAY_BETWEEN_EMAILS_MS,
          senderHourlyCap: env.MAX_EMAILS_PER_HOUR_PER_SENDER,
          campaignHourlyCap: email.campaign.hourlyLimit,
        });

        if (reservation.shifted) {
          log.warn(
            { windowStart: reservation.windowStart, movedTo: reservation.slot },
            'hourly limit reached, postponing to next window',
          );
          void notifyRateLimitHit(redis, {
            userId: email.userId,
            senderId: email.senderId,
            senderEmail: email.sender.email,
            windowStart: reservation.requestedWindowStart,
            movedTo: reservation.slot,
            senderCap: env.MAX_EMAILS_PER_HOUR_PER_SENDER,
          });
        }

        if (reservation.slot - Date.now() > SLOT_TOLERANCE_MS) {
          const slotDate = new Date(reservation.slot);
          await releaseEmail(emailId, { scheduledAt: slotDate });
          await job.updateData({ ...job.data, reservedSlot: reservation.slot });
          await job.moveToDelayed(reservation.slot, token);
          log.info({ until: slotDate.toISOString() }, 'postponed to reserved slot');
          throw new DelayedError();
        }
      }

      const result = await sendEmail(email.sender, {
        to: email.toEmail,
        toName: email.toName,
        subject: email.campaign.subject,
        html: email.campaign.bodyHtml,
      });

      await completeEmail(emailId, result);
      void indexEmail(emailId);
      log.info({ messageId: result.messageId }, 'sent');
      return 'sent';
    } catch (err) {
      // BullMQ needs to see this error itself: it is how the worker knows the job was
      // moved to the delayed set on purpose and must not be marked completed or failed.
      if (err instanceof DelayedError) {
        throw err;
      }

      const message = err instanceof Error ? err.message : String(err);
      const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);

      if (isLastAttempt) {
        await failEmail(emailId, message);
        log.error({ err }, 'send failed permanently');
      } else {
        await releaseEmail(emailId, { lastError: message, countAttempt: true });
        log.warn({ err }, 'send failed, will retry');
      }
      void indexEmail(emailId);
      throw err;
    }
  };
}
