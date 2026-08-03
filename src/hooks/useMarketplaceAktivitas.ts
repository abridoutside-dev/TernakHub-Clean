// ─── useMarketplaceAktivitas ───────────────────────────────────────────────────
// Fetches activity_log rows for the current workspace (domain='marketplace').
// Returns loading/error state + raw DB rows.
// MarketplaceRiwayatAktivitas.tsx uses these rows to supplement in-memory events.

import { useState, useEffect, useCallback } from 'react';
import {
  repoGetActivityLogByWorkspace,
  type MarketplaceActivityLogDbRow,
} from '../repositories/marketplaceRepository';

export interface UseMarketplaceAktivitasResult {
  loading: boolean;
  error: string | null;
  rows: MarketplaceActivityLogDbRow[];
  refetch: () => void;
}

export function useMarketplaceAktivitas(
  workspaceId: string | null,
): UseMarketplaceAktivitasResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<MarketplaceActivityLogDbRow[]>([]);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await repoGetActivityLogByWorkspace(workspaceId);
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Gagal memuat riwayat aktivitas.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [workspaceId, tick]);

  return { loading, error, rows, refetch };
}
