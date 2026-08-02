// ─── Stok Obat Module DB Row Types — FLOW-003M8 ──────────────────────────────
//
// Typed representations of Supabase table rows for the Stok Obat module.
// These mirror the schema defined in:
//   supabase/migrations/20260725000006_health_reproduction.sql
//
// Rules:
//  - These types are ONLY for the repository layer.
//  - Pages and services use the existing in-memory types from src/data/stokObatData.ts.
//  - stokObatRepository.ts converts between DB rows and in-memory types.
//  - Never import these directly from pages or components.

// ─── stok_obat ───────────────────────────────────────────────────────────────
// stok_status_enum: 'Aktif' | 'Habis' | 'Kadaluarsa' | 'Diarsipkan'

export type StokStatusEnum = 'Aktif' | 'Habis' | 'Kadaluarsa' | 'Diarsipkan';

export interface StokObatDbRow {
  /** UUID v4 — server-generated */
  id: string;
  /** FK → workspaces.id — NOT NULL */
  workspace_id: string;
  /** FK → drug_catalog.id — nullable */
  drug_id: string | null;
  /** Primary drug name (namaProduk) — NOT NULL */
  drug_name: string;
  /** FK → drug_categories.id — nullable */
  category_id: string | null;
  /** Current stock quantity (auto-updated by DB triggers on masuk/keluar) */
  quantity: number;
  /** Unit of measurement (satuan) */
  unit: string;
  /** Minimum stock threshold (stok minimum) */
  min_stock: number | null;
  /** Expiry date YYYY-MM-DD */
  expiry_date: string | null;
  /** Batch/lot number from manufacturer */
  batch_number: string | null;
  /** stok_status_enum — defaults to 'Aktif' */
  status: StokStatusEnum;
  /** Storage location text */
  location: string | null;
  /** Purchase price in IDR (bigint) */
  purchase_price: number | null;
  /**
   * Notes field — for M8, also carries metadata JSON written by the service:
   *   {"b":"brand","s":"bentukSediaan","k":"kemasan","p":"produkKomersialUuid","o":"masterObatUuid"}
   * This allows full round-trip of StokObatItem fields that are not in the DB schema.
   */
  notes: string | null;
  /** ISO timestamp */
  created_at: string;
  /** ISO timestamp */
  updated_at: string;
}

export type StokObatCreateInput = Omit<StokObatDbRow, 'id' | 'created_at' | 'updated_at'>;

export type StokObatPatchInput = Partial<
  Pick<StokObatDbRow, 'quantity' | 'status' | 'location' | 'notes' | 'min_stock'>
>;

// ─── stok_obat_masuk ─────────────────────────────────────────────────────────
// Stock-in receipts. A DB trigger (after_stok_obat_masuk) automatically
// increments stok_obat.quantity when a row is inserted here.

export interface StokObatMasukDbRow {
  id: string;
  /** FK → stok_obat.id — NOT NULL */
  stok_obat_id: string;
  workspace_id: string;
  /** Quantity received — must be > 0 */
  quantity: number;
  /** Source description (e.g. 'Pembelian', 'Hibah') */
  source: string | null;
  supplier: string | null;
  purchase_price: number | null;
  invoice_number: string | null;
  /** YYYY-MM-DD — date goods were received */
  received_date: string;
  notes: string | null;
  /** FK → auth.users.id */
  recorded_by: string | null;
  created_at: string;
}

export type StokObatMasukCreateInput = Omit<StokObatMasukDbRow, 'id' | 'created_at'>;

// ─── stok_obat_keluar ────────────────────────────────────────────────────────
// Stock-out/dispensing records. A DB trigger (after_stok_obat_keluar)
// automatically decrements stok_obat.quantity when a row is inserted here.
// Key: treatment_id FK → health_treatments.id — used by KH-006 (M9).

export interface StokObatKeluarDbRow {
  id: string;
  /** FK → stok_obat.id — NOT NULL */
  stok_obat_id: string;
  workspace_id: string;
  /** FK → health_treatments.id — null for non-treatment dispensing */
  treatment_id: string | null;
  /** Quantity dispensed — must be > 0 */
  quantity: number;
  reason: string | null;
  /** FK → livestock.id — which animal received the drug */
  livestock_id: string | null;
  /** YYYY-MM-DD — date of dispensing */
  usage_date: string;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
}

export type StokObatKeluarCreateInput = Omit<StokObatKeluarDbRow, 'id' | 'created_at'>;

// ─── stok_obat_adjustments ───────────────────────────────────────────────────
// Manual stock adjustment records (opname, expire correction, damage, etc.).
// Unlike masuk/keluar, there is NO DB trigger for adjustments — the service
// must explicitly patch stok_obat.quantity after inserting here.

export interface StokObatAdjustmentDbRow {
  id: string;
  /** FK → stok_obat.id — NOT NULL */
  stok_obat_id: string;
  workspace_id: string;
  quantity_before: number;
  quantity_after: number;
  /** Positive = added, negative = reduced */
  quantity_delta: number;
  /** AlasanPenyesuaianStok value */
  reason: string;
  /** FK → auth.users.id */
  adjusted_by: string | null;
  adjusted_at: string;
}

export type StokObatAdjustmentCreateInput = Omit<StokObatAdjustmentDbRow, 'id' | 'adjusted_at'>;
