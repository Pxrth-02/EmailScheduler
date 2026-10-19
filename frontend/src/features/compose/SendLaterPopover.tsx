import { addDays, setHours, setMinutes, startOfDay } from 'date-fns';
import { useState, type ReactNode } from 'react';
import { Button } from '../../components/ui/Button.tsx';
import { Popover } from '../../components/ui/Popover.tsx';
import { toDateTimeLocal } from '../../lib/format.ts';

export interface SendLaterPopoverProps {
  open: boolean;
  onClose: () => void;
  value: Date | null;
  onChange: (date: Date) => void;
  trigger: ReactNode;
}

function tomorrowAt(hour: number): Date {
  return setMinutes(setHours(startOfDay(addDays(new Date(), 1)), hour), 0);
}

const presets: { label: string; at: () => Date }[] = [
  { label: 'Immediate (Now)', at: () => new Date() },
  { label: 'Tomorrow Morning (9:00 AM)', at: () => tomorrowAt(9) },
  { label: 'Tomorrow Mid-day (12:00 PM)', at: () => tomorrowAt(12) },
  { label: 'Tomorrow Afternoon (3:00 PM)', at: () => tomorrowAt(15) },
  { label: 'Tomorrow Evening (6:00 PM)', at: () => tomorrowAt(18) },
];

export function SendLaterPopover({
  open,
  onClose,
  value,
  onChange,
  trigger,
}: SendLaterPopoverProps) {
  const [draft, setDraft] = useState<Date | null>(value);
  const [picked, setPicked] = useState<string>(value ? toDateTimeLocal(value) : '');

  const choose = (date: Date) => {
    setDraft(date);
    setPicked(toDateTimeLocal(date));
  };

  const done = () => {
    if (draft) onChange(draft);
    onClose();
  };

  return (
    <Popover open={open} onClose={onClose} trigger={trigger} panelClassName="w-[280px] p-space-md">
      <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/30 mb-space-sm">
        <span className="font-headline-sm text-headline-sm text-on-surface">Schedule Send</span>
        <span className="font-mono-metric text-[11px] text-secondary bg-secondary-container/30 px-1.5 py-0.5 rounded font-medium">
          UTC+05:30
        </span>
      </div>

      {/* Date & Time Input */}
      <div className="mb-space-sm">
        <label className="relative flex h-9 items-center rounded-lg bg-surface-container-low border border-outline-variant/60 px-2.5">
          <input
            type="datetime-local"
            value={picked}
            min={toDateTimeLocal(new Date())}
            onClick={(e) => e.currentTarget.showPicker?.()}
            onChange={(e) => {
              setPicked(e.target.value);
              if (e.target.value) setDraft(new Date(e.target.value));
            }}
            aria-label="Pick date and time"
            className="h-full w-full cursor-pointer bg-transparent pr-6 font-mono-metric text-body-sm text-on-surface outline-none [&::-webkit-calendar-picker-indicator]:opacity-0"
          />
          <span className="material-symbols-outlined pointer-events-none absolute right-2.5 text-[18px] text-on-surface-variant">
            calendar_today
          </span>
        </label>
      </div>

      <p className="font-mono-metric text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold mb-1">
        Quick Presets
      </p>

      <ul className="mb-space-md space-y-1">
        {presets.map((preset) => (
          <li key={preset.label}>
            <button
              type="button"
              onClick={() => choose(preset.at())}
              className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left font-body-sm text-body-sm text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              <span>{preset.label}</span>
              <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
                arrow_forward
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-end gap-2 pt-space-xs border-t border-outline-variant/30">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={done} disabled={!draft}>
          Confirm Send Time
        </Button>
      </div>
    </Popover>
  );
}
