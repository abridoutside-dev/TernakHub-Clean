# P0-003A: Admin Dashboard Audit Report

Generated: 2026-07-21  
Scope: Dashboard Admin only — `src/pages/admin/` + `src/data/admin*`

---

## 1. Widget Audit

### AdminDashboard.tsx — Widget Classification

| Widget | Klasifikasi | Sumber Data | Catatan |
|---|---|---|---|
| **AdminHeader** | ✅ Production Ready | Supabase Auth | `adminName` dari `currentUser.user_metadata.full_name \|\| email`; env dari `import.meta.env.MODE` |
| **PlatformSummary** (8 stat cards) | ✅ Production Ready | Supabase | Live `COUNT(*)` query per tabel via `fetchCount()`; returns 0 jika tabel belum ada |
| **SystemHealth — Supabase DB** | ✅ Production Ready | Supabase | Real latency ping ke `platform_config`; latency threshold 1000ms → Degraded |
| **SystemHealth — Object Storage** | ⚠️ Placeholder | Hardcoded | Status selalu `Unknown`, label "Belum dikonfigurasi" |
| **SystemHealth — Message Queue** | ⚠️ Placeholder | Hardcoded | Status selalu `Unknown`, label "Belum dikonfigurasi" |
| **SystemHealth — AI Service** | ⚠️ Placeholder | Hardcoded | Status selalu `Unknown`, label "Belum dikonfigurasi" |
| **QuickActions** (10 tombol) | ✅ Production Ready | Static Config | Semua navigate ke route admin yang ada |
| **RecentActivities** | 🔲 Coming Soon | — | Empty state; tabel `activity_log` belum ada di Supabase |
| **PlatformStatistics** | 🔲 Coming Soon | — | Empty state; tabel statistik historis belum ada |

### AdminTopBar.tsx — Widget Classification

| Widget | Klasifikasi | Catatan |
|---|---|---|
| **Search bar** | ✅ Production Ready | Navigasi ke `/admin/search?q=...` on Enter |
| **Environment badge** | ✅ Production Ready | Real `import.meta.env.MODE` |
| **Notifications bell** | ⚠️ Placeholder | `notifications = []` hardcoded; `unreadCount = 0`; badge tidak pernah muncul |
| **"Mark Read" / "Mark All Read"** | ⚠️ No-op | `handleMarkRead` dan `handleMarkAllRead` adalah empty functions |
| **"Admin Profile" menu item** | ⚠️ No-op | Action hanya memanggil `onClose()` — tidak navigasi ke halaman profile |
| **"Platform Settings" menu item** | ✅ Production Ready | Navigate ke `/admin/settings` |
| **"Back to Dashboard" menu item** | ✅ Production Ready | Navigate ke `/admin` |
| **"Back to Workspace" menu item** | ✅ Production Ready | Navigate ke `/` |
| **Logout** | ✅ Production Ready | Memanggil `signOut()` dari AuthContext |

### AdminSidebar.tsx — Widget Classification

| Widget | Klasifikasi | Catatan |
|---|---|---|
| **Navigation tree** | ✅ Production Ready | Semua 23 menu item navigate ke route yang terdaftar |
| **Version string** | ⚠️ Hardcoded | `"v1.4.2 · 2026-07-18"` — tidak dinamis |
| **Region string** | ⚠️ Hardcoded | `"Asia-Pacific (Jakarta)"` — tidak dinamis |
| **Collapse/Expand toggle** | ✅ Production Ready | Functional |

### AdminGuard.tsx

| Komponen | Klasifikasi | Catatan |
|---|---|---|
| **Auth check** | ✅ Production Ready | Supabase session + `system_admin` role check di `user_metadata` |
| **DEV_ADMIN_KEY bypass** | ✅ Safe (Dev Only) | Gated oleh `import.meta.env.DEV` → excluded dari production build |

---

## 2. Statistik — Sumber Data

### PlatformSummary — 8 Stat Cards

