import { cn } from '../../lib/cn.ts';

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'size-7 text-[12px]',
  md: 'size-8 text-[13px]',
  lg: 'size-10 text-[15px]',
};

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        className={cn('shrink-0 rounded-full object-cover ring-1 ring-outline-variant/40', sizes[size], className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-primary-container font-semibold text-on-primary-container select-none',
        sizes[size],
        className,
      )}
    >
      {initial}
    </span>
  );
}
