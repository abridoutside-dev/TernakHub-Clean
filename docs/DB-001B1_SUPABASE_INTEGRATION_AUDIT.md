# DB-001B-1 — Audit Integrasi Aplikasi ke Supabase Production

**Tanggal audit:** 2026-07-25  
**Scope:** source code `src/`, DB-001A migrations, konfigurasi Supabase, dan struktur production yang telah dibuat pada DB-001A.  
**Commit:** `DB-001B-1: Audit application integration with Supabase`

## 1. Ringkasan eksekutif

DB-001A production sudah memiliki schema final, tetapi aplikasi belum menjadi aplikasi Supabase-first. Dari audit source:

- Client Supabase sudah tersedia dan Auth sudah memakai Supabase.
- Workspace memiliki repository Supabase, tetapi repository tersebut masih memakai nama kolom dari schema lama dan tidak kompatibel dengan DB-001A.
- Platform initialization memakai `platform_config` DB-001A.
- News & Event mencoba memakai tabel `news_events`, sedangkan DB-001A menyediakan `news_publications`.
- Admin Users mencoba memakai tabel `profiles`, sedangkan DB-001A menyediakan `user_profiles` dan Supabase-owned `auth.users`.
- Admin Marketplace dan sebagian Admin Workspace melakukan `SELECT` langsung ke tabel production, tetapi belum menjadi data layer yang dipakai seluruh module.
- Hampir seluruh domain bisnis masih menggunakan `src/data/*` sebagai source of truth in-memory; sebagian memiliki persistence browser melalui `localStorage`.
- Tidak ada pemakaian `supabase.storage`, `supabase.rpc`, server-side service-role key, atau upload/delete/public URL pada source aplikasi.
- Tidak ada migration atau tabel baru yang dibuat dalam audit ini.

### Status keseluruhan

| Area | Status |
|---|---|
| Supabase client | **Partial / tersedia** |
| Auth | **Integrated** |
| Platform initialization | **Integrated, perlu RLS/role verification** |
| Workspace | **Blocked — schema column mismatch** |
| News & Event | **Blocked — table mismatch (`news_events` vs `news_publications`)** |
| Admin Users | **Blocked — table mismatch (`profiles` vs `user_profiles`)** |
| Admin Marketplace | **Partial — read-only query aktif** |
| Livestock | **Local-only** |
| Batch | **Local-only** |
| Health & Reproduction | **Local-only** |
| Feed & Stock | **Local-only** |
| Marketplace user flow | **Local-only** |
| Transaction / Escrow / Evidence | **Local-only** |
| Global foundation | **Local-only** |
| Storage | **Not integrated** |

Kesimpulan: aplikasi belum siap diperlakukan sebagai production client yang membaca dan menulis seluruh domain melalui DB-001A. Prioritas pertama bukan perubahan UI, melainkan menyelaraskan adapter data yang sudah ada dengan schema DB-001A lalu memindahkan source of truth domain secara bertahap.

---

## 2. Metode dan batasan audit

Audit dilakukan read-only terhadap aplikasi, kecuali file laporan ini.

Yang diperiksa:

1. Semua pemakaian `supabase.auth`, `.from()`, `.rpc()`, `.storage`, dan operasi data.
2. Semua pemakaian `localStorage`, `sessionStorage`, seed, `Map`, `Set`, dan data registry in-memory.
3. `src/pages`, `src/components`, `src/contexts`, `src/services`, `src/repositories`, dan `src/data`.
4. 14 migration DB-001A dan object model production yang telah diterapkan.
5. Environment/config yang dirujuk source.

Catatan penting:

- `localStorage` Supabase Auth untuk persistensi session bukan business-data store; tetap dicatat pada bagian Auth.
- `sessionStorage` untuk workspace aktif dan scroll position adalah state UI/navigation, bukan pengganti repository.
- Data seed dan local registry yang dipakai untuk menampilkan, membuat, mengubah, atau menghapus record bisnis diklasifikasikan sebagai source of truth lokal.
- Tidak ada perubahan UI, arsitektur Workspace, business logic, feature removal, atau migration pada audit ini.

---

## 3. Inventory integrasi Supabase yang ditemukan

Source aplikasi hanya memiliki pemakaian langsung Supabase pada file berikut:

| File | Area | Pemakaian |
|---|---|---|
| `src/lib/supabase.ts` | Client | `createClient`, env `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` |
| `src/contexts/AuthContext.tsx` | Auth | session restore, listener, login, signup, logout, reset password, refresh, resend, getUser |
| `src/services/platformInitService.ts` | Platform/Auth | `platform_config`, signup/signin/signout, session |
| `src/repositories/workspaceRepository.ts` | Workspace | CRUD `workspaces` |
| `src/services/newsEventService.ts` | News | read `news_events` |
| `src/pages/admin/AdminDashboard.tsx` | Admin dashboard | read `platform_config` |
| `src/pages/admin/modules/UsersModule.tsx` | Admin users | read/count `profiles` |
| `src/pages/admin/modules/UsersSubPages.tsx` | Admin users | read `profiles` |
| `src/pages/admin/modules/MarketplaceModule.tsx` | Admin marketplace | read/count `marketplace_listings` |
| `src/pages/admin/modules/WorkspacesModule.tsx` | Admin workspace | read/count `workspaces` |

