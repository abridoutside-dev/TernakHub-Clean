# MARKETPLACE-001 — Review & Fix Findings

## Status: PASS (MARKETPLACE-FIX-001 complete)

---

## Phase 1 — RECALL Audit In-Scope Fixes

### Changes Made (in-scope fixes from MARKETPLACE-001 RECALL)

| # | File | Change | Finding |
|---|------|--------|---------|
| 1 | `src/pages/Marketplace.tsx` | Added `useAuth` import; guest auth-check on `handleToggleFav` | F-001 / guest wishlist redirect |
| 2 | `src/pages/MarketplaceDetailListing.tsx` | Consolidated duplicate `getAllListing` import | F-001 / dead duplicate import |
| 3 | `src/pages/MarketplaceDetailListing.tsx` | Added guest auth-check before `getOrCreateChat()` in "Hubungi Penjual" | F-004 / guest chat creation |
| 4 | `src/pages/auth/Login.tsx` | Guest entry block: heading + "Lanjut sebagai Guest" outline button → `/marketplace` | PLATFORM-001A |

### Acceptance Criteria

| Criterion | Result |
|-----------|--------|
| Marketplace Core complete | ✅ Home / Detail / Wishlist / Riwayat all functional |
| Listing pages consistent | ✅ Consistent card layout, badge colours, price format, empty states |
| Search & Filter work | ✅ Debounced search + category chips on Home and Wishlist |
| Wishlist works | ✅ Add/remove, empty state, guest redirect to `/login` |
| Navigation consistent | ✅ All shortcut cards, back buttons, and breadcrumbs verified |
| No regression | ✅ `tsc --noEmit` clean; no console errors |
| No architecture changes | ✅ Targeted fixes only |
| Out-of-scope findings documented | ✅ See below |

---

## Phase 2 — MARKETPLACE-FIX-001 Implementation

### Changes Made

| # | File(s) | Change | Finding |
|---|---------|--------|---------|
| 1 | `src/components/TransactionTabBar.tsx` | Added `'detail'` to `TransactionTab` union (no tab highlighted) | F-019 |
| 2 | `src/pages/MarketplaceDetailTransaksi.tsx` | Imported + rendered `TransactionTabBar` with `activeTab="detail"` at bottom | F-019 |
| 3 | `src/pages/MarketplaceDashboardPembeli.tsx` | Fixed 2× `navigate('/marketplace')` → `navigate('/marketplace/wishlist')` in Wishlist QuickBtn and SectionHeader | F-024 |
| 4 | `src/data/marketplaceWorkspaceVerifikasiData.ts` | Added `submitVerifikasi(workspaceId)` mutation: 'Belum Diverifikasi' → 'Dalam Proses' | F-027 |
| 5 | `src/pages/MarketplaceVerifikasi.tsx` | Imported `useState` + `submitVerifikasi`; added `tick` re-render; added "📤 Ajukan Verifikasi" button + "Dalam Proses" info banner in Belum Diverifikasi block | F-026 |
| 6 | `src/pages/MarketplaceEscrowDetail.tsx` | Added `showReceiverConfirm` state; changed "Konfirmasi Dana Diterima" to 2-step flow (first click → confirmation panel, second click → `receiverConfirm()`) | FARM-FIX-005 |
| 7 | `src/pages/MarketplaceModerasiDetailKasus.tsx` | Imported `useAuth` + `getActiveWorkspace`; added `MODERATOR_WORKSPACE_IDS` constant; added 🔒 role restriction banner above `FormTindakan` for non-moderators | FARM-FIX-006 (part 1) |
| 8 | `src/components/dashboard/QuickAction.tsx` | Added `console.warn` to dead `modal`/`bottom-sheet` branch so developers can detect mis-configured action items | FARM-FIX-006 (part 2) |
| 9 | `src/data/marketplaceAsetWorkspaceData.ts` | Replaced hardcoded fallback workspace IDs (`'w4'`, `'w5'`, `'w6'`) with early `return []` when `workspaceId` is null — for Transportasi, DokterHewan, KlinikHewan branches | F-010 |
| 10 | `src/pages/MarketplaceChatList.tsx` | Added search input (🔍) filtering rooms by listing title or counterpart workspace name | F-016 |

### MARKETPLACE-FIX-001 Acceptance Criteria

