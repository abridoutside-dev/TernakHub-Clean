// ─── Seed Registry (the "generated=true" marker) ───────────────────────────
// LivestockRecord/BatchRecord/etc. are never touched to add a `source`/`generated`
// field — that would be a schema change. Instead, every ID the factory creates is
// tracked here, in a side registry, for the lifetime of the browser session.
// clear.ts reads this registry to know exactly which records are safe to delete,
// so real user-entered data (anything not in this registry) is never touched.

export type SeedRegistry = {
  livestockIds: Set<string>;
  batchIds: Set<string>;
  membershipIds: Set<string>;
  transferIds: Set<string>;
  feedLogIds: Set<string>;
  medicineLogIds: Set<string>;
};

function empty(): SeedRegistry {
  return {
    livestockIds: new Set(),
    batchIds: new Set(),
    membershipIds: new Set(),
    transferIds: new Set(),
    feedLogIds: new Set(),
    medicineLogIds: new Set(),
  };
}

export let seedRegistry: SeedRegistry = empty();

export function resetSeedRegistry(): void {
  seedRegistry = empty();
}
