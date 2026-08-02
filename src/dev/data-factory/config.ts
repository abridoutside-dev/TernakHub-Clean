// ─── Seed Configuration ────────────────────────────────────────────────────
// Every QUANTITY the factory produces (counts, ratios, probabilities) lives here —
// generator code never hardcodes how many records to create. Small numeric
// constants used only to add realistic *jitter* to a single value (e.g. "age
// spread ±3 months", "weight noise ±1kg") are domain detail, not quantity knobs,
// and stay next to the code that uses them with a descriptive name.

export type SeedConfig = {
  /** Total number of livestock to generate. */
  livestock: number;
  /**
   * Optional explicit count per species, keyed by Master Species `value` (e.g. "Domba").
   * Species left out share the remaining count evenly across every entry in
   * MASTER_SPECIES — so adding a new species to src/data/speciesData.ts changes
   * the default split automatically, with zero changes to this config or the generator.
   */
  speciesDistribution?: Partial<Record<string, number>>;
  /** Number of batches to generate. */
  batch: number;
  /** Weight history entries generated per animal. */
  weightHistoryPerAnimal: number;
  /** Health history entries generated per animal. */
  healthHistoryPerAnimal: number;
  /** Reproduction history entries generated per breeding-eligible animal. */
  reproHistoryPerAnimal: number;
  /** Fraction (0-1) of animals treated as breeding-eligible (get reproduction history). */
  breedingEligibleProbability: number;
  /** Fraction (0-1) of still-"Di Kandang" animals that also get one completed past temporary transfer (out + return) in their Riwayat Mutasi. */
  mutationProbability: number;
  /** Fraction (0-1) of animals currently outside the farm (status Luar Kandang). */
  outsideProbability: number;
  /** Fraction (0-1) of animals already archived (status Arsip), with a permanent-transfer record. */
  archiveProbability: number;
  /** Fraction (0-1) of animals that get an extra historical ownership record before the seed registration record. */
  extraOwnershipRecordsProbability: number;
  /** Feed log entries generated per Blok (Master Location). */
  feedLogsPerBlok: number;
  /** Fraction (0-1) of animals that get a medicine/treatment log entry. */
  medicineLogsPerAnimalProbability: number;
  /** Farm code suffix used in generated livestock IDs (mirrors AddLivestock.tsx's FARM_CODE convention). */
  farmCode: string;
  /** Deterministic RNG seed. Omit for a different random run every time. */
  rngSeed?: number;
};

export const DEFAULT_SEED_CONFIG: SeedConfig = {
  livestock: 500,
  batch: 40,
  weightHistoryPerAnimal: 25,
  healthHistoryPerAnimal: 8,
  reproHistoryPerAnimal: 3,
  breedingEligibleProbability: 0.35,
  mutationProbability: 0.2,
  outsideProbability: 0.15,
  archiveProbability: 0.05,
  extraOwnershipRecordsProbability: 0.1,
  feedLogsPerBlok: 20,
  medicineLogsPerAnimalProbability: 0.4,
  farmCode: 'KAY',
};

export function resolveConfig(overrides?: Partial<SeedConfig>): SeedConfig {
  return { ...DEFAULT_SEED_CONFIG, ...overrides };
}
