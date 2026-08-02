// ─── Master Pakan — Kacang & Biji-bijian ─────────────────────────────────────
// MP-012: List data for Kacang & Biji-bijian sub-category.
// Single raw-material seeds/beans only. Excludes items already present in
// Jagung, Padi, or Leguminosa categories, and excludes any processed/Formula
// Pakan products (bungkil, tepung, fermentasi, konsentrat, TMR, campuran).

export interface KacangBijianItem {
  id: string;
  nama: string;
  namaLatin: string;
}

export const KACANG_BIJIAN_LIST: KacangBijianItem[] = [
  { id: 'kedelai',              nama: 'Kedelai',              namaLatin: 'Glycine max' },
  { id: 'kacang-tanah-biji',    nama: 'Kacang Tanah (Biji)',  namaLatin: 'Arachis hypogaea' },
  { id: 'kacang-hijau-biji',    nama: 'Kacang Hijau',         namaLatin: 'Vigna radiata' },
  { id: 'kacang-tunggak-biji',  nama: 'Kacang Tunggak',       namaLatin: 'Vigna unguiculata' },
  { id: 'kacang-merah',         nama: 'Kacang Merah',         namaLatin: 'Phaseolus vulgaris' },
  { id: 'kacang-hitam',         nama: 'Kacang Hitam',         namaLatin: 'Vigna mungo' },
  { id: 'kacang-bogor',         nama: 'Kacang Bogor',         namaLatin: 'Vigna subterranea' },
  { id: 'kacang-gude',          nama: 'Kacang Gude',          namaLatin: 'Cajanus cajan' },
  { id: 'kacang-komak',         nama: 'Kacang Komak',         namaLatin: 'Lablab purpureus' },
  { id: 'kacang-koro-pedang',   nama: 'Kacang Koro Pedang',   namaLatin: 'Canavalia ensiformis' },
  { id: 'kacang-arab',          nama: 'Kacang Arab',          namaLatin: 'Cicer arietinum' },
  { id: 'kacang-lentil',        nama: 'Kacang Lentil',        namaLatin: 'Lens culinaris' },
  { id: 'biji-kapuk',           nama: 'Biji Kapuk',           namaLatin: 'Ceiba pentandra' },
  { id: 'biji-bunga-matahari',  nama: 'Biji Bunga Matahari',  namaLatin: 'Helianthus annuus' },
  { id: 'biji-wijen',           nama: 'Biji Wijen',           namaLatin: 'Sesamum indicum' },
  { id: 'biji-rami',            nama: 'Biji Rami (Flaxseed)', namaLatin: 'Linum usitatissimum' },
  { id: 'biji-chia',            nama: 'Biji Chia',            namaLatin: 'Salvia hispanica' },
  { id: 'biji-labu',            nama: 'Biji Labu',            namaLatin: 'Cucurbita pepo' },
  { id: 'biji-kecipir',         nama: 'Biji Kecipir',         namaLatin: 'Psophocarpus tetragonolobus' },
  { id: 'sorgum',               nama: 'Sorgum',               namaLatin: 'Sorghum bicolor' },
  { id: 'jewawut',              nama: 'Jewawut (Millet)',     namaLatin: 'Setaria italica' },
];

export function getKacangBijianList(): KacangBijianItem[] {
  return KACANG_BIJIAN_LIST;
}

export function getKacangBijianById(id: string): KacangBijianItem | undefined {
  return KACANG_BIJIAN_LIST.find(item => item.id === id);
}
