# P0-001 — Audit Data Layer Production Readiness

**Tanggal Audit:** 2026-07-21  
**Branch:** feature/production-readiness  
**Auditor:** Agent (P0-001 Task)  
**Scope:** Seluruh `src/data/` (254 file), `src/services/` (19 file), `src/dev/` (29 file), `src/lib/`, `src/contexts/`

---

## Ringkasan

TernakHub saat ini berjalan sepenuhnya di atas **data in-memory** dan **hardcoded seed**. Dari total **254 file data**, hanya **3 titik** di seluruh project yang benar-benar menggunakan Supabase (`lib/supabase.ts`, `platformInitService.ts`, `AuthContext.tsx`). Seluruh data operasional — livestock, batch, marketplace, transaksi, escrow, stok obat, reproduksi, dan lainnya — hilang setiap kali browser di-refresh.

**Temuan Kritis:**
- **0 dari 254 file `src/data/*.ts`** menggunakan Supabase.
- **18 dari 19 service** beroperasi murni di atas in-memory store.
- **Data admin panel** (activity, backup, user, escrow, monitoring, dll.) semuanya adalah hardcoded dummy — tidak mencerminkan data production nyata.
- **Dev Data Factory** (`src/dev/`) meng-generate hingga 500+ livestock dan ribuan record terkait langsung ke in-memory store; ini **tidak boleh aktif di production**.
- Satu-satunya integrasi Supabase yang berjalan adalah **Auth** (login/logout/session). Semua data domain belum terhubung.

---

## Daftar Temuan

### A. Infrastruktur & Auth

| File | Kategori | Production Ready | Rekomendasi |
|------|----------|:---:|-------------|
| `src/lib/supabase.ts` | Production Data | ✅ Ya | Sudah menggunakan Supabase client. Tetap pertahankan. |
| `src/services/platformInitService.ts` | Production Data | ✅ Ya | Satu-satunya service yang query Supabase (`platform_config` table). |
| `src/contexts/AuthContext.tsx` | Production Data | ✅ Ya | Auth lengkap via Supabase (signIn, signUp, signOut, onAuthStateChange). |
| `src/contexts/WorkspaceContext.tsx` | Local Repository | ❌ Tidak | Menggunakan in-memory `workspaceFoundationData`; tidak terhubung ke user Supabase. |

### B. Workspace & Subscription

| File | Kategori | Production Ready | Rekomendasi |
|------|----------|:---:|-------------|
| `src/data/workspaceFoundationData.ts` | Local Repository | ❌ Tidak | Berisi 6 workspace seed hardcoded (w1–w6). Harus diganti dengan query Supabase berdasarkan auth user. |
| `src/data/workspaceManagementData.ts` | Local Repository | ❌ Tidak | CRUD workspace hanya di in-memory. Perlu tabel `workspaces` di Supabase. |
| `src/data/workspaceMembersData.ts` | Local Repository | ❌ Tidak | Member list in-memory. Perlu tabel `workspace_members`. |
| `src/data/workspaceSubscriptionData.ts` | Reference Data | ✅ Ya | Definisi plan & feature gate. Layak tetap di source code. |
| `src/data/subscriptionFeaturePolicy.ts` | Reference Data | ✅ Ya | SSOT kebijakan fitur. Layak tetap di source code. |

### C. Core Livestock & Batch

| File | Kategori | Production Ready | Rekomendasi |
|------|----------|:---:|-------------|
| `src/data/livestockData.ts` | Local Repository | ❌ Tidak | `LIVESTOCK_DB` in-memory. Data hilang saat refresh. Perlu tabel `livestock`. |
| `src/data/livestockEditData.ts` | Local Repository | ❌ Tidak | Metadata edit + history di localStorage. Perlu kolom di tabel `livestock`. |
| `src/data/livestockFotoData.ts` | Local Repository | ❌ Tidak | Foto di localStorage. Perlu Supabase Storage + tabel `livestock_photos`. |
| `src/data/batchData.ts` | Local Repository | ❌ Tidak | `BATCH_DB` in-memory. Perlu tabel `batches` dan `batch_members`. |
| `src/data/batchAnalyticsData.ts` | Local Repository | ❌ Tidak | Agregator in-memory dari batchData. Ikut migrasi batchData. |
| `src/data/batchHistoryData.ts` | Local Repository | ❌ Tidak | History in-memory. Perlu tabel `batch_history`. |
| `src/data/batchOperationsData.ts` | Local Repository | ❌ Tidak | Operasi batch in-memory. Ikut migrasi batchData. |
| `src/data/speciesData.ts` | Reference Data | ✅ Ya | Enum species & breed. Layak tetap di source code. |

### D. Transfer & Mutasi

| File | Kategori | Production Ready | Rekomendasi |
|------|----------|:---:|-------------|
| `src/data/transferData.ts` | Local Repository | ❌ Tidak | `TRANSFER_RECORDS` in-memory. Perlu tabel `livestock_transfers`. |
| `src/data/mutasiData.ts` | Local Repository | ❌ Tidak | `MUTASI_DB` in-memory. Perlu tabel `mutation_requests`. |
| `src/data/mutasiLivestockData.ts` | Local Repository | ❌ Tidak | Agregator mutasi. Ikut migrasi mutasiData. |
| `src/data/notifikasiData.ts` | Local Repository | ❌ Tidak | Notifikasi in-memory. Perlu tabel `notifications`. |

### E. Global Foundation Services

