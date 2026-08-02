// ─── Master Pakan — Padi Sub Categories ───────────────────────────────────────
// Level 2 reference items for the "Padi" parent category.
// Types are shared with jagungData.ts — same data shape, different crop.
// ⚠️  TIDAK termasuk produk Formula (silase, fermentasi, complete feed, konsentrat).

import type { JagungItem, KategoriItem } from './jagungData';
export type { KategoriItem };

// Re-export the shared style map so MasterPakanPadi.tsx can import from one place
export { KATEGORI_ITEM_STYLE, KATEGORI_ITEM_ALL } from './jagungData';

// Re-export the JagungItem type under an alias for clarity at the call site
export type PadiItem = JagungItem;

// ─── Database ─────────────────────────────────────────────────────────────────

export const PADI_DB: PadiItem[] = [
  // ── Hasil Utama ────────────────────────────────────────────────────────────
  {
    id: 'gabah',
    nama: 'Gabah',
    namaLain: 'Paddy, Rough Rice',
    deskripsi:
      'Butir padi utuh bersama sekam yang belum dikupas. Sumber karbohidrat dan energi yang umum digunakan sebagai pakan ternak unggas dan ruminansia kecil.',
    kategoriItem: 'Hasil Utama',
    estimasiHarga: 5500,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'gabah-kering-panen',
    nama: 'Gabah Kering Panen (GKP)',
    namaLain: 'Harvest Dry Paddy, GKP',
    deskripsi:
      'Gabah yang baru dipanen dengan kadar air 18–25%. Mudah rusak, harus segera digunakan atau dikeringkan lebih lanjut untuk mencegah jamur.',
    kategoriItem: 'Hasil Utama',
    estimasiHarga: 5200,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'gabah-kering-giling',
    nama: 'Gabah Kering Giling (GKG)',
    namaLain: 'Milling Dry Paddy, GKG',
    deskripsi:
      'Gabah dengan kadar air ≤14% yang memenuhi standar penggilingan. Lebih stabil untuk penyimpanan, nilai energi lebih konsisten dibanding GKP.',
    kategoriItem: 'Hasil Utama',
    estimasiHarga: 5800,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },

  // ── Hasil Samping ──────────────────────────────────────────────────────────
  {
    id: 'gabah-afkir',
    nama: 'Gabah Afkir',
    namaLain: 'Cull Paddy, Off-Grade Paddy',
    deskripsi:
      'Gabah yang tidak lolos seleksi mutu: ukuran kecil, hampa, atau kadar air tinggi. Nilai nutrisi lebih rendah namun harga sangat ekonomis untuk pakan ayam kampung.',
    kategoriItem: 'Hasil Samping',
    estimasiHarga: 3000,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'beras-menir',
    nama: 'Beras Menir',
    namaLain: 'Broken Rice, Rice Brokens',
    deskripsi:
      'Pecahan beras berukuran ≥25% dari ukuran normal yang dihasilkan dari proses penggilingan. Nilai nutrisi mendekati beras utuh, palatabilitas tinggi untuk unggas dan babi.',
    kategoriItem: 'Hasil Samping',
    estimasiHarga: 4500,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'menir-pecah',
    nama: 'Menir Pecah',
    namaLain: 'Fine Broken Rice, Brewers Rice',
    deskripsi:
      'Pecahan beras berukuran <25% (lebih halus dari beras menir). Sumber pati tinggi, sangat mudah dicerna, digunakan dalam ransum anak ternak dan unggas.',
    kategoriItem: 'Hasil Samping',
    estimasiHarga: 3800,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },

  // ── Limbah Industri (penggilingan padi) ───────────────────────────────────
  {
    id: 'dedak-padi-kasar',
    nama: 'Dedak Padi Kasar',
    namaLain: 'Coarse Rice Bran, Katul Kasar',
    deskripsi:
      'Lapisan luar beras beserta sebagian sekam halus yang terpisah saat penggilingan kasar. Serat kasar lebih tinggi dari dedak halus; sumber energi dan serat ekonomis.',
    kategoriItem: 'Limbah Industri',
    estimasiHarga: 2500,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'dedak-padi-halus',
    nama: 'Dedak Padi Halus',
    namaLain: 'Fine Rice Bran, Rice Polish Bran',
    deskripsi:
      'Lapisan aleuron dan perikarp luar beras hasil penggilingan halus, tanpa sekam kasar. Lebih kaya protein dan lemak dibanding dedak kasar; lebih disukai untuk ransum ayam.',
    kategoriItem: 'Limbah Industri',
    estimasiHarga: 3000,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'bekatul',
    nama: 'Bekatul',
    namaLain: 'Rice Bran (Premium), Rice Polish',
    deskripsi:
      'Lapisan terdalam sekam (aleuron murni) hasil penyosohan beras putih. Kandungan lemak 15–20%, protein 12–14%; berkualitas tinggi namun mudah tengik — simpan di tempat dingin.',
    kategoriItem: 'Limbah Industri',
    estimasiHarga: 3500,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'sekam-padi',
    nama: 'Sekam Padi',
    namaLain: 'Rice Husk, Rice Hull',
    deskripsi:
      'Kulit keras luar gabah yang terpisah saat penggilingan. Serat kasar sangat tinggi (≥38%), nilai energi rendah — digunakan sebagai litter kandang, campuran kompos, atau pengencer ransum.',
    kategoriItem: 'Limbah Industri',
    estimasiHarga: 800,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'sekam-giling',
    nama: 'Sekam Giling',
    namaLain: 'Ground Rice Husk, Rice Hull Meal',
    deskripsi:
      'Sekam padi yang digiling halus menjadi tepung kasar. Lebih mudah dicampur dalam ransum dan pelet dibanding sekam utuh, namun nilai gizi tetap sangat rendah.',
    kategoriItem: 'Limbah Industri',
    estimasiHarga: 900,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'pollard-padi',
    nama: 'Pollard Padi',
    namaLain: 'Rice Pollard, Rice Bran Middlings',
    deskripsi:
      'Fraksi tengah hasil samping penggilingan padi antara dedak dan bekatul — campuran perikarp, sedikit aleuron, dan pecahan endosperma. Protein dan energi berada di antara dedak kasar dan dedak halus.',
    kategoriItem: 'Limbah Industri',
    estimasiHarga: 2700,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'rice-bran-pellet',
    nama: 'Rice Bran Pellet',
    namaLain: 'Pelet Dedak Padi',
    deskripsi:
      'Dedak padi yang dipadatkan menjadi pelet melalui proses pemanasan dan penekanan. Lebih stabil, tidak berdebu, dan lebih tahan tengik dibanding dedak curah karena proses pemanasan menginaktivasi enzim lipase.',
    kategoriItem: 'Limbah Industri',
    estimasiHarga: 3400,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'rice-bran-expeller',
    nama: 'Rice Bran Expeller',
    namaLain: 'Bekatul Expeller, Defatted Rice Bran',
    deskripsi:
      'Dedak padi yang telah diekstraksi minyaknya secara mekanis (expeller/screw press). Kadar lemak jauh menurun dibanding bekatul biasa, protein relatif terkonsentrasi, dan lebih tahan simpan.',
    kategoriItem: 'Limbah Industri',
    estimasiHarga: 3100,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'tepung-beras',
    nama: 'Tepung Beras',
    namaLain: 'Rice Flour',
    deskripsi:
      'Beras yang digiling halus menjadi tepung. Sumber pati sangat mudah dicerna, umum digunakan pada pakan starter unggas dan pakan cair anak ternak.',
    kategoriItem: 'Hasil Samping',
    estimasiHarga: 6500,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },

  // ── Limbah Pertanian ───────────────────────────────────────────────────────
  {
    id: 'sekam-bakar',
    nama: 'Sekam Bakar',
    namaLain: 'Charred Rice Husk, Biochar Sekam',
    deskripsi:
      'Sekam padi yang dibakar tidak sempurna (karbonisasi parsial). Digunakan sebagai litter, media tanam, dan kadang campuran ransum; kandungan silika sangat tinggi.',
    kategoriItem: 'Limbah Pertanian',
    estimasiHarga: 600,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'jerami-padi-segar',
    nama: 'Jerami Padi Segar',
    namaLain: 'Fresh Rice Straw',
    deskripsi:
      'Batang dan daun padi yang baru dipanen sebelum dikeringkan. Kadar air tinggi (60–70%), palatabilitas sedang, sumber roughage murah untuk sapi dan kerbau.',
    kategoriItem: 'Limbah Pertanian',
    estimasiHarga: 400,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'jerami-padi-kering',
    nama: 'Jerami Padi Kering',
    namaLain: 'Dry Rice Straw',
    deskripsi:
      'Jerami padi yang telah dijemur hingga kadar air ≤15%. Lebih awet dan mudah disimpan; serat kasar sangat tinggi, nilai protein rendah (3–4%) — idealnya dikombinasi dengan konsentrat.',
    kategoriItem: 'Limbah Pertanian',
    estimasiHarga: 600,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'jerami-padi-cacah',
    nama: 'Jerami Padi Cacah',
    namaLain: 'Chopped Rice Straw',
    deskripsi:
      'Jerami padi kering yang telah dicacah pendek (2–5 cm) untuk mempermudah konsumsi dan mengurangi seleksi pakan oleh ternak, serta memudahkan pencampuran dalam ransum komplit (TMR).',
    kategoriItem: 'Limbah Pertanian',
    estimasiHarga: 750,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getPadiList(): PadiItem[] {
  return PADI_DB;
}

export function getPadiById(id: string): PadiItem | undefined {
  return PADI_DB.find(item => item.id === id);
}

export function computePadiRingkasan() {
  const items = PADI_DB;
  const priced = items.filter(i => i.estimasiHarga !== null).map(i => i.estimasiHarga as number);
  const hargaRata = priced.length > 0
    ? Math.round(priced.reduce((a, b) => a + b, 0) / priced.length)
    : null;
  const terakhir = items.map(i => i.updatedAt).sort((a, b) => b.localeCompare(a))[0] ?? '—';
  const dataLengkap = items.filter(i => i.dataLengkap).length;

  return {
    totalReferensi: items.length,
    hargaRataRata: hargaRata,
    terakhirUpdate: terakhir,
    dataLengkap,
  };
}
