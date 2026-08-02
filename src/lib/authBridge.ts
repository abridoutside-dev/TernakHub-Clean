// ─── Auth Bridge ──────────────────────────────────────────────────────────────
// Provides auth state to non-React data modules (src/data/*.ts) that cannot
// use React hooks.
//
// Rules:
//  • Only AuthContext writes here via setAuthBridge().
//  • Data modules READ via getAuthBridgeUserId() / isAuthBridgeAdmin().
//  • React components must use useAuth() from AuthContext — never this file.
//
// P0-002B: Replaces localStorage-based admin identity in produkKomersialLivingDB.

let _userId:   string | null = null;
let _userEmail: string | null = null;
let _role:     string | null = null;

/**
 * Called by AuthContext on every auth-state change (login / logout / refresh).
 * Do NOT call from anywhere else.
 */
export function setAuthBridge(
  userId:    string | null,
  userEmail: string | null,
  role:      string | null,
): void {
  _userId    = userId;
  _userEmail = userEmail;
  _role      = role;
}

/** UUID of the currently authenticated user, or null if unauthenticated. */
export function getAuthBridgeUserId(): string | null {
  return _userId;
}

/** Human-readable display name for audit logs. Falls back to 'Pengguna'. */
export function getAuthBridgeUserDisplay(): string {
  return _userEmail ?? _userId ?? 'Pengguna';
}

/**
 * True when the authenticated user holds an admin role.
 * Checks user_metadata.role ∈ { 'admin', 'system_admin' }.
 */
export function isAuthBridgeAdmin(): boolean {
  return _role === 'admin' || _role === 'system_admin';
}
