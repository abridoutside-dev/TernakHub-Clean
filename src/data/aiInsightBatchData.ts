/**
 * aiInsightBatchData.ts  (BT-001 → BT-006)
 * ─────────────────────────────────────────────────────────────────────────────
 * Rule-based AI Insight Engine untuk Modul Batch.
 *
 * BT-001: Initial engine (ringkasan, analisis, peringatan, rekomendasi, prediksi).
 * BT-006: Extended to consume BT-005 Analytics + History layers, adding:
 *   - Richer Summary (largest / smallest / recently-updated / needs-attention)
 *   - Full Analysis suite (growth trend, weight, feed efficiency, health,
 *     mutation, utilization, population stability)
 *   - Detailed Warnings (no recent activity, rapid loss, missing records,
 *     repeated mutation)
 *   - Rule-based Recommendations (weight recording, feeding eval, health exam,
 *     restructuring, closure, merge, split)
 *
 * AI is Decision Support only — AI is READ ONLY (see docs/architecture/03_AI_CONSTITUTION.md).
 * Reads existing data from batchData.ts, batchAnalyticsData.ts, batchHistoryData.ts,
 * batchOperationsData.ts, livestockData.ts.
 * TIDAK membuat, mengubah, atau menghapus data apapun.
 * Seluruh analisis berbasis aturan deterministik (rule-based).
 */

import {
  BATCH_DB,
  MEMBERSHIP_DB,
  getActiveBatchMemberships,
  getActiveBatchMembersWithLivestock,
  type BatchRecord,
} from './batchData';
import {
  getBatchAnalytics,
  getBatchGrowthTrend,
} from './batchAnalyticsData';
import {
  parseIdDate,
} from './batchHistoryData';
import {
  BATCH_OPERATION_LOG,
  getBatchOperationLog,
} from './batchOperationsData';
import { LIVESTOCK_DB } from './livestockData';

// ─── Types ────────────────────────────────────────────────────────────────────
// Public API unchanged from BT-001 — callers (BatchList.tsx, BatchRiwayat.tsx)
// import these types directly; do not rename or restructure.

export type InsightLevel    = 'info' | 'warning' | 'critical';
export type InsightCategory = 'ringkasan' | 'analisis' | 'peringatan' | 'rekomendasi' | 'prediksi';

export interface InsightItem {
  id:       string;
  level:    InsightLevel;
  category: InsightCategory;
  icon:     string;
  title:    string;
  message:  string;
}

