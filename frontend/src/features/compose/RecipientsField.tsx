import { useRef, useState, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from 'react';
import { toast } from 'sonner';
import type { Recipient } from '../../types/api.ts';
import { isValidEmail, parseRecipients } from './parseRecipients.ts';

export interface RecipientsFieldProps {
  recipients: Recipient[];
  onChange: (recipients: Recipient[]) => void;
}

const VISIBLE_CHIPS = 4;

export function RecipientsField({ recipients, onChange }: RecipientsFieldProps) {
  const [draft, setDraft] = useState('');
  const [expanded, setExpanded] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const merge = (incoming: Recipient[], source: 'typed' | 'file') => {
    const known = new Set(recipients.map((r) => r.email));
    const fresh = incoming.filter((r) => !known.has(r.email));
    if (fresh.length > 0) onChange([...recipients, ...fresh]);

    if (source === 'file') {
      const skipped = incoming.length - fresh.length;
      toast.success(
        `Loaded ${incoming.length} ${incoming.length === 1 ? 'recipient' : 'recipients'}` +
          (skipped > 0 ? ` (${skipped} already present)` : ''),
      );
    }
  };

  const commitDraft = () => {
    const value = draft.trim().replace(/[,;]$/, '');
    if (!value) return;

    const parsed = parseRecipients(value.replace(/[,;\s]+/g, '\n'));
    if (parsed.length === 0 || !isValidEmail(parsed[0]!.email)) {
      toast.error(`"${value}" is not a valid email address`);
      return;
    }
    merge(parsed, 'typed');
    setDraft('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',' || event.key === ';' || event.key === ' ') {
      event.preventDefault();
      commitDraft();
    } else if (event.key === 'Backspace' && draft === '' && recipients.length > 0) {
      onChange(recipients.slice(0, -1));
    }
  };

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData('text');
    const parsed = parseRecipients(text);
    if (parsed.length > 1 || text.includes('\n')) {
      event.preventDefault();
      merge(parsed, 'file');
    }
  };

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const parsed = parseRecipients(await file.text());
    if (parsed.length === 0) {
      toast.error(`No email addresses found in ${file.name}`);
      return;
    }
    merge(parsed, 'file');
  };

  const remove = (email: string) => onChange(recipients.filter((r) => r.email !== email));

  const visible = expanded ? recipients : recipients.slice(0, VISIBLE_CHIPS);
  const hidden = recipients.length - visible.length;

  return (
    <div className="flex min-h-[46px] items-center gap-space-sm border-b border-outline-variant/30 py-2">
      <span className="w-16 shrink-0 font-label-md text-label-md text-on-surface-variant font-medium">
        Recipients
      </span>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {visible.map((recipient) => (
          <span
            key={recipient.email}
            title={recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email}
            className="inline-flex h-7 max-w-[240px] items-center gap-1.5 rounded-lg border border-outline-variant/60 bg-surface-container-low pl-2.5 pr-1.5 font-mono-metric text-[12px] text-on-surface shadow-xs transition-colors"
          >
            <span className="truncate">{recipient.email}</span>
            <button
              type="button"
              aria-label={`Remove ${recipient.email}`}
              onClick={() => remove(recipient.email)}
              className="flex size-4 items-center justify-center rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface cursor-pointer"
            >
              <span className="text-[12px] leading-none">✕</span>
            </button>
          </span>
        ))}

        {hidden > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="inline-flex h-7 items-center rounded-lg border border-outline-variant/60 bg-surface-container px-2 font-mono-metric text-[11px] text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            +{hidden} more
          </button>
        )}

        {expanded && recipients.length > VISIBLE_CHIPS && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface cursor-pointer"
          >
            show less
          </button>
        )}

        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commitDraft}
          onPaste={onPaste}
          placeholder={recipients.length === 0 ? 'Enter email address (or paste comma-separated list)...' : 'Add another...'}
          aria-label="Add recipient"
          className="h-7 min-w-[200px] flex-1 bg-transparent font-body-base text-body-base text-on-surface outline-none placeholder:text-on-surface-variant/60"
        />
      </div>

      <input
        ref={fileInput}
        type="file"
        accept=".csv,.txt,text/csv,text/plain"
        className="hidden"
        onChange={onFile}
      />
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        className="inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-lg border border-outline-variant/60 hover:border-primary bg-surface-container-lowest font-label-md text-label-md text-on-surface hover:text-primary transition-colors cursor-pointer shadow-xs"
      >
        <span className="material-symbols-outlined text-[16px] text-primary">upload_file</span>
        <span>Upload CSV</span>
      </button>
    </div>
  );
}
