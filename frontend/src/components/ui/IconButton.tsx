import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  active?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'bordered' | 'filled';
  badgeDot?: boolean;
  children?: ReactNode;
}

export function IconButton({
  label,
  active = false,
  size = 'md',
  variant = 'ghost',
  badgeDot = false,
  className,
  children,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const sizeClasses = {
    sm: 'w-7 h-7 text-[16px]',
    md: 'w-9 h-9 text-[18px]',
    lg: 'w-10 h-10 text-[20px]',
  }[size];

  const variantClasses = {
    ghost:
      'text-on-surface-variant hover:text-on-surface hover:bg-surface-container',
    bordered:
      'border border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-container shadow-xs',
    filled:
      'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container',
  }[variant];

  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-flex items-center justify-center rounded-lg select-none transition-all duration-150 ease-out',
        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
        sizeClasses,
        variantClasses,
        active && 'border-primary/60 text-primary bg-primary/10',
        className,
      )}
      {...rest}
    >
      {children}
      {badgeDot && (
        <span
          aria-hidden="true"
          className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary ring-2 ring-surface-container-lowest animate-pulse"
        />
      )}
    </button>
  );
}
