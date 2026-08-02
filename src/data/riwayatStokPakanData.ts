// ─── Riwayat Stok Pakan (SR-001) ───────────────────────────────────────────────
// Sumber audit TUNGGAL untuk seluruh pergerakan Stok Pakan (masuk maupun keluar).
//
// Halaman/Tab Riwayat TIDAK memiliki input manual apa pun — seluruh entri di
// sini murni hasil agregasi baca-saja dari dua sumber yang sudah ada:
//   • getAllRiwayatMasuk()      — StokMasukRecord (src/data/stokInventarisData.ts)
//   • getAllRiwayatPerubahan()  — PerubahanStokRecord (src/data/stokInventarisData.ts)
//
// Kedua sumber itu sendiri hanya diisi oleh mutasi yang sudah ada (Tambah Stok,
// Perubahan Stok, Produksi Formula) — modul ini tidak menambah cara baru untuk
// menulis stok (tidak ada CRUD baru), hanya membaca & menyajikan.

import {
  getAllRiwayatMasuk,
  getAllRiwayatPerubahan,
  getInventarisById,
  type StokMasukRecord,
  type PerubahanStokRecord,
  type StokSumber,
} from './stokInventarisData';
import { getProduksiRecordsByFormulaId } from './produksiFormulaData';
import { getSeriByUUID } from './konsentratSeriData';
import { getTodayISO as todayIso } from '../utils/dateUtils';

// ─── Entri Riwayat Terpadu ──────────────────────────────────────────────────

export type RiwayatKategori = 'Masuk' | 'Keluar';

/** Sumber Data asal produk — dipakai di panel "Informasi Produk" pada Detail (SR-002). */
export type RiwayatSumberData = 'Master Pakan' | 'Produk Komersial' | 'Formula';

/**
 * Detail sumber aktivitas — field yang ditampilkan berbeda-beda sesuai `sumber`.
 * Semua opsional karena hanya sub-set yang relevan terisi untuk satu entri.
 */
export interface RiwayatSumberDetail {
  /** Tambah Manual / Penyesuaian Stok / Pindah Gudang masuk */
  namaOperator?: string;
  /** Marketplace */
  nomorTransaksi?: string;
  penjual?: string;
  /** Produksi Formula */
  namaFormula?: string;
  nomorBatch?: string;
  /** Hanya terisi jika sumber === 'Produksi Formula' — dipakai shortcut navigasi "Lihat Formula" (SR-003). */
  formulaId?: string;
  /** Pemberian Pakan */
  namaTernak?: string;
  grupTernak?: string;
  catatanPemberian?: string;
  /** Hanya terisi jika sumber === 'Pemberian Pakan' — dipakai shortcut navigasi "Lihat Livestock" (SR-003). */
  livestockId?: string;
  /** Perubahan Stok */
  jenisPerubahan?: string;
  alasan?: string;
  /** Lokasi asal item pada saat perubahan dicatat (SR-007). */
  lokasiAsal?: string;
  /** Lokasi tujuan — untuk Pindah Gudang / Pindah Peternakan (SR-007). */
  lokasiTujuan?: string;
  /** ID item inventaris asal — hanya untuk sumber 'Pindah Gudang' masuk (SR-007). */
  sumberInventarisId?: string;
}

