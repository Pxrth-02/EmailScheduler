import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn.ts';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** `filled` is the login-form look; `bare` is the underlined compose look. */
  look?: 'filled' | 'bare';
};

export function Input({ look = 'filled', className, ...rest }: InputProps) {
  return (
    <input
      className={cn(
        'w-full text-[13px] text-gray-900 placeholder:text-gray-400 outline-none transition-colors',
        look === 'filled' &&
          'h-14 rounded-lg bg-surface px-5 text-[15px] placeholder:text-gray-500 focus:ring-2 focus:ring-brand/40',
        look === 'bare' && 'h-9 bg-transparent px-0',
        className,
      )}
      {...rest}
    />
  );
}