Tidak ditemukan pada source aplikasi:

- `supabase.rpc(...)`
- `supabase.storage.from(...).upload(...)`
- `supabase.storage.from(...).remove(...)`
- `supabase.storage.from(...).getPublicUrl(...)`
- `supabase.functions.invoke(...)`
- service-role key
- server-side Supabase client
- realtime channel/subscription

---

## 4. Audit operasi Supabase

### 4.1 Auth operations

| Operasi | File | Status |
|---|---|---|
| `auth.getSession()` | `AuthContext.tsx`, `platformInitService.ts`, `Initialize.tsx` | Aktif |
| `auth.onAuthStateChange()` | `AuthContext.tsx`, `Initialize.tsx`, `ResetPassword.tsx` | Aktif |
| `auth.signInWithPassword()` | `AuthContext.tsx`, `platformInitService.ts` | Aktif |
| `auth.signUp()` | `AuthContext.tsx`, `platformInitService.ts` | Aktif |
| `auth.signOut()` | `AuthContext.tsx`, `platformInitService.ts`, `ResetPassword.tsx` | Aktif |
| `auth.resetPasswordForEmail()` | `AuthContext.tsx` | Aktif |
| `auth.refreshSession()` | `AuthContext.tsx` | Aktif |
| `auth.resend()` | `AuthContext.tsx` | Aktif |
| `auth.getUser()` | `AuthContext.tsx` | Aktif |
| `auth.updateUser({ password })` | `ResetPassword.tsx` | Aktif |

### 4.2 Table query operations

| Table yang dipanggil source | Operasi | File | Status terhadap DB-001A |
|---|---|---|---|
| `platform_config` | `SELECT` | `platformInitService.ts`, `AdminDashboard.tsx` | **Valid table** |
| `platform_config` | `INSERT` | `platformInitService.ts` | **Valid table; RLS perlu diuji terhadap authenticated user** |
| `workspaces` | `SELECT` | `workspaceRepository.ts`, `WorkspacesModule.tsx` | Table valid, **column contract tidak valid di repository** |
| `workspaces` | `INSERT` | `workspaceRepository.ts` | **Blocked oleh column mismatch dan kemungkinan enum/RLS** |
| `workspaces` | `UPDATE` | `workspaceRepository.ts` | **Blocked oleh column mismatch dan RLS** |
| `workspaces` | `DELETE` | `workspaceRepository.ts` | Table valid, policy/owner behavior perlu diuji |
| `news_events` | `SELECT` | `newsEventService.ts` | **Invalid: DB-001A memakai `news_publications`** |
| `profiles` | `SELECT`, count | `UsersModule.tsx`, `UsersSubPages.tsx` | **Invalid: DB-001A memakai `user_profiles`; email/role berasal dari Auth** |
| `marketplace_listings` | `SELECT`, count | `MarketplaceModule.tsx` | **Valid table; read-only admin query dan RLS perlu diuji** |

Tidak ditemukan `INSERT`, `UPDATE`, atau `DELETE` langsung ke domain tables lain. Mutasi domain lain berlangsung pada data store lokal.

### 4.3 Query/schema mismatch yang terkonfirmasi

#### Workspace repository

`src/repositories/workspaceRepository.ts` memakai kolom berikut:

```text
workspace_uuid
workspace_type
workspace_name
workspace_status
workspace_plan
owner_user_uuid
```

DB-001A `workspaces` menyediakan:

```text
id
type
name
status
owner_id
```

Kolom seperti `workspace_plan` tidak ada pada tabel DB-001A; subscription dipisahkan melalui `workspace_subscriptions` dan `subscription_plans`. Ini adalah blocker fungsional, bukan sekadar penamaan.

#### News & Event

Source memanggil:

```text
news_events
```

DB-001A menyediakan:

```text
news_publications
```

Service juga mendokumentasikan dan mengharapkan shape `NewsEventItem` lokal, sehingga diperlukan adapter/contract mapping sebelum query dapat menjadi production path.

#### Users

Source memanggil:

```text
profiles
```

DB-001A menyediakan:

```text
user_profiles
```

`auth.users` adalah sumber email dan status Auth. `user_profiles` memiliki `full_name`, `display_name`, `phone_number`, dan metadata profil, tetapi tidak menyediakan seluruh kolom yang diasumsikan oleh `ProfileRow` (`email`, `status`, `is_admin`). Admin user query harus memakai join/aggregation yang sesuai atau adapter server-safe pada tahap implementasi berikutnya.

---

## 5. Audit Auth

### Yang sudah terintegrasi

`src/contexts/AuthContext.tsx` sudah menjadi pusat Auth:

