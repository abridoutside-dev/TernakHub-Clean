// ─── Produk Komersial Obat — Import & Export (PKO-007) ───────────────────────
// Bulk backup/restore of the Produk Komersial Obat trade-product catalog
// (Brand → Produk), scoped strictly to this module. Master Obat (obatData.ts)
// stays the read-only Single Source of Truth for masterObatUuid — this file
// never writes to it, only validates references against it.
//
// Source of truth: Supabase (drug_brands, drug_commercial_products tables)
// All export reads from database, all import writes to database.

import { getObatByUuid } from '../data/obatData';
import { logProdukKomersialObatEvent } from './produkKomersialObatAuditLog';
import {
  getObatBrandListLive,
  getObatProdukKomersialList,
  isDuplicateObatBrandNama,
  isDuplicateObatProdukNama,
  addObatBrand,
  addObatProdukKomersial,
  updateObatBrand,
  updateObatProdukKomersial,
  type ObatBrand,
  type ObatProdukKomersial,
  type StatusProdukObat,
} from '../services/drugCommercialProductService';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_STATUS = new Set<StatusProdukObat>(['aktif', 'nonaktif']);

function isValidUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v);
}

export const PRODUK_KOMERSIAL_OBAT_EXPORT_VERSION = 1;

export interface ProdukKomersialObatExportPayload {
  schema: 'produk-komersial-obat-export';
  version: number;
  exportedAt: string;
  data: {
    brand: ObatBrand[];
    produk: ObatProdukKomersial[];
  };
}

export type ImportMode = 'merge' | 'replace';
export type ImportFormat = 'json' | 'csv';

export interface ImportStats {
  brand: { added: number; updated: number; skipped: number };
  produk: { added: number; updated: number; skipped: number };
}

// ─── Export — JSON ─────────────────────────────────────────────────────────────

/** Reads current data from Supabase and builds export payload. */
export async function buildProdukKomersialObatExportPayload(): Promise<ProdukKomersialObatExportPayload> {
  const [brands, products] = await Promise.all([
    getObatBrandListLive(),
    getObatProdukKomersialList(),
  ]);

  return {
    schema: 'produk-komersial-obat-export',
    version: PRODUK_KOMERSIAL_OBAT_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      brand: JSON.parse(JSON.stringify(brands)),
      produk: JSON.parse(JSON.stringify(products)),
    },
  };
}

function triggerDownload(content: string, mime: string, filename: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadProdukKomersialObatExportJson(): Promise<string> {
  const payload = await buildProdukKomersialObatExportPayload();
  const filename = `produk-komersial-obat-export-${new Date().toISOString().slice(0, 10)}.json`;
  triggerDownload(JSON.stringify(payload, null, 2), 'application/json', filename);
  logProdukKomersialObatEvent('export', 'produk', `format=json, brand=${payload.data.brand.length}, produk=${payload.data.produk.length}`);
  return filename;
}

// ─── Export — CSV ───────────────────────────────────────────────────────────────
// Single flat table with a `record_type` discriminator column (brand/produk),
// since CSV has no nested structure. Blank cells for fields not applicable to
// that record type.

const CSV_COLUMNS = [
  'record_type', 'uuid', 'slug', 'nama', 'brand_uuid', 'master_obat_uuid',
  'bentuk_sediaan', 'kemasan', 'produsen', 'distributor', 'nomor_registrasi',
  'status', 'catatan', 'logo', 'deskripsi',
] as const;

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function buildProdukKomersialObatExportCsv(): Promise<string> {
  const [brands, products] = await Promise.all([
    getObatBrandListLive(),
    getObatProdukKomersialList(),
  ]);

  const rows: string[] = [CSV_COLUMNS.join(',')];

  for (const b of brands) {
    rows.push([
      'brand', b.uuid, b.slug, b.nama, '', '',
      '', '', '', '', '',
      b.status, '', b.logo, b.deskripsi ?? '',
    ].map(v => csvEscape(String(v))).join(','));
  }

  for (const p of products) {
    rows.push([
      'produk', p.uuid, p.slug, p.namaKomersial ?? p.nama, p.brandId, p.masterObatUuid ?? '',
      p.bentukSediaan, p.kemasan, p.produsen ?? '', p.distributor ?? '', p.nomorRegistrasi ?? '',
      p.status, p.catatan ?? '', '', '',
    ].map(v => csvEscape(String(v))).join(','));
  }

  return rows.join('\n');
}

export async function downloadProdukKomersialObatExportCsv(): Promise<string> {
  const csv = await buildProdukKomersialObatExportCsv();
  const [brands, products] = await Promise.all([
    getObatBrandListLive(),
    getObatProdukKomersialList(),
  ]);
  const filename = `produk-komersial-obat-export-${new Date().toISOString().slice(0, 10)}.csv`;
  // Prepend UTF-8 BOM so Excel auto-detects UTF-8 and renders Indonesian characters correctly.
  triggerDownload('\uFEFF' + csv, 'text/csv;charset=utf-8;', filename);
  logProdukKomersialObatEvent('export', 'produk', `format=csv, brand=${brands.length}, produk=${products.length}`);
  return filename;
}

// ─── CSV parsing (RFC4180-ish, handles quoted commas/newlines) ────────────────

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const n = text.length;

  while (i < n) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i += 1; continue;
      }
      field += c; i += 1; continue;
    }
    if (c === '"') { inQuotes = true; i += 1; continue; }
    if (c === ',') { row.push(field); field = ''; i += 1; continue; }
    if (c === '\r') { i += 1; continue; }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i += 1; continue; }
    field += c; i += 1;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0] !== ''));
}

