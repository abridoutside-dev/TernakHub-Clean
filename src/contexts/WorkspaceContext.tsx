// ─── Workspace Context — WS-001 / P0-001C / DB-001B-2B ───────────────────────
//
// React state layer for the Workspace module.
// Provides the active workspace and full workspace list to the component tree.
//
// Data source: Supabase (via workspaceRepository → workspaceService).
//
// Rules:
//  - All reads go through the Supabase repository (never the local in-memory
//    LEGACY repo directly).
//  - Active workspace is persisted in sessionStorage so it survives page
//    reloads within the same tab, but resets on a new session.
//  - Workspace list is re-fetched whenever the authenticated user changes
//    (login, logout, or user switch). On logout the list is cleared.
//  - DO NOT encode auth logic here — authentication lives in AuthContext.
//  - DO NOT import pages or other contexts here.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { WorkspaceRecord } from '../types/workspace';
import { updateWorkspace } from '../services/workspaceService';
import { repoGetAllWorkspaces } from '../repositories/workspaceRepository';
import type { WorkspaceUpdateInput } from '../types/workspace';
import type { ServiceResult } from '../services/workspaceService';
import { trackRecentWorkspace } from '../utils/recentWorkspaces';
import { normalizeStoredWorkspaceUuid } from '../utils/workspaceSafety';
import { useAuth } from './AuthContext';
import { loadMembersFromSupabase } from '../data/workspaceMembersData';

// ─── Session Storage Key ──────────────────────────────────────────────────────

const ACTIVE_WS_KEY = 'ternakhub_active_workspace_uuid';

function readActiveUuidFromSession(): string | null {
  try {
    const storedValue = sessionStorage.getItem(ACTIVE_WS_KEY);
    if (!storedValue) return null;

    const normalized = normalizeStoredWorkspaceUuid(storedValue);
    if (!normalized) {
      sessionStorage.removeItem(ACTIVE_WS_KEY);
      console.warn('[WorkspaceContext] Ignored invalid active workspace value from sessionStorage.');
    }
    return normalized;
  } catch {
    return null;
  }
}

function writeActiveUuidToSession(uuid: string | null): void {
  try {
    if (uuid) {
      sessionStorage.setItem(ACTIVE_WS_KEY, uuid);
    } else {
      sessionStorage.removeItem(ACTIVE_WS_KEY);
    }
  } catch {
    // sessionStorage may be unavailable in some environments — fail silently.
  }
}

// ─── Context Value Shape ──────────────────────────────────────────────────────

export interface WorkspaceContextValue {
  /** All workspaces available to the current user. */
  workspaces: WorkspaceRecord[];

  /** Only workspaces with status === 'Active'. */
  activeWorkspaces: WorkspaceRecord[];

  /** The workspace currently being managed / in context. */
  activeWorkspace: WorkspaceRecord | null;

  /** True while the context is loading from Supabase. */
  isLoading: boolean;

  /**
   * Non-null when the last workspace fetch failed.
   * IMPORTANT: a fetch error must NEVER be treated as an empty workspace list.
   * Consumers must show an error UI and offer a retry when this is set.
   */
  wsError: string | null;

  /**
   * Switch the active workspace.
   * Persists the selection to sessionStorage.
   */
  setActiveWorkspaceUuid: (uuid: string) => void;

  /**
   * Apply a partial update to a workspace via the service layer.
   * Automatically refreshes the local list on success.
   */
  saveWorkspace: (
    uuid: string,
    patch: WorkspaceUpdateInput,
  ) => Promise<ServiceResult<WorkspaceRecord>>;

  /** Re-fetches the workspace list from Supabase (fire-and-forget). */
  refreshWorkspaces: () => void;

  /**
   * Adds a newly-created workspace directly to the local list without a
   * Supabase re-fetch.
   *
   * FLOW-001F4: call this immediately after createWorkspace() returns so
   * the workspace is visible to WorkspaceSelect and ProtectedRoute before
   * any async SELECT completes.  Idempotent: ignored if the UUID is already
   * in the list (e.g. if a background refreshWorkspaces() already ran).
   */
  addWorkspaceLocally: (record: WorkspaceRecord) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { currentUser, loading: authLoading } = useAuth();
  if (typeof window !== 'undefined') {
    (window as Window & { __lastRenderedReactComponent?: string }).__lastRenderedReactComponent = 'WorkspaceProvider';
  }

  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([]);
  const [activeUuid, setActiveUuid] = useState<string | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  // P0-006: separate error state from empty state.
  // NEVER treat a fetch error as an empty workspace list.
  const [wsError, setWsError] = useState<string | null>(null);

