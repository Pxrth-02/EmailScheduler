import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AppToaster } from '../components/ui/Toast.tsx';
import { queryClient } from '../lib/query-client.ts';
import { ThemeProvider } from '../lib/theme.tsx';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <AppToaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
