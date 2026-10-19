import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AppToaster } from '../components/ui/Toast.tsx';
import { queryClient } from '../lib/query-client.ts';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <AppToaster />
    </QueryClientProvider>
  );
}
