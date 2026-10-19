import { useEffect, type ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';
import { IconButton } from './IconButton.tsx';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  side?: 'right' | 'left';
  className?: string;
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = 'right',
  className,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-hidden bg-on-background/40 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          'fixed inset-y-0 z-50 flex w-full max-w-md flex-col bg-surface-container-lowest shadow-2xl transition-transform duration-200 ease-out',
          side === 'right' ? 'right-0 border-l border-outline-variant/40' : 'left-0 border-r border-outline-variant/40',
          className,
        )}
      >
        <div className="flex items-center justify-between p-space-md border-b border-outline-variant/30">
          <div>
            {title && (
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
                {description}
              </p>
            )}
          </div>
          <IconButton label="Close panel" size="sm" onClick={onClose}>
            <span className="material-symbols-outlined text-[18px]">close</span>
          </IconButton>
        </div>

        <div className="flex-1 overflow-y-auto p-space-md">
          {children}
        </div>

        {footer && (
          <div className="p-space-md border-t border-outline-variant/30 bg-surface-container-low/40 flex items-center justify-end gap-space-sm">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
