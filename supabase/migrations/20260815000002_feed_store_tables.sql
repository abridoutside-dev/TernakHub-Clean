-- P1.1 — Feed Store tables
-- Creates 5 tables for the Feed Store workspace kind:
--   feed_store_suppliers
--   feed_store_customers
--   feed_store_orders
--   feed_store_order_items
--   feed_store_sales

-- ─── feed_store_suppliers ──────────────────────────────────────────────────────

CREATE TABLE feed_store_suppliers (
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

CREATE INDEX idx_feed_store_suppliers_workspace_id
  ON feed_store_suppliers (workspace_id);

-- ─── feed_store_customers ──────────────────────────────────────────────────────

CREATE TABLE feed_store_customers (
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

CREATE INDEX idx_feed_store_customers_workspace_id
  ON feed_store_customers (workspace_id);

-- ─── feed_store_orders ────────────────────────────────────────────────────────

CREATE TABLE feed_store_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  order_number text,
  order_type text NOT NULL
    CHECK (order_type IN ('Pembelian', 'Penjualan')),
  supplier_id uuid
    REFERENCES feed_store_suppliers(id) ON DELETE SET NULL,
  customer_id uuid
    REFERENCES feed_store_customers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'Baru'
    CHECK (status IN ('Baru', 'Diproses', 'Selesai', 'Dibatalkan')),
  total_amount bigint NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  order_date date NOT NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_feed_store_orders_workspace_id
  ON feed_store_orders (workspace_id);
CREATE INDEX idx_feed_store_orders_order_date
  ON feed_store_orders (order_date);
CREATE INDEX idx_feed_store_orders_workspace_type
  ON feed_store_orders (workspace_id, order_type);

-- ─── feed_store_order_items ───────────────────────────────────────────────────

CREATE TABLE feed_store_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES feed_store_orders(id) ON DELETE CASCADE,
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

CREATE INDEX idx_feed_store_order_items_order_id
  ON feed_store_order_items (order_id);
CREATE INDEX idx_feed_store_order_items_workspace_id
  ON feed_store_order_items (workspace_id);

-- ─── feed_store_sales ─────────────────────────────────────────────────────────

CREATE TABLE feed_store_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  order_id uuid
    REFERENCES feed_store_orders(id) ON DELETE SET NULL,
  customer_id uuid
    REFERENCES feed_store_customers(id) ON DELETE SET NULL,
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

CREATE INDEX idx_feed_store_sales_workspace_id
  ON feed_store_sales (workspace_id);
CREATE INDEX idx_feed_store_sales_sale_date
  ON feed_store_sales (sale_date);
