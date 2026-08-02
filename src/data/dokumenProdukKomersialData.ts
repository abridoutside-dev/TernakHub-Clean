// ─── PK-011: Dokumen & Referensi — Produk Komersial ──────────────────────────
// Living Database khusus untuk dokumen pendukung/referensi resmi tiap Produk
// Komersial (Brosur, Product Data Sheet, Technical Data Sheet, Safety Data
// Sheet, Sertifikat, Label Kemasan, Foto Produk, Dokumen lainnya).
//
// Relasi murni via UUID Produk (`produkId`) — TIDAK bergantung pada kategori,
// sehingga berlaku untuk Konsentrat maupun kategori Produk Komersial lain di
// masa depan tanpa perubahan struktur. `produkId` merujuk ke UUID entitas
// "produk" yang sama dipakai lintas modul PK: KonsentratSeri.uuid (juga =
// KonsentratDetail.seriId) untuk Konsentrat, atau ProdukKomersialItem.id untuk
// kategori lain — identik dengan `ProdukKomersialDashboardItem.uuid` (PK-010).
//
// TIDAK mengubah arsitektur aplikasi, Master Pakan, Formula, Stok, atau modul
// lain. TIDAK ada OCR maupun ekstraksi AI — murni penyimpanan metadata
// dokumen sebagai referensi, siap dipakai AI/Knowledge Base di masa depan.

import { assertAdmin, logRiwayat } from './produkKomersialLivingDB';
import { KONSENTRAT_SERI_UUID, KONSENTRAT_SERI_LIST } from './konsentratSeriData';
import { PRODUK_KOMERSIAL_LIST } from './produkKomersialData';
import { getTodayISO as todayISO } from '../utils/dateUtils';

// ─── Jenis & Sumber Dokumen ───────────────────────────────────────────────────

export const JENIS_DOKUMEN_OPTIONS = [
  'Brosur Produk',
  'Product Data Sheet',
  'Technical Data Sheet',
  'Safety Data Sheet',
  'Sertifikat',
  'Label Kemasan',
  'Foto Produk',
  'Dokumen Lainnya',
] as const;

export type JenisDokumen = typeof JENIS_DOKUMEN_OPTIONS[number];

export const SUMBER_DOKUMEN_OPTIONS = [
  'Website Resmi Produsen',
  'Distributor Resmi',
  'Diunggah Admin',
] as const;

export type SumberDokumen = typeof SUMBER_DOKUMEN_OPTIONS[number];

// ─── Bentuk Data Dokumen ──────────────────────────────────────────────────────

export interface DokumenProdukKomersial {
  /** UUID permanen dokumen (PK-000A). */
  uuid: string;
  /** UUID Produk yang direferensikan (lihat catatan relasi di atas). */
  produkId: string;
  namaDokumen: string;
  jenisDokumen: JenisDokumen;
  formatFile: string;   // mis. "PDF", "JPG", "DOCX"
  ukuranFile: string;   // mis. "2.4 MB" — disimpan sebagai teks bebas (prototipe tanpa upload biner sungguhan)
  bahasa: string;       // mis. "Indonesia", "Inggris"
  tanggalTerbit?: string; // ISO date — opsional, sesuai ketersediaan
  versiDokumen?: string;  // opsional
  statusAktif: boolean;
  sumber: SumberDokumen;
  /** Lokasi/tautan dokumen (URL resmi atau referensi berkas yang diunggah). */
  url?: string;
  catatan?: string;
  updatedAt: string;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Validasi integritas referensial: `produkId` harus benar-benar merujuk ke
 * produk yang ada di Living Database (Seri Konsentrat atau item kategori
 * lain) — mencegah tautan ke UUID palsu/tidak dikenal bila API dipanggil di
 * luar alur UI Admin yang sudah membatasi pilihan lewat dropdown.
 */
function isProdukIdValid(produkId: string): boolean {
  return KONSENTRAT_SERI_LIST.some(s => s.uuid === produkId)
    || PRODUK_KOMERSIAL_LIST.some(i => i.id === produkId);
}

// ─── Living Database ──────────────────────────────────────────────────────────
// Seed contoh — mengikuti UUID Seri Konsentrat nyata (CP 144, dari
// konsentratSeriData.ts) sekadar contoh awal; TIDAK ada data hardcode yang
// dipakai untuk penghitungan lain di luar daftar dokumen itu sendiri.

export const DOKUMEN_PRODUK_KOMERSIAL_LIST: DokumenProdukKomersial[] = [
  {
    uuid: generateUUID(),
    produkId: KONSENTRAT_SERI_UUID['cp-144'],
    namaDokumen: 'Brosur CP 144',
    jenisDokumen: 'Brosur Produk',
    formatFile: 'PDF',
    ukuranFile: '1.8 MB',
    bahasa: 'Indonesia',
    tanggalTerbit: '2025-11-01',
    versiDokumen: 'v2',
    statusAktif: true,
    sumber: 'Website Resmi Produsen',
    url: 'https://www.cp.co.id/brosur/cp-144.pdf',
    updatedAt: '2026-05-15',
  },
];

// ─── Getter Lookups ───────────────────────────────────────────────────────────

/** Seluruh dokumen milik satu produk (UUID Produk), aktif maupun tidak, terbaru dulu. */
export function getDokumenByProdukId(produkId: string): DokumenProdukKomersial[] {
  return DOKUMEN_PRODUK_KOMERSIAL_LIST
    .filter(d => d.produkId === produkId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Hanya dokumen berstatus aktif milik satu produk — dipakai tampilan Pengguna. */
export function getDokumenAktifByProdukId(produkId: string): DokumenProdukKomersial[] {
  return getDokumenByProdukId(produkId).filter(d => d.statusAktif);
}

export function getDokumenByUUID(uuid: string): DokumenProdukKomersial | undefined {
  return DOKUMEN_PRODUK_KOMERSIAL_LIST.find(d => d.uuid === uuid);
}

export function getAllDokumen(): DokumenProdukKomersial[] {
  return DOKUMEN_PRODUK_KOMERSIAL_LIST;
}

export function getJumlahDokumenByProdukId(produkId: string): number {
  return getDokumenByProdukId(produkId).length;
}

// ─── CRUD (Admin) ─────────────────────────────────────────────────────────────

export type NovaDokumen = Omit<DokumenProdukKomersial, 'uuid' | 'updatedAt'>;

/** Tambah dokumen baru untuk sebuah produk. Hanya Admin. */
export function addDokumen(data: NovaDokumen, catatan?: string): DokumenProdukKomersial {
  assertAdmin('menambah Dokumen & Referensi');
  if (!isProdukIdValid(data.produkId)) {
    throw new Error(`produkId tidak dikenali pada Living Database Produk Komersial: ${data.produkId}`);
  }
  const record: DokumenProdukKomersial = { ...data, uuid: generateUUID(), updatedAt: todayISO() };
  DOKUMEN_PRODUK_KOMERSIAL_LIST.push(record);
  logRiwayat({
    entityType: 'Dokumen Pendukung', entityId: record.uuid, entityLabel: record.namaDokumen,
    jenisPerubahan: 'Tambah', catatan, after: record,
  });
  return record;
}

/** Ubah metadata dokumen yang sudah ada. Hanya Admin. */
export function updateDokumen(uuid: string, patch: Partial<Omit<DokumenProdukKomersial, 'uuid' | 'produkId'>>, catatan?: string): DokumenProdukKomersial | undefined {
  assertAdmin('mengubah Dokumen & Referensi');
  const idx = DOKUMEN_PRODUK_KOMERSIAL_LIST.findIndex(d => d.uuid === uuid);
  if (idx === -1) return undefined;
  const before = DOKUMEN_PRODUK_KOMERSIAL_LIST[idx];
  const updated: DokumenProdukKomersial = { ...before, ...patch, uuid, updatedAt: todayISO() };
  DOKUMEN_PRODUK_KOMERSIAL_LIST[idx] = updated;
  logRiwayat({
    entityType: 'Dokumen Pendukung', entityId: uuid, entityLabel: updated.namaDokumen,
    jenisPerubahan: 'Ubah', catatan, before, after: updated,
  });
  return updated;
}

/** Hapus dokumen. Hanya Admin. Riwayat perubahan tetap tersimpan meski record dihapus. */
export function deleteDokumen(uuid: string, catatan?: string): boolean {
  assertAdmin('menghapus Dokumen & Referensi');
  const idx = DOKUMEN_PRODUK_KOMERSIAL_LIST.findIndex(d => d.uuid === uuid);
  if (idx === -1) return false;
  const [removed] = DOKUMEN_PRODUK_KOMERSIAL_LIST.splice(idx, 1);
  logRiwayat({
    entityType: 'Dokumen Pendukung', entityId: uuid, entityLabel: removed.namaDokumen,
    jenisPerubahan: 'Hapus', catatan, before: removed,
  });
  return true;
}
