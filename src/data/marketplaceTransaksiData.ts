// ─── MPK-009 — Transaksi Marketplace ─────────────────────────────────────────
// Modul transaksi Marketplace: mengelola siklus hidup transaksi antara Pembeli
// dan Penjual. Data aset (Livestock/Stok Pakan/Stok Obat) tetap pada modul
// asal; transaksi hanya menyimpan REFERENSI dan menyinkronkan aset HANYA saat
// status transaksi mencapai 'Selesai'.
//
// Aturan utama:
//  - Stok fisik / aset TIDAK berubah saat Listing dibuat.
//  - Stok fisik / aset TIDAK berubah saat Transaksi dibuat.
//  - Stok fisik / aset BARU berubah saat status Transaksi → 'Selesai'.
//  - Setiap perubahan status wajib masuk ke riwayatStatus.
//  - Qty transaksi tidak boleh melebihi qty listing yang tersedia.

import { generateUUID } from '../utils/uuid';
import {
  getListingByUuid,
  updateListingStatus,
  getAllListing,
  type ListingSumber,
  type ListingSumberModul,
} from './marketplaceListingData';
import { addPerubahanStok } from './stokInventarisData';
import { applyPenyesuaianStok } from './stokObatData';
import { performPermanentTransfer } from './transferData';
import { archiveLivestock as archiveLivestockService } from '../services/livestockService';
import { getTodayISO as todayIso } from '../utils/dateUtils';

const _MKP_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Tipe Status ─────────────────────────────────────────────────────────────

export type TransaksiStatus =
  | 'Menunggu Persetujuan'
  | 'Disetujui'
  | 'Ditolak'
  | 'Menunggu Pembayaran'
  | 'Diproses'
  | 'Siap Diserahkan'
  | 'Sedang Dikirim'
  | 'Selesai'
  | 'Dibatalkan';

/** Status yang dianggap "aktif" (belum selesai, belum dibatalkan). */
export const ACTIVE_TRANSAKSI_STATUS: TransaksiStatus[] = [
  'Menunggu Persetujuan',
  'Disetujui',
  'Menunggu Pembayaran',
  'Diproses',
  'Siap Diserahkan',
  'Sedang Dikirim',
];

// ─── Riwayat Status ───────────────────────────────────────────────────────────

export interface RiwayatStatusEntry {
  status: TransaksiStatus;
  /** ISO datetime */
  timestamp: string;
  catatan?: string;
}

// ─── Notifikasi (struktur siap, pengiriman belum diimplementasikan) ──────────

export interface NotifikasiTransaksi {
  id: string;
  transaksiId: string;
  target: 'Pembeli' | 'Penjual';
  pesan: string;
  /** ISO datetime */
  createdAt: string;
  dibaca: boolean;
}

const NOTIFIKASI: NotifikasiTransaksi[] = [];

function queueNotifikasi(transaksiId: string, target: 'Pembeli' | 'Penjual', pesan: string): void {
  NOTIFIKASI.push({
    id: generateUUID(),
    transaksiId,
    target,
    pesan,
    createdAt: new Date().toISOString(),
    dibaca: false,
  });
}

export function getNotifikasiByTransaksi(transaksiId: string): NotifikasiTransaksi[] {
  return NOTIFIKASI.filter((n) => n.transaksiId === transaksiId);
}

// ─── Model Transaksi ──────────────────────────────────────────────────────────

