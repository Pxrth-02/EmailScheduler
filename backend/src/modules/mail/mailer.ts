import nodemailer, { type Transporter } from 'nodemailer';
import type { Sender } from '../../generated/prisma/client.js';

export interface SendResult {
  messageId: string;
  previewUrl: string | null;
}

export interface OutgoingEmail {
  to: string;
  toName: string | null;
  subject: string;
  html: string;
}

// One pooled transport per sender identity, created on first use. Worker processes are
// long-lived, so keeping the SMTP connection warm beats a TLS handshake per email.
const transports = new Map<string, Transporter>();

function transportFor(sender: Sender): Transporter {
  let transport = transports.get(sender.id);
  if (!transport) {
    transport = nodemailer.createTransport({
      host: sender.smtpHost,
      port: sender.smtpPort,
      secure: sender.smtpPort === 465,
      auth: { user: sender.smtpUser, pass: sender.smtpPass },
      pool: true,
      maxConnections: 2,
      maxMessages: 100,
    });
    transports.set(sender.id, transport);
  }
  return transport;
}

export async function sendEmail(sender: Sender, email: OutgoingEmail): Promise<SendResult> {
  const info = await transportFor(sender).sendMail({
    from: { name: sender.name, address: sender.email },
    to: email.toName ? { name: email.toName, address: email.to } : email.to,
    subject: email.subject,
    html: email.html,
    text: htmlToText(email.html),
  });

  const preview = nodemailer.getTestMessageUrl(info);
  return { messageId: info.messageId, previewUrl: typeof preview === 'string' ? preview : null };
}

export function closeTransports(): void {
  for (const transport of transports.values()) transport.close();
  transports.clear();
}

/** Good-enough plain-text alternative for clients that do not render HTML. */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
