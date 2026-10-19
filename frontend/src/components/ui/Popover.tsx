import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';

export interface PopoverProps {
  open: boolean;
  onClose: () => void;
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  panelClassName?: string;
}

export function Popover({
  open,
  onClose,
  trigger,
  children,
  align = 'right',
  className,
  panelClassName,
}: PopoverProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      {trigger}
      {open && (
        <div
          role="dialog"
          className={cn(
            'absolute top-full z-50 mt-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-xl',
            'transition-all duration-150 ease-out animate-in fade-in zoom-in-95',
            align === 'right' && 'right-0',
            align === 'left' && 'left-0',
            align === 'center' && 'left-1/2 -translate-x-1/2',
            panelClassName,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
