# AUDIT-HOME-MARKETPLACE-001 (REVISED — Deep Audit)
## Audit Menyeluruh Seluruh Modul Marketplace TernakHub

**Tanggal audit awal:** 2026-07-16  
**Tanggal revisi (re-audit):** 2026-07-16  
**Auditor:** Agent (automated deep audit — 7 subagent paralel + spot-check langsung)  
**Scope:** Seluruh halaman, route, tab, modal, dialog, dan fitur yang dapat diakses dari Marketplace — mencakup 28 halaman, 27 data file, 5 transaksi data file, 24 route, dan lintas-modul integration.  
**Metodologi:** Read semua file (bukan sampling), paralel subagent per domain, direct grep confirmation untuk temuan kritis.  
**Tindakan:** Audit-only. Tidak ada perubahan kode.

---

## Daftar File yang Diaudit

### Pages (28 file)
`Marketplace.tsx` · `MarketplaceBuatListing.tsx` · `MarketplaceListingSaya.tsx` · `MarketplaceKelolaListing.tsx` · `MarketplaceDetailListing.tsx` · `MarketplaceTransaksi.tsx` · `MarketplaceDetailTransaksi.tsx` · `MarketplaceNegosiasi.tsx` · `MarketplaceDetailNegosiasi.tsx` · `MarketplaceBuatNegosiasi.tsx` · `MarketplaceChatList.tsx` · `MarketplaceChat.tsx` · `MarketplaceConversation.tsx` · `MarketplaceEvidenceTimeline.tsx` · `MarketplaceAuditTimeline.tsx` · `MarketplaceEscrowDetail.tsx` · `MarketplaceDashboard.tsx` · `MarketplaceDashboardPembeli.tsx` · `MarketplaceAiInsight.tsx` · `MarketplaceNotifikasi.tsx` · `MarketplaceWishlist.tsx` · `MarketplaceRiwayatAktivitas.tsx` · `MarketplaceVerifikasi.tsx` · `MarketplaceLaporan.tsx` · `MarketplaceBuatLaporan.tsx` · `MarketplaceDetailLaporan.tsx` · `MarketplaceModerasiKasus.tsx` · `MarketplaceModerasiDetailKasus.tsx`

### Data Files (32 file)
`marketplaceListingData.ts` · `marketplaceSearchData.ts` · `marketplaceFilterData.ts` · `marketplaceKategoriData.ts` · `marketplaceAsetWorkspaceData.ts` · `marketplaceCreateListingMenuData.ts` · `marketplaceWishlistData.ts` · `marketplaceTransaksiData.ts` · `marketplaceNegosiasiData.ts` · `marketplaceChatData.ts` · `marketplaceTrustData.ts` · `marketplaceWorkspaceVerifikasiData.ts` · `marketplaceDashboardData.ts` · `marketplaceBuyerDashboardData.ts` · `marketplaceAiInsightData.ts` · `marketplaceAiInsightMPK020Data.ts` · `marketplaceNotifikasiData.ts` · `marketplaceRiwayatAktivitasData.ts` · `marketplaceLaporanData.ts` · `marketplaceModerasiData.ts` · `marketplacePesananData.ts` · `marketplaceOriginDetailData.ts` · `marketplaceAiInsightData.ts` · `marketplaceLivestockIntegrationData.ts` · `marketplaceStokPakanIntegrationData.ts` · `marketplaceStokObatIntegrationData.ts` · `marketplaceLayananTransportIntegrationData.ts` · `marketplaceLayananDokterHewanIntegrationData.ts` · `marketplaceLayananKlinikHewanIntegrationData.ts` · `transaksiConversationData.ts` · `transaksiEvidenceData.ts` · `transaksiAuditTrailData.ts` · `transaksiEscrowData.ts` · `transaksiTransportData.ts`

---

## Ringkasan Eksekutif

Dari **28 halaman** Marketplace yang diaudit:

- **1 halaman KRITIS-total** (Marketplace.tsx — main explorer): 100% hardcoded, tidak terhubung ke data layer apapun, semua aksi non-fungsional. Ini adalah halaman yang diakses dari Home Quick Action.
- **1 halaman KRITIS-partial** (MarketplaceDetailTransaksi.tsx): TransactionTabBar sepenuhnya absen — Evidence, AuditTrail, dan Escrow tidak dapat diakses langsung dari halaman detail transaksi.
- **25 halaman CONNECTED** ke data layer yang benar.
- **2 halaman CONNECTED dengan issue minor** (DashboardPembeli, Verifikasi).

Seluruh sub-infrastruktur (data layer, routing, Constitution compliance) dibangun dengan solid. Masalah utama terpusat di dua halaman di atas, bukan di arsitektur global.

---

## A. ENTRY POINT

### A.1 Home → Quick Action → Marketplace

**File:** `src/components/dashboard/QuickAction.tsx` + `src/data/quickActionData.ts`

- Quick Action "Marketplace" terdaftar: `{ id: 'qa-marketplace', label: 'Marketplace', icon: '🛒', actionType: 'route', to: '/marketplace' }`.
- `QuickAction.tsx` melakukan `navigate(action.to)` dengan benar.
- Route `/marketplace` di App.tsx (baris 581) merender `<Marketplace />`.
- ✅ Entry point secara teknis benar. Namun landing page yang dituju adalah placeholder non-fungsional — lihat temuan F-001.

---

## B. HALAMAN UTAMA EXPLORER

### B.1 `src/pages/Marketplace.tsx`

**Status: HARDCODED — Placeholder Statis**

#### F-001 🔴 KRITIS — Seluruh data listing hardcoded, tidak ada koneksi ke data layer

```typescript
const CATEGORIES = [ /* 9 kategori inline */ ];
const LISTINGS = [
  { id: 'L001', title: 'Domba Garut Jantan — Siap Jual', ... },
  // 8 listing palsu L001–L008
];
```

Tidak ada satu pun import dari `marketplaceListingData.ts`, `marketplaceSearchData.ts`, `marketplaceFilterData.ts`, atau data layer manapun. Fungsi `searchMarketplace()`, `applyMarketplaceFilter()`, `getAllListings()` yang sudah dibangun lengkap tidak pernah dipanggil.

#### F-002 🔴 KRITIS — FAB "Buat Listing" tidak memiliki onClick/navigate

```tsx
<button type="button" aria-label="Buat Listing">
  <span>➕</span> Buat Listing
</button>
```

