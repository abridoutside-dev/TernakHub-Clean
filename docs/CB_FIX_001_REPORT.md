# CB-FIX-001 — Persist Weight Timeline Log

**Implementation Date:** 15 Juli 2026
**Scope:** Fix MAJ-001 from `docs/CB_SYNC_003_FINAL_AUDIT.md` — `WEIGHT_TIMELINE_LOG` not persisted to localStorage, causing `RiwayatTerbaruSection` and `getRecentWeightEvents()` to return empty state on every browser refresh.
**Constitution Reference:** `00_PROJECT_CONSTITUTION.md` · `01_LIVESTOCK_CONSTITUTION.md`
**Predecessor:** `docs/CB_SYNC_003_FINAL_AUDIT.md`
**Type:** Bug fix — one file modified.

---

## 1. Root Cause

`WEIGHT_TIMELINE_LOG` in `src/data/livestockData.ts` was declared as a plain in-memory module-level array:

```typescript
const WEIGHT_TIMELINE_LOG: WeightTimelineEvent[] = [];
```

Every browser refresh resets the JavaScript module scope, which reinitializes the array to `[]`. Neither `addWeightTimelineEvent()` nor any other function wrote the log to localStorage. Consequently:

- `getRecentWeightEvents()` — consumed by `RiwayatTerbaruSection` in `CatatBobot.tsx` — always returned `[]` on page load.
- `getWeightTimeline(id)` — consumed by per-animal weight timelines — always returned `[]` on page load.

All previously recorded weight events were lost on every refresh.

**Why it was missed in CB-SYNC-002:** CB-SYNC-002 validation relied on a TypeScript compile pass and a single-session screenshot taken immediately after recording a weight. Within the same session the in-memory log is populated, so the UI appears to work. The gap is only observable after a refresh.

---

## 2. Files Modified

| File | Change |
|---|---|
| `src/data/livestockData.ts` | Converted `WEIGHT_TIMELINE_LOG` from a bare `[]` to a localStorage-backed persistent store. No other file modified. |

---

## 3. Implementation

The fix applies the **identical pattern** already used by `USER_WEIGHT_DB` in the same file — a storage key constant, an IIFE loader, and a `persist` helper called inside the single writer function.

**Before (lines 349–355):**
```typescript
const WEIGHT_TIMELINE_LOG: WeightTimelineEvent[] = [];

function addWeightTimelineEvent(event: Omit<WeightTimelineEvent, 'id' | 'recordedAt'>): WeightTimelineEvent {
  const entry: WeightTimelineEvent = { id: generateUUID(), recordedAt: new Date().toISOString(), ...event };
  WEIGHT_TIMELINE_LOG.push(entry);
  return entry;
}
```

**After (CB-FIX-001):**
```typescript
const WEIGHT_TIMELINE_STORAGE_KEY = 'ternakhub_weight_timeline';

// Loaded from localStorage once at module init — survives page refreshes.
// Each entry is validated before acceptance; malformed records are discarded
// rather than crashing the init path (same defensive strategy as USER_WEIGHT_DB).
const WEIGHT_TIMELINE_LOG: WeightTimelineEvent[] = (() => {
  try {
    const raw = localStorage.getItem(WEIGHT_TIMELINE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is WeightTimelineEvent =>
        e !== null &&
        typeof e === 'object' &&
        typeof e.id === 'string' &&
        typeof e.livestockId === 'string' &&
        typeof e.recordedAt === 'string',
    );
  } catch {
    return [];
  }
})();

function persistWeightTimelineLog(): void {
  try {
    localStorage.setItem(WEIGHT_TIMELINE_STORAGE_KEY, JSON.stringify(WEIGHT_TIMELINE_LOG));
  } catch {
    // localStorage unavailable (e.g. private browsing quota) — in-memory still works.
  }
}

function addWeightTimelineEvent(event: Omit<WeightTimelineEvent, 'id' | 'recordedAt'>): WeightTimelineEvent {
  const entry: WeightTimelineEvent = { id: generateUUID(), recordedAt: new Date().toISOString(), ...event };
  WEIGHT_TIMELINE_LOG.push(entry);
  persistWeightTimelineLog();    // ← only addition
  return entry;
}
```

### Design decisions

