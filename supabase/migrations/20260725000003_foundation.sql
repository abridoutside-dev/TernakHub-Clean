-- DB-001A / 003 — Foundation and authentication-owned tables.

CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  display_name text,
  phone_number text,
  avatar_url text,
  cover_url text,
  bio text,
  ktp_number text,
  ktp_verified boolean NOT NULL DEFAULT false,
  ktp_front_url text,
  ktp_back_url text,
  whatsapp_number text,
  notification_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  security_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  onboarding_completed boolean NOT NULL DEFAULT false,
  onboarding_step integer NOT NULL DEFAULT 0 CHECK (onboarding_step >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE platform_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  is_public boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE global_reference (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_type text NOT NULL,
  code text NOT NULL,
  label text NOT NULL,
  value text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reference_type, code)
);

CREATE TABLE data_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  key text NOT NULL,
  label text NOT NULL,
  value text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category, key)
);

CREATE TABLE subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key text UNIQUE NOT NULL,
  name text NOT NULL,
  price_monthly integer CHECK (price_monthly IS NULL OR price_monthly >= 0),
  price_yearly integer CHECK (price_yearly IS NULL OR price_yearly >= 0),
  max_livestock integer CHECK (max_livestock IS NULL OR max_livestock >= 0),
  max_members integer CHECK (max_members IS NULL OR max_members >= 0),
  max_batches integer CHECK (max_batches IS NULL OR max_batches >= 0),
  max_listings integer CHECK (max_listings IS NULL OR max_listings >= 0),
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE feature_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text UNIQUE NOT NULL,
  min_plan text,
  module text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE escrow_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_holder text NOT NULL,
  account_type text CHECK (account_type IS NULL OR account_type IN ('Tabungan', 'Giro', 'Virtual Account')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bank_name, account_number)
);

CREATE TABLE rss_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text UNIQUE NOT NULL,
  category text,
  is_active boolean NOT NULL DEFAULT true,
  last_fetched_at timestamptz,
  fetch_interval_minutes integer NOT NULL DEFAULT 60 CHECK (fetch_interval_minutes > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE admin_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  announcement_type text,
  target_audience text,
  is_active boolean NOT NULL DEFAULT true,
  published_at timestamptz,
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE backup_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type text,
  status text,
  file_name text,
  file_size_bytes bigint CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
  storage_url text,
  triggered_by uuid REFERENCES auth.users(id),
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_level text,
  source text,
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  workspace_id uuid,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);