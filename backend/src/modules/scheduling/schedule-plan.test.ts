import { describe, expect, it } from 'vitest';
import { HOUR_MS, hourWindowStart, planSchedule } from './schedule-plan.js';

const T0 = Date.UTC(2026, 8, 17, 10, 0, 0); // 10:00:00 UTC, on the hour

describe('planSchedule', () => {
  it('spaces recipients by the delay', () => {
    const times = planSchedule({
      startAt: new Date(T0),
      count: 4,
      delayMs: 2_000,
      hourlyLimit: 100,
    });
    expect(times.map((t) => t.getTime() - T0)).toEqual([0, 2_000, 4_000, 6_000]);
  });

  it('never exceeds the hourly limit inside one window', () => {
    const times = planSchedule({ startAt: new Date(T0), count: 7, delayMs: 1_000, hourlyLimit: 3 });
    const byWindow = new Map<number, number>();
    for (const t of times) {
      const w = hourWindowStart(t.getTime());
      byWindow.set(w, (byWindow.get(w) ?? 0) + 1);
    }
    expect([...byWindow.values()]).toEqual([3, 3, 1]);
  });

  it('jumps to the start of the next hour when a window fills', () => {
    const times = planSchedule({ startAt: new Date(T0), count: 4, delayMs: 1_000, hourlyLimit: 3 });
    expect(times[3]!.getTime()).toBe(T0 + HOUR_MS);
  });

  it('keeps order: every time is greater than or equal to the previous one', () => {
    const times = planSchedule({
      startAt: new Date(T0 + 59 * 60 * 1000),
      count: 50,
      delayMs: 5_000,
      hourlyLimit: 10,
    });
    for (let i = 1; i < times.length; i++) {
      expect(times[i]!.getTime()).toBeGreaterThanOrEqual(times[i - 1]!.getTime());
    }
  });

  it('resets the per-window count when the delay itself crosses an hour boundary', () => {
    const start = T0 + 59 * 60 * 1000 + 59_000; // 10:59:59
    const times = planSchedule({
      startAt: new Date(start),
      count: 3,
      delayMs: 1_000,
      hourlyLimit: 1,
    });
    // 10:59:59 fills the 10:00 window; 11:00:00 is a fresh window; the third is pushed to 12:00.
    expect(times.map((t) => t.toISOString().slice(11, 19))).toEqual([
      '10:59:59',
      '11:00:00',
      '12:00:00',
    ]);
  });

  it('lays out 1000 recipients at 2s / 200 per hour across five hours', () => {
    const times = planSchedule({
      startAt: new Date(T0),
      count: 1_000,
      delayMs: 2_000,
      hourlyLimit: 200,
    });
    expect(times).toHaveLength(1_000);
    expect(times[999]!.getTime()).toBe(T0 + 4 * HOUR_MS + 199 * 2_000);
  });

  it('handles a zero delay and an empty list', () => {
    expect(planSchedule({ startAt: new Date(T0), count: 0, delayMs: 0, hourlyLimit: 5 })).toEqual(
      [],
    );
    const burst = planSchedule({ startAt: new Date(T0), count: 3, delayMs: 0, hourlyLimit: 5 });
    expect(new Set(burst.map((t) => t.getTime())).size).toBe(1);
  });

  it('rejects impossible inputs', () => {
    expect(() =>
      planSchedule({ startAt: new Date(T0), count: 1, delayMs: 0, hourlyLimit: 0 }),
    ).toThrow(RangeError);
    expect(() =>
      planSchedule({ startAt: new Date(T0), count: 1, delayMs: -1, hourlyLimit: 1 }),
    ).toThrow(RangeError);
  });
});

describe('hourWindowStart', () => {
  it('floors to the wall-clock hour', () => {
    expect(hourWindowStart(T0 + 37 * 60 * 1000 + 12_345)).toBe(T0);
    expect(hourWindowStart(T0)).toBe(T0);
  });
});