| File | Kategori | Production Ready | Rekomendasi |
|------|----------|:---:|-------------|
| `src/data/globalActivityData.ts` | In-Memory | ❌ Tidak | `GLOBAL_ACTIVITY_DB` (Map). Perlu tabel `activity_logs`. |
| `src/data/globalAuditTrailData.ts` | In-Memory | ❌ Tidak | `GLOBAL_AUDIT_TRAIL_DB` (Array). Perlu tabel `audit_trail`. |
| `src/data/globalConversationData.ts` | In-Memory | ❌ Tidak | `GLOBAL_CONVERSATION_DB` + `MESSAGE_DB` (Map). Perlu tabel `conversations`, `messages`. |
| `src/data/globalTransactionData.ts` | In-Memory | ❌ Tidak | `GLOBAL_TRANSACTION_DB` (Map). Perlu tabel `transactions`. |
| `src/data/globalEscrowData.ts` | In-Memory | ❌ Tidak | `GLOBAL_ESCROW_DB` (Map) + mock provider hardcoded. Perlu tabel `escrow_records`. |
| `src/data/globalEvidenceData.ts` | In-Memory | ❌ Tidak | `GLOBAL_EVIDENCE_DB` (Map). Perlu tabel `evidence`. |
| `src/data/globalMediaData.ts` | In-Memory | ❌ Tidak | Registry media in-memory. Perlu Supabase Storage + tabel `media`. |
| `src/data/globalNotificationData.ts` | In-Memory | ❌ Tidak | `GLOBAL_NOTIFICATION_DB` (Map). Perlu tabel `notifications`. |
| `src/data/globalTrustData.ts` | In-Memory | ❌ Tidak | `GLOBAL_TRUST_DB` + `GLOBAL_TRUST_HISTORY_DB` (Map). Perlu tabel `trust_scores`. |
| `src/data/globalVerificationData.ts` | In-Memory | ❌ Tidak | `GLOBAL_VERIFICATION_DB` (Map). Perlu tabel `verifications`. |
| `src/data/globalSearchData.ts` | In-Memory | ❌ Tidak | `GLOBAL_SEARCH_INDEX_DB` (Map). Perlu search index (pg_trgm atau external). |
| `src/data/globalAiInsightData.ts` | In-Memory | ❌ Tidak | `GLOBAL_AI_INSIGHT_DB` (Map). Perlu tabel `ai_insights`. |
| `src/data/globalReferenceData.ts` | Reference Data | ✅ Ya | UUID-mapped lookup constants. Layak tetap di source code. |

### F. Services (Global Foundation)

| File | Kategori | Production Ready | Rekomendasi |
|------|----------|:---:|-------------|
| `src/services/globalActivityService.ts` | In-Memory | ❌ Tidak | Wraps `globalActivityData`. Perlu dimigrasi ke Supabase query. |
| `src/services/globalAuditTrailService.ts` | In-Memory | ❌ Tidak | Wraps `globalAuditTrailData`. Perlu dimigrasi. |
| `src/services/globalConversationService.ts` | In-Memory | ❌ Tidak | Wraps `globalConversationData`. Perlu dimigrasi. |
| `src/services/globalTransactionService.ts` | In-Memory | ❌ Tidak | Wraps `globalTransactionData`. Perlu dimigrasi. |
| `src/services/globalEscrowService.ts` | In-Memory | ❌ Tidak | Wraps `globalEscrowData`. Perlu dimigrasi. |
| `src/services/globalEvidenceService.ts` | In-Memory | ❌ Tidak | Wraps `globalEvidenceData`. Perlu dimigrasi. |
| `src/services/globalMediaService.ts` | In-Memory | ❌ Tidak | Wraps `globalMediaData`. Perlu dimigrasi ke Supabase Storage. |
| `src/services/globalNotificationService.ts` | In-Memory | ❌ Tidak | Wraps `globalNotificationData`. Perlu dimigrasi. |
| `src/services/globalSearchService.ts` | In-Memory | ❌ Tidak | Wraps `globalSearchData`. Perlu search engine real. |
| `src/services/globalTrustService.ts` | In-Memory | ❌ Tidak | Wraps `globalTrustData`. Perlu dimigrasi. |
| `src/services/globalVerificationService.ts` | In-Memory | ❌ Tidak | Wraps `globalVerificationData`. Perlu dimigrasi. |
| `src/services/globalAiInsightService.ts` | In-Memory | ❌ Tidak | Wraps `globalAiInsightData`. Perlu dimigrasi. |
| `src/services/globalReferenceService.ts` | Reference Data | ✅ Ya | Wraps constants statis. Tidak perlu migrasi. |
| `src/services/foundationBridge.ts` | In-Memory | ❌ Tidak | Orkestrasi lintas-service. Ikut migrasi service lainnya. |
| `src/services/workspaceService.ts` | In-Memory | ❌ Tidak | Wraps `workspaceFoundationData`. Perlu terhubung ke Supabase. |
| `src/services/integrasiPengobatanService.ts` | In-Memory | ❌ Tidak | Mutasi atomik health+stok. Perlu backend transaction. |
| `src/services/masterObatService.ts` | In-Memory | ❌ Tidak | Facade obat. Ikut migrasi data obat. |
| `src/services/serviceInvitationNotificationHooks.ts` | In-Memory | ❌ Tidak | Fire notifikasi via in-memory service. Ikut migrasi notifikasi. |

### G. Transaksi & Escrow

