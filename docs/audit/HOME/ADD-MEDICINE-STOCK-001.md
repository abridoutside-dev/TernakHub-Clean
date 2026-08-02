# HOME-AUDIT-004 — Tambah Stok Obat Flow
**Audit ID:** ADD-MEDICINE-STOCK-001  
**Date:** 2026-07-16  
**Scope:** End-to-end flow — Dashboard Quick Action "Tambah Stok Obat" → `/stok-obat/tambah` (TambahStokObat.tsx) — plus all data-layer consumers that depend on a functioning add-stock path.  
**Method:** Deep audit, no recovery. Read-only static analysis of source files.  
**Auditor:** Agent (HOME-AUDIT-004)

---

## Executive Summary

The "Tambah Stok Obat" flow is **completely non-functional end-to-end**. The form submits nothing, the data layer has no write path for new stock entries, and the form captures data that cannot legally populate the `StokObatItem` schema anyway. In parallel, the `PenyesuaianStokObat` page silently omits audit-trail writes, and multiple downstream components freeze their stok/riwayat reads at mount time. This is a more severe state than the pre-fix Tambah Stok Pakan flow — that flow at least had a write function (`addInventarisItem`) to target; here no such function exists.

---

## Finding Inventory

### Severity Key
| Code | Meaning |
|------|---------|
| **CATASTROPHIC** | Feature is architecturally impossible — data layer missing |
| **CRITICAL** | Feature broken at runtime — no data saved regardless of user action |
| **HIGH** | Feature partially broken — silent data loss or missing linking |
| **MEDIUM** | Misleading UI / architectural inconsistency, no immediate data loss |
| **LOW** | Polish / performance issue |

### Category Key
| Prefix | Category |
|--------|---------|
| A | Architecture |
| F | Form/Functional |
| S | Synchronization |
| D | Data |
| AI | AI Insight |
| UI | UI/UX |
| P | Performance |

---

## Findings

---

### A-001 — No `addStokObatItem()` function exists in the data layer
**Severity:** CATASTROPHIC  
**File:** `src/data/stokObatData.ts`

`stokObatData.ts` defines only one write function: `applyPenyesuaianStok()`, which **reduces** an existing item's quantity. There is no function to **add a new StokObatItem** to `STOK_OBAT_ITEMS`. The file's own comment block (lines 20–32) explicitly acknowledges this:

```
// Stok Obat Tambah belum diimplementasikan:
//   Produk Komersial reference picker, data merging, dan persistensi
//   untuk penambahan item baru belum ada. ...
```

The `src/dev/data-factory/stores/medicineStore.ts` corroborates this at line 2:
> "Same situation as feedStore.ts: KesehatanHewan.tsx / TambahStokObat.tsx have no shared src/data store for medicine today."

**Impact:** Even if the form fields were fully wired, there is no target to write to. `STOK_OBAT_ITEMS` can never grow at runtime through the UI.

---

### A-002 — `StokObatItem` requires `produkKomersialUuid` + `masterObatUuid`; form captures neither
**Severity:** CRITICAL  
**File:** `src/pages/TambahStokObat.tsx`, `src/data/stokObatData.ts` lines 82–110

`StokObatItem` schema (stokObatData.ts lines 82–110):
```ts
uuid: string;
workspaceUuid: string;
produkKomersialUuid: string;   // ← required, must link to Produk Komersial catalog
masterObatUuid: string;         // ← required, must link to Master Obat catalog
brand: string;
namaProduk: string;
bentukSediaan: string;
kemasan: string;
lokasiPenyimpanan: string;
jumlah: number;
satuan: string;
tanggalMasuk: string;
tanggalExpired: string | null;
```

`TambahStokObat.tsx` captures: free-text "Nama Obat" (from a hardcoded 6-item list), `jumlah`, `satuan`, `tanggalMasuk`, `tanggalExpired`, and several schema-less fields (`kategori`, `sumber`, `supplier`, `hargaTotal`). It does not capture `produkKomersialUuid`, `masterObatUuid`, `brand`, `bentukSediaan`, `kemasan`, or `lokasiPenyimpanan`.

**Impact:** A new `StokObatItem` built from this form's output would fail schema validation (missing required UUID foreign keys). Downstream lookups — `getObatByUuid(item.masterObatUuid)` in PengobatanKesehatan.tsx, `produkKomersialUuid` join in Riwayat filters, marketplace eligibility checks — would all break or return `undefined`.

