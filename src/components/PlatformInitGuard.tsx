// ─── PlatformInitGuard ────────────────────────────────────────────────────────
// AUTH-001 — Root-level route guard that enforces platform initialization.
//
// All application routes (except /initialize itself) are wrapped by this guard.
// If the platform has never been initialized, every route redirects to
// /initialize so the first System Administrator can be created.
//
// Loading behaviour:
//   null (checking) → render null so nothing flickers while the Supabase query
//   resolves.  ProtectedRoute uses the same "render nothing while loading"
//   pattern for consistency.
//
// This guard is the inverse of InitializeGuard.

import { Navigate, Outlet } from 'react-router-dom';
import { usePlatformInit } from '../contexts/PlatformInitContext';

export default function PlatformInitGuard() {
  const { initialized } = usePlatformInit();

  // Still checking — render nothing to avoid a redirect flash.
  if (initialized === null) return null;

  // Platform not initialized — send every visitor to the bootstrap page.
  if (initialized === false) return <Navigate to="/initialize" replace />;

  // Platform is initialized — allow all child routes to render.
  return <Outlet />;
}
