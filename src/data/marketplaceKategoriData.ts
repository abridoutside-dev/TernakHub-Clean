// ─── Marketplace — Struktur Kategori (MPK-002) ───────────────────────────────
// Hirarki: Marketplace → Kategori → Sub Kategori → Jenis Listing → Detail Listing.
// Mengikuti pola yang sama seperti Master Pakan (Kategori → Sub Kategori →
// Detail): satu registry per level, semuanya identitas UUID v4, slug hanya
// untuk routing/tampilan. Detail Listing TIDAK dibangun pada fase ini.
//
// Struktur ini melayani SATU Marketplace untuk seluruh Workspace — Workspace
// tidak mengubah kategori ini, hanya memilih dari daftar yang sama.
//
// Setiap level baru cukup ditambahkan ke registry masing-masing (KATEGORI_
// MARKETPLACE / SUBKATEGORI_MARKETPLACE / JENIS_LISTING_MARKETPLACE) — tidak
// perlu mengubah arsitektur atau bentuk data yang sudah ada.

// ─── Level 1: Kategori ────────────────────────────────────────────────────────

export type KategoriMarketplaceSlug =
  | 'ternak'
  | 'pakan'
  | 'obat-kesehatan'
  | 'peralatan'
  | 'transportasi'
  | 'dokter-hewan'
  | 'klinik-hewan'
  | 'bibit-hijauan'
  | 'jasa-peternakan'
  | 'lainnya';

export interface KategoriMarketplace {
  uuid: string; // UUID v4 — identitas permanen, tidak pernah berubah
  slug: KategoriMarketplaceSlug;
  icon: string;
  nama: string;
  deskripsi: string;
  color: string;
  bg: string;
}

export const KATEGORI_MARKETPLACE: KategoriMarketplace[] = [
  {
    uuid: '5bd02652-c03e-4af7-a7b1-fe2975e0c76c',
    slug: 'ternak',
    icon: '🐑',
    nama: 'Ternak',
    deskripsi: 'Jual beli ternak hidup — sapi, kambing, domba, dan jenis lainnya.',
    color: '#1b7a43',
    bg: '#e8f5ee',
  },
  {
    uuid: '7b930c5f-aacb-42d2-a736-b951cc8f637a',
    slug: 'pakan',
    icon: '🌾',
    nama: 'Pakan',
    deskripsi: 'Bahan pakan, produk komersial, hijauan, dan silase.',
    color: '#7b5e2a',
    bg: '#fff8e1',
  },
  {
    uuid: '10489296-240f-43a5-ad33-e9b6ff9dc326',
    slug: 'obat-kesehatan',
    icon: '💊',
    nama: 'Obat & Kesehatan',
    deskripsi: 'Obat hewan, vitamin, dan produk kesehatan ternak.',
    color: '#2a7b4f',
    bg: '#e8f5e9',
  },
  {
    uuid: '16fdbfe9-395e-4956-8a4f-169dd901e4af',
    slug: 'peralatan',
    icon: '🧰',
    nama: 'Peralatan',
    deskripsi: 'Peralatan dan perlengkapan operasional peternakan.',
    color: '#5d4037',
    bg: '#efebe9',
  },
  {
    uuid: '71e48abb-1637-4e02-83cd-9ebedfd79b83',
    slug: 'transportasi',
    icon: '🚚',
    nama: 'Transportasi',
    deskripsi: 'Jasa pengangkutan ternak, pakan, dan rental kendaraan.',
    color: '#1565c0',
    bg: '#e3f2fd',
  },
  {
    uuid: '341333e1-1203-4cdf-8936-bec603c9a0e3',
    slug: 'dokter-hewan',
    icon: '👨‍⚕️',
    nama: 'Dokter Hewan',
    deskripsi: 'Jasa konsultasi dan penanganan medis oleh dokter hewan.',
    color: '#0277bd',
    bg: '#e1f5fe',
  },
  {
    uuid: 'b401c63e-e8a7-42df-9fad-b736e3d670b9',
    slug: 'klinik-hewan',
    icon: '🏥',
    nama: 'Klinik Hewan',
    deskripsi: 'Fasilitas klinik dan layanan kesehatan hewan.',
    color: '#00838f',
    bg: '#e0f7fa',
  },
  {
    uuid: 'ffeb1c21-57b7-4a4b-83b3-c6d3816cfacb',
    slug: 'bibit-hijauan',
    icon: '🌱',
    nama: 'Bibit & Hijauan',
    deskripsi: 'Bibit rumput dan tanaman hijauan pakan ternak.',
    color: '#558b2f',
    bg: '#f1f8e9',
  },
  {
    uuid: 'c7282012-82f1-449d-aa11-66cdd4b1669b',
    slug: 'jasa-peternakan',
    icon: '🧑‍🌾',
    nama: 'Jasa Peternakan',
    deskripsi: 'Layanan jasa pendukung operasional peternakan.',
    color: '#8d6e63',
    bg: '#efebe9',
  },
  {
    uuid: 'a242246d-9f73-494b-bf00-f79d7f8bc2a9',
    slug: 'lainnya',
    icon: '⋯',
    nama: 'Lainnya',
    deskripsi: 'Kategori produk atau layanan peternakan lain yang belum tercakup di atas.',
    color: '#616161',
    bg: '#f5f5f5',
  },
];

