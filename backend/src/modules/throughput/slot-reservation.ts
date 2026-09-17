import type { Redis, Result } from 'ioredis';
import { HOUR_MS } from '../scheduling/schedule-plan.js';

/**
 * Atomically reserves the next send slot for a sender.
 *
 * The slot is the later of "now" and the sender's next free time (so consecutive sends are
 * at least `gap` apart across every campaign and worker). If the hour window holding that
 * slot is already full for the sender or for the campaign, the slot moves to the start of
 * the next window with capacity, and that window's counters are incremented instead.
 * Because reservations are taken in arrival order and each one advances the sender's next
 * free time, the resulting order matches the order in which jobs became due.
 *
 * Everything happens inside one Lua script, so two workers can never both read a counter
 * of 199, both decide there is room, and both send.
 *
 * KEYS[1] next-slot key, KEYS[2] sender counter prefix, KEYS[3] campaign counter prefix.
 * ARGV: now, gap, senderCap, campaignCap, maxWindows.
 * Returns [slot, windowStart, originalWindowStart, senderCount, campaignCount].
 */
const RESERVE_SLOT_LUA = `
local now = tonumber(ARGV[1])
local gap = tonumber(ARGV[2])
local senderCap = tonumber(ARGV[3])
local campaignCap = tonumber(ARGV[4])
local maxWindows = tonumber(ARGV[5])
local HOUR = 3600000

local slot = tonumber(redis.call('GET', KEYS[1]) or '0')
if slot < now then slot = now end

local window = slot - (slot % HOUR)
local originalWindow = window
local senderKey = KEYS[2] .. window
local campaignKey = KEYS[3] .. window
local senderCount = tonumber(redis.call('GET', senderKey) or '0')
local campaignCount = tonumber(redis.call('GET', campaignKey) or '0')
local hops = 0

while (senderCount >= senderCap or campaignCount >= campaignCap) and hops < maxWindows do
  window = window + HOUR
  slot = window
  senderKey = KEYS[2] .. window
  campaignKey = KEYS[3] .. window
  senderCount = tonumber(redis.call('GET', senderKey) or '0')
  campaignCount = tonumber(redis.call('GET', campaignKey) or '0')
  hops = hops + 1
end

local ttl = (window + 2 * HOUR) - now
redis.call('INCR', senderKey)
redis.call('PEXPIRE', senderKey, ttl)
redis.call('INCR', campaignKey)
redis.call('PEXPIRE', campaignKey, ttl)

local nextSlot = slot + gap
redis.call('SET', KEYS[1], nextSlot, 'PX', (nextSlot - now) + HOUR)

return { slot, window, originalWindow, senderCount + 1, campaignCount + 1 }
`;

declare module 'ioredis' {
  interface RedisCommander<Context> {
    reserveSendSlot(
      nextSlotKey: string,
      senderCounterPrefix: string,
      campaignCounterPrefix: string,
      now: number,
      gapMs: number,
      senderCap: number,
      campaignCap: number,
      maxWindows: number,
    ): Result<[number, number, number, number, number], Context>;
  }
}

export interface ReservationInput {
  senderId: string;
  campaignId: string;
  gapMs: number;
  senderHourlyCap: number;
  campaignHourlyCap: number;
  now?: number;
}

export interface Reservation {
  /** Epoch ms at which this email may be sent. */
  slot: number;
  /** Start of the hour window the send was counted in. */
  windowStart: number;
  /** The window the send would have landed in had there been capacity. */
  requestedWindowStart: number;
  /** True when the requested window was full and the slot moved to a later hour. */
  shifted: boolean;
  senderCount: number;
  campaignCount: number;
}

/** Look at most one week ahead before giving up on finding a free window. */
const MAX_WINDOWS = 24 * 7;

export const reservationKeys = {
  nextSlot: (senderId: string) => `rl:next:${senderId}`,
  senderCounter: (senderId: string) => `rl:sender:${senderId}:`,
  campaignCounter: (campaignId: string) => `rl:campaign:${campaignId}:`,
};

export function registerReservationCommand(redis: Redis): void {
  redis.defineCommand('reserveSendSlot', { numberOfKeys: 3, lua: RESERVE_SLOT_LUA });
}

export async function reserveSendSlot(redis: Redis, input: ReservationInput): Promise<Reservation> {
  const now = input.now ?? Date.now();
  const [slot, windowStart, requestedWindowStart, senderCount, campaignCount] =
    await redis.reserveSendSlot(
      reservationKeys.nextSlot(input.senderId),
      reservationKeys.senderCounter(input.senderId),
      reservationKeys.campaignCounter(input.campaignId),
      now,
      input.gapMs,
      input.senderHourlyCap,
      input.campaignHourlyCap,
      MAX_WINDOWS,
    );

  return {
    slot: Number(slot),
    windowStart: Number(windowStart),
    requestedWindowStart: Number(requestedWindowStart),
    shifted: Number(windowStart) !== Number(requestedWindowStart),
    senderCount: Number(senderCount),
    campaignCount: Number(campaignCount),
  };
}

/** Current usage of a sender's hour window, for diagnostics and tests. */
export async function senderWindowCount(
  redis: Redis,
  senderId: string,
  windowStart: number,
): Promise<number> {
  const value = await redis.get(`${reservationKeys.senderCounter(senderId)}${windowStart}`);
  return value ? Number(value) : 0;
}

export { HOUR_MS };
