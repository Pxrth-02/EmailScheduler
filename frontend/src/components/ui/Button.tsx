import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';
import { Spinner } from './Spinner.tsx';

export type ButtonVariant =
  | 'primary'
  | 'container'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'inverse';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary hover:bg-primary/90 active:scale-[0.98] shadow-sm disabled:hover:bg-primary',
  container:
    'bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary active:scale-[0.98] shadow-sm',
  outline:
    'bg-surface-container-lowest border border-outline-variant hover:border-primary hover:text-primary text-on-surface active:scale-[0.99] shadow-sm',
  ghost:
    'text-on-surface-variant hover:bg-surface-container hover:text-on-surface active:scale-[0.98]',
  danger:
    'bg-error-container/30 text-error hover:bg-error-container/50 active:scale-[0.98]',
  inverse:
    'bg-surface-container-lowest/15 text-inverse-on-surface hover:bg-surface-container-lowest/25 active:scale-[0.98]',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-label-sm font-medium gap-1.5 rounded-lg',
  md: 'h-9 px-3.5 text-label-md font-medium gap-2 rounded-lg',
  lg: 'h-11 px-5 text-body-base font-semibold gap-2.5 rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center select-none font-label-md transition-all duration-150 ease-out',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner className="size-4 shrink-0" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
