// ─── Clear Orchestrator ─────────────────────────────────────────────────────
// Removes ONLY data created by the Developer Data Factory, identified purely by
// seedRegistry membership (the "generated=true" marker — see seedRegistry.ts).
// Anything not in the registry (i.e. every real user-entered record) is left
// completely untouched.

import { LIVESTOCK_DB, OWNERSHIP_DB, PEDIGREE_DB, __clearWeightHistory, __clearHealthHistory, __clearReproHistory } from '../../data/livestockData';
import { BATCH_DB, MEMBERSHIP_DB } from '../../data/batchData';
import { LIVESTOCK_STATUS_DB, OUTSIDE_LIVESTOCK_DB, TRANSFER_HISTORY } from '../../data/transferData';
import { FEED_LOG_DB } from './stores/feedStore';
import { MEDICINE_LOG_DB } from './stores/medicineStore';
import { seedRegistry, resetSeedRegistry } from './seedRegistry';

export type ClearResult = {
  livestockRemoved: number;
  batchesRemoved: number;
  membershipsRemoved: number;
  transfersRemoved: number;
  feedLogsRemoved: number;
  medicineLogsRemoved: number;
};

export function clearSeed(): ClearResult {
  let livestockRemoved = 0;
  for (const id of seedRegistry.livestockIds) {
    if (LIVESTOCK_DB[id]) {
      delete LIVESTOCK_DB[id];
      livestockRemoved += 1;
    }
    delete OWNERSHIP_DB[id];
    delete PEDIGREE_DB[id];
    __clearWeightHistory(id);
    __clearHealthHistory(id);
    __clearReproHistory(id);
    delete LIVESTOCK_STATUS_DB[id];
  }

  for (let i = OUTSIDE_LIVESTOCK_DB.length - 1; i >= 0; i--) {
    if (seedRegistry.livestockIds.has(OUTSIDE_LIVESTOCK_DB[i].livestockId)) OUTSIDE_LIVESTOCK_DB.splice(i, 1);
  }

  let transfersRemoved = 0;
  for (let i = TRANSFER_HISTORY.length - 1; i >= 0; i--) {
    if (seedRegistry.transferIds.has(TRANSFER_HISTORY[i].id)) {
      TRANSFER_HISTORY.splice(i, 1);
      transfersRemoved += 1;
    }
  }

  let membershipsRemoved = 0;
  for (let i = MEMBERSHIP_DB.length - 1; i >= 0; i--) {
    if (seedRegistry.membershipIds.has(MEMBERSHIP_DB[i].id)) {
      MEMBERSHIP_DB.splice(i, 1);
      membershipsRemoved += 1;
    }
  }

  let batchesRemoved = 0;
  for (const id of seedRegistry.batchIds) {
    if (BATCH_DB[id]) {
      delete BATCH_DB[id];
      batchesRemoved += 1;
    }
  }

  let feedLogsRemoved = 0;
  for (let i = FEED_LOG_DB.length - 1; i >= 0; i--) {
    if (seedRegistry.feedLogIds.has(FEED_LOG_DB[i].id)) {
      FEED_LOG_DB.splice(i, 1);
      feedLogsRemoved += 1;
    }
  }

  let medicineLogsRemoved = 0;
  for (let i = MEDICINE_LOG_DB.length - 1; i >= 0; i--) {
    if (seedRegistry.medicineLogIds.has(MEDICINE_LOG_DB[i].id)) {
      MEDICINE_LOG_DB.splice(i, 1);
      medicineLogsRemoved += 1;
    }
  }

  resetSeedRegistry();

  return { livestockRemoved, batchesRemoved, membershipsRemoved, transfersRemoved, feedLogsRemoved, medicineLogsRemoved };
}
