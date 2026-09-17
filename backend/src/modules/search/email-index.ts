import type { estypes } from '@elastic/elasticsearch';
import { logger } from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';
import { htmlToText } from '../mail/mailer.js';
import { EMAIL_INDEX, esClient } from './es-client.js';

/** The searchable projection of an email. Display data still comes from MySQL by id. */
export interface EmailDocument {
  userId: string;
  campaignId: string;
  senderId: string;
  senderEmail: string;
  toEmail: string;
  toName: string | null;
  subject: string;
  body: string;
  status: string;
  scheduledAt: string;
  sentAt: string | null;
  updatedAt: string;
}

const mappings: estypes.MappingTypeMapping = {
  dynamic: 'strict',
  properties: {
    userId: { type: 'keyword' },
    campaignId: { type: 'keyword' },
    senderId: { type: 'keyword' },
    senderEmail: { type: 'keyword' },
    toEmail: {
      type: 'keyword',
      // Exact match on the keyword, plus a tokenised copy so "sarah" finds sarah.wilson@x.com.
      fields: { text: { type: 'text', analyzer: 'email_text' } },
    },
    toName: { type: 'text' },
    subject: { type: 'text' },
    body: { type: 'text' },
    status: { type: 'keyword' },
    scheduledAt: { type: 'date' },
    sentAt: { type: 'date' },
    updatedAt: { type: 'date' },
  },
};

const settings: estypes.IndicesIndexSettings = {
  number_of_shards: 1,
  number_of_replicas: 0,
  analysis: {
    analyzer: {
      // Splits addresses on @ . _ - + so every part of a local-part is searchable.
      email_text: { type: 'custom', tokenizer: 'letter', filter: ['lowercase'] },
    },
  },
};

let ensured = false;

/** Creates the index with an explicit mapping on first use. Safe to call from api and worker. */
export async function ensureEmailIndex(): Promise<boolean> {
  if (!esClient) return false;
  if (ensured) return true;

  try {
    const exists = await esClient.indices.exists({ index: EMAIL_INDEX });
    if (!exists) {
      await esClient.indices.create({ index: EMAIL_INDEX, mappings, settings });
      logger.info({ index: EMAIL_INDEX }, 'created elasticsearch index');
    }
    ensured = true;
    return true;
  } catch (err) {
    logger.warn({ err }, 'elasticsearch unavailable, search will fall back to mysql');
    return false;
  }
}

const documentSelect = {
  id: true,
  userId: true,
  campaignId: true,
  senderId: true,
  toEmail: true,
  toName: true,
  status: true,
  scheduledAt: true,
  sentAt: true,
  updatedAt: true,
  campaign: { select: { subject: true, bodyHtml: true } },
  sender: { select: { email: true } },
} as const;

/** (Re)indexes the given emails. Missing ids are skipped; a dead cluster logs and returns. */
export async function indexEmailsByIds(ids: string[]): Promise<void> {
  if (!esClient || ids.length === 0) return;
  if (!(await ensureEmailIndex())) return;

  const rows = await prisma.email.findMany({
    where: { id: { in: ids } },
    select: documentSelect,
  });
  if (rows.length === 0) return;

  const operations = rows.flatMap((row) => {
    const doc: EmailDocument = {
      userId: row.userId,
      campaignId: row.campaignId,
      senderId: row.senderId,
      senderEmail: row.sender.email,
      toEmail: row.toEmail,
      toName: row.toName,
      subject: row.campaign.subject,
      body: htmlToText(row.campaign.bodyHtml),
      status: row.status,
      scheduledAt: row.scheduledAt.toISOString(),
      sentAt: row.sentAt?.toISOString() ?? null,
      updatedAt: row.updatedAt.toISOString(),
    };
    return [{ index: { _index: EMAIL_INDEX, _id: row.id } }, doc];
  });

  const response = await esClient.bulk({ operations, refresh: false });
  if (response.errors) {
    const failed = response.items.filter((item) => item.index?.error).length;
    logger.warn({ failed, total: rows.length }, 'some documents failed to index');
  }
}

/** Convenience for the worker: one row after a status change. */
export function indexEmail(id: string): Promise<void> {
  return indexEmailsByIds([id]).catch((err) => {
    logger.warn({ err, emailId: id }, 'indexing email failed');
  });
}
