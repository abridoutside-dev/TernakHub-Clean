// ─── Drug Commercial Product Service — PKO-PERSISTENT-001 ────────────────────
//
// Business layer for Produk Komersial Obat (Drug Commercial Products).
// Wraps repository functions and provides domain-specific logic.
//
// Rules:
//   - All data comes from Supabase (source of truth).
//   - No fallback to dummy data or localStorage.
//   - No direct Supabase queries in pages/components.

import {
  DrugBrandDbRow,
  DrugCommercialProductDbRow,
  DrugCommercialProductRepoError,
  repoGetDrugBrands,
  repoGetDrugBrandById,
  repoGetDrugBrandBySlug,
  repoCreateDrugBrand,
  repoUpdateDrugBrand,
  repoGetDrugCommercialProducts,
  repoGetDrugCommercialProductById,
  repoGetDrugCommercialProductBySlug,
  repoGetDrugCommercialProductsByBrand,
  repoCreateDrugCommercialProduct,
  repoUpdateDrugCommercialProduct,
  repoSoftDeleteDrugCommercialProduct,
  repoRestoreDrugCommercialProduct,
  repoGetDrugBrandCount,
  repoGetDrugCommercialProductCount,
} from '../repositories/drugCommercialProductRepository';

// ─── Re-exports ──────────────────────────────────────────────────────────────

export type { DrugBrandDbRow, DrugCommercialProductDbRow };
export { DrugCommercialProductRepoError };

// ─── Domain Types (UI-friendly) ──────────────────────────────────────────────

export type StatusProdukObat = 'aktif' | 'nonaktif';

export interface ObatBrand {
  uuid: string;
  slug: string;
  nama: string;
  logo: string;
  deskripsi?: string;
  jumlahProduk: number;
  status: 'aktif' | 'nonaktif';
  color: string;
  bg: string;
}