| Stat | Key | Tabel Supabase | Klasifikasi |
|---|---|---|---|
| Total Users | `users` | `profiles` | **Supabase** |
| Total Workspaces | `workspaces` | `workspaces` | **Supabase** |
| Total Livestock | `livestock` | `livestock` | **Supabase** (tabel belum ada → 0) |
| Marketplace Listings | `listings` | `marketplace_listings` | **Supabase** (tabel belum ada → 0) |
| Total Transactions | `transactions` | `transactions` | **Supabase** (tabel belum ada → 0) |
| Active Subscriptions | `subscriptions` | `subscriptions` | **Supabase** (tabel belum ada → 0) |
| Total Reports | `reports` | `reports` | **Supabase** (tabel belum ada → 0) |
| Pending Verifications | `verifications` | `trust_verifications` | **Supabase** (tabel belum ada → 0) |

> Catatan: Dari 8 stat cards, hanya `profiles` dan `workspaces` yang tabelnya sudah ada di Supabase. 6 lainnya menampilkan 0 karena tabelnya belum dibuat.

### Module-level Statistics

| Module | Sumber Statistik | Klasifikasi |
|---|---|---|
| UsersModule | Supabase `profiles` | **Supabase** |
| WorkspacesModule | Supabase `workspaces` | **Supabase** |
| MarketplaceModule | Supabase `marketplace_listings` | **Supabase** |
| MasterEscrowModule | `masterEscrowData.ts` (local store) | **Local Store / Seed** |
| SettingsModule | `adminSettingsData.ts` | **Dummy** — file menyatakan "Realistic dummy data only. No production database." |
| ActivityCenterModule | Hardcoded `0` | **Hardcoded** |
| AnnouncementsModule | Hardcoded `0` | **Hardcoded** |
| BackupModule | Hardcoded `0` | **Hardcoded** |
| CrossWorkspaceLineageModule | `"—"` | **Hardcoded** |
| DataMasterModule | Hardcoded `0` | **Hardcoded** |
| EscrowModule | `"—"` | **Hardcoded** |
| FeedModule | `"—"` | **Hardcoded** |
| GlobalSearchModule | — | **Hardcoded** (no results) |
| LivestockModule | `"—"` | **Hardcoded** |
| MedicineModule | `"—"` | **Hardcoded** |
| MonitoringModule | `"—"` / `0` | **Hardcoded** |
| NotificationsModule | Hardcoded `0` | **Hardcoded** |
| OwnershipTransferModule | `"—"` | **Hardcoded** |
| RelationshipModule | `"—"` | **Hardcoded** |
| ReportsModule | Hardcoded `0` | **Hardcoded** |
| SubscriptionModule | `"—"` | **Hardcoded** |
| TrustModule | `"—"` | **Hardcoded** |

---

## 3. Quick Actions

| Key | Label | Route | Status |
|---|---|---|---|
| `users` | Users | `/admin/users` | ✅ Berfungsi |
| `workspaces` | Workspaces | `/admin/workspaces` | ✅ Berfungsi |
| `marketplace` | Marketplace | `/admin/marketplace` | ✅ Berfungsi |
| `livestock` | Livestock | `/admin/livestock` | ✅ Berfungsi |
| `feed` | Feed | `/admin/feed` | ✅ Berfungsi |
| `medicine` | Medicine | `/admin/medicine` | ✅ Berfungsi |
| `subscription` | Subscription | `/admin/subscription` | ✅ Berfungsi |
| `announcement` | Announcements | `/admin/announcements` | ✅ Berfungsi |
| `monitoring` | Monitoring | `/admin/monitoring` | ✅ Berfungsi |
| `reports` | Reports | `/admin/reports` | ✅ Berfungsi |

> Semua 10 Quick Actions berfungsi penuh — navigate ke route yang terdaftar.

---

## 4. Charts

| Module | Chart | Klasifikasi | Sumber |
|---|---|---|---|
| **PlatformStatistics** (Dashboard) | "Growth trends" | 🔲 Placeholder | Empty state — "Grafik pertumbuhan akan muncul setelah tabel statistik tersedia di Supabase" |
| **MonitoringModule** | "Activity Charts" | 🔲 Placeholder | Empty state — "Chart data belum tersedia"; backend integration pending |

