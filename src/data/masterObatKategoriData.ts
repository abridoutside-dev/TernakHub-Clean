// ─── Master Obat — Level 1: Kategori Induk ───────────────────────────────────
// Kategori induk untuk database referensi Master Obat.
// Mengikuti pola masterPakanKategoriData.ts.

export type ObatKategoriSlug =
  | 'antibiotik' | 'antiparasit' | 'vitamin' | 'vaksin'
  | 'antiseptik' | 'anti-inflamasi' | 'hormon' | 'suplemen' | 'lainnya';

// Alias for consumers expecting KategoriObatSlug naming convention.
export type KategoriObatSlug = ObatKategoriSlug;

export interface ObatKategori {
  uuid: string;
  slug: ObatKategoriSlug;
  icon: string;
  nama: string;
  deskripsi: string;
  color: string;
  bg: string;
  status: 'Aktif' | 'Nonaktif';
}

// Alias for consumers expecting KategoriObat naming convention.
export type KategoriObat = ObatKategori;

// UUIDs follow pattern a1b2c3d4-000N-4a3b-9c5f-000000000001 (N=1..9).
// antibiotik UUID MUST stay a1b2c3d4-0001-4a3b-9c5f-000000000001 — it is
// hard-referenced by masterObatSubKategoriData.ts seed data.
export const KATEGORI_OBAT: ObatKategori[] = [
  {
    uuid: 'a1b2c3d4-0001-4a3b-9c5f-000000000001',
    slug: 'antibiotik',
    icon: '🦠',
    nama: 'Antibiotik',
    deskripsi: 'Agen antimikroba untuk penanganan infeksi bakteri pada ternak, mencakup tetrasiklin, beta-laktam, fluorokuinolon, dan makrolid.',
    color: '#c62828',
    bg: '#ffebee',
    status: 'Aktif',
  },
  {
    uuid: 'a1b2c3d4-0002-4a3b-9c5f-000000000001',
    slug: 'antiparasit',
    icon: '🔬',
    nama: 'Antiparasit',
    deskripsi: 'Obat untuk pengendalian parasit internal (cacing, protozoa) dan eksternal (ektoparasit) pada ternak ruminansia dan unggas.',
    color: '#6a1b9a',
    bg: '#f3e5f5',
    status: 'Aktif',
  },
  {
    uuid: 'a1b2c3d4-0003-4a3b-9c5f-000000000001',
    slug: 'vitamin',
    icon: '💊',
    nama: 'Vitamin',
    deskripsi: 'Suplemen vitamin larut air dan larut lemak untuk mendukung kesehatan, pertumbuhan, reproduksi, dan imunitas ternak.',
    color: '#1b7a43',
    bg: '#e8f5ee',
    status: 'Aktif',
  },
  {
    uuid: 'a1b2c3d4-0004-4a3b-9c5f-000000000001',
    slug: 'vaksin',
    icon: '💉',
    nama: 'Vaksin',
    deskripsi: 'Vaksin biologis untuk pencegahan penyakit menular pada ternak, termasuk vaksin bakteri, virus, dan toksin.',
    color: '#0277bd',
    bg: '#e1f5fe',
    status: 'Aktif',
  },
  {
    uuid: 'a1b2c3d4-0005-4a3b-9c5f-000000000001',
    slug: 'antiseptik',
    icon: '🧴',
    nama: 'Antiseptik',
    deskripsi: 'Agen antiseptik dan desinfektan untuk perawatan luka, sanitasi kandang, dan pencegahan infeksi topikal.',
    color: '#00695c',
    bg: '#e0f2f1',
    status: 'Aktif',
  },
  {
    uuid: 'a1b2c3d4-0006-4a3b-9c5f-000000000001',
    slug: 'anti-inflamasi',
    icon: '🌡️',
    nama: 'Anti Inflamasi',
    deskripsi: 'NSAID dan kortikosteroid untuk pengendalian nyeri, demam, dan peradangan pada berbagai kondisi klinis ternak.',
    color: '#e65100',
    bg: '#fff3e0',
    status: 'Aktif',
  },
  {
    uuid: 'a1b2c3d4-0007-4a3b-9c5f-000000000001',
    slug: 'hormon',
    icon: '⚗️',
    nama: 'Hormon',
    deskripsi: 'Hormon reproduksi dan metabolik untuk sinkronisasi estrus, induksi partus, penanganan retensi plasenta, dan optimasi produksi.',
    color: '#ad1457',
    bg: '#fce4ec',
    status: 'Aktif',
  },
  {
    uuid: 'a1b2c3d4-0008-4a3b-9c5f-000000000001',
    slug: 'suplemen',
    icon: '🌿',
    nama: 'Suplemen',
    deskripsi: 'Suplemen nutrisi, probiotik, prebiotik, dan feed additive terapeutik untuk mendukung performa dan kesehatan umum ternak.',
    color: '#558b2f',
    bg: '#f1f8e9',
    status: 'Aktif',
  },
  {
    uuid: 'a1b2c3d4-0009-4a3b-9c5f-000000000001',
    slug: 'lainnya',
    icon: '📦',
    nama: 'Lainnya',
    deskripsi: 'Cairan infus, elektrolit, adsorben, antidot, dan agen terapi lain yang tidak masuk kategori utama di atas.',
    color: '#546e7a',
    bg: '#eceff1',
    status: 'Aktif',
  },
];

// Backward-compat alias used by legacy code that predates the KATEGORI_OBAT rename.
export const OBAT_KATEGORI = KATEGORI_OBAT;

export function getObatKategoriBySlug(slug: string): ObatKategori | undefined {
  return KATEGORI_OBAT.find(k => k.slug === slug);
}

// Alias for consumers expecting getKategoriObatBySlug naming convention.
export const getKategoriObatBySlug = getObatKategoriBySlug;

/** Case-insensitive duplicate check across all Kategori, excluding one UUID (for edit). */
export function isDuplicateKategoriNama(nama: string, excludeUuid?: string): boolean {
  const target = nama.trim().toLowerCase();
  return KATEGORI_OBAT.some(k => k.uuid !== excludeUuid && k.nama.trim().toLowerCase() === target);
}

export interface KategoriObatMutationCheck {
  valid: boolean;
  error?: string;
}

/**
 * Guard for deactivating a Kategori. Currently a permissive stub — no
 * Kategori admin UI exists yet so this is never called from a user action.
 * A future admin page must inject a live Sub Kategori check here without
 * creating a circular import with masterObatSubKategoriData.ts.
 */
export function canDeactivateKategori(_uuid: string): KategoriObatMutationCheck {
  return { valid: true };
}
