import type { Redis } from 'ioredis';
import { logger } from '../../lib/logger.js';
import { HOUR_MS } from '../scheduling/schedule-plan.js';
import { getSlackConnection, postToWebhook } from './slack.service.js';

export interface RateLimitHit {
  userId: string;
  senderId: string;
  senderEmail: string;
  /** Start of the window that was full. */
  windowStart: number;
  /** Where the overflow was moved to. */
  movedTo: number;
  senderCap: number;
}

/**
 * Tells the user's Slack channel that a sender ran out of hourly capacity.
 *
 * Fired by the first worker that sees the window full; `SET NX` on a per-sender-per-window
 * key makes sure one full hour produces one message even with many workers and many delayed
 * emails. No Slack connection means no call and no error. Connecting later just works,
 * because the webhook is looked up on every hit rather than cached at boot.
 */
export async function notifyRateLimitHit(redis: Redis, hit: RateLimitHit): Promise<void> {
  const dedupeKey = `slack:notified:${hit.senderId}:${hit.windowStart}`;
  const first = await redis.set(dedupeKey, '1', 'PX', 2 * HOUR_MS, 'NX');
  if (first !== 'OK') return;

  const connection = await getSlackConnection(hit.userId);
  if (!connection) {
    logger.debug({ senderId: hit.senderId }, 'rate limit hit, no slack connection');
    return;
  }

  const windowLabel = `${formatHour(hit.windowStart)}–${formatHour(hit.windowStart + HOUR_MS)} UTC`;
  const text =
    `:hourglass_flowing_sand: *${hit.senderEmail}* hit its hourly limit of ${hit.senderCap} emails ` +
    `for ${windowLabel}. Remaining emails are being rescheduled from ${formatHour(hit.movedTo)} UTC ` +
    `onward; nothing was dropped.`;

  try {
    await postToWebhook(connection.webhookUrl, text);
    logger.info(
      { senderId: hit.senderId, team: connection.teamName },
      'slack rate-limit notice sent',
    );
  } catch (err) {
    logger.warn({ err, senderId: hit.senderId }, 'slack notification failed');
  }
}

function formatHour(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(11, 16);
}
