# P0-001A — Audit Workspace Migration Readiness

**Tanggal Audit:** 2026-07-21
**Branch:** `feature/production-readiness`
**Auditor:** Agent (read-only, tidak ada perubahan source code)
**Scope:** Modul Workspace — seluruh alur dari Create hingga Storage

---

## Ringkasan

Modul Workspace **sepenuhnya menggunakan in-memory storage**. Tidak ada satu pun pemanggilan Supabase untuk operasi CRUD Workspace. Data hilang setiap kali halaman di-refresh. Seluruh data seed menggunakan shorthand ID (`w1`–`w6`) dan satu placeholder `owner_user_uuid` yang sama untuk semua record.

Terdapat **tiga data store terpisah** yang merepresentasikan entitas "Workspace" secara paralel tanpa sinkronisasi, dengan schema dan sistem tipe yang berbeda-beda. Ini adalah blocker utama migrasi.

**Status keseluruhan: BELUM SIAP MIGRASI** — 9 blocker teridentifikasi.

---

## Diagram Alur

```
WorkspaceCreate (src/pages/auth/WorkspaceCreate.tsx)
        │
        │  createWorkspace(input)
        ▼
WorkspaceService (src/services/workspaceService.ts)
        │  validateCreate() → validateUpdate() → validateDelete()
        │  Re-exports semua read helpers ke konsumen
        │
        │  insertWorkspace() / patchWorkspace() / deleteWorkspace()
        ▼
WorkspaceRepository (src/data/workspaceFoundationData.ts)
        │  WORKSPACE_DB = let array (module-level, in-memory)
        │  Seed: 6 records (w1–w6), owner = SEED_OWNER_UUID
        │
        ├─── sessionStorage  ← hanya menyimpan active_workspace_uuid
        ├─── localStorage    ← hanya menyimpan recent_workspace_uuids (max 5)
        └─── [TIDAK ADA]     ← Supabase / database / localStorage untuk data record

WorkspaceContext (src/contexts/WorkspaceContext.tsx)
        │  React state layer, wraps WorkspaceProvider di src/main.tsx
        │  Memanggil getAllWorkspaces() dari service layer
        │  saveWorkspace() → updateWorkspace() → patchWorkspace() → WORKSPACE_DB
        ▼
Konsumen (pages, components, other services)
        │  useWorkspace() hook
        │  activeWorkspace, workspaces, setActiveWorkspaceUuid, saveWorkspace

── JALUR PARALEL (tidak sinkron dengan alur di atas) ──────────────────────────

workspaceManagementData.ts   ← Profile module, schema berbeda, Bahasa Indonesia
        │  WORKSPACE_MANAGEMENT_LIST (let array, in-memory)
        │  WORKSPACE_MEMBER_LIST (let array, in-memory)
        └─── tidak terhubung ke workspaceFoundationData.ts

adminWorkspacesData.ts       ← Admin panel, schema berbeda, 20 dummy records
        └─── tidak terhubung ke workspaceFoundationData.ts
```

---

## Daftar File

