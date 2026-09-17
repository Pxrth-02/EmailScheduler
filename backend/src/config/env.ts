import { z } from 'zod';

const optionalString = z
  .string()
  .trim()
  .transform((value) => (value === '' ? undefined : value))
  .optional();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Data stores
  DATABASE_URL: z.url(),
  REDIS_URL: z.url().default('redis://localhost:6379'),

  // URLs
  FRONTEND_URL: z.url().default('http://localhost:5173'),
  API_URL: z.url().default('http://localhost:4000'),

  // Auth
  SESSION_SECRET: z.string().min(32, 'use at least 32 characters, e.g. `openssl rand -hex 32`'),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.url().default('http://localhost:4000/auth/google/callback'),

  // Queue and sending
  EMAIL_QUEUE_NAME: z.string().min(1).default('email-send'),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(100).default(5),
  JOB_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(3),
  JOB_BACKOFF_MS: z.coerce.number().int().min(1000).default(30_000),
  SENDERS_PER_USER: z.coerce.number().int().min(1).max(10).default(3),
  ETHEREAL_USER: optionalString,
  ETHEREAL_PASS: optionalString,

  // Throughput
  MIN_DELAY_BETWEEN_EMAILS_MS: z.coerce.number().int().min(0).default(2_000),
  MAX_EMAILS_PER_HOUR_PER_SENDER: z.coerce.number().int().min(1).default(200),

  // Slack app for rate-limit alerts; until all three are set "Connect Slack" is shown disabled
  SLACK_CLIENT_ID: optionalString,
  SLACK_CLIENT_SECRET: optionalString,
  SLACK_REDIRECT_URI: optionalString,

  // Search (optional: without it search falls back to MySQL)
  ELASTICSEARCH_URL: optionalString,
  ELASTICSEARCH_INDEX: z.string().min(1).default('emails'),
  ELASTICSEARCH_API_KEY: optionalString,

  // Production: serve the built frontend from this directory so app and API share one origin
  STATIC_DIR: optionalString,
});

export type Env = z.infer<typeof schema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}

export const env = loadEnv();

export const slackEnabled = Boolean(
  env.SLACK_CLIENT_ID && env.SLACK_CLIENT_SECRET && env.SLACK_REDIRECT_URI,
);
export const searchEnabled = Boolean(env.ELASTICSEARCH_URL);