- restore session saat mount;
- `onAuthStateChange` untuk login, logout, refresh token, dan perubahan session;
- `persistSession: true`;
- `autoRefreshToken: true`;
- `detectSessionInUrl: true`;
- login dengan password;
- signup;
- logout;
- reset password;
- refresh session;
- resend signup verification;
- fetch user terbaru.

`src/lib/authBridge.ts` menyelaraskan identitas Auth ke bridge internal untuk kebutuhan legacy/admin. Ini bukan repository profile production.

### Risiko dan gap Auth

1. `src/lib/supabase.ts` memakai placeholder URL/key bila env tidak tersedia. Ini membuat aplikasi dapat boot dalam “demo mode” dan berisiko menyamarkan konfigurasi production yang hilang.
2. Auth session disimpan oleh SDK di browser `localStorage`; ini sesuai konfigurasi Supabase, tetapi bukan pengganti data user/profile.
3. `user_metadata.role` dipakai untuk bridge/admin. Database RLS juga menggunakan JWT metadata pada sebagian policy; alur penetapan role production perlu diverifikasi secara end-to-end.
4. `user_profiles` tidak terlihat dibuat otomatis setelah signup. Tanpa profile row dan membership row, query yang bergantung pada `is_workspace_member(...)` dapat mengembalikan kosong.
5. Reset password mengarah ke `/reset-password`; halaman sudah ada, tetapi redirect URL dan Supabase Auth email configuration perlu diuji di environment production.
6. Route guards ada di source, tetapi audit ini tidak mengubah atau menilai ulang seluruh behavior routing.

### Status

**Auth foundation: Integrated. User/profile/workspace data scoping: Not complete.**

---

## 6. Audit environment dan credential

### Variabel yang dipakai aplikasi

| Variable | Pemakaian | Status |
|---|---|---|
| `VITE_SUPABASE_URL` | `src/lib/supabase.ts` | Ada di konfigurasi Replit |
| `VITE_SUPABASE_ANON_KEY` | `src/lib/supabase.ts` | Ada di konfigurasi Replit |

### Variabel yang tidak ditemukan di source aplikasi

| Variable | Status |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Tidak dipakai |
| `SUPABASE_ACCESS_TOKEN` | CLI/audit credential, bukan runtime app |
| `SUPABASE_DB_PASSWORD` | CLI/audit credential, bukan runtime app |
| server-side `SUPABASE_URL` | Tidak ada server runtime |
| server-side anon/service client | Tidak ada |

Runtime app hanya menggunakan `VITE_` browser variables. Tidak ada service-role secret yang diekspos ke browser, yang merupakan kondisi yang benar.

### Bucket production dari DB-001A

| Bucket | Public | Pemakaian source saat ini |
|---|---:|---|
| `livestock-photos` | No | Tidak ada |
| `marketplace-media` | Yes | Tidak ada |
| `trust-documents` | No | Tidak ada |
| `news-media` | Yes | Tidak ada |
| `workspace-media` | Yes | Tidak ada |
| `transaction-evidence` | No | Tidak ada |

---

## 7. Audit Storage dan Media

DB-001A memiliki tabel `media`, relasi media pada domain, dan 6 bucket Storage. Namun source aplikasi belum memanggil Supabase Storage sama sekali.

`src/data/globalMediaData.ts` dan `src/services/globalMediaService.ts` menyediakan abstraction media yang baik secara bentuk, tetapi implementation-nya masih:

- registry in-memory;
- metadata media lokal;
- `storage_url` dan `cdn_url` dapat bernilai null;
- tidak ada upload;
- tidak ada delete;
- tidak ada public URL generation;
- tidak ada object path ownership enforcement dari aplikasi.

`src/data/livestockFotoData.ts` menyimpan foto melalui browser `localStorage` dan melakukan downscale untuk menghemat kapasitas. Ini bukan production Storage.

### Status

**Storage integration: Not implemented.**

### Risiko

- Foto dapat hilang saat browser/device berganti.
- Data binary tidak terkait dengan `livestock_photos` atau `media`.
- Bucket private memerlukan signed URL atau authenticated object access, yang belum ada.
- Bucket public memerlukan object path convention dan policy yang konsisten, yang belum ada di source.

---

## 8. Audit localStorage, sessionStorage, dummy, mock, dan in-memory source of truth

### Browser persistence non-business

| File | Key/tujuan | Klasifikasi |
|---|---|---|
| `src/lib/supabase.ts` / SDK | Supabase session persistence | Auth session; bukan business data |
| `src/contexts/WorkspaceContext.tsx` | active workspace UUID | UI/session state |
| `src/utils/recentWorkspaces.ts` | recent workspace list | convenience cache |
| `src/components/ScrollRestorer.tsx` | scroll position | UI state |
| `src/data/onboardingData.ts` | onboarding completion | local-only user preference/state |
| `src/pages/admin/layout/AdminLayout.tsx` | collapsed sidebar | UI preference |
| `src/pages/admin/layout/AdminGuard.tsx` | dev admin bypass | DEV-only bypass |
| `src/services/platformInitService.ts` | pending admin init | cross-page Auth bootstrap bridge |