Tidak ada `onClick`, tidak ada `useNavigate`, tidak ada `navigate('/marketplace/buat')`. Route `/marketplace/buat` → `<MarketplaceBuatListing />` sudah terdaftar dan fungsional di App.tsx, tetapi tidak terhubung dari sini.

#### F-003 🔴 KRITIS — Semua 4 Shortcut Card disabled permanen

```tsx
<ShortcutCard icon="➕" label="Buat Listing" disabled />   // → /marketplace/buat (ada)
<ShortcutCard icon="📋" label="Listing Saya" disabled />   // → /marketplace/listing-saya (ada)
<ShortcutCard icon="❤️" label="Favorit"      disabled />   // → /marketplace/wishlist (ada)
<ShortcutCard icon="💬" label="Chat"          disabled />   // → /marketplace/chat (ada)
```

Semua menggunakan `pointerEvents: 'none'` dan `opacity: 0.38`. Keempat route tujuan sudah ada dan fungsional, namun tidak bisa diakses dari halaman utama.

#### F-004 🔴 KRITIS — ListingCard tidak navigasi ke detail listing

`ListingCard` menggunakan `cursor: 'default'` dan tidak memiliki `onClick` atau `navigate`. Menekan kartu listing tidak melakukan apapun. Route `/marketplace/:kategoriSlug/:slug` → `<MarketplaceDetailListing />` sudah terdaftar dan fungsional, namun tidak pernah diakses dari sini.

Khusus: tombol ❤️ favorit di dalam card bisa diklik, tetapi hanya membalik state lokal `useState` — **tidak** menyentuh `marketplaceWishlistData.ts`.

#### F-005 🟡 UI — Filter kategori chip tidak memfilter listing

```tsx
onClick={() => setActiveCategory(cat.id)}  // state diperbarui
...
{LISTINGS.map((item) => (                  // tapi semua 8 listing selalu dirender
  <ListingCard key={item.id} item={item} />
))}
```

Tidak ada `filter()` yang menggunakan `activeCategory`. `applyMarketplaceFilter()` dari `marketplaceFilterData.ts` sudah ada namun tidak dipakai.

#### F-006 🟡 UI — Search input bersifat `readOnly`, tidak bisa mengetik

```tsx
<input type="search" ... readOnly ... />
```

`searchMarketplace()` dari `marketplaceSearchData.ts` sudah ada, namun tidak dipakai.

#### F-007 🟡 UI — Tombol notifikasi tidak memiliki action

Tombol 🔔 tidak memiliki `onClick`. Unread dot selalu tampil hardcoded. Route `/marketplace/notifikasi` sudah ada di App.tsx.

---

## C. DATA LAYER: SEARCH, FILTER, KATEGORI

### C.1 `src/data/marketplaceSearchData.ts`
**Status: CONNECTED (tidak dipakai dari explorer)**

- Mengekspor `searchMarketplace()` yang iterasi `ListingItem[]` dengan pemeriksaan multi-field.
- Imports live dari `marketplaceListingData.ts` dan `marketplaceKategoriData.ts`.
- ✅ Siap pakai, hanya belum dihubungkan ke `Marketplace.tsx`.
- **F-008 🔵 INFO** — Locale-sensitivity minor: `toLowerCase()` pada token pencarian tidak mempertimbangkan locale Bahasa Indonesia (misalnya karakter diakritik). Dampak minimal pada data saat ini.

### C.2 `src/data/marketplaceFilterData.ts`
**Status: CONNECTED (tidak dipakai dari explorer)**

- Mengekspor `applyMarketplaceFilter()` dan `isMarketplaceFilterActive()`.
- Filter berbasis objek filter (kategori, harga, lokasi, dll.) terhadap `ListingItem[]`.
- ✅ Siap pakai, hanya belum dihubungkan ke `Marketplace.tsx`.

### C.3 `src/data/marketplaceKategoriData.ts`
**Status: HARDCODED (registry statis, by design)**

- Static registry: `KATEGORI_MARKETPLACE`, `SUBKATEGORI_MARKETPLACE`, `JENIS_LISTING`.
- **F-009 🔵 INFO** — Beberapa kategori (contoh: Dokter Hewan, Klinik Hewan) tidak memiliki sub-kategori yang terdefinisi. Bukan error, namun berarti filter sub-kategori untuk kategori tersebut akan kosong.

---

## D. BUAT LISTING & KELOLA LISTING

### D.1 `src/pages/MarketplaceBuatListing.tsx`
**Status: CONNECTED ✅**

- Multi-step wizard: Jenis → Aset → Form → Preview.
- Memanggil `addListing()` dari `marketplaceListingData.ts`.
- Kategori di-resolve via `MODUL_TO_KATEGORI_SLUG` mapping.
- AsetWorkspace picker terhubung ke `marketplaceAsetWorkspaceData.ts` via `getAsetOptions(modul, ws.id)`.
- Validasi: judul, harga (>0), qty (>0 dan ≤ tersedia), lokasi — semua enforced.
- Eligibility check: obat kadaluarsa diblokir dari publish.
- Post-success: menampilkan success view dengan navigate back ke `/marketplace`.
- ✅ Tidak ada temuan KRITIS atau UI.

### D.2 `src/data/marketplaceCreateListingMenuData.ts`
**Status: CONNECTED ✅**

- `getCreateListingMenu(workspaceType)` menghasilkan menu kategori per tipe workspace.
- Digunakan di step pertama BuatListing. Tidak ada dead export.

### D.3 `src/data/marketplaceAsetWorkspaceData.ts`
**Status: CONNECTED — minor fallback issue**

- Pattern `getAsetOptions(modul, workspaceId)` diimplementasikan.
- Coverage: Livestock, Pakan, Obat, Transport, DokterHewan, KlinikHewan — semua terhubung ke live data.
- **F-010 🟠 MINOR** — Terdapat hardcoded fallback workspace IDs (`'w4'`, `'w5'`, `'w6'`) ketika `workspaceId` tidak tersedia. Bisa menyebabkan aset workspace salah ditampilkan jika ID tidak cocok dengan seed.

### D.4 `src/pages/MarketplaceListingSaya.tsx`
**Status: CONNECTED ✅**

- Membaca `getAllListing()` difilter berdasarkan active workspace ID.
- 7 status filter, 4 mode sort, search — semua wired.
- `getEfektifStatusListing()` menampilkan "Stok Habis" jika stok fisik = 0.
- Navigate ke `KelolaListing` per item benar.

