import { ExternalLink, Star } from 'lucide-react';
import { Link } from 'react-router';
import { StatusBadge } from '../../components/ui/Badge.tsx';
import { formatScheduleBadge } from '../../lib/format.ts';
import type { EmailListItem } from '../../types/api.ts';

/** One line in the mailbox: recipient, status badge, bold subject, grey preview, star. */
export function EmailRow({ email }: { email: EmailListItem }) {
  const recipient = email.toName ?? email.toEmail;
  const badgeTime =
    email.status === 'scheduled' ? formatScheduleBadge(email.scheduledAt) : undefined;

  return (
    <div className="group relative flex h-10 items-center gap-4 border-b border-gray-100 px-4 text-[13px] hover:bg-gray-50">
      <Link
        to={`/emails/${email.id}`}
        className="absolute inset-0 rounded-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
        aria-label={`${email.subject}, to ${recipient}`}
      />
      <span className="w-40 shrink-0 truncate text-gray-700" title={email.toEmail}>
        To: {recipient}
      </span>
      <StatusBadge status={email.status} time={badgeTime} />
      <span className="min-w-0 flex-1 truncate">
        <span className="font-semibold text-gray-900">{email.subject}</span>
        {email.preview && <span className="text-gray-400"> - {email.preview}</span>}
      </span>
      <span className="relative z-10 flex shrink-0 items-center gap-1 text-gray-300">
        {email.previewUrl && (
          <a
            href={email.previewUrl}
            target="_blank"
            rel="noreferrer"
            title="Open in Ethereal"
            className="rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:text-brand focus-visible:opacity-100"
          >
            <ExternalLink className="size-3.5" />
          </a>
        )}
        <Star className="size-3.5" />
      </span>
    </div>
  );
}