export interface RiwayatEntry {
  id: string;
  kategori: RiwayatKategori;
  /** Label jenis aktivitas untuk ditampilkan (mis. "Tambah Stok Manual", "Rusak"). */
  aktivitas: string;
  /** Sumber pergerakan stok — dipakai untuk filter (Produksi/Marketplace/dst). */
  sumber: StokSumber;
  inventarisId: string;
  namaPakan: string;
  /** Jenis/kategori pakan (mis. "Hijauan", "Konsentrat"). */
  kategoriPakan: string;
  jumlah: number;
  satuan: string;
  lokasi: string;
  /** Tanggal (yyyy-mm-dd) — dipakai untuk filter Hari Ini/Minggu Ini/Bulan Ini. */
  tanggal: string;
  /** Timestamp lengkap (ISO) — dipakai untuk pengurutan & tampilan waktu. */
  waktu: string;
  status: 'Selesai';
  stokSebelum: number;
  stokSesudah: number;
  /** Selisih bertanda: positif untuk Masuk, negatif untuk Keluar. */
  selisih: number;
  nomorReferensi: string;
  keterangan: string;
  catatan?: string;
  /** Harga beli per satuan produk (jika tercatat pada item inventaris) — dipakai untuk menghitung Total pada entri Marketplace (SR-005). */
  hargaBeli?: number;
  // ── Panel "Informasi Produk" (SR-002) ──────────────────────────────────────
  /** UUID (Produk Komersial) atau id (Master Pakan/Formula) referensi asal produk. */
  produkUuid: string;
  sumberData: RiwayatSumberData;
  brand?: string;
  /** Nama Seri (Produk Komersial — Konsentrat) — dipakai untuk Search (SR-003), read-only lookup. */
  seri?: string;
  // ── Panel "Sumber Aktivitas" (SR-002) ──────────────────────────────────────
  sumberDetail: RiwayatSumberDetail;
  // ── Panel "Catatan" (SR-002) ────────────────────────────────────────────────
  /** Catatan bebas dari operator saat mencatat aktivitas ini (= alias `catatan`). */
  catatanOperator?: string;
  /** Kalimat sistem yang menjelaskan aktivitas secara otomatis (baca-saja, bukan input). */
  keteranganSistem: string;
}

function sumberDataFromInventaris(sumberInventaris: 'Master Pakan' | 'Produk Komersial' | 'Hasil Produksi'): RiwayatSumberData {
  return sumberInventaris === 'Hasil Produksi' ? 'Formula' : sumberInventaris;
}

/** Nomor batch produksi terbaru untuk suatu formula, jika tersedia (dibaca, tidak pernah ditulis dari sini). */
function lookupNomorBatch(formulaId?: string): string | undefined {
  if (!formulaId) return undefined;
  const batches = getProduksiRecordsByFormulaId(formulaId);
  return batches[0]?.nomorBatch;
}

/** Nama Seri Produk Komersial (Konsentrat) untuk `produkUuid`, jika ada (dibaca, tidak pernah ditulis dari sini). */
function lookupSeriNama(sumberData: RiwayatSumberData, produkUuid: string): string | undefined {
  if (sumberData !== 'Produk Komersial') return undefined;
  return getSeriByUUID(produkUuid)?.namaSeri;
}

const AKTIVITAS_MASUK_LABEL: Record<StokMasukRecord['sumber'], string> = {
  'Tambah Stok': 'Tambah Stok Manual',
  'Marketplace': 'Marketplace',
  'Produksi Formula': 'Hasil Produksi Formula',
  'Penyesuaian Stok': 'Penyesuaian Positif',
  'Pindah Gudang': 'Pindah Gudang (Masuk)',
};

/** Label jenis aktivitas Keluar — sumberPerubahan menang jika berupa aktivitas otomatis. */
function labelAktivitasKeluar(r: PerubahanStokRecord): string {
  if (r.sumberPerubahan === 'Produksi Formula') return 'Produksi Formula (Bahan Baku)';
  if (r.sumberPerubahan === 'Pemberian Pakan') return 'Pemberian Pakan ke Livestock';
  if (r.sumberPerubahan === 'Pindah Gudang') return 'Pindah Gudang (Keluar)';
  if (r.jenis === 'Koreksi Stok') return 'Penyesuaian Negatif (Koreksi Stok)';
  if (r.jenis === 'Penyesuaian Negatif') return 'Penyesuaian Negatif';
  if (r.jenis === 'Donasi') return 'Donasi';
  if (r.jenis === 'Pindah Gudang') return 'Pindah Gudang (Keluar)';
  return r.jenis;
}