export interface TransaksiItem {
  /** Nomor transaksi — format TRX-{YYYYMMDD}-{seq} */
  id: string;
  /** UUID listing yang menjadi objek transaksi. */
  listingUuid: string;
  /** Judul listing — denormalized untuk tampilan. */
  judulListing: string;
  /** Thumbnail listing — denormalized untuk tampilan. */
  thumbnailListing: string;
  /** Slug kategori listing — denormalized untuk routing. */
  kategoriSlug: string;
  /** Referensi ke modul asal aset — untuk sinkronisasi saat Selesai. */
  sumber: ListingSumber;
  /** Nama penjual — denormalized. */
  namaPenjual: string;
  /** Workspace ID penjual. */
  workspaceIdPenjual: string;
  /** Nama Workspace penjual — denormalized. */
  workspaceNamaPenjual: string;
  /** Nama pembeli — denormalized. */
  namaPembeli: string;
  /** Workspace ID pembeli. */
  workspaceIdPembeli: string;
  /** Nama Workspace pembeli — denormalized. */
  workspaceNamaPembeli: string;
  /** Jumlah yang ditransaksikan. */
  qty: number;
  /** Satuan (ekor, kg, sak, dst). */
  satuanHarga: string;
  /** Harga per satuan (Rp). */
  hargaSatuan: number;
  /** Total harga transaksi (qty × hargaSatuan). */
  total: number;
  status: TransaksiStatus;
  riwayatStatus: RiwayatStatusEntry[];
  /** Alasan penolakan — terisi jika status 'Ditolak'. */
  alasanDitolak?: string;
  /** Alasan pembatalan — terisi jika status 'Dibatalkan'. */
  alasanDibatalkan?: string;
  /** ISO date transaksi dibuat. */
  createdAt: string;
  /** ISO date transaksi terakhir diperbarui. */
  updatedAt: string;
  /** ISO date transaksi selesai — terisi saat status 'Selesai'. */
  selesaiAt?: string;
  /** Bendera bahwa sinkronisasi aset sudah dilakukan (mencegah double-sync). */
  asetSynced?: boolean;
}

// ─── Input & Validasi ────────────────────────────────────────────────────────

