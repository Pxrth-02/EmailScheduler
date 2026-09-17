import type { Recipient } from '../../types/api.ts';

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

/**
 * Pulls recipients out of free text: a pasted list, a CSV, or a plain .txt.
 *
 * Every email-looking token becomes a recipient. Whatever else is on the same line, minus
 * separators and quotes, is treated as the name ("Sarah Wilson,sarah@x.com" or
 * "Sarah Wilson <sarah@x.com>"). A header row such as "name,email" has no address and is
 * skipped naturally. Duplicates are removed case-insensitively, first name wins.
 */
export function parseRecipients(text: string): Recipient[] {
  const seen = new Map<string, Recipient>();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const emails = line.match(EMAIL_RE) ?? [];
    if (emails.length === 0) continue;

    // Only lines with exactly one address can carry a name we trust.
    const name =
      emails.length === 1
        ? line
            .replace(EMAIL_RE, '')
            .replace(/[<>"',;|\t]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        : '';

    for (const raw of emails) {
      const email = raw.toLowerCase();
      if (!seen.has(email)) seen.set(email, { email, name: name || null });
    }
  }

  return [...seen.values()];
}

export function isValidEmail(value: string): boolean {
  return new RegExp(`^${EMAIL_RE.source}$`, 'i').test(value.trim());
}
