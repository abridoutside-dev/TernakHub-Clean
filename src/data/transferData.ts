// ─── Transfer Data Registry ───────────────────────────────────────────────────
// Central source of truth for livestock status (Di Kandang / Luar Kandang / Arsip)
// and all transfer records. Pages must use the exported helpers — never read
// LIVESTOCK_STATUS_DB or OUTSIDE_LIVESTOCK_DB directly.
//
// All stores are intentionally empty — populated at runtime when users record
// transfers through the app.

import { LIVESTOCK_DB } from './livestockData';
import { MEMBERSHIP_DB, todayLabel, registerArchivedChecker } from './batchData';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Where the animal is — the only three valid livestock statuses. */
export type LivestockStatus = 'Di Kandang' | 'Luar Kandang' | 'Arsip';

/** Reasons for a temporary (Keluar Sementara) transfer. */
export type TempTransferReason =
  | 'Antar Kandang'
  | 'Penitipan Farm'
  | 'Dokter Hewan'
  | 'Layanan Kawin'
  | 'Kontes'
  | 'Karantina'
  | 'Lainnya';

/** Reasons for a permanent (Keluar Permanen) transfer. */
export type PermanentTransferReason =
  | 'Penjualan'
  | 'Rumah Potong'
  | 'Mati'
  | 'Hilang'
  | 'Hibah';

export type TransferReason = TempTransferReason | PermanentTransferReason;

export type MutasiAction = 'Keluar Sementara' | 'Kembali ke Kandang' | 'Keluar Permanen';

export type TransferRecord = {
  id: string;
  livestockId: string;
  action: MutasiAction;
  reason: TransferReason | null; // null for return-to-farm
  destinationName: string | null;
  departDate: string;
  notes: string | null;
  recordedDate: string;
};

export type OutsideLivestockEntry = {
  livestockId: string;
  reason: TempTransferReason;
  destinationName: string;
  since: string;
  daysOut: number;
  previousLocation: string; // restored when returning to farm
};

// ─── Status Store ─────────────────────────────────────────────────────────────
// Maps livestock ID → current livestock status (Di Kandang / Luar Kandang / Arsip).
// Intentionally empty — populated when livestock are registered and transferred.

export const LIVESTOCK_STATUS_DB: Record<string, LivestockStatus> = {};

// ─── Outside Livestock Store ──────────────────────────────────────────────────
// One entry per livestock currently outside the farm.
// Intentionally empty — populated when transfers are recorded through the app.

export const OUTSIDE_LIVESTOCK_DB: OutsideLivestockEntry[] = [];

// ─── Transfer History ─────────────────────────────────────────────────────────
// Intentionally empty — populated when transfers are recorded through the app.

export const TRANSFER_HISTORY: TransferRecord[] = [];

let _transferCounter = 0;
function nextTransferId(): string {
  _transferCounter += 1;
  return `TRF-${String(_transferCounter).padStart(4, '0')}`;
}

// ─── Lookup Helpers ───────────────────────────────────────────────────────────

export function getLivestockStatus(id: string): LivestockStatus {
  return LIVESTOCK_STATUS_DB[id] ?? 'Di Kandang';
}

// AUDIT-LIVESTOCK-BATCH-001 MAJOR-001: Wire archived-status guard into batchData
// without creating a circular import (batchData imports from transferData is not
// possible since transferData already imports MEMBERSHIP_DB from batchData).
// registerArchivedChecker accepts the fn and stores it; addBatchMember calls it.
registerArchivedChecker((id) => getLivestockStatus(id) === 'Arsip');

/** All transfer records for a specific livestock ID, chronological (oldest first). */
export function getTransferHistoryByLivestock(id: string): TransferRecord[] {
  return TRANSFER_HISTORY.filter((r) => r.livestockId === id);
}

export function getOutsideEntry(id: string): OutsideLivestockEntry | undefined {
  return OUTSIDE_LIVESTOCK_DB.find((e) => e.livestockId === id);
}

export function getActiveOutsideLivestock(): ReadonlyArray<OutsideLivestockEntry> {
  return OUTSIDE_LIVESTOCK_DB;
}