export interface CreateTransaksiInput {
  listingUuid: string;
  namaPembeli: string;
  workspaceIdPembeli: string;
  workspaceNamaPembeli: string;
  qty: number;
  catatan?: string;
  /**
   * MPK-010: Harga hasil negosiasi yang menggantikan listing.harga.
   * Hanya diisi oleh alur Negosiasi → Transaksi otomatis.
   */
  hargaNegosiasi?: number;
  /**
   * MPK-010: Nomor negosiasi yang menghasilkan transaksi ini.
   * Dipakai untuk audit trail di riwayatStatus.
   */
  negosiasiId?: string;
  /**
   * MPK-010: Status awal transaksi — default 'Menunggu Persetujuan'.
   * Transaksi dari negosiasi yang sudah disetujui mulai dari 'Disetujui'.
   */
  initialStatus?: TransaksiStatus;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

let _transaksiSeq = 0;
function nextNomorTransaksi(): string {
  _transaksiSeq += 1;
  const seq = String(_transaksiSeq).padStart(3, '0');
  return `TRX-${todayIso().replace(/-/g, '')}-${seq}`;
}

/**
 * Qty yang sudah direservasi oleh transaksi AKTIF untuk satu listing.
 * Tidak termasuk transaksi yang Ditolak, Dibatalkan, atau Selesai.
 */
export function getQtyReservedByTransaksi(listingUuid: string, excludeId?: string): number {
  return TRANSAKSI
    .filter((t) => t.listingUuid === listingUuid && t.id !== excludeId)
    .filter((t) => ACTIVE_TRANSAKSI_STATUS.includes(t.status))
    .reduce((sum, t) => sum + t.qty, 0);
}

/**
 * Qty listing yang masih tersedia untuk transaksi baru
 * = qtyDijual listing - qty yang sudah direservasi transaksi aktif.
 */
export function getQtyTersediaTransaksi(listingUuid: string): number {
  const listing = getListingByUuid(listingUuid);
  if (!listing) return 0;
  const reserved = getQtyReservedByTransaksi(listingUuid);
  return Math.max(0, listing.qtyDijual - reserved);
}

// ─── Data Store ───────────────────────────────────────────────────────────────

let TRANSAKSI: TransaksiItem[] = [];

/** Lazy seed: dipanggil saat pertama kali TRANSAKSI diakses. */
let _seeded = false;
function ensureSeeded(): void {
  if (_seeded) return;
  _seeded = true;

  const listings = getAllListing();
  if (listings.length === 0) return;

  // Ambil beberapa listing untuk seed
  const lTernak   = listings.find((l) => l.kategoriSlug === 'ternak');
  const lPakan    = listings.find((l) => l.kategoriSlug === 'pakan');
  const lObat     = listings.find((l) => l.kategoriSlug === 'obat-kesehatan');
  const lTransport= listings.find((l) => l.kategoriSlug === 'transportasi');
  const lPeralatan= listings.find((l) => l.kategoriSlug === 'peralatan');

  const seeds: TransaksiItem[] = [];

  /** Helper membangun satu seed transaksi. */
  function mkSeed(
    id: string,
    listing: typeof lTernak,
    qty: number,
    status: TransaksiStatus,
    createdAt: string,
    riwayat: { status: TransaksiStatus; timestamp: string; catatan?: string }[],
    extras: Partial<TransaksiItem> = {},
  ): TransaksiItem | null {
    if (!listing) return null;
    const total = qty * listing.harga;
    return {
      id,
      listingUuid: listing.uuid,
      judulListing: listing.judul,
      thumbnailListing: listing.media.thumbnail,
      kategoriSlug: listing.kategoriSlug,
      sumber: listing.sumber,
      namaPenjual: listing.penjual,
      workspaceIdPenjual: listing.workspaceId,
      workspaceNamaPenjual: listing.workspaceNama,
      namaPembeli: 'Berkah Farm Tasik',
      workspaceIdPembeli: 'w2',
      workspaceNamaPembeli: 'Berkah Farm Tasik',
      qty,
      satuanHarga: listing.satuanHarga,
      hargaSatuan: listing.harga,
      total,
      status,
      riwayatStatus: riwayat,
      createdAt,
      updatedAt: riwayat[riwayat.length - 1]?.timestamp.slice(0, 10) ?? createdAt,
      ...extras,
    };
  }

  // Seed 1: Menunggu Persetujuan
  const s1 = mkSeed(
    'TRX-20260711-001', lTernak, 1, 'Menunggu Persetujuan', '2026-07-11',
    [{ status: 'Menunggu Persetujuan', timestamp: '2026-07-11T09:00:00.000Z', catatan: 'Pembeli mengajukan pembelian' }],
  );

  // Seed 2: Disetujui
  const s2 = mkSeed(
    'TRX-20260711-002', lPakan, 10, 'Disetujui', '2026-07-11',
    [
      { status: 'Menunggu Persetujuan', timestamp: '2026-07-11T10:00:00.000Z' },
      { status: 'Disetujui', timestamp: '2026-07-11T11:30:00.000Z', catatan: 'Penjual menyetujui pesanan' },
    ],
  );

  // Seed 3: Ditolak
  const s3 = mkSeed(
    'TRX-20260710-003', lObat, 5, 'Ditolak', '2026-07-10',
    [
      { status: 'Menunggu Persetujuan', timestamp: '2026-07-10T08:00:00.000Z' },
      { status: 'Ditolak', timestamp: '2026-07-10T09:15:00.000Z', catatan: 'Stok tidak tersedia untuk waktu dekat' },
    ],
    { alasanDitolak: 'Stok tidak tersedia untuk waktu dekat' },
  );

  // Seed 4: Diproses
  const s4 = mkSeed(
    'TRX-20260712-004', lPakan, 20, 'Diproses', '2026-07-12',
    [
      { status: 'Menunggu Persetujuan', timestamp: '2026-07-12T07:00:00.000Z' },
      { status: 'Disetujui', timestamp: '2026-07-12T08:00:00.000Z' },
      { status: 'Menunggu Pembayaran', timestamp: '2026-07-12T08:30:00.000Z' },
      { status: 'Diproses', timestamp: '2026-07-12T10:00:00.000Z', catatan: 'Pembayaran dikonfirmasi, pesanan diproses' },
    ],
  );

  // Seed 5: Siap Diserahkan
  const s5 = mkSeed(
    'TRX-20260712-005', lTransport, 1, 'Siap Diserahkan', '2026-07-12',
    [
      { status: 'Menunggu Persetujuan', timestamp: '2026-07-12T06:00:00.000Z' },
      { status: 'Disetujui', timestamp: '2026-07-12T07:00:00.000Z' },
      { status: 'Menunggu Pembayaran', timestamp: '2026-07-12T07:30:00.000Z' },
      { status: 'Diproses', timestamp: '2026-07-12T09:00:00.000Z' },
      { status: 'Siap Diserahkan', timestamp: '2026-07-12T13:00:00.000Z', catatan: 'Jadwal layanan sudah dikonfirmasi' },
    ],
  );

  // Seed 6: Selesai (sudah asetSynced true — tidak perlu re-sync)
  const s6 = mkSeed(
    'TRX-20260709-006', lPeralatan, 1, 'Selesai', '2026-07-09',
    [
      { status: 'Menunggu Persetujuan', timestamp: '2026-07-09T08:00:00.000Z' },
      { status: 'Disetujui', timestamp: '2026-07-09T09:00:00.000Z' },
      { status: 'Menunggu Pembayaran', timestamp: '2026-07-09T09:30:00.000Z' },
      { status: 'Diproses', timestamp: '2026-07-09T11:00:00.000Z' },
      { status: 'Siap Diserahkan', timestamp: '2026-07-09T13:00:00.000Z' },
      { status: 'Sedang Dikirim', timestamp: '2026-07-09T14:00:00.000Z' },
      { status: 'Selesai', timestamp: '2026-07-09T16:00:00.000Z', catatan: 'Barang diterima, transaksi selesai' },
    ],
    { selesaiAt: '2026-07-09', asetSynced: true },
  );

  // Seed 7: Dibatalkan
  const s7 = mkSeed(
    'TRX-20260710-007', lTernak, 1, 'Dibatalkan', '2026-07-10',
    [
      { status: 'Menunggu Persetujuan', timestamp: '2026-07-10T10:00:00.000Z' },
      { status: 'Disetujui', timestamp: '2026-07-10T10:30:00.000Z' },
      { status: 'Dibatalkan', timestamp: '2026-07-10T12:00:00.000Z', catatan: 'Pembeli membatalkan karena berubah pikiran' },
    ],
    { alasanDibatalkan: 'Pembeli membatalkan karena berubah pikiran' },
  );

  // Seed 8: Sedang Dikirim
  const s8 = mkSeed(
    'TRX-20260713-008', lObat, 3, 'Sedang Dikirim', '2026-07-13',
    [
      { status: 'Menunggu Persetujuan', timestamp: '2026-07-13T07:00:00.000Z' },
      { status: 'Disetujui', timestamp: '2026-07-13T08:00:00.000Z' },
      { status: 'Menunggu Pembayaran', timestamp: '2026-07-13T08:30:00.000Z' },
      { status: 'Diproses', timestamp: '2026-07-13T10:00:00.000Z' },
      { status: 'Siap Diserahkan', timestamp: '2026-07-13T12:00:00.000Z' },
      { status: 'Sedang Dikirim', timestamp: '2026-07-13T14:00:00.000Z', catatan: 'Dikirim via ekspedisi Wahana' },
    ],
  );

  // ── Seed dinamis: diversifikasi periode ─────────────────────────────────────
  // Ditambahkan agar filter Hari Ini / Minggu Ini / Bulan Ini / Tahun Ini
  // menampilkan data yang berbeda satu sama lain (P0-005-004).
  function isoOffset(offsetDays: number): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  }
  function isoOffsetMonths(offsetMonths: number): string {
    const d = new Date();
    d.setDate(1); // hindari lompatan hari di akhir bulan
    d.setMonth(d.getMonth() + offsetMonths);
    return d.toISOString().split('T')[0];
  }

