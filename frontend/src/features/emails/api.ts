import { apiFetch } from '../../lib/api.ts';
import type { EmailCounts, EmailDetail, EmailListPage, EmailView } from '../../types/api.ts';

export interface EmailListFilters {
  view: EmailView;
  senderId?: string;
  q?: string;
}

const PAGE_SIZE = 50;

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  return search.toString();
}

export const emailsApi = {
  list: (filters: EmailListFilters, page: number) => {
    const path = filters.q ? '/api/emails/search' : '/api/emails';
    return apiFetch<EmailListPage>(
      `${path}?${query({ view: filters.view, senderId: filters.senderId, q: filters.q, page, pageSize: PAGE_SIZE })}`,
    );
  },
  counts: () => apiFetch<EmailCounts>('/api/emails/counts'),
  detail: (id: string) => apiFetch<EmailDetail>(`/api/emails/${encodeURIComponent(id)}`),
};
