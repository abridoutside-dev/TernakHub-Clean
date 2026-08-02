// ─── InitializeGuard ─────────────────────────────────────────────────────────
// AUTH-001 — Route guard for the /initialize path.
//
// Allows access ONLY when the platform has NOT yet been initialized.
// Once initialized, any visit to /initialize is silently redirected to /login.
//
// Loading behaviour:
//   null (checking) → render a branded loading screen so the user doesn't see
//   a flash of the /initialize form before the check resolves.
//
// This guard is the inverse of PlatformInitGuard.

import { Navigate, Outlet } from 'react-router-dom';
import { usePlatformInit } from '../contexts/PlatformInitContext';

// ─── Loading screen ───────────────────────────────────────────────────────────

function InitCheckingScreen() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        background: 'var(--color-bg)',
      }}
    >
      <img
        src="/logo/ternakhub-logo.png"
        alt="TernakHub"
        style={{ width: 52, height: 52, objectFit: 'contain' }}
        draggable={false}
      />
      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: 'var(--color-muted)',
          fontWeight: 500,
        }}
      >
        Memeriksa status platform…
      </p>
    </div>
  );
}

// ─── Guard ────────────────────────────────────────────────────────────────────

export default function InitializeGuard() {
  const { initialized } = usePlatformInit();

  // Still checking — show a branded screen rather than flashing the form.
  if (initialized === null) return <InitCheckingScreen />;

  // Platform already initialized — /initialize is a dead-end.
  if (initialized === true) return <Navigate to="/login" replace />;

  // Platform not yet initialized — allow the page to render.
  return <Outlet />;
}
