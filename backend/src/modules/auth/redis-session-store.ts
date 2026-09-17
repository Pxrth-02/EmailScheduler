import session, { type SessionData } from 'express-session';
import type { Redis } from 'ioredis';

type Callback<T = void> = (err?: unknown, value?: T) => void;

const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * express-session store on top of ioredis. Four commands: GET, SET EX, DEL, EXPIRE.
 *
 * Written here rather than pulled in because connect-redis targets the node-redis client,
 * and running two Redis client libraries for one feature is not worth avoiding fifty lines.
 * Session TTL follows the cookie's expiry so Redis forgets a session when the browser does.
 */
export class RedisSessionStore extends session.Store {
  private readonly client: Redis;
  private readonly prefix: string;

  constructor(client: Redis, prefix = 'sess:') {
    super();
    this.client = client;
    this.prefix = prefix;
  }

  private key(sid: string): string {
    return `${this.prefix}${sid}`;
  }

  private ttlSeconds(data: SessionData): number {
    const expires = data.cookie?.expires;
    if (expires) {
      const remaining = Math.ceil((new Date(expires).getTime() - Date.now()) / 1000);
      return Math.max(remaining, 1);
    }
    return DEFAULT_TTL_SECONDS;
  }

  override get(sid: string, cb: Callback<SessionData | null>): void {
    this.client
      .get(this.key(sid))
      .then((raw) => cb(undefined, raw ? (JSON.parse(raw) as SessionData) : null))
      .catch((err: unknown) => cb(err));
  }

  override set(sid: string, data: SessionData, cb?: Callback): void {
    this.client
      .set(this.key(sid), JSON.stringify(data), 'EX', this.ttlSeconds(data))
      .then(() => cb?.())
      .catch((err: unknown) => cb?.(err));
  }

  override destroy(sid: string, cb?: Callback): void {
    this.client
      .del(this.key(sid))
      .then(() => cb?.())
      .catch((err: unknown) => cb?.(err));
  }

  override touch(sid: string, data: SessionData, cb?: Callback): void {
    this.client
      .expire(this.key(sid), this.ttlSeconds(data))
      .then(() => cb?.())
      .catch((err: unknown) => cb?.(err));
  }
}
