# FLOW-003M9 — Audit Report: KH-006 Integrasi Pengobatan Supabase Dual-Write

**Audit Date:** 2026-07-29
**Auditor:** Replit Agent
**HEAD:** f8b708cda97aecde77b459d624b4861bb328e690 (FLOW-003M8)
**Scope:** Determine the implementation target for FLOW-003M9 based on codebase state post-M8.
**Preceded by:** FLOW-003M8 (Stok Obat Supabase Foundation + Dual-Write — complete)

---

## 1. Executive Summary

FLOW-003M8 delivered the complete Stok Obat Supabase foundation:
- `stokObatRepository.ts` — 6 repo functions including `repoInsertStokKeluar`
- `stokObatService.ts` — 6 service functions including `addStokKeluar` (KH-006 integration point, explicitly annotated for M9)
- `useStokObat.ts` — hook populates `STOK_OBAT_ITEMS` from Supabase
- `TambahStokObat.tsx` + `PenyesuaianStokObat.tsx` — dual-wired

The M8 audit report (Section 7) explicitly deferred one item:

> _"KH-006 integrasiPengobatanService.ts full Supabase wiring — Depends on M8 completion; scheduled for M9."_

**FLOW-003M9 target: KH-006 Integrasi Pengobatan — Supabase dual-write in `IntegrasiPengobatan.tsx`.**

All infrastructure is already built. M9 is **one file, zero new files, zero new migrations** — only the call site needs wiring.

---

## 2. Current State After M8

### 2.1 Full KH + Stok Obat Supabase Status

| Module / Page | Dual-Write | Tables Written |
|---|---|---|
| KH-002 PemeriksaanKesehatan | ✅ M1 | `health_checkups` |
| KH-003 DiagnosaKesehatan | ✅ M2 | `health_checkups` (patch) |
| KH-004 TindakanKesehatan | ✅ M4 | `health_treatments` (type ≠ Pengobatan) |
| KH-005 PengobatanKesehatan | ✅ M5 | `health_treatments` (type = Pengobatan — draft) |
| **KH-006 IntegrasiPengobatan** | **❌ M9** | `health_treatments` + `stok_obat_keluar` |
| KH-007 KontrolKesehatan | ✅ M7 | `health_control_schedules` |
| Stok Obat — TambahStokObat | ✅ M8 | `stok_obat` + `stok_obat_masuk` |
| Stok Obat — PenyesuaianStokObat | ✅ M8 | `stok_obat_adjustments` + `stok_obat` (patch) |

KH-006 is the **only remaining gap** in the full KH + Stok Obat write path.

### 2.2 Infrastructure Already in Place for M9

Every piece of infrastructure M9 requires already exists:

| Piece | File | Built In |
|---|---|---|
| `repoInsertStokKeluar()` | `src/repositories/stokObatRepository.ts` | M8 |
| `addStokKeluar()` | `src/services/stokObatService.ts` | M8 |
| `useStokObat()` | `src/hooks/useStokObat.ts` | M8 |
| `repoInsertTreatment()` | `src/repositories/healthRepository.ts` | M1 |
| `recordTreatment()` | `src/services/healthService.ts` | M3 |
| `useHealth()` | `src/hooks/useHealth.ts` | M3 |
| `useWorkspace()` | `src/contexts/WorkspaceContext.tsx` | FLOW-001 |

**No new repository functions, service functions, hooks, or migrations are needed.**

---

## 3. Target Module: KH-006 IntegrasiPengobatan

### 3.1 Current Behaviour

`IntegrasiPengobatan.tsx` exposes a single button: **"Selesaikan Pengobatan"**.

When clicked, `handleSelesaikan()` runs:

```typescript
function handleSelesaikan() {
  if (!sesiId) return;
  setLoading(true);
  try {
    const res = executeIntegrasiPengobatan(sesiId);  // ← synchronous, in-memory only
    setResult(res);
  } finally {
    setLoading(false);
  }
}
```

