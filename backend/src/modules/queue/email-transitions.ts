import type { Campaign, Email, Sender } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';

export type ClaimedEmail = Email & { sender: Sender; campaign: Campaign };

/**
 * Status transitions for the worker. Every one is a compare-and-set on the current status,
 * so a transition only happens if the row is where the caller believes it is. The affected
 * row count tells the caller whether it won.
 */

/** scheduled -> sending. Returns the row with what the send needs, or null if someone else owns it. */
export async function claimEmail(id: string): Promise<ClaimedEmail | null> {
  const { count } = await prisma.email.updateMany({
    where: { id, status: 'scheduled' },
    data: { status: 'sending' },
  });
  if (count === 0) return null;

  return prisma.email.findUniqueOrThrow({
    where: { id },
    include: { sender: true, campaign: true },
  });
}

/** sending -> scheduled, used when the send is postponed (rate limit) or will be retried. */
export async function releaseEmail(
  id: string,
  patch: { scheduledAt?: Date; lastError?: string; countAttempt?: boolean } = {},
): Promise<void> {
  await prisma.email.updateMany({
    where: { id, status: 'sending' },
    data: {
      status: 'scheduled',
      ...(patch.scheduledAt ? { scheduledAt: patch.scheduledAt } : {}),
      ...(patch.lastError !== undefined ? { lastError: patch.lastError } : {}),
      ...(patch.countAttempt ? { attempts: { increment: 1 } } : {}),
    },
  });
}

/** sending -> sent. */
export async function completeEmail(
  id: string,
  result: { messageId: string; previewUrl: string | null },
): Promise<void> {
  await prisma.email.updateMany({
    where: { id, status: 'sending' },
    data: {
      status: 'sent',
      sentAt: new Date(),
      messageId: result.messageId,
      previewUrl: result.previewUrl,
      lastError: null,
      attempts: { increment: 1 },
    },
  });
}

/** sending -> failed, after the last attempt. */
export async function failEmail(id: string, error: string): Promise<void> {
  await prisma.email.updateMany({
    where: { id, status: 'sending' },
    data: { status: 'failed', lastError: error, attempts: { increment: 1 } },
  });
}

/** Used by the reconciler for rows a dead worker left behind. */
export async function markInterrupted(id: string): Promise<void> {
  await prisma.email.updateMany({
    where: { id, status: 'sending' },
    data: {
      status: 'failed',
      lastError: 'Interrupted: the worker stopped while this email was being sent',
    },
  });
}
