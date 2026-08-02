// ─── Master Pakan — Picker Aggregator ────────────────────────────────────────
// Single-source aggregator untuk catalog picker di TambahStokPakan.tsx.
// Menggabungkan seluruh 18 kategori induk Master Pakan terbaru ke dalam
// satu list item siap-pakai.
//
// Setiap item membawa:
//   referensiId  — id unik item dari database sumber
//   nama         — nama item
//   kategori     — nama kategori induk (dari KATEGORI_INDUK)
//   kategoriSlug — slug kategori induk (untuk lookup lanjutan)
//   subKategori  — nama sub-kategori (KategoriItem pada item)
//   satuan       — diambil dari SATUAN_DEFAULT_PER_KATEGORI (SSOT), atau
//                  field satuan item jika tersedia
//   icon         — emoji dari KATEGORI_INDUK

import { KATEGORI_INDUK, type KategoriSlug } from './masterPakanKategoriData';

import { JAGUNG_DB }                 from './jagungData';
import { PADI_DB }                   from './padiData';
import { RUMPUT_DB }                 from './rumputData';
import { LEGUMINOSA_LIST }           from './leguminosaData';
import { DAUNAN_LIST }               from './daunanData';
import { KACANG_BIJIAN_LIST }        from './kacangBijianData';
import { UMBI_SUB_KATEGORI }         from './umbiData';
import { SEREALIA_LIST }             from './serealiaData';
import { KELAPA_DB }                 from './kelapaData';
import { KELAPA_SAWIT_DB }           from './kelapaSawitData';
import { TEBU_DB }                   from './tebuData';
import { BUAH_LIMBAH_BUAH_DB }       from './buahLimbahBuahData';
import { LIMBAH_INDUSTRI_DB }        from './limbahIndustriPanganData';
import { SUMBER_PROTEIN_HEWANI_DB }  from './sumberProteinHewaniData';
import { MINERAL_DB }                from './mineralData';
import { VITAMIN_FEED_ADDITIVE_DB }  from './vitaminFeedAdditiveData';
import { BAHAN_CAIR_DB }             from './bahanCairData';
import { LAINNYA_DB }                from './lainnyaData';

// ─── Exported shape ───────────────────────────────────────────────────────────

export interface MasterPakanPickerItem {
  referensiId:  string;        // id unik dari database sumber
  nama:         string;        // nama bahan pakan
  kategori:     string;        // nama kategori induk, misal 'Jagung'
  kategoriSlug: KategoriSlug;  // slug kategori induk, misal 'jagung'
  subKategori:  string;        // nama sub-kategori, misal 'Hasil Utama'
  satuan:       string;        // dari SATUAN_DEFAULT_PER_KATEGORI, atau field satuan item jika tersedia
  icon:         string;        // emoji dari KATEGORI_INDUK
  namaLain?:    string;        // alias / nama alternatif (untuk keperluan search)
}

