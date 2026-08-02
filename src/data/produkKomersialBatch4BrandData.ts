// ─── Produk Komersial — Batch 4 — Brand Registry ─────────────────────────────
    // PK-R02D: Brand/merek untuk 3 kategori Batch 4 — Silase Komersial, Hay
    // Komersial, Lainnya. Mengikuti standar UUID PK-000A dan pola
    // Kategori → Brand → Seri → Produk yang sama dengan Batch 1/2/3, namun
    // disimpan terpisah agar Batch 1/2/3 tidak tersentuh. Data dummy realistis,
    // tidak diambil dari internet. UUID dibuat sekali dan bersifat permanen —
    // jangan diubah setelah dibuat.

    export interface ProdukKomersialBatch4Brand {
    uuid: string;
    kategoriId: string; // UUID → KATEGORI_UUID
    kategoriSlug: string; // routing only
    slug: string;
    nama: string;
    produsen: string;
    negaraAsal: string;
    deskripsi: string;
    logo: string;
    color: string;
    bg: string;
    }

    export const PK_BATCH4_BRAND_LIST: ProdukKomersialBatch4Brand[] = [
      { uuid: 'ca9d445f-652e-43d2-a679-e56c070d5050', kategoriId: '925db808-3b5c-4167-926e-248818783539', kategoriSlug: 'silase-komersial', slug: 'silotama-feed', nama: 'Silotama Feed', produsen: 'PT Silotama Feed Indonesia', negaraAsal: 'Indonesia', deskripsi: 'Produsen silase jagung dan rumput fermentasi siap pakai untuk ruminansia.', logo: '🌽', color: '#558b2f', bg: '#f1f8e9' },
  { uuid: '358fa1db-5d9c-4d06-a0c0-6e65fe7193a0', kategoriId: '925db808-3b5c-4167-926e-248818783539', kategoriSlug: 'silase-komersial', slug: 'fermentasi-hijauan-nusantara', nama: 'Fermentasi Hijauan Nusantara', produsen: 'PT Fermentasi Hijauan Nusantara', negaraAsal: 'Indonesia', deskripsi: 'Spesialis silase kemasan untuk peternakan sapi perah dan sapi potong.', logo: '🏭', color: '#33691e', bg: '#f1f8e9' },
  { uuid: '07af5f17-507f-42a1-89e9-669ef6fbe0f0', kategoriId: '925db808-3b5c-4167-926e-248818783539', kategoriSlug: 'silase-komersial', slug: 'silasetama-sejahtera', nama: 'Silasetama Sejahtera', produsen: 'PT Silasetama Sejahtera', negaraAsal: 'Indonesia', deskripsi: 'Produsen silase jagung, silase rumput gajah, dan silase limbah pertanian.', logo: '🌾', color: '#2e7d32', bg: '#e8f5ee' },
  { uuid: '0b4e8ce7-e000-4af8-97c7-9c3055ad0cc4', kategoriId: '925db808-3b5c-4167-926e-248818783539', kategoriSlug: 'silase-komersial', slug: 'hijauan-fermentasi-prima', nama: 'Hijauan Fermentasi Prima', produsen: 'PT Hijauan Fermentasi Prima', negaraAsal: 'Indonesia', deskripsi: 'Menyediakan silase kemasan praktis untuk peternak yang kesulitan lahan hijauan.', logo: '🐄', color: '#6a1b9a', bg: '#f3e5f5' },
  { uuid: 'ee8afb1d-8bbc-409b-9fcb-f908537450ed', kategoriId: '925db808-3b5c-4167-926e-248818783539', kategoriSlug: 'silase-komersial', slug: 'silocorn-indonesia', nama: 'Silocorn Indonesia', produsen: 'PT Silocorn Indonesia', negaraAsal: 'Indonesia', deskripsi: 'Produsen silase jagung utuh (whole crop corn silage) kemasan bal dan karung.', logo: '⚗️', color: '#00695c', bg: '#e0f2f1' },
  { uuid: '59be2c3f-7113-4529-bb07-9c6587ee4264', kategoriId: '23d74ddd-0ff0-4d5b-ab39-d888fe9b4b28', kategoriSlug: 'hay-komersial', slug: 'hayfeed-nusantara', nama: 'Hayfeed Nusantara', produsen: 'PT Hayfeed Nusantara', negaraAsal: 'Indonesia', deskripsi: 'Produsen hay rumput kering kemasan bal untuk peternakan ruminansia.', logo: '🌾', color: '#9e9d24', bg: '#f9fbe7' },
  { uuid: 'ce6548c9-04fa-4b18-8c4a-1c88b6cc2d96', kategoriId: '23d74ddd-0ff0-4d5b-ab39-d888fe9b4b28', kategoriSlug: 'hay-komersial', slug: 'rumput-kering-sejahtera', nama: 'Rumput Kering Sejahtera', produsen: 'PT Rumput Kering Sejahtera', negaraAsal: 'Indonesia', deskripsi: 'Spesialis hay alfalfa dan hay rumput gajah kemasan siap distribusi.', logo: '🏭', color: '#827717', bg: '#f9fbe7' },
  { uuid: 'dd63f0b6-3d46-42d1-b171-832727799ae7', kategoriId: '23d74ddd-0ff0-4d5b-ab39-d888fe9b4b28', kategoriSlug: 'hay-komersial', slug: 'haytama-prima', nama: 'Haytama Prima', produsen: 'PT Haytama Prima', negaraAsal: 'Indonesia', deskripsi: 'Produsen hay kemasan press untuk efisiensi penyimpanan dan transportasi.', logo: '🌱', color: '#558b2f', bg: '#f1f8e9' },
  { uuid: '6bd8dd0f-dbf2-48dd-befe-23198f9e796a', kategoriId: '23d74ddd-0ff0-4d5b-ab39-d888fe9b4b28', kategoriSlug: 'hay-komersial', slug: 'alfalfa-indo-feed', nama: 'Alfalfa Indo Feed', produsen: 'PT Alfalfa Indo Feed', negaraAsal: 'Indonesia', deskripsi: 'Menyediakan hay alfalfa berkualitas tinggi untuk kuda dan ternak perah.', logo: '🐄', color: '#6a1b9a', bg: '#f3e5f5' },
  { uuid: '0ec3bea9-fd2a-4c62-b97e-05bae0a5d5cf', kategoriId: '23d74ddd-0ff0-4d5b-ab39-d888fe9b4b28', kategoriSlug: 'hay-komersial', slug: 'golden-hay-indonesia', nama: 'Golden Hay Indonesia', produsen: 'PT Golden Hay Indonesia', negaraAsal: 'Indonesia', deskripsi: 'Produsen hay kemasan premium dengan proses pengeringan terkontrol.', logo: '⚗️', color: '#00695c', bg: '#e0f2f1' },
  { uuid: '2eca2618-8ec6-4271-8d83-036139d9e256', kategoriId: '1de7491f-8ce5-409e-bbbb-bab0cdaba72c', kategoriSlug: 'lainnya-komersial', slug: 'multiferm-nutrindo', nama: 'Multiferm Nutrindo', produsen: 'PT Multiferm Nutrindo', negaraAsal: 'Indonesia', deskripsi: 'Produsen aditif pakan komersial serbaguna di luar kategori standar.', logo: '📦', color: '#546e7a', bg: '#eceff1' },
  { uuid: '1f534b17-e10a-40e6-92b7-7d1e0c3fb05b', kategoriId: '1de7491f-8ce5-409e-bbbb-bab0cdaba72c', kategoriSlug: 'lainnya-komersial', slug: 'feedtech-alternatif', nama: 'Feedtech Alternatif', produsen: 'PT Feedtech Alternatif Indonesia', negaraAsal: 'Indonesia', deskripsi: 'Spesialis produk pakan komersial khusus dan inovatif untuk kebutuhan spesifik peternak.', logo: '🏭', color: '#455a64', bg: '#eceff1' },
  { uuid: 'a158ddad-2d0b-486a-85a1-1271b73d6791', kategoriId: '1de7491f-8ce5-409e-bbbb-bab0cdaba72c', kategoriSlug: 'lainnya-komersial', slug: 'ternak-solusi-prima', nama: 'Ternak Solusi Prima', produsen: 'PT Ternak Solusi Prima', negaraAsal: 'Indonesia', deskripsi: 'Produsen produk pendukung pakan yang belum tercakup kategori Produk Komersial lain.', logo: '🌾', color: '#37474f', bg: '#eceff1' },
  { uuid: '1be41b34-f3fe-4f13-9a90-015175eb92b6', kategoriId: '1de7491f-8ce5-409e-bbbb-bab0cdaba72c', kategoriSlug: 'lainnya-komersial', slug: 'nutrisi-khusus-sejahtera', nama: 'Nutrisi Khusus Sejahtera', produsen: 'PT Nutrisi Khusus Sejahtera', negaraAsal: 'Indonesia', deskripsi: 'Menyediakan produk pakan komersial niche seperti pelet limbah dan bahan pendukung lainnya.', logo: '🐄', color: '#6a1b9a', bg: '#f3e5f5' },
  { uuid: '39e83d4a-ffc2-42ba-badd-10a17c181514', kategoriId: '1de7491f-8ce5-409e-bbbb-bab0cdaba72c', kategoriSlug: 'lainnya-komersial', slug: 'adiflex-indonesia', nama: 'Adiflex Indonesia', produsen: 'PT Adiflex Indonesia', negaraAsal: 'Indonesia', deskripsi: 'Produsen produk pakan komersial fleksibel untuk kebutuhan campuran khusus peternak.', logo: '⚗️', color: '#00695c', bg: '#e0f2f1' },  { uuid: '55975180-7e90-4f09-ad29-d230b3ade564', kategoriId: '925db808-3b5c-4167-926e-248818783539', kategoriSlug: 'silase-komersial', slug: 'fermentasi-pakan-lestari', nama: 'Fermentasi Pakan Lestari', produsen: 'PT Fermentasi Pakan Lestari', negaraAsal: 'Indonesia', deskripsi: 'Produsen silase kemasan skala menengah untuk peternakan sapi perah dan sapi potong di Jawa dan Sumatra.', logo: '🌿', color: '#558b2f', bg: '#f1f8e9' },
  { uuid: '9c9ee3a6-1c10-4451-af07-185757f8102a', kategoriId: '925db808-3b5c-4167-926e-248818783539', kategoriSlug: 'silase-komersial', slug: 'silo-hijau-abadi', nama: 'Silo Hijau Abadi', produsen: 'PT Silo Hijau Abadi', negaraAsal: 'Indonesia', deskripsi: 'Produsen silase jagung dan rumput fermentasi dengan standar higiene pakan modern.', logo: '🚜', color: '#33691e', bg: '#f1f8e9' },
  { uuid: '44256253-1e23-4788-bba4-ccfa33070d5b', kategoriId: '23d74ddd-0ff0-4d5b-ab39-d888fe9b4b28', kategoriSlug: 'hay-komersial', slug: 'buffalo-hay-nusantara', nama: 'Buffalo Hay Nusantara', produsen: 'PT Buffalo Hay Nusantara', negaraAsal: 'Indonesia', deskripsi: 'Produsen hay khusus kerbau dan sapi potong di kawasan Sumatra dan Sulawesi.', logo: '🐃', color: '#4e342e', bg: '#efebe9' },
  { uuid: '1b0d8894-68f8-4eef-82ff-8ad496ce4179', kategoriId: '23d74ddd-0ff0-4d5b-ab39-d888fe9b4b28', kategoriSlug: 'hay-komersial', slug: 'equine-grass-indonesia', nama: 'Equine Grass Indonesia', produsen: 'PT Equine Grass Indonesia', negaraAsal: 'Indonesia', deskripsi: 'Spesialis hay timothy dan oat impor-standar untuk kuda tunggang dan kuda pacu.', logo: '🐎', color: '#5d4037', bg: '#efebe9' },
  { uuid: 'daf14f2c-ae2f-40ad-98ac-2b0be76666ce', kategoriId: '23d74ddd-0ff0-4d5b-ab39-d888fe9b4b28', kategoriSlug: 'hay-komersial', slug: 'kelinci-hijau-lestari', nama: 'Kelinci Hijau Lestari', produsen: 'PT Kelinci Hijau Lestari', negaraAsal: 'Indonesia', deskripsi: 'Produsen hay khusus kelinci dan hewan kecil herbivora, kemasan higienis.', logo: '🐇', color: '#795548', bg: '#efebe9' },
  { uuid: '55940083-399b-4b86-84cf-f273447b6275', kategoriId: '1de7491f-8ce5-409e-bbbb-bab0cdaba72c', kategoriSlug: 'lainnya-komersial', slug: 'porcofeed-additive', nama: 'Porcofeed Additive', produsen: 'PT Porcofeed Additive Indonesia', negaraAsal: 'Indonesia', deskripsi: 'Produsen aditif pakan khusus babi untuk peternakan komersial skala menengah-besar.', logo: '🐖', color: '#8d6e63', bg: '#efebe9' },
  { uuid: 'a41c44c4-61c5-4296-aee3-15d6c0f9a300', kategoriId: '1de7491f-8ce5-409e-bbbb-bab0cdaba72c', kategoriSlug: 'lainnya-komersial', slug: 'unggas-multivitamin-sejahtera', nama: 'Unggas Multivitamin Sejahtera', produsen: 'PT Unggas Multivitamin Sejahtera', negaraAsal: 'Indonesia', deskripsi: 'Spesialis suplemen dan pakan tambahan untuk unggas petelur, itik, dan puyuh.', logo: '🦆', color: '#f9a825', bg: '#fff8e1' },
  { uuid: 'f9bd34a6-8a64-4866-b4a3-a7608e83eba3', kategoriId: '1de7491f-8ce5-409e-bbbb-bab0cdaba72c', kategoriSlug: 'lainnya-komersial', slug: 'akuafeed-nusantara', nama: 'Akuafeed Nusantara', produsen: 'PT Akuafeed Nusantara', negaraAsal: 'Indonesia', deskripsi: 'Produsen suplemen akuakultur untuk ikan, udang, dan burung hias di seluruh Indonesia.', logo: '🦐', color: '#0277bd', bg: '#e1f5fe' },

    ];

    /** Daftar brand pada satu kategori (slug), diurutkan sesuai data. */
    export function getBatch4BrandsByKategoriSlug(kategoriSlug: string): ProdukKomersialBatch4Brand[] {
    return PK_BATCH4_BRAND_LIST.filter(b => b.kategoriSlug === kategoriSlug);
    }

    /** Lookup satu brand via kategoriSlug + brandSlug (routing). */
    export function getBatch4BrandBySlug(kategoriSlug: string, brandSlug: string): ProdukKomersialBatch4Brand | undefined {
    return PK_BATCH4_BRAND_LIST.find(b => b.kategoriSlug === kategoriSlug && b.slug === brandSlug);
    }

    /** Lookup brand via UUID. */
    export function getBatch4BrandByUUID(uuid: string): ProdukKomersialBatch4Brand | undefined {
    return PK_BATCH4_BRAND_LIST.find(b => b.uuid === uuid);
    }
    