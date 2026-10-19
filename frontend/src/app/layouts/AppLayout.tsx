import { Outlet } from 'react-router';
import { useMe } from '../../features/auth/hooks.ts';
import { Sidebar } from './Sidebar.tsx';

/** Dashboard frame: sidebar on the left, the active mailbox on the right. */
export function AppLayout() {
  const me = useMe();
  if (!me.data) return null; // RequireAuth has already resolved the session above us

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar user={me.data} />
      <div className="pl-[260px] min-h-screen flex flex-col">
        <main className="w-full bg-surface flex-1 flex flex-col min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
