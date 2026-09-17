import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
        {icon}
      </div>
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      {description && <p className="mt-1 max-w-xs text-[13px] text-gray-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