| Criterion | Result |
|-----------|--------|
| F-019 TransactionTabBar visible on Detail Transaksi | ✅ Tabbar rendered with `activeTab="detail"` (no tab highlighted); user can navigate to all 6 transaction sub-pages |
| F-024 Wishlist navigation from DashboardPembeli | ✅ Both QuickBtn and SectionHeader action go to `/marketplace/wishlist` |
| F-026 "Ajukan Verifikasi" button present | ✅ Button triggers `submitVerifikasi()`, updates status to "Dalam Proses" inline |
| F-027 `submitVerifikasi()` exists in data layer | ✅ Implemented; status-guard (only 'Belum Diverifikasi' can submit); returns bool |
| FARM-FIX-005 receiverConfirm() confirmation step | ✅ 2-step flow: first click opens warning panel, second click executes irreversible action |
| FARM-FIX-006 Role guard on Moderasi form | ✅ 🔒 banner visible to non-moderators; `MODERATOR_WORKSPACE_IDS` constant documented |
| FARM-FIX-006 QuickAction dead code surfaced | ✅ `console.warn` added; action types flagged for future modal/sheet registry |
| F-010 No hardcoded workspace fallbacks | ✅ All 3 service branches return `[]` when `workspaceId` is null |
| F-016 ChatList search | ✅ Search input filters by listing title and counterpart workspace name |
| TypeScript clean | ✅ `tsc --noEmit` 0 errors after all changes |

---

## Out-of-Scope Findings (Cross-Module / Future Roadmap)

### FINDING-001 — "Bagikan" (Share) is a non-functional placeholder

**Location:** `MarketplaceDetailListing.tsx` (~line 451), `MarketplaceWishlist.tsx` (WishlistCard menu)

**Observation:** Share button is permanently `disabled`. Tooltip: "Fitur berbagi listing akan segera hadir".

**Assigned to:** Future **Share & Deep Link** module — requires URL scheme, deep-link strategy, and social-preview API.

---

### FINDING-002 — "Terdekat" sort mode is a no-op in Wishlist

**Location:** `src/pages/MarketplaceWishlist.tsx` line 96

**Observation:** Sort chip rendered disabled; returns array unsorted. Requires browser Geolocation + distance calculation against `listing.kabupaten`/`listing.provinsi`.

**Assigned to:** Future **Location & Proximity** module.

---

### FINDING-003 — Wishlist data auto-seeded with 3 random items on first access

**Location:** `src/data/marketplaceWishlistData.ts` — `ensureSeeded()` function

**Observation:** Any workspace that has never saved anything gets 3 pre-seeded listings. Confusing in production.

**Assigned to:** Future **Data Persistence (Supabase Migration)** — remove `ensureSeeded()` when real DB rows replace in-memory stores.

---

### FINDING-004 — Marketplace Home has no pagination / infinite scroll

**Location:** `src/pages/Marketplace.tsx` — listing grid renders all active listings at once

**Observation:** Wishlist and Riwayat use `usePaginatedList`; Home does not. Acceptable at current scale (11 seed listings).

**Assigned to:** Future **Marketplace Performance** phase.

---

### FINDING-005 — RiwayatAktivitas workspace fallback `'w1'`

**Location:** `src/pages/MarketplaceRiwayatAktivitas.tsx` line 434 — `const workspaceId = ws?.id ?? 'w1';`

**Observation:** If workspace context is lost for an authenticated user, page silently falls back to w1 data.

**Assigned to:** Future **Workspace Context Hardening** — add workspace-required guard at context level.

---

### FINDING-006 — onViewWorkspace in ChatRoom navigates to /marketplace instead of workspace profile

**Location:** `src/components/marketplace/ChatRoomHeader.tsx` — `onViewWorkspace` callback

**Observation:** No public workspace profile route exists yet. Navigation target is `/marketplace` as a placeholder.

**Assigned to:** Future **Public Workspace Profile** module — wire to `/workspace/:id/farm-profile` (or equivalent public route) once route exists and is publicly accessible.

---

### FINDING-007 — marketplacePesananData.ts has no UI page

**Location:** `src/data/marketplacePesananData.ts`

**Observation:** Data layer exists (Pesanan records with status machine) but no `/marketplace/pesanan` route or page is registered in `App.tsx`.

**Assigned to:** Future **Marketplace Pesanan Module** — build Pesanan list + detail pages wired to the existing data layer.

---

### FINDING-008 — RiwayatAktivitas detail navigation stays local (no deep-link to module pages)

**Location:** `src/pages/MarketplaceRiwayatAktivitas.tsx` — `DetailSheet` component (line 238)

**Observation:** Clicking an activity item opens a local bottom-sheet detail. There is no "Lihat di halaman asli" navigation link to the originating page (listing detail, transaction, escrow, etc.). This is common UX — acceptable by design for now.

**Assigned to:** Future **Riwayat Deep-Link** pass — add "Buka" navigation link per activity type once all target routes are stable.