### Business data yang masih localStorage/in-memory

| File | Data | Status |
|---|---|---|
| `src/data/livestockData.ts` | weight entries, weight timeline, livestock registry | **Local source of truth** |
| `src/data/livestockEditData.ts` | extended metadata, edit history | **Local source of truth** |
| `src/data/livestockFotoData.ts` | animal photos/history | **Local source of truth** |
| `src/data/produkKomersialLivingDB.ts` | commercial product live records | **Local source of truth** |
| `src/data/profileNotificationData.ts` | profile notification/preferences | **Local persistence** |
| `src/data/profileSupportData.ts` | feedback/support submissions | **Local persistence** |
| `src/data/global*.ts` | activity, insight, audit, conversation, escrow, evidence, media, notification, reference, search, transaction, trust, verification | **In-memory source of truth** |
| `src/data/*Data.ts` domain registries | livestock, batch, health, reproduction, feed, medicine, marketplace, transaction, service workspace, product catalogs | **In-memory/seed source of truth** |

### Dev seed

`src/main.tsx` runs `devAutoSeed()` before React mounts in DEV. The seed registry and stores are under:

- `src/dev/data-factory/devAutoSeed.ts`
- `src/dev/data-factory/devConsole.ts`
- `src/dev/data-factory/seedRegistry.ts`
- `src/dev/data-factory/stores/*`

This is correctly DEV-gated, tetapi halaman-halaman utama masih mengimpor data registry lokal di production build. Dev-only seed gating tidak mengubah fakta bahwa production module tidak membaca Supabase.

### Fake/mock patterns

- `src/data/globalEscrowData.ts` memuat provider development/internal mock concept.
- `src/services/searchIndexSeeder.ts` membangun search index dari `GLOBAL_SEARCH_SEED_ENTRIES`.
- Banyak `src/data/admin*Data.ts` dan domain `*Data.ts` merupakan seed/static records, walaupun beberapa hanya dipakai sebagai UI configuration.

### Kesimpulan

Dari 259 file pada `src/data`, data layer saat ini masih didominasi registry lokal. Tidak semua file adalah business persistence—sebagian adalah constants, labels, insight calculators, dan static knowledge base—tetapi module yang melakukan CRUD bisnis masih belum memiliki Supabase repository.

---

## 9. Module inventory dan mapping ke DB-001A

Status:

- **Integrated:** query production sudah menjadi primary path atau Auth sudah aktif.
- **Partial:** sebagian query production ada, tetapi masih ada cache/local fallback atau contract mismatch.
- **Local-only:** module membaca/menulis data lokal dan belum punya Supabase adapter.
- **Blocked:** ada adapter/query tetapi pasti gagal atau tidak cocok dengan schema final.
- **Static/reference:** data referensi atau konfigurasi UI; perlu diputuskan apakah harus dipersistenkan atau tetap bundled.

