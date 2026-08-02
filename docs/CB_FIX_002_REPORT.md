# CB-FIX-002 — Resolve Remaining Minor Issues

**Implementation Date:** 15 Juli 2026
**Scope:** Resolve the three minor findings (MIN-001, MIN-002, MIN-003) from `docs/CB_SYNC_003_FINAL_AUDIT.md`, following `docs/CB_FIX_001_REPORT.md` (MAJ-001 already resolved).
**Constitution Reference:** `00_PROJECT_CONSTITUTION.md` · `01_LIVESTOCK_CONSTITUTION.md` · `03_AI_CONSTITUTION.md`
**Type:** Minor bug fix + forward-compat interface extension + naming confirmation. Two files modified; one finding resolved by confirmation (no code change).

---

## 1. Files Modified

| File | Change | Finding |
|---|---|---|
| `src/data/livestockData.ts` | Back-fill `id` on legacy `WeightEntry` records in `USER_WEIGHT_DB` loader | MIN-001 |
| `src/data/aiInsightBobotData.ts` | Add `evidence?` and `reasoning?` as optional fields to `InsightItem` | MIN-002 |
| *(none)* | MIN-003 resolved by confirmation — no rename required | MIN-003 |

---

## 2. Minor Issues Resolved

### MIN-001 — localStorage Migration Gap: Legacy WeightEntry Records Lack `id`

**Root cause:** The `USER_WEIGHT_DB` IIFE loader used `safe[k] = v as WeightEntry[]` — a bare type assertion that accepted arrays without checking or back-filling the `id: string` field added by CB-SYNC-002. Any `WeightEntry` written to localStorage before CB-SYNC-002 has `id: undefined`, violating the TypeScript type contract.

**Fix (`src/data/livestockData.ts`):**

```typescript
// Before:
for (const [k, v] of Object.entries(parsed)) {
  if (Array.isArray(v)) safe[k] = v as WeightEntry[];
}

// After:
for (const [k, v] of Object.entries(parsed)) {
  if (Array.isArray(v)) {
    safe[k] = (v as WeightEntry[]).map((e) =>
      typeof e.id === 'string' ? e : { ...e, id: generateUUID() },
    );
  }
}
```

**Behaviour:**
- Entries that already carry a `string` `id` (all records written after CB-SYNC-002) are left byte-for-byte unchanged.
- Entries lacking an `id` (pre-CB-SYNC-002 legacy records) receive a freshly generated UUID via `generateUUID()` — the same function already imported at the top of the file and used by `addWeightRecord()`.
- No entry is discarded; all existing weight history remains readable.
- The repaired record is held in-memory only. The back-filled `id` becomes permanent the next time the user records a new weight (which calls `persistUserWeightDB()` and rewrites the full array including the repaired entries).

**Compatibility:** Fully backward-compatible. All code that currently reads `USER_WEIGHT_DB` / `getWeightHistory()` works unchanged. The `id` field is not yet consumed by any UI component — it was added as a foundation for a future edit/void flow (CB-N2).

---

### MIN-002 — `evidence` and `reasoning` Fields Absent from `InsightItem`

**Context (from audit §4 MIN-002):**
- `03_AI_CONSTITUTION.md` mandates three fields: `analyzedAt`, `dataSource`, `version`. It does NOT mandate `evidence` or `reasoning`.
- All peer modules (`BatchInsightReport`, `MutasiInsightReport`, `PakanInsightReport`, `ReproduksiInsightReport`) also omit these fields.
- The audit verdict was: "aspirational fields not yet part of any Constitution rule; not a CB-SYNC-002 defect."

**Resolution:** Add `evidence?` and `reasoning?` as **optional** fields to `InsightItem` in `aiInsightBobotData.ts`.

```typescript
// Before:
export interface InsightItem {
  id:       string;
  level:    InsightLevel;
  category: InsightCategory;
  icon:     string;
  title:    string;
  message:  string;
}

// After:
export interface InsightItem {
  id:         string;
  level:      InsightLevel;
  category:   InsightCategory;
  icon:       string;
  title:      string;
  message:    string;
  evidence?:  string;   // optional — not populated in rule-based mode
  reasoning?: string;   // optional — not populated in rule-based mode
}
```

**Rationale:**
- Making the fields optional (`?`) satisfies the forward-compatibility requirement of `03_AI_CONSTITUTION.md §Implementation`: "the architecture must remain compatible with [LLM integration] without redesign."
- The rule-based engine does not populate them — existing insight item construction is unchanged; TypeScript does not require optional fields to be present.
- No UI component reads `evidence` or `reasoning` today, so no consumer is affected.
- Consistent with the Constitution's intent: `InsightItem` is the natural attachment point for chain-of-thought fields when LLM mode is enabled in the future.

