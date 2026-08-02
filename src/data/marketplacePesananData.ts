// ─── Pesanan Marketplace (SR-005) ──────────────────────────────────────────────
// Menjembatani Marketplace dengan Stok Pakan & Riwayat: saat sebuah pesanan
// berstatus "Disetujui" diterima (Terima Barang), stok bertambah secara
// OTOMATIS lewat addInventarisFromMarketplace() — tidak ada input manual.
//
// Produk pada pesanan WAJIB mengacu ke Master Pakan atau Produk Komersial
// (referensiId nyata dari kedua modul tersebut) — tidak ada item bebas/baru.
// Modul ini TIDAK mengubah Master Pakan, Produk Komersial, Formula, atau
// Livestock — ia hanya memanggil fungsi Stok Pakan yang sudah ada (FP-000/SR-005).

import { addInventarisFromMarketplace, type InventarisItem } from './stokInventarisData';
import { getTodayISO as todayIso } from '../utils/dateUtils';

export type PesananStatus = 'Disetujui' | 'Diterima' | 'Dibatalkan';

export interface PesananMarketplaceItem {
  /** Nomor order — juga dipakai sebagai "Nomor Transaksi" pada audit trail Riwayat. */
  id: string;
  referensiId: string;
  sumberReferensi: 'Master Pakan' | 'Produk Komersial';
  namaProduk: string;
  brand?: string;
  kategori: string;
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
  supplier: string;
  /** Workspace tujuan penerimaan barang — Workspace aktif Workspace Switcher (TopAppBar). */
  workspaceTujuan: string;
  tanggalPesan: string; // ISO date (yyyy-mm-dd)
  batch?: string;
  lokasiPenyimpanan?: string;
  catatan?: string;
  status: PesananStatus;
  tanggalDiterima?: string; // ISO date (yyyy-mm-dd), terisi saat diterima
  /** Terisi setelah barang diterima — id item inventaris hasil integrasi. */
  inventarisId?: string;
}

const PESANAN: PesananMarketplaceItem[] = [
  {
    id: 'MP-ORD-20260711-001',
    referensiId: 'mp-6',
    sumberReferensi: 'Master Pakan',
    namaProduk: 'Dedak Padi',
    kategori: 'Limbah Pertanian',
    jumlah: 100,
    satuan: 'Kg',
    hargaSatuan: 3200,
    supplier: 'Toko Pakan Berkah',
    workspaceTujuan: 'Berkah Farm Garut',
    tanggalPesan: '2026-07-10',
    batch: 'BATCH-DP-0711',
    lokasiPenyimpanan: 'Gudang A',
    catatan: 'Pesanan rutin dedak padi.',
    status: 'Disetujui',
  },
  {
    id: 'MP-ORD-20260712-002',
    referensiId: 'mp-6',
    sumberReferensi: 'Master Pakan',
    namaProduk: 'Dedak Padi',
    kategori: 'Limbah Pertanian',
    jumlah: 80,
    satuan: 'Kg',
    hargaSatuan: 3300,
    supplier: 'Toko Pakan Berkah',
    workspaceTujuan: 'Berkah Farm Garut',
    tanggalPesan: '2026-07-12',
    batch: 'BATCH-DP-0712',
    lokasiPenyimpanan: 'Gudang A',
    catatan: 'Tambahan stok menjelang akhir bulan.',
    status: 'Disetujui',
  },
  {
    id: 'MP-ORD-20260712-003',
    referensiId: 'c920a5c4-8afc-4f7f-a4ec-8e4a285cd329', // KONSENTRAT_SERI_UUID['cp-144']
    sumberReferensi: 'Produk Komersial',
    namaProduk: 'Konsentrat Sapi Potong CP 144',
    brand: 'Charoen Pokphand',
    kategori: 'Konsentrat',
    jumlah: 5,
    satuan: 'Sak',
    hargaSatuan: 350000,
    supplier: 'Charoen Pokphand Authorized Dealer',
    workspaceTujuan: 'Berkah Farm Garut',
    tanggalPesan: '2026-07-12',
    batch: 'CP144-0712',
    lokasiPenyimpanan: 'Gudang B',
    catatan: 'Pembelian konsentrat penggemukan fase grower.',
    status: 'Disetujui',
  },
];

/** Seluruh pesanan Marketplace milik Workspace, terbaru di atas. */
export function getAllPesanan(): PesananMarketplaceItem[] {
  return PESANAN.slice().reverse();
}

/** Satu pesanan berdasarkan id (nomor order). */
export function getPesananById(id: string): PesananMarketplaceItem | undefined {
  return PESANAN.find((p) => p.id === id);
}

/**
 * Menerima barang untuk satu pesanan Marketplace berstatus "Disetujui".
 *
 * Efek otomatis (tanpa input manual lain):
 *  1. Stok Pakan bertambah — via addInventarisFromMarketplace() (merge jika
 *     referensiId sudah ada, atau item baru jika belum).
 *  2. Riwayat mencatat entri "Marketplace" — otomatis lewat StokMasukRecord
 *     yang dibuat addInventarisFromMarketplace().
 *  3. Dashboard & AI Insight ikut berubah karena keduanya live-computed dari
 *     data Stok Pakan/Riwayat yang sama.
 *
 * Melempar Error jika pesanan tidak ditemukan atau statusnya bukan "Disetujui".
 */
export function terimaBarangPesanan(id: string): PesananMarketplaceItem {
  const pesanan = PESANAN.find((p) => p.id === id);
  if (!pesanan) throw new Error(`Pesanan tidak ditemukan: ${id}`);
  if (pesanan.status !== 'Disetujui') {
    throw new Error('Pesanan ini tidak dapat diterima pada status saat ini.');
  }

  const tanggalDiterima = todayIso();
  const inventaris: InventarisItem = addInventarisFromMarketplace({
    referensiId: pesanan.referensiId,
    nama: pesanan.namaProduk,
    brand: pesanan.brand,
    kategori: pesanan.kategori,
    sumber: pesanan.sumberReferensi,
    jumlah: pesanan.jumlah,
    satuan: pesanan.satuan,
    hargaBeli: pesanan.hargaSatuan,
    supplier: pesanan.supplier,
    tanggalMasuk: tanggalDiterima,
    batch: pesanan.batch,
    lokasiPenyimpanan: pesanan.lokasiPenyimpanan,
    catatan: pesanan.catatan,
    nomorTransaksi: pesanan.id,
  });

  pesanan.status = 'Diterima';
  pesanan.tanggalDiterima = tanggalDiterima;
  pesanan.inventarisId = inventaris.id;

  return pesanan;
}
