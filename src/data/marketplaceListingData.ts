// ─── Marketplace — Model Listing Generik (MPK-001 → MPK-003) ────────────────
// Model Listing GENERIK yang menampung seluruh kategori Marketplace — Ternak,
// Pakan, Obat, Transport, Dokter, Klinik, Peralatan, Jasa, dst — tanpa model
// berbeda per kategori. Relasi ke Kategori/SubKategori memakai UUID
// (marketplaceKategoriData.ts, MPK-002), bukan slug/nama.
//
// Arsitektur: Workspace → Create Listing → Marketplace Listing → Detail
// Listing. Seluruh listing berasal dari Workspace aktif (workspaceId).
// Detail Listing (halaman) TIDAK dibangun pada fase ini.
//
// SUMBER DATA: Listing hanya ETALASE. Data asli tetap di modul asal
// (Livestock, Produk Komersial, Master Obat, Master Pakan, dst) — field
// `sumber` hanya menyimpan REFERENSI (nama modul + id/UUID asal), Marketplace
// tidak menduplikasi database modul lain.
//
// MPK-006/MPK-024: Kategori yang punya modul asal nyata di codebase ini:
//   Ternak           → Livestock (livestockData.ts)
//   Pakan            → Master Pakan / Produk Komersial Konsentrat
//   Obat             → Master Obat (obatData.ts + obatDetailData.ts)
//   Transportasi     → layananTransportData.ts (MPK-024)
//   Dokter Hewan     → layananDokterHewanData.ts (MPK-024)
//   Klinik Hewan     → layananKlinikHewanData.ts (MPK-024)
// Semua kategori di atas: `sumberId` memakai UUID ASLI modul tersebut.
// Resolver: src/data/marketplaceOriginDetailData.ts (getOriginDetail).
// Kategori tanpa modul asal (Peralatan/BibitHijauan/JasaPeternakan/Lainnya):
//   `sumberId` masih ILUSTRASI — resolver mengembalikan tersedia:false.
// Livestock: ID dibuat dinamis saat runtime, resolver jatuh ke pencocokan
//   berdasarkan spesies (targetTernak) sebagai fallback.
//
// Modul ini tidak membaca/menulis Workspace, Modul Pakan, Livestock,
// Kesehatan Hewan, atau Formula — hanya membaca (read-only) getter yang
// sudah diekspor modul-modul tersebut.
//
// Sesuai lingkup MPK-003/MPK-006: belum ada transaksi, chat, pembayaran,
// atau negosiasi — hanya struktur model, listing baca-saja, dan halaman
// Detail Listing baca-saja.

import { generateUUID } from '../utils/uuid';
import {
  getKategoriMarketplaceBySlug,
  type KategoriMarketplaceSlug,
} from './marketplaceKategoriData';
// MPK-006: sumberId untuk listing yang MEMANG punya modul asal nyata di
// codebase ini menggunakan UUID/ID asli modul tersebut (bukan lagi ilustrasi)
// — bacaan saja (read-only import), Marketplace tidak menulis/menduplikasi
// data modul asal ini.
import { KONSENTRAT_SERI_UUID } from './konsentratSeriData';

// ─── Status Listing ───────────────────────────────────────────────────────────
// Siklus hidup listing dari draft sampai diarsipkan.
export type ListingStatus =
  | 'Draft'
  | 'Aktif'
  | 'Ditahan'
  | 'Terjual'
  | 'Ditutup'
  | 'Diarsipkan';

// ─── Media ─────────────────────────────────────────────────────────────────────
// Thumbnail, Gallery, Cover. Video TIDAK digunakan.
export interface ListingMedia {
  /** Emoji atau URL gambar kecil — ditampilkan pada kartu listing. */
  thumbnail: string;
  /** Kumpulan gambar tambahan (galeri) milik listing. */
  gallery: string[];
  /** Gambar sampul untuk header halaman detail (belum dibangun). */
  cover?: string;
}

// ─── Sumber Data (etalase, bukan duplikasi) ──────────────────────────────────
export type ListingSumberModul =
  | 'Livestock'
  | 'MasterPakan'
  | 'ProdukKomersialPakan'
  | 'MasterObat'
  | 'ProdukKomersialObat'
  /**
   * MPK-007: aset PAKAN yang sungguh dimiliki Workspace (Stok Pakan/Inventaris —
   * src/data/stokInventarisData.ts), BUKAN katalog referensi Master Pakan/Produk
   * Komersial. Halaman Buat Listing hanya boleh membuat listing kategori Pakan
   * dari sumber ini.
   */
  | 'StokPakan'
  /**
   * MPK-007: aset OBAT yang sungguh dimiliki Workspace (Stok Obat —
   * src/data/stokObatData.ts), BUKAN katalog referensi Master Obat/Produk
   * Komersial Obat. Halaman Buat Listing hanya boleh membuat listing kategori
   * Obat & Kesehatan dari sumber ini.
   */
  | 'StokObat'
  | 'Transportasi'
  | 'DokterHewan'
  | 'KlinikHewan'
  | 'Peralatan'
  | 'BibitHijauan'
  | 'JasaPeternakan'
  | 'Lainnya';

export interface ListingSumber {
  /** Modul asal tempat data sesungguhnya berada. */
  modul: ListingSumberModul;
  /** ID/UUID record asli pada modul sumber. Marketplace hanya menyimpan referensi ini, tidak menyalin datanya. */
  sumberId: string;
}