export interface BatchInsightReport {
  analyzedAt:       string;    // ISO timestamp — AI Constitution: Analysis Time
  dataSource:       string[];  // AI Constitution: Data Source
  confidenceStatus: string;    // AI Constitution: Confidence Status (Rule-Based)
  version:          string;    // AI Constitution: Version
  items:            InsightItem[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DATA_SOURCE = [
  'Batch Registry (batchData.ts)',
  'Membership Registry (batchData.ts)',
  'Batch Analytics (batchAnalyticsData.ts)',       // BT-006
  'Batch History (batchHistoryData.ts)',            // BT-006
  'Batch Operations Log (batchOperationsData.ts)', // BT-006
  'Livestock Registry (livestockData.ts)',          // BT-006
];
const VERSION = 'Rule-Based v2 (BT-006)';

// 30-day activity window for "recent activity" checks
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Epoch ms from an Indonesian date label. Returns 0 on parse failure. */
function idDateMs(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;
  return parseIdDate(dateStr);
}

/** Epoch ms from an ISO timestamp string. Returns 0 on failure. */
function isoMs(isoStr: string | null | undefined): number {
  if (!isoStr) return 0;
  const t = new Date(isoStr).getTime();
  return isNaN(t) ? 0 : t;
}

/** Returns all active batches. */
function activeBatches(): BatchRecord[] {
  return Object.values(BATCH_DB).filter((b) => b.status === 'Aktif');
}

/** Returns active member count for each batch {batchId→count}. */
function activeMemberCountByBatch(): Map<string, number> {
  const map = new Map<string, number>();
  for (const b of Object.values(BATCH_DB)) {
    map.set(b.id, getActiveBatchMemberships(b.id).length);
  }
  return map;
}

/** Returns the batch with fewest active members (> 0). */
function smallestActiveBatch(
  batches: BatchRecord[],
  counts: Map<string, number>,
): { batch: BatchRecord; count: number } | null {
  let best: { batch: BatchRecord; count: number } | null = null;
  for (const b of batches) {
    const count = counts.get(b.id) ?? 0;
    if (count === 0) continue;
    if (!best || count < best.count) best = { batch: b, count };
  }
  return best;
}

/** Most-recently-updated active batch (by updatedDate). */
function mostRecentlyUpdated(batches: BatchRecord[]): BatchRecord | null {
  let best: BatchRecord | null = null;
  let bestMs = 0;
  for (const b of batches) {
    const ms = idDateMs(b.updatedDate);
    if (ms > bestMs) { bestMs = ms; best = b; }
  }
  return best;
}

/** Average weight (kg) across all active members in a batch. Returns null if no valid data. */
function avgWeightForBatch(batchId: string): number | null {
  const members = getActiveBatchMembersWithLivestock(batchId);
  if (members.length === 0) return null;
  let sum = 0, n = 0;
  for (const { lv } of members) {
    const w = parseFloat(lv.weight);
    if (!isNaN(w)) { sum += w; n++; }
  }
  return n > 0 ? sum / n : null;
}

/** Most recent operation startedAt (epoch ms) for a batch. Returns 0 if none. */
function lastOperationMs(batchId: string): number {
  const ops = getBatchOperationLog(batchId);
  if (ops.length === 0) return 0;
  return Math.max(...ops.map((o) => isoMs(o.startedAt)));
}

/** Most recent membership event (join or leave) for a batch (epoch ms). Returns 0 if none. */
function lastMembershipEventMs(batchId: string): number {
  const records = MEMBERSHIP_DB.filter((m) => m.batchId === batchId);
  if (records.length === 0) return 0;
  const dates = records.flatMap((m) => [
    idDateMs(m.joinDate),
    m.leaveDate ? idDateMs(m.leaveDate) : 0,
  ]);
  return Math.max(...dates);
}

/** Count of members who left (Keluar/Dipindahkan) a batch in the last N ms. */
function recentMemberRemovals(batchId: string, windowMs: number): number {
  const since = Date.now() - windowMs;
  return MEMBERSHIP_DB.filter(
    (m) =>
      m.batchId === batchId &&
      (m.status === 'Keluar' || m.status === 'Dipindahkan') &&
      m.leaveDate !== null &&
      idDateMs(m.leaveDate) >= since,
  ).length;
}

/** Whether a batch has had ANY activity in the last N ms. */
function hasRecentActivity(batchId: string, windowMs: number): boolean {
  const since = Date.now() - windowMs;
  return lastOperationMs(batchId) >= since || lastMembershipEventMs(batchId) >= since;
}

/** Operation count by type for a batch. */
function opCountByType(batchId: string, type: string): number {
  return getBatchOperationLog(batchId).filter((o) => o.type === type).length;
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export function generateBatchInsights(): BatchInsightReport {
  const analyzedAt = new Date().toISOString();
  const items: InsightItem[] = [];

  // Pull live data once — AI reads, never writes
  const analytics   = getBatchAnalytics();
  const growthTrend = getBatchGrowthTrend();
  const allBatches  = Object.values(BATCH_DB);
  const aktifList   = activeBatches();
  const memberCounts = activeMemberCountByBatch();
  const now         = Date.now();

  const selesai    = analytics.closedBatchCount;
  const dibatalkan = allBatches.filter((b) => b.status === 'Dibatalkan').length;
  const diarsipkan = analytics.archivedBatchCount;
  const totalMembers = analytics.totalActiveMembers;

  // ── Ringkasan ───────────────────────────────────────────────────────────────

  if (allBatches.length === 0) {
    items.push({
      id: 'bt-no-data',
      level: 'info', category: 'ringkasan', icon: '📋',
      title: 'Belum Ada Batch',
      message: 'Belum ada batch yang dibuat. Buat batch pertama untuk mulai mengelola ternak secara berkelompok.',
    });
  } else {
    // Overall summary
    items.push({
      id: 'bt-summary',
      level: 'info', category: 'ringkasan', icon: '📊',
      title: `Total ${allBatches.length} Batch Terdaftar`,
      message:
        `${analytics.activeBatchCount} batch aktif dengan ${totalMembers} anggota. ` +
        `${selesai} selesai, ${dibatalkan} dibatalkan, ${diarsipkan} diarsipkan. ` +
        `Rata-rata ${analytics.averageMembersPerActiveBatch.toFixed(1)} anggota per batch aktif.`,
    });

    // Largest active batch
    if (analytics.largestActiveBatch && analytics.largestActiveBatch.memberCount > 0) {
      items.push({
        id: 'bt-largest-batch',
        level: 'info', category: 'ringkasan', icon: '🐄',
        title: 'Batch Terbesar',
        message: `"${analytics.largestActiveBatch.batchLabel}" memiliki ${analytics.largestActiveBatch.memberCount} anggota aktif terbanyak.`,
      });
    }

    // Smallest active batch (excluding empty ones)
    const smallest = smallestActiveBatch(aktifList, memberCounts);
    if (smallest && analytics.largestActiveBatch && smallest.batch.id !== analytics.largestActiveBatch.batchId) {
      items.push({
        id: 'bt-smallest-batch',
        level: 'info', category: 'ringkasan', icon: '🔹',
        title: 'Batch Terkecil',
        message: `"${smallest.batch.name ?? smallest.batch.id}" memiliki ${smallest.count} anggota aktif paling sedikit.`,
      });
    }

    // Recently updated batch
    const recentBatch = mostRecentlyUpdated(aktifList);
    if (recentBatch) {
      items.push({
        id: 'bt-recently-updated',
        level: 'info', category: 'ringkasan', icon: '🕐',
        title: 'Batch Terakhir Diperbarui',
        message: `"${recentBatch.name ?? recentBatch.id}" — terakhir diperbarui ${recentBatch.updatedDate}.`,
      });
    }

    // Batches requiring attention (empty OR inactive)
    const needAttention = aktifList.filter(
      (b) => (memberCounts.get(b.id) ?? 0) === 0 || !hasRecentActivity(b.id, THIRTY_DAYS_MS),
    );
    if (needAttention.length > 0) {
      items.push({
        id: 'bt-needs-attention',
        level: 'warning', category: 'ringkasan', icon: '🔔',
        title: `${needAttention.length} Batch Memerlukan Perhatian`,
        message: `${needAttention.map((b) => b.name ?? b.id).join(', ')} — tidak ada aktivitas dalam 30 hari terakhir atau tidak memiliki anggota.`,
      });
    }
  }

  // ── Analisis ────────────────────────────────────────────────────────────────

  if (aktifList.length > 0) {
    // Most-members batch (top batch)
    const topEntry = aktifList
      .map((b) => ({ b, count: memberCounts.get(b.id) ?? 0 }))
      .filter((x) => x.count > 0)
      .sort((a, z) => z.count - a.count)[0];
    if (topEntry) {
      items.push({
        id: 'bt-top-batch',
        level: 'info', category: 'analisis', icon: '🏆',
        title: 'Batch Paling Aktif',
        message: `"${topEntry.b.name ?? topEntry.b.id}" memiliki ${topEntry.count} anggota aktif terbanyak.` +
          (analytics.mostActiveBatch
            ? ` Total ${analytics.mostActiveBatch.operationCount} operasi telah dilakukan di batch paling operasional.`
            : ''),
      });
    }

    // Growth trend
    if (growthTrend.length >= 2) {
      const last   = growthTrend[growthTrend.length - 1];
      const prev   = growthTrend[growthTrend.length - 2];
      const netLast = last.memberAdds - last.memberRemoves;
      const netPrev = prev.memberAdds - prev.memberRemoves;
      const direction = netLast > netPrev ? 'meningkat' : netLast < netPrev ? 'menurun' : 'stabil';
      items.push({
        id: 'bt-growth-trend',
        level: netLast < 0 ? 'warning' : 'info',
        category: 'analisis', icon: '📈',
        title: `Tren Pertumbuhan Anggota ${direction.charAt(0).toUpperCase() + direction.slice(1)}`,
        message:
          `Bulan ${last.label}: +${last.memberAdds} masuk, ${last.memberRemoves} keluar (net ${netLast >= 0 ? '+' : ''}${netLast}). ` +
          `Bulan ${prev.label}: net ${netPrev >= 0 ? '+' : ''}${netPrev}. ` +
          `Tren keanggotaan sedang ${direction}.`,
      });
    } else if (growthTrend.length === 1) {
      const only = growthTrend[0];
      items.push({
        id: 'bt-growth-trend',
        level: 'info', category: 'analisis', icon: '📈',
        title: 'Tren Pertumbuhan Anggota',
        message: `${only.label}: ${only.memberAdds} anggota ditambahkan, ${only.memberRemoves} keluar. Kumulatif: ${only.cumulativeMembers} anggota.`,
      });
    }

    // Average weight
    if (analytics.averageWeight > 0) {
      items.push({
        id: 'bt-avg-weight',
        level: 'info', category: 'analisis', icon: '⚖️',
        title: 'Rata-rata Bobot Batch Aktif',
        message: `Rata-rata bobot seluruh anggota aktif: ${analytics.averageWeight.toFixed(1)} ${analytics.weightUnit}. ` +
          (analytics.weightRecordingCount > 0
            ? `${analytics.weightRecordingCount} operasi pencatatan bobot telah dilakukan.`
            : 'Belum ada operasi pencatatan bobot.'),
      });
    }

    // Feed efficiency
    if (analytics.feedingCount > 0) {
      const feedsPerMember = totalMembers > 0
        ? (analytics.feedingCount / analytics.activeBatchCount).toFixed(1)
        : '—';
      items.push({
        id: 'bt-feed-efficiency',
        level: 'info', category: 'analisis', icon: '🌾',
        title: 'Efisiensi Pemberian Pakan',
        message: `${analytics.feedingCount} operasi pakan telah dilakukan. Rata-rata ${feedsPerMember} pemberian pakan per batch aktif. ` +
          (analytics.feedingCount < analytics.activeBatchCount
            ? 'Beberapa batch aktif belum menerima pakan.'
            : 'Seluruh batch aktif telah mendapatkan pakan.'),
      });
    }

    // Health trend
    if (analytics.healthActivityCount > 0) {
      items.push({
        id: 'bt-health-trend',
        level: 'info', category: 'analisis', icon: '🏥',
        title: 'Tren Aktivitas Kesehatan',
        message: `${analytics.healthActivityCount} operasi kesehatan (pemeriksaan/pengobatan) telah dilakukan di seluruh batch. ` +
          `${analytics.observationCount} catatan observasi tercatat.`,
      });
    }

    // Mutation trend
    if (analytics.mutationCount > 0) {
      items.push({
        id: 'bt-mutation-trend',
        level: analytics.mutationCount > 3 ? 'warning' : 'info',
        category: 'analisis', icon: '🔄',
        title: `Tren Mutasi Batch (${analytics.mutationCount} Operasi)`,
        message: `Total ${analytics.mutationCount} operasi mutasi batch telah dilakukan. ` +
          `${analytics.relocationCount} relokasi.` +
          (analytics.mutationCount > 3 ? ' Perhatikan frekuensi mutasi yang tinggi.' : ''),
      });
    }

    // Batch utilization (active members / total ever-added)
    const totalEverAdded = MEMBERSHIP_DB.filter((m) =>
      aktifList.some((b) => b.id === m.batchId),
    ).length;
    if (totalEverAdded > 0) {
      const utilRate = (totalMembers / totalEverAdded) * 100;
      items.push({
        id: 'bt-utilization',
        level: utilRate < 50 ? 'warning' : 'info',
        category: 'analisis', icon: '📊',
        title: `Utilisasi Batch ${utilRate.toFixed(0)}%`,
        message: `${totalMembers} dari ${totalEverAdded} anggota yang pernah bergabung masih aktif di batch aktif. ` +
          (utilRate < 50 ? 'Utilisasi di bawah 50% — banyak anggota yang telah keluar.' : 'Utilisasi tergolong baik.'),
      });
    }

    // Population stability (member churn in last 30 days)
    let recentAdds = 0, recentRemoves = 0;
    const since30 = now - THIRTY_DAYS_MS;
    for (const m of MEMBERSHIP_DB) {
      if (idDateMs(m.joinDate) >= since30) recentAdds++;
      if (m.leaveDate && idDateMs(m.leaveDate) >= since30 &&
          (m.status === 'Keluar' || m.status === 'Dipindahkan' || m.status === 'Selesai')) {
        recentRemoves++;
      }
    }
    if (recentAdds > 0 || recentRemoves > 0) {
      const churnRate = recentAdds > 0 ? ((recentRemoves / recentAdds) * 100).toFixed(0) : '100';
      items.push({
        id: 'bt-population-stability',
        level: recentRemoves > recentAdds ? 'warning' : 'info',
        category: 'analisis', icon: '📉',
        title: 'Stabilitas Populasi Batch (30 Hari)',
        message: `30 hari terakhir: ${recentAdds} anggota masuk, ${recentRemoves} keluar. Tingkat churn: ${churnRate}%. ` +
          (recentRemoves > recentAdds ? 'Populasi menyusut — periksa penyebab keluarnya anggota.' : 'Populasi relatif stabil.'),
      });
    }
  }

  // ── Peringatan ──────────────────────────────────────────────────────────────

  // Empty active batches
  const emptyActive = aktifList.filter((b) => (memberCounts.get(b.id) ?? 0) === 0);
  if (emptyActive.length > 0) {
    items.push({
      id: 'bt-empty-active',
      level: 'warning', category: 'peringatan', icon: '⚠️',
      title: `${emptyActive.length} Batch Aktif Kosong`,
      message: `${emptyActive.map((b) => b.name ?? b.id).join(', ')} — batch aktif tanpa anggota. Tambahkan anggota atau tutup batch.`,
    });
  }

  if (analytics.activeBatchCount === 0 && allBatches.length > 0) {
    items.push({
      id: 'bt-no-active',
      level: 'warning', category: 'peringatan', icon: '📭',
      title: 'Tidak Ada Batch Aktif',
      message: 'Semua batch sudah ditutup atau diarsipkan. Buat batch baru jika diperlukan pengelompokan ternak.',
    });
  }

  // Batches without recent activity (active, has members, but no activity in 30 days)
  const inactiveBatches = aktifList.filter(
    (b) => (memberCounts.get(b.id) ?? 0) > 0 && !hasRecentActivity(b.id, THIRTY_DAYS_MS),
  );
  if (inactiveBatches.length > 0) {
    items.push({
      id: 'bt-no-recent-activity',
      level: 'warning', category: 'peringatan', icon: '💤',
      title: `${inactiveBatches.length} Batch Tanpa Aktivitas (30 Hari)`,
      message: `${inactiveBatches.map((b) => b.name ?? b.id).join(', ')} — aktif dan memiliki anggota tetapi tidak ada operasi atau perubahan keanggotaan dalam 30 hari terakhir.`,
    });
  }

  // Rapid member loss (>30% of peak lost in last 30 days)
  for (const b of aktifList) {
    const currentCount = memberCounts.get(b.id) ?? 0;
    if (currentCount === 0) continue;
    const removed = recentMemberRemovals(b.id, THIRTY_DAYS_MS);
    const peak = currentCount + removed;
    if (peak > 0 && removed / peak > 0.3) {
      items.push({
        id: `bt-rapid-loss-${b.id}`,
        level: 'critical', category: 'peringatan', icon: '🚨',
        title: `Penurunan Anggota Cepat: "${b.name ?? b.id}"`,
        message: `${removed} dari ${peak} anggota (${((removed / peak) * 100).toFixed(0)}%) telah keluar dalam 30 hari terakhir. Periksa penyebab penurunan yang signifikan.`,
      });
    }
  }

  // Missing weight records (active batches with members, no RecordWeight ops ever)
  const missingWeight = aktifList.filter(
    (b) => (memberCounts.get(b.id) ?? 0) > 0 && opCountByType(b.id, 'RecordWeight') === 0,
  );
  if (missingWeight.length > 0) {
    items.push({
      id: 'bt-missing-weight',
      level: missingWeight.length > 2 ? 'warning' : 'info',
      category: 'peringatan', icon: '⚖️',
      title: `${missingWeight.length} Batch Belum Ada Pencatatan Bobot`,
      message: `${missingWeight.map((b) => b.name ?? b.id).join(', ')} — batch aktif dengan anggota tetapi belum pernah melakukan operasi timbang batch.`,
    });
  }

  // Missing feeding records (active batches with members, no FeedBatch ops ever)
  const missingFeeding = aktifList.filter(
    (b) => (memberCounts.get(b.id) ?? 0) > 0 && opCountByType(b.id, 'FeedBatch') === 0,
  );
  if (missingFeeding.length > 0) {
    items.push({
      id: 'bt-missing-feeding',
      level: missingFeeding.length > 2 ? 'warning' : 'info',
      category: 'peringatan', icon: '🌾',
      title: `${missingFeeding.length} Batch Belum Ada Pemberian Pakan`,
      message: `${missingFeeding.map((b) => b.name ?? b.id).join(', ')} — belum ada operasi pemberian pakan batch tercatat.`,
    });
  }

  // Missing health records (active batches with members, no HealthCheck/Treatment ops ever)
  const missingHealth = aktifList.filter(
    (b) =>
      (memberCounts.get(b.id) ?? 0) > 0 &&
      opCountByType(b.id, 'HealthCheck') === 0 &&
      opCountByType(b.id, 'HealthTreatment') === 0,
  );
  if (missingHealth.length > 0) {
    items.push({
      id: 'bt-missing-health',
      level: missingHealth.length > 2 ? 'warning' : 'info',
      category: 'peringatan', icon: '🏥',
      title: `${missingHealth.length} Batch Belum Ada Pemeriksaan Kesehatan`,
      message: `${missingHealth.map((b) => b.name ?? b.id).join(', ')} — belum ada pemeriksaan atau pengobatan kesehatan batch tercatat.`,
    });
  }

  // Repeated mutation (>1 BatchMutation operation in a single batch)
  const repeatedMutation = aktifList.filter((b) => opCountByType(b.id, 'BatchMutation') > 1);
  if (repeatedMutation.length > 0) {
    items.push({
      id: 'bt-repeated-mutation',
      level: 'warning', category: 'peringatan', icon: '🔄',
      title: `${repeatedMutation.length} Batch Dengan Mutasi Berulang`,
      message: `${repeatedMutation.map((b) => `"${b.name ?? b.id}" (${opCountByType(b.id, 'BatchMutation')}×)`).join(', ')} — mutasi berulang dapat mengindikasikan ketidakstabilan pengelolaan.`,
    });
  }

  // ── Rekomendasi ─────────────────────────────────────────────────────────────

  // Too many active batches
  if (analytics.activeBatchCount > 5) {
    items.push({
      id: 'bt-many-active',
      level: 'info', category: 'rekomendasi', icon: '💡',
      title: 'Banyak Batch Aktif',
      message: `Terdapat ${analytics.activeBatchCount} batch aktif. Pertimbangkan untuk menyelesaikan atau mengarsipkan batch yang sudah tidak diperlukan.`,
    });
  }

  // Archive suggestion
  if ((selesai + dibatalkan) > 3 && diarsipkan === 0) {
    items.push({
      id: 'bt-archive-suggestion',
      level: 'info', category: 'rekomendasi', icon: '🗃️',
      title: 'Arsipkan Batch Lama',
      message: `Terdapat ${selesai + dibatalkan} batch yang sudah selesai/dibatalkan. Pengarsipan membantu menjaga tampilan daftar tetap rapi.`,
    });
  }

  // Weight recording recommendation
  if (missingWeight.length > 0) {
    items.push({
      id: 'bt-rec-weight',
      level: 'info', category: 'rekomendasi', icon: '⚖️',
      title: 'Lakukan Pencatatan Bobot Batch',
      message: `${missingWeight.length} batch aktif belum memiliki rekam bobot. Gunakan operasi "Timbang Batch" untuk memantau pertumbuhan anggota secara berkala.`,
    });
  }

  // Feeding evaluation recommendation
  if (missingFeeding.length > 0) {
    items.push({
      id: 'bt-rec-feeding',
      level: 'info', category: 'rekomendasi', icon: '🌾',
      title: 'Evaluasi Pemberian Pakan Batch',
      message: `${missingFeeding.length} batch aktif belum memiliki rekam pakan. Gunakan operasi "Beri Pakan Batch" dan evaluasi kecukupan nutrisi secara rutin.`,
    });
  }

  // Health examination recommendation
  if (missingHealth.length > 0) {
    items.push({
      id: 'bt-rec-health',
      level: 'info', category: 'rekomendasi', icon: '🏥',
      title: 'Jadwalkan Pemeriksaan Kesehatan',
      message: `${missingHealth.length} batch aktif belum pernah menjalani pemeriksaan kesehatan batch. Gunakan operasi "Pemeriksaan Kesehatan Batch" untuk deteksi dini.`,
    });
  }

  // Batch restructuring (very unequal distribution — largest > 3× smallest)
  const counts = aktifList.map((b) => memberCounts.get(b.id) ?? 0).filter((c) => c > 0);
  if (counts.length >= 2) {
    const maxC = Math.max(...counts);
    const minC = Math.min(...counts);
    if (maxC > minC * 3) {
      items.push({
        id: 'bt-rec-restructure',
        level: 'info', category: 'rekomendasi', icon: '🔀',
        title: 'Pertimbangkan Restrukturisasi Batch',
        message: `Distribusi anggota tidak merata (terbesar: ${maxC}, terkecil: ${minC}). Pertimbangkan pemindahan anggota untuk menyeimbangkan beban pemantauan antar batch.`,
      });
    }
  }

  // Batch merge recommendation (multiple tiny batches of same livestock type)
  const typeCounts = new Map<string, { batches: BatchRecord[]; total: number }>();
  for (const b of aktifList) {
    const count = memberCounts.get(b.id) ?? 0;
    const entry = typeCounts.get(b.livestockType) ?? { batches: [], total: 0 };
    entry.batches.push(b);
    entry.total += count;
    typeCounts.set(b.livestockType, entry);
  }
  for (const [type, { batches, total }] of typeCounts.entries()) {
    const avgPerBatch = batches.length > 0 ? total / batches.length : 0;
    if (batches.length >= 3 && avgPerBatch < 5) {
      items.push({
        id: `bt-rec-merge-${type}`,
        level: 'info', category: 'rekomendasi', icon: '🔗',
        title: `Pertimbangkan Penggabungan Batch (${type})`,
        message: `${batches.length} batch ${type} aktif dengan rata-rata hanya ${avgPerBatch.toFixed(1)} anggota per batch. Penggabungan dapat meningkatkan efisiensi pengelolaan.`,
      });
    }
  }

  // Batch closure recommendation (Selesai batch lingering, not yet archived)
  const longSelesai = Object.values(BATCH_DB).filter(
    (b) => b.status === 'Selesai' && b.finishedDate && (now - idDateMs(b.finishedDate)) > 60 * 24 * 60 * 60 * 1000,
  );
  if (longSelesai.length > 0) {
    items.push({
      id: 'bt-rec-closure',
      level: 'info', category: 'rekomendasi', icon: '📦',
      title: `${longSelesai.length} Batch Selesai Belum Diarsipkan (>60 Hari)`,
      message: `${longSelesai.map((b) => b.name ?? b.id).join(', ')} — batch selesai lebih dari 60 hari yang lalu. Arsipkan untuk menjaga kebersihan data.`,
    });
  }

  // Batch split recommendation (any active batch with > 20 members)
  const oversizedBatch = aktifList.find((b) => (memberCounts.get(b.id) ?? 0) > 20);
  if (oversizedBatch) {
    const oc = memberCounts.get(oversizedBatch.id) ?? 0;
    items.push({
      id: 'bt-rec-split',
      level: 'info', category: 'rekomendasi', icon: '✂️',
      title: `Pertimbangkan Pemecahan Batch "${oversizedBatch.name ?? oversizedBatch.id}"`,
      message: `Batch ini memiliki ${oc} anggota. Batch yang terlalu besar dapat mengurangi presisi pemantauan. Pertimbangkan memindahkan sebagian anggota ke batch baru.`,
    });
  }

  // ── Prediksi ────────────────────────────────────────────────────────────────

  if (analytics.activeBatchCount > 0 && totalMembers > 0) {
    items.push({
      id: 'bt-avg-members',
      level: 'info', category: 'prediksi', icon: '📈',
      title: 'Proyeksi Rata-rata Anggota per Batch',
      message:
        `Saat ini: ${analytics.averageMembersPerActiveBatch.toFixed(1)} anggota per batch aktif. ` +
        (growthTrend.length >= 2
          ? `Tren bulan terakhir: net ${((growthTrend[growthTrend.length - 1].memberAdds - growthTrend[growthTrend.length - 1].memberRemoves) >= 0 ? '+' : '')}${growthTrend[growthTrend.length - 1].memberAdds - growthTrend[growthTrend.length - 1].memberRemoves} anggota.`
          : 'Butuh lebih banyak data historis untuk proyeksi trend jangka panjang.'),
    });
  }

  // Total operations forecast
  if (analytics.totalOperations > 0) {
    items.push({
      id: 'bt-ops-forecast',
      level: 'info', category: 'prediksi', icon: '🔮',
      title: 'Ringkasan Operasional Batch',
      message:
        `Total ${analytics.totalOperations} operasi tercatat: ` +
        `${analytics.weightRecordingCount} timbang, ${analytics.feedingCount} pakan, ` +
        `${analytics.healthActivityCount} kesehatan, ${analytics.mutationCount} mutasi, ` +
        `${analytics.relocationCount} relokasi, ${analytics.observationCount} observasi.` +
        (analytics.mostActiveBatch ? ` Batch paling produktif: "${analytics.mostActiveBatch.batchLabel}".` : ''),
    });
  }

  // ── Sort: critical → warning → info ─────────────────────────────────────────
  const ORDER: Record<InsightLevel, number> = { critical: 0, warning: 1, info: 2 };
  items.sort((a, b) => ORDER[a.level] - ORDER[b.level]);

  return {
    analyzedAt,
    dataSource:       DATA_SOURCE,
    confidenceStatus: 'Rule-Based',
    version:          VERSION,
    items,
  };
}
