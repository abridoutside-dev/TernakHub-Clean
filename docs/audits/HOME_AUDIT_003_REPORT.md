# HOME-AUDIT-003 — Deep Audit: Tambah Stok Pakan Flow
**Audit Date:** 2026-07-16  
**Scope:** Home → Quick Action "Tambah Stok Pakan" → `/stok-pakan/tambah` → all downstream effects  
**Phase:** Audit only. No recovery performed.

---

## Executive Summary

The entire Tambah Stok Pakan chain — from the entry form through to the Stok list, Riwayat, Detail, and AI Insight tabs — is **non-functional end-to-end**. The form saves nothing. The Stok tab lists hardcoded dummy data. The Riwayat tab (both inline and standalone page) reads from a hardcoded array. The Detail page always shows a static "Rumput Gajah" card regardless of which item is clicked. The Formula tab shows a "Coming Soon" placeholder despite the full implementation existing. The live AI insight engine (`computeStokAiInsights`) is never called from any page.

The only parts of the Stok Pakan module that are correctly wired are:
- **Dashboard Summary Card (Feed Stock)** — reads live from `getInventarisList()` in `dashboardSummaryData.ts`. ✅  
- **Master Pakan tabs** (all categories with detail pages) — live and correct. ✅  
- **Produk Komersial tabs** — live and correct. ✅  
- **Pemberian Pakan → AI Insight** (`aiInsightPakanData.ts`) — live and correct. ✅  
- **Formula → Stok integration** (`addInventarisFromProduksi`, `addPerubahanStok`) — live and correct. ✅  
- **StokInventarisDetail.tsx** at `/stok-pakan/inventaris/:id` — live, reads `getInventarisById()`. ✅ (but unreachable — see A-004)

---

## Issue Registry

### Severity Legend
- **CRITICAL** — Data is never written / always lost / flow is completely broken  
- **HIGH** — A fully built feature is bypassed or a major data contract is violated  
- **MEDIUM** — Functional gap or UX deficiency with workaround  
- **LOW** — Minor polish / cosmetic gap

---

### F-001 [CRITICAL] — Tambah Stok Pakan: Simpan button does nothing

**File:** `src/pages/TambahStokPakan.tsx`  
**Location:** ~line 482 (Simpan button)

The "Simpan" button is `type="button"` with **no `onClick` handler**. There is no form `onSubmit`. No data-layer function is imported. Pressing Simpan has zero observable effect — no navigation, no data write, no error.

This is the same class of defect as the pre-recovery AddLivestock page (HOME-REC-002).

**Impact:** The Quick Action "Tambah Stok Pakan" on the Home screen is entirely non-functional. New stock can never be added via this path.

---

### F-002 [CRITICAL] — All form fields are uncontrolled (no useState)

**File:** `src/pages/TambahStokPakan.tsx`

Every input field uses `defaultValue` (uncontrolled), not `value` + `onChange` (controlled):
- `select#kategori`, `input#jumlah`, `select#unit`, `select#sumber`, `input#supplier`, `input#tanggal-masuk`, `input#harga-total`, `textarea#catatan`
- `NamaPakanDropdown` manages its own internal state (`value`, `query`) but **does not expose that value to the parent** via props or callback.

There is no `useState` for any of these fields at the page level. Even if a submit handler were added, it would have no values to read.

---

### A-001 [CRITICAL] — Form uses hardcoded free-text names; violates `referensiId` contract

**File:** `src/pages/TambahStokPakan.tsx`  
**Data contract:** `src/data/stokInventarisData.ts` lines 195–203

`addInventarisItem()` has a **mandatory** `referensiId: string` field. The architecture comment states explicitly:
> "Referensi WAJIB berasal dari Master Pakan, Produk Komersial, atau Hasil Produksi. Tidak ada input nama bebas."

