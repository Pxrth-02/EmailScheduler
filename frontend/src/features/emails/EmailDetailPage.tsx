import DOMPurify from 'dompurify';
import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Avatar } from '../../components/ui/Avatar.tsx';
import { StatusBadge } from '../../components/ui/Badge.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { EmptyState } from '../../components/ui/EmptyState.tsx';
import { IconButton } from '../../components/ui/IconButton.tsx';
import { PageSpinner } from '../../components/ui/Spinner.tsx';
import { formatDetailDate, formatScheduleBadge } from '../../lib/format.ts';
import { useMe } from '../auth/hooks.ts';
import { useEmailDetail } from './hooks.ts';

export function EmailDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const me = useMe();
  const detail = useEmailDetail(id);

  const safeHtml = useMemo(
    () =>
      detail.data
        ? DOMPurify.sanitize(detail.data.bodyHtml, { USE_PROFILES: { html: true } })
        : '',
    [detail.data],
  );

  if (detail.isPending) return <PageSpinner />;

  if (detail.isError || !detail.data) {
    return (
      <div className="flex-1 flex items-center justify-center p-space-xl">
        <EmptyState
          icon={<span className="material-symbols-outlined text-[28px]">error</span>}
          title="Email dispatch not found"
          description="It may have been purged or the specified ID does not exist in the queue."
          action={
            <Button
              variant="outline"
              size="md"
              onClick={() => void navigate('/scheduled')}
              leftIcon={<span className="material-symbols-outlined text-[18px]">arrow_back</span>}
            >
              Back to Scheduled Queue
            </Button>
          }
        />
      </div>
    );
  }

  const email = detail.data;
  const shownAt = email.sentAt ?? email.scheduledAt;
  const backTo = email.status === 'sent' || email.status === 'failed' ? '/sent' : '/scheduled';
  const recipientDisplay = email.toName ?? email.toEmail;

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Top Header Bar */}
      <header className="fixed top-0 left-[260px] right-0 h-[60px] bg-surface-container-lowest border-b border-outline-variant/40 z-40 px-space-lg flex items-center justify-between">
        <div className="flex items-center gap-space-sm min-w-0">
          <IconButton label="Back" size="md" onClick={() => void navigate(backTo)}>
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </IconButton>
          <div className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant min-w-0">
            <Link
              to={backTo}
              className="hover:text-on-surface transition-colors truncate hidden sm:inline"
            >
              {email.status === 'sent' || email.status === 'failed' ? 'Sent' : 'Scheduled'}
            </Link>
            <span className="text-outline-variant hidden sm:inline">/</span>
            <span className="text-on-surface font-semibold truncate max-w-xs md:max-w-md">
              {email.subject}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-space-xs">
          <IconButton label="Star message" size="md" disabled>
            <span className="material-symbols-outlined text-[18px]">star</span>
          </IconButton>
          <IconButton label="Archive dispatch" size="md" disabled>
            <span className="material-symbols-outlined text-[18px]">archive</span>
          </IconButton>
          <IconButton label="Purge dispatch" size="md" disabled>
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </IconButton>

          <div className="h-5 w-[1px] bg-outline-variant/40 mx-1" />

          {me.data && <Avatar name={me.data.name} src={me.data.avatarUrl} size="sm" />}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full pt-[60px] bg-surface flex-1 p-space-lg">
        <article className="max-w-4xl mx-auto flex flex-col gap-space-md pb-space-2xl">
          {/* Metadata & Sender Card */}
          <div className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-space-lg shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
            <div className="flex items-start gap-space-md min-w-0">
              <Avatar name={email.sender.name} size="lg" />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-headline-sm text-headline-sm text-on-surface">
                    {email.sender.name}
                  </span>
                  <span className="font-mono-metric text-[12px] text-on-surface-variant truncate">
                    &lt;{email.sender.email}&gt;
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-body-sm text-on-surface-variant">
                  <span>To:</span>
                  <span className="font-medium text-on-surface">{recipientDisplay}</span>
                  {email.toName && (
                    <span className="font-mono-metric text-[11px] text-on-surface-variant/80">
                      ({email.toEmail})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-end gap-1.5 shrink-0 self-start sm:self-auto">
              <span className="font-mono-metric text-[12px] text-on-surface-variant">
                {formatDetailDate(shownAt)}
              </span>
              <StatusBadge
                status={email.status}
                time={
                  email.status === 'scheduled' ? formatScheduleBadge(email.scheduledAt) : undefined
                }
              />
            </div>
          </div>

          {/* Failure Banner if any */}
          {email.status === 'failed' && email.lastError && (
            <div className="w-full bg-error-container/30 border border-error-container text-error rounded-xl p-space-md flex items-start gap-space-sm">
              <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">
                error
              </span>
              <div className="flex flex-col gap-0.5 text-body-sm">
                <span className="font-semibold">Delivery Failed</span>
                <span>
                  After {email.attempts} {email.attempts === 1 ? 'attempt' : 'attempts'}:{' '}
                  {email.lastError}
                </span>
              </div>
            </div>
          )}

          {/* Email Body Card */}
          <div className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-space-xl shadow-xs flex flex-col gap-space-lg">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight pb-space-sm border-b border-outline-variant/30">
              {email.subject}
            </h1>

            <div
              className="prose-email text-body-base text-on-surface leading-relaxed min-h-[160px]"
              dangerouslySetInnerHTML={{ __html: safeHtml }}
            />

            {email.previewUrl && (
              <div className="pt-space-md border-t border-outline-variant/30 flex items-center justify-between flex-wrap gap-space-sm">
                <span className="font-mono-metric text-[12px] text-on-surface-variant">
                  Live delivery simulated via Ethereal SMTP Node
                </span>
                <a
                  href={email.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-container text-on-primary-container font-label-md text-label-md hover:bg-primary hover:text-on-primary transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  <span>View in Ethereal Mail</span>
                </a>
              </div>
            )}
          </div>
        </article>
      </main>
    </div>
  );
}
