/**
 * aiInsightMutasiData.ts  (MT-005)
 * ─────────────────────────────────────────────────────────────────────────────
 * Rule-based AI Insight & Analytics Engine untuk Modul Mutasi.
 *
 * AI is Decision Support only — AI is READ ONLY (see docs/architecture/03_AI_CONSTITUTION.md).
 * Reads existing data from MT-002..MT-004 (mutasiData.ts) only — TIDAK membuat,
 * mengubah, atau menghapus data apapun, dan TIDAK membuat sumber data baru.
 * Seluruh analisis berbasis aturan deterministik (rule-based), mengikuti pola
 * modul insight lain (kategori ringkasan/analisis/peringatan/
 * rekomendasi/prediksi).
 *
 * Sections:
 *   1. Types (Insight + Analytics)
 *   2. Helper utilities
 *   3. Analytics builder: getMutasiAnalytics()  — chart-ready aggregates
 *   4. Insight engine: generateMutasiInsights()
 */

import {
  getMutationList,
  getMutationSummary,
  getMutationTarget,
  getMutationDirection,
  MUTATION_EVENT_LOG,
  INCOMING_MUTATION_TYPES,
  OUTGOING_MUTATION_TYPES,
  type MutationRecord,
  type MutationType,
} from './mutasiData';
import { getLivestock } from './livestockData';
import { getBatch } from './batchData';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Types
// ═══════════════════════════════════════════════════════════════════════════════

export type InsightLevel    = 'info' | 'warning' | 'critical';
export type InsightCategory = 'ringkasan' | 'analisis' | 'peringatan' | 'rekomendasi' | 'prediksi';

export interface InsightItem {
  id:            string;
  level:         InsightLevel;
  category:      InsightCategory;
  icon:          string;
  title:         string;
  message:       string;
  subjectLabel?: string;
}

export interface MonthlyMutationPoint {
  month:  string; // yyyy-mm
  masuk:  number;
  keluar: number;
  total:  number;
}

export interface CountBucket {
  label: string;
  count: number;
}

export interface MutasiAnalytics {
  monthly:            MonthlyMutationPoint[]; // last ANALYTICS_MONTH_WINDOW months, oldest → newest
  byType:              CountBucket[];           // Completed only, desc by count
  byLocation:          CountBucket[];           // destination location, Completed only, desc by count
  byOwner:             CountBucket[];           // destination owner, Completed only, desc by count
  modeStats: {
    individu: number;
    batch:    number;
  };
}

