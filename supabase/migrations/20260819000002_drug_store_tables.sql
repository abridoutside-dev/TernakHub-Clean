-- P1.1 — Drug Store tables
-- Creates 3 tables for the Drug Store workspace kind:
--   drug_store_suppliers  → PBF/distributor per workspace
--   drug_store_orders     → order pembelian & penjualan
--   drug_store_sales      → catatan penjualan toko obat
--
-- Schema matches existing TypeScript types in src/types/drugStore.ts
-- and repository in src/repositories/drugStoreRepository.ts.

-- ─── drug_store_suppliers ──────────────────────────────────────────────────────

CREATE TABLE drug_store_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  address text,
  province text,
  city text,
  status text NOT NULL DEFAULT 'Aktif'
    CHECK (status IN ('Aktif', 'Nonaktif')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_drug_store_suppliers_workspace_id
  ON drug_store_suppliers (workspace_id);

-- ─── drug_store_orders ────────────────────────────────────────────────────────

CREATE TABLE drug_store_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  order_number text,
  order_type text NOT NULL
    CHECK (order_type IN ('Pembelian', 'Penjualan')),
  supplier_id uuid
    REFERENCES drug_store_suppliers(id) ON DELETE SET NULL,
  customer_name text,
  status text NOT NULL DEFAULT 'Baru'
    CHECK (status IN ('Baru', 'Diproses', 'Selesai', 'Dibatalkan')),
  total_amount bigint NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  order_date date NOT NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_drug_store_orders_workspace_id
  ON drug_store_orders (workspace_id);
CREATE INDEX idx_drug_store_orders_order_date
  ON drug_store_orders (order_date);
CREATE INDEX idx_drug_store_orders_workspace_type
  ON drug_store_orders (workspace_id, order_type);

-- ─── drug_store_sales ─────────────────────────────────────────────────────────

CREATE TABLE drug_store_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  order_id uuid
    REFERENCES drug_store_orders(id) ON DELETE SET NULL,
  sale_date date NOT NULL,
  total_amount bigint NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  payment_method text,
  status text NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Selesai', 'Pending', 'Dibatalkan')),
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_drug_store_sales_workspace_id
  ON drug_store_sales (workspace_id);
CREATE INDEX idx_drug_store_sales_sale_date
  ON drug_store_sales (sale_date);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE drug_store_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_store_sales ENABLE ROW LEVEL SECURITY;

-- ─── Policies: drug_store_suppliers ────────────────────────────────────────────

CREATE POLICY drug_store_suppliers_select
  ON drug_store_suppliers FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY drug_store_suppliers_insert
  ON drug_store_suppliers FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY drug_store_suppliers_update
  ON drug_store_suppliers FOR UPDATE
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY drug_store_suppliers_delete
  ON drug_store_suppliers FOR DELETE
  USING (is_workspace_member(workspace_id));

-- ─── Policies: drug_store_orders ────────────────────────────────────────────────

CREATE POLICY drug_store_orders_select
  ON drug_store_orders FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY drug_store_orders_insert
  ON drug_store_orders FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY drug_store_orders_update
  ON drug_store_orders FOR UPDATE
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY drug_store_orders_delete
  ON drug_store_orders FOR DELETE
  USING (is_workspace_member(workspace_id));

-- ─── Policies: drug_store_sales ────────────────────────────────────────────────

CREATE POLICY drug_store_sales_select
  ON drug_store_sales FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY drug_store_sales_insert
  ON drug_store_sales FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY drug_store_sales_update
  ON drug_store_sales FOR UPDATE
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY drug_store_sales_delete
  ON drug_store_sales FOR DELETE
  USING (is_workspace_member(workspace_id));

-- ─── Grants ────────────────────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE drug_store_suppliers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE drug_store_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE drug_store_sales TO authenticated;
