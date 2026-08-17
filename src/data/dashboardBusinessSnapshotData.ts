// ─── Dashboard Business Snapshot — Data Adapter ────────────────────────────
// DB-009 — Dashboard Business Snapshot
// Mengikuti docs/architecture/DASHBOARD_MODULE_CONSTITUTION.md dan bagian
// "BUSINESS INSIGHT" pada docs/architecture/PROFILE_MODULE_CONSTITUTION.md
// (governing Constitution untuk modul Business Insight di project ini —
// tidak ada file BUSINESS_INSIGHT_CONSTITUTION.md terpisah).
//
// Business Snapshot 100% READ ONLY. Seluruh nilai dibaca langsung dari
// getRingkasanBI() (Business Insight) — TIDAK menghitung ulang logika
// bisnis apapun. Satu-satunya turunan tampilan di sini adalah label
// indikator (Naik/Stabil/Turun), yang HANYA membandingkan dua angka margin
// bulanan yang SUDAH dihitung oleh getMonthlyData() (Business Insight),
// tanpa formula baru — murni visualisasi arah, bukan skor/metrik baru.
//
// Farm Score BELUM memiliki sumber data di Business Insight — kartu ini
// TIDAK diberi nilai buatan sendiri (itu akan melanggar "tidak menghitung
// ulang data" dan "seluruh nilai berasal dari Business Insight"); kartu
// ditampilkan sebagai "Belum tersedia" sampai Business Insight menyediakan
// metrik tersebut.
//
// Batch Aktif dibaca langsung dari BATCH_DB (Batch Module) — sumber yang
// sama dengan Summary Card "Active Batch" (DB-004R), dibaca ulang di sini
// (bukan disalin/di-cache) sesuai larangan duplikasi data permanen.

import { getRingkasanBI, getRecentMonthlyPoints, formatRupiah } from './businessInsightData';
import { BATCH_DB } from './batchData';

// ─── Types ───────────────────────────────────────────────────────────────────

export type BusinessSnapshotState = 'ok' | 'empty' | 'error';

export type TrendIndicator = 'Naik' | 'Stabil' | 'Turun' | null;

export interface BusinessSnapshotMetric {
  id: string;
  icon: string;
  label: string;
  value: string;
  /** Hanya diisi untuk metrik yang punya arah (mis. Profit Trend). */
  indicator?: TrendIndicator;
  /** true bila Business Insight belum menyediakan data untuk metrik ini. */
  belumTersedia?: boolean;
}

export interface BusinessSnapshotResult {
  state: BusinessSnapshotState;
  metrics: BusinessSnapshotMetric[];
}

/**
 * FUTURE READY (belum diimplementasikan pada DB-009):
 * struktur ini disiapkan agar widget dapat menambahkan Grafik Mini,
 * Benchmark, AI Recommendation, dan Trend Mingguan tanpa perlu mengubah
 * bentuk BusinessSnapshotResult di atas — cukup menambah field opsional.
 */
export interface BusinessSnapshotFutureReady {
  miniChart?: unknown;
  benchmark?: unknown;
  aiRecommendation?: unknown;
  weeklyTrend?: unknown;
}

const TREND_AMBANG_STABIL_PERSEN = 3; // di bawah ini dianggap "Stabil", bukan Naik/Turun

/**
 * Menerjemahkan dua titik margin bulanan (sudah dihitung getMonthlyData())
 * menjadi arah Naik/Stabil/Turun untuk visualisasi — tidak ada formula
 * bisnis baru, hanya perbandingan nilai yang sudah tersedia.
 */
function hitungTrendIndicator(activeWorkspaceId?: string): TrendIndicator {
  const bulanan = getRecentMonthlyPoints(2, activeWorkspaceId);
  if (bulanan.length < 2) return null;
  const [prev, current] = bulanan;
  if (prev.margin === 0 && current.margin === 0) return 'Stabil';
  const basis = Math.abs(prev.margin) || 1;
  const deltaPersen = ((current.margin - prev.margin) / basis) * 100;
  if (Math.abs(deltaPersen) < TREND_AMBANG_STABIL_PERSEN) return 'Stabil';
  return deltaPersen > 0 ? 'Naik' : 'Turun';
}

/**
 * Business Snapshot untuk widget Dashboard — maksimal 6 informasi, seluruhnya
 * dibaca live dari Business Insight (getRingkasanBI) + Batch Module (BATCH_DB).
 * Empty state dipicu bila Business Insight belum punya data sama sekali
 * (dataLengkap === false DAN seluruh nilai inti masih nol).
 */
export function getBusinessSnapshot(activeWorkspaceId?: string): BusinessSnapshotResult {
  try {
    const ringkasan = getRingkasanBI('bulan-ini', activeWorkspaceId);
    const batchAktif = Object.values(BATCH_DB).filter((b) => b.status === 'Aktif').length;

    const belumAdaDataSamaSekali =
      !ringkasan.dataLengkap &&
      ringkasan.jumlahTernak === 0 &&
      ringkasan.estimasiNilaiUsaha === 0 &&
      batchAktif === 0;

    if (belumAdaDataSamaSekali) {
      return { state: 'empty', metrics: [] };
    }

    const trend = hitungTrendIndicator(activeWorkspaceId);

    const metrics: BusinessSnapshotMetric[] = [
      {
        id: 'nilai-aset',
        icon: '💰',
        label: 'Estimasi Nilai Aset',
        value: formatRupiah(ringkasan.estimasiNilaiUsaha, true),
      },
      {
        id: 'margin',
        icon: '📈',
        label: 'Margin Usaha',
        value: ringkasan.margin === null ? 'Belum tersedia' : formatRupiah(ringkasan.margin, true),
        belumTersedia: ringkasan.margin === null,
      },
      {
        id: 'profit-trend',
        icon: '📊',
        label: 'Profit Trend',
        value: trend ?? 'Belum tersedia',
        indicator: trend,
        belumTersedia: trend === null,
      },
      {
        id: 'batch-aktif',
        icon: '📦',
        label: 'Batch Aktif',
        value: String(batchAktif),
      },
      {
        id: 'total-livestock',
        icon: '🐑',
        label: 'Total Livestock',
        value: String(ringkasan.jumlahTernak),
      },
      {
        id: 'farm-score',
        icon: '⭐',
        label: 'Farm Score',
        value: 'Belum tersedia',
        belumTersedia: true,
      },
    ];

    return { state: 'ok', metrics };
  } catch {
    return { state: 'error', metrics: [] };
  }
}
