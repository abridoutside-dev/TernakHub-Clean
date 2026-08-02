# P0-002A — Audit Development vs Production Boundary

**Tanggal audit:** 2026-07-21  
**Branch:** feature/production-readiness  
**Scope:** Seluruh `src/` — kecuali `src/dev/` (sudah diketahui DEV ONLY)

---

## Ringkasan Eksekutif

| Kategori | Jumlah Item |
|---|---|
| DEV ONLY — harus hilang dari production | 87 item (lihat detail di bawah) |
| PROD ONLY — sudah aktif & benar | 8 item |
| SHARED — tipe, utilitas, validator | ~200+ file |
| `console.*` di luar `src/dev/` | 60 baris |
| In-memory DB yang harus diganti Supabase | 46 store berbeda |
| Hardcoded viewer ID (runtime identity) | 4 konstanta |

---

## 1. DEV ONLY — Harus Hilang dari Production

### 1.1 Direktori `src/dev/` — Dev Data Factory (29 file, ~2.000 baris)

Seluruh direktori ini adalah DEV ONLY. Sudah dikecualikan dari production build via `import.meta.env.DEV` guard di `main.tsx` (dynamic import — tidak masuk bundle production). Namun kode tetap ada di repo dan perlu dikelola.

| File | Deskripsi |
|---|---|
| `src/dev/data-factory/devAutoSeed.ts` | Entry point auto-seed; dipanggil sebelum React mount |
| `src/dev/data-factory/devConsole.ts` | Memasang `window.ternakDevFactory` di browser console |
| `src/dev/data-factory/seed.ts` | Orkestrasi seeding semua modul |
| `src/dev/data-factory/seedRegistry.ts` | Melacak record yang di-seed untuk keperluan clear |
| `src/dev/data-factory/clear.ts` | Menghapus semua seeded data dari in-memory DB |
| `src/dev/data-factory/config.ts` | Konfigurasi jumlah livestock, batch, dll. |
| `src/dev/data-factory/rng.ts` | RNG deterministik untuk data acak-reprodusibel |
| `src/dev/data-factory/dateFactory.ts` | Generator tanggal historis |
| `src/dev/data-factory/idFactory.ts` | Generator ID sequential |
| `src/dev/data-factory/factories/batchFactory.ts` | Generator batch & membership |
| `src/dev/data-factory/factories/feedFactory.ts` | Generator data pakan |
| `src/dev/data-factory/factories/healthHistoryFactory.ts` | Generator riwayat kesehatan |
| `src/dev/data-factory/factories/livestockFactory.ts` | Generator livestock record |
| `src/dev/data-factory/factories/medicineFactory.ts` | Generator stok obat |
| `src/dev/data-factory/factories/mutationFactory.ts` | Generator mutasi |
| `src/dev/data-factory/factories/ownershipFactory.ts` | Generator ownership |
| `src/dev/data-factory/factories/reproductionFactory.ts` | Generator reproduksi |
| `src/dev/data-factory/factories/weightHistoryFactory.ts` | Generator riwayat bobot |
| `src/dev/data-factory/masters/breedMaster.ts` | Data ras ternak |
| `src/dev/data-factory/masters/feedMaster.ts` | Data pakan master |
| `src/dev/data-factory/masters/healthMaster.ts` | Data kesehatan master |
| `src/dev/data-factory/masters/locationMaster.ts` | Data lokasi master |
| `src/dev/data-factory/masters/medicineMaster.ts` | Data obat master |
| `src/dev/data-factory/masters/nameMaster.ts` | Data nama ternak |
| `src/dev/data-factory/masters/programMaster.ts` | Data program reproduksi |
| `src/dev/data-factory/masters/reproMaster.ts` | Data reproduksi master |
| `src/dev/data-factory/masters/speciesMaster.ts` | Data spesies |
| `src/dev/data-factory/stores/feedStore.ts` | Seed store pakan |
| `src/dev/data-factory/stores/medicineStore.ts` | Seed store obat |

