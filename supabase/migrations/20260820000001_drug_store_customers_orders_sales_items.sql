-- P1.3 — Drug Store customers, order_items, sales_items
-- Adds item-level detail and customer domain for the Drug Store workspace kind.
--
-- SAFETY:
--   - Additive only. Does not delete or modify existing column data.
--   - Historical orders/sales remain valid (customer_id / items are optional).
--   - All new tables have workspace_id + FK to workspaces(id) for RLS.
--   - stok_id references stok_obat (Drug Store's inventory table), not stok_inventaris.

-- ─── drug_store_customers ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS drug_store_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  address text,
  province text,
  city text,
  customer_type text
    CHECK (customer_type IS NULL OR customer_type IN ('Individu', 'Perusahaan', 'Koperasi')),
  status text NOT NULL DEFAULT 'Aktif'
    CHECK (status IN ('Aktif', 'Nonaktif')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drug_store_customers_workspace_id
  ON drug_store_customers (workspace_id);

-- ─── Add customer_id FK to drug_store_orders ────────────────────────────────────

ALTER TABLE drug_store_orders
  ADD COLUMN IF NOT EXISTS customer_id uuid
    REFERENCES drug_store_customers(id) ON DELETE SET NULL;

-- ─── Add customer_id FK to drug_store_sales ─────────────────────────────────────

ALTER TABLE drug_store_sales
  ADD COLUMN IF NOT EXISTS customer_id uuid
    REFERENCES drug_store_customers(id) ON DELETE SET NULL;

-- ─── drug_store_order_items ─────────────────────────────────────────────────────
-- Item-level detail for drug_store_orders, mirroring feed_store_order_items.
-- stok_id references stok_obat (Drug Store inventory).

CREATE TABLE IF NOT EXISTS drug_store_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES drug_store_orders(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  stok_id uuid
    REFERENCES stok_obat(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  quantity bigint NOT NULL CHECK (quantity >= 0),
  unit text,
  unit_price bigint NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  subtotal bigint NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drug_store_order_items_order_id
  ON drug_store_order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_drug_store_order_items_workspace_id
  ON drug_store_order_items (workspace_id);

-- ─── drug_store_sales_items ─────────────────────────────────────────────────────
-- Item-level detail for drug_store_sales, mirroring feed_store_sales_items.
-- stok_id references stok_obat (Drug Store inventory).

CREATE TABLE IF NOT EXISTS drug_store_sales_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES drug_store_sales(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  stok_id uuid
    REFERENCES stok_obat(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  quantity bigint NOT NULL CHECK (quantity >= 0),
  unit text,
  unit_price bigint NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  subtotal bigint NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drug_store_sales_items_sale_id
  ON drug_store_sales_items (sale_id);
CREATE INDEX IF NOT EXISTS idx_drug_store_sales_items_workspace_id
  ON drug_store_sales_items (workspace_id);

-- ─── RLS ────────────────────────────────────────────────────────────────────────

ALTER TABLE drug_store_customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_store_order_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_store_sales_items   ENABLE ROW LEVEL SECURITY;

-- ─── Grants ─────────────────────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE drug_store_customers     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE drug_store_order_items   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE drug_store_sales_items   TO authenticated;

-- ─── Policies: drug_store_customers ──────────────────────────────────────────────

CREATE POLICY drug_store_customers_select
  ON drug_store_customers FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY drug_store_customers_insert
  ON drug_store_customers FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY drug_store_customers_update
  ON drug_store_customers FOR UPDATE
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY drug_store_customers_delete
  ON drug_store_customers FOR DELETE
  USING (is_workspace_member(workspace_id));

-- ─── Policies: drug_store_order_items ────────────────────────────────────────────
-- Items are scoped through their own workspace_id column (matches Feed Store pattern).

CREATE POLICY drug_store_order_items_select
  ON drug_store_order_items FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY drug_store_order_items_insert
  ON drug_store_order_items FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY drug_store_order_items_update
  ON drug_store_order_items FOR UPDATE
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY drug_store_order_items_delete
  ON drug_store_order_items FOR DELETE
  USING (is_workspace_member(workspace_id));

-- ─── Policies: drug_store_sales_items ────────────────────────────────────────────

CREATE POLICY drug_store_sales_items_select
  ON drug_store_sales_items FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY drug_store_sales_items_insert
  ON drug_store_sales_items FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY drug_store_sales_items_update
  ON drug_store_sales_items FOR UPDATE
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY drug_store_sales_items_delete
  ON drug_store_sales_items FOR DELETE
  USING (is_workspace_member(workspace_id));
