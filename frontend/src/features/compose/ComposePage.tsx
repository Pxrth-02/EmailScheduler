import type { Editor } from '@tiptap/react';
import { ArrowLeft, ChevronDown, Clock, Paperclip } from 'lucide-react';
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
    <div className={cn('flex min-h-9 items-center gap-2', className)}>
      <span className="w-14 shrink-0 text-xs text-gray-600">{label}</span>
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

    if (!sender) return toast.error('Pick a sender first');
    if (recipients.length === 0) return toast.error('Add at least one recipient');
    if (!subject.trim()) return toast.error('Subject is required');
    if (bodyIsEmpty) return toast.error('Write something in the body');
    if (!Number.isFinite(delay) || delay < 0)
      return toast.error('Delay must be zero or more seconds');
    if (!Number.isInteger(limit) || limit < 1)
      return toast.error('Hourly limit must be at least 1');
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
            `Scheduled ${result.total} ${result.total === 1 ? 'email' : 'emails'}, first at ${formatSendTime(new Date(result.firstAt))}`,
          );
          if (!result.queued) {
            toast.warning(
              'Saved, but the queue is unreachable. The worker will pick these up when Redis is back.',
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
            detail || (error instanceof Error ? error.message : 'Could not schedule the campaign'),
          );
        },
      },
    );
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center gap-2 px-4">
        <IconButton label="Back" onClick={() => void navigate(-1)}>
          <ArrowLeft className="size-[18px]" />
        </IconButton>
        <h1 className="flex-1 text-lg font-medium text-gray-900">Compose New Email</h1>

        <IconButton label="Attachments are not supported yet" disabled>
          <Paperclip className="size-4" />
        </IconButton>

        <SendLaterPopover
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          value={sendAt}
          onChange={setSendAt}
          trigger={
            <span className="flex items-center gap-1">
              {sendAt && <span className="text-xs text-gray-500">{formatSendTime(sendAt)}</span>}
              <IconButton
                label="Choose send time"
                active={Boolean(sendAt)}
                onClick={() => setPickerOpen((v) => !v)}
              >
                <Clock className="size-4" />
              </IconButton>
            </span>
          }
        />

        <Button
          variant="outline"
          size="sm"
          className="ml-1"
          loading={create.isPending}
          onClick={submit}
        >
          {sendAt ? 'Send' : 'Send Later'}
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-10">
        <div className="mx-auto max-w-3xl">
          <FieldRow label="From">
            <Popover
              open={senderOpen}
              onClose={() => setSenderOpen(false)}
              align="left"
              panelClassName="min-w-[260px] py-1"
              trigger={
                <button
                  type="button"
                  onClick={() => setSenderOpen((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={senderOpen}
                  disabled={senders.isPending}
                  className="inline-flex h-7 items-center gap-1.5 rounded-md bg-gray-100 px-2.5 text-[13px] text-gray-800 hover:bg-gray-200 disabled:opacity-60"
                >
                  {senders.isPending
                    ? 'Loading senders…'
                    : (sender?.email ?? 'No sender available')}
                  <ChevronDown className="size-3.5 text-gray-500" />
                </button>
              }
            >
              <div role="listbox">
                {(senders.data ?? []).map((s) => (
                  <MenuItem
                    key={s.id}
                    selected={s.id === sender?.id}
                    onClick={() => {
                      setSenderId(s.id);
                      setSenderOpen(false);
                    }}
                  >
                    {s.email}
                  </MenuItem>
                ))}
              </div>
            </Popover>
          </FieldRow>

          <RecipientsField recipients={recipients} onChange={setRecipients} />

          <FieldRow label="Subject" className="border-b border-gray-100">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              maxLength={500}
              className="h-9 w-full bg-transparent text-[13px] text-gray-900 outline-none placeholder:text-gray-400"
            />
          </FieldRow>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-2.5 text-xs text-gray-600">
            <label className="flex items-center gap-2">
              Delay between 2 emails
              <input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(e.target.value)}
                placeholder="00"
                aria-label="Delay between two emails, in seconds"
                className="h-7 w-12 rounded border border-gray-200 text-center text-[13px] text-gray-900 outline-none placeholder:text-gray-300 focus:border-brand"
              />
              <span className="text-gray-400">sec</span>
            </label>
            <label className="flex items-center gap-2">
              Hourly Limit
              <input
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(e.target.value)}
                placeholder="00"
                aria-label="Maximum emails per hour"
                className="h-7 w-12 rounded border border-gray-200 text-center text-[13px] text-gray-900 outline-none placeholder:text-gray-300 focus:border-brand"
              />
            </label>
          </div>

          <BodyEditor onEditor={setEditor} />
        </div>
      </div>
    </div>
  );
}
