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

export function UserMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const logout = useLogout();
  const slack = useSlackConnection();
  const disconnect = useDisconnectSlack();
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    const result = params.get('slack');
    if (!result) return;
    if (result === 'connected') {
      toast.success('Slack connected. Rate-limit alerts will post to your channel.');
    }
    if (result === 'error') {
      toast.error('Slack could not be connected. Please try again.');
    }
    setParams({}, { replace: true });
  }, [params, setParams]);

  const connection = slack.data?.connection;
  const slackAvailable = slack.data?.available ?? false;

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      align="left"
      panelClassName="w-[236px] p-1.5"
      trigger={
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="w-full flex items-center justify-between p-space-sm bg-surface-container-lowest border border-outline-variant/60 rounded-lg hover:border-outline transition-colors text-left group cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-space-sm overflow-hidden min-w-0">
            <Avatar name={user.name} src={user.avatarUrl} size="sm" />
            <div className="flex flex-col truncate min-w-0">
              <span className="font-label-md text-label-md text-on-surface font-medium truncate leading-tight">
                {user.name}
              </span>
              <span className="font-body-sm text-[11px] text-on-surface-variant truncate leading-tight">
                {user.email}
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant group-hover:text-on-surface transition-colors shrink-0">
            unfold_more
          </span>
        </button>
      }
    >
      <div role="menu" className="flex flex-col gap-0.5">
        <div className="px-2.5 py-1.5 border-b border-outline-variant/30 mb-1">
          <p className="font-label-md text-label-md text-on-surface font-semibold truncate">
            {user.name}
          </p>
          <p className="font-mono-metric text-[11px] text-on-surface-variant truncate">
            {user.email}
          </p>
        </div>

        {connection?.connected ? (
          <MenuItem
            icon={<span className="material-symbols-outlined text-[18px]">link_off</span>}
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
            icon={<span className="material-symbols-outlined text-[18px]">chat</span>}
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
          icon={<span className="material-symbols-outlined text-[18px]">logout</span>}
          tone="danger"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          Logout
        </MenuItem>
      </div>
    </Popover>
  );
}
