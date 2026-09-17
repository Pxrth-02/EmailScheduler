import { Suspense, lazy } from 'react';
import { PageSpinner } from '../../components/ui/Spinner.tsx';

// The editor is the heaviest dependency in the app; only people who compose pay for it.
const ComposePage = lazy(() =>
  import('./ComposePage.tsx').then((m) => ({ default: m.ComposePage })),
);

export function ComposeRoute() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <ComposePage />
    </Suspense>
  );
}