function toEntryMasuk(r: StokMasukRecord): RiwayatEntry | undefined {
  const inv = getInventarisById(r.inventarisId);
  if (!inv) return undefined;

  const sumberDetail: RiwayatSumberDetail =
    r.sumber === 'Tambah Stok' ? { namaOperator: r.operator } :
    r.sumber === 'Marketplace' ? { nomorTransaksi: r.nomorTransaksi, penjual: r.penjual } :
    r.sumber === 'Produksi Formula' ? { namaFormula: r.formulaNama, nomorBatch: lookupNomorBatch(r.formulaId), formulaId: r.formulaId } :
    r.sumber === 'Penyesuaian Stok' ? { namaOperator: r.operator } :
    /* Pindah Gudang */ { namaOperator: r.operator, sumberInventarisId: r.sumberInventarisId };

  const keteranganSistem = r.sumber === 'Produksi Formula' && r.formulaNama
    ? `Penambahan stok ${inv.nama} sebesar ${r.jumlah} ${r.satuan} tercatat sebagai hasil produksi formula "${r.formulaNama}".`
    : r.sumber === 'Penyesuaian Stok'
    ? `Penambahan stok ${inv.nama} sebesar ${r.jumlah} ${r.satuan} melalui Penyesuaian Positif.`
    : r.sumber === 'Pindah Gudang'
    ? `Penerimaan stok ${inv.nama} sebesar ${r.jumlah} ${r.satuan} dari transfer antar gudang.`
    : `Penambahan stok ${inv.nama} sebesar ${r.jumlah} ${r.satuan} melalui ${AKTIVITAS_MASUK_LABEL[r.sumber]}.`;

  const sumberDataMasuk = sumberDataFromInventaris(inv.sumber);

  return {
    id: r.id,
    kategori: 'Masuk',
    aktivitas: AKTIVITAS_MASUK_LABEL[r.sumber],
    sumber: r.sumber,
    inventarisId: r.inventarisId,
    namaPakan: inv.nama,
    kategoriPakan: inv.kategori,
    jumlah: r.jumlah,
    satuan: r.satuan,
    lokasi: inv.lokasiPenyimpanan ?? '—',
    tanggal: r.tanggal,
    waktu: r.createdAt,
    status: 'Selesai',
    stokSebelum: r.stokSebelum,
    stokSesudah: r.stokSesudah,
    selisih: r.jumlah,
    nomorReferensi: r.id,
    keterangan: r.sumber === 'Produksi Formula' && r.formulaNama
      ? `Hasil produksi formula "${r.formulaNama}"`
      : AKTIVITAS_MASUK_LABEL[r.sumber],
    catatan: r.catatan,
    hargaBeli: inv.hargaBeli,
    produkUuid: inv.referensiId ?? inv.id,
    sumberData: sumberDataMasuk,
    brand: inv.brand,
    seri: lookupSeriNama(sumberDataMasuk, inv.referensiId ?? inv.id),
    sumberDetail,
    catatanOperator: r.catatan,
    keteranganSistem,
  };
}

