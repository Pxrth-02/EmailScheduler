import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api.ts';
import type { CreateCampaignRequest, CreateCampaignResponse } from '../../types/api.ts';
import { emailKeys } from '../emails/hooks.ts';

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCampaignRequest) =>
      apiFetch<CreateCampaignResponse>('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: emailKeys.all }),
  });
}
