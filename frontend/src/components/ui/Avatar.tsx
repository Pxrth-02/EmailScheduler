import { cn } from '../../lib/cn.ts';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'size-7 text-[11px]', md: 'size-8 text-xs', lg: 'size-10 text-sm' };

/** Photo when we have one, otherwise the first letter on the brand green like the design's sender bubble. */
export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        className={cn('shrink-0 rounded-full object-cover', sizes[size], className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-brand font-semibold text-white',
        sizes[size],
        className,
      )}
    >
      {initial}
    </span>
  );
}
