import { generateUUID } from '../utils/uuid';
import { addRiwayatObat, type JenisAktivitas } from './riwayatObatData';

// ═══════════════════════════════════════════════════════════════════════════════
// STOK OBAT — Struktur Data & Manajemen Stok (SO-005 → SO-005.3)
// ═══════════════════════════════════════════════════════════════════════════════
// Tabel "Stok Obat" hanya menampilkan obat yang benar-benar dimiliki oleh
// Workspace/Farm saat ini (fisik ada, tercatat, siap dipakai).
//
// Ini BUKAN:
//   - Katalog obat (itu peran Master Obat — lihat src/data/obatData.ts)
//   - Daftar Produk Komersial yang tersedia di pasaran
//     (lihat src/data/produkKomersialObatData.ts)
//
// Master Obat & Produk Komersial adalah REFERENSI (apa yang BISA dimiliki).
// Stok Obat adalah KEPEMILIKAN AKTUAL (apa yang SEDANG dimiliki, berapa jumlahnya).
// Halaman Stok Obat (src/pages/StokObat.tsx, mode 'stok') hanya MEMBACA data ini —
// tidak ada tambah/ubah/hapus langsung dari halaman tersebut.
//
// ─────────────────────────────────────────────────────────────────────────────
// SUMBER DATA MASUK (menambah stok) — belum diimplementasikan pada tahap ini:
//   1. Quick Action Dashboard → "Tambah Stok Obat" (lihat src/pages/TambahStokObat.tsx)
//   2. Marketplace → "Barang diterima" (penerimaan pesanan dari Marketplace)
//
// SUMBER DATA KELUAR (mengurangi stok) — belum diimplementasikan pada tahap ini:
//   1. Kesehatan Hewan pada halaman Livestock (pemakaian obat untuk pengobatan ternak)
//   2. Penyesuaian Stok (lihat ALASAN_PENYESUAIAN_STOK di bawah)
//
// SO-005.3: `jumlah` TIDAK BOLEH diedit langsung dari UI mana pun. Field ini
// hanya boleh berubah lewat fungsi transaksi IN/OUT yang akan dibangun pada
// roadmap berikutnya (Riwayat, Batch Management UI, Penyesuaian Stok UI, dsb —
// semuanya di luar cakupan tahap ini). Struktur data di file ini disiapkan agar
// SIAP menerima transaksi tersebut tanpa perlu migrasi ulang skema.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Workspace (dev-seed only) ──────────────────────────────────────────────────
// Placeholder UUID used ONLY in the seed records below to stamp initial demo
// data. It must NOT be imported or used as a live workspace ID elsewhere —
// runtime workspace filtering must come from WorkspaceContext.activeWorkspace.
//
// C-002 fix (FLOW-003M5): removed `export` — callers must use useWorkspace().
const CURRENT_WORKSPACE_UUID = '00000000-0000-4000-8000-000000000001';

// ─── Alasan Penyesuaian Stok (fondasi — UI belum dibangun) ─────────────────────
// Digunakan saat stok obat perlu dikoreksi/dikurangi tanpa melalui pemakaian
// pada Kesehatan Hewan (contoh: kedaluwarsa, rusak, hilang, opname, dsb).
export const ALASAN_PENYESUAIAN_STOK = [
  'Expired',
  'Rusak',
  'Hilang',
  'Tumpah/Jatuh',
  'Diberikan ke Orang Lain',
  'Dipindahkan ke Farm Lain',
  'Dipindahkan ke Kandang Lain',
  'Koreksi Stok Opname',
  'Lainnya',
] as const;

export type AlasanPenyesuaianStok = typeof ALASAN_PENYESUAIAN_STOK[number];

// ─── Status Stok ────────────────────────────────────────────────────────────────
// SO-005.3: empat status, SELALU dihitung otomatis dari `jumlah` dan
// `tanggalExpired` — tidak pernah disimpan/diisi manual pada record.
export type StatusStok = 'Tersedia' | 'Hampir Habis' | 'Habis' | 'Expired';