The form's `NamaPakanDropdown` uses a hardcoded `NAMA_PAKAN_OPTIONS` array of 6 free-text strings (e.g. `"CP-01"`, `"Silase Tebon Jagung"`, `"Rumput Gajah"`). None of these map to a real Master Pakan slug or Produk Komersial UUID. Submitting would produce inventaris items with no valid `referensiId`, breaking:
- `riwayatStokPakanData.ts` — `lookupSeriNama()` joins on `referensiId`
- `stokInsight.ts` — unit price fallback reads `getMasterPakanById(referensiId)`
- Formula bahan matching — `findInvByNama` falls back to `referensiId` for deduplication
- Marketplace integration — `MPK-022` resolves `asetWorkspaceOption` by `referensiId`

The form must be rebuilt as a reference-picker (pick from live Master Pakan or Produk Komersial catalog), matching the pattern in `TambahStokObat.tsx`.

---

### A-002 [HIGH] — `SUMBER_OPTIONS` and `KATEGORI_OPTIONS` in form don't match data-layer enums

**File:** `src/pages/TambahStokPakan.tsx`

**Sumber mismatch:**  
Form shows: `['Pembelian', 'Produksi Sendiri', 'Hibah', 'Retur', 'Lainnya']`  
`InventarisSumber` type is: `'Master Pakan' | 'Produk Komersial' | 'Hasil Produksi'`  
`StokSumber` type is: `'Tambah Stok' | 'Marketplace' | 'Produksi Formula' | ...`  
None of the form options match either enum — they would persist as invalid values.

**Kategori mismatch:**  
Form offers: `['Hijauan', 'Konsentrat', 'Silase', 'Hay', 'Fermentasi', 'Mineral', 'Vitamin', 'Lainnya']`  
`RAW_INVENTARIS` uses: `'Hijauan' | 'Serat' | 'Mineral' | 'Konsentrat' | 'Vitamin' | 'Premix' | 'Hasil Produksi'`  
Mismatched categories ("Silase", "Hay", "Fermentasi") would persist as non-canonical strings, breaking category filters and groupings.

---

### A-003 [MEDIUM] — Form missing `lokasiPenyimpanan` field

**File:** `src/pages/TambahStokPakan.tsx`

`InventarisItem` and `AddInventarisInput` both have `lokasiPenyimpanan?: string`. The Stok list in `StokInventarisDetail.tsx` displays location ("📍 Gudang A"). The form has no location input, so all items added via this form would show "—" as location permanently.

---

### S-001 [CRITICAL] — StokPakan.tsx Stok tab reads hardcoded `FEED_ITEMS`, not `getInventarisList()`

**File:** `src/pages/StokPakan.tsx` (lines 8–33)

The Stok tab renders from a local hardcoded `FEED_ITEMS` array (6 items) instead of `getInventarisList()` from `stokInventarisData.ts`. The live `RAW_INVENTARIS` has 9 seeded items and grows with each `addInventarisItem()` call.

**Cascade effects:**
- New stock added via Tambah Stok form (once fixed) will never appear in the Stok list
- Status badges (Normal/Menipis/Habis) reflect the hardcoded dummy values, not live thresholds
- Search and filter operate on the stale array — results are always wrong
- `SUMMARY_CARDS` (lines 35–40) are hardcoded strings: "6", "1.490", "3", "—" — diverges immediately from any real data

---

### S-002 [CRITICAL] — StokPakan.tsx Stok tab AI Insight reads hardcoded `AI_INSIGHTS` array

**File:** `src/pages/StokPakan.tsx` (lines 101–109)

The `AiInsightCard` inside the Stok tab renders from a local hardcoded `AI_INSIGHTS` array (5 fixed strings). `computeStokAiInsights()` from `src/utils/stokInsight.ts` — a fully built live insight engine that reads from 5 data sources — is **never imported or called anywhere in the UI**.

`stokInsight.ts` is effectively dead code from the UI's perspective despite being fully implemented.

---

### S-003 [CRITICAL] — StokPakan.tsx Riwayat tab reads hardcoded `HISTORY` array

**File:** `src/pages/StokPakan.tsx` (lines 46–62)

The Riwayat tab filters from a local hardcoded `HISTORY` array (11 dummy items). `getAllRiwayatEntries()` and `queryRiwayat()` from `riwayatStokPakanData.ts` are not imported. Real transactions (Tambah Stok, Perubahan Stok, Pemberian Pakan, Produksi Formula, Marketplace) do not appear here.

---