`executeIntegrasiPengobatan(sesiId)` is a **pure synchronous in-memory function** that:
1. Validates all items (stock availability, expiry, quantity)
2. For each `PengobatanItem`: deducts `stok.jumlah`, creates `RiwayatObatRecord`, creates `RiwayatKesehatanRecord`
3. Marks `PengobatanSesi` → `'Pengobatan Selesai'`
4. On any error → full rollback (reverts all in-memory writes)
5. Returns `{ ok: true, riwayatObatUuids, riwayatKesehatanUuids, itemCount }` or `{ ok: false, reason }`

**The problem:** None of this is persisted to Supabase. Stock deductions are lost on hard refresh.

### 3.2 What M9 Adds

After Phase 1 (in-memory) succeeds (`res.ok === true`), M9 adds **Phase 2: fire-and-forget Supabase write** for each `PengobatanItem`.

The write sequence per item is **sequential** (not parallel) because `addStokKeluar` requires the `treatment_id` FK that `recordTreatment` returns:

```
For each PengobatanItem in the completed sesi:
  Step 1 → recordTreatment(wsId, { ... tipe: 'Pengobatan', ... })
          → inserts row into health_treatments
          → returns treatmentDbRow (treatmentDbRow.id is the FK)
  Step 2 → addStokKeluar(wsId, stok.uuid, { ..., treatmentId: treatmentDbRow.id })
          → inserts row into stok_obat_keluar
          → DB trigger deduct_stok_obat() auto-decrements stok_obat.quantity
After all items → refreshStokObat()
```

One item failure logs an error and `continue`s to the next item — it does **not** abort the loop, consistent with fire-and-forget philosophy.

### 3.3 DB Schema Involved

