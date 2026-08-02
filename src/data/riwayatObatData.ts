import { generateUUID } from '../utils/uuid';

// ═══════════════════════════════════════════════════════════════════════════════
// RIWAYAT OBAT — Audit Trail Pergerakan Stok Obat (SO-006)
// ═══════════════════════════════════════════════════════════════════════════════
// Setiap perubahan jumlah stok obat WAJIB menghasilkan satu RiwayatObatRecord.
// Data di sini bersifat IMMUTABLE dari UI — tidak ada create/edit/delete manual.
// Hanya fungsi transaksi (addRiwayatObat) yang boleh menambah record baru.
//
// Relasi:
//   stokObatUuid     → StokObatItem.uuid          (stokObatData.ts)
//   masterObatUuid   → ObatItem.uuid               (obatData.ts)
//   produkKomersialUuid → ObatProdukKomersial.uuid (produkKomersialObatData.ts)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Jenis Aktivitas (13 tipe) ────────────────────────────────────────────────

export const JENIS_AKTIVITAS_LIST = [
  'Stok Masuk',
  'Stok Keluar',
  'Penggunaan Pengobatan',
  'Pembelian Marketplace',
  'Transfer Masuk',
  'Transfer Keluar',
  'Penyesuaian',
  'Stock Opname',
  'Kedaluwarsa',
  'Rusak',
  'Hilang',
  'Retur',
  'Koreksi Sistem',
] as const;

export type JenisAktivitas = typeof JENIS_AKTIVITAS_LIST[number];

// ─── Konfigurasi visual per tipe aktivitas ────────────────────────────────────

export const AKTIVITAS_CONFIG: Record<JenisAktivitas, {
  icon: string; color: string; bg: string; accent: string;
  sign: '+' | '-' | '±'; label: string;
}> = {
  'Stok Masuk':             { icon: '⬆️', color: '#1b7a43', bg: '#e8f5ee', accent: '#2e7d32', sign: '+', label: 'Stok Masuk' },
  'Stok Keluar':            { icon: '⬇️', color: '#e65100', bg: '#fff3e0', accent: '#ef6c00', sign: '-', label: 'Stok Keluar' },
  'Penggunaan Pengobatan':  { icon: '💊', color: '#0277bd', bg: '#e1f5fe', accent: '#0288d1', sign: '-', label: 'Penggunaan' },
  'Pembelian Marketplace':  { icon: '🛒', color: '#00695c', bg: '#e0f2f1', accent: '#00897b', sign: '+', label: 'Marketplace' },
  'Transfer Masuk':         { icon: '📦', color: '#283593', bg: '#e8eaf6', accent: '#3949ab', sign: '+', label: 'Transfer Masuk' },
  'Transfer Keluar':        { icon: '📤', color: '#4527a0', bg: '#ede7f6', accent: '#5e35b1', sign: '-', label: 'Transfer Keluar' },
  'Penyesuaian':            { icon: '🔄', color: '#37474f', bg: '#eceff1', accent: '#546e7a', sign: '±', label: 'Penyesuaian' },
  'Stock Opname':           { icon: '📋', color: '#4e342e', bg: '#efebe9', accent: '#6d4c41', sign: '±', label: 'Stock Opname' },
  'Kedaluwarsa':            { icon: '⏰', color: '#6a1b9a', bg: '#f3e5f5', accent: '#8e24aa', sign: '-', label: 'Kedaluwarsa' },
  'Rusak':                  { icon: '⚠️', color: '#e65100', bg: '#fff8e1', accent: '#f57c00', sign: '-', label: 'Rusak' },
  'Hilang':                 { icon: '❓', color: '#c62828', bg: '#ffebee', accent: '#e53935', sign: '-', label: 'Hilang' },
  'Retur':                  { icon: '↩️', color: '#1b7a43', bg: '#e8f5ee', accent: '#2e7d32', sign: '+', label: 'Retur' },
  'Koreksi Sistem':         { icon: '🔧', color: '#37474f', bg: '#eceff1', accent: '#546e7a', sign: '±', label: 'Koreksi Sistem' },
};

