# DB-SYNC-003 — Dashboard List Synchronization

**Date:** 15 Juli 2026  
**Scope:** `src/pages/Dashboard.tsx` — Daftar Pakan and Daftar Obat section synchronization  
**Constitution Reference:** 00_PROJECT_CONSTITUTION.md ("Honest data" principle)  
**Preceded by:** DB-SYNC-002 Dashboard Final Audit (identified M-02)  
**Commit Tag:** DB-SYNC-003 Dashboard List Synchronization

---

## 1. Objective

Resolve audit finding M-02: the "Daftar Pakan" and "Daftar Obat" list sections displayed a hardcoded `SectionEmptyState` unconditionally, even though both registries contained live data. This contradicted the Ringkasan summary cards (Stok Pakan: 8, Stok Obat: 8) on the same page, violating the "honest data" principle of `00_PROJECT_CONSTITUTION.md`.

---

## 2. Files Modified

| File | Change |
|---|---|
| `src/pages/Dashboard.tsx` | Extended existing variable derivations; replaced hardcoded empty state in sections 9 and 10 with conditional preview rows |

---

## 3. Synchronization Result

### 3.1 Variable Derivation (L107–114)

**Before:**
```typescript
const totalStokPakan = getInventarisList().length;
const totalStokObat  = STOK_OBAT_ITEMS.length;
```

**After:**
```typescript
const allStokPakan     = getInventarisList();       // full list — reused for summary count + preview
const totalStokPakan   = allStokPakan.length;
const previewStokPakan = allStokPakan.slice(0, 3);

const totalStokObat    = STOK_OBAT_ITEMS.length;
const previewStokObat  = STOK_OBAT_ITEMS.slice(0, 3);
```

`getInventarisList()` is now called **once** and the result is used for both the summary count and the preview slice. No duplicate calls. `STOK_OBAT_ITEMS` is a module-level constant; `.slice(0, 3)` adds no overhead.

### 3.2 Section 9 — Daftar Pakan

**Before:** Unconditional `SectionEmptyState` (hardcoded, always shown).

**After:** Conditional rendering —
- `previewStokPakan.length === 0` → `SectionEmptyState` icon="🌿"
- Otherwise → `Card` containing up to 3 rows, each showing: **nama** (item name), **kategori** (subtitle), **jumlahStok + satuan** (right-aligned quantity in `#7b5e2a` matching the Stok Pakan card colour)
- "Lihat Selengkapnya" button always present, navigates to `/stok-pakan`

Fields used per row: `item.id` (key), `item.nama`, `item.kategori`, `item.jumlahStok`, `item.satuan` — all present on `InventarisItem` from `stokInventarisData.ts`.

### 3.3 Section 10 — Daftar Obat

**Before:** Unconditional `SectionEmptyState` (hardcoded, always shown).

**After:** Conditional rendering —
- `previewStokObat.length === 0` → `SectionEmptyState` icon="💊"
- Otherwise → `Card` containing up to 3 rows, each showing: **namaProduk** (item name), **brand · bentukSediaan** (subtitle), **jumlah + satuan** (right-aligned quantity in `#2a7b4f` matching the Stok Obat card colour)
- "Lihat Selengkapnya" button always present, navigates to `/stok-obat`

Fields used per row: `item.uuid` (key), `item.namaProduk`, `item.brand`, `item.bentukSediaan`, `item.jumlah`, `item.satuan` — all present on `StokObatItem` from `stokObatData.ts`.

---

## 4. Validation

| Check | Result |
|---|---|
| TypeScript compile (`tsc --noEmit`) | ✅ Clean — no errors |
| HMR hot-reload | ✅ Applied without page reload |
| Browser console errors | ✅ None |
| Summary cards consistent with list sections | ✅ Both show data from same registry |
| Empty state appears only when registry is empty | ✅ Conditional on `previewX.length === 0` |
| No duplicate registry calls | ✅ `getInventarisList()` called once; result reused |
| Existing services reused | ✅ No new imports; both registries already imported in DB-SYNC-001 |
| Dashboard remains read-only | ✅ No mutations; preview rows are display-only |
| Existing architecture unchanged | ✅ No layout redesign; `Card` and `SectionEmptyState` components reused |
| Maximum 3 preview rows enforced | ✅ `.slice(0, 3)` on both lists |

---

## 5. Remaining Dashboard Issues

| ID | Issue | Status |
|---|---|---|
| M-01 (S-12) | `ASSISTANT_CHIPS` are static navigation labels — not a rule-based AI engine; missing `analyzedAt`/`dataSource`/`version` | ⚠️ Open — non-blocking, no data integrity risk |

M-02 (the finding that motivated DB-SYNC-003) is **resolved**.

No other Dashboard synchronization issues remain from the DB-SYNC series.
