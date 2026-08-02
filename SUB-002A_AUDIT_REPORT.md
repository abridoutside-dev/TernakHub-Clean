# SUB-002A — Subscription Feature Policy Audit Report

**Date:** 2026-07-18
**Auditor:** Agent (automated)
**Scope:** All files related to Subscription Feature Policy

---

## Audit Summary

| Severity | Count |
|---|---|
| 🔴 Critical | 2 |
| 🟠 Major | 4 |
| 🟡 Minor | 6 |
| 🔵 Suggestion | 4 |
| ✅ Pass | — |

---

## Files Audited

| File | Lines | Purpose |
|---|---|---|
| `src/types/subscription.ts` | 384 | FeatureKey type, all subscription types |
| `src/data/subscriptionFeaturePolicy.ts` | 1,327 | Policy SSOT table + helpers |
| `src/data/workspaceSubscriptionData.ts` | 910 | FEATURE_GATE, FEATURE_MIN_PLAN, runtime functions |
| `src/contexts/SubscriptionContext.tsx` | 85 | useSubscription() hook |
| `src/components/subscription/FeatureGate.tsx` | 193 | Locked-feature UI wrapper |
| `src/components/subscription/UpgradeDialog.tsx` | 251 | Upgrade bottom sheet |
| `src/pages/ProfileSubscription.tsx` | ~470 | Plan selection UI |
| `src/pages/PemberianPakan.tsx` | ~2,000 | Feed management — contains AI insight card |
| `src/pages/RiwayatMutasi.tsx` | ~280 | Mutation history — contains AI insight card |
| `src/pages/FormulaDetail.tsx` | — | Formula detail — uses FeatureGate (proof-of-concept) |
| `src/pages/FormulaTab.tsx` | — | Formula tab — uses FeatureGate (proof-of-concept) |

---

## Checklist Results

---

### ✅ 1. Single Source of Truth

