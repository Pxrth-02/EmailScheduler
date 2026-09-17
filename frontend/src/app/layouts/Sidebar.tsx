import { Clock, Send } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { Logo } from '../../components/Logo.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { useEmailCounts } from '../../features/emails/hooks.ts';
import { cn } from '../../lib/cn.ts';
import { formatCount } from '../../lib/format.ts';
import type { User } from '../../types/api.ts';
import { UserMenu } from './UserMenu.tsx';

function NavItem({
  to,
  icon,
  label,
  count,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] text-gray-700 transition-colors hover:bg-gray-50',
          isActive && 'bg-brand-soft font-medium text-gray-900 hover:bg-brand-soft',
        )
      }
    >
      <span className="flex size-4 items-center justify-center text-gray-500">{icon}</span>
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-[11px] tabular-nums text-gray-500">{formatCount(count)}</span>
      )}
    </NavLink>
  );
}

export function Sidebar({ user }: { user: User }) {
  const counts = useEmailCounts();
  const navigate = useNavigate();

  return (
    <aside className="flex w-[220px] shrink-0 flex-col gap-3 px-4 py-5">
      <div className="px-1 text-gray-900">
        <Logo />
      </div>

      <UserMenu user={user} />

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => void navigate('/compose')}
      >
        Compose
      </Button>

      <nav aria-label="Mailboxes" className="mt-2">
        <p className="mb-1.5 px-2.5 text-[10px] font-medium tracking-wider text-gray-400 uppercase">
          Core
        </p>
        <div className="space-y-0.5">
          <NavItem
            to="/scheduled"
            icon={<Clock className="size-3.5" />}
            label="Scheduled"
            count={counts.data?.scheduled}
          />
          <NavItem
            to="/sent"
            icon={<Send className="size-3.5" />}
            label="Sent"
            count={counts.data?.sent}
          />
        </div>
      </nav>
    </aside>
  );
}
