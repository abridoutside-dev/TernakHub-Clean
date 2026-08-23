-- 20260823000003_drug_commercial_products_schema.sql
-- PKO-PERSISTENT-001 — Schema for Produk Komersial Obat (Drug Commercial Products)
--
-- Creates dedicated tables for the Produk Komersial Obat catalog:
--   drug_brands                — brand/manufacturer reference
--   drug_commercial_products   — commercial product catalog (brand → product hierarchy)
--
-- These are PLATFORM-LEVEL REFERENCE DATA (no workspace_id).
-- RLS: authenticated users can read; only service_role can write (admin-managed).
--
-- UUIDs from existing hardcoded data (produkKomersialObatData.ts) are preserved
-- by using explicit UUIDs in the seed migration (20260823000004).

-- ─── Brand Table ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS drug_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL UNIQUE,
  logo text,
  deskripsi text,
  status text NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
  color text,
  bg text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Commercial Product Table ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS drug_commercial_products (
  id uuid PRIMARY KEY,
  slug text UNIQUE NOT NULL,

  -- Relations
  brand_id uuid NOT NULL REFERENCES drug_brands(id),
  master_obat_uuid uuid NULL,  -- Reference to Master Obat UUID (in-memory obatData.ts); FK deferred until Master Obat is persisted

  -- Product Identity
  name text NOT NULL,
  nama_komersial text,
  bentuk_sediaan text NOT NULL,
  kemasan text NOT NULL,
  status text NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),

  -- Detail
  bahan_aktif text,
  kekuatan text,
  negara_asal text,
  penyimpanan text,

  -- Commercial Info
  produsen text,
  distributor text,
  nomor_registrasi text,
  foto_produk text,
  catatan text,

  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_drug_commercial_products_brand_id
  ON drug_commercial_products (brand_id);

CREATE INDEX IF NOT EXISTS idx_drug_commercial_products_master_obat_uuid
  ON drug_commercial_products (master_obat_uuid);

CREATE INDEX IF NOT EXISTS idx_drug_commercial_products_status
  ON drug_commercial_products (status);

CREATE INDEX IF NOT EXISTS idx_drug_brands_status
  ON drug_brands (status);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE drug_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_commercial_products ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read reference data
CREATE POLICY drug_brands_read ON drug_brands
  FOR SELECT TO authenticated USING (true);

CREATE POLICY drug_commercial_products_read ON drug_commercial_products
  FOR SELECT TO authenticated USING (true);

-- Only service_role can write (admin-managed reference data)
-- service_role bypasses RLS by default — no explicit policy needed

-- ─── Grants ──────────────────────────────────────────────────────────────────

GRANT SELECT ON TABLE drug_brands TO authenticated;
GRANT SELECT ON TABLE drug_commercial_products TO authenticated;
