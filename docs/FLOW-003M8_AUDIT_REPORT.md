# FLOW-003M8 — Audit Report: Stok Obat Supabase Migration Scope

**Audit Date:** 2026-07-29
**Auditor:** Replit Agent
**Scope:** Determine the implementation target for FLOW-003M8 based on current Supabase migration state.
**Preceded by:** FLOW-003M7 (KH-007 KontrolKesehatan dual-write — complete)

---

## 1. Executive Summary

FLOW-003M1–M7 completed the full Kesehatan Hewan (KH) module Supabase migration. All KH pages are dual-wired. However, KH-006 (`integrasiPengobatanService.ts`) was explicitly deferred because it depends on **Stok Obat** being in Supabase — a dependency noted in the M7 commit scope and memory.

**FLOW-003M8 target: Stok Obat Supabase Foundation + Dual-Write.**

The `stok_obat`, `stok_obat_masuk`, `stok_obat_keluar`, and `stok_obat_adjustments` tables already exist in DB-001A (migration 20260725000006). No new migrations are required. Only the Repository → Service → Hook layer and dual-write page wiring are needed.

---

## 2. Current Migration State

### 2.1 Modules Already on Supabase

| Module | Infrastructure | Pages Wired |
|---|---|---|
| Auth | `AuthContext.tsx` | ✅ All auth pages |
| Workspace | `workspaceRepository.ts` + `workspaceService.ts` + `WorkspaceContext` | ✅ All workspace pages (FLOW-001) |
| Livestock + Batch | `livestockRepository.ts` + `livestockService.ts` + `useLivestock.ts` | ✅ `AddLivestock`, `EditLivestock`, `CatatBobot`, `CreateBatch`, `LivestockProfile` (FLOW-002M2) |
| Kesehatan Hewan | `healthRepository.ts` + `healthService.ts` + `useHealth.ts` | ✅ KH-002/003/004/005/007 (FLOW-003M1–M7) |

### 2.2 Modules NOT Yet on Supabase (relevant to M8)

| Module | Status | Notes |
|---|---|---|
| **Stok Obat** | **Local-only** | `stokObatData.ts` is SSOT; no repo/service/hook; `masterObatService.ts` is a local-only facade |
| Integrasi Pengobatan (KH-006) | **Blocked** | Explicitly blocked on Stok Obat Supabase migration (FLOW-003M7 memory) |
| Pemberian Pakan | Local-only | Lower priority — no dependency blocks other modules |
| Reproduksi | Local-only | Lower priority |
| Mutasi/Transfer | Partial | `livestock_transfers` covered by `livestockRepository.ts`; `mutation_requests` table not wired |

---

## 3. Database Schema (DB-001A)

### 3.1 `stok_obat` (item master)

