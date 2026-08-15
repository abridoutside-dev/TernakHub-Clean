import { Outlet, useLocation } from 'react-router-dom';
import { WorkspaceProvider } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from './BottomNav';

export default function PublicAppLayout() {
  const { currentUser } = useAuth();
  const location = useLocation();

  const showBottomNav =
    !!currentUser &&
    (location.pathname === '/marketplace' ||
      location.pathname.startsWith('/marketplace/') ||
      location.pathname === '/news-event' ||
      location.pathname.startsWith('/news-event/'));

  return (
    <WorkspaceProvider>
      <Outlet />
      {showBottomNav && <BottomNav />}
    </WorkspaceProvider>
  );
}