---

### A-003 — `NamaObatDropdown` uses 6 hardcoded medicine names instead of live catalog
**Severity:** CRITICAL  
**File:** `src/pages/TambahStokObat.tsx` lines 6–13

```ts
const NAMA_OBAT_OPTIONS = [
  'Oxytetracycline', 'Ivermectin', 'Vitamin B Complex',
  'Multivitamin', 'Antiseptik', 'Vaksin',
];
```

This is a free-text input backed by a static 6-item autocomplete list. It does not reference:
- `getMasterObatList()` / `obatData.ts` (32 drugs across 9 categories, all with UUID keys)
- `produkKomersialObatData.ts` (commercial brand/seri/produk catalog with `produkKomersialUuid`)

Since both `produkKomersialUuid` and `masterObatUuid` are required on `StokObatItem`, the **only valid flow** would be: user picks a Produk Komersial item from catalog → `produkKomersialUuid`, `masterObatUuid`, `brand`, `bentukSediaan`, `kemasan`, and `namaProduk` are all auto-populated from the selected item. The current free-text approach makes this impossible.

---

### A-004 — `KATEGORI_OPTIONS` in form has no mapping to any `StokObatItem` schema field
**Severity:** HIGH  
**File:** `src/pages/TambahStokObat.tsx` lines 15–25

```ts
const KATEGORI_OPTIONS = [
  'Antibiotik','Antiparasit','Vitamin','Vaksin','Antiseptik',
  'Anti Inflamasi','Hormon','Suplemen','Lainnya',
];
```

`StokObatItem` has no `kategori` field. Kategori is resolved **downstream** via `masterObatUuid → obatData.ts.kategoriSlug`. The form collects this data but there is nowhere to store it.

---

### A-005 — `SUMBER_OPTIONS` has no mapping to any `StokObatItem` or `RiwayatObatRecord` schema field
**Severity:** HIGH  
**File:** `src/pages/TambahStokObat.tsx` lines 41–46

```ts
const SUMBER_OPTIONS = ['Pembelian','Hibah','Retur','Lainnya'];
```

`StokObatItem` has no `sumber` field. `RiwayatObatRecord.jenisAktivitas` does include `'Stok Masuk'` but the values don't match (`'Pembelian'` ≠ `'Stok Masuk'`). The data collected here would have no home in either schema.

---

### F-001 — `Simpan` button has no `onClick` handler — form saves nothing
**Severity:** CRITICAL  
**File:** `src/pages/TambahStokObat.tsx` lines ~485–498

The submit button is declared as:
```tsx
<button type="button">
  Simpan
</button>
```

No `onClick`, no `onSubmit`, no form submission logic of any kind. Clicking "Simpan" produces no side effect. This is structurally identical to the pre-fix `TambahStokPakan.tsx` defect (RECOVERY-SP-001 F-CRITICAL-1).

---

### F-002 — All 9 form fields are uncontrolled (`defaultValue`, no `useState`)
**Severity:** CRITICAL  
**File:** `src/pages/TambahStokObat.tsx`

| Field | Offending pattern |
|-------|-------------------|
| Kategori | `<select defaultValue="">` (line ~318) |
| Jumlah | `<input>` no value prop (line ~337) |
| Satuan | `<select defaultValue="">` (line ~348) |
| Sumber | `<select defaultValue="">` (line ~364) |
| Supplier | `<input>` no value prop (line ~380) |
| Tanggal Masuk | `<input defaultValue={today}>` (line ~396) |
| Tanggal Kedaluwarsa | `<input>` no value prop (line ~408) |
| Harga Total | `<input>` no value prop (line ~430) |
| Catatan | `<textarea>` no value prop (line ~451) |

`NamaObatDropdown` has its own internal `useState` but exposes no `value`/`onChange` interface to the parent — the selected name cannot be read by TambahStokObat at submit time.

Even if an `onClick` were added to Simpan, all field values would read as `undefined`.

---

### F-003 — Photo Section is decorative — `StokObatItem` has no photo field
**Severity:** MEDIUM  
**File:** `src/pages/TambahStokObat.tsx` lines ~202–284

A `PhotoSection` renders a "Tambah Foto" button, `hasPhoto` state, and a placeholder `img` preview. `StokObatItem` schema has no photo or gallery field of any kind. Data collected here cannot be persisted. Users who add a photo see a preview that disappears on any navigation.

