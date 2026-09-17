import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { emailsApi, type EmailListFilters } from './api.ts';

/** Lists poll every few seconds so an email visibly moves from Scheduled to Sent. */
const LIVE_REFRESH_MS = 5_000;

export const emailKeys = {
  all: ['emails'] as const,
  list: (filters: EmailListFilters) => ['emails', 'list', filters] as const,
  counts: ['emails', 'counts'] as const,
  detail: (id: string) => ['emails', 'detail', id] as const,
};

export function useEmailList(filters: EmailListFilters) {
  return useInfiniteQuery({
    queryKey: emailKeys.list(filters),
    queryFn: ({ pageParam }) => emailsApi.list(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.pageSize < lastPage.total ? lastPage.page + 1 : undefined,
    refetchInterval: filters.q ? false : LIVE_REFRESH_MS,
  });
}

export function useEmailCounts() {
  return useQuery({
    queryKey: emailKeys.counts,
    queryFn: emailsApi.counts,
    refetchInterval: LIVE_REFRESH_MS,
  });
}

export function useEmailDetail(id: string) {
  return useQuery({
    queryKey: emailKeys.detail(id),
    queryFn: () => emailsApi.detail(id),
    refetchInterval: (query) =>
      query.state.data?.status === 'scheduled' ? LIVE_REFRESH_MS : false,
  });
}
