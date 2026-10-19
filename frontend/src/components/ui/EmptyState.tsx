import type { ReactNode } from 'react';

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center select-none">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-secondary-container/40 text-primary border border-secondary-fixed-dim/40 shadow-xs">
        {icon}
      </div>
      <h2 className="font-headline-sm text-headline-sm text-on-surface">{title}</h2>
      {description && (
        <p className="mt-1.5 max-w-sm font-body-sm text-body-sm text-on-surface-variant">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
