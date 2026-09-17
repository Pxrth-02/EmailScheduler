import { OAuth2Client } from 'google-auth-library';
import { env } from '../../config/env.js';

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

const client = new OAuth2Client({
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  redirectUri: env.GOOGLE_CALLBACK_URL,
});

/** Step 1 of the authorization-code flow: where to send the browser. */
export function googleAuthUrl(state: string): string {
  return client.generateAuthUrl({
    scope: ['openid', 'email', 'profile'],
    state,
    prompt: 'select_account',
  });
}

/**
 * Step 2: exchange the one-time code for tokens and read the identity from the ID token.
 * The token is verified against Google's public keys and our client id, so the profile
 * cannot be forged by anyone who merely reached the callback URL.
 */
export async function exchangeGoogleCode(code: string): Promise<GoogleProfile> {
  const { tokens } = await client.getToken(code);
  if (!tokens.id_token) {
    throw new Error('Google response did not include an ID token');
  }

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.email) {
    throw new Error('Google ID token is missing the subject or email claim');
  }
  if (payload.email_verified === false) {
    throw new Error('Google account email is not verified');
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name ?? payload.email.split('@')[0] ?? 'User',
    avatarUrl: payload.picture ?? null,
  };
}
