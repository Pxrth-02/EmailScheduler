import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { ApiError } from '../../lib/api.ts';
import { authApi } from './api.ts';

export const meQueryKey = ['me'] as const;

/** The logged-in user, or an ApiError(401) when there is no session. */
export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function isUnauthenticated(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: async () => {
      // Drop everything the previous user could see, then go to login.
      queryClient.clear();
      await navigate('/login', { replace: true });
    },
  });
}