function csvRowsToPayload(rows: string[][]): { raw: Record<string, string>[]; errors: string[] } {
  if (rows.length === 0) return { raw: [], errors: ['File CSV kosong.'] };
  const header = rows[0].map(h => h.trim());
  const missing = CSV_COLUMNS.filter(c => !header.includes(c));
  if (missing.length > 0) {
    return { raw: [], errors: [`Struktur CSV tidak valid: kolom wajib tidak ditemukan (${missing.join(', ')}).`] };
  }
  const raw: Record<string, string>[] = [];
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const obj: Record<string, string> = {};
    header.forEach((col, idx) => { obj[col] = cells[idx] ?? ''; });
    raw.push(obj);
  }
  return { raw, errors: [] };
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  payload?: ProdukKomersialObatExportPayload;
}

/**
 * Validates raw parsed data (from JSON or CSV) before any import mutation
 * happens:
 * - overall structure (schema/data/arrays, or CSV column set)
 * - every record has a valid UUID
 * - no duplicate UUIDs within the file (across brand + produk combined)
 * - every Produk's brand_uuid resolves to a Brand present either in the file
 *   itself or already in the database
 * - every Produk's master_obat_uuid resolves to an existing Master Obat entry
 *   (read-only reference — Master Obat itself is never touched)
 * - no required field left empty
 */
export async function validateProdukKomersialObatImport(raw: unknown): Promise<ValidationResult> {
  const errors: string[] = [];

  if (typeof raw !== 'object' || raw === null) {
    return { valid: false, errors: ['File tidak valid: bukan objek JSON.'] };
  }
  const obj = raw as Record<string, unknown>;

  if (obj.schema !== 'produk-komersial-obat-export') {
    errors.push('File tidak valid: schema tidak dikenali (bukan file export Produk Komersial Obat).');
  }
  if (typeof obj.data !== 'object' || obj.data === null) {
    return { valid: false, errors: [...errors, 'File tidak valid: struktur data tidak ditemukan.'] };
  }

  const data = obj.data as Record<string, unknown>;
  const brandRaw = data.brand;
  const produkRaw = data.produk;

  if (!Array.isArray(brandRaw)) errors.push('Struktur rusak: "brand" harus berupa daftar.');
  if (!Array.isArray(produkRaw)) errors.push('Struktur rusak: "produk" harus berupa daftar.');

  if (errors.length > 0) return { valid: false, errors };

  const brand = brandRaw as ObatBrand[];
  const produk = produkRaw as ObatProdukKomersial[];

  return validateBrandAndProduk(brand, produk, obj);
}