// ─── Model Listing ─────────────────────────────────────────────────────────────
// Satu model generik untuk seluruh kategori Marketplace.
export interface ListingItem {
  /** listing_uuid — identitas permanen listing, dibuat sekali saat listing dibuat. */
  uuid: string;
  /** workspace_uuid — Workspace asal (pemilik listing). Hanya atribut data; tidak mengubah arsitektur Workspace. */
  workspaceId: string;
  /** Nama Workspace asal — denormalized untuk tampilan. */
  workspaceNama: string;
  /** owner_uuid — pemilik/pembuat listing di dalam Workspace tersebut. */
  ownerId: string;
  /** kategori_uuid — relasi ke KategoriMarketplace.uuid. */
  kategoriUuid: string;
  /** Slug kategori — kenyamanan tampilan/routing, diturunkan dari kategoriUuid. */
  kategoriSlug: KategoriMarketplaceSlug;
  /** subkategori_uuid — relasi ke SubKategoriMarketplace.uuid (opsional, belum semua kategori punya sub-kategori). */
  subKategoriUuid?: string;
  /** Slug sub-kategori — kenyamanan tampilan/routing. */
  subKategoriSlug?: string;
  /** Jenis listing spesifik, misal "Domba", "Konsentrat", "Jasa Angkut". Untuk kategori Ternak, ini juga berfungsi sebagai "Jenis Ternak". */
  jenisListing: string;
  judul: string;
  /** Slug listing — untuk routing halaman detail di masa depan (belum dibangun). */
  slug: string;
  media: ListingMedia;
  deskripsi: string;
  harga: number;
  /** satuan_harga — misal "ekor", "kg", "sak", "jasa". */
  satuanHarga: string;
  /**
   * Qty Dijual (MPK-007) — jumlah yang ditawarkan pada listing INI, bukan
   * seluruh stok fisik aset. Divalidasi terhadap Qty Tersedia Untuk Listing
   * (lihat getQtyTersediaAset di marketplaceAsetWorkspaceData.ts) — tidak boleh
   * melebihi stok fisik dikurangi Qty Listing Aktif pada listing lain untuk
   * aset yang sama.
   */
  qtyDijual: number;
  /** Kondisi aset — mis. "Sehat"/"Baru"/"Bekas Layak Pakai"/"Tersedia" (MPK-007). */
  kondisi?: string;
  kabupaten: string;
  provinsi: string;
  /** Ringkasan lokasi untuk tampilan kartu, diturunkan dari kabupaten + provinsi. */
  lokasi: string;
  /** Brand/merek — relevan untuk listing Pakan/Obat yang berasal dari Produk Komersial. */
  brand?: string;
  /** Nama penjual untuk tampilan (denormalized dari workspace/owner). */
  penjual: string;
  /**
   * Target Ternak — jenis ternak yang relevan untuk listing ini (mis. pakan
   * atau obat yang cocok untuk Sapi & Kambing). Untuk listing kategori Ternak
   * sendiri, nilainya adalah jenis ternak tersebut. Struktur Marketplace saja
   * (bukan field dari modul lain) — dipakai untuk Filter "Target Ternak".
   */
  targetTernak?: string[];
  /** Referensi ke modul asal data — Marketplace tidak menduplikasi database utama. */
  sumber: ListingSumber;
  status: ListingStatus;
  /** created_at — ISO date (yyyy-mm-dd). */
  createdAt: string;
  /** updated_at — ISO date (yyyy-mm-dd). */
  updatedAt: string;
  /**
   * MPK-008: tanggal listing pertama kali berstatus 'Aktif' (dipublikasikan).
   * Tetap kosong selama listing masih Draft. Tidak berubah lagi setelah
   * terisi, meskipun status berubah-ubah setelahnya (mis. Aktif → Ditahan →
   * Aktif lagi tidak mereset tanggal publish).
   */
  publishedAt?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function kategoriUuidOf(slug: KategoriMarketplaceSlug): string {
  const kategori = getKategoriMarketplaceBySlug(slug);
  if (!kategori) throw new Error(`Kategori Marketplace tidak ditemukan: ${slug}`);
  return kategori.uuid;
}

/**
 * Data contoh untuk menyusun & memverifikasi struktur Listing. Belum
 * mewakili seluruh kategori/data riil (lihat batasan MPK-003).
 */
const LISTING_LIST: ListingItem[] = [
  {
    uuid: 'a1b2c3d4-0001-4001-8001-000000000001',
    workspaceId: 'w1',
    workspaceNama: 'Berkah Farm Garut',
    ownerId: 'owner-w1-01',
    kategoriUuid: kategoriUuidOf('ternak'),
    kategoriSlug: 'ternak',
    subKategoriUuid: '8674c1a2-6f93-473b-8cb7-9c0b4f98a48f',
    subKategoriSlug: 'domba',
    jenisListing: 'Domba Garut',
    judul: 'Domba Garut Jantan — Siap Jual',
    slug: slugify('Domba Garut Jantan — Siap Jual'),
    media: { thumbnail: '🐑', gallery: ['🐑', '🐑'] },
    deskripsi: 'Domba Garut jantan, bobot ideal, siap potong maupun kurban.',
    harga: 3500000,
    satuanHarga: 'ekor',
    qtyDijual: 1,
    kondisi: 'Sehat',
    kabupaten: 'Garut',
    provinsi: 'Jawa Barat',
    lokasi: 'Garut, Jawa Barat',
    penjual: 'Berkah Farm Garut',
    targetTernak: ['Domba'],
    sumber: { modul: 'Livestock', sumberId: 'LVS-ILUSTRASI-001' },
    status: 'Aktif',
    createdAt: '2026-07-10',
    updatedAt: '2026-07-10',
  },
  {
    uuid: 'a1b2c3d4-0002-4001-8001-000000000002',
    workspaceId: 'w2',
    workspaceNama: 'Berkah Farm Tasik',
    ownerId: 'owner-w2-01',
    kategoriUuid: kategoriUuidOf('ternak'),
    kategoriSlug: 'ternak',
    subKategoriUuid: 'afb4b41c-ae18-4e05-a0e9-81a1ee0df6b2',
    subKategoriSlug: 'kambing',
    jenisListing: 'Kambing Boer',
    judul: 'Kambing Boer F1 Betina — 8 Bulan',
    slug: slugify('Kambing Boer F1 Betina — 8 Bulan'),
    media: { thumbnail: '🐐', gallery: ['🐐'] },
    deskripsi: 'Kambing Boer F1 betina, umur 8 bulan, sehat dan aktif.',
    harga: 2800000,
    satuanHarga: 'ekor',
    qtyDijual: 1,
    kondisi: 'Sehat',
    kabupaten: 'Tasikmalaya',
    provinsi: 'Jawa Barat',
    lokasi: 'Tasikmalaya, Jawa Barat',
    penjual: 'Berkah Farm Tasik',
    targetTernak: ['Kambing'],
    sumber: { modul: 'Livestock', sumberId: 'LVS-ILUSTRASI-002' },
    status: 'Aktif',
    createdAt: '2026-07-09',
    updatedAt: '2026-07-09',
  },
  {
    uuid: 'a1b2c3d4-0003-4001-8001-000000000003',
    workspaceId: 'w3',
    workspaceNama: 'Toko Pakan Berkah',
    ownerId: 'owner-w3-01',
    kategoriUuid: kategoriUuidOf('pakan'),
    kategoriSlug: 'pakan',
    subKategoriUuid: '856acbdc-c8f1-4326-810a-f5422d4c1906',
    subKategoriSlug: 'hijauan',
    jenisListing: 'Hijauan',
    judul: 'Rumput Gajah Segar — per Ikat 5 kg',
    slug: slugify('Rumput Gajah Segar — per Ikat 5 kg'),
    media: { thumbnail: '🌾', gallery: ['🌾'] },
    deskripsi: 'Rumput gajah segar, dipanen harian, per ikat 5 kg.',
    harga: 15000,
    satuanHarga: 'ikat',
    qtyDijual: 40,
    kondisi: 'Baru',
    kabupaten: 'Bandung',
    provinsi: 'Jawa Barat',
    lokasi: 'Bandung, Jawa Barat',
    penjual: 'Toko Pakan Berkah',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Kerbau'],
    // MPK-006: rujukan nyata ke Master Pakan — bahan baku "Rumput Gajah" (rumputData.ts).
    sumber: { modul: 'MasterPakan', sumberId: 'rumput-gajah' },
    status: 'Aktif',
    createdAt: '2026-07-11',
    updatedAt: '2026-07-11',
  },
  {
    uuid: 'a1b2c3d4-0004-4001-8001-000000000004',
    workspaceId: 'w3',
    workspaceNama: 'Toko Pakan Berkah',
    ownerId: 'owner-w3-02',
    kategoriUuid: kategoriUuidOf('pakan'),
    kategoriSlug: 'pakan',
    subKategoriUuid: '9fd110a2-f9f1-4f70-a6dc-5d8ae91145dc',
    subKategoriSlug: 'produk-komersial',
    jenisListing: 'Konsentrat',
    judul: 'Complete Feed Sapi Penggemukan — 50 kg',
    slug: slugify('Complete Feed Sapi Penggemukan — 50 kg'),
    media: { thumbnail: '🌾', gallery: ['🌾'] },
    deskripsi: 'Complete feed untuk sapi penggemukan, kemasan 50 kg.',
    harga: 320000,
    satuanHarga: 'sak',
    qtyDijual: 15,
    kondisi: 'Baru',
    kabupaten: 'Surabaya',
    provinsi: 'Jawa Timur',
    lokasi: 'Surabaya, Jawa Timur',
    brand: 'Charoen Pokphand',
    penjual: 'Toko Agro Jaya',
    targetTernak: ['Sapi'],
    // MPK-006: rujukan nyata ke Produk Komersial Konsentrat — seri CP 144 (konsentratSeriData.ts/konsentratDetailData.ts).
    sumber: { modul: 'ProdukKomersialPakan', sumberId: KONSENTRAT_SERI_UUID['cp-144'] },
    status: 'Aktif',
    createdAt: '2026-07-08',
    updatedAt: '2026-07-08',
  },
  {
    uuid: 'a1b2c3d4-0005-4001-8001-000000000005',
    workspaceId: 'w1',
    workspaceNama: 'Berkah Farm Garut',
    ownerId: 'owner-w1-02',
    kategoriUuid: kategoriUuidOf('obat-kesehatan'),
    kategoriSlug: 'obat-kesehatan',
    subKategoriUuid: '15417c8d-25a4-4ccc-8730-4d39157a8c44',
    subKategoriSlug: 'antiparasit',
    jenisListing: 'Antiparasit',
    judul: 'Ivermectin 1% — 50 mL / Botol',
    slug: slugify('Ivermectin 1% — 50 mL / Botol'),
    media: { thumbnail: '💊', gallery: ['💊'] },
    deskripsi: 'Ivermectin 1% injeksi, botol 50 mL, untuk antiparasit ternak.',
    harga: 45000,
    satuanHarga: 'botol',
    qtyDijual: 20,
    kondisi: 'Baru',
    kabupaten: 'Bandung',
    provinsi: 'Jawa Barat',
    lokasi: 'Bandung, Jawa Barat',
    brand: 'Medion',
    penjual: 'Apotek Hewan Sehat',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Kerbau'],
    // MPK-006: rujukan nyata ke Master Obat — Ivermectin (obatData.ts/obatDetailData.ts).
    sumber: { modul: 'MasterObat', sumberId: 'a1b2c3d4-0010-4000-8000-000000000010' },
    status: 'Aktif',
    createdAt: '2026-07-07',
    updatedAt: '2026-07-07',
  },
  {
    uuid: 'a1b2c3d4-0006-4001-8001-000000000006',
    workspaceId: 'w4',
    workspaceNama: 'Berkah Transport',
    ownerId: 'owner-w4-01',
    kategoriUuid: kategoriUuidOf('transportasi'),
    kategoriSlug: 'transportasi',
    subKategoriUuid: 'd2ce520b-3e8c-49b1-b79b-92e97b0a50eb',
    subKategoriSlug: 'angkut-ternak',
    jenisListing: 'Angkut Ternak',
    judul: 'Jasa Transport Ternak Garut – Bandung',
    slug: slugify('Jasa Transport Ternak Garut – Bandung'),
    media: { thumbnail: '🚚', gallery: ['🚚'] },
    deskripsi: 'Jasa angkut ternak rute Garut–Bandung, armada tertutup.',
    harga: 350000,
    satuanHarga: 'jasa',
    qtyDijual: 1,
    kondisi: 'Tersedia',
    kabupaten: 'Garut',
    provinsi: 'Jawa Barat',
    lokasi: 'Garut, Jawa Barat',
    penjual: 'Berkah Transport',
    targetTernak: ['Sapi', 'Kambing', 'Domba'],
    // MPK-024: sumberId nyata dari layananTransportData.ts (workspaceId w4, record pertama)
    sumber: { modul: 'Transportasi', sumberId: 'a1b2c3d4-t001-4000-8001-000000000001' },
    status: 'Aktif',
    createdAt: '2026-07-06',
    updatedAt: '2026-07-06',
  },
  {
    uuid: 'a1b2c3d4-0007-4001-8001-000000000007',
    workspaceId: 'w1',
    workspaceNama: 'Berkah Farm Garut',
    ownerId: 'owner-w1-03',
    kategoriUuid: kategoriUuidOf('dokter-hewan'),
    kategoriSlug: 'dokter-hewan',
    jenisListing: 'Konsultasi',
    judul: 'Konsultasi Dokter Hewan — Kunjungan Kandang',
    slug: slugify('Konsultasi Dokter Hewan — Kunjungan Kandang'),
    media: { thumbnail: '👨‍⚕️', gallery: ['👨‍⚕️'] },
    deskripsi: 'Kunjungan dan konsultasi dokter hewan langsung ke kandang.',
    harga: 250000,
    satuanHarga: 'jasa',
    qtyDijual: 1,
    kondisi: 'Tersedia',
    kabupaten: 'Garut',
    provinsi: 'Jawa Barat',
    lokasi: 'Garut, Jawa Barat',
    penjual: 'drh. Amelia Putri',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Kerbau', 'Kuda', 'Babi'],
    // MPK-024: sumberId nyata dari layananDokterHewanData.ts (workspaceId w5, record pertama)
    sumber: { modul: 'DokterHewan', sumberId: 'a1b2c3d4-d001-4000-8002-000000000001' },
    status: 'Aktif',
    createdAt: '2026-07-05',
    updatedAt: '2026-07-05',
  },
  {
    uuid: 'a1b2c3d4-0008-4001-8001-000000000008',
    workspaceId: 'w2',
    workspaceNama: 'Berkah Farm Tasik',
    ownerId: 'owner-w2-02',
    kategoriUuid: kategoriUuidOf('klinik-hewan'),
    kategoriSlug: 'klinik-hewan',
    jenisListing: 'Rawat Jalan',
    judul: 'Klinik Hewan Sejahtera — Layanan Rawat Jalan Ternak',
    slug: slugify('Klinik Hewan Sejahtera — Layanan Rawat Jalan Ternak'),
    media: { thumbnail: '🏥', gallery: ['🏥'] },
    deskripsi: 'Layanan rawat jalan untuk ternak di Klinik Hewan Sejahtera.',
    harga: 150000,
    satuanHarga: 'jasa',
    qtyDijual: 1,
    kondisi: 'Tersedia',
    kabupaten: 'Tasikmalaya',
    provinsi: 'Jawa Barat',
    lokasi: 'Tasikmalaya, Jawa Barat',
    penjual: 'Klinik Hewan Sejahtera',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Kerbau', 'Kuda', 'Babi'],
    // MPK-024: sumberId nyata dari layananKlinikHewanData.ts (workspaceId w6, record pertama)
    sumber: { modul: 'KlinikHewan', sumberId: 'a1b2c3d4-k001-4000-8003-000000000001' },
    status: 'Aktif',
    createdAt: '2026-07-04',
    updatedAt: '2026-07-04',
  },
  {
    uuid: 'a1b2c3d4-0009-4001-8001-000000000009',
    workspaceId: 'w1',
    workspaceNama: 'Berkah Farm Garut',
    ownerId: 'owner-w1-04',
    kategoriUuid: kategoriUuidOf('peralatan'),
    kategoriSlug: 'peralatan',
    subKategoriUuid: 'cc422d41-15b4-4b3b-a9bb-a744e7da220b',
    subKategoriSlug: 'kandang',
    jenisListing: 'Kandang',
    judul: 'Kandang Panggung Bambu — Kapasitas 10 Ekor',
    slug: slugify('Kandang Panggung Bambu — Kapasitas 10 Ekor'),
    media: { thumbnail: '🧰', gallery: ['🧰'] },
    deskripsi: 'Kandang panggung bambu, kapasitas 10 ekor, siap pasang.',
    harga: 4500000,
    satuanHarga: 'unit',
    qtyDijual: 3,
    kondisi: 'Baru',
    kabupaten: 'Garut',
    provinsi: 'Jawa Barat',
    lokasi: 'Garut, Jawa Barat',
    penjual: 'UD Kandang Makmur',
    targetTernak: ['Domba', 'Kambing'],
    sumber: { modul: 'Peralatan', sumberId: 'PRL-ILUSTRASI-001' },
    status: 'Aktif',
    createdAt: '2026-07-03',
    updatedAt: '2026-07-03',
  },
  {
    uuid: 'a1b2c3d4-000a-4001-8001-00000000000a',
    workspaceId: 'w3',
    workspaceNama: 'Toko Pakan Berkah',
    ownerId: 'owner-w3-03',
    kategoriUuid: kategoriUuidOf('bibit-hijauan'),
    kategoriSlug: 'bibit-hijauan',
    jenisListing: 'Bibit Rumput',
    judul: 'Bibit Rumput Odot — per Kg Stek',
    slug: slugify('Bibit Rumput Odot — per Kg Stek'),
    media: { thumbnail: '🌱', gallery: ['🌱'] },
    deskripsi: 'Bibit stek rumput odot, dijual per kg.',
    harga: 20000,
    satuanHarga: 'kg',
    qtyDijual: 100,
    kondisi: 'Baru',
    kabupaten: 'Bandung',
    provinsi: 'Jawa Barat',
    lokasi: 'Bandung, Jawa Barat',
    penjual: 'Toko Pakan Berkah',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Kerbau'],
    sumber: { modul: 'BibitHijauan', sumberId: 'BBT-ILUSTRASI-001' },
    status: 'Aktif',
    createdAt: '2026-07-02',
    updatedAt: '2026-07-02',
  },
  {
    uuid: 'a1b2c3d4-000b-4001-8001-00000000000b',
    workspaceId: 'w4',
    workspaceNama: 'Berkah Transport',
    ownerId: 'owner-w4-02',
    kategoriUuid: kategoriUuidOf('lainnya'),
    kategoriSlug: 'lainnya',
    jenisListing: 'Layanan Lainnya',
    judul: 'Jasa Sewa Timbangan Ternak Portable',
    slug: slugify('Jasa Sewa Timbangan Ternak Portable'),
    media: { thumbnail: '⚖️', gallery: ['⚖️'] },
    deskripsi: 'Sewa timbangan ternak portable harian/mingguan.',
    harga: 100000,
    satuanHarga: 'jasa',
    qtyDijual: 1,
    kondisi: 'Tersedia',
    kabupaten: 'Garut',
    provinsi: 'Jawa Barat',
    lokasi: 'Garut, Jawa Barat',
    penjual: 'Berkah Transport',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Kerbau', 'Kuda', 'Babi'],
    sumber: { modul: 'Lainnya', sumberId: 'LNY-ILUSTRASI-001' },
    status: 'Aktif',
    createdAt: '2026-07-01',
    updatedAt: '2026-07-01',
  },
];

/** Seluruh listing, terbaru di atas. */
export function getAllListing(): ListingItem[] {
  return LISTING_LIST.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Listing pada satu kategori. */
export function getListingByKategori(slug: KategoriMarketplaceSlug): ListingItem[] {
  return getAllListing().filter((l) => l.kategoriSlug === slug);
}

/** Jumlah listing per kategori — untuk badge/counter pada chip kategori. */
export function getJumlahListingByKategori(slug: KategoriMarketplaceSlug): number {
  return LISTING_LIST.filter((l) => l.kategoriSlug === slug).length;
}

/** Satu listing berdasarkan UUID. */
export function getListingByUuid(uuid: string): ListingItem | undefined {
  return LISTING_LIST.find((l) => l.uuid === uuid);
}

/** Satu listing berdasarkan slug — struktur siap untuk halaman detail di masa depan (belum dibangun). */
export function getListingBySlug(slug: string): ListingItem | undefined {
  return LISTING_LIST.find((l) => l.slug === slug);
}

// ─── MPK-007: Buat Listing — Pemisahan Stok Fisik vs Qty Listing ────────────
// Membuat listing TIDAK PERNAH mengurangi stok fisik pada modul asal (Stok
// Pakan/Stok Obat/Livestock). Yang dikelola di sini hanyalah "Qty Listing
// Aktif" — total qtyDijual dari seluruh listing yang masih "memegang" sebagian
// stok aset yang sama. Qty Tersedia Untuk Listing = Stok Fisik (dibaca live
// dari modul asal) − Qty Listing Aktif (dihitung live dari LISTING_LIST di
// bawah ini). Lihat src/data/marketplaceAsetWorkspaceData.ts untuk sisi
// "Stok Fisik" per modul asal.

/**
 * Status listing yang masih "mengunci" sebagian Qty Tersedia Untuk Listing
 * dari asetnya. Ditutup/Diarsipkan melepas kembali kuota tersebut, sehingga
 * bisa dipakai listing baru.
 */
export const RESERVING_LISTING_STATUS: ListingStatus[] = ['Draft', 'Aktif', 'Ditahan', 'Terjual'];

/**
 * Total Qty Listing Aktif untuk satu aset (modul + sumberId) — dihitung LIVE
 * dari seluruh listing yang ada, bukan counter tersimpan. `excludeUuid`
 * memungkinkan menghitung "listing lain" saat mengedit/menambah listing baru
 * untuk aset yang sama.
 */
export function getQtyListingAktif(modul: ListingSumberModul, sumberId: string, excludeUuid?: string): number {
  return LISTING_LIST
    .filter((l) => l.sumber.modul === modul && l.sumber.sumberId === sumberId)
    .filter((l) => l.uuid !== excludeUuid)
    .filter((l) => RESERVING_LISTING_STATUS.includes(l.status))
    .reduce((sum, l) => sum + l.qtyDijual, 0);
}

function ensureUniqueSlug(base: string): string {
  let candidate = base;
  let n = 2;
  while (LISTING_LIST.some((l) => l.slug === candidate)) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  return candidate;
}

/** Payload untuk membuat listing baru — lihat halaman Buat Listing (MPK-007). */
export interface CreateListingInput {
  workspaceId: string;
  workspaceNama: string;
  ownerId: string;
  kategoriSlug: KategoriMarketplaceSlug;
  subKategoriUuid?: string;
  subKategoriSlug?: string;
  jenisListing: string;
  judul: string;
  media: ListingMedia;
  deskripsi: string;
  harga: number;
  satuanHarga: string;
  qtyDijual: number;
  kondisi?: string;
  kabupaten: string;
  provinsi: string;
  brand?: string;
  penjual: string;
  targetTernak?: string[];
  sumber: ListingSumber;
  status: ListingStatus;
}

/**
 * Menambahkan listing baru ke etalase Marketplace. TIDAK PERNAH menyentuh
 * data/stok pada modul asal — hanya mencatat referensi (`sumber`) dan
 * metadata Marketplace sendiri. Validasi Qty terhadap ketersediaan aset harus
 * sudah dilakukan oleh pemanggil (lihat halaman Buat Listing) sebelum
 * memanggil fungsi ini.
 */
export function addListing(input: CreateListingInput): ListingItem {
  const today = new Date().toISOString().split('T')[0];
  const listing: ListingItem = {
    uuid: generateUUID(),
    workspaceId: input.workspaceId,
    workspaceNama: input.workspaceNama,
    ownerId: input.ownerId,
    kategoriUuid: kategoriUuidOf(input.kategoriSlug),
    kategoriSlug: input.kategoriSlug,
    subKategoriUuid: input.subKategoriUuid,
    subKategoriSlug: input.subKategoriSlug,
    jenisListing: input.jenisListing,
    judul: input.judul,
    slug: ensureUniqueSlug(slugify(input.judul)),
    media: input.media,
    deskripsi: input.deskripsi,
    harga: input.harga,
    satuanHarga: input.satuanHarga,
    qtyDijual: input.qtyDijual,
    kondisi: input.kondisi,
    kabupaten: input.kabupaten,
    provinsi: input.provinsi,
    lokasi: [input.kabupaten, input.provinsi].filter(Boolean).join(', '),
    brand: input.brand,
    penjual: input.penjual,
    targetTernak: input.targetTernak,
    sumber: input.sumber,
    status: input.status,
    createdAt: today,
    updatedAt: today,
    publishedAt: input.status === 'Aktif' ? today : undefined,
  };
  LISTING_LIST.unshift(listing);
  return listing;
}

// ─── MPK-008: Manajemen Listing ──────────────────────────────────────────────
// Listing Saya (halaman kelola listing milik Workspace aktif) hanya mengubah
// ETALASE listing itu sendiri — TIDAK PERNAH mengubah aset sumber (Livestock/
// Stok Pakan/Stok Obat/Layanan). Field yang boleh diubah lewat updateListing:
// harga, qtyDijual, deskripsi, media (thumbnail/gallery), lokasi (kabupaten/
// provinsi), dan status. `jenisListing`, `judul`, `sumber`, `brand`,
// `kategoriSlug` bersifat permanen setelah listing dibuat.

/** Payload untuk mengedit listing yang sudah ada — hanya field yang diizinkan (lihat catatan di atas). */
export interface UpdateListingInput {
  harga?: number;
  qtyDijual?: number;
  deskripsi?: string;
  media?: ListingMedia;
  kabupaten?: string;
  provinsi?: string;
  status?: ListingStatus;
}

/**
 * Mengedit listing yang sudah ada. Validasi Qty terhadap ketersediaan aset
 * harus sudah dilakukan pemanggil (lihat halaman Kelola Listing) sebelum
 * memanggil fungsi ini — fungsi ini sendiri tidak membaca modul asal apa pun.
 */
export function updateListing(uuid: string, patch: UpdateListingInput): ListingItem | undefined {
  const listing = LISTING_LIST.find((l) => l.uuid === uuid);
  if (!listing) return undefined;

  if (patch.harga !== undefined) listing.harga = patch.harga;
  if (patch.qtyDijual !== undefined) listing.qtyDijual = patch.qtyDijual;
  if (patch.deskripsi !== undefined) listing.deskripsi = patch.deskripsi;
  if (patch.media !== undefined) listing.media = patch.media;
  if (patch.kabupaten !== undefined) listing.kabupaten = patch.kabupaten;
  if (patch.provinsi !== undefined) listing.provinsi = patch.provinsi;
  if (patch.kabupaten !== undefined || patch.provinsi !== undefined) {
    listing.lokasi = [listing.kabupaten, listing.provinsi].filter(Boolean).join(', ');
  }
  if (patch.status !== undefined) {
    listing.status = patch.status;
    if (patch.status === 'Aktif' && !listing.publishedAt) {
      listing.publishedAt = new Date().toISOString().split('T')[0];
    }
  }
  listing.updatedAt = new Date().toISOString().split('T')[0];
  return listing;
}

/** Mengubah status listing saja — dipakai oleh aksi Ubah Status/Tutup Listing/Arsipkan Listing. */
export function updateListingStatus(uuid: string, status: ListingStatus): ListingItem | undefined {
  return updateListing(uuid, { status });
}

/**
 * Menghapus listing berstatus Draft secara permanen. Hanya diizinkan untuk
 * Draft — listing yang pernah dipublikasikan (Aktif/Ditahan/Terjual/Ditutup/
 * Diarsipkan) tidak boleh dihapus, cukup diarsipkan/ditutup, agar histori
 * listing tetap terjaga. Mengembalikan false jika listing tidak ditemukan
 * atau bukan Draft.
 */
export function deleteDraftListing(uuid: string): boolean {
  const idx = LISTING_LIST.findIndex((l) => l.uuid === uuid);
  if (idx === -1) return false;
  if (LISTING_LIST[idx].status !== 'Draft') return false;
  LISTING_LIST.splice(idx, 1);
  return true;
}

/**
 * Jumlah Dilihat — PLACEHOLDER tampilan saja (belum ada tracking analitik
 * sungguhan di codebase ini). Dihitung deterministik dari uuid listing agar
 * konsisten di setiap render, BUKAN angka acak/berubah-ubah dan BUKAN data
 * yang disimpan/dipersist.
 */
export function getPlaceholderJumlahDilihat(listing: ListingItem): number {
  let hash = 0;
  for (let i = 0; i < listing.uuid.length; i += 1) {
    hash = (hash * 31 + listing.uuid.charCodeAt(i)) >>> 0;
  }
  return (hash % 480) + 5;
}

// ─── FLOW-003M27: Stable Seed UUIDs ─────────────────────────────────────────
// Seed listing UUIDs are stable constants so that:
//  1. Detail-page deep-links to seed listings survive page reloads.
//  2. repoInsertListing can use the same id without UUID collision risk.
// New user-created listings still use generateUUID() in addListing().

export const MARKETPLACE_SEED_LISTING_UUIDS = [
  'a1b2c3d4-0001-4001-8001-000000000001', // Domba Garut Jantan
  'a1b2c3d4-0002-4001-8001-000000000002', // Kambing Boer F1
  'a1b2c3d4-0003-4001-8001-000000000003', // Rumput Gajah
  'a1b2c3d4-0004-4001-8001-000000000004', // Complete Feed Sapi
  'a1b2c3d4-0005-4001-8001-000000000005', // Ivermectin 1%
  'a1b2c3d4-0006-4001-8001-000000000006', // Jasa Transport Ternak
  'a1b2c3d4-0007-4001-8001-000000000007', // Konsultasi Dokter Hewan
  'a1b2c3d4-0008-4001-8001-000000000008', // Klinik Hewan Sejahtera
  'a1b2c3d4-0009-4001-8001-000000000009', // Kandang Panggung Bambu
  'a1b2c3d4-000a-4001-8001-00000000000a', // Bibit Rumput Odot
  'a1b2c3d4-000b-4001-8001-00000000000b', // Jasa Sewa Timbangan
] as const;

// ─── FLOW-003M27: DB hydration ───────────────────────────────────────────────
// populateListingsFromDb() replaces the in-memory LISTING_LIST with DB rows.
// Called by useMarketplace after repoGetListingsByWorkspace() succeeds.
// Guards: if rows.length === 0 → DB empty / not connected → keep seed data.

export interface MarketplaceListingDbRowForPopulate {
  id: string;
  workspace_id: string;
  kategori_slug: string;
  title: string;
  description: string | null;
  price: number;
  status: string;
  condition: string | null;
  location: string | null;
  province: string | null;
  asset_type: string | null;
  asset_ref_id: string | null;
  asset_metadata: Record<string, unknown>;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

function isMediaObj(v: unknown): v is ListingMedia {
  if (!v || typeof v !== 'object') return false;
  const m = v as Record<string, unknown>;
  return typeof m['thumbnail'] === 'string';
}

export function populateListingsFromDb(rows: MarketplaceListingDbRowForPopulate[]): void {
  if (rows.length === 0) return;

  const hydrated: ListingItem[] = rows.map((row) => {
    const meta = row.asset_metadata as Record<string, unknown>;
    const sumberId =
      typeof meta['sumberId'] === 'string'
        ? meta['sumberId']
        : (row.asset_ref_id ?? '');

    return {
      uuid: row.id,
      workspaceId: row.workspace_id,
      workspaceNama: typeof meta['workspaceNama'] === 'string' ? meta['workspaceNama'] : '',
      ownerId: typeof meta['ownerId'] === 'string' ? meta['ownerId'] : '',
      kategoriUuid: (() => {
        try { return kategoriUuidOf(row.kategori_slug as KategoriMarketplaceSlug); }
        catch { return ''; }
      })(),
      kategoriSlug: row.kategori_slug as KategoriMarketplaceSlug,
      subKategoriUuid: typeof meta['subKategoriUuid'] === 'string' ? meta['subKategoriUuid'] : undefined,
      subKategoriSlug: typeof meta['subKategoriSlug'] === 'string' ? meta['subKategoriSlug'] : undefined,
      jenisListing: typeof meta['jenisListing'] === 'string' ? meta['jenisListing'] : '',
      judul: row.title,
      slug: typeof meta['slug'] === 'string' ? meta['slug'] : slugify(row.title),
      media: isMediaObj(meta['media'])
        ? (meta['media'] as ListingMedia)
        : { thumbnail: '📦', gallery: [] },
      deskripsi: row.description ?? '',
      harga: row.price,
      satuanHarga: typeof meta['satuanHarga'] === 'string' ? meta['satuanHarga'] : 'unit',
      qtyDijual: typeof meta['qtyDijual'] === 'number' ? meta['qtyDijual'] : 1,
      kondisi: row.condition ?? undefined,
      kabupaten: typeof meta['kabupaten'] === 'string' ? meta['kabupaten'] : '',
      provinsi: row.province ?? '',
      lokasi: row.location ?? '',
      brand: typeof meta['brand'] === 'string' ? meta['brand'] : undefined,
      penjual: typeof meta['penjual'] === 'string' ? meta['penjual'] : '',
      targetTernak: isStringArray(meta['targetTernak']) ? meta['targetTernak'] : undefined,
      sumber: {
        modul: (typeof row.asset_type === 'string'
          ? row.asset_type
          : 'Lainnya') as ListingSumberModul,
        sumberId,
      },
      status: row.status as ListingStatus,
      createdAt: row.created_at.slice(0, 10),
      updatedAt: row.updated_at.slice(0, 10),
      publishedAt: row.published_at ? row.published_at.slice(0, 10) : undefined,
    };
  });

  // Replace seed data with DB-hydrated records.
  // Listings from other workspaces (in seed) are retained if they're not
  // replaced by DB rows — so the public explorer still has variety.
  // Strategy: remove any in-memory record whose id appears in DB rows, then push DB records.
  const dbIds = new Set(hydrated.map((l) => l.uuid));
  for (let i = LISTING_LIST.length - 1; i >= 0; i--) {
    if (dbIds.has(LISTING_LIST[i].uuid) || LISTING_LIST[i].workspaceId === rows[0].workspace_id) {
      LISTING_LIST.splice(i, 1);
    }
  }
  LISTING_LIST.push(...hydrated);
}

const LEGACY_SEED_WORKSPACE_IDS = new Set(['w1', 'w2', 'w3', 'w4', 'w5', 'w6']);

export function clearLegacySeedListings(): void {
  for (let i = LISTING_LIST.length - 1; i >= 0; i--) {
    if (LEGACY_SEED_WORKSPACE_IDS.has(LISTING_LIST[i].workspaceId)) {
      LISTING_LIST.splice(i, 1);
    }
  }
}

/**
 * Status tampilan efektif suatu listing. Jika aset sumbernya kehabisan stok
 * fisik (Stok Tersedia Untuk Listing turun ≤ 0 karena dipakai/dikurangi di
 * modul asal), listing TETAP ADA dengan status tersimpan tidak berubah, tapi
 * ditampilkan sebagai "Stok Habis" alih-alih statusnya sendiri. Menerima
 * `stokFisikSaatIni` dari pemanggil (dihitung live oleh
 * marketplaceAsetWorkspaceData.ts) agar file ini tidak perlu bergantung pada
 * modul-modul asal secara langsung.
 */
export function getEfektifStatusListing(
  listing: ListingItem,
  stokFisikSaatIni: number | null,
): ListingStatus | 'Stok Habis' {
  if (listing.status !== 'Aktif') return listing.status;
  if (stokFisikSaatIni === null) return listing.status; // aset tanpa konsep stok fisik (mis. jasa)
  const tersediaUntukListing = stokFisikSaatIni - getQtyListingAktif(listing.sumber.modul, listing.sumber.sumberId, listing.uuid);
  if (stokFisikSaatIni <= 0 || tersediaUntukListing < 0) return 'Stok Habis';
  return listing.status;
}
