# FORMULA-PAKAN-FIX-001 — Findings & Fixes

**Date:** 2026-07-19  
**Module:** `/stok-pakan/formula/*`  
**Scope:** Formula Pakan backlog — broken flows, calculations, validation, and state management.  
**Status:** ✅ All in-scope findings fixed. Zero TypeScript errors.

---

## Findings & Resolutions

### FIX-001-01 — Seed ingredient IDs mismatch `masterPakanData` IDs *(Critical)*

**File:** `src/data/formulaData.ts`  
**Root cause:** All 6 seed formulas used fictional `mp-rumput-gajah`, `mp-dedak-padi`, …
style IDs. `masterPakanData.ts` uses numeric IDs (`mp-1` through `mp-16`).
`getMasterPakanById()` returned `undefined` for every seed ingredient, so
`computeNutrisi()` silently returned `{ pk:0, sk:0, tdn:0 }` for all seed formulas.

**Fix:** Replaced all seed `referensiId` values with the correct IDs from
`masterPakanData.ts`:

| Old ID | New ID | Name |
|---|---|---|
| `mp-rumput-gajah` | `mp-1` | Rumput Gajah |
| `mp-dedak-padi` | `mp-6` | Dedak Padi |
| `mp-bungkil-kedel` | `mp-9` | Bungkil Kedelai |
| `mp-mineral-mix` | `mp-13` | Mineral Mix |
| `mp-molases` | `mp-11` | Molases |
| `mp-jagung-giling` | `mp-8` | Jagung Giling |
| `mp-jerami-kering` | `mp-5` | Jerami Kering |
| `mp-garam-dapur` | `mp-14` | Garam (NaCl) |

Also added explicit `sumberBahan: 'Master Pakan' as const` on every seed bahan
so the guard in `computeNutrisi` never falls through.

---

### FIX-001-02 — `computeNutrisi` skips `sumberBahan === undefined` *(Bug)*

**File:** `src/pages/FormulaEditor.tsx`  
**Root cause:** Guard was `if (b.sumberBahan !== 'Master Pakan') continue;`.
Because `undefined !== 'Master Pakan'` is `true`, any bahan without an
explicit `sumberBahan` field was silently excluded even when it came from
Master Pakan.

**Fix:** Changed to `if ((b.sumberBahan ?? 'Master Pakan') !== 'Master Pakan') continue;`

---

### FIX-001-03 — Nutrition always 0 for picker-selected ingredients *(Bug)*

**Files:** `src/data/masterPakanData.ts`, `src/pages/FormulaEditor.tsx`  
**Root cause:** The BahanPickerModal (step: 'item') sources options from
`formulaMasterPakanData.ts` which uses category-database IDs (`rumput-gajah`,
`dedak-padi-kasar`, etc.). `getMasterPakanById()` only knows `mp-N` IDs, so
it returned `undefined` for every newly-picked ingredient.

**Fix:**
1. Added `getMasterPakanByName(name)` export to `masterPakanData.ts` — does
   case-insensitive name + alias match over the full MASTER_PAKAN_DB.
2. Changed lookup in `computeNutrisi` to:
   ```typescript
   const item = getMasterPakanById(b.referensiId) ?? getMasterPakanByName(b.nama);
   ```
   ID lookup succeeds for seed data; name fallback catches picker-selected items.

---

### FIX-001-04 — Missing `archiveFormula` / `unarchiveFormula` mutations *(Missing feature)*

**File:** `src/data/formulaData.ts`  
**Root cause:** No dedicated archive/unarchive helpers existed. Callers had to
call `updateFormula(id, { status: 'Arsip' })` directly, which is fragile.

**Fix:** Added two thin exported wrappers:
```typescript
export function archiveFormula(id: string): FormulaRecord | undefined
export function unarchiveFormula(id: string): FormulaRecord | undefined
```

---

### FIX-001-05 — No archive/unarchive action on FormulaDetail *(Missing feature)*

**File:** `src/pages/FormulaDetail.tsx`  
**Root cause:** The detail page only had an "Edit Formula" button. The only way
to archive a formula was to open the editor and change the status dropdown.

**Fix:**
- Added an **"Arsipkan Formula"** / **"Aktifkan Kembali"** secondary button
  below the Edit button with an inline confirmation prompt (orange-bordered card
  with Batal/Konfirmasi actions).
- After confirming, calls `archiveFormula()` or `unarchiveFormula()` and
  navigates back to `/stok-pakan` so the updated status is visible in the list.
- **Edit Formula button is hidden for Arsip formulas** (archived formulas should
  only be activated, not edited in that state).

---

### FIX-001-06 — Production FAB navigates for non-Aktif formulas *(Bug)*

**File:** `src/pages/FormulaDetail.tsx`  
**Root cause:** The FAB was visually grayed out for Draft/Arsip formulas but
`onClick` still called `navigate()` unconditionally.

**Fix:**
```typescript
onClick={() => {
  if (formula.status !== 'Aktif') return;
  navigate(`/stok-pakan/formula/${formula.id}/produksi`);
}}
cursor: formula.status === 'Aktif' ? 'pointer' : 'not-allowed'
```
Added `title` tooltip that explains why the button is disabled.

---

### FIX-001-07 — Cost section showed "Total Biaya" and "Biaya per Batch" with identical values *(UI Duplicate)*

**File:** `src/pages/FormulaDetail.tsx`  
**Root cause:** Two adjacent rows both rendered `hpp.totalPerBatch`. The first
row had label "Total Biaya" and the second "Biaya per Batch (N kg)" — both
showing the same number, making the cost section look broken.

**Fix:** Removed the redundant "Total Biaya" row. Cost section now shows only
the single "Biaya per Batch (N kg)" row with the bold total.

---

## Out-of-Scope Findings (documented for backlog)

| # | Finding | Recommended Backlog Item |
|---|---|---|
| OOS-01 | `formulaMasterPakanData.ts` `FormulaMasterPakanRef` has no nutrition fields (`pk`, `sk`, `tdn`). The picker sets them to `null`, so the item list in the picker cannot show pre-computed nutrition. The name-based fallback in `computeNutrisi` is a workaround; a complete fix would enrich the category databases with nutrition data. | Enrich category DBs with nutrition fields |
| OOS-02 | `estimasiHarga: 0` for all Produk Komersial items in `buildPKOptions()` — price field always shows 0, user must always enter manually. | Sync PK prices from catalog |
| OOS-03 | All formula data is in-memory only — no persistence across page reloads. Existing Task #2 covers this. | Task #2 (Persistence) |
| OOS-04 | No formula validation prevents saving a formula with `proporsi` totals ≠ 100%. The editor shows a warning but does not block submission. | FormulaEditor validation gate |
