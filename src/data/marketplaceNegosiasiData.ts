// ─── MPK-010 — Negosiasi Marketplace ─────────────────────────────────────────
// Sistem negosiasi harga dan jumlah antara Pembeli dan Penjual.
// Negosiasi BUKAN Chat — hanya penawaran terstruktur (harga, qty, catatan).
//
// Aturan utama:
//  - Yang dapat dinegosiasikan: Harga, Qty, Catatan.
//  - Yang TIDAK dapat dinegosiasikan: Aset, Workspace, Pemilik Listing.
//  - Qty penawaran tidak boleh melebihi Qty Listing yang tersedia.
//  - Saat Disetujui → Marketplace otomatis membuat Transaksi dengan harga/qty hasil negosiasi.
//  - Seluruh aktivitas negosiasi tercatat di riwayatNegosiasi.

import { generateUUID } from '../utils/uuid';
import {
  getListingByUuid,
  getAllListing,
  type ListingSumber,
} from './marketplaceListingData';
import {
  addTransaksi,
  getQtyTersediaTransaksi,
} from './marketplaceTransaksiData';
import { getTodayISO as todayIso } from '../utils/dateUtils';

// ─── Tipe Status ─────────────────────────────────────────────────────────────

export type NegosiasiStatus =
  | 'Menunggu Respon Penjual'
  | 'Penawaran Balik'
  | 'Disetujui'
  | 'Ditolak'
  | 'Dibatalkan Pembeli'
  | 'Kadaluarsa';

/** Status yang masih aktif (belum terminal). */
export const ACTIVE_NEGOSIASI_STATUS: NegosiasiStatus[] = [
  'Menunggu Respon Penjual',
  'Penawaran Balik',
];

// ─── Riwayat Negosiasi ────────────────────────────────────────────────────────

export type AksiNegosiasi =
  | 'Penawaran Dibuat'
  | 'Penawaran Diubah'
  | 'Penawaran Balik'
  | 'Penawaran Diterima'
  | 'Penawaran Ditolak'
  | 'Penawaran Kadaluarsa'
  | 'Dibatalkan Pembeli';

export interface RiwayatNegosiasiEntry {
  aksi: AksiNegosiasi;
  oleh: 'Pembeli' | 'Penjual' | 'Sistem';
  harga: number;
  qty: number;
  catatan?: string;
  /** ISO datetime */
  timestamp: string;
}

// ─── Notifikasi (struktur siap, pengiriman belum diimplementasikan) ──────────

export interface NotifikasiNegosiasi {
  id: string;
  negosiasiId: string;
  target: 'Pembeli' | 'Penjual';
  tipe: 'Penawaran Baru' | 'Penawaran Balik' | 'Penawaran Disetujui' | 'Penawaran Ditolak';
  pesan: string;
  createdAt: string;
  dibaca: boolean;
}

const NOTIFIKASI_NEGOSIASI: NotifikasiNegosiasi[] = [];

function queueNotif(
  negosiasiId: string,
  target: 'Pembeli' | 'Penjual',
  tipe: NotifikasiNegosiasi['tipe'],
  pesan: string,
): void {
  NOTIFIKASI_NEGOSIASI.push({
    id: generateUUID(),
    negosiasiId,
    target,
    tipe,
    pesan,
    createdAt: new Date().toISOString(),
    dibaca: false,
  });
}

export function getNotifikasiByNegosiasi(negosiasiId: string): NotifikasiNegosiasi[] {
  return NOTIFIKASI_NEGOSIASI.filter((n) => n.negosiasiId === negosiasiId);
}

// ─── Model Negosiasi ──────────────────────────────────────────────────────────

