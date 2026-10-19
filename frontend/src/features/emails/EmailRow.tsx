import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router';
import { ListRow } from '../../components/ui/ListRow.tsx';
import type { EmailListItem } from '../../types/api.ts';

export interface EmailRowProps {
  email: EmailListItem;
  selected?: boolean;
  onToggleSelect?: (selected: boolean) => void;
  isPaused?: boolean;
  onTogglePause?: () => void;
}

export function EmailRow({
  email,
  selected = false,
  onToggleSelect,
  isPaused = false,
  onTogglePause,
}: EmailRowProps) {
  const navigate = useNavigate();
  const recipientName = email.toName ?? email.toEmail;
  const recipientEmail = email.toEmail;

  const targetDate = new Date(email.sentAt ?? email.scheduledAt);
  const isFuture = targetDate.getTime() > Date.now();
  const horizonTime = format(targetDate, 'MMM d, HH:mm');
  const relativeTime = isFuture
    ? `in ${formatDistanceToNow(targetDate)}`
    : `${formatDistanceToNow(targetDate)} ago`;

  const initials = recipientName
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'EM';

  return (
    <ListRow
      id={email.id}
      selected={selected}
      onToggleSelect={onToggleSelect}
      avatarText={initials}
      avatarType="initials"
      title={recipientName}
      subtitle={recipientEmail}
      badgeLabel="Direct"
      subject={email.subject}
      preview={email.preview}
      horizonTime={horizonTime}
      relativeTime={relativeTime}
      subMeta={email.sender.name ? `via ${email.sender.name}` : undefined}
      status={isPaused ? 'paused' : email.status}
      onClick={() => void navigate(`/emails/${email.id}`)}
      actions={
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {email.previewUrl && (
            <a
              href={email.previewUrl}
              target="_blank"
              rel="noreferrer"
              title="Open delivered email in Ethereal"
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
            </a>
          )}
          {email.status === 'scheduled' && onTogglePause && (
            <button
              type="button"
              onClick={onTogglePause}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-tertiary transition-colors"
              title={isPaused ? 'Resume Dispatch' : 'Pause Dispatch'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isPaused ? 'play_arrow' : 'pause'}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => void navigate(`/emails/${email.id}`)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
            title="View Details"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      }
    />
  );
}
