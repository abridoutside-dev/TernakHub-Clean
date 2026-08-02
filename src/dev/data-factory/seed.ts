// ─── Seed Orchestrator ──────────────────────────────────────────────────────
// Runs the full Developer Data Factory pipeline once, in dependency order.
// Never imported by app pages, never auto-run on load — triggered manually via
// devConsole.ts (see README.md).

import { resolveConfig, type SeedConfig } from './config';
import { createRng } from './rng';
import { generateLivestock } from './factories/livestockFactory';
import { generateOwnershipHistory } from './factories/ownershipFactory';
import { generateWeightHistory } from './factories/weightHistoryFactory';
import { generateHealthHistory } from './factories/healthHistoryFactory';
import { generateReproductionHistory } from './factories/reproductionFactory';
import { generateMutationHistory } from './factories/mutationFactory';
import { generateBatches } from './factories/batchFactory';
import { generateFeedLogs } from './factories/feedFactory';
import { generateMedicineLogs } from './factories/medicineFactory';
import { seedRegistry } from './seedRegistry';

export type SeedResult = {
  config: SeedConfig;
  livestockCreated: number;
  batchesCreated: number;
  membershipsCreated: number;
  transfersCreated: number;
  feedLogsCreated: number;
  medicineLogsCreated: number;
};

/**
 * Runs the seed pipeline: livestock -> ownership/weight/health/repro history ->
 * mutations (status changes, must run before batching) -> batches (only from
 * animals still Di Kandang) -> feed/medicine logs.
 *
 * Safe to call multiple times in the same session — each run adds more data on
 * top of whatever already exists. Call clearSeed() first for a clean slate.
 */
export function runSeed(overrides?: Partial<SeedConfig>, now: Date = new Date()): SeedResult {
  const config = resolveConfig(overrides);
  const rng = createRng(config.rngSeed);

  const animals = generateLivestock(config, rng, now);
  generateOwnershipHistory(animals, config, rng, now);
  generateWeightHistory(animals, config, rng, now);
  generateHealthHistory(animals, config, rng, now);
  generateReproductionHistory(animals, config, rng, now);
  generateMutationHistory(animals, config, rng, now);
  generateBatches(animals, config, rng, now);
  generateFeedLogs(config, rng, now);
  generateMedicineLogs(animals, config, rng, now);

  return {
    config,
    livestockCreated: animals.length,
    batchesCreated: seedRegistry.batchIds.size,
    membershipsCreated: seedRegistry.membershipIds.size,
    transfersCreated: seedRegistry.transferIds.size,
    feedLogsCreated: seedRegistry.feedLogIds.size,
    medicineLogsCreated: seedRegistry.medicineLogIds.size,
  };
}
