import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn.ts';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name; icon-only buttons always need one. */
  label: string;
  active?: boolean;
}

export function IconButton({
  label,
  active = false,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-md text-gray-500 transition-colors',
        'hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand',
        active && 'text-brand',
        className,
      )}
      {...rest}
    />
  );
}
