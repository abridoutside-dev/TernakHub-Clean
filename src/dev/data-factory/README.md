# Developer Data Factory + Seed System

A standalone, dev-only tool that populates the app's real in-memory data stores
(`src/data/*.ts`) with realistic, cross-linked test data — for exercising every
module (Livestock, Batch, Bobot, Kesehatan, Reproduksi, Mutasi, Kepemilikan)
without hand-entering data through the UI.

This app has no backend/database: `LIVESTOCK_DB`, `BATCH_DB`, etc. are plain
in-memory objects/arrays living in the browser tab, reset on every page reload.
"Seeding" therefore means populating those live objects at runtime, in the
browser — not writing to any persistent storage.

## Why it's not an npm script

Because the data lives only in the browser's memory for the currently running
app, a seed script has to execute *inside* that browser tab to have any effect.
It's wired up as a manual browser-console command instead (see below) — no new
UI element, no new workflow, nothing that runs automatically on load.

## How to run it

1. Open the running app in the browser preview.
2. Open the browser DevTools console.
3. Run:
   ```js
   window.ternakDevFactory.seed()                     // default config (500 livestock, 40 batches, ...)
   window.ternakDevFactory.seed({ livestock: 50 })     // override any field in config.ts
   window.ternakDevFactory.clear()                     // remove ONLY the data the factory created
   window.ternakDevFactory.defaultConfig               // inspect current defaults
   ```
4. Navigate the app (Livestock, Batch, Riwayat Bobot/Kesehatan/Reproduksi/Mutasi,
   Kepemilikan) — everything generated shows up exactly like real app data,
   because it was written through the same records/functions the app itself uses.

Re-running `seed()` adds more data on top of what's already there. Run
`clear()` first for a clean slate.

## Architecture

```
config.ts            SeedConfig type + defaults — every quantity/probability the
                      factory can produce lives here, not hardcoded in generators.
rng.ts                Seedable PRNG + pick/shuffle/chance helpers (set config.rngSeed
                      for a reproducible run).
dateFactory.ts        Indonesian date formatting + realistic sequential date series.
idFactory.ts          Livestock/Batch ID builders, mirroring AddLivestock.tsx /
                      CreateBatch.tsx's existing ID conventions exactly.
seedRegistry.ts       The "generated=true" marker — tracks every ID the factory
                      creates, in a side registry, WITHOUT adding any field to
                      LivestockRecord/BatchRecord/etc. (no schema change).
masters/              Master Species (re-exports the real src/data/speciesData.ts),
                      Master Breed, Master Program, Master Location — every
                      generator reads enumerations from here, never a local array.
factories/            SpeciesFactory is masters/speciesMaster.ts; the rest —
                      LivestockFactory, WeightHistoryFactory, HealthHistoryFactory,
                      ReproductionFactory, MutationFactory, BatchFactory,
                      OwnershipFactory, FeedFactory, MedicineFactory — each own
                      one concern and write into the real DBs directly, or through
                      the app's existing guarded mutation functions where they exist
                      (performTempTransfer/performReturn/performPermanentTransfer).
stores/               Dev-only stores for Feed/Medicine (see note below).
seed.ts / clear.ts    Orchestrators, run in dependency order.
devConsole.ts         Attaches window.ternakDevFactory (see main.tsx for the
                      import.meta.env.DEV-gated wiring).
```

## Design notes / known limitations

- **No schema changes.** `LivestockRecord`, `BatchRecord`, `MembershipRecord`,
  `TransferRecord`, `OwnershipRecord`, `WeightEntry`, `HealthEntry`, `ReproEntry`
  are untouched. The only change to an existing data file is three tiny
  `__seed*History` / `__clear*History` bridge functions added to
  `src/data/livestockData.ts`, because `WEIGHT_HISTORY_DB` / `HEALTH_HISTORY_DB`
  / `REPRO_HISTORY_DB` are module-private and have no other write path — those
  functions add no new fields or types, only a controlled way to write.
- **Batch history dates.** `addBatchMember()` in `batchData.ts` always stamps
  `joinDate = today`. To get realistic historical join dates for seeded batches,
  `batchFactory.ts` replicates that function's exact guard/sync logic with a
  caller-supplied date (`addSeedBatchMember`, factory-only, not exported outside
  this folder).
- **Feed & Medicine have no shared app store yet.** `PemberianPakan.tsx` /
  `StokPakan.tsx` / `KesehatanHewan.tsx`'s medicine UI keep local component
  state today, so `FeedFactory`/`MedicineFactory` write to new dev-only stores
  (`stores/feedStore.ts`, `stores/medicineStore.ts`). This data won't appear in
  those pages until they're migrated to a shared store — a separate, larger
  change outside this factory's scope (no UI changes were made here).
- **Numeric literals inside factories** (e.g. age-range jitter, weight noise)
  are realistic-value detail, not run quantities — every *quantity* the factory
  produces (counts, ratios, probabilities) is a named field in `config.ts`.
