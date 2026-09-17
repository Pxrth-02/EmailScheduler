import { Navigate, Outlet } from 'react-router';
import { PageSpinner } from '../../components/ui/Spinner.tsx';
import { isUnauthenticated, useMe } from './hooks.ts';

/** Route wrapper: resolves the session once, then renders children or bounces to /login. */
export function RequireAuth() {
  const me = useMe();

  if (me.isPending) return <PageSpinner />;
  if (me.isError) {
    if (isUnauthenticated(me.error)) return <Navigate to="/login" replace />;
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-gray-600">
        Could not reach the server. Check that the API is running, then reload.
      </div>
    );
  }

  return <Outlet />;
}
