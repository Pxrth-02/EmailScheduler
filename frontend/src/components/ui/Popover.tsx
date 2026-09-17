import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  /** The element that toggles the popover. Rendered in place; the panel is anchored to it. */
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
  panelClassName?: string;
}

/**
 * Small controlled popover: closes on outside click and Escape, positions below the trigger.
 * Enough for the send-later picker, the user menu and the filter menu without a dependency.
 */
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
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) onClose();
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
            'absolute top-full z-30 mt-2 rounded-lg border border-gray-200 bg-white shadow-lg shadow-gray-200/60',
            align === 'right' ? 'right-0' : 'left-0',
            panelClassName,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
