/**
 * aiInsightBobotData.ts  (CB-SYNC-002)
 * ─────────────────────────────────────────────────────────────────────────────
 * Rule-based AI Insight Engine untuk Modul Catat Bobot.
 *
 * AI is Decision Support only — AI is READ ONLY (see docs/architecture/03_AI_CONSTITUTION.md).
 * Reads existing data from livestockData.ts (LIVESTOCK_DB, getWeightHistory,
 * getAdgThresholds/calculateAdg/isAdgOutsideNormal), transferData.ts (location
 * status) and batchData.ts (active batches) only — TIDAK membuat, mengubah,
 * atau menghapus data apapun, dan TIDAK membuat sumber data baru.
 * Seluruh analisis berbasis aturan deterministik (rule-based), mengikuti pola
 * aiInsightMutasiData.ts (MT-005) / aiInsightBatchData.ts (BT-006) 1:1
 * (kategori ringkasan/analisis/peringatan/rekomendasi/prediksi).
 *
 * Sections:
 *   1. Types
 *   2. Constants & helpers
 *   3. Analytics builder: getBobotAnalytics() — herd-wide aggregates
 *   4. Herd-wide engine: generateBobotInsights()      (CatatBobot.tsx)
 *   5. Per-animal engine: generateBobotInsightsForLivestock()  (RiwayatBobot.tsx)
 */

import {
  LIVESTOCK_DB,
  getWeightHistory,
  getAdgThresholds,
  calculateAdg,
  isAdgOutsideNormal,
  type LivestockRecord,
} from './livestockData';
import { getLivestockStatus } from './transferData';
import { BATCH_DB } from './batchData';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Types
// ═══════════════════════════════════════════════════════════════════════════════

export type InsightLevel    = 'info' | 'warning' | 'critical';
export type InsightCategory = 'ringkasan' | 'analisis' | 'peringatan' | 'rekomendasi' | 'prediksi';

export interface InsightItem {
  id:         string;
  level:      InsightLevel;
  category:   InsightCategory;
  icon:       string;
  title:      string;
  message:    string;
}

export interface BobotAnalytics {
  totalTernakAktif:        number; // non-archived
  totalTernakDenganRiwayat: number; // has at least 1 weight entry
  ditimbangHariIni:        number;
  ditimbangMingguIni:      number;
  rataRataBobot:           number | null; // kg, across ternak with a recorded weight
  beratTertinggi:          { id: string; name: string | null; weight: number } | null;
  beratTerendah:           { id: string; name: string | null; weight: number } | null;
  totalBatchAktif:         number;
  adgAbnormalCount:        number; // animals whose latest interval is outside species ADG range
  belumPernahDitimbang:    number; // active livestock with zero weight history
}