function toEntryKeluar(r: PerubahanStokRecord): RiwayatEntry | undefined {
  const inv = getInventarisById(r.inventarisId);
  if (!inv) return undefined;

  const sumberDetail: RiwayatSumberDetail =
    r.sumberPerubahan === 'Produksi Formula' ? { namaFormula: r.formulaNama, nomorBatch: lookupNomorBatch(r.formulaId), formulaId: r.formulaId } :
    r.sumberPerubahan === 'Pemberian Pakan' ? { namaTernak: r.namaTernak, grupTernak: r.grupTernak, catatanPemberian: r.catatanPemberian } :
    r.sumberPerubahan === 'Pindah Gudang' ? { jenisPerubahan: r.jenis, namaOperator: r.operator, lokasiAsal: r.lokasiAsal, lokasiTujuan: r.lokasiTujuan } :
    /* Perubahan Stok (default) */ { jenisPerubahan: r.jenis, alasan: r.catatan, namaOperator: r.operator, lokasiAsal: r.lokasiAsal, lokasiTujuan: r.lokasiTujuan };

  const sumberDataKeluar = sumberDataFromInventaris(inv.sumber);

  const keteranganSistem = r.sumberPerubahan === 'Produksi Formula'
    ? `Pengurangan stok ${inv.nama} sebesar ${r.jumlah} ${r.satuan} tercatat sebagai bahan baku Produksi Formula${r.formulaNama ? ` "${r.formulaNama}"` : ''}.`
    : r.sumberPerubahan === 'Pemberian Pakan'
    ? `Pengurangan stok ${inv.nama} sebesar ${r.jumlah} ${r.satuan} tercatat sebagai pemberian pakan ke ternak.`
    : r.sumberPerubahan === 'Pindah Gudang' || r.jenis === 'Pindah Gudang'
    ? `Stok ${inv.nama} sebesar ${r.jumlah} ${r.satuan} dipindahkan${r.lokasiTujuan ? ` ke ${r.lokasiTujuan}` : ' ke lokasi lain'}.`
    : r.jenis === 'Donasi'
    ? `Stok ${inv.nama} sebesar ${r.jumlah} ${r.satuan} didonasikan.`
    : r.jenis === 'Dijual'
    ? `Stok ${inv.nama} sebesar ${r.jumlah} ${r.satuan} dijual ke pihak lain.`
    : r.jenis === 'Penyesuaian Negatif' || r.jenis === 'Koreksi Stok' || r.jenis === 'Penyesuaian Awal'
    ? `Stok ${inv.nama} disesuaikan (dikurangi) sebesar ${r.jumlah} ${r.satuan} melalui Penyesuaian Negatif.`
    : `Pengurangan stok ${inv.nama} sebesar ${r.jumlah} ${r.satuan} tercatat sebagai "${r.jenis}".`;

  return {
    id: r.id,
    kategori: 'Keluar',
    aktivitas: labelAktivitasKeluar(r),
    sumber: r.sumberPerubahan,
    inventarisId: r.inventarisId,
    namaPakan: inv.nama,
    kategoriPakan: inv.kategori,
    jumlah: r.jumlah,
    satuan: r.satuan,
    lokasi: inv.lokasiPenyimpanan ?? '—',
    tanggal: r.tanggal,
    waktu: r.createdAt,
    status: 'Selesai',
    stokSebelum: r.stokSebelum,
    stokSesudah: r.stokSesudah,
    selisih: -r.jumlah,
    nomorReferensi: r.id,
    keterangan: labelAktivitasKeluar(r),
    catatan: r.catatan,
    produkUuid: inv.referensiId ?? inv.id,
    sumberData: sumberDataKeluar,
    brand: inv.brand,
    seri: lookupSeriNama(sumberDataKeluar, inv.referensiId ?? inv.id),
    sumberDetail,
    catatanOperator: r.catatan,
    keteranganSistem,
  };
}

/** Seluruh entri Riwayat Stok Pakan, live dari sumber asli, terbaru di atas. */
export function getAllRiwayatEntries(): RiwayatEntry[] {
  const masuk = getAllRiwayatMasuk().map(toEntryMasuk).filter((e): e is RiwayatEntry => !!e);
  const keluar = getAllRiwayatPerubahan().map(toEntryKeluar).filter((e): e is RiwayatEntry => !!e);
  return [...masuk, ...keluar].sort((a, b) => b.waktu.localeCompare(a.waktu));
}

/** Satu entri berdasarkan nomor referensi (id record asal) — untuk halaman Detail. */
export function getRiwayatEntryById(id: string): RiwayatEntry | undefined {
  return getAllRiwayatEntries().find((e) => e.id === id);
}

// ─── Ringkasan ──────────────────────────────────────────────────────────────

export interface RiwayatRingkasan {
  totalAktivitas: number;
  totalMasuk: number;
  totalKeluar: number;
  aktivitasHariIni: number;
}