### D.5 `src/pages/MarketplaceKelolaListing.tsx`
**Status: CONNECTED ✅**

- Membaca via `getListingByUuid(uuid)` dari URL param.
- Full lifecycle: edit, toggle status (Aktif/Draft/Nonaktif), tutup, arsip, hapus draft.
- Form edit tervalidasi mirror BuatListing.

### D.6 `src/pages/MarketplaceDetailListing.tsx`
**Status: CONNECTED ✅**

- SSOT via `getListingBySlug(kategoriSlug, slug)`.
- Trust/verifikasi badge dari `marketplaceTrustData.ts`.
- Origin detail resolver: 9 kategori (Livestock, Pakan, Obat, Transport, DokterHewan, KlinikHewan, StokPakan, StokObat, fallback).
- Wishlist toggle wired ke `marketplaceWishlistData.ts`.
- "Hubungi Penjual" memanggil `getOrCreateChat()` → navigate ke `/marketplace/chat/:id`.
- Tombol Negosiasi navigate ke `/marketplace/negosiasi/buat`.
- Tombol Laporan navigate ke `/marketplace/laporan/buat`.

### D.7 `src/data/marketplaceListingData.ts`
**Status: CONNECTED ✅**

- 11 listing seed. Mutasi: `addListing`, `updateListing`, `deleteDraftListing`.
- `searchAndFilterListings()`, `getAllListings()`, `getListingBySlug()` tersedia.
- `ensureUniqueSlug()` mencegah slug collision.
- **F-011 🔵 INFO** — Seed data menggunakan tanggal hardcoded 2026 (bukan issue fungsional, konsisten dengan modul lain).

### D.8 `src/data/marketplaceOriginDetailData.ts`
**Status: CONNECTED ✅**

- `getOriginDetail(listing)` switch terpusat untuk 9 kategori.
- Kategori tanpa live module (misalnya Peralatan) mengembalikan `tersedia: false` dengan penjelasan.
- Tidak ada dead branch.

---

## E. WISHLIST

### E.1 `src/pages/MarketplaceWishlist.tsx`
**Status: CONNECTED — 2 fitur placeholder**

- Memanggil `getWishlistByWorkspace()`, `getListingByUuid()`, `removeFromWishlist()`.
- Search, filter kategori, sort — semua wired.
- Empty state diimplementasikan.
- Navigate ke detail listing dari item benar.
- **F-012 🟠 MINOR** — Opsi "Bagikan" di item menu adalah placeholder (tidak melakukan apapun).
- **F-013 🟠 MINOR** — Sort "Terdekat" tidak diimplementasikan (tidak ada geolocation logic).

### E.2 `src/data/marketplaceWishlistData.ts`
**Status: CONNECTED ✅**

- `getWishlistByWorkspace()`, `isInWishlist()`, `addToWishlist()`, `removeFromWishlist()`.
- Auto-seed 3 item untuk workspace baru (by design untuk demo).
- Toggle in-memory live.

---

## F. RIWAYAT AKTIVITAS

### F.1 `src/pages/MarketplaceRiwayatAktivitas.tsx`
**Status: CONNECTED — navigasi detail terbatas**

- Memanggil `getAllAktivitas()` dan `getRingkasanAktivitas()`.
- Semua filter chip dan search wired.
- **F-014 🟠 MINOR** — Item aktivitas membuka DetailSheet lokal (bottom-sheet), tidak navigate ke halaman detail spesifik per tipe (misalnya listing detail, transaksi detail). Bisa jadi by design, namun membatasi deep-link dari history.

### F.2 `src/data/marketplaceRiwayatAktivitasData.ts`
**Status: CONNECTED ✅**

- Aggregator read-only dari: Listing, Transaksi, Negosiasi, Chat, Wishlist.
- Filter tabs: Semua / Listing / Wishlist / Negosiasi / Chat / Transaksi / Sistem — semua wired.
- **F-015 🔵 INFO** — Kategori 'Pesan Baru' dalam aktivitas Chat hanya menampilkan pesan terakhir per room (bukan semua pesan baru). Dampak minimal.

---

## G. CHAT (PRE-TRANSAKSI)

### G.1 `src/pages/MarketplaceChatList.tsx`
**Status: CONNECTED — search terbatas**

- Terhubung ke `marketplaceChatData.ts`.
- Thumbnail listing dan workspace icon dimuat dari data layer.
- Navigate ke `/marketplace/chat/:id` per room benar.
- **F-016 🟡 UI** — Tidak ada search berdasarkan nama listing atau nama workspace. Hanya filter berdasarkan role (Semua/Penjual/Pembeli).

### G.2 `src/pages/MarketplaceChat.tsx`
**Status: CONNECTED — 2 navigasi minor salah target**

- Terhubung ke `marketplaceChatData.ts` via `getOrCreateChat()`.
- Message send wired (`sendMessage()`).
- `onViewListing` → navigate ke `/marketplace/:kategoriSlug/:slug` ✅.
- **F-017 🟡 UI** — `onViewWorkspace={() => navigate('/marketplace')}` (baris 487) mengarah ke halaman placeholder explorer, bukan ke profil workspace penjual. Tidak ada halaman Profil Penjual yang terdedikasi di Marketplace (lihat F-034).
- **F-018 🟠 MINOR** — Attachment (gambar, file) menggunakan emoji picker + string filename — simulasi UI, bukan upload nyata. Disclaimer "tersedia di versi berikutnya" ada, namun tampak seperti fitur aktif.

### G.3 `src/data/marketplaceChatData.ts`
**Status: CONNECTED ✅**

- `ChatRoom`, `ChatMessage`, `NotifikasiChat` model.
- `getOrCreateChat()` idempotent berdasarkan (listing + pembeli).
- `sendMessage()`, `markRead()` tersedia.
- Seed: CHAT-seed-0001/0002/0003 (by design).

---

## H. TRANSAKSI

### H.1 `src/pages/MarketplaceTransaksi.tsx`
**Status: CONNECTED ✅**

- `getAllTransaksi()`, `getRingkasanTransaksi()`, `searchAndFilterTransaksi()` dipanggil.
- Filter chips: Semua / Menunggu / Diproses / Selesai / Dibatalkan — semua wired.
- Summary stats: card total + grid 2×2 per status.
- Navigate ke `/marketplace/transaksi/${item.id}` per item benar.

### H.2 `src/pages/MarketplaceDetailTransaksi.tsx`
**Status: CONNECTED — TransactionTabBar ABSEN**