**Status:** Sudah dikecualikan dari production bundle (`import.meta.env.DEV` dynamic import di `main.tsx:25-31`). Tidak ada tindakan P0-002B untuk exclusion, tetapi perlu dijaga agar guard tetap ada.

---

### 1.2 `import.meta.env.DEV` — Guard yang Sudah Ada

| File | Baris | Fungsi |
|---|---|---|
| `src/main.tsx` | 25 | Guard devAutoSeed + devConsole — **BENAR, sudah aman** |
| `src/data/workspaceSubscriptionData.ts` | 548, 931 | Policy drift logging ke `console.error` — **BENAR, sudah aman** |
| `src/pages/admin/layout/AdminGuard.tsx` | 16–18, 127 | DEV_ADMIN_KEY localStorage bypass — **RISIKO MEDIUM** (lihat 1.3) |

---

### 1.3 Admin Dev-Mode Bypass — `src/pages/admin/layout/AdminGuard.tsx`

```
const DEV_ADMIN_KEY = 'ternakhub_admin_dev_mode';         // L9
() => import.meta.env.DEV && localStorage.getItem(DEV_ADMIN_KEY) === 'true'  // L18
localStorage.setItem(DEV_ADMIN_KEY, 'true');               // L28
```

**Risiko:** Bypass admin guard hanya aktif di DEV (`import.meta.env.DEV && ...`). Secara teknis sudah aman di production build karena `import.meta.env.DEV` = `false`. Namun tombol "Enable Dev Mode" di UI AccessDenied tetap render di production (L60, L127, L130) — tombol ini hanya memanggil `enableDevMode()` yang akan `setDevMode(true)` namun tidak mengubah apa pun karena `isAdmin` tetap `false`.

**Tindakan P0-002B:** Hapus render tombol dev mode dari AccessDenied component di production build.

---

### 1.4 Hardcoded Viewer ID — Runtime Identity Placeholder

Ini adalah hardcoded user ID yang menggantikan auth session pada modul-modul yang belum terhubung ke Supabase Auth. **Harus diganti** dengan `useAuth().user?.id` sebelum production.

| File | Konstanta | Nilai Hardcoded | Digunakan di |
|---|---|---|---|
| `src/data/publicProfileData.ts:894` | `CURRENT_VIEWER_ID` | `'usr-berkah-001'` | `WorkspacePublicProfile.tsx` |
| `src/data/feedStoreWorkspaceData.ts:263` | `CURRENT_FSW_VIEWER_ID` | `'usr-budi-001'` | `FeedStoreWorkspace.tsx` |
| `src/data/transportWorkspaceData.ts:211` | `CURRENT_TRANSPORT_VIEWER_ID` | `'usr-berkah-001'` | `TransportWorkspace.tsx` |
| `src/data/veterinaryWorkspaceData.ts:194` | `CURRENT_VET_VIEWER_ID` | `'usr-amelia-001'` | `VeterinaryWorkspace.tsx` |

**Catatan:** `CURRENT_FARM_VIEWER_ID = null` di `farmProfileData.ts:178` sudah benar (null = public view).

---

### 1.5 Admin Dummy Data Files — 22 File

Semua file ini berisi data statis/dummy yang hanya digunakan untuk UI prototype admin. Semua modul admin bertuliskan "Backend integration pending — no hardcoded values" di header, namun data yang mereka tampilkan **berasal dari file-file ini** bukan dari Supabase.

