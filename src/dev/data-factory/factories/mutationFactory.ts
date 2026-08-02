// ─── Mutation Factory ───────────────────────────────────────────────────────
// Drives realistic Riwayat Mutasi by calling the app's own guarded transfer
// functions (performTempTransfer / performReturn / performPermanentTransfer)
// instead of writing to TRANSFER_HISTORY/LIVESTOCK_STATUS_DB/OUTSIDE_LIVESTOCK_DB
// directly — this keeps every invariant those functions already enforce intact.

import { performTempTransfer, performReturn, performPermanentTransfer } from '../../../data/transferData';
import type { Rng } from '../rng';
import type { SeedConfig } from '../config';
import type { GeneratedLivestock } from './livestockFactory';
import { formatIndonesianDate, clampDaysBefore } from '../dateFactory';
import { MASTER_TEMP_TRANSFER_REASONS, MASTER_PERMANENT_TRANSFER_REASONS } from '../masters/locationMaster';
import { seedRegistry } from '../seedRegistry';

export function generateMutationHistory(animals: GeneratedLivestock[], config: SeedConfig, rng: Rng, now: Date): void {
  for (const { record, ageMonths } of animals) {
    const roll = rng.next();
    // Never backdate a transfer further than the animal has actually been alive.
    const maxDaysBack = Math.max(1, Math.round(ageMonths * 30.4));

    if (roll < config.archiveProbability) {
      const departDate = formatIndonesianDate(clampDaysBefore(now, rng.nextInt(10, 300), maxDaysBack));
      const tr = performPermanentTransfer({
        livestockId: record.id,
        reason: rng.pick(MASTER_PERMANENT_TRANSFER_REASONS),
        date: departDate,
        notes: 'Dibuat oleh Developer Data Factory (seed).',
      });
      seedRegistry.transferIds.add(tr.id);
      continue;
    }

    if (roll < config.archiveProbability + config.outsideProbability) {
      const departDate = formatIndonesianDate(clampDaysBefore(now, rng.nextInt(1, 60), maxDaysBack));
      const tr = performTempTransfer({
        livestockId: record.id,
        reason: rng.pick(MASTER_TEMP_TRANSFER_REASONS),
        destinationName: 'Lokasi Sementara (seed)',
        departDate,
        notes: 'Dibuat oleh Developer Data Factory (seed).',
      });
      seedRegistry.transferIds.add(tr.id);
      continue;
    }

    // Otherwise stays "Di Kandang" — optionally gets one completed past out-and-back trip.
    if (rng.chance(config.mutationProbability)) {
      const departDate = formatIndonesianDate(clampDaysBefore(now, rng.nextInt(60, 240), maxDaysBack));
      const trOut = performTempTransfer({
        livestockId: record.id,
        reason: rng.pick(MASTER_TEMP_TRANSFER_REASONS),
        destinationName: 'Lokasi Sementara (seed)',
        departDate,
        notes: 'Dibuat oleh Developer Data Factory (seed).',
      });
      seedRegistry.transferIds.add(trOut.id);

      const trBack = performReturn({ livestockId: record.id, notes: 'Kembali dari lokasi sementara (seed).' });
      seedRegistry.transferIds.add(trBack.id);
    }
  }
}
