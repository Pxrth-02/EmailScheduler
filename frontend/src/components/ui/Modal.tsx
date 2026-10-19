import { useEffect, type ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';
import { IconButton } from './IconButton.tsx';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
  className,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  }[maxWidth];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/40 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          'w-full rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-2xl overflow-hidden flex flex-col',
          'transition-all duration-200 ease-out transform scale-100',
          maxWidthClass,
          className,
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between p-space-md border-b border-outline-variant/30">
            <div>
              {title && (
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  {description}
                </p>
              )}
            </div>
            <IconButton label="Close modal" size="sm" onClick={onClose}>
              <span className="material-symbols-outlined text-[18px]">close</span>
            </IconButton>
          </div>
        )}

        <div className="p-space-md min-h-0 overflow-y-auto flex-1">
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
