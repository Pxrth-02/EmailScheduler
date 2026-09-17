import { cn } from '../../lib/cn.ts';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded bg-gray-100', className)} />;
}

/** Placeholder rows shaped like the email list while it loads. */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading emails">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex h-10 items-center gap-4 border-b border-gray-100 px-4">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="size-3.5 rounded-full" />
        </div>
      ))}
    </div>
  );
}