// Ambang batas "Hampir Habis". Belum ada field minimum stok per-produk pada
// struktur ini (di luar cakupan SO-005.3) — placeholder ambang tunggal ini
// akan digantikan oleh aturan per-produk saat modul Batch Management dibangun.
const STOK_HAMPIR_HABIS_THRESHOLD = 5;

export function computeStatusStok(jumlah: number, tanggalExpired?: string | null): StatusStok {
  if (jumlah <= 0) return 'Habis';
  if (tanggalExpired && new Date(tanggalExpired).getTime() < Date.now()) return 'Expired';
  if (jumlah <= STOK_HAMPIR_HABIS_THRESHOLD) return 'Hampir Habis';
  return 'Tersedia';
}

// ─── Stok Obat Item (satu batch fisik) ──────────────────────────────────────────
// Satu Produk Komersial (produkKomersialUuid) dapat memiliki lebih dari satu
// StokObatItem — setiap item merepresentasikan satu BATCH stok yang masuk pada
// waktu berbeda (Batch A, Batch B, Batch C, dst). Belum ada halaman Batch
// Management; struktur ini hanya menyiapkan datanya (SO-005.3).
export interface StokObatItem {
  /** UUID v4 — identitas permanen batch stok ini. */
  uuid: string;
  /** Relasi ke workspace/farm pemilik stok (lihat CURRENT_WORKSPACE_UUID). */
  workspaceUuid: string;
  /** Relasi WAJIB ke ObatProdukKomersial.uuid (produkKomersialObatData.ts). */
  produkKomersialUuid: string;
  /** Relasi WAJIB ke ObatItem.uuid (obatData.ts) — obat generik referensi. */
  masterObatUuid: string;
  brand: string;
  namaProduk: string;
  bentukSediaan: string;      // Cair, Padat, Serbuk, Tablet, Kapsul, Salep, Injeksi, dst
  kemasan: string;             // deskripsi kemasan, misal "Botol 100 mL"
  lokasiPenyimpanan?: string;  // opsional
  jumlah: number;
  satuan: string;              // Botol, Vial, Strip, dst
  tanggalMasuk: string;        // ISO date — kapan batch ini masuk stok
  tanggalExpired?: string | null; // ISO date, opsional
  /** Nomor batch produksi/pengiriman (MPK-023). Opsional. */
  nomorBatch?: string;
  /** Status aktif — default 'Aktif'. Dipakai Marketplace untuk kelayakan listing (MPK-023). */
  statusAktif?: 'Aktif' | 'Nonaktif';
  /** true bila item sudah diarsipkan (MPK-023). */
  diarsipkan?: boolean;
}

/** Status stok saat ini untuk sebuah item — selalu dihitung, tidak disimpan. */
export function getStatusStok(item: StokObatItem): StatusStok {
  return computeStatusStok(item.jumlah, item.tanggalExpired);
}

/** Cari satu StokObatItem berdasarkan uuid-nya. */
export function getStokObatById(uuid: string): StokObatItem | undefined {
  return STOK_OBAT_ITEMS.find((item) => item.uuid === uuid);
}

/**
 * Semua item stok yang AKTIF (tidak diarsipkan).
 * Gunakan ini untuk menampilkan daftar stok di UI — jangan baca STOK_OBAT_ITEMS langsung.
 */
export function getActiveStokObatList(): StokObatItem[] {
  return STOK_OBAT_ITEMS.filter((item) => !item.diarsipkan);
}

/**
 * Arsipkan satu StokObatItem — item tersembunyi dari daftar stok aktif.
 * Melempar Error jika item tidak ditemukan.
 */
export function archiveStokObat(uuid: string): StokObatItem {
  const item = getStokObatById(uuid);
  if (!item) throw new Error('Item stok tidak ditemukan.');
  item.diarsipkan  = true;
  item.statusAktif = 'Nonaktif';
  return item;
}

/**
 * Pulihkan item stok yang diarsipkan — item kembali aktif di daftar.
 * Melempar Error jika item tidak ditemukan.
 */
