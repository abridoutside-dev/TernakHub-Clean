// ─── useMarketplaceVerifikasi ──────────────────────────────────────────────────
// Fetches trust_verifications rows for the active workspace from Supabase.
// Derives the workspace-level verification status badge from the latest row.
// Also exposes submitVerifikasi() which inserts a new trust_verifications row.

import { useState, useEffect, useCallback } from 'react';
import {
  repoGetTrustVerifikasiByWorkspace,
  repoInsertTrustVerifikasi,
  type MarketplaceTrustVerifikasiDbRow,
} from '../repositories/marketplaceRepository';
import {
  type StatusVerifikasiWorkspace,
} from '../data/marketplaceWorkspaceVerifikasiData';

export interface UseMarketplaceVerifikasiResult {
  loading: boolean;
  error: string | null;
  rows: MarketplaceTrustVerifikasiDbRow[];
  /** Derived status for the workspace based on the latest verification row. */
  status: StatusVerifikasiWorkspace | null;
  /** Submit a new verification application of the given type. */
  submitVerifikasi: (type: string) => Promise<{ ok: boolean; error: string | null }>;
  refetch: () => void;
}

/** Map DB status values to the UI StatusVerifikasiWorkspace. */
function deriveStatus(
  rows: MarketplaceTrustVerifikasiDbRow[],
): StatusVerifikasiWorkspace | null {
  if (rows.length === 0) return null;

  // Priority: Approved/Verified first, then in-progress, then rejected/suspended
  const hasApproved = rows.some((r) =>
    r.status === 'Approved' || r.status === 'Verified',
  );
  if (hasApproved) return 'Terverifikasi';

  const hasSuspended = rows.some((r) =>
    r.status === 'Rejected' || r.status === 'Suspended' || r.status === 'Expired',
  );
  if (hasSuspended) return 'Ditangguhkan';

  const hasInProgress = rows.some((r) =>
    r.status === 'Submitted' || r.status === 'Pending' || r.status === 'UnderReview',
  );
  if (hasInProgress) return 'Dalam Proses';

  // Draft/Unverified
  return 'Belum Diverifikasi';
}

export function useMarketplaceVerifikasi(
  workspaceId: string | null,
): UseMarketplaceVerifikasiResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<MarketplaceTrustVerifikasiDbRow[]>([]);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await repoGetTrustVerifikasiByWorkspace(workspaceId);
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Gagal memuat data verifikasi.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [workspaceId, tick]);

  const submitVerifikasi = useCallback(
    async (type: string): Promise<{ ok: boolean; error: string | null }> => {
      if (!workspaceId) return { ok: false, error: 'Workspace tidak ditemukan.' };
      const result = await repoInsertTrustVerifikasi(workspaceId, type);
      if (result.error) return { ok: false, error: result.error };
      refetch();
      return { ok: true, error: null };
    },
    [workspaceId, refetch],
  );

  return {
    loading,
    error,
    rows,
    status: deriveStatus(rows),
    submitVerifikasi,
    refetch,
  };
}
