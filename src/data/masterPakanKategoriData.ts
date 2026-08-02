// ─── Master Pakan — Level 1: Kategori Induk ──────────────────────────────────
// This is the parent-category registry for the Master Pakan database reference.
// Sub-categories (Level 2) and individual items (Level 3) will be added in
// subsequent implementation phases.

// Literal union of every kategori induk slug — keeping this in sync with
// KATEGORI_INDUK lets consumers (e.g. masterPakanCounts.ts) get a compile-time
// error if a slug is added/renamed without updating its dependents.
export type KategoriSlug =
  | 'jagung' | 'padi' | 'rumput' | 'leguminosa' | 'daun-daunan'
  | 'kacang-biji-bijian' | 'umbi-umbian' | 'serealia-lain' | 'kelapa'
  | 'kelapa-sawit' | 'tebu' | 'buah-limbah-buah' | 'limbah-industri-pangan'
  | 'sumber-protein-hewani' | 'mineral' | 'vitamin-feed-additive'
  | 'bahan-cair' | 'lainnya';

export interface KategoriInduk {
  slug: KategoriSlug;  // URL-safe identifier
  icon: string;
  nama: string;
  deskripsi: string;
  jumlahItem: number;  // will be populated when sub-categories are implemented
  color: string;       // accent color
  bg: string;          // background color
}

export const KATEGORI_INDUK: KategoriInduk[] = [
  {
    slug: 'jagung',
    icon: '🌽',
    nama: 'Jagung',
    deskripsi: 'Biji jagung dan seluruh produk turunannya sebagai sumber energi utama ransum ternak.',
    jumlahItem: 0,
    color: '#e65100',
    bg: '#fff3e0',
  },
  {
    slug: 'padi',
    icon: '🌾',
    nama: 'Padi',
    deskripsi: 'Padi dan hasil sampingnya termasuk dedak, sekam, dan jerami sebagai bahan pakan serat.',
    jumlahItem: 0,
    color: '#7b5e2a',
    bg: '#fff8e1',
  },
  {
    slug: 'rumput',
    icon: '🌱',
    nama: 'Rumput',
    deskripsi: 'Berbagai jenis rumput pakan hijauan segar maupun kering untuk ruminansia.',
    jumlahItem: 0,
    color: '#1b7a43',
    bg: '#e8f5ee',
  },
  {
    slug: 'leguminosa',
    icon: '🍀',
    nama: 'Leguminosa',
    deskripsi: 'Tanaman polong berprotein tinggi seperti gamal, lamtoro, dan kaliandra.',
    jumlahItem: 0,
    color: '#2e7d32',
    bg: '#e8f5e9',
  },
  {
    slug: 'daun-daunan',
    icon: '🌿',
    nama: 'Daun-daunan',
    deskripsi: 'Daun dari berbagai tanaman yang dimanfaatkan sebagai pakan sumber serat dan protein.',
    jumlahItem: 0,
    color: '#558b2f',
    bg: '#f1f8e9',
  },
  {
    slug: 'kacang-biji-bijian',
    icon: '🥜',
    nama: 'Kacang-kacangan',
    deskripsi: 'Biji kacang dan bungkil kacang sebagai sumber protein dan energi nabati.',
    jumlahItem: 0,
    color: '#a0522d',
    bg: '#fbe9e7',
  },
  {
    slug: 'umbi-umbian',
    icon: '🍠',
    nama: 'Umbi-umbian',
    deskripsi: 'Singkong, ubi jalar, dan umbi lainnya sebagai sumber karbohidrat non-serat.',
    jumlahItem: 0,
    color: '#bf360c',
    bg: '#fbe9e7',
  },
  {
    slug: 'serealia-lain',
    icon: '🌾',
    nama: 'Serealia Lain',
    deskripsi: 'Gandum, jelai, oat, dan biji-bijian serealia lain selain jagung dan padi.',
    jumlahItem: 0,
    color: '#6d4c41',
    bg: '#efebe9',
  },
  {
    slug: 'kelapa',
    icon: '🥥',
    nama: 'Kelapa',
    deskripsi: 'Kelapa dan produk turunannya termasuk bungkil kopra dan air kelapa.',
    jumlahItem: 0,
    color: '#5d4037',
    bg: '#efebe9',
  },
  {
    slug: 'kelapa-sawit',
    icon: '🌴',
    nama: 'Kelapa Sawit',
    deskripsi: 'Produk samping industri sawit: bungkil inti sawit, serat perasan, dan solid decanter.',
    jumlahItem: 0,
    color: '#e65100',
    bg: '#fff3e0',
  },
  {
    slug: 'tebu',
    icon: '🎋',
    nama: 'Tebu',
    deskripsi: 'Molases, ampas tebu (bagasse), dan pucuk tebu sebagai sumber energi fermentable.',
    jumlahItem: 0,
    color: '#f9a825',
    bg: '#fffde7',
  },
  {
    slug: 'buah-limbah-buah',
    icon: '🍌',
    nama: 'Buah & Limbah Buah',
    deskripsi: 'Buah afkir, kulit buah, dan ampas pengolahan buah untuk diversifikasi pakan.',
    jumlahItem: 0,
    color: '#f57f17',
    bg: '#fff9c4',
  },
  {
    slug: 'limbah-industri-pangan',
    icon: '🏭',
    nama: 'Limbah Industri Pangan',
    deskripsi: 'Ampas tahu, onggok, vinasse, dan by-product industri pengolahan pangan lainnya.',
    jumlahItem: 0,
    color: '#546e7a',
    bg: '#eceff1',
  },
  {
    slug: 'sumber-protein-hewani',
    icon: '🐟',
    nama: 'Sumber Protein Hewani',
    deskripsi: 'Tepung ikan, tepung darah, dan produk hewani lain sebagai suplemen protein tinggi.',
    jumlahItem: 0,
    color: '#0277bd',
    bg: '#e1f5fe',
  },
  {
    slug: 'mineral',
    icon: '🧂',
    nama: 'Mineral',
    deskripsi: 'Mineral makro dan mikro esensial: kapur, fosfat, garam, premix mineral, dan trace mineral.',
    jumlahItem: 0,
    color: '#0288d1',
    bg: '#e1f5fe',
  },
  {
    slug: 'vitamin-feed-additive',
    icon: '💊',
    nama: 'Vitamin & Feed Additive',
    deskripsi: 'Suplemen vitamin, probiotik, enzim, dan aditif pakan untuk optimasi performa ternak.',
    jumlahItem: 0,
    color: '#6a1b9a',
    bg: '#f3e5f5',
  },
  {
    slug: 'bahan-cair',
    icon: '💧',
    nama: 'Bahan Cair',
    deskripsi: 'Bahan pakan berbentuk cair: molases cair, minyak nabati, dan suplemen cair lainnya.',
    jumlahItem: 0,
    color: '#00838f',
    bg: '#e0f7fa',
  },
  {
    slug: 'lainnya',
    icon: '📦',
    nama: 'Lainnya',
    deskripsi: 'Bahan pakan yang tidak masuk kategori utama di atas, termasuk NPN dan bahan khusus.',
    jumlahItem: 0,
    color: '#455a64',
    bg: '#eceff1',
  },
];

export function getKategoriBySlug(slug: string): KategoriInduk | undefined {
  return KATEGORI_INDUK.find(k => k.slug === slug);
}
