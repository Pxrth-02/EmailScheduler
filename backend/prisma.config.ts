import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// The URL is only needed by migrate/introspect commands. Leaving it optional lets
// `prisma generate` run in a build step (Docker, CI) where no database is configured.
const url = process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  ...(url ? { datasource: { url } } : {}),
});