---

### S-001 — `PenyesuaianStokObat.tsx` never calls `addRiwayatObat()` — adjustments are invisible to Riwayat
**Severity:** HIGH  
**File:** `src/pages/PenyesuaianStokObat.tsx`, `src/data/stokObatData.ts`

`applyPenyesuaianStok()` (the sole write function) mutates `item.jumlah` in-memory and appends to `PENYESUAIAN_STOK_RECORDS`. It does **not** call `addRiwayatObat()`. As a result:

1. Every stock adjustment is completely absent from the Riwayat tab.
2. `RIWAYAT_OBAT_RECORDS` only receives entries from `integrasiPengobatanService.ts` (treatment use). Manual adjustments leave no audit trail.
3. The stokObatData.ts comment calls this "fondasi untuk SO-006" (foundation for riwayat module), confirming it was deferred — but this deferral means a working adjustment page actively suppresses riwayat completeness.

`addRiwayatObat()` has the correct signature to accept a penyesuaian record (it supports `jenisAktivitas: 'Koreksi Stok' | 'Stock Opname' | 'Kedaluwarsa'` etc.). The wiring simply was never added.

---

### S-002 — `RiwayatObatTab` freezes `getRiwayatObatList()` at mount with `useMemo([])`
**Severity:** HIGH  
**File:** `src/pages/RiwayatObatTab.tsx` line 383

```ts
const allRecords = useMemo(() => getRiwayatObatList(), []);
//                                                      ^^ empty deps
```

`allRecords` is computed once when the tab mounts and never recomputed. Any `addRiwayatObat()` call that occurs while the component is alive (e.g., if a treatment is completed in another tab and the user returns to the Riwayat tab without a full page reload) will not surface in the list.

The correct pattern (used in other modules) is to call `getRiwayatObatList()` directly each render (no `useMemo`) and force re-render with a `tick` state counter after mutations.

---

### S-003 — `PengobatanKesehatan.tsx` freezes `STOK_OBAT_ITEMS` at mount with `useMemo([])`
**Severity:** HIGH  
**File:** `src/pages/PengobatanKesehatan.tsx` lines 519–528

```ts
const stokWithGenerik = useMemo(() => {
  return STOK_OBAT_ITEMS.map((item) => { ... });
}, []);
//   ^^ empty deps
```

`stokWithGenerik` and its derivatives (`usableStok`, `filteredStok`) are computed once. If stock levels change via `applyPenyesuaianStok()` while this component is mounted (e.g., user adjusts stock in another tab, returns), the treatment picker will show stale quantities. A `tick` prop from the parent sheet, or direct computation each render, is required.

---

### D-001 — `StokObat.tsx` reads `STOK_OBAT_ITEMS` via direct import — frozen reference if module re-evaluated
**Severity:** MEDIUM  
**File:** `src/pages/StokObat.tsx` line ~14

```ts
import { STOK_OBAT_ITEMS, ... } from '../data/stokObatData';
```

`STOK_OBAT_ITEMS` is the module-level array. Direct mutations to its elements (e.g., `stok.jumlah = newVal`) ARE visible on next render since the array reference is shared. However, if a new item were ever pushed to `STOK_OBAT_ITEMS` (e.g., via a future `addStokObatItem`), the React reconciler would not trigger a re-render because the array reference itself does not change. A getter function (`getStokObatList()`) plus a `tick` counter is the correct pattern, matching `src/data/stokInventarisData.ts → getInventarisList()`.

---

### AI-001 — `computeInsights()` in `StokObat.tsx` has only 3 minimal hardcoded rules
**Severity:** HIGH  
**File:** `src/pages/StokObat.tsx` lines ~29–53

The inline insight function checks only two conditions (Habis + Expired), then appends a generic "estimasi kebutuhan restock" message regardless of context. Compare this to the Stok Pakan module which has 5 dedicated categories (kritis, menipis, kedaluwarsa, nilai stok, tren penggunaan) in a separate `src/utils/stokInsight.ts` utility. Additionally:

- No trend analysis from `RIWAYAT_OBAT_RECORDS` (consumption rate, most-used medicines, reorder frequency)
- "BETA" badge used even though data IS live, unlike modules that use "LIVE"
- Tidak mendeteksi kondisi "Hampir Habis" padahal `getStatusStok()` returns this status

---

