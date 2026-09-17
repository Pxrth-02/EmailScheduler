import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import type { Sender, User } from '../../generated/prisma/client.js';
import { createEtherealAccount, pinnedEtherealAccount, type SmtpAccount } from './ethereal.js';

export interface PublicSender {
  id: string;
  email: string;
  name: string;
}

export function toPublicSender(sender: Sender): PublicSender {
  return { id: sender.id, email: sender.email, name: sender.name };
}

export async function listSenders(userId: string): Promise<Sender[]> {
  return prisma.sender.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
}

/** Creating Ethereal accounts can take 15 s or more; one run per user at a time. */
const LOCK_TTL_SECONDS = 90;
const WAIT_POLL_MS = 500;
const WAIT_MAX_MS = 60_000;

/**
 * Tops a user up to SENDERS_PER_USER sender identities. Idempotent: called after every
 * login and lazily from the senders endpoint, it only creates what is missing.
 *
 * A Redis lock makes concurrent calls (the post-login background run and the dashboard's
 * first request racing each other) provision once; the loser waits for the winner's result
 * instead of creating a second set of accounts.
 */
export async function ensureSendersForUser(user: User): Promise<Sender[]> {
  const existing = await listSenders(user.id);
  if (existing.length >= env.SENDERS_PER_USER) return existing;

  const lockKey = `senders:provisioning:${user.id}`;
  const acquired = await redis.set(lockKey, '1', 'EX', LOCK_TTL_SECONDS, 'NX');
  if (acquired !== 'OK') {
    return waitForProvisioning(user.id, lockKey);
  }

  try {
    const missing = env.SENDERS_PER_USER - existing.length;
    const accounts: SmtpAccount[] = [];

    const pinned = pinnedEtherealAccount();
    if (pinned && !existing.some((s) => s.smtpUser === pinned.user)) {
      accounts.push(pinned);
    }
    while (accounts.length < missing) {
      accounts.push(await createEtherealAccount());
    }

    for (const account of accounts) {
      await prisma.sender.upsert({
        where: { userId_email: { userId: user.id, email: account.email } },
        update: {},
        create: {
          userId: user.id,
          email: account.email,
          name: user.name,
          smtpHost: account.host,
          smtpPort: account.port,
          smtpUser: account.user,
          smtpPass: account.pass,
        },
      });
    }

    logger.info({ userId: user.id, created: accounts.length }, 'provisioned sender accounts');
    return listSenders(user.id);
  } finally {
    await redis.del(lockKey);
  }
}

/** Polls until the run holding the lock has finished (or given up), then returns what exists. */
async function waitForProvisioning(userId: string, lockKey: string): Promise<Sender[]> {
  const deadline = Date.now() + WAIT_MAX_MS;
  while (Date.now() < deadline) {
    if (!(await redis.exists(lockKey))) break;
    await new Promise((resolve) => setTimeout(resolve, WAIT_POLL_MS));
  }
  return listSenders(userId);
}
