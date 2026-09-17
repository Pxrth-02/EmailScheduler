import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';
import { htmlToText } from '../mail/mailer.js';

export type EmailView = 'scheduled' | 'sent';

/** The two dashboard tabs map onto pairs of statuses. */
export const VIEW_STATUSES = {
  scheduled: ['scheduled', 'sending'],
  sent: ['sent', 'failed'],
} as const satisfies Record<EmailView, readonly Prisma.EmailWhereInput['status'][]>;

export interface ListEmailsParams {
  userId: string;
  view: EmailView;
  page: number;
  pageSize: number;
  senderId?: string;
  status?: 'scheduled' | 'sending' | 'sent' | 'failed';
}

const listSelect = {
  id: true,
  toEmail: true,
  toName: true,
  status: true,
  scheduledAt: true,
  sentAt: true,
  previewUrl: true,
  lastError: true,
  campaignId: true,
  campaign: { select: { subject: true, bodyHtml: true } },
  sender: { select: { id: true, email: true, name: true } },
} satisfies Prisma.EmailSelect;

type ListRow = Prisma.EmailGetPayload<{ select: typeof listSelect }>;

export interface EmailListItem {
  id: string;
  toEmail: string;
  toName: string | null;
  status: ListRow['status'];
  scheduledAt: string;
  sentAt: string | null;
  previewUrl: string | null;
  lastError: string | null;
  campaignId: string;
  subject: string;
  preview: string;
  sender: { id: string; email: string; name: string };
}

export interface EmailListPage {
  items: EmailListItem[];
  page: number;
  pageSize: number;
  total: number;
}

const PREVIEW_LENGTH = 160;

function toListItem(row: ListRow): EmailListItem {
  return {
    id: row.id,
    toEmail: row.toEmail,
    toName: row.toName,
    status: row.status,
    scheduledAt: row.scheduledAt.toISOString(),
    sentAt: row.sentAt?.toISOString() ?? null,
    previewUrl: row.previewUrl,
    lastError: row.lastError,
    campaignId: row.campaignId,
    subject: row.campaign.subject,
    preview: htmlToText(row.campaign.bodyHtml).replace(/\s+/g, ' ').slice(0, PREVIEW_LENGTH),
    sender: row.sender,
  };
}

function whereFor(params: ListEmailsParams): Prisma.EmailWhereInput {
  const statuses = params.status ? [params.status] : [...VIEW_STATUSES[params.view]];
  return {
    userId: params.userId,
    status: { in: statuses },
    ...(params.senderId ? { senderId: params.senderId } : {}),
  };
}

export async function listEmails(params: ListEmailsParams): Promise<EmailListPage> {
  const where = whereFor(params);
  const orderBy: Prisma.EmailOrderByWithRelationInput[] =
    params.view === 'scheduled'
      ? [{ scheduledAt: 'asc' }, { id: 'asc' }]
      : [{ updatedAt: 'desc' }, { id: 'desc' }];

  const [rows, total] = await Promise.all([
    prisma.email.findMany({
      where,
      orderBy,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      select: listSelect,
    }),
    prisma.email.count({ where }),
  ]);

  return { items: rows.map(toListItem), page: params.page, pageSize: params.pageSize, total };
}

/** Rows for a known, already-ranked list of ids (the search path). */
export async function listEmailsByIds(userId: string, ids: string[]): Promise<EmailListItem[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.email.findMany({
    where: { userId, id: { in: ids } },
    select: listSelect,
  });
  const byId = new Map(rows.map((row) => [row.id, toListItem(row)]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

/** Plain SQL search used when Elasticsearch is not configured or not reachable. */
export async function searchEmailsInDatabase(
  params: ListEmailsParams & { q: string },
): Promise<EmailListPage> {
  const where: Prisma.EmailWhereInput = {
    ...whereFor(params),
    OR: [
      { toEmail: { contains: params.q } },
      { toName: { contains: params.q } },
      { campaign: { subject: { contains: params.q } } },
    ],
  };

  const [rows, total] = await Promise.all([
    prisma.email.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      select: listSelect,
    }),
    prisma.email.count({ where }),
  ]);

  return { items: rows.map(toListItem), page: params.page, pageSize: params.pageSize, total };
}

export interface EmailCounts {
  scheduled: number;
  sent: number;
}

export async function countEmails(userId: string): Promise<EmailCounts> {
  const groups = await prisma.email.groupBy({
    by: ['status'],
    where: { userId },
    _count: { _all: true },
  });
  const count = (statuses: readonly string[]) =>
    groups.filter((g) => statuses.includes(g.status)).reduce((sum, g) => sum + g._count._all, 0);
  return { scheduled: count(VIEW_STATUSES.scheduled), sent: count(VIEW_STATUSES.sent) };
}

export async function getEmailDetail(userId: string, id: string) {
  const row = await prisma.email.findFirst({
    where: { id, userId },
    include: {
      sender: { select: { id: true, email: true, name: true } },
      campaign: {
        select: {
          id: true,
          subject: true,
          bodyHtml: true,
          startAt: true,
          delayMs: true,
          hourlyLimit: true,
          totalCount: true,
        },
      },
    },
  });
  if (!row) return null;

  return {
    id: row.id,
    toEmail: row.toEmail,
    toName: row.toName,
    status: row.status,
    scheduledAt: row.scheduledAt.toISOString(),
    sentAt: row.sentAt?.toISOString() ?? null,
    attempts: row.attempts,
    messageId: row.messageId,
    previewUrl: row.previewUrl,
    lastError: row.lastError,
    sender: row.sender,
    subject: row.campaign.subject,
    bodyHtml: row.campaign.bodyHtml,
    campaign: {
      id: row.campaign.id,
      startAt: row.campaign.startAt.toISOString(),
      delayMs: row.campaign.delayMs,
      hourlyLimit: row.campaign.hourlyLimit,
      totalCount: row.campaign.totalCount,
    },
  };
}

export type EmailDetail = NonNullable<Awaited<ReturnType<typeof getEmailDetail>>>;
