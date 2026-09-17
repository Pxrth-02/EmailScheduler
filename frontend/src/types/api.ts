// Shapes returned by the backend. Kept in one place so a change on the server is a
// one-file change here.

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface Sender {
  id: string;
  email: string;
  name: string;
}

export type EmailStatus = 'scheduled' | 'sending' | 'sent' | 'failed';
export type EmailView = 'scheduled' | 'sent';

export interface EmailListItem {
  id: string;
  toEmail: string;
  toName: string | null;
  status: EmailStatus;
  scheduledAt: string;
  sentAt: string | null;
  previewUrl: string | null;
  lastError: string | null;
  campaignId: string;
  subject: string;
  preview: string;
  sender: Sender;
}

export interface EmailListPage {
  items: EmailListItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface EmailCounts {
  scheduled: number;
  sent: number;
}

export interface EmailDetail {
  id: string;
  toEmail: string;
  toName: string | null;
  status: EmailStatus;
  scheduledAt: string;
  sentAt: string | null;
  attempts: number;
  messageId: string | null;
  previewUrl: string | null;
  lastError: string | null;
  sender: Sender;
  subject: string;
  bodyHtml: string;
  campaign: {
    id: string;
    startAt: string;
    delayMs: number;
    hourlyLimit: number;
    totalCount: number;
  };
}

export interface Recipient {
  email: string;
  name?: string | null;
}

export interface CreateCampaignRequest {
  senderId: string;
  subject: string;
  bodyHtml: string;
  recipients: Recipient[];
  startAt: string;
  delayMs: number;
  hourlyLimit: number;
}

export interface CreateCampaignResponse {
  campaignId: string;
  total: number;
  firstAt: string;
  lastAt: string;
  effective: { delayMs: number; hourlyLimit: number };
  queued: boolean;
}

export type SlackConnectionState =
  | { connected: true; teamName: string; channelName: string; connectedAt: string }
  | { connected: false };

export interface SlackConnectionResponse {
  available: boolean;
  connection: SlackConnectionState;
}