| File | Isi | Kategori |
|---|---|---|
| `src/data/adminActivityData.ts` | "Realistic dummy platform activity records. No production data." | Dummy |
| `src/data/adminAnnouncementsData.ts` | "Realistic dummy data only. No production database." | Dummy |
| `src/data/adminBackupData.ts` | "Realistic dummy data only. No actual backup/restore." | Dummy |
| `src/data/adminCrossWorkspaceLineageData.ts` | "Read-only dummy data only. No breeding logic." | Dummy |
| `src/data/adminDataMasterData.ts` | "Realistic dummy data only. No production database." | Dummy |
| `src/data/adminEscrowData.ts` | "Read-only dummy data. No real payments." | Dummy |
| `src/data/adminFeedData.ts` | "Dummy data for Platform Administrator feed monitoring." | Dummy |
| `src/data/adminGlobalSearchSeedData.ts` | "Realistic dummy IndexEntityInput records." | Dummy + Seed |
| `src/data/adminLivestockData.ts` | Static dummy livestock untuk admin view | Dummy |
| `src/data/adminMarketplaceData.ts` | Static dummy marketplace untuk admin view | Dummy |
| `src/data/adminMedicineData.ts` | Static dummy obat untuk admin view | Dummy |
| `src/data/adminMonitoringData.ts` | Static dummy monitoring events | Dummy |
| `src/data/adminOwnershipTransferData.ts` | "Read-only dummy data. No transfer execution." | Dummy |
| `src/data/adminRelationshipData.ts` | "Read-only dummy data. No invitation workflow." | Dummy |
| `src/data/adminReportsData.ts` | Static dummy reports | Dummy |
| `src/data/adminSettingsData.ts` | Platform settings konfigurasi (static) | Semi-legitimate |
| `src/data/adminSubscriptionData.ts` | Dummy subscription stats | Dummy |
| `src/data/adminTrustData.ts` | Dummy trust scores | Dummy |
| `src/data/adminTrustVerificationData.ts` | Verifikasi requests statis | Dummy |
| `src/data/adminUsersData.ts` | "No dummy data, no hardcoded records." — aggregator dari Supabase | OK |
| `src/data/adminWorkspacesData.ts` | UI display-config constants (WS_STATUS_CONFIG, dll.) | LEGACY (sudah diberi komentar P0-001D) |
| `src/data/adminNavData.ts` | Static navigation config | SHARED |
| `src/data/adminDashboardData.ts` | "All fake stats removed." — aggregator Supabase | OK |
| `src/data/adminNotificationsData.ts` | Notification config | SHARED |

---

### 1.6 In-Memory Database Stores (Runtime CRUD — Harus Diganti Supabase)

Ini adalah **inti dari masalah DEV/PROD**: seluruh aplikasi (kecuali Workspace) masih menggunakan in-memory JavaScript arrays/objects sebagai database runtime. Data hilang setiap page refresh. Di development, DevAutoSeed mengisi ulang data ini. Di production, data akan selalu kosong pada fresh load.

#### Grup A — Core Livestock & Transfer

| File | In-Memory DB | Isi |
|---|---|---|
| `src/data/livestockData.ts` | `LIVESTOCK_DB`, `PEDIGREE_DB`, `OWNERSHIP_DB` | Master record ternak |
| `src/data/livestockData.ts` | `WEIGHT_HISTORY_DB`, `USER_WEIGHT_DB`* | Riwayat bobot (* persisted localStorage) |
| `src/data/livestockData.ts` | `HEALTH_HISTORY_DB`, `REPRO_HISTORY_DB` | Riwayat kesehatan & reproduksi |
| `src/data/transferData.ts` | `LIVESTOCK_STATUS_DB`, `OUTSIDE_LIVESTOCK_DB` | Status & lokasi ternak |
| `src/data/mutasiData.ts` | `MUTASI_DB` | Mutasi/pemindahan ternak |
| `src/data/batchData.ts` | `BATCH_DB`, `MEMBERSHIP_DB` | Batch & keanggotaan |

#### Grup B — Modul Kesehatan

| File | In-Memory DB | Isi |
|---|---|---|
| `src/data/pemeriksaanKesehatanData.ts` | `PEMERIKSAAN_DB` | Rekam pemeriksaan |
| `src/data/diagnosaKesehatanData.ts` | `DIAGNOSA_DB` | Rekam diagnosa |
| `src/data/tindakanKesehatanData.ts` | `TINDAKAN_SESI_DB`, `TINDAKAN_ITEM_DB` | Rekam tindakan medis |
| `src/data/pengobatanKesehatanData.ts` | `PENGOBATAN_SESI_DB`, `PENGOBATAN_ITEM_DB` | Rekam pengobatan |

#### Grup C — Modul Reproduksi