  const todayDate   = isoOffset(0);
  const prevMonDate = isoOffsetMonths(-2); // 2 bulan lalu — hanya masuk Tahun Ini

  // Seed 9: Selesai hari ini → masuk Hari Ini + Minggu Ini + Bulan Ini + Tahun Ini
  const s9 = mkSeed(
    `TRX-${todayDate.replace(/-/g, '')}-009`, lTernak, 1, 'Selesai', todayDate,
    [
      { status: 'Menunggu Persetujuan', timestamp: `${todayDate}T07:00:00.000Z` },
      { status: 'Disetujui',            timestamp: `${todayDate}T08:00:00.000Z` },
      { status: 'Menunggu Pembayaran',  timestamp: `${todayDate}T08:30:00.000Z` },
      { status: 'Diproses',             timestamp: `${todayDate}T09:00:00.000Z` },
      { status: 'Siap Diserahkan',      timestamp: `${todayDate}T11:00:00.000Z` },
      { status: 'Sedang Dikirim',       timestamp: `${todayDate}T13:00:00.000Z` },
      { status: 'Selesai',              timestamp: `${todayDate}T15:00:00.000Z`, catatan: 'Barang diterima, transaksi selesai' },
    ],
    { selesaiAt: todayDate, asetSynced: true },
  );

