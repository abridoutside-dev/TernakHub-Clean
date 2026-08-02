-- DB-001A / 007 — Feed, formula and marketplace tables.

CREATE TABLE feed_formulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  status formula_status_enum NOT NULL DEFAULT 'Draft',
  target_species text[],
  target_age_group text,
  description text,
  total_cost_per_kg numeric(10,2) CHECK (total_cost_per_kg IS NULL OR total_cost_per_kg >= 0),
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE TABLE feed_formula_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formula_id uuid NOT NULL REFERENCES feed_formulas(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('Master Pakan', 'Produk Komersial')),
  master_pakan_id uuid REFERENCES master_pakan_catalog(id),
  produk_komersial_id uuid REFERENCES produk_komersial_products(id),
  ingredient_name text NOT NULL,
  percentage numeric(5,2) NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  amount_kg numeric(10,3) CHECK (amount_kg IS NULL OR amount_kg >= 0),
  cost_per_kg numeric(10,2) CHECK (cost_per_kg IS NULL OR cost_per_kg >= 0),
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (source_type = 'Master Pakan' AND master_pakan_id IS NOT NULL AND produk_komersial_id IS NULL)
    OR
    (source_type = 'Produk Komersial' AND produk_komersial_id IS NOT NULL AND master_pakan_id IS NULL)
  )
);

CREATE TABLE feed_formula_productions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formula_id uuid NOT NULL REFERENCES feed_formulas(id),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  production_date date NOT NULL,
  quantity_kg numeric(10,3) NOT NULL CHECK (quantity_kg > 0),
  batch_code text,
  status text,
  notes text,
  produced_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE stok_inventaris (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('Master Pakan', 'Produk Komersial', 'Formula')),
  master_pakan_id uuid REFERENCES master_pakan_catalog(id),
  formula_id uuid REFERENCES feed_formulas(id),
  item_name text NOT NULL,
  quantity numeric(10,3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit text,
  min_stock numeric(10,3) CHECK (min_stock IS NULL OR min_stock >= 0),
  purchase_price_per_kg numeric(10,2) CHECK (purchase_price_per_kg IS NULL OR purchase_price_per_kg >= 0),
  status stok_status_enum NOT NULL DEFAULT 'Aktif',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (source_type = 'Master Pakan' AND master_pakan_id IS NOT NULL AND formula_id IS NULL)
    OR (source_type = 'Formula' AND formula_id IS NOT NULL AND master_pakan_id IS NULL)
    OR (source_type = 'Produk Komersial' AND master_pakan_id IS NULL AND formula_id IS NULL)
  )
);

CREATE TABLE stok_inventaris_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stok_id uuid NOT NULL REFERENCES stok_inventaris(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  transaction_type text NOT NULL CHECK (transaction_type IN ('Masuk', 'Keluar', 'Penyesuaian')),
  quantity_delta numeric(10,3) NOT NULL,
  quantity_before numeric(10,3) CHECK (quantity_before IS NULL OR quantity_before >= 0),
  quantity_after numeric(10,3) CHECK (quantity_after IS NULL OR quantity_after >= 0),
  reason text,
  reference_id uuid,
  reference_type text,
  recorded_by uuid REFERENCES auth.users(id),
  transaction_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE jadwal_pemberian_pakan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  livestock_id uuid REFERENCES livestock(id),
  batch_id uuid REFERENCES batches(id),
  formula_id uuid REFERENCES feed_formulas(id),
  schedule_name text,
  frequency text,
  time_slots text[],
  amount_per_session_kg numeric(7,3) CHECK (amount_per_session_kg IS NULL OR amount_per_session_kg > 0),
  is_active boolean NOT NULL DEFAULT true,
  start_date date,
  end_date date,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (livestock_id IS NOT NULL OR batch_id IS NOT NULL),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE TABLE pemberian_pakan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  jadwal_id uuid REFERENCES jadwal_pemberian_pakan(id),
  livestock_id uuid REFERENCES livestock(id),
  batch_id uuid REFERENCES batches(id),
  formula_id uuid REFERENCES feed_formulas(id),
  feed_date date NOT NULL,
  feed_time time,
  amount_kg numeric(7,3) NOT NULL CHECK (amount_kg > 0),
  notes text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (livestock_id IS NOT NULL OR batch_id IS NOT NULL)
);

CREATE TABLE marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  kategori_slug text NOT NULL REFERENCES marketplace_categories(slug),
  title text NOT NULL,
  description text,
  price bigint NOT NULL CHECK (price >= 0),
  negotiable boolean NOT NULL DEFAULT false,
  status listing_status_enum NOT NULL DEFAULT 'Draft',
  condition text,
  location text,
  province text,
  asset_type text,
  asset_ref_id uuid,
  asset_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  view_count integer NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  wishlist_count integer NOT NULL DEFAULT 0 CHECK (wishlist_count >= 0),
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE marketplace_listing_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  storage_url text NOT NULL,
  thumbnail_url text,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE marketplace_wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

CREATE TABLE marketplace_chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES marketplace_listings(id),
  buyer_workspace_id uuid NOT NULL REFERENCES workspaces(id),
  seller_workspace_id uuid NOT NULL REFERENCES workspaces(id),
  status text NOT NULL DEFAULT 'Aktif',
  unread_buyer integer NOT NULL DEFAULT 0 CHECK (unread_buyer >= 0),
  unread_seller integer NOT NULL DEFAULT 0 CHECK (unread_seller >= 0),
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, buyer_workspace_id),
  CHECK (buyer_workspace_id <> seller_workspace_id)
);

CREATE TABLE marketplace_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES marketplace_chat_rooms(id) ON DELETE CASCADE,
  sender_workspace_id uuid NOT NULL REFERENCES workspaces(id),
  sender_role text NOT NULL CHECK (sender_role IN ('Pembeli', 'Penjual')),
  message_type text,
  content text,
  attachment_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (content IS NOT NULL OR attachment_url IS NOT NULL)
);

CREATE TABLE marketplace_negotiations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES marketplace_listings(id),
  chat_room_id uuid REFERENCES marketplace_chat_rooms(id),
  buyer_workspace_id uuid NOT NULL REFERENCES workspaces(id),
  seller_workspace_id uuid NOT NULL REFERENCES workspaces(id),
  offered_price bigint NOT NULL CHECK (offered_price >= 0),
  counter_price bigint CHECK (counter_price IS NULL OR counter_price >= 0),
  status negotiation_status_enum NOT NULL DEFAULT 'Pending',
  message text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE marketplace_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES marketplace_listings(id),
  transaction_room_id uuid,
  buyer_workspace_id uuid NOT NULL REFERENCES workspaces(id),
  seller_workspace_id uuid NOT NULL REFERENCES workspaces(id),
  agreed_price bigint NOT NULL CHECK (agreed_price >= 0),
  status marketplace_transaction_status_enum NOT NULL DEFAULT 'Baru',
  payment_method text,
  shipping_address jsonb,
  notes text,
  asset_synced boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE marketplace_moderations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES marketplace_listings(id),
  reported_by_workspace_id uuid REFERENCES workspaces(id),
  moderation_type text,
  reason text,
  status moderation_status_enum NOT NULL DEFAULT 'Pending',
  action_taken text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);