#### F-019 🔴 KRITIS — TransactionTabBar tidak ada di halaman Detail Transaksi

Konfirmasi langsung dari kode (baris 553–566):

```tsx
{/* ── Conversation ──────────────────────────────────────────────────── */}
<button
  type="button"
  onClick={() => navigate(`/marketplace/conversation/${transaksi.id}`)}
  ...
>
  💬 Buka Conversation
</button>
```

Ini adalah satu-satunya entry point dari halaman Detail Transaksi ke lifecycle komunikasi. **Tidak ada link, button, atau tab untuk:**
- Evidence (`/marketplace/evidence/:id`)
- Audit Trail (`/marketplace/audit/:id`)
- Escrow (`/marketplace/escrow/:id`)

TransactionTabBar memang ada dan diimplementasikan dengan benar di 4 halaman turunan (Conversation, Evidence, AuditTimeline, EscrowDetail), tetapi pengguna yang baru membuka transaksi tidak tahu bahwa Evidence, AuditTrail, dan Escrow bisa diakses — mereka hanya melihat satu tombol "Buka Conversation", kemudian baru menemukan TabBar setelah masuk ke Conversation.

**Implikasi:** Escrow dan Evidence tidak pernah ditemukan secara organik dari alur transaksi normal.

**Status lifecycle buttons:** Setujui / Tolak / Batal / Konfirmasi Bayar / Proses / Siap Diserahkan / Kirim / Selesai — semua diimplementasikan via `ActionButtons` + `ActionModal`.

### H.3 `src/data/marketplaceTransaksiData.ts`
**Status: CONNECTED ✅**

- `addTransaksi()`, `selesaikanTransaksi()`, `batalkanTransaksi()` tersedia.
- `selesaikanTransaksi()` melakukan sync ke StokPakan (`addPerubahanStok`), StokObat (`applyPenyesuaianStok`), dan Livestock (`performPermanentTransfer`) — sesuai Constitution (hanya saat Selesai).
- `getQtyTersediaTransaksi()` mengurangi qty yang sudah direservasi oleh transaksi aktif.
- **F-020 🔵 INFO** — `selesaikanTransaksi()` menggunakan `performPermanentTransfer` dari `transferData.ts` (bukan `archiveLivestock`). Ini **by design** — untuk menjaga audit trail kepemilikan via Mutasi module, bukan langsung archive.
- **F-021 🔵 INFO** — Seed data menggunakan fixed ISO strings ("2026-07-13"). Mutasi baru menggunakan `new Date().toISOString()`.

---

## I. NEGOSIASI

### I.1 `src/pages/MarketplaceNegosiasi.tsx`
**Status: CONNECTED ✅**

- `getAllNegosiasi()`, `getRingkasanNegosiasi()`, `searchAndFilterNegosiasi()` dipanggil.
- Filter tabs: Semua / Menunggu Respon / Penawaran Balik / Disetujui / Ditolak / Kadaluarsa — semua wired.
- Pagination via `usePaginatedList` (default 10 item).
- Navigate ke `/marketplace/negosiasi/:id` per item benar.

### I.2 `src/pages/MarketplaceDetailNegosiasi.tsx`
**Status: CONNECTED ✅**

- `getNegosiasiById()` via URL param.
- Status flow: Setujui / Penawaran Balik / Tolak / Batalkan / Ubah — semua via mutasi.
- `setujuiNegosiasi()` memicu `addTransaksi()` otomatis → menciptakan transaksi baru.
- `setTick` counter untuk force re-render setelah mutasi — konsisten dengan pola modul lain.

### I.3 `src/pages/MarketplaceBuatNegosiasi.tsx`
**Status: CONNECTED ✅**

- Form: harga penawaran, catatan, listing picker.
- Memanggil `addNegosiasi()` dari `marketplaceNegosiasiData.ts`.
- Navigate setelah submit ke daftar negosiasi.

### I.4 `src/data/marketplaceNegosiasiData.ts`
**Status: CONNECTED ✅**

- `NegosiasiItem` dengan `riwayatNegosiasi`.
- Mutasi: `addNegosiasi`, `setujuiNegosiasi` (→ `addTransaksi`), `ubahPenawaran`, `tolakNegosiasi`.
- **F-022 🔵 INFO** — Seed data menggunakan fixed dates 2026 (konsisten).

---

## J. CONVERSATION, EVIDENCE, AUDIT TRAIL, ESCROW, TRANSPORT

### J.1 `src/pages/MarketplaceConversation.tsx`
**Status: CONNECTED — attachment simulated**

- `getOrCreateConversation()`, `getConversationParticipants()` dari `transaksiConversationData.ts`.
- ParticipantBar: role badge (Buyer/Seller/Escrow/Transport/Judge) via `ROLE_CONFIG` — dinamis, tidak hardcoded.
- TransactionTabBar hadir dengan tab Conversation aktif ✅.
- Composer send wired.
- **F-023 🟠 MINOR** — Attachment (file/gambar): form hanya menerima nama file sebagai string. Tidak ada binary upload path. Disclaimer "tersedia versi berikutnya" ada namun tidak menonjol.

### J.2 `src/data/transaksiConversationData.ts`
**Status: CONNECTED ✅**

- `getOrCreateConversation()`, `getConversationParticipants()`, `sendConversationMessage()`.
- Participant roles dinamis dan workspace-aware, tidak hardcoded Buyer/Seller — sesuai Constitution.

### J.3 `src/pages/MarketplaceEvidenceTimeline.tsx`
**Status: CONNECTED ✅**

- `transaksiEvidenceData.ts` — `getEvidenceForTransaksi()`, `addEvidence()`.
- Form tambah evidence: kategori, tipe file, deskripsi — wired.
- Retention policy panel ditampilkan.
- Terpisah dari Chat dan Conversation ✅ (sesuai Constitution).
- TransactionTabBar hadir ✅.

### J.4 `src/data/transaksiEvidenceData.ts`
**Status: CONNECTED ✅**

- `addEvidence()` sole write path.
- Durasi retensi enforced per kategori (contoh: Pembayaran = 5 tahun, Tiba = 1 tahun).
- Tidak ada deletion logic — permanence enforced.

### J.5 `src/pages/MarketplaceAuditTimeline.tsx`
**Status: CONNECTED ✅**

