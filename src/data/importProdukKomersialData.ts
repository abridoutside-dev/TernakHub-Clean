// ─── Produk Komersial — Import & Sinkronisasi (PK-016) ───────────────────────
// Mesin import massal untuk menambah/memperbarui Produk Komersial (kategori
// Konsentrat — satu-satunya kategori dengan Living Database Brand+Seri penuh
// saat ini) tanpa mengubah struktur Living Database, Master Pakan, Formula,
// atau Stok.
//
// Cakupan tugas ini murni STRUKTUR + VALIDASI + LOG:
//   • Belum ada parser file Excel/CSV sungguhan — pemanggil menyediakan baris
//     data yang SUDAH berbentuk objek (`ImportRowInput[]`), seolah-olah hasil
//     parsing sudah selesai. Tahap berikutnya tinggal menyambungkan hasil
//     parser upload .xlsx/.csv ke bentuk ini.
//   • Tidak ada upload file, tidak ada backend — seluruh proses berjalan di
//     memori sesi (in-memory), konsisten dengan pola Living Database yang
//     sudah ada.
//
// Pencocokan data (identitas):
//   1) UUID (bila sudah tersedia pada baris import) — cara paling andal.
//   2) Bila UUID belum ada: kombinasi Brand + Seri Produk + Nama Produk.
//
// Validasi minimal per baris:
//   • Field wajib (namaProduk, brandNama/brandId, seriNama).
//   • Referensi Kategori  → KATEGORI_UUID (produkKomersialData.ts).
//   • Referensi Brand     → KONSENTRAT_MEREK_LIST (konsentratMerekData.ts).
//   • Referensi Seri      → KONSENTRAT_SERI_LIST (konsentratSeriData.ts), untuk deteksi duplikat/update.
//   • Referensi Produsen  → masterReferensiPKData ('Produsen').
//   • Referensi Target Ternak → masterReferensiPKData ('TargetTernak').
//
// Import HANYA menulis ke Living Database (KONSENTRAT_SERI_LIST). Tidak
// pernah menyentuh data transaksi (Stok, Formula, Riwayat Reproduksi, dll).

import { assertAdmin, getCurrentUser, logRiwayat } from './produkKomersialLivingDB';
import { getKategoriUUID, KATEGORI_UUID } from './produkKomersialData';
import { getActiveList, getList } from './masterReferensiPKData';
import {
  KONSENTRAT_MEREK_LIST,
  type KonsentratMerek,
} from './konsentratMerekData';
import {
  KONSENTRAT_SERI_LIST,
  addKonsentratSeri,
  updateKonsentratSeri,
  type KonsentratSeri,
  type BentukProduk,
  type StatusProduksi,
} from './konsentratSeriData';

// ─── Sumber Import ────────────────────────────────────────────────────────────

/** Format berkas sumber. Parser sesungguhnya belum diimplementasikan (PK-016). */
export type ImportSourceFormat = 'xlsx' | 'csv';

export const IMPORT_SOURCE_FORMAT_OPTIONS: ImportSourceFormat[] = ['xlsx', 'csv'];

// ─── Baris Input Import ───────────────────────────────────────────────────────
// Bentuk satu baris data setelah "diparsing" dari file (kolom Excel/CSV).
// Semua field bertipe string agar sesuai dengan nilai sel mentah sebelum
// divalidasi — konversi tipe (mis. angka) dilakukan setelah validasi lulus.

export interface ImportRowInput {
  /** UUID produk (Seri) bila sudah pernah diimport sebelumnya — kunci pencocokan utama. */
  uuid?: string;
  /** Slug kategori, mis. 'konsentrat'. Wajib — menentukan Living Database tujuan. */
  kategoriSlug?: string;
  /** Nama brand/merek — dipakai untuk mencocokkan ke KONSENTRAT_MEREK_LIST bila brandId tidak ada. */
  brandNama?: string;
  /** UUID brand bila sudah diketahui (mis. hasil export sebelumnya). */
  brandId?: string;
  /** Nama seri/varian singkat — bagian dari kunci pencocokan sekunder. */
  seriNama?: string;
  /** Nama produk lengkap. Wajib. */
  namaProduk?: string;
  /** Nama produsen — divalidasi terhadap masterReferensiPKData('Produsen'). */
  produsenNama?: string;
  /** Nama target ternak — divalidasi terhadap masterReferensiPKData('TargetTernak'). */
  targetTernakNama?: string;
  bentukProduk?: string;
  beratKemasan?: string;
  statusProduksi?: string;
  deskripsi?: string;
}

