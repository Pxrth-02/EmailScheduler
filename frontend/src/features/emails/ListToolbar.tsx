import { useState } from 'react';
import { Popover } from '../../components/ui/Popover.tsx';
import type { Sender } from '../../types/api.ts';

export interface ListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  senders: Sender[];
  senderId?: string;
  onSenderChange: (senderId?: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
}

export function ListToolbar({
  search,
  onSearchChange,
  senders,
  senderId,
  onSenderChange,
  refreshing,
  onRefresh,
  statusFilter = 'all',
  onStatusFilterChange,
}: ListToolbarProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const selectedSender = senders.find((s) => s.id === senderId);
  const activeFiltersCount = (senderId ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);

  return (
    <>
      {/* Fixed Top Header Bar */}
      <header className="fixed top-0 left-[260px] right-0 h-[60px] bg-surface-container-lowest border-b border-outline-variant/40 z-40 px-space-lg flex items-center justify-between">
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant">
            <span className="text-on-surface font-headline-sm text-headline-sm">
              Bulk Mailer
            </span>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface-variant font-medium">Operations Queue</span>
          </div>
        </div>

        <div className="flex items-center gap-space-md">
          {/* Search box with ⌘K */}
          <div className="relative w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant/70">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search recipients, subjects, lists..."
              className="w-full h-9 pl-9 pr-12 rounded-full bg-surface-container-lowest border border-outline-variant/60 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              <kbd className="font-mono-metric text-[11px] px-1.5 py-0.5 bg-surface-container-low border border-outline-variant/60 rounded text-on-surface-variant">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-space-xs">
            <button
              type="button"
              onClick={() => setPopoverOpen((v) => !v)}
              title="Filter view"
              className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-outline-variant/60 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              {activeFiltersCount > 0 && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary ring-2 ring-surface-container-lowest" />
              )}
            </button>

            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              title="Refresh pipeline"
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-outline-variant/60 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span
                className={`material-symbols-outlined text-[18px] ${
                  refreshing ? 'animate-spin' : 'hover:rotate-180 transition-transform duration-500'
                }`}
              >
                refresh
              </span>
            </button>
          </div>

          <div className="h-5 w-[1px] bg-outline-variant/40" />

          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-label-md font-semibold select-none">
            <span className="material-symbols-outlined text-[18px]">person</span>
          </div>
        </div>
      </header>

      {/* Filter Bar & Quick Controls Layer */}
      <div className="relative w-full z-30 pt-2 pb-1">
        <div className="w-full flex flex-wrap items-center justify-between gap-space-md p-space-sm bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30">
          <div className="flex items-center gap-space-sm flex-1 max-w-xl">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Filter by batch, recipient or tag..."
                className="w-full h-9 pl-9 pr-8 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest border border-transparent focus:border-outline-variant/60"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-[14px]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Popover Trigger */}
            <Popover
              open={popoverOpen}
              onClose={() => setPopoverOpen(false)}
              align="left"
              panelClassName="w-[340px] p-space-md"
              trigger={
                <button
                  type="button"
                  onClick={() => setPopoverOpen((v) => !v)}
                  className="h-9 px-3.5 flex items-center gap-2 bg-primary-container text-on-primary-container rounded-lg font-label-md text-label-md shadow-sm transition-transform active:scale-[0.98] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full font-mono-metric text-[11px] bg-secondary-fixed text-on-secondary-fixed font-semibold">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              }
            >
              <div className="flex flex-col gap-space-md">
                <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/30">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      filter_alt
                    </span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      Queue Filters
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPopoverOpen(false)}
                    className="w-6 h-6 rounded flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Sender Account */}
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono-metric text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                    Account / Node
                  </span>
                  <div className="relative">
                    <select
                      value={senderId ?? ''}
                      onChange={(e) => onSenderChange(e.target.value || undefined)}
                      className="w-full h-8 pl-2.5 pr-7 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface appearance-none focus:outline-none border border-outline-variant/40"
                    >
                      <option value="">All Verified Senders ({senders.length})</option>
                      {senders.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.email} {s.name ? `(${s.name})` : ''}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Delivery State */}
                {onStatusFilterChange && (
                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono-metric text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                      Delivery State
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'all', label: 'All States' },
                        { id: 'scheduled', label: 'Queued' },
                        { id: 'sending', label: 'Sending' },
                        { id: 'sent', label: 'Sent' },
                        { id: 'failed', label: 'Failed' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onStatusFilterChange(item.id)}
                          className={`flex items-center gap-2 p-2 rounded-lg font-label-sm text-label-sm cursor-pointer transition-colors ${
                            statusFilter === item.id
                              ? 'bg-primary/10 text-primary font-semibold border border-primary/30'
                              : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                          }`}
                        >
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popover Actions */}
                <div className="pt-space-xs flex items-center justify-between gap-2 border-t border-outline-variant/30">
                  <button
                    type="button"
                    onClick={() => {
                      onSenderChange(undefined);
                      onStatusFilterChange?.('all');
                      setPopoverOpen(false);
                    }}
                    className="px-3 py-1.5 rounded-lg font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    Reset to default
                  </button>
                  <button
                    type="button"
                    onClick={() => setPopoverOpen(false)}
                    className="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-medium hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </Popover>
          </div>

          {/* Quick stats on rate limit & density view */}
          <div className="flex items-center gap-space-sm">
            <div className="flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1 rounded-lg">
              <span className="material-symbols-outlined text-[16px] text-secondary">bolt</span>
              <span className="font-mono-metric text-label-sm text-on-surface">
                Rate Limit: 45 msg/min
              </span>
            </div>
            <div className="flex items-center gap-1 bg-surface-container-low p-0.5 rounded-lg">
              <button
                type="button"
                className="w-8 h-7 flex items-center justify-center rounded bg-surface-container-lowest text-on-surface shadow-xs"
                title="Standard table view"
              >
                <span className="material-symbols-outlined text-[16px]">density_medium</span>
              </button>
              <button
                type="button"
                className="w-8 h-7 flex items-center justify-center rounded text-on-surface-variant hover:text-on-surface"
                title="Timeline view"
              >
                <span className="material-symbols-outlined text-[16px]">calendar_view_day</span>
              </button>
            </div>
          </div>
        </div>

        {/* Active filter pill tag when a sender is filtered */}
        {selectedSender && (
          <div className="flex items-center gap-2 mt-2">
            <span className="font-mono-metric text-[11px] text-on-surface-variant">Filtered by:</span>
            <span className="inline-flex items-center gap-1 font-mono-metric text-[11px] bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded-full font-medium">
              Sender: {selectedSender.email}
              <button
                type="button"
                onClick={() => onSenderChange(undefined)}
                className="ml-1 hover:text-error"
              >
                ✕
              </button>
            </span>
          </div>
        )}
      </div>
    </>
  );
}