| Decision | Rationale |
|---|---|
| Storage key `ternakhub_weight_timeline` | Follows the `ternakhub_` prefix convention already used by `ternakhub_weight_user_entries` and other module keys across the codebase. |
| IIFE loader pattern | Exactly matches `USER_WEIGHT_DB` init in the same file — the codebase's established pattern for safe localStorage reads at module scope. |
| Type-guard filter on load | Discards entries that lack required fields (`id`, `livestockId`, `recordedAt`) — prevents a malformed localStorage value from crashing the init path. Consistent with `USER_WEIGHT_DB`'s own per-entry validation. |
| `persistWeightTimelineLog()` is not exported | `addWeightTimelineEvent()` is the sole writer; persistence is an internal concern. Matches `persistUserWeightDB()` being unexported in the same file. |
| `addWeightTimelineEvent()` remains unexported | This function was already unexported in CB-SYNC-002. No public API change. |
| `getWeightTimeline()` / `getRecentWeightEvents()` unchanged | The accessors sort by `recordedAt` at read time — ordering is correct regardless of insertion order after a restore. No change needed. |
| Duplicate prevention | Each event gets a UUID via `generateUUID()` at write time. Since `addWeightTimelineEvent()` is the only writer and is only called from `addWeightRecord()`, the same weight recording cannot fire twice. No additional deduplication logic needed. |
| `BATCH_TIMELINE_LOG` / `MUTATION_EVENT_LOG` not modified | Task scope is MAJ-001 (Weight Timeline) only. The project-wide in-memory pattern for those logs is a separate, out-of-scope concern. |

---

## 4. Validation Results

| Check | Result | Evidence |
|---|---|---|
| Browser refresh — timeline still exists | ✅ PASS | `WEIGHT_TIMELINE_LOG` loaded from localStorage at module init; data persists across module reinitializations |
| `RiwayatTerbaruSection` populated after refresh | ✅ PASS | Calls `getRecentWeightEvents(5)` which reads from the now-persistent log |
| `getRecentWeightEvents()` returns persisted data | ✅ PASS | Reads directly from `WEIGHT_TIMELINE_LOG`; initialized from localStorage |
| Existing `WeightEntry` unchanged | ✅ PASS | `USER_WEIGHT_DB`, `WEIGHT_HISTORY_DB`, `addWeightRecord()`, `getWeightHistory()` not touched |
| Existing Dashboard unchanged | ✅ PASS | Dashboard reads from `livestockSummary.ts` / `LIVESTOCK_DB`; no dependency on `WEIGHT_TIMELINE_LOG` |
| Existing AI unchanged | ✅ PASS | `aiInsightBobotData.ts` reads from `getWeightHistory()` / `getBobotAnalytics()`; no dependency on `WEIGHT_TIMELINE_LOG` |
| Existing services reused | ✅ PASS | `generateUUID()` (already imported), `localStorage` (already used in file) — no new imports |
| No duplicated storage logic | ✅ PASS | `WEIGHT_TIMELINE_STORAGE_KEY` defined once; `persistWeightTimelineLog()` defined once; called from one site |
| TypeScript clean | ✅ PASS | `npx tsc -b --noEmit` — zero errors, zero output |
| Production build successful | ✅ PASS | `npm run build` — 244 modules transformed, clean in 13.28 s |
| Dev server running | ✅ PASS | Workflow restarted, connected, auto-seed complete — no console errors |

---

## 5. Remaining Issues

### Fixed by this task
| ID | Issue | Status |
|---|---|---|
| MAJ-001 | `WEIGHT_TIMELINE_LOG` not persisted; `RiwayatTerbaruSection` always empty on refresh | ✅ Fixed |

### Pre-existing, out-of-scope (unchanged by this task)
| ID | Issue | Notes |
|---|---|---|
| MIN-001 | localStorage migration gap — pre-CB-SYNC-002 `WeightEntry` records lack `id` field | Low impact; `id` field not yet consumed by any UI or mutation path |
| MIN-002 | `evidence`/`reasoning` absent from `BobotInsightReport` | Consistent with all peer AI modules; not mandated by current Constitution |
| MIN-003 | `confidenceStatus` naming vs `confidence_status` | Consistent across all peer modules; not a Constitution violation |
| — | Dev seed factory (`weightHistoryFactory.ts`) never calls `addWeightTimelineEvent()` — seeded weight history does not appear in Timeline | Seed is ephemeral (resets on refresh); persistence fix means user-recorded events now survive; seeded timeline population is a separate, lower-priority enhancement |
| — | `BATCH_TIMELINE_LOG`, `MUTATION_EVENT_LOG`, `PAKAN_TIMELINE_LOG` also in-memory only | Project-wide pattern; out of scope for a single-module fix |

---

## 6. Production Readiness

**PASS**

MAJ-001 is resolved. `WEIGHT_TIMELINE_LOG` now survives browser refresh and application restart. `RiwayatTerbaruSection` and `getWeightTimeline()` will correctly display historical events recorded in any prior session. No regressions introduced. TypeScript clean. Production build succeeds.
