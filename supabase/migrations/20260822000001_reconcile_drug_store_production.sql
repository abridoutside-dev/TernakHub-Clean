-- 20260822000001_reconcile_drug_store_production.sql
-- Rekonsiliasi schema production agar sesuai dengan target migration Toko Obat.
-- Idempotent: aman dijalankan berulang kali; tidak menghapus data.
-- ============================================================

-- ============================================================
-- A. ENUM workspace_type — tambah DrugStore
-- ============================================================
ALTER TYPE workspace_type ADD VALUE IF NOT EXISTS 'DrugStore';

-- ============================================================
-- B. STOK OBAT FUNCTIONS — tambah workspace isolation
-- ============================================================
CREATE OR REPLACE FUNCTION public.add_stok_obat()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM stok_obat
    WHERE id = NEW.stok_obat_id
      AND workspace_id = NEW.workspace_id
  ) THEN
    RAISE EXCEPTION 'Stock item % does not belong to workspace %', NEW.stok_obat_id, NEW.workspace_id;
  END IF;

  UPDATE stok_obat
  SET quantity = quantity + NEW.quantity,
      status = CASE WHEN status = 'Habis' THEN 'Aktif' ELSE status END,
      updated_at = now()
  WHERE id = NEW.stok_obat_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock item % does not exist', NEW.stok_obat_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.deduct_stok_obat()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_quantity numeric;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM stok_obat
    WHERE id = NEW.stok_obat_id
      AND workspace_id = NEW.workspace_id
  ) THEN
    RAISE EXCEPTION 'Stock item % does not belong to workspace %', NEW.stok_obat_id, NEW.workspace_id;
  END IF;

  SELECT quantity INTO current_quantity
  FROM stok_obat
  WHERE id = NEW.stok_obat_id
  FOR UPDATE;

  IF current_quantity IS NULL THEN
    RAISE EXCEPTION 'Stock item % does not exist', NEW.stok_obat_id;
  END IF;
  IF current_quantity < NEW.quantity THEN
    RAISE EXCEPTION 'Insufficient medicine stock for %', NEW.stok_obat_id;
  END IF;

  UPDATE stok_obat
  SET quantity = quantity - NEW.quantity,
      status = CASE WHEN quantity - NEW.quantity <= 0 THEN 'Habis' ELSE status END,
      updated_at = now()
  WHERE id = NEW.stok_obat_id;
  RETURN NEW;
END;
$$;

-- ============================================================
-- C. TABEL drug_store_suppliers — tambah kolom, index, RLS, policy
-- ============================================================

-- Kolom yang belum ada
ALTER TABLE drug_store_suppliers ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE drug_store_suppliers ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE drug_store_suppliers ADD COLUMN IF NOT EXISTS province text;
ALTER TABLE drug_store_suppliers ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE drug_store_suppliers ADD COLUMN IF NOT EXISTS notes text;

-- Default & CHECK status
ALTER TABLE drug_store_suppliers ALTER COLUMN status SET DEFAULT 'Aktif';

ALTER TABLE drug_store_suppliers DROP CONSTRAINT IF EXISTS drug_store_suppliers_status_check;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'drug_store_suppliers_status_check'
      AND conrelid::regclass::text = 'drug_store_suppliers'
  ) THEN
    ALTER TABLE drug_store_suppliers
      ADD CONSTRAINT drug_store_suppliers_status_check
      CHECK (status = ANY (ARRAY['Aktif'::text, 'Nonaktif'::text]));
  END IF;
END;
$$;

-- RLS
ALTER TABLE drug_store_suppliers ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'drug_store_suppliers' AND policyname = 'drug_store_suppliers_select'
  ) THEN
    CREATE POLICY drug_store_suppliers_select ON drug_store_suppliers FOR SELECT USING (is_workspace_member(workspace_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'drug_store_suppliers' AND policyname = 'drug_store_suppliers_insert'
  ) THEN
    CREATE POLICY drug_store_suppliers_insert ON drug_store_suppliers FOR INSERT WITH CHECK (is_workspace_member(workspace_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'drug_store_suppliers' AND policyname = 'drug_store_suppliers_update'
  ) THEN
    CREATE POLICY drug_store_suppliers_update ON drug_store_suppliers FOR UPDATE USING (is_workspace_member(workspace_id)) WITH CHECK (is_workspace_member(workspace_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'drug_store_suppliers' AND policyname = 'drug_store_suppliers_delete'
  ) THEN
    CREATE POLICY drug_store_suppliers_delete ON drug_store_suppliers FOR DELETE USING (is_workspace_member(workspace_id));
  END IF;
END;
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE drug_store_suppliers TO authenticated;

-- ============================================================
-- D. TABEL drug_store_orders — tambah kolom, index, RLS, policy, FK
-- ============================================================

-- Kolom yang belum ada
ALTER TABLE drug_store_orders ADD COLUMN IF NOT EXISTS order_number text;
ALTER TABLE drug_store_orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE drug_store_orders ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Default & CHECK
ALTER TABLE drug_store_orders ALTER COLUMN status SET DEFAULT 'Baru';

DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'drug_store_orders' AND column_name = 'total_amount') != 'bigint' THEN
    ALTER TABLE drug_store_orders ALTER COLUMN total_amount TYPE bigint USING total_amount::bigint;
  END IF;
END;
$$;

ALTER TABLE drug_store_orders DROP CONSTRAINT IF EXISTS drug_store_orders_status_check;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'drug_store_orders_status_check'
      AND conrelid::regclass::text = 'drug_store_orders'
  ) THEN
    ALTER TABLE drug_store_orders
      ADD CONSTRAINT drug_store_orders_status_check
      CHECK (status = ANY (ARRAY['Baru'::text, 'Diproses'::text, 'Selesai'::text, 'Dibatalkan'::text]));
  END IF;
END;
$$;

ALTER TABLE drug_store_orders DROP CONSTRAINT IF EXISTS drug_store_orders_total_amount_check;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'drug_store_orders_total_amount_check'
      AND conrelid::regclass::text = 'drug_store_orders'
  ) THEN
    ALTER TABLE drug_store_orders
      ADD CONSTRAINT drug_store_orders_total_amount_check
      CHECK (total_amount >= 0);
  END IF;
