import { Outlet } from 'react-router';
import { useMe } from '../../features/auth/hooks.ts';
import { Sidebar } from './Sidebar.tsx';

/** Dashboard frame: sidebar on the left, the active mailbox on the right. */
export function AppLayout() {
  const me = useMe();
  if (!me.data) return null; // RequireAuth has already resolved the session above us

  return (
    <div className="flex h-full min-h-0 bg-white">
      <Sidebar user={me.data} />
      <main className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