export function unarchiveStokObat(uuid: string): StokObatItem {
  const item = getStokObatById(uuid);
  if (!item) throw new Error('Item stok tidak ditemukan.');
  item.diarsipkan  = false;
  item.statusAktif = 'Aktif';
  return item;
}

// ─── Dummy Stok Obat Data ───────────────────────────────────────────────────────
// Data di bawah ini merepresentasikan stok obat yang SUDAH dimiliki Farm
// (bukan katalog) — setiap produkKomersialUuid/masterObatUuid di bawah merujuk
// ke entri nyata pada produkKomersialObatData.ts / obatData.ts, bukan nilai
// buatan. "Medical B Complex" sengaja memiliki dua batch (Batch A & Batch B)
// untuk mendemonstrasikan aturan satu-produk-banyak-batch.
export const STOK_OBAT_ITEMS: StokObatItem[] = [
  {
    uuid: 'b1a10000-0000-4000-8000-000000000001',
    workspaceUuid: CURRENT_WORKSPACE_UUID,
    produkKomersialUuid: '9a49fd42-e80a-4b90-90d7-5802018f8124', // Oxytet LA Fertilife
    masterObatUuid: 'a1b2c3d4-0001-4000-8000-000000000001', // Oxytetracycline
    brand: 'Fertilife',
    namaProduk: 'Oxytet LA Fertilife',
    bentukSediaan: 'Injeksi',
    kemasan: 'Botol 250 mL',
    lokasiPenyimpanan: 'Lemari Obat A',
    jumlah: 12,
    satuan: 'Botol',
    tanggalMasuk: '2026-05-10',
    tanggalExpired: '2027-05-10',
  },
  {
    uuid: 'b1a10000-0000-4000-8000-000000000002',
    workspaceUuid: CURRENT_WORKSPACE_UUID,
    produkKomersialUuid: 'f8d24272-2231-4a09-a525-2446ab41bed0', // Ivermec Fertilife
    masterObatUuid: 'a1b2c3d4-0010-4000-8000-000000000010', // Ivermectin
    brand: 'Fertilife',
    namaProduk: 'Ivermec Fertilife',
    bentukSediaan: 'Injeksi',
    kemasan: 'Botol 50 mL',
    lokasiPenyimpanan: 'Lemari Obat A',
    jumlah: 2,
    satuan: 'Botol',
    tanggalMasuk: '2026-06-20',
    tanggalExpired: '2026-08-05',
  },
  {
    uuid: 'b1a10000-0000-4000-8000-000000000003',
    workspaceUuid: CURRENT_WORKSPACE_UUID,
    produkKomersialUuid: '4050f049-7f68-4921-b6df-659b9aa33e43', // Medical B Complex — Batch A
    masterObatUuid: 'a1b2c3d4-0014-4000-8000-000000000014', // Vitamin B Kompleks
    brand: 'Medion',
    namaProduk: 'Medical B Complex',
    bentukSediaan: 'Injeksi',
    kemasan: 'Botol 100 mL',
    lokasiPenyimpanan: 'Lemari Obat B',
    jumlah: 18,
    satuan: 'Botol',
    tanggalMasuk: '2026-01-15',
    tanggalExpired: '2027-01-15',
  },
  {
    uuid: 'b1a10000-0000-4000-8000-000000000004',
    workspaceUuid: CURRENT_WORKSPACE_UUID,
    produkKomersialUuid: '4050f049-7f68-4921-b6df-659b9aa33e43', // Medical B Complex — Batch B (produk sama, batch berbeda)
    masterObatUuid: 'a1b2c3d4-0014-4000-8000-000000000014', // Vitamin B Kompleks
    brand: 'Medion',
    namaProduk: 'Medical B Complex',
    bentukSediaan: 'Injeksi',
    kemasan: 'Botol 100 mL',
    lokasiPenyimpanan: 'Gudang Cadangan',
    jumlah: 4,
    satuan: 'Botol',
    tanggalMasuk: '2026-06-01',
    tanggalExpired: '2026-12-01',
  },
  {
    uuid: 'b1a10000-0000-4000-8000-000000000005',
    workspaceUuid: CURRENT_WORKSPACE_UUID,
    produkKomersialUuid: 'e0dad957-bc65-48d6-b587-727bc6a302b9', // Virbavit ADE
    masterObatUuid: 'a1b2c3d4-0013-4000-8000-000000000013', // Vitamin AD3E
    brand: 'Virbac',
    namaProduk: 'Virbavit ADE',
    bentukSediaan: 'Injeksi',
    kemasan: 'Botol 100 mL',
    lokasiPenyimpanan: 'Lemari Obat B',
    jumlah: 0,
    satuan: 'Botol',
    tanggalMasuk: '2026-03-01',
    tanggalExpired: null,
  },
  {
    uuid: 'b1a10000-0000-4000-8000-000000000006',
    workspaceUuid: CURRENT_WORKSPACE_UUID,
    produkKomersialUuid: 'c29c081a-18ec-475a-bb3e-beb12daafe0e', // Medical Calcium
    masterObatUuid: 'a1b2c3d4-0029-4000-8000-000000000029', // Mineral Mix Ternak
    brand: 'Medion',
    namaProduk: 'Medical Calcium',
    bentukSediaan: 'Cair',
    kemasan: 'Botol 500 mL',
    lokasiPenyimpanan: 'Lemari Obat A',
    jumlah: 15,
    satuan: 'Botol',
    tanggalMasuk: '2025-12-01',
    tanggalExpired: '2026-07-05',
  },
  {
    uuid: 'b1a10000-0000-4000-8000-000000000007',
    workspaceUuid: CURRENT_WORKSPACE_UUID,
    produkKomersialUuid: 'f6512c7e-6242-4bfd-91ef-03ff484aa0bc', // Mediprobiotic
    masterObatUuid: 'a1b2c3d4-0028-4000-8000-000000000028', // Probiotik Ternak
    brand: 'Medion',
    namaProduk: 'Mediprobiotic',
    bentukSediaan: 'Serbuk',
    kemasan: 'Sachet 500 gram',
    lokasiPenyimpanan: 'Lemari Obat B',
    jumlah: 0,
    satuan: 'Sachet',
    tanggalMasuk: '2026-02-10',
    tanggalExpired: null,
  },
  {
    uuid: 'b1a10000-0000-4000-8000-000000000008',
    workspaceUuid: CURRENT_WORKSPACE_UUID,
    produkKomersialUuid: '76100545-ab28-4b96-8cbd-f538137e9f7c', // Medilyte
    masterObatUuid: 'a1b2c3d4-0030-4000-8000-000000000030', // Larutan Ringer Laktat
    brand: 'Medion',
    namaProduk: 'Medilyte',
    bentukSediaan: 'Serbuk',
    kemasan: 'Sachet 100 gram',
    jumlah: 20,
    satuan: 'Sachet',
    tanggalMasuk: '2026-04-18',
    tanggalExpired: '2027-02-20',
  },
];

