import { randomBytes } from 'node:crypto';
import { env, slackEnabled } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import type { SlackConnection } from '../../generated/prisma/client.js';

const SLACK_AUTHORIZE_URL = 'https://slack.com/oauth/v2/authorize';
const SLACK_ACCESS_URL = 'https://slack.com/api/oauth.v2.access';

/** Slack gives the user ten minutes to approve; the state lives exactly that long. */
const INSTALL_STATE_TTL_SECONDS = 10 * 60;
const INSTALL_STATE_PATTERN = /^[0-9a-f]{32}$/;

/**
 * Issues the OAuth `state` for one install attempt and remembers who started it.
 *
 * The state is kept in Redis rather than in the session because the callback arrives on
 * `SLACK_REDIRECT_URI`'s host, which Slack requires to be HTTPS. In development that is a
 * tunnel hostname the browser holds no session cookie for, so the callback has to identify
 * the user from the state alone. One random 128-bit value, one use, ten-minute lifetime.
 */
export async function createInstallState(userId: string): Promise<string> {
  const state = randomBytes(16).toString('hex');
  await redis.set(`slack:state:${state}`, userId, 'EX', INSTALL_STATE_TTL_SECONDS);
  return state;
}

/** Returns the user who started the install for this state and burns the state, or null. */
export async function consumeInstallState(state: string): Promise<string | null> {
  if (!INSTALL_STATE_PATTERN.test(state)) return null;
  return redis.getdel(`slack:state:${state}`);
}

export interface PublicSlackConnection {
  connected: true;
  teamName: string;
  channelName: string;
  connectedAt: string;
}

export function toPublicConnection(connection: SlackConnection): PublicSlackConnection {
  return {
    connected: true,
    teamName: connection.teamName,
    channelName: connection.channelName,
    connectedAt: connection.createdAt.toISOString(),
  };
}

/** Step 1: the URL the "Connect Slack" button sends the browser to. */
export function slackInstallUrl(state: string): string {
  if (!slackEnabled) throw new Error('Slack is not configured');
  const params = new URLSearchParams({
    client_id: env.SLACK_CLIENT_ID!,
    scope: 'incoming-webhook',
    redirect_uri: env.SLACK_REDIRECT_URI!,
    state,
  });
  return `${SLACK_AUTHORIZE_URL}?${params}`;
}

interface SlackAccessResponse {
  ok: boolean;
  error?: string;
  access_token?: string;
  team?: { id: string; name: string };
  incoming_webhook?: {
    channel: string;
    channel_id: string;
    url: string;
    configuration_url: string;
  };
}

/** Step 2: trade the code for a webhook and store it against the user. */
export async function completeSlackInstall(userId: string, code: string): Promise<SlackConnection> {
  if (!slackEnabled) throw new Error('Slack is not configured');

  const response = await fetch(SLACK_ACCESS_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.SLACK_CLIENT_ID!,
      client_secret: env.SLACK_CLIENT_SECRET!,
      code,
      redirect_uri: env.SLACK_REDIRECT_URI!,
    }),
  });

  const data = (await response.json()) as SlackAccessResponse;
  if (!data.ok || !data.access_token || !data.team || !data.incoming_webhook) {
    throw new Error(`Slack OAuth failed: ${data.error ?? 'unexpected response'}`);
  }

  return prisma.slackConnection.upsert({
    where: { userId },
    update: {
      teamId: data.team.id,
      teamName: data.team.name,
      channelName: data.incoming_webhook.channel,
      webhookUrl: data.incoming_webhook.url,
      accessToken: data.access_token,
    },
    create: {
      userId,
      teamId: data.team.id,
      teamName: data.team.name,
      channelName: data.incoming_webhook.channel,
      webhookUrl: data.incoming_webhook.url,
      accessToken: data.access_token,
    },
  });
}

export function getSlackConnection(userId: string): Promise<SlackConnection | null> {
  return prisma.slackConnection.findUnique({ where: { userId } });
}

export async function disconnectSlack(userId: string): Promise<void> {
  await prisma.slackConnection.deleteMany({ where: { userId } });
}

/** Posts a message through a stored incoming webhook. Throws on a non-2xx so callers can log it. */
export async function postToWebhook(webhookUrl: string, text: string): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    throw new Error(`Slack webhook responded ${response.status}`);
  }
}
