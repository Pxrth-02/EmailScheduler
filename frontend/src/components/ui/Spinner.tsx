import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn.ts';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 aria-label="Loading" className={cn('animate-spin text-current', className)} />;
}

/** Centered spinner for a whole page or panel while its data loads. */
export function PageSpinner() {
  return (
    <div className="flex h-full min-h-40 items-center justify-center text-gray-400">
      <Spinner className="size-6" />
    </div>
  );
}
