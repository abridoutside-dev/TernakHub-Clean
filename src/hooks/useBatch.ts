// ─── useBatch Hook — FLOW-003M17 / FLOW-003M18 ────────────────────────────────
//
// Provides workspace and user context needed for Batch module service calls
// AND hydrates BATCH_OPERATION_LOG from Supabase on mount (M18).
//
// Design:
//  - Fetches batch_operations for the active workspace from Supabase and merges
//    them into the in-memory BATCH_OPERATION_LOG so that BatchRiwayat analytics
//    and BatchList dashboard reflect historical data, not just the current
//    session's in-flight dual-writes.
//  - workspaceId: active workspace UUID (null when no workspace is selected).
//  - userId: authenticated Supabase user UUID (null when unauthenticated).
//  - Re-fetches whenever the active workspace changes.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchBatchOperationsFromDb } from '../services/batchService';

export interface UseBatchResult {
  /** Active workspace UUID, or null when no workspace is selected. */
  workspaceId: string | null;
  /** Authenticated Supabase user UUID, or null when unauthenticated. */
  userId: string | null;
  /** True while the initial fetch is in-flight. */
  isLoading: boolean;
  /** Non-null when the last fetch failed. */
  error: string | null;
  /** Re-fetches batch_operations from Supabase and refreshes BATCH_OPERATION_LOG. */
  refresh: () => void;
}

export function useBatch(): UseBatchResult {
  const { activeWorkspace } = useWorkspace();
  const { currentUser } = useAuth();

  const workspaceId = activeWorkspace?.workspace_uuid ?? null;
  const userId      = currentUser?.id ?? null;

  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const abortRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!workspaceId) {
      setIsLoading(false);
      setError(null);
      return;
    }

    abortRef.current = false;
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchBatchOperationsFromDb(workspaceId);
      if (abortRef.current) return;
      if (!result.ok) {
        setError(result.error);
      }
    } catch (err) {
      if (abortRef.current) return;
      const msg = err instanceof Error ? err.message : 'Gagal memuat data operasi batch.';
      setError(msg);
      console.error('[useBatch]', err);
    } finally {
      if (!abortRef.current) setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void fetchData();
    return () => { abortRef.current = true; };
  }, [fetchData]);

  const refresh = useCallback(() => { void fetchData(); }, [fetchData]);

  return { workspaceId, userId, isLoading, error, refresh };
}
