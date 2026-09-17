import { addDays, setHours, setMinutes, startOfDay } from 'date-fns';
import { Calendar } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button } from '../../components/ui/Button.tsx';
import { Popover } from '../../components/ui/Popover.tsx';
import { toDateTimeLocal } from '../../lib/format.ts';

interface SendLaterPopoverProps {
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
  { label: 'Now', at: () => new Date() },
  { label: 'Tomorrow', at: () => tomorrowAt(9) },
  { label: 'Tomorrow, 10:00 AM', at: () => tomorrowAt(10) },
  { label: 'Tomorrow, 11:00 AM', at: () => tomorrowAt(11) },
  { label: 'Tomorrow, 3:00 PM', at: () => tomorrowAt(15) },
];

/** The "Send Later" panel: a date-time picker, quick presets, Cancel / Done. */
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
    <Popover open={open} onClose={onClose} trigger={trigger} panelClassName="w-[215px] p-3">
      <p className="mb-2 text-[13px] font-medium text-gray-900">Send Later</p>

      {/* Native pickers cannot show a text placeholder, so one is painted over the empty input. */}
      <label className="relative mb-2 flex h-8 items-center border-b border-gray-100">
        {!picked && (
          <span className="pointer-events-none absolute left-0 text-xs text-gray-400">
            Pick date &amp; time
          </span>
        )}
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
          className="h-full w-full cursor-pointer bg-transparent pr-6 text-xs text-gray-900 outline-none [&::-webkit-calendar-picker-indicator]:hidden"
          style={picked ? undefined : { color: 'transparent' }}
        />
        <Calendar className="pointer-events-none absolute right-0 size-3.5 text-gray-400" />
      </label>

      <ul className="mb-3 space-y-0.5">
        {presets.map((preset) => (
          <li key={preset.label}>
            <button
              type="button"
              onClick={() => choose(preset.at())}
              className="w-full rounded px-1 py-1 text-left text-xs text-gray-700 hover:bg-gray-50"
            >
              {preset.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-4 text-xs"
          onClick={done}
          disabled={!draft}
        >
          Done
        </Button>
      </div>
    </Popover>
  );
}