  // Seed 10: Selesai 2 bulan lalu → hanya masuk Tahun Ini
  const s10 = mkSeed(
    `TRX-${prevMonDate.replace(/-/g, '')}-010`, lPakan, 8, 'Selesai', prevMonDate,
    [
      { status: 'Menunggu Persetujuan', timestamp: `${prevMonDate}T08:00:00.000Z` },
      { status: 'Disetujui',            timestamp: `${prevMonDate}T09:00:00.000Z` },
      { status: 'Menunggu Pembayaran',  timestamp: `${prevMonDate}T09:30:00.000Z` },
      { status: 'Diproses',             timestamp: `${prevMonDate}T11:00:00.000Z` },
      { status: 'Siap Diserahkan',      timestamp: `${prevMonDate}T13:00:00.000Z` },
      { status: 'Sedang Dikirim',       timestamp: `${prevMonDate}T14:00:00.000Z` },
      { status: 'Selesai',              timestamp: `${prevMonDate}T16:00:00.000Z`, catatan: 'Barang diterima, transaksi selesai' },
    ],
    { selesaiAt: prevMonDate, asetSynced: true },
  );

  for (const seed of [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10]) {
    if (seed) seeds.push(seed);
  }

  // Seed 001-010 menggunakan counter tetap; transaksi baru mulai dari seq 11
  _transaksiSeq = 10;

  TRANSAKSI = seeds;
}

// ─── CRUD Transaksi ───────────────────────────────────────────────────────────