async function validateBrandAndProduk(
  brand: ObatBrand[], produk: ObatProdukKomersial[], obj: Record<string, unknown>,
): Promise<ValidationResult> {
  const errors: string[] = [];
  const seenUuids = new Set<string>();
  const dupUuids = new Set<string>();

  const brandUuidsInFile = new Set<string>();
  const brandNamaByOwner = new Map<string, string>();
  brand.forEach((b, i) => {
    if (!b || typeof b !== 'object') { errors.push(`Brand index ${i}: struktur rusak.`); return; }
    if (!isValidUuid(b.uuid)) { errors.push(`Brand index ${i}: UUID tidak valid.`); return; }
    if (seenUuids.has(b.uuid)) dupUuids.add(b.uuid); else seenUuids.add(b.uuid);
    if (typeof b.nama !== 'string' || !b.nama.trim()) { errors.push(`Brand ${b.uuid}: nama wajib diisi.`); return; }
    if (typeof b.slug !== 'string' || !b.slug.trim()) { errors.push(`Brand "${b.nama}": slug wajib diisi.`); return; }
    if (!VALID_STATUS.has(b.status)) { errors.push(`Brand "${b.nama}": status tidak valid.`); return; }
    const normNama = b.nama.trim().toLowerCase();
    const owner = brandNamaByOwner.get(normNama);
    if (owner && owner !== b.uuid) {
      errors.push(`Brand "${b.nama.trim()}": nama sudah digunakan oleh brand lain dalam file ini.`);
    } else {
      brandNamaByOwner.set(normNama, b.uuid);
    }
    brandUuidsInFile.add(b.uuid);
  });

  const liveBrands = await getObatBrandListLive();
  const liveBrandUuids = new Set(liveBrands.map(b => b.uuid));

  const produkNamaByOwner = new Map<string, string>();
  produk.forEach((p, i) => {
    if (!p || typeof p !== 'object') { errors.push(`Produk index ${i}: struktur rusak.`); return; }
    if (!isValidUuid(p.uuid)) { errors.push(`Produk index ${i}: UUID tidak valid.`); return; }
    if (seenUuids.has(p.uuid)) dupUuids.add(p.uuid); else seenUuids.add(p.uuid);
    if (typeof p.nama !== 'string' || !p.nama.trim()) { errors.push(`Produk ${p.uuid}: nama produk wajib diisi.`); return; }
    if (typeof p.bentukSediaan !== 'string' || !p.bentukSediaan.trim()) { errors.push(`Produk "${p.nama}": bentuk sediaan wajib diisi.`); return; }
    if (typeof p.kemasan !== 'string' || !p.kemasan.trim()) { errors.push(`Produk "${p.nama}": kemasan wajib diisi.`); return; }
    if (!VALID_STATUS.has(p.status)) { errors.push(`Produk "${p.nama}": status tidak valid.`); return; }

    if (!isValidUuid(p.brandId)) {
      errors.push(`Produk "${p.nama}": brand_uuid tidak valid.`);
    } else if (!brandUuidsInFile.has(p.brandId) && !liveBrandUuids.has(p.brandId)) {
      errors.push(`Produk "${p.nama}": brand_uuid "${p.brandId}" tidak ditemukan (relasi rusak).`);
    }

    if (!p.masterObatUuid || !isValidUuid(p.masterObatUuid)) {
      errors.push(`Produk "${p.nama}": master_obat_uuid tidak valid.`);
    } else if (!getObatByUuid(p.masterObatUuid)) {
      errors.push(`Produk "${p.nama}": master_obat_uuid "${p.masterObatUuid}" tidak ditemukan di Master Obat (relasi rusak).`);
    }

    const key = `${p.brandId}::${p.nama.trim().toLowerCase()}`;
    const owner = produkNamaByOwner.get(key);
    if (owner && owner !== p.uuid) {
      errors.push(`Produk "${p.nama.trim()}": nama sudah digunakan pada brand yang sama dalam file ini.`);
    } else {
      produkNamaByOwner.set(key, p.uuid);
    }
  });

  if (dupUuids.size > 0) {
    errors.push(`UUID duplikat ditemukan dalam file: ${Array.from(dupUuids).join(', ')}`);
  }

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    errors: [],
    payload: {
      schema: 'produk-komersial-obat-export',
      version: typeof obj.version === 'number' ? obj.version : PRODUK_KOMERSIAL_OBAT_EXPORT_VERSION,
      exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
      data: { brand, produk },
    },
  };
}

// ─── CSV → payload ──────────────────────────────────────────────────────────────