// ─── Penyesuaian Stok (SO-005.4) ─────────────────────────────────────────────
// Satu-satunya transaksi yang boleh dilakukan langsung dari halaman Stok Obat:
// mengoreksi jumlah stok fisik (expired, rusak, hilang, opname, dsb) TANPA
// mengubah alur stok masuk (Dashboard/Marketplace) dan TANPA membuat modul
// Riwayat penuh (itu cakupan SO-006). Struktur record di bawah ini hanya
// menyiapkan data agar SO-006 dapat menampilkannya nanti — belum ada UI Riwayat
// yang membaca PENYESUAIAN_STOK_RECORDS pada tahap ini.
export interface PenyesuaianStokRecord {
  /** UUID v4 — identitas permanen record penyesuaian ini. */
  id: string;
  /** Relasi ke StokObatItem.uuid yang disesuaikan. */
  stokObatUuid: string;
  jenisPenyesuaian: AlasanPenyesuaianStok;
  /** Jumlah yang dikurangi dari stok (selalu positif). */
  jumlah: number;
  /** Tanggal kejadian penyesuaian (diisi pengguna), ISO date. */
  tanggal: string;
  catatan?: string;
  /** Jumlah stok sebelum & sesudah penyesuaian — untuk audit/Riwayat (SO-006). */
  jumlahSebelum: number;
  jumlahSesudah: number;
  /** Kapan record ini dibuat di sistem, ISO datetime. */
  createdAt: string;
}

