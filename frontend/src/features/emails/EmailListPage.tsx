import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button.tsx';
import { EmptyState } from '../../components/ui/EmptyState.tsx';
import { ListSkeleton } from '../../components/ui/Skeleton.tsx';
import type { EmailView } from '../../types/api.ts';
import { useSenders } from '../senders/hooks.ts';
import { EmailRow } from './EmailRow.tsx';
import { ListToolbar } from './ListToolbar.tsx';
import { useEmailList } from './hooks.ts';

const copy: Record<EmailView, { title: string; subtitle: string; empty: string; hint: string }> = {
  scheduled: {
    title: 'Scheduled',
    subtitle: 'Outgoing automated outreach campaigns, cold dispatches, and individual queued notes.',
    empty: 'No scheduled emails in queue',
    hint: 'Emails you schedule will wait here until their designated send window.',
  },
  sent: {
    title: 'Sent',
    subtitle: 'Completed outreach runs, delivery confirmations, and dispatched notes.',
    empty: 'Nothing sent yet',
    hint: 'Sent and failed emails show up here with live delivery confirmation logs.',
  },
};

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function EmailListPage({ view }: { view: EmailView }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [senderId, setSenderId] = useState<string>();
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeSegment, setActiveSegment] = useState<'all' | 'bulk' | 'individual' | 'paused'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pausedIds, setPausedIds] = useState<Set<string>>(new Set());

  const q = useDebounced(search.trim(), 300);

  const senders = useSenders();
  const list = useEmailList({ view, senderId, q: q || undefined });

  useEffect(() => {
    if (list.isError) toast.error('Could not load emails. Retrying…');
  }, [list.isError]);

  const items = useMemo(() => {
    return list.data?.pages.flatMap((page) => page.items) ?? [];
  }, [list.data]);

  const total = list.data?.pages[0]?.total ?? items.length;

  // Filter items by status & segment
  const filteredItems = useMemo(() => {
    return items.filter((email) => {
      const isPaused = pausedIds.has(email.id);
      if (statusFilter !== 'all' && email.status !== statusFilter) return false;
      if (activeSegment === 'paused' && !isPaused) return false;
      if (activeSegment === 'bulk') return email.campaignId && email.campaignId.length > 0;
      if (activeSegment === 'individual') return !email.campaignId || email.campaignId.length === 0;
      return true;
    });
  }, [items, statusFilter, activeSegment, pausedIds]);

  const allSelected =
    filteredItems.length > 0 && filteredItems.every((item) => selectedIds.has(item.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((item) => item.id)));
    }
  };

  const toggleSelect = (id: string, selected: boolean) => {
    const next = new Set(selectedIds);
    if (selected) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedIds(next);
  };

  const togglePause = (id: string) => {
    const next = new Set(pausedIds);
    if (next.has(id)) {
      next.delete(id);
      toast.success('Campaign resumed');
    } else {
      next.add(id);
      toast.warning('Campaign paused');
    }
    setPausedIds(next);
  };

  const pauseSelected = () => {
    const next = new Set(pausedIds);
    selectedIds.forEach((id) => next.add(id));
    setPausedIds(next);
    toast.success(`Paused ${selectedIds.size} dispatches`);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        senders={senders.data ?? []}
        senderId={senderId}
        onSenderChange={setSenderId}
        refreshing={list.isRefetching}
        onRefresh={() => void list.refetch()}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <main className="w-full pt-[60px] bg-surface flex-1 p-space-lg">
        <div className="flex flex-col gap-space-lg w-full max-w-[1340px] mx-auto pb-space-2xl">
          {/* Top Context & View Controls Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md pt-space-xs">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-space-sm flex-wrap">
                <span className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                  {copy[view].title}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono-metric text-mono-metric bg-secondary-container/40 text-on-secondary-container">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  {total} {view === 'scheduled' ? 'queued' : 'records'}
                </span>
                <span className="font-mono-metric text-[12px] text-on-surface-variant/70 pl-2">
                  {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </span>
              </div>
              <p className="font-body-base text-body-base text-on-surface-variant">
                {copy[view].subtitle}
              </p>
            </div>

            {/* Quick Segment Pill Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-surface-container rounded-lg self-start lg:self-auto select-none">
              <button
                type="button"
                onClick={() => setActiveSegment('all')}
                className={`px-3 py-1.5 rounded-md font-label-md text-label-md transition-all cursor-pointer ${
                  activeSegment === 'all'
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                All{' '}
                <span className="font-mono-metric text-label-sm text-on-surface-variant ml-1 font-normal">
                  {items.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSegment('bulk')}
                className={`px-3 py-1.5 rounded-md font-label-md text-label-md transition-all cursor-pointer ${
                  activeSegment === 'bulk'
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                Bulk Batches{' '}
                <span className="font-mono-metric text-label-sm text-on-surface-variant/80 ml-1 font-normal">
                  {items.filter((i) => i.campaignId).length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSegment('individual')}
                className={`px-3 py-1.5 rounded-md font-label-md text-label-md transition-all cursor-pointer ${
                  activeSegment === 'individual'
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                Individual{' '}
                <span className="font-mono-metric text-label-sm text-on-surface-variant/80 ml-1 font-normal">
                  {items.filter((i) => !i.campaignId).length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSegment('paused')}
                className={`px-3 py-1.5 rounded-md font-label-md text-label-md transition-all cursor-pointer ${
                  activeSegment === 'paused'
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                Paused{' '}
                <span className="font-mono-metric text-label-sm text-tertiary ml-1 font-normal">
                  {pausedIds.size}
                </span>
              </button>
            </div>
          </div>

          {/* Multi-Select Bulk Actions Bar (Persistent Sticky Toolbar State when rows selected) */}
          {selectedIds.size > 0 && (
            <div className="w-full flex flex-wrap items-center justify-between px-space-md py-2.5 bg-inverse-surface text-inverse-on-surface rounded-xl shadow-md transition-all duration-200 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-space-md">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-primary text-on-primary flex items-center justify-center font-mono-metric text-[12px] font-bold">
                    {selectedIds.size}
                  </span>
                  <span className="font-label-md text-label-md font-medium text-inverse-on-surface">
                    {selectedIds.size === 1 ? 'dispatch selected' : 'dispatches selected'}
                  </span>
                </div>
                <div className="h-4 w-[1px] bg-on-surface-variant/30" />
                <span className="font-mono-metric text-body-sm text-inverse-on-surface/70">
                  Ready for queue operations
                </span>
              </div>

              <div className="flex items-center gap-space-xs flex-wrap">
                <button
                  type="button"
                  onClick={pauseSelected}
                  className="h-8 px-3 rounded-lg bg-surface-container-lowest/15 hover:bg-surface-container-lowest/25 text-inverse-on-surface font-label-sm text-label-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">
                    pause_circle
                  </span>
                  <span>Pause Selected</span>
                </button>
                <button
                  type="button"
                  onClick={() => toast.info('Reschedule modal opened for selected batches')}
                  className="h-8 px-3 rounded-lg bg-surface-container-lowest/15 hover:bg-surface-container-lowest/25 text-inverse-on-surface font-label-sm text-label-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
                  <span>Reschedule</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.warning('Cancelled and removed selected dispatches from queue');
                    setSelectedIds(new Set());
                  }}
                  className="h-8 px-3 rounded-lg bg-error-container/20 hover:bg-error-container/30 text-error-container font-label-sm text-label-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                  <span>Cancel &amp; Purge</span>
                </button>
                <div className="h-4 w-[1px] bg-on-surface-variant/30 mx-1" />
                <button
                  type="button"
                  onClick={clearSelection}
                  className="h-8 px-2.5 rounded-lg text-inverse-on-surface/80 hover:text-inverse-on-surface font-label-sm text-label-sm cursor-pointer"
                >
                  Deselect
                </button>
              </div>
            </div>
          )}

          {/* Main List / Table Container */}
          <div className="w-full bg-surface-container-lowest rounded-xl shadow-xs overflow-hidden flex flex-col border border-outline-variant/30">
            {/* Table Header Specs */}
            <div className="grid grid-cols-12 px-space-md py-3 bg-surface-container-low text-on-surface-variant font-mono-metric text-[11px] uppercase tracking-wider select-none items-center">
              <div className="col-span-1 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all"
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
                <span>Type</span>
              </div>
              <div className="col-span-4 pl-2">Campaign / Target Recipient</div>
              <div className="col-span-3">Subject &amp; Template</div>
              <div className="col-span-2">Execution Horizon</div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-1 text-right pr-2">Quick Action</div>
            </div>

            {/* List Rows or Empty / Loading State */}
            {list.isPending ? (
              <ListSkeleton rows={8} />
            ) : filteredItems.length === 0 ? (
              <div className="py-12">
                {q ? (
                  <EmptyState
                    icon={<span className="material-symbols-outlined text-[28px]">search_off</span>}
                    title={`No results matching “${q}”`}
                    description="Try searching for a different recipient address, email subject, or tag."
                  />
                ) : (
                  <EmptyState
                    icon={
                      <span className="material-symbols-outlined text-[28px]">
                        {view === 'scheduled' ? 'schedule_send' : 'mark_email_read'}
                      </span>
                    }
                    title={copy[view].empty}
                    description={copy[view].hint}
                    action={
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => void navigate('/compose')}
                        leftIcon={
                          <span className="material-symbols-outlined text-[18px]">edit_square</span>
                        }
                      >
                        Compose New Dispatch
                      </Button>
                    }
                  />
                )}
              </div>
            ) : (
              <>
                {filteredItems.map((email) => (
                  <EmailRow
                    key={email.id}
                    email={email}
                    selected={selectedIds.has(email.id)}
                    onToggleSelect={(s) => toggleSelect(email.id, s)}
                    isPaused={pausedIds.has(email.id)}
                    onTogglePause={() => togglePause(email.id)}
                  />
                ))}

                {list.hasNextPage && (
                  <div className="flex items-center justify-center py-4 bg-surface-container-lowest border-t border-outline-variant/30">
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={list.isFetchingNextPage}
                      onClick={() => void list.fetchNextPage()}
                    >
                      Load more ({items.length} of {total})
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Craft Ergonomics Footer Metadata Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-space-sm px-space-sm pt-space-xs text-on-surface-variant font-mono-metric text-label-sm select-none">
            <div className="flex items-center gap-space-md flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>SMTP Gateway: AWS SES eu-central-1</span>
              </span>
              <span className="text-on-surface-variant/40">•</span>
              <span>Queue Health: 100% Nominal</span>
              <span className="text-on-surface-variant/40">•</span>
              <span>DMARC / DKIM / SPF Verified</span>
            </div>
            <div className="flex items-center gap-space-sm">
              <span className="text-on-surface-variant/80">
                Showing {filteredItems.length} of {total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled
                  className="w-7 h-7 rounded flex items-center justify-center bg-surface-container-low text-on-surface-variant/50 cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={() => list.hasNextPage && void list.fetchNextPage()}
                  disabled={!list.hasNextPage}
                  className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                    list.hasNextPage
                      ? 'bg-surface-container hover:bg-surface-container-high text-on-surface cursor-pointer'
                      : 'bg-surface-container-low text-on-surface-variant/50 cursor-not-allowed'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
