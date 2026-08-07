// ─── AdminGuard — ADM-002 ─────────────────────────────────────────────────────
// Route-level access control for all /admin/* routes.
// Renders <Outlet /> only for authenticated System Administrators.

import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

const DEV_ADMIN_KEY = 'ternakhub_admin_dev_mode';

function useAdminAccess() {
  const { currentUser, loading } = useAuth();
  const [devMode, setDevMode] = useState(
    // Production builds must never grant admin access via localStorage.
    // The `&&` ensures the localStorage check is only reached in DEV; in
    // production import.meta.env.DEV is false so the expression short-circuits
    // to false and the localStorage key has no effect.
    () => import.meta.env.DEV && localStorage.getItem(DEV_ADMIN_KEY) === 'true',
  );

  const isAdmin =
    devMode ||
    currentUser?.user_metadata?.is_admin === true ||
    currentUser?.user_metadata?.role === 'admin' ||
    currentUser?.user_metadata?.role === 'system_admin';

  const enableDevMode = () => {
    localStorage.setItem(DEV_ADMIN_KEY, 'true');
    setDevMode(true);
  };

  return { isAdmin, loading, enableDevMode };
}

// ─── Loading ──────────────────────────────────────────────────────────────────

function AdminLoadingScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <img src="/logo/ternakhub-logo.png" alt="TernakHub" style={{ width: 56, height: 56, objectFit: 'contain' }} draggable={false} />
      <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
        Memverifikasi akses admin…
      </div>
    </div>
  );
}

// ─── Access Denied ────────────────────────────────────────────────────────────

function AccessDenied({ onEnableDevMode }: { onEnableDevMode: () => void }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          background: '#1e293b',
          borderRadius: 20,
          padding: '40px 32px',
          maxWidth: 420,
          width: '100%',
          textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#f1f5f9',
            marginBottom: 8,
            letterSpacing: -0.3,
          }}
        >
          Akses Admin Diperlukan
        </div>
        <div
          style={{
            fontSize: 14,
            color: '#64748b',
            marginBottom: 28,
            lineHeight: 1.6,
          }}
        >
          This area is restricted to{' '}
          <strong style={{ color: '#94a3b8' }}>Administrator Sistem</strong>{' '}
          saja. Pemilik Workspace dan pengguna biasa tidak dapat mengakses
          Platform Admin Dashboard.
        </div>

        <div
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 24,
            fontSize: 12.5,
            color: '#fca5a5',
            textAlign: 'left',
            lineHeight: 1.5,
          }}
        >
          <strong>Log Akses:</strong> Percobaan akses tidak sah tercatat.
          Hubungi administrator platform Anda untuk meminta akses.
        </div>

        {import.meta.env.DEV && (
          <>
            <button
              onClick={onEnableDevMode}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                border: 'none',
                marginBottom: 10,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.9')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
            >
              🛠 Enable Admin Mode (Dev Only)
            </button>
            <div style={{ fontSize: 10.5, color: '#475569' }}>
              Development bypass — sets a local flag in localStorage
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Guard ────────────────────────────────────────────────────────────────────

export default function AdminGuard() {
  const { isAdmin, loading, enableDevMode } = useAdminAccess();
  const { currentUser } = useAuth();
  const location = useLocation();

  if (loading) return <AdminLoadingScreen />;

  // P0-006: Unauthenticated users should be redirected to /login, not shown
  // an "Access Denied" screen. Access Denied is only for authenticated
  // non-admin users who deliberately navigated to /admin.
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) return <AccessDenied onEnableDevMode={enableDevMode} />;

  return <Outlet />;
}