export interface BobotInsightReport {
  analyzedAt:       string;   // ISO timestamp — AI Constitution: Analysis Time
  dataSource:       string[]; // AI Constitution: Data Source
  confidenceStatus: string;   // AI Constitution: Confidence Status (Rule-Based)
  version:          string;   // AI Constitution: Version
  analytics:        BobotAnalytics;
  /** All insight items sorted critical → warning → info */
  items:            InsightItem[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Constants & helpers
// ═══════════════════════════════════════════════════════════════════════════════

const DATA_SOURCE = [
  'Livestock Registry (livestockData.ts)',
  'Weight History (livestockData.ts)',
  'Location Status (transferData.ts)',
  'Batch Registry (batchData.ts)',
];

const VERSION = 'Rule-Based v1';

// Stale weigh-in window — animals with no weighing in this many days are flagged.
const STALE_WEIGHING_DAYS = 60;

let seq = 0;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

function activeLivestock(): LivestockRecord[] {
  return Object.values(LIVESTOCK_DB).filter((lv) => getLivestockStatus(lv.id) !== 'Arsip');
}

/** Parses an Indonesian-formatted date string ("DD Month YYYY") into epoch ms. Returns 0 on failure. */
function idDateMs(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;
  const t = Date.parse(dateStr);
  return isNaN(t) ? 0 : t;
}

function daysSince(dateStr: string | null | undefined): number | null {
  const ms = idDateMs(dateStr);
  if (ms === 0) return null;
  return Math.floor((Date.now() - ms) / 86_400_000);
}

function sortByPriority(items: InsightItem[]): InsightItem[] {
  const rank: Record<InsightLevel, number> = { critical: 0, warning: 1, info: 2 };
  return [...items].sort((a, b) => rank[a.level] - rank[b.level]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Analytics builder — reused by both the AI engine and the module's Summary
//    section (CatatBobot.tsx), so the two never diverge.
// ═══════════════════════════════════════════════════════════════════════════════

export function getBobotAnalytics(): BobotAnalytics {
  const list = activeLivestock();
  const today = new Date();
  const todayKey = today.toDateString();

  let ditimbangHariIni = 0;
  let ditimbangMingguIni = 0;
  let totalTernakDenganRiwayat = 0;
  let belumPernahDitimbang = 0;
  let weightSum = 0;
  let weightCount = 0;
  let adgAbnormalCount = 0;
  let tertinggi: { id: string; name: string | null; weight: number } | null = null;
  let terendah: { id: string; name: string | null; weight: number } | null = null;

  for (const lv of list) {
    const history = getWeightHistory(lv.id);
    if (history.length === 0) {
      belumPernahDitimbang += 1;
      continue;
    }
    totalTernakDenganRiwayat += 1;

    const latest = history[0];
    const latestMs = idDateMs(latest.date);
    if (latestMs > 0) {
      const latestDate = new Date(latestMs);
      if (latestDate.toDateString() === todayKey) ditimbangHariIni += 1;
      if (Date.now() - latestMs <= 7 * 86_400_000) ditimbangMingguIni += 1;
    }

    const w = parseFloat(latest.weight);
    if (!isNaN(w)) {
      weightSum += w;
      weightCount += 1;
      if (!tertinggi || w > tertinggi.weight) tertinggi = { id: lv.id, name: lv.name, weight: w };
      if (!terendah || w < terendah.weight) terendah = { id: lv.id, name: lv.name, weight: w };
    }

    if (history.length >= 2) {
      const [curr, prev] = history;
      const thresholds = getAdgThresholds(lv.type);
      if (thresholds) {
        const adg = calculateAdg(prev.weight, prev.date, curr.weight, curr.date);
        if (adg !== null && isAdgOutsideNormal(adg, thresholds)) adgAbnormalCount += 1;
      }
    }
  }

  return {
    totalTernakAktif: list.length,
    totalTernakDenganRiwayat,
    ditimbangHariIni,
    ditimbangMingguIni,
    rataRataBobot: weightCount > 0 ? weightSum / weightCount : null,
    beratTertinggi: tertinggi,
    beratTerendah: terendah,
    totalBatchAktif: Object.values(BATCH_DB).filter((b) => b.status === 'Aktif').length,
    adgAbnormalCount,
    belumPernahDitimbang,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Herd-wide engine — CatatBobot.tsx
// ═══════════════════════════════════════════════════════════════════════════════

export function generateBobotInsights(): BobotInsightReport {
  seq = 0;
  const analyzedAt = new Date().toISOString();
  const items: InsightItem[] = [];
  const list = activeLivestock();
  const analytics = getBobotAnalytics();

  // ── Ringkasan ────────────────────────────────────────────────────────────
  if (list.length === 0) {
    items.push({
      id: nextId('ringkasan'), level: 'info', category: 'ringkasan', icon: '⚖️',
      title: 'Belum Ada Ternak Terdaftar',
      message: 'Belum ada ternak aktif untuk dianalisis. Tambahkan data ternak untuk mulai mencatat bobot.',
    });
    return { analyzedAt, dataSource: DATA_SOURCE, confidenceStatus: 'Rule-Based', version: VERSION, analytics, items };
  }

  items.push({
    id: nextId('ringkasan'), level: 'info', category: 'ringkasan', icon: '📊',
    title: `Total ${analytics.totalTernakAktif} Ternak Aktif`,
    message:
      `${analytics.totalTernakDenganRiwayat} ternak memiliki riwayat bobot, ` +
      `${analytics.belumPernahDitimbang} belum pernah ditimbang. ` +
      `${analytics.ditimbangHariIni} ditimbang hari ini, ${analytics.ditimbangMingguIni} dalam 7 hari terakhir.`,
  });

  if (analytics.rataRataBobot !== null) {
    items.push({
      id: nextId('ringkasan'), level: 'info', category: 'ringkasan', icon: '⚖️',
      title: 'Rata-rata Bobot Ternak',
      message: `Rata-rata bobot ternak dengan data tercatat adalah ${analytics.rataRataBobot.toFixed(1)} kg.`,
    });
  }

  if (analytics.beratTertinggi && analytics.beratTerendah && analytics.beratTertinggi.id !== analytics.beratTerendah.id) {
    items.push({
      id: nextId('ringkasan'), level: 'info', category: 'ringkasan', icon: '🐄',
      title: 'Bobot Tertinggi & Terendah',
      message:
        `${analytics.beratTertinggi.name ?? analytics.beratTertinggi.id} tercatat paling berat (${analytics.beratTertinggi.weight.toFixed(1)} kg); ` +
        `${analytics.beratTerendah.name ?? analytics.beratTerendah.id} paling ringan (${analytics.beratTerendah.weight.toFixed(1)} kg).`,
    });
  }

  // ── Analisis ─────────────────────────────────────────────────────────────
  if (analytics.totalBatchAktif > 0) {
    items.push({
      id: nextId('analisis'), level: 'info', category: 'analisis', icon: '🧮',
      title: 'Distribusi Batch Aktif',
      message: `${analytics.totalBatchAktif} batch aktif dapat dicatat bobotnya secara kelompok (rata-rata batch, didistribusikan proporsional per individu).`,
    });
  }

  // ── Peringatan ───────────────────────────────────────────────────────────
  if (analytics.adgAbnormalCount > 0) {
    items.push({
      id: nextId('peringatan'), level: 'warning', category: 'peringatan', icon: '⚠️',
      title: 'Perubahan Bobot Tidak Normal',
      message: `${analytics.adgAbnormalCount} ternak memiliki perubahan bobot harian (ADG) di luar kisaran normal spesiesnya pada pencatatan terakhir. Periksa kembali data tersebut.`,
    });
  }

  const staleAnimals = list.filter((lv) => {
    const history = getWeightHistory(lv.id);
    if (history.length === 0) return false;
    const days = daysSince(history[0].date);
    return days !== null && days > STALE_WEIGHING_DAYS;
  });
  if (staleAnimals.length > 0) {
    items.push({
      id: nextId('peringatan'), level: 'warning', category: 'peringatan', icon: '🕐',
      title: 'Penimbangan Terlambat',
      message: `${staleAnimals.length} ternak belum ditimbang lebih dari ${STALE_WEIGHING_DAYS} hari. Jadwalkan penimbangan ulang untuk memantau pertumbuhan secara akurat.`,
    });
  }

  if (analytics.belumPernahDitimbang > 0) {
    items.push({
      id: nextId('peringatan'), level: analytics.belumPernahDitimbang > analytics.totalTernakDenganRiwayat ? 'warning' : 'info',
      category: 'peringatan', icon: '📋',
      title: 'Belum Pernah Ditimbang',
      message: `${analytics.belumPernahDitimbang} ternak aktif belum memiliki satu pun riwayat bobot.`,
    });
  }

  // ── Rekomendasi ──────────────────────────────────────────────────────────
  if (analytics.belumPernahDitimbang > 0 || staleAnimals.length > 0) {
    items.push({
      id: nextId('rekomendasi'), level: 'info', category: 'rekomendasi', icon: '💡',
      title: 'Prioritaskan Penimbangan',
      message: 'Catat bobot untuk ternak yang belum pernah ditimbang atau sudah lama tidak ditimbang agar data pertumbuhan tetap akurat.',
    });
  }
  if (analytics.adgAbnormalCount > 0) {
    items.push({
      id: nextId('rekomendasi'), level: 'info', category: 'rekomendasi', icon: '🩺',
      title: 'Verifikasi Perubahan Bobot Ekstrem',
      message: 'Untuk ternak dengan ADG di luar kisaran normal, periksa kondisi kesehatan atau pola pakan yang mungkin memengaruhi bobot.',
    });
  }

  // ── Prediksi ─────────────────────────────────────────────────────────────
  if (analytics.totalTernakDenganRiwayat >= 2 && analytics.rataRataBobot !== null) {
    items.push({
      id: nextId('prediksi'), level: 'info', category: 'prediksi', icon: '📦',
      title: 'Estimasi Bobot Berkelanjutan',
      message: 'Estimasi tren pertumbuhan per ternak tersedia di halaman Riwayat Bobot masing-masing ternak, berdasarkan data penimbangan yang tercatat.',
    });
  }

  return { analyzedAt, dataSource: DATA_SOURCE, confidenceStatus: 'Rule-Based', version: VERSION, analytics, items: sortByPriority(items) };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Per-animal engine — RiwayatBobot.tsx
// ═══════════════════════════════════════════════════════════════════════════════

export function generateBobotInsightsForLivestock(livestockId: string): BobotInsightReport {
  seq = 0;
  const analyzedAt = new Date().toISOString();
  const items: InsightItem[] = [];
  const lv = LIVESTOCK_DB[livestockId];
  const history = getWeightHistory(livestockId);
  const analytics = getBobotAnalytics(); // herd-wide context, reused for the report's dataSource contract

  if (!lv || history.length === 0) {
    items.push({
      id: nextId('ringkasan'), level: 'info', category: 'ringkasan', icon: '📋',
      title: 'Belum Ada Data Bobot',
      message: 'Analisis tren pertumbuhan akan tersedia setelah riwayat bobot ternak ini tercatat.',
    });
    return { analyzedAt, dataSource: DATA_SOURCE, confidenceStatus: 'Rule-Based', version: VERSION, analytics, items };
  }

  const latest = history[0];
  items.push({
    id: nextId('ringkasan'), level: 'info', category: 'ringkasan', icon: '⚖️',
    title: 'Bobot Terakhir Tercatat',
    message: `${latest.weight} ${latest.unit} pada ${latest.date}. Total ${history.length} kali pencatatan bobot.`,
  });

  if (history.length >= 2) {
    const [curr, prev] = history;
    const thresholds = getAdgThresholds(lv.type);
    const adg = calculateAdg(prev.weight, prev.date, curr.weight, curr.date);

    if (adg !== null) {
      const adgLabel = `${adg >= 0 ? '+' : ''}${adg.toFixed(2)} kg/hari`;
      if (thresholds && isAdgOutsideNormal(adg, thresholds)) {
        items.push({
          id: nextId('peringatan'), level: 'warning', category: 'peringatan', icon: '⚠️',
          title: 'Perubahan Bobot Di Luar Normal',
          message: `Perubahan bobot terakhir (${adgLabel}) berada di luar kisaran normal untuk ${lv.type} (${thresholds.minKgPerDay} s.d. ${thresholds.maxKgPerDay} kg/hari). Pastikan hasil penimbangan sudah benar.`,
        });
      } else {
        items.push({
          id: nextId('analisis'), level: 'info', category: 'analisis', icon: '📈',
          title: 'Laju Pertumbuhan Normal',
          message: `Perubahan bobot terakhir (${adgLabel}) berada dalam kisaran normal untuk ${lv.type}.`,
        });
      }
    }

    const first = history[history.length - 1];
    const totalGain = parseFloat(latest.weight) - parseFloat(first.weight);
    items.push({
      id: nextId('prediksi'), level: 'info', category: 'prediksi', icon: '📦',
      title: 'Total Kenaikan Bobot',
      message: `${totalGain >= 0 ? '+' : ''}${totalGain.toFixed(1)} ${latest.unit} sejak pencatatan pertama (${first.date}).`,
    });
  } else {
    items.push({
      id: nextId('rekomendasi'), level: 'info', category: 'rekomendasi', icon: '💡',
      title: 'Catat Bobot Secara Berkala',
      message: 'Analisis tren pertumbuhan (ADG) akan tersedia setelah pencatatan bobot kedua dilakukan.',
    });
  }

  const daysSinceLast = daysSince(latest.date);
  if (daysSinceLast !== null && daysSinceLast > STALE_WEIGHING_DAYS) {
    items.push({
      id: nextId('peringatan'), level: 'warning', category: 'peringatan', icon: '🕐',
      title: 'Penimbangan Terlambat',
      message: `Sudah ${daysSinceLast} hari sejak penimbangan terakhir. Jadwalkan penimbangan ulang untuk memantau pertumbuhan.`,
    });
  }

  return { analyzedAt, dataSource: DATA_SOURCE, confidenceStatus: 'Rule-Based', version: VERSION, analytics, items: sortByPriority(items) };
}
