import { normalizeStoredWorkspaceUuid, normalizeRecentWorkspaceList } from './workspaceSafety';

// ─── Recent Workspaces Tracker — WS-005 ──────────────────────────────────────
//
// Persists an ordered list of recently-accessed workspace UUIDs to localStorage
// so the Workspace Selector can surface them at the top of the list.
//
// Rules:
//  - Max 5 entries. The most-recently used is always at index 0.
//  - Stored in localStorage so it survives browser sessions (unlike sessionStorage).
//  - Silently swallowed errors — localStorage may be unavailable in some environments.
//  - No React state here; callers read on mount / after switch.

const RECENT_WS_KEY = 'ternakhub_recent_workspaces';
const MAX_RECENT    = 5;

/**
 * Record a workspace as "just used". Moves it to front if already present.
 * Call this immediately after setting the active workspace UUID.
 */
export function trackRecentWorkspace(uuid: string): void {
  try {
    const normalizedUuid = normalizeStoredWorkspaceUuid(uuid);
    if (!normalizedUuid) {
      console.warn('[recentWorkspaces] Ignored invalid workspace UUID while tracking recent workspace.');
      return;
    }

    const stored = localStorage.getItem(RECENT_WS_KEY);
    const current = normalizeRecentWorkspaceList(stored ? JSON.parse(stored) : []);
    const updated = [normalizedUuid, ...current.filter((u) => u !== normalizedUuid)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_WS_KEY, JSON.stringify(updated));
  } catch {
    // Fail silently.
  }
}

/**
 * Returns the list of recently-used workspace UUIDs, most-recent first.
 * Returns an empty array if nothing has been tracked yet.
 */
export function getRecentWorkspaceUuids(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_WS_KEY);
    return stored ? normalizeRecentWorkspaceList(JSON.parse(stored)) : [];
  } catch {
    return [];
  }
}

/**
 * Remove a workspace UUID from the recent list (e.g. when a workspace is archived
 * or membership is removed). No-op if not present.
 */
export function removeRecentWorkspace(uuid: string): void {
  try {
    const normalizedUuid = normalizeStoredWorkspaceUuid(uuid);
    if (!normalizedUuid) return;

    const stored = localStorage.getItem(RECENT_WS_KEY);
    const current = normalizeRecentWorkspaceList(stored ? JSON.parse(stored) : []);
    const updated = current.filter((u) => u !== normalizedUuid);
    localStorage.setItem(RECENT_WS_KEY, JSON.stringify(updated));
  } catch {
    // Fail silently.
  }
}

/** Clear all recent workspace history. */
export function clearRecentWorkspaces(): void {
  try {
    localStorage.removeItem(RECENT_WS_KEY);
  } catch {
    // Fail silently.
  }
}