#### `health_treatments` (migration 20260725000006)
```sql
CREATE TABLE health_treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  livestock_id uuid NOT NULL REFERENCES livestock(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  checkup_id uuid REFERENCES health_checkups(id),
  treatment_date date NOT NULL,
  treatment_type treatment_type_enum NOT NULL,  -- 'Pengobatan' for KH-006
  drug_id uuid REFERENCES drug_catalog(id),
  drug_name text,
  dosage text,
  route text,
  duration_days integer,
  next_treatment_date date,
  cost bigint,
  veterinarian text,
  notes text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### `stok_obat_keluar` (migration 20260725000006)
```sql
CREATE TABLE stok_obat_keluar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stok_obat_id uuid NOT NULL REFERENCES stok_obat(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  treatment_id uuid REFERENCES health_treatments(id),  -- ← KH-006 cross-module FK
  quantity numeric(10,3) NOT NULL CHECK (quantity > 0),
  reason text,
  livestock_id uuid REFERENCES livestock(id),
  usage_date date NOT NULL,
  notes text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

The `treatment_id` FK is the **primary cross-module join** between health records and stock dispensing events. M9 is what finally populates this FK.

**Note:** `riwayat_obat` and `riwayat_kesehatan` are **not DB tables** — they exist only in-memory (`riwayatObatData.ts`, `riwayatKesehatanData.ts`). No corresponding DB tables are in any migration file. M9 does not attempt to persist them.

---

## 4. Bugs / Features Resolved by M9

| ID | Description |
|---|---|
| KH-006-DB-001 | `stok_obat_keluar` never written — dispensing events lost on refresh |
| KH-006-DB-002 | `health_treatments` (type=`Pengobatan`) never written for integrasi |
| KH-006-DB-003 | `treatment_id` FK between `stok_obat_keluar` and `health_treatments` always null — cross-module join unusable |
| KH-006-DB-004 | `stok_obat.quantity` auto-decremented by DB trigger only if `stok_obat_keluar` row exists — meaning Supabase `quantity` diverges from in-memory after integrasi |
| M8-INFRA-ORPHAN | `stokObatService.addStokKeluar()` (built in M8) was never called from any page — M9 connects it |

---

## 5. Files Changed

### 5.1 Summary Table

| # | File | Action | Description |
|---|---|---|---|
| 1 | `src/pages/IntegrasiPengobatan.tsx` | **Modify** | Add imports + hooks + fire-and-forget Supabase block in `handleSelesaikan` |

**New files: 0. New migrations: 0.**

### 5.2 Detailed Changes — `IntegrasiPengobatan.tsx`

#### A. New Imports (4 additions)

```typescript
// Add to existing import block:
import { useWorkspace }    from '../contexts/WorkspaceContext';
import { useStokObat }     from '../hooks/useStokObat';
import { recordTreatment } from '../services/healthService';
import { addStokKeluar }   from '../services/stokObatService';
```

Note: `getStokObatById` is already imported (`import { getStokObatById, getStatusStok } from '../data/stokObatData'`).
Note: `getPemeriksaan` is already imported (`import { getPemeriksaan } from '../data/pemeriksaanKesehatanData'`).
Note: `getPengobatanSesi` + `getPengobatanItemsBySesi` are already imported.

#### B. Hook Calls in Page Component Body

In the main page component (currently `export default function IntegrasiPengobatan()`), after the existing `useNavigate()` call:

```typescript
const { activeWorkspace }      = useWorkspace();
const { refresh: refreshStokObat } = useStokObat();
```

`useStokObat` is already mounted by an ancestor (the workspace-level context), so calling it here adds no extra network request — it reads shared state. The `refresh()` call is only invoked post-success to sync DB → in-memory.

#### C. Fire-and-Forget Block in `handleSelesaikan`

**Before (current):**
```typescript
function handleSelesaikan() {
  if (!sesiId) return;
  setLoading(true);
  try {
    const res = executeIntegrasiPengobatan(sesiId);
    setResult(res);
  } finally {
    setLoading(false);
  }
}
```

**After (M9):**
```typescript
function handleSelesaikan() {
  if (!sesiId) return;
  setLoading(true);
  try {
    const res = executeIntegrasiPengobatan(sesiId);
    setResult(res);

    // ── Supabase dual-write (fire-and-forget) ─────────────────────────────────
    // Phase 1 (in-memory) already executed above. Phase 2 persists to Supabase.
    // Failure of any individual item is logged but never blocks UI — the user
    // has already received success feedback from the in-memory result.
    //
    // Write sequence per item (sequential, not parallel):
    //   recordTreatment  → health_treatments row  → returns treatmentDbRow.id
    //   addStokKeluar    → stok_obat_keluar row    → treatment_id FK populated
    //   DB trigger deduct_stok_obat auto-decrements stok_obat.quantity
    if (res.ok && activeWorkspace?.workspace_uuid) {
      const wsId    = activeWorkspace.workspace_uuid;
      const sesi    = getPengobatanSesi(sesiId)!;
      const items   = getPengobatanItemsBySesi(sesiId);
      const pem     = getPemeriksaan(sesi.pemeriksaanId);
      const tanggal = pem?.tanggal ?? new Date().toISOString().split('T')[0];
      const livestockId = pem?.livestockId ?? null;

      void (async () => {
        for (const item of items) {
          try {
            // Step 1 — health_treatments
            const treatResult = await recordTreatment(wsId, {
              livestockId:   livestockId ?? '',
              checkupId:     sesi.pemeriksaanId ?? null,
              tanggal,
              tipe:          'Pengobatan',
              namaObat:      item.namaProduk,
              dosis:         item.dosis
                               ? `${item.dosis} ${item.satuanDosis}`.trim()
                               : null,
              caraPemberian: item.caraPemberian || null,
              lamaPemberian: item.lamaPemberian
                               ? (parseInt(item.lamaPemberian, 10) || null)
                               : null,
              catatan:       item.catatan || null,
            });
            if (!treatResult.ok) {
              console.error(
                '[IntegrasiPengobatan] recordTreatment failed:',
                item.namaProduk, treatResult.error,
              );
              continue;
            }

            // Step 2 — stok_obat_keluar (needs treatment_id FK from Step 1)
            const stok = getStokObatById(item.stokObatUuid);
            if (!stok) {
              console.error(
                '[IntegrasiPengobatan] stok not found, skipping keluar:',
                item.stokObatUuid,
              );
              continue;
            }
            // Re-derive deduction using same formula as executeIntegrasiPengobatan
            const dosisNum  = parseFloat(item.dosis);
            const deduction = (
              !isNaN(dosisNum) && dosisNum > 0 && item.satuanDosis === stok.satuan
            ) ? dosisNum : 1;

            const keluarResult = await addStokKeluar(wsId, stok.uuid, {
              jumlah:        deduction,
              tanggalKeluar: tanggal,
              alasan:        'Penggunaan Pengobatan',
              livestockId,
              treatmentId:   treatResult.data.id,
              catatan:       item.catatan || null,
            });
            if (!keluarResult.ok) {
              console.error(
                '[IntegrasiPengobatan] addStokKeluar failed:',
                item.namaProduk, keluarResult.error,
              );
            }
          } catch (err) {
            console.error(
              '[IntegrasiPengobatan] Supabase dual-write error for item:',
              item.namaProduk, err,
            );
          }
        }
        // Sync in-memory STOK_OBAT_ITEMS with Supabase after all writes
        refreshStokObat();
      })();
    }
  } finally {
    setLoading(false);
  }
}
```

---

## 6. Architecture Notes

### 6.1 Why Sequential Per Item (Not Parallel)

```
Item 1: recordTreatment → [treatmentRow.id] → addStokKeluar(treatmentId: treatmentRow.id)
Item 2: recordTreatment → [treatmentRow.id] → addStokKeluar(treatmentId: treatmentRow.id)
```

`addStokKeluar` requires `treatmentId` (the FK to `health_treatments.id`). That ID is only known after `recordTreatment` resolves. Items are independent of each other, so failures do not cascade — each item's try/catch is independent.

### 6.2 Why `executeIntegrasiPengobatan` Stays Unchanged

The in-memory function is the authoritative Phase 1 write. It has full rollback logic, pre-validation, and duplicate-prevention guards. Touching it is out of scope and risky. M9 only adds a **fire-and-forget side-effect** after it returns `ok: true`. The service file is not modified.

### 6.3 Deduction Formula Duplication

The deduction formula appears in both `executeIntegrasiPengobatan` (for in-memory writes) and the new fire-and-forget block (for `addStokKeluar`'s `jumlah` arg). This is an intentional duplication — the fire-and-forget block is a Supabase mirror, not a re-execution. It must use the same formula to compute the same quantity.

### 6.4 `stok.uuid` After M8 Is the Supabase UUID

After `useStokObat` repopulates `STOK_OBAT_ITEMS` from Supabase, every item in `STOK_OBAT_ITEMS` has `uuid = row.id` (the Supabase UUID, not the legacy local UUID). The fire-and-forget block uses `stok.uuid` as the `stokObatId` argument to `addStokKeluar` — this is the Supabase FK-compatible UUID.

If `getStokObatById(item.stokObatUuid)` returns `null` (stale local UUID not in Supabase), the item is skipped with a console error. This guards against the edge case where a `PengobatanSesi` was built against seed data before `useStokObat` had populated from Supabase.

### 6.5 DB Trigger Behaviour

```
stok_obat_keluar INSERT
  → after_stok_obat_keluar trigger
  → deduct_stok_obat() function
  → UPDATE stok_obat SET quantity = quantity - NEW.quantity WHERE id = NEW.stok_obat_id
```

The trigger fires atomically on the DB side. No manual `repoPatchStokObatItem` call is needed for keluar (unlike adjustments which have no trigger).

### 6.6 Dual-Write Architecture Compliance

M9 follows the same pattern as M1–M8:
```
UI page
  → Phase 1: in-memory write (synchronous, authoritative for UI reactivity)
  → Phase 2: fire-and-forget Supabase write via Service (logs failure, never blocks UI)
  → onSuccess: call hook refresh() to sync from Supabase
```

No new patterns introduced.

---

## 7. Out of Scope for M9

| Item | Reason |
|---|---|
| `integrasiPengobatanService.ts` modification | Stays synchronous in-memory; not touched |
| `riwayatObatData.ts` Supabase persistence | No `riwayat_obat` table in DB schema |
| `riwayatKesehatanData.ts` Supabase persistence | No `riwayat_kesehatan` table in DB schema |
| Pemberian Pakan Supabase migration | Separate milestone (FLOW-003M10 candidate) |
| Reproduksi Supabase migration | Separate milestone (FLOW-003M11 candidate) |
| Mutasi `mutation_requests` Supabase wiring | Separate milestone |
| `drug_id` FK lookup in `health_treatments` | `drug_catalog.id` not mapped; use free-text `drug_name` only |

---

## 8. Why M9 Is the Priority

### Dependency Chain
```
M8 (Stok Obat foundation) ──unblocks──► M9 (KH-006 dual-write)
                                              │
                                              └── closes the KH module completely
```

M9 was the **explicit reason M8 was built**. The `addStokKeluar()` function in `stokObatService.ts` was written with the comment:
> _"Used by KH-006 (M9) via treatment_id for linked health treatments."_

Until M9 runs, `addStokKeluar` is dead code.

### Risks of Skipping M9

| Risk | Impact |
|---|---|
| `stok_obat.quantity` in DB diverges from in-memory after every integrasi | High — any hard refresh shows wrong stock quantities |
| `stok_obat_keluar` table stays empty | High — "obat digunakan per ternak" reports have no data |
| `treatment_id` FK always null | Medium — cross-module join between health and inventory unusable |
| `health_treatments` has no type=`Pengobatan` rows from integrasi | Medium — treatment history incomplete for Pengobatan step |
| `addStokKeluar` (M8 infrastructure) is never called | Low urgency but represents wasted M8 work |

---

## 9. Dependencies Unlocked After M9

After M9 completes:

1. **Full KH module is 100% Supabase-backed** — all 6 pages (KH-002 through KH-007) are dual-wired. The KH FLOW-003 milestone is closed.
2. **`treatment_id` FK** between `stok_obat_keluar` and `health_treatments` is populated — future analytics queries can join treatment records with stock usage.
3. **`stok_obat.quantity` in DB stays accurate** after integrasi events — no more divergence between Supabase and in-memory.
4. **Next independent FLOW-003 milestones can proceed in any order:**
   - FLOW-003M10 — Pemberian Pakan Supabase migration (`pemberian_pakan`, `jadwal_pemberian_pakan`)
   - FLOW-003M11 — Reproduksi Supabase migration (`reproduksi_programs`, `pelaksanaan_reproduksi`, `monitoring_reproduksi`, `kebuntingan`, `kelahiran`, `registrasi_anak`, `sapih`)
   - FLOW-003M12 — Mutasi `mutation_requests` Supabase wiring

---

## 10. Validation Plan (Post-Implementation)

| Check | Expected Result |
|---|---|
| `npm run type-check` | 0 errors |
| `npm run build` | PASS — no new errors |
| `handleSelesaikan` path — `res.ok === true` + `activeWorkspace` set | Fire-and-forget loop starts; no UI blocking |
| `handleSelesaikan` path — `res.ok === false` (validation error) | No Supabase write attempted |
| `handleSelesaikan` path — `res.ok === true` + `activeWorkspace` null | No Supabase write attempted (guard passes) |
| Console after integrasi success | `[IntegrasiPengobatan]` errors only if Supabase unreachable |
| `stok_obat_keluar` table after integrasi | Rows present, `treatment_id` populated, `quantity` = computed deduction |
| `health_treatments` table after integrasi | Rows present, `treatment_type = 'Pengobatan'`, `checkup_id` populated |

---

## 11. Implementation Phases

| Phase | Action | Effort |
|---|---|---|
| Phase 1 | Add 4 imports to `IntegrasiPengobatan.tsx` | Trivial |
| Phase 2 | Add `useWorkspace` + `useStokObat` hook calls in component body | Trivial |
| Phase 3 | Add fire-and-forget block in `handleSelesaikan` | ~35 lines |
| Phase 4 | `npm run type-check` — 0 errors | Validation |
| Phase 5 | `npm run build` — PASS | Validation |

**Total estimated lines changed:** ~45 (imports + hooks + fire-and-forget block)
**Total files modified:** 1
**Total new files:** 0
**Total new migrations:** 0

---

_End of FLOW-003M9 Audit Report_
