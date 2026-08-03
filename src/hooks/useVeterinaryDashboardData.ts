// ─── useVeterinaryDashboardData — ADMIN-SYNC-007 ─────────────────────────────
//
// Shared data hook untuk Veterinary Dashboard & Operational.
// Digunakan oleh DokterHewanDashboard, KlinikHewanDashboard,
// DokterHewanOperational, dan KlinikHewanOperational.
//
// Tabel LIVE (semua dari Supabase):
//   - workspaces              → workspace name/meta
//   - health_checkups         → Pemeriksaan, Pasien, Kunjungan, Diagnosis
//   - health_treatments       → Tindakan, Resep, Obat
//   - health_control_schedules → Jadwal
//   - activity_log            → Aktivitas workspace

import { useState, useEffect, useCallback } from 'react';
import { repoGetWorkspaceByUuid } from '../repositories/workspaceRepository';
import {
  repoGetCheckupsByWorkspace,
  repoGetTreatmentsByWorkspace,
  repoGetControlSchedulesByWorkspace,
} from '../repositories/healthRepository';
import { repoGetActivityLogByWorkspace } from '../repositories/activityLogRepository';
import type { WorkspaceRecord } from '../types/workspace';
import type {
  HealthCheckupDbRow,
  HealthTreatmentDbRow,
  HealthControlScheduleDbRow,
} from '../types/health';
import type { ActivityLogDbRow } from '../types/activityLog';

// ─── Data shape ───────────────────────────────────────────────────────────────

export interface VeterinaryDashboardData {
  /** Workspace info dari tabel workspaces */
  workspace: WorkspaceRecord | null;
  /** Semua pemeriksaan dari health_checkups */
  checkups: HealthCheckupDbRow[];
  /** Semua tindakan dari health_treatments */
  treatments: HealthTreatmentDbRow[];
  /** Semua jadwal dari health_control_schedules */
  schedules: HealthControlScheduleDbRow[];
  /** Log aktivitas workspace */
  activities: ActivityLogDbRow[];
}

export interface UseVeterinaryDashboardDataResult {
  data: VeterinaryDashboardData;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Jadwal mendatang (status=Terjadwal, tanggal >= hari ini), urut ascending. */
export function getUpcomingSchedules(
  schedules: HealthControlScheduleDbRow[],
): HealthControlScheduleDbRow[] {
  const today = new Date().toISOString().slice(0, 10);
  return schedules
    .filter((s) => s.status === 'Terjadwal' && s.scheduled_date >= today)
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
}

/** Pemeriksaan yang sudah memiliki diagnosis. */
export function getDiagnosedCheckups(
  checkups: HealthCheckupDbRow[],
): HealthCheckupDbRow[] {
  return checkups.filter((c) => c.diagnosis !== null && c.diagnosis.trim() !== '');
}

/** Tindakan yang melibatkan obat (drug_name atau drug_id ada). */
export function getDrugTreatments(
  treatments: HealthTreatmentDbRow[],
): HealthTreatmentDbRow[] {
  return treatments.filter((t) => t.drug_name !== null || t.drug_id !== null);
}

/** Tindakan yang memiliki biaya (cost > 0). */
export function getTransaksiWithCost(
  treatments: HealthTreatmentDbRow[],
): HealthTreatmentDbRow[] {
  return treatments.filter((t) => t.cost !== null && t.cost > 0);
}

/** Total biaya dari semua tindakan yang memiliki cost. */
export function getTotalBiaya(treatments: HealthTreatmentDbRow[]): number {
  return treatments.reduce((sum, t) => sum + (t.cost ?? 0), 0);
}

/** Jumlah livestock_id unik dari checkups (proxy pasien unik). */
export function getUniquePasienCount(checkups: HealthCheckupDbRow[]): number {
  return new Set(checkups.map((c) => c.livestock_id)).size;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(value);
}

export function formatRelativeTime(isoString: string): string {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '-';
  const now    = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffM  = Math.floor(diffMs / 60_000);
  const diffH  = Math.floor(diffMs / 3_600_000);
  const diffD  = Math.floor(diffMs / 86_400_000);
  if (diffM  < 1)  return 'Baru saja';
  if (diffM  < 60) return `${diffM} menit lalu`;
  if (diffH  < 24) return `${diffH} jam lalu`;
  if (diffD  < 7)  return `${diffD} hari lalu`;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

export function formatTanggal(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Empty default ────────────────────────────────────────────────────────────

const EMPTY_DATA: VeterinaryDashboardData = {
  workspace:  null,
  checkups:   [],
  treatments: [],
  schedules:  [],
  activities: [],
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVeterinaryDashboardData(
  workspaceId: string,
): UseVeterinaryDashboardDataResult {
  const [data,    setData]    = useState<VeterinaryDashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetchData = useCallback(async (aborted: { current: boolean }) => {
    if (!workspaceId) {
      setData(EMPTY_DATA);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [workspace, checkups, treatments, schedules, activities] = await Promise.all([
        repoGetWorkspaceByUuid(workspaceId).catch(() => null),
        repoGetCheckupsByWorkspace(workspaceId).catch(() => []),
        repoGetTreatmentsByWorkspace(workspaceId).catch(() => []),
        repoGetControlSchedulesByWorkspace(workspaceId).catch(() => []),
        repoGetActivityLogByWorkspace(workspaceId, 20).catch(() => []),
      ]);

      if (aborted.current) return;

      setData({ workspace, checkups, treatments, schedules, activities });
    } catch (err) {
      if (!aborted.current) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat data Veterinary.';
        console.warn('[useVeterinaryDashboardData] fetch error:', msg);
        setError(msg);
      }
    } finally {
      if (!aborted.current) setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    const aborted = { current: false };
    void fetchData(aborted);
    return () => { aborted.current = true; };
  }, [fetchData]);

  const refresh = useCallback(() => {
    const aborted = { current: false };
    void fetchData(aborted);
  }, [fetchData]);

  return { data, loading, error, refresh };
}
