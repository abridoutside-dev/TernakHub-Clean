// ─── useMarketplaceNotifikasi ──────────────────────────────────────────────────
// Fetches notifications from the `notifications` table for the current user
// (recipient_user_id). Returns loading/error state + list of DB notifications.
// Pages supplement these with aggregated in-memory business events.

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  repoGetNotifikasiByUser,
  repoMarkNotifikasiRead,
  repoMarkAllNotifikasiRead,
  type MarketplaceNotifikasiDbRow,
} from '../repositories/marketplaceRepository';

export interface UseMarketplaceNotifikasiResult {
  loading: boolean;
  error: string | null;
  notifikasi: MarketplaceNotifikasiDbRow[];
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refetch: () => void;
}

export function useMarketplaceNotifikasi(
  workspaceId?: string,
): UseMarketplaceNotifikasiResult {
  const { currentUser: user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifikasi, setNotifikasi] = useState<MarketplaceNotifikasiDbRow[]>([]);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await repoGetNotifikasiByUser(user.id, workspaceId);
        if (!cancelled) setNotifikasi(rows);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Gagal memuat notifikasi.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [user?.id, workspaceId, tick]);

  const markRead = useCallback(async (id: string) => {
    await repoMarkNotifikasiRead(id);
    setNotifikasi((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n,
      ),
    );
  }, []);

  const markAllRead = useCallback(async () => {
    if (!user?.id) return;
    await repoMarkAllNotifikasiRead(user.id, workspaceId);
    const now = new Date().toISOString();
    setNotifikasi((prev) =>
      prev.map((n) => ({ ...n, is_read: true, read_at: now })),
    );
  }, [user?.id, workspaceId]);

  return { loading, error, notifikasi, markRead, markAllRead, refetch };
}
