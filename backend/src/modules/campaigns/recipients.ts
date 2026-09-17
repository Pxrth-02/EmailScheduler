export interface Recipient {
  email: string;
  name: string | null;
}

/** Case-insensitive de-duplication that keeps the first name seen for an address. */
export function dedupeRecipients(recipients: Recipient[]): Recipient[] {
  const seen = new Map<string, Recipient>();
  for (const recipient of recipients) {
    const email = recipient.email.trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.set(email, { email, name: recipient.name?.trim() || null });
  }
  return [...seen.values()];
}