| Module | Status | File utama | Tabel production terkait | Dependency |
|---|---|---|---|---|
| Auth | Integrated | `src/lib/supabase.ts`, `src/contexts/AuthContext.tsx`, `src/pages/auth/*` | `auth.users`, `user_profiles` | Supabase Auth |
| Platform initialization | Partial | `src/services/platformInitService.ts`, `src/contexts/PlatformInitContext.tsx` | `platform_config`, `user_profiles` | Auth session, RLS |
| Workspace | Blocked | `src/repositories/workspaceRepository.ts`, `src/services/workspaceService.ts`, `src/contexts/WorkspaceContext.tsx` | `workspaces`, `workspace_members`, `workspace_invitations`, `workspace_subscriptions`, `subscription_plans` | Auth, schema adapter |
| Workspace profile/settings | Local/partial | `src/pages/WorkspaceSettings*.tsx`, `WorkspacePublicProfile.tsx`, `src/data/farmProfileData.ts` | `workspaces`, `workspace_members`, `media`, `workspace-media` | Workspace repository, Storage |
| Subscription | Local-only | `src/contexts/SubscriptionContext.tsx`, `src/data/workspaceSubscriptionData.ts`, `subscriptionFeaturePolicy.ts` | `subscription_plans`, `workspace_subscriptions`, `feature_policies` | Workspace |
| Livestock | Local-only | `src/data/livestockData.ts`, `src/pages/Livestock*.tsx`, `AddLivestock.tsx`, `EditLivestock.tsx` | `livestock`, `livestock_extended_metadata`, `livestock_edit_history`, `livestock_ownership_history`, `livestock_photos`, `livestock_weight_entries` | Workspace, Auth |
| Batch | Local-only | `src/data/batchData.ts`, `batchHistoryData.ts`, `batchOperationsData.ts`, `src/pages/Batch*.tsx` | `batches`, `batch_members`, `batch_history`, `batch_operations` | Livestock, Workspace |
| Pedigree/lineage | Local-only | `src/data/pedigreeData.ts`, `src/pages/Silsilah.tsx`, `Keturunan.tsx` | `pedigree_links`, `livestock` | Livestock |
| Mutation/transfer | Local-only | `src/data/mutasiData.ts`, `transferData.ts`, `src/pages/Mutasi.tsx`, `RiwayatMutasi.tsx` | `mutation_requests`, `livestock_transfers` | Livestock, Workspace |
| Health checkup/treatment | Local-only | `src/data/pemeriksaanKesehatanData.ts`, `tindakanKesehatanData.ts`, `riwayatKesehatanData.ts`, health pages | `health_checkups`, `health_treatments`, `health_control_schedules` | Livestock, Workspace |
| Medicine stock | Local-only | `src/data/stokObatData.ts`, `riwayatObatData.ts`, medicine pages | `stok_obat`, `stok_obat_masuk`, `stok_obat_keluar`, `stok_obat_adjustments`, `drug_catalog` | Workspace, reference |
| Reproduction | Local-only | `src/data/reproduksiProgramData.ts`, `pelaksanaanReproduksiData.ts`, `monitoringReproduksiData.ts`, pregnancy/birth/weaning files | `reproduksi_programs`, `pelaksanaan_reproduksi`, `monitoring_reproduksi`, `pemeriksaan_kebuntingan`, `kebuntingan`, `kelahiran`, `registrasi_anak`, `sapih` | Livestock, Workspace |
| Feed master/reference | Static/local | `src/data/masterPakan*.ts`, ingredient catalogs | `master_pakan_categories`, `master_pakan_catalog`, `global_reference`, `data_master` | Reference policy |
| Feed formula/production | Local-only | `src/data/formulaData.ts`, `produksiFormulaData.ts`, formula pages | `feed_formulas`, `feed_formula_ingredients`, `feed_formula_productions` | Workspace, feed catalog |
| Feed inventory/distribution | Local-only | `src/data/stokInventarisData.ts`, `pemberianPakanData.ts`, `jadwalPemberianPakanData.ts` | `stok_inventaris`, `stok_inventaris_transactions`, `jadwal_pemberian_pakan`, `pemberian_pakan` | Workspace, formulas, livestock |
| Commercial products | Local-only/static | `src/data/produkKomersial*.ts`, `konsentrat*.ts`, `obat*.ts`, product pages | `produk_komersial_categories`, `produk_komersial_brands`, `produk_komersial_series`, `produk_komersial_products`, `drug_catalog` | Reference, media |
| Marketplace listings | Partial admin / local user flow | `src/data/marketplaceListingData.ts`, marketplace pages, `MarketplaceModule.tsx` | `marketplace_categories`, `marketplace_listings`, `marketplace_listing_photos` | Workspace, livestock/service origin, media |
| Marketplace wishlist | Local-only | `src/data/marketplaceWishlistData.ts` | `marketplace_wishlists` | Auth, listings |
| Marketplace chat | Local-only | `src/data/marketplaceChatData.ts`, `transactionRoomData.ts`, chat components/pages | `marketplace_chat_rooms`, `marketplace_chat_messages` | Auth, workspace, listings |
| Marketplace negotiation/transaction | Local-only | `marketplaceNegosiasiData.ts`, `marketplaceTransaksiData.ts`, transaction pages | `marketplace_negotiations`, `marketplace_transactions` | Listings, workspace |
| Moderation/reporting | Local-only | `marketplaceModerasiData.ts`, report pages | `marketplace_moderations` | Auth/admin, listings |
| Transaction room | Local-only | `transactionRoomData.ts`, `transactionOrchestrationData.ts`, transaction pages | `transaction_rooms`, `transaction_participants`, `transaction_attachments`, `transaction_receipts` | Marketplace, services |
| Escrow | Local-only | `globalEscrowData.ts`, `escrowWorkflowData.ts`, escrow pages | `escrow_accounts`, `escrow_transactions` | Transaction room |
| Evidence/audit | Local-only | `globalEvidenceData.ts`, `globalAuditTrailData.ts`, transaction evidence/audit data | `transaction_evidence`, `transaction_audit_trail`, `global_audit_trail` | Auth, transaction room |
| Transport service | Local-only | `layananTransportData.ts`, `transportWorkspaceData.ts`, `transportTripData.ts`, transport pages | `layanan_transport`, `transport_transactions`, `service_quotations` | Workspace, transaction room |
| Veterinary/clinic service | Local-only | `layananDokterHewanData.ts`, `layananKlinikHewanData.ts`, veterinary pages | `layanan_dokter_hewan`, `layanan_klinik_hewan`, `service_quotations` | Workspace, transaction room |
| News & Event | Blocked/partial | `newsEventService.ts`, `newsEventData.ts`, publication/review/RSS pages | `news_publications`, `rss_sources`, `rss_queue`, `rss_collector_logs` | Workspace, Auth, media |
| Notifications | Local-only | `globalNotificationData.ts`, `globalNotificationService.ts`, notification pages | `notifications`, `alert_reminders` | Auth, Workspace |
| Activity | Local-only | `globalActivityData.ts`, `globalActivityService.ts`, activity/dashboard pages | `global_audit_trail`, `system_logs` | Auth, Workspace |
| Trust/verification | Local-only | `globalTrustData.ts`, `globalVerificationData.ts`, trust pages | `trust_verifications`, `trust_verification_evidence` | Workspace, media |
| Data Master/reference | Local-only | `dataMasterData.ts`, `globalReferenceData.ts`, admin data-master pages | `data_master`, `global_reference` | Admin/Auth |
| Global search | Local-only | `globalSearchData.ts`, `globalSearchService.ts`, `searchIndexSeeder.ts`, `SearchPage.tsx` | `search_index` | All domain records |
| AI insights | Local-only computed | `globalAiInsightData.ts`, `globalAiInsightService.ts`, domain insight files | `ai_insights` | Source domain data |
| Global media | Local-only | `globalMediaData.ts`, `globalMediaService.ts`, `livestockFotoData.ts` | `media`, domain photo tables, 6 Storage buckets | Auth, Workspace, Storage |
| Admin dashboard modules | Partial/mixed | `src/pages/admin/modules/*` | Corresponding foundation/domain tables | Admin guard, RLS |

