import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isEmailVerified } from '../utils/emailVerification';
import { hasCompletedOnboarding } from '../data/onboardingData';

function LoadingScreen() {
  return <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}>Memuat…</div>;
}

/** Auth and email guard. It deliberately does not mount WorkspaceContext. */
export function AuthenticatedRoute() {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!currentUser) {
    // FLOW-001 deep-link fix: pass the intended destination as ?redirect= so
    // Login.tsx can honour it after a successful sign-in.
    // Using a query param (not router state) keeps the redirect visible after
    // the user navigates back/forward through the browser history stack and
    // is what Login.tsx already reads via useSearchParams().
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  if (!isEmailVerified(currentUser)) return <Navigate to="/verify-email" replace />;
  return <Outlet />;
}

/** Keeps onboarding in the guard chain before any workspace query can run. */
export function OnboardingRoute() {
  if (!hasCompletedOnboarding()) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}