// ─── Dev-only Feed (Pakan) log store ────────────────────────────────────────
// The app's real Pakan pages (StokPakan.tsx, PemberianPakan.tsx, TambahStokPakan.tsx,
// etc.) currently keep their own local component state — there is no shared
// src/data store for feed to plug into without changing those pages, which is
// out of scope here (no UI changes). This store exists purely so FeedFactory has
// somewhere to write; seeded entries won't appear in the Pakan pages until/unless
// those pages are migrated to read from a shared store in a separate change.

export type FeedLogEntry = {
  id: string;
  blok: string;
  feedType: string;
  quantityKg: number;
  date: string;
  notes: string | null;
};

export const FEED_LOG_DB: FeedLogEntry[] = [];