| File | Fungsi | Storage | Status | Catatan |
|------|--------|---------|--------|---------|
| `src/types/workspace.ts` | Domain types: `WorkspaceRecord`, `WorkspaceType`, `WorkspaceStatus`, `WorkspacePlan`, input/DTO types, konstanta | — | ✅ Siap | Schema sudah dirancang untuk Supabase (`owner_user_uuid` = Supabase Auth UID). Bisa digunakan langsung saat migrasi. |
| `src/data/workspaceFoundationData.ts` | Repository layer, SSOT in-memory `WORKSPACE_DB`, fungsi CRUD: `insertWorkspace`, `patchWorkspace`, `deleteWorkspace`, query helpers | **In-Memory** (`let WORKSPACE_DB[]`) | 🔴 Blocker | 6 seed record (w1–w6), semua `owner_user_uuid = SEED_OWNER_UUID`. Data hilang saat refresh. ID bukan UUID v4. |
| `src/services/workspaceService.ts` | Business logic, validasi, re-export read helpers. `createWorkspace()`, `updateWorkspace()`, `deleteWorkspace()`, `generateUniqueSlug()` | Proxy ke repository | ✅ Siap (arsitektur) | Arsitektur sudah benar (service layer). Perlu adapter untuk Supabase di bawahnya. Tidak ada import React/UI. |
| `src/contexts/WorkspaceContext.tsx` | React state layer, `WorkspaceProvider`, `useWorkspace()` hook. Menyimpan active workspace di sessionStorage. | **sessionStorage** (UUID saja) + in-memory state | 🟡 Partial | sessionStorage hanya menyimpan UUID, bukan data. Perlu async loading saat data berasal dari Supabase. `isLoading` state sudah ada tapi saat ini sinkron. |
| `src/utils/recentWorkspaces.ts` | Melacak UUID workspace yang baru-baru ini diakses di localStorage (max 5 entri) | **localStorage** (UUID list saja) | ✅ Siap | Tidak menyimpan data workspace, hanya UUID. Aman dipertahankan saat migrasi. |
| `src/data/workspaceMembersData.ts` | Repository in-memory untuk anggota workspace. `MEMBERS_DB`, `getMembersByWorkspace()`, `addMember()`, `updateMember()`, `removeMember()` | **In-Memory** (`let MEMBERS_DB[]`) | 🔴 Blocker | `user_id` = Supabase Auth UID (placeholder). Tidak ada flow invitation/signup yang menghubungkan user nyata. Seed menggunakan placeholder UUID `00000000-…-000X`. |
| `src/data/workspaceSubscriptionData.ts` | In-memory subscription state, plan config, feature gates, history. `hasFeature()`, `requestPlanChange()`. Import `patchWorkspace` dari workspaceFoundationData. | **In-Memory** | 🔴 Blocker | Langsung import dari repository (melewati service layer untuk `patchWorkspace`). Belum ada tabel Supabase. Memerlukan tabel `workspace_subscriptions` terpisah. |
| `src/data/workspaceManagementData.ts` | **Data store duplikat** untuk modul Profile (PROFILE-002). `WORKSPACE_MANAGEMENT_LIST`, `WORKSPACE_MEMBER_LIST` terpisah. | **In-Memory** | 🔴 Blocker | Schema berbeda dari workspaceFoundationData.ts: field Bahasa Indonesia (`nama`, `jenis`, `status: 'Aktif'|'Arsip'`). Menyimpan data member sendiri. Tidak sinkron dengan WORKSPACE_DB. |
| `src/data/adminWorkspacesData.ts` | **Data store ketiga** untuk Admin panel (ADM-004). 20 dummy workspace records. Schema lain lagi. | **In-Memory** (dummy) | 🔴 Blocker | `WorkspaceStatus: 'Active'|'Suspended'|'Archived'`, `WorkspacePlanTier` tambah 'Basic'. Tidak terhubung ke dua store lainnya. Hanya untuk tampilan admin. |
| `src/pages/auth/WorkspaceCreate.tsx` | Form pembuatan workspace baru. Memanggil `createWorkspace()` dari service. | — | 🟡 Partial | Fallback: `currentUser?.id ?? '00000000-…-0001'`. Harus dihapus saat auth wajib. |
| `src/pages/auth/WorkspaceSelect.tsx` | Halaman pemilihan workspace aktif. | — | 🟡 Partial | Fallback UUID placeholder sama. Filter by `owner_user_uuid` bergantung pada auth. |
| `src/pages/WorkspaceSettingsProfile.tsx` | Edit profil workspace. `saveWorkspace()` via context. | — | 🟡 Partial | Perubahan hanya ke WORKSPACE_DB in-memory. |
| `src/pages/WorkspaceSettingsMembers.tsx` | Manajemen anggota workspace. Baca/tulis ke `workspaceMembersData.ts`. | — | 🟡 Partial | Fallback UUID placeholder. |
| `src/pages/WorkspaceSettingsArchive.tsx` | Arsip workspace. `saveWorkspace()` via context, status → `'Archived'`. | — | 🟡 Partial | Fallback UUID placeholder. |
| `src/pages/ProfileWorkspace.tsx` | Daftar workspace di modul Profile. Membaca dari dua sumber: `useWorkspace()` dan `workspaceManagementData.ts`. | — | 🔴 Blocker | Dual source, tidak sinkron. |
| `src/pages/ProfileWorkspaceDetail.tsx` | Detail workspace di Profile. | — | 🟡 Partial | Membaca dari `workspaceManagementData.ts`. |
| `src/pages/ProfileWorkspaceMembers.tsx` | Member workspace di Profile. | — | 🟡 Partial | Fallback UUID placeholder. |
| `src/main.tsx` | Entry point. `WorkspaceProvider` membungkus seluruh app di dalam `AuthProvider`. | — | ✅ Siap | Urutan: `AuthProvider > WorkspaceProvider`. Sudah benar. |
| `src/services/foundationBridge.ts` | Cross-service wiring. Menggunakan `workspace_uuid` sebagai foreign key di seluruh operasi (transaction, escrow, evidence, dll). | — | 🟡 Partial | Bergantung pada workspace_uuid yang valid. Jika UUID berubah (w1→real UUID), semua referensi di foundation services ikut terpengaruh. |

---

## Dependency

```
src/main.tsx
  └── WorkspaceProvider (WorkspaceContext.tsx)
        └── getAllWorkspaces() (workspaceService.ts)
              └── workspaceFoundationData.ts [WORKSPACE_DB]

WorkspaceCreate.tsx
  └── createWorkspace() (workspaceService.ts)
        ├── validateCreate()
        └── insertWorkspace() (workspaceFoundationData.ts)

WorkspaceSettingsProfile.tsx / WorkspaceSettingsArchive.tsx
  └── saveWorkspace() (WorkspaceContext.tsx)
        └── updateWorkspace() (workspaceService.ts)
              └── patchWorkspace() (workspaceFoundationData.ts)

workspaceSubscriptionData.ts
  └── patchWorkspace() (workspaceFoundationData.ts)  ← bypass service layer

workspaceManagementData.ts
  └── [standalone] ← tidak ada dependency ke workspaceFoundationData.ts

adminWorkspacesData.ts
  └── [standalone] ← tidak ada dependency ke workspaceFoundationData.ts

workspaceMembersData.ts
  └── [standalone] ← tidak ada dependency ke workspaceService.ts

foundationBridge.ts (dan seluruh global*Service.ts)
  └── menggunakan workspace_uuid sebagai actor/target FK
        └── bergantung pada w1–w6 sebagai valid UUID di seed data
```

**Downstream dependencies yang menggunakan `workspace_uuid` w1–w6 (foreign key):**
- `src/data/globalTransactionData.ts`
- `src/data/globalEscrowData.ts`
- `src/data/globalConversationData.ts`
- `src/data/globalNotificationData.ts`
- `src/data/globalActivityData.ts`
- `src/data/globalAuditTrailData.ts`
- `src/data/globalEvidenceData.ts`
- `src/data/marketplaceListingData.ts`
- `src/data/marketplaceTransaksiData.ts`
- `src/data/livestockData.ts`
- `src/data/mutasiData.ts`
- *(dan puluhan file data lainnya)*

---

## Blocker

### B1 — Tiga Data Store Terpisah (Kritis)
`workspaceFoundationData.ts` (WS-001), `workspaceManagementData.ts` (PROFILE-002), dan `adminWorkspacesData.ts` (ADM-004) masing-masing menyimpan representasi workspace yang berbeda, tidak sinkron, dan memiliki schema berbeda. Tidak ada single source of truth di lapisan data.

### B2 — Primary Key Bukan UUID v4 (Kritis)
Semua 6 seed workspace menggunakan shorthand ID (`w1`–`w6`) bukan UUID v4. ID ini tersebar di seluruh codebase sebagai foreign key di livestock, batch, marketplace, transaksi, escrow, notifikasi, dll. Migrasi ke UUID v4 memerlukan audit dan replace seluruh codebase sebelum data bisa masuk ke Supabase dengan integritas referensial.

### B3 — Placeholder `owner_user_uuid` (Kritis)
Semua 6 seed record menggunakan `owner_user_uuid = '00000000-0000-0000-0000-000000000001'`. Halaman-halaman fallback ke nilai ini saat auth belum aktif (`currentUser?.id ?? '00000000-…-0001'`). RLS Supabase tidak bisa di-enforce selama placeholder ini digunakan.

File yang perlu diubah saat auth aktif:
- `src/pages/auth/WorkspaceCreate.tsx` (baris 207)
- `src/pages/auth/WorkspaceSelect.tsx` (baris 269)
- `src/pages/ProfileWorkspace.tsx` (baris 495)
- `src/pages/ProfileWorkspaceMembers.tsx` (baris 228)
- `src/pages/WorkspaceSettingsArchive.tsx` (baris 301)
- `src/pages/WorkspaceSettingsMembers.tsx` (baris 384)

### B4 — Tidak Ada Tabel Supabase (Kritis)
Tidak ada tabel `workspaces` di Supabase. Direktori `supabase/` ada tapi tidak berisi migration untuk workspace. Tidak ada schema, tidak ada RLS policies, tidak ada fungsi Postgres untuk workspace.

### B5 — Semua Data Hilang Saat Refresh (Kritis)
`WORKSPACE_DB` adalah `let` array di module scope. Workspace yang dibuat atau dimodifikasi selama sesi akan hilang ketika halaman di-refresh. Hanya UUID aktif yang bertahan (sessionStorage) dan daftar UUID recent (localStorage), bukan data record-nya.

### B6 — Schema Divergence Antar Store (Tinggi)
| Field | workspaceFoundationData.ts | workspaceManagementData.ts | adminWorkspacesData.ts |
|-------|---------------------------|---------------------------|------------------------|
| Status | `'Active'|'Inactive'|'Archived'` | `'Aktif'|'Arsip'` | `'Active'|'Suspended'|'Archived'` |
| Plan | `'Free'|'Pro'|'Enterprise'` | `MembershipTier` (dari profileData.ts) | `'Free'|'Basic'|'Pro'|'Enterprise'` |
| PK field | `workspace_uuid` | `id` | `id` |
| Type field | `workspace_type` (`WorkspaceType`) | `jenis` (`WorkspaceJenis`) | `type` (`WsType`) |

Tidak ada adapter atau konversi antara ketiga store ini.

### B7 — Members Tidak Terhubung ke Auth (Tinggi)
`workspaceMembersData.ts` menyimpan `user_id` (Supabase Auth UID) tapi semua seed menggunakan placeholder UUID. Tidak ada invitation flow, tidak ada endpoint untuk menghubungkan user yang mendaftar ke workspace. `workspaceManagementData.ts` juga memiliki daftar member sendiri yang terpisah.

### B8 — `workspaceSubscriptionData.ts` Bypass Service Layer (Sedang)
`workspaceSubscriptionData.ts` mengimpor `patchWorkspace` langsung dari `workspaceFoundationData.ts` (repository), bukan dari `workspaceService.ts`. Ini melanggar aturan arsitektur yang ditetapkan di workspaceService.ts: *"Never import the repository directly"*. Saat migrasi, jika repository diganti dengan Supabase client, subscription data harus ikut diubah.

### B9 — Tidak Ada Error Handling Async (Sedang)
Seluruh operasi saat ini sinkron (karena in-memory). `WorkspaceContext.tsx` sudah memiliki `isLoading` state dan `saveWorkspace` sudah `async`, namun implementasinya sinkron. Saat data berasal dari Supabase, semua operasi CRUD harus di-handle secara async dengan proper error state. UI pages belum memiliki loading/error state untuk operasi workspace.

---

## Risiko Migrasi

| Risiko | Tingkat | Dampak |
|--------|---------|--------|
| ID `w1`–`w6` digunakan sebagai FK di seluruh codebase (livestock, marketplace, transaksi, escrow, dll) | **Kritis** | Migrasi satu tabel saja tidak cukup; semua modul downstream harus dimigrasikan serentak atau ada bridge layer |
| Tiga store dengan schema berbeda harus dikonsolidasi sebelum migrasi | **Kritis** | Jika hanya satu store yang dimigrasikan, dua lainnya masih in-memory dan UI akan menampilkan data lama |
| Placeholder `owner_user_uuid` akan menyebabkan RLS violation di Supabase | **Kritis** | Semua query akan gagal jika RLS aktif dan user belum login |
| Hilangnya data seed saat Supabase aktif | **Tinggi** | Seluruh modul downstream (livestock, pakan, kesehatan) bergantung pada `w1`–`w6`. Seed Supabase harus menyertakan semua modul downstream secara bersamaan |
| Race condition saat context load | **Sedang** | WorkspaceContext saat ini sinkron. Saat async, komponen yang mount sebelum data tersedia akan mendapat `activeWorkspace = null` |
| Slug uniqueness check tidak aman secara concurrent | **Sedang** | `isSlugTaken()` membaca array in-memory; di Supabase harus menggunakan UNIQUE constraint di DB + error handling |
| `workspaceSubscriptionData.ts` mengubah `workspace_plan` langsung di `WORKSPACE_DB` | **Sedang** | Saat migrasi, `patchWorkspace` harus di-redirect ke Supabase UPDATE; jika tidak, plan di DB tidak terupdate |

---

## Rekomendasi Langkah P0-001B

### Prioritas 1 — Konsolidasi Data Store (Pra-syarat semua langkah berikutnya)
Pilih `workspaceFoundationData.ts` (WS-001) sebagai satu-satunya SSOT. Hapus atau refactor `workspaceManagementData.ts` dan `adminWorkspacesData.ts` agar membaca dari store yang sama. Tanpa langkah ini, migrasi ke Supabase akan menghasilkan partial migration.

**File yang harus diubah:**
- `src/data/workspaceManagementData.ts` — refactor ke adapter dari workspaceFoundationData
- `src/data/adminWorkspacesData.ts` — refactor ke adapter dari workspaceFoundationData
- `src/pages/ProfileWorkspace.tsx` — hapus dual-source, gunakan `useWorkspace()`
- `src/pages/ProfileWorkspaceDetail.tsx` — redirect ke workspaceService

### Prioritas 2 — Rancang Schema Supabase
Buat schema tabel berdasarkan `WorkspaceRecord` di `src/types/workspace.ts` (sudah paling siap). Tambahkan:
- Tabel `workspaces` — sesuaikan kolom dengan `WorkspaceRecord`
- Tabel `workspace_members` — berdasarkan `WorkspaceMemberRecord` di `workspaceMembersData.ts`
- Tabel `workspace_subscriptions` — berdasarkan `WorkspaceSubscriptionRecord` di `workspaceSubscriptionData.ts`
- RLS policies: owner dapat membaca dan menulis workspace sendiri; member dapat membaca
- UNIQUE constraint pada `workspace_slug`

### Prioritas 3 — Resolusi ID w1–w6
Tetapkan strategi: apakah seed data production menggunakan UUID v4 baru (dan seluruh downstream seed ikut diupdate), atau ada bridge mapping. Ini adalah pekerjaan terbesar karena menyentuh semua modul.

**Estimasi file yang terdampak:** 80+ file data di `src/data/`

### Prioritas 4 — Hapus Fallback Placeholder UUID
Setelah auth wajib ditegakkan, hapus semua `?? '00000000-0000-0000-0000-000000000001'` di 6 file halaman. Ganti dengan redirect ke halaman login jika user belum autentikasi.

### Prioritas 5 — Async WorkspaceContext
Ubah `loadWorkspaces()` di `WorkspaceContext.tsx` menjadi async dengan proper loading/error state. Semua konsumen (`useWorkspace()`) perlu menangani `isLoading` sebelum merender data.

### Prioritas 6 — Fix Bypass di workspaceSubscriptionData.ts
Routing `patchWorkspace` dari subscription harus melalui `workspaceService.ts`, bukan langsung ke repository.

---

## Lampiran — Statistik

| Metrik | Nilai |
|--------|-------|
| Jumlah file inti Workspace | 5 (types, data, service, context, utils) |
| Jumlah data store paralel | 3 (Foundation, Management, Admin) |
| Jumlah seed workspace records | 6 (w1–w6) |
| Jumlah halaman yang menggunakan workspace | 11 |
| Jumlah file data downstream dengan FK workspace | 80+ |
| Jumlah lokasi fallback placeholder UUID | 6 |
| Panggilan Supabase untuk workspace CRUD | 0 |
| Tabel Supabase workspace yang ada | 0 |
| Blocker yang diidentifikasi | 9 |