export interface MutasiInsightReport {
  analyzedAt:       string;   // ISO timestamp — AI Constitution: Analysis Time
  dataSource:       string[]; // AI Constitution: Data Source
  confidenceStatus: string;   // AI Constitution: Confidence Status (Rule-Based)
  version:          string;   // AI Constitution: Version
  analytics:        MutasiAnalytics;
  /** All insight items sorted critical → warning → info */
  items:            InsightItem[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Helper utilities
// ═══════════════════════════════════════════════════════════════════════════════

const DATA_SOURCE = [
  'Mutation Request & Workflow (MT-002/MT-003)',
  'Mutation Execution & Notifications (MT-004)',
];

const VERSION = 'Rule-Based v1';

// ── Thresholds — murni ambang batas rule-based, tidak mengubah data ─────────
const LONG_PENDING_DAYS       = 7;  // Pending/Approved tanpa progres
const RELOCATION_WINDOW_DAYS  = 90; // jendela "frequent relocation"
const RELOCATION_THRESHOLD    = 3;  // jumlah mutasi Completed dalam jendela di atas
const ANOMALY_WINDOW_DAYS     = 14; // jendela "moved repeatedly in a short period"
const ANOMALY_THRESHOLD       = 2;  // jumlah mutasi Completed dalam jendela di atas → anomali
const DRAFT_STALE_DAYS        = 3;  // Draft yang belum diajukan & masih ada field kosong
const ANALYTICS_MONTH_WINDOW  = 6;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(fromDate: string, toDate: string): number {
  return Math.round((Date.parse(toDate) - Date.parse(fromDate)) / 86_400_000);
}

function targetLabel(record: MutationRecord): string {
  const { livestock, batch } = getMutationTarget(record);
  if (livestock) return livestock.name ?? record.livestockId ?? 'Livestock';
  if (batch) return batch.name ?? record.batchId ?? 'Batch';
  return 'target tidak diketahui';
}

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // yyyy-mm
}

let seq = 0;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

function topBuckets(counts: Map<string, number>, limit = 5): CountBucket[] {
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Analytics builder — chart-ready aggregates, reused by both the AI engine
//    and (if a future roadmap wires charts) the UI directly.
// ═══════════════════════════════════════════════════════════════════════════════

export function getMutasiAnalytics(): MutasiAnalytics {
  const list = getMutationList();
  const completed = list.filter((m) => m.status === 'Completed');

  // Monthly mutation chart data — last ANALYTICS_MONTH_WINDOW months, oldest → newest.
  const today = new Date();
  const months: string[] = [];
  for (let i = ANALYTICS_MONTH_WINDOW - 1; i >= 0; i -= 1) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  const monthly: MonthlyMutationPoint[] = months.map((month) => {
    const inMonth = completed.filter((m) => monthKey(m.effectiveDate || m.updatedDate) === month);
    const masuk  = inMonth.filter((m) => getMutationDirection(m.mutationType) === 'Masuk').length;
    const keluar = inMonth.filter((m) => getMutationDirection(m.mutationType) === 'Keluar').length;
    return { month, masuk, keluar, total: inMonth.length };
  });

  // Mutation by type (Completed only).
  const typeCounts = new Map<string, number>();
  for (const m of completed) typeCounts.set(m.mutationType, (typeCounts.get(m.mutationType) ?? 0) + 1);
  const byType = topBuckets(typeCounts, 20);

  // Mutation by location (destination, Completed only).
  const locationCounts = new Map<string, number>();
  for (const m of completed) {
    if (!m.destinationLocation) continue;
    locationCounts.set(m.destinationLocation, (locationCounts.get(m.destinationLocation) ?? 0) + 1);
  }
  const byLocation = topBuckets(locationCounts, 20);

  // Mutation by owner (destination, Completed only — "farms" are modeled as owners/workspaces).
  const ownerCounts = new Map<string, number>();
  for (const m of completed) {
    if (!m.destinationOwner) continue;
    ownerCounts.set(m.destinationOwner, (ownerCounts.get(m.destinationOwner) ?? 0) + 1);
  }
  const byOwner = topBuckets(ownerCounts, 20);

  // Batch vs Individual statistics — across all requests, any status.
  const modeStats = {
    individu: list.filter((m) => m.mode === 'individu').length,
    batch:    list.filter((m) => m.mode === 'batch').length,
  };

  return { monthly, byType, byLocation, byOwner, modeStats };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Main engine
// ═══════════════════════════════════════════════════════════════════════════════

export function generateMutasiInsights(): MutasiInsightReport {
  seq = 0;
  const today      = todayStr();
  const analyzedAt = new Date().toISOString();
  const items: InsightItem[] = [];

  // ── Load data (read-only) ───────────────────────────────────────────────
  const list      = getMutationList();
  const summary   = getMutationSummary(); // reused, never recomputed here
  const completed = list.filter((m) => m.status === 'Completed');
  const analytics = getMutasiAnalytics(); // reused for monthly trend + buckets

  // ── AI SUMMARY (ringkasan) ───────────────────────────────────────────────
  items.push({
    id: nextId('ringkasan'), level: 'info', category: 'ringkasan', icon: '📥',
    title: 'Mutasi Masuk',
    message: summary.masuk > 0
      ? `${summary.masuk} mutasi masuk telah selesai diproses.`
      : 'Belum ada mutasi masuk yang selesai diproses.',
  });
  items.push({
    id: nextId('ringkasan'), level: 'info', category: 'ringkasan', icon: '📤',
    title: 'Mutasi Keluar',
    message: summary.keluar > 0
      ? `${summary.keluar} mutasi keluar telah selesai diproses.`
      : 'Belum ada mutasi keluar yang selesai diproses.',
  });
  items.push({
    id: nextId('ringkasan'), level: summary.pending > 0 ? 'warning' : 'info', category: 'ringkasan', icon: '⏳',
    title: 'Mutasi Pending',
    message: summary.pending > 0
      ? `${summary.pending} Mutation Request menunggu persetujuan/eksekusi.`
      : 'Tidak ada Mutation Request yang menunggu saat ini.',
  });
  items.push({
    id: nextId('ringkasan'), level: 'info', category: 'ringkasan', icon: '✅',
    title: 'Mutasi Selesai',
    message: `${summary.selesai} Mutation Request telah selesai (Completed) dari total ${list.length} request.`,
  });
  items.push({
    id: nextId('ringkasan'), level: 'info', category: 'ringkasan', icon: '🧮',
    title: 'Individu vs Batch',
    message: (analytics.modeStats.individu + analytics.modeStats.batch) > 0
      ? `${analytics.modeStats.individu} request mode Individu · ${analytics.modeStats.batch} request mode Batch.`
      : 'Belum ada Mutation Request yang tercatat.',
  });

  // ── AI ANALYSIS (analisis) ───────────────────────────────────────────────

  // Mutation trend — last month vs previous month (from analytics.monthly, reused).
  if (analytics.monthly.length >= 2) {
    const lastMonth = analytics.monthly[analytics.monthly.length - 1];
    const prevMonth = analytics.monthly[analytics.monthly.length - 2];
    let trendMsg: string;
    let level: InsightLevel = 'info';
    if (prevMonth.total === 0 && lastMonth.total === 0) {
      trendMsg = 'Belum cukup data mutasi untuk menganalisis tren bulanan.';
    } else if (lastMonth.total > prevMonth.total) {
      trendMsg = `Tren mutasi meningkat — ${lastMonth.total} mutasi bulan ini (${lastMonth.month}), sebelumnya ${prevMonth.total} (${prevMonth.month}).`;
    } else if (lastMonth.total < prevMonth.total) {
      trendMsg = `Tren mutasi menurun — ${lastMonth.total} mutasi bulan ini (${lastMonth.month}), sebelumnya ${prevMonth.total} (${prevMonth.month}).`;
    } else {
      trendMsg = `Tren mutasi stabil — ${lastMonth.total} mutasi bulan ini (${lastMonth.month}).`;
    }
    items.push({ id: nextId('analisis'), level, category: 'analisis', icon: '📈', title: 'Tren Mutasi Bulanan', message: trendMsg });
  }

  // Incoming vs outgoing ratio (reuses getMutationSummary — no re-derivation).
  if (summary.masuk + summary.keluar > 0) {
    const total = summary.masuk + summary.keluar;
    const masukPct = Math.round((summary.masuk / total) * 100);
    items.push({
      id: nextId('analisis'), level: 'info', category: 'analisis', icon: '⚖️',
      title: 'Rasio Mutasi Masuk vs Keluar',
      message: `Rasio ${summary.masuk}:${summary.keluar} (Masuk ${masukPct}% dari total mutasi selesai).`,
    });
  } else {
    items.push({
      id: nextId('analisis'), level: 'info', category: 'analisis', icon: '⚖️',
      title: 'Rasio Mutasi Masuk vs Keluar',
      message: 'Belum ada mutasi selesai untuk dihitung rasionya.',
    });
  }

  // Most frequent mutation type (reuses analytics.byType).
  if (analytics.byType.length > 0) {
    const top = analytics.byType[0];
    items.push({
      id: nextId('analisis'), level: 'info', category: 'analisis', icon: '🏷️',
      title: 'Jenis Mutasi Paling Sering',
      message: `"${top.label}" adalah jenis mutasi paling sering (${top.count} dari ${completed.length} mutasi selesai).`,
    });
  }

  // Farms with highest incoming livestock.
  const incomingOwnerCounts = new Map<string, number>();
  for (const m of completed) {
    if (getMutationDirection(m.mutationType) !== 'Masuk' || !m.destinationOwner) continue;
    incomingOwnerCounts.set(m.destinationOwner, (incomingOwnerCounts.get(m.destinationOwner) ?? 0) + 1);
  }
  const topIncomingFarms = topBuckets(incomingOwnerCounts, 3);
  if (topIncomingFarms.length > 0) {
    items.push({
      id: nextId('analisis'), level: 'info', category: 'analisis', icon: '🏆',
      title: 'Farm dengan Mutasi Masuk Tertinggi',
      message: topIncomingFarms.map((f) => `${f.label} (${f.count})`).join(', '),
    });
  }

  // Farms with highest outgoing livestock.
  const outgoingOwnerCounts = new Map<string, number>();
  for (const m of completed) {
    if (getMutationDirection(m.mutationType) !== 'Keluar' || !m.sourceOwner) continue;
    outgoingOwnerCounts.set(m.sourceOwner, (outgoingOwnerCounts.get(m.sourceOwner) ?? 0) + 1);
  }
  const topOutgoingFarms = topBuckets(outgoingOwnerCounts, 3);
  if (topOutgoingFarms.length > 0) {
    items.push({
      id: nextId('analisis'), level: 'info', category: 'analisis', icon: '🏆',
      title: 'Farm dengan Mutasi Keluar Tertinggi',
      message: topOutgoingFarms.map((f) => `${f.label} (${f.count})`).join(', '),
    });
  }

  // Livestock with frequent relocation (Completed, individual mode, within RELOCATION_WINDOW_DAYS).
  const relocationCounts = new Map<string, number>();
  for (const m of completed) {
    if (m.mode !== 'individu' || !m.livestockId) continue;
    const since = daysBetween(m.effectiveDate || m.updatedDate, today);
    if (since >= 0 && since <= RELOCATION_WINDOW_DAYS) {
      relocationCounts.set(m.livestockId, (relocationCounts.get(m.livestockId) ?? 0) + 1);
    }
  }
  const frequentRelocation = Array.from(relocationCounts.entries())
    .filter(([, count]) => count >= RELOCATION_THRESHOLD)
    .sort((a, b) => b[1] - a[1]);
  if (frequentRelocation.length > 0) {
    const [topLivestockId, topCount] = frequentRelocation[0];
    items.push({
      id: nextId('analisis'), level: 'info', category: 'analisis', icon: '🔁',
      title: 'Ternak dengan Mutasi Berulang',
      subjectLabel: getLivestock(topLivestockId)?.name ?? topLivestockId,
      message: `${frequentRelocation.length} ternak dimutasi ≥${RELOCATION_THRESHOLD} kali dalam ${RELOCATION_WINDOW_DAYS} hari terakhir. Tertinggi: ${getLivestock(topLivestockId)?.name ?? topLivestockId} (${topCount}x).`,
    });
  }

  // ── AI WARNING (peringatan) ──────────────────────────────────────────────

  // Long pending mutation detection.
  const longPending = list.filter((m) => (m.status === 'Pending' || m.status === 'Approved') && daysBetween(m.updatedDate, today) >= LONG_PENDING_DAYS);
  for (const m of longPending) {
    const overdue = daysBetween(m.updatedDate, today);
    items.push({
      id: nextId('peringatan'), level: overdue >= LONG_PENDING_DAYS * 2 ? 'critical' : 'warning', category: 'peringatan', icon: '⏰',
      title: 'Mutasi Menunggu Terlalu Lama',
      subjectLabel: targetLabel(m),
      message: `Mutation Request untuk ${targetLabel(m)} (${m.mutationType}) sudah ${overdue} hari berstatus ${m.status} tanpa tindak lanjut.`,
    });
  }

  // Duplicate mutation warning — defensive audit; creation already blocks this,
  // this only ever fires if the invariant is violated (e.g. seeded data).
  const openByTarget = new Map<string, MutationRecord[]>();
  for (const m of list) {
    if (m.status !== 'Draft' && m.status !== 'Pending' && m.status !== 'Approved') continue;
    const key = m.mode === 'individu' ? `individu:${m.livestockId}` : `batch:${m.batchId}`;
    const arr = openByTarget.get(key) ?? [];
    arr.push(m);
    openByTarget.set(key, arr);
  }
  for (const [, records] of openByTarget) {
    if (records.length > 1) {
      items.push({
        id: nextId('peringatan'), level: 'critical', category: 'peringatan', icon: '🔴',
        title: 'Duplikasi Mutation Request',
        subjectLabel: targetLabel(records[0]),
        message: `${targetLabel(records[0])} memiliki ${records.length} Mutation Request aktif secara bersamaan — periksa integritas data.`,
      });
    }
  }

  // Invalid destination — defensive audit for any active (non-terminal) record.
  const invalidDestination = list.filter((m) => {
    if (m.status === 'Completed' || m.status === 'Rejected' || m.status === 'Cancelled') return false;
    const dest = (m.destinationLocation ?? '').trim();
    const src  = (m.sourceLocation ?? '').trim();
    return !dest || (src && dest.toLowerCase() === src.toLowerCase());
  });
  for (const m of invalidDestination) {
    items.push({
      id: nextId('peringatan'), level: m.status === 'Draft' ? 'info' : 'critical', category: 'peringatan', icon: '📍',
      title: 'Destination Location Tidak Valid',
      subjectLabel: targetLabel(m),
      message: `Mutation Request untuk ${targetLabel(m)} memiliki Destination Location kosong atau sama dengan Source Location (status: ${m.status}).`,
    });
  }

  // Livestock moved repeatedly in a short period — anomaly-style, shorter window than "frequent relocation".
  const shortWindowCounts = new Map<string, MutationRecord[]>();
  for (const m of completed) {
    if (m.mode !== 'individu' || !m.livestockId) continue;
    const since = daysBetween(m.effectiveDate || m.updatedDate, today);
    if (since >= 0 && since <= ANOMALY_WINDOW_DAYS) {
      const arr = shortWindowCounts.get(m.livestockId) ?? [];
      arr.push(m);
      shortWindowCounts.set(m.livestockId, arr);
    }
  }
  for (const [livestockId, records] of shortWindowCounts) {
    if (records.length >= ANOMALY_THRESHOLD) {
      items.push({
        id: nextId('peringatan'), level: 'warning', category: 'peringatan', icon: '⚠️',
        title: 'Ternak Berpindah Berulang dalam Waktu Singkat',
        subjectLabel: getLivestock(livestockId)?.name ?? livestockId,
        message: `${getLivestock(livestockId)?.name ?? livestockId} dimutasi ${records.length}x dalam ${ANOMALY_WINDOW_DAYS} hari terakhir — periksa kemungkinan kesalahan input atau penyalahgunaan.`,
      });
    }
  }

  // Missing required information — stale Draft with incomplete required fields.
  const staleDrafts = list.filter((m) => {
    if (m.status !== 'Draft') return false;
    if (daysBetween(m.createdDate, today) < DRAFT_STALE_DAYS) return false;
    return !m.mutationDate || !m.effectiveDate || !m.sourceLocation || !m.destinationLocation
      || !m.sourceOwner || !m.destinationOwner || !m.officer;
  });
  for (const m of staleDrafts) {
    const missing: string[] = [];
    if (!m.mutationDate) missing.push('Mutation Date');
    if (!m.effectiveDate) missing.push('Effective Date');
    if (!m.sourceLocation) missing.push('Source Location');
    if (!m.destinationLocation) missing.push('Destination Location');
    if (!m.sourceOwner) missing.push('Source Owner');
    if (!m.destinationOwner) missing.push('Destination Owner');
    if (!m.officer) missing.push('Officer');
    items.push({
      id: nextId('peringatan'), level: 'warning', category: 'peringatan', icon: '📝',
      title: 'Informasi Mutasi Belum Lengkap',
      subjectLabel: targetLabel(m),
      message: `Draft untuk ${targetLabel(m)} sudah ${daysBetween(m.createdDate, today)} hari belum diajukan — field belum lengkap: ${missing.join(', ')}.`,
    });
  }

  // Mutation anomaly detection — spike in daily Mutation Created events vs recent average.
  if (MUTATION_EVENT_LOG.length >= 5) {
    const created = MUTATION_EVENT_LOG.filter((e) => e.eventType === 'Mutation Created');
    const byDay = new Map<string, number>();
    for (const e of created) byDay.set(e.timestamp, (byDay.get(e.timestamp) ?? 0) + 1);
    const counts = Array.from(byDay.values());
    if (counts.length >= 3) {
      const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
      const variance = counts.reduce((a, b) => a + (b - mean) ** 2, 0) / counts.length;
      const stdDev = Math.sqrt(variance);
      const threshold = mean + 2 * stdDev;
      for (const [day, count] of byDay) {
        if (stdDev > 0 && count > threshold && count >= 3) {
          items.push({
            id: nextId('peringatan'), level: 'warning', category: 'peringatan', icon: '🚨',
            title: 'Anomali Volume Mutasi',
            message: `Terdeteksi lonjakan tidak biasa: ${count} Mutation Request dibuat pada ${day} (rata-rata harian ${mean.toFixed(1)}).`,
          });
        }
      }
    }
  }

  // ── AI RECOMMENDATION (rekomendasi) — derived from warnings above ────────
  const warningTitles = new Set(items.filter((i) => i.category === 'peringatan').map((i) => i.title));

  if (warningTitles.has('Mutasi Menunggu Terlalu Lama')) {
    items.push({
      id: nextId('rekomendasi'), level: 'info', category: 'rekomendasi', icon: '💡',
      title: 'Segera Tindak Lanjuti Mutasi Pending',
      message: 'Setujui, tolak, atau eksekusi Mutation Request yang sudah lama berstatus Pending/Approved.',
    });
  }
  if (warningTitles.has('Duplikasi Mutation Request')) {
    items.push({
      id: nextId('rekomendasi'), level: 'info', category: 'rekomendasi', icon: '💡',
      title: 'Selesaikan Duplikasi Mutation Request',
      message: 'Batalkan salah satu Mutation Request yang duplikat untuk target yang sama sebelum melanjutkan.',
    });
  }
  if (warningTitles.has('Destination Location Tidak Valid')) {
    items.push({
      id: nextId('rekomendasi'), level: 'info', category: 'rekomendasi', icon: '💡',
      title: 'Perbaiki Destination Location',
      message: 'Lengkapi atau perbaiki Destination Location sebelum Mutation Request diajukan/dieksekusi.',
    });
  }
  if (warningTitles.has('Ternak Berpindah Berulang dalam Waktu Singkat')) {
    items.push({
      id: nextId('rekomendasi'), level: 'info', category: 'rekomendasi', icon: '💡',
      title: 'Tinjau Pola Mutasi Ternak',
      message: 'Periksa alasan perpindahan berulang pada ternak terkait — pastikan tidak ada kesalahan pencatatan.',
    });
  }
  if (warningTitles.has('Informasi Mutasi Belum Lengkap')) {
    items.push({
      id: nextId('rekomendasi'), level: 'info', category: 'rekomendasi', icon: '💡',
      title: 'Lengkapi Draft Mutasi',
      message: 'Lengkapi field yang masih kosong pada Draft Mutation Request agar dapat diajukan.',
    });
  }
  if (warningTitles.has('Anomali Volume Mutasi')) {
    items.push({
      id: nextId('rekomendasi'), level: 'info', category: 'rekomendasi', icon: '💡',
      title: 'Verifikasi Lonjakan Mutasi',
      message: 'Tinjau Mutation Request yang dibuat pada tanggal dengan lonjakan volume tidak biasa.',
    });
  }

  // ── AI PREDICTION (prediksi) ─────────────────────────────────────────────

  // Predicted next-month volume — average of the last 3 available months.
  const recentMonths = analytics.monthly.slice(-3);
  if (recentMonths.length > 0) {
    const avg = recentMonths.reduce((a, b) => a + b.total, 0) / recentMonths.length;
    items.push({
      id: nextId('prediksi'), level: 'info', category: 'prediksi', icon: '📅',
      title: 'Prediksi Volume Mutasi Bulan Depan',
      message: avg > 0
        ? `Perkiraan ≈${Math.round(avg)} mutasi bulan depan, berdasarkan rata-rata ${recentMonths.length} bulan terakhir. Informasional, bukan kepastian.`
        : 'Belum cukup data untuk memprediksi volume mutasi bulan depan.',
    });
  }

  // Next mutation likely type — most frequent type reused from analytics.byType.
  if (analytics.byType.length > 0) {
    const top = analytics.byType[0];
    items.push({
      id: nextId('prediksi'), level: 'info', category: 'prediksi', icon: '🔮',
      title: 'Prediksi Jenis Mutasi Berikutnya',
      message: `Berdasarkan pola historis, jenis mutasi yang paling mungkin muncul berikutnya adalah "${top.label}". Informasional, bukan kepastian.`,
    });
  }

  // Active workload gauge.
  const workload = summary.pending;
  const workloadLabel = workload === 0 ? 'Tidak Ada' : workload <= 3 ? 'Rendah' : workload <= 8 ? 'Sedang' : 'Tinggi';
  items.push({
    id: nextId('prediksi'), level: 'info', category: 'prediksi', icon: '📦',
    title: 'Beban Kerja Mutasi Aktif',
    message: `Beban kerja saat ini: ${workloadLabel} (${workload} Mutation Request menunggu persetujuan/eksekusi).`,
  });

  // ── Sort: critical → warning → info ─────────────────────────────────────
  const levelRank: Record<InsightLevel, number> = { critical: 0, warning: 1, info: 2 };
  items.sort((a, b) => levelRank[a.level] - levelRank[b.level]);

  return {
    analyzedAt,
    dataSource: DATA_SOURCE,
    confidenceStatus: 'Rule-Based',
    version: VERSION,
    analytics,
    items,
  };
}
