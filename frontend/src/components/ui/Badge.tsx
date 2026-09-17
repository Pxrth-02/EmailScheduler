import { Clock } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';
import type { EmailStatus } from '../../types/api.ts';

interface BadgeProps {
  tone: 'scheduled' | 'sent' | 'failed' | 'sending';
  children: ReactNode;
  className?: string;
}

const tones: Record<BadgeProps['tone'], string> = {
  scheduled: 'bg-badge-scheduled text-badge-scheduled-text',
  sent: 'bg-badge-sent text-badge-sent-text',
  failed: 'bg-red-50 text-red-600',
  sending: 'bg-blue-50 text-blue-600',
};

export function Badge({ tone, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-5 shrink-0 items-center gap-1 rounded px-1.5 text-[11px] font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {tone === 'scheduled' && <Clock className="size-3" strokeWidth={2.2} />}
      {children}
    </span>
  );
}

/** Badge text for an email in either tab. */
export function StatusBadge({ status, time }: { status: EmailStatus; time?: string }) {
  switch (status) {
    case 'scheduled':
      return <Badge tone="scheduled">{time ?? 'Scheduled'}</Badge>;
    case 'sending':
      return <Badge tone="sending">Sending</Badge>;
    case 'sent':
      return <Badge tone="sent">Sent</Badge>;
    case 'failed':
      return <Badge tone="failed">Failed</Badge>;
  }
}
