import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';

export type ChipVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'outline'
  | 'segment';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement | HTMLSpanElement> {
  variant?: ChipVariant;
  active?: boolean;
  count?: number | string;
  onRemove?: () => void;
  icon?: ReactNode;
  as?: 'button' | 'span';
}

export function Chip({
  variant = 'default',
  active = false,
  count,
  onRemove,
  icon,
  as: Component = 'button',
  className,
  children,
  ...rest
}: ChipProps) {
  const isButton = Component === 'button';

  return (
    <Component
      type={isButton ? 'button' : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 transition-all duration-150 select-none text-left',
        variant === 'segment' && [
          'px-3 py-1.5 rounded-md font-label-md text-label-md',
          active
            ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold'
            : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-normal',
        ],
        variant === 'default' && [
          'px-2 py-0.5 rounded-md font-mono-metric text-[11px]',
          'bg-surface-container text-on-surface-variant border border-outline-variant/40',
        ],
        variant === 'primary' && [
          'px-2 py-0.5 rounded-full font-mono-metric text-[11px]',
          'bg-primary-container text-on-primary-container font-medium',
        ],
        variant === 'secondary' && [
          'px-2 py-0.5 rounded-full font-mono-metric text-[11px]',
          'bg-secondary-container/50 text-on-secondary-container font-medium',
        ],
        variant === 'tertiary' && [
          'px-2 py-0.5 rounded-full font-mono-metric text-[11px]',
          'bg-tertiary-fixed text-on-tertiary-fixed font-semibold',
        ],
        variant === 'outline' && [
          'px-2.5 py-1 rounded-lg border border-outline-variant/60 font-body-sm text-body-sm',
          'bg-surface-container-lowest text-on-surface hover:border-primary',
        ],
        className,
      )}
      {...rest}
    >
      {icon && <span className="shrink-0 flex items-center justify-center">{icon}</span>}
      <span className="truncate">{children}</span>
      {count !== undefined && (
        <span
          className={cn(
            'font-mono-metric text-label-sm ml-0.5 px-1.5 py-0.2 rounded-full font-normal',
            active
              ? 'bg-surface-container text-on-surface-variant'
              : 'text-on-surface-variant/80',
          )}
        >
          {count}
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove"
          className="ml-1 -mr-0.5 flex size-4 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
        >
          <span className="text-[12px] leading-none">✕</span>
        </button>
      )}
    </Component>
  );
}
