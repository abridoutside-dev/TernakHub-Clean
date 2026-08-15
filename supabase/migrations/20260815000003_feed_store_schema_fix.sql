-- P1.1 — Fix Feed Store table schemas to match code expectations.
--
-- The tables already existed in production with different column names
-- than what the TypeScript types and repositories expect.
-- This migration aligns the schema with the codebase.

-- ─── feed_store_suppliers ──────────────────────────────────────────────────────

ALTER TABLE feed_store_suppliers
  RENAME COLUMN supplier_name TO name;

ALTER TABLE feed_store_suppliers
  RENAME COLUMN contact_person TO contact_name;

ALTER TABLE feed_store_suppliers
  DROP COLUMN supplier_code;

ALTER TABLE feed_store_suppliers
  DROP COLUMN postal_code;

ALTER TABLE feed_store_suppliers
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Aktif'
    CHECK (status IN ('Aktif', 'Nonaktif'));

UPDATE feed_store_suppliers
  SET status = CASE WHEN is_active THEN 'Aktif' ELSE 'Nonaktif' END
  WHERE status = 'Aktif' AND is_active IS NOT NULL;

ALTER TABLE feed_store_suppliers
  DROP COLUMN is_active;

-- ─── feed_store_customers ──────────────────────────────────────────────────────

ALTER TABLE feed_store_customers
  RENAME COLUMN customer_name TO name;

ALTER TABLE feed_store_customers
  ADD COLUMN IF NOT EXISTS contact_name text;

ALTER TABLE feed_store_customers
  ADD COLUMN IF NOT EXISTS customer_type text
    CHECK (customer_type IS NULL OR customer_type IN ('Individu', 'Perusahaan', 'Koperasi'));

ALTER TABLE feed_store_customers
  DROP COLUMN customer_code;

ALTER TABLE feed_store_customers
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Aktif'
    CHECK (status IN ('Aktif', 'Nonaktif'));

UPDATE feed_store_customers
  SET status = CASE WHEN is_active THEN 'Aktif' ELSE 'Nonaktif' END
  WHERE status = 'Aktif' AND is_active IS NOT NULL;

ALTER TABLE feed_store_customers
  DROP COLUMN is_active;

-- ─── feed_store_orders ────────────────────────────────────────────────────────

ALTER TABLE feed_store_orders
  ADD COLUMN IF NOT EXISTS order_type text NOT NULL DEFAULT 'Penjualan'
    CHECK (order_type IN ('Pembelian', 'Penjualan'));

ALTER TABLE feed_store_orders
  ADD COLUMN IF NOT EXISTS customer_id uuid
    REFERENCES feed_store_customers(id) ON DELETE SET NULL;

ALTER TABLE feed_store_orders
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

ALTER TABLE feed_store_orders
  ALTER COLUMN order_date TYPE date USING order_date::date;

ALTER TABLE feed_store_orders
  DROP COLUMN expected_date;

ALTER TABLE feed_store_orders
  DROP COLUMN tax;

ALTER TABLE feed_store_orders
  DROP COLUMN total;

ALTER TABLE feed_store_orders
  ADD COLUMN IF NOT EXISTS total_amount bigint NOT NULL DEFAULT 0 CHECK (total_amount >= 0);

UPDATE feed_store_orders
  SET total_amount = COALESCE(subtotal, 0)
  WHERE total_amount = 0 AND subtotal IS NOT NULL;

ALTER TABLE feed_store_orders
  DROP COLUMN subtotal;

-- ─── feed_store_order_items ───────────────────────────────────────────────────

ALTER TABLE feed_store_order_items
  ADD COLUMN IF NOT EXISTS workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE feed_store_order_items
  RENAME COLUMN stock_inventory_id TO stok_id;

ALTER TABLE feed_store_order_items
  RENAME COLUMN product_name TO item_name;

ALTER TABLE feed_store_order_items
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE feed_store_order_items
  ALTER COLUMN quantity TYPE bigint USING quantity::bigint;

ALTER TABLE feed_store_order_items
  ALTER COLUMN unit_price TYPE bigint USING unit_price::bigint;

ALTER TABLE feed_store_order_items
  ADD COLUMN IF NOT EXISTS subtotal bigint NOT NULL DEFAULT 0 CHECK (subtotal >= 0);

UPDATE feed_store_order_items
  SET subtotal = COALESCE(total_price, 0)
  WHERE subtotal = 0 AND total_price IS NOT NULL;

ALTER TABLE feed_store_order_items
  DROP COLUMN total_price;

-- ─── feed_store_sales ─────────────────────────────────────────────────────────

ALTER TABLE feed_store_sales
  ADD COLUMN IF NOT EXISTS order_id uuid
    REFERENCES feed_store_orders(id) ON DELETE SET NULL;

ALTER TABLE feed_store_sales
  DROP COLUMN invoice_number;

ALTER TABLE feed_store_sales
  ALTER COLUMN sale_date TYPE date USING sale_date::date;

ALTER TABLE feed_store_sales
  DROP COLUMN discount;

ALTER TABLE feed_store_sales
  DROP COLUMN tax;

ALTER TABLE feed_store_sales
  ADD COLUMN IF NOT EXISTS total_amount bigint NOT NULL DEFAULT 0 CHECK (total_amount >= 0);

UPDATE feed_store_sales
  SET total_amount = COALESCE(total, 0)
  WHERE total_amount = 0 AND total IS NOT NULL;

ALTER TABLE feed_store_sales
  DROP COLUMN subtotal;

ALTER TABLE feed_store_sales
  DROP COLUMN total;

ALTER TABLE feed_store_sales
  RENAME COLUMN payment_status TO status;

ALTER TABLE feed_store_sales
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
