import { Navigate, createBrowserRouter } from 'react-router';
import { LoginPage } from '../features/auth/LoginPage.tsx';
import { RequireAuth } from '../features/auth/RequireAuth.tsx';
import { ComposeRoute } from '../features/compose/ComposeRoute.tsx';
import { EmailDetailPage } from '../features/emails/EmailDetailPage.tsx';
import { EmailListPage } from '../features/emails/EmailListPage.tsx';
import { AppLayout } from './layouts/AppLayout.tsx';

export const router = createBrowserRouter([
  { path: '/login', Component: LoginPage },
  {
    Component: RequireAuth,
    children: [
      {
        Component: AppLayout,
        children: [
          { index: true, element: <Navigate to="/scheduled" replace /> },
          { path: 'scheduled', element: <EmailListPage view="scheduled" /> },
          { path: 'sent', element: <EmailListPage view="sent" /> },
          { path: 'emails/:id', Component: EmailDetailPage },
        ],
      },
      { path: 'compose', Component: ComposeRoute },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
