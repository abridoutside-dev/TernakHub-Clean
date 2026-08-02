// ─── Batch Factory ──────────────────────────────────────────────────────────
// Creates BatchRecord entries and adds members with realistic (backdated) join
// dates. addBatchMember() in batchData.ts always stamps joinDate = today, so it
// can't produce historical membership dates — addSeedBatchMember below mirrors
// its exact guard/sync logic but accepts a caller-supplied date instead. Only
// the Data Factory should ever call this; real app actions must keep using
// addBatchMember so user-triggered joins are always dated "today".

import { BATCH_DB, MEMBERSHIP_DB, type BatchRecord, type MembershipRecord } from '../../../data/batchData';
import { LIVESTOCK_DB } from '../../../data/livestockData';
import { getLivestockStatus } from '../../../data/transferData';
import type { Rng } from '../rng';
import type { SeedConfig } from '../config';
import type { GeneratedLivestock } from './livestockFactory';
import { MASTER_PROGRAM } from '../masters/programMaster';
import { formatIndonesianDate, daysBefore, clampDaysBefore } from '../dateFactory';
import { buildBatchId } from '../idFactory';
import { seedRegistry } from '../seedRegistry';

/** Mirrors CreateBatch.tsx's nextBatchId() exactly: scan existing IDs, never reuse or collide. */
function nextSeedBatchId(): string {
  let max = 0;
  for (const id of Object.keys(BATCH_DB)) {
    const m = id.match(/^BTH-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return buildBatchId(max + 1);
}

function nextSeedMembershipId(batchId: string): string {
  const compactId = batchId.replace(/-/g, '');
  const count = MEMBERSHIP_DB.filter((m) => m.batchId === batchId).length;
  return `MBR-${compactId}-${String(count + 1).padStart(3, '0')}`;
}

/**
 * Adds a livestock to a batch with a caller-supplied (possibly historical) join
 * date. Replicates addBatchMember's exact guards — batch must exist and be
 * 'Aktif', no duplicate active membership — plus its LIVESTOCK_DB.batch sync.
 * Only the Data Factory should call this; real app actions must keep using
 * addBatchMember (today's date).
 */
function addSeedBatchMember(batchId: string, livestockId: string, joinDate: string): MembershipRecord | null {
  const batch = BATCH_DB[batchId];
  if (!batch || batch.status !== 'Aktif') return null;

  const alreadyActive = MEMBERSHIP_DB.some(
    (m) => m.batchId === batchId && m.livestockId === livestockId && m.status === 'Aktif',
  );
  if (alreadyActive) return null;

  const record: MembershipRecord = {
    id: nextSeedMembershipId(batchId),
    batchId,
    livestockId,
    joinDate,
    leaveDate: null,
    status: 'Aktif',
    notes: null,
  };
  MEMBERSHIP_DB.push(record);

  if (LIVESTOCK_DB[livestockId]) {
    const totalMembers = MEMBERSHIP_DB.filter((m) => m.batchId === batchId && m.status === 'Aktif').length;
    LIVESTOCK_DB[livestockId] = {
      ...LIVESTOCK_DB[livestockId],
      batch: { id: batchId, program: batch.label, joinedDate: joinDate, totalMembers },
    };
  }
  return record;
}

export function generateBatches(animals: GeneratedLivestock[], config: SeedConfig, rng: Rng, now: Date): void {
  // Only animals currently Di Kandang can be batch members, mirroring app expectations.
  const pool = rng.shuffle(animals.filter((a) => getLivestockStatus(a.record.id) === 'Di Kandang'));

  for (let i = 0; i < config.batch; i++) {
    if (pool.length === 0) break;

    const speciesForBatch = pool[0].record.type;
    const sameSpecies = pool.filter((a) => a.record.type === speciesForBatch);

    const createdDate = formatIndonesianDate(daysBefore(now, rng.nextInt(20, 200)));
    const batchId = nextSeedBatchId();
    const sample = sameSpecies[0].record;

    const batch: BatchRecord = {
      id: batchId,
      name: null,
      label: rng.pick(MASTER_PROGRAM),
      status: 'Aktif',
      createdDate,
      updatedDate: createdDate,
      finishedDate: null,
      description: 'Dibuat oleh Developer Data Factory (seed).',
      purpose:   null,
      location:  null,
      startDate: createdDate,
      endDate:   null,
      livestockType: sample.type,
      livestockIcon: sample.typeIcon,
      livestockTypeBg: sample.typeBg,
      livestockTypeColor: sample.typeColor,
    };
    BATCH_DB[batchId] = batch;
    seedRegistry.batchIds.add(batchId);

    const memberCount = Math.min(sameSpecies.length, rng.nextInt(3, 15));
    for (let m = 0; m < memberCount; m++) {
      const animal = sameSpecies[m];
      const maxDaysBack = Math.max(1, Math.round(animal.ageMonths * 30.4));
      const joinDate = formatIndonesianDate(clampDaysBefore(now, rng.nextInt(1, 19), maxDaysBack));
      const membership = addSeedBatchMember(batchId, animal.record.id, joinDate);
      if (membership) seedRegistry.membershipIds.add(membership.id);

      const idx = pool.findIndex((a) => a.record.id === animal.record.id);
      if (idx >= 0) pool.splice(idx, 1);
    }
  }
}