export function getRiwayatRingkasan(): RiwayatRingkasan {
  const entries = getAllRiwayatEntries();
  const today = todayIso();
  return {
    totalAktivitas: entries.length,
    totalMasuk: entries.filter((e) => e.kategori === 'Masuk').length,
    totalKeluar: entries.filter((e) => e.kategori === 'Keluar').length,
    aktivitasHariIni: entries.filter((e) => e.tanggal === today).length,
  };
}

// ─── Search, Filter, Sort & Navigasi (SR-003) ──────────────────────────────
// Penyempurnaan search/filter/sort/navigasi murni di atas RiwayatEntry yang
// sudah ada (SR-001/SR-002) — tidak ada CRUD baru, tidak ada perubahan pada
// Master Pakan/Produk Komersial/Formula/Livestock/Dashboard.

/** Search mendukung: Nama Pakan, UUID Produk, Brand, Seri, Nama Formula, Nomor
 * Batch, Nomor Referensi, Nama Livestock, Nama Grup Livestock, Lokasi, Operator. */
export function matchesSearch(entry: RiwayatEntry, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack: (string | undefined)[] = [
    entry.namaPakan,
    entry.aktivitas,
    entry.nomorReferensi,
    entry.produkUuid,
    entry.brand,
    entry.seri,
    entry.sumberDetail.namaFormula,
    entry.sumberDetail.nomorBatch,
    entry.sumberDetail.namaTernak,
    entry.sumberDetail.grupTernak,
    entry.lokasi,
    entry.sumberDetail.namaOperator,
    entry.catatanOperator,
  ];
  return haystack.some((v) => !!v && v.toLowerCase().includes(q));
}

// ── Filter: Jenis Aktivitas ─────────────────────────────────────────────────

export type RiwayatAktivitasKey =
  | 'tambah-manual' | 'marketplace' | 'produksi-formula' | 'pemberian-pakan'
  | 'penyesuaian' | 'rusak' | 'kadaluarsa' | 'hilang' | 'dijual'
  | 'donasi' | 'pindah-gudang' | 'pindah-peternakan';

export const RIWAYAT_AKTIVITAS_OPTIONS: { key: RiwayatAktivitasKey; label: string }[] = [
  { key: 'tambah-manual',     label: 'Tambah Manual' },
  { key: 'marketplace',       label: 'Marketplace' },
  { key: 'produksi-formula',  label: 'Produksi Formula' },
  { key: 'pemberian-pakan',   label: 'Pemberian Pakan' },
  { key: 'penyesuaian',       label: 'Penyesuaian' },
  { key: 'rusak',             label: 'Rusak' },
  { key: 'kadaluarsa',        label: 'Kadaluarsa' },
  { key: 'hilang',            label: 'Hilang' },
  { key: 'dijual',            label: 'Dijual' },
  { key: 'donasi',            label: 'Donasi' },
  { key: 'pindah-gudang',     label: 'Pindah Gudang' },
  { key: 'pindah-peternakan', label: 'Pindah Peternakan' },
];

/**
 * 'Donasi' dan 'Pindah Gudang' belum punya jenis perubahan stok nyata di
 * modul Perubahan Stok (di luar scope SR-003 untuk menambahkannya) — opsi
 * filter disiapkan (skema-ready) dan otomatis mulai cocok begitu ada data
 * dengan jenis tersebut, tanpa perubahan lebih lanjut di sini.
 */
