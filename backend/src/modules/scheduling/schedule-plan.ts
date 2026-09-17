export const HOUR_MS = 60 * 60 * 1000;

export interface PlanInput {
  /** When the first email may go out. */
  startAt: Date;
  /** How many recipients to place. */
  count: number;
  /** Minimum gap between two consecutive emails of this campaign. */
  delayMs: number;
  /** Maximum emails in any one wall-clock hour window. */
  hourlyLimit: number;
}

/** Start of the wall-clock hour (UTC) that contains `timestamp`. */
export function hourWindowStart(timestamp: number): number {
  return timestamp - (timestamp % HOUR_MS);
}

/**
 * Lays recipients out on a timeline before anything is enqueued.
 *
 * Recipient i is placed at startAt + i * delayMs, except that once an hour window already
 * holds `hourlyLimit` emails the sequence jumps to the start of the next hour and carries on.
 * The output is monotonic, so order is preserved, and it is deterministic, so the dashboard
 * can show every recipient's time the moment the campaign is created.
 *
 * This is the "plan" half of the design. The worker still reserves a slot per send, which
 * is what protects the sender limit across overlapping campaigns and multiple workers.
 */
export function planSchedule({ startAt, count, delayMs, hourlyLimit }: PlanInput): Date[] {
  if (count <= 0) return [];
  if (hourlyLimit < 1) throw new RangeError('hourlyLimit must be at least 1');
  if (delayMs < 0) throw new RangeError('delayMs cannot be negative');

  const times: Date[] = [];
  let next = startAt.getTime();
  let window = hourWindowStart(next);
  let inWindow = 0;

  for (let i = 0; i < count; i++) {
    if (i > 0) next += delayMs;

    const candidateWindow = hourWindowStart(next);
    if (candidateWindow !== window) {
      window = candidateWindow;
      inWindow = 0;
    }

    if (inWindow >= hourlyLimit) {
      window += HOUR_MS;
      next = window;
      inWindow = 0;
    }

    times.push(new Date(next));
    inWindow++;
  }

  return times;
}