// ─── Hasil per Baris ──────────────────────────────────────────────────────────

export type ImportRowStatus = 'Berhasil' | 'Diperbarui' | 'Dilewati' | 'Gagal';

export interface ImportRowResult {
  rowIndex: number;
  input: ImportRowInput;
  status: ImportRowStatus;
  pesan: string;
  /** Cara baris ini dicocokkan ke data existing, bila ada. */
  dicocokkanVia?: 'uuid' | 'brand-seri-nama';
  /** UUID Seri hasil (baru dibuat, atau yang diperbarui/dilewati). */
  entityId?: string;
}

// ─── Ringkasan & Log Import ───────────────────────────────────────────────────

export interface ImportSummary {
  total: number;
  berhasil: number;
  diperbarui: number;
  dilewati: number;
  gagal: number;
}

export type ImportLogStatus = 'Selesai' | 'Selesai Sebagian' | 'Gagal Total';

export interface ImportLogEntry {
  /** UUID Import — identitas permanen satu sesi/batch import. */
  importId: string;
  /** Waktu import, ISO datetime string. */
  waktu: string;
  /** Admin yang menjalankan import (dari sesi berjalan — tidak dapat dipalsukan pemanggil). */
  admin: string;
  /** Format sumber data (xlsx/csv). */
  sumber: ImportSourceFormat;
  /** Nama berkas sumber, opsional (belum ada upload sungguhan). */
  namaFile?: string;
  /** Jumlah baris data pada batch ini. */
  jumlahData: number;
  ringkasan: ImportSummary;
  status: ImportLogStatus;
  /** Hasil detail per baris — untuk ditampilkan pada layar "Hasil Import". */
  hasil: ImportRowResult[];
}

/** Log Import — in-memory, bertambah selama sesi berjalan, terbaru di atas. */
export const IMPORT_LOG_PRODUK_KOMERSIAL: ImportLogEntry[] = [];

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'item';
}

function normalize(text: string | undefined): string {
  return (text ?? '').trim().toLowerCase();
}

// ─── Pencocokan Referensi ─────────────────────────────────────────────────────

function findBrand(row: ImportRowInput): KonsentratMerek | undefined {
  if (row.brandId) {
    return KONSENTRAT_MEREK_LIST.find(m => m.uuid === row.brandId);
  }
  if (row.brandNama) {
    return KONSENTRAT_MEREK_LIST.find(m => normalize(m.nama) === normalize(row.brandNama));
  }
  return undefined;
}

function findProdusenNama(nama: string | undefined): string | undefined {
  if (!nama) return undefined;
  return getList('Produsen').find(r => normalize(r.nama) === normalize(nama))?.nama;
}

function findTargetTernakNama(nama: string | undefined): string | undefined {
  if (!nama) return undefined;
  return getList('TargetTernak').find(r => normalize(r.nama) === normalize(nama))?.nama;
}

/**
 * Cari Seri existing untuk baris ini.
 * 1) UUID (paling andal).
 * 2) Kombinasi Brand + Seri Produk + Nama Produk (sebelum UUID tersedia).
 */
function findExistingSeri(row: ImportRowInput, brand: KonsentratMerek | undefined): {
  seri: KonsentratSeri | undefined;
  via: 'uuid' | 'brand-seri-nama' | undefined;
} {
  if (row.uuid) {
    const seri = KONSENTRAT_SERI_LIST.find(s => s.uuid === row.uuid);
    if (seri) return { seri, via: 'uuid' };
  }
  if (brand) {
    const seri = KONSENTRAT_SERI_LIST.find(s =>
      s.brandId === brand.uuid &&
      normalize(s.namaSeri) === normalize(row.seriNama) &&
      normalize(s.namaProduk) === normalize(row.namaProduk),
    );
    if (seri) return { seri, via: 'brand-seri-nama' };
  }
  return { seri: undefined, via: undefined };
}

// ─── Validasi ─────────────────────────────────────────────────────────────────

export interface ValidationContext {
  kategoriUuid?: string;
  brand?: KonsentratMerek;
  produsenNama?: string;
  targetTernakNama?: string;
}

/**
 * Validasi minimal satu baris import. Mengembalikan daftar pesan error
 * (kosong berarti lulus) beserta hasil lookup referensi yang sudah dicocokkan,
 * supaya tidak perlu dicari ulang saat menerapkan perubahan.
 */
