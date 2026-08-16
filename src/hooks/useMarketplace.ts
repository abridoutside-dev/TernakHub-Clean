// ─── useMarketplace Hook — FLOW-003M27 ───────────────────────────────────────
//
// React hook that hydrates workspace-scoped Marketplace data from Supabase.
// Design mirrors useFormula (FLOW-003M20) and useReproduksi (FLOW-003M21):
//
//  Fetches (workspace-scoped):
//    1. marketplace_listings       → seller's own listings (populateListingsFromDb)
//    2. marketplace_transactions   → buyer + seller transactions (populateTransaksiFromDb)
//    3. marketplace_negotiations   → buyer + seller negotiations (populateNegosiasiFromDb)
//
//  Chat rooms / messages are not pre-fetched here; they are loaded
//  per-room in MarketplaceChat.tsx on demand to avoid large data pulls.
//
//  Wishlist: DB schema uses user_id (auth.users), so wishlist hydration
//  is handled separately in pages that have access to currentUser.uid.
//
//  - If DB returns 0 listing rows the in-memory stores are preserved intact
//    (seed data stays visible when DB is empty or not connected).
//  - UUID mapping: registerListingSupabaseIds() and registerTransaksiSupabaseIds()
//    are called after populate so fire-and-forget writes work after hard refresh.
//  - Uses an abort flag to prevent stale-closure races when workspace changes.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import {
  repoGetListingsByWorkspace,
  repoGetTransaksiByWorkspace,
  repoGetNegosiasiByWorkspace,
} from '../repositories/marketplaceRepository';
import { populateListingsFromDb, clearLegacySeedListings } from '../data/marketplaceListingData';
import { populateTransaksiFromDb } from '../data/marketplaceTransaksiData';
import { populateNegosiasiFromDb } from '../data/marketplaceNegosiasiData';
import { populateLaporanFromDb } from '../data/marketplaceLaporanData';
import { populateModerasiFromDb } from '../data/marketplaceModerasiData';
import {
  registerListingSupabaseIds,
  registerTransaksiSupabaseIds,
  registerNegosiasiSupabaseIds,
} from '../services/marketplaceService';
import {
  repoGetLaporanByWorkspace,
  repoGetModerasiAll,
} from '../repositories/marketplaceRepository';

// ─── Result type ──────────────────────────────────────────────────────────────

export interface UseMarketplaceResult {
  /** True while a fetch is in-flight. */
  loading: boolean;
  /** Non-null when the last fetch failed. */
  error: string | null;
  /** Re-fetches from Supabase and refreshes in-memory stores. */
  refresh: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMarketplace(): UseMarketplaceResult {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.workspace_uuid ?? null;

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const abortRef = useRef(false);

  const fetchAll = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      setError(null);
      return;
    }

    abortRef.current = false;
    setLoading(true);
    setError(null);

    try {
      // Fetch all three datasets in parallel — each scoped by workspace_id.
      const [listingRows, transaksiRows, negosiasiRows] = await Promise.all([
        repoGetListingsByWorkspace(workspaceId),
        repoGetTransaksiByWorkspace(workspaceId),
        repoGetNegosiasiByWorkspace(workspaceId),
      ]);

      if (abortRef.current) return;

      // Populate in-memory stores.
      // Guard on listingRows: if DB has no listings for this workspace,
      // keep in-memory seed data intact.
      if (listingRows.length > 0) {
        populateListingsFromDb(listingRows);
        registerListingSupabaseIds(listingRows);
      } else {
        clearLegacySeedListings();
      }

      // Transactions/Negotiations: always merge (empty = no transactions, keep seed)
      if (transaksiRows.length > 0) {
        populateTransaksiFromDb(transaksiRows);
        registerTransaksiSupabaseIds(transaksiRows);
      }

      if (negosiasiRows.length > 0) {
        populateNegosiasiFromDb(negosiasiRows);
        registerNegosiasiSupabaseIds(negosiasiRows);
      }

      // Laporan (moderation reports) — workspace's own reports as reporter
      try {
        const laporanRows = await repoGetLaporanByWorkspace(workspaceId);
        if (laporanRows.length > 0) populateLaporanFromDb(laporanRows);
      } catch { /* non-critical — keep seed data */ }

      // Kasus Moderasi — all moderation cases (admin view)
      try {
        const moderasiRows = await repoGetModerasiAll();
        if (moderasiRows.length > 0) populateModerasiFromDb(moderasiRows);
      } catch { /* non-critical — keep seed data */ }

    } catch (err) {
      if (abortRef.current) return;
      const msg = err instanceof Error ? err.message : 'Gagal memuat data marketplace.';
      console.warn('[useMarketplace] fetch error:', msg);
      setError(msg);
    } finally {
      if (!abortRef.current) setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    abortRef.current = false;
    void fetchAll();
    return () => { abortRef.current = true; };
  }, [fetchAll]);

  const refresh = useCallback(() => {
    abortRef.current = false;
    void fetchAll();
  }, [fetchAll]);

  return { loading, error, refresh };
}
