import { logger } from '../../lib/logger.js';
import {
  VIEW_STATUSES,
  listEmailsByIds,
  searchEmailsInDatabase,
  type EmailListPage,
  type ListEmailsParams,
} from '../emails/emails.service.js';
import { EMAIL_INDEX, esClient } from './es-client.js';
import { ensureEmailIndex } from './email-index.js';

export type SearchParams = ListEmailsParams & { q: string };

/**
 * Full-text search over subject, body, recipient and sender, scoped to the current user
 * and the active tab. Elasticsearch ranks and returns ids; MySQL supplies the rows so the
 * list looks identical to the unsearched one. If the cluster is missing or down, the same
 * query runs as SQL `LIKE`s, so the search bar never breaks, it only gets less clever.
 */
export async function searchEmails(params: SearchParams): Promise<EmailListPage> {
  if (!esClient || !(await ensureEmailIndex())) {
    return searchEmailsInDatabase(params);
  }

  try {
    const statuses = params.status ? [params.status] : [...VIEW_STATUSES[params.view]];
    const filter: object[] = [{ term: { userId: params.userId } }, { terms: { status: statuses } }];
    if (params.senderId) filter.push({ term: { senderId: params.senderId } });

    const response = await esClient.search<Record<string, unknown>>({
      index: EMAIL_INDEX,
      from: (params.page - 1) * params.pageSize,
      size: params.pageSize,
      _source: false,
      track_total_hits: true,
      query: {
        bool: {
          filter,
          must: {
            multi_match: {
              query: params.q,
              fields: ['subject^3', 'toName^2', 'toEmail.text^2', 'body', 'senderEmail'],
              type: 'best_fields',
              fuzziness: 'AUTO',
              operator: 'and',
            },
          },
        },
      },
      sort: ['_score', { updatedAt: 'desc' }],
    });

    const ids = response.hits.hits.map((hit) => String(hit._id));
    const total =
      typeof response.hits.total === 'number'
        ? response.hits.total
        : (response.hits.total?.value ?? ids.length);

    return {
      items: await listEmailsByIds(params.userId, ids),
      page: params.page,
      pageSize: params.pageSize,
      total,
    };
  } catch (err) {
    logger.warn({ err }, 'elasticsearch query failed, falling back to mysql');
    return searchEmailsInDatabase(params);
  }
}