**PASS (with caveats — see Major #2)**

`hasFeature(plan, feature)` in `workspaceSubscriptionData.ts` is the sole runtime gate.
`useSubscription().hasFeature(feature)` is the sole component hook.
No module defines its own plan comparison logic — with two exceptions documented below (Critical #1, Critical #2).

---

### ✅ 2. Feature Coverage

**PASS**

All 110 FeatureKeys in `src/types/subscription.ts` have a corresponding policy row in
`subscriptionFeaturePolicy.ts`. Programmatic diff confirms zero orphaned keys in either
direction.

Every policy row contains all required fields: `key`, `module`, `feature`, `free`, `pro`,
`enterprise`, `limit`, `notes`. No missing entries.

---

### ✅ 3. Feature Mapping

**PASS (with caveats — see Major #1)**

TypeScript enforces exhaustiveness on `FEATURE_GATE: Record<WorkspacePlan, Record<FeatureKey, boolean>>`.
Since `tsc --noEmit` returns zero errors, all 110 FeatureKeys are present in all three plan rows.

`FEATURE_MIN_PLAN: Record<FeatureKey, WorkspacePlan>` is similarly exhaustive.

No duplicate mappings, no wrong-tier assignments detected.

**Gap:** Two FeatureKeys specified in the Event Policy are missing — see Major #1.

---

### ✅ 4. Free Principles

**PASS**

All required Free features confirmed:

| Feature | FeatureKey | Free in FEATURE_GATE |
|---|---|---|
| Record livestock | `livestock` | ✅ true |
| Record weight | `weight_recording` | ✅ true |
| Record feed | `feed` | ✅ true |
| Record medicine | `medicine` | ✅ true |
| Use Feed Formula | `formula_feed` | ✅ true |
| Browse Marketplace | `marketplace` | ✅ true |
| Buy | `marketplace` | ✅ true |
| Sell | `marketplace` | ✅ true |
| View News | `news_view` | ✅ true |
| View Events | `event_view` | ✅ true |
| Register Events | `event_register` | ✅ true |

---

### ✅ 5. Formula Policy

**PASS**

| Requirement | FeatureKey | Status |
|---|---|---|
| Free: Formula available | `formula_feed` | ✅ Free=true |
| Free: Basic analysis only | `formula_analysis_basic` | ✅ Free=true |
| Pro: Complete nutrition analysis | `formula_nutrition_complete` | ✅ Pro=true, Free=false |
| Pro: AI Recommendation | `ai_formula_recommendation` | ✅ Pro=true, Free=false |
| Pro: AI Optimization | `ai_feed_optimization`, `ai_cost_optimization` | ✅ Pro=true, Free=false |
| Enterprise: Org analytics | `organization_analytics`, `ai_organization` | ✅ Enterprise=true, Pro=false |

---

### ⚠️ 6. Event Policy

**PARTIAL PASS — see Major #1**

| Requirement | FeatureKey | Status |
|---|---|---|
| Free: View News | `news_view` | ✅ |
| Free: View Events | `event_view` | ✅ |
| Free: Register Event | `event_register` | ✅ |
| Pro: Create Event | `event_create` | ✅ |
| Pro: Edit Own Event | ❌ missing | 🔴 Not in type or policy |
| Pro: Cancel Own Event | ❌ missing | 🔴 Not in type or policy |
| Pro: Manage Participants | `event_manage_participants` | ✅ |
| Pro: Event Analytics | `event_analytics` | ✅ |
| Enterprise: Organization Events | `event_organization` | ✅ |
| Enterprise: Multi-Workspace Events | `event_multi_workspace` | ✅ |

---

### ✅ 7. Upgrade Policy

**PASS**

`FeatureGate.tsx` correctly:
- Never hides locked features (renders `LockedFeatureCard` instead of null)
- Shows current plan label
- Shows required plan label
- Shows top 4 benefit strings from `PLAN_UPGRADE_UNLOCKS`
- Shows Upgrade CTA that opens `UpgradeDialog`

`UpgradeDialog.tsx` correctly:
- Shows current plan → target plan path
- Lists all `PLAN_UPGRADE_UNLOCKS[targetPlan]` benefits
- Shows price from `PLAN_CONFIG[targetPlan].price_label`
- Upgrade button navigates to `/profile/subscription` (no payment processing)

**Wiring gap:** `FeatureGate` is only wired in `FormulaDetail.tsx` and `FormulaTab.tsx` as proof-of-concept. No other module has deployed it — but this is a scope issue for future tasks, not a policy defect.

---

### ✅ 8. Downgrade Policy

**PASS (by documentation)**

Every policy row in `subscriptionFeaturePolicy.ts` includes a `notes` field that documents
downgrade behavior (e.g. "On downgrade: results are Read Only", "existing backups are retained",
"alerts are disabled"). The policy correctly states data is never deleted on downgrade.

**Note:** The downgrade policy is documented but not enforced by code — no `requestPlanChange()`
guard in `workspaceSubscriptionData.ts` implements the Read Only transition. This is acceptable
for the current scope (no real plan changes yet), but should be enforced when real plan switching
is implemented.

---

### ✅ 9. Workspace Policy

**PASS**

`SubscriptionContext.tsx` derives subscription from `useWorkspace().activeWorkspace` —
subscription is workspace-scoped, not user-scoped.

Switching the active workspace changes which subscription is returned. ✅

`seedNewWorkspaceSubscription()` is called on workspace creation. ✅

`ProfileSubscription.tsx` shows the active workspace's subscription. ✅

---

### ✅ 10. Enterprise Policy

**PASS**

All Enterprise-only features have `Free=false, Pro=false, Enterprise=true` in FEATURE_GATE.
TypeScript `Record<WorkspacePlan, Record<FeatureKey, boolean>>` enforces no Enterprise key
can accidentally be true on a lower plan without a compile error.

`ProfileSubscription.tsx:185` correctly routes Enterprise plan selection to "contact sales"
instead of simulating a plan change.

---

### ✅ 11. Dead Code

**PASS (with caveats — see Minor #6)**

No unused enums, constants, or imports found in the subscription subsystem. Four exported
functions in `subscriptionFeaturePolicy.ts` are unused — documented as Minor #6.

---

### ✅ 12. TypeScript

**PASS**

```
npx tsc --noEmit → 0 errors
```

`Record<WorkspacePlan, Record<FeatureKey, boolean>>` enforces exhaustive coverage of all 110
FeatureKeys in all three plan rows. Any missing key would be a compile error.

---

### ✅ 13. Performance

**PASS**

`FEATURE_GATE` is a static in-memory object. `hasFeature(plan, feature)` is a single O(1)
property lookup — no parsing, no iteration, no repeated policy scanning.

`useSubscription()` re-evaluates only when `WorkspaceContext.activeWorkspace` changes.

No duplicate lookups, no repeated policy parsing detected.

**No caching recommendation needed** — lookups are already O(1).

---

### ⚠️ 14. Future Compatibility

**PARTIAL PASS — see Minor #5**

Adding a new module requires changes to **4 locations**, not 2 as the SUB-002 report claims:

1. Add `FeatureKey` to `src/types/subscription.ts`
2. Add row to `SUBSCRIPTION_FEATURE_POLICY` in `subscriptionFeaturePolicy.ts`
3. Add key to all 3 plan rows in `FEATURE_GATE` in `workspaceSubscriptionData.ts`
4. Add key to `FEATURE_MIN_PLAN` in `workspaceSubscriptionData.ts`

Steps 3 and 4 are enforced by TypeScript (compile error if missing). Steps 1 and 2 have no
enforcement linking them to Steps 3 and 4.

---

---

## Findings

---

### 🔴 CRITICAL-001 — AI Insight Gate Bypassed in PemberianPakan.tsx

**File:** `src/pages/PemberianPakan.tsx`

**Evidence:**
```tsx
const [insightsPro, setInsightsPro] = useState(false);  // line 1854
```

`insightsPro` is a local React state initialized to `false`. It is controlled by a manual
toggle button with label `{isPro ? 'Pro ✓' : 'Free'}`. The lock overlay contains a button
labeled **"Coba Sekarang (Demo)"** that sets `insightsPro = true`.

`useSubscription()` and `hasFeature()` are **never called** in this file.

**Impact:**
- Any user on any plan (including Free) can click "Coba Sekarang (Demo)" and immediately
  see full Pro AI insight content (`ProPakanContent` component) without any subscription check.
- The FeatureGate / UpgradeDialog system is entirely bypassed.
- A Free-plan user sees real AI analysis data behind a blurred overlay they can remove
  by clicking one button.

**Classification:** Critical — subscription enforcement does not exist on this page.

---

### 🔴 CRITICAL-002 — AI Insight Gate Bypassed in RiwayatMutasi.tsx

**File:** `src/pages/RiwayatMutasi.tsx`

**Evidence:**
```tsx
const [insightPro, setInsightPro] = useState(false);  // line 269
```

Identical pattern to CRITICAL-001. `AiInsightCard` receives `isPro={insightPro}` and a
toggle callback. No `hasFeature()` or `useSubscription()` call anywhere in the file.

**Impact:**
- Any user can toggle the AI insight card to Pro mode in the Mutation History page without
  a subscription check.
- Pro AI content is accessible to Free-plan users.

**Classification:** Critical — same bypass as CRITICAL-001.

---

### 🟠 MAJOR-001 — Missing Event FeatureKeys: event_edit and event_cancel

**Files:** `src/types/subscription.ts`, `src/data/subscriptionFeaturePolicy.ts`

**Evidence:**

The SUB-002 specification states that **PRO** unlocks:
- Create Event ✅ (`event_create` exists)
- **Edit Own Event ❌** — no `event_edit` FeatureKey
- **Cancel Own Event ❌** — no `event_cancel` FeatureKey
- Manage Participants ✅ (`event_manage_participants` exists)
- Event Analytics ✅ (`event_analytics` exists)

Neither `event_edit` nor `event_cancel` appear in:
- `src/types/subscription.ts` (FeatureKey union)
- `src/data/subscriptionFeaturePolicy.ts` (policy table)
- `src/data/workspaceSubscriptionData.ts` (FEATURE_GATE, FEATURE_MIN_PLAN)

**Impact:**
- Event editing and event cancellation are not gated — any plan can perform them when the
  Event module is implemented.
- The policy is incomplete relative to the spec.

**Classification:** Major — policy coverage gap against the specification.

---

### 🟠 MAJOR-002 — Policy Table Is Never Read at Runtime

**Files:** `src/data/subscriptionFeaturePolicy.ts` (all exports)

**Evidence:**

`subscriptionFeaturePolicy.ts` is only imported in:
```
src/data/workspaceSubscriptionData.ts  ← import type only (SubscriptionFeaturePolicyRow)
src/types/subscription.ts             ← type definition source
```

No UI component, page, or runtime consumer ever calls `getPolicyRow()`, `getPolicyByModule()`,
`getFeaturesForPlan()`, `getPolicyModules()`, or reads `SUBSCRIPTION_FEATURE_POLICY`.

The actual runtime gate comes entirely from `FEATURE_GATE` in `workspaceSubscriptionData.ts`.

**Impact:**
- `SUBSCRIPTION_FEATURE_POLICY` and `FEATURE_GATE` can diverge silently. A developer could
  update the policy table but forget to update `FEATURE_GATE`, or vice versa. There is no
  TypeScript error, no runtime warning, and no test to detect this drift.
- The policy file is documentation-as-code, not an enforced source of truth. Any call it
  a "SSOT" is aspirational, not technical.

**Classification:** Major — the SSOT claim cannot be mechanically enforced without a link
between the policy table and the runtime gate.

---

### 🟠 MAJOR-003 — BENEFIT_ROWS Is Severely Incomplete

**File:** `src/data/workspaceSubscriptionData.ts`

**Evidence:**

`BENEFIT_ROWS` contains **34 display rows** covering approximately 18 features across
4 groups: "Fitur Dasar", "AI Insight", "Fitur Pro", "Fitur Enterprise".

The full policy contains **110 FeatureKeys** across **33 modules**.

`ProfileSubscription.tsx` renders only `BENEFIT_ROWS` in its plan comparison table. Users
making an upgrade decision see a table that represents ~16% of the actual policy.

Missing from `BENEFIT_ROWS` (examples): Authentication (2FA, SSO), Notification
(Email, WhatsApp), News (submit, publish), Events (all 7 keys), Public Farm Profile (4 keys),
Global Search (2 keys), Service Workspace types (6 keys), Backup/Restore (4 keys), Export
(3 keys), Monitoring (3 keys), Trust/Verification (6 keys), API (2 keys), Admin (6 keys).

**Impact:**
- Users are shown an incomplete picture of what they get when upgrading.
- The plan comparison table is materially misleading.

**Classification:** Major — visible user-facing gap in plan comparison UI.

---

### 🟠 MAJOR-004 — Dual Plan Source of Truth with No Sync Verification

**Files:** `src/data/workspaceSubscriptionData.ts`, `src/contexts/SubscriptionContext.tsx`

**Evidence:**

Plan is stored in two places:
1. `WorkspaceRecord.workspace_plan` (in `WORKSPACE_DB`)
2. `WorkspaceSubscriptionRecord.plan` (in `SUBSCRIPTION_DB`)

`SubscriptionContext.tsx` line 69–70:
```tsx
const plan: WorkspacePlan =
  (activeWorkspace?.workspace_plan as WorkspacePlan) ?? 'Free';
```

The context reads from `WorkspaceRecord` first, only calling `getWorkspaceSubscription()`
for metadata fields (status, dates) — it does **not** use `SUBSCRIPTION_DB.plan`.

`requestPlanChange()` syncs both stores via `patchWorkspace()`. If they ever diverge (e.g.
direct seed manipulation, incomplete write), the SUBSCRIPTION_DB becomes invisible to the gate.

**Impact:**
- If `WorkspaceRecord.workspace_plan` and `SUBSCRIPTION_DB.plan` drift, `hasFeature()` will
  enforce the wrong plan — silently.
- No read-time integrity check exists.

**Classification:** Major — silent data integrity risk.

---

### 🟡 MINOR-001 — recording FeatureKey Is Miscategorized in subscription.ts

**File:** `src/types/subscription.ts`, line 97

**Evidence:**
```ts
// ── AI Insight ─────────────────────────────────────────────────────────────
| 'ai_basic'                      // AI insight with daily quota (≤5 per day)
| 'recording'                     // general data recording across modules
```

`recording` is listed inside the "AI Insight" section comment block, between `ai_basic` and
the blank line before "Reports". Its description ("general data recording across modules")
has nothing to do with AI.

In the policy table it is correctly categorized under module `'General'`. The type file
section placement is inconsistent.

**Classification:** Minor — cosmetic, no functional impact.

---

### 🟡 MINOR-002 — Trailing Semicolon Inside FeatureKey Comment

**File:** `src/types/subscription.ts`, line 298

**Evidence:**
```ts
| 'custom_integration'            // custom third-party integrations;
```

A semicolon appears at the end of the comment. This is cosmetically incorrect — the
semicolon closes nothing (the union member is already closed by the next `|` or by the
type definition's closing). TypeScript ignores it (inside a comment), but it is misleading
to readers who may think it terminates the union early.

**Classification:** Minor — cosmetic only.

---

### 🟡 MINOR-003 — Inline Plan String Comparison in ProfileSubscription.tsx

**File:** `src/pages/ProfileSubscription.tsx`, line 185

**Evidence:**
```tsx
if (target === 'Enterprise') {
  // Enterprise requires contacting sales — no simulation
  return;
}
```

This is a raw string comparison against `'Enterprise'` rather than using a helper from the
subscription system. The policy rules state "never inline plan comparisons."

**Context:** The intent is routing logic (contact-sales vs. simulate), not gating a feature.
The actual subscription gate (`hasFeature`) is unaffected. However it still violates the
stated convention.

**Classification:** Minor — convention violation, no functional impact.

---

### 🟡 MINOR-004 — Inline Tier→Plan Mapping in ProfileSubscription.tsx

**File:** `src/pages/ProfileSubscription.tsx`, line 447

**Evidence:**
```tsx
const tierPlan: WorkspacePlan =
  tier === 'free' ? 'Free' : tier === 'pro' ? 'Pro' : 'Enterprise';
```

This inline ternary remaps lowercase `'free'|'pro'|'enterprise'` to `WorkspacePlan`. It
duplicates mapping logic that could be expressed through `PLAN_ORDER` or `PLAN_CONFIG`.

**Classification:** Minor — no functional impact, but fragile if plan names change.

---

### 🟡 MINOR-005 — Future Compatibility Documentation Is Inaccurate

**Files:** `SUB-002_COMPLETION_REPORT.md`, `src/data/subscriptionFeaturePolicy.ts` (header comment)

**Evidence:**

Both the completion report and the policy file header state:
> "New modules simply add rows here. No structural changes needed."
> "Adding a future module only requires: Add FeatureKey + Add Policy Row"

In reality, adding a new feature requires **4 edits** across 3 files:
1. `src/types/subscription.ts` — add FeatureKey to union
2. `src/data/subscriptionFeaturePolicy.ts` — add policy row
3. `src/data/workspaceSubscriptionData.ts` — add key to FEATURE_GATE (all 3 plan rows)
4. `src/data/workspaceSubscriptionData.ts` — add key to FEATURE_MIN_PLAN

Steps 3 and 4 are enforced by TypeScript (a missing key is a compile error). Steps 1 and 2
have no mechanical enforcement.

**Classification:** Minor — documentation inaccuracy.

---

### 🟡 MINOR-006 — Four Dead Export Functions in subscriptionFeaturePolicy.ts

**File:** `src/data/subscriptionFeaturePolicy.ts`, lines 1285–1327

**Evidence:**

The following functions are exported but never imported by any file outside the policy module:

| Function | Purpose |
|---|---|
| `getPolicyRow(key)` | Lookup a single policy row by FeatureKey |
| `getPolicyByModule(module)` | Get all rows for a module |
| `getPolicyModules()` | List all module names |
| `getFeaturesForPlan(plan)` | Get all features available on a plan |

Confirmed via:
```
grep -rln "getPolicyRow|getPolicyByModule|getFeaturesForPlan|getPolicyModules" src/
→ src/data/workspaceSubscriptionData.ts  (import type only)
→ src/types/subscription.ts             (type definition)
```
Neither imports these functions — they are truly unused at runtime.

**Classification:** Minor — dead exports. No runtime impact.

---

## Suggestions

---

### 🔵 SUGGESTION-001 — Add Dev-Mode Drift Detection Between Policy and FEATURE_GATE

To mechanically enforce that the policy table and FEATURE_GATE never diverge, add a
dev-mode assertion to `workspaceSubscriptionData.ts`:

```ts
if (import.meta.env.DEV) {
  const policyKeys = new Set(SUBSCRIPTION_FEATURE_POLICY.map((r) => r.key));
  const gateKeys   = new Set(Object.keys(FEATURE_GATE.Free) as FeatureKey[]);
  const missing    = [...policyKeys].filter((k) => !gateKeys.has(k));
  const extra      = [...gateKeys].filter((k) => !policyKeys.has(k));
  if (missing.length || extra.length) {
    console.error('[SUB] Policy/Gate drift detected', { missing, extra });
  }
}
```

This would surface any future drift at app startup during development.

---

### 🔵 SUGGESTION-002 — Add event_edit and event_cancel FeatureKeys

Align the policy with the spec's Event Policy by adding:

| Key | Plan | Description |
|---|---|---|
| `event_edit` | Pro | Edit own event content/details |
| `event_cancel` | Pro | Cancel own event |

Both keys should follow the same procedure as other Pro event features.

---

### 🔵 SUGGESTION-003 — Derive BENEFIT_ROWS from SUBSCRIPTION_FEATURE_POLICY

To prevent `BENEFIT_ROWS` from drifting further behind the policy, derive it from
`SUBSCRIPTION_FEATURE_POLICY` instead of maintaining it manually:

```ts
export const BENEFIT_ROWS: SubscriptionBenefitRow[] = SUBSCRIPTION_FEATURE_POLICY.map((row) => ({
  label:      row.feature,
  group:      row.module,
  free:       row.free,
  pro:        row.pro,
  enterprise: row.enterprise,
}));
```

This also resolves MAJOR-002 by making the policy table a genuine runtime input.

---

### 🔵 SUGGESTION-004 — Connect AI Insight Cards to hasFeature()

Both CRITICAL findings have the same fix pattern. Replace the manual toggle with a real
subscription check via `useSubscription()`:

```tsx
// Replace:
const [insightsPro, setInsightsPro] = useState(false);

// With:
const { hasFeature } = useSubscription();
const insightsPro = hasFeature('ai_unlimited');
```

Remove the "Coba Sekarang (Demo)" button and the toggle. Wrap the card in `<FeatureGate>`
for proper locked-state display, or manually check `insightsPro` and render `UpgradeDialog`.

---

## Verification Checklist

| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| FeatureKey ↔ Policy row parity | ✅ 110 keys, all matched |
| FEATURE_GATE exhaustiveness | ✅ TypeScript-enforced |
| FEATURE_MIN_PLAN exhaustiveness | ✅ TypeScript-enforced |
| Free principles | ✅ All 11 required features are Free |
| Formula policy | ✅ All tiers correct |
| Event policy | ⚠️ 2 keys missing (event_edit, event_cancel) |
| Upgrade policy — never hide | ✅ FeatureGate renders locked card |
| Upgrade policy — show current/required/benefits/CTA | ✅ UpgradeDialog correct |
| Downgrade policy — no data deletion | ✅ Documented per-row |
| Workspace-scoped subscription | ✅ SubscriptionContext correct |
| Enterprise protection | ✅ TypeScript-enforced |
| Dead code | ⚠️ 4 unused exported functions |
| No hardcoded plan gates | ❌ CRITICAL-001, CRITICAL-002 |
| No performance issues | ✅ All O(1) lookups |
| Future compatibility | ⚠️ Requires 4 edits, not 2 |

---

## Priority Fix Order

| Priority | Finding | Action |
|---|---|---|
| 1 | CRITICAL-001 | Connect PemberianPakan AI card to `hasFeature('ai_unlimited')` |
| 2 | CRITICAL-002 | Connect RiwayatMutasi AI card to `hasFeature('ai_unlimited')` |
| 3 | MAJOR-001 | Add `event_edit` and `event_cancel` FeatureKeys |
| 4 | MAJOR-002 | Import SUBSCRIPTION_FEATURE_POLICY in BENEFIT_ROWS derivation (SUGGESTION-003) |
| 5 | MAJOR-003 | Expand BENEFIT_ROWS to cover all 110 features |
| 6 | MAJOR-004 | Add sync check in getWorkspaceSubscription() |
| 7 | MINOR-001–006 | Address in next housekeeping pass |
