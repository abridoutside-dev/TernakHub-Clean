-- P1.2 — Feed Store Sales Items
-- Adds line-item detail for feed_store_sales so standalone sales
-- can trace back to products/quantities just like feed_store_order_items.
--
-- SAFETY:
--   - New table only. Does not modify or delete existing data.
--   - Historical sales rows remain valid (items are optional).
--   - FK to stok_inventaris is SET NULL on delete (preserves audit trail).

CREATE TABLE feed_store_sales_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES feed_store_sales(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  stok_id uuid
    REFERENCES stok_inventaris(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  quantity bigint NOT NULL CHECK (quantity >= 0),
  unit text,
  unit_price bigint NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  subtotal bigint NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_feed_store_sales_items_sale_id
  ON feed_store_sales_items (sale_id);

CREATE INDEX idx_feed_store_sales_items_workspace_id
  ON feed_store_sales_items (workspace_id);
