// ─── Produk Komersial — Resolver Generik Lintas-Batch ────────────────────────
// PK-R02B: Halaman generik Brand→Seri→Produk (ProdukKomersialKategoriGeneric,
// BrandSeriGeneric, SeriProdukGeneric, ProdukDetailGeneric) awalnya hanya
// membaca dari registry Batch 1 (PK-R02A). Modul ini menambahkan dispatch
// berbasis kategoriSlug agar halaman yang sama juga bisa membaca registry
// Batch 2 (PK-R02B) TANPA mengubah data Batch 1 sama sekali — hanya menambah
// lapisan pemilihan sumber data.
//
// Menambahkan batch baru di masa depan cukup dengan menambah entrinya di
// BATCH2_KATEGORI_SLUGS (atau membuat BATCH3_KATEGORI_SLUGS serupa) dan
// menghubungkan fungsi getX-nya di sini.

import {
  getBrandsByKategoriSlug as getBatch1BrandsByKategoriSlug,
  getBrandBySlug as getBatch1BrandBySlug,
  type ProdukKomersialBrand,
} from './produkKomersialBatch1BrandData';
import {
  getSeriByBrandId as getBatch1SeriByBrandId,
  getSeriBySlug as getBatch1SeriBySlug,
  type ProdukKomersialSeri,
} from './produkKomersialBatch1SeriData';
import {
  getProdukBySeriId as getBatch1ProdukBySeriId,
  getProdukBySlug as getBatch1ProdukBySlug,
  getJumlahProdukByKategoriSlug as getBatch1JumlahProdukByKategoriSlug,
  type ProdukKomersialBatch1Item,
} from './produkKomersialBatch1ProdukData';

import {
  getBatch2BrandsByKategoriSlug,
  getBatch2BrandBySlug,
} from './produkKomersialBatch2BrandData';
import {
  getBatch2SeriByBrandId,
  getBatch2SeriBySlug,
} from './produkKomersialBatch2SeriData';
import {
  getBatch2ProdukBySeriId,
  getBatch2ProdukBySlug,
  getBatch2JumlahProdukByKategoriSlug,
} from './produkKomersialBatch2ProdukData';

import {
  getBatch3BrandsByKategoriSlug,
  getBatch3BrandBySlug,
} from './produkKomersialBatch3BrandData';
import {
  getBatch3SeriByBrandId,
  getBatch3SeriBySlug,
} from './produkKomersialBatch3SeriData';
import {
  getBatch3ProdukBySeriId,
  getBatch3ProdukBySlug,
  getBatch3JumlahProdukByKategoriSlug,
} from './produkKomersialBatch3ProdukData';

import {
  getBatch4BrandsByKategoriSlug,
  getBatch4BrandBySlug,
} from './produkKomersialBatch4BrandData';
import {
  getBatch4SeriByBrandId,
  getBatch4SeriBySlug,
} from './produkKomersialBatch4SeriData';
import {
  getBatch4ProdukBySeriId,
  getBatch4ProdukBySlug,
  getBatch4JumlahProdukByKategoriSlug,
} from './produkKomersialBatch4ProdukData';

// PK-R02B: kategori yang datanya berada di registry Batch 2.
const BATCH2_KATEGORI_SLUGS = new Set([
  'milk-replacer', 'umb', 'mineral-block', 'probiotik', 'enzim',
]);

// PK-R02C: kategori yang datanya berada di registry Batch 3.
const BATCH3_KATEGORI_SLUGS = new Set([
  'acidifier', 'buffer', 'toxin-binder', 'yeast', 'herbal-komersial',
]);

// PK-R02D: kategori yang datanya berada di registry Batch 4.
const BATCH4_KATEGORI_SLUGS = new Set([
  'silase-komersial', 'hay-komersial', 'lainnya-komersial',
]);

// Batch 1 dan Batch 2 memakai bentuk field yang identik (brand/seri/produk),
// jadi tipe generik ini kompatibel secara struktural untuk kedua sumber.
export type GenericBrand = ProdukKomersialBrand;
export type GenericSeri = ProdukKomersialSeri;
export type GenericProduk = ProdukKomersialBatch1Item;

