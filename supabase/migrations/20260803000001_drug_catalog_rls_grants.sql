-- ADMIN-FOUNDATION-001 — drug_catalog RLS & grants
--
-- drug_catalog, drug_categories, and drug_sub_categories were defined in
-- 20260725000004_reference.sql but never had RLS policies or authenticated
-- grants added.  This migration closes that gap so the admin Master Obat
-- module can read the catalog via the Supabase client.
--
-- Policy model:
--   drug_categories / drug_sub_categories — public reference data; any
--     authenticated user may read them; only service_role may write.
--   drug_catalog — public reference data; any authenticated user may read;
--     only service_role may write (catalog managed by platform admins).

-- ─── Enable RLS ───────────────────────────────────────────────────────────────

ALTER TABLE drug_categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_sub_categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_catalog         ENABLE ROW LEVEL SECURITY;

-- ─── RLS Policies ─────────────────────────────────────────────────────────────

-- drug_categories: any authenticated user can read
CREATE POLICY drug_categories_read ON drug_categories
  FOR SELECT TO authenticated USING (true);

-- drug_sub_categories: any authenticated user can read
CREATE POLICY drug_sub_categories_read ON drug_sub_categories
  FOR SELECT TO authenticated USING (true);

-- drug_catalog: any authenticated user can read (reference data)
CREATE POLICY drug_catalog_read ON drug_catalog
  FOR SELECT TO authenticated USING (true);

-- drug_catalog: only service_role may insert/update/delete (admin-managed)
-- (service_role bypasses RLS by default — no explicit policy needed)

-- ─── Authenticated grants ─────────────────────────────────────────────────────

GRANT SELECT ON TABLE drug_categories     TO authenticated;
GRANT SELECT ON TABLE drug_sub_categories TO authenticated;
GRANT SELECT ON TABLE drug_catalog        TO authenticated;
