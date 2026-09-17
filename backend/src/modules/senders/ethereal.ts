import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';

export interface SmtpAccount {
  email: string;
  host: string;
  port: number;
  user: string;
  pass: string;
}

const ETHEREAL_HOST = 'smtp.ethereal.email';
const ETHEREAL_PORT = 587;

/**
 * Ethereal is a fake SMTP service: messages are accepted and stored for preview, never
 * delivered. Accounts are created on demand through nodemailer, so every user gets their
 * own set of "From" identities without anyone signing up for anything.
 */
export async function createEtherealAccount(): Promise<SmtpAccount> {
  const account = await nodemailer.createTestAccount();
  return {
    email: account.user,
    host: account.smtp.host,
    port: account.smtp.port,
    user: account.user,
    pass: account.pass,
  };
}

/** A fixed account from env, for people who prefer one they created on ethereal.email. */
export function pinnedEtherealAccount(): SmtpAccount | null {
  if (!env.ETHEREAL_USER || !env.ETHEREAL_PASS) return null;
  return {
    email: env.ETHEREAL_USER,
    host: ETHEREAL_HOST,
    port: ETHEREAL_PORT,
    user: env.ETHEREAL_USER,
    pass: env.ETHEREAL_PASS,
  };
}
