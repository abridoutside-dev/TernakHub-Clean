// ─── useStokInventaris Hook — FLOW-003M16 ────────────────────────────────────
//
// React hook that provides workspace-scoped inventory data from Supabase.
//
// Design (mirrors useStokObat — FLOW-003M8):
//  - Fetches stok_inventaris rows for the active workspace on mount / workspace change.
//  - Converts DB rows → raw InventarisItem shapes and populates the in-memory
//    RAW_INVENTARIS array (via populateInventarisFromDb) so that existing utility
//    functions (getInventarisList, getInventarisById, etc.) work without modification.
//  - Re-fetches whenever the active workspace changes.
//  - Uses an abort flag to prevent stale-closure races.
//  - If DB returns 0 rows (DB not connected, table empty, or no auth), the
//    in-memory seed data is preserved intact (default behaviour — StokPakan Farm).
//
//  - When clearOnEmpty=true (Toko Pakan production path): the store is cleared
//    on empty DB results — Supabase is the sole source of truth; no seed fallback.
//
// Notes metadata round-trip:
//  - stokInventarisService serialises display fields (brand, supplier, lokasiPenyimpanan,
//    referensiId, hargaBeli, tanggalMasuk, catatan, formulaNama, kategori) into the
//    notes column as JSON (keys: b, sup, loc, rid, hp, tm, c, fn, kat).
//  - toRawItem() parses those fields back so fully-hydrated InventarisItem records
//    are available after a hard refresh.

import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import {
  repoGetStokInventarisByWorkspace,
  repoGetTransactionsByWorkspace,
} from '../repositories/stokInventarisRepository';
import type { StokInventarisDbRow } from '../types/stokInventaris';
import {
  populateInventarisFromDb,
  populateTransactionsFromDb,
  type InventarisSumber,
} from '../data/stokInventarisData';

// ─── Notes metadata parser ────────────────────────────────────────────────────

interface ParsedMeta {
  brand:        string;
  supplier:     string;
  lokasi:       string;
  referensiId:  string;
  hargaBeli:    number | undefined;
  tanggalMasuk: string;
  catatan:      string;
  formulaNama:  string;
  kategori:     string;
}

function parseNotesMeta(notes: string | null): ParsedMeta {
  const defaults: ParsedMeta = {
    brand: '', supplier: '', lokasi: '', referensiId: '', hargaBeli: undefined,
    tanggalMasuk: '', catatan: '', formulaNama: '', kategori: '',
  };
  if (!notes) return defaults;
  try {
    const m = JSON.parse(notes) as Record<string, unknown>;
    if (!m || typeof m !== 'object') return defaults;
    return {
      brand:        typeof m.b   === 'string' ? m.b   : '',
      supplier:     typeof m.sup === 'string' ? m.sup : '',
      lokasi:       typeof m.loc === 'string' ? m.loc : '',
      referensiId:  typeof m.rid === 'string' ? m.rid : '',
      hargaBeli:    typeof m.hp  === 'number' ? m.hp  : undefined,
      tanggalMasuk: typeof m.tm  === 'string' ? m.tm  : '',
      catatan:      typeof m.c   === 'string' ? m.c   : '',
      formulaNama:  typeof m.fn  === 'string' ? m.fn  : '',
      kategori:     typeof m.kat === 'string' ? m.kat : '',
    };
  } catch {
    return defaults;
  }
}

function formatUpdatedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Baru saja';
  const now     = new Date();
  const diffMs  = now.getTime() - d.getTime();
  const diffH   = Math.floor(diffMs / 3_600_000);
  const diffD   = Math.floor(diffMs / 86_400_000);
  if (diffH < 1)  return 'Baru saja';
  if (diffH < 24) return `${diffH} jam lalu`;
  if (diffD < 7)  return `${diffD} hari lalu`;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Convert a DB row to the shape expected by populateInventarisFromDb. */
function toRawItem(row: StokInventarisDbRow): Parameters<typeof populateInventarisFromDb>[0][number] {
  const meta    = parseNotesMeta(row.notes);
  const sumber: InventarisSumber =
    row.source_type === 'Formula'
      ? 'Hasil Produksi'
      : (row.source_type as InventarisSumber);

  return {
    id:                 row.id,                       // DB UUID becomes in-memory id
    nama:               row.item_name,
    brand:              meta.brand      || undefined,
    kategori:           meta.kategori   || row.source_type,
    sumber,
    jumlahStok:         Number(row.quantity),
    satuan:             row.unit        || 'Kg',
    terakhirDiperbarui: formatUpdatedAt(row.updated_at),
    referensiId:        meta.referensiId || undefined,
    hargaBeli:          meta.hargaBeli,
    supplier:           meta.supplier   || undefined,
    lokasiPenyimpanan:  meta.lokasi     || undefined,
    tanggalMasuk:       meta.tanggalMasuk || undefined,
    catatan:            meta.catatan    || undefined,
    formulaNama:        meta.formulaNama || undefined,
    statusAktif:        (row.status === 'Aktif' ? 'Aktif' : 'Nonaktif') as 'Aktif' | 'Nonaktif',
    diarsipkan:         row.status !== 'Aktif',
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseStokInventarisResult {
  loading: boolean;
  error:   string | null;
  refresh: () => void;
}

export interface UseStokInventarisOptions {
  /**
   * When true (Toko Pakan production path): Supabase is the sole source of truth.
   * If DB returns 0 rows, the in-memory store is cleared — no seed fallback.
   * Default false preserves backward compatibility (StokPakan Farm seed data).
   */
  clearOnEmpty?: boolean;
}

export function useStokInventaris(opts?: UseStokInventarisOptions): UseStokInventarisResult {
  const { activeWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [, setTick]           = useState(0);
  const clearOnEmpty          = opts?.clearOnEmpty ?? false;

  const fetchData = useCallback(async (aborted: { current: boolean }) => {
    if (!activeWorkspace?.workspace_uuid) return;
    setLoading(true);
    setError(null);
    try {
      const [rows, txRows] = await Promise.all([
        repoGetStokInventarisByWorkspace(activeWorkspace.workspace_uuid),
        repoGetTransactionsByWorkspace(activeWorkspace.workspace_uuid),
      ]);
      if (aborted.current) return;
      // Always call populate — populateInventarisFromDb/populateTransactionsFromDb
      // handle the clearOnEmpty logic internally.
      populateInventarisFromDb(rows.map(toRawItem), clearOnEmpty);
      populateTransactionsFromDb(txRows, clearOnEmpty);
      setTick(t => t + 1);
    } catch (err) {
      if (!aborted.current) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat stok inventaris.';
        console.warn('[useStokInventaris] fetch error:', msg);
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
