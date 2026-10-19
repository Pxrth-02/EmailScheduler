import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';
import { StatusBadge } from './Badge.tsx';
import type { EmailStatus } from '../../types/api.ts';

export interface ListRowProps {
  id: string;
  selected?: boolean;
  onToggleSelect?: (selected: boolean) => void;
  avatarText?: string;
  avatarType?: 'initials' | 'tag';
  tagLabel?: string;
  title: string;
  subtitle?: string;
  badgeLabel?: string;
  subject: string;
  preview?: string;
  horizonTime?: string;
  relativeTime?: string;
  subMeta?: string;
  status: EmailStatus | 'paused';
  actions?: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  progressPercent?: number;
  progressLabel?: string;
}

export function ListRow({
  id,
  selected = false,
  onToggleSelect,
  avatarText,
  avatarType = 'initials',
  tagLabel,
  title,
  subtitle,
  badgeLabel,
  subject,
  preview,
  horizonTime,
  relativeTime,
  subMeta,
  status,
  actions,
  onClick,
  className,
  progressPercent,
  progressLabel,
}: ListRowProps) {
  return (
    <div
      data-id={id}
      className={cn(
        'group relative grid grid-cols-12 px-space-md py-3.5 border-b border-outline-variant/30 items-center transition-colors duration-150',
        selected
          ? 'bg-primary/5 hover:bg-primary/10'
          : 'hover:bg-surface-container-low/70 bg-surface-container-lowest',
        className,
      )}
    >
      {/* Col 1: Select checkbox + Type / Initials avatar */}
      <div className="col-span-1 flex items-center gap-3">
        {onToggleSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onToggleSelect(e.target.checked)}
            aria-label={`Select ${title}`}
            className="w-4 h-4 accent-primary rounded cursor-pointer shrink-0"
            onClick={(e) => e.stopPropagation()}
          />
        )}
        {avatarType === 'tag' ? (
          <span
            className="w-7 h-7 rounded-md bg-secondary-container/40 text-secondary flex items-center justify-center font-mono-metric text-[11px] font-bold shrink-0"
            title={tagLabel ?? avatarText}
          >
            {avatarText ?? 'CSV'}
          </span>
        ) : (
          <div className="w-7 h-7 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold flex items-center justify-center shrink-0">
            {avatarText ?? title.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Col 4: Campaign / Target Recipient */}
      <div
        className="col-span-4 pl-2 flex flex-col gap-0.5 pr-4 cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-center gap-2">
          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight truncate group-hover:text-primary transition-colors">
            {title}
          </span>
          {badgeLabel && (
            <span className="font-mono-metric text-[10px] uppercase px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant shrink-0">
              {badgeLabel}
            </span>
          )}
        </div>
        {subtitle && (
          <span className="font-mono-metric text-body-sm text-on-surface-variant truncate">
            {subtitle}
          </span>
        )}
        {progressPercent !== undefined && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-container rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
            </div>
            {progressLabel && (
              <span className="font-mono-metric text-[11px] text-primary font-medium shrink-0">
                {progressLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Col 3: Subject & Template / Preview */}
      <div
        className="col-span-3 flex flex-col pr-3 cursor-pointer"
        onClick={onClick}
      >
        <span className="font-body-base text-body-base text-on-surface font-medium truncate">
          {subject}
        </span>
        {preview && (
          <span className="font-body-sm text-body-sm text-on-surface-variant/80 truncate">
            {preview}
          </span>
        )}
      </div>

      {/* Col 2: Execution Horizon */}
      <div className="col-span-2 flex flex-col gap-0.5">
        {(horizonTime || relativeTime) && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {horizonTime && (
              <span className="font-mono-metric text-mono-metric text-on-surface font-medium">
                {horizonTime}
              </span>
            )}
            {relativeTime && (
              <span className="font-mono-metric text-[11px] bg-secondary-fixed text-on-secondary-fixed px-1.5 py-0.5 rounded font-medium">
                {relativeTime}
              </span>
            )}
          </div>
        )}
        {subMeta && (
          <span className="font-mono-metric text-[11px] text-on-surface-variant truncate">
            {subMeta}
          </span>
        )}
      </div>

      {/* Col 1: Status */}
      <div className="col-span-1 flex justify-center">
        <StatusBadge status={status} />
      </div>

      {/* Col 1: Quick Actions */}
      <div className="col-span-1 flex items-center justify-end gap-1">
        {actions}
      </div>
    </div>
  );
}
