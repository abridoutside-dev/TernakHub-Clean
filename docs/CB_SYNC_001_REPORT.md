# CB-SYNC-001 — Catat Bobot Synchronization Audit

**Audit Date:** 15 Juli 2026
**Scope:** Catat Bobot module — Dashboard Card, List (`CatatBobot.tsx`), Detail, History (`RiwayatBobot.tsx`), AI Insight, Summary, Mode, Navigation, Components, Hooks, Services, Data Source, Documentation.
**Constitution Reference:** `00_PROJECT_CONSTITUTION.md` · `01_LIVESTOCK_CONSTITUTION.md` · `03_AI_CONSTITUTION.md` · `04_UI_UX_CONSTITUTION.md`
**Related Document:** `docs/SYNC-001_LIVESTOCK_SYNC_AUDIT.md` (§3.2 Catat Bobot)
**Type:** Audit only — no implementation changes were made as part of this report.

---

## 1. Executive Summary

Catat Bobot is functionally the most feature-complete weight-recording flow in the app (live individual/batch weighing, ADG soft-validation, live search & filter, per-animal history with chart), but it is the **least architecturally synchronized** module against the ratified Constitution set. This audit re-examined the module at the code level and confirms every gap already logged in `SYNC-001_LIVESTOCK_SYNC_AUDIT.md` §3.2, and identifies **four additional gaps** SYNC-001 did not surface:

1. **`CatatBobot.tsx` has no Header section at all** — not even a locally-equivalent one. The page's `return` starts directly at AI Insight. SYNC-001 described the header as "structurally equivalent" to `ModuleHeader`; no such structure exists in the current code.
2. **The AI Insight placeholder is duplicated, not reused, across two files.** `CatatBobot.tsx` and `RiwayatBobot.tsx` each define their own independent copy of `AiInsightCard` / `ProBadgeToggle` / `SectionLabel` / `Card`. This is a direct violation of the "reuse components, never duplicate" rule, independent of the AI-engine gap itself.
3. **`ModuleHeader` is not actually a shared component anywhere in the codebase.** Every module that "has" one (`BatchList.tsx`, `KesehatanHewan.tsx`, `Mutasi.tsx`, `PemberianPakan.tsx`, `Reproduksi.tsx`) defines its own local, non-exported `ModuleHeader` function. There is no shared `ModuleHeader` in `src/components/`. This means Catat Bobot is not "missing a shared header" — no module actually reuses one; each hand-rolls it. This is a cross-module Constitution gap that Catat Bobot happens to have skipped entirely (it has none, local or shared).
4. **Master data duplication:** `RAS_OPTIONS` in `CatatBobot.tsx` is a verbatim, independently-maintained copy of `RAS_OPTIONS` in `AddLivestock.tsx` (confirmed identical by inline comment "same values as AddLivestock.tsx"). `SPECIES_NAMES` is correctly imported from the shared `speciesData.ts`, but Ras taxonomy is not centralized the same way.

No runtime defects were found. No mutation logic was touched by this audit. Weight recording itself (`addWeightRecord`, `getWeightHistory`, ADG threshold validation) is real, live, and dual-persisted (in-memory + localStorage) — this part of the module is sound.

**Overall verdict:** Catat Bobot remains the module furthest from Constitution compliance in the Livestock domain, matching SYNC-001's ranking, but with a wider gap than previously documented — the module has **zero** of the six layout sections mandated above "Search & Filter" fully realized (Header: missing: AI Insight: non-functional; Summary: missing).

---

## 2. Critical Issues

| ID | Area | Issue |
|---|---|---|
| CB-C1 | Header | `CatatBobot.tsx` has **no Header section** — local or shared. The standard layout (`Header → AI Insight → Summary → Mode → Search & Filter → Main Content → History`) mandated by `01_LIVESTOCK_CONSTITUTION.md` and `04_UI_UX_CONSTITUTION.md` is missing its first section entirely. The page relies solely on the generic `TopAppBar` title ("Catat Bobot") set in `App.tsx` route meta, which carries no aggregate stats — unlike every other Livestock module's header. |
| CB-C2 | AI Insight | `AiInsightCard` in both `CatatBobot.tsx` (L328) and `RiwayatBobot.tsx` (L52) is a static, blurred, Pro/Free-gated placeholder with **hardcoded copy text** and no backing data engine. Zero of the three mandatory `03_AI_CONSTITUTION.md` fields (`analyzedAt`, `dataSource`, `version`) exist. This is a full non-compliance, not partial. |

---

## 3. Major Issues

| ID | Area | Issue |
|---|---|---|
| CB-M1 | Component Reuse | `AiInsightCard`, `ProBadgeToggle`, `SectionLabel`, and `Card` are each independently re-defined in both `CatatBobot.tsx` and `RiwayatBobot.tsx` — two parallel, drift-prone copies of the same visual primitives inside one module. Violates "reuse components... never duplicate implementation" (`00_PROJECT_CONSTITUTION.md`, `04_UI_UX_CONSTITUTION.md`). |
| CB-M2 | Summary | No dedicated `Summary` section exists at the standard layout position (between AI Insight and Mode). Aggregate counts (total animals weighed today, average weight, heaviest/lightest) only appear transiently inside the multi-animal confirmation dialog (L1479+), not as a persistent summary card on the page. Confirms SYNC-001 finding, unchanged. |
| CB-M3 | Timeline | No Timeline log exists for weight-recording events anywhere in `livestockData.ts` or `CatatBobot.tsx`. `addWeightRecord` writes only to `WEIGHT_HISTORY_DB` / `USER_WEIGHT_DB`; there is no equivalent of `BATCH_TIMELINE_LOG` / `MUTATION_EVENT_LOG`. Confirms SYNC-001 finding, unchanged. |
| CB-M4 | Data Source / Ownership | Unlike Reproduksi, Mutasi, and Batch — each of which owns a dedicated `*Data.ts` registry — Catat Bobot has **no dedicated data file**. Weight history lives inside `livestockData.ts` alongside the core `LIVESTOCK_DB`. This is consistent with the "Weight is a livestock attribute" reading of `01_LIVESTOCK_CONSTITUTION.md`, but it also means Catat Bobot has no independent module boundary the way other Livestock-domain modules do — any future Timeline/Summary work must be layered into `livestockData.ts` rather than a purpose-built module file. |
| CB-M5 | Module-level History | The standard layout's `History` section (present on `PemberianPakan.tsx` via `RiwayatTerakhirSection` and `KesehatanHewan.tsx` via `RiwayatSection`, each embedded directly on the module hub *in addition to* a dedicated route) has no equivalent on `CatatBobot.tsx`. History is reachable only per-animal, via navigation to `/livestock/:id/bobot` (`RiwayatBobot.tsx`) — there is no "recent weight events across the herd" section on the Catat Bobot hub itself. |

---

## 4. Minor Issues

| ID | Area | Issue |
|---|---|---|
| CB-N1 | AI Card Pattern | The Pro/Free gating UI (`isPro` / `onTogglePro`) on both `AiInsightCard` (CatatBobot) and `WeightChartCard`/`AiInsightCard` (RiwayatBobot) diverges from the reference AI card pattern used by Mutasi/Batch/Reproduksi (no Pro/Free gate). Matches SYNC-001 S-13, present in two places instead of one. |
| CB-N2 | UUID / Record Identity | `WeightEntry` (in `livestockData.ts`) has no `id` field. Records are addressed only by `date`, which the merge logic in `getWeightHistory` uses as the de-duplication key. Other modules with recordable history (Mutasi, Batch, Reproduksi, Kesehatan) key individual events with a UUID. Two weigh-ins recorded on the same date are indistinguishable and cannot be independently referenced later (e.g. for a future edit/void flow). |
| CB-N3 | Master Data Duplication | `RAS_OPTIONS` (species → breed list) is defined independently and identically in `CatatBobot.tsx` (L11–15) and `AddLivestock.tsx` (L19), rather than being centralized the way `SPECIES_NAMES` already is in `speciesData.ts`. Any future breed-list change requires editing both files in lockstep. |
| CB-N4 | Component Reuse (cross-module) | `ModuleHeader` is not a shared component anywhere in the codebase — `BatchList.tsx`, `KesehatanHewan.tsx`, `Mutasi.tsx`, `PemberianPakan.tsx`, and `Reproduksi.tsx` each define their own local, unexported `ModuleHeader`. `SegmentedControl`/`SectionLabel`/`Card` follow the same per-file pattern. This is a pre-existing cross-module gap, not unique to Catat Bobot, but it means Catat Bobot cannot "reuse the existing Header pattern" per `04_UI_UX_CONSTITUTION.md` even if it wanted to — there is nothing centralized to import. |
| CB-N5 | Dashboard Integration | `Dashboard.tsx` has no card, quick action, or link referencing Catat Bobot at all (`QUICK_ACTIONS` includes Tambah Ternak / Tambah Stok Pakan / Tambah Stok Obat / Marketplace, but not Catat Bobot). Not a violation of any explicit rule, but an inconsistency worth flagging since weight recording is a high-frequency operator action. |
| CB-N6 | Analytics | No dedicated weight Analytics view (growth trend across the herd, ADG distribution, cohort comparison) exists, matching SYNC-001's original note. |