| File | In-Memory DB | Isi |
|---|---|---|
| `src/data/reproduksiProgramData.ts` | `PROGRAM_REPRODUKSI_DB` | Program reproduksi |
| `src/data/pelaksanaanReproduksiData.ts` | `PELAKSANAAN_REPRODUKSI_DB` | Pelaksanaan program |
| `src/data/pemeriksaanKebuntinganData.ts` | `PEMERIKSAAN_KEBUNTINGAN_DB` | Pemeriksaan kebuntingan |
| `src/data/kebuntinganData.ts` | `KEBUNTINGAN_DB`, `KEBUNTINGAN_MONITORING_DB` | Kebuntingan |
| `src/data/kelahiranData.ts` | `KELAHIRAN_DB`, `ANAK_DB` | Kelahiran & anak |
| `src/data/monitoringReproduksiData.ts` | `MONITORING_REPRODUKSI_DB` | Monitoring reproduksi |
| `src/data/sapihData.ts` | `SAPIH_DB` | Sapih (weaning) |

#### Grup D — Modul Pakan

| File | In-Memory DB | Isi |
|---|---|---|
| `src/data/pemberianPakanData.ts` | `PEMBERIAN_PAKAN_DB` | Log pemberian pakan |
| `src/data/jadwalPemberianPakanData.ts` | `JADWAL_PEMBERIAN_DB` | Jadwal pakan |
| `src/data/formulaData.ts` | `FORMULA_LIST` (mutable array) | Formula pakan |
| `src/data/stokInventarisData.ts` | `RAW_INVENTARIS` (mutable array) | Inventaris stok pakan |
| `src/data/produksiFormulaData.ts` | Production log (mutable) | Log produksi formula |

#### Grup E — Modul Obat

| File | In-Memory DB | Isi |
|---|---|---|
| `src/data/stokObatData.ts` | `STOK_OBAT_ITEMS`, `PENYESUAIAN_STOK_RECORDS` | Stok & penyesuaian obat |
| `src/data/riwayatObatData.ts` | Riwayat penggunaan obat | Log riwayat obat |

#### Grup F — Marketplace

| File | In-Memory DB | Isi |
|---|---|---|
| `src/data/marketplaceTransaksiData.ts` | `TRANSAKSI` (let, mutable) | Transaksi marketplace |
| `src/data/marketplaceNegosiasiData.ts` | `NEGOSIASI`, `NOTIFIKASI_NEGOSIASI` (let, mutable) | Negosiasi |
| `src/data/marketplaceChatData.ts` | `CHAT_ROOMS` (let, mutable) | Chat rooms |

#### Grup G — Global Foundation Services

| File | In-Memory DB | Isi |
|---|---|---|
| `src/data/globalActivityData.ts` | `GLOBAL_ACTIVITY_DB` (Map) | Platform activity log |
| `src/data/globalAiInsightData.ts` | `GLOBAL_AI_INSIGHT_DB` (Map) | AI insight records |
| `src/data/globalAuditTrailData.ts` | `GLOBAL_AUDIT_TRAIL_DB` (Array) | Audit trail |
| `src/data/globalConversationData.ts` | `GLOBAL_CONVERSATION_DB`, `PARTICIPANT_DB`, `MESSAGE_DB` (Map) | Conversation & messages |
| `src/data/globalEscrowData.ts` | `GLOBAL_ESCROW_DB` (Map) | Escrow records ("simulasi internal") |
| `src/data/globalEvidenceData.ts` | `GLOBAL_EVIDENCE_DB` (Map) | Evidence records |
| `src/data/globalNotificationData.ts` | `GLOBAL_NOTIFICATION_DB` (Map) | Notifikasi |
| `src/data/globalReferenceData.ts` | `GLOBAL_REFERENCE_DB` (Map) | Reference data |
| `src/data/globalSearchData.ts` | `GLOBAL_SEARCH_INDEX_DB` (Map) | Search index |
| `src/data/globalTransactionData.ts` | `GLOBAL_TRANSACTION_DB` (Map) | Global transactions |
| `src/data/globalTrustData.ts` | `GLOBAL_TRUST_DB`, `GLOBAL_TRUST_HISTORY_DB` (Map+Array) | Trust scores |
| `src/data/globalVerificationData.ts` | `GLOBAL_VERIFICATION_DB` (Map) | Verifikasi records |
| `src/data/globalMediaData.ts` | `GLOBAL_MEDIA_DB` (static seed array) | Media records |

