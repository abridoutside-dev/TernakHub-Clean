// ─── Batch Data Registry ──────────────────────────────────────────────────────
// Batch is a management group. It does NOT represent ownership, location, or mutation.
// Batch labels are fully user-customizable — the system never limits categories.
// Membership history is never deleted.
//
// BATCH_DB and MEMBERSHIP_DB are intentionally empty — populated when users
// create batches through the app.

import { getLivestock, LIVESTOCK_DB, type LivestockRecord } from './livestockData';

// ─── Archived-Livestock Checker (breaks circular dep with transferData) ────────
// transferData.ts imports from batchData.ts (MEMBERSHIP_DB), so batchData.ts
// cannot import from transferData.ts without creating a circular dependency.
// transferData.ts calls registerArchivedChecker() at module scope after it
// defines getLivestockStatus, wiring the guard without a circular import.
let _archivedChecker: ((id: string) => boolean) | null = null;

/**
 * Called once by transferData.ts to register the archived-status lookup.
 * batchData.ts cannot import getLivestockStatus directly due to circular deps.
 */
export function registerArchivedChecker(fn: (id: string) => boolean): void {
  _archivedChecker = fn;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type BatchStatus = 'Draft' | 'Aktif' | 'Selesai' | 'Dibatalkan' | 'Diarsipkan';

export type BatchRecord = {
  id: string;
  name: string | null;          // optional display name
  label: string;                // fully user-customizable — no system limits
  status: BatchStatus;
  createdDate: string;
  updatedDate: string;
  finishedDate: string | null;
  description: string | null;
  // Extended fields (optional for backward compat with seeded data)
  purpose: string | null;       // batch objective / tujuan
  location: string | null;      // physical location of the batch
  startDate: string | null;     // planned or actual start date
  endDate: string | null;       // planned or actual end date (optional)
  // Denormalized livestock type info for display
  livestockType: string;
  livestockIcon: string;
  livestockTypeBg: string;
  livestockTypeColor: string;
};

export type MembershipStatus = 'Aktif' | 'Keluar' | 'Selesai' | 'Dipindahkan';

export type MembershipRecord = {
  id: string;
  batchId: string;
  livestockId: string;
  joinDate: string;
  leaveDate: string | null;     // null = still active member
  status: MembershipStatus;
  notes: string | null;
  // Membership history is never deleted
};

export type MembershipWithLivestock = {
  membership: MembershipRecord;
  lv: LivestockRecord;
};

// ─── Batch Timeline Log ───────────────────────────────────────────────────────
// Immutable event log for batch-level events that cannot be derived from MEMBERSHIP_DB.
// Membership join/leave events are derived from MEMBERSHIP_DB — not stored here.

export type BatchTimelineEventType =
  | 'batch_created'
  | 'batch_activated'
  | 'batch_closed'
  | 'batch_archived'
  | 'member_moved_out'   // source batch: livestock moved OUT to another batch
  | 'member_moved_in'    // target batch: livestock moved IN from another batch
  // BT-004: Batch Operations execution lifecycle
  | 'operation_started'
  | 'operation_completed'
  | 'operation_partial'
  | 'operation_failed';

export type BatchTimelineEvent = {
  id: string;
  batchId: string;
  type: BatchTimelineEventType;
  date: string;
  livestockId: string | null;
  livestockName: string | null;
  relatedBatchId: string | null;  // source or target batch for move events
  notes: string | null;
};

export const BATCH_TIMELINE_LOG: BatchTimelineEvent[] = [];

/** Append an event to the immutable timeline log. */
export function addBatchTimelineEvent(
  event: Omit<BatchTimelineEvent, 'id'>,
): BatchTimelineEvent {
  const entry: BatchTimelineEvent = { id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...event };
  BATCH_TIMELINE_LOG.push(entry);
  return entry;
}

/** All timeline events for a specific batch, newest → oldest. */
export function getBatchTimeline(batchId: string): BatchTimelineEvent[] {
  return BATCH_TIMELINE_LOG
    .filter((e) => e.batchId === batchId)
    .slice()
    .reverse();
}

// ─── Batch Database ───────────────────────────────────────────────────────────
// Intentionally empty — populated when users create batches through the app.

export const BATCH_DB: Record<string, BatchRecord> = {};

// ─── Membership Database ──────────────────────────────────────────────────────
// Records are NEVER deleted. leaveDate + status track membership end.
// BT-002: One livestock may belong to only ONE Active Batch at a time.
// Intentionally empty — populated when users add members through the app.

export const MEMBERSHIP_DB: MembershipRecord[] = [];

// ─── Lookup Helpers ───────────────────────────────────────────────────────────

/** Returns the batch record or null if the ID does not exist. */
export function getBatch(id: string): BatchRecord | null {
  return BATCH_DB[id] ?? null;
}

/** All membership records for a batch (active + history). Never filtered. */
export function getBatchMemberships(batchId: string): MembershipRecord[] {
  return MEMBERSHIP_DB.filter((m) => m.batchId === batchId);
}

/** Only active memberships for a batch. */
export function getActiveBatchMemberships(batchId: string): MembershipRecord[] {
  return MEMBERSHIP_DB.filter((m) => m.batchId === batchId && m.status === 'Aktif');
}

/** All memberships for a batch, joined with livestock data. */
export function getBatchMembersWithLivestock(batchId: string): MembershipWithLivestock[] {
  return getBatchMemberships(batchId).map((m) => ({ membership: m, lv: getLivestock(m.livestockId) }));
}

/** Active memberships for a batch, joined with livestock data. */
export function getActiveBatchMembersWithLivestock(batchId: string): MembershipWithLivestock[] {
  return getActiveBatchMemberships(batchId).map((m) => ({ membership: m, lv: getLivestock(m.livestockId) }));
}

/** All membership records for a livestock (active + history across all batches). */
export function getLivestockMemberships(livestockId: string): MembershipRecord[] {
  return MEMBERSHIP_DB.filter((m) => m.livestockId === livestockId);
}

/** All ACTIVE batches a livestock currently belongs to (multiple allowed). */
export function getActiveLivestockBatches(
  livestockId: string,
): Array<{ membership: MembershipRecord; batch: BatchRecord }> {
  return MEMBERSHIP_DB
    .filter((m) => m.livestockId === livestockId && m.status === 'Aktif')
    .flatMap((m) => {
      const batch = getBatch(m.batchId);
      return batch ? [{ membership: m, batch }] : [];
    });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Today as an Indonesian date label, e.g. "7 Juli 2026". */
export function todayLabel(): string {
  const d = new Date();
  const MONTHS = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember',
  ];
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function nextMembershipId(batchId: string): string {
  // Match existing convention: MBR-BTH001-001 (no extra hyphens in batchId segment)
  const compactId = batchId.replace(/-/g, '');
  const count = MEMBERSHIP_DB.filter((m) => m.batchId === batchId).length;
  return `MBR-${compactId}-${String(count + 1).padStart(3, '0')}`;
}

/**
 * Add a livestock to a batch as an active member.
 * Guards: batch must be 'Aktif'; no duplicate active membership in this batch.
 * Syncs LIVESTOCK_DB.batch (denormalized).
 * Returns the new MembershipRecord.
 */
export function addBatchMember(batchId: string, livestockId: string): MembershipRecord {
  const batch = getBatch(batchId);
  if (!batch) {
    throw new Error(`Batch ${batchId} tidak ditemukan.`);
  }
  if (batch.status !== 'Aktif') {
    throw new Error(`Batch ${batchId} tidak aktif. Hanya batch aktif yang bisa menerima anggota baru.`);
  }

  // Guard: archived livestock must never enter an active batch.
  // Checker registered by transferData.ts to avoid circular import.
  if (_archivedChecker?.(livestockId)) {
    throw new Error(`Ternak ${livestockId} diarsipkan. Ternak yang diarsipkan tidak dapat bergabung ke batch aktif.`);
  }

  const alreadyActive = MEMBERSHIP_DB.some(
    (m) => m.batchId === batchId && m.livestockId === livestockId && m.status === 'Aktif',
  );
  if (alreadyActive) {
    throw new Error(`Ternak ${livestockId} sudah menjadi anggota aktif batch ini.`);
  }

  const today = todayLabel();
  const record: MembershipRecord = {
    id: nextMembershipId(batchId),
    batchId, livestockId,
    joinDate: today, leaveDate: null,
    status: 'Aktif', notes: null,
  };
  MEMBERSHIP_DB.push(record);

  // Sync denormalized LIVESTOCK_DB.batch
  if (LIVESTOCK_DB[livestockId]) {
    const totalMembers = getActiveBatchMemberships(batchId).length;
    LIVESTOCK_DB[livestockId] = {
      ...LIVESTOCK_DB[livestockId],
      batch: { id: batchId, program: batch.label, joinedDate: today, totalMembers },
    };
  }

  return record;
}

/**
 * Activate a Draft batch: status → 'Aktif'. No-op if already Aktif or closed.
 */
export function activateBatch(batchId: string): void {
  const batch = BATCH_DB[batchId];
  if (!batch || batch.status !== 'Draft') return;

  const today = todayLabel();
  BATCH_DB[batchId] = { ...batch, status: 'Aktif', updatedDate: today };

  addBatchTimelineEvent({
    batchId,
    type: 'batch_activated',
    date: today,
    livestockId: null,
    livestockName: null,
    relatedBatchId: null,
    notes: null,
  });
}

/**
 * Move one or more livestock members from this batch to a target batch.
 * Guards: source batch and target batch must both be 'Aktif'; membership must be active.
 * Closes old membership as 'Dipindahkan', creates new membership in target batch.
 * Appends 'member_moved_out' and 'member_moved_in' timeline events.
 * Returns the new MembershipRecord in the target batch.
 */
export function moveBatchMember(
  membershipId: string,
  targetBatchId: string,
  notes: string | null,
): MembershipRecord {
  const idx = MEMBERSHIP_DB.findIndex(
    (m) => m.id === membershipId && m.status === 'Aktif',
  );
  if (idx < 0) throw new Error('Keanggotaan aktif tidak ditemukan.');

  const oldMembership = MEMBERSHIP_DB[idx];
  const sourceBatchId = oldMembership.batchId;
  const { livestockId } = oldMembership;

  if (sourceBatchId === targetBatchId) throw new Error('Batch tujuan harus berbeda dari batch sumber.');

  const sourceBatch = BATCH_DB[sourceBatchId];
  const targetBatch = BATCH_DB[targetBatchId];
  if (!sourceBatch || sourceBatch.status !== 'Aktif') throw new Error('Batch sumber tidak aktif.');
  if (!targetBatch || targetBatch.status !== 'Aktif') throw new Error('Batch tujuan tidak aktif.');

  // Guard: target batch must not already have this livestock as active member
  const alreadyInTarget = MEMBERSHIP_DB.some(
    (m) => m.batchId === targetBatchId && m.livestockId === livestockId && m.status === 'Aktif',
  );
  if (alreadyInTarget) throw new Error('Ternak sudah menjadi anggota aktif di batch tujuan.');

  const today = todayLabel();
  const trimmedNotes = notes?.trim() || null;

  // Close old membership as 'Dipindahkan'
  MEMBERSHIP_DB[idx] = {
    ...oldMembership,
    leaveDate: today,
    status: 'Dipindahkan',
    notes: trimmedNotes,
  };

  // Create new membership in target batch
  const newRecord: MembershipRecord = {
    id: nextMembershipId(targetBatchId),
    batchId: targetBatchId,
    livestockId,
    joinDate: today,
    leaveDate: null,
    status: 'Aktif',
    notes: null,
  };
  MEMBERSHIP_DB.push(newRecord);

  // Sync LIVESTOCK_DB.batch to target batch
  if (LIVESTOCK_DB[livestockId]) {
    const totalMembers = getActiveBatchMemberships(targetBatchId).length;
    LIVESTOCK_DB[livestockId] = {
      ...LIVESTOCK_DB[livestockId],
      batch: {
        id: targetBatchId,
        program: targetBatch.label,
        joinedDate: today,
        totalMembers,
      },
    };
  }

  // Append timeline events to both batches
  const lv = LIVESTOCK_DB[livestockId];
  const lvName = lv ? (lv.name ?? lv.id) : livestockId;

  addBatchTimelineEvent({
    batchId: sourceBatchId,
    type: 'member_moved_out',
    date: today,
    livestockId,
    livestockName: lvName,
    relatedBatchId: targetBatchId,
    notes: trimmedNotes,
  });

  addBatchTimelineEvent({
    batchId: targetBatchId,
    type: 'member_moved_in',
    date: today,
    livestockId,
    livestockName: lvName,
    relatedBatchId: sourceBatchId,
    notes: trimmedNotes,
  });

  return newRecord;
}

/**
 * Finish a batch: status → 'Selesai', record finishedDate, mark all active memberships
 * as 'Selesai', and clear the denormalized LIVESTOCK_DB.batch for every affected livestock.
 * History is never deleted.
 */
export function finishBatch(batchId: string): void {
  const batch = BATCH_DB[batchId];
  if (!batch || batch.status !== 'Aktif') return;

  const today = todayLabel();

  // Update batch record first
  BATCH_DB[batchId] = { ...batch, status: 'Selesai', finishedDate: today, updatedDate: today };

  // Append batch_closed timeline event
  addBatchTimelineEvent({
    batchId,
    type: 'batch_closed',
    date: today,
    livestockId: null,
    livestockName: null,
    relatedBatchId: null,
    notes: null,
  });

  // Mark every active membership as 'Selesai' and sync LIVESTOCK_DB
  const activeIdxs = MEMBERSHIP_DB
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.batchId === batchId && m.status === 'Aktif');

  for (const { m: rec, i: idx } of activeIdxs) {
    MEMBERSHIP_DB[idx] = { ...rec, leaveDate: today, status: 'Selesai' };

    // Sync LIVESTOCK_DB.batch for this livestock
    const { livestockId } = rec;
    if (!LIVESTOCK_DB[livestockId]) continue;

    // Any remaining ACTIVE memberships in OTHER batches?
    const remaining = MEMBERSHIP_DB.filter(
      (x) => x.livestockId === livestockId && x.status === 'Aktif' && x.batchId !== batchId,
    );

    if (remaining.length === 0) {
      LIVESTOCK_DB[livestockId] = { ...LIVESTOCK_DB[livestockId], batch: null };
    } else {
      const other = remaining[0];
      const otherBatch = getBatch(other.batchId);
      if (otherBatch) {
        LIVESTOCK_DB[livestockId] = {
          ...LIVESTOCK_DB[livestockId],
          batch: {
            id: other.batchId,
            program: otherBatch.label,
            joinedDate: other.joinDate,
            totalMembers: getActiveBatchMemberships(other.batchId).length,
          },
        };
      }
    }
  }
}

/**
 * Archive a batch: status → 'Diarsipkan'. If the batch is still Aktif, finishes it
 * first (members marked Selesai, LIVESTOCK_DB cleared). Archived batches are hidden
 * from the default Active list but remain in the Diarsipkan filter and in all history.
 */
export function archiveBatch(batchId: string): void {
  const batch = BATCH_DB[batchId];
  if (!batch || batch.status === 'Diarsipkan') return;

  if (batch.status === 'Aktif') {
    finishBatch(batchId); // marks members Selesai + clears LIVESTOCK_DB
  }

  const today = todayLabel();
  BATCH_DB[batchId] = { ...BATCH_DB[batchId], status: 'Diarsipkan', updatedDate: today };

  addBatchTimelineEvent({
    batchId,
    type: 'batch_archived',
    date: today,
    livestockId: null,
    livestockName: null,
    relatedBatchId: null,
    notes: null,
  });
}

/**
 * Update editable fields of a batch: name, description, purpose, location, startDate, endDate.
 * Created date, history, and member history are never modified.
 * LIVESTOCK_DB.batch.program stores the label (type), not the name, so no
 * denormalized sync is needed — LivestockProfile reads the name via getBatch().
 */
export function updateBatch(
  batchId: string,
  updates: {
    name?: string | null;
    description?: string | null;
    purpose?: string | null;
    location?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  },
): void {
  const batch = BATCH_DB[batchId];
  if (!batch) return;

  const today = todayLabel();
  BATCH_DB[batchId] = {
    ...batch,
    name:        'name'        in updates ? (updates.name?.trim()        || null) : batch.name,
    description: 'description' in updates ? (updates.description?.trim() || null) : batch.description,
    purpose:     'purpose'     in updates ? (updates.purpose?.trim()     || null) : (batch.purpose     ?? null),
    location:    'location'    in updates ? (updates.location?.trim()    || null) : (batch.location    ?? null),
    startDate:   'startDate'   in updates ? (updates.startDate?.trim()   || null) : (batch.startDate   ?? null),
    endDate:     'endDate'     in updates ? (updates.endDate?.trim()     || null) : (batch.endDate     ?? null),
    updatedDate: today,
  };
}

/**
 * Remove a livestock from a batch by marking an ACTIVE membership record as 'Keluar'.
 * No-ops on non-active records to protect immutable history.
 * Syncs LIVESTOCK_DB.batch: clears if no active batches remain, or points to another.
 */
export function removeBatchMember(membershipId: string, notes: string | null): void {
  const idx = MEMBERSHIP_DB.findIndex(
    (m) => m.id === membershipId && m.status === 'Aktif',
  );
  if (idx < 0) return; // not found or already ended — guard history immutability

  const today = todayLabel();
  const rec = MEMBERSHIP_DB[idx];
  MEMBERSHIP_DB[idx] = {
    ...rec,
    leaveDate: today,
    status: 'Keluar',
    notes: notes?.trim() || rec.notes,
  };

  // Sync LIVESTOCK_DB.batch
  const { livestockId } = rec;
  const remainingActive = MEMBERSHIP_DB.filter(
    (m) => m.livestockId === livestockId && m.status === 'Aktif',
  );

  if (!LIVESTOCK_DB[livestockId]) return;

  if (remainingActive.length === 0) {
    // No active batch left — clear denormalized field
    LIVESTOCK_DB[livestockId] = { ...LIVESTOCK_DB[livestockId], batch: null };
  } else {
    // Point to the first remaining active batch (deterministic)
    const other = remainingActive[0];
    const otherBatch = getBatch(other.batchId);
    if (otherBatch) {
      const totalMembers = getActiveBatchMemberships(other.batchId).length;
      LIVESTOCK_DB[livestockId] = {
        ...LIVESTOCK_DB[livestockId],
        batch: {
          id: other.batchId,
          program: otherBatch.label,
          joinedDate: other.joinDate,
          totalMembers,
        },
      };
    }
  }
}
