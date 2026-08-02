// ─── Master Pakan — Daun-daunan ───────────────────────────────────────────────
// MP-010: List data for Daun-daunan sub-category.
// Excludes items already present in Leguminosa (e.g. Daun Singkong).
// Detail data (nutrisi, harga, referensi) is NOT included in this phase.

export interface DaunanItem {
  id: string;
  nama: string;
  namaLatin: string;
}

export const DAUNAN_LIST: DaunanItem[] = [
  { id: 'daun-pisang',     nama: 'Daun Pisang',     namaLatin: 'Musa spp.' },
  { id: 'daun-pepaya',     nama: 'Daun Pepaya',     namaLatin: 'Carica papaya' },
  { id: 'daun-tebu',       nama: 'Daun Tebu',       namaLatin: 'Saccharum officinarum' },
  { id: 'daun-jagung',     nama: 'Daun Jagung',     namaLatin: 'Zea mays' },
  { id: 'daun-nanas',      nama: 'Daun Nanas',      namaLatin: 'Ananas comosus' },
  { id: 'daun-talas',      nama: 'Daun Talas',      namaLatin: 'Colocasia esculenta' },
  { id: 'daun-ubi-jalar',  nama: 'Daun Ubi Jalar',  namaLatin: 'Ipomoea batatas' },
  { id: 'daun-sukun',      nama: 'Daun Sukun',      namaLatin: 'Artocarpus altilis' },
  { id: 'daun-katuk',      nama: 'Daun Katuk',      namaLatin: 'Sauropus androgynus' },
  { id: 'daun-waru',       nama: 'Daun Waru',       namaLatin: 'Hibiscus tiliaceus' },
  { id: 'daun-randu',      nama: 'Daun Randu',      namaLatin: 'Ceiba pentandra' },
  { id: 'daun-bambu',      nama: 'Daun Bambu',      namaLatin: 'Bambusa spp.' },
  { id: 'daun-sengon',     nama: 'Daun Sengon',     namaLatin: 'Falcataria moluccana' },
  { id: 'daun-jati',       nama: 'Daun Jati',       namaLatin: 'Tectona grandis' },
  { id: 'daun-mahoni',     nama: 'Daun Mahoni',     namaLatin: 'Swietenia macrophylla' },
  { id: 'daun-labu',       nama: 'Daun Labu',       namaLatin: 'Cucurbita moschata' },
  { id: 'daun-semangka',   nama: 'Daun Semangka',   namaLatin: 'Citrullus lanatus' },
  { id: 'daun-melon',      nama: 'Daun Melon',      namaLatin: 'Cucumis melo' },
  { id: 'daun-mentimun',   nama: 'Daun Mentimun',   namaLatin: 'Cucumis sativus' },
  { id: 'daun-terong',     nama: 'Daun Terong',     namaLatin: 'Solanum melongena' },
  { id: 'daun-cabai',      nama: 'Daun Cabai',      namaLatin: 'Capsicum annuum' },
  { id: 'daun-okra',       nama: 'Daun Okra',       namaLatin: 'Abelmoschus esculentus' },
];

export function getDaunanList(): DaunanItem[] {
  return DAUNAN_LIST;
}

export function getDaunanById(id: string): DaunanItem | undefined {
  return DAUNAN_LIST.find(item => item.id === id);
}
