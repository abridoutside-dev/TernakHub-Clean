// ─── Drug Commercial Product Repository — PKO-PERSISTENT-001 ─────────────────
//
// Supabase adapter for Produk Komersial Obat (Drug Commercial Products).
// Tables covered:
//   drug_brands, drug_commercial_products
//
// Rules:
//   - All functions are async and return typed results.
//   - Read operations return data from Supabase (source of truth).
//   - CRUD operations for admin-managed data (validated by RLS).
//   - No fallback to dummy data or localStorage.
//   - Never import from pages, components, or contexts.
//
// Schema:  supabase/migrations/20260823000003_drug_commercial_products_schema.sql
// RLS:     included in schema migration
// Seed:    supabase/migrations/20260823000004_drug_commercial_products_seed.sql

import { supabase } from '../lib/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DrugBrandDbRow {
  id: string;
  slug: string;
  name: string;
  logo: string | null;
  deskripsi: string | null;
  status: 'aktif' | 'nonaktif';
  color: string | null;
  bg: string | null;
  created_at: string;
  updated_at: string;
}

export interface DrugCommercialProductDbRow {
  id: string;
  slug: string;
  brand_id: string;
  master_obat_uuid: string | null;
  name: string;
  nama_komersial: string | null;
  bentuk_sediaan: string;
  kemasan: string;
  status: 'aktif' | 'nonaktif';
  bahan_aktif: string | null;
  kekuatan: string | null;
  negara_asal: string | null;
  penyimpanan: string | null;
  produsen: string | null;
  distributor: string | null;
  nomor_registrasi: string | null;
  foto_produk: string | null;
  catatan: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Error ────────────────────────────────────────────────────────────────────

export class DrugCommercialProductRepoError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'DrugCommercialProductRepoError';
  }
}

function guard(error: { message: string; code?: string } | null): void {
  if (error) throw new DrugCommercialProductRepoError(error.message, error.code);
}

// ─── Brands ──────────────────────────────────────────────────────────────────

export async function repoGetDrugBrands(): Promise<DrugBrandDbRow[]> {
  const { data, error } = await supabase
    .from('drug_brands')
    .select('*')
    .order('name');
  guard(error);
  return (data ?? []) as DrugBrandDbRow[];
}

export async function repoGetDrugBrandById(id: string): Promise<DrugBrandDbRow | null> {
  const { data, error } = await supabase
    .from('drug_brands')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  guard(error);
  return data as DrugBrandDbRow | null;
}

export async function repoGetDrugBrandBySlug(slug: string): Promise<DrugBrandDbRow | null> {
  const { data, error } = await supabase
    .from('drug_brands')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  guard(error);
  return data as DrugBrandDbRow | null;
}

export async function repoCreateDrugBrand(input: {
  name: string;
  slug: string;
  logo?: string;
  deskripsi?: string;
  color?: string;
  bg?: string;
}): Promise<DrugBrandDbRow> {
  const { data, error } = await supabase
    .from('drug_brands')
    .insert({
      name: input.name,
      slug: input.slug,
      logo: input.logo ?? '💊',
      deskripsi: input.deskripsi,
      color: input.color,
      bg: input.bg,
    })
    .select()
    .single();
  guard(error);
  return data as DrugBrandDbRow;
}

export async function repoUpdateDrugBrand(
  id: string,
  updates: Partial<Pick<DrugBrandDbRow, 'name' | 'logo' | 'deskripsi' | 'status' | 'color' | 'bg' | 'slug'>>,
): Promise<DrugBrandDbRow> {
  const { data, error } = await supabase
    .from('drug_brands')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  guard(error);
  return data as DrugBrandDbRow;
}

// ─── Products ────────────────────────────────────────────────────────────────

export async function repoGetDrugCommercialProducts(): Promise<DrugCommercialProductDbRow[]> {
  const { data, error } = await supabase
    .from('drug_commercial_products')
    .select('*')
    .order('name');
  guard(error);
  return (data ?? []) as DrugCommercialProductDbRow[];
}

export async function repoGetDrugCommercialProductById(id: string): Promise<DrugCommercialProductDbRow | null> {
  const { data, error } = await supabase
    .from('drug_commercial_products')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  guard(error);
  return data as DrugCommercialProductDbRow | null;
}

export async function repoGetDrugCommercialProductBySlug(slug: string): Promise<DrugCommercialProductDbRow | null> {
  const { data, error } = await supabase
    .from('drug_commercial_products')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  guard(error);
  return data as DrugCommercialProductDbRow | null;
}

export async function repoGetDrugCommercialProductsByBrand(brandId: string): Promise<DrugCommercialProductDbRow[]> {
  const { data, error } = await supabase
    .from('drug_commercial_products')
    .select('*')
    .eq('brand_id', brandId)
    .order('name');
  guard(error);
  return (data ?? []) as DrugCommercialProductDbRow[];
}

export async function repoCreateDrugCommercialProduct(input: {
  brand_id: string;
  master_obat_uuid?: string;
  name: string;
  nama_komersial?: string;
  bentuk_sediaan: string;
  kemasan: string;
  bahan_aktif?: string;
  kekuatan?: string;
  negara_asal?: string;
  penyimpanan?: string;
  produsen?: string;
  distributor?: string;
  nomor_registrasi?: string;
  foto_produk?: string;
  catatan?: string;
}): Promise<DrugCommercialProductDbRow> {
  const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${input.brand_id.slice(0, 8)}`;
  const { data, error } = await supabase
    .from('drug_commercial_products')
    .insert({
      brand_id: input.brand_id,
      master_obat_uuid: input.master_obat_uuid,
      name: input.name,
      slug,
      nama_komersial: input.nama_komersial,
      bentuk_sediaan: input.bentuk_sediaan,
      kemasan: input.kemasan,
      bahan_aktif: input.bahan_aktif,
      kekuatan: input.kekuatan,
      negara_asal: input.negara_asal,
      penyimpanan: input.penyimpanan,
      produsen: input.produsen,
      distributor: input.distributor,
      nomor_registrasi: input.nomor_registrasi,
      foto_produk: input.foto_produk,
      catatan: input.catatan,
    })
    .select()
    .single();
  guard(error);
  return data as DrugCommercialProductDbRow;
}

export async function repoUpdateDrugCommercialProduct(
  id: string,
  updates: Partial<Omit<DrugCommercialProductDbRow, 'id' | 'created_at' | 'updated_at'>>,
): Promise<DrugCommercialProductDbRow> {
  const { data, error } = await supabase
    .from('drug_commercial_products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  guard(error);
  return data as DrugCommercialProductDbRow;
}

export async function repoSoftDeleteDrugCommercialProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('drug_commercial_products')
    .update({ status: 'nonaktif', updated_at: new Date().toISOString() })
    .eq('id', id);
  guard(error);
}

export async function repoRestoreDrugCommercialProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('drug_commercial_products')
    .update({ status: 'aktif', updated_at: new Date().toISOString() })
    .eq('id', id);
  guard(error);
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export async function repoGetDrugBrandCount(): Promise<number> {
  const { count, error } = await supabase
    .from('drug_brands')
    .select('*', { count: 'exact', head: true });
  guard(error);
  return count ?? 0;
}

export async function repoGetDrugCommercialProductCount(): Promise<number> {
  const { count, error } = await supabase
    .from('drug_commercial_products')
    .select('*', { count: 'exact', head: true });
  guard(error);
  return count ?? 0;
}