#### Grup H — Workspace & Foundation (LEGACY)

| File | In-Memory DB | Status |
|---|---|---|
| `src/data/workspaceFoundationData.ts` | `WORKSPACE_DB` | LEGACY — Supabase sudah tersedia (P0-001D) |
| `src/data/workspaceMembersData.ts` | `MEMBERS_DB` | LEGACY — belum ada tabel Supabase |
| `src/data/workspaceSubscriptionData.ts` | `SUBSCRIPTION_DB` | LEGACY — sebagian |
| `src/data/masterEscrowData.ts` | `MASTER_ESCROW_DB`, `ESCROW_CONTACTS_DB`, `ESCROW_BANK_ACCOUNTS_DB` | In-memory CRUD |

#### Grup I — Static Reference DBs (Master Data — tetap in-memory, acceptable)

Data ini adalah **referensi statis** (katalog bahan pakan, daftar penyakit, jenis obat, dll.) yang tidak perlu CRUD ke Supabase — bisa tetap sebagai static bundle data.

| File | DB | Keterangan |
|---|---|---|
| `src/data/bahanCairData.ts` | `BAHAN_CAIR_DB` | Katalog bahan cair |
| `src/data/buahLimbahBuahData.ts` | `BUAH_LIMBAH_BUAH_DB` | Katalog buah/limbah |
| `src/data/jagungData.ts` | `JAGUNG_DB` | Katalog jagung |
| `src/data/kelapaData.ts` | `KELAPA_DB` | Katalog kelapa |
| `src/data/kelapaSawitData.ts` | `KELAPA_SAWIT_DB` | Katalog kelapa sawit |
| `src/data/lainnyaData.ts` | `LAINNYA_DB` | Katalog lainnya |
| `src/data/limbahIndustriPanganData.ts` | `LIMBAH_INDUSTRI_DB` | Katalog limbah industri |
| `src/data/masterPakanData.ts` | `MASTER_PAKAN_DB` | Master catalog pakan |
| `src/data/mineralData.ts` | `MINERAL_DB` | Katalog mineral |
| `src/data/obatData.ts` | `OBAT_DB` | Master katalog obat |
| `src/data/padiData.ts` | `PADI_DB` | Katalog padi |
| `src/data/rumputData.ts` | `RUMPUT_DB` | Katalog rumput |
| `src/data/sumberProteinHewaniData.ts` | `SUMBER_PROTEIN_HEWANI_DB` | Katalog protein hewani |
| `src/data/tebuData.ts` | `TEBU_DB` | Katalog tebu |
| `src/data/vitaminFeedAdditiveData.ts` | `VITAMIN_FEED_ADDITIVE_DB` | Katalog vitamin |

---

### 1.7 localStorage — Bridging tanpa Backend

| File | Key | Tujuan | Kategori |
|---|---|---|---|
| `src/data/livestockData.ts` | `ternakhub_user_weights`, `ternakhub_weight_timeline` | Persistensi bobot user | **Bridge DEV** — harus ke Supabase |
| `src/data/livestockEditData.ts` | `ternakhub_livestock_edit_*` | Persistensi form edit | **Bridge DEV** — harus ke Supabase |
| `src/data/livestockFotoData.ts` | `ternakhub_livestock_photos` | Persistensi foto metadata | **Bridge DEV** — harus ke Supabase |
| `src/data/onboardingData.ts` | `ternakhub_onboarding` | Status onboarding | **OK** — UI state murni |
| `src/data/produkKomersialLivingDB.ts` | `ternakhub_admin_mode` | Admin mode flag PK | **Risiko** — harus dari auth role |
| `src/pages/admin/layout/AdminGuard.tsx` | `ternakhub_admin_dev_mode` | DEV admin bypass | **DEV ONLY** — sudah gated |
| `src/pages/admin/layout/AdminLayout.tsx` | `ternakhub_admin_sidebar_collapsed` | Sidebar state | **OK** — UI preference |
| `src/services/platformInitService.ts` | `ternakhub_platform_init_pending` | Init state bridge | **Acceptable** — Supabase latency bridge |
| `src/utils/recentWorkspaces.ts` | `ternakhub_recent_ws` | Recent workspaces | **OK** — UI state murni |

