# FARM-FIX Implementation Backlog
Generated from: **FARM-AUDIT-001** findings  
Consolidated: **FARM-AUDIT-001B**  
Baseline commit: post FARM-UI-002 / FARM-UI-003 rollback  
Status: All items **Pending**

---

## Master Implementation Checklist

### CRITICAL

| Fix ID | Package Name | Modules / Files | Audit Findings Included | Priority | Scope | Dependency | Status |
|--------|-------------|-----------------|------------------------|----------|-------|------------|--------|
| FARM-FIX-001 | Activity | `/activity` BottomNav page | Bare `<Placeholder>` mounted in BottomNav — page does not exist | Critical | Large | None | Pending |
| FARM-FIX-002 | Search | `/search` — `SearchPage.tsx` | Pure placeholder ("next phase") reachable from Dashboard search bar | Critical | Large | None | Pending |
| FARM-FIX-003 | Notifications | `/notifications` — `NotificationCenter.tsx` | Empty state only; no real notification data, no read/dismiss logic | Critical | Medium | None | Pending |
| FARM-FIX-004 | Marketplace & Communication | `/livestock/:id/saudara`; `MarketplaceChat.tsx` | (1) Bare `<Placeholder>` — Livestock Siblings page not implemented; (2) Image picker is emoji grid only; real upload "Segera Hadir" — non-functional | Critical | Large | Livestock data layer; File upload infrastructure | Pending |

### HIGH

| Fix ID | Package Name | Modules / Files | Audit Findings Included | Priority | Scope | Dependency | Status |
|--------|-------------|-----------------|------------------------|----------|-------|------------|--------|
| FARM-FIX-005 | Marketplace Escrow Detail | `MarketplaceEscrowDetail.tsx` | Irreversible `receiverConfirm()` has no confirmation dialog — destructive action with zero UX guard | High | Small | None | Pending |
| FARM-FIX-006 | Security & Access Control | `MarketplaceModerasiDetailKasus.tsx`; `QuickAction.tsx` | (1) Admin action buttons (approve/reject/escalate) have no role guard — any user can trigger admin actions; (2) `modal`/`bottom-sheet` actionTypes silently do nothing — dead code path | High | Small | None | Pending |
| FARM-FIX-007 | UI Consistency & Design System | `MarketplaceBuatListing.tsx`; `MarketplaceBuatLaporan.tsx`; `ProdukKomersialAdmin.tsx`; `MasterReferensiPK.tsx` | (1) Browser `alert()` used for validation guards in BuatListing; (2) Browser `alert()` used for validation guards in BuatLaporan; (3) Legacy hex values (`#f7faf8`, `#f0faf4`, `#1b7a43`) hardcoded in non-Dashboard files — replace with CSS vars | High | Medium | Coordinate with FARM-FIX-008 (hex sweep) | Pending |
| FARM-FIX-008 | Dashboard UI Polish | `Dashboard.tsx`; dashboard widgets; `AiInsight.tsx`; `DashboardTodayActivity.tsx`; `DashboardRecentActivity.tsx`; Profile Account, Marketplace Chat, Buat Listing, Chat List | (1) Hardcoded hex colors mixed with CSS vars across Dashboard; (2) Summary labeled "AI Generated" but explicitly disconnected from any AI engine; (3) `FilterChips`/`ActivityRow` duplicated across TodayActivity and RecentActivity — extract shared component; (4) Emoji characters used as photo upload placeholders — needs unified "Segera Hadir" / disabled-upload treatment | High | Medium | Coordinate with FARM-FIX-007 (hex sweep) | Pending |
| FARM-FIX-009 | Reproduksi | `Reproduksi.tsx` | 5,103-line monolith; AI Insight is a placeholder; Ringkasan cards use dummy hardcoded data | High | Large | Reproduksi data layer | Pending |
| FARM-FIX-010 | Profile Subscription | `ProfileSubscription.tsx` | Plan upgrade simulated in-memory only — no real payment provider | High | Large | Payment provider integration | Pending |
| FARM-FIX-011 | Profile Security | `ProfileSecurity.tsx` | 2FA entirely "Segera Hadir" — security feature shown in UI but completely unimplemented | High | Large | Supabase MFA | Pending |

### MEDIUM

| Fix ID | Package Name | Modules / Files | Audit Findings Included | Priority | Scope | Dependency | Status |
|--------|-------------|-----------------|------------------------|----------|-------|------------|--------|
| FARM-FIX-012 | Riwayat Mutasi / Konsentrat Product Detail | `RiwayatMutasi.tsx`; `KonsentratProdukDetail.tsx` | Pro feature gates implemented as CSS blur only — must use `<FeatureGate>` component for consistency and correctness | Medium | Small | None | Pending |

---

## Progress Tracker

```
☐ FARM-FIX-001  Activity — Implement Activity page
☐ FARM-FIX-002  Search — Implement Search page
☐ FARM-FIX-003  Notifications — Implement Notification Center
☐ FARM-FIX-004  Marketplace & Communication — Implement Livestock Siblings page + real Chat image upload
☐ FARM-FIX-005  Marketplace Escrow Detail — Add confirmation dialog for receiverConfirm()
☐ FARM-FIX-006  Security & Access Control — Add role guard to Moderasi admin buttons + guard dead QuickAction code
☐ FARM-FIX-007  UI Consistency & Design System — Replace browser alert() + replace legacy hex (non-Dashboard)
☐ FARM-FIX-008  Dashboard UI Polish — Replace hex colors + relabel AiInsight + extract shared components + unify upload placeholders
☐ FARM-FIX-009  Reproduksi — Decompose monolith, wire AI Insight, fix Ringkasan data
☐ FARM-FIX-010  Profile Subscription — Integrate real payment provider
☐ FARM-FIX-011  Profile Security — Implement 2FA via Supabase MFA
☐ FARM-FIX-012  Riwayat Mutasi / Konsentrat Product Detail — Replace CSS blur with <FeatureGate>
```

---

## Notes

- **FARM-FIX-007 and FARM-FIX-008** both address hardcoded hex color replacement but in different file sets. Recommended: schedule consecutively and perform as a single code sweep to avoid partial replacements.
- **FARM-FIX-010 and FARM-FIX-011** are blocked by external service decisions (payment provider, Supabase MFA). Schedule only after those architecture decisions are made.
- **FARM-FIX-009** (Reproduksi monolith) should not be started while any Reproduksi sub-module is under active development.
