-- ADMIN-PLATFORM-003 — Platform Health: Service Configuration
--
-- Grants Platform Administrators the ability to insert and update
-- platform_config rows so that the Admin Dashboard can persist service
-- configuration.
--
-- Security model:
--   platform_config stores GLOBAL platform configuration.
--   Only Platform Administrators may write to it.
--   GRANT INSERT/UPDATE to authenticated is required at the Postgres level
--   (Supabase evaluates grants before RLS), but the actual row-level gate is
--   is_platform_admin() — non-admin authenticated users are blocked by RLS.
--
-- Platform Administrator definition (mirrors AdminGuard.tsx exactly):
--   A user is a Platform Administrator when their Supabase JWT user_metadata
--   carries at least one of:
--     • user_metadata.is_admin  = true
--     • user_metadata.role      = 'admin'
--     • user_metadata.role      = 'system_admin'
--
--   This matches the three conditions in AdminGuard.tsx and is consistent
--   with the existing global_audit_trail RLS policy in 20260725000014_rls.sql
--   which already uses auth.jwt() -> 'user_metadata' to detect system admins.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Helper function ─────────────────────────────────────────────────────────
-- Returns true when the calling JWT belongs to a Platform Administrator.
-- SECURITY INVOKER: runs as the calling user, so auth.jwt() returns their token.
-- STABLE: may be inlined by the query planner; result is constant within a txn.

CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,   false)
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'system_admin'
  );
$$;

-- ─── Table-level grants ───────────────────────────────────────────────────────
-- Postgres requires an explicit GRANT before RLS policies are evaluated.
-- The GRANT alone does NOT allow access — is_platform_admin() in each policy
-- is the actual enforcement gate.

GRANT INSERT, UPDATE ON TABLE platform_config TO authenticated;

-- ─── RLS Policies ────────────────────────────────────────────────────────────

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