export function countByStatus(): { diKandang: number; luarKandang: number; arsip: number } {
  const values = Object.values(LIVESTOCK_STATUS_DB);
  return {
    diKandang:   values.filter((s) => s === 'Di Kandang').length,
    luarKandang: values.filter((s) => s === 'Luar Kandang').length,
    arsip:       values.filter((s) => s === 'Arsip').length,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

function assertCanTransferOut(id: string): void {
  const status = getLivestockStatus(id);
  if (status === 'Luar Kandang') {
    throw new Error('Ternak sudah berada di luar kandang. Kembalikan ternak terlebih dahulu.');
  }
  if (status === 'Arsip') {
    throw new Error('Ternak sudah diarsipkan dan tidak dapat dipindahkan.');
  }
}

function assertIsOutside(id: string): void {
  if (getLivestockStatus(id) !== 'Luar Kandang') {
    throw new Error('Ternak tidak berada di luar kandang.');
  }
}

function assertCanPermanentlyTransfer(id: string): void {
  const status = getLivestockStatus(id);
  if (status === 'Arsip') {
    throw new Error('Ternak sudah diarsipkan.');
  }
  if (status === 'Luar Kandang') {
    throw new Error('Ternak sedang di luar kandang. Kembalikan ternak terlebih dahulu sebelum mencatat keluar permanen.');
  }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Record a temporary transfer (Keluar Sementara).
 * - Validates the livestock is Di Kandang (not Luar Kandang or Arsip)
 * - Sets status → Luar Kandang
 * - Adds to OUTSIDE_LIVESTOCK_DB
 * - Updates LIVESTOCK_DB.location to the destination name
 */
export function performTempTransfer(params: {
  livestockId: string;
  reason: TempTransferReason;
  destinationName: string;
  departDate: string;
  notes: string | null;
}): TransferRecord {
  assertCanTransferOut(params.livestockId);

  const today = todayLabel();
  const record: TransferRecord = {
    id: nextTransferId(),
    livestockId: params.livestockId,
    action: 'Keluar Sementara',
    reason: params.reason,
    destinationName: params.destinationName || null,
    departDate: params.departDate || today,
    notes: params.notes,
    recordedDate: today,
  };

  // Snapshot previous location before changing it
  const previousLocation = LIVESTOCK_DB[params.livestockId]?.location ?? '';

  // Update status
  LIVESTOCK_STATUS_DB[params.livestockId] = 'Luar Kandang';

  // Add to outside store — use provided departDate as "since" when given
  OUTSIDE_LIVESTOCK_DB.push({
    livestockId: params.livestockId,
    reason: params.reason,
    destinationName: params.destinationName || params.reason,
    since: params.departDate || today,
    daysOut: 0,
    previousLocation,
  });

  // Update LIVESTOCK_DB.location to reflect outside destination
  if (LIVESTOCK_DB[params.livestockId]) {
    const dest = params.destinationName || params.reason;
    LIVESTOCK_DB[params.livestockId] = {
      ...LIVESTOCK_DB[params.livestockId],
      location: `${dest} (${params.reason})`,
    };
  }

  TRANSFER_HISTORY.push(record);
  return record;
}

/**
 * Record a return to farm (Kembali ke Kandang).
 * - Validates the livestock is Luar Kandang
 * - Sets status → Di Kandang
 * - Removes from OUTSIDE_LIVESTOCK_DB
 * - Restores livestock location in LIVESTOCK_DB from stored previousLocation
 * - Does NOT create duplicate batch memberships
 */
export function performReturn(params: {
  livestockId: string;
  notes: string | null;
}): TransferRecord {
  assertIsOutside(params.livestockId);

  const entry = getOutsideEntry(params.livestockId);
  const today = todayLabel();
  const record: TransferRecord = {
    id: nextTransferId(),
    livestockId: params.livestockId,
    action: 'Kembali ke Kandang',
    reason: null,
    destinationName: null,
    departDate: today,
    notes: params.notes,
    recordedDate: today,
  };

  // Update status
  LIVESTOCK_STATUS_DB[params.livestockId] = 'Di Kandang';

  // Remove from outside store
  const idx = OUTSIDE_LIVESTOCK_DB.findIndex((e) => e.livestockId === params.livestockId);
  if (idx >= 0) OUTSIDE_LIVESTOCK_DB.splice(idx, 1);

  // Restore location in LIVESTOCK_DB
  if (LIVESTOCK_DB[params.livestockId] && entry?.previousLocation) {
    LIVESTOCK_DB[params.livestockId] = {
      ...LIVESTOCK_DB[params.livestockId],
      location: entry.previousLocation,
    };
  }

  TRANSFER_HISTORY.push(record);
  return record;
}

// ─── MT-004: Mutation Request sync point ──────────────────────────────────────
// The new UUID-based Mutation Request workflow (src/data/mutasiData.ts) has its
// own independent status/validation model and does NOT reuse
// performTempTransfer/performReturn/performPermanentTransfer (those stay wired
// to the legacy Keluar Sementara/Kembali/Keluar Permanen actions only, each with
// its own Indonesian-language reason enum that a Mutation Type does not map onto
// cleanly). This is the single function a completed Mutation Request calls to
// keep the legacy Di Kandang/Luar Kandang/Arsip engine (and therefore
// Livestock/Dashboard counts) in sync. It intentionally does NOT write to
// TRANSFER_HISTORY — the Mutation Request's own event/history logs already
// record the transition.

/**
 * Applies a Completed Mutation Request's effect onto the legacy location/status
 * engine for one livestock. Called only from mutasiData.ts's executeMutationRequest.
 */
export function applyMutationLocationEffect(params: {
  livestockId: string;
  newStatus: LivestockStatus;
  newLocation: string;
  recordedDate: string;
}): void {
  const { livestockId, newStatus, newLocation, recordedDate } = params;
  const previousLocation = LIVESTOCK_DB[livestockId]?.location ?? '';

  LIVESTOCK_STATUS_DB[livestockId] = newStatus;

  const outsideIdx = OUTSIDE_LIVESTOCK_DB.findIndex((e) => e.livestockId === livestockId);

  if (newStatus === 'Luar Kandang') {
    const entry: OutsideLivestockEntry = {
      livestockId,
      reason: 'Lainnya',
      destinationName: newLocation || 'Lainnya',
      since: recordedDate,
      daysOut: 0,
      previousLocation,
    };
    if (outsideIdx >= 0) OUTSIDE_LIVESTOCK_DB[outsideIdx] = entry;
    else OUTSIDE_LIVESTOCK_DB.push(entry);

    if (LIVESTOCK_DB[livestockId]) {
      LIVESTOCK_DB[livestockId] = { ...LIVESTOCK_DB[livestockId], location: newLocation || previousLocation };
    }
    return;
  }

  if (outsideIdx >= 0) OUTSIDE_LIVESTOCK_DB.splice(outsideIdx, 1);

  if (newStatus === 'Arsip') {
    // End all active batch memberships — mirrors performPermanentTransfer.
    for (let i = 0; i < MEMBERSHIP_DB.length; i++) {
      const m = MEMBERSHIP_DB[i];
      if (m.livestockId === livestockId && m.status === 'Aktif') {
        MEMBERSHIP_DB[i] = { ...m, leaveDate: recordedDate, status: 'Keluar' };
      }
    }
    if (LIVESTOCK_DB[livestockId]) {
      LIVESTOCK_DB[livestockId] = { ...LIVESTOCK_DB[livestockId], batch: null };
    }
    return;
  }

  // 'Di Kandang' — update to the destination location (Internal Relocation, Purchase, etc.)
  if (LIVESTOCK_DB[livestockId]) {
    LIVESTOCK_DB[livestockId] = { ...LIVESTOCK_DB[livestockId], location: newLocation || previousLocation };
  }
}

/**
 * Record a permanent transfer (Keluar Permanen).
 * - Validates the livestock is Di Kandang (not already Arsip or Luar Kandang)
 * - Sets status → Arsip
 * - Ends all active batch memberships (no duplicates possible)
 */
export function performPermanentTransfer(params: {
  livestockId: string;
  reason: PermanentTransferReason;
  date: string;
  notes: string | null;
}): TransferRecord {
  assertCanPermanentlyTransfer(params.livestockId);

  const today = todayLabel();
  const record: TransferRecord = {
    id: nextTransferId(),
    livestockId: params.livestockId,
    action: 'Keluar Permanen',
    reason: params.reason,
    destinationName: null,
    departDate: params.date || today,
    notes: params.notes,
    recordedDate: today,
  };

  // Update status
  LIVESTOCK_STATUS_DB[params.livestockId] = 'Arsip';

  // End all active batch memberships
  for (let i = 0; i < MEMBERSHIP_DB.length; i++) {
    const m = MEMBERSHIP_DB[i];
    if (m.livestockId === params.livestockId && m.status === 'Aktif') {
      MEMBERSHIP_DB[i] = { ...m, leaveDate: today, status: 'Keluar' };
    }
  }

  // Clear denormalized batch in LIVESTOCK_DB
  if (LIVESTOCK_DB[params.livestockId]) {
    LIVESTOCK_DB[params.livestockId] = {
      ...LIVESTOCK_DB[params.livestockId],
      batch: null,
    };
  }

  TRANSFER_HISTORY.push(record);
  return record;
}
