/**
 * batchAnalyticsData.ts  (BT-005)
 * ─────────────────────────────────────────────────────────────────────────────
 * Batch Analytics — computed live from History + registries.
 *
 * All analytics are derived on each call — nothing is cached or hardcoded.
 * This file also exports reusable chart-ready datasets (structure only —
 * no chart component or chart library is imported here).
 *
 * AI (BT-006) will consume these analytics via the exported functions.
 * Dashboard is READ ONLY.
 */

import {
  BATCH_DB,
  MEMBERSHIP_DB,
  getActiveBatchMemberships,
  getActiveBatchMembersWithLivestock,
} from './batchData';
import {
  BATCH_OPERATION_LOG,
  BATCH_OBSERVATION_LOG,
  getBatchOperationLog,
} from './batchOperationsData';
import { LIVESTOCK_DB } from './livestockData';
import { getAllBatchHistory, parseIdDate } from './batchHistoryData';
import { getPemberianPakanList } from './pemberianPakanData';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Top-level analytics summary. All values computed live. */
export type BatchAnalytics = {
  // Batch counts
  activeBatchCount: number;
  closedBatchCount: number;
  archivedBatchCount: number;
  draftBatchCount: number;
  totalBatchCount: number;

  // Membership
  totalActiveMembers: number;
  averageMembersPerActiveBatch: number;

  // Weight
  averageWeight: number;
  weightUnit: string;

  // Operations
  totalOperations: number;
  feedingCount: number;
  weightRecordingCount: number;
  healthActivityCount: number;
  mutationCount: number;
  relocationCount: number;
  observationCount: number;

  // Health
  totalObservations: number;

  // Feed consumption
  feedConsumption: Array<{ satuan: string; jumlah: number }>;

  // Most active batch (by operation count)
  mostActiveBatch: {
    batchId: string;
    batchLabel: string;
    operationCount: number;
  } | null;

  // Batch with most members (active)
  largestActiveBatch: {
    batchId: string;
    batchLabel: string;
    memberCount: number;
  } | null;

  // Timeline metadata
  oldestEventDate: string | null;   // Indonesian date label
  newestEventDate: string | null;   // Indonesian date label
  totalHistoryEvents: number;
};

/** Reusable chart dataset (chart-library agnostic). */
export type ChartDataset = {
  id: string;
  title: string;
  description: string;
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
};

/** Batch growth trend — member additions per month. */
export type GrowthTrendPoint = {
  label: string;     // "Jul 2026"
  memberAdds: number;
  memberRemoves: number;
  cumulativeMembers: number;
};

// ─── Analytics Engine ─────────────────────────────────────────────────────────

/**
 * Compute the full analytics summary from live data.
 * Called on each render — never cached.
 */
