# LS-FILTER-002: Livestock Filter Standardization — Final Report

**Date:** 2026-07-16  
**Status:** ✅ COMPLETE — zero TypeScript errors, build passing

---

## Objective

Standardize the livestock filter across all 10 livestock-related module pages to match the **CatatBobot** pattern (SSOT): chip-based, cascading bottom-sheet filter using the shared `LivestockFilterSheet.tsx` components. No dropdowns/selects in any filter.

---

## SSOT: LivestockFilterSheet.tsx

Exports everything needed:
- `Filters` type: `{ jenis, ras, program, programSub, status, blok, kandang, lokasiLuar, batchId }`
- `DEFAULT_FILTERS`, `countActiveFilters()`, `handleRemoveFilterChip(key, current) → Partial<Filters>`
- `FilterSheet` — cascading chip-based bottom sheet
- `FilterChips`, `SearchFilterBar`, `SegmentedControl`, `ChipGroup`
- `type FilterableIndividu { blok?, kandang?, program?, batchId? }`
- `type FilterableBatch { members: Array<{blok?, kandang?}> }`

---

## Module Status (Post-Migration)

| Module | File | Status |
|--------|------|--------|
| CatatBobot | `CatatBobot.tsx` | ✅ SSOT — untouched |
| Livestock Hub | `Livestock.tsx` | ✅ Already compliant — untouched |
| PemberianPakan | `PemberianPakan.tsx` | ✅ Already compliant — untouched |
| ActiveLivestock | `ActiveLivestock.tsx` | ✅ Fixed — removed stale URL-param `const filters` duplicate |
| OutsideLivestock | `OutsideLivestock.tsx` | ✅ Fixed — removed stale URL-param `const filters` duplicate (had old fields `reason`, `gender`, `age`) |
| ArchiveLivestock | `ArchiveLivestock.tsx` | ✅ Fixed — removed stale URL-param `const filters` duplicate (had old field `gender`) |
| KesehatanHewan | `KesehatanHewan.tsx` | ✅ Fixed — removed local `FilterSheet` (155 lines, dropdown-based), removed local `FilterChips`, removed unused `SelectRow`; added shared imports |
| Reproduksi | `Reproduksi.tsx` | ✅ Fixed — removed `SelectRow`, `SearchFilterSection`, `LOKASI_OPTIONS`, `BATCH_ALL_OPTION`, `getBatchOptions`, `STATUS_REPRO_OPTIONS`; removed dead state `lokasi/batchFilter/statusRepro`; added `filters/filterOpen` state; replaced JSX with shared components; updated `displayedPrograms` to use participant-based filter semantics |
| Mutasi | `Mutasi.tsx` | ✅ Fixed — removed `SelectRow`, `SearchFilterSection`, local constants; removed dead `status` prop from `DaftarMutasiSection` + `RiwayatMutasiSection`; removed `matchesStatusFilter` function; added shared filter state + JSX |
| BatchList | `BatchList.tsx` | (Not in scope — batch-specific page) |

---

## Key Patterns Applied

### Filter State (every migrated page)
```tsx
const [filters,    setFilters]    = useState<Filters>(DEFAULT_FILTERS);
const [filterOpen, setFilterOpen] = useState(false);

function handleRemoveChip(key: keyof Filters) {
  setFilters((f) => ({ ...f, ...handleRemoveFilterChip(key, f) }));
}
```

### Adapted Lists for FilterSheet
```tsx
const ALL_INDIVIDU: FilterableIndividu[] = Object.values(LIVESTOCK_DB)
  .filter((lv) => getLivestockStatus(lv.id) !== 'Arsip')
  .map((lv) => ({
    blok:    lv.location.split(', ').find((p) => /blok/i.test(p)) ?? '',
    kandang: lv.location.split(', ').find((p) => /kandang/i.test(p)) ?? '',
    program: lv.program,
    batchId: lv.batch?.id,
  }));

const ALL_BATCH: FilterableBatch[] = Object.values(BATCH_DB).map((b) => ({
  members: getActiveBatchMemberships(b.id).map((m) => {
    const lv = LIVESTOCK_DB[m.livestockId];
    return {
      blok:    lv?.location.split(', ').find((p) => /blok/i.test(p)) ?? '',
      kandang: lv?.location.split(', ').find((p) => /kandang/i.test(p)) ?? '',
    };
  }),
}));
```

### JSX Pattern (Search & Filter section)
```tsx
<section>
  <SearchFilterBar
    query={query}
    onSearch={setQuery}
    onFilter={() => setFilterOpen(true)}
    activeFilterCount={countActiveFilters(filters)}
    mode={mode}
  />
  <FilterChips filters={filters} mode={mode} onRemove={handleRemoveChip} />
  {(countActiveFilters(filters) > 0 || !!query) && (
    <button type="button" onClick={() => { setFilters(DEFAULT_FILTERS); setQuery(''); }} ...>
      ↺ Reset semua
    </button>
  )}
</section>

<FilterSheet
  open={filterOpen}
  onClose={() => setFilterOpen(false)}
  mode={mode}
  filters={filters}
  onChangeFilters={setFilters}
  onReset={() => { setFilters(DEFAULT_FILTERS); setQuery(''); }}
  individuList={ALL_INDIVIDU}
  batchList={ALL_BATCH}
/>
```

---

## Reproduksi Special Case

The `displayedPrograms` filter in Reproduksi uses **participant-based semantics**: a program matches if any of its `pejantanIds` + `betinaIds` participants match the filter dimensions (jenis, ras, Fattening batch). Programs with no participants always show through.

## Mutasi Special Case

The `status` filter dimension (Masuk/Keluar/Pending/Selesai) was a dropdown-only feature with no shared-filter equivalent — **intentionally dropped** per task spec. `DaftarMutasiSection` and `RiwayatMutasiSection` now filter only by `query` (text search on mutation type, target ID/name).

---

## Build Verification

```
tsc -b && vite build
✓ 247 modules transformed.
✓ built in 8.06s
```

Zero TypeScript errors. Pre-existing chunk-size warning is unrelated to this task.