- `transaksiAuditTrailData.ts` — `getAuditTrailForTransaksi()`.
- Read-only enforced — tidak ada UI untuk tambah event (mencegah tampering).
- TransactionTabBar hadir ✅.

### J.6 `src/data/transaksiAuditTrailData.ts`
**Status: CONNECTED ✅**

- `addAuditEvent()` adalah satu-satunya write path (dipanggil oleh fungsi mutasi data, bukan UI langsung).
- Record permanen — tidak ada deletion.

### J.7 `src/pages/MarketplaceEscrowDetail.tsx`
**Status: CONNECTED — receiver guard ada di UI**

- `transaksiEscrowData.ts` — `receiverConfirm()`, `recordManualTransfer()`, `disputeEscrow()`.
- **Verifikasi kode langsung (baris 635–746):**
  ```tsx
  const receiverWsId = releaseDir === 'Buyer' ? escrow.workspaceIdBuyer : escrow.workspaceIdSeller;
  const isReceiver = activeWsId === receiverWsId;
  // ...
  {isReceiver ? (
    <button onClick={() => receiverConfirm(...)}>Konfirmasi Terima Dana</button>
  ) : (
    <p>⏳ Menunggu konfirmasi dari penerima...</p>
  )}
  ```
  Guard `isReceiver` benar diimplementasikan di UI. `receiverConfirm` hanya oleh receiver ✅.
- TransactionTabBar hadir ✅.
- EscrowFee terpisah dari TransactionCost ✅.
- Dispute panel wired (batas 30 hari enforced di data layer).
- Manual transfer form wired.

### J.8 `src/data/transaksiEscrowData.ts`
**Status: CONNECTED ✅**

- `initEscrow()`, `receiverConfirm()`, `disputeEscrow()`, `recordManualTransfer()`.
- Tidak ada auto-transfer trigger ✅ — human-in-the-loop dipertahankan.
- `hasEscrow` flag mengontrol tab visibility di TransactionTabBar.

### J.9 `src/data/transaksiTransportData.ts`
**Status: CONNECTED ✅ (Constitution compliant)**

- 8-status lifecycle: Menunggu Assignment → Completed.
- Participant opsional ✅.
- Evidence-only — tidak ada condition assessment ternak ✅.
- TransportFee terpisah dari total transaksi ✅.
- Tidak ada dead mutation.

---

## K. DASHBOARD

### K.1 `src/pages/MarketplaceDashboard.tsx` (Penjual)
**Status: CONNECTED ✅**

- `getDashboardPenjual()` dari `marketplaceDashboardData.ts`.
- 6 stat card: Listing Aktif, Draft, Terjual, Transaksi Aktif, Negosiasi Aktif, Total Pendapatan — semua live.
- AI Insight top-3 berdasarkan views/negosiasi/penjualan live.
- Grafik transaksi: data 7-hari via filter `createdAt`.
- Quick Action buttons navigate benar.
- Latest items (Listing/Transaksi/Negosiasi): navigate ke detail benar.

### K.2 `src/data/marketplaceDashboardData.ts`
**Status: CONNECTED ✅**

- Agregasi live dari listing, transaksi, negosiasi.
- Grafik transaksi dibangun dinamis via filter tanggal.
- Tidak ada metric hardcoded.

### K.3 `src/pages/MarketplaceDashboardPembeli.tsx` (Pembeli)
**Status: CONNECTED — 1 navigasi salah target**

- `marketplaceBuyerDashboardData.ts` — Ringkasan, Rekomendasi, Wishlist, Chat, Transaksi, Negosiasi.
- Rekomendasi dihitung live via weighted category score (Transaksi=1.0, Negosiasi=0.5).
- **F-024 🟡 UI** — Wishlist Quick Action button (baris 499) dan "Jelajahi" di Wishlist section (baris 535) keduanya navigate ke `/marketplace` (halaman placeholder) bukan ke `/marketplace/wishlist`:

  ```tsx
  <QuickBtn label="Wishlist" onClick={() => navigate('/marketplace')} />
  // dan
  <SectionHeader action="Jelajahi" onAction={() => navigate('/marketplace')} />
  ```

  Route `/marketplace/wishlist` sudah ada dan fungsional.

### K.4 `src/data/marketplaceBuyerDashboardData.ts`
**Status: CONNECTED ✅**

---

## L. AI INSIGHT & NOTIFIKASI

### L.1 `src/pages/MarketplaceAiInsight.tsx`
**Status: CONNECTED ✅**

- Terhubung ke `marketplaceAiInsightMPK020Data.ts` (full dashboard) dan `marketplaceAiInsightData.ts` (listing detail insight).
- 5 kategori: Sales, Purchase, Listing, Workspace, AI Recommendations.
- Navigate back benar.

### L.2 `src/data/marketplaceAiInsightData.ts` vs `marketplaceAiInsightMPK020Data.ts`
**Status: CONNECTED — overlap parsial**

- Keduanya adalah rule-based engine yang membaca dari live data.
- MPK020 lebih komprehensif (dashboard-level).
- **F-025 🔵 INFO** — Terdapat logika yang overlapping antara dua file ini. MPK020 adalah superset yang lebih lengkap. Bukan bug, namun ada risiko divergensi jika satu diupdate dan yang lain tidak.

### L.3 `src/pages/MarketplaceNotifikasi.tsx`
**Status: CONNECTED ✅**

- `marketplaceNotifikasiData.ts` — mark read, mark all read, type filter — semua wired.
- Navigate ke target dari notifikasi: semua tipe memiliki `navigateTo` valid.

### L.4 `src/data/marketplaceNotifikasiData.ts`
**Status: CONNECTED ✅**

- Notifikasi di-generate secara live dari riwayat status di modul Transaksi, Negosiasi, Chat, Listing.
- Mengambil `NotifikasiChat` dari `marketplaceChatData.ts` (dua sistem notifikasi berbeda: marketplace-level vs chat-level, keduanya terpadu di sini).

---

## M. VERIFIKASI & TRUST

### M.1 `src/pages/MarketplaceVerifikasi.tsx`
**Status: CONNECTED — submit tidak wired**

- Menampilkan semua 5 trust tier (Baru / Berkembang / Terpercaya / Sangat Terpercaya / Premium) ✅.
- Trust score dihitung live.
- **F-026 🟡 UI** — Tombol "Ajukan Verifikasi" di UI tidak tersambung ke mutasi apapun. Halaman memiliki UI verifikasi namun tidak ada handler yang memanggil `submitVerifikasi()`.