### S-004 [CRITICAL] — `RiwayatStokPakan.tsx` (standalone page) reads hardcoded `HISTORY`

**File:** `src/pages/RiwayatStokPakan.tsx` (lines 7–75)

The standalone Riwayat page at `/stok-pakan/riwayat` has its own hardcoded `HISTORY` array (identical pattern to StokPakan.tsx's inline Riwayat tab). None of the live API is used:
- `queryRiwayat()` — not imported
- `getAllRiwayatEntries()` — not imported
- `getRiwayatRingkasan()` — not imported

The full filter capability (aktivitas, waktu, sumberData, lokasi, sort) defined in `DEFAULT_RIWAYAT_QUERY` is completely unused. The filter and reset buttons in the sheet only call `onClose()` — no filter state is read or applied.

---

### S-005 [CRITICAL] — `StokPakanDetail.tsx` is an entirely hardcoded dummy page

**File:** `src/pages/StokPakanDetail.tsx`  
**Route:** `/stok-pakan/:id`

This page has a hardcoded `FEED` constant (always "Rumput Gajah", 850 Kg) and hardcoded `STOCK_HISTORY` (3 fixed entries). It does **not** call `useParams()`, `getInventarisById()`, or any data-layer function. Every click on any item card in the Stok tab navigates to this page — and always shows the same static Rumput Gajah card regardless of which item was clicked.

A correctly implemented version exists (`StokInventarisDetail.tsx` at `/stok-pakan/inventaris/:id`) but is unreachable — see A-004.

---

### A-004 [HIGH] — FeedCard onClick navigates to wrong route (dummy detail, not live detail)

**File:** `src/pages/StokPakan.tsx` (FeedCard component, line ~708)  
**Related:** `src/App.tsx` (routes 522 vs 532)

App.tsx registers two detail routes:
- `/stok-pakan/:id` → `StokPakanDetail` (dummy, always Rumput Gajah)
- `/stok-pakan/inventaris/:id` → `StokInventarisDetail` (live, reads `getInventarisById(id)`)

`StokPakan.tsx`'s `FeedCard.onClick` navigates to `` `/stok-pakan/${item.id}` `` (numeric IDs from `FEED_ITEMS`), hitting the dummy route. The live detail page (`StokInventarisDetail`) is never reached from the Stok tab.

**Fix required:** FeedCard must navigate to `/stok-pakan/inventaris/${item.id}` using real `InventarisItem` IDs from `getInventarisList()`.

---

### F-003 [HIGH] — Formula tab in StokPakan shows "Coming Soon" despite `FormulaTab` being built

**File:** `src/pages/StokPakan.tsx` (~line 624)

```tsx
{mode === 'formula' && <ComingSoon label="Formula Pakan" />}
```

`FormulaTab.tsx` exports:
- `export default FormulaTab` — full list with AI Insight and CRUD
- `export function FormulaAiInsightCard` — live AI insight card
- `export function FormulaRingkasanCards` — live summary cards

None of these are imported into `StokPakan.tsx`. The Formula mode should render `FormulaAiInsightCard` + `FormulaRingkasanCards` above the ModeSelector (matching the Master and Komersial pattern) and `<FormulaTab />` as the content body.

---

### F-004 [HIGH] — Stok tab filter button is entirely inert

**File:** `src/pages/StokPakan.tsx` (~line 690)

The filter button in the Stok tab has `cursor: 'default'` and no `onClick`. It cannot be clicked. The Riwayat tab filter does open a sheet (`showRiwayatFilter`), but the Reset and Apply buttons inside only call `onClose()` — no filter parameters are set or applied.

---

### F-005 [MEDIUM] — `NamaPakanDropdown` "+ Tambah Jenis Pakan" button does nothing

**File:** `src/pages/TambahStokPakan.tsx` (NamaPakanDropdown component)

The "+ Tambah Jenis Pakan" option at the bottom of the dropdown calls `setOpen(false)` only. It implies the user can create a new item, but nothing happens. This button is in any case architecturally incorrect — new items must be added through Master Pakan or Produk Komersial, not via the Tambah Stok form.

---

### F-006 [MEDIUM] — Photo section is cosmetic only

**File:** `src/pages/TambahStokPakan.tsx` (PhotoSection)

"Ambil Foto" and "Pilih dari Galeri" only call `setHasPhoto(true)` — no file input, no camera API, no file reference captured. `InventarisItem` has no `foto` field, so this is also a schema gap. Photo data would be silently discarded even if submit were wired.

---

### D-001 [MEDIUM] — `SUMMARY_CARDS` in StokPakan Stok tab are hardcoded and incorrect

**File:** `src/pages/StokPakan.tsx` (lines 35–40)

| Card | Hardcoded value | Live truth (from `getInventarisList()`) |
|------|----------------|---------------------------------------|
| Total Jenis Pakan | "6" | 9 (RAW_INVENTARIS has 9 seeded items) |
| Total Stok (Kg) | "1.490" | sum of `jumlahStok` across live items |
| Stok Hampir Habis | "3" | count of items with `status === 'Menipis'` |
| Nilai Persediaan | "—" | computable by `computeStokAiInsights()` |

`dashboardSummaryData.ts`'s Feed Stock card reads live from `getInventarisList()` correctly — the mismatch is isolated to StokPakan.tsx's own tab.

---

### P-001 [LOW] — `getAllRiwayatEntries()` would double-compute on each render once wired

**File:** `src/data/riwayatStokPakanData.ts`

`getAllRiwayatEntries()` re-aggregates and re-sorts the full combined list on every call. Once both `queryRiwayat()` and `getRiwayatRingkasan()` are wired into Riwayat pages (they both call `getAllRiwayatEntries()` internally), each render would trigger two full traversals. Memoization or a single call at the page level would prevent this.

---

## Summary Table

| ID | Severity | File | Description |
|----|----------|------|-------------|
| F-001 | CRITICAL | TambahStokPakan.tsx | Simpan button has no onClick — nothing happens on submit |
| F-002 | CRITICAL | TambahStokPakan.tsx | All fields uncontrolled (no useState) — values unreadable |
| A-001 | CRITICAL | TambahStokPakan.tsx | Free-text name picker violates mandatory `referensiId` contract |
| S-001 | CRITICAL | StokPakan.tsx | Stok tab reads `FEED_ITEMS` (hardcoded) not `getInventarisList()` |
| S-002 | CRITICAL | StokPakan.tsx | AI Insight reads hardcoded `AI_INSIGHTS` not `computeStokAiInsights()` |
| S-003 | CRITICAL | StokPakan.tsx | Riwayat tab reads `HISTORY` (hardcoded) not `queryRiwayat()` |
| S-004 | CRITICAL | RiwayatStokPakan.tsx | Standalone page reads hardcoded `HISTORY`; all live APIs unused |
| S-005 | CRITICAL | StokPakanDetail.tsx | Always renders hardcoded Rumput Gajah; ignores URL `:id` param |
| A-004 | HIGH | StokPakan.tsx | FeedCard navigates to dummy route (`/stok-pakan/:id`), not live detail |
| F-003 | HIGH | StokPakan.tsx | Formula tab renders `<ComingSoon>` despite `FormulaTab` being built |
| F-004 | HIGH | StokPakan.tsx | Stok tab filter button has `cursor:default`, no onClick |
| A-002 | HIGH | TambahStokPakan.tsx | Sumber & Kategori options don't match data-layer enums |
| A-003 | MEDIUM | TambahStokPakan.tsx | Missing `lokasiPenyimpanan` field |
| F-005 | MEDIUM | TambahStokPakan.tsx | "+ Tambah Jenis Pakan" button does nothing |
| F-006 | MEDIUM | TambahStokPakan.tsx | Photo section is cosmetic only (no actual capture) |
| D-001 | MEDIUM | StokPakan.tsx | SUMMARY_CARDS are hardcoded strings, not live computed values |
| P-001 | LOW | riwayatStokPakanData.ts | `getAllRiwayatEntries()` will double-compute once both callers are wired |

---

## Recovery Scope (for HOME-REC-003)

### 1. TambahStokPakan.tsx — Full rebuild
- Replace `NamaPakanDropdown` with a 2-step reference picker:
  - Step 1: choose source (Master Pakan catalog or Produk Komersial catalog)
  - Step 2: pick a specific item → resolve `referensiId`, `nama`, `kategori`, `satuan`
- Add `useState` for all fields (`referensiId`, `nama`, `kategori`, `jumlah`, `satuan`, `sumber`, `supplier`, `tanggalMasuk`, `hargaTotal`, `lokasiPenyimpanan`, `catatan`)
- `sumber` field maps to `InventarisSumber` enum; `sumberMasuk` defaults to `'Tambah Stok'`
- `kategori` options must match `InventarisItem.kategori` canonical values
- Wire Simpan button: validate → call `addInventarisItem()` → navigate to `/stok-pakan`
- Remove non-functional photo section (no schema support)

### 2. StokPakan.tsx — Stok tab
- Replace `FEED_ITEMS` with `getInventarisList()` (call directly each render, no useMemo freeze)
- Replace `SUMMARY_CARDS` with live computed: count, total kg, menipis count, nilai persediaan
- Replace `AI_INSIGHTS` with `computeStokAiInsights()` from `src/utils/stokInsight.ts`
- FeedCard onClick: navigate to `/stok-pakan/inventaris/${item.id}` (live route)
- Wire Stok tab filter button (open filter sheet + apply facets)

### 3. StokPakan.tsx — Riwayat tab
- Replace `HISTORY` with `getAllRiwayatEntries()` or `queryRiwayat()`
- Wire filter sheet state to `queryRiwayat()` facets (aktivitas, waktu, sumberData)

### 4. StokPakan.tsx — Formula tab
- Import `FormulaTab`, `FormulaAiInsightCard`, `FormulaRingkasanCards` from `FormulaTab.tsx`
- Render `FormulaAiInsightCard` + `FormulaRingkasanCards` in the AI/Summary block (when mode === 'formula')
- Render `<FormulaTab />` as content body (replace `<ComingSoon>`)

### 5. RiwayatStokPakan.tsx — Full wire-up
- Replace hardcoded `HISTORY` with `queryRiwayat()` and `DEFAULT_RIWAYAT_QUERY`
- Lift filter state to page level; wire filter sheet changes to re-run `queryRiwayat()`
- Wire `getRiwayatRingkasan()` for summary counts at top

### 6. StokPakanDetail.tsx — Retire / redirect
- Remove `StokPakanDetail.tsx` (dummy, always Rumput Gajah)
- Remove its route `<Route path="/stok-pakan/:id" element={<StokPakanDetail />} />` from App.tsx
- `StokInventarisDetail.tsx` at `/stok-pakan/inventaris/:id` is the canonical live detail — keep it

### Out of scope for HOME-REC-003
- Photo/foto field on `InventarisItem` (schema gap — no current field exists)
- P-001 memoization (pre-optimization, not a functional bug)
- `formulaData` ingredient matching by `referensiId` (pre-existing known gap, BT-006)

---

## Healthy Parts Confirmed (No Bugs Found)

| Area | Status |
|------|--------|
| Quick Action routing (`qa-stok-pakan` → `/stok-pakan/tambah`) | ✅ Correct |
| Dashboard Summary "Feed Stock" widget | ✅ Reads live from `getInventarisList()` |
| Master Pakan tabs (all 20+ categories, detail pages) | ✅ Live and correct |
| Produk Komersial tabs (all categories, brand/seri/detail) | ✅ Live and correct |
| Pemberian Pakan AI Insight (`aiInsightPakanData.ts`) | ✅ Live and wired |
| Formula → Stok integration (bahan deduction + hasil addition) | ✅ Live and correct |
| Formula → Riwayat logging (`addPerubahanStok` + `addInventarisFromProduksi`) | ✅ Live and correct |
| `StokInventarisDetail.tsx` at `/stok-pakan/inventaris/:id` | ✅ Live (but unreachable — A-004) |
| `stokInventarisData.ts` data layer | ✅ Fully built, correct contract |
| `riwayatStokPakanData.ts` + `queryRiwayat()` | ✅ Fully built (unused by pages) |
| `stokInsight.ts` + `computeStokAiInsights()` | ✅ Fully built (dead code in UI) |