---

### 1.8 `console.*` — 60 Baris di Luar `src/dev/`

| Tipe | Jumlah | Klasifikasi |
|---|---|---|
| `console.error` | 46 | Sebagian besar **acceptable** — data bug signals & service layer errors |
| `console.warn` | 8 | **Acceptable** — startup & config warnings |
| `console.debug` | 2 | **Harus dihapus** — `masterObatAuditLog.ts:33`, `produkKomersialObatAuditLog.ts:30` |
| `console.log` (dalam komentar JSDoc) | 5 | **OK** — dokumentasi contoh, bukan kode aktif |

**File dengan `console.debug` yang harus dihapus:**
- `src/utils/masterObatAuditLog.ts:33`
- `src/utils/produkKomersialObatAuditLog.ts:30`

---

### 1.9 Environment Label di UI Admin

| File | Baris | Isi |
|---|---|---|
| `src/pages/admin/AdminDashboard.tsx` | 110 | Menampilkan "Production"/"Development" label |
| `src/pages/admin/layout/AdminTopBar.tsx` | 455 | Menampilkan "Production"/"Development" di top bar |

**Status:** Acceptable untuk production — hanya display informasi, tidak mempengaruhi behaviour.

---

## 2. PROD ONLY — Sudah Aktif & Benar

| File/Komponen | Fungsi | Status |
|---|---|---|
| `src/lib/supabase.ts` | Supabase client (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY) | ✅ Sudah aktif |
| `src/repositories/workspaceRepository.ts` | Supabase CRUD adapter untuk workspace | ✅ Sudah aktif |
| `src/contexts/AuthContext.tsx` | Supabase Auth session management | ✅ Sudah aktif |
| `src/contexts/WorkspaceContext.tsx` | Reads workspace dari Supabase (post P0-001D) | ✅ Sudah aktif |
| `src/services/workspaceService.ts` | Business layer atas Supabase repo | ✅ Sudah aktif |
| `src/pages/auth/Login.tsx` | Supabase signIn (post P0-001D) | ✅ Sudah aktif |
| `src/pages/auth/ForgotPassword.tsx` | Supabase resetPassword | ✅ Sudah aktif |
| `src/services/platformInitService.ts` | Cek Supabase platform_config tabel | ✅ Sudah aktif |

---

## 3. SHARED — Tipe, Utilitas, Validator

### 3.1 `src/types/` — Seluruhnya SHARED

Semua file tipe TypeScript murni (tidak ada runtime state). Tidak perlu diubah.

### 3.2 `src/utils/` — Mayoritas SHARED

| File | Status |
|---|---|
| `src/utils/livestockSummary.ts` | SHARED — aggregator, `console.error` untuk DATA BUG ok |
| `src/utils/recentWorkspaces.ts` | SHARED — localStorage UI preference ok |
| `src/utils/uuid.ts` | SHARED — pure utility |
| `src/utils/masterObatAuditLog.ts` | SHARED — tapi `console.debug` harus dihapus |
| `src/utils/produkKomersialObatAuditLog.ts` | SHARED — tapi `console.debug` harus dihapus |
| Semua `src/utils/*.ts` lainnya | SHARED |

### 3.3 `src/components/` — Seluruhnya SHARED

UI components tidak mengandung data layer. Aman untuk production.

### 3.4 `src/data/subscriptionFeaturePolicy.ts` — SHARED

Pure policy constants (113 FeatureKeys). Tidak ada runtime state.

### 3.5 Static Master Reference Data — SHARED (Acceptable In-Memory)