/** Seluruh transaksi, terbaru di atas. */
export function getAllTransaksi(): TransaksiItem[] {
  ensureSeeded();
  return TRANSAKSI.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Satu transaksi berdasarkan id (nomor transaksi). */
export function getTransaksiById(id: string): TransaksiItem | undefined {
  ensureSeeded();
  return TRANSAKSI.find((t) => t.id === id);
}

/**
 * Membuat transaksi baru dari listing.
 * Validasi qty: qty baru harus ≤ qty listing tersedia (listing.qtyDijual − qty aktif).
 * Stok fisik / aset TIDAK berubah saat ini — hanya saat status 'Selesai'.
 */
export function addTransaksi(input: CreateTransaksiInput): TransaksiItem {
  ensureSeeded();

  const listing = getListingByUuid(input.listingUuid);
  if (!listing) throw new Error('Listing tidak ditemukan.');
  if (listing.status !== 'Aktif') throw new Error('Listing tidak dalam status Aktif.');
  if (input.qty <= 0) throw new Error('Qty harus lebih dari nol.');

  // Validasi qty
  const tersedia = getQtyTersediaTransaksi(input.listingUuid);
  if (input.qty > tersedia) {
    throw new Error(
      `Qty melebihi ketersediaan. Qty tersedia: ${tersedia} ${listing.satuanHarga}.`,
    );
  }

  const now = nowIso();
  const today = now.slice(0, 10);
  const transaksi: TransaksiItem = {
    id: nextNomorTransaksi(),
    listingUuid: listing.uuid,
    judulListing: listing.judul,
    thumbnailListing: listing.media.thumbnail,
    kategoriSlug: listing.kategoriSlug,
    sumber: listing.sumber,
    namaPenjual: listing.penjual,
    workspaceIdPenjual: listing.workspaceId,
    workspaceNamaPenjual: listing.workspaceNama,
    namaPembeli: input.namaPembeli,
    workspaceIdPembeli: input.workspaceIdPembeli,
    workspaceNamaPembeli: input.workspaceNamaPembeli,
    qty: input.qty,
    satuanHarga: listing.satuanHarga,
    hargaSatuan: input.hargaNegosiasi ?? listing.harga,
    total: input.qty * (input.hargaNegosiasi ?? listing.harga),
    status: input.initialStatus ?? 'Menunggu Persetujuan',
    riwayatStatus: [
      {
        status: input.initialStatus ?? 'Menunggu Persetujuan',
        timestamp: now,
        catatan: input.negosiasiId
          ? `Transaksi dibuat otomatis dari negosiasi ${input.negosiasiId}.${input.catatan ? ' ' + input.catatan : ''}`
          : (input.catatan ? `Pembelian diajukan. ${input.catatan}` : 'Pembeli mengajukan pembelian.'),
      },
    ],
    createdAt: today,
    updatedAt: today,
  };

  TRANSAKSI.unshift(transaksi);

  // Notifikasi (struktur saja)
  queueNotifikasi(transaksi.id, 'Penjual', `Pengajuan pembelian baru: ${transaksi.judulListing} (${transaksi.qty} ${transaksi.satuanHarga})`);
  queueNotifikasi(transaksi.id, 'Pembeli', `Pembelian Anda untuk ${transaksi.judulListing} sedang menunggu persetujuan penjual.`);

  return transaksi;
}

/**
 * Mengubah status transaksi dan mencatat ke riwayatStatus.
 * Tidak melakukan sinkronisasi aset — gunakan selesaikanTransaksi() untuk status 'Selesai'.
 */
export function updateTransaksiStatus(
  id: string,
  status: TransaksiStatus,
  catatan?: string,
): TransaksiItem {
  ensureSeeded();
  const transaksi = TRANSAKSI.find((t) => t.id === id);
  if (!transaksi) throw new Error(`Transaksi tidak ditemukan: ${id}`);

  const now = nowIso();
  transaksi.status = status;
  transaksi.updatedAt = now.slice(0, 10);
  transaksi.riwayatStatus.push({ status, timestamp: now, catatan });

  return transaksi;
}

/**
 * Penjual menyetujui pengajuan pembelian.
 */
export function setujuiTransaksi(id: string, catatan?: string): TransaksiItem {
  ensureSeeded();
  const t = TRANSAKSI.find((t) => t.id === id);
  if (!t) throw new Error('Transaksi tidak ditemukan.');
  if (t.status !== 'Menunggu Persetujuan') throw new Error('Hanya transaksi berstatus "Menunggu Persetujuan" yang bisa disetujui.');

  const result = updateTransaksiStatus(id, 'Disetujui', catatan ?? 'Penjual menyetujui pesanan.');
  queueNotifikasi(id, 'Pembeli', `Pesanan Anda untuk ${t.judulListing} telah disetujui. Silakan lanjutkan pembayaran.`);
  return result;
}

/**
 * Penjual menolak pengajuan pembelian.
 */
export function tolakTransaksi(id: string, alasan: string): TransaksiItem {
  ensureSeeded();
  const t = TRANSAKSI.find((t) => t.id === id);
  if (!t) throw new Error('Transaksi tidak ditemukan.');
  if (t.status !== 'Menunggu Persetujuan') throw new Error('Hanya transaksi berstatus "Menunggu Persetujuan" yang bisa ditolak.');

  const result = updateTransaksiStatus(id, 'Ditolak', alasan);
  t.alasanDitolak = alasan;
  queueNotifikasi(id, 'Pembeli', `Pesanan Anda untuk ${t.judulListing} ditolak. Alasan: ${alasan}`);
  return result;
}

/**
 * Membatalkan transaksi (oleh Pembeli atau Penjual).
 */
export function batalkanTransaksi(id: string, alasan: string): TransaksiItem {
  ensureSeeded();
  const t = TRANSAKSI.find((t) => t.id === id);
  if (!t) throw new Error('Transaksi tidak ditemukan.');
  const cancelableStatus: TransaksiStatus[] = ['Menunggu Persetujuan', 'Disetujui', 'Menunggu Pembayaran'];
  if (!cancelableStatus.includes(t.status)) {
    throw new Error(`Transaksi berstatus "${t.status}" tidak dapat dibatalkan.`);
  }

  const result = updateTransaksiStatus(id, 'Dibatalkan', alasan);
  t.alasanDibatalkan = alasan;
  queueNotifikasi(id, 'Penjual', `Transaksi ${t.judulListing} dibatalkan. Alasan: ${alasan}`);
  queueNotifikasi(id, 'Pembeli', `Transaksi ${t.judulListing} dibatalkan.`);
  return result;
}

/**
 * Menyelesaikan transaksi dan menyinkronkan aset ke modul asal.
 *
 * Sinkronisasi (HANYA saat Selesai):
 *  - StokPakan  → addPerubahanStok (jenis 'Dijual')
 *  - StokObat   → applyPenyesuaianStok (jenis 'Lainnya')
 *  - Livestock  → performPermanentTransfer (reason 'Penjualan')
 *  - Jasa/Lainnya → update listing status → 'Terjual' saja
 *
 * Listing qtyDijual dikurangi sebesar qty transaksi; jika mencapai 0,
 * listing diubah status menjadi 'Terjual'.
 */
export function selesaikanTransaksi(id: string, catatan?: string): TransaksiItem {
  ensureSeeded();
  const t = TRANSAKSI.find((t) => t.id === id);
  if (!t) throw new Error('Transaksi tidak ditemukan.');
  if (!['Siap Diserahkan', 'Sedang Dikirim'].includes(t.status)) {
    throw new Error(`Transaksi berstatus "${t.status}" belum dapat diselesaikan.`);
  }
  if (t.asetSynced) {
    throw new Error('Sinkronisasi aset sudah dilakukan sebelumnya.');
  }

  const today = todayIso();
  const keterangan = catatan ?? `Terjual via Marketplace — ${t.id}`;

  // ── 1. Sinkronisasi aset berdasarkan modul sumber ──────────────────────────
  const modul: ListingSumberModul = t.sumber.modul;
  const sumberId = t.sumber.sumberId;

  if (modul === 'StokPakan') {
    try {
      addPerubahanStok({
        inventarisId: sumberId,
        jenis: 'Dijual',
        jumlah: t.qty,
        satuan: t.satuanHarga,
        tanggal: today,
        catatan: keterangan,
        sumberPerubahan: 'Perubahan Stok',
      });
    } catch (err) {
      console.error('[MPK-009] Gagal sync StokPakan:', err);
    }
  } else if (modul === 'StokObat') {
    try {
      applyPenyesuaianStok({
        stokObatUuid: sumberId,
        jenisPenyesuaian: 'Lainnya',
        jumlah: t.qty,
        tanggal: today,
        catatan: keterangan,
      });
    } catch (err) {
      console.error('[MPK-009] Gagal sync StokObat:', err);
    }
  } else if (modul === 'Livestock') {
    try {
      performPermanentTransfer({
        livestockId: sumberId,
        reason: 'Penjualan',
        date: today,
        notes: keterangan,
      });
    } catch (err) {
      console.error('[MPK-009] Gagal sync Livestock:', err);
    }
  }
  // Transportasi/DokterHewan/KlinikHewan/Peralatan/dll → update listing status saja

  // ── 2. Perbarui listing (kurangi qty; jika habis → status 'Terjual') ───────
  const listing = getListingByUuid(t.listingUuid);
  if (listing) {
    const qtyBaru = Math.max(0, listing.qtyDijual - t.qty);
    listing.qtyDijual = qtyBaru;
    if (qtyBaru <= 0) {
      updateListingStatus(t.listingUuid, 'Terjual');
    }
  }

  // ── 3. Tandai transaksi selesai ────────────────────────────────────────────
  t.asetSynced = true;
  t.selesaiAt = today;
  updateTransaksiStatus(id, 'Selesai', catatan ?? 'Transaksi selesai dan aset telah disinkronkan.');

  queueNotifikasi(id, 'Pembeli', `Transaksi ${t.judulListing} telah selesai. Terima kasih!`);
  queueNotifikasi(id, 'Penjual', `Transaksi ${t.judulListing} selesai. Aset telah diperbarui.`);

  return t;
}

// ─── Ringkasan ────────────────────────────────────────────────────────────────

export interface RingkasanTransaksi {
  totalTransaksi: number;
  menungguPersetujuan: number;
  diproses: number;
  selesai: number;
  dibatalkan: number;
}

export function getRingkasanTransaksi(): RingkasanTransaksi {
  ensureSeeded();
  const all = TRANSAKSI;
  return {
    totalTransaksi: all.length,
    menungguPersetujuan: all.filter((t) => t.status === 'Menunggu Persetujuan').length,
    diproses: all.filter((t) =>
      ['Disetujui', 'Menunggu Pembayaran', 'Diproses', 'Siap Diserahkan', 'Sedang Dikirim'].includes(t.status),
    ).length,
    selesai: all.filter((t) => t.status === 'Selesai').length,
    dibatalkan: all.filter((t) => t.status === 'Ditolak' || t.status === 'Dibatalkan').length,
  };
}

// ─── Search & Filter ─────────────────────────────────────────────────────────

export type TransaksiFilterStatus =
  | 'semua'
  | 'menunggu'
  | 'diproses'
  | 'selesai'
  | 'dibatalkan';

export function searchAndFilterTransaksi(
  keyword: string,
  statusFilter: TransaksiFilterStatus,
): TransaksiItem[] {
  ensureSeeded();
  let hasil = TRANSAKSI.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Filter status
  if (statusFilter !== 'semua') {
    hasil = hasil.filter((t) => {
      if (statusFilter === 'menunggu') return t.status === 'Menunggu Persetujuan';
      if (statusFilter === 'diproses')
        return ['Disetujui', 'Menunggu Pembayaran', 'Diproses', 'Siap Diserahkan', 'Sedang Dikirim'].includes(t.status);
      if (statusFilter === 'selesai') return t.status === 'Selesai';
      if (statusFilter === 'dibatalkan') return t.status === 'Ditolak' || t.status === 'Dibatalkan';
      return true;
    });
  }

  // Search keyword
  const kw = keyword.trim().toLowerCase();
  if (kw) {
    hasil = hasil.filter((t) =>
      t.id.toLowerCase().includes(kw) ||
      t.judulListing.toLowerCase().includes(kw) ||
      t.namaPembeli.toLowerCase().includes(kw) ||
      t.namaPenjual.toLowerCase().includes(kw) ||
      t.workspaceNamaPembeli.toLowerCase().includes(kw) ||
      t.workspaceNamaPenjual.toLowerCase().includes(kw),
    );
  }

  return hasil;
}

// ─── FLOW-003M27: DB hydration ───────────────────────────────────────────────
// populateTransaksiFromDb() replaces the in-memory TRANSAKSI array with DB rows.
// Called by useMarketplace after repoGetTransaksiByWorkspace() succeeds.

export interface MarketplaceTransaksiDbRowForPopulate {
  id: string;
  listing_id: string;
  buyer_workspace_id: string;
  seller_workspace_id: string;
  agreed_price: number;
  status: string;
  notes: string | null;
  asset_synced: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown> | null;
}

export function populateTransaksiFromDb(
  rows: MarketplaceTransaksiDbRowForPopulate[],
): void {
  if (rows.length === 0) return;

  // Ensure the in-memory store is seeded first so we can merge without losing
  // the seq counter; override any existing record with the same nomor/id.
  ensureSeeded();

  const hydrated: TransaksiItem[] = rows.map((row) => {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    const nomor = typeof meta['nomor'] === 'string' ? meta['nomor'] : row.id;
    const today = row.created_at.slice(0, 10);

    return {
      id: nomor,
      listingUuid: row.listing_id,
      judulListing: typeof meta['judulListing'] === 'string' ? meta['judulListing'] : '(Listing)',
      thumbnailListing: '📦',
      kategoriSlug: '',
      sumber: { modul: 'Lainnya' as ListingSumberModul, sumberId: row.listing_id },
      namaPenjual: typeof meta['namaPenjual'] === 'string' ? meta['namaPenjual'] : '(Penjual)',
      workspaceIdPenjual: row.seller_workspace_id,
      workspaceNamaPenjual: typeof meta['workspaceNamaPenjual'] === 'string' ? meta['workspaceNamaPenjual'] : '',
      namaPembeli: typeof meta['namaPembeli'] === 'string' ? meta['namaPembeli'] : '(Pembeli)',
      workspaceIdPembeli: row.buyer_workspace_id,
      workspaceNamaPembeli: typeof meta['workspaceNamaPembeli'] === 'string' ? meta['workspaceNamaPembeli'] : '',
      qty: typeof meta['qty'] === 'number' ? meta['qty'] : 1,
      satuanHarga: typeof meta['satuanHarga'] === 'string' ? meta['satuanHarga'] : 'unit',
      hargaSatuan: row.agreed_price,
      total: typeof meta['total'] === 'number' ? meta['total'] : row.agreed_price,
      status: row.status as TransaksiStatus,
      riwayatStatus: [
        { status: row.status as TransaksiStatus, timestamp: row.created_at },
      ],
      createdAt: today,
      updatedAt: row.updated_at.slice(0, 10),
      selesaiAt: row.completed_at ? row.completed_at.slice(0, 10) : undefined,
      asetSynced: row.asset_synced,
    };
  });

  // Merge: remove any existing record with the same id (nomor), then add DB records.
  const dbNomors = new Set(hydrated.map((t) => t.id));
  for (let i = TRANSAKSI.length - 1; i >= 0; i--) {
    if (dbNomors.has(TRANSAKSI[i].id)) TRANSAKSI.splice(i, 1);
  }
  TRANSAKSI.push(...hydrated);
}
