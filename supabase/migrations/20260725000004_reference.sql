-- DB-001A / 004 — Reference/catalog tables. No seed rows are inserted.

CREATE TABLE master_pakan_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  icon text,
  description text,
  sort_order integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE master_pakan_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES master_pakan_categories(id),
  name text NOT NULL,
  local_name text,
  latin_name text,
  species_suitability text[],
  nutritional_content jsonb,
  dry_matter_pct numeric(5,2) CHECK (dry_matter_pct IS NULL OR dry_matter_pct BETWEEN 0 AND 100),
  description text,
  preparation_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE produk_komersial_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text,
  description text,
  sort_order integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE produk_komersial_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES produk_komersial_categories(id),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE produk_komersial_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES produk_komersial_brands(id),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  target_species text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE produk_komersial_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES produk_komersial_series(id),
  brand_id uuid NOT NULL REFERENCES produk_komersial_brands(id),
  category_id uuid NOT NULL REFERENCES produk_komersial_categories(id),
  name text NOT NULL,
  packaging text,
  price_estimate bigint CHECK (price_estimate IS NULL OR price_estimate >= 0),
  nutritional_content jsonb,
  composition text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE disease_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE disease_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  local_name text,
  category_id uuid REFERENCES disease_categories(id),
  affected_species text[],
  symptoms text[],
  causes text,
  prevention text,
  treatment text,
  severity text,
  is_zoonotic boolean NOT NULL DEFAULT false,
  is_notifiable boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE drug_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE drug_sub_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES drug_categories(id),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE drug_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  generic_name text,
  category_id uuid REFERENCES drug_categories(id),
  sub_category_id uuid REFERENCES drug_sub_categories(id),
  species_targets text[],
  dosage_form text,
  standard_dosage text,
  withdrawal_period_days integer CHECK (withdrawal_period_days IS NULL OR withdrawal_period_days >= 0),
  requires_prescription boolean NOT NULL DEFAULT false,
  manufacturer text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE marketplace_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  icon text,
  description text,
  sort_order integer,
  created_at timestamptz NOT NULL DEFAULT now()
);