// ─── Feed Factory (Pakan) ───────────────────────────────────────────────────
// See stores/feedStore.ts for why this writes to a dev-only store rather than a
// shared app store: PemberianPakan/StokPakan pages have no shared data layer today.

import { FEED_LOG_DB, type FeedLogEntry } from '../stores/feedStore';
import { MASTER_BLOK } from '../masters/locationMaster';
import type { Rng } from '../rng';
import type { SeedConfig } from '../config';
import { formatIndonesianDate, buildDescendingDateSeries } from '../dateFactory';
import { seedRegistry } from '../seedRegistry';
import { FEED_TYPES } from '../masters/feedMaster';

export function generateFeedLogs(config: SeedConfig, rng: Rng, now: Date): void {
  if (config.feedLogsPerBlok <= 0) return;
  let counter = FEED_LOG_DB.length;

  for (const blok of MASTER_BLOK) {
    const dates = buildDescendingDateSeries(now, config.feedLogsPerBlok, 3, rng); // ~every few days
    for (const date of dates) {
      counter += 1;
      const entry: FeedLogEntry = {
        id: `FEED-SEED-${String(counter).padStart(5, '0')}`,
        blok,
        feedType: rng.pick(FEED_TYPES),
        quantityKg: Math.round(rng.nextFloat(20, 150)),
        date: formatIndonesianDate(date),
        notes: null,
      };
      FEED_LOG_DB.push(entry);
      seedRegistry.feedLogIds.add(entry.id);
    }
  }
}