> Tidak ada chart yang menggunakan real data. Semua chart adalah placeholder.

---

## 5. Menu Dashboard Admin

### Sidebar Navigation Tree (23 item)

| Key | Label | Path | Klasifikasi |
|---|---|---|---|
| `dashboard` | Dashboard | `/admin` | **Production** |
| `activity` | Activity Center | `/admin/activity` | **Production** (module ready, data pending) |
| `search` | Global Search | `/admin/search` | **Production** (module ready, data pending) |
| `users` | Users | `/admin/users` | **Production** |
| `workspaces` | Workspaces | `/admin/workspaces` | **Production** |
| `marketplace` | Marketplace | `/admin/marketplace` | **Production** |
| `ownership-transfer` | Ownership Transfer | `/admin/ownership-transfer` | **Production** (module ready, data pending) |
| `relationships` | Relationships | `/admin/relationships` | **Production** (module ready, data pending) |
| `escrow` | Escrow | `/admin/escrow` | **Production** (module ready, data pending) |
| `master-escrow` | Master Escrow | `/admin/master-escrow` | **Production** |
| `livestock` | Livestock | `/admin/livestock` | **Production** (module ready, data pending) |
| `lineage` | Cross-WS Lineage | `/admin/lineage` | **Production** (module ready, data pending) |
| `feed` | Feed | `/admin/feed` | **Production** (module ready, data pending) |
| `medicine` | Medicine | `/admin/medicine` | **Production** (module ready, data pending) |
| `subscription` | Subscription | `/admin/subscription` | **Production** (module ready, data pending) |
| `trust` | Trust & Verification | `/admin/trust` | **Production** (module ready, data pending) |
| `announcements` | Announcements | `/admin/announcements` | **Production** (module ready, data pending) |
| `notifications` | Notifications | `/admin/notifications` | **Production** (module ready, data pending) |
| `reports` | Reports | `/admin/reports` | **Production** (module ready, data pending) |
| `monitoring` | Monitoring | `/admin/monitoring` | **Production** (module ready, data pending) |
| `data_master` | Data Master | `/admin/data-master` | **Production** (module ready, data pending) |
| `settings` | Settings | `/admin/settings` | **Production** (dummy data) |

> Tidak ada menu item khusus Development atau Internal tersembunyi di sidebar.  
> AdminGuard memiliki DEV bypass via localStorage, tapi itu tidak terlihat di sidebar — hanya aktif di dev build.

---

## 6. Daftar Lengkap

### ✅ Production Ready
- `AdminHeader` — env badge, admin name dari Supabase auth
- `PlatformSummary` — 8 stat cards, live Supabase COUNT
- `SystemHealth` — Supabase DB panel dengan real latency
- `QuickActions` — 10 tombol, semua navigate ke real routes
- `AdminTopBar` — search, env badge, logout, navigation
- `AdminSidebar` — full navigation tree functional
- `AdminGuard` — real auth + role check
- `UsersModule` — Supabase `profiles`
- `WorkspacesModule` — Supabase `workspaces`
- `MarketplaceModule` — Supabase `marketplace_listings`
- `MasterEscrowModule` — local store, full CRUD

### 🔲 Placeholder / Coming Soon
- `RecentActivities` — tabel `activity_log` belum ada di Supabase
- `PlatformStatistics` chart — tabel historis belum ada
- `SystemHealth` — Object Storage, Message Queue, AI Service (3 panel)
- `NotificationsModule` — data pending backend
- `AnnouncementsModule` — data pending backend
- `BackupModule` — data pending backend
- `MonitoringModule` charts — data pending backend
- `ActivityCenterModule` — data pending backend
- `CrossWorkspaceLineageModule` — data pending backend
- `DataMasterModule` — data pending backend
- `EscrowModule` — data pending backend
- `FeedModule` — data pending backend
- `GlobalSearchModule` — backend integration pending
- `LivestockModule` — data pending backend
- `MedicineModule` — data pending backend
- `OwnershipTransferModule` — data pending backend
- `RelationshipModule` — data pending backend
- `ReportsModule` — data pending backend
- `SubscriptionModule` — data pending backend
- `TrustModule` — data pending backend
- `AdminSubPagePlaceholder` — seluruh halaman adalah placeholder

