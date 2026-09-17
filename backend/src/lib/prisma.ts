import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { env } from '../config/env.js';
import { PrismaClient } from '../generated/prisma/client.js';

// Prisma 7 talks to MySQL through a driver adapter instead of a bundled engine.
// The adapter accepts a mysql:// URL directly and manages its own connection pool.
const adapter = new PrismaMariaDb(env.DATABASE_URL);

export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
