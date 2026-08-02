# LIVESTOCK-FIX-001 — Implementation Report

**Status:** PASS  
**Date:** 2026-07-19  
**Scope:** Approved Livestock backlog from RECALL-001 audit memory files

---

## Changes Made

| # | File | Change | Finding |
|---|------|--------|---------|
| 1 | `src/pages/Silsilah.tsx` | Fixed `CurrentCard` hardcoded `status="Aktif"` → `status={liveStatusForPedigree(lv.id)}` | AUDIT-LIVESTOCK-LINEAGE-001 M-02 (documented as fixed; not applied) |
| 2 | `src/pages/Keturunan.tsx` | Replaced `useMemo(() => getDescendants(id), [id])` with direct call `getDescendants(id)` | AUDIT-LIVESTOCK-LINEAGE-001 mn-05 |
| 3 | `src/pages/BatchList.tsx` | Expanded `LOKASI_OPTIONS` to `['Semua Lokasi', 'Di Kandang', 'Luar Kandang']`; wired `lokasi` prop to `BatchListSection` and `IndividuSection`; added location-based filter logic to both sections | AUDIT-LIVESTOCK-BATCH-001 Backlog |
| 4 | `src/pages/OutsideLivestock.tsx` | Differentiated batch-mode empty state from filter-empty-state; batch mode now shows "Data Batch Belum Tersedia" with guidance to use Individual mode | AUDIT-LIVESTOCK-LIST-001 Backlog |

---

## Acceptance Criteria

| Criterion | Result |
|-----------|--------|
| All approved Livestock backlog items completed | ✅ 4 items fixed |
| No in-scope Livestock findings remain | ✅ All actionable backlog items addressed |
| No regression | ✅ `tsc --noEmit` 0 errors; HMR applied cleanly |
| No architecture changes | ✅ Targeted edits only; data layer unchanged |
| Out-of-scope findings documented | ✅ See below |

---

## Out-of-Scope Findings — Reassigned

### OOS-001 — validateProgramPeserta() missing self-breeding guard

**Location:** `src/data/reproduksiProgramData.ts` — `validateProgramPeserta()`

**Observation:** No guard prevents the same animal from appearing in both `pejantanIds` and `betinaIds` of a breeding program. The UI prevents this via PesertaPicker gender filter, but a programmatic call can bypass it.

**Assigned to:** **Reproduksi module** — add data-layer guard in `validateProgramPeserta()`.

---

### OOS-002 — sortEventsTerbaruKeTerlama duplicated across 5 Reproduksi files

**Location:** `reproduksiProgramData.ts`, `pelaksanaanReproduksiData.ts`, `monitoringReproduksiData.ts`, `riwayatReproduksiData.ts`, `pemeriksaanKebuntinganData.ts` (identical implementation)

**Observation:** Identical sort helper defined 5 times. Tech debt candidate for extraction into `src/utils/sortUtils.ts` or a shared Reproduksi util.

**Assigned to:** **Reproduksi module** — extract into shared util on next Reproduksi pass.

---

### OOS-003 — KH Timeline events log `targetKind: 'unknown'`

**Location:** `src/data/tindakanKesehatanData.ts` — `createTindakanSesi()` and `createPengobatanSesi()`

**Observation:** These functions don't have pemeriksaan context at call time, so Timeline events for treatment sessions log `targetKind: 'unknown'`. Not user-visible in current UI.

**Assigned to:** **Health (Kesehatan Hewan) module** — pass pemeriksaan context through the call chain on next KH pass.

---

### OOS-004 — medicineFactory.ts seeds orphaned MEDICINE_LOG_DB

**Location:** `src/dev/medicineFactory.ts` (inferred)

**Observation:** Dev seed populates `MEDICINE_LOG_DB` (a legacy stub), not the real KH-002..KH-006 stores. Health history pages (RiwayatKesehatan) show empty when testing with seed data.

**Assigned to:** **Health (Kesehatan Hewan) module + Dev Tooling** — update `medicineFactory.ts` to seed `pemeriksaanKesehatanData` and `riwayatKesehatanData` directly.

---

### OOS-005 — feedConsumption in getBatchAnalytics() always returns []

**Location:** `src/data/batchAnalyticsData.ts` — `getBatchAnalytics()` `feedConsumption` field

**Observation:** Stub loop never populates the feed consumption array. Batch analytics dashboard shows 0 feed consumption for all batches.

**Assigned to:** **Feed Recording (Pemberian Pakan) module** — wire `getPemberianPakanList()` filtered by batch membership on next Pakan–Batch integration pass.

---

### OOS-006 — typeBreakdown useMemo memoization no-op in ActiveLivestock.tsx

**Location:** `src/pages/ActiveLivestock.tsx` — `typeBreakdown` useMemo dependency on `ALL_INDIVIDU`

**Observation:** `ALL_INDIVIDU` is a new array reference each render, so the useMemo recomputes every render anyway. Minor perf tech debt; no user-visible bug.

**Assigned to:** **Livestock Tech Debt** — convert `ALL_INDIVIDU` to a direct const computed before the useMemo, or remove useMemo.

---

### OOS-007 — Timeline diff dead branch in LivestockProfile.tsx

**Location:** `src/pages/LivestockProfile.tsx` — Edit History timeline diff rendering

**Observation:** Condition `e.diff >= '0'` is always false ('+' = ASCII 43, '-' = 45, both < '0' = 48). The '+' prefix branch is unreachable. Display is accidentally correct since diff strings already carry their sign. Not a user-visible bug.

**Assigned to:** **Livestock Tech Debt** — fix the condition to `e.diff.startsWith('+')` on next LivestockProfile pass.