export function getBatchAnalytics(): BatchAnalytics {
  const allBatches  = Object.values(BATCH_DB);
  const activeBatches   = allBatches.filter((b) => b.status === 'Aktif');
  const closedBatches   = allBatches.filter((b) => b.status === 'Selesai');
  const archivedBatches = allBatches.filter((b) => b.status === 'Diarsipkan');
  const draftBatches    = allBatches.filter((b) => b.status === 'Draft');

  // Active members
  const totalActiveMembers = MEMBERSHIP_DB.filter((m) => m.status === 'Aktif').length;
  const averageMembersPerActiveBatch =
    activeBatches.length > 0 ? totalActiveMembers / activeBatches.length : 0;

  // Average weight across ALL active members in ALL active batches
  let totalWeight = 0;
  let weightCount = 0;
  let weightUnit  = 'Kg';
  for (const batch of activeBatches) {
    const members = getActiveBatchMembersWithLivestock(batch.id);
    for (const { lv } of members) {
      const w = parseFloat(lv.weight);
      if (!isNaN(w)) {
        totalWeight += w;
        weightCount += 1;
        weightUnit = lv.weightUnit ?? 'Kg';
      }
    }
  }
  const averageWeight = weightCount > 0 ? totalWeight / weightCount : 0;

  // Operations breakdown
  const ops = BATCH_OPERATION_LOG;
  const feedingCount        = ops.filter((o) => o.type === 'FeedBatch').length;
  const weightRecordingCount = ops.filter((o) => o.type === 'RecordWeight').length;
  const healthActivityCount  = ops.filter(
    (o) => o.type === 'HealthCheck' || o.type === 'HealthTreatment',
  ).length;
  const mutationCount    = ops.filter((o) => o.type === 'BatchMutation').length;
  const relocationCount  = ops.filter((o) => o.type === 'BatchRelocation').length;
  const observationCount = ops.filter((o) => o.type === 'BatchObservation').length;

  // Feed consumption totals — join pemberianPakanData for completed batch sessions.
  // Only parent batch records (targetKind === 'batch', no parentPemberianPakanId) are
  // counted; child fan-out records (parentPemberianPakanId set) represent the same
  // feed distributed to individual members and would double-count if included.
  const feedTotals = new Map<string, number>();
  for (const record of getPemberianPakanList()) {
    if (
      record.status !== 'Pemberian Pakan Selesai' ||
      record.targetKind !== 'batch' ||
      record.parentPemberianPakanId !== undefined
    ) continue;
    for (const item of record.items) {
      const key = item.satuan.trim();
      feedTotals.set(key, (feedTotals.get(key) ?? 0) + item.jumlah);
    }
  }
  const feedConsumption: Array<{ satuan: string; jumlah: number }> = Array.from(
    feedTotals.entries(),
    ([satuan, jumlah]) => ({ satuan, jumlah }),
  );

  // Most active batch (by total operation count)
  let mostActiveBatch: BatchAnalytics['mostActiveBatch'] = null;
  for (const batch of allBatches) {
    const count = getBatchOperationLog(batch.id).length;
    if (!mostActiveBatch || count > mostActiveBatch.operationCount) {
      mostActiveBatch = {
        batchId: batch.id,
        batchLabel: batch.name ?? batch.id,
        operationCount: count,
      };
    }
  }
  if (mostActiveBatch?.operationCount === 0) mostActiveBatch = null;

  // Largest active batch
  let largestActiveBatch: BatchAnalytics['largestActiveBatch'] = null;
  for (const batch of activeBatches) {
    const count = getActiveBatchMemberships(batch.id).length;
    if (!largestActiveBatch || count > largestActiveBatch.memberCount) {
      largestActiveBatch = {
        batchId: batch.id,
        batchLabel: batch.name ?? batch.id,
        memberCount: count,
      };
    }
  }

  // History metadata
  const allHistory = getAllBatchHistory();
  const totalHistoryEvents = allHistory.length;
  const oldestEvent = allHistory.length > 0 ? allHistory[allHistory.length - 1] : null;
  const newestEvent = allHistory.length > 0 ? allHistory[0] : null;

  return {
    activeBatchCount:   activeBatches.length,
    closedBatchCount:   closedBatches.length,
    archivedBatchCount: archivedBatches.length,
    draftBatchCount:    draftBatches.length,
    totalBatchCount:    allBatches.length,

    totalActiveMembers,
    averageMembersPerActiveBatch,

    averageWeight,
    weightUnit,

    totalOperations: ops.length,
    feedingCount,
    weightRecordingCount,
    healthActivityCount,
    mutationCount,
    relocationCount,
    observationCount,

    totalObservations: BATCH_OBSERVATION_LOG.length,

    feedConsumption,

    mostActiveBatch,
    largestActiveBatch,

    oldestEventDate: oldestEvent?.displayDate ?? null,
    newestEventDate: newestEvent?.displayDate ?? null,
    totalHistoryEvents,
  };
}

// ─── Chart Datasets ───────────────────────────────────────────────────────────
// Reusable, chart-library agnostic datasets.
// Do NOT import any chart library here. These are plain data structures.

/** Batch status distribution dataset (pie/doughnut). */
export function getBatchStatusDataset(): ChartDataset {
  const analytics = getBatchAnalytics();
  return {
    id:          'batch-status',
    title:       'Distribusi Status Batch',
    description: 'Jumlah batch berdasarkan status',
    type:        'doughnut',
    labels:      ['Aktif', 'Draft', 'Selesai', 'Diarsipkan'],
    datasets: [{
      label: 'Jumlah Batch',
      data: [
        analytics.activeBatchCount,
        analytics.draftBatchCount,
        analytics.closedBatchCount,
        analytics.archivedBatchCount,
      ],
      color: '#4caf50',
    }],
  };
}

/** Operation type distribution dataset (bar). */
export function getOperationTypeDataset(): ChartDataset {
  const analytics = getBatchAnalytics();
  return {
    id:          'operation-types',
    title:       'Distribusi Tipe Operasi Batch',
    description: 'Jumlah operasi per tipe',
    type:        'bar',
    labels: [
      'Timbang', 'Pakan', 'Kesehatan', 'Mutasi', 'Relokasi', 'Observasi',
    ],
    datasets: [{
      label: 'Jumlah Operasi',
      data: [
        analytics.weightRecordingCount,
        analytics.feedingCount,
        analytics.healthActivityCount,
        analytics.mutationCount,
        analytics.relocationCount,
        analytics.observationCount,
      ],
      color: '#2196f3',
    }],
  };
}