### AI-002 — `computeInsights()` is embedded in `StokObat.tsx` instead of a dedicated utility file
**Severity:** MEDIUM  
**File:** `src/pages/StokObat.tsx`

All other AI insight engines live in dedicated files:
- `src/utils/stokInsight.ts` (Stok Pakan)
- `src/data/aiInsightPakanData.ts` (Pemberian Pakan)
- `src/data/aiInsightBatchData.ts` (Batch)
- `src/data/aiInsightMutasiData.ts` (Mutasi)
- `src/data/aiInsightReproduksiData.ts` (Reproduksi)

The Stok Obat insight logic belongs in `src/utils/stokObatInsight.ts` or `src/data/aiInsightStokObatData.ts` for consistency, testability, and reuse by the dashboard.

---

### AI-003 — Riwayat data not used for trend analysis in AI Insight
**Severity:** MEDIUM  
**File:** `src/pages/StokObat.tsx`, `src/data/riwayatObatData.ts`

`RIWAYAT_OBAT_RECORDS` contains 23 seeded records with `jenisAktivitas`, `jumlahPerubahan`, `timestamp`, and `namaProduk`. This data would support:
- Which medicines are consumed fastest (deduction rate)
- Which medicines are nearing expected restock date
- Usage patterns by module (`modulSumber: 'Kesehatan Hewan'`)

None of this is read by the current insight function.

---

### UI-001 — No visible navigation from Stok tab → Tambah Stok Obat
**Severity:** MEDIUM  
**File:** `src/pages/StokObat.tsx` lines ~370–373

A comment in the Stok tab explicitly prohibits a "Tambah Stok" button:
> "penambahan stok hanya lewat Dashboard → Tambah Stok Obat atau Quick Action"

Users on `/stok-obat` who arrive via BottomNav (not Quick Action) have no visible path to the add-stock flow. The Quick Action data entry (`quickActionData.ts` line 58) correctly links to `/stok-obat/tambah`, but only users who know to return to Dashboard will find it. No FAB, no contextual link.

---

### P-001 — `computeInsights()` called on every render with no memoization
**Severity:** LOW  
**File:** `src/pages/StokObat.tsx`

`computeInsights()` iterates `STOK_OBAT_ITEMS` on every render of `AiInsightCard`. With 8 seed items this is negligible, but it's inconsistent with the tick-refresh pattern used by other insight cards.

---

### P-002 — `RingkasanCards` runs three `.filter()` passes on every render
**Severity:** LOW  
**File:** `src/pages/StokObat.tsx` lines ~102–114

Summary card counts (`Tersedia`, `Hampir Habis/Expired`, `Habis`) are recomputed from `STOK_OBAT_ITEMS` on every render. Same issue as P-001 — memoize behind a getter + tick.

---

## Finding Summary Table

| ID | Category | Severity | Component | Description |
|----|----------|----------|-----------|-------------|
| A-001 | A | **CATASTROPHIC** | stokObatData.ts | No `addStokObatItem()` function — data layer write path missing entirely |
| A-002 | A | **CRITICAL** | TambahStokObat.tsx | Required `produkKomersialUuid` + `masterObatUuid` not captured |
| A-003 | A | **CRITICAL** | TambahStokObat.tsx | NamaObatDropdown: 6 hardcoded names, no live catalog integration |
| F-001 | F | **CRITICAL** | TambahStokObat.tsx | Simpan button has no `onClick` — submits nothing |
| F-002 | F | **CRITICAL** | TambahStokObat.tsx | All 9 form fields uncontrolled (`defaultValue`, no `useState`) |
| A-004 | A | **HIGH** | TambahStokObat.tsx | `KATEGORI_OPTIONS` has no field in `StokObatItem` schema |
| A-005 | A | **HIGH** | TambahStokObat.tsx | `SUMBER_OPTIONS` has no field in `StokObatItem` or `RiwayatObatRecord` schema |
| S-001 | S | **HIGH** | PenyesuaianStokObat.tsx | `applyPenyesuaianStok` never calls `addRiwayatObat` — adjustments absent from Riwayat |
| S-002 | S | **HIGH** | RiwayatObatTab.tsx | `useMemo([])` freezes `getRiwayatObatList()` at mount — new entries invisible |
| S-003 | S | **HIGH** | PengobatanKesehatan.tsx | `useMemo([])` freezes `STOK_OBAT_ITEMS` at mount — stale quantities in treatment picker |
| AI-001 | AI | **HIGH** | StokObat.tsx | 3-rule insight engine — no Hampir Habis detection, no trend analysis |
| D-001 | D | **MEDIUM** | StokObat.tsx | Direct `STOK_OBAT_ITEMS` import — future `push()` won't trigger re-render |
| F-003 | F | **MEDIUM** | TambahStokObat.tsx | Photo Section decorative — no photo field in `StokObatItem` |
| AI-002 | AI | **MEDIUM** | StokObat.tsx | `computeInsights()` embedded in page, not a dedicated utility file |
| AI-003 | AI | **MEDIUM** | StokObat.tsx | Riwayat data unused for trend analysis in AI insight |
| UI-001 | UI | **MEDIUM** | StokObat.tsx | No visible path from Stok tab → Tambah Stok Obat |
| P-001 | P | LOW | StokObat.tsx | `computeInsights()` unmemoized, called every render |
| P-002 | P | LOW | StokObat.tsx | `RingkasanCards` filter passes unmemoized, called every render |

