import { Clock, Inbox, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
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

const copy: Record<EmailView, { title: string; empty: string; hint: string }> = {
  scheduled: {
    title: 'Scheduled',
    empty: 'No scheduled emails',
    hint: 'Emails you schedule will wait here until their send time.',
  },
  sent: {
    title: 'Sent',
    empty: 'Nothing sent yet',
    hint: 'Sent and failed emails show up here with their delivery status.',
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
  const q = useDebounced(search.trim(), 300);

  const senders = useSenders();
  const list = useEmailList({ view, senderId, q: q || undefined });

  useEffect(() => {
    if (list.isError) toast.error('Could not load emails. Retrying…');
  }, [list.isError]);

  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const total = list.data?.pages[0]?.total ?? 0;

  return (
    <>
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        senders={senders.data ?? []}
        senderId={senderId}
        onSenderChange={setSenderId}
        refreshing={list.isRefetching}
        onRefresh={() => void list.refetch()}
      />

      <section aria-label={`${copy[view].title} emails`} className="min-h-0 flex-1 overflow-y-auto">
        {list.isPending ? (
          <ListSkeleton />
        ) : items.length === 0 ? (
          q ? (
            <EmptyState
              icon={<Inbox className="size-5" />}
              title={`No results for “${q}”`}
              description="Try a recipient, a subject, or a word from the body."
            />
          ) : (
            <EmptyState
              icon={
                view === 'scheduled' ? <Clock className="size-5" /> : <Send className="size-5" />
              }
              title={copy[view].empty}
              description={copy[view].hint}
              action={
                <Button variant="outline" size="sm" onClick={() => void navigate('/compose')}>
                  Compose
                </Button>
              }
            />
          )
        ) : (
          <>
            {items.map((email) => (
              <EmailRow key={email.id} email={email} />
            ))}
            {list.hasNextPage && (
              <div className="flex items-center justify-center py-4">
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
      </section>
    </>
  );
}
