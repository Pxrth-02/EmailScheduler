/**
 * Rebuilds the Elasticsearch index from MySQL. Use it after enabling search on an existing
 * database or after the index was deleted.
 *
 *   npm run reindex
 */
import 'dotenv/config';
import { searchEnabled } from '../src/config/env.js';
import { prisma } from '../src/lib/prisma.js';
import { redis } from '../src/lib/redis.js';
import { ensureEmailIndex, indexEmailsByIds } from '../src/modules/search/email-index.js';

const BATCH = 500;

async function main(): Promise<void> {
  if (!searchEnabled) throw new Error('ELASTICSEARCH_URL is not set');
  if (!(await ensureEmailIndex())) throw new Error('Elasticsearch is not reachable');

  let cursor: string | undefined;
  let total = 0;

  for (;;) {
    const rows = await prisma.email.findMany({
      select: { id: true },
      orderBy: { id: 'asc' },
      take: BATCH,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (rows.length === 0) break;

    await indexEmailsByIds(rows.map((r) => r.id));
    total += rows.length;
    cursor = rows[rows.length - 1]?.id;
    console.log(`indexed ${total}`);
  }

  console.log(`done: ${total} emails indexed`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.allSettled([prisma.$disconnect(), redis.quit()]);
  });