---

## 10. DB-001A tables yang belum dipakai oleh Supabase query aplikasi

Tidak ditemukan consumer Supabase langsung untuk tabel-tabel berikut. Beberapa memiliki data model lokal yang jelas, sebagian lain belum memiliki adapter maupun runtime consumer production.

### Foundation

```text
user_profiles
global_reference
data_master
subscription_plans
feature_policies
escrow_accounts
rss_sources
admin_announcements
backup_records
system_logs
```

### Reference/product

```text
master_pakan_categories
master_pakan_catalog
produk_komersial_categories
produk_komersial_brands
produk_komersial_series
produk_komersial_products
disease_categories
disease_catalog
drug_categories
drug_sub_categories
drug_catalog
marketplace_categories
```

### Workspace/livestock

```text
workspace_members
workspace_invitations
workspace_relationships
ownership_transfers
workspace_subscriptions
livestock
livestock_extended_metadata
livestock_edit_history
pedigree_links
livestock_ownership_history
livestock_photos
livestock_weight_entries
batches
batch_members
batch_history
batch_operations
livestock_transfers
mutation_requests
```

### Health/reproduction/stock

```text
health_checkups
health_treatments
health_control_schedules
stok_obat
reproduksi_programs
pelaksanaan_reproduksi
monitoring_reproduksi
pemeriksaan_kebuntingan
kebuntingan
kelahiran
registrasi_anak
sapih
stok_obat_masuk
stok_obat_keluar
stok_obat_adjustments
```

### Feed/marketplace

```text
feed_formulas
feed_formula_ingredients
feed_formula_productions
stok_inventaris
stok_inventaris_transactions
jadwal_pemberian_pakan
pemberian_pakan
marketplace_listing_photos
marketplace_wishlists
marketplace_chat_rooms
marketplace_chat_messages
marketplace_negotiations
marketplace_transactions
marketplace_moderations
```

### Transactions/services/platform services

```text
transaction_rooms
transaction_participants
transaction_attachments
transaction_receipts
escrow_transactions
layanan_transport
layanan_dokter_hewan
layanan_klinik_hewan
service_quotations
transport_transactions
transaction_conversations
transaction_conversation_messages
transaction_evidence
transaction_audit_trail
rss_queue
rss_collector_logs
news_publications
notifications
alert_reminders
trust_verifications
trust_verification_evidence
media
ai_insights
global_audit_trail
search_index
```

---

## 11. RLS audit dan query yang kemungkinan gagal

Production DB-001A hasil deployment memiliki 67 tabel public dengan RLS aktif dan 79 policy public. Storage memiliki policy tersendiri. Risiko berikut perlu diuji sebelum domain migration dianggap selesai.

### Critical/Risk 1 — Workspace contract

Query repository memakai nama kolom yang tidak ada. Query akan gagal sebelum atau bersamaan dengan evaluasi RLS. Perbaikan harus berupa adapter schema-aware, bukan menambah kolom legacy.

### Critical/Risk 2 — User profile access

`profiles` tidak ada. Mengganti ke `user_profiles` saja belum cukup karena:

- `email` berasal dari `auth.users`;
- `status` dan `is_admin` tidak identik dengan kolom `user_profiles`;
- admin listing user perlu policy/admin access yang eksplisit;
- query browser tidak boleh memperoleh service-role privilege.

### Critical/Risk 3 — News table

`news_events` tidak ada. `news_publications` memiliki contract dan status production yang berbeda. Query publik harus mengikuti policy `status = 'Published'`, sedangkan submission/admin flow perlu membership/admin policy.

### Critical/Risk 4 — Initial platform bootstrap

`checkPlatformInitialized()` dapat dipanggil sebelum autentikasi dan mengharapkan anon SELECT atas `platform_config`. Policy final harus diuji karena jika anon tidak dapat membaca row, service memiliki safety default `true` yang dapat menyembunyikan masalah konfigurasi.

