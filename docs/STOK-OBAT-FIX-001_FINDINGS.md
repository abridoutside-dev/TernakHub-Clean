# STOK-OBAT-FIX-001 — Stok Obat Bug Fix Findings

**Date:** 2026-07-19  
**Scope:** `/stok-obat/*` module — broken user flows only. No redesign, no other modules.  
**Status:** ✅ All in-scope bugs fixed. TypeScript compiles clean (0 errors).

---

## Fixed Bugs

### BUG-1 — PenyesuaianStokObat: All form elements unstyled (CRITICAL)

**File:** `src/pages/PenyesuaianStokObat.tsx`  
**Symptom:** The `<select>` (Jenis Penyesuaian), `<input type="number">` (Jumlah), `<input type="date">` (Tanggal), and `<textarea>` (Catatan) had no inline `style` props at all — they rendered as raw browser-default elements, visually broken and inconsistent with the rest of the app.  
**Fix:** Rewrote the component with a shared `inputBase` style constant (matching TambahStokObat.tsx's pattern) applied to all form elements. Added `inputError` variant that highlights invalid fields with a red border.

---

### BUG-2 — PenyesuaianStokObat: Batal button not disabled after success

**File:** `src/pages/PenyesuaianStokObat.tsx`  
**Symptom:** After a successful submission the user could still click Batal and navigate away immediately, unlike TambahStokObat.tsx which disables Batal on success.  
**Fix:** Batal button now has `disabled={success || archiveSuccess}` and reduces opacity/cursor accordingly.

---

### BUG-3 — PenyesuaianStokObat: No guard when stok jumlah = 0

**File:** `src/pages/PenyesuaianStokObat.tsx`  
**Symptom:** Navigating directly to `/stok-obat/stok/:uuid/penyesuaian` for a "Habis" item (jumlah ≤ 0) displayed the full form. Any submission would immediately fail validation, with no useful UI feedback about why.  
**Fix:** Added `isHabis` guard that replaces the form body with an informational red banner ("Stok sudah habis — Tidak ada stok yang dapat dikurangi."), and disables the Simpan button. The Arsipkan action remains available in this state.

---

### BUG-4 — PenyesuaianStokObat: No archive/delete action for stock items

**File:** `src/pages/PenyesuaianStokObat.tsx`, `src/data/stokObatData.ts`  
**Symptom:** The `StokObatItem` interface has `diarsipkan?: boolean` but no mutation function exported from `stokObatData.ts`, and no UI to set it. The "Archive stock" user requirement was unimplemented.  
**Fix:**  
- Added `archiveStokObat(uuid)` and `unarchiveStokObat(uuid)` exports to `stokObatData.ts`.  
- Added `getActiveStokObatList()` export that filters `diarsipkan === true` items.  
- Added "Arsipkan Item Stok" secondary action to `PenyesuaianStokObat.tsx` with inline two-step confirm pattern (orange warning card → Arsipkan button). After archive, auto-navigates back to `/stok-obat`.  
- Added guard: if item is already archived, a non-interactive "sudah diarsipkan" screen is shown instead of the form.

---

### BUG-5 — StokObat: Stock list shows archived items / uses stale STOK_OBAT_ITEMS reference

**File:** `src/pages/StokObat.tsx`  
**Symptom:** `STOK_OBAT_ITEMS` was imported and used directly in `RingkasanCards()`, `computeInsights()`, and `filteredItems` — none of which filtered out `diarsipkan: true` items. Post-archive, items would still appear in the active stock list.  
**Fix:** Replaced all three call sites with `getActiveStokObatList()` (fresh call each render), which excludes archived items. The stock count cards, AI insights, and item list all now reflect only non-archived stock.

---

### BUG-6 — RiwayatObatTab: `allRecords` frozen due to empty useMemo deps

**File:** `src/pages/RiwayatObatTab.tsx`  
**Symptom:**  
```typescript
const allRecords = useMemo(() => getRiwayatObatList(), []);  // deps = [] — NEVER updates
```  
Any records added by `addStokObatItem()` or `applyPenyesuaianStok()` to `RIWAYAT_OBAT_RECORDS` after initial mount were invisible in the Riwayat tab until the tab unmounted/remounted.  
**Fix:** Removed the `allRecords` useMemo entirely. `getRiwayatObatList()` is now called directly inside the `filtered` useMemo, so fresh data is read whenever any filter parameter changes. Since all mutation flows navigate away and back (causing a full remount), this is sufficient.

---

### BUG-7 — RiwayatObatTab: Product filter matched only one batch per product

**File:** `src/pages/RiwayatObatTab.tsx`  
**Symptom:** The filter dropdown was deduped by `produkKomersialUuid` (showing one entry per product), but the filter logic checked `item.stokObatUuid !== filter.stokUuid`. Since the dropdown bound to the first-encountered `StokObatItem.uuid` (batch A), products with multiple batches (e.g., Medical B Complex — Batch A + Batch B) would only show records for Batch A when filtered.  
**Fix:**  
- Renamed `FilterState.stokUuid → produkKomersialUuid`.  
- Filter logic now checks `item.produkKomersialUuid !== filter.produkKomersialUuid`, matching all batches of the selected product.  
- Updated all state initializers and clear callbacks to use the new field name.  
- `STOK_OBAT_ITEMS` import replaced with `getActiveStokObatList()` so archived products don't appear in the filter dropdown.

---

## Out-of-Scope Findings (OOS)

These findings were observed but are NOT fixed — they are outside the STOK-OBAT-FIX-001 scope.

| # | Finding | Suggested Task |
|---|---------|---------------|
| OOS-1 | `RiwayatObatDetail.tsx` — "Integritas: ✅ Valid — Referensi aktif" is a static hardcoded badge, not a live validation check. A record whose stokObatUuid no longer exists would still show "Valid". | Future: add live orphan check |
| OOS-2 | `TambahStokObat.tsx` — After `addStokObatItem()`, the stock list on `/stok-obat` shows the new item but `RingkasanCards` updates because it re-reads fresh data. However, there is no success notification telling the user which batch was just added. | Future: add toast/notification on add |
| OOS-3 | `stokObatData.ts` — `PENYESUAIAN_STOK_RECORDS` is a parallel audit log that duplicates data already in `RIWAYAT_OBAT_RECORDS`. Both are written on every `applyPenyesuaianStok()` call. Only `RIWAYAT_OBAT_RECORDS` is ever read by the UI. | Future: deprecate PENYESUAIAN_STOK_RECORDS |
| OOS-4 | `unarchiveStokObat()` was added to the data layer but has no UI entry point — there is no "Pulihkan Item" screen. The restore flow is a future feature. | Future: add Riwayat Arsip tab with restore action |
| OOS-5 | Master Obat / Produk Komersial Obat / Kesehatan Hewan / Penyakit — observed but not touched. |