export function validateImportRow(row: ImportRowInput): { errors: string[]; context: ValidationContext } {
  const errors: string[] = [];
  const context: ValidationContext = {};

  // Field wajib
  if (!row.namaProduk || !row.namaProduk.trim()) errors.push('Nama Produk wajib diisi.');
  if (!row.seriNama || !row.seriNama.trim()) errors.push('Nama Seri wajib diisi.');
  if (!row.brandId && !row.brandNama) errors.push('Brand wajib diisi (nama atau UUID).');

  // Referensi Kategori
  const kategoriSlug = row.kategoriSlug?.trim() || 'konsentrat';
  if (!KATEGORI_UUID[kategoriSlug]) {
    errors.push(`Kategori "${row.kategoriSlug ?? ''}" tidak dikenal.`);
  } else {
    context.kategoriUuid = getKategoriUUID(kategoriSlug);
  }

  // Referensi Brand
  const brand = findBrand(row);
  if (!brand && (row.brandId || row.brandNama)) {
    errors.push(`Brand "${row.brandNama ?? row.brandId ?? ''}" tidak ditemukan pada Living Database Merek.`);
  } else {
    context.brand = brand;
  }

  // Referensi Produsen (opsional pada baris, tapi wajib valid bila diisi)
  if (row.produsenNama) {
    const produsen = findProdusenNama(row.produsenNama);
    if (!produsen) {
      errors.push(`Produsen "${row.produsenNama}" tidak terdaftar pada Master Referensi.`);
    } else {
      context.produsenNama = produsen;
    }
  }

  // Referensi Target Ternak (wajib)
  if (!row.targetTernakNama || !row.targetTernakNama.trim()) {
    errors.push('Target Ternak wajib diisi.');
  } else {
    const target = findTargetTernakNama(row.targetTernakNama);
    if (!target) {
      errors.push(`Target Ternak "${row.targetTernakNama}" tidak terdaftar pada Master Referensi.`);
    } else {
      context.targetTernakNama = target;
    }
  }

  return { errors, context };
}

// ─── Deteksi Perubahan (untuk membedakan "duplikat identik" vs "perlu update") ─

function isIdenticalToExisting(row: ImportRowInput, existing: KonsentratSeri, ctx: ValidationContext): boolean {
  return (
    normalize(existing.namaProduk) === normalize(row.namaProduk) &&
    normalize(existing.namaSeri) === normalize(row.seriNama) &&
    normalize(existing.targetTernak) === normalize(ctx.targetTernakNama ?? row.targetTernakNama) &&
    normalize(existing.bentukProduk) === normalize(row.bentukProduk || existing.bentukProduk) &&
    normalize(existing.beratKemasan) === normalize(row.beratKemasan || existing.beratKemasan) &&
    normalize(existing.deskripsi) === normalize(row.deskripsi ?? existing.deskripsi) &&
    normalize(existing.statusProduksi) === normalize(row.statusProduksi || existing.statusProduksi)
  );
}

// ─── Proses per Baris ─────────────────────────────────────────────────────────