/** Log in-memory seluruh Penyesuaian Stok — fondasi untuk SO-006 (Riwayat). */
export const PENYESUAIAN_STOK_RECORDS: PenyesuaianStokRecord[] = [];

// ─── Input untuk Tambah Stok Obat ─────────────────────────────────────────────
export interface TambahStokObatInput {
  /** UUID workspace aktif — wajib diisi dari useWorkspace().activeWorkspace.workspace_uuid */
  workspaceUuid: string;
  produkKomersialUuid: string;
  masterObatUuid: string;
  brand: string;
  namaProduk: string;
  bentukSediaan: string;
  kemasan: string;
  jumlah: number;
  satuan: string;
  tanggalMasuk: string;
  tanggalExpired?: string | null;
  lokasiPenyimpanan?: string;
  nomorBatch?: string;
}

/**
 * Tambah StokObatItem baru (A-001 recovery).
 * Dipanggil dari TambahStokObat.tsx setelah pengguna memilih referensi dari
 * katalog Produk Komersial Obat dan mengisi detail stok.
 * Setelah item ditambahkan, langsung menulis satu RiwayatObatRecord
 * (jenisAktivitas: 'Stok Masuk') agar pergerakan stok tercatat di Riwayat.
 */
export function addStokObatItem(input: TambahStokObatInput): StokObatItem {
  if (!input.produkKomersialUuid) throw new Error('Referensi Produk Komersial wajib diisi.');
  if (!input.masterObatUuid) throw new Error('Referensi Master Obat wajib diisi.');
  if (!Number.isFinite(input.jumlah) || input.jumlah <= 0) throw new Error('Jumlah harus lebih dari 0.');
  if (!input.tanggalMasuk) throw new Error('Tanggal Masuk wajib diisi.');
  if (!input.satuan) throw new Error('Satuan wajib diisi.');

  const item: StokObatItem = {
    uuid: generateUUID(),
    workspaceUuid: input.workspaceUuid,
    produkKomersialUuid: input.produkKomersialUuid,
    masterObatUuid: input.masterObatUuid,
    brand: input.brand,
    namaProduk: input.namaProduk,
    bentukSediaan: input.bentukSediaan,
    kemasan: input.kemasan,
    lokasiPenyimpanan: input.lokasiPenyimpanan?.trim() || undefined,
    jumlah: input.jumlah,
    satuan: input.satuan,
    tanggalMasuk: input.tanggalMasuk,
    tanggalExpired: input.tanggalExpired || null,
    nomorBatch: input.nomorBatch?.trim() || undefined,
    statusAktif: 'Aktif',
  };

  STOK_OBAT_ITEMS.push(item);

  // Tulis audit trail — setiap stok masuk WAJIB tercatat di Riwayat.
  addRiwayatObat({
    timestamp: new Date().toISOString(),
    stokObatUuid: item.uuid,
    masterObatUuid: item.masterObatUuid,
    produkKomersialUuid: item.produkKomersialUuid,
    namaProduk: item.namaProduk,
    brand: item.brand,
    nomorBatch: item.nomorBatch,
    tanggalExpired: item.tanggalExpired ?? undefined,
    jumlahSebelum: 0,
    jumlahPerubahan: item.jumlah,
    jumlahSesudah: item.jumlah,
    satuan: item.satuan,
    jenisAktivitas: 'Stok Masuk',
    alasan: 'Tambah stok baru',
    modulSumber: 'Dashboard',
    pengguna: 'Pengguna',
  });

  return item;
}

