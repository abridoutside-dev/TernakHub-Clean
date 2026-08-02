# Marketplace Module Constitution
*TernakHub — Dokumen Arsitektur Resmi*

> **Dokumen ini bersifat immutable.** Tidak ada implementasi yang boleh melanggar aturan di bawah ini.
> Seluruh perubahan pada modul Marketplace wajib mengikuti Constitution ini.

---

## 1. Prinsip Dasar

### 1.1 Marketplace adalah Etalase, Bukan Database

Marketplace **hanya menyimpan referensi**. Data bisnis tetap berada di modul asalnya.

```
DILARANG:  Marketplace menyimpan salinan data bisnis (harga pokok, stok aktual, data ternak, komposisi obat, dll.)
WAJIB:     Marketplace hanya menyimpan Listing UUID, Reference UUID, Workspace UUID, dan Metadata Marketplace.
```

### 1.2 Tiga UUID Wajib per Listing

Setiap `ListingItem` wajib memiliki:

| Field | Tipe | Keterangan |
|---|---|---|
| `uuid` | Listing UUID | Identitas permanen listing, dibuat sekali |
| `sumber.sumberId` | Reference UUID | ID/UUID record asli di modul asal |
| `workspaceId` | Workspace UUID | Workspace pemilik listing |

### 1.3 Baca Live, Tidak Cache

Setiap kali data modul asal berubah, Marketplace **langsung membaca** data terbaru.
Tidak boleh ada salinan data yang di-cache di dalam Marketplace.

---

## 2. Modul Asal yang Diakui

| Kategori Marketplace | Modul Asal (sumber data) | Reference UUID |
|---|---|---|
| Ternak | `src/data/livestockData.ts` | `LivestockRecord.id` |
| Pakan — Hijauan | `src/data/rumputData.ts` | `RumputItem.id` |
| Pakan — Konsentrat | `src/data/konsentratDetailData.ts` | `KonsentratDetail.seriId` (UUID) |
| Pakan — Stok Fisik | `src/data/stokInventarisData.ts` | `InventarisItem.id` |
| Obat — Referensi | `src/data/obatData.ts` | `ObatItem.id` (UUID) |
| Obat — Stok Fisik | `src/data/stokObatData.ts` | `StokObatItem.uuid` |
| Transportasi | `src/data/layananTransportData.ts` | `LayananTransportRecord.uuid` |
| Dokter Hewan | `src/data/layananDokterHewanData.ts` | `LayananDokterHewanRecord.uuid` |
| Klinik Hewan | `src/data/layananKlinikHewanData.ts` | `LayananKlinikHewanRecord.uuid` |
| Peralatan, Bibit, Jasa, Lainnya | *Belum ada modul asal* | Ilustratif (tersedia: false) |

---

## 3. Aturan Buat Listing (Create Listing)

### 3.1 Sumber Aset Sah

Workspace hanya boleh membuat listing dari **aset yang dimiliki Workspace tersebut**:

| Jenis Workspace | Modul Sumber Aset | Dilarang |
|---|---|---|
| Peternakan | Livestock (individu aktif di kandang) | Master Pakan, Produk Komersial |
| Toko Pakan | Stok Pakan / Inventaris | Master Pakan langsung |
| Toko Obat | Stok Obat | Master Obat langsung |
| Transporter | Layanan Transport (workspaceId cocok) | — |
| Dokter Hewan | Layanan Dokter Hewan (workspaceId cocok) | — |
| Klinik Hewan | Layanan Klinik Hewan (workspaceId cocok) | — |

### 3.2 Stok — Pemisahan Wajib

```
Buat Listing  → TIDAK mengurangi stok fisik modul asal
Buat Transaksi → TIDAK mengurangi stok fisik modul asal
Transaksi Selesai → BARU mengurangi stok fisik modul asal (via sync)
```

Qty Tersedia Untuk Listing = Stok Fisik (live) − Qty Listing Aktif (live).

### 3.3 Validasi Berlapis

Eligibility check dilakukan di dua lapisan:
1. **Picker (UI)**: `tidakTersediaAlasan` ditampilkan, item tidak bisa dipilih
2. **Publish (submit)**: `get<Modul>Eligibility()` dijalankan ulang sebelum `addListing()`

---

## 4. Sinkronisasi Status

### 4.1 Alur Status Transaksi

```
Menunggu Persetujuan → Disetujui → Menunggu Pembayaran → Diproses
  → Siap Diserahkan → Sedang Dikirim → Selesai
                   ↘ Ditolak
                   ↘ Dibatalkan
```

Setiap perubahan status **wajib** masuk ke `riwayatStatus`.
Sinkronisasi aset (`asetSynced`) hanya terjadi satu kali saat status `Selesai`.

### 4.2 Alur Status Negosiasi

```
Menunggu Respon Penjual ↔ Penawaran Balik
  → Disetujui (otomatis membuat Transaksi)
  → Ditolak
  → Dibatalkan Pembeli
  → Kadaluarsa
```

Yang dapat dinegosiasikan: Harga, Qty, Catatan.
Yang **tidak** dapat dinegosiasikan: Aset, Workspace, Pemilik Listing.

### 4.3 Wishlist, Chat, Notifikasi, Riwayat

- Wishlist: menyimpan `listingUuid` saja — data listing dibaca live saat render.
- Chat: satu room per pasangan (listingUuid + pembeliWorkspaceId), idempoten.
- Notifikasi: digenerate live dari riwayat transaksi/negosiasi/chat — tidak disimpan terpisah.
- Riwayat Aktivitas: timeline audit digenerate live dari seluruh modul — tidak disimpan terpisah.

---

## 5. Aturan Workspace

### 5.1 Workspace Identity

