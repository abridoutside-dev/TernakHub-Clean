// ─── Ownership Factory ──────────────────────────────────────────────────────
// For a fraction of animals, prepends a historical ownership record (purchased
// from another farm before joining this one) ahead of the seed registration
// record already created by LivestockFactory — so Riwayat Kepemilikan shows
// realistic multi-entry history for some animals.

import { OWNERSHIP_DB, type OwnershipRecord } from '../../../data/livestockData';
import type { Rng } from '../rng';
import type { SeedConfig } from '../config';
import type { GeneratedLivestock } from './livestockFactory';
import { formatIndonesianDate, daysBefore } from '../dateFactory';
import { PREVIOUS_OWNER_NAMES } from '../masters/nameMaster';

export function generateOwnershipHistory(animals: GeneratedLivestock[], config: SeedConfig, rng: Rng, now: Date): void {
  for (const { record } of animals) {
    if (!rng.chance(config.extraOwnershipRecordsProbability)) continue;
    const current = OWNERSHIP_DB[record.id];
    if (!current || current.length === 0) continue;

    const priorStart = formatIndonesianDate(daysBefore(now, rng.nextInt(60, 400)));
    const priorRecord: OwnershipRecord = {
      id: `OWN-${record.id}-SEED-00`,
      owner: rng.pick(PREVIOUS_OWNER_NAMES),
      workspace: rng.pick(PREVIOUS_OWNER_NAMES),
      startDate: priorStart,
      endDate: current[0].startDate,
      method: 'Pembelian',
      notes: 'Riwayat kepemilikan sebelumnya (seed).',
      isCurrent: false,
    };
    OWNERSHIP_DB[record.id] = [priorRecord, ...current];
  }
}
