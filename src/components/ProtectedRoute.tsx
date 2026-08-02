// ─── ProtectedRoute ────────────────────────────────────────────────────────────
// PLATFORM-001 / AUTH-002A / P0-006 — Route guard enforcing the full onboarding
// chain with strictly separated Loading / Success / Empty / Error states.
//
// Every operational feature requires ALL of:
//   1. An authenticated user          (enforced by AuthenticatedRoute)
//   2. A verified email address       (enforced by AuthenticatedRoute)
//   3. Completed onboarding           (enforced by OnboardingRoute)
//   4. Workspace fetch did NOT error  (wsError === null)
//   5. At least one active workspace  (activeWorkspaces.length > 0)
//
// Failure modes (checked in order):
//   • Still loading                   → full-screen spinner (never redirect flash).
//   • Not authenticated               → /login  (preserves `from` for return).
//   • Email not verified              → /verify-email
//   • Onboarding not complete         → /onboarding
//   • Workspace fetch ERRORED         → error screen with retry (NOT /workspace/create)
//   • No active workspace (confirmed) → /workspace/create
//   • All checks pass                 → render child routes via <Outlet />.
//
// CRITICAL INVARIANT:
//   wsError must never trigger a redirect to /workspace/create.
//   A network failure ≠ an empty workspace list.

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';

// ─── Workspace error screen ───────────────────────────────────────────────────

interface WorkspaceErrorProps {
  message: string;
  onRetry: () => void;
}

function WorkspaceErrorScreen({ message, onRetry }: WorkspaceErrorProps) {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      background: 'var(--color-bg)',
      gap: 12,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 48 }}>⚠️</div>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
        Gagal Memuat Workspace
      </h2>
      <p style={{
        margin: 0, fontSize: 14, color: 'var(--color-muted)',
        maxWidth: 320, lineHeight: 1.6,
      }}>
        {message}
      </p>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)' }}>
        Periksa koneksi internet Anda, lalu coba lagi.
      </p>
      <button
        onClick={onRetry}
        style={{
          marginTop: 8,
          height: 44,
          padding: '0 28px',
          background: 'var(--color-primary)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--radius-sm, 10px)',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        🔄 Coba Lagi
      </button>
    </div>
  );
}

// ─── Loading screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
    }}>
      <div style={{
        width: 36, height: 36,
        border: '3.5px solid var(--color-border)',
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'pr-spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes pr-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Guard ────────────────────────────────────────────────────────────────────

export default function ProtectedRoute() {
  const { activeWorkspaces, isLoading: wsLoading, wsError, refreshWorkspaces } = useWorkspace();

  // WorkspaceProvider is mounted only after auth/email/onboarding guards.
  //    Show a spinner rather than a blank screen or a premature redirect.
  if (wsLoading) return <LoadingScreen />;

  // Workspace fetch FAILED → show error screen, never redirect to create.
  //    A network/RLS/timeout error is not the same as "no workspaces".
  //    Redirecting to /workspace/create here would cause users with existing
  //    workspaces to create duplicates when their connection is flaky.
  if (wsError) {
    return (
      <WorkspaceErrorScreen
        message={wsError}
        onRetry={refreshWorkspaces}
      />
    );
  }

  // 5. No active workspace (confirmed success, list is genuinely empty) →
  //    guide user through workspace creation.
  if (activeWorkspaces.length === 0) {
    return <Navigate to="/workspace/create" replace />;
  }

  return <Outlet />;
}
