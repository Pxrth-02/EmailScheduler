import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';

interface MenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  tone?: 'default' | 'danger';
  selected?: boolean;
}

/** A row inside a Popover used as a menu. */
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
        'flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors',
        'hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50',
        tone === 'danger' ? 'text-red-600' : 'text-gray-700',
        selected && 'bg-brand-soft text-gray-900',
        className,
      )}
      {...rest}
    >
      {icon && (
        <span className="flex size-4 shrink-0 items-center justify-center text-gray-400">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  );
}