// ─── Record Interface ──────────────────────────────────────────────────────────

export interface RiwayatObatRecord {
  /** UUID v4 — identitas permanen record riwayat ini. */
  uuid: string;
  /** ISO datetime — waktu transaksi terjadi. */
  timestamp: string;
  /** Relasi WAJIB ke StokObatItem.uuid. */
  stokObatUuid: string;
  /** Relasi WAJIB ke ObatItem.uuid (obatData.ts). */
  masterObatUuid: string;
  /** Relasi opsional ke ObatProdukKomersial.uuid. */
  produkKomersialUuid?: string;
  /** Nama produk (denormalized untuk tampilan cepat). */
  namaProduk: string;
  /** Brand (denormalized). */
  brand: string;
  /** Nomor batch fisik kemasan (dari label produk). */
  nomorBatch?: string;
  /** Tanggal expired batch yang bersangkutan (ISO date). */
  tanggalExpired?: string;
  /** Jumlah stok sebelum transaksi. */
  jumlahSebelum: number;
  /**
   * Jumlah perubahan:
   *   > 0 = masuk (tambah stok)
   *   < 0 = keluar (kurangi stok)
   *   = 0 = tidak ada perubahan jumlah (mis. Stock Opname konfirmasi)
   */
  jumlahPerubahan: number;
  /** Jumlah stok setelah transaksi. */
  jumlahSesudah: number;
  /** Satuan (Botol, Vial, Sachet, Strip, dst). */
  satuan: string;
  jenisAktivitas: JenisAktivitas;
  /** Alasan/keterangan singkat transaksi. */
  alasan: string;
  /** Modul asal transaksi (misal: 'Dashboard', 'Marketplace', 'Kesehatan Hewan', 'Stok Obat'). */
  modulSumber: string;
  /** UUID ternak yang terkait (opsional — untuk Penggunaan Pengobatan). */
  livestockUuid?: string;
  /** UUID transaksi terkait (opsional — untuk Marketplace, Transfer, dsb). */
  transaksiUuid?: string;
  /** Pengguna/operator yang melakukan transaksi. */
  pengguna: string;
  /** Catatan tambahan opsional. */
  catatan?: string;
}

// ─── In-memory Store ──────────────────────────────────────────────────────────

