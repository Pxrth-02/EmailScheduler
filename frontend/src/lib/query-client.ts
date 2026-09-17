import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api.ts';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      refetchOnWindowFocus: true,
      // A 4xx will not fix itself on retry; only retry what looks transient.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});