END;
$$;

-- Index yang belum ada
CREATE INDEX IF NOT EXISTS idx_drug_store_orders_order_date ON drug_store_orders (order_date);
CREATE INDEX IF NOT EXISTS idx_drug_store_orders_workspace_type ON drug_store_orders (workspace_id, order_type);

-- RLS
ALTER TABLE drug_store_orders ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'drug_store_orders' AND policyname = 'drug_store_orders_select'
  ) THEN
    CREATE POLICY drug_store_orders_select ON drug_store_orders FOR SELECT USING (is_workspace_member(workspace_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'drug_store_orders' AND policyname = 'drug_store_orders_insert'
  ) THEN
    CREATE POLICY drug_store_orders_insert ON drug_store_orders FOR INSERT WITH CHECK (is_workspace_member(workspace_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'drug_store_orders' AND policyname = 'drug_store_orders_update'
  ) THEN
    CREATE POLICY drug_store_orders_update ON drug_store_orders FOR UPDATE USING (is_workspace_member(workspace_id)) WITH CHECK (is_workspace_member(workspace_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'drug_store_orders' AND policyname = 'drug_store_orders_delete'
  ) THEN
    CREATE POLICY drug_store_orders_delete ON drug_store_orders FOR DELETE USING (is_workspace_member(workspace_id));
  END IF;
END;
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE drug_store_orders TO authenticated;

-- ============================================================
-- E. TABEL drug_store_sales — tambah kolom, index, RLS, policy, FK
-- ============================================================

-- Kolom yang belum ada
ALTER TABLE drug_store_sales ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE drug_store_sales ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- customer_id ditambahkan di bagian Foreign Keys setelah drug_store_customers ada

-- Default & CHECK
ALTER TABLE drug_store_sales ALTER COLUMN status SET DEFAULT 'Pending';

ALTER TABLE drug_store_sales DROP CONSTRAINT IF EXISTS drug_store_sales_status_check;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'drug_store_sales_status_check'
      AND conrelid::regclass::text = 'drug_store_sales'
  ) THEN
    ALTER TABLE drug_store_sales
      ADD CONSTRAINT drug_store_sales_status_check
      CHECK (status = ANY (ARRAY['Selesai'::text, 'Pending'::text, 'Dibatalkan'::text]));
  END IF;
END;
$$;

ALTER TABLE drug_store_sales DROP CONSTRAINT IF EXISTS drug_store_sales_total_amount_check;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'drug_store_sales_total_amount_check'
      AND conrelid::regclass::text = 'drug_store_sales'
  ) THEN
    ALTER TABLE drug_store_sales
      ADD CONSTRAINT drug_store_sales_total_amount_check
      CHECK (total_amount >= 0);
  END IF;
END;
$$;

-- Index yang belum ada
CREATE INDEX IF NOT EXISTS idx_drug_store_sales_sale_date ON drug_store_sales (sale_date);

-- RLS
ALTER TABLE drug_store_sales ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'drug_store_sales' AND policyname = 'drug_store_sales_select'
  ) THEN
    CREATE POLICY drug_store_sales_select ON drug_store_sales FOR SELECT USING (is_workspace_member(workspace_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'drug_store_sales' AND policyname = 'drug_store_sales_insert'
  ) THEN
    CREATE POLICY drug_store_sales_insert ON drug_store_sales FOR INSERT WITH CHECK (is_workspace_member(workspace_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'drug_store_sales' AND policyname = 'drug_store_sales_update'
  ) THEN
    CREATE POLICY drug_store_sales_update ON drug_store_sales FOR UPDATE USING (is_workspace_member(workspace_id)) WITH CHECK (is_workspace_member(workspace_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'drug_store_sales' AND policyname = 'drug_store_sales_delete'
  ) THEN
    CREATE POLICY drug_store_sales_delete ON drug_store_sales FOR DELETE USING (is_workspace_member(workspace_id));
  END IF;
END;
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE drug_store_sales TO authenticated;

-- ============================================================
-- F. TABEL drug_store_customers — buat jika belum ada
-- ============================================================
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
    CHECK (customer_type IS NULL OR customer_type IN ('Individu'::text, 'Perusahaan'::text, 'Koperasi'::text)),
  status text NOT NULL DEFAULT 'Aktif'
    CHECK (status IN ('Aktif'::text, 'Nonaktif'::text)),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drug_store_customers_workspace_id
  ON drug_store_customers (workspace_id);

ALTER TABLE drug_store_customers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'drug_store_customers' AND policyname = 'drug_store_customers_select'
  ) THEN
    CREATE POLICY drug_store_customers_select ON drug_store_customers FOR SELECT USING (is_workspace_member(workspace_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'drug_store_customers' AND policyname = 'drug_store_customers_insert'
  ) THEN
    CREATE POLICY drug_store_customers_insert ON drug_store_customers FOR INSERT WITH CHECK (is_workspace_member(workspace_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'drug_store_customers' AND policyname = 'drug_store_customers_update'
  ) THEN
    CREATE POLICY drug_store_customers_update ON drug_store_customers FOR UPDATE USING (is_workspace_member(workspace_id)) WITH CHECK (is_workspace_member(workspace_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'drug_store_customers' AND policyname = 'drug_store_customers_delete'
  ) THEN
    CREATE POLICY drug_store_customers_delete ON drug_store_customers FOR DELETE USING (is_workspace_member(workspace_id));
  END IF;
END;
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE drug_store_customers TO authenticated;

-- ============================================================
-- G. TABEL drug_store_order_items — buat jika belum ada
-- ============================================================
CREATE TABLE IF NOT EXISTS drug_store_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES drug_store_orders(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  stok_id uuid REFERENCES stok_obat(id) ON DELETE SET NULL,
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

ALTER TABLE drug_store_order_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'drug_store_order_items' AND policyname = 'drug_store_order_items_select'
  ) THEN
    CREATE POLICY drug_store_order_items_select ON drug_store_order_items FOR SELECT USING (is_workspace_member(workspace_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'drug_store_order_items' AND policyname = 'drug_store_order_items_insert'
  ) THEN
    CREATE POLICY drug_store_order_items_insert ON drug_store_order_items FOR INSERT WITH CHECK (is_workspace_member(workspace_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'drug_store_order_items' AND policyname = 'drug_store_order_items_update'
  ) THEN
    CREATE POLICY drug_store_order_items_update ON drug_store_order_items FOR UPDATE USING (is_workspace_member(workspace_id)) WITH CHECK (is_workspace_member(workspace_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'drug_store_order_items' AND policyname = 'drug_store_order_items_delete'
  ) THEN
    CREATE POLICY drug_store_order_items_delete ON drug_store_order_items FOR DELETE USING (is_workspace_member(workspace_id));
  END IF;
END;
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE drug_store_order_items TO authenticated;

-- ============================================================
-- H. TABEL drug_store_sales_items — buat jika belum ada
-- ============================================================
CREATE TABLE IF NOT EXISTS drug_store_sales_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES drug_store_sales(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  stok_id uuid REFERENCES stok_obat(id) ON DELETE SET NULL,
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

ALTER TABLE drug_store_sales_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'drug_store_sales_items' AND policyname = 'drug_store_sales_items_select'
  ) THEN
    CREATE POLICY drug_store_sales_items_select ON drug_store_sales_items FOR SELECT USING (is_workspace_member(workspace_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'drug_store_sales_items' AND policyname = 'drug_store_sales_items_insert'
  ) THEN
    CREATE POLICY drug_store_sales_items_insert ON drug_store_sales_items FOR INSERT WITH CHECK (is_workspace_member(workspace_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'drug_store_sales_items' AND policyname = 'drug_store_sales_items_update'
  ) THEN
    CREATE POLICY drug_store_sales_items_update ON drug_store_sales_items FOR UPDATE USING (is_workspace_member(workspace_id)) WITH CHECK (is_workspace_member(workspace_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'drug_store_sales_items' AND policyname = 'drug_store_sales_items_delete'
  ) THEN
    CREATE POLICY drug_store_sales_items_delete ON drug_store_sales_items FOR DELETE USING (is_workspace_member(workspace_id));
  END IF;
END;
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE drug_store_sales_items TO authenticated;

-- ============================================================
-- I. FOREIGN KEYS — tambah setelah tabel customers & items ada
-- ============================================================
ALTER TABLE drug_store_orders
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES drug_store_customers(id) ON DELETE SET NULL;

ALTER TABLE drug_store_sales
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES drug_store_customers(id) ON DELETE SET NULL;

-- ============================================================
-- J. DONE
-- ============================================================