### M.2 `src/data/marketplaceWorkspaceVerifikasiData.ts`
**Status: CONNECTED — mutasi parsial**

- Trust score dihitung live dari 7 faktor (kelengkapan profil, riwayat transaksi, skor feedback, dll.).
- **F-027 🟠 MINOR** — `submitVerifikasi()` dan `approveVerifikasi()` belum diimplementasikan di data layer. Hanya read path yang tersedia.

### M.3 `src/data/marketplaceTrustData.ts`
**Status: CONNECTED ✅**

- 5 TrustLevel: Baru (0+) / Berkembang (20+) / Terpercaya (40+) / Sangat Terpercaya (60+) / Premium (80+).
- `computeTrustLevel()`, `getTrustLevelBadge()` konsisten di semua level.
- 'Sangat Terpercaya' sebagai tier 60-79 adalah **valid** — bukan bug ✅.
- Skor total dihitung live meski `BERGABUNG_SEJAK` per workspaceId diinisialisasi secara hardcoded.

---

## N. LAPORAN & MODERASI

### N.1 `src/pages/MarketplaceLaporan.tsx`
**Status: CONNECTED ✅**

- `queryLaporan()`, `getLaporanSummary()` dari `marketplaceLaporanData.ts`.
- Filter tabs: Menunggu / Diproses / Selesai / Ditolak — wired.
- Navigate ke `/marketplace/laporan/:id` per item benar.

### N.2 `src/pages/MarketplaceBuatLaporan.tsx`
**Status: CONNECTED — lampiran placeholder**

- Form: `listingUuid`, `alasan`, `keterangan`.
- Memanggil `submitLaporan()` → otomatis `buatKasusModerasi()` (MPK-R04).
- Guard: blokir self-report dan duplikasi (cooldown 7 hari) — enforced.
- **F-028 🔵 INFO** — Field `lampiran` (bukti file/foto) adalah placeholder UI — tidak ada upload atau penyimpanan aktual.
- **F-029 🔵 INFO** — `buatKasusModerasi()` yang sebelumnya diduga dead code ternyata **aktif dipanggil** dari sini. Koreksi dari temuan MPK-R03 sebelumnya.

### N.3 `src/pages/MarketplaceDetailLaporan.tsx`
**Status: CONNECTED ✅**

- `getLaporanById()` — read-only untuk submitter.
- `RiwayatItem` timeline status.
- "Buka Halaman Listing" helper wired.

### N.4 `src/data/marketplaceLaporanData.ts`
**Status: CONNECTED ✅**

- `submitLaporan()` — ID generation `LAP-YYYYMMDD-NNN`, validasi duplikat.
- `updateStatusLaporan()` tersedia.
- **F-030 🔵 INFO** — Seed data menggunakan future dates (Juli 2026) — konsisten dengan modul lain.

### N.5 `src/pages/MarketplaceModerasiKasus.tsx`
**Status: CONNECTED ✅**

- Admin dashboard untuk `marketplaceModerasiData.ts`.
- Filter tabs dan search wired.
- Navigate ke detail kasus benar.

### N.6 `src/pages/MarketplaceModerasiDetailKasus.tsx`
**Status: CONNECTED ✅**

- `ambilTindakanModerasi()` — Approve / Reject / Escalate dengan audit note wajib.
- Tombol dan form disabled jika status sudah 'Selesai' atau 'Ditolak'.

### N.7 `src/data/marketplaceModerasiData.ts`
**Status: CONNECTED ✅**

- `buatKasusModerasi()` aktif dipakai (dari `MarketplaceBuatLaporan.tsx`) ✅.
- `resolveKasus()` via `ambilTindakanModerasi()`.
- Link ke laporan via `nomorReport`.

---

## O. DATA LAYER: PESANAN & INTEGRATION FILES

### O.1 `src/data/marketplacePesananData.ts`
**Status: CONNECTED (ke data layer) — tanpa UI page**

- **F-031 🟠 MINOR** — Modul "Pesanan" adalah procurement module untuk pembelian supplies. Logika fungsional ada (model data, mutasi), namun tidak ada halaman di `src/pages/` yang mengimport atau merender data ini. Hanya digunakan oleh `stokInsight.ts` untuk kalkulasi. Mutasi dapat terjadi "invisible" tanpa UI feedback.

### O.2 Integration Files (Livestock, Pakan, Obat, Layanan)
**Status: CONNECTED ✅**

- **`marketplaceLivestockIntegrationData.ts`**: `buildIndividuList()` memblokir Arsip dan LuarKandang. `AsetWorkspaceOption.livestockDetail` membawa field live. Membaca `livestockData.ts` secara live.
- **`marketplaceStokPakanIntegrationData.ts`**: Reference UUID = `InventarisItem.id`. Qty derived live via `getQtyTersediaAset`. `tidakTersediaAlasan` digeneralisasi.
- **`marketplaceStokObatIntegrationData.ts`**: Kategori/SubKategori di-resolve via join `masterObatUuid`. Expiry handling via `getStatusStok`. Benar.
- **`marketplaceLayananTransportIntegrationData.ts`**, **`...DokterHewanIntegrationData.ts`**, **`...KlinikHewanIntegrationData.ts`**: Ketiganya menggunakan pattern `getAsetOptions(modul, workspaceId)`. Tidak ada hardcoded workspace ID di integration logic (hardcoded hanya di fallback `marketplaceAsetWorkspaceData.ts` — F-010).

---

## P. ROUTING ANALYSIS

### P.1 Tabel Route Lengkap (24 route)