// ─── Level 2: Sub Kategori ────────────────────────────────────────────────────

export interface SubKategoriMarketplace {
  uuid: string;
  kategoriId: string; // KategoriMarketplace.uuid
  kategoriSlug: KategoriMarketplaceSlug;
  slug: string;
  nama: string;
}

export const SUBKATEGORI_MARKETPLACE: SubKategoriMarketplace[] = [
  // Ternak
  { uuid: '8674c1a2-6f93-473b-8cb7-9c0b4f98a48f', kategoriId: '5bd02652-c03e-4af7-a7b1-fe2975e0c76c', kategoriSlug: 'ternak', slug: 'domba', nama: 'Domba' },
  { uuid: 'afb4b41c-ae18-4e05-a0e9-81a1ee0df6b2', kategoriId: '5bd02652-c03e-4af7-a7b1-fe2975e0c76c', kategoriSlug: 'ternak', slug: 'kambing', nama: 'Kambing' },
  { uuid: 'b7d302bc-b386-4e62-9520-06945d764d6e', kategoriId: '5bd02652-c03e-4af7-a7b1-fe2975e0c76c', kategoriSlug: 'ternak', slug: 'sapi', nama: 'Sapi' },
  { uuid: '4ab0d12f-a7c5-4c11-8e67-7a1b7ce5f174', kategoriId: '5bd02652-c03e-4af7-a7b1-fe2975e0c76c', kategoriSlug: 'ternak', slug: 'kerbau', nama: 'Kerbau' },
  { uuid: '58b90989-575d-469f-aa52-bc661d38e2c3', kategoriId: '5bd02652-c03e-4af7-a7b1-fe2975e0c76c', kategoriSlug: 'ternak', slug: 'kuda', nama: 'Kuda' },
  { uuid: '5a39f2ce-e534-4425-a3f1-7889e340f5cb', kategoriId: '5bd02652-c03e-4af7-a7b1-fe2975e0c76c', kategoriSlug: 'ternak', slug: 'babi', nama: 'Babi' },

  // Pakan
  { uuid: 'cc058028-2c86-4978-98cb-ec0efb17d77b', kategoriId: '7b930c5f-aacb-42d2-a736-b951cc8f637a', kategoriSlug: 'pakan', slug: 'bahan-pakan', nama: 'Bahan Pakan' },
  { uuid: '9fd110a2-f9f1-4f70-a6dc-5d8ae91145dc', kategoriId: '7b930c5f-aacb-42d2-a736-b951cc8f637a', kategoriSlug: 'pakan', slug: 'produk-komersial', nama: 'Produk Komersial' },
  { uuid: '856acbdc-c8f1-4326-810a-f5422d4c1906', kategoriId: '7b930c5f-aacb-42d2-a736-b951cc8f637a', kategoriSlug: 'pakan', slug: 'hijauan', nama: 'Hijauan' },
  { uuid: '17ee1257-303d-442e-bb68-a1dc3210cbdd', kategoriId: '7b930c5f-aacb-42d2-a736-b951cc8f637a', kategoriSlug: 'pakan', slug: 'silase', nama: 'Silase' },

  // Obat & Kesehatan
  { uuid: 'bfd94da1-600c-4608-8ca9-742a3c58aa44', kategoriId: '10489296-240f-43a5-ad33-e9b6ff9dc326', kategoriSlug: 'obat-kesehatan', slug: 'vitamin', nama: 'Vitamin' },
  { uuid: 'f9dd80c0-9660-4a28-b835-050addda6c6d', kategoriId: '10489296-240f-43a5-ad33-e9b6ff9dc326', kategoriSlug: 'obat-kesehatan', slug: 'antibiotik', nama: 'Antibiotik' },
  { uuid: '15417c8d-25a4-4ccc-8730-4d39157a8c44', kategoriId: '10489296-240f-43a5-ad33-e9b6ff9dc326', kategoriSlug: 'obat-kesehatan', slug: 'antiparasit', nama: 'Antiparasit' },
  { uuid: 'c8550eb1-8e87-4cc7-88c0-43572a0d9636', kategoriId: '10489296-240f-43a5-ad33-e9b6ff9dc326', kategoriSlug: 'obat-kesehatan', slug: 'vaksin', nama: 'Vaksin' },
  { uuid: 'a5b81d5d-b1d9-44b0-af81-ddbb9e23336a', kategoriId: '10489296-240f-43a5-ad33-e9b6ff9dc326', kategoriSlug: 'obat-kesehatan', slug: 'desinfektan', nama: 'Desinfektan' },

  // Peralatan
  { uuid: 'cc422d41-15b4-4b3b-a9bb-a744e7da220b', kategoriId: '16fdbfe9-395e-4956-8a4f-169dd901e4af', kategoriSlug: 'peralatan', slug: 'kandang', nama: 'Kandang' },
  { uuid: '9556cf22-ed65-46e7-b6e9-aae35c00d8ad', kategoriId: '16fdbfe9-395e-4956-8a4f-169dd901e4af', kategoriSlug: 'peralatan', slug: 'tempat-pakan', nama: 'Tempat Pakan' },
  { uuid: '50d78c5b-116e-496e-ac88-f728d3181256', kategoriId: '16fdbfe9-395e-4956-8a4f-169dd901e4af', kategoriSlug: 'peralatan', slug: 'tempat-minum', nama: 'Tempat Minum' },
  { uuid: '80ffde3a-43f0-4165-8f6f-8b5bbceaf9ff', kategoriId: '16fdbfe9-395e-4956-8a4f-169dd901e4af', kategoriSlug: 'peralatan', slug: 'mesin', nama: 'Mesin' },
  { uuid: 'bc57caf5-0102-4b2a-bf14-c56d69354db5', kategoriId: '16fdbfe9-395e-4956-8a4f-169dd901e4af', kategoriSlug: 'peralatan', slug: 'timbangan', nama: 'Timbangan' },

  // Transportasi
  { uuid: 'd2ce520b-3e8c-49b1-b79b-92e97b0a50eb', kategoriId: '71e48abb-1637-4e02-83cd-9ebedfd79b83', kategoriSlug: 'transportasi', slug: 'angkut-ternak', nama: 'Angkut Ternak' },
  { uuid: '64004f03-f970-433c-b602-c5774691780e', kategoriId: '71e48abb-1637-4e02-83cd-9ebedfd79b83', kategoriSlug: 'transportasi', slug: 'angkut-pakan', nama: 'Angkut Pakan' },
  { uuid: 'f9324321-9a65-4cba-acc0-727db67b4e74', kategoriId: '71e48abb-1637-4e02-83cd-9ebedfd79b83', kategoriSlug: 'transportasi', slug: 'rental-kendaraan', nama: 'Rental Kendaraan' },

  // Dokter Hewan, Klinik Hewan, Bibit & Hijauan, Jasa Peternakan, Lainnya:
  // belum ada contoh sub kategori pada spesifikasi MPK-002 — registry siap
  // menerima entri baru pada fase berikutnya tanpa perlu mengubah struktur.
];

