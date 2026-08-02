// ─── Health History Factory ─────────────────────────────────────────────────

import { __seedHealthHistory, type HealthEntry } from '../../../data/livestockData';
import type { Rng } from '../rng';
import type { SeedConfig } from '../config';
import type { GeneratedLivestock } from './livestockFactory';
import { formatIndonesianDate, buildDescendingDateSeries } from '../dateFactory';
import { HEALTH_ACTIVITIES, HEALTH_STATUS_BY_ACTIVITY } from '../masters/healthMaster';

export function generateHealthHistory(animals: GeneratedLivestock[], config: SeedConfig, rng: Rng, now: Date): void {
  const count = config.healthHistoryPerAnimal;
  if (count <= 0) return;

  for (const { record, birthDateObj } of animals) {
    // Never fabricate a health event before the animal was born.
    const dates = buildDescendingDateSeries(now, count, 21, rng, birthDateObj); // ~every 3 weeks
    const entries: HealthEntry[] = dates.map((date) => {
      const activity = rng.pick(HEALTH_ACTIVITIES);
      return { activity, date: formatIndonesianDate(date), status: rng.pick(HEALTH_STATUS_BY_ACTIVITY[activity]), notes: null };
    });
    __seedHealthHistory(record.id, entries);
  }
}
