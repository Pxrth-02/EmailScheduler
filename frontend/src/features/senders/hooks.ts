import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api.ts';
import type { Sender } from '../../types/api.ts';

export function useSenders() {
  return useQuery({
    queryKey: ['senders'],
    queryFn: () => apiFetch<{ senders: Sender[] }>('/api/senders').then((r) => r.senders),
    staleTime: 5 * 60 * 1000,
  });
}