function csvRawToEntities(raw: Record<string, string>[]): { brand: ObatBrand[]; produk: ObatProdukKomersial[]; errors: string[] } {
  const errors: string[] = [];
  const brand: ObatBrand[] = [];
  const produk: ObatProdukKomersial[] = [];
  const palette = [{ color: '#0d6efd', bg: '#e7f1ff' }];

  raw.forEach((row, i) => {
    const type = row.record_type?.trim();
    if (type === 'brand') {
      brand.push({
        uuid: row.uuid?.trim(), slug: row.slug?.trim(), nama: row.nama?.trim(),
        logo: row.logo?.trim() || '💊', deskripsi: row.deskripsi?.trim() || undefined,
        jumlahProduk: 0, status: (row.status?.trim() as StatusProdukObat) || 'aktif',
        color: palette[0].color, bg: palette[0].bg,
      } as ObatBrand);
    } else if (type === 'produk') {
      produk.push({
        uuid: row.uuid?.trim(), slug: row.slug?.trim() || row.uuid?.trim(),
        nama: row.nama?.trim(), brandId: row.brand_uuid?.trim(), brandNama: '',
        bentukSediaan: row.bentuk_sediaan?.trim(), kemasan: row.kemasan?.trim(),
        status: (row.status?.trim() as StatusProdukObat) || 'aktif',
        masterObatUuid: row.master_obat_uuid?.trim() || null,
        namaKomersial: row.nama?.trim(),
        produsen: row.produsen?.trim() || undefined,
        distributor: row.distributor?.trim() || undefined,
        nomorRegistrasi: row.nomor_registrasi?.trim() || undefined,
        catatan: row.catatan?.trim() || undefined,
      } as ObatProdukKomersial);
    } else {
      errors.push(`Baris ${i + 2}: record_type tidak dikenali ("${type}"). Harus "brand" atau "produk".`);
    }
  });

  return { brand, produk, errors };
}

// ─── Parse entry points ──────────────────────────────────────────────────────────

/** Parses raw file text (JSON or CSV, auto-detected) into a validated payload. */
export async function parseProdukKomersialObatImportFile(text: string, format: ImportFormat): Promise<ValidationResult> {
  if (format === 'json') {
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      return { valid: false, errors: ['File tidak valid: bukan format JSON yang benar.'] };
    }
    return validateProdukKomersialObatImport(raw);
  }

  // CSV
  const rows = parseCsvRows(text);
  const { raw, errors: structErrors } = csvRowsToPayload(rows);
  if (structErrors.length > 0) return { valid: false, errors: structErrors };

  const { brand, produk, errors: mapErrors } = csvRawToEntities(raw);
  if (mapErrors.length > 0) return { valid: false, errors: mapErrors };

  return validateBrandAndProduk(brand, produk, { schema: 'produk-komersial-obat-export' });
}

// ─── Import (apply) ───────────────────────────────────────────────────────────

/**
 * Applies an already-validated payload to Supabase.
 * - 'merge': adds records whose UUID doesn't already exist; updates existing
 *   records when the UUID matches; never removes anything.
 * - 'replace': clears all brands and products and replaces them with the
 *   imported records (UUIDs preserved as-is, never regenerated).
 *   Master Obat is never touched by either mode.
 */
