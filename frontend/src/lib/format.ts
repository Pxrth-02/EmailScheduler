import { format, isToday, isTomorrow, isYesterday } from 'date-fns';

/** Badge time on a Scheduled row: `Tue 9:15:12 AM`, as in the design. */
export function formatScheduleBadge(iso: string): string {
  return format(new Date(iso), 'EEE h:mm:ss a');
}

/** Header date on the detail view: `Nov 3, 10:23 AM`. */
export function formatDetailDate(iso: string): string {
  return format(new Date(iso), 'MMM d, h:mm a');
}

/** Human label for the chosen send time, shown next to the clock in compose. */
export function formatSendTime(date: Date): string {
  const time = format(date, 'h:mm a');
  if (isToday(date)) return `Today, ${time}`;
  if (isTomorrow(date)) return `Tomorrow, ${time}`;
  if (isYesterday(date)) return `Yesterday, ${time}`;
  return format(date, 'EEE, MMM d, h:mm a');
}

/** Value for an `<input type="datetime-local">`, in the viewer's local time. */
export function toDateTimeLocal(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : String(n);
}
