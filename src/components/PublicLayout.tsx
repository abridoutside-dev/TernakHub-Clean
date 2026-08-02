import { Outlet } from 'react-router-dom';
import ScrollRestorer from './ScrollRestorer';

/**
 * Shell for routes that must remain usable without a workspace session.
 *
 * Keep this component deliberately free of useWorkspace()/WorkspaceProvider.
 * Public pages must never mount workspace state or application navigation.
 */
export default function PublicLayout() {
  return (
    <div style={{ minHeight: '100dvh' }}>
      <ScrollRestorer />
      <Outlet />
    </div>
  );
}