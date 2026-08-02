# SYNC-001 — Livestock Module Synchronization Audit

**Audit Date:** 15 Juli 2026  
**Scope:** Dashboard, Catat Bobot, Scan/Livestock Identity, Pemberian Pakan, Kesehatan Hewan, Reproduksi, Batch, Mutasi  
**Constitution Reference:** 00_PROJECT_CONSTITUTION.md · 01_LIVESTOCK_CONSTITUTION.md · 03_AI_CONSTITUTION.md · 04_UI_UX_CONSTITUTION.md  
**Commit Tag:** SYNC-001 Livestock Module Synchronization Audit  

---

## 1. Executive Summary

Eight modules were audited against the ratified TernakHub architecture. The modules built most recently — **Batch**, **Mutasi**, and **Reproduksi** — are fully compliant and serve as the reference implementation. Earlier modules show architectural drift in four areas:

1. **Honest data** — Dashboard hardcodes 3 of 4 summary card values to `'—'`.
2. **AI Insight completeness** — Catat Bobot has no real AI insight engine; Pemberian Pakan and Kesehatan Hewan are missing `dataSource` and `version` (partial AI Constitution compliance).
3. **Standard layout** — the Livestock hub page is missing AI Insight, Mode selector, and Search & Filter.
4. **Timeline integration** — Catat Bobot, Pemberian Pakan, and Kesehatan Hewan do not log operational events to any module-level Timeline.

No module has a Dashboard that creates transactions. History sections are immutable across all modules. UUID usage is consistent with the conventions documented per-module. No runtime defects were found during this audit.

**Overall verdict:** 3 modules fully compliant (Batch, Mutasi, Reproduksi). 3 modules partially compliant with minor gaps (Pemberian Pakan, Kesehatan Hewan, Livestock). 2 modules have significant gaps requiring synchronization (Dashboard, Catat Bobot).

---

## 2. Architecture Checklist Reference

The standard layout mandated by `01_LIVESTOCK_CONSTITUTION.md` and `04_UI_UX_CONSTITUTION.md`:

```
Header → AI Insight → Summary → Mode → Search & Filter → Main Content → History
```

AI Insight engines must comply with `03_AI_CONSTITUTION.md`:
- Read only; no mutations
- Rule-based engine
- Output includes: `analyzedAt` · `dataSource` · `version`

---

## 3. Module-by-Module Audit

---

### 3.1 Dashboard

| | |
|---|---|
| **File** | `src/pages/Dashboard.tsx` |
| **Route** | `/` |
| **Line Count** | 410 |

#### Architecture Status

| Checklist Item | Status | Notes |
|---|---|---|
| Header | ⚠️ Partial | Custom greeting section, not `ModuleHeader`; adequate for root dashboard |
| AI Insight | ⚠️ Partial | "Tanya AI" button dispatches custom event; AI chips are **hardcoded strings** (L28–33) — not a rule-based engine |
| Summary | ❌ Non-compliant | 4 summary cards defined; **only 1 has live data** (`Total Ternak`); the other 3 (`Terjual Bulan Ini`, `Stok Pakan`, `Stok Obat`) are hardcoded to `'—'` (L99) |
| Mode | N/A | Root dashboard; no mode toggle expected |
| Search & Filter | N/A | Root dashboard; not applicable |
| Main Content | ✅ | Live batch rows, live livestock list, live feed/health/mutation data |
| History | N/A | Not applicable for root dashboard |
| Analytics | N/A | Not applicable |
| Dashboard | ✅ | Read-only; no mutations |
| Timeline | N/A | Not applicable |
| UUID | ✅ | Livestock IDs displayed correctly |
| Batch integration | ✅ | BT-003 batch rows integrated (L103–127) |

#### Completed
- Read-only ✅
- Batch integration ✅
- Live livestock counts ✅
- Empty states (SectionEmptyState) ✅
- Individual + batch livestock section ✅

#### Critical Issues
- **3 of 4 summary card values hardcoded to `'—'`** (L99). `Terjual Bulan Ini`, `Stok Pakan`, and `Stok Obat` never show real data. This directly violates the "honest data" principle of `00_PROJECT_CONSTITUTION.md`. The underlying data already exists in the respective module registries.

#### Minor Issues
- AI chips (`QUICK_CHIPS`, L28–33) are hardcoded labels — not derived from any rule-based analysis engine; no `analyzedAt`/`dataSource`/`version` present.
- `ModuleHeader` is not used; however the custom greeting is adequate for the root page and is not a blocking issue.

#### Needs Synchronization
- Wire `Terjual Bulan Ini` to live archiveList (reason=Terjual this month).
- Wire `Stok Pakan` to live inventory count from `StokPakan` registry.
- Wire `Stok Obat` to live inventory count from `StokObat` registry.
- Optionally replace static AI chips with a minimal rule-based engine or clearly label them as navigation shortcuts.

---

### 3.2 Catat Bobot

| | |
|---|---|
| **File** | `src/pages/CatatBobot.tsx` |
| **Route** | `/catat-bobot` |
| **Line Count** | 2,321 |

#### Architecture Status

| Checklist Item | Status | Notes |
|---|---|---|
| Header | ✅ | Functional header (not `ModuleHeader` by name but structurally equivalent) |
| AI Insight | ❌ Missing | `AiInsightCard` (L328) is a **static Pro/Free gated placeholder** — no `aiInsightBobotData.ts` exists; no rule-based engine; no `analyzedAt`/`dataSource`/`version` |
| Summary | ⚠️ Partial | Summary counts embedded in confirmation dialogs (L1479, L1899, L1905); no dedicated `Summary` section in the standard layout position |
| Mode | ✅ | `SegmentedControl` for `individu`/`batch` (L401) |
| Search & Filter | ✅ | Search bar + `FilterSheet` (L719, L2157) |
| Main Content | ✅ | Livestock cards with weight status |
| History | ✅ | `getWeightHistory` used for per-animal history display (L57, L1374) |
| Analytics | ❌ Missing | No dedicated analytics view for weight trends |
| Dashboard | N/A | No dashboard tab; full page acts as operational screen |
| Timeline | ❌ Missing | `addWeightRecord` does not log to any module-level Timeline |
| UUID | ✅ | Livestock identifiers used correctly |
| Batch integration | ✅ | `getActiveBatchMembersWithLivestock` (L57) integrated |

#### Completed
- Mode selector (Individual/Batch) ✅
- Search & Filter ✅
- Weight recording workflow ✅
- Batch integration ✅
- Empty states ✅
- History display ✅

#### Major Issues
- **No AI Insight data engine.** The `AiInsightCard` shows only a static blurred placeholder with "Upgrade ke Pro" messaging. There is no `aiInsightBobotData.ts` or equivalent. The AI section violates `03_AI_CONSTITUTION.md` completely — no analysis, no `analyzedAt`, no `dataSource`, no `version`. This is the biggest gap in the Catat Bobot module.
- **No Timeline logging.** Weight recording events are not appended to any Timeline. Other modules (Batch, Mutasi, Reproduksi) all maintain Timeline logs. Weight events are significant operational events that should appear in a module-level or per-livestock Timeline.

#### Minor Issues
- No dedicated `Summary` section at the standard layout position (above Mode).
- No weight Analytics view (growth trend charts, average daily gain, cohort comparison).
- The `AiInsightCard`'s Pro/Free UI toggle (`isPro`/`onTogglePro`, L328) introduces a non-standard UI pattern not used by any other module's AI insight section.

#### Needs Synchronization
- Implement `aiInsightBobotData.ts` — rule-based engine analyzing growth trends, ADG (average daily gain), underweight alerts, and herd weight distribution. Must include `analyzedAt`, `dataSource`, `version`.
- Add Timeline logging for weight record events.
- Add a dedicated `Summary` section (total animals weighed today, average weight, heaviest/lightest).
- Add Analytics view (growth trend, ADG per species/batch).
- Remove the Pro/Free gating UI and replace with standard AI Insight card pattern (matching Mutasi/Batch/Reproduksi).

---

### 3.3 Scan / Livestock Identity

| | |
|---|---|
| **Files** | `src/pages/Livestock.tsx` · `src/pages/LivestockProfile.tsx` |
| **Routes** | `/livestock` · `/livestock/:id` · `/livestock/active` · `/livestock/outside` · `/livestock/archive` |
| **Line Counts** | Livestock.tsx: 412 · LivestockProfile.tsx: 525 |

#### Architecture Status

| Checklist Item | Status | Notes |
|---|---|---|
| Header | ❌ Missing | No `ModuleHeader` in `Livestock.tsx` hub |
| AI Insight | ❌ Missing | No AI Insight in `Livestock.tsx` hub |
| Summary | ✅ | `countByStatus` derived live; archive count shown |
| Mode | ❌ Missing | No Mode selector (Individual/Batch) in `Livestock.tsx` hub |
| Search & Filter | ❌ Missing | Search/Filter exists in sub-pages (`ActiveLivestock.tsx`, etc.) but not in the hub |
| Main Content | ✅ | Navigation links to sub-pages |
| History | ✅ | Per-animal history accessible via `LivestockProfile` Module Summary |
| Analytics | ❌ Missing | No analytics view |
| Dashboard | N/A | Hub page is read-only |
| Timeline | ❌ Missing | No Timeline in `LivestockProfile.tsx`; QR in profile is a static `🔳` placeholder |
| UUID | ⚠️ Note | Livestock IDs use semantic identifiers (pre-existing convention); not UUID v4 per constitution, but consistent throughout codebase |
| Batch integration | ⚠️ Partial | Batch status shown on profile but no batch mode at hub level |
| Scan/QR | ❌ Missing | `LivestockProfile.tsx` shows a static `🔳` placeholder (L283–335); no `/scan` route |

#### Completed
- Sub-page architecture (Active / Outside / Archive) ✅
- Per-animal profile navigation ✅
- Live summary counts ✅
- Per-animal history pages (Bobot, Kesehatan, Pakan, Reproduksi, Mutasi) ✅

#### Major Issues
- **Livestock hub (`Livestock.tsx`) missing three standard layout sections:** Header, AI Insight, and Mode selector. By constitution, every Livestock module hub must follow the standard layout. Other hubs (Kesehatan Hewan, Pemberian Pakan, Mutasi, Batch) all have these sections.
- **No Search & Filter at hub level.** Search and filter are siloed in each sub-page. There is no cross-status search from the hub.

#### Minor Issues
- No Scan/QR module. The `LivestockProfile` shows a static icon. No `/scan` route exists in `App.tsx`.
- No livestock Timeline on the `LivestockProfile` page itself (history is accessed through separate per-module pages, not an aggregated timeline view on the profile).
- Livestock IDs are semantic strings, not UUID v4. Pre-existing convention, consistent throughout. Should be migrated when a real database is added (Task #2).

#### Needs Synchronization
- Add `ModuleHeader` to `Livestock.tsx`.
- Add AI Insight section to `Livestock.tsx` hub (sourced from a new `aiInsightLivestockData.ts` covering herd composition, status distribution, health summary).
- Add `Mode` selector and batch-aware content to `Livestock.tsx` hub.
- Add Search & Filter to `Livestock.tsx` hub.
- (Future, out of this audit scope): Implement Scan/QR module at `/scan`.
- (Future): Add aggregated Timeline to `LivestockProfile.tsx`.

---

### 3.4 Pemberian Pakan

| | |
|---|---|
| **Files** | `src/pages/PemberianPakan.tsx` · `src/data/aiInsightPakanData.ts` |
| **Routes** | `/pemberian-pakan` · `/jadwal-pemberian-pakan` · `/riwayat-pemberian-pakan` |
| **Line Counts** | PemberianPakan.tsx: 2,301 · aiInsightPakanData.ts: 594 |

#### Architecture Status

| Checklist Item | Status | Notes |
|---|---|---|
| Header | ✅ | `ModuleHeader` with aggregated stats |
| AI Insight | ⚠️ Partial | Real rule-based engine in `aiInsightPakanData.ts`; `analyzedAt` present; **`dataSource` and `version` absent** |
| Summary | ✅ | Summary cards present |
| Mode | ✅ | `SegmentedControl` for `individu`/`batch` (L181) |
| Search & Filter | ✅ | Present |
| Main Content | ✅ | Feed session cards |
| History | ✅ | `RiwayatTerakhirSection` + dedicated `/riwayat-pemberian-pakan` route |
| Analytics | ⚠️ Partial | Analytics embedded in AI insight engine; no standalone Analytics section |
| Dashboard | ✅ | `DashboardPakanTab` (LP-007, L1201); read-only ✅ |
| Timeline | ❌ Missing | No Timeline log in `pemberianPakanData.ts` |
| UUID | ✅ | UUID-based session IDs |
| Batch integration | ✅ | Batch feeding mode integrated |

#### Completed
- `ModuleHeader` ✅
- AI Insight engine (rule-based) ✅
- Mode selector ✅
- Search & Filter ✅
- Dashboard Tab (LP-007) ✅
- History/Riwayat ✅
- Batch integration ✅
- Empty states ✅
- Read-only Dashboard ✅

#### Minor Issues
- **`aiInsightPakanData.ts` missing `dataSource` and `version` fields.** The return object (L583–593) includes `analyzedAt` but omits the other two required AI Constitution fields. Newer modules (Reproduksi, Mutasi, Batch) include all three.
- **No Timeline logging.** Feed events are recorded in `pemberianPakanData.ts` but do not append to any module-level Timeline. Feed operations are significant events that should appear in a livestock or feeding Timeline.

#### Needs Synchronization
- Add `dataSource: string[]` and `version: string` constants and include them in the `PakanInsightReport` return object in `aiInsightPakanData.ts` (matching `aiInsightReproduksiData.ts` pattern).
- Add a `PAKAN_TIMELINE_LOG` (or equivalent) and append events on feed session completion.

---

### 3.5 Kesehatan Hewan

| | |
|---|---|
| **Files** | `src/pages/KesehatanHewan.tsx` · `src/data/aiInsightKesehatanData.ts` |
| **Routes** | `/kesehatan-hewan` · `/kesehatan-hewan/pemeriksaan/baru` · `/kesehatan-hewan/diagnosa/:id` · `/kesehatan-hewan/tindakan/:id` · `/kesehatan-hewan/pengobatan/:id` · `/kesehatan-hewan/integrasi/:id` · `/kesehatan-hewan/kontrol/:id` · `/kesehatan-hewan/riwayat` · `/kesehatan-hewan/riwayat/:id` |
| **Line Count** | 2,051 |

#### Architecture Status

| Checklist Item | Status | Notes |
|---|---|---|
| Header | ✅ | `ModuleHeader` with aggregate metrics |
| AI Insight | ⚠️ Partial | Real rule-based engine in `aiInsightKesehatanData.ts`; `analyzedAt` present; **`dataSource` and `version` absent** |
| Summary | ✅ | Summary cards derived live from `getRiwayatKesehatanList()` (L1524) |
| Mode | ✅ | `SegmentedControl` for `individu`/`batch` (L844) |
| Search & Filter | ✅ | Present |
| Main Content | ✅ | Active cases list, scheduled controls |
| History | ✅ | `RiwayatSection` (L1191) + dedicated `/kesehatan-hewan/riwayat` route (KH-008) |
| Analytics | ⚠️ Partial | Analytics embedded in AI insight; no standalone view |
| Dashboard | ✅ | KH-010 Dashboard sections; read-only ✅ |
| Timeline | ❌ Missing | No Timeline log in `pemeriksaanKesehatanData.ts` / `pengobatanKesehatanData.ts` / `kontrolKesehatanData.ts` |
| UUID | ✅ | UUID-based records |
| Batch integration | ✅ | Batch mode integrated (KH-003) |

#### Completed
- `ModuleHeader` ✅
- AI Insight engine (rule-based) ✅
- Mode selector ✅
- Search & Filter ✅
- History/Riwayat (KH-008) ✅
- Dashboard (KH-010) ✅
- Summary ✅
- Batch integration ✅
- Empty states ✅
- Read-only Dashboard ✅

#### Minor Issues
- **`aiInsightKesehatanData.ts` missing `dataSource` and `version` fields.** The return object (L561–570) includes `analyzedAt` only. Same gap as Pemberian Pakan; same fix applies.
- **No Timeline logging** in any of the health sub-module data files (`pemeriksaanKesehatanData.ts`, `pengobatanKesehatanData.ts`, `kontrolKesehatanData.ts`). Health events are tracked in the Riwayat but not in a structured Timeline.
- The `AiInsightCard` includes a Pro/Free toggle (`isPro`/`onTogglePro`, L669) — a non-standard UI pattern. The underlying engine is real, but the gating pattern diverges from the reference implementation in Mutasi/Batch/Reproduksi.

#### Needs Synchronization
- Add `dataSource: string[]` and `version: string` to `aiInsightKesehatanData.ts` (matching `aiInsightReproduksiData.ts`).
- Add Timeline logging in health event data files.
- (Low priority): Remove the Pro/Free toggle from the AI card; align with the standard AI Insight card pattern.

---

### 3.6 Reproduksi

| | |
|---|---|
| **Files** | `src/pages/Reproduksi.tsx` · `src/data/aiInsightReproduksiData.ts` |
| **Route** | `/reproduksi` |
| **Line Count** | 5,296 |

#### Architecture Status

| Checklist Item | Status | Notes |
|---|---|---|
| Header | ✅ | Module header present |
| AI Insight | ✅ | `aiInsightReproduksiData.ts`; `analyzedAt` + `dataSource` + `version` all present |
| Summary | ✅ | Summary cards derived live |
| Mode | ✅ | Mode selector present |
| Search & Filter | ✅ | Multi-facet filter (L711–819) |
| Main Content | ✅ | Program cards, monitoring |
| History | ✅ | `RiwayatReproduksiSection` (L5072) |
| Analytics | ✅ | Rule-based analytics in AI engine |
| Dashboard | ✅ | Module acts as dashboard hub; read-only ✅ |
| Timeline | ✅ | `getFullTimelineForProgram` (L4472–4558) |
| UUID | ✅ | `generateUUID` from `utils/uuid` |
| Batch integration | ✅ | Batch filter present |

#### Completed
Fully compliant with all architecture checklist items.

#### Major Issues
None.

#### Minor Issues
- **5,296 lines** — the largest file in the module set. Numerous sub-components (`ProgramCard`, `PelaksanaanCard`, `KelahiranCard`, etc.) are defined inline. Maintenance risk. Should be extracted into a dedicated component directory in a future housekeeping task.

#### Needs Synchronization
None — module is architecturally compliant. File decomposition is a future housekeeping task, not a synchronization requirement.

---

### 3.7 Batch

| | |
|---|---|
| **Files** | `src/pages/BatchList.tsx` · `src/data/aiInsightBatchData.ts` |
| **Routes** | `/batch` · `/batch/riwayat` · `/batch/add` · `/batch/:id` · `/batch/:id/members` · `/batch/:id/operasi` |
| **Line Count** | BatchList.tsx: 1,652 |

#### Architecture Status

| Checklist Item | Status | Notes |
|---|---|---|
| Header | ✅ | `ModuleHeader` |
| AI Insight | ✅ | `aiInsightBatchData.ts`; `analyzedAt` + `dataSource` + `version` all present |
| Summary | ✅ | `SummaryGrid` + `DashboardSummarySection` |
| Mode | ✅ | `SegmentedControl` for `individu`/`batch` |
| Search & Filter | ✅ | `SearchFilterSection` |
| Main Content | ✅ | Batch cards |
| History | ✅ | `BatchHistorySection` + `DashboardRecentActivitySection` |
| Analytics | ✅ | `BatchRiwayat` page + `DashboardStatisticsSection` using `batchAnalyticsData.ts` |
| Dashboard | ✅ | `DashboardTab` (BT-007); read-only ✅ |
| Timeline | ✅ | `BATCH_TIMELINE_LOG` + `addBatchTimelineEvent` in `batchData.ts` |
| UUID | ⚠️ Note | `BTH-NNN` IDs (pre-existing, consistent, documented in BT-008); not UUID v4 but stable |
| Batch integration | ✅ | This is the Batch module itself |

#### Completed
Fully compliant. BT-008 fixed the two stale `useMemo` dependencies (Dashboard Recent Activity, Active Batch last-activity labels) and the MutationSheet default state bug.

#### Major Issues
None.

#### Minor Issues
- `BTH-NNN` sequential IDs (pre-existing, documented, cannot be changed without DB migration).
- `feedConsumption` always returns `[]` in `getBatchAnalytics()` — intentionally deferred per inline comment; no user-visible error.
- Duplicated local `SectionLabel`/`Card` primitives across all Batch pages (5 files). Technical debt.

#### Needs Synchronization
None — module is architecturally compliant.

---

### 3.8 Mutasi

| | |
|---|---|
| **Files** | `src/pages/Mutasi.tsx` · `src/data/aiInsightMutasiData.ts` |
| **Route** | `/mutasi` |
| **Line Count** | Mutasi.tsx: 1,014 |

#### Architecture Status

| Checklist Item | Status | Notes |
|---|---|---|
| Header | ✅ | `ModuleHeader` with aggregate metrics |
| AI Insight | ✅ | `aiInsightMutasiData.ts`; `analyzedAt` + `dataSource` + `version` all present |
| Summary | ✅ | `RingkasanCards` (Masuk/Keluar/Pending/Selesai) |
| Mode | ✅ | `SegmentedControl` for `individu`/`batch` |
| Search & Filter | ⚠️ Partial | Text search ✅; `LOKASI_OPTIONS`/`BATCH_OPTIONS` are **static single-item arrays** (L383–384) — filter dropdowns show only "Semua Lokasi"/"Semua Batch" and cannot actually filter |
| Main Content | ✅ | Mutation list |
| History | ✅ | `DaftarMutasi` + `RiwayatMutasiSheet` |
| Analytics | ✅ | `getMutasiAnalytics()` in AI engine |
| Dashboard | ⚠️ Partial | No dedicated Dashboard tab; main page acts as dashboard; read-only ✅ |
| Timeline | ✅ | `MUTATION_EVENT_LOG` via `logMutationEvent` |
| UUID | ✅ | `generateUUID` from `utils/uuid` |
| Batch integration | ✅ | Batch mode integrated |

#### Completed
- `ModuleHeader` ✅
- AI Insight (fully AI Constitution compliant) ✅
- Summary cards ✅
- Mode selector ✅
- History/Riwayat ✅
- Timeline logging ✅
- UUID ✅
- Batch integration ✅
- Empty states ✅
- Analytics (embedded in AI engine) ✅

#### Minor Issues
- **`LOKASI_OPTIONS` and `BATCH_OPTIONS` are static arrays** (L383–384) containing only "Semua Lokasi"/"Semua Batch". The Location and Batch filter dropdowns in `SearchFilterSection` cannot filter to anything. They should be derived from live `OUTSIDE_LIVESTOCK_DB`/`TRANSFER_DB` and `BATCH_DB` at render time.
- **No dedicated Dashboard tab.** Other mature modules (Batch, Pemberian Pakan) have a tab-switched dashboard. The Mutasi main view serves as an adequate dashboard but lacks the formal tab structure.
- Minor logic duplication: `getMutationDirection` is defined in `mutasiData.ts` but partially mirrored in the analytics filtering within `aiInsightMutasiData.ts`.

#### Needs Synchronization
- Derive `LOKASI_OPTIONS` dynamically from live location data (matching the pattern in other modules).
- Derive `BATCH_OPTIONS` dynamically from `BATCH_DB` active batches.
- (Low priority): Add a dedicated Dashboard tab (matching Batch/Pemberian Pakan pattern).
- (Low priority): Remove duplicated direction-classification logic; reuse `getMutationDirection`.

---

## 4. Cross-Module Consistency Audit

### 4.1 Navigation Consistency

| Module | Route | Consistent? |
|---|---|---|
| Dashboard | `/` | ✅ |
| Livestock | `/livestock` | ✅ |
| Catat Bobot | `/catat-bobot` | ✅ |
| Pemberian Pakan | `/pemberian-pakan` | ✅ |
| Kesehatan Hewan | `/kesehatan-hewan` | ✅ |
| Reproduksi | `/reproduksi` | ✅ |
| Batch | `/batch` | ✅ |
| Mutasi | `/mutasi` | ✅ |

All routes follow `/kebab-case` convention. No orphan routes detected.

### 4.2 AI Insight Compliance Matrix

| Module | Engine | `analyzedAt` | `dataSource` | `version` | Status |
|---|---|---|---|---|---|
| Dashboard | None (static chips) | ❌ | ❌ | ❌ | ❌ Non-compliant |
| Catat Bobot | None (static placeholder) | ❌ | ❌ | ❌ | ❌ Non-compliant |
| Livestock | None | ❌ | ❌ | ❌ | ❌ Missing |
| Pemberian Pakan | `aiInsightPakanData.ts` ✅ | ✅ | ❌ | ❌ | ⚠️ Partial |
| Kesehatan Hewan | `aiInsightKesehatanData.ts` ✅ | ✅ | ❌ | ❌ | ⚠️ Partial |
| Reproduksi | `aiInsightReproduksiData.ts` ✅ | ✅ | ✅ | ✅ | ✅ Compliant |
| Batch | `aiInsightBatchData.ts` ✅ | ✅ | ✅ | ✅ | ✅ Compliant |
| Mutasi | `aiInsightMutasiData.ts` ✅ | ✅ | ✅ | ✅ | ✅ Compliant |

### 4.3 Timeline Integration Matrix

| Module | Timeline Log | Events Logged |
|---|---|---|
| Dashboard | N/A | — |
| Catat Bobot | ❌ None | — |
| Livestock | ❌ None (profile has no timeline) | — |
| Pemberian Pakan | ❌ None | — |
| Kesehatan Hewan | ❌ None | — |
| Reproduksi | ✅ `getFullTimelineForProgram` | All program lifecycle stages |
| Batch | ✅ `BATCH_TIMELINE_LOG` | Activate / Move / Finish / Archive |
| Mutasi | ✅ `MUTATION_EVENT_LOG` | All mutation lifecycle events |

### 4.4 Naming Consistency

| Convention | Status |
|---|---|
| Route names: `/kebab-case` | ✅ Consistent |
| Data file names: `camelCaseData.ts` | ✅ Consistent |
| AI data files: `aiInsight{Module}Data.ts` | ✅ Consistent (where they exist) |
| Page components: `PascalCase.tsx` | ✅ Consistent |
| Mode enum: `'individu'` / `'batch'` | ✅ Consistent across Batch, Mutasi, KH, Pakan, CatatBobot |
| Summary card pattern: `RingkasanCards` / `SummaryGrid` | ⚠️ Minor inconsistency: different names per module, same concept |

### 4.5 Component Reuse

| Component | Status |
|---|---|
| `SegmentedControl` (Mode) | ✅ Reused across CatatBobot, KH, Pakan, Batch, Mutasi |
| `ModuleHeader` | ✅ Used in Batch, KH, Pakan, Mutasi; ❌ Missing in Livestock hub, Dashboard |
| `SectionLabel` / `Card` | ⚠️ Duplicated as local primitives in Batch pages (5 files) |
| AI Insight card pattern | ⚠️ Inconsistent: Batch/Mutasi/Reproduksi use one pattern; KH/CatatBobot use Pro/Free gate pattern |
| `SheetShell` | ✅ Consistent across all modules |
| `TopAppBar` / `BottomNav` | ✅ Shared via `App.tsx` |

---

## 5. Synchronization Priority & Recommended Implementation Order

Issues are ranked by impact on architecture compliance and user-visible correctness.

### Priority 1 — Critical (Honest Data Violation)

| ID | Module | Issue | Effort |
|---|---|---|---|
| S-01 | Dashboard | 3 of 4 summary card values hardcoded to `'—'` | Low — data already exists in registries |

### Priority 2 — Major (AI Constitution Violation)

| ID | Module | Issue | Effort |
|---|---|---|---|
| S-02 | Catat Bobot | No AI Insight engine — static placeholder only | Medium — new `aiInsightBobotData.ts` required |
| S-03 | Livestock | No AI Insight in hub — section entirely absent | Medium — new `aiInsightLivestockData.ts` required |

### Priority 3 — Major (Standard Layout Missing)

| ID | Module | Issue | Effort |
|---|---|---|---|
| S-04 | Livestock | Missing Mode selector and Search & Filter in hub | Medium |
| S-05 | Livestock | Missing `ModuleHeader` in hub | Low |

### Priority 4 — Minor (AI Constitution Partial Compliance)

| ID | Module | Issue | Effort |
|---|---|---|---|
| S-06 | Pemberian Pakan | `dataSource` and `version` missing from `aiInsightPakanData.ts` | Low — add 2 constants + include in return object |
| S-07 | Kesehatan Hewan | `dataSource` and `version` missing from `aiInsightKesehatanData.ts` | Low — same fix as S-06 |

### Priority 5 — Minor (Timeline Gaps)

| ID | Module | Issue | Effort |
|---|---|---|---|
| S-08 | Catat Bobot | No Timeline logging for weight events | Low-Medium |
| S-09 | Pemberian Pakan | No Timeline logging for feed events | Low-Medium |
| S-10 | Kesehatan Hewan | No Timeline logging for health events | Low-Medium |

### Priority 6 — Minor (Filter & UX)

| ID | Module | Issue | Effort |
|---|---|---|---|
| S-11 | Mutasi | `LOKASI_OPTIONS`/`BATCH_OPTIONS` static — filters non-functional | Low — derive from live DB |
| S-12 | Dashboard | AI chips are hardcoded labels, not rule-based | Medium |
| S-13 | Catat Bobot | Remove Pro/Free gate; align AI card with standard pattern | Low |
| S-14 | Kesehatan Hewan | Remove Pro/Free gate; align AI card with standard pattern | Low |

---

## 6. Recommended Implementation Order

Based on priority, dependencies, and effort:

```
1. S-01  Dashboard summary card values (no deps, low effort, high user-visible impact)
2. S-06  Pemberian Pakan aiInsight dataSource/version (no deps, very low effort)
3. S-07  Kesehatan Hewan aiInsight dataSource/version (no deps, very low effort)
4. S-11  Mutasi filter options from live DB (no deps, low effort)
5. S-05  Livestock ModuleHeader (no deps, low effort)
6. S-04  Livestock Mode + Search & Filter (depends on S-05)
7. S-02  Catat Bobot aiInsightBobotData.ts (no deps, medium effort)
8. S-03  Livestock aiInsightLivestockData.ts (depends on S-04, S-05)
9. S-08  Catat Bobot Timeline logging (no deps, low-medium)
10. S-09  Pemberian Pakan Timeline logging (no deps, low-medium)
11. S-10  Kesehatan Hewan Timeline logging (no deps, low-medium)
12. S-13  CatatBobot AI card pattern alignment (depends on S-02)
13. S-14  KH AI card pattern alignment (no deps)
14. S-12  Dashboard AI chips rule-based (depends on S-03 approach for reference)
```

Items S-08 through S-10 (Timeline logging) can be implemented in parallel as they are independent.

---

## 7. Module Status Summary

| Module | Architecture Status | Compliant? | Priority |
|---|---|---|---|
| Reproduksi | Fully compliant | ✅ | — |
| Batch | Fully compliant (BT-008 fixed) | ✅ | — |
| Mutasi | Mostly compliant; 2 minor gaps | ✅ | P6 (S-11) |
| Pemberian Pakan | Mostly compliant; 2 minor gaps | ⚠️ | P4 (S-06, S-09) |
| Kesehatan Hewan | Mostly compliant; 2 minor gaps | ⚠️ | P4 (S-07, S-10) |
| Dashboard | Partial; 1 critical gap | ❌ | P1 (S-01) |
| Catat Bobot | Partial; AI section is non-functional | ❌ | P2 (S-02), P5 (S-08) |
| Livestock | Partial; hub missing 3 standard sections | ❌ | P2–3 (S-03–05) |

---

*Audit only — no implementation changes were made as part of this report.*
