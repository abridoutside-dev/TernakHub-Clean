# DB-SYNC-001 — Dashboard Live Data Synchronization

**Date:** 15 Juli 2026  
**Scope:** `src/pages/Dashboard.tsx` — Summary cards synchronization  
**Constitution Reference:** 00_PROJECT_CONSTITUTION.md ("Honest data" principle)  
**Commit Tag:** DB-SYNC-001 Dashboard Live Data Synchronization

---

## 1. Objective

Replace the three hardcoded `'—'` placeholder values in the Dashboard Ringkasan section with live calculations derived from existing data registries. No new business logic, no new services, no layout changes.

---

## 2. Files Modified

| File | Change |
|---|---|
| `src/pages/Dashboard.tsx` | Added 2 imports; added 3 live computations; updated `summaryCards` derivation |

---

## 3. Synchronization Completed

### 3.1 Terjual Bulan Ini (`key: 'sold'`)

**Before:** `'—'`  
**After:** Count of archived animals where `reason === 'Terjual'` and `date` falls in the current calendar month (YYYY-MM prefix match).

**Data source reused:** `buildArchiveList()` from `src/utils/livestockSummary.ts` — already imported and called at line 80 for the Arsip Ternak section. No new call added; the existing `allArchive` array is filtered inline.

### 3.2 Stok Pakan (`key: 'feed'`)

**Before:** `'—'`  
**After:** `getInventarisList().length` — count of distinct pakan inventory items in the registry.

**Data source reused:** `getInventarisList()` from `src/data/stokInventarisData.ts` — the canonical pakan inventory accessor already used by the Stok Pakan module pages.

### 3.3 Stok Obat (`key: 'med'`)

**Before:** `'—'`  
**After:** `STOK_OBAT_ITEMS.length` — count of distinct medicine items in the stok obat registry.

**Data source reused:** `STOK_OBAT_ITEMS` from `src/data/stokObatData.ts` — the canonical stok obat registry already used by the Stok Obat module pages.

### 3.4 Total Ternak (`key: 'total'`)

No change. Already live (`totalActive + totalOutside`). Verified still correct.

---

## 4. Validation

| Check | Result |
|---|---|
| TypeScript compile (`tsc --noEmit`) | ✅ Clean — no errors |
| HMR hot-reload | ✅ Applied without page reload |
| Browser console errors | ✅ None |
| Summary cards render live values | ✅ Total Ternak: 71 · Terjual Bulan Ini: 0 · Stok Pakan: 8 · Stok Obat: 8 |
| No hardcoded `'—'` in Ringkasan section | ✅ Confirmed |
| Existing Dashboard architecture unchanged | ✅ No layout, no component, no section modified |
| Existing services reused only | ✅ No new data files created |
| No duplicated calculations | ✅ `allArchive` reused from existing variable; no extra calls |

---

## 5. Remaining Dashboard Issues (from SYNC-001)

The following Dashboard issues identified in SYNC-001 are **out of scope for DB-SYNC-001** and remain open:

| ID | Issue | Priority |
|---|---|---|
| S-12 | `ASSISTANT_CHIPS` (QUICK_CHIPS) are hardcoded navigation labels, not a rule-based AI engine. No `analyzedAt`/`dataSource`/`version`. | P6 Minor |

No other Dashboard issues remain from the DB-SYNC-001 scope. The three critical hardcoded values are now live.

---

## 6. Architecture Notes

- All three new computations are **direct calls** (no `useMemo`) consistent with the project convention documented in `dashboard-livestock-arch.md` — Dashboard is a presenter that calls builders directly each render so in-memory mutations always reflect.  
- Month filtering uses `new Date()` inside the component body, consistent with existing render-time derivations elsewhere in Dashboard.tsx.  
- No cross-module logic was introduced. Each value reads exactly one owning module's public accessor.
