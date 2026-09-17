import { Check, ListFilter, RefreshCw, Search } from 'lucide-react';
import { useState } from 'react';
import { IconButton } from '../../components/ui/IconButton.tsx';
import { MenuItem } from '../../components/ui/MenuItem.tsx';
import { Popover } from '../../components/ui/Popover.tsx';
import { cn } from '../../lib/cn.ts';
import type { Sender } from '../../types/api.ts';

interface ListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  senders: Sender[];
  senderId?: string;
  onSenderChange: (senderId?: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
}

/** Search field plus the filter and refresh icons from the design. */
export function ListToolbar({
  search,
  onSearchChange,
  senders,
  senderId,
  onSenderChange,
  refreshing,
  onRefresh,
}: ListToolbarProps) {
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <label className="relative flex h-8 w-full max-w-[520px] items-center">
        <Search className="pointer-events-none absolute left-3 size-3.5 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search"
          className="h-full w-full rounded-full bg-surface pr-4 pl-9 text-[13px] text-gray-900 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-brand/30"
        />
      </label>

      <Popover
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        panelClassName="w-64 py-1"
        trigger={
          <IconButton
            label="Filter by sender"
            active={Boolean(senderId)}
            onClick={() => setFilterOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={filterOpen}
          >
            <ListFilter className="size-4" />
          </IconButton>
        }
      >
        <div role="menu">
          <p className="px-3 pt-2 pb-1 text-[10px] font-medium tracking-wider text-gray-400 uppercase">
            From
          </p>
          <MenuItem
            selected={!senderId}
            icon={!senderId ? <Check className="size-3.5" /> : null}
            onClick={() => {
              onSenderChange(undefined);
              setFilterOpen(false);
            }}
          >
            All senders
          </MenuItem>
          {senders.map((sender) => (
            <MenuItem
              key={sender.id}
              selected={sender.id === senderId}
              icon={sender.id === senderId ? <Check className="size-3.5" /> : null}
              onClick={() => {
                onSenderChange(sender.id);
                setFilterOpen(false);
              }}
            >
              {sender.email}
            </MenuItem>
          ))}
        </div>
      </Popover>

      <IconButton label="Refresh" onClick={onRefresh} disabled={refreshing}>
        <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
      </IconButton>
    </div>
  );
}
