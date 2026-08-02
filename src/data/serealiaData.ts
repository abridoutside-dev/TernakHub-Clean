// ─── Master Pakan — Serealia Lain ─────────────────────────────────────────────
// MP-016: List data for "Serealia Lain" sub-category — cereal & pseudo-cereal
// grains used as feed raw material, EXCLUDING Jagung and Padi (own categories)
// and EXCLUDING Sorgum / Jewawut (already covered under Kacang & Biji-bijian).
// Single raw-material grains only — no Formula Pakan / processed products.

export interface SerealiaItem {
  id: string;
  nama: string;
  namaLatin: string;
}

export const SEREALIA_LIST: SerealiaItem[] = [
  { id: 'gandum',         nama: 'Gandum',              namaLatin: 'Triticum aestivum' },
  { id: 'jelai-barley',   nama: 'Jelai (Barley)',      namaLatin: 'Hordeum vulgare' },
  { id: 'oat',            nama: 'Oat',                 namaLatin: 'Avena sativa' },
  { id: 'rye',            nama: 'Rye (Gandum Hitam)',  namaLatin: 'Secale cereale' },
  { id: 'triticale',      nama: 'Triticale',           namaLatin: '× Triticosecale' },
  { id: 'canary-seed',    nama: 'Canary Seed',         namaLatin: 'Phalaris canariensis' },
  { id: 'teff',           nama: 'Teff',                namaLatin: 'Eragrostis tef' },
  { id: 'fonio',          nama: 'Fonio',               namaLatin: 'Digitaria exilis' },
  { id: 'buckwheat',      nama: 'Buckwheat (Soba)',    namaLatin: 'Fagopyrum esculentum' },
  { id: 'quinoa',         nama: 'Quinoa',              namaLatin: 'Chenopodium quinoa' },
  { id: 'amaranth-grain', nama: 'Amaranth Grain',      namaLatin: 'Amaranthus spp.' },
  { id: 'jali',           nama: "Jali (Job's Tears)",  namaLatin: 'Coix lacryma-jobi' },
  { id: 'proso-millet',   nama: 'Proso Millet',        namaLatin: 'Panicum miliaceum' },
  { id: 'pearl-millet',   nama: 'Pearl Millet',        namaLatin: 'Pennisetum glaucum' },
  { id: 'spelt',          nama: 'Spelt',               namaLatin: 'Triticum spelta' },
  { id: 'emmer-wheat',    nama: 'Emmer Wheat',         namaLatin: 'Triticum dicoccum' },
  { id: 'kaniwa',         nama: 'Kañiwa',              namaLatin: 'Chenopodium pallidicaule' },
];

export function getSerealiaList(): SerealiaItem[] {
  return SEREALIA_LIST;
}

export function getSerealiaById(id: string): SerealiaItem | undefined {
  return SEREALIA_LIST.find(item => item.id === id);
}
