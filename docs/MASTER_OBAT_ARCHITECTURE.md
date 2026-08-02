# Master Obat — Internal Reference (SO-009 Final)

Master Obat is the **Single Source of Truth (SSOT)** for medicine reference
data in TernakHub. This document is internal developer documentation only —
it describes the existing, already-approved implementation; it does not
introduce any new UI, route, or workflow.

Master Obat is a **reference database only**. It intentionally excludes:
Stock Obat, Riwayat, Dashboard, Catat Pengobatan, AI Insight, Cloud Sync —
those are separate future modules that will *consume* Master Obat, not
extend it.

## Structure

```
src/data/masterObatKategoriData.ts       Level 1 — Kategori (KATEGORI_OBAT)
src/data/masterObatSubKategoriData.ts    Level 2 — Sub Kategori (SUB_KATEGORI_OBAT)
src/data/masterObatDetailData.ts         Level 3 — Detail Obat (DETAIL_OBAT)
src/services/masterObatService.ts        Read-only SSOT facade for other modules
src/utils/masterObatValidation.ts        Duplicate-name / deactivation guards (thin re-export)
src/utils/masterObatImportExport.ts      Export / validate-import / merge / replace
src/utils/masterObatIntegrityAudit.ts    Read-only referential-integrity diagnostic
src/utils/masterObatAuditLog.ts          In-memory internal audit log (not surfaced in UI)
src/components/MasterObatCrudUI.tsx      Shared CRUD UI primitives (same visual language as Master Pakan)
src/pages/MasterObatTab.tsx              Level 1 list page
src/pages/MasterObatSubKategori.tsx      Level 2 list page (route: /stok-obat/master/:slug)
src/pages/MasterObatDetail.tsx           Level 3 list page (route: /stok-obat/master/:slug/:subKategoriUuid)
```

Each data file owns exactly one level's registry, its mutations
(add/update/soft-delete/restore), and the guards that protect that level's
own referential integrity. Other modules must **never** import or mutate
`KATEGORI_OBAT` / `SUB_KATEGORI_OBAT` / `DETAIL_OBAT` directly — go through
`masterObatService.ts`.

## Hierarchy

```
Kategori (Level 1)
  └─ Sub Kategori (Level 2)
       └─ Detail Obat (Level 3)
```

- A Kategori may have zero Sub Kategori (empty state).
- A Sub Kategori may have zero Detail Obat (empty state).
- Nothing above Level 1; Detail Obat is the leaf.

## UUID rules

- `uuid` is the immutable primary key at every level. It is generated once
  (`crypto.randomUUID()`) at creation and never regenerated, reused, or
  mutated — including through import (merge/replace always preserve
  file-supplied UUIDs as-is).
- **Every parent relation is UUID-based**, not name/slug-based:
  - `SubKategoriObat.kategoriUuid` → `KategoriObat.uuid` (canonical FK).
  - `DetailObat.subKategoriUuid` → `SubKategoriObat.uuid` (canonical FK).
- `slug` (Level 1 and 2) exists **only** for routing/display. It is
  denormalized and derived, never authoritative:
  - `SubKategoriObat.kategoriSlug` is kept in sync with `kategoriUuid` at
    every write path (create, merge, replace) and must never drift from it.
    `masterObatIntegrityAudit.ts` flags any drift as a bug, not a valid state.
  - Import validation rejects a file where a supplied `kategoriUuid`
    disagrees with `kategoriSlug` in the same file.
- Name (`nama`) is **never** used as a relation key anywhere — only as a
  uniqueness constraint scoped to a parent (see below), and for display.

## Relation rules (invariants)

1. A child can only be created under a parent that currently exists
   (`addSubKategoriObat` / `addDetailObat` throw otherwise) — no orphan can
   ever be created.
2. A parent cannot be soft-deleted (`Nonaktif`) while it still has an
   **active** child (`canDeactivateKategori`, `canDeactivateSubKategori`).
   Deactivating cascades top-down only through this guard, never by
   force-deactivating children.
3. Soft delete only — no hard delete anywhere. `status: 'Aktif' | 'Nonaktif'`.
   UUIDs and records are permanent once created; restore just flips status.
4. Name uniqueness is enforced **within a parent's scope** (e.g. two Sub
   Kategori named the same are only rejected if they share a Kategori) — this
   is a UX constraint, not a relation; it never replaces the UUID FK.
5. `SubKategoriObat.jumlahDetailObat` (Detail Obat count shown on cards) is a
   **read-time projection**, not a stored counter — always recomputed from
   the live `DETAIL_OBAT` registry (`withLiveDetailCount`). Never trust the
   stored field directly; it exists only as a legacy seed-data shape.
6. `auditMasterObatIntegrity()` is available to verify all of the above on
   demand (duplicate UUIDs — including cross-level, orphans, slug/UUID
   drift). It is read-only and not wired into any UI/workflow.

## Consuming Master Obat from other modules

Other modules (Stock Obat, Catat Pengobatan, AI Insight, etc.) must depend
only on `src/services/masterObatService.ts`:

- `getAllKategori(includeInactive?)`, `getKategoriByUuid(uuid)`
- `getSubKategori(kategoriUuid?, includeInactive?)`, `getSubKategoriByUuid(uuid)`
- `getDetailObat(subKategoriUuid?, includeInactive?)`, `getDetailObatByUuid(uuid)`
- `searchDetailObat(query, includeInactive?)`, `getActiveDetailObat()`

All of these default to excluding `Nonaktif` records unless explicitly
asked for them, and all cross-level fields (e.g. `kategoriUuid` on a Detail
Obat ref) are resolved via UUID joins, never string matching.