export interface ObatProdukKomersial {
  uuid: string;
  slug: string;
  nama: string;
  brandId: string;
  brandNama: string;
  bentukSediaan: string;
  kemasan: string;
  status: 'aktif' | 'nonaktif';
  masterObatUuid: string | null;
  namaKomersial?: string;
  produsen?: string;
  distributor?: string;
  nomorRegistrasi?: string;
  fotoProduk?: string;
  catatan?: string;
  bahanAktif?: string;
  kekuatan?: string;
  negaraAsal?: string;
  penyimpanan?: string;
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapBrandToDomain(row: DrugBrandDbRow, jumlahProduk = 0): ObatBrand {
  return {
    uuid: row.id,
    slug: row.slug,
    nama: row.name,
    logo: row.logo ?? '💊',
    deskripsi: row.deskripsi ?? undefined,
    jumlahProduk,
    status: row.status,
    color: row.color ?? '#0d6efd',
    bg: row.bg ?? '#e7f1ff',
  };
}

function mapProductToDomain(row: DrugCommercialProductDbRow, brandNama = ''): ObatProdukKomersial {
  return {
    uuid: row.id,
    slug: row.slug,
    nama: row.name,
    brandId: row.brand_id,
    brandNama,
    bentukSediaan: row.bentuk_sediaan,
    kemasan: row.kemasan,
    status: row.status,
    masterObatUuid: row.master_obat_uuid,
    namaKomersial: row.nama_komersial ?? undefined,
    produsen: row.produsen ?? undefined,
    distributor: row.distributor ?? undefined,
    nomorRegistrasi: row.nomor_registrasi ?? undefined,
    fotoProduk: row.foto_produk ?? undefined,
    catatan: row.catatan ?? undefined,
    bahanAktif: row.bahan_aktif ?? undefined,
    kekuatan: row.kekuatan ?? undefined,
    negaraAsal: row.negara_asal ?? undefined,
    penyimpanan: row.penyimpanan ?? undefined,
  };
}

// ─── Brand Service ───────────────────────────────────────────────────────────

export async function getObatBrandListLive(): Promise<ObatBrand[]> {
  const [brands, products] = await Promise.all([
    repoGetDrugBrands(),
    repoGetDrugCommercialProducts(),
  ]);

  const productCountByBrand = new Map<string, number>();
  for (const p of products) {
    productCountByBrand.set(p.brand_id, (productCountByBrand.get(p.brand_id) ?? 0) + 1);
  }

  return brands.map(b => mapBrandToDomain(b, productCountByBrand.get(b.id) ?? 0));
}

export async function getObatBrandByUuid(uuid: string): Promise<ObatBrand | undefined> {
  const brand = await repoGetDrugBrandById(uuid);
  if (!brand) return undefined;

  const products = await repoGetDrugCommercialProductsByBrand(uuid);
  return mapBrandToDomain(brand, products.length);
}

export async function getObatBrandBySlug(slug: string): Promise<ObatBrand | undefined> {
  const brand = await repoGetDrugBrandBySlug(slug);
  if (!brand) return undefined;

  const products = await repoGetDrugCommercialProductsByBrand(brand.id);
  return mapBrandToDomain(brand, products.length);
}

export async function addObatBrand(input: {
  nama: string;
  logo: string;
  deskripsi: string;
}): Promise<ObatBrand> {
  const slug = input.nama.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const palette = [
    { color: '#0d6efd', bg: '#e7f1ff' },
    { color: '#1b7a43', bg: '#e8f5ee' },
    { color: '#6a1b9a', bg: '#f3e5f5' },
    { color: '#b8860b', bg: '#fbf1dd' },
    { color: '#c0392b', bg: '#fbeaea' },
    { color: '#117864', bg: '#e1f5f0' },
  ];

  const existing = await repoGetDrugBrands();
  const paletteIdx = existing.length % palette.length;
  const { color, bg } = palette[paletteIdx];

  const row = await repoCreateDrugBrand({
    name: input.nama,
    slug,
    logo: input.logo || '💊',
    deskripsi: input.deskripsi,
    color,
    bg,
  });

  return mapBrandToDomain(row, 0);
}

export async function updateObatBrand(
  uuid: string,
  updates: {
    nama?: string;
    logo?: string;
    deskripsi?: string;
    status?: 'aktif' | 'nonaktif';
    color?: string;
    bg?: string;
  },
): Promise<ObatBrand | undefined> {
  const existing = await repoGetDrugBrandById(uuid);
  if (!existing) return undefined;

  const row = await repoUpdateDrugBrand(uuid, {
    name: updates.nama,
    logo: updates.logo,
    deskripsi: updates.deskripsi,
    status: updates.status,
  });

  const products = await repoGetDrugCommercialProductsByBrand(uuid);
  return mapBrandToDomain(row, products.length);
}

export async function canDeactivateObatBrand(uuid: string): Promise<{ ok: boolean; error?: string }> {
  const brand = await repoGetDrugBrandById(uuid);
  if (!brand) return { ok: false, error: 'Data referensi tidak valid.' };

  const products = await repoGetDrugCommercialProductsByBrand(uuid);
  const hasActiveChild = products.some(p => p.status === 'aktif');
  if (hasActiveChild) {
    return { ok: false, error: 'Brand masih memiliki Produk aktif. Nonaktifkan produk terlebih dahulu.' };
  }
  return { ok: true };
}

export async function softDeleteObatBrand(uuid: string): Promise<{ ok: boolean; error?: string }> {
  const check = await canDeactivateObatBrand(uuid);
  if (!check.ok) return check;

  await repoUpdateDrugBrand(uuid, { status: 'nonaktif' });
  return { ok: true };
}

export async function restoreObatBrand(uuid: string): Promise<void> {
  await repoUpdateDrugBrand(uuid, { status: 'aktif' });
}

// ─── Product Service ─────────────────────────────────────────────────────────

export async function getObatProdukKomersialList(): Promise<ObatProdukKomersial[]> {
  const [products, brands] = await Promise.all([
    repoGetDrugCommercialProducts(),
    repoGetDrugBrands(),
  ]);

  const brandMap = new Map<string, string>();
  for (const b of brands) {
    brandMap.set(b.id, b.name);
  }

  return products.map(p => mapProductToDomain(p, brandMap.get(p.brand_id) ?? ''));
}

export async function getObatProdukKomersialByUuid(uuid: string): Promise<ObatProdukKomersial | undefined> {
  const product = await repoGetDrugCommercialProductById(uuid);
  if (!product) return undefined;

  const brand = await repoGetDrugBrandById(product.brand_id);
  return mapProductToDomain(product, brand?.name ?? '');
}

export async function getObatProdukBySlug(slug: string): Promise<ObatProdukKomersial | undefined> {
  const product = await repoGetDrugCommercialProductBySlug(slug);
  if (!product) return undefined;

  const brand = await repoGetDrugBrandById(product.brand_id);
  return mapProductToDomain(product, brand?.name ?? '');
}

export async function getObatProdukByBrandId(brandId: string): Promise<ObatProdukKomersial[]> {
  const [products, brand] = await Promise.all([
    repoGetDrugCommercialProductsByBrand(brandId),
    repoGetDrugBrandById(brandId),
  ]);

  return products.map(p => mapProductToDomain(p, brand?.name ?? ''));
}

export async function addObatProdukKomersial(input: {
  brandId: string;
  masterObatUuid: string;
  nama: string;
  namaKomersial: string;
  bentukSediaan: string;
  kemasan: string;
  produsen: string;
  distributor?: string;
  nomorRegistrasi?: string;
  fotoProduk?: string;
  catatan?: string;
  bahanAktif?: string;
  kekuatan?: string;
  negaraAsal?: string;
  penyimpanan?: string;
}): Promise<ObatProdukKomersial> {
  const row = await repoCreateDrugCommercialProduct({
    brand_id: input.brandId,
    master_obat_uuid: input.masterObatUuid,
    name: input.nama,
    nama_komersial: input.namaKomersial,
    bentuk_sediaan: input.bentukSediaan,
    kemasan: input.kemasan,
    produsen: input.produsen,
    distributor: input.distributor,
    nomor_registrasi: input.nomorRegistrasi,
    foto_produk: input.fotoProduk,
    catatan: input.catatan,
    bahan_aktif: input.bahanAktif,
    kekuatan: input.kekuatan,
    negara_asal: input.negaraAsal,
    penyimpanan: input.penyimpanan,
  });

  const brand = await repoGetDrugBrandById(input.brandId);
  return mapProductToDomain(row, brand?.name ?? '');
}

export async function updateObatProdukKomersial(
  uuid: string,
  updates: {
    brandId?: string;
    masterObatUuid?: string;
    nama?: string;
    namaKomersial?: string;
    bentukSediaan?: string;
    kemasan?: string;
    produsen?: string;
    distributor?: string;
    nomorRegistrasi?: string;
    fotoProduk?: string;
    catatan?: string;
    status?: 'aktif' | 'nonaktif';
    bahanAktif?: string;
    kekuatan?: string;
    negaraAsal?: string;
    penyimpanan?: string;
  },
): Promise<ObatProdukKomersial | undefined> {
  const existing = await repoGetDrugCommercialProductById(uuid);
  if (!existing) return undefined;

  const row = await repoUpdateDrugCommercialProduct(uuid, {
    brand_id: updates.brandId,
    master_obat_uuid: updates.masterObatUuid,
    name: updates.nama,
    nama_komersial: updates.namaKomersial,
    bentuk_sediaan: updates.bentukSediaan,
    kemasan: updates.kemasan,
    produsen: updates.produsen,
    distributor: updates.distributor,
    nomor_registrasi: updates.nomorRegistrasi,
    foto_produk: updates.fotoProduk,
    catatan: updates.catatan,
    status: updates.status,
    bahan_aktif: updates.bahanAktif,
    kekuatan: updates.kekuatan,
    negara_asal: updates.negaraAsal,
    penyimpanan: updates.penyimpanan,
  });

  const brandId = updates.brandId ?? existing.brand_id;
  const brand = await repoGetDrugBrandById(brandId);
  return mapProductToDomain(row, brand?.name ?? '');
}

export async function softDeleteObatProdukKomersial(uuid: string): Promise<{ ok: boolean; error?: string }> {
  const product = await repoGetDrugCommercialProductById(uuid);
  if (!product) return { ok: false, error: 'Data referensi tidak valid.' };

  await repoSoftDeleteDrugCommercialProduct(uuid);
  return { ok: true };
}

export async function restoreObatProdukKomersial(uuid: string): Promise<void> {
  await repoRestoreDrugCommercialProduct(uuid);
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export async function getTotalBrandObat(): Promise<number> {
  return repoGetDrugBrandCount();
}

export async function getTotalProdukObat(): Promise<number> {
  return repoGetDrugCommercialProductCount();
}

export async function getTotalProdukAktifObat(): Promise<number> {
  const products = await repoGetDrugCommercialProducts();
  return products.filter(p => p.status === 'aktif').length;
}

export async function getTotalProdukNonaktifObat(): Promise<number> {
  const products = await repoGetDrugCommercialProducts();
  return products.filter(p => p.status === 'nonaktif').length;
}

// ─── Validation Helpers ──────────────────────────────────────────────────────

export async function isDuplicateObatBrandNama(nama: string, excludeUuid?: string): Promise<boolean> {
  const brands = await repoGetDrugBrands();
  const target = nama.trim().toLowerCase();
  return brands.some(b => b.id !== excludeUuid && b.name.trim().toLowerCase() === target);
}

export async function isDuplicateObatProdukNama(
  brandId: string,
  nama: string,
  excludeUuid?: string,
): Promise<boolean> {
  const products = await repoGetDrugCommercialProductsByBrand(brandId);
  const target = nama.trim().toLowerCase();
  return products.some(p => p.id !== excludeUuid && p.name.trim().toLowerCase() === target);
}
