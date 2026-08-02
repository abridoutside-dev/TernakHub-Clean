// ─── useStokObat Hook — FLOW-003M8 ───────────────────────────────────────────
//
// React hook that provides workspace-scoped stock data from Supabase.
//
// Design:
//  - Fetches stok_obat rows for the active workspace on mount / workspace change.
//  - Converts DB rows → StokObatItem shapes and populates the in-memory
//    STOK_OBAT_ITEMS array so that existing utility functions
//    (getActiveStokObatList, getStokObatById, etc.) work without modification.
//  - Re-fetches whenever the active workspace changes.
//  - Uses an abort flag to prevent stale-closure races.
//
// Metadata round-trip:
//  - stokObatService.addStokItem() serialises display fields (brand, bentukSediaan,
//    kemasan, produkKomersialUuid, masterObatUuid) into the notes column as JSON.
//  - toStokObatItem() parses those fields back so fully-hydrated StokObatItem
//    records are available after a hard refresh.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { repoGetStokObatByWorkspace } from '../repositories/stokObatRepository';
import type { StokObatDbRow } from '../types/stokObat';

// Legacy in-memory store — populated here so existing stok obat pages work.
import { STOK_OBAT_ITEMS, type StokObatItem } from '../data/stokObatData';

// ─── Conversion helpers ───────────────────────────────────────────────────────

/**
 * Parses the notes column written by stokObatService.addStokItem().
 * Expected format: {"b":"brand","s":"bentukSediaan","k":"kemasan","p":"pkUuid","o":"moUuid"}
 * Returns empty strings for any field that cannot be parsed.
 */
function parseNotesMetadata(notes: string | null): {
  brand: string;
  bentukSediaan: string;
  kemasan: string;
  produkKomersialUuid: string;
  masterObatUuid: string;
} {
  const defaults = { brand: '', bentukSediaan: '', kemasan: '', produkKomersialUuid: '', masterObatUuid: '' };
  if (!notes) return defaults;
  try {
    const meta = JSON.parse(notes) as Record<string, unknown>;
    if (!meta || typeof meta !== 'object') return defaults;
    return {
      brand:               typeof meta.b === 'string' ? meta.b : '',
      bentukSediaan:       typeof meta.s === 'string' ? meta.s : '',
      kemasan:             typeof meta.k === 'string' ? meta.k : '',
      produkKomersialUuid: typeof meta.p === 'string' ? meta.p : '',
      masterObatUuid:      typeof meta.o === 'string' ? meta.o : (typeof meta.drug_id === 'string' ? meta.drug_id : ''),
    };
  } catch {
    return defaults;
  }
}

/**
 * Converts a StokObatDbRow (Supabase) to a StokObatItem (in-memory).
 *
 * Display fields (brand, bentukSediaan, kemasan, produkKomersialUuid, masterObatUuid)
 * are recovered from the notes JSON written by stokObatService.addStokItem().
 * For rows inserted before M8 (seed data, manual inserts) these will be empty strings
 * — a safe fallback that the UI handles gracefully.
 */
function toStokObatItem(row: StokObatDbRow): StokObatItem {
  const meta = parseNotesMetadata(row.notes);

  return {
    uuid:                row.id,
    workspaceUuid:       row.workspace_id,
    produkKomersialUuid: meta.produkKomersialUuid,
    masterObatUuid:      meta.masterObatUuid || row.drug_id || '',
    brand:               meta.brand,
    namaProduk:          row.drug_name,
    bentukSediaan:       meta.bentukSediaan,
    kemasan:             meta.kemasan,
    lokasiPenyimpanan:   row.location ?? undefined,
    jumlah:              row.quantity,
    satuan:              row.unit,
    // tanggalMasuk is not stored separately in the DB — use created_at date.
    tanggalMasuk:        row.created_at.split('T')[0],
    tanggalExpired:      row.expiry_date ?? null,
    nomorBatch:          row.batch_number ?? undefined,
    // Map stok_status_enum to StokObatItem's statusAktif / diarsipkan flags.
    statusAktif:         row.status === 'Diarsipkan' ? 'Nonaktif' : 'Aktif',
    diarsipkan:          row.status === 'Diarsipkan',
  };
}

// ─── Hook result type ─────────────────────────────────────────────────────────

export interface UseStokObatResult {
  /** All stok_obat items for the active workspace (newest first). */
  stokObat: StokObatItem[];
  /** True while a fetch is in-flight. */
  isLoading: boolean;
  /** Non-null when the last fetch failed. */
  error: string | null;
  /** Re-fetches from Supabase and refreshes the in-memory STOK_OBAT_ITEMS store. */
  refresh: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStokObat(): UseStokObatResult {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.workspace_uuid ?? null;

  const [stokObat, setStokObat] = useState<StokObatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  // Abort flag — prevents stale-closure races when workspace changes mid-fetch.
  const abortRef = useRef(false);

  const fetchAll = useCallback(async () => {
    if (!workspaceId) {
      // No active workspace — do not wipe the seed data; just stop loading.
      setStokObat([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    abortRef.current = false;
    setIsLoading(true);
    setError(null);

    try {
      const rows = await repoGetStokObatByWorkspace(workspaceId);

      if (abortRef.current) return; // workspace changed mid-flight

      const items: StokObatItem[] = rows.map(toStokObatItem);

      // Repopulate in-memory store so getActiveStokObatList() / getStokObatById()
      // return Supabase-sourced data for any component that reads them.
      STOK_OBAT_ITEMS.length = 0;
      for (const item of items) STOK_OBAT_ITEMS.push(item);

      setStokObat(items);
    } catch (err) {
      if (abortRef.current) return;
      const msg = err instanceof Error ? err.message : 'Gagal memuat data stok obat.';
      console.error('[useStokObat]', err);
      setError(msg);
    } finally {
      if (!abortRef.current) setIsLoading(false);
    }
  }, [workspaceId]);

  // Re-fetch whenever workspace changes (or on first mount).
  useEffect(() => {
    void fetchAll();
    return () => {
      abortRef.current = true;
    };
  }, [fetchAll]);

  const refresh = useCallback(() => {
    void fetchAll();
  }, [fetchAll]);

  return { stokObat, isLoading, error, refresh };
}
