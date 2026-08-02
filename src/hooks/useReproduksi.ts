// ─── useReproduksi Hook — FLOW-003M21 ─────────────────────────────────────────
//
// React hook that provides workspace-scoped reproduksi data from Supabase.
// Design mirrors useFormula (FLOW-003M20) and useHealth (FLOW-003M3):
//
//  - Fetches all 8 reproduksi tables in a single Promise.all (no N+1 queries).
//  - Populates in-memory stores in dependency order so that denormalized fields
//    (KelahiranRecord.programId/damId, WeaningRecord.kelahiranId/programId/damId)
//    resolve correctly at populate-time.
//
//  Population order (each depends on the previous being in-memory):
//    1. Programs   (reproduksi_programs)        → PROGRAM_REPRODUKSI_DB
//    2. Pelaksanaan (pelaksanaan_reproduksi)     → PELAKSANAAN_REPRODUKSI_DB
//    3. Monitoring  (monitoring_reproduksi)      → MONITORING_REPRODUKSI_DB
//    4. Pemeriksaan (pemeriksaan_kebuntingan)    → PEMERIKSAAN_KEBUNTINGAN_DB
//    5. Kebuntingan (kebuntingan)                → KEBUNTINGAN_DB
//    6. Kelahiran + Anak (kelahiran +            → KELAHIRAN_DB + ANAK_DB
//                         registrasi_anak)
//    7. Sapih       (sapih)                      → SAPIH_DB
//
//  - If DB returns 0 program rows the in-memory stores are preserved intact
//    (seed / in-memory data remains visible when DB is empty or disconnected).
//  - Uses an abort flag to prevent stale-closure races when workspace changes.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import {
  repoGetProgramsByWorkspace,
  repoGetPelaksanaanByWorkspace,
  repoGetMonitoringByWorkspace,
  repoGetPemeriksaanByWorkspace,
  repoGetKebuntinganByWorkspace,
  repoGetKelahiranByWorkspace,
  repoGetRegistrasiAnakByWorkspace,
  repoGetSapihByWorkspace,
} from '../repositories/reproduksiRepository';
import { populateProgramsFromDb }               from '../data/reproduksiProgramData';
import { populatePelaksanaanFromDb }             from '../data/pelaksanaanReproduksiData';
import { populateMonitoringFromDb }              from '../data/monitoringReproduksiData';
import { populatePemeriksaanKebuntinganFromDb }  from '../data/pemeriksaanKebuntinganData';
import { populateKebuntinganFromDb, populateKebuntinganMonitoringFromDb } from '../data/kebuntinganData';
import { populateKelahiranFromDb }               from '../data/kelahiranData';
import { populateSapihFromDb }                   from '../data/sapihData';

// ─── Result type ──────────────────────────────────────────────────────────────

export interface UseReproduksiResult {
  /** True while a fetch is in-flight. */
  loading: boolean;
  /** Non-null when the last fetch failed. */
  error: string | null;
  /** Re-fetches from Supabase and refreshes all in-memory stores. */
  refresh: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useReproduksi(): UseReproduksiResult {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.workspace_uuid ?? null;

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Abort flag — prevents stale-closure races when workspace changes mid-fetch.
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
      // 1. Fetch all 8 tables in parallel — all scoped by workspace_id so
      //    no FK fan-out queries are needed.
      const [
        programRows,
        pelaksanaanRows,
        monitoringRows,
        pemeriksaanRows,
        kebuntinganRows,
        kelahiranRows,
        anakRows,
        sapihRows,
      ] = await Promise.all([
        repoGetProgramsByWorkspace(workspaceId),
        repoGetPelaksanaanByWorkspace(workspaceId),
        repoGetMonitoringByWorkspace(workspaceId),
        repoGetPemeriksaanByWorkspace(workspaceId),
        repoGetKebuntinganByWorkspace(workspaceId),
        repoGetKelahiranByWorkspace(workspaceId),
        repoGetRegistrasiAnakByWorkspace(workspaceId),
        repoGetSapihByWorkspace(workspaceId),
      ]);

      if (abortRef.current) return;

      // 2. Populate in dependency order.
      //    Guard on programRows: if DB has no programs, keep in-memory data.
      if (programRows.length > 0) {
        populateProgramsFromDb(programRows);
        populatePelaksanaanFromDb(pelaksanaanRows);
        populateMonitoringFromDb(monitoringRows);
        // KebuntinganMonitoring reuses monitoring_reproduksi rows (event_type='Monitoring Kebuntingan')
        // so no extra DB fetch is needed — same rows, separate populate pass.
        populateKebuntinganMonitoringFromDb(monitoringRows);
        populatePemeriksaanKebuntinganFromDb(pemeriksaanRows);
        populateKebuntinganFromDb(kebuntinganRows);
        // kelahiran needs KEBUNTINGAN_DB → always after populateKebuntinganFromDb.
        populateKelahiranFromDb(kelahiranRows, anakRows);
        // sapih needs ANAK_DB + KELAHIRAN_DB → always after populateKelahiranFromDb.
        populateSapihFromDb(sapihRows);
      }
      // If programRows.length === 0: DB empty / not connected — keep seed data.

    } catch (err) {
      if (abortRef.current) return;
      const msg = err instanceof Error ? err.message : 'Gagal memuat data reproduksi.';
      console.warn('[useReproduksi] fetch error:', msg);
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
