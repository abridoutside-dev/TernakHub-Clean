-- 20260823000002_add_stock_workspace_indexes.sql
-- Add missing workspace_id indexes on stock transaction tables.
-- Idempotent: CREATE INDEX IF NOT EXISTS.

CREATE INDEX IF NOT EXISTS idx_stok_obat_masuk_workspace_id
  ON stok_obat_masuk (workspace_id);

CREATE INDEX IF NOT EXISTS idx_stok_obat_keluar_workspace_id
  ON stok_obat_keluar (workspace_id);

CREATE INDEX IF NOT EXISTS idx_stok_obat_adjustments_workspace_id
  ON stok_obat_adjustments (workspace_id);
