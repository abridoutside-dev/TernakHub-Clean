// ─── VeterinaryWorkspaceRoute — VET-ROUTE-001 ──────────────────────────────────
// Route shell for Veterinary workspaces (DokterHewan + KlinikHewan).
// Mirrors DrugStoreWorkspaceRoute / FeedStoreWorkspaceRoute pattern.
//
// Route: /workspace/:id/veterinary
// - Authenticated member of active Veterinary workspace → dashboard/operational
// - Guest or non-Vet workspace → public profile fallback

import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import type { WorkspaceRecord } from '../../types/workspace';
import { useParams, useSearchParams } from 'react-router-dom';
import { getWorkspaceDashboardConfig } from '../../config/workspaceDashboardRegistry';
import { getWorkspaceOperationalConfig } from '../../config/workspaceOperationalRegistry';
import { getWorkspaceKindFromRecord } from '../../config/workspaceRegistry';

// ─── Public Fallback ───────────────────────────────────────────────────────────

function VeterinaryPublicFallback({ workspaceId }: { workspaceId: string }) {
  return (
    <div
      style={{
        maxWidth: 480,
        margin: '60px auto',
        padding: '32px 24px',
        textAlign: 'center',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div style={{ fontSize: 52, marginBottom: 16 }}>🩺</div>
      <h2
        style={{
          margin: '0 0 8px',
          fontSize: 20,
          fontWeight: 800,
          color: 'var(--color-text)',
        }}
      >
        Klinik & Dokter Hewan
      </h2>
      <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.6 }}>
        Workspace ini adalah Klinik / Praktik Veteriner ({workspaceId}).
        <br />
        Login dan aktifkan workspace untuk mengakses dashboard operasional.
      </p>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: '#fce4ec',
          border: '1px solid #f48fb1',
          borderRadius: 20,
          padding: '6px 14px',
          fontSize: 12,
          color: '#ad1457',
          fontWeight: 700,
        }}
      >
        🩺 Klinik Hewan
      </div>
    </div>
  );
}

// ─── Route Shell ───────────────────────────────────────────────────────────────

export default function VeterinaryWorkspaceRoute() {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const { activeWorkspace } = useWorkspace();

  const isActiveVet = Boolean(
    currentUser &&
    activeWorkspace?.workspace_uuid === id &&
    activeWorkspace.workspace_type === 'Veterinary',
  );

  if (!isActiveVet) return <VeterinaryPublicFallback workspaceId={id} />;

  const kind = getWorkspaceKindFromRecord(activeWorkspace as WorkspaceRecord);

  const isOperational = searchParams.get('tab') === 'operational';
  if (isOperational) {
    const config = getWorkspaceOperationalConfig(kind);
    const Component = config.operationalComponent;
    return <Component />;
  }

  const config = getWorkspaceDashboardConfig(kind);
  const Component = config.dashboardComponent;
  return <Component />;
}