  // ── Fetch workspaces from Supabase ────────────────────────────────────────
  const fetchWorkspaces = useCallback(async (): Promise<WorkspaceRecord[] | null> => {
    setWsError(null);
    try {
      const all = await repoGetAllWorkspaces();
      setWorkspaces(all);
      setWsError(null);
      return all;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Gagal memuat workspace dari server.';
      console.error('[WorkspaceContext] Failed to load workspaces from Supabase:', err);
      // Do NOT reset workspaces to [] on error — that would cause ProtectedRoute
      // to treat the error as an empty list and redirect to workspace/create.
      // Keep the previous list (if any) and surface the error instead.
      setWsError(msg);
      return null;
    }
  }, []);

  // ── React to auth state changes ───────────────────────────────────────────
  // Re-fetch whenever the authenticated user changes (including first load).
  // If auth is still loading, wait — we don't want to fetch with no session
  // and then fetch again with a session.
  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      // User signed out — clear workspace state immediately.
      setWorkspaces([]);
      setActiveUuid(null);
      setWsError(null);
      writeActiveUuidToSession(null);
      setIsLoading(false);
      return;
    }

    // User signed in or changed — fetch their workspaces then warm the
    // members cache so workspace pages have member counts immediately.
    setIsLoading(true);
    fetchWorkspaces().then(async (all) => {
      // all is null when fetchWorkspaces caught an error — stop here and
      // let wsError surface to consumers; do not touch activeUuid.
      if (all === null) {
        setIsLoading(false);
        return;
      }

      // Restore last active workspace from sessionStorage, or pick the first
      // Active one as a sensible default.
      const savedUuid   = readActiveUuidFromSession();
      const savedExists = savedUuid ? all.some((w) => w.workspace_uuid === savedUuid) : false;
      const firstActive = all.find((w) => w.workspace_status === 'Active');

      const resolved = savedExists
        ? savedUuid!
        : (firstActive?.workspace_uuid ?? null);

      setActiveUuid(resolved);
      writeActiveUuidToSession(resolved);

      // Load members for all workspaces from Supabase (fire-and-forget after
      // workspace list is ready; pages read from the populated sync cache).
      if (all.length > 0) {
        void loadMembersFromSupabase(all.map((w) => w.workspace_uuid));
      }

      setIsLoading(false);
    });
  }, [authLoading, currentUser, fetchWorkspaces]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived values ────────────────────────────────────────────────────────
  const activeWorkspaces = workspaces.filter((w) => w.workspace_status === 'Active');
  const activeWorkspace  = activeUuid
    ? (workspaces.find((w) => w.workspace_uuid === activeUuid) ?? null)
    : null;

  // ── Actions ───────────────────────────────────────────────────────────────

  const setActiveWorkspaceUuid = useCallback((uuid: string) => {
    const normalized = normalizeStoredWorkspaceUuid(uuid);
    if (!normalized) {
      console.warn('[WorkspaceContext] Ignored invalid workspace UUID when switching active workspace.');
      return;
    }

    setActiveUuid(normalized);
    writeActiveUuidToSession(normalized);
    trackRecentWorkspace(normalized); // persist to localStorage for "Recently Used" in selector
  }, []);

  // FLOW-001F4: inject a newly-created workspace directly into local state.
  // This is called immediately after createWorkspace() returns so the workspace
  // is available to WorkspaceSelect and ProtectedRoute without waiting for (or
  // relying on) a Supabase re-fetch.  Idempotent — skipped if the UUID is
  // already in the list.
  const addWorkspaceLocally = useCallback((record: WorkspaceRecord) => {
    setWorkspaces((prev) => {
      if (prev.some((w) => w.workspace_uuid === record.workspace_uuid)) return prev;
      return [...prev, record];
    });
  }, []);

  /**
   * Re-fetches workspaces from Supabase.
   * Sets isLoading = true while the fetch is in-flight so consumers (e.g.
   * WorkspaceSelect) show a spinner rather than a stale / empty state.
   */
  const refreshWorkspaces = useCallback(() => {
    setIsLoading(true);
    void fetchWorkspaces().then(() => { setIsLoading(false); });
  }, [fetchWorkspaces]);

  const saveWorkspace = useCallback(
    async (uuid: string, patch: WorkspaceUpdateInput): Promise<ServiceResult<WorkspaceRecord>> => {
      const result = await updateWorkspace(uuid, patch);
      if (result.ok) {
        // Refresh the list so all consumers re-render with fresh Supabase data.
        await fetchWorkspaces();
      }
      return result;
    },
    [fetchWorkspaces],
  );

  const value: WorkspaceContextValue = {
    workspaces,
    activeWorkspaces,
    activeWorkspace,
    isLoading,
    wsError,
    setActiveWorkspaceUuid,
    saveWorkspace,
    refreshWorkspaces,
    addWorkspaceLocally,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Returns the Workspace context value.
 * Must be called inside a component that is a descendant of WorkspaceProvider.
 */
export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used inside <WorkspaceProvider>.');
  }
  return ctx;
}
