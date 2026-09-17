import { Redis } from 'ioredis';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { HOUR_MS } from '../scheduling/schedule-plan.js';
import {
  registerReservationCommand,
  reservationKeys,
  reserveSendSlot,
  senderWindowCount,
} from './slot-reservation.js';

/**
 * These tests talk to a real Redis (REDIS_URL, default localhost:6379) because the whole
 * point of the Lua script is atomicity, which a mock cannot demonstrate. They are skipped
 * when no Redis is reachable so `npm test` still passes on a bare machine.
 */
const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
let redis: Redis;
let available = false;

const T0 = Date.UTC(2026, 8, 17, 10, 0, 0);
const sender = 'test-sender';
const campaign = 'test-campaign';

async function flush() {
  const keys = await redis.keys('rl:*test-*');
  if (keys.length) await redis.del(...keys);
}

beforeAll(async () => {
  redis = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1, connectTimeout: 1_000 });
  try {
    await redis.connect();
    await redis.ping();
    registerReservationCommand(redis);
    available = true;
  } catch {
    available = false;
  }
});

afterAll(async () => {
  if (available) await flush();
  redis.disconnect();
});

beforeEach(async () => {
  if (available) await flush();
});

const reserve = (now: number, caps: { sender?: number; campaign?: number } = {}) =>
  reserveSendSlot(redis, {
    senderId: sender,
    campaignId: campaign,
    gapMs: 2_000,
    senderHourlyCap: caps.sender ?? 200,
    campaignHourlyCap: caps.campaign ?? 200,
    now,
  });

describe.runIf(process.env.CI !== 'true')('reserveSendSlot (needs Redis)', () => {
  it('gives the first reservation the current time', async () => {
    if (!available) return;
    const r = await reserve(T0);
    expect(r.slot).toBe(T0);
    expect(r.shifted).toBe(false);
    expect(r.senderCount).toBe(1);
  });

  it('spaces consecutive reservations by the gap, in arrival order', async () => {
    if (!available) return;
    const a = await reserve(T0);
    const b = await reserve(T0);
    const c = await reserve(T0 + 100);
    expect([a.slot, b.slot, c.slot]).toEqual([T0, T0 + 2_000, T0 + 4_000]);
  });

  it('does not push a later arrival back in time', async () => {
    if (!available) return;
    await reserve(T0);
    const late = await reserve(T0 + 10_000);
    expect(late.slot).toBe(T0 + 10_000);
  });

  it('moves to the next hour when the sender cap is reached and counts it there', async () => {
    if (!available) return;
    for (let i = 0; i < 3; i++) await reserve(T0, { sender: 3 });
    const fourth = await reserve(T0, { sender: 3 });
    expect(fourth.shifted).toBe(true);
    expect(fourth.requestedWindowStart).toBe(T0);
    expect(fourth.windowStart).toBe(T0 + HOUR_MS);
    expect(fourth.slot).toBe(T0 + HOUR_MS);
    expect(await senderWindowCount(redis, sender, T0)).toBe(3);
    expect(await senderWindowCount(redis, sender, T0 + HOUR_MS)).toBe(1);
  });

  it('respects the campaign cap independently of the sender cap', async () => {
    if (!available) return;
    await reserve(T0, { sender: 100, campaign: 1 });
    const second = await reserve(T0, { sender: 100, campaign: 1 });
    expect(second.shifted).toBe(true);
    expect(second.windowStart).toBe(T0 + HOUR_MS);
  });

  it('keeps shifted reservations ordered inside the next window', async () => {
    if (!available) return;
    for (let i = 0; i < 2; i++) await reserve(T0, { sender: 2 });
    const x = await reserve(T0, { sender: 2 });
    const y = await reserve(T0, { sender: 2 });
    expect(x.slot).toBe(T0 + HOUR_MS);
    expect(y.slot).toBe(T0 + HOUR_MS + 2_000);
  });

  it('skips several full windows if it has to', async () => {
    if (!available) return;
    await redis.set(`${reservationKeys.senderCounter(sender)}${T0}`, '5');
    await redis.set(`${reservationKeys.senderCounter(sender)}${T0 + HOUR_MS}`, '5');
    const r = await reserve(T0, { sender: 5 });
    expect(r.windowStart).toBe(T0 + 2 * HOUR_MS);
  });

  it('is atomic under concurrency: N parallel reservations get N distinct slots', async () => {
    if (!available) return;
    const results = await Promise.all(Array.from({ length: 25 }, () => reserve(T0)));
    const slots = results.map((r) => r.slot).sort((a, b) => a - b);
    expect(new Set(slots).size).toBe(25);
    expect(slots[24]).toBe(T0 + 24 * 2_000);
    expect(await senderWindowCount(redis, sender, T0)).toBe(25);
  });
});