| File | Kategori | Production Ready | Rekomendasi |
|------|----------|:---:|-------------|
| `src/data/transactionRoomData.ts` | Local Repository | ❌ Tidak | Room state in-memory. Perlu tabel `transaction_rooms`. |
| `src/data/transactionOrchestrationData.ts` | Local Repository | ❌ Tidak | State machine in-memory. Perlu tabel `transaction_states`. |
| `src/data/transactionAttachmentData.ts` | Local Repository | ❌ Tidak | Attachment metadata in-memory. Perlu Supabase Storage + tabel. |
| `src/data/transactionReceiptData.ts` | Local Repository | ❌ Tidak | Kwitansi in-memory. Perlu tabel `transaction_receipts`. |
| `src/data/transactionNotificationData.ts` | Local Repository | ❌ Tidak | Notifikasi transaksi in-memory. Ikut migrasi notifications. |
| `src/data/transaksiConversationData.ts` | Local Repository | ❌ Tidak | Chat per-transaksi in-memory. Perlu tabel `transaksi_conversations`. |
| `src/data/transaksiEscrowData.ts` | Seed | ❌ Tidak | Auto-seed data escrow dengan hardcoded records. Perlu tabel `escrow_records`. |
| `src/data/transaksiEvidenceData.ts` | Local Repository | ❌ Tidak | Bukti transaksi in-memory. Perlu tabel `evidence`. |
| `src/data/transaksiAuditTrailData.ts` | Local Repository | ❌ Tidak | Audit trail per-transaksi in-memory. Perlu tabel `audit_trail`. |
| `src/data/transaksiTransportData.ts` | Seed | ❌ Tidak | Auto-seed dari marketplace data. Perlu tabel `transport_transactions`. |
| `src/data/roomTimelineData.ts` | Local Repository | ❌ Tidak | Timeline event in-memory. Perlu tabel `room_timeline`. |
| `src/data/escrowConfigData.ts` | In-Memory | ❌ Tidak | Konfigurasi escrow in-memory (Map). Perlu tabel config atau env vars. |
| `src/data/escrowWorkflowData.ts` | In-Memory | ❌ Tidak | Status workflow escrow in-memory. Perlu tabel escrow. |
| `src/data/escrowDirectoryData.ts` | Reference Data | ✅ Ya | Adapter logis saja; baca dari master data. Tidak ada store sendiri. |
| `src/data/masterEscrowData.ts` | Seed | ❌ Tidak | Provider/akun escrow hardcoded seed. Perlu tabel `escrow_providers`. |
| `src/data/transportConfigData.ts` | In-Memory | ❌ Tidak | Konfigurasi transport in-memory. Perlu tabel atau env vars. |
| `src/data/transportTripData.ts` | In-Memory | ❌ Tidak | Trip aktif in-memory (Map). Perlu tabel `transport_trips`. |

### H. Marketplace

| File | Kategori | Production Ready | Rekomendasi |
|------|----------|:---:|-------------|
| `src/data/marketplaceListingData.ts` | Local Repository | ❌ Tidak | Listing in-memory. Perlu tabel `marketplace_listings`. |
| `src/data/marketplaceTransaksiData.ts` | Local Repository | ❌ Tidak | Transaksi in-memory. Perlu tabel `marketplace_transactions`. |
| `src/data/marketplaceChatData.ts` | Local Repository | ❌ Tidak | Chat/pesan in-memory. Perlu tabel `marketplace_chats`. |
| `src/data/marketplaceNegosiasiData.ts` | Seed | ❌ Tidak | Negosiasi dengan hardcoded seed + in-memory store. Perlu tabel `negotiations`. |
| `src/data/marketplaceWishlistData.ts` | Local Repository | ❌ Tidak | Wishlist in-memory. Perlu tabel `wishlists`. |
| `src/data/marketplaceModerasiData.ts` | Local Repository | ❌ Tidak | Kasus moderasi in-memory. Perlu tabel `moderation_cases`. |
| `src/data/marketplaceAsetWorkspaceData.ts` | In-Memory | ❌ Tidak | Aset workspace in-memory. Ikut migrasi workspace + livestock. |
| `src/data/marketplaceLaporanData.ts` | Local Repository | ❌ Tidak | Laporan in-memory. Perlu tabel `reports`. |
| `src/data/marketplaceDashboardData.ts` | Reference Data | ✅ Ya | Definisi UI dashboard. Tidak ada store. |
| `src/data/marketplaceBuyerDashboardData.ts` | Reference Data | ✅ Ya | Agregator read-only. Tidak ada store sendiri. |
| `src/data/marketplaceFilterData.ts` | Reference Data | ✅ Ya | Enum filter statis. Layak tetap di source code. |
| `src/data/marketplaceKategoriData.ts` | Reference Data | ✅ Ya | Kategori listing statis. Layak tetap di source code. |
| `src/data/marketplaceCreateListingMenuData.ts` | Reference Data | ✅ Ya | Menu UI statis. Layak tetap di source code. |
| `src/data/marketplaceRiwayatAktivitasData.ts` | Reference Data | ✅ Ya | Agregator read-only lintas modul. Tidak ada store sendiri. |
| `src/data/dealData.ts` | In-Memory | ❌ Tidak | `DEAL_STORE` in-memory. Perlu tabel `deals`. |
| `src/data/serviceQuotationData.ts` | In-Memory | ❌ Tidak | `QUOTATION_STORE` (Map) in-memory. Perlu tabel `quotations`. |
| `src/data/serviceProviderSnapshotData.ts` | Seed | ❌ Tidak | Snapshot provider hardcoded. Perlu query dari workspace+service data. |
| `src/data/marketplaceAiInsightData.ts` | Reference Data | ✅ Ya | Rule-based engine read-only. Tidak ada store. |
| `src/data/marketplaceAiInsightMPK020Data.ts` | Reference Data | ✅ Ya | AI engine read-only. Tidak ada store. |

### I. News, RSS & Publikasi

| File | Kategori | Production Ready | Rekomendasi |
|------|----------|:---:|-------------|
| `src/data/newsEventData.ts` | Seed | ❌ Tidak | Artikel/event hardcoded seed. Perlu tabel `news_events`. |
| `src/data/newsEventSubmissionData.ts` | Local Repository | ❌ Tidak | Submission in-memory. Perlu tabel `news_submissions`. |
| `src/data/newsEventValidationData.ts` | Local Repository | ❌ Tidak | Validasi in-memory. Perlu tabel `news_validations`. |
| `src/data/publicationManagementData.ts` | Local Repository | ❌ Tidak | Manajemen publikasi in-memory. Perlu tabel `publications`. |
| `src/data/rssSourceData.ts` | Seed | ❌ Tidak | Sumber RSS hardcoded. Perlu tabel `rss_sources`. |
| `src/data/rssCollectorData.ts` | In-Memory | ❌ Tidak | Collector in-memory. Perlu tabel `rss_collected`. |
| `src/data/rssQueueData.ts` | In-Memory | ❌ Tidak | Queue RSS in-memory. Perlu queue system (tabel atau job queue). |

### J. Workspace Publik (Farm Profile, Feed Store, Vet, Transport)

