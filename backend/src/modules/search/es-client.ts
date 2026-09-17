import { Client } from '@elastic/elasticsearch';
import { env, searchEnabled } from '../../config/env.js';

/**
 * Elasticsearch is optional infrastructure: when ELASTICSEARCH_URL is unset the client is
 * null and every caller degrades to MySQL. That keeps local development working without a
 * 1 GB JVM when someone only wants to look at the scheduler.
 */
export const esClient: Client | null = searchEnabled
  ? new Client({
      node: env.ELASTICSEARCH_URL,
      ...(env.ELASTICSEARCH_API_KEY ? { auth: { apiKey: env.ELASTICSEARCH_API_KEY } } : {}),
      requestTimeout: 5_000,
      maxRetries: 1,
    })
  : null;

export const EMAIL_INDEX = env.ELASTICSEARCH_INDEX;