/**
 * Terapkan Penyesuaian Stok pada satu StokObatItem (SO-005.4).
 * Ini adalah SATU-SATUNYA cara `jumlah` boleh berkurang lewat halaman Stok Obat.
 * Tidak pernah menambah stok, tidak pernah mengubah Master Obat/Produk Komersial,
 * tidak pernah menghapus data stok — hanya mengurangi/mengoreksi jumlah item yang sudah ada.
 * Melempar Error jika validasi gagal; pemanggil bertanggung jawab menampilkannya ke pengguna.
 */
/**
 * Maps an AlasanPenyesuaianStok value to the closest JenisAktivitas for
 * the Riwayat Obat audit trail.
 */
function alasanToJenisAktivitas(alasan: AlasanPenyesuaianStok): JenisAktivitas {
  switch (alasan) {
    case 'Expired':                     return 'Kedaluwarsa';
    case 'Rusak':                       return 'Rusak';
    case 'Hilang':                      return 'Hilang';
    case 'Tumpah/Jatuh':               return 'Hilang';
    case 'Koreksi Stok Opname':         return 'Stock Opname';
    case 'Dipindahkan ke Farm Lain':    return 'Transfer Keluar';
    case 'Dipindahkan ke Kandang Lain': return 'Transfer Keluar';
    case 'Diberikan ke Orang Lain':     return 'Stok Keluar';
    default:                            return 'Penyesuaian';
  }
}

export function applyPenyesuaianStok(input: {
  stokObatUuid: string;
  jenisPenyesuaian: AlasanPenyesuaianStok | '';
  jumlah: number;
  tanggal: string;
  catatan?: string;
}): PenyesuaianStokRecord {
  const item = getStokObatById(input.stokObatUuid);
  if (!item) {
    throw new Error('Item stok tidak ditemukan.');
  }
  if (!input.jenisPenyesuaian) {
    throw new Error('Jenis Penyesuaian wajib dipilih.');
  }
  if (!input.tanggal) {
    throw new Error('Tanggal wajib diisi.');
  }
  if (!Number.isFinite(input.jumlah) || input.jumlah <= 0) {
    throw new Error('Jumlah harus lebih besar dari 0.');
  }
  if (input.jumlah > item.jumlah) {
    throw new Error('Jumlah tidak boleh melebihi stok tersedia.');
  }

  const jumlahSebelum = item.jumlah;
  // Satu-satunya mutasi yang diizinkan: mengurangi jumlah. Status stok
  // (getStatusStok) selalu dihitung ulang otomatis dari nilai baru ini.
  item.jumlah = item.jumlah - input.jumlah;

  const record: PenyesuaianStokRecord = {
    id: generateUUID(),
    stokObatUuid: item.uuid,
    jenisPenyesuaian: input.jenisPenyesuaian,
    jumlah: input.jumlah,
    tanggal: input.tanggal,
    catatan: input.catatan?.trim() ? input.catatan.trim() : undefined,
    jumlahSebelum,
    jumlahSesudah: item.jumlah,
    createdAt: new Date().toISOString(),
  };
  PENYESUAIAN_STOK_RECORDS.push(record);

  // Tulis audit trail ke Riwayat Obat — setiap penurunan stok WAJIB tercatat.
  // Tanpa ini, Penyesuaian tidak akan muncul di tab Riwayat sama sekali.
  addRiwayatObat({
    timestamp:           record.createdAt,
    stokObatUuid:        item.uuid,
    masterObatUuid:      item.masterObatUuid,
    produkKomersialUuid: item.produkKomersialUuid,
    namaProduk:          item.namaProduk,
    brand:               item.brand,
    nomorBatch:          item.nomorBatch,
    tanggalExpired:      item.tanggalExpired ?? undefined,
    jumlahSebelum,
    jumlahPerubahan:     -input.jumlah,
    jumlahSesudah:       item.jumlah,
    satuan:              item.satuan,
    jenisAktivitas:      alasanToJenisAktivitas(input.jenisPenyesuaian),
    alasan:              input.jenisPenyesuaian,
    modulSumber:         'Stok Obat',
    pengguna:            'Pengguna',
    catatan:             input.catatan?.trim() || undefined,
  });

  return record;
}
