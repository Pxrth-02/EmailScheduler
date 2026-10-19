import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';

export type InputLook = 'filled' | 'bare' | 'search' | 'panel';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  look?: InputLook;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
}

export function Input({
  look = 'filled',
  leftIcon,
  rightElement,
  className,
  ...rest
}: InputProps) {
  const baseInput = (
    <input
      className={cn(
        'w-full text-on-surface transition-colors outline-none font-body-base',
        look === 'filled' &&
          'h-12 rounded-lg bg-surface-container-low border border-outline-variant/60 px-4 text-body-base placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest',
        look === 'panel' &&
          'h-8 px-2.5 rounded-lg bg-surface-container-low text-body-sm placeholder:text-on-surface-variant/60 border border-transparent focus:border-outline-variant/80 focus:bg-surface-container-lowest',
        look === 'search' &&
          'h-9 rounded-full bg-surface-container-lowest border border-outline-variant/60 text-body-sm placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-1 focus:ring-primary',
        look === 'bare' &&
          'h-9 bg-transparent px-0 text-body-base placeholder:text-on-surface-variant/60',
        leftIcon && look === 'search' && 'pl-9 pr-8',
        rightElement && 'pr-12',
        className,
      )}
      {...rest}
    />
  );

  if (leftIcon || rightElement) {
    return (
      <div className="relative w-full flex items-center">
        {leftIcon && (
          <div className="pointer-events-none absolute left-3 flex items-center justify-center text-on-surface-variant/70">
            {leftIcon}
          </div>
        )}
        {baseInput}
        {rightElement && (
          <div className="absolute right-2.5 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
    );
  }

  return baseInput;
}