---

### MIN-003 — `confidenceStatus` vs `confidence` Field Name

**Context (from audit §4 MIN-003):**
> "The task checklist asks for `confidence`; the implementation uses `confidenceStatus: string`. The AI Constitution mandates the concept but not the exact field name. `BatchInsightReport` and `MutasiInsightReport` both use `confidenceStatus` identically. `BobotInsightReport` correctly mirrors the established convention. Verdict: Compliant with both Constitution and codebase naming convention. No action needed."

**Resolution: Resolved by confirmation — no code change.**

All five AI insight modules (`aiInsightBobotData.ts`, `aiInsightBatchData.ts`, `aiInsightMutasiData.ts`, `aiInsightReproduksiData.ts`, `aiInsightPakanData.ts`) use `confidenceStatus` consistently. The AI Constitution (`03_AI_CONSTITUTION.md`) specifies the concept ("Confidence Status") but not the TypeScript field identifier. `confidenceStatus` is the established codebase standard. Renaming to `confidence` would break all five modules and their UI consumers for no Constitution-mandated reason.

The task instruction "Only where required to match the shared AI model" confirms no rename is required: the shared AI model already uses `confidenceStatus`.

---

## 3. Compatibility Notes

| Concern | Status |
|---|---|
| Existing weight history in localStorage | ✅ Preserved — legacy entries back-filled, not discarded |
| `getWeightHistory()` / `USER_WEIGHT_DB` callers | ✅ Unchanged — same return type, same merge logic |
| `persistUserWeightDB()` timing | ✅ Back-filled IDs persist automatically on the next `addWeightRecord()` call |
| `InsightItem` consumers in `CatatBobot.tsx` / `RiwayatBobot.tsx` | ✅ Optional fields are invisible to existing property accesses |
| Peer AI modules (`Batch`, `Mutasi`, `Pakan`, `Reproduksi`) | ✅ Not touched — each defines its own `InsightItem` type; this change is scoped to `aiInsightBobotData.ts` |
| `confidenceStatus` field across all modules | ✅ Unchanged — no rename performed |
| `WEIGHT_TIMELINE_LOG` (CB-FIX-001) | ✅ Unaffected |

---

## 4. Validation Summary

| Check | Result | Evidence |
|---|---|---|
| Legacy `WeightEntry` loads correctly | ✅ PASS | `map()` with `typeof e.id === 'string'` guard — entries without `id` receive `generateUUID()` |
| Old localStorage data remains usable | ✅ PASS | No entries discarded; data shape identical after back-fill |
| `BobotInsightReport` / `InsightItem` has `evidence` | ✅ PASS | `evidence?: string` added (optional) |
| `BobotInsightReport` / `InsightItem` has `reasoning` | ✅ PASS | `reasoning?: string` added (optional) |
| AI model consistent across modules | ✅ PASS | `confidenceStatus` unchanged across all 5 modules; no divergence introduced |
| `confidence` field / MIN-003 | ✅ PASS | Resolved by confirmation — `confidenceStatus` is the established shared name |
| No duplicated interfaces | ✅ PASS | `InsightItem` extended in-place; no new interface created |
| TypeScript clean | ✅ PASS | `npx tsc -b --noEmit` — zero errors, zero output |
| Production build succeeds | ✅ PASS | `npm run build` — 244 modules, clean in 13.50 s |

---

## 5. Catat Bobot Module — Final Issue Tracker

| ID | Finding | Severity | Status |
|---|---|---|---|
| MAJ-001 | `WEIGHT_TIMELINE_LOG` not persisted; `RiwayatTerbaruSection` empty on refresh | Major | ✅ Fixed (CB-FIX-001) |
| MIN-001 | Legacy `WeightEntry` records in localStorage lack `id` field | Minor | ✅ Fixed (CB-FIX-002) |
| MIN-002 | `evidence` / `reasoning` absent from `InsightItem` | Minor | ✅ Resolved — optional fields added (CB-FIX-002) |
| MIN-003 | `confidenceStatus` vs `confidence` naming | Minor | ✅ Resolved by confirmation — `confidenceStatus` is correct (CB-FIX-002) |
| MIN-004 | `seq` counter is module-level mutable state | Minor | 📋 Accepted — safe in current single-threaded architecture; out of scope |

All actionable findings from `CB_SYNC_003_FINAL_AUDIT.md` are now resolved. MIN-004 (`seq` counter) was documented in the audit as "acceptable within current architecture" with no change recommended; it remains deferred.
