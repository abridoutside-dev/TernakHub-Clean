-- ADMIN-PLATFORM-003 — Platform Health: Service Configuration Write Access
--
-- Grants Platform Administrators the ability to insert and update rows in
-- platform_config so that the Admin Dashboard can persist service configuration.
--
-- Depends on: 20260803000003_core_security_functions.sql
--   is_platform_admin() must exist before this migration runs.
--
-- Security model:
--   platform_config holds GLOBAL platform configuration — not workspace data.
--   Only Platform Administrators may write to it (is_platform_admin() = true).
--   GRANT INSERT/UPDATE to the authenticated role is required by Postgres before
--   RLS policies are evaluated, but the GRANT alone does not permit access:
--   every write is still blocked unless is_platform_admin() returns true.
-- ─────────────────────────────────────────────────────────────────────────────

-- Table-level DML grants
-- Required by Postgres so the authenticated role can attempt DML;
-- the actual row-level gate is enforced by the RLS policies below.
GRANT INSERT, UPDATE ON TABLE platform_config TO authenticated;

-- INSERT: only Platform Administrators may create new config rows
CREATE POLICY platform_config_admin_insert ON platform_config
  FOR INSERT
  TO authenticated
  WITH CHECK (is_platform_admin());

-- UPDATE: only Platform Administrators may modify existing config rows
CREATE POLICY platform_config_admin_update ON platform_config
  FOR UPDATE
  TO authenticated
  USING  (is_platform_admin())
  WITH CHECK (is_platform_admin());