function matchesAktivitas(entry: RiwayatEntry, key: RiwayatAktivitasKey): boolean {
  const jenis = entry.sumberDetail.jenisPerubahan;
  switch (key) {
    case 'tambah-manual':     return entry.sumber === 'Tambah Stok' || entry.sumber === 'Penyesuaian Stok';
    case 'marketplace':       return entry.sumber === 'Marketplace';
    case 'produksi-formula':  return entry.sumber === 'Produksi Formula';
    case 'pemberian-pakan':   return entry.sumber === 'Pemberian Pakan';
    case 'penyesuaian':       return (
      entry.sumber === 'Penyesuaian Stok' ||
      jenis === 'Koreksi Stok' || jenis === 'Penyesuaian Awal' || jenis === 'Penyesuaian Negatif'
    );
    case 'rusak':             return jenis === 'Rusak' || jenis === 'Busuk' || jenis === 'Berjamur' || jenis === 'Tumpah' || jenis === 'Dimakan Hama';
    case 'kadaluarsa':        return jenis === 'Kedaluwarsa';
    case 'hilang':            return jenis === 'Hilang';
    case 'dijual':            return jenis === 'Dijual';
    case 'donasi':            return jenis === 'Donasi';
    case 'pindah-gudang':     return jenis === 'Pindah Gudang' || entry.sumber === 'Pindah Gudang';
    case 'pindah-peternakan': return jenis === 'Dipindahkan ke Peternakan Lain';
    default:                  return false;
  }
}

// ── Filter: Waktu ───────────────────────────────────────────────────────────

export type RiwayatWaktuKey =
  | 'semua' | 'hari-ini' | 'kemarin' | '7-hari' | '30-hari' | 'bulan-ini' | 'bulan-lalu' | 'custom';

export const RIWAYAT_WAKTU_OPTIONS: { key: RiwayatWaktuKey; label: string }[] = [
  { key: 'semua',     label: 'Semua Waktu' },
  { key: 'hari-ini',  label: 'Hari Ini' },
  { key: 'kemarin',   label: 'Kemarin' },
  { key: '7-hari',    label: '7 Hari' },
  { key: '30-hari',   label: '30 Hari' },
  { key: 'bulan-ini', label: 'Bulan Ini' },
  { key: 'bulan-lalu', label: 'Bulan Lalu' },
  { key: 'custom',    label: 'Custom Range' },
];

export interface RiwayatCustomRange {
  /** yyyy-mm-dd, inklusif */
  start: string;
  /** yyyy-mm-dd, inklusif */
  end: string;
}

function addDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function isSameMonth(dateIso: string, ref: Date): boolean {
  const d = new Date(dateIso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

function matchesWaktu(entry: RiwayatEntry, key: RiwayatWaktuKey, now: Date, custom?: RiwayatCustomRange): boolean {
  const today = todayIso();
  switch (key) {
    case 'semua':    return true;
    case 'hari-ini': return entry.tanggal === today;
    case 'kemarin':  return entry.tanggal === addDays(today, -1);
    case '7-hari':   return entry.tanggal >= addDays(today, -6) && entry.tanggal <= today;
    case '30-hari':  return entry.tanggal >= addDays(today, -29) && entry.tanggal <= today;
    case 'bulan-ini': return isSameMonth(entry.tanggal, now);
    case 'bulan-lalu': {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return isSameMonth(entry.tanggal, lastMonth);
    }
    case 'custom':
      if (!custom || !custom.start || !custom.end) return true;
      return entry.tanggal >= custom.start && entry.tanggal <= custom.end;
    default: return true;
  }
}

// ── Filter: Sumber ──────────────────────────────────────────────────────────

export const RIWAYAT_SUMBER_DATA_OPTIONS: { key: RiwayatSumberData; label: string }[] = [
  { key: 'Master Pakan',     label: 'Master Pakan' },
  { key: 'Produk Komersial', label: 'Produk Komersial' },
  { key: 'Formula',          label: 'Hasil Produksi Formula' },
];

// ── Filter: Lokasi ───────────────────────────────────────────────────────────

/** Daftar lokasi unik yang benar-benar dipakai di Riwayat — untuk menentukan
 * apakah Filter Lokasi perlu ditampilkan (hanya jika Workspace punya >1 lokasi). */
export function getRiwayatLokasiOptions(): string[] {
  const set = new Set(
    getAllRiwayatEntries()
      .map((e) => e.lokasi)
      .filter((l): l is string => !!l && l !== '—'),
  );
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

// ── Sort ─────────────────────────────────────────────────────────────────────

export type RiwayatSortKey = 'terbaru' | 'terlama' | 'nama-az' | 'nama-za' | 'jumlah-terbesar' | 'jumlah-terkecil';

export const RIWAYAT_SORT_OPTIONS: { key: RiwayatSortKey; label: string }[] = [
  { key: 'terbaru',         label: 'Terbaru' },
  { key: 'terlama',         label: 'Terlama' },
  { key: 'nama-az',         label: 'Nama A-Z' },
  { key: 'nama-za',         label: 'Nama Z-A' },
  { key: 'jumlah-terbesar', label: 'Jumlah Terbesar' },
  { key: 'jumlah-terkecil', label: 'Jumlah Terkecil' },
];

function sortRiwayat(entries: RiwayatEntry[], sort: RiwayatSortKey): RiwayatEntry[] {
  const arr = entries.slice();
  switch (sort) {
    case 'terbaru':         return arr.sort((a, b) => b.waktu.localeCompare(a.waktu));
    case 'terlama':         return arr.sort((a, b) => a.waktu.localeCompare(b.waktu));
    case 'nama-az':         return arr.sort((a, b) => a.namaPakan.localeCompare(b.namaPakan) || b.waktu.localeCompare(a.waktu));
    case 'nama-za':         return arr.sort((a, b) => b.namaPakan.localeCompare(a.namaPakan) || b.waktu.localeCompare(a.waktu));
    case 'jumlah-terbesar': return arr.sort((a, b) => b.jumlah - a.jumlah || b.waktu.localeCompare(a.waktu));
    case 'jumlah-terkecil': return arr.sort((a, b) => a.jumlah - b.jumlah || b.waktu.localeCompare(a.waktu));
    default:                return arr;
  }
}

// ── Query gabungan ───────────────────────────────────────────────────────────

export interface RiwayatQuery {
  search: string;
  /** Kosong = semua jenis aktivitas. */
  aktivitas: RiwayatAktivitasKey[];
  waktu: RiwayatWaktuKey;
  customRange?: RiwayatCustomRange;
  /** Kosong = semua sumber data. */
  sumberData: RiwayatSumberData[];
  /** Kosong = semua lokasi. */
  lokasi: string[];
  sort: RiwayatSortKey;
}

export const DEFAULT_RIWAYAT_QUERY: RiwayatQuery = {
  search: '',
  aktivitas: [],
  waktu: 'semua',
  sumberData: [],
  lokasi: [],
  sort: 'terbaru',
};

/** Search + Filter (Jenis Aktivitas, Waktu, Sumber, Lokasi) + Sort bekerja bersama tanpa konflik — semua bertipe AND antar-facet, OR di dalam facet multi-pilih. */
export function queryRiwayat(q: RiwayatQuery): RiwayatEntry[] {
  const now = new Date();
  let entries = getAllRiwayatEntries();
  entries = entries.filter((e) => matchesSearch(e, q.search));
  if (q.aktivitas.length > 0) entries = entries.filter((e) => q.aktivitas.some((k) => matchesAktivitas(e, k)));
  entries = entries.filter((e) => matchesWaktu(e, q.waktu, now, q.customRange));
  if (q.sumberData.length > 0) entries = entries.filter((e) => q.sumberData.includes(e.sumberData));
  if (q.lokasi.length > 0) entries = entries.filter((e) => q.lokasi.includes(e.lokasi));
  return sortRiwayat(entries, q.sort);
}

/** Jumlah facet filter yang sedang aktif (di luar Waktu 'semua' dan Sort default) — untuk badge tombol Filter. */
export function countActiveFilters(q: RiwayatQuery): number {
  let n = q.aktivitas.length + q.sumberData.length + q.lokasi.length;
  if (q.waktu !== 'semua') n += 1;
  return n;
}