export async function applyProdukKomersialObatImport(payload: ProdukKomersialObatExportPayload, mode: ImportMode): Promise<ImportStats> {
  const stats: ImportStats = {
    brand: { added: 0, updated: 0, skipped: 0 },
    produk: { added: 0, updated: 0, skipped: 0 },
  };

  const liveBrands = await getObatBrandListLive();
  const liveProducts = await getObatProdukKomersialList();
  const brandByUuid = new Map(liveBrands.map(b => [b.uuid, b]));

  if (mode === 'replace') {
    // Delete all existing products first, then brands
    for (const p of liveProducts) {
      const { repoSoftDeleteDrugCommercialProduct } = await import('../repositories/drugCommercialProductRepository');
      await repoSoftDeleteDrugCommercialProduct(p.uuid);
    }

    // Insert/update all brands from payload
    for (const b of payload.data.brand) {
      const existing = brandByUuid.get(b.uuid);
      if (existing) {
        await updateObatBrand(b.uuid, {
          nama: b.nama,
          logo: b.logo,
          deskripsi: b.deskripsi,
          status: b.status,
          color: b.color,
          bg: b.bg,
        });
        stats.brand.updated += 1;
      } else {
        const { repoCreateDrugBrand } = await import('../repositories/drugCommercialProductRepository');
        await repoCreateDrugBrand({
          name: b.nama,
          slug: b.slug,
          logo: b.logo,
          deskripsi: b.deskripsi,
          color: b.color,
          bg: b.bg,
        });
        stats.brand.added += 1;
      }
    }

    // Insert/update all products from payload
    for (const p of payload.data.produk) {
      const brandNama = brandByUuid.get(p.brandId)?.nama ?? p.brandNama;
      const existingProduct = liveProducts.find(lp => lp.uuid === p.uuid);
      if (existingProduct) {
        await updateObatProdukKomersial(p.uuid, {
          brandId: p.brandId,
          masterObatUuid: p.masterObatUuid ?? undefined,
          nama: p.nama,
          namaKomersial: p.namaKomersial,
          bentukSediaan: p.bentukSediaan,
          kemasan: p.kemasan,
          produsen: p.produsen,
          distributor: p.distributor,
          nomorRegistrasi: p.nomorRegistrasi,
          fotoProduk: p.fotoProduk,
          catatan: p.catatan,
          status: p.status,
        });
        stats.produk.updated += 1;
      } else {
        await addObatProdukKomersial({
          brandId: p.brandId,
          masterObatUuid: p.masterObatUuid ?? '',
          nama: p.nama,
          namaKomersial: p.namaKomersial ?? p.nama,
          bentukSediaan: p.bentukSediaan,
          kemasan: p.kemasan,
          produsen: p.produsen ?? '',
          distributor: p.distributor,
          nomorRegistrasi: p.nomorRegistrasi,
          fotoProduk: p.fotoProduk,
          catatan: p.catatan,
          bahanAktif: p.bahanAktif,
          kekuatan: p.kekuatan,
          negaraAsal: p.negaraAsal,
          penyimpanan: p.penyimpanan,
        });
        stats.produk.added += 1;
      }
    }

    logProdukKomersialObatEvent('import', 'brand', `mode=replace, stats=${JSON.stringify(stats)}`);
    logProdukKomersialObatEvent('replace', 'produk', JSON.stringify(stats));
    return stats;
  }

  // merge
  for (const b of payload.data.brand) {
    const existing = brandByUuid.get(b.uuid);
    if (existing) {
      const isDup = await isDuplicateObatBrandNama(b.nama, b.uuid);
      if (isDup) { stats.brand.skipped += 1; continue; }
      await updateObatBrand(b.uuid, {
        nama: b.nama,
        logo: b.logo,
        deskripsi: b.deskripsi,
        status: b.status,
        color: b.color,
        bg: b.bg,
      });
      stats.brand.updated += 1;
      continue;
    }
    const isDup = await isDuplicateObatBrandNama(b.nama);
    if (isDup) { stats.brand.skipped += 1; continue; }
    await addObatBrand({
      nama: b.nama,
      logo: b.logo,
      deskripsi: b.deskripsi ?? '',
    });
    stats.brand.added += 1;
  }

  // Refresh brand list after brand merges
  const updatedBrands = await getObatBrandListLive();
  const updatedBrandByUuid = new Map(updatedBrands.map(b => [b.uuid, b]));
  const updatedProducts = await getObatProdukKomersialList();
  const produkByUuid = new Map(updatedProducts.map(p => [p.uuid, p]));

  for (const p of payload.data.produk) {
    if (!updatedBrandByUuid.has(p.brandId)) { stats.produk.skipped += 1; continue; }
    if (!p.masterObatUuid || !getObatByUuid(p.masterObatUuid)) { stats.produk.skipped += 1; continue; }

    const existing = produkByUuid.get(p.uuid);
    if (existing) {
      const isDup = await isDuplicateObatProdukNama(p.brandId, p.nama, p.uuid);
      if (isDup) { stats.produk.skipped += 1; continue; }
      await updateObatProdukKomersial(p.uuid, {
        brandId: p.brandId,
        masterObatUuid: p.masterObatUuid,
        nama: p.nama,
        namaKomersial: p.namaKomersial,
        bentukSediaan: p.bentukSediaan,
        kemasan: p.kemasan,
        produsen: p.produsen,
        distributor: p.distributor,
        nomorRegistrasi: p.nomorRegistrasi,
        fotoProduk: p.fotoProduk,
        catatan: p.catatan,
        status: p.status,
      });
      stats.produk.updated += 1;
      continue;
    }
    const isDup = await isDuplicateObatProdukNama(p.brandId, p.nama);
    if (isDup) { stats.produk.skipped += 1; continue; }
    const brandNama = updatedBrandByUuid.get(p.brandId)?.nama ?? p.brandNama;
    await addObatProdukKomersial({
      brandId: p.brandId,
      masterObatUuid: p.masterObatUuid ?? '',
      nama: p.nama,
      namaKomersial: p.namaKomersial ?? p.nama,
      bentukSediaan: p.bentukSediaan,
      kemasan: p.kemasan,
      produsen: p.produsen ?? '',
      distributor: p.distributor,
      nomorRegistrasi: p.nomorRegistrasi,
      fotoProduk: p.fotoProduk,
      catatan: p.catatan,
      bahanAktif: p.bahanAktif,
      kekuatan: p.kekuatan,
      negaraAsal: p.negaraAsal,
      penyimpanan: p.penyimpanan,
    });
    stats.produk.added += 1;
  }

  logProdukKomersialObatEvent('import', 'brand', `mode=merge, stats=${JSON.stringify(stats)}`);
  logProdukKomersialObatEvent('merge', 'produk', JSON.stringify(stats));
  return stats;
}
