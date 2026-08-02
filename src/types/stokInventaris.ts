// ─── Stok Inventaris DB Types — FLOW-003M16 ────────────────────────────────────
//
// TypeScript types for:
//   stok_inventaris           — master item rows
//   stok_inventaris_transactions — transaction log rows
//
// Schema: supabase/migrations/20260725000007_feed_marketplace.sql
// Enums:  supabase/migrations/20260725000002_enums.sql
//   stok_status_enum = 'Aktif' | 'Habis' | 'Kadaluarsa' | 'Diarsipkan'

// ─── stok_inventaris ──────────────────────────────────────────────────────────

export type StokInventarisSourceType = 'Master Pakan' | 'Produk Komersial' | 'Formula';
export type StokInventarisStatus = 'Aktif' | 'Habis' | 'Kadaluarsa' | 'Diarsipkan';

export interface StokInventarisDbRow {
  id: string;
  workspace_id: string;
  source_type: StokInventarisSourceType;
  /** UUID → master_pakan_catalog.id. Required (NOT NULL) when source_type = 'Master Pakan'. */
  master_pakan_id: string | null;
  /** UUID → feed_formulas.id. Required (NOT NULL) when source_type = 'Formula'. */
  formula_id: string | null;
  item_name: string;
  /** Live quantity — maintained by apply_stok_inventaris_transaction() trigger. */
  quantity: number;
  unit: string | null;
  min_stock: number | null;
  purchase_price_per_kg: number | null;
  status: StokInventarisStatus;
  /**
   * JSON blob for display-only fields not in the schema.
   * Written by stokInventarisService; parsed by useStokInventaris.
   * Keys: b (brand), sup (supplier), loc (lokasiPenyimpanan), rid (referensiId),
   *       hp (hargaBeli), tm (tanggalMasuk ISO), c (catatan), fn (formulaNama), kat (kategori).
   */
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StokInventarisCreateInput {
  workspace_id: string;
  source_type: StokInventarisSourceType;
  master_pakan_id?: string | null;
  formula_id?: string | null;
  item_name: string;
  /** Start at 0; DB trigger increments after first transaction. */
  quantity?: number;
  unit?: string | null;
  min_stock?: number | null;
  purchase_price_per_kg?: number | null;
  status?: StokInventarisStatus;
  notes?: string | null;
}

export interface StokInventarisPatchInput {
  quantity?: number;
  unit?: string | null;
  purchase_price_per_kg?: number | null;
  status?: StokInventarisStatus;
  notes?: string | null;
  min_stock?: number | null;
}

// ─── stok_inventaris_transactions ─────────────────────────────────────────────

export type StokTransactionType = 'Masuk' | 'Keluar' | 'Penyesuaian';

export interface StokTransactionDbRow {
  id: string;
  stok_id: string;
  workspace_id: string;
  transaction_type: StokTransactionType;
  /**
   * Positive for Masuk (stock-in), negative for Keluar (stock-out).
   * The DB trigger apply_stok_inventaris_transaction() adds this to stok_inventaris.quantity.
   */
  quantity_delta: number;
  quantity_before: number | null;
  quantity_after: number | null;
  reason: string | null;
  reference_id: string | null;
  reference_type: string | null;
  recorded_by: string | null;
  transaction_date: string; // date
  created_at: string;
}

export interface StokTransactionCreateInput {
  stok_id: string;
  workspace_id: string;
  transaction_type: StokTransactionType;
  quantity_delta: number;
  quantity_before?: number | null;
  quantity_after?: number | null;
  reason?: string | null;
  reference_id?: string | null;
  reference_type?: string | null;
  recorded_by?: string | null;
  transaction_date: string; // YYYY-MM-DD
}
