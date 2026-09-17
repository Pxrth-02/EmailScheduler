import DOMPurify from 'dompurify';
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  ChevronDown,
  ExternalLink,
  Star,
  Trash2,
} from 'lucide-react';
import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Avatar } from '../../components/ui/Avatar.tsx';
import { StatusBadge } from '../../components/ui/Badge.tsx';
import { EmptyState } from '../../components/ui/EmptyState.tsx';
import { IconButton } from '../../components/ui/IconButton.tsx';
import { PageSpinner } from '../../components/ui/Spinner.tsx';
import { useMe } from '../auth/hooks.ts';
import { formatDetailDate, formatScheduleBadge } from '../../lib/format.ts';
import { useEmailDetail } from './hooks.ts';

/** Reading view for one email, laid out like the design's message screen. */
export function EmailDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const me = useMe();
  const detail = useEmailDetail(id);

  const safeHtml = useMemo(
    () =>
      detail.data ? DOMPurify.sanitize(detail.data.bodyHtml, { USE_PROFILES: { html: true } }) : '',
    [detail.data],
  );

  if (detail.isPending) return <PageSpinner />;
  if (detail.isError || !detail.data) {
    return (
      <EmptyState
        icon={<AlertCircle className="size-5" />}
        title="Email not found"
        description="It may have been removed, or the link is wrong."
        action={
          <Link to="/scheduled" className="text-[13px] font-medium text-brand hover:underline">
            Back to Scheduled
          </Link>
        }
      />
    );
  }

  const email = detail.data;
  const shownAt = email.sentAt ?? email.scheduledAt;
  const backTo = email.status === 'sent' || email.status === 'failed' ? '/sent' : '/scheduled';

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 px-4">
        <IconButton label="Back" onClick={() => void navigate(backTo)}>
          <ArrowLeft className="size-[18px]" />
        </IconButton>
        <h1 className="min-w-0 flex-1 truncate text-lg font-medium text-gray-900">
          {email.subject}
        </h1>
        <div className="flex items-center gap-1 text-gray-400">
          <IconButton label="Star" disabled>
            <Star className="size-4" />
          </IconButton>
          <IconButton label="Archive" disabled>
            <Archive className="size-4" />
          </IconButton>
          <IconButton label="Delete" disabled>
            <Trash2 className="size-4" />
          </IconButton>
          {me.data && (
            <Avatar name={me.data.name} src={me.data.avatarUrl} size="sm" className="ml-2" />
          )}
        </div>
      </header>

      <article className="min-h-0 flex-1 overflow-y-auto px-6 pb-12">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-start gap-4 pt-4">
            <Avatar name={email.sender.name} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 text-[13px]">
                <span className="font-semibold text-gray-900">{email.sender.name}</span>
                <span className="truncate text-gray-500">&lt;{email.sender.email}&gt;</span>
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-500">
                to {email.toName ?? email.toEmail}
                <ChevronDown className="size-3" />
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
              <span className="text-xs text-gray-500">{formatDetailDate(shownAt)}</span>
              <StatusBadge
                status={email.status}
                time={
                  email.status === 'scheduled' ? formatScheduleBadge(email.scheduledAt) : undefined
                }
              />
            </div>
          </div>

          {email.status === 'failed' && email.lastError && (
            <div className="mt-5 ml-14 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[13px] text-red-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>
                Sending failed after {email.attempts}{' '}
                {email.attempts === 1 ? 'attempt' : 'attempts'}: {email.lastError}
              </span>
            </div>
          )}

          <div
            className="prose-email mt-6 ml-14 text-[13px] leading-6 text-gray-800"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />

          {email.previewUrl && (
            <a
              href={email.previewUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-8 ml-14 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand hover:underline"
            >
              <ExternalLink className="size-3.5" />
              Open the delivered message in Ethereal
            </a>
          )}
        </div>
      </article>
    </div>
  );
}
