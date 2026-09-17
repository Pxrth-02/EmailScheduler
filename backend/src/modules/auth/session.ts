import session from 'express-session';
import { env } from '../../config/env.js';
import { redis } from '../../lib/redis.js';
import { RedisSessionStore } from './redis-session-store.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Cookie-based sessions stored in Redis.
 *
 * Redis rather than a JWT because we already run Redis, logout can truly invalidate,
 * and the cookie stays a small opaque id. `sameSite: 'lax'` still sends the cookie on
 * the top-level redirect back from Google, which is what the OAuth state check needs.
 */
export const sessionMiddleware = session({
  name: 'sid',
  secret: env.SESSION_SECRET,
  store: new RedisSessionStore(redis),
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    maxAge: SEVEN_DAYS_MS,
  },
});

/** Promise wrappers around the callback-style session API. */
export function regenerateSession(req: Express.Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });
}

export function saveSession(req: Express.Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.save((err) => (err ? reject(err) : resolve()));
  });
}

export function destroySession(req: Express.Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => (err ? reject(err) : resolve()));
  });
}