/** Members per active batch dataset (bar). */
export function getMembersPerBatchDataset(): ChartDataset {
  const activeBatches = Object.values(BATCH_DB).filter((b) => b.status === 'Aktif');
  const labels = activeBatches.map((b) => b.name ?? b.id.slice(0, 8));
  const data   = activeBatches.map((b) => getActiveBatchMemberships(b.id).length);
  return {
    id:          'members-per-batch',
    title:       'Anggota per Batch Aktif',
    description: 'Jumlah anggota aktif di setiap batch yang sedang aktif',
    type:        'bar',
    labels,
    datasets: [{
      label: 'Anggota Aktif',
      data,
      color: '#ff9800',
    }],
  };
}

/**
 * Batch growth trend — member additions per calendar month, newest → oldest.
 * Returns a list of { label, memberAdds, memberRemoves, cumulativeMembers } points.
 */
export function getBatchGrowthTrend(): GrowthTrendPoint[] {
  // Build monthly buckets from all membership events
  const buckets = new Map<string, { adds: number; removes: number }>();

  function monthKey(epochMs: number): string {
    const d = new Date(epochMs);
    const MONTHS = [
      'Jan','Feb','Mar','Apr','Mei','Jun',
      'Jul','Agu','Sep','Okt','Nov','Des',
    ];
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }

  for (const m of MEMBERSHIP_DB) {
    const addMs = parseIdDate(m.joinDate);
    if (addMs) {
      const key = monthKey(addMs);
      const bucket = buckets.get(key) ?? { adds: 0, removes: 0 };
      bucket.adds += 1;
      buckets.set(key, bucket);
    }
    if (m.leaveDate && (m.status === 'Keluar' || m.status === 'Selesai' || m.status === 'Dipindahkan')) {
      const remMs = parseIdDate(m.leaveDate);
      if (remMs) {
        const key = monthKey(remMs);
        const bucket = buckets.get(key) ?? { adds: 0, removes: 0 };
        bucket.removes += 1;
        buckets.set(key, bucket);
      }
    }
  }

  if (buckets.size === 0) return [];

  // Sort keys chronologically by parsing year+month
  const MONTH_ORDER: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, Mei: 4, Jun: 5,
    Jul: 6, Agu: 7, Sep: 8, Okt: 9, Nov: 10, Des: 11,
  };

  const sortedKeys = Array.from(buckets.keys()).sort((a, b) => {
    const [ma, ya] = a.split(' ');
    const [mb, yb] = b.split(' ');
    const yearDiff = parseInt(ya, 10) - parseInt(yb, 10);
    if (yearDiff !== 0) return yearDiff;
    return (MONTH_ORDER[ma] ?? 0) - (MONTH_ORDER[mb] ?? 0);
  });

  let cumulative = 0;
  return sortedKeys.map((key) => {
    const { adds, removes } = buckets.get(key)!;
    cumulative += adds - removes;
    return {
      label: key,
      memberAdds: adds,
      memberRemoves: removes,
      cumulativeMembers: Math.max(0, cumulative),
    };
  });
}

/** Growth trend as a ChartDataset (line). */
export function getGrowthTrendDataset(): ChartDataset {
  const trend = getBatchGrowthTrend();
  return {
    id:          'growth-trend',
    title:       'Tren Pertumbuhan Anggota Batch',
    description: 'Penambahan dan pengurangan anggota per bulan',
    type:        'line',
    labels: trend.map((p) => p.label),
    datasets: [
      {
        label: 'Anggota Ditambahkan',
        data:  trend.map((p) => p.memberAdds),
        color: '#4caf50',
      },
      {
        label: 'Anggota Keluar',
        data:  trend.map((p) => p.memberRemoves),
        color: '#f44336',
      },
      {
        label: 'Kumulatif',
        data:  trend.map((p) => p.cumulativeMembers),
        color: '#2196f3',
      },
    ],
  };
}

/** Operation activity per batch (bar). */
export function getOperationsPerBatchDataset(): ChartDataset {
  const allBatches = Object.values(BATCH_DB);
  const labels = allBatches.map((b) => b.name ?? b.id.slice(0, 8));
  const data   = allBatches.map((b) => getBatchOperationLog(b.id).length);
  return {
    id:          'operations-per-batch',
    title:       'Aktivitas Operasi per Batch',
    description: 'Total operasi yang telah dilakukan di setiap batch',
    type:        'bar',
    labels,
    datasets: [{
      label: 'Total Operasi',
      data,
      color: '#9c27b0',
    }],
  };
}

/**
 * Returns all chart datasets in a single call — convenient for BT-006 AI consumption.
 */
export function getAllChartDatasets(): ChartDataset[] {
  return [
    getBatchStatusDataset(),
    getOperationTypeDataset(),
    getMembersPerBatchDataset(),
    getGrowthTrendDataset(),
    getOperationsPerBatchDataset(),
  ];
}
