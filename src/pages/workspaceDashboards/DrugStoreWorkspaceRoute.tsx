// ─── DrugStoreWorkspaceRoute — WORKSPACE-001F ────────────────────────────────
// Member Toko Obat aktif melihat dashboard registry-driven.
// Tamu atau workspace lain tetap melihat halaman publik sederhana.
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useParams, useSearchParams } from 'react-router-dom';
import { getWorkspaceDashboardConfig } from '../../config/workspaceDashboardRegistry';
import { getWorkspaceOperationalConfig } from '../../config/workspaceOperationalRegistry';
import { getWorkspaceKindFromRecord } from '../../config/workspaceRegistry';

// ─── Public fallback (belum login atau bukan workspace aktif) ─────────────────

function DrugStorePublicFallback({ workspaceId }: { workspaceId: string }) {
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
      <div style={{ fontSize: 52, marginBottom: 16 }}>💊</div>
      <h2
        style={{
          margin: '0 0 8px',
          fontSize: 20,
          fontWeight: 800,
          color: 'var(--color-text)',
        }}
      >
        Toko Obat Hewan
      </h2>
      <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.6 }}>
        Workspace ini adalah Toko Obat Hewan ({workspaceId}).
        <br />
        Login dan aktifkan workspace untuk mengakses dashboard operasional.
      </p>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: '#e0f7fa',
          border: '1px solid #80deea',
          borderRadius: 20,
          padding: '6px 14px',
          fontSize: 12,
          color: '#006064',
          fontWeight: 700,
        }}
      >
        💊 Toko Obat Hewan
      </div>
    </div>
  );
}

// ─── Route Shell ──────────────────────────────────────────────────────────────

export default function DrugStoreWorkspaceRoute() {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const { activeWorkspace } = useWorkspace();

  const workspaceKind = activeWorkspace ? getWorkspaceKindFromRecord(activeWorkspace) : null;
  const isActiveDrugStore = Boolean(
    currentUser &&
    activeWorkspace?.workspace_uuid === id &&
    workspaceKind === 'DrugStore',
  );

  if (!isActiveDrugStore) return <DrugStorePublicFallback workspaceId={id} />;

  const isOperational = searchParams.get('tab') === 'operational';
  if (isOperational) {
    const Component = getWorkspaceOperationalConfig('DrugStore').operationalComponent;
    return <Component />;
  }

  const Component = getWorkspaceDashboardConfig('DrugStore').dashboardComponent;
  return <Component />;
}
