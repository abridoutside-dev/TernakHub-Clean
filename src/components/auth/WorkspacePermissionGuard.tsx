// ─── WorkspacePermissionGuard — AUTH-001C ────────────────────────────────────
//
// Wraps any workspace page.  If the current user does not have the required
// permission, renders an "Akses Ditolak" screen instead of the children.
//
// Usage:
//   <WorkspacePermissionGuard module="memberManagement" action="view">
//     <WorkspaceSettingsMembers />
//   </WorkspacePermissionGuard>
//
// Rules:
//   - Uses useWorkspacePermission() — never call from non-workspace routes.
//   - role === null means the user is not a member of the active workspace.
//   - Renders a loading state while custom-role data is being fetched.

import { useNavigate, useParams } from 'react-router-dom';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
import type { PermissionModule, PermissionAction } from '../../types/workspacePermissions';

// ─── Props ────────────────────────────────────────────────────────────────────

interface WorkspacePermissionGuardProps {
  module:   PermissionModule;
  action:   PermissionAction;
  children: React.ReactNode;
}

// ─── Guard ────────────────────────────────────────────────────────────────────

export default function WorkspacePermissionGuard({
  module,
  action,
  children,
}: WorkspacePermissionGuardProps) {
  if (typeof window !== 'undefined') {
    (window as Window & { __lastRenderedReactComponent?: string }).__lastRenderedReactComponent = 'WorkspacePermissionGuard';
  }
  const { id } = useParams<{ id?: string }>();
  const safeWorkspaceId = typeof id === 'string' && id.trim().length > 0 ? id : undefined;
  if (!safeWorkspaceId) {
    console.warn('[WorkspacePermissionGuard] No valid workspace id in route; falling back to active workspace context.');
  }
  const { can, loading, role } = useWorkspacePermission(safeWorkspaceId);
  const navigate = useNavigate();

  // Wait for custom-role async fetch to settle before making an access decision.
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 300, padding: '40px 24px',
      }}>
        <p style={{ fontSize: 14, color: 'var(--color-muted)', margin: 0 }}>
          Memuat hak akses…
        </p>
      </div>
    );
  }

  // Deny access when the user has no membership or lacks the required permission.
  const hasPermission = role !== null && can(module, action);
  if (role === null || !hasPermission) {
    return (
      <div style={{
        paddingTop: 40, paddingBottom: 40,
        paddingLeft: 16, paddingRight: 16,
        maxWidth: 480, margin: '0 auto', textAlign: 'center',
      }}>
        <div style={{
          background: '#fef2f2',
          border: '1.5px solid #fca5a5',
          borderRadius: 14,
          padding: '32px 24px',
        }}>
          <span style={{ fontSize: 48 }}>🔐</span>
          <h2 style={{
            margin: '12px 0 8px',
            fontSize: 17,
            fontWeight: 700,
            color: '#991b1b',
          }}>
            Akses Ditolak
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: '#7f1d1d', lineHeight: 1.6 }}>
            {role === null
              ? 'Anda bukan anggota workspace ini.'
              : 'Anda tidak memiliki izin untuk mengakses halaman ini.'}
          </p>
          <button
            onClick={() => navigate(-1)}
            style={{
              marginTop: 18,
              padding: '10px 24px',
              background: '#dc2626',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ← Kembali
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