export const RIWAYAT_OBAT_RECORDS: RiwayatObatRecord[] = [

  // ── Juli 2026 ────────────────────────────────────────────────────────────────

  {
    uuid: 'rw-obat-0001-0000-0000-000000000001',
    timestamp: '2026-07-13T10:15:00.000Z',
    stokObatUuid: 'b1a10000-0000-4000-8000-000000000001',
    masterObatUuid: 'a1b2c3d4-0001-4000-8000-000000000001',
    produkKomersialUuid: '9a49fd42-e80a-4b90-90d7-5802018f8124',
    namaProduk: 'Oxytet LA Fertilife',
    brand: 'Fertilife',
    nomorBatch: 'OXY-2026-07A',
    tanggalExpired: '2027-05-10',
    jumlahSebelum: 7,
    jumlahPerubahan: 5,
    jumlahSesudah: 12,
    satuan: 'Botol',
    jenisAktivitas: 'Stok Masuk',
    alasan: 'Tambah stok rutin',
    modulSumber: 'Dashboard',
    pengguna: 'Drh. Sari',
    catatan: 'Pengadaan bulanan dari distributor Fertilife.',
  },
  {
    uuid: 'rw-obat-0002-0000-0000-000000000002',
    timestamp: '2026-07-12T08:30:00.000Z',
    stokObatUuid: 'b1a10000-0000-4000-8000-000000000003',
    masterObatUuid: 'a1b2c3d4-0014-4000-8000-000000000014',
    produkKomersialUuid: '4050f049-7f68-4921-b6df-659b9aa33e43',
    namaProduk: 'Medical B Complex',
    brand: 'Medion',
    nomorBatch: 'MBC-2026-01A',
    tanggalExpired: '2027-01-15',
    jumlahSebelum: 20,
    jumlahPerubahan: -2,
    jumlahSesudah: 18,
    satuan: 'Botol',
    jenisAktivitas: 'Penggunaan Pengobatan',
    alasan: 'Pengobatan ternak sapi betina — defisiensi vitamin B',
    modulSumber: 'Kesehatan Hewan',
    livestockUuid: 'lv-dummy-0001',
    pengguna: 'Drh. Sari',
    catatan: 'Diberikan kepada 2 ekor sapi Limosin yang menunjukkan gejala lemah dan penurunan nafsu makan.',
  },
  {
    uuid: 'rw-obat-0003-0000-0000-000000000003',
    timestamp: '2026-07-11T14:00:00.000Z',
    stokObatUuid: 'b1a10000-0000-4000-8000-000000000008',
    masterObatUuid: 'a1b2c3d4-0030-4000-8000-000000000030',
    produkKomersialUuid: '76100545-ab28-4b96-8cbd-f538137e9f7c',
    namaProduk: 'Medilyte',
    brand: 'Medion',
    nomorBatch: 'MLT-2026-04A',
    tanggalExpired: '2027-02-20',
    jumlahSebelum: 0,
    jumlahPerubahan: 20,
    jumlahSesudah: 20,
    satuan: 'Sachet',
    jenisAktivitas: 'Pembelian Marketplace',
    alasan: 'Pembelian dari TernakHub Marketplace',
    modulSumber: 'Marketplace',
    transaksiUuid: 'mkt-trx-0011-2026',
    pengguna: 'Admin',
    catatan: 'Pesanan #MKT-2026-0011 diterima dan diverifikasi kondisinya baik.',
  },
  {
    uuid: 'rw-obat-0004-0000-0000-000000000004',
    timestamp: '2026-07-10T09:00:00.000Z',
    stokObatUuid: 'b1a10000-0000-4000-8000-000000000006',
    masterObatUuid: 'a1b2c3d4-0029-4000-8000-000000000029',
    produkKomersialUuid: 'c29c081a-18ec-475a-bb3e-beb12daafe0e',
    namaProduk: 'Medical Calcium',
    brand: 'Medion',
    nomorBatch: 'MCA-2025-12A',
    tanggalExpired: '2026-07-05',
    jumlahSebelum: 15,
    jumlahPerubahan: 0,
    jumlahSesudah: 15,
    satuan: 'Botol',
    jenisAktivitas: 'Stock Opname',
    alasan: 'Opname stok bulanan — stok sesuai catatan',
    modulSumber: 'Stok Obat',
    pengguna: 'Budi',
    catatan: 'Fisik stok cocok 15 botol. Perlu perhatian: 3 botol sudah expired per 5 Juli 2026.',
  },
  {
    uuid: 'rw-obat-0005-0000-0000-000000000005',
    timestamp: '2026-07-09T07:45:00.000Z',
    stokObatUuid: 'b1a10000-0000-4000-8000-000000000006',
    masterObatUuid: 'a1b2c3d4-0029-4000-8000-000000000029',
    produkKomersialUuid: 'c29c081a-18ec-475a-bb3e-beb12daafe0e',
    namaProduk: 'Medical Calcium',
    brand: 'Medion',
    nomorBatch: 'MCA-2025-12A',
    tanggalExpired: '2026-07-05',
    jumlahSebelum: 18,
    jumlahPerubahan: -3,
    jumlahSesudah: 15,
    satuan: 'Botol',
    jenisAktivitas: 'Kedaluwarsa',
    alasan: 'Dimusnahkan — melewati tanggal expired 5 Juli 2026',
    modulSumber: 'Stok Obat',
    pengguna: 'Budi',
    catatan: '3 botol batch MCA-2025-12A dimusnahkan sesuai SOP pemusnahan obat expired.',
  },
  {
    uuid: 'rw-obat-0006-0000-0000-000000000006',
    timestamp: '2026-07-08T08:30:00.000Z',
    stokObatUuid: 'b1a10000-0000-4000-8000-000000000002',
    masterObatUuid: 'a1b2c3d4-0010-4000-8000-000000000010',
    produkKomersialUuid: 'f8d24272-2231-4a09-a525-2446ab41bed0',
    namaProduk: 'Ivermec Fertilife',
    brand: 'Fertilife',
    nomorBatch: 'IVR-2026-06A',
    tanggalExpired: '2026-08-05',
    jumlahSebelum: 5,
    jumlahPerubahan: -3,
    jumlahSesudah: 2,
    satuan: 'Botol',
    jenisAktivitas: 'Penggunaan Pengobatan',
    alasan: 'Injeksi ivermektin untuk pengendalian ektoparasit',
    modulSumber: 'Kesehatan Hewan',
    livestockUuid: 'lv-dummy-0002',
    pengguna: 'Drh. Sari',
    catatan: 'Diberikan kepada 3 ekor domba dengan infestasi tungau kulit parah.',
  },
  {
    uuid: 'rw-obat-0007-0000-0000-000000000007',
    timestamp: '2026-07-07T10:00:00.000Z',
    stokObatUuid: 'b1a10000-0000-4000-8000-000000000003',
    masterObatUuid: 'a1b2c3d4-0014-4000-8000-000000000014',
    produkKomersialUuid: '4050f049-7f68-4921-b6df-659b9aa33e43',
    namaProduk: 'Medical B Complex',
    brand: 'Medion',
    nomorBatch: 'MBC-2026-01A',
    tanggalExpired: '2027-01-15',
    jumlahSebelum: 10,
    jumlahPerubahan: 10,
    jumlahSesudah: 20,
    satuan: 'Botol',
    jenisAktivitas: 'Stok Masuk',
    alasan: 'Restock pasca pemakaian intensif',
    modulSumber: 'Dashboard',
    pengguna: 'Admin',
  },
  {
    uuid: 'rw-obat-0008-0000-0000-000000000008',
    timestamp: '2026-07-05T11:30:00.000Z',
    stokObatUuid: 'b1a10000-0000-4000-8000-000000000005',
    masterObatUuid: 'a1b2c3d4-0013-4000-8000-000000000013',
    produkKomersialUuid: 'e0dad957-bc65-48d6-b587-727bc6a302b9',
    namaProduk: 'Virbavit ADE',
    brand: 'Virbac',
    nomorBatch: 'VAD-2026-03A',
    tanggalExpired: '2027-03-01',
    jumlahSebelum: 0,
    jumlahPerubahan: 8,
    jumlahSesudah: 8,
    satuan: 'Botol',
    jenisAktivitas: 'Transfer Masuk',
    alasan: 'Transfer dari Farm Cabang Selatan',
    modulSumber: 'Transfer',
    transaksiUuid: 'trn-obat-0008-2026',
    pengguna: 'Budi',
    catatan: 'Transfer antar farm dengan dokumen serah terima TRF-2026-0008.',
  },
  {
    uuid: 'rw-obat-0009-0000-0000-000000000009',
    timestamp: '2026-07-04T09:00:00.000Z',
    stokObatUuid: 'b1a10000-0000-4000-8000-000000000004',
    masterObatUuid: 'a1b2c3d4-0014-4000-8000-000000000014',
    produkKomersialUuid: '4050f049-7f68-4921-b6df-659b9aa33e43',
    namaProduk: 'Medical B Complex',
    brand: 'Medion',
    nomorBatch: 'MBC-2026-06B',
    tanggalExpired: '2026-12-01',
    jumlahSebelum: 6,
    jumlahPerubahan: -2,
    jumlahSesudah: 4,
    satuan: 'Botol',
    jenisAktivitas: 'Rusak',
    alasan: 'Botol pecah saat pemindahan ke gudang cadangan',
    modulSumber: 'Stok Obat',
    pengguna: 'Budi',
    catatan: '2 botol pecah akibat terjatuh saat proses relokasi stok ke Gudang Cadangan.',
  },
  {
    uuid: 'rw-obat-0010-0000-0000-000000000010',
    timestamp: '2026-07-03T07:00:00.000Z',
    stokObatUuid: 'b1a10000-0000-4000-8000-000000000007',
    masterObatUuid: 'a1b2c3d4-0028-4000-8000-000000000028',
    produkKomersialUuid: 'f6512c7e-6242-4bfd-91ef-03ff484aa0bc',
    namaProduk: 'Mediprobiotic',
    brand: 'Medion',
    nomorBatch: 'MPB-2026-02A',
    tanggalExpired: '2027-02-10',
    jumlahSebelum: 5,
    jumlahPerubahan: -5,
    jumlahSesudah: 0,
    satuan: 'Sachet',
    jenisAktivitas: 'Stok Keluar',
    alasan: 'Distribusi ke kandang ternak pasca pengobatan massal',
    modulSumber: 'Stok Obat',
    pengguna: 'Budi',
  },
  {
    uuid: 'rw-obat-0011-0000-0000-000000000011',
    timestamp: '2026-07-01T13:00:00.000Z',
    stokObatUuid: 'b1a10000-0000-4000-8000-000000000005',
    masterObatUuid: 'a1b2c3d4-0013-4000-8000-000000000013',
    produkKomersialUuid: 'e0dad957-bc65-48d6-b587-727bc6a302b9',
    namaProduk: 'Virbavit ADE',
    brand: 'Virbac',
    nomorBatch: 'VAD-2026-03A',
    tanggalExpired: '2027-03-01',
    jumlahSebelum: 8,
    jumlahPerubahan: -8,
    jumlahSesudah: 0,
    satuan: 'Botol',
    jenisAktivitas: 'Hilang',
    alasan: 'Hilang — tidak ditemukan saat opname',
    modulSumber: 'Stok Obat',
    pengguna: 'Admin',
    catatan: 'Seluruh stok Virbavit ADE hilang saat opname. Dilaporkan ke manajemen. Investigasi sedang berjalan.',
  },

  // ── Juni 2026 ────────────────────────────────────────────────────────────────

  {
    uuid: 'rw-obat-0012-0000-0000-000000000012',
    timestamp: '2026-06-28T10:00:00.000Z',
    stokObatUuid: 'b1a10000-0000-4000-8000-000000000006',
    masterObatUuid: 'a1b2c3d4-0029-4000-8000-000000000029',
    produkKomersialUuid: 'c29c081a-18ec-475a-bb3e-beb12daafe0e',
    namaProduk: 'Medical Calcium',
    brand: 'Medion',
    nomorBatch: 'MCA-2025-12A',
    tanggalExpired: '2026-07-05',
    jumlahSebelum: 15,
    jumlahPerubahan: 3,
    jumlahSesudah: 18,
    satuan: 'Botol',
    jenisAktivitas: 'Retur',
    alasan: 'Retur dari kandang B — stok tidak terpakai',
    modulSumber: 'Stok Obat',
    pengguna: 'Budi',
    catatan: 'Retur 3 botol dari kandang B karena program suplementasi kalsium ditunda.',
  },
  {
    uuid: 'rw-obat-0013-0000-0000-000000000013',
    timestamp: '2026-06-25T08:00:00.000Z',
    stokObatUuid: 'b1a10000-0000-4000-8000-000000000001',
    masterObatUuid: 'a1b2c3d4-0001-4000-8000-000000000001',
    produkKomersialUuid: '9a49fd42-e80a-4b90-90d7-5802018f8124',
    namaProduk: 'Oxytet LA Fertilife',
    brand: 'Fertilife',
    nomorBatch: 'OXY-2026-05A',
    tanggalExpired: '2027-05-10',
    jumlahSebelum: 6,
    jumlahPerubahan: 1,
    jumlahSesudah: 7,
    satuan: 'Botol',
    jenisAktivitas: 'Koreksi Sistem',
    alasan: 'Koreksi entri salah pada tanggal 20 Juni 2026',
    modulSumber: 'Stok Obat',
    pengguna: 'Admin',
    catatan: 'Satu botol sebelumnya tercatat sebagai keluar karena kesalahan input. Dikoreksi setelah verifikasi fisik.',
  },
  {
    uuid: 'rw-obat-0014-0000-0000-000000000014',
    timestamp: '2026-06-22T09:30:00.000Z',
    stokObatUuid: 'b1a10000-0000-4000-8000-000000000002',
    masterObatUuid: 'a1b2c3d4-0010-4000-8000-000000000010',
    produkKomersialUuid: 'f8d24272-2231-4a09-a525-2446ab41bed0',
    namaProduk: 'Ivermec Fertilife',
    brand: 'Fertilife',
    nomorBatch: 'IVR-2026-06A',
    tanggalExpired: '2026-08-05',
    jumlahSebelum: 7,
    jumlahPerubahan: -2,
    jumlahSesudah: 5,
    satuan: 'Botol',
    jenisAktivitas: 'Transfer Keluar',
    alasan: 'Transfer ke Farm Cabang Timur sesuai permintaan',
    modulSumber: 'Transfer',
    transaksiUuid: 'trn-obat-0014-2026',
    pengguna: 'Budi',
    catatan: 'Transfer dengan dokumen TRF-2026-0014. Penerima: Farm Cabang Timur.',
  },
  {
    uuid: 'rw-obat-0015-0000-0000-000000000015',
    timestamp: '2026-06-20T11:00:00.000Z',
    stokObatUuid: 'b1a10000-0000-4000-8000-000000000002',
    masterObatUuid: 'a1b2c3d4-0010-4000-8000-000000000010',
    produkKomersialUuid: 'f8d24272-2231-4a09-a525-2446ab41bed0',
    namaProduk: 'Ivermec Fertilife',
    brand: 'Fertilife',
    nomorBatch: 'IVR-2026-06A',
    tanggalExpired: '2026-08-05',
    jumlahSebelum: 0,
    jumlahPerubahan: 7,
    jumlahSesudah: 7,
    satuan: 'Botol',
    jenisAktivitas: 'Stok Masuk',
    alasan: 'Pengadaan awal stok ivermektin musim kemarau',
    modulSumber: 'Dashboard',
    pengguna: 'Drh. Sari',
    catatan: 'Stok pertama Ivermec Fertilife. Disimpan di Lemari Obat A.',
  },
  {
    uuid: 'rw-obat-0016-0000-0000-000000000016',
    timestamp: '2026-06-15T10:00:00.000Z',
    stokObatUuid: 'b1a10000-0000-4000-8000-000000000007',
    masterObatUuid: 'a1b2c3d4-0028-4000-8000-000000000028',
    produkKomersialUuid: 'f6512c7e-6242-4bfd-91ef-03ff484aa0bc',
    namaProduk: 'Mediprobiotic',
    brand: 'Medion',
    nomorBatch: 'MPB-2026-02A',
    tanggalExpired: '2027-02-10',
    jumlahSebelum: 10,
    jumlahPerubahan: -5,
    jumlahSesudah: 5,
    satuan: 'Sachet',
    jenisAktivitas: 'Rusak',
    alasan: 'Sachet rusak terkena air — tidak layak pakai',
    modulSumber: 'Stok Obat',
    pengguna: 'Budi',
    catatan: '5 sachet terkena rembesan air dari atap gudang saat hujan lebat. Dimusnahkan.',
  },
  {
    uuid: 'rw-obat-0017-0000-0000-000000000017',
    timestamp: '2026-06-01T08:00:00.000Z',
    stokObatUuid: 'b1a10000-0000-4000-8000-000000000004',
    masterObatUuid: 'a1b2c3d4-0014-4000-8000-000000000014',
    produkKomersialUuid: '4050f049-7f68-4921-b6df-659b9aa33e43',
    namaProduk: 'Medical B Complex',
    brand: 'Medion',
    nomorBatch: 'MBC-2026-06B',
    tanggalExpired: '2026-12-01',
    jumlahSebelum: 0,
    jumlahPerubahan: 6,
    jumlahSesudah: 6,
    satuan: 'Botol',
    jenisAktivitas: 'Stok Masuk',
    alasan: 'Pengadaan stok cadangan batch baru',
    modulSumber: 'Dashboard',
    pengguna: 'Admin',
    catatan: 'Batch B Medical B Complex disimpan di Gudang Cadangan.',
  },

  // ── Mei 2026 ─────────────────────────────────────────────────────────────────

  {
    uuid: 'rw-obat-0018-0000-0000-000000000018',
    timestamp: '2026-05-10T09:00:00.000Z',
    stokObatUuid: 'b1a10000-0000-4000-8000-000000000001',
    masterObatUuid: 'a1b2c3d4-0001-4000-8000-000000000001',
    produkKomersialUuid: '9a49fd42-e80a-4b90-90d7-5802018f8124',
    namaProduk: 'Oxytet LA Fertilife',
    brand: 'Fertilife',
    nomorBatch: 'OXY-2026-05A',
    tanggalExpired: '2027-05-10',
    jumlahSebelum: 0,
    jumlahPerubahan: 6,
    jumlahSesudah: 6,
    satuan: 'Botol',
    jenisAktivitas: 'Stok Masuk',
    alasan: 'Pengadaan awal antibiotik oxytetracycline',
    modulSumber: 'Dashboard',
    pengguna: 'Drh. Sari',
    catatan: 'Stok pertama Oxytet LA Fertilife. Disimpan di Lemari Obat A.',
  },

  // ── Maret–April 2026 ─────────────────────────────────────────────────────────

  {
    uuid: 'rw-obat-0019-0000-0000-000000000019',
    timestamp: '2026-04-18T10:00:00.000Z',
    stokObatUuid: 'b1a10000-0000-4000-8000-000000000008',
    masterObatUuid: 'a1b2c3d4-0030-4000-8000-000000000030',
    produkKomersialUuid: '76100545-ab28-4b96-8cbd-f538137e9f7c',
    namaProduk: 'Medilyte',
    brand: 'Medion',
    nomorBatch: 'MLT-2026-04A',
    tanggalExpired: '2027-02-20',
    jumlahSebelum: 0,
    jumlahPerubahan: 20,
    jumlahSesudah: 20,
    satuan: 'Sachet',
    jenisAktivitas: 'Stok Masuk',
    alasan: 'Pengadaan pertama — persiapan musim kering',
    modulSumber: 'Dashboard',
    pengguna: 'Admin',
  },
  {
    uuid: 'rw-obat-0020-0000-0000-000000000020',
    timestamp: '2026-03-01T09:00:00.000Z',
    stokObatUuid: 'b1a10000-0000-4000-8000-000000000005',
    masterObatUuid: 'a1b2c3d4-0013-4000-8000-000000000013',
    produkKomersialUuid: 'e0dad957-bc65-48d6-b587-727bc6a302b9',
    namaProduk: 'Virbavit ADE',
    brand: 'Virbac',
    nomorBatch: 'VAD-2026-03A',
    tanggalExpired: '2027-03-01',
    jumlahSebelum: 0,
    jumlahPerubahan: 8,
    jumlahSesudah: 8,
    satuan: 'Botol',
    jenisAktivitas: 'Stok Masuk',
    alasan: 'Pengadaan pertama vitamin ADE untuk program suplementasi',
    modulSumber: 'Dashboard',
    pengguna: 'Drh. Sari',
  },
  {
    uuid: 'rw-obat-0021-0000-0000-000000000021',
    timestamp: '2026-02-10T10:00:00.000Z',
    stokObatUuid: 'b1a10000-0000-4000-8000-000000000007',
    masterObatUuid: 'a1b2c3d4-0028-4000-8000-000000000028',
    produkKomersialUuid: 'f6512c7e-6242-4bfd-91ef-03ff484aa0bc',
    namaProduk: 'Mediprobiotic',
    brand: 'Medion',
    nomorBatch: 'MPB-2026-02A',
    tanggalExpired: '2027-02-10',
    jumlahSebelum: 0,
    jumlahPerubahan: 10,
    jumlahSesudah: 10,
    satuan: 'Sachet',
    jenisAktivitas: 'Stok Masuk',
    alasan: 'Pengadaan pertama probiotik ternak',
    modulSumber: 'Dashboard',
    pengguna: 'Admin',
  },
  {
    uuid: 'rw-obat-0022-0000-0000-000000000022',
    timestamp: '2026-01-15T09:00:00.000Z',
    stokObatUuid: 'b1a10000-0000-4000-8000-000000000003',
    masterObatUuid: 'a1b2c3d4-0014-4000-8000-000000000014',
    produkKomersialUuid: '4050f049-7f68-4921-b6df-659b9aa33e43',
    namaProduk: 'Medical B Complex',
    brand: 'Medion',
    nomorBatch: 'MBC-2026-01A',
    tanggalExpired: '2027-01-15',
    jumlahSebelum: 0,
    jumlahPerubahan: 10,
    jumlahSesudah: 10,
    satuan: 'Botol',
    jenisAktivitas: 'Stok Masuk',
    alasan: 'Pengadaan awal vitamin B kompleks injeksi',
    modulSumber: 'Dashboard',
    pengguna: 'Drh. Sari',
  },

  // ── Desember 2025 ────────────────────────────────────────────────────────────

  {
    uuid: 'rw-obat-0023-0000-0000-000000000023',
    timestamp: '2025-12-01T10:00:00.000Z',
    stokObatUuid: 'b1a10000-0000-4000-8000-000000000006',
    masterObatUuid: 'a1b2c3d4-0029-4000-8000-000000000029',
    produkKomersialUuid: 'c29c081a-18ec-475a-bb3e-beb12daafe0e',
    namaProduk: 'Medical Calcium',
    brand: 'Medion',
    nomorBatch: 'MCA-2025-12A',
    tanggalExpired: '2026-07-05',
    jumlahSebelum: 0,
    jumlahPerubahan: 15,
    jumlahSesudah: 15,
    satuan: 'Botol',
    jenisAktivitas: 'Stok Masuk',
    alasan: 'Pengadaan kalsium untuk program reproduksi sapi',
    modulSumber: 'Dashboard',
    pengguna: 'Admin',
    catatan: 'Stok pertama Medical Calcium. Disimpan di Lemari Obat A. Perhatikan exp: Juli 2026.',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Seluruh riwayat, urut terbaru dulu. */
export function getRiwayatObatList(): RiwayatObatRecord[] {
  return [...RIWAYAT_OBAT_RECORDS].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/** Cari satu record berdasarkan uuid. */
export function getRiwayatObatById(uuid: string): RiwayatObatRecord | undefined {
  return RIWAYAT_OBAT_RECORDS.find((r) => r.uuid === uuid);
}

/**
 * Tambah record riwayat baru (SO-006).
 * Dipanggil oleh setiap fungsi mutasi stok — tidak pernah dipanggil langsung dari UI.
 */
export function addRiwayatObat(input: Omit<RiwayatObatRecord, 'uuid'>): RiwayatObatRecord {
  const record: RiwayatObatRecord = { uuid: generateUUID(), ...input };
  RIWAYAT_OBAT_RECORDS.push(record);
  return record;
}

/** Validasi: setiap record referensi ke stokObatUuid yang terdaftar.
 *  Mengembalikan record yang referensinya tidak valid (orphan). */
export function getOrphanRiwayat(validStokUuids: string[]): RiwayatObatRecord[] {
  const uuidSet = new Set(validStokUuids);
  return RIWAYAT_OBAT_RECORDS.filter((r) => !uuidSet.has(r.stokObatUuid));
}