| File | Kategori | Production Ready | Rekomendasi |
|------|----------|:---:|-------------|
| `src/data/farmProfileData.ts` | Seed | ❌ Tidak | Profil farm hardcoded (w1 Garut, w2 Tasik). Ikut migrasi workspace. |
| `src/data/feedStoreWorkspaceData.ts` | Seed | ❌ Tidak | Data toko pakan hardcoded (w7, 25 produk). Ikut migrasi workspace. |
| `src/data/veterinaryWorkspaceData.ts` | Seed | ❌ Tidak | Data dokter/klinik hewan hardcoded (w5, w6). Ikut migrasi workspace. |
| `src/data/transportWorkspaceData.ts` | Seed | ❌ Tidak | Armada, driver, coverage area hardcoded. Perlu tabel transport workspace. |
| `src/data/layananTransportData.ts` | Seed | ❌ Tidak | Layanan transport hardcoded. Ikut migrasi. |
| `src/data/layananDokterHewanData.ts` | Seed | ❌ Tidak | Layanan dokter hewan hardcoded. Ikut migrasi. |
| `src/data/layananKlinikHewanData.ts` | Seed | ❌ Tidak | Layanan klinik hewan hardcoded. Ikut migrasi. |

### K. Kesehatan Hewan & Obat

| File | Kategori | Production Ready | Rekomendasi |
|------|----------|:---:|-------------|
| `src/data/stokObatData.ts` | Local Repository | ❌ Tidak | `STOK_OBAT_ITEMS` in-memory. Perlu tabel `stok_obat`. |
| `src/data/riwayatObatData.ts` | Local Repository | ❌ Tidak | `RIWAYAT_OBAT_RECORDS` in-memory. Perlu tabel `riwayat_obat`. |
| `src/data/diagnosaKesehatanData.ts` | Local Repository | ❌ Tidak | `DIAGNOSA_DB` kosong in-memory. Perlu tabel `diagnosa`. |
| `src/data/kesehatanTimelineData.ts` | Local Repository | ❌ Tidak | `KH_TIMELINE_LOG` kosong in-memory. Perlu tabel `health_events`. |
| `src/data/kontrolKesehatanData.ts` | Local Repository | ❌ Tidak | `KONTROL_RECORDS` kosong in-memory. Perlu tabel `health_checkups`. |
| `src/data/tindakanKesehatanData.ts` | Local Repository | ❌ Tidak | `TINDAKAN_SESI_DB` in-memory. `MASTER_TINDAKAN` bisa tetap di code. |
| `src/data/riwayatKesehatanData.ts` | Local Repository | ❌ Tidak | `RIWAYAT_KESEHATAN_RECORDS` in-memory. Perlu tabel `health_records`. |
| `src/data/daftarPenyakitData.ts` | Seed | ❌ Tidak | `DAFTAR_PENYAKIT` — berlabel "referensi penyakit dummy". Perlu tabel `diseases` atau migrasi ke DB. |
| `src/data/jenisTernakPenyakitData.ts` | Reference Data | ✅ Ya | Berlabel "angka dummy untuk tampilan" tapi statis. Perlu validasi ulang setelah data nyata ada. |
| `src/data/kategoriPenyakitData.ts` | Reference Data | ✅ Ya | 12 kategori statis. Layak tetap di source code. |
| `src/data/obatData.ts` | Seed | ❌ Tidak | Katalog obat >8.000 baris. Sebaiknya dimuat ke tabel `master_obat`. |
| `src/data/obatDetailData.ts` | Seed | ❌ Tidak | Detail farmakologi >10.000 baris. Ikut migrasi ke tabel `master_obat_detail`. |
| `src/data/masterObatKategoriData.ts` | Reference Data | ✅ Ya | 9 kategori obat statis. Layak tetap di source code. |

### L. Produk Komersial (Pakan & Obat)

| File | Kategori | Production Ready | Rekomendasi |
|------|----------|:---:|-------------|
| `src/data/produkKomersialData.ts` | Local Repository | ❌ Tidak | Database PK in-memory (mutable arrays). Perlu tabel `produk_komersial`. |
| `src/data/produkKomersialLivingDB.ts` | Local Repository | ❌ Tidak | Mutasi PK in-memory dengan CRUD+audit. Perlu backend. |
| `src/data/konsentratMerekData.ts` | Local Repository | ❌ Tidak | Merek konsentrat in-memory. Perlu tabel `konsentrat_merek`. |
| `src/data/konsentratSeriData.ts` | Local Repository | ❌ Tidak | Seri konsentrat in-memory (60 entri). Perlu tabel. |
| `src/data/konsentratDetailData.ts` | Local Repository | ❌ Tidak | Detail konsentrat in-memory. Perlu tabel. |
| `src/data/produkKomersialObatData.ts` | Local Repository | ❌ Tidak | 10 merek + 98 produk obat in-memory. Perlu tabel. |
| `src/data/masterReferensiPKData.ts` | Reference Data | ✅ Ya | Referensi regulasi/sertifikasi statis. Layak tetap. |
| `src/data/knowledgeBasePKData.ts` | Reference Data | ✅ Ya | Artikel knowledge base (UUID-keyed). Layak di source atau bisa ke DB. |
| `src/data/aiReadinessPKData.ts` | Reference Data | ✅ Ya | Kesiapan AI per kategori PK. Statis. |
| `src/data/auditLogProdukKomersialData.ts` | Local Repository | ❌ Tidak | Audit log PK in-memory. Perlu tabel `pk_audit_log`. |
| `src/data/dokumenProdukKomersialData.ts` | Local Repository | ❌ Tidak | Dokumen PK in-memory. Perlu Supabase Storage. |
| `src/data/importProdukKomersialData.ts` | Reference Data | ✅ Ya | Logic import/validasi. Tidak ada store sendiri. |
| `src/data/exportProdukKomersialData.ts` | Reference Data | ✅ Ya | Logic export. Tidak ada store sendiri. |
| `src/data/stokProdukKomersialData.ts` | Reference Data | ✅ Ya | Adapter read-only. Tidak ada store sendiri. |

