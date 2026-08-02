// ─── Medicine Factory (Obat) ────────────────────────────────────────────────
// See stores/medicineStore.ts for why this writes to a dev-only store rather
// than a shared app store.

import { MEDICINE_LOG_DB, type MedicineLogEntry } from '../stores/medicineStore';
import type { Rng } from '../rng';
import type { SeedConfig } from '../config';
import type { GeneratedLivestock } from './livestockFactory';
import { formatIndonesianDate, clampDaysBefore } from '../dateFactory';
import { seedRegistry } from '../seedRegistry';
import { MEDICINE_NAMES } from '../masters/medicineMaster';

export function generateMedicineLogs(animals: GeneratedLivestock[], config: SeedConfig, rng: Rng, now: Date): void {
  if (config.medicineLogsPerAnimalProbability <= 0) return;
  let counter = MEDICINE_LOG_DB.length;

  for (const { record, ageMonths } of animals) {
    if (!rng.chance(config.medicineLogsPerAnimalProbability)) continue;
    counter += 1;
    const maxDaysBack = Math.max(1, Math.round(ageMonths * 30.4));
    const entry: MedicineLogEntry = {
      id: `MED-SEED-${String(counter).padStart(5, '0')}`,
      livestockId: record.id,
      medicineName: rng.pick(MEDICINE_NAMES),
      dose: `${rng.nextInt(1, 10)} ml`,
      date: formatIndonesianDate(clampDaysBefore(now, rng.nextInt(1, 180), maxDaysBack)),
      notes: null,
    };
    MEDICINE_LOG_DB.push(entry);
    seedRegistry.medicineLogIds.add(entry.id);
  }
}