```sql
CREATE TABLE stok_obat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  drug_id uuid REFERENCES drug_catalog(id),
  drug_name text NOT NULL,
  category_id uuid REFERENCES drug_categories(id),
  quantity numeric(10,3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit text NOT NULL,
  min_stock numeric(10,3),
  expiry_date date,
  batch_number text,
  status stok_status_enum NOT NULL DEFAULT 'Aktif',
  location text,
  purchase_price bigint,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### 3.2 `stok_obat_masuk` (stock-in / tambah stok)

```sql
CREATE TABLE stok_obat_masuk (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stok_obat_id uuid NOT NULL REFERENCES stok_obat(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  quantity numeric(10,3) NOT NULL CHECK (quantity > 0),
  source text,
  supplier text,
  purchase_price bigint,
  invoice_number text,
  received_date date NOT NULL,
  notes text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### 3.3 `stok_obat_keluar` (stock-out / dispensing)

```sql
CREATE TABLE stok_obat_keluar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stok_obat_id uuid NOT NULL REFERENCES stok_obat(id) ON DELETE CASCADE,
  ...
  treatment_id uuid REFERENCES health_treatments(id),
  ...
);
```
**Key field:** `treatment_id` FK to `health_treatments` — this is the integration point for KH-006.

### 3.4 `stok_obat_adjustments` (penyesuaian stok)

```sql
CREATE TABLE stok_obat_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stok_obat_id uuid NOT NULL REFERENCES stok_obat(id) ON DELETE CASCADE,
  ...
);
```

---

## 4. Current Local-Only Layer (to be preserved as in-memory bridge)

| File | SSOT Content | Key Exports |
|---|---|---|
| `src/data/stokObatData.ts` | `STOK_OBAT_ITEMS` registry, `PENYESUAIAN_STOK_RECORDS` | `addStokObatItem()`, `applyPenyesuaianStok()`, `archiveStokObat()`, `unarchiveStokObat()`, `getActiveStokObatList()`, `getStokObatById()` |
| `src/services/masterObatService.ts` | Local-only facade | Read-only contract over Master Obat reference data (not stok) |

### 4.1 Pages with Pending Dual-Write

| Page | Current Calls (local only) | Readiness |
|---|---|---|
| `TambahStokObat.tsx` | `addStokObatItem()` | Already imports `useWorkspace` — minimal changes needed |
| `PenyesuaianStokObat.tsx` | `applyPenyesuaianStok()`, `archiveStokObat()` | Needs `useStokObat` + service calls added |
| `StokObat.tsx` | Reads `STOK_OBAT_ITEMS` (passive) | Auto-updated via `useStokObat` populating in-memory store |

---

## 5. M8 Implementation Plan

### 5.1 Files to Create

#### `src/repositories/stokObatRepository.ts`

Supabase adapter. Functions:

| Function | Table | Operation |
|---|---|---|
| `repoGetStokObatByWorkspace(workspaceId)` | `stok_obat` | SELECT all for workspace |
| `repoInsertStokObatItem(workspaceId, input)` | `stok_obat` | INSERT → returns row |
| `repoPatchStokObatItem(id, patch)` | `stok_obat` | UPDATE (quantity, status, etc.) |
| `repoInsertStokMasuk(input)` | `stok_obat_masuk` | INSERT receipt record |
| `repoInsertStokKeluar(input)` | `stok_obat_keluar` | INSERT dispensing record |
| `repoInsertStokAdjustment(input)` | `stok_obat_adjustments` | INSERT adjustment record |

#### `src/services/stokObatService.ts`

Business logic layer. Functions:

| Function | Description |
|---|---|
| `addStokItem(workspaceId, input)` | Create new stok_obat row |
| `addStokMasuk(workspaceId, stokObatId, input)` | Record stock receipt + update quantity |
| `addStokKeluar(workspaceId, stokObatId, input)` | Record dispensing + update quantity — **key for KH-006 unblock** |
| `applyAdjustment(workspaceId, stokObatId, input)` | Manual stock adjustment |
| `archiveStokItem(id)` | Set `status = 'Arsip'` |
| `unarchiveStokItem(id)` | Set `status = 'Aktif'` |

#### `src/hooks/useStokObat.ts`

Hook pattern mirrors `useLivestock.ts`:
- Fetch `stok_obat` by workspace on mount / workspace change
- Populate `STOK_OBAT_ITEMS` in-memory so existing utility functions work unchanged
- Expose: `stokObat[]`, `isLoading`, `error`, `refresh()`

### 5.2 Files to Wire (Dual-Write)

#### `src/pages/TambahStokObat.tsx`
- Add `import { useStokObat }` + `import { addStokItem, addStokMasuk }` from service
- Phase 1 (in-memory): `addStokObatItem()` — unchanged
- Phase 2 (Supabase): fire-and-forget `stokObatService.addStokItem()` + `addStokMasuk()`
- `onSuccess`: call `refreshStokObat()`

#### `src/pages/PenyesuaianStokObat.tsx`
- Add `import { useStokObat }` + service imports
- After `applyPenyesuaianStok()`: fire-and-forget `stokObatService.applyAdjustment()`
- After `archiveStokObat()`: fire-and-forget `stokObatService.archiveStokItem()`
- Trigger `refreshStokObat()` via `onSuccess`

---

## 6. Bugs / Features Resolved by M8

| ID | Description |
|---|---|
| SO-DB-001 | `stok_obat` data lost on hard refresh or browser switch — M8 persists to Supabase |
| SO-DB-002 | `stok_obat_masuk` receipt records not saved to DB |
| SO-DB-003 | `stok_obat_adjustments` not saved to DB |
| SO-DB-004 | Archive/unarchive status not persisted to DB |
| SO-DB-005 | `STOK_OBAT_ITEMS` is a global registry with no workspace scoping — M8 scopes by `workspace_id` |
| KH-006-UNBLOCK | Unblocks `integrasiPengobatanService.ts` for M9: dispensing events can now write to `stok_obat_keluar` via `stokObatService.addStokKeluar()` |

---

## 7. Out of Scope for M8

| Item | Reason |
|---|---|
| KH-006 `integrasiPengobatanService.ts` full Supabase wiring | Depends on M8 completion; scheduled for M9 |
| `riwayatObatData.ts` Supabase migration | Separate module; can be addressed in a later milestone |
| `StokObat.tsx` page-level Supabase wiring (reads) | Auto-updated by `useStokObat` populating in-memory store; no page changes needed |
| Drug catalog / Master Obat reference data migration | Static reference data; lower priority than operational stok data |
| Reproduksi, Pemberian Pakan Supabase migration | Separate FLOW-003 milestones |

---

## 8. Validation Plan (post-implementation)

| Check | Expected |
|---|---|
| `npm run type-check` | 0 errors |
| `npm run build` | PASS — no new errors |
| `TambahStokObat` save path | In-memory write first, Supabase fire-and-forget; UI reactive immediately |
| `PenyesuaianStokObat` penyesuaian path | Same dual-write pattern |
| `PenyesuaianStokObat` archive path | Same dual-write pattern |
| `useStokObat` on workspace change | Re-fetches from Supabase, repopulates `STOK_OBAT_ITEMS` |

---

## 9. Architecture Compliance

Follows the established FLOW-003 dual-write architecture:
```
UI page
  → Phase 1: in-memory write (local SSOT, authoritative for UI reactivity)
  → Phase 2: fire-and-forget Supabase write via Service (logs failure, never blocks UI)
  → onSuccess: call hook refresh() to sync from Supabase
```

Pattern is identical to KH-002 through KH-007. No new patterns introduced.
