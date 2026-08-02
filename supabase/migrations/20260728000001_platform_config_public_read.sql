-- FLOW-001 fix: allow anon and authenticated roles to read platform_config.
--
-- Supabase requires two separate layers:
--   1. GRANT SELECT — table-level permission for the Postgres role.
--   2. RLS POLICY   — row-level filter applied after the grant.
--
-- The initialization check (checkPlatformInitialized) only needs to know
-- whether any row exists; sensitive config values are protected by the
-- is_public column.  Anonymous visitors must be able to run the check so
-- PlatformInitGuard can decide whether to show the /initialize page.

ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;

-- Table-level grants (required in addition to schema USAGE already granted
-- in 20260725000001_extensions.sql)
GRANT SELECT ON TABLE platform_config TO anon, authenticated;

-- Row-level filter:
--   • anon (not logged in) may only see is_public = true rows.
--   • authenticated users may see all rows.
--   This prevents leaking private config while still allowing the
--   "is platform initialized?" COUNT(*) query to succeed.
CREATE POLICY platform_config_public_read ON platform_config
  FOR SELECT
  USING (
    is_public = true
    OR auth.role() = 'authenticated'
  );