### M. Reproduksi

| File | Kategori | Production Ready | Rekomendasi |
|------|----------|:---:|-------------|
| `src/data/reproduksiProgramData.ts` | Local Repository | ❌ Tidak | `PROGRAM_REPRODUKSI_DB` in-memory. Perlu tabel `reproduksi_programs`. |
| `src/data/pelaksanaanReproduksiData.ts` | Local Repository | ❌ Tidak | `PELAKSANAAN_DB` in-memory. Perlu tabel. |
| `src/data/monitoringReproduksiData.ts` | Local Repository | ❌ Tidak | `MONITORING_DB` in-memory. Perlu tabel. |
| `src/data/pemeriksaanKebuntinganData.ts` | Local Repository | ❌ Tidak | `PEMERIKSAAN_DB` in-memory. Perlu tabel. |
| `src/data/kebuntinganData.ts` | Local Repository | ❌ Tidak | `KEBUNTINGAN_DB` + `KEBUNTINGAN_MONITORING_DB` in-memory. Perlu tabel. |
| `src/data/kelahiranData.ts` | Local Repository | ❌ Tidak | `KELAHIRAN_DB` + `ANAK_DB` in-memory. Perlu tabel. |
| `src/data/registrasiAnakData.ts` | Reference Data | ✅ Ya | Orkestrasi bridge dari anak ke livestock. Tidak ada store sendiri. |
| `src/data/sapihData.ts` | Local Repository | ❌ Tidak | `SAPIH_DB` in-memory. Perlu tabel `sapih`. |
| `src/data/riwayatReproduksiData.ts` | Reference Data | ✅ Ya | Agregator read-only. Tidak ada store sendiri. |

### N. Pakan Operasional (Stok & Pemberian)

| File | Kategori | Production Ready | Rekomendasi |
|------|----------|:---:|-------------|
| `src/data/stokInventarisData.ts` | Local Repository | ❌ Tidak | `INVENTARIS_DB` in-memory. Perlu tabel `stok_inventaris`. |
| `src/data/jadwalPemberianPakanData.ts` | Local Repository | ❌ Tidak | `JADWAL_PEMBERIAN_DB` in-memory. Perlu tabel `jadwal_pakan`. |
| `src/data/pemberianPakanData.ts` | Local Repository | ❌ Tidak | `PEMBERIAN_PAKAN_DB` in-memory. Perlu tabel `pemberian_pakan`. |
| `src/data/produksiFormulaData.ts` | Local Repository | ❌ Tidak | `PRODUKSI_DB` in-memory. Perlu tabel `produksi_formula`. |
| `src/data/formulaData.ts` | Reference Data | ✅ Ya | Definisi tipe & interface formula. Tidak ada store. |
| `src/data/formulaMasterPakanData.ts` | Reference Data | ✅ Ya | Adapter kategori pakan → modul formula. Tidak ada store. |
| `src/data/formulaProdukKomersialData.ts` | Reference Data | ✅ Ya | Adapter PK → formula. UUID-based. |
| `src/data/masterPakanData.ts` | Reference Data | ✅ Ya | Tipe dan interface master pakan. |
| `src/data/riwayatStokPakanData.ts` | Reference Data | ✅ Ya | Agregator read-only. Tidak ada store sendiri. |

### O. Database Nutrisi Pakan (Master Reference — 32 file)

Ke-32 file berikut berisi **database nutrisi statis** (kadar protein, energi, serat, dll.) untuk berbagai bahan pakan ternak. Data ini adalah **referensi ilmiah** yang sesuai untuk tetap berada di source code, atau dapat dimuat ke tabel `master_pakan_nutrisi` agar dapat diperbarui tanpa deploy.

| File | Kategori | Production Ready | Rekomendasi |
|------|----------|:---:|-------------|
| `src/data/rumputData.ts` | Reference Data | ✅ Ya | Katalog 30+ jenis rumput. Layak di code atau tabel referensi. |
| `src/data/rumputDetailData.ts` | Reference Data | ✅ Ya | Detail nutrisi rumput. |
| `src/data/leguminosaData.ts` | Reference Data | ✅ Ya | 15 tanaman leguminosa. |
| `src/data/leguminosaDetailData.ts` | Reference Data | ✅ Ya | Detail nutrisi leguminosa. |
| `src/data/daunanData.ts` | Reference Data | ✅ Ya | 22 jenis daun. |
| `src/data/daunanDetailData.ts` | Reference Data | ✅ Ya | Detail nutrisi daun. |
| `src/data/buahLimbahBuahData.ts` | Reference Data | ✅ Ya | Buah & limbah buah. |
| `src/data/buahLimbahDetailData.ts` | Reference Data | ✅ Ya | Detail nutrisi buah/limbah. |
| `src/data/jagungData.ts` | Reference Data | ✅ Ya | Base enums & types untuk 18 kategori. |
| `src/data/jagungDetailData.ts` | Reference Data | ✅ Ya | Detail nutrisi jagung. |
| `src/data/serealiaData.ts` | Reference Data | ✅ Ya | 17 serealia. |
| `src/data/serealiaDetailData.ts` | Reference Data | ✅ Ya | Detail nutrisi serealia. |
| `src/data/kacangBijianData.ts` | Reference Data | ✅ Ya | 21 kacang/biji-bijian. |
| `src/data/kacangBijianDetailData.ts` | Reference Data | ✅ Ya | Detail nutrisi kacang. |
| `src/data/umbiData.ts` | Reference Data | ✅ Ya | 20 jenis umbi. |
| `src/data/umbiDetailData.ts` | Reference Data | ✅ Ya | Detail nutrisi umbi. |
| `src/data/tebuData.ts` | Reference Data | ✅ Ya | Produk tebu. |
| `src/data/tebuDetailData.ts` | Reference Data | ✅ Ya | Detail nutrisi tebu. |
| `src/data/kelapaData.ts` | Reference Data | ✅ Ya | Produk kelapa. |
| `src/data/kelapaDetailData.ts` | Reference Data | ✅ Ya | Detail nutrisi kelapa. |
| `src/data/kelapaSawitData.ts` | Reference Data | ✅ Ya | Produk kelapa sawit. |
| `src/data/kelapaSawitDetailData.ts` | Reference Data | ✅ Ya | Detail nutrisi kelapa sawit. |
| `src/data/bahanCairData.ts` | Reference Data | ✅ Ya | Bahan cair pakan. |
| `src/data/bahanCairDetailData.ts` | Reference Data | ✅ Ya | Detail nutrisi bahan cair. |
| `src/data/vitaminFeedAdditiveData.ts` | Reference Data | ✅ Ya | Vitamin & aditif pakan. |
| `src/data/vitaminFeedAdditiveDetailData.ts` | Reference Data | ✅ Ya | Detail nutrisi vitamin/aditif. |
| `src/data/sumberProteinHewaniData.ts` | Reference Data | ✅ Ya | Protein hewani. |
| `src/data/sumberProteinHewaniDetailData.ts` | Reference Data | ✅ Ya | Detail nutrisi protein hewani. |
| `src/data/limbahIndustriPanganData.ts` | Reference Data | ✅ Ya | Limbah industri pangan. |
| `src/data/limbahIndustriDetailData.ts` | Reference Data | ✅ Ya | Detail nutrisi limbah industri. |
| `src/data/lainnyaData.ts` | Reference Data | ✅ Ya | Bahan pakan lainnya. |
| `src/data/lainnyaDetailData.ts` | Reference Data | ✅ Ya | Detail nutrisi bahan lainnya. |

