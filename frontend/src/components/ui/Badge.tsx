import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';
import type { EmailStatus } from '../../types/api.ts';

export type BadgeTone =
  | 'scheduled'
  | 'queued'
  | 'sent'
  | 'failed'
  | 'sending'
  | 'paused'
  | 'neutral'
  | 'horizon';

export interface BadgeProps {
  tone: BadgeTone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
  pulse?: boolean;
}

const tones: Record<BadgeTone, string> = {
  scheduled:
    'bg-surface-container-high text-on-surface-variant border border-outline-variant/30',
  queued:
    'bg-surface-container-high text-on-surface-variant border border-outline-variant/30',
  sent:
    'bg-secondary-container/40 text-on-secondary-container border border-secondary-fixed-dim/30',
  failed:
    'bg-error-container/60 text-error border border-error-container',
  sending:
    'bg-secondary-container/30 text-secondary border border-secondary-fixed-dim/30',
  paused:
    'bg-tertiary-container/30 text-tertiary border border-tertiary-fixed-dim/30',
  neutral:
    'bg-surface-container text-on-surface-variant border border-outline-variant/30',
  horizon:
    'bg-secondary-fixed text-on-secondary-fixed font-medium',
};

export function Badge({
  tone,
  children,
  className,
  dot = false,
  pulse = false,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 font-label-sm text-label-sm font-medium whitespace-nowrap select-none',
        tones[tone],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            tone === 'sending' && 'bg-primary animate-ping',
            tone === 'queued' && 'bg-on-surface-variant',
            tone === 'scheduled' && 'bg-primary',
            tone === 'sent' && 'bg-primary',
            tone === 'failed' && 'bg-error',
            tone === 'paused' && 'bg-tertiary',
            pulse && 'animate-pulse',
          )}
        />
      )}
      {children}
    </span>
  );
}

/** Badge for an email in either tab */
export function StatusBadge({
  status,
  time,
}: {
  status: EmailStatus | 'paused';
  time?: string;
}) {
  switch (status) {
    case 'scheduled':
      return (
        <Badge tone="queued" dot={Boolean(time)}>
          {time ? `Queued (${time})` : 'Queued'}
        </Badge>
      );
    case 'sending':
      return (
        <Badge tone="sending" dot>
          Sending
        </Badge>
      );
    case 'sent':
      return (
        <Badge tone="sent" dot>
          Sent
        </Badge>
      );
    case 'failed':
      return (
        <Badge tone="failed" dot>
          Failed
        </Badge>
      );
    case 'paused':
      return (
        <Badge tone="paused" dot>
          Paused
        </Badge>
      );
  }
}
