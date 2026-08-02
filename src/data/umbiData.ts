// ─── Master Pakan — Umbi-umbian: Sub Kategori ────────────────────────────────
// Level 2 registry: sub-categories within the Umbi-umbian parent category.
// Each entry represents a distinct root/tuber type used as a feed ingredient.

export interface UmbiSubKategori {
  id: string;       // URL-safe slug
  nama: string;
  namaLatin: string;
}

export const UMBI_SUB_KATEGORI: UmbiSubKategori[] = [
  { id: 'singkong',      nama: 'Singkong',          namaLatin: 'Manihot esculenta' },
  { id: 'ubi-jalar',     nama: 'Ubi Jalar',          namaLatin: 'Ipomoea batatas' },
  { id: 'talas',         nama: 'Talas',              namaLatin: 'Colocasia esculenta' },
  { id: 'garut',         nama: 'Garut',              namaLatin: 'Maranta arundinacea' },
  { id: 'ganyong',       nama: 'Ganyong',            namaLatin: 'Canna edulis' },
  { id: 'uwi',           nama: 'Uwi',                namaLatin: 'Dioscorea alata' },
  { id: 'gadung',        nama: 'Gadung',             namaLatin: 'Dioscorea hispida' },
  { id: 'kentang',       nama: 'Kentang',            namaLatin: 'Solanum tuberosum' },
  { id: 'bengkuang',     nama: 'Bengkuang',          namaLatin: 'Pachyrhizus erosus' },
  { id: 'bit-pakan',     nama: 'Bit Pakan (Fodder Beet)', namaLatin: 'Beta vulgaris subsp. vulgaris' },
  { id: 'lobak-pakan',   nama: 'Lobak Pakan',        namaLatin: 'Raphanus sativus' },
  { id: 'wortel-pakan',  nama: 'Wortel Pakan',       namaLatin: 'Daucus carota subsp. sativus' },
  { id: 'ubi-cilembu',   nama: 'Ubi Cilembu',        namaLatin: "Ipomoea batatas 'Cilembu'" },
  { id: 'ubi-ungu',      nama: 'Ubi Ungu',           namaLatin: 'Ipomoea batatas var. ayamurasaki' },
  { id: 'suweg',         nama: 'Suweg',              namaLatin: 'Amorphophallus paeoniifolius' },
  { id: 'gembili',       nama: 'Gembili',            namaLatin: 'Dioscorea esculenta' },
  { id: 'kimpul',        nama: 'Kimpul',             namaLatin: 'Xanthosoma sagittifolium' },
  { id: 'porang',        nama: 'Porang',             namaLatin: 'Amorphophallus muelleri' },
  { id: 'ubi-kelapa',    nama: 'Ubi Kelapa',         namaLatin: 'Dioscorea rotundata' },
  { id: 'ganyong-merah', nama: 'Ganyong Merah',      namaLatin: 'Canna discolor' },
];

export function getUmbiSubKategoriList(): UmbiSubKategori[] {
  return UMBI_SUB_KATEGORI;
}

export function getUmbiById(id: string): UmbiSubKategori | undefined {
  return UMBI_SUB_KATEGORI.find(u => u.id === id);
}