function processRow(row: ImportRowInput, rowIndex: number): ImportRowResult {
  const { errors, context } = validateImportRow(row);
  if (errors.length > 0) {
    return { rowIndex, input: row, status: 'Gagal', pesan: errors.join(' ') };
  }

  const brand = context.brand as KonsentratMerek;
  const { seri: existing, via } = findExistingSeri(row, brand);

  if (existing) {
    if (isIdenticalToExisting(row, existing, context)) {
      return {
        rowIndex, input: row, status: 'Dilewati',
        pesan: 'Data identik dengan yang sudah ada — dilewati (tidak ada perubahan).',
        dicocokkanVia: via, entityId: existing.uuid,
      };
    }
    try {
      const updated = updateKonsentratSeri(existing.uuid, {
        namaSeri: row.seriNama!.trim(),
        namaProduk: row.namaProduk!.trim(),
        targetTernak: context.targetTernakNama ?? row.targetTernakNama!.trim(),
        bentukProduk: (row.bentukProduk?.trim() || existing.bentukProduk) as BentukProduk,
        beratKemasan: row.beratKemasan?.trim() || existing.beratKemasan,
        statusProduksi: (row.statusProduksi?.trim() || existing.statusProduksi) as StatusProduksi,
        deskripsi: row.deskripsi?.trim() || existing.deskripsi,
      }, `Diperbarui via Import Produk Komersial`);
      return {
        rowIndex, input: row, status: 'Diperbarui',
        pesan: 'Produk existing diperbarui.',
        dicocokkanVia: via, entityId: updated?.uuid ?? existing.uuid,
      };
    } catch (e) {
      return { rowIndex, input: row, status: 'Gagal', pesan: (e as Error).message };
    }
  }

  // Belum ada — buat baru
  try {
    const created = addKonsentratSeri({
      uuid: row.uuid, // pakai UUID dari sumber import bila disertakan
      brandId: brand.uuid,
      brandSlug: brand.slug,
      slug: slugify(row.seriNama!),
      namaSeri: row.seriNama!.trim(),
      namaProduk: row.namaProduk!.trim(),
      targetTernak: context.targetTernakNama ?? row.targetTernakNama!.trim(),
      bentukProduk: (row.bentukProduk?.trim() || 'Mash') as BentukProduk,
      beratKemasan: row.beratKemasan?.trim() || '',
      statusProduksi: (row.statusProduksi?.trim() || 'Aktif') as StatusProduksi,
      deskripsi: row.deskripsi?.trim() || '',
    }, 'Ditambahkan via Import Produk Komersial');
    return {
      rowIndex, input: row, status: 'Berhasil',
      pesan: 'Produk baru berhasil ditambahkan.',
      entityId: created.uuid,
    };
  } catch (e) {
    return { rowIndex, input: row, status: 'Gagal', pesan: (e as Error).message };
  }
}

// ─── Menjalankan Import (Batch) ───────────────────────────────────────────────

export interface RunImportMeta {
  sumber: ImportSourceFormat;
  namaFile?: string;
}

function computeSummary(hasil: ImportRowResult[]): ImportSummary {
  return {
    total: hasil.length,
    berhasil: hasil.filter(r => r.status === 'Berhasil').length,
    diperbarui: hasil.filter(r => r.status === 'Diperbarui').length,
    dilewati: hasil.filter(r => r.status === 'Dilewati').length,
    gagal: hasil.filter(r => r.status === 'Gagal').length,
  };
}

function computeLogStatus(summary: ImportSummary): ImportLogStatus {
  if (summary.total > 0 && summary.gagal === summary.total) return 'Gagal Total';
  if (summary.gagal > 0) return 'Selesai Sebagian';
  return 'Selesai';
}

/**
 * Jalankan import untuk sekumpulan baris (hasil "parsing" file — lihat catatan
 * di kepala file). Hanya Admin yang boleh menjalankan. Hasil dicatat ke
 * IMPORT_LOG_PRODUK_KOMERSIAL dan Riwayat Perubahan Produk Komersial.
 */
export function runImportProdukKomersial(rows: ImportRowInput[], meta: RunImportMeta): ImportLogEntry {
  assertAdmin('menjalankan Import Produk Komersial');

  const hasil = rows.map((row, idx) => processRow(row, idx + 1));
  const ringkasan = computeSummary(hasil);
  const status = computeLogStatus(ringkasan);

  const entry: ImportLogEntry = {
    importId: generateUUID(),
    waktu: new Date().toISOString(),
    admin: getCurrentUser(),
    sumber: meta.sumber,
    namaFile: meta.namaFile,
    jumlahData: rows.length,
    ringkasan,
    status,
    hasil,
  };
  IMPORT_LOG_PRODUK_KOMERSIAL.unshift(entry);

  logRiwayat({
    entityType: 'Import Produk Komersial',
    entityId: entry.importId,
    entityLabel: meta.namaFile ? `Import ${meta.sumber.toUpperCase()} — ${meta.namaFile}` : `Import ${meta.sumber.toUpperCase()}`,
    jenisPerubahan: 'Tambah',
    catatan: `Total ${ringkasan.total} · Berhasil ${ringkasan.berhasil} · Diperbarui ${ringkasan.diperbarui} · Dilewati ${ringkasan.dilewati} · Gagal ${ringkasan.gagal}`,
  });

  return entry;
}

// ─── Query Log Import ─────────────────────────────────────────────────────────

export function getImportLog(): ImportLogEntry[] {
  return IMPORT_LOG_PRODUK_KOMERSIAL;
}

export function getImportLogById(importId: string): ImportLogEntry | undefined {
  return IMPORT_LOG_PRODUK_KOMERSIAL.find(e => e.importId === importId);
}