### High/Risk 5 — Workspace membership bootstrap

Banyak policy menggunakan `is_workspace_member(...)`. Setelah signup, aplikasi harus memiliki alur atomik atau retry-safe untuk:

- `user_profiles`;
- `workspaces`;
- `workspace_members`;
- subscription row bila diperlukan.

Tanpa itu, query yang valid dapat mengembalikan 0 row karena RLS.

### High/Risk 6 — Browser admin queries

Admin modules melakukan query langsung dari browser. Access admin harus ditentukan dari Auth/JWT/RLS, bukan hanya route UI atau local dev flag. `AdminGuard` memiliki bypass DEV-only; bypass tersebut tidak boleh menjadi dasar production authorization.

### High/Risk 7 — Storage ownership

Policy Storage memakai owner/object ownership. Source belum memiliki object path convention, upload ownership, signed URL, atau delete flow. Implementasi storage tanpa kontrak ini berisiko menghasilkan object yang tidak dapat dibaca atau policy yang terlalu luas.

### High/Risk 8 — Null workspace media

Policy media mengizinkan record dengan `owner_workspace_id IS NULL`. Ini perlu dipastikan hanya dipakai untuk system assets; jika seluruh media user boleh null, dapat terjadi exposure lintas workspace.

### Medium/Risk 9 — Client-side counts

Admin count helper memakai `select('*', { count: 'exact', head: true })`. RLS dapat membuat count berbeda dari total global, dan error dikonversi menjadi `0`. Ini dapat terlihat seperti database kosong ketika sebenarnya query ditolak.

---

## 12. Dependency graph migrasi aplikasi

Urutan yang disarankan:

```text
Auth session
  └─ user_profiles
      └─ workspace repository + workspace_members
          ├─ subscription
          ├─ livestock
          │   ├─ batch
          │   ├─ health
          │   ├─ reproduction
          │   └─ feed/stock
          ├─ marketplace
          │   └─ transaction room
          │       ├─ escrow
          │       ├─ evidence/audit
          │       └─ service quotation/transport
          └─ notifications/activity/trust

Reference catalogs
  ├─ feed/product/medicine
  └─ disease/health

Media/Storage
  └─ can be introduced after entity IDs and workspace ownership are stable

Search/AI insight
  └─ should consume persisted domain records after domain repositories exist
```

---

## 13. Daftar pekerjaan berdasarkan prioritas

### Critical

| Pekerjaan | File/area | Estimasi | Blocker yang dihilangkan |
|---|---|---:|---|
| Selaraskan `workspaceRepository` dengan DB-001A tanpa mengubah public Workspace architecture | `src/repositories/workspaceRepository.ts`, workspace types/service tests | 1–2 hari | Semua CRUD Workspace saat ini memakai kolom invalid |
| Ganti `profiles` dengan adapter Auth + `user_profiles` yang RLS-safe | `UsersModule.tsx`, `UsersSubPages.tsx`, profile/Auth contract | 1–2 hari | Admin Users query selalu gagal |
| Ganti `news_events` dengan `news_publications` dan mapping status/field | `newsEventService.ts`, News/Event data adapters | 1–2 hari | Public News query selalu gagal |
| Verifikasi bootstrap `platform_config` dan membership terhadap RLS production | `platformInitService.ts`, `Initialize.tsx`, auth/workspace bootstrap | 1 hari | Risiko false initialized / empty workspace |
| Tambahkan contract tests untuk semua query yang sudah ada | repository/service tests | 1 hari | Mismatch schema terdeteksi sebelum runtime |

### High

| Pekerjaan | File/area | Estimasi |
|---|---|---:|
| Buat repository + service production untuk `user_profiles`, `workspace_members`, invitations, subscriptions | `src/repositories`, `src/services`, existing contexts | 2–4 hari |
| Migrasikan Livestock CRUD dan photos/weights/edit history | `src/data/livestockData.ts`, edit/photo data, livestock pages | 3–5 hari |
| Migrasikan Batch dan transfer/mutation | batch/transfer/mutasi data + pages | 3–5 hari |
| Migrasikan Health, Medicine, dan Reproduction | domain data/services/pages | 4–7 hari |
| Migrasikan Feed formula, stock, pemberian pakan | feed/stock data/services/pages | 4–7 hari |
| Migrasikan Marketplace listing, photos, wishlist, chat, negotiation | marketplace data/services/pages | 5–8 hari |
| Implementasikan transaction room, receipt, attachment, evidence, audit | transaction/escrow data/services/components | 5–8 hari |
| Implementasikan admin authorization berbasis JWT/RLS, bukan local state | AdminGuard dan policy integration tests | 2–3 hari |

### Medium

