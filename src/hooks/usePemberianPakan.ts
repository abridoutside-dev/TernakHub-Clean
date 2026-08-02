// ─── usePemberianPakan Hook — FLOW-003M19 ────────────────────────────────────
//
// React hook that provides workspace-scoped pemberian pakan history from Supabase.
// Design mirrors useStokInventaris (FLOW-003M16):
//  - Fetches pemberian_pakan rows for the active workspace on mount / workspace change.
//  - Calls populatePemberianPakanFromDb() to hydrate the in-memory PEMBERIAN_PAKAN_DB
//    so that existing accessor functions (getPemberianPakanList, getPemberianPakanByTarget)
//    work without modification on hard refresh.
//  - If DB returns 0 rows, the in-memory store is preserved intact.
//  - Uses an abort flag to prevent stale-closure races.

import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { repoGetPemberianPakanByWorkspace } from '../repositories/pemberianPakanRepository';
import { populatePemberianPakanFromDb } from '../data/pemberianPakanData';

export interface UsePemberianPakanResult {
  loading: boolean;
  error:   string | null;
  refresh: () => void;
}

export function usePemberianPakan(): UsePemberianPakanResult {
  const { activeWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [, setTick]           = useState(0);

  const fetchData = useCallback(async (aborted: { current: boolean }) => {
    if (!activeWorkspace?.workspace_uuid) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await repoGetPemberianPakanByWorkspace(activeWorkspace.workspace_uuid);
      if (aborted.current) return;
      if (rows.length > 0) {
        populatePemberianPakanFromDb(rows);
        setTick((t) => t + 1);
      }
      // rows.length === 0 → DB empty or not connected; keep in-memory data intact
    } catch (err) {
      if (!aborted.current) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat riwayat pemberian pakan.';
        console.warn('[usePemberianPakan] fetch error:', msg);
        setError(msg);
      }
    } finally {
      if (!aborted.current) setLoading(false);
    }
  }, [activeWorkspace?.workspace_uuid]);

  useEffect(() => {
    const aborted = { current: false };
    void fetchData(aborted);
    return () => { aborted.current = true; };
  }, [fetchData]);

  const refresh = useCallback(() => {
    const aborted = { current: false };
    void fetchData(aborted);
  }, [fetchData]);

  return { loading, error, refresh };
}
