import { Upload, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from 'react';
import { toast } from 'sonner';
import type { Recipient } from '../../types/api.ts';
import { isValidEmail, parseRecipients } from './parseRecipients.ts';

interface RecipientsFieldProps {
  recipients: Recipient[];
  onChange: (recipients: Recipient[]) => void;
}

/** How many chips to show before collapsing the rest behind a "+N". */
const VISIBLE_CHIPS = 3;

/** The "To" row: chips, a free-text input, and the Upload List link from the design. */
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
        `Detected ${incoming.length} email ${incoming.length === 1 ? 'address' : 'addresses'}` +
          (skipped > 0 ? ` (${skipped} already added)` : ''),
      );
    }
  };

  const commitDraft = () => {
    const value = draft.trim().replace(/[,;]$/, '');
    if (!value) return;

    // One address typed, or several separated by commas / spaces / newlines.
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
    <div className="flex min-h-9 items-center gap-2 border-b border-gray-100 py-1.5">
      <span className="w-14 shrink-0 text-xs text-gray-600">To</span>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {visible.map((recipient) => (
          <span
            key={recipient.email}
            title={recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email}
            className="inline-flex h-6 max-w-[220px] items-center gap-1 rounded-full border border-brand/40 bg-white pr-1 pl-2.5 text-xs text-gray-800"
          >
            <span className="truncate">{recipient.email}</span>
            <button
              type="button"
              aria-label={`Remove ${recipient.email}`}
              onClick={() => remove(recipient.email)}
              className="flex size-4 items-center justify-center rounded-full text-gray-400 hover:bg-brand-soft hover:text-gray-700"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        {hidden > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="inline-flex h-6 items-center rounded-full border border-brand/40 px-2.5 text-xs text-gray-800 hover:bg-brand-soft"
          >
            +{hidden}
          </button>
        )}
        {expanded && recipients.length > VISIBLE_CHIPS && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-xs text-gray-400 hover:text-gray-600"
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
          placeholder={recipients.length === 0 ? 'recipient@example.com' : ''}
          aria-label="Add recipient"
          className="h-6 min-w-[180px] flex-1 bg-transparent text-[13px] text-gray-900 outline-none placeholder:text-gray-400"
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
        className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-brand hover:underline"
      >
        <Upload className="size-3.5" />
        Upload List
      </button>
    </div>
  );
}
