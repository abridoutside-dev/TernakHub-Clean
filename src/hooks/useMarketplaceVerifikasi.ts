// ─── useMarketplaceVerifikasi ──────────────────────────────────────────────────
// Fetches trust_verifications rows for the active workspace from Supabase.
// Derives the workspace-level verification status badge from the latest row.
// Also exposes submitVerifikasi() which inserts a new trust_verifications row.

import { useState, useEffect, useCallback } from 'react';
import {
  getTrustVerifications,
  submitTrustVerification,
} from '../services/workspaceService';
import type {
  TrustVerificationRecord,
  TrustVerificationType,
  TrustVerificationListResponse,
} from '../types/workspaceTrustVerification';

export interface UseMarketplaceVerifikasiResult {
  loading: boolean;
  error: string | null;
  data: TrustVerificationListResponse | null;
  rows: TrustVerificationRecord[];
  trustScore: number | null;
  /** Submit a new verification application of the given type. */
  submitVerifikasi: (type: TrustVerificationType) => Promise<{ ok: boolean; error: string | null }>;
  refetch: () => void;
}

export function useMarketplaceVerifikasi(
  workspaceId: string | null,
): UseMarketplaceVerifikasiResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrustVerificationListResponse | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getTrustVerifications({ workspace_id: workspaceId, page_size: 100 });
        if (!cancelled) setData(result);
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
    async (type: TrustVerificationType): Promise<{ ok: boolean; error: string | null }> => {
      if (!workspaceId) return { ok: false, error: 'Workspace tidak ditemukan.' };
      const result = await submitTrustVerification(workspaceId, type);
      if (!result.ok) return { ok: false, error: result.error.message };
      refetch();
      return { ok: true, error: null };
    },
    [workspaceId, refetch],
  );

  return {
    loading,
    error,
    data,
    rows: data?.records ?? [],
    trustScore: data?.workspace_trust_score ?? null,
    submitVerifikasi,
    refetch,
  };
}