### P. Admin Panel (Dummy Data — semua NOT production ready)

Seluruh 21 file berikut berisi **hardcoded dummy arrays** untuk panel admin. Data ini **tidak mencerminkan data production nyata**.

| File | Kategori | Production Ready | Rekomendasi |
|------|----------|:---:|-------------|
| `src/data/adminActivityData.ts` | Dummy | ❌ Tidak | Ganti dengan query `audit_trail` / `activity_logs` Supabase. |
| `src/data/adminAnnouncementsData.ts` | Dummy | ❌ Tidak | Perlu tabel `announcements`. |
| `src/data/adminBackupData.ts` | Dummy | ❌ Tidak | Perlu tabel `backup_records` atau integrasi backup service. |
| `src/data/adminCrossWorkspaceLineageData.ts` | Dummy | ❌ Tidak | Perlu query dari tabel `livestock` + `pedigree`. |
| `src/data/adminDataMasterData.ts` | Dummy | ❌ Tidak | Perlu tabel `data_master` atau query dari masing-masing master. |
| `src/data/adminEscrowData.ts` | Dummy | ❌ Tidak | Perlu query dari tabel `escrow_records`. |
| `src/data/adminFeedData.ts` | Dummy | ❌ Tidak | Perlu query dari tabel `stok_inventaris`. |
| `src/data/adminGlobalSearchSeedData.ts` | Seed | ❌ Tidak | Seed index untuk testing. Hapus di production. |
| `src/data/adminLivestockData.ts` | Dummy | ❌ Tidak | Perlu query dari tabel `livestock`. |
| `src/data/adminMarketplaceData.ts` | Dummy | ❌ Tidak | Perlu query dari tabel `marketplace_listings`. |
| `src/data/adminMedicineData.ts` | Dummy | ❌ Tidak | Perlu query dari tabel `master_obat`. |
| `src/data/adminMonitoringData.ts` | Dummy | ❌ Tidak | Perlu integrasi sistem monitoring nyata. |
| `src/data/adminNotificationsData.ts` | Dummy | ❌ Tidak | Perlu query dari tabel `notifications`. |
| `src/data/adminOwnershipTransferData.ts` | Dummy | ❌ Tidak | Perlu query dari tabel `ownership_transfers`. |
| `src/data/adminRelationshipData.ts` | Dummy | ❌ Tidak | Perlu query dari tabel `relationships`. |
| `src/data/adminReportsData.ts` | Dummy | ❌ Tidak | Perlu query lintas tabel + export engine. |
| `src/data/adminSettingsData.ts` | Dummy | ❌ Tidak | Perlu tabel `platform_settings` atau env vars. |
| `src/data/adminSubscriptionData.ts` | Dummy | ❌ Tidak | Perlu query dari tabel `subscriptions`. |
| `src/data/adminTrustData.ts` | Dummy | ❌ Tidak | Perlu query dari tabel `trust_scores`. |
| `src/data/adminTrustVerificationData.ts` | Dummy | ❌ Tidak | Perlu query dari tabel `verifications`. |
| `src/data/adminWorkspacesData.ts` | Dummy | ❌ Tidak | Perlu query dari tabel `workspaces`. |
| `src/data/adminDashboardData.ts` | Reference Data | ✅ Ya | Definisi UI saja. Data dari Supabase di komponen. |
| `src/data/adminNavData.ts` | Reference Data | ✅ Ya | Sidebar nav statis. Layak di source code. |
| `src/data/adminUsersData.ts` | Reference Data | ✅ Ya | Config/type saja. Data dari Supabase auth. |

### Q. Dashboard & AI Insight

