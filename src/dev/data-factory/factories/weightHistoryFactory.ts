// ─── Weight History Factory ─────────────────────────────────────────────────
// Builds a monotonic-ish (with noise) weight progression ending exactly at the
// animal's current LivestockRecord.weight, stored newest-first to match the
// app's convention (see RiwayatBobot/CatatBobot reading history[0] as latest).

import { __seedWeightHistory, type WeightEntry } from '../../../data/livestockData';
import { generateUUID } from '../../../utils/uuid';
import type { Rng } from '../rng';
import type { SeedConfig } from '../config';
import type { GeneratedLivestock } from './livestockFactory';
import { formatIndonesianDate, buildDescendingDateSeries } from '../dateFactory';

export function generateWeightHistory(animals: GeneratedLivestock[], config: SeedConfig, rng: Rng, now: Date): void {
  const count = config.weightHistoryPerAnimal;
  if (count <= 0) return;

  for (const { record, birthDateObj } of animals) {
    // Never fabricate a weigh-in before the animal was born.
    const datesDesc = buildDescendingDateSeries(now, count, 14, rng, birthDateObj); // ~biweekly weigh-ins
    if (datesDesc.length === 0) continue;
    const datesAsc = [...datesDesc].reverse(); // oldest -> newest, for the weight progression

    const finalWeight = parseFloat(record.weight);
    const startWeight = Math.max(0.5, finalWeight - rng.nextFloat(finalWeight * 0.15, finalWeight * 0.4));
    const weightsAsc = datesAsc.map((_, i) => {
      const t = datesAsc.length === 1 ? 1 : i / (datesAsc.length - 1);
      const noise = rng.nextFloat(-1, 1);
      return Math.max(0.5, startWeight + (finalWeight - startWeight) * t + noise);
    });
    weightsAsc[weightsAsc.length - 1] = finalWeight; // newest entry matches the record exactly

    const entriesAsc: WeightEntry[] = weightsAsc.map((w, i) => {
      const diff = i === 0 ? null : w - weightsAsc[i - 1];
      return {
        id: generateUUID(),
        date: formatIndonesianDate(datesAsc[i]),
        weight: w.toFixed(1),
        unit: record.weightUnit,
        diff: diff === null ? null : (diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)),
        notes: null,
      };
    });

    __seedWeightHistory(record.id, entriesAsc.slice().reverse());
  }
}
