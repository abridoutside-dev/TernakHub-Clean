// ─── useJadwal Hook ───────────────────────────────────────────────────────────
//
// React hook that provides workspace-scoped jadwal pemberian pakan data from
// Supabase. Design mirrors usePemberianPakan (FLOW-003M19):
//  - Fetches jadwal_pemberian_pakan rows for the active workspace on mount /
//    workspace change.
//  - Calls populateJadwalFromDb() to hydrate the in-memory JADWAL_PEMBERIAN_DB
//    so that existing accessor functions (getJadwalList, getJadwalById, etc.)
//    work without modification on hard refresh.
//  - If DB returns 0 rows, the in-memory store is preserved intact.
//  - Uses an abort flag to prevent stale-closure races.

import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { repoGetJadwalByWorkspace } from '../repositories/jadwalPemberianPakanRepository';
import { populateJadwalFromDb } from '../data/jadwalPemberianPakanData';

export interface UseJadwalResult {
  loading: boolean;
  error:   string | null;
  refresh: () => void;
}

export function useJadwal(): UseJadwalResult {
  const { activeWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [, setTick]           = useState(0);

  const fetchData = useCallback(async (aborted: { current: boolean }) => {
    if (!activeWorkspace?.workspace_uuid) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await repoGetJadwalByWorkspace(activeWorkspace.workspace_uuid);
      if (aborted.current) return;
      if (rows.length > 0) {
        populateJadwalFromDb(rows);
        setTick((t) => t + 1);
      }
      // rows.length === 0 → DB empty or not connected; keep in-memory data intact
    } catch (err) {
      if (!aborted.current) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat jadwal pemberian pakan.';
        console.warn('[useJadwal] fetch error:', msg);
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