export interface NegosiasiItem {
  /** Nomor negosiasi — format NEG-{YYYYMMDD}-{seq} */
  id: string;
  listingUuid: string;
  judulListing: string;
  thumbnailListing: string;
  kategoriSlug: string;
  sumber: ListingSumber;
  namaPenjual: string;
  workspaceIdPenjual: string;
  workspaceNamaPenjual: string;
  namaPembeli: string;
  workspaceIdPembeli: string;
  workspaceNamaPembeli: string;
  /** Harga listing saat negosiasi pertama kali dibuat — tidak berubah. */
  hargaAwal: number;
  satuanHarga: string;
  /** Harga penawaran terkini (berubah setiap round). */
  hargaPenawaran: number;
  /** Qty penawaran terkini. */
  qtyPenawaran: number;
  catatan?: string;
  status: NegosiasiStatus;
  riwayatNegosiasi: RiwayatNegosiasiEntry[];
  /** Nomor Transaksi yang dibuat otomatis saat negosiasi Disetujui. */
  transaksiId?: string;
  /** ISO date negosiasi dibuat. */
  createdAt: string;
  /** ISO date negosiasi terakhir diperbarui. */
  updatedAt: string;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export interface CreateNegosiasiInput {
  listingUuid: string;
  namaPembeli: string;
  workspaceIdPembeli: string;
  workspaceNamaPembeli: string;
  hargaPenawaran: number;
  qtyPenawaran: number;
  catatan?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

let _negSeq = 0;
function nextNomorNegosiasi(): string {
  _negSeq += 1;
  return `NEG-${todayIso().replace(/-/g, '')}-${String(_negSeq).padStart(3, '0')}`;
}

// ─── Data Store ───────────────────────────────────────────────────────────────

let NEGOSIASI: NegosiasiItem[] = [];
let _seeded = false;

function ensureSeeded(): void {
  if (_seeded) return;
  _seeded = true;

  const listings = getAllListing();
  if (listings.length === 0) return;

  const lTernak    = listings.find((l) => l.kategoriSlug === 'ternak');
  const lPakan     = listings.find((l) => l.kategoriSlug === 'pakan');
  const lObat      = listings.find((l) => l.kategoriSlug === 'obat-kesehatan');
  const lTransport = listings.find((l) => l.kategoriSlug === 'transportasi');
  const lPeralatan = listings.find((l) => l.kategoriSlug === 'peralatan');

  function mk(
    id: string,
    listing: typeof lTernak,
    hargaPenawaran: number,
    qty: number,
    status: NegosiasiStatus,
    createdAt: string,
    riwayat: RiwayatNegosiasiEntry[],
    extras: Partial<NegosiasiItem> = {},
  ): NegosiasiItem | null {
    if (!listing) return null;
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
      hargaAwal: listing.harga,
      satuanHarga: listing.satuanHarga,
      hargaPenawaran,
      qtyPenawaran: qty,
      status,
      riwayatNegosiasi: riwayat,
      createdAt,
      updatedAt: riwayat[riwayat.length - 1]?.timestamp.slice(0, 10) ?? createdAt,
      ...extras,
    };
  }

  const seeds: Array<NegosiasiItem | null> = [
    // 1 — Menunggu Respon Penjual
    mk('NEG-20260711-001', lTernak, 3000000, 1, 'Menunggu Respon Penjual', '2026-07-11', [
      { aksi: 'Penawaran Dibuat', oleh: 'Pembeli', harga: 3000000, qty: 1, catatan: 'Saya tawarkan Rp 3.000.000 untuk pembelian langsung', timestamp: '2026-07-11T09:00:00.000Z' },
    ]),
    // 2 — Penawaran Balik
    mk('NEG-20260711-002', lPakan, 12000, 30, 'Penawaran Balik', '2026-07-11', [
      { aksi: 'Penawaran Dibuat', oleh: 'Pembeli', harga: 12000, qty: 30, catatan: 'Beli 30 ikat, tawarkan Rp 12.000/ikat', timestamp: '2026-07-11T10:00:00.000Z' },
      { aksi: 'Penawaran Balik', oleh: 'Penjual', harga: 13500, qty: 30, catatan: 'Harga minimum kami Rp 13.500/ikat untuk qty 30', timestamp: '2026-07-11T11:30:00.000Z' },
    ], { hargaPenawaran: 13500 }),
    // 3 — Disetujui (dengan transaksiId simulasi)
    mk('NEG-20260710-003', lObat, 40000, 10, 'Disetujui', '2026-07-10', [
      { aksi: 'Penawaran Dibuat', oleh: 'Pembeli', harga: 40000, qty: 10, catatan: 'Beli 10 botol, tawar Rp 40.000/botol', timestamp: '2026-07-10T08:00:00.000Z' },
      { aksi: 'Penawaran Balik', oleh: 'Penjual', harga: 42000, qty: 10, catatan: 'Bisa Rp 42.000, sudah harga spesial', timestamp: '2026-07-10T09:00:00.000Z' },
      { aksi: 'Penawaran Diterima', oleh: 'Pembeli', harga: 42000, qty: 10, catatan: 'Setuju Rp 42.000', timestamp: '2026-07-10T09:30:00.000Z' },
    ], { hargaPenawaran: 42000 }),
    // 4 — Ditolak
    mk('NEG-20260710-004', lTransport, 280000, 1, 'Ditolak', '2026-07-10', [
      { aksi: 'Penawaran Dibuat', oleh: 'Pembeli', harga: 280000, qty: 1, catatan: 'Tawarkan Rp 280.000 untuk rute Garut-Bandung', timestamp: '2026-07-10T12:00:00.000Z' },
      { aksi: 'Penawaran Ditolak', oleh: 'Penjual', harga: 280000, qty: 1, catatan: 'Harga terlalu rendah, tidak sesuai biaya operasional', timestamp: '2026-07-10T13:00:00.000Z' },
    ]),
    // 5 — Dibatalkan Pembeli
    mk('NEG-20260712-005', lPeralatan, 4000000, 2, 'Dibatalkan Pembeli', '2026-07-12', [
      { aksi: 'Penawaran Dibuat', oleh: 'Pembeli', harga: 4000000, qty: 2, catatan: 'Beli 2 unit, tawar Rp 4.000.000/unit', timestamp: '2026-07-12T07:00:00.000Z' },
      { aksi: 'Dibatalkan Pembeli', oleh: 'Pembeli', harga: 4000000, qty: 2, catatan: 'Berubah pikiran, tidak jadi beli', timestamp: '2026-07-12T08:00:00.000Z' },
    ]),
    // 6 — Kadaluarsa
    mk('NEG-20260708-006', lPakan, 13000, 20, 'Kadaluarsa', '2026-07-08', [
      { aksi: 'Penawaran Dibuat', oleh: 'Pembeli', harga: 13000, qty: 20, timestamp: '2026-07-08T10:00:00.000Z' },
      { aksi: 'Penawaran Kadaluarsa', oleh: 'Sistem', harga: 13000, qty: 20, catatan: 'Penjual tidak merespons dalam 3 hari', timestamp: '2026-07-11T10:00:00.000Z' },
    ]),
    // 7 — Menunggu Respon Penjual (multi-round pembeli ajukan ulang)
    mk('NEG-20260713-007', lTernak, 2700000, 1, 'Menunggu Respon Penjual', '2026-07-13', [
      { aksi: 'Penawaran Dibuat', oleh: 'Pembeli', harga: 2500000, qty: 1, catatan: 'Penawaran awal', timestamp: '2026-07-13T07:00:00.000Z' },
      { aksi: 'Penawaran Balik', oleh: 'Penjual', harga: 3200000, qty: 1, catatan: 'Minimum Rp 3.200.000', timestamp: '2026-07-13T08:00:00.000Z' },
      { aksi: 'Penawaran Diubah', oleh: 'Pembeli', harga: 2700000, qty: 1, catatan: 'Naikkan ke Rp 2.700.000', timestamp: '2026-07-13T09:00:00.000Z' },
    ], { hargaPenawaran: 2700000 }),
  ];

  _negSeq = 7;
  NEGOSIASI = seeds.filter((s): s is NegosiasiItem => s !== null);
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function getAllNegosiasi(): NegosiasiItem[] {
  ensureSeeded();
  return NEGOSIASI.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getNegosiasiById(id: string): NegosiasiItem | undefined {
  ensureSeeded();
  return NEGOSIASI.find((n) => n.id === id);
}

/**
 * Pembeli mengajukan penawaran baru.
 * Validasi qty: qty ≤ qty tersedia listing (sama seperti Transaksi).
 */
export function addNegosiasi(input: CreateNegosiasiInput): NegosiasiItem {
  ensureSeeded();

  const listing = getListingByUuid(input.listingUuid);
  if (!listing) throw new Error('Listing tidak ditemukan.');
  if (listing.status !== 'Aktif') throw new Error('Listing tidak dalam status Aktif.');
  if (input.hargaPenawaran <= 0) throw new Error('Harga penawaran harus lebih dari nol.');
  if (input.qtyPenawaran <= 0) throw new Error('Qty harus lebih dari nol.');

  // Validasi qty terhadap ketersediaan listing
  const tersedia = getQtyTersediaTransaksi(input.listingUuid);
  if (input.qtyPenawaran > tersedia) {
    throw new Error(
      `Qty melebihi ketersediaan. Qty tersedia: ${tersedia} ${listing.satuanHarga}.`,
    );
  }

  const now = nowIso();
  const today = now.slice(0, 10);
  const neg: NegosiasiItem = {
    id: nextNomorNegosiasi(),
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
    hargaAwal: listing.harga,
    satuanHarga: listing.satuanHarga,
    hargaPenawaran: input.hargaPenawaran,
    qtyPenawaran: input.qtyPenawaran,
    catatan: input.catatan,
    status: 'Menunggu Respon Penjual',
    riwayatNegosiasi: [
      {
        aksi: 'Penawaran Dibuat',
        oleh: 'Pembeli',
        harga: input.hargaPenawaran,
        qty: input.qtyPenawaran,
        catatan: input.catatan,
        timestamp: now,
      },
    ],
    createdAt: today,
    updatedAt: today,
  };

  NEGOSIASI.unshift(neg);
  queueNotif(neg.id, 'Penjual', 'Penawaran Baru',
    `Penawaran baru untuk "${neg.judulListing}": ${neg.qtyPenawaran} ${neg.satuanHarga} @ Rp ${neg.hargaPenawaran.toLocaleString('id-ID')}`);
  return neg;
}

/**
 * Pembeli memperbarui penawarannya (ajukan ulang dengan nilai berbeda).
 * Hanya diizinkan saat status 'Penawaran Balik' (merespons counter-offer penjual).
 */
export function ubahPenawaran(
  id: string,
  hargaBaru: number,
  qtyBaru: number,
  catatan?: string,
): NegosiasiItem {
  ensureSeeded();
  const neg = NEGOSIASI.find((n) => n.id === id);
  if (!neg) throw new Error('Negosiasi tidak ditemukan.');
  if (neg.status !== 'Penawaran Balik') {
    throw new Error('Penawaran hanya dapat diubah saat menerima Penawaran Balik dari penjual.');
  }
  if (hargaBaru <= 0) throw new Error('Harga penawaran harus lebih dari nol.');
  if (qtyBaru <= 0) throw new Error('Qty harus lebih dari nol.');

  const tersedia = getQtyTersediaTransaksi(neg.listingUuid);
  if (qtyBaru > tersedia) {
    throw new Error(`Qty melebihi ketersediaan. Qty tersedia: ${tersedia} ${neg.satuanHarga}.`);
  }

  const now = nowIso();
  neg.hargaPenawaran = hargaBaru;
  neg.qtyPenawaran = qtyBaru;
  neg.catatan = catatan ?? neg.catatan;
  neg.status = 'Menunggu Respon Penjual';
  neg.updatedAt = now.slice(0, 10);
  neg.riwayatNegosiasi.push({
    aksi: 'Penawaran Diubah',
    oleh: 'Pembeli',
    harga: hargaBaru,
    qty: qtyBaru,
    catatan,
    timestamp: now,
  });

  queueNotif(neg.id, 'Penjual', 'Penawaran Baru',
    `Penawaran diubah untuk "${neg.judulListing}": ${neg.qtyPenawaran} ${neg.satuanHarga} @ Rp ${neg.hargaPenawaran.toLocaleString('id-ID')}`);
  return neg;
}

/**
 * Penjual mengajukan Penawaran Balik (counter-offer).
 * Status → 'Penawaran Balik'. Pembeli yang memutuskan langkah selanjutnya.
 */
export function ajukanPenawaranBalik(
  id: string,
  hargaBalik: number,
  qtyBalik: number,
  catatan?: string,
): NegosiasiItem {
  ensureSeeded();
  const neg = NEGOSIASI.find((n) => n.id === id);
  if (!neg) throw new Error('Negosiasi tidak ditemukan.');
  if (neg.status !== 'Menunggu Respon Penjual') {
    throw new Error('Penawaran Balik hanya dapat diajukan saat status "Menunggu Respon Penjual".');
  }
  if (hargaBalik <= 0) throw new Error('Harga penawaran balik harus lebih dari nol.');
  if (qtyBalik <= 0) throw new Error('Qty harus lebih dari nol.');

  const now = nowIso();
  neg.hargaPenawaran = hargaBalik;
  neg.qtyPenawaran = qtyBalik;
  neg.catatan = catatan ?? neg.catatan;
  neg.status = 'Penawaran Balik';
  neg.updatedAt = now.slice(0, 10);
  neg.riwayatNegosiasi.push({
    aksi: 'Penawaran Balik',
    oleh: 'Penjual',
    harga: hargaBalik,
    qty: qtyBalik,
    catatan,
    timestamp: now,
  });

  queueNotif(neg.id, 'Pembeli', 'Penawaran Balik',
    `Penjual mengajukan penawaran balik untuk "${neg.judulListing}": ${neg.qtyPenawaran} ${neg.satuanHarga} @ Rp ${neg.hargaPenawaran.toLocaleString('id-ID')}`);
  return neg;
}

/**
 * Penjual menyetujui penawaran dari Pembeli.
 * Status → 'Disetujui'.
 * Marketplace otomatis membuat Transaksi dengan harga/qty hasil negosiasi,
 * dimulai dari status 'Disetujui' (sudah melewati tahap negosiasi).
 */
export function setujuiNegosiasi(id: string, catatan?: string): NegosiasiItem {
  ensureSeeded();
  const neg = NEGOSIASI.find((n) => n.id === id);
  if (!neg) throw new Error('Negosiasi tidak ditemukan.');
  if (!['Menunggu Respon Penjual', 'Penawaran Balik'].includes(neg.status)) {
    throw new Error(`Negosiasi berstatus "${neg.status}" tidak dapat disetujui.`);
  }

  const now = nowIso();
  neg.status = 'Disetujui';
  neg.updatedAt = now.slice(0, 10);
  neg.riwayatNegosiasi.push({
    aksi: 'Penawaran Diterima',
    oleh: 'Penjual',
    harga: neg.hargaPenawaran,
    qty: neg.qtyPenawaran,
    catatan: catatan ?? 'Penawaran diterima oleh penjual.',
    timestamp: now,
  });

  // ── Buat Transaksi otomatis dengan harga/qty hasil negosiasi ─────────────
  try {
    const transaksi = addTransaksi({
      listingUuid: neg.listingUuid,
      namaPembeli: neg.namaPembeli,
      workspaceIdPembeli: neg.workspaceIdPembeli,
      workspaceNamaPembeli: neg.workspaceNamaPembeli,
      qty: neg.qtyPenawaran,
      catatan: `Dari negosiasi ${neg.id}. ${catatan ?? ''}`.trim(),
      hargaNegosiasi: neg.hargaPenawaran,
      negosiasiId: neg.id,
      initialStatus: 'Disetujui',
    });
    neg.transaksiId = transaksi.id;
  } catch (err) {
    console.error('[MPK-010] Gagal membuat Transaksi otomatis:', err);
  }

  queueNotif(neg.id, 'Pembeli', 'Penawaran Disetujui',
    `Penawaran Anda untuk "${neg.judulListing}" disetujui! Transaksi telah dibuat: ${neg.transaksiId ?? '—'}`);
  return neg;
}

/**
 * Pembeli menyetujui Penawaran Balik dari penjual.
 * Sama efeknya dengan setujuiNegosiasi — hanya pelakunya berbeda.
 */
export function setujuiPenawaranBalik(id: string, catatan?: string): NegosiasiItem {
  ensureSeeded();
  const neg = NEGOSIASI.find((n) => n.id === id);
  if (!neg) throw new Error('Negosiasi tidak ditemukan.');
  if (neg.status !== 'Penawaran Balik') {
    throw new Error('Hanya dapat menerima Penawaran Balik saat status "Penawaran Balik".');
  }

  const now = nowIso();
  neg.status = 'Disetujui';
  neg.updatedAt = now.slice(0, 10);
  neg.riwayatNegosiasi.push({
    aksi: 'Penawaran Diterima',
    oleh: 'Pembeli',
    harga: neg.hargaPenawaran,
    qty: neg.qtyPenawaran,
    catatan: catatan ?? 'Penawaran balik diterima oleh pembeli.',
    timestamp: now,
  });

  try {
    const transaksi = addTransaksi({
      listingUuid: neg.listingUuid,
      namaPembeli: neg.namaPembeli,
      workspaceIdPembeli: neg.workspaceIdPembeli,
      workspaceNamaPembeli: neg.workspaceNamaPembeli,
      qty: neg.qtyPenawaran,
      catatan: `Dari negosiasi ${neg.id} (penawaran balik diterima).`,
      hargaNegosiasi: neg.hargaPenawaran,
      negosiasiId: neg.id,
      initialStatus: 'Disetujui',
    });
    neg.transaksiId = transaksi.id;
  } catch (err) {
    console.error('[MPK-010] Gagal membuat Transaksi otomatis:', err);
  }

  queueNotif(neg.id, 'Penjual', 'Penawaran Disetujui',
    `Pembeli menerima penawaran balik Anda untuk "${neg.judulListing}". Transaksi: ${neg.transaksiId ?? '—'}`);
  return neg;
}

/**
 * Penjual menolak penawaran.
 */
export function tolakNegosiasi(id: string, catatan: string): NegosiasiItem {
  ensureSeeded();
  const neg = NEGOSIASI.find((n) => n.id === id);
  if (!neg) throw new Error('Negosiasi tidak ditemukan.');
  if (!['Menunggu Respon Penjual', 'Penawaran Balik'].includes(neg.status)) {
    throw new Error(`Negosiasi berstatus "${neg.status}" tidak dapat ditolak.`);
  }

  const now = nowIso();
  neg.status = 'Ditolak';
  neg.updatedAt = now.slice(0, 10);
  neg.riwayatNegosiasi.push({
    aksi: 'Penawaran Ditolak',
    oleh: 'Penjual',
    harga: neg.hargaPenawaran,
    qty: neg.qtyPenawaran,
    catatan,
    timestamp: now,
  });

  queueNotif(neg.id, 'Pembeli', 'Penawaran Ditolak',
    `Penawaran Anda untuk "${neg.judulListing}" ditolak. Alasan: ${catatan}`);
  return neg;
}

/**
 * Pembeli membatalkan negosiasi.
 */
export function batalkanNegosiasi(id: string, catatan?: string): NegosiasiItem {
  ensureSeeded();
  const neg = NEGOSIASI.find((n) => n.id === id);
  if (!neg) throw new Error('Negosiasi tidak ditemukan.');
  if (!['Menunggu Respon Penjual', 'Penawaran Balik'].includes(neg.status)) {
    throw new Error(`Negosiasi berstatus "${neg.status}" tidak dapat dibatalkan.`);
  }

  const now = nowIso();
  neg.status = 'Dibatalkan Pembeli';
  neg.updatedAt = now.slice(0, 10);
  neg.riwayatNegosiasi.push({
    aksi: 'Dibatalkan Pembeli',
    oleh: 'Pembeli',
    harga: neg.hargaPenawaran,
    qty: neg.qtyPenawaran,
    catatan,
    timestamp: now,
  });

  queueNotif(neg.id, 'Penjual', 'Penawaran Ditolak',
    `Pembeli membatalkan negosiasi untuk "${neg.judulListing}".`);
  return neg;
}

// ─── Ringkasan ────────────────────────────────────────────────────────────────

export interface RingkasanNegosiasi {
  totalNegosiasi: number;
  menungguRespon: number;
  penawaranBalik: number;
  disetujui: number;
  ditolak: number;
}

export function getRingkasanNegosiasi(): RingkasanNegosiasi {
  ensureSeeded();
  const all = NEGOSIASI;
  return {
    totalNegosiasi: all.length,
    menungguRespon: all.filter((n) => n.status === 'Menunggu Respon Penjual').length,
    penawaranBalik: all.filter((n) => n.status === 'Penawaran Balik').length,
    disetujui: all.filter((n) => n.status === 'Disetujui').length,
    ditolak: all.filter((n) => n.status === 'Ditolak' || n.status === 'Dibatalkan Pembeli' || n.status === 'Kadaluarsa').length,
  };
}

// ─── Search & Filter ─────────────────────────────────────────────────────────

export type NegosiasiFilterStatus =
  | 'semua'
  | 'menunggu'
  | 'penawaranBalik'
  | 'disetujui'
  | 'ditolak'
  | 'kadaluarsa';

export function searchAndFilterNegosiasi(
  keyword: string,
  statusFilter: NegosiasiFilterStatus,
): NegosiasiItem[] {
  ensureSeeded();
  let hasil = NEGOSIASI.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (statusFilter !== 'semua') {
    hasil = hasil.filter((n) => {
      if (statusFilter === 'menunggu')       return n.status === 'Menunggu Respon Penjual';
      if (statusFilter === 'penawaranBalik') return n.status === 'Penawaran Balik';
      if (statusFilter === 'disetujui')      return n.status === 'Disetujui';
      if (statusFilter === 'ditolak')        return n.status === 'Ditolak' || n.status === 'Dibatalkan Pembeli';
      if (statusFilter === 'kadaluarsa')     return n.status === 'Kadaluarsa';
      return true;
    });
  }

  const kw = keyword.trim().toLowerCase();
  if (kw) {
    hasil = hasil.filter((n) =>
      n.id.toLowerCase().includes(kw) ||
      n.listingUuid.toLowerCase().includes(kw) ||
      n.judulListing.toLowerCase().includes(kw) ||
      n.namaPembeli.toLowerCase().includes(kw) ||
      n.namaPenjual.toLowerCase().includes(kw) ||
      n.workspaceNamaPembeli.toLowerCase().includes(kw) ||
      n.workspaceNamaPenjual.toLowerCase().includes(kw),
    );
  }

  return hasil;
}

// ─── FLOW-003M27: DB hydration ───────────────────────────────────────────────
// populateNegosiasiFromDb() merges DB rows into the in-memory NEGOSIASI array.
// Called by useMarketplace after repoGetNegosiasiByWorkspace() succeeds.

export interface MarketplaceNegosiasiDbRowForPopulate {
  id: string;
  listing_id: string;
  buyer_workspace_id: string;
  seller_workspace_id: string;
  offered_price: number;
  counter_price: number | null;
  status: string;
  message: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown> | null;
}

function mapDbNegosiasiStatus(dbStatus: string): NegosiasiStatus {
  const map: Record<string, NegosiasiStatus> = {
    Pending:   'Menunggu Respon Penjual',
    Counter:   'Penawaran Balik',
    Accepted:  'Disetujui',
    Rejected:  'Ditolak',
    Cancelled: 'Dibatalkan Pembeli',
    Expired:   'Kadaluarsa',
  };
  return map[dbStatus] ?? (dbStatus as NegosiasiStatus);
}

export function populateNegosiasiFromDb(
  rows: MarketplaceNegosiasiDbRowForPopulate[],
): void {
  if (rows.length === 0) return;

  ensureSeeded();

  const hydrated: NegosiasiItem[] = rows.map((row) => {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    const nomor = typeof meta['nomor'] === 'string' ? meta['nomor'] : row.id;
    const today = row.created_at.slice(0, 10);
    const qtyFromMeta = typeof meta['qty'] === 'number' ? meta['qty'] : 1;

    return {
      id:                   nomor,
      listingUuid:          row.listing_id,
      judulListing:         typeof meta['judulListing'] === 'string' ? meta['judulListing'] : '(Listing)',
      thumbnailListing:     '📦',
      kategoriSlug:         '',
      sumber:               { modul: 'Lainnya' as const, sumberId: row.listing_id },
      hargaAwal:            typeof meta['hargaAwal'] === 'number' ? meta['hargaAwal'] : row.offered_price,
      satuanHarga:          typeof meta['satuanHarga'] === 'string' ? meta['satuanHarga'] : 'unit',
      qtyPenawaran:         qtyFromMeta,
      hargaPenawaran:       row.offered_price,
      catatan:              row.message ?? undefined,
      namaPembeli:          typeof meta['namaPembeli'] === 'string' ? meta['namaPembeli'] : '(Pembeli)',
      workspaceIdPembeli:   row.buyer_workspace_id,
      workspaceNamaPembeli: typeof meta['workspaceNamaPembeli'] === 'string' ? meta['workspaceNamaPembeli'] : '',
      namaPenjual:          typeof meta['namaPenjual'] === 'string' ? meta['namaPenjual'] : '(Penjual)',
      workspaceIdPenjual:   row.seller_workspace_id,
      workspaceNamaPenjual: typeof meta['workspaceNamaPenjual'] === 'string' ? meta['workspaceNamaPenjual'] : '',
      status:               mapDbNegosiasiStatus(row.status),
      riwayatNegosiasi:     [
        {
          aksi:      'Penawaran Dibuat' as AksiNegosiasi,
          oleh:      'Pembeli' as const,
          harga:     row.offered_price,
          qty:       qtyFromMeta,
          timestamp: row.created_at,
        },
      ],
      createdAt:            today,
      updatedAt:            row.updated_at.slice(0, 10),
    };
  });

  // Merge: remove existing record with the same id, then push DB records.
  const dbNomors = new Set(hydrated.map((n) => n.id));
  for (let i = NEGOSIASI.length - 1; i >= 0; i--) {
    if (dbNomors.has(NEGOSIASI[i].id)) NEGOSIASI.splice(i, 1);
  }
  NEGOSIASI.push(...hydrated);
}