| Route | Komponen | File Exists | Pattern Order OK |
|---|---|---|---|
| `/marketplace` | `Marketplace` | ✅ | ✅ |
| `/marketplace/buat` | `MarketplaceBuatListing` | ✅ | ✅ (sebelum catch-all) |
| `/marketplace/listing-saya` | `MarketplaceListingSaya` | ✅ | ✅ |
| `/marketplace/listing-saya/:uuid` | `MarketplaceKelolaListing` | ✅ | ✅ |
| `/marketplace/transaksi` | `MarketplaceTransaksi` | ✅ | ✅ |
| `/marketplace/transaksi/:id` | `MarketplaceDetailTransaksi` | ✅ | ✅ |
| `/marketplace/negosiasi` | `MarketplaceNegosiasi` | ✅ | ✅ |
| `/marketplace/negosiasi/buat` | `MarketplaceBuatNegosiasi` | ✅ | ✅ (sebelum :id) |
| `/marketplace/negosiasi/:id` | `MarketplaceDetailNegosiasi` | ✅ | ✅ |
| `/marketplace/dashboard` | `MarketplaceDashboard` | ✅ | ✅ |
| `/marketplace/dashboard-pembeli` | `MarketplaceDashboardPembeli` | ✅ | ✅ |
| `/marketplace/notifikasi` | `MarketplaceNotifikasi` | ✅ | ✅ |
| `/marketplace/chat` | `MarketplaceChatList` | ✅ | ✅ |
| `/marketplace/chat/:id` | `MarketplaceChat` | ✅ | ✅ |
| `/marketplace/wishlist` | `MarketplaceWishlist` | ✅ | ✅ |
| `/marketplace/riwayat` | `MarketplaceRiwayatAktivitas` | ✅ | ✅ |
| `/marketplace/verifikasi` | `MarketplaceVerifikasi` | ✅ | ✅ |
| `/marketplace/laporan` | `MarketplaceLaporan` | ✅ | ✅ |
| `/marketplace/laporan/buat` | `MarketplaceBuatLaporan` | ✅ | ✅ (sebelum :id) |
| `/marketplace/laporan/:id` | `MarketplaceDetailLaporan` | ✅ | ✅ |
| `/marketplace/moderasi` | `MarketplaceModerasiKasus` | ✅ | ✅ |
| `/marketplace/moderasi/:kasusId` | `MarketplaceModerasiDetailKasus` | ✅ | ✅ |
| `/marketplace/ai-insight` | `MarketplaceAiInsight` | ✅ | ✅ |
| `/marketplace/conversation/:transaksiId` | `MarketplaceConversation` | ✅ | ✅ |
| `/marketplace/evidence/:transaksiId` | `MarketplaceEvidenceTimeline` | ✅ | ✅ |
| `/marketplace/audit/:transaksiId` | `MarketplaceAuditTimeline` | ✅ | ✅ |
| `/marketplace/escrow/:transaksiId` | `MarketplaceEscrowDetail` | ✅ | ✅ |
| `/marketplace/:kategoriSlug/:slug` | `MarketplaceDetailListing` | ✅ | ✅ (catch-all terakhir) |

**✅ Tidak ada route conflict. Urutan route di App.tsx benar — semua specific routes dideklarasikan sebelum catch-all `/:kategoriSlug/:slug`.**

### P.2 Route yang Ada di App.tsx tapi Tidak Bisa Diakses dari Explorer
Route-route ini sudah terdaftar dan fungsional, tetapi tidak ada jalur navigasi dari `Marketplace.tsx`:
- `/marketplace/buat` (FAB tidak berfungsi)
- `/marketplace/listing-saya` (Shortcut disabled)
- `/marketplace/wishlist` (Shortcut disabled)
- `/marketplace/chat` (Shortcut disabled)
- `/marketplace/dashboard` (tidak ada link dari explorer)
- `/marketplace/dashboard-pembeli` (tidak ada link dari explorer)
- `/marketplace/ai-insight` (tidak ada link dari explorer)
- `/marketplace/riwayat` (tidak ada link dari explorer)
- `/marketplace/notifikasi` (tombol 🔔 tidak berfungsi)

---

## Q. CROSS-CUTTING FINDINGS

### Q.1 Profil Penjual — Tidak Ada Halaman Dedicated
**F-032 🟡 UI** — Tidak ada route `/marketplace/profil/:workspaceId` atau sejenisnya. Section "Tentang Penjual" hanya ditampilkan di dalam `MarketplaceDetailListing.tsx` (read-only inline, bukan halaman tersendiri). Tombol "Lihat Profil Penjual" tidak ada. `onViewWorkspace` di Chat hanya membawa ke `/marketplace`.

### Q.2 TransactionTabBar — Entry Point Terpotong di DetailTransaksi
**→ Lihat F-019.** TransactionTabBar ada dan benar di 4 halaman (Conversation, Evidence, AuditTimeline, EscrowDetail), namun `MarketplaceDetailTransaksi.tsx` hanya menampilkan satu tombol "Buka Conversation". Pengguna yang ingin langsung ke Escrow atau AuditTrail harus: buka transaksi → klik Conversation → baru temukan TabBar → pilih tab yang diinginkan.

### Q.3 Sistem Notifikasi — Dua Layer yang Terpadu
`marketplaceNotifikasiData.ts` mengagregasi dari riwayat status modul (Transaksi/Negosiasi/Listing) DAN `NotifikasiChat` dari `marketplaceChatData.ts`. Keduanya ditampilkan di `MarketplaceNotifikasi.tsx`. Terpadu dengan benar, tidak ada duplikasi.

---

## R. KESESUAIAN CONSTITUTION

| Aturan | Status |
|---|---|
| Baca data live, tidak ada caching | ✅ Semua sub-halaman membaca live |
| Sync ke modul lain hanya saat Selesai | ✅ `selesaikanTransaksi()` guard ada |
| EscrowFee ≠ TransactionCost | ✅ Dipisahkan di data model dan UI |
| `receiverConfirm()` hanya oleh receiver | ✅ `isReceiver` guard di EscrowDetail UI |
| Chat ≠ Evidence ≠ AuditTrail (terpisah) | ✅ 3 halaman + 3 data file terpisah |
| AuditTrail permanent/read-only | ✅ Tidak ada delete, tidak ada UI add |
| Escrow tab kondisional via `hasEscrow` | ✅ TransactionTabBar sudah benar |
| Workspace verification = Marketplace-local | ✅ Tidak mengubah TopAppBar registry |
| Transport = optional Participant | ✅ |
| Transport = evidence-only, no assessment | ✅ |
| `buatKasusModerasi` reachable | ✅ Dipanggil dari BuatLaporan |
| `buildIndividuList()` blokir Arsip/LuarKandang | ✅ |
| asetSynced flag cegah double-sync | ✅ |

---

## S. TABEL TEMUAN LENGKAP

