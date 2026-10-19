import type { Editor } from '@tiptap/react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button.tsx';
import { IconButton } from '../../components/ui/IconButton.tsx';
import { MenuItem } from '../../components/ui/MenuItem.tsx';
import { Popover } from '../../components/ui/Popover.tsx';
import { ApiError } from '../../lib/api.ts';
import { cn } from '../../lib/cn.ts';
import { formatSendTime } from '../../lib/format.ts';
import type { Recipient } from '../../types/api.ts';
import { useSenders } from '../senders/hooks.ts';
import { BodyEditor } from './BodyEditor.tsx';
import { RecipientsField } from './RecipientsField.tsx';
import { SendLaterPopover } from './SendLaterPopover.tsx';
import { useCreateCampaign } from './api.ts';

function FieldRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex min-h-[46px] items-center gap-space-sm border-b border-outline-variant/30 py-2', className)}>
      <span className="w-16 shrink-0 font-label-md text-label-md text-on-surface-variant font-medium">
        {label}
      </span>
      <div className="flex min-w-0 flex-1 items-center">{children}</div>
    </div>
  );
}

export function ComposePage() {
  const navigate = useNavigate();
  const senders = useSenders();
  const create = useCreateCampaign();

  const [senderId, setSenderId] = useState<string>();
  const [senderOpen, setSenderOpen] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [subject, setSubject] = useState('');
  const [delaySeconds, setDelaySeconds] = useState('');
  const [hourlyLimit, setHourlyLimit] = useState('');
  const [sendAt, setSendAt] = useState<Date | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);

  const sender = senders.data?.find((s) => s.id === senderId) ?? senders.data?.[0];

  const submit = () => {
    const body = editor?.getHTML() ?? '';
    const bodyIsEmpty = !editor || editor.isEmpty;
    const delay = delaySeconds === '' ? 0 : Number(delaySeconds);
    const limit = Number(hourlyLimit);

    if (!sender) return toast.error('Pick a verified sender identity first');
    if (recipients.length === 0) return toast.error('Add at least one recipient address');
    if (!subject.trim()) return toast.error('Subject line is required');
    if (bodyIsEmpty) return toast.error('Write your dispatch content in the body');
    if (!Number.isFinite(delay) || delay < 0)
      return toast.error('Delay must be zero or more seconds');
    if (!Number.isInteger(limit) || limit < 1)
      return toast.error('Hourly rate limit must be at least 1 message/hour');
    if (!sendAt) {
      setPickerOpen(true);
      return;
    }

    create.mutate(
      {
        senderId: sender.id,
        subject: subject.trim(),
        bodyHtml: body,
        recipients,
        startAt: sendAt.toISOString(),
        delayMs: Math.round(delay * 1000),
        hourlyLimit: limit,
      },
      {
        onSuccess: async (result) => {
          toast.success(
            `Scheduled ${result.total} ${result.total === 1 ? 'dispatch' : 'dispatches'}, first queued for ${formatSendTime(new Date(result.firstAt))}`,
          );
          if (!result.queued) {
            toast.warning(
              'Saved, but the background worker queue is offline. It will pick these up automatically upon restart.',
            );
          }
          await navigate('/scheduled');
        },
        onError: (error) => {
          const detail =
            error instanceof ApiError && Array.isArray(error.details)
              ? (error.details as { message: string }[]).map((d) => d.message).join(', ')
              : null;
          toast.error(
            detail || (error instanceof Error ? error.message : 'Could not queue the dispatch campaign'),
          );
        },
      },
    );
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Top Fixed Header */}
      <header className="fixed top-0 left-[260px] right-0 h-[60px] bg-surface-container-lowest border-b border-outline-variant/40 z-40 px-space-lg flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          <IconButton label="Back" size="md" onClick={() => void navigate(-1)}>
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </IconButton>
          <div className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant">
            <span className="text-on-surface font-headline-sm text-headline-sm">
              Compose Dispatch
            </span>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface-variant font-medium">New Batch or Note</span>
          </div>
        </div>

        <div className="flex items-center gap-space-sm">
          {/* Send Later Picker Trigger */}
          <SendLaterPopover
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            value={sendAt}
            onChange={setSendAt}
            trigger={
              <button
                type="button"
                onClick={() => setPickerOpen((v) => !v)}
                className={`h-9 px-3 rounded-lg border font-label-md text-label-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                  sendAt
                    ? 'bg-secondary-container/40 text-on-secondary-container border-secondary-fixed-dim'
                    : 'bg-surface-container-lowest border-outline-variant/60 text-on-surface hover:border-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {sendAt ? 'schedule_send' : 'schedule'}
                </span>
                <span>{sendAt ? formatSendTime(sendAt) : 'Schedule Horizon'}</span>
              </button>
            }
          />

          <Button
            variant="primary"
            size="md"
            loading={create.isPending}
            onClick={submit}
            leftIcon={
              <span className="material-symbols-outlined text-[18px]">
                {sendAt ? 'send' : 'schedule_send'}
              </span>
            }
          >
            {sendAt ? 'Queue Dispatch' : 'Schedule Dispatch'}
          </Button>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="w-full pt-[60px] bg-surface flex-1 p-space-lg">
        <div className="max-w-4xl mx-auto flex flex-col gap-space-lg pb-space-2xl">
          <div className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-space-xl shadow-xs flex flex-col gap-space-sm">
            {/* From Sender Selector */}
            <FieldRow label="From">
              <Popover
                open={senderOpen}
                onClose={() => setSenderOpen(false)}
                align="left"
                panelClassName="w-[280px] p-1.5"
                trigger={
                  <button
                    type="button"
                    onClick={() => setSenderOpen((v) => !v)}
                    aria-haspopup="listbox"
                    aria-expanded={senderOpen}
                    disabled={senders.isPending}
                    className="inline-flex h-8 items-center gap-2 rounded-lg bg-surface-container-low border border-outline-variant/50 px-3 font-body-sm text-body-sm text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-secondary">
                      verified_user
                    </span>
                    <span className="truncate max-w-[200px]">
                      {senders.isPending
                        ? 'Loading identities…'
                        : (sender?.email ?? 'No sender available')}
                    </span>
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                      expand_more
                    </span>
                  </button>
                }
              >
                <div role="listbox" className="flex flex-col gap-0.5">
                  <div className="px-2.5 py-1 text-[11px] font-mono-metric uppercase tracking-wider text-on-surface-variant font-semibold">
                    Select Sender Node
                  </div>
                  {(senders.data ?? []).map((s) => (
                    <MenuItem
                      key={s.id}
                      selected={s.id === sender?.id}
                      onClick={() => {
                        setSenderId(s.id);
                        setSenderOpen(false);
                      }}
                    >
                      {s.email} {s.name ? `(${s.name})` : ''}
                    </MenuItem>
                  ))}
                </div>
              </Popover>
            </FieldRow>

            {/* Recipients Row */}
            <RecipientsField recipients={recipients} onChange={setRecipients} />

            {/* Subject Row */}
            <FieldRow label="Subject">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter dispatch subject line..."
                maxLength={500}
                className="h-9 w-full bg-transparent font-body-base text-body-base text-on-surface outline-none placeholder:text-on-surface-variant/60"
              />
            </FieldRow>

            {/* Delivery Throttling Ergonomics Bar */}
            <div className="flex flex-wrap items-center justify-between gap-space-md py-3 px-space-md bg-surface-container-low/60 rounded-xl border border-outline-variant/30 text-body-sm text-on-surface-variant my-1">
              <div className="flex flex-wrap items-center gap-space-lg">
                <label className="flex items-center gap-2 cursor-pointer font-label-md">
                  <span>Throttle delay between sends:</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={delaySeconds}
                    onChange={(e) => setDelaySeconds(e.target.value)}
                    placeholder="0"
                    aria-label="Delay between two emails in seconds"
                    className="h-8 w-14 rounded-lg border border-outline-variant/60 bg-surface-container-lowest text-center font-mono-metric text-body-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <span className="font-mono-metric text-label-sm text-on-surface-variant">sec</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-label-md">
                  <span>Hourly send limit:</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={hourlyLimit}
                    onChange={(e) => setHourlyLimit(e.target.value)}
                    placeholder="45"
                    aria-label="Maximum emails per hour"
                    className="h-8 w-16 rounded-lg border border-outline-variant/60 bg-surface-container-lowest text-center font-mono-metric text-body-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <span className="font-mono-metric text-label-sm text-on-surface-variant">msg/hr</span>
                </label>
              </div>

              <div className="flex items-center gap-1.5 font-mono-metric text-[11px] text-secondary">
                <span className="material-symbols-outlined text-[16px]">speed</span>
                <span>Anti-Spam Warmup Guard Active</span>
              </div>
            </div>

            {/* Tiptap Rich Text Content Body */}
            <div className="pt-2">
              <span className="font-label-md text-label-md text-on-surface-variant font-medium block mb-1">
                Dispatch Body
              </span>
              <BodyEditor onEditor={setEditor} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