| File | Kategori | Production Ready | Rekomendasi |
|------|----------|:---:|-------------|
| `src/data/dashboardSummaryData.ts` | Reference Data | ✅ Ya | Adapter/builder untuk widget dashboard. |
| `src/data/dashboardPersonalizationData.ts` | In-Memory | ❌ Tidak | Preferensi widget hilang saat refresh. Perlu tabel `user_preferences`. |
| `src/data/dashboardNewsEventData.ts` | Reference Data | ✅ Ya | Widget adapter read-only. |
| `src/data/dashboardBusinessSnapshotData.ts` | Reference Data | ✅ Ya | Snapshot bisnis read-only. |
| `src/data/alertReminderData.ts` | Reference Data | ✅ Ya | Agregator alert. Computed dari in-memory store; ikut migrasi. |
| `src/data/todayActivityData.ts` | Reference Data | ✅ Ya | Agregator aktivitas harian. Ikut migrasi. |
| `src/data/businessInsightData.ts` | Reference Data | ✅ Ya | Agregator bisnis. Ikut migrasi. |
| `src/data/aiInsightData.ts` | Mock | ❌ Tidak | `AI_INSIGHT_DUMMY_LIST` — hardcoded dummy. Ganti dengan engine nyata. |
| `src/data/aiInsightBatchData.ts` | Reference Data | ✅ Ya | Rule-based AI engine. Tidak ada store. |
| `src/data/aiInsightBobotData.ts` | Reference Data | ✅ Ya | Rule-based AI engine. Tidak ada store. |
| `src/data/aiInsightKesehatanData.ts` | Reference Data | ✅ Ya | Rule-based AI engine. Tidak ada store. |
| `src/data/aiInsightLivestockData.ts` | Reference Data | ✅ Ya | Rule-based AI engine. Tidak ada store. |
| `src/data/aiInsightMutasiData.ts` | Reference Data | ✅ Ya | Rule-based AI engine. Tidak ada store. |
| `src/data/aiInsightPakanData.ts` | Reference Data | ✅ Ya | Rule-based AI engine. Tidak ada store. |
| `src/data/aiInsightReproduksiData.ts` | Reference Data | ✅ Ya | Rule-based AI engine. Tidak ada store. |

### R. Dev Data Factory (`src/dev/`)

| File | Kategori | Production Ready | Rekomendasi |
|------|----------|:---:|-------------|
| `src/dev/data-factory/seed.ts` | Seed | ❌ Tidak | **Harus dinonaktifkan di production.** Generates 500+ livestock, 40 batches, ribuan records. |
| `src/dev/data-factory/devAutoSeed.ts` | Seed | ❌ Tidak | Auto-seed pada boot. Bisa aktif di production jika tidak di-guard. |
| `src/dev/data-factory/config.ts` | Seed | ❌ Tidak | Konfigurasi jumlah record seed. |
| `src/dev/data-factory/devConsole.ts` | Seed | ❌ Tidak | Exposes `window.ternakDevFactory` — tidak boleh di production. |
| `src/dev/data-factory/factories/*.ts` (9 file) | Seed | ❌ Tidak | Generator factory untuk livestock, batch, feed, health, dll. |
| `src/dev/data-factory/stores/*.ts` (2 file) | Seed | ❌ Tidak | Store khusus dev (feedStore, medicineStore). |
| `src/dev/data-factory/masters/*.ts` (9 file) | Seed | ❌ Tidak | Master data untuk factory (nama, breed, lokasi, dll.). |
| `src/dev/data-factory/seedRegistry.ts` | Seed | ❌ Tidak | Registry global seed. |
| `src/dev/data-factory/rng.ts` | Seed | ❌ Tidak | Random number generator untuk seed. |
| `src/dev/data-factory/idFactory.ts` | Seed | ❌ Tidak | ID generator untuk seed. |
| `src/dev/data-factory/dateFactory.ts` | Seed | ❌ Tidak | Date generator untuk seed. |
| `src/dev/data-factory/clear.ts` | Seed | ❌ Tidak | Fungsi clear seed. |

---

## Statistik

| Kategori | Jumlah File | Production Ready |
|----------|:-----------:|:---:|
| **Production Data** (menggunakan Supabase) | 3 | ✅ Ya |
| **Reference Data** (statis, layak di source code) | 75 | ✅ Ya |
| **Local Repository** (in-memory mutable store, core data) | 82 | ❌ Tidak |
| **In-Memory** (runtime state, non-persistent) | 14 | ❌ Tidak |
| **Dummy** (hardcoded fake records, admin panel) | 21 | ❌ Tidak |
| **Seed** (data seed dev + katalog besar + dev factory) | 56 | ❌ Tidak |
| **Mock** (explicit mock/placeholder) | 2 | ❌ Tidak |
| **Placeholder** | 0 | — |
| **TOTAL** | **253** | — |

> **Catatan:** Beberapa file ditemukan tidak ada di filesystem (`catatBobotData.ts`, `silsilahData.ts`, `platformConfigData.ts`, `mutasiLivestockData.ts`) — logika mereka terdistribusi ke file lain.

**Ringkasan Cepat:**
- Files Production Ready: **78 (31%)**
- Files NOT Production Ready: **175 (69%)**
- Files menggunakan Supabase (data domain): **0**
- Services menggunakan Supabase: **1 dari 19**

---

## Prioritas Migrasi

Urutan berdasarkan dampak terhadap production launch:

### 🔴 P0 — Kritikal (Blocker Launch)

| Prioritas | Scope | File Kunci | Alasan |
|-----------|-------|-----------|--------|
| P0-1 | Workspace ↔ Auth Link | `workspaceFoundationData.ts`, `WorkspaceContext.tsx` | Tanpa ini, setiap user melihat data workspace yang sama (w1–w6). Auth tidak bermakna. |
| P0-2 | Dev Seed Guard | `src/dev/data-factory/devAutoSeed.ts`, `devConsole.ts` | `window.ternakDevFactory` dan auto-seed HARUS diblokir di production build. |
| P0-3 | Core Livestock | `livestockData.ts`, `transferData.ts`, `batchData.ts` | Data ternak adalah inti bisnis. Semua hilang saat refresh. |
| P0-4 | Route Guard | `src/App.tsx`, `AuthContext.tsx` | Semua route saat ini public. Tidak ada proteksi data antar user/workspace. |

### 🟠 P1 — Tinggi (Revenue & Operasional Utama)

