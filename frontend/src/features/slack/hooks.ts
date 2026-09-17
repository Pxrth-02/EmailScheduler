import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api.ts';
import type { SlackConnectionResponse } from '../../types/api.ts';

const key = ['slack', 'connection'] as const;

export function useSlackConnection() {
  return useQuery({
    queryKey: key,
    queryFn: () => apiFetch<SlackConnectionResponse>('/api/slack/connection'),
    staleTime: 60 * 1000,
  });
}

/** Connecting is an OAuth redirect through the backend; disconnecting is a plain DELETE. */
export function startSlackConnect(): void {
  window.location.assign('/slack/install');
}

export function useDisconnectSlack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>('/api/slack/connection', { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