---

## 5. Missing Synchronization

Relative to the standard Livestock module layout (`Header → AI Insight → Summary → Mode → Search & Filter → Main Content → History`):

| Section | Present on `CatatBobot.tsx`? | Present on `RiwayatBobot.tsx`? |
|---|---|---|
| Header | ❌ Missing entirely | N/A (per-animal detail page, not a hub) |
| AI Insight | ⚠️ Static placeholder only | ⚠️ Static placeholder only (duplicated implementation) |
| Summary | ❌ Missing (only inside confirm dialogs) | ✅ `WeightSummaryCard` |
| Mode | ✅ `SegmentedControl` (individu/batch) | N/A |
| Search & Filter | ✅ Search + `FilterSheet`, batch/individu parity confirmed | N/A |
| Main Content | ✅ Live livestock/batch cards | ✅ Chart + summary |
| History | ❌ Missing at hub level | ✅ `WeightHistoryTimeline`, newest-first, read-only (no Edit/Delete controls found) |
| Timeline (event log) | ❌ Missing | ❌ Missing |
| Dedicated data registry | ❌ Missing (`livestockData.ts` embeds weight) | — |

`RiwayatBobot.tsx`'s `WeightHistoryTimeline` correctly renders newest-first (matches `getWeightHistory`'s merge order) and has no Edit/Delete affordance — History immutability is respected there.

---

## 6. Constitution Compliance

| Constitution | Rule | Status |
|---|---|---|
| `00_PROJECT_CONSTITUTION.md` | Honest data — every number derived live | ✅ Live data (weight, history, ADG); no hardcoded stats found in Main Content |
| `00_PROJECT_CONSTITUTION.md` | No unnecessary duplication | ❌ `AiInsightCard`/`ProBadgeToggle`/`SectionLabel`/`Card` duplicated across 2 files; `RAS_OPTIONS` duplicated with `AddLivestock.tsx` |
| `00_PROJECT_CONSTITUTION.md` | Reuse components/services/hooks/validators/utilities | ⚠️ Partial — reuses `livestockData.ts`, `transferData.ts`, `batchData.ts`, `weightDistribution.ts`, `livestockUtils.ts` correctly; does not reuse any header/card primitive because none is centrally shared |
| `01_LIVESTOCK_CONSTITUTION.md` | Standard Layout (Header→AI→Summary→Mode→Search&Filter→Main→History) | ❌ Header and Summary missing; module-level History missing |
| `01_LIVESTOCK_CONSTITUTION.md` | Mode (Individual/Batch) | ✅ Compliant |
| `01_LIVESTOCK_CONSTITUTION.md` | Search & Filter (Search/Location/Batch/Status) | ✅ Compliant, batch/individu parity documented in memory |
| `01_LIVESTOCK_CONSTITUTION.md` | Timeline (newest→oldest, read only) | ⚠️ `RiwayatBobot.tsx` per-animal view complies; no module-level Timeline exists |
| `01_LIVESTOCK_CONSTITUTION.md` | History immutable (no Edit/Delete) | ✅ Compliant — no Edit/Delete UI found in `RiwayatBobot.tsx` |
| `01_LIVESTOCK_CONSTITUTION.md` | Dashboard read-only | N/A — no Catat Bobot dashboard exists |
| `01_LIVESTOCK_CONSTITUTION.md` | AI Insight reuses existing component, rule-based, never changes data | ❌ Not rule-based; static placeholder; not reused (duplicated) |
| `01_LIVESTOCK_CONSTITUTION.md` | UUID — reuse existing strategy | ⚠️ Livestock IDs used correctly for lookups, but individual `WeightEntry` records carry no identifier at all (not even the semantic-ID convention used elsewhere) |
| `04_UI_UX_CONSTITUTION.md` | Header — reuse existing pattern | ❌ No header present to reuse or extend |
| `04_UI_UX_CONSTITUTION.md` | AI Insight — max 3 cards, positioned below Header | ⚠️ Positioned first on the page (no Header above it); only 1 card, so within the "max 3" limit |
| `04_UI_UX_CONSTITUTION.md` | Summary reuses existing Summary Card | ❌ No Summary Card present |
| `04_UI_UX_CONSTITUTION.md` | Empty State (Illustration/Description/Primary Action) | ✅ Empty states present per code review of list/history views |
| `04_UI_UX_CONSTITUTION.md` | Media — images only, no video | ✅ No video usage found |