**Total:** 18 findings — 1 Catastrophic, 4 Critical, 6 High, 5 Medium, 2 Low

---

## Components Confirmed Functioning Correctly

| Component | Status | Notes |
|-----------|--------|-------|
| Quick Action routing | ✅ | `quickActionData.ts` line 58 → `/stok-obat/tambah` correct |
| Route `/stok-obat/tambah` | ✅ | Registered in `App.tsx` line 532 |
| Route `/stok-obat/riwayat/:id` | ✅ | Registered in `App.tsx` line 544 |
| `PenyesuaianStokObat.tsx` form logic | ✅ | Fully controlled fields, validation, `applyPenyesuaianStok()` wired correctly |
| `applyPenyesuaianStok()` | ✅ | Correctly mutates `item.jumlah` and logs to `PENYESUAIAN_STOK_RECORDS` |
| `addRiwayatObat()` | ✅ | Well-designed, idempotent — only needs to be called from adjustment + add-stock paths |
| `RiwayatObatDetail.tsx` | ✅ | Reads live via `getRiwayatObatById()`, route registered, not frozen |
| `integrasiPengobatanService.ts` | ✅ | Correctly calls both `applyStokDeduction` AND `addRiwayatObat()` for treatment usage |
| Treatment-path riwayat entries | ✅ | 23 seeded records correctly reflect treatment activity |

---

## Recovery Scope (for future RECOVERY-SO-001 task)

The recovery task for this flow is substantially larger than RECOVERY-SP-001 (Tambah Stok Pakan) because the data layer must be built from scratch:

1. **Data layer (new):** Add `addStokObatItem(input)` to `stokObatData.ts`. Must accept the reference pair `{produkKomersialUuid, masterObatUuid}` and auto-populate `brand`, `namaProduk`, `bentukSediaan`, `kemasan` from the Produk Komersial catalog. After adding, must call `addRiwayatObat(jenisAktivitas: 'Stok Masuk')`.

2. **TambahStokObat.tsx (full rebuild):** Replace `NamaObatDropdown` with a 2-step reference picker sheet (Source chip → Produk Komersial catalog list, similar to RECOVERY-SP-001's Stok Pakan picker). All fields converted to controlled `useState`. `Simpan` validates → calls `addStokObatItem()` → navigates to `/stok-obat`.

3. **StokObat.tsx (partial fix):** Replace direct `STOK_OBAT_ITEMS` import with `getStokObatList()` getter + `tick` counter to pick up newly added items.

4. **PenyesuaianStokObat.tsx (minor fix):** After `applyPenyesuaianStok()` call, add `addRiwayatObat({jenisAktivitas: jenis, ...})` call to write the adjustment into the audit trail.

5. **RiwayatObatTab.tsx (minor fix):** Remove `useMemo([])` wrapper from `getRiwayatObatList()` call; add `tick` prop or call directly each render.

6. **PengobatanKesehatan.tsx (minor fix):** Remove `useMemo([])` from `stokWithGenerik` build; add `tick` dependency or call directly each render.

7. **AI Insight (future enhancement):** Extract to `src/utils/stokObatInsight.ts`; add Hampir Habis detection; add consumption-rate trend from `RIWAYAT_OBAT_RECORDS`.

---

*End of audit — ADD-MEDICINE-STOCK-001*