// ─── Level 3: Jenis Listing ────────────────────────────────────────────────────
// Taksonomi jenis listing di dalam satu Sub Kategori (bukan listing/produk
// sungguhan — itu di luar lingkup MPK-002). Detail Listing (level 4) belum
// dibangun.

export interface JenisListingMarketplace {
  uuid: string;
  subKategoriId: string; // SubKategoriMarketplace.uuid
  subKategoriSlug: string;
  kategoriSlug: KategoriMarketplaceSlug;
  slug: string;
  nama: string;
}

export const JENIS_LISTING_MARKETPLACE: JenisListingMarketplace[] = [
  { uuid: '7a4f68d1-98ee-46ba-9011-413de653edde', subKategoriId: '8674c1a2-6f93-473b-8cb7-9c0b4f98a48f', subKategoriSlug: 'domba', kategoriSlug: 'ternak', slug: 'domba-ekor-gemuk', nama: 'Domba Ekor Gemuk' },
  { uuid: 'c4829ab7-6bdc-4461-b4e1-b76857a5f436', subKategoriId: 'afb4b41c-ae18-4e05-a0e9-81a1ee0df6b2', subKategoriSlug: 'kambing', kategoriSlug: 'ternak', slug: 'kambing-boer', nama: 'Kambing Boer' },
  { uuid: 'b28f92bb-fe48-4973-b88e-e8c903ab5231', subKategoriId: 'b7d302bc-b386-4e62-9520-06945d764d6e', subKategoriSlug: 'sapi', kategoriSlug: 'ternak', slug: 'sapi-limousin', nama: 'Sapi Limousin' },
  { uuid: 'e74237ac-0d91-4142-8b81-b242e3f61fee', subKategoriId: '4ab0d12f-a7c5-4c11-8e67-7a1b7ce5f174', subKategoriSlug: 'kerbau', kategoriSlug: 'ternak', slug: 'kerbau-lumpur', nama: 'Kerbau Lumpur' },
  { uuid: '324e472e-44f2-46a7-bc8b-9407a2367f59', subKategoriId: '58b90989-575d-469f-aa52-bc661d38e2c3', subKategoriSlug: 'kuda', kategoriSlug: 'ternak', slug: 'kuda-sandel', nama: 'Kuda Sandel' },
  { uuid: '3c23d438-b71d-4f3b-810a-b1fe3f1cde8a', subKategoriId: '5a39f2ce-e534-4425-a3f1-7889e340f5cb', subKategoriSlug: 'babi', kategoriSlug: 'ternak', slug: 'babi-landrace', nama: 'Babi Landrace' },

  { uuid: 'a4fc1574-338b-4722-8e90-94fff67c94f2', subKategoriId: 'cc058028-2c86-4978-98cb-ec0efb17d77b', subKategoriSlug: 'bahan-pakan', kategoriSlug: 'pakan', slug: 'dedak-padi', nama: 'Dedak Padi' },
  { uuid: '8376574c-7871-4d53-b14a-bb7287346ba8', subKategoriId: '9fd110a2-f9f1-4f70-a6dc-5d8ae91145dc', subKategoriSlug: 'produk-komersial', kategoriSlug: 'pakan', slug: 'konsentrat', nama: 'Konsentrat' },
  { uuid: '694c5c8b-e52d-44cf-8988-17ea49ff1242', subKategoriId: '856acbdc-c8f1-4326-810a-f5422d4c1906', subKategoriSlug: 'hijauan', kategoriSlug: 'pakan', slug: 'rumput-gajah', nama: 'Rumput Gajah' },
  { uuid: '3d42bfb3-0fd4-4927-8100-b79230ccb7ba', subKategoriId: '17ee1257-303d-442e-bb68-a1dc3210cbdd', subKategoriSlug: 'silase', kategoriSlug: 'pakan', slug: 'silase-jagung', nama: 'Silase Jagung' },

  { uuid: '25b7114c-6110-4bfb-ae6f-104e4d9250ed', subKategoriId: 'bfd94da1-600c-4608-8ca9-742a3c58aa44', subKategoriSlug: 'vitamin', kategoriSlug: 'obat-kesehatan', slug: 'vitamin-b-kompleks', nama: 'Vitamin B Kompleks' },
  { uuid: '9b926bab-b8c2-422c-93ef-d4761225ccf8', subKategoriId: 'f9dd80c0-9660-4a28-b835-050addda6c6d', subKategoriSlug: 'antibiotik', kategoriSlug: 'obat-kesehatan', slug: 'antibiotik-injeksi', nama: 'Antibiotik Injeksi' },
  { uuid: '43b5adaa-0cec-44a0-96b8-606c7251e4e0', subKategoriId: '15417c8d-25a4-4ccc-8730-4d39157a8c44', subKategoriSlug: 'antiparasit', kategoriSlug: 'obat-kesehatan', slug: 'obat-cacing', nama: 'Obat Cacing' },
  { uuid: 'd2864f73-0f8a-4e11-b4ea-765337297573', subKategoriId: 'c8550eb1-8e87-4cc7-88c0-43572a0d9636', subKategoriSlug: 'vaksin', kategoriSlug: 'obat-kesehatan', slug: 'vaksin-se', nama: 'Vaksin SE' },
  { uuid: '5ca5ad78-69cc-459c-bef8-82fee2c6253d', subKategoriId: 'a5b81d5d-b1d9-44b0-af81-ddbb9e23336a', subKategoriSlug: 'desinfektan', kategoriSlug: 'obat-kesehatan', slug: 'desinfektan-kandang', nama: 'Desinfektan Kandang' },

  { uuid: 'b3e90e6d-3393-4176-9099-eb389466e2b9', subKategoriId: 'cc422d41-15b4-4b3b-a9bb-a744e7da220b', subKategoriSlug: 'kandang', kategoriSlug: 'peralatan', slug: 'kandang-panggung', nama: 'Kandang Panggung' },
  { uuid: '093a2e77-d3e5-4f2e-b251-16ca140c02ec', subKategoriId: '9556cf22-ed65-46e7-b6e9-aae35c00d8ad', subKategoriSlug: 'tempat-pakan', kategoriSlug: 'peralatan', slug: 'tempat-pakan-otomatis', nama: 'Tempat Pakan Otomatis' },
  { uuid: 'cb6253c3-07ce-432e-bd32-f5950950155a', subKategoriId: '50d78c5b-116e-496e-ac88-f728d3181256', subKategoriSlug: 'tempat-minum', kategoriSlug: 'peralatan', slug: 'tempat-minum-nipple', nama: 'Tempat Minum Nipple' },
  { uuid: 'e95a74e7-f06c-4d39-83f9-f31322f96bc4', subKategoriId: '80ffde3a-43f0-4165-8f6f-8b5bbceaf9ff', subKategoriSlug: 'mesin', kategoriSlug: 'peralatan', slug: 'mesin-chopper', nama: 'Mesin Chopper' },
  { uuid: '63d6ec95-b293-46eb-912d-f96bbc8fd17b', subKategoriId: 'bc57caf5-0102-4b2a-bf14-c56d69354db5', subKategoriSlug: 'timbangan', kategoriSlug: 'peralatan', slug: 'timbangan-digital', nama: 'Timbangan Digital' },

  { uuid: '26c05a76-df2d-4fb2-8703-88f549a5a427', subKategoriId: 'd2ce520b-3e8c-49b1-b79b-92e97b0a50eb', subKategoriSlug: 'angkut-ternak', kategoriSlug: 'transportasi', slug: 'jasa-angkut-ternak', nama: 'Jasa Angkut Ternak' },
  { uuid: 'f95d8a2a-0725-4184-ad9c-2f43a2809fb6', subKategoriId: '64004f03-f970-433c-b602-c5774691780e', subKategoriSlug: 'angkut-pakan', kategoriSlug: 'transportasi', slug: 'jasa-angkut-pakan', nama: 'Jasa Angkut Pakan' },
  { uuid: '6c2666f9-1676-436f-9daf-860e50839007', subKategoriId: 'f9324321-9a65-4cba-acc0-727db67b4e74', subKategoriSlug: 'rental-kendaraan', kategoriSlug: 'transportasi', slug: 'rental-pickup', nama: 'Rental Pickup' },
];