// ─── Satuan default per kategori (SSOT) ──────────────────────────────────────
// Satuan berasal dari field harga referensi masing-masing data sumber:
//   • IDR/kg  → 'kg'   (seluruh bahan kering/padat)
//   • IDR/liter → 'liter' (bahanCairData.ts)
//
// Tambahkan entri baru di sini jika kategori baru ditambahkan ke KategoriSlug.
// Jangan hardcode satuan di luar konstanta ini.
export const SATUAN_DEFAULT_PER_KATEGORI: Record<KategoriSlug, string> = {
  // ── Serealia & Biji-bijian ─────────────────────────────────────────────────
  'jagung':                 'kg',  // jagungData.ts              — IDR/kg
  'padi':                   'kg',  // padiData.ts                — IDR/kg
  'serealia-lain':          'kg',  // serealiaData.ts            — IDR/kg
  'kacang-biji-bijian':     'kg',  // kacangBijianData.ts        — IDR/kg
  // ── Hijauan & Daun ────────────────────────────────────────────────────────
  'rumput':                 'kg',  // rumputData.ts              — IDR/kg
  'leguminosa':             'kg',  // leguminosaData.ts          — IDR/kg
  'daun-daunan':            'kg',  // daunanData.ts              — IDR/kg
  // ── Umbi ──────────────────────────────────────────────────────────────────
  'umbi-umbian':            'kg',  // umbiData.ts                — IDR/kg
  // ── Hasil Perkebunan ──────────────────────────────────────────────────────
  'kelapa':                 'kg',  // kelapaData.ts              — IDR/kg
  'kelapa-sawit':           'kg',  // kelapaSawitData.ts         — IDR/kg
  'tebu':                   'kg',  // tebuData.ts                — IDR/kg
  // ── Buah & Limbah ─────────────────────────────────────────────────────────
  'buah-limbah-buah':       'kg',  // buahLimbahBuahData.ts      — IDR/kg
  'limbah-industri-pangan': 'kg',  // limbahIndustriPanganData.ts — IDR/kg
  // ── Protein Hewani ────────────────────────────────────────────────────────
  'sumber-protein-hewani':  'kg',  // sumberProteinHewaniData.ts — IDR/kg
  // ── Suplemen & Aditif ─────────────────────────────────────────────────────
  'mineral':                'kg',  // mineralData.ts             — IDR/kg
  'vitamin-feed-additive':  'kg',  // vitaminFeedAdditiveData.ts — IDR/kg
  // ── Bahan Cair ────────────────────────────────────────────────────────────
  'bahan-cair':             'liter', // bahanCairData.ts         — IDR/liter
  // ── Lainnya ───────────────────────────────────────────────────────────────
  'lainnya':                'kg',  // lainnyaData.ts             — IDR/kg
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

// Lookup map: slug → KategoriInduk (build once at module load)
const KATEGORI_MAP = new Map(KATEGORI_INDUK.map(k => [k.slug, k]));

/**
 * Minimal interface yang dimiliki oleh hampir semua item database kategori.
 * `kategoriItem` bersifat opsional karena UMBI_SUB_KATEGORI tidak memilikinya.
 * `satuan` opsional karena hanya JagungItem yang mendefinisikannya secara eksplisit.
 */
interface PickerRawItem {
  id:           string;
  nama:         string;
  kategoriItem?: string;
  satuan?:      string;
  namaLain?:    string | null;  // alias dari database sumber (untuk search)
}

/**
 * Petakan satu database kategori ke array MasterPakanPickerItem.
 *
 * @param slug             Slug kategori induk (harus cocok dengan KATEGORI_INDUK)
 * @param items            Array item dari database kategori yang bersangkutan
 * @param fallbackSubKat   Sub-kategori default jika item tidak punya `kategoriItem`
 */
function buildSection(
  slug:            KategoriSlug,
  items:           PickerRawItem[],
  fallbackSubKat = '',
): MasterPakanPickerItem[] {
  const kat = KATEGORI_MAP.get(slug);
  if (!kat) return [];

  // Satuan diambil dari SATUAN_DEFAULT_PER_KATEGORI (SSOT)
  const defaultSatuan = SATUAN_DEFAULT_PER_KATEGORI[slug];

  return items.map(item => ({
    referensiId:  item.id,
    nama:         item.nama,
    kategori:     kat.nama,
    kategoriSlug: slug,
    subKategori:  item.kategoriItem ?? fallbackSubKat,
    satuan:       item.satuan ?? defaultSatuan,
    icon:         kat.icon,
    ...(item.namaLain ? { namaLain: item.namaLain } : {}),
  }));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Menggabungkan seluruh 18 database kategori Master Pakan terbaru ke dalam
 * satu flat list siap digunakan oleh ReferensiPickerSheet.
 *
 * Urutan mengikuti urutan KATEGORI_INDUK (jagung → lainnya).
 */
export function buildAllMasterPakanPickerItems(): MasterPakanPickerItem[] {
  return [
    // ── Serealia & Biji-bijian ──────────────────────────────────────────────
    ...buildSection('jagung',                JAGUNG_DB               as PickerRawItem[]),
    ...buildSection('padi',                  PADI_DB                 as PickerRawItem[]),
    ...buildSection('serealia-lain',         SEREALIA_LIST           as PickerRawItem[]),
    ...buildSection('kacang-biji-bijian',    KACANG_BIJIAN_LIST      as PickerRawItem[]),

    // ── Hijauan & Daun ─────────────────────────────────────────────────────
    ...buildSection('rumput',                RUMPUT_DB               as PickerRawItem[]),
    ...buildSection('leguminosa',            LEGUMINOSA_LIST         as PickerRawItem[]),
    ...buildSection('daun-daunan',           DAUNAN_LIST             as PickerRawItem[]),

    // ── Umbi — struktur berbeda: tidak ada kategoriItem; tiap entri adalah
    //   sub-kategori umbi (misal Singkong, Ubi Jalar, dst.)
    ...buildSection('umbi-umbian',           UMBI_SUB_KATEGORI       as PickerRawItem[], 'Umbi-umbian'),

    // ── Hasil Perkebunan ────────────────────────────────────────────────────
    ...buildSection('kelapa',                KELAPA_DB               as PickerRawItem[]),
    ...buildSection('kelapa-sawit',          KELAPA_SAWIT_DB         as PickerRawItem[]),
    ...buildSection('tebu',                  TEBU_DB                 as PickerRawItem[]),

    // ── Buah & Limbah ───────────────────────────────────────────────────────
    ...buildSection('buah-limbah-buah',      BUAH_LIMBAH_BUAH_DB     as PickerRawItem[]),
    ...buildSection('limbah-industri-pangan',LIMBAH_INDUSTRI_DB      as PickerRawItem[]),

    // ── Protein Hewani ──────────────────────────────────────────────────────
    ...buildSection('sumber-protein-hewani', SUMBER_PROTEIN_HEWANI_DB as PickerRawItem[]),

    // ── Suplemen & Aditif ───────────────────────────────────────────────────
    ...buildSection('mineral',               MINERAL_DB              as PickerRawItem[]),
    ...buildSection('vitamin-feed-additive', VITAMIN_FEED_ADDITIVE_DB as PickerRawItem[]),

    // ── Bahan Cair (satuan Liter) ───────────────────────────────────────────
    ...buildSection('bahan-cair',            BAHAN_CAIR_DB           as PickerRawItem[]),

    // ── Lainnya ─────────────────────────────────────────────────────────────
    ...buildSection('lainnya',               LAINNYA_DB              as PickerRawItem[]),
  ];
}
