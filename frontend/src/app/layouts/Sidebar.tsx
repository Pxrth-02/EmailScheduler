import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { useEmailCounts } from '../../features/emails/hooks.ts';
import { cn } from '../../lib/cn.ts';
import { formatCount } from '../../lib/format.ts';
import { useTheme } from '../../lib/theme.tsx';
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
          'flex items-center justify-between px-space-sm py-1.5 rounded-lg transition-all group font-label-md text-label-md select-none',
          isActive
            ? 'bg-primary-container text-on-primary-container font-semibold shadow-xs'
            : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
        )
      }
    >
      <div className="flex items-center gap-space-sm">
        <span className="flex size-[18px] items-center justify-center shrink-0">
          {icon}
        </span>
        <span>{label}</span>
      </div>
      {count !== undefined && (
        <span
          className={cn(
            'px-1.5 py-0.5 rounded-full font-mono-metric text-[11px] transition-colors',
            'bg-surface-container border border-outline-variant/50 text-on-surface-variant group-hover:border-outline-variant',
          )}
        >
          {formatCount(count)}
        </span>
      )}
    </NavLink>
  );
}

export function Sidebar({ user }: { user: User }) {
  const counts = useEmailCounts();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-surface-container-low border-r border-outline-variant/40 z-50 flex flex-col justify-between select-none">
      <div className="flex flex-col">
        {/* App Title & Version Header */}
        <div className="px-space-md pt-space-md pb-space-sm flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <div className="grid grid-cols-3 gap-[2px] p-1 rounded bg-surface-container border border-outline-variant/60">
              <div className="w-1 h-1 bg-primary rounded-[0.5px]"></div>
              <div className="w-1 h-1 bg-primary rounded-[0.5px]"></div>
              <div className="w-1 h-1 bg-transparent"></div>
              <div className="w-1 h-1 bg-primary rounded-[0.5px]"></div>
              <div className="w-1 h-1 bg-primary rounded-[0.5px]"></div>
              <div className="w-1 h-1 bg-primary rounded-[0.5px]"></div>
              <div className="w-1 h-1 bg-primary rounded-[0.5px]"></div>
              <div className="w-1 h-1 bg-transparent"></div>
              <div className="w-1 h-1 bg-primary rounded-[0.5px]"></div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface">
                ONB
              </span>
              <span className="font-label-sm text-[10px] text-on-surface-variant font-mono-metric tracking-wider uppercase">
                Scheduler
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-mono-metric bg-secondary-fixed text-on-secondary-fixed border border-secondary-fixed-dim/40 font-medium">
              v2.4
            </span>
          </div>
        </div>

        {/* User Card */}
        <div className="px-space-md pb-space-md">
          <UserMenu user={user} />
        </div>

        {/* Compose Dispatch CTA */}
        <div className="px-space-md pb-space-lg">
          <button
            type="button"
            onClick={() => void navigate('/compose')}
            className="w-full h-9 flex items-center justify-center gap-space-sm bg-surface-container-lowest border border-outline-variant hover:border-primary hover:text-primary text-on-surface font-label-md text-label-md rounded-lg transition-all group shadow-sm active:scale-[0.99] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-primary group-hover:scale-110 transition-transform">
              edit_square
            </span>
            <span>Compose Dispatch</span>
          </button>
        </div>

        {/* Section Header */}
        <div className="px-space-md pb-space-xs">
          <span className="font-mono-metric text-[11px] tracking-wider uppercase text-secondary font-semibold">
            CORE
          </span>
        </div>

        {/* Navigation */}
        <nav aria-label="Mailboxes" className="px-space-sm flex flex-col gap-space-xs">
          <NavItem
            to="/scheduled"
            icon={<span className="material-symbols-outlined text-[18px]">schedule_send</span>}
            label="Scheduled"
            count={counts.data?.scheduled}
          />
          <NavItem
            to="/sent"
            icon={<span className="material-symbols-outlined text-[18px]">mark_email_read</span>}
            label="Sent"
            count={counts.data?.sent}
          />
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="p-space-md border-t border-outline-variant/40 flex flex-col gap-space-sm bg-surface-container-lowest/50">
        <div className="flex items-center justify-between text-on-surface-variant font-mono-metric text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
            <span>Engine Ready</span>
          </span>
          <span className="text-on-surface-variant/70">0.42ms lat</span>
        </div>
        <div className="flex items-center justify-between pt-space-xs">
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">settings</span>
            <span>Settings</span>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-outline-variant/50 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="material-symbols-outlined text-[16px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