Semua file katalog static (lihat Grup I di 1.6) — data referensi read-only yang tidak berubah tanpa deploy baru. Acceptable sebagai bundle data statis.

### 3.6 `src/data/` — Aggregators & Computed — SHARED

File berikut adalah pure read-only aggregators yang membaca dari in-memory DBs. Begitu DBs diganti Supabase, aggregator ini tinggal diubah read-path-nya.

- Semua `src/data/aiInsight*.ts`
- `src/data/alertReminderData.ts`
- `src/data/batchAnalyticsData.ts`
- `src/data/batchHistoryData.ts`
- `src/data/dashboardSummaryData.ts`
- `src/data/dashboardBusinessSnapshotData.ts`
- `src/data/riwayatReproduksiData.ts`
- `src/data/kesehatanTimelineData.ts`
- `src/data/businessInsightData.ts`

---

## 4. Risiko Jika DEV Code Masuk Production

### Risiko KRITIS

| Risiko | Sumber | Dampak |
|---|---|---|
| **Data hilang setiap session** | Semua in-memory DB (Grup A–H di 1.6) tanpa DevAutoSeed | User tidak bisa menyimpan data apapun — seluruh fitur livestock, health, feed, dsb. non-fungsional |
| **Hardcoded user identity** | 4x `CURRENT_*_VIEWER_ID` | Semua user mendapat akses/tampilan identitas user lain (usr-berkah-001, usr-budi-001, usr-amelia-001) — security & privacy breach |
| **Admin dummy data tampil sebagai nyata** | 22 file `admin*.ts` | Admin panel menampilkan data fiktif (backup palsu, escrow palsu, user palsu) ke platform administrator |

### Risiko MEDIUM

| Risiko | Sumber | Dampak |
|---|---|---|
| **DEV admin bypass terlihat di UI** | `AdminGuard.tsx` tombol dev mode | User non-admin melihat tombol "Enable Dev Mode" di halaman AccessDenied (tidak fungsional di production, tapi membingungkan) |
| **localStorage sebagai primary storage** | `livestockData.ts`, `livestockEditData.ts`, `livestockFotoData.ts` | Data user hanya tersimpan di browser — tidak ada sync antar device, tidak ada backup |
| **Admin mode PK via localStorage** | `produkKomersialLivingDB.ts` | Siapapun yang tahu key `ternakhub_admin_mode` bisa mengaktifkan admin mode PK — harus dari auth role |

### Risiko RENDAH

| Risiko | Sumber | Dampak |
|---|---|---|
| **`console.debug` bocor ke production** | 2 file audit log | Log debug terlihat di browser console production — ekspos internal naming |
| **`window.ternakDevFactory`** | `devConsole.ts` | Tidak masuk bundle production (dynamic import gated) — risiko = 0 selama guard ada |

---

## 5. Prioritas Penghapusan / Perbaikan untuk P0-002B

### Prioritas 1 — HARUS selesai sebelum launch (Blocker)

1. **Ganti hardcoded `CURRENT_*_VIEWER_ID`** dengan `useAuth().user?.id` di 4 file:
   - `publicProfileData.ts`, `feedStoreWorkspaceData.ts`, `transportWorkspaceData.ts`, `veterinaryWorkspaceData.ts`

2. **Guard tombol dev mode** di `AdminGuard.tsx` — wrap render tombol dengan `import.meta.env.DEV &&`

3. **Guard `produkKomersialLivingDB.ts` admin mode** — ganti localStorage key dengan validasi auth role dari `useAuth()`

### Prioritas 2 — HARUS selesai sebelum launch (Data Integrity)

4. **Migrasi in-memory DB Grup A (Livestock & Transfer)** ke Supabase:
   - `livestockData.ts`, `transferData.ts`, `mutasiData.ts`, `batchData.ts`
   - Ini unblocks seluruh modul lain yang bergantung pada `LIVESTOCK_DB`

5. **Ganti localStorage persistence** untuk:
   - `livestockData.ts` (weight history) → Supabase tabel `weight_entries`
   - `livestockEditData.ts` (edit metadata) → Supabase tabel `livestock_extended`
   - `livestockFotoData.ts` (photo metadata) → Supabase tabel `livestock_photos` + Supabase Storage

### Prioritas 3 — Sebelum fitur admin diaktifkan

6. **Ganti/hapus semua 22 `admin*.ts` dummy data files** dengan query Supabase

7. **Ganti Global Foundation DBs** (Grup G) dengan Supabase tabel:
   - `globalActivityData.ts`, `globalNotificationData.ts`, `globalTransactionData.ts`, `globalTrustData.ts`, `globalVerificationData.ts`

### Prioritas 4 — Bersih-bersih (Non-blocking)

8. **Hapus `console.debug`** dari 2 file audit log:
   - `src/utils/masterObatAuditLog.ts:33`
   - `src/utils/produkKomersialObatAuditLog.ts:30`

9. **Migrasi in-memory DB Grup B–F** (Kesehatan, Reproduksi, Pakan, Obat, Marketplace) setelah Grup A selesai

10. **Hapus `adminGlobalSearchSeedData.ts`** setelah `GLOBAL_SEARCH_INDEX_DB` terhubung ke Supabase

---

## 6. Daftar File per Kategori (Ringkasan)

### DEV ONLY Files

```
src/dev/data-factory/           (29 file — seluruh direktori)
src/data/adminActivityData.ts
src/data/adminAnnouncementsData.ts
src/data/adminBackupData.ts
src/data/adminCrossWorkspaceLineageData.ts
src/data/adminDataMasterData.ts
src/data/adminEscrowData.ts
src/data/adminFeedData.ts
src/data/adminGlobalSearchSeedData.ts
src/data/adminLivestockData.ts
src/data/adminMarketplaceData.ts
src/data/adminMedicineData.ts
src/data/adminMonitoringData.ts
src/data/adminOwnershipTransferData.ts
src/data/adminRelationshipData.ts
src/data/adminReportsData.ts
src/data/adminSubscriptionData.ts
src/data/adminTrustData.ts
src/data/adminTrustVerificationData.ts
```

### DEV ONLY — Bagian dari file SHARED (harus dipisah atau diberi guard)

```
src/data/publicProfileData.ts           → CURRENT_VIEWER_ID hardcoded
src/data/feedStoreWorkspaceData.ts      → CURRENT_FSW_VIEWER_ID hardcoded
src/data/transportWorkspaceData.ts      → CURRENT_TRANSPORT_VIEWER_ID hardcoded
src/data/veterinaryWorkspaceData.ts     → CURRENT_VET_VIEWER_ID hardcoded
src/pages/admin/layout/AdminGuard.tsx   → tombol dev mode render di production
src/data/produkKomersialLivingDB.ts     → admin mode via localStorage
src/utils/masterObatAuditLog.ts:33      → console.debug
src/utils/produkKomersialObatAuditLog.ts:30 → console.debug
```

### PROD ONLY Files

```
src/lib/supabase.ts
src/repositories/workspaceRepository.ts
src/contexts/AuthContext.tsx
src/contexts/WorkspaceContext.tsx
src/services/workspaceService.ts
src/pages/auth/Login.tsx
src/pages/auth/ForgotPassword.tsx
src/services/platformInitService.ts
```

### SHARED Files (tipe, utilitas, komponen, halaman)

```
src/types/          (semua)
src/utils/          (semua, kecuali 2 file dengan console.debug)
src/components/     (semua)
src/pages/          (semua — data layer-nya yang harus diganti, bukan page-nya)
src/data/subscriptionFeaturePolicy.ts
src/data/adminNavData.ts
src/data/adminNotificationsData.ts
src/data/*DetailData.ts     (semua detail pages — static reference)
src/data/speciesData.ts
src/data/daftarPenyakitData.ts
src/data/kategoriPenyakitData.ts
src/data/jenisTernakPenyakitData.ts
```

---

*Audit ini adalah dasar untuk P0-002B. Tidak ada file yang diubah dalam dokumen ini.*