| Pekerjaan | File/area | Estimasi |
|---|---|---:|
| Persist reference/master catalogs | `src/data/master*`, admin data-master | 2–4 hari |
| Persist notifications, reminders, activity, trust, verification | `src/services/global*Service.ts` dan data counterparts | 3–5 hari |
| Persist News submission, RSS source/queue/collector | News/RSS pages and services | 2–4 hari |
| Implementasikan Global Media Registry ke tabel `media` | `globalMedia*`, media consumers | 2–4 hari |
| Implementasikan Storage upload/delete/public and signed URLs | photo/media consumers + bucket adapters | 2–4 hari |
| Add production data adapters for service workspaces and quotations | transport/vet/clinic data | 2–4 hari |

### Low

| Pekerjaan | File/area | Estimasi |
|---|---|---:|
| Persist/rebuild `search_index` dari source tables | `globalSearchService.ts`, `searchIndexSeeder.ts` | 2–3 hari |
| Persist or derive `ai_insights` after source data is authoritative | global/domain insight files | 2–3 hari |
| Decide which static knowledge/reference datasets remain bundled | `src/data/*` catalogs | 1–2 hari |
| Remove obsolete local persistence only after migration/rollback plan | all local stores | 2–4 hari |
| Add performance indexes/query pagination review | DB query adapters | 1–2 hari |

Estimasi di atas adalah engineering effort kasar, bukan kalender delivery. Estimasi tidak mencakup data backfill, acceptance testing, or production rollout windows.

---

## 14. Rekomendasi urutan implementasi

1. **Stabilkan contract yang sudah ada.** Perbaiki adapter Workspace, Users, dan News agar nama tabel/kolom tepat terhadap DB-001A. Jangan mengubah UI atau Workspace context API.
2. **Tambahkan test query/RLS.** Gunakan test user, workspace owner, member, non-member, anon, dan admin. Pastikan error tidak diubah diam-diam menjadi empty state.
3. **Buat user/profile/membership bootstrap yang konsisten.** Ini adalah prerequisite semua policy workspace-scoped.
4. **Migrasikan Livestock sebagai domain inti.** Sertakan metadata, edit history, photo relation, weight entries, dan ownership history.
5. **Migrasikan Batch, Mutation, Health, Reproduction, dan Feed** mengikuti foreign-key dependency.
6. **Migrasikan Marketplace lalu Transaction Room.** Listing dan chat harus memakai persisted IDs sebelum escrow/evidence/transport diaktifkan.
7. **Aktifkan Storage** setelah object ownership dan entity relation stabil.
8. **Persist global foundation** (notifications, activity, audit, trust) berdasarkan Auth/workspace identity.
9. **Bangun Search dan AI Insight dari persisted tables**, bukan dari seed registry.
10. **Retire local business stores** hanya setelah parity, backfill, rollback, dan acceptance test selesai.

---

## 15. Blocker utama

1. **Schema contract mismatch** pada Workspace repository.
2. **Tabel tidak ada**: `profiles`, `news_events`.
3. **Tidak ada repository layer** untuk hampir semua domain selain Workspace.
4. **RLS identity dependency** pada `auth.uid()`, `workspace_members`, dan helper `is_workspace_member`.
5. **Tidak ada production Storage client flow** walaupun bucket sudah tersedia.
6. **Local seed/in-memory stores masih menjadi source of truth**, sehingga data antar-session/device tidak konsisten dengan Supabase.
7. **Admin browser queries** belum memiliki contract authorization dan profile adapter production yang lengkap.
8. **Static/local data volume besar**; perlu klasifikasi mana yang harus dipersistenkan dan mana yang memang reference bundle.

---

## 16. Rekomendasi guardrail untuk pekerjaan berikutnya

- Jangan menambah kolom legacy seperti `workspace_uuid` atau `workspace_plan` ke DB-001A hanya untuk membuat adapter lama berjalan.
- Pertahankan API `WorkspaceContext` dan lakukan mapping di repository/service.
- Jangan memakai service-role key di browser.
- Jangan menjadikan `localStorage` sebagai business persistence baru.
- Jangan mengubah error RLS/query menjadi `[]` atau `0` tanpa telemetry/error state yang jelas.
- Jangan mengaktifkan Storage upload sebelum path, ownership, bucket, dan signed/public URL contract disepakati.
- Setiap repository baru harus memetakan input/output type secara eksplisit ke kolom DB-001A.
- Setiap module migration harus memiliki read, insert, update, delete, RLS, reload, dan multi-user acceptance test.
- Data seed DEV harus tetap dipisahkan dari production repository.

---

## 17. Audit conclusion

DB-001A berhasil menjadi schema production final, tetapi integrasi aplikasi baru berada pada tahap foundation:

- Auth: usable foundation.
- Platform init: mostly integrated.
- Workspace: existing adapter needs immediate schema alignment.
- News and Users: existing queries target tables that do not exist.
- Domain modules: predominantly local/in-memory.
- Storage: provisioned but unused.
- RLS: present and materially affects the required implementation order.

Pekerjaan DB-001B berikutnya sebaiknya dimulai dari **contract repair dan RLS verification**, bukan dari perubahan UI. Setelah tiga blocker Critical diperbaiki, migration domain dapat dilakukan bertahap dengan mempertahankan API dan arsitektur Workspace yang sudah ada.