// ─── useHealth Hook — FLOW-003M3 ─────────────────────────────────────────────
//
// React hook that provides workspace-scoped health data from Supabase.
//
// Design:
//  - Fetches health_checkups, health_treatments, health_control_schedules
//    in one parallel Promise.all to avoid N+1 queries.
//  - Converts DB rows → legacy app-layer shapes (PemeriksaanRecord) and
//    populates the in-memory store (PEMERIKSAAN_DB) so that existing utility
//    functions (getPemeriksaan, getPemeriksaanList, etc.) work without modification.
//  - NOTE: DIAGNOSA_DB, TINDAKAN_SESI_DB, PENGOBATAN_SESI_DB, KONTROL_RECORDS
//    are populated by UI mutations in-memory (legacy path) and are NOT hydrated
//    from Supabase in this hook. Full hydration of those stores is planned for
//    a subsequent FLOW when those tables are added to the schema.
//  - Re-fetches whenever the active workspace changes.
//  - Uses an abort flag to prevent stale-closure races.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import {
  repoGetCheckupsByWorkspace,
  repoGetTreatmentsByWorkspace,
  repoGetControlSchedulesByWorkspace,
} from '../repositories/healthRepository';
import type {
  HealthCheckupDbRow,
  HealthTreatmentDbRow,
  HealthControlScheduleDbRow,
} from '../types/health';

// Legacy in-memory store — populated here so existing health pages work.
import { PEMERIKSAAN_DB, type PemeriksaanRecord } from '../data/pemeriksaanKesehatanData';

// ─── Conversion helpers ───────────────────────────────────────────────────────

/**
 * Parses the `findings` column (built by healthService.buildFindings) back
 * into keluhan + gejala.
 *
 * Format written by healthService.ts:
 *   "Keluhan: {keluhan}\nGejala: {gejala}"
 * Both lines are optional (either may be absent if blank at write time).
 */
function parseFindings(findings: string | null): { keluhan: string; gejala: string } {
  if (!findings) return { keluhan: '', gejala: '' };

  let keluhan = '';
  let gejala = '';

  for (const line of findings.split('\n')) {
    if (line.startsWith('Keluhan: ')) {
      keluhan = line.slice('Keluhan: '.length);
    } else if (line.startsWith('Gejala: ')) {
      gejala = line.slice('Gejala: '.length);
    } else if (!keluhan) {
      // Legacy findings written without the prefix — treat entire text as keluhan.
      keluhan = findings;
      break;
    }
  }

  return { keluhan, gejala };
}

/**
 * Converts a HealthCheckupDbRow (Supabase) to a PemeriksaanRecord (in-memory).
 *
 * Fields that have no DB equivalent default to '' (blank strings) so that the
 * existing UI components that rely on PemeriksaanRecord can still render safely.
 */
function toCheckupRecord(row: HealthCheckupDbRow): PemeriksaanRecord {
  const { keluhan, gejala } = parseFindings(row.findings);

  // Derive status from whether a diagnosis has been recorded.
  const status: PemeriksaanRecord['status'] = row.diagnosis
    ? 'Siap Diagnosa'
    : 'Draft';

  // BCS stored as integer 1–9 in DB; UI uses '1'–'5' string union.
  const bcsRaw = row.body_condition_score;
  const bcs: PemeriksaanRecord['bcs'] =
    bcsRaw != null && bcsRaw >= 1 && bcsRaw <= 5
      ? (String(bcsRaw) as '1' | '2' | '3' | '4' | '5')
      : '';

  return {
    id:           row.id,
    mode:         'individu', // batch mode not stored in health_checkups
    livestockId:  row.livestock_id,
    batchId:      null,
    tanggal:      row.checkup_date,
    petugas:      row.examiner ?? '',
    keluhan,
    gejala,
    suhuTubuh:    row.temperature != null ? String(row.temperature) : '',
    nafsuMakan:   '', // not stored separately in DB
    aktivitas:    '', // not stored separately in DB
    kondisiFeses: '', // not stored separately in DB
    bcs,
    bobot:        row.weight_kg != null ? String(row.weight_kg) : '',
    catatan:      row.notes ?? '',
    status,
    createdAt:    row.created_at,
    updatedAt:    row.created_at, // health_checkups has no updated_at column
  };
}

// ─── Hook result type ─────────────────────────────────────────────────────────

export interface UseHealthResult {
  /** All health checkups for the active workspace (newest first). */
  checkups: PemeriksaanRecord[];
  /** Raw DB treatment rows — used by healthService callers that need IDs. */
  treatments: HealthTreatmentDbRow[];
  /** Raw DB control schedule rows — upcoming follow-ups for the workspace. */
  controlSchedules: HealthControlScheduleDbRow[];
  /** True while a fetch is in-flight. */
  isLoading: boolean;
  /** Non-null when the last fetch failed. */
  error: string | null;
  /** Re-fetches from Supabase and refreshes in-memory stores. */
  refresh: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useHealth(): UseHealthResult {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.workspace_uuid ?? null;

  const [checkups,         setCheckups]         = useState<PemeriksaanRecord[]>([]);
  const [treatments,       setTreatments]       = useState<HealthTreatmentDbRow[]>([]);
  const [controlSchedules, setControlSchedules] = useState<HealthControlScheduleDbRow[]>([]);
  const [isLoading,        setIsLoading]        = useState(true);
  const [error,            setError]            = useState<string | null>(null);

  // Abort flag — prevents stale-closure races when workspace changes mid-fetch.
  const abortRef = useRef(false);

  const fetchAll = useCallback(async () => {
    if (!workspaceId) {
      // No active workspace — clear in-memory store and stop loading.
      PEMERIKSAAN_DB.length = 0;
      setCheckups([]);
      setTreatments([]);
      setControlSchedules([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    abortRef.current = false;
    setIsLoading(true);
    setError(null);

    try {
      // Parallel fetch — no N+1 queries.
      const [checkupRows, treatmentRows, scheduleRows] = await Promise.all([
        repoGetCheckupsByWorkspace(workspaceId),
        repoGetTreatmentsByWorkspace(workspaceId),
        repoGetControlSchedulesByWorkspace(workspaceId),
      ]);

      if (abortRef.current) return; // workspace changed mid-flight

      // ── Convert and populate PEMERIKSAAN_DB ────────────────────────────────
      const checkupRecords: PemeriksaanRecord[] = checkupRows.map(toCheckupRecord);

      PEMERIKSAAN_DB.length = 0;
      for (const r of checkupRecords) PEMERIKSAAN_DB.push(r);

      setCheckups(checkupRecords);
      setTreatments(treatmentRows);
      setControlSchedules(scheduleRows);
    } catch (err) {
      if (abortRef.current) return;
      const msg = err instanceof Error ? err.message : 'Gagal memuat data kesehatan.';
      console.error('[useHealth]', err);
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

  return { checkups, treatments, controlSchedules, isLoading, error, refresh };
}