| ID | Severity | File | Kategori | Deskripsi |
|---|---|---|---|---|
| F-001 | 🔴 KRITIS | `Marketplace.tsx` | Data/Placeholder | Seluruh listing hardcoded (L001–L008), tidak ada koneksi ke data layer |
| F-002 | 🔴 KRITIS | `Marketplace.tsx:408` | Functional | FAB "Buat Listing" tanpa onClick/navigate |
| F-003 | 🔴 KRITIS | `Marketplace.tsx:329` | Functional | Semua 4 Shortcut Card disabled permanen |
| F-004 | 🔴 KRITIS | `Marketplace.tsx:158` | Navigation | ListingCard tidak bisa diklik, tidak navigate ke DetailListing |
| F-019 | 🔴 KRITIS | `MarketplaceDetailTransaksi.tsx:553` | Navigation | TransactionTabBar absen — Evidence/AuditTrail/Escrow tidak reachable langsung dari transaksi |
| F-005 | 🟡 UI | `Marketplace.tsx:402` | UI | Category chip filter tidak memfilter listing (state diperbarui, render tidak) |
| F-006 | 🟡 UI | `Marketplace.tsx:288` | UI | Search input `readOnly`, tidak bisa diketik |
| F-007 | 🟡 UI | `Marketplace.tsx:298` | UI | Tombol notifikasi tanpa onClick |
| F-016 | 🟡 UI | `MarketplaceChatList.tsx` | UI | Search hanya by role, tidak by nama listing/workspace |
| F-017 | 🟡 UI | `MarketplaceChat.tsx:487` | Navigation | onViewWorkspace → `/marketplace` bukan profil penjual |
| F-024 | 🟡 UI | `MarketplaceDashboardPembeli.tsx:499` | Navigation | Wishlist QA → `/marketplace` bukan `/marketplace/wishlist` |
| F-026 | 🟡 UI | `MarketplaceVerifikasi.tsx` | Functional | Tombol "Ajukan Verifikasi" tidak terhubung ke mutasi |
| F-032 | 🟡 UI | (Semua halaman) | Architecture | Tidak ada halaman Profil Penjual dedicated di Marketplace |
| F-010 | 🟠 MINOR | `marketplaceAsetWorkspaceData.ts` | Data | Hardcoded fallback workspace IDs ('w4','w5','w6') |
| F-012 | 🟠 MINOR | `MarketplaceWishlist.tsx` | Functional | Opsi "Bagikan" adalah placeholder tanpa handler |
| F-013 | 🟠 MINOR | `MarketplaceWishlist.tsx` | Functional | Sort "Terdekat" tidak diimplementasikan (no geolocation) |
| F-014 | 🟠 MINOR | `MarketplaceRiwayatAktivitas.tsx` | Navigation | Detail aktivitas hanya membuka lokal DetailSheet, tidak navigate ke halaman tujuan |
| F-023 | 🟠 MINOR | `MarketplaceConversation.tsx` | Functional | Attachment hanya menerima string filename, tidak ada binary upload |
| F-027 | 🟠 MINOR | `marketplaceWorkspaceVerifikasiData.ts` | Data | `submitVerifikasi()` dan `approveVerifikasi()` belum diimplementasikan |
| F-031 | 🟠 MINOR | `marketplacePesananData.ts` | Dead Code | Modul Pesanan fungsional di data layer namun tanpa UI page |
| F-008 | 🔵 INFO | `marketplaceSearchData.ts` | Data | `toLowerCase()` locale-sensitive minor |
| F-009 | 🔵 INFO | `marketplaceKategoriData.ts` | Data | Beberapa kategori tanpa sub-kategori terdefinisi |
| F-011 | 🔵 INFO | `marketplaceListingData.ts` | Data | Seed dates hardcoded 2026 (konsisten dengan modul lain) |
| F-015 | 🔵 INFO | `marketplaceRiwayatAktivitasData.ts` | Data | 'Pesan Baru' hanya menampilkan pesan terakhir per room |
| F-018 | 🔵 INFO | `MarketplaceChat.tsx` | UI | Attachment emoji picker tampak seperti fitur nyata (disclaimer tidak menonjol) |
| F-020 | 🔵 INFO | `marketplaceTransaksiData.ts` | Architecture | `selesaikanTransaksi` → `performPermanentTransfer` (bukan `archiveLivestock`) — by design |
| F-021 | 🔵 INFO | `marketplaceTransaksiData.ts` | Data | Seed dates fixed 2026 |
| F-022 | 🔵 INFO | `marketplaceNegosiasiData.ts` | Data | Seed dates fixed 2026 |
| F-025 | 🔵 INFO | `marketplaceAiInsightData.ts` | Architecture | Overlap logika dengan `marketplaceAiInsightMPK020Data.ts` — risiko divergensi |
| F-028 | 🔵 INFO | `MarketplaceBuatLaporan.tsx` | Functional | Field lampiran adalah placeholder UI |
| F-029 | 🔵 INFO | `MarketplaceBuatLaporan.tsx` | Dead Code | `buatKasusModerasi()` aktif dipakai — bukan dead code (koreksi temuan MPK-R03) |
| F-030 | 🔵 INFO | `marketplaceLaporanData.ts` | Data | Seed dates future 2026 |

---

## T. KESIMPULAN

### Akar Masalah Utama
Dua masalah struktural yang perlu diperbaiki (dalam urutan prioritas):

**#1 — `Marketplace.tsx` adalah satu-satunya halaman yang belum dikerjakan.** Seluruh infrastruktur (25+ halaman fungsional, 32 data file, 24 route, Constitution compliance) sudah dibangun, namun entry point dari Home Quick Action mendarat di halaman statis tanpa koneksi ke apapun. Semua aksi utama (cari, filter, buka listing, buat listing) tidak berfungsi.

**#2 — `MarketplaceDetailTransaksi.tsx` memiliki TransactionTabBar yang hilang.** Pengguna yang membuka sebuah transaksi hanya mendapat satu tombol "Buka Conversation." Mereka tidak dapat langsung mengakses Evidence, AuditTrail, atau Escrow tanpa terlebih dahulu masuk ke Conversation dan kemudian menemukan TabBar di sana.

### Yang Sudah Benar
- 25 dari 28 halaman Marketplace terhubung ke data layer yang benar.
- Semua 24 route terdaftar benar, urutan benar, tidak ada conflict.
- Constitution Marketplace, Escrow, Transport, dan Transaction Conversation semuanya diikuti.
- Integration ke 6 modul (Livestock, StokPakan, StokObat, Transport, DokterHewan, KlinikHewan) diimplementasikan dengan benar.
- Trust 5-tier konsisten dan skor dihitung live.
- Chat (pre-transaksi) terpisah dari Conversation (in-transaksi) — benar.
- Evidence, AuditTrail, Escrow semua terpisah dan permanent/read-only sesuai Constitution.
- Laporan → Moderasi chain fungsional end-to-end.
