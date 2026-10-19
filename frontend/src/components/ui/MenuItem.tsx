import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';

export interface MenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  tone?: 'default' | 'danger';
  selected?: boolean;
}

export function MenuItem({
  icon,
  tone = 'default',
  selected,
  className,
  children,
  ...rest
}: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        'flex w-full items-center gap-2.5 px-3 py-2 text-left text-body-sm font-medium transition-colors rounded-lg',
        'hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50',
        tone === 'danger'
          ? 'text-error hover:bg-error-container/30'
          : 'text-on-surface',
        selected && 'bg-primary/10 text-primary font-semibold',
        className,
      )}
      {...rest}
    >
      {icon && (
        <span className="flex size-4 shrink-0 items-center justify-center text-on-surface-variant">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  );
}