// ─── Getters ───────────────────────────────────────────────────────────────────

export function getKategoriMarketplaceBySlug(slug: string): KategoriMarketplace | undefined {
  return KATEGORI_MARKETPLACE.find((k) => k.slug === slug);
}

export function getKategoriMarketplaceByUuid(uuid: string): KategoriMarketplace | undefined {
  return KATEGORI_MARKETPLACE.find((k) => k.uuid === uuid);
}

export function getSubKategoriByKategoriSlug(kategoriSlug: KategoriMarketplaceSlug): SubKategoriMarketplace[] {
  return SUBKATEGORI_MARKETPLACE.filter((s) => s.kategoriSlug === kategoriSlug);
}

export function getSubKategoriBySlug(slug: string): SubKategoriMarketplace | undefined {
  return SUBKATEGORI_MARKETPLACE.find((s) => s.slug === slug);
}

export function getSubKategoriByUuid(uuid: string): SubKategoriMarketplace | undefined {
  return SUBKATEGORI_MARKETPLACE.find((s) => s.uuid === uuid);
}

export function getJenisListingBySubKategoriSlug(subKategoriSlug: string): JenisListingMarketplace[] {
  return JENIS_LISTING_MARKETPLACE.filter((j) => j.subKategoriSlug === subKategoriSlug);
}

export function getJenisListingByUuid(uuid: string): JenisListingMarketplace | undefined {
  return JENIS_LISTING_MARKETPLACE.find((j) => j.uuid === uuid);
}

// ─── Alias kompatibilitas (MPK-001 → MPK-002) ─────────────────────────────────
// MPK-001 memakai nama `ListingKategoriSlug`/`getKategoriListingBySlug`; alias
// berikut menjaga konsumen lama tetap kompatibel tanpa mengubah arsitektur.
export type ListingKategoriSlug = KategoriMarketplaceSlug;
export const getKategoriListingBySlug = getKategoriMarketplaceBySlug;