| Prioritas | Scope | File Kunci | Alasan |
|-----------|-------|-----------|--------|
| P1-1 | Marketplace Listing & Transaksi | `marketplaceListingData.ts`, `marketplaceTransaksiData.ts`, `globalTransactionData.ts` | Fitur revenue-generating utama. Semua in-memory. |
| P1-2 | Escrow & Pembayaran | `transaksiEscrowData.ts`, `masterEscrowData.ts`, `globalEscrowData.ts` | Transaksi keuangan tidak boleh volatile. |
| P1-3 | Workspace Members & Subscription | `workspaceMembersData.ts`, `workspaceManagementData.ts` | Multi-tenant harus diisolasi per user. |
| P1-4 | Notifikasi | `notifikasiData.ts`, `globalNotificationData.ts`, `adminNotificationsData.ts` | Notifikasi hilang saat refresh. |

### 🟡 P2 — Sedang (Modul Operasional)

| Prioritas | Scope | File Kunci | Alasan |
|-----------|-------|-----------|--------|
| P2-1 | Stok Obat & Kesehatan | `stokObatData.ts`, `riwayatObatData.ts`, `kontrolKesehatanData.ts` | Data klinis hilang saat refresh. |
| P2-2 | Stok Pakan & Pemberian | `stokInventarisData.ts`, `pemberianPakanData.ts`, `jadwalPemberianPakanData.ts` | Inventaris pakan volatile. |
| P2-3 | Reproduksi | semua `src/data/reproduksi*.ts`, `kebuntinganData.ts`, `kelahiranData.ts` | Data breeding penting untuk bisnis. |
| P2-4 | Produk Komersial | `produkKomersialData.ts`, `produkKomersialLivingDB.ts`, PK obat | Katalog produk hilang saat refresh. |
| P2-5 | Chat & Conversation | `transaksiConversationData.ts`, `marketplaceChatData.ts`, `globalConversationData.ts` | Chat hilang saat refresh. |

### 🟢 P3 — Normal (Admin & Analytics)

| Prioritas | Scope | File Kunci | Alasan |
|-----------|-------|-----------|--------|
| P3-1 | Admin Panel (semua dummy) | semua `admin*Data.ts` | Admin tidak dapat melihat data nyata. |
| P3-2 | Trust & Verifikasi | `globalTrustData.ts`, `globalVerificationData.ts` | Data trust score volatile. |
| P3-3 | News & RSS | `newsEventData.ts`, `rssSourceData.ts`, `publicationManagementData.ts` | Konten hilang saat refresh. |
| P3-4 | Audit Trail & Evidence | `globalAuditTrailData.ts`, `globalEvidenceData.ts` | Log compliance harus persisten. |
| P3-5 | Katalog Obat | `obatData.ts`, `obatDetailData.ts` | 18.000+ baris → pindah ke tabel DB. |

---

## Blocker Production

Berikut adalah daftar blocker yang **harus diselesaikan sebelum Launch**:

### BLOCKER-001: Dev Seed Aktif di Production Build
**File:** `src/dev/data-factory/devAutoSeed.ts`, `devConsole.ts`  
**Risiko:** `window.ternakDevFactory` terekspos ke user production. Auto-seed bisa mengisi 500+ livestock palsu ke store nyata.  
**Solusi:** Guard dengan `import.meta.env.DEV` atau hapus entirely dari production bundle (Vite tree-shaking via `if (import.meta.env.DEV)` wajib diverifikasi).

### BLOCKER-002: Workspace Tidak Terhubung ke User Auth
**File:** `workspaceFoundationData.ts`, `WorkspaceContext.tsx`  
**Risiko:** Semua user yang login melihat workspace yang sama (w1–w6). Data workspace tidak terisolasi per pengguna.  
**Solusi:** Migrasi workspace ke Supabase. `WorkspaceContext` harus query berdasarkan `auth.user.id`.

### BLOCKER-003: Semua Route Tidak Diproteksi
**File:** `src/App.tsx`  
**Risiko:** Semua halaman dapat diakses tanpa login. Data antar-workspace dapat diakses silang.  
**Solusi:** Implementasi route guard berbasis `AuthContext.session` dan `workspace.memberId`.

### BLOCKER-004: Data Core Tidak Persisten
**File:** `livestockData.ts`, `batchData.ts`, `transferData.ts`, `stokObatData.ts`, `stokInventarisData.ts`, dan semua Local Repository  
**Risiko:** Seluruh data operasional user hilang setiap page refresh. Tidak dapat digunakan secara nyata.  
**Solusi:** Migrasi bertahap ke Supabase mulai dari livestock → batch → transfer → stok.

### BLOCKER-005: Admin Panel Menampilkan Dummy Data
**File:** Semua `admin*Data.ts` (21 file)  
**Risiko:** Admin melihat data palsu di production. Keputusan operasional berdasarkan data tidak nyata.  
**Solusi:** Setiap halaman admin harus query Supabase dari tabel yang sudah dimigrasi.

### BLOCKER-006: Transaksi Finansial Tidak Persisten
**File:** `marketplaceTransaksiData.ts`, `transaksiEscrowData.ts`, `globalTransactionData.ts`, `masterEscrowData.ts`  
**Risiko:** Transaksi keuangan dan escrow hilang saat refresh. Tidak dapat diaudit.  
**Solusi:** Migrasi ke Supabase dengan RLS ketat. Pertimbangkan audit log immutable.

### BLOCKER-007: Data Foto & Media Tidak Persisten
**File:** `livestockFotoData.ts` (localStorage), `globalMediaData.ts` (in-memory)  
**Risiko:** Foto ternak tersimpan di localStorage (terbatas kapasitas, hilang di incognito/clear cache). File upload production harus ke Supabase Storage.  
**Solusi:** Ganti localStorage dengan Supabase Storage + tabel `media`.

### BLOCKER-008: Tidak Ada Isolasi Data Antar Workspace
**File:** Semua in-memory store (tidak memiliki `workspaceId` filter yang terhubung ke auth)  
**Risiko:** Data satu workspace terlihat dari workspace lain karena store global.  
**Solusi:** Semua tabel Supabase harus memiliki kolom `workspace_id` dengan Row Level Security (RLS) policy.

---

*Laporan ini dihasilkan secara otomatis dari audit statis terhadap seluruh codebase. Tidak ada perubahan source code, database, atau konfigurasi yang dilakukan.*
