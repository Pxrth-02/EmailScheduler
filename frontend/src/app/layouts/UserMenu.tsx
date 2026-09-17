import { ChevronDown, LogOut, MessageSquare, Unplug } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Avatar } from '../../components/ui/Avatar.tsx';
import { MenuItem } from '../../components/ui/MenuItem.tsx';
import { Popover } from '../../components/ui/Popover.tsx';
import { useLogout } from '../../features/auth/hooks.ts';
import {
  startSlackConnect,
  useDisconnectSlack,
  useSlackConnection,
} from '../../features/slack/hooks.ts';
import type { User } from '../../types/api.ts';

/** The sidebar user card: name, email, avatar, and a menu with Slack and Logout. */
export function UserMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const logout = useLogout();
  const slack = useSlackConnection();
  const disconnect = useDisconnectSlack();
  const [params, setParams] = useSearchParams();

  // The Slack OAuth callback lands back on the dashboard with ?slack=connected|error.
  useEffect(() => {
    const result = params.get('slack');
    if (!result) return;
    if (result === 'connected')
      toast.success('Slack connected. Rate-limit alerts will post to your channel.');
    if (result === 'error') toast.error('Slack could not be connected. Please try again.');
    setParams({}, { replace: true });
  }, [params, setParams]);

  const connection = slack.data?.connection;
  const slackAvailable = slack.data?.available ?? false;

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      align="left"
      panelClassName="w-full min-w-[220px] py-1"
      trigger={
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex w-full items-center gap-2.5 rounded-lg bg-surface px-2.5 py-2 text-left transition-colors hover:bg-[#eaf0ec]"
        >
          <Avatar name={user.name} src={user.avatarUrl} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-gray-900">
              {user.name}
            </span>
            <span className="block truncate text-[11px] text-gray-500">{user.email}</span>
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-gray-400" />
        </button>
      }
    >
      <div role="menu">
        {connection?.connected ? (
          <MenuItem
            icon={<Unplug className="size-4" />}
            disabled={disconnect.isPending}
            onClick={() => {
              disconnect.mutate(undefined, {
                onSuccess: () => toast.success('Slack disconnected'),
                onError: () => toast.error('Could not disconnect Slack'),
              });
              setOpen(false);
            }}
          >
            Disconnect Slack ({connection.channelName})
          </MenuItem>
        ) : (
          <MenuItem
            icon={<MessageSquare className="size-4" />}
            disabled={!slackAvailable}
            title={
              slackAvailable
                ? undefined
                : 'Set SLACK_CLIENT_ID, SLACK_CLIENT_SECRET and SLACK_REDIRECT_URI on the server'
            }
            onClick={startSlackConnect}
          >
            {slackAvailable ? 'Connect Slack' : 'Connect Slack (not configured)'}
          </MenuItem>
        )}
        <MenuItem
          icon={<LogOut className="size-4" />}
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          Logout
        </MenuItem>
      </div>
    </Popover>
  );
}