### 🟡 Dummy / Seed
- `SettingsModule` — menggunakan `adminSettingsData.ts` ("Realistic dummy data only. No production database, no external API.")

### ⚠️ Hardcoded
- `AdminSidebar` version — `"v1.4.2 · 2026-07-18"` (static string)
- `AdminSidebar` region — `"Asia-Pacific (Jakarta)"` (static string)
- 6 dari 8 PlatformSummary stats — menampilkan 0 karena Supabase tables belum dibuat
- `ActivityCenterModule` stats — hardcoded `0`
- `AnnouncementsModule` stats — hardcoded `0`
- `BackupModule` stats — hardcoded `0`
- `NotificationsModule` stats — hardcoded `0`
- `ReportsModule` stats — hardcoded `0`

### 🔴 Disabled / No-op
- `AnnouncementsModule` → "+ Buat Pengumuman" — disabled (cursor: not-allowed)
- `BackupModule` → semua action buttons (Backup Manual, Backup Full System, dll.) — disabled
- `DataMasterModule` → "+ Tambah Entri" — disabled
- `MarketplaceModule` → "Hide Listing", "Verify Listing", "Remove Listing" — disabled
- `NotificationsModule` → "Tandai Semua Dibaca" — disabled
- `ReportsModule` → "+ Generate Laporan" — disabled
- `SettingsModule` → "Lihat", "Edit Nilai", "Restore Default" — disabled
- `UsersModule` → "Suspend", "Verify", dll. — disabled
- `WorkspacesModule` → "Suspend", "Archive", "Transfer Ownership" — disabled
- `AdminTopBar` → "Mark Read" / "Mark All Read" — no-op functions
- `AdminTopBar` → "Admin Profile" menu item — no-op (hanya close dropdown)

---

## 7. Prioritas Cleanup

### TINGGI — Blokir production utility
| # | Item | Alasan |
|---|---|---|
| 1 | **Notifications di AdminTopBar** | Selalu empty dan no-op — misleading bagi admin |
| 2 | **RecentActivities** | Core admin visibility tool, perlu `activity_log` table di Supabase |
| 3 | **SettingsModule dummy data** | `adminSettingsData.ts` eksplisit menyatakan "Realistic dummy data only" |
| 4 | **PlatformSummary: 6 stats menunjukkan 0** | Perlu 6 Supabase tabel (livestock, marketplace_listings, transactions, subscriptions, reports, trust_verifications) |

### MENENGAH — Fungsionalitas terbatas
| # | Item | Alasan |
|---|---|---|
| 5 | **AnnouncementsModule create button disabled** | Admin tidak bisa membuat pengumuman |
| 6 | **BackupModule semua buttons disabled** | Seluruh modul non-functional |
| 7 | **SystemHealth non-Supabase panels** | 3 panel selalu "Unknown" |
| 8 | **MonitoringModule charts** | Placeholder, tidak ada data |
| 9 | **"Admin Profile" no-op** | Profile page belum ada |

### RENDAH — Cosmetic / minor
| # | Item | Alasan |
|---|---|---|
| 10 | **Sidebar version hardcoded** | Harus dinamis dari build info atau platform_config |
| 11 | **Sidebar region hardcoded** | Harus dari platform_config |
| 12 | **6 Supabase tables returning 0** | Tabel belum dibuat, tampilan 0 sudah graceful |

### DEFERRED — Butuh Supabase schema baru
Seluruh 16 modul berikut menunggu Supabase tables yang belum dibuat:
ActivityCenter, CrossWorkspaceLineage, DataMaster, Escrow, Feed, GlobalSearch,  
Livestock, Medicine, Notifications, OwnershipTransfer, Relationship, Reports,  
Subscription, Trust, Announcements, Backup