Setiap listing menyimpan `workspaceId` dan `workspaceNama` (denormalized untuk tampilan).
`workspaceNama` adalah snapshot saat listing dibuat — bukan referensi live — ini sah karena merupakan metadata Marketplace, bukan data bisnis.

### 5.2 Workspace Verification

Status verifikasi Workspace dibaca live dari `marketplaceWorkspaceVerifikasiData.ts`.
Tidak ada duplikasi status verifikasi ke dalam `ListingItem`.

### 5.3 Scope Workspace

Satu Workspace hanya boleh melihat listing miliknya sendiri di "Listing Saya".
Satu Workspace tidak boleh membuat listing dari aset Workspace lain.

---

## 6. Aturan Data & ID

### 6.1 Listing UUID

Listing UUID dibuat **sekali** saat `addListing()` dipanggil.
Tidak boleh diubah setelah listing dibuat.
Format: UUID v4 dari `generateUUID()`.

### 6.2 Nomor Transaksi & Negosiasi

Format: `TRX-{YYYYMMDD}-{seq}` dan `NEG-{YYYYMMDD}-{seq}`.
Tanggal menggunakan `new Date()` — tidak boleh hardcoded.
Sequence counter per sesi (in-memory, bukan persisten).

### 6.3 Laporan & Moderasi ID

Format: `LAP-{YYYYMMDD}-{seq}` dan `KAS-{YYYYMMDD}-{seq}`.
Tanggal menggunakan `new Date()` — tidak boleh hardcoded.
Setiap perubahan status wajib tercatat di `riwayatPenanganan` / `riwayatKeputusan`.

---

## 7. Aturan UI

### 7.1 Empty State Wajib

Setiap halaman daftar (Listing Saya, Transaksi, Negosiasi, Wishlist, Chat, Riwayat) wajib memiliki empty state yang informatif ketika data kosong.

### 7.2 Status Tidak Tersedia

Aset yang tidak layak dijual (Nonaktif/Kadaluarsa/Diarsipkan) **tetap ditampilkan** di picker (transparan/disabled) dengan `tidakTersediaAlasan` yang spesifik.
**Dilarang** menyembunyikan aset tidak layak secara diam-diam.

### 7.3 Stok Habis

Jika stok fisik modul asal turun ke 0 setelah listing aktif, listing ditampilkan sebagai "Stok Habis" (`getEfektifStatusListing`).
Status tersimpan di listing **tidak berubah** — hanya tampilan efektifnya yang berbeda.

---

## 8. Larangan Absolut

```
❌ Menyimpan salinan data bisnis dari modul asal di dalam Marketplace
❌ Menulis ke modul asal dari Marketplace (kecuali sync saat Transaksi Selesai)
❌ Hardcoding tanggal/ID di mutation functions (wajib pakai new Date())
❌ Menghapus riwayat (riwayatStatus, riwayatNegosiasi, riwayatKeputusan) — append-only
❌ Membuat listing dari aset Workspace lain
❌ Double-sync aset (flag asetSynced mencegah ini)
❌ Mengarsipkan/menghapus Livestock dari Marketplace (Livestock punya alur arsip sendiri)
```

---

## 9. Modul yang Terdaftar (MPK-001 — MPK-025)

| Fase | Modul | File Utama |
|---|---|---|
| MPK-001..003 | Model & Listing Generik | `marketplaceListingData.ts` |
| MPK-002 | Kategori & Sub-Kategori | `marketplaceKategoriData.ts` |
| MPK-005 | Listing Explorer | `Marketplace.tsx` |
| MPK-006 | Origin Detail Resolver | `marketplaceOriginDetailData.ts` |
| MPK-007 | Buat Listing | `MarketplaceBuatListing.tsx` |
| MPK-008 | Listing Saya & Kelola | `MarketplaceListingSaya.tsx`, `MarketplaceKelolaListing.tsx` |
| MPK-009 | Transaksi | `marketplaceTransaksiData.ts` |
| MPK-010 | Negosiasi | `marketplaceNegosiasiData.ts` |
| MPK-011 | Chat | `marketplaceChatData.ts` |
| MPK-012 | Notifikasi | `marketplaceNotifikasiData.ts` |
| MPK-013 | Wishlist | `marketplaceWishlistData.ts` |
| MPK-014 | Dashboard Penjual | `marketplaceDashboardData.ts` |
| MPK-015 | Dashboard Pembeli | `marketplaceBuyerDashboardData.ts` |
| MPK-016 | Search & Filter | `marketplaceSearchData.ts`, `marketplaceFilterData.ts` |
| MPK-017 | Verifikasi & Trust | `marketplaceTrustData.ts`, `marketplaceWorkspaceVerifikasiData.ts` |
| MPK-018 | Laporan | `marketplaceLaporanData.ts` |
| MPK-019 | Moderasi | `marketplaceModerasiData.ts` |
| MPK-020 | AI Insight | `marketplaceAiInsightMPK020Data.ts` |
| MPK-021 | Integrasi Livestock | `marketplaceLivestockIntegrationData.ts` |
| MPK-022 | Integrasi Stok Pakan | `marketplaceStokPakanIntegrationData.ts` |
| MPK-023 | Integrasi Stok Obat | `marketplaceStokObatIntegrationData.ts` |
| MPK-024 | Integrasi Layanan Jasa | `marketplaceLayananTransport/DokterHewan/KlinikHewanIntegrationData.ts` |
| MPK-025 | Penyempurnaan & Konsistensi | (dokumen ini) |

---

*Versi: 1.0 — Dibuat: 2026-07-14*
*Setiap perubahan arsitektur wajib diperbarui di dokumen ini terlebih dahulu.*
