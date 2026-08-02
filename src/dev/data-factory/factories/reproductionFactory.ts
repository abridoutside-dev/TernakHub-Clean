// ─── Reproduction Factory ───────────────────────────────────────────────────
// Only applies to animals LivestockFactory flagged as breeding-eligible.

import { __seedReproHistory, type ReproEntry } from '../../../data/livestockData';
import type { Rng } from '../rng';
import type { SeedConfig } from '../config';
import type { GeneratedLivestock } from './livestockFactory';
import { formatIndonesianDate, buildDescendingDateSeries } from '../dateFactory';
import { REPRO_ACTIVITIES, REPRO_STATUS_BY_ACTIVITY, MIN_BREEDING_AGE_MONTHS } from '../masters/reproMaster';

export function generateReproductionHistory(animals: GeneratedLivestock[], config: SeedConfig, rng: Rng, now: Date): void {
  const count = config.reproHistoryPerAnimal;
  if (count <= 0) return;

  for (const { record, breedingEligible, ageMonths, birthDateObj } of animals) {
    if (!breedingEligible || ageMonths < MIN_BREEDING_AGE_MONTHS) continue;
    // Roughly one breeding cycle per quarter, never predating the animal's birth.
    const dates = buildDescendingDateSeries(now, count, 90, rng, birthDateObj);
    const entries: ReproEntry[] = dates.map((date, idx) => {
      const activity = REPRO_ACTIVITIES[idx % REPRO_ACTIVITIES.length];
      return { activity, date: formatIndonesianDate(date), status: rng.pick(REPRO_STATUS_BY_ACTIVITY[activity]), notes: null };
    });
    if (entries.length > 0) __seedReproHistory(record.id, entries);
  }
}