---

## 7. AI Compliance

Per `03_AI_CONSTITUTION.md`, an AI Insight feature must be read-only, rule-based, and carry `analyzedAt` / `dataSource` / `version` on every output.

| Requirement | Catat Bobot Status |
|---|---|
| Read only (no inserts/updates/deletes/transactions) | ✅ Trivially true — there is no engine to violate this, since no data is analyzed |
| Rule-based implementation | ❌ No engine exists; `AiInsightCard` renders one hardcoded sentence |
| Priority levels (Info/Warning/Critical) | ❌ Not applicable — no output to classify |
| `analyzedAt` | ❌ Absent |
| `dataSource` | ❌ Absent |
| `version` | ❌ Absent |
| Reuse existing AI components/cards/layouts | ❌ Not reused — `AiInsightCard` is redefined independently in `CatatBobot.tsx` and again in `RiwayatBobot.tsx`, rather than reusing a shared card or the pattern established by `aiInsightReproduksiData.ts` / `aiInsightBatchData.ts` / `aiInsightMutasiData.ts` |

**Verdict:** Catat Bobot is **non-compliant** with the AI Constitution — the lowest compliance of any Livestock module. It sits below even Pemberian Pakan/Kesehatan Hewan (which have real engines missing only 2 of 5 fields); Catat Bobot has 0 of 5.

---

## 8. Recommended Fix Order

This is an audit — the order below is a recommendation for a future implementation roadmap, not work performed in this task.

```
1. CB-C1  Add Header section to CatatBobot.tsx (no deps, addresses the largest structural gap)
2. CB-C2  Build aiInsightBobotData.ts — rule-based engine (growth trend, ADG, underweight
           alerts, herd weight distribution) with analyzedAt/dataSource/version
           (mirrors aiInsightReproduksiData.ts pattern; no deps)
3. CB-M2  Add a dedicated Summary section (total weighed today, avg weight, heaviest/lightest)
           at the standard layout position (depends on CB-C1 for placement consistency)
4. CB-M1  Consolidate AiInsightCard/ProBadgeToggle/SectionLabel/Card into one implementation
           reused by both CatatBobot.tsx and RiwayatBobot.tsx (depends on CB-C2 for the
           real AI card content it will render)
5. CB-N1  Remove the Pro/Free gate once CB-C2 lands; align with Mutasi/Batch/Reproduksi's
           AI card pattern (depends on CB-C2)
6. CB-M3  Add Timeline logging for weight-record events in livestockData.ts (no deps)
7. CB-M5  Add a module-level "recent weight events" History section to CatatBobot.tsx,
           matching PemberianPakan's RiwayatTerakhirSection pattern (depends on CB-M3
           for a clean event source)
8. CB-N2  Add a stable id (UUID) to WeightEntry so records can be independently referenced
           (low priority; needed before any future edit/void feature)
9. CB-N3  Centralize RAS_OPTIONS into speciesData.ts and import from both CatatBobot.tsx
           and AddLivestock.tsx (no deps, low effort)
10. CB-N6 Add a weight Analytics view (growth trend, ADG per species/batch) (depends on
           CB-C2 for shared computation logic)
11. CB-N5 Add a Catat Bobot quick action / card to Dashboard.tsx (no deps, low priority)
```

Cross-module note (out of Catat Bobot's own fix scope, flagged for awareness): CB-N4 — the fact that `ModuleHeader` has no shared implementation anywhere in the codebase is a project-wide gap, not something a Catat Bobot-only roadmap item can or should fix in isolation.

---

*Audit only — no implementation changes were made as part of this report.*