function isBatch2(kategoriSlug: string): boolean {
  return BATCH2_KATEGORI_SLUGS.has(kategoriSlug);
}

function isBatch3(kategoriSlug: string): boolean {
  return BATCH3_KATEGORI_SLUGS.has(kategoriSlug);
}

function isBatch4(kategoriSlug: string): boolean {
  return BATCH4_KATEGORI_SLUGS.has(kategoriSlug);
}

export function getBrandsByKategoriSlugAny(kategoriSlug: string): GenericBrand[] {
  if (isBatch4(kategoriSlug)) return getBatch4BrandsByKategoriSlug(kategoriSlug);
  if (isBatch3(kategoriSlug)) return getBatch3BrandsByKategoriSlug(kategoriSlug);
  if (isBatch2(kategoriSlug)) return getBatch2BrandsByKategoriSlug(kategoriSlug);
  return getBatch1BrandsByKategoriSlug(kategoriSlug);
}

export function getBrandBySlugAny(kategoriSlug: string, brandSlug: string): GenericBrand | undefined {
  if (isBatch4(kategoriSlug)) return getBatch4BrandBySlug(kategoriSlug, brandSlug);
  if (isBatch3(kategoriSlug)) return getBatch3BrandBySlug(kategoriSlug, brandSlug);
  if (isBatch2(kategoriSlug)) return getBatch2BrandBySlug(kategoriSlug, brandSlug);
  return getBatch1BrandBySlug(kategoriSlug, brandSlug);
}

export function getSeriByBrandIdAny(kategoriSlug: string, brandId: string): GenericSeri[] {
  if (isBatch4(kategoriSlug)) return getBatch4SeriByBrandId(brandId);
  if (isBatch3(kategoriSlug)) return getBatch3SeriByBrandId(brandId);
  if (isBatch2(kategoriSlug)) return getBatch2SeriByBrandId(brandId);
  return getBatch1SeriByBrandId(brandId);
}

export function getSeriBySlugAny(kategoriSlug: string, brandId: string, seriSlug: string): GenericSeri | undefined {
  if (isBatch4(kategoriSlug)) return getBatch4SeriBySlug(brandId, seriSlug);
  if (isBatch3(kategoriSlug)) return getBatch3SeriBySlug(brandId, seriSlug);
  if (isBatch2(kategoriSlug)) return getBatch2SeriBySlug(brandId, seriSlug);
  return getBatch1SeriBySlug(brandId, seriSlug);
}

export function getProdukBySeriIdAny(kategoriSlug: string, seriId: string): GenericProduk[] {
  if (isBatch4(kategoriSlug)) return getBatch4ProdukBySeriId(seriId);
  if (isBatch3(kategoriSlug)) return getBatch3ProdukBySeriId(seriId);
  if (isBatch2(kategoriSlug)) return getBatch2ProdukBySeriId(seriId);
  return getBatch1ProdukBySeriId(seriId);
}

export function getProdukBySlugAny(kategoriSlug: string, seriId: string, produkSlug: string): GenericProduk | undefined {
  if (isBatch4(kategoriSlug)) return getBatch4ProdukBySlug(seriId, produkSlug);
  if (isBatch3(kategoriSlug)) return getBatch3ProdukBySlug(seriId, produkSlug);
  if (isBatch2(kategoriSlug)) return getBatch2ProdukBySlug(seriId, produkSlug);
  return getBatch1ProdukBySlug(seriId, produkSlug);
}

export function getJumlahProdukByKategoriSlugAny(kategoriSlug: string): number {
  if (isBatch4(kategoriSlug)) return getBatch4JumlahProdukByKategoriSlug(kategoriSlug);
  if (isBatch3(kategoriSlug)) return getBatch3JumlahProdukByKategoriSlug(kategoriSlug);
  if (isBatch2(kategoriSlug)) return getBatch2JumlahProdukByKategoriSlug(kategoriSlug);
  return getBatch1JumlahProdukByKategoriSlug(kategoriSlug);
}
