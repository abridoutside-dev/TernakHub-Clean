// ─── FeedStoreWorkspaceRoute — WORKSPACE-001E ────────────────────────────────
// Authenticated Toko Pakan users see the registry-driven dashboard shell.
// Guests retain the existing public Feed Store profile page.

import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useParams, useSearchParams } from 'react-router-dom';
import FeedStoreWorkspace from '../FeedStoreWorkspace';
import { getWorkspaceDashboardConfig } from '../../config/workspaceDashboardRegistry';
import { getWorkspaceOperationalConfig } from '../../config/workspaceOperationalRegistry';

export default function FeedStoreWorkspaceRoute() {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const { activeWorkspace } = useWorkspace();

  const isActiveFeedStore = Boolean(
    currentUser &&
    activeWorkspace?.workspace_uuid === id &&
    activeWorkspace.workspace_type === 'FeedStore',
  );

  if (!isActiveFeedStore) return <FeedStoreWorkspace />;

  const isOperational = searchParams.get('tab') === 'operational';
  if (isOperational) {
    const Component = getWorkspaceOperationalConfig('FeedStore').operationalComponent;
    return <Component />;
  }

  const Component = getWorkspaceDashboardConfig('FeedStore').dashboardComponent;
  return <Component />;
}