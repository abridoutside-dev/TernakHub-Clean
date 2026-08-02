/**
 * batchOperationsData.ts  (BT-004)
 * ─────────────────────────────────────────────────────────────────────────────
 * Batch Operations — Execution / Orchestration Layer.
 *
 * Batch does NOT own any business logic here. Every operation below is a thin
 * orchestrator that:
 *   1. Expands the batch into its currently ACTIVE members
 *      (getActiveBatchMembersWithLivestock — batchData.ts, unchanged).
 *   2. Calls the REAL, EXISTING per-individual module function for each
 *      member (addWeightRecord, addPemeriksaan, executeIntegrasiPengobatan,
 *      performTempTransfer, executeMutationRequest, ...). No validation,
 *      stock-deduction, or rollback logic is reimplemented here — it is
 *      100% delegated to the modules that already own it.
 *   3. Creates a genuine INDIVIDUAL record per member (never a synthetic
 *      "batch-only" record) so every existing per-animal History/Riwayat
 *      page keeps working unmodified.
 *   4. Tracks success/failure PER MEMBER — a failing member never rolls back
 *      the members that already succeeded (partial execution is expected
 *      and reported, never silently hidden).
 *   5. Appends Batch Operation Started/Completed/Partially Completed/Failed
 *      events to the existing BATCH_TIMELINE_LOG (batchData.ts) and records
 *      an entry in BATCH_OPERATION_LOG (this file) for the Execution
 *      Summary / audit trail.
 *
 * Batch Summary (getBatchOperationsSummary) is always computed live from the
 * underlying registries — never hardcoded, never cached.
 */

import { generateUUID } from '../utils/uuid';
import {
  getBatch,
  getActiveBatchMembersWithLivestock,
  addBatchTimelineEvent,
  type MembershipWithLivestock,
} from './batchData';
import { getLivestock, type LivestockRecord } from './livestockData';
import { addWeightRecord } from './livestockData';
import { distributeBatchAverageWeight } from '../utils/weightDistribution';
import {
  addPemberianPakan,
  selesaikanPemberianPakan,
  getPemberianPakanByTarget,
  type PemberianPakanItem,
} from './pemberianPakanData';
import {
  addPemeriksaan,
  markSiapDiagnosa,
  getPemeriksaanByLivestock,
  getPemeriksaanByBatch,
  type NafsuMakan,
  type AktivitasTernak,
  type KondisiFeses,
} from './pemeriksaanKesehatanData';
import {
  addDiagnosa,
  getDiagnosaByPemeriksaan,
} from './diagnosaKesehatanData';
import {
  createTindakanSesi,
  addTindakanItem,
  setPakaiObat,
  finishTindakanSesi,
  getTindakanSesiByDiagnosa,
} from './tindakanKesehatanData';
import {
  createPengobatanSesi,
  addPengobatanItem,
  finishPengobatanSesi,
  getPengobatanSesiByTindakan,
} from './pengobatanKesehatanData';
import { executeIntegrasiPengobatan } from '../services/integrasiPengobatanService';
import { getStokObatById } from './stokObatData';
import { getObatById } from './obatData';
import { performTempTransfer, type TempTransferReason } from './transferData';
import {
  createMutationRequest,
  submitMutationRequest,
  executeMutationRequest,
  getMutationHistoryByBatch,
  todayLabel,
  type MutationType,
} from './mutasiData';

// ─── Operation Types ────────────────────────────────────────────────────────

export type BatchOperationType =
  | 'RecordWeight'
  | 'FeedBatch'
  | 'HealthCheck'
  | 'HealthTreatment'
  | 'BatchMutation'
  | 'BatchRelocation'
  | 'BatchObservation';

export const BATCH_OPERATION_LABELS: Record<BatchOperationType, string> = {
  RecordWeight:     'Timbang Batch',
  FeedBatch:        'Beri Pakan Batch',
  HealthCheck:      'Pemeriksaan Kesehatan Batch',
  HealthTreatment:  'Pengobatan Batch',
  BatchMutation:    'Mutasi Batch',
  BatchRelocation:  'Relokasi Batch',
  BatchObservation: 'Observasi Batch',
};

export type BatchOperationStatus = 'Completed' | 'Partially Completed' | 'Failed';

export type BatchOperationSkip = {
  livestockId: string;
  livestockName: string;
  reason: string;
};

export type BatchOperationLogEntry = {
  id: string;                      // UUID v4
  batchId: string;
  type: BatchOperationType;
  label: string;
  status: BatchOperationStatus;
  totalTargets: number;
  succeeded: number;
  failed: BatchOperationSkip[];
  createdRecordIds: string[];      // UUIDs of the individual records this run created
  startedAt: string;                // ISO timestamp
  completedAt: string;              // ISO timestamp
  officer: string | null;
  notes: string | null;
};

/** Immutable execution audit trail — never edited or deleted. */
export const BATCH_OPERATION_LOG: BatchOperationLogEntry[] = [];

export function getBatchOperationLog(batchId: string): BatchOperationLogEntry[] {
  return BATCH_OPERATION_LOG
    .filter((e) => e.batchId === batchId)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

// ─── Batch Observation — minimal record (no prior individual module exists) ──
// Every other operation type reuses an existing per-animal module. "Observation"
// (general free-text field notes — behaviour, appearance, environment) has no
// existing per-animal home anywhere in the app, so Batch Operations owns this
// minimal record itself instead of inventing logic inside another module.

export type ObservationCondition = 'Normal' | 'Perlu Perhatian' | 'Kritis';

export type BatchObservationRecord = {
  id: string;                 // UUID v4
  batchId: string;
  livestockId: string;
  livestockName: string | null;
  tanggal: string;            // yyyy-mm-dd
  kondisi: ObservationCondition;
  catatan: string;
  petugas: string | null;
  createdAt: string;          // ISO timestamp
};

export const BATCH_OBSERVATION_LOG: BatchObservationRecord[] = [];

export function getObservationsByLivestock(livestockId: string): BatchObservationRecord[] {
  return BATCH_OBSERVATION_LOG
    .filter((o) => o.livestockId === livestockId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getObservationsByBatch(batchId: string): BatchObservationRecord[] {
  return BATCH_OBSERVATION_LOG
    .filter((o) => o.batchId === batchId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ─── Per-member outcome contract used by the generic executor ───────────────

type MemberOutcome = { success: true; recordId?: string } | { success: false; reason: string };

// ─── Generic Executor (Started → per-member loop → Completed/Partial/Failed) ─

function finalizeOperation(params: {
  batchId: string;
  type: BatchOperationType;
  officer: string | null;
  notes: string | null;
  startedAt: string;
  targets: MembershipWithLivestock[];
  succeeded: number;
  failed: BatchOperationSkip[];
  createdRecordIds: string[];
}): BatchOperationLogEntry {
  const { batchId, type, officer, notes, startedAt, targets, succeeded, failed, createdRecordIds } = params;
  const label = BATCH_OPERATION_LABELS[type];
  const status: BatchOperationStatus =
    succeeded === 0 ? 'Failed' : failed.length === 0 ? 'Completed' : 'Partially Completed';
  const completedAt = new Date().toISOString();
  const today = todayLabel();

  const entry: BatchOperationLogEntry = {
    id: generateUUID(),
    batchId, type, label, status,
    totalTargets: targets.length,
    succeeded, failed, createdRecordIds,
    startedAt, completedAt, officer, notes,
  };
  BATCH_OPERATION_LOG.push(entry);

  const finishNotes =
    `${label} ${status === 'Completed' ? 'selesai' : status === 'Partially Completed' ? 'selesai sebagian' : 'gagal'}` +
    ` — ${succeeded}/${targets.length} anggota berhasil.` +
    (failed.length > 0 ? ` Gagal: ${failed.map((f) => `${f.livestockName} (${f.reason})`).join('; ')}.` : '');

  addBatchTimelineEvent({
    batchId,
    type:
      status === 'Completed'           ? 'operation_completed' :
      status === 'Partially Completed' ? 'operation_partial'   :
                                          'operation_failed',
    date: today,
    livestockId: null,
    livestockName: null,
    relatedBatchId: null,
    notes: finishNotes,
  });

  return entry;
}

function runPerMemberOperation(
  batchId: string,
  type: BatchOperationType,
  officer: string | null,
  notes: string | null,
  perMember: (lv: LivestockRecord) => MemberOutcome,
): BatchOperationLogEntry {
  const batch = getBatch(batchId);
  if (!batch) throw new Error(`Batch "${batchId}" tidak ditemukan.`);

  const targets = getActiveBatchMembersWithLivestock(batchId);
  if (targets.length === 0) {
    throw new Error('Batch ini tidak memiliki anggota aktif — operasi dibatalkan.');
  }

  const startedAt = new Date().toISOString();
  const label = BATCH_OPERATION_LABELS[type];
  addBatchTimelineEvent({
    batchId, type: 'operation_started', date: todayLabel(),
    livestockId: null, livestockName: null, relatedBatchId: null,
    notes: `${label} dimulai untuk ${targets.length} anggota aktif.`,
  });

  const failed: BatchOperationSkip[] = [];
  const createdRecordIds: string[] = [];
  let succeeded = 0;

  for (const { lv } of targets) {
    try {
      const outcome = perMember(lv);
      if (outcome.success) {
        succeeded += 1;
        if (outcome.recordId) createdRecordIds.push(outcome.recordId);
      } else {
        failed.push({ livestockId: lv.id, livestockName: lv.name ?? lv.id, reason: outcome.reason });
      }
    } catch (err) {
      failed.push({
        livestockId: lv.id,
        livestockName: lv.name ?? lv.id,
        reason: err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga.',
      });
    }
  }

  return finalizeOperation({ batchId, type, officer, notes, startedAt, targets, succeeded, failed, createdRecordIds });
}

// ─── 1. Record Weight ────────────────────────────────────────────────────────
// Reuses distributeBatchAverageWeight (utils/weightDistribution.ts) +
// addWeightRecord (livestockData.ts) — the exact same pair CatatBobot.tsx's
// own Batch mode already calls. No new weight-distribution math here.

export function executeRecordWeightBatch(
  batchId: string,
  targetAverageWeight: number,
  tanggal: string,
  notes: string | null,
  officer: string | null,
): BatchOperationLogEntry {
  const members = getActiveBatchMembersWithLivestock(batchId).map((m) => m.lv);
  const distribution = distributeBatchAverageWeight(
    members.map((lv) => ({ id: lv.id, currentWeight: parseFloat(lv.weight) || 0 })),
    targetAverageWeight,
  );
  const newWeightById = new Map(distribution.map((d) => [d.id, d.newWeight]));

  return runPerMemberOperation(batchId, 'RecordWeight', officer, notes, (lv) => {
    const newWeight = newWeightById.get(lv.id);
    if (newWeight === undefined) return { success: false, reason: 'Tidak ada hasil distribusi bobot untuk ternak ini.' };
    addWeightRecord(lv.id, newWeight.toFixed(1), lv.weightUnit, tanggal, notes);
    return { success: true };
  });
}

// ─── 2. Feed Batch ───────────────────────────────────────────────────────────
// Reuses addPemberianPakan + selesaikanPemberianPakan (pemberianPakanData.ts)
// with targetKind: 'batch' — that pair already performs the atomic stock
// deduction AND fans out one individual PemberianPakanRecord per active
// member (createIndividualFeedingRecordsForBatch, BT-003). This function only
// orchestrates the call and reports the result — it never touches Stok Pakan.

export function executeFeedBatch(
  batchId: string,
  items: PemberianPakanItem[],
  tanggal: string,
  waktuPemberian: string,
  catatan: string | undefined,
  petugas: string | undefined,
): BatchOperationLogEntry {
  const batch = getBatch(batchId);
  if (!batch) throw new Error(`Batch "${batchId}" tidak ditemukan.`);
  const targets = getActiveBatchMembersWithLivestock(batchId);
  if (targets.length === 0) throw new Error('Batch ini tidak memiliki anggota aktif — operasi dibatalkan.');

  const startedAt = new Date().toISOString();
  const label = BATCH_OPERATION_LABELS.FeedBatch;
  addBatchTimelineEvent({
    batchId, type: 'operation_started', date: todayLabel(),
    livestockId: null, livestockName: null, relatedBatchId: null,
    notes: `${label} dimulai untuk ${targets.length} anggota aktif.`,
  });

  const record = addPemberianPakan({
    targetKind: 'batch',
    targetId: batchId,
    targetName: batch.name ?? batch.id,
    targetIcon: batch.livestockIcon ?? '🐑',
    targetTypeBg: batch.livestockTypeBg ?? '#eceff1',
    tanggal, waktuPemberian, items, catatan, petugas,
    status: 'Siap Diproses',
  });

  const result = selesaikanPemberianPakan(record.id);

  let succeeded = 0;
  let failed: BatchOperationSkip[] = [];
  const createdRecordIds: string[] = [];

  if (result.success) {
    succeeded = targets.length;
    createdRecordIds.push(record.id, ...result.riwayatStokIds);
  } else {
    failed = targets.map(({ lv }) => ({ livestockId: lv.id, livestockName: lv.name ?? lv.id, reason: result.error }));
  }

  return finalizeOperation({
    batchId, type: 'FeedBatch', officer: petugas ?? null, notes: catatan ?? null,
    startedAt, targets, succeeded, failed, createdRecordIds,
  });
}

// ─── 3. Health Check ─────────────────────────────────────────────────────────
// Reuses addPemeriksaan (pemeriksaanKesehatanData.ts) — the exact individual-
// mode function KH-002 itself calls. Creates one real Pemeriksaan record per
// active member (mode: 'individu'), never mode: 'batch', so it appears in the
// animal's own Riwayat exactly like a manually-entered examination would.

export type HealthCheckInput = {
  tanggal: string;
  petugas: string;
  keluhan: string;
  gejala: string;
  suhuTubuh: string;
  nafsuMakan: NafsuMakan | '';
  aktivitas: AktivitasTernak | '';
  kondisiFeses: KondisiFeses | '';
  bcs: '1' | '2' | '3' | '4' | '5' | '';
  catatan: string;
};

export function executeHealthCheckBatch(batchId: string, input: HealthCheckInput): BatchOperationLogEntry {
  return runPerMemberOperation(batchId, 'HealthCheck', input.petugas, input.catatan, (lv) => {
    const id = addPemeriksaan({
      mode: 'individu',
      livestockId: lv.id,
      batchId: null,
      tanggal: input.tanggal,
      petugas: input.petugas,
      keluhan: input.keluhan,
      gejala: input.gejala,
      suhuTubuh: input.suhuTubuh,
      nafsuMakan: input.nafsuMakan,
      aktivitas: input.aktivitas,
      kondisiFeses: input.kondisiFeses,
      bcs: input.bcs,
      bobot: lv.weight,
      catatan: input.catatan,
    });
    markSiapDiagnosa(id);
    return { success: true, recordId: id };
  });
}

// ─── 4. Health Treatment ─────────────────────────────────────────────────────
// Reuses the FULL existing chain, per member, exactly as the manual KH-002 →
// KH-006 flow does: addPemeriksaan → addDiagnosa → createTindakanSesi/
// addTindakanItem → createPengobatanSesi/addPengobatanItem →
// executeIntegrasiPengobatan (the real atomic stock-deduction + rollback +
// RiwayatKesehatan/RiwayatObat writer). Nothing here duplicates validation,
// deduction, or rollback — every one of those calls is the same function the
// individual-mode pages already call.

export type HealthTreatmentInput = {
  tanggal: string;
  jam: string;
  petugas: string;
  keluhan: string;
  gejala: string;
  diagnosaNama: string;
  diagnosaCatatan: string;
  tindakanNama: string;
  tindakanCatatan: string;
  stokObatUuid: string;
  dosis: string;
  satuanDosis: string;
  frekuensi: string;
  lamaPemberian: string;
  caraPemberian: string;
  obatCatatan: string;
};

export function executeHealthTreatmentBatch(batchId: string, input: HealthTreatmentInput): BatchOperationLogEntry {
  const stok = getStokObatById(input.stokObatUuid);
  if (!stok) throw new Error(`Stok obat "${input.stokObatUuid}" tidak ditemukan.`);
  const generik = getObatById(stok.masterObatUuid)?.namaGenerik ?? '';

  return runPerMemberOperation(batchId, 'HealthTreatment', input.petugas, input.obatCatatan, (lv) => {
    const pemeriksaanId = addPemeriksaan({
      mode: 'individu', livestockId: lv.id, batchId: null,
      tanggal: input.tanggal, petugas: input.petugas,
      keluhan: input.keluhan, gejala: input.gejala,
      suhuTubuh: '', nafsuMakan: '', aktivitas: '', kondisiFeses: '', bcs: '',
      bobot: lv.weight, catatan: `Pengobatan Batch — ${input.tindakanNama}`,
    });
    markSiapDiagnosa(pemeriksaanId);

    const diagnosaId = addDiagnosa({
      pemeriksaanId, sumber: 'manual', penyakitUuid: null, namaPenyakit: null,
      namaDiagnosa: input.diagnosaNama, catatan: input.diagnosaCatatan,
    });

    const tindakanSesi = createTindakanSesi({ diagnosaId, pemeriksaanId });
    addTindakanItem({
      sesiId: tindakanSesi.id, diagnosaId, pemeriksaanId,
      namaTindakan: input.tindakanNama, catatan: input.tindakanCatatan,
      dilakukanOleh: input.petugas, tanggal: input.tanggal, jam: input.jam,
    });
    setPakaiObat(tindakanSesi.id, true);
    finishTindakanSesi(tindakanSesi.id);

    const pengobatanSesi = createPengobatanSesi({ tindakanSesiId: tindakanSesi.id, diagnosaId, pemeriksaanId });
    addPengobatanItem({
      sesiId: pengobatanSesi.id, tindakanSesiId: tindakanSesi.id, diagnosaId, pemeriksaanId,
      stokObatUuid: stok.uuid, namaProduk: stok.namaProduk, namaGenerik: generik,
      brand: stok.brand, bentukSediaan: stok.bentukSediaan,
      dosis: input.dosis, satuanDosis: input.satuanDosis || stok.satuan,
      frekuensi: input.frekuensi, lamaPemberian: input.lamaPemberian,
      caraPemberian: input.caraPemberian, catatan: input.obatCatatan,
    });
    finishPengobatanSesi(pengobatanSesi.id);

    const result = executeIntegrasiPengobatan(pengobatanSesi.id);
    if (!result.ok) return { success: false, reason: result.reason };
    return { success: true, recordId: result.riwayatKesehatanUuids[0] };
  });
}

// ─── 5. Batch Mutation ────────────────────────────────────────────────────────
// Reuses createMutationRequest + submitMutationRequest + executeMutationRequest
// (mutasiData.ts) with mode: 'batch' — that workflow already expands to every
// active batch member, applies the Completed effect per-livestock, and skips
// invalid members without rolling back the ones that succeeded. This function
// only translates its MutationExecutionResult into a BatchOperationLogEntry.

export type BatchMutationInput = {
  mutationType: MutationType;
  mutationDate: string;
  effectiveDate: string;
  sourceLocation: string;
  destinationLocation: string;
  sourceOwner: string;
  destinationOwner: string;
  officer: string;
  notes: string | null;
};

export function executeBatchMutation(batchId: string, input: BatchMutationInput): BatchOperationLogEntry {
  const targets = getActiveBatchMembersWithLivestock(batchId);
  if (targets.length === 0) throw new Error('Batch ini tidak memiliki anggota aktif — operasi dibatalkan.');

  const startedAt = new Date().toISOString();
  addBatchTimelineEvent({
    batchId, type: 'operation_started', date: todayLabel(),
    livestockId: null, livestockName: null, relatedBatchId: null,
    notes: `${BATCH_OPERATION_LABELS.BatchMutation} dimulai untuk ${targets.length} anggota aktif.`,
  });

  const request = createMutationRequest({
    mode: 'batch', livestockId: null, batchId,
    mutationType: input.mutationType,
    mutationDate: input.mutationDate,
    effectiveDate: input.effectiveDate,
    sourceLocation: input.sourceLocation,
    destinationLocation: input.destinationLocation,
    sourceOwner: input.sourceOwner,
    destinationOwner: input.destinationOwner,
    officer: input.officer,
    notes: input.notes,
    lampiran: [],
  });
  submitMutationRequest(request.id);
  const { execution } = executeMutationRequest(request.id);

  const lvNameById = new Map(targets.map(({ lv }) => [lv.id, lv.name ?? lv.id]));
  const failed: BatchOperationSkip[] = execution.skipped.map((s) => ({
    livestockId: s.livestockId,
    livestockName: lvNameById.get(s.livestockId) ?? s.livestockId,
    reason: s.reason,
  }));

  return finalizeOperation({
    batchId, type: 'BatchMutation', officer: input.officer, notes: input.notes,
    startedAt, targets, succeeded: execution.executed, failed, createdRecordIds: [request.id],
  });
}

// ─── 6. Batch Relocation ─────────────────────────────────────────────────────
// Reuses performTempTransfer (transferData.ts) — the exact function the
// individual "Keluar Sementara" flow calls — once per active member. Creates
// one real TransferRecord per animal. (Returning the batch to the farm is a
// separate action — see performReturn — and is out of scope for this
// operation; see BT-004 report limitations.)

export type BatchRelocationInput = {
  reason: TempTransferReason;
  destinationName: string;
  departDate: string;
  notes: string | null;
};

export function executeBatchRelocation(batchId: string, input: BatchRelocationInput): BatchOperationLogEntry {
  return runPerMemberOperation(batchId, 'BatchRelocation', null, input.notes, (lv) => {
    const record = performTempTransfer({
      livestockId: lv.id,
      reason: input.reason,
      destinationName: input.destinationName,
      departDate: input.departDate,
      notes: input.notes,
    });
    return { success: true, recordId: record.id };
  });
}

// ─── 7. Batch Observation ─────────────────────────────────────────────────────
// No existing per-animal "Observation" module exists anywhere in the app
// (verified: no note/journal/observasi data layer). This is the one operation
// where Batch Operations owns the minimal record itself instead of reusing
// another module — see BatchObservationRecord above.

export type BatchObservationInput = {
  tanggal: string;
  kondisi: ObservationCondition;
  catatan: string;
  petugas: string | null;
};

export function executeBatchObservation(batchId: string, input: BatchObservationInput): BatchOperationLogEntry {
  return runPerMemberOperation(batchId, 'BatchObservation', input.petugas, input.catatan, (lv) => {
    const record: BatchObservationRecord = {
      id: generateUUID(),
      batchId,
      livestockId: lv.id,
      livestockName: lv.name ?? lv.id,
      tanggal: input.tanggal,
      kondisi: input.kondisi,
      catatan: input.catatan,
      petugas: input.petugas,
      createdAt: new Date().toISOString(),
    };
    BATCH_OBSERVATION_LOG.push(record);
    return { success: true, recordId: record.id };
  });
}

// ─── Live Batch Summary ──────────────────────────────────────────────────────
// Every field is derived live from the underlying registries on each call —
// nothing here is cached or hardcoded.

export type MutationStatusSummary =
  | { kind: 'none' }
  | { kind: 'pending'; mutationType: MutationType }
  | { kind: 'lastCompleted'; mutationType: MutationType; effectiveDate: string };

export type BatchOperationsSummary = {
  totalMembers: number;
  averageWeight: number;     // 0 when no members
  weightUnit: string;
  totalFeedUsage: Array<{ satuan: string; jumlah: number }>;
  activeHealthCases: number;
  mutationStatus: MutationStatusSummary;
};

function isHealthCaseActive(livestockId: string, batchId: string): boolean {
  const pemeriksaanList = [...getPemeriksaanByLivestock(livestockId), ...getPemeriksaanByBatch(batchId)];
  for (const pem of pemeriksaanList) {
    const diagnosa = getDiagnosaByPemeriksaan(pem.id);
    if (!diagnosa) return true; // examined, not yet diagnosed
    const tindakan = getTindakanSesiByDiagnosa(diagnosa.id);
    if (!tindakan || tindakan.pakaiObat === null) return true; // decision pending
    if (tindakan.pakaiObat === true) {
      const pengobatan = getPengobatanSesiByTindakan(tindakan.id);
      if (!pengobatan || pengobatan.status !== 'Pengobatan Selesai') return true;
    }
    // pakaiObat === false → resolved via non-drug tindakan; keep checking others
  }
  return false;
}

export function getBatchOperationsSummary(batchId: string): BatchOperationsSummary {
  const members = getActiveBatchMembersWithLivestock(batchId);
  const totalMembers = members.length;

  const totalWeight = members.reduce((sum, { lv }) => sum + (parseFloat(lv.weight) || 0), 0);
  const averageWeight = totalMembers > 0 ? totalWeight / totalMembers : 0;
  const weightUnit = members[0]?.lv.weightUnit ?? 'Kg';

  const feedRecords = getPemberianPakanByTarget(batchId).filter((r) => r.status === 'Pemberian Pakan Selesai');
  const feedTotals = new Map<string, number>();
  for (const record of feedRecords) {
    for (const item of record.items) {
      feedTotals.set(item.satuan, (feedTotals.get(item.satuan) ?? 0) + item.jumlah);
    }
  }
  const totalFeedUsage = [...feedTotals.entries()].map(([satuan, jumlah]) => ({ satuan, jumlah }));

  const activeHealthCases = members.filter(({ lv }) => isHealthCaseActive(lv.id, batchId)).length;

  // Reuses mutasiData.ts's own history accessor — the real source of truth
  // for a batch's Mutation Request lifecycle (Draft/Pending/Approved/
  // Completed/Rejected/Cancelled), never re-derived from the operation log.
  const mutationHistory = getMutationHistoryByBatch(batchId);
  let mutationStatus: MutationStatusSummary = { kind: 'none' };
  if (mutationHistory.length > 0) {
    const latest = mutationHistory[0];
    mutationStatus =
      latest.status === 'Completed'
        ? { kind: 'lastCompleted', mutationType: latest.mutationType, effectiveDate: latest.effectiveDate }
        : { kind: 'pending', mutationType: latest.mutationType };
  }

  return { totalMembers, averageWeight, weightUnit, totalFeedUsage, activeHealthCases, mutationStatus };
}

// re-export livestock helper for convenience of callers building forms
export { getLivestock };
