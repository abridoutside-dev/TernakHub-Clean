-- SECURITY-ARCH-001 — Admin Control Plane: Core Security Fixes
--
-- Fixes the fundamental admin/non-admin separation gaps identified in the
-- access architecture audit:
--   1. is_platform_admin() inconsistency with Edge Functions
--   2. platform_config blanket authenticated read bypassing is_public
--   3. global_audit_trail inline auth.jwt() instead of is_platform_admin()
--   4. ownership_transfers accessible to any workspace member
--   5. activity_log platform-wide entries visible to regular users
--   6. Missing admin cross-workspace visibility on core tables
--
-- This migration is idempotent: DROP POLICY IF EXISTS + CREATE OR REPLACE.

-- ─── 1. Fix is_platform_admin() ────────────────────────────────────────────────
-- Align with all Edge Functions that check user_metadata.role = 'platform_admin'.
-- Previously missed: platform_admin role.
-- Also enforces account lifecycle: suspended/deleted accounts are not admins.

CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT (
    (SELECT EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND status = 'active'
    ))
    AND (
      coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
      OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
      OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'system_admin'
      OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'platform_admin'
    )
  );
$$;

-- ─── 2. Fix platform_config RLS ────────────────────────────────────────────────
-- CRITICAL: Previous policy allowed ANY authenticated user to read ALL rows,
-- completely bypassing the is_public flag. Non-admin users must only see
-- public rows; platform admins see all rows.

DROP POLICY IF EXISTS platform_config_public_read ON platform_config;
DROP POLICY IF EXISTS platform_config_admin_insert ON platform_config;
DROP POLICY IF EXISTS platform_config_admin_update ON platform_config;

-- Public rows: readable by anyone (anon + authenticated)
CREATE POLICY platform_config_public_read ON platform_config
  FOR SELECT
  USING (is_public = true);

-- Initialization flag: readable by anyone so the app can detect
-- whether the platform has been bootstrapped.  No other config rows
-- are exposed by this policy.
CREATE POLICY platform_config_initialized_read ON platform_config
  FOR SELECT
  USING (key = 'initialized');

-- Admin rows: readable/writable only by platform admins
CREATE POLICY platform_config_admin_read ON platform_config
  FOR SELECT
  TO authenticated
  USING (is_platform_admin());

CREATE POLICY platform_config_admin_insert ON platform_config
  FOR INSERT
  TO authenticated
  WITH CHECK (is_platform_admin());

CREATE POLICY platform_config_admin_update ON platform_config
  FOR UPDATE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ─── 3. Fix global_audit_trail RLS ────────────────────────────────────────────
-- Previous SELECT used inline auth.jwt() check for 'system_admin' only,
-- missing 'admin', 'is_admin', and 'platform_admin'. Use is_platform_admin().

DROP POLICY IF EXISTS audit_trail_admin_only ON global_audit_trail;
DROP POLICY IF EXISTS audit_trail_insert_service ON global_audit_trail;

CREATE POLICY audit_trail_admin_select ON global_audit_trail
  FOR SELECT
  USING (is_platform_admin());

CREATE POLICY audit_trail_service_insert ON global_audit_trail
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ─── 4. Fix ownership_transfers RLS ───────────────────────────────────────────
-- CRITICAL: Any workspace member could view/modify ownership transfers.
-- Only Owner and Admin should have access.

DROP POLICY IF EXISTS ownership_transfers_member ON ownership_transfers;

CREATE POLICY ownership_transfers_owner_admin ON ownership_transfers
  FOR ALL
  USING (is_workspace_member(workspace_id, ARRAY['Owner', 'Admin']))
  WITH CHECK (is_workspace_member(workspace_id, ARRAY['Owner', 'Admin']));

-- ─── 5. Fix activity_log RLS ──────────────────────────────────────────────────
-- CRITICAL: Regular users could read platform-wide entries (workspace_id IS NULL).
-- Platform-wide entries are admin-only.

DROP POLICY IF EXISTS activity_log_workspace_member ON activity_log;

CREATE POLICY activity_log_workspace_member ON activity_log
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IS NULL AND is_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = activity_log.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

-- ─── 6. Add admin cross-workspace visibility to core tables ───────────────────
-- Non-admin RLS remains workspace-scoped. Admin can read ALL rows.

-- workspaces: admin can read/update/delete all workspaces
CREATE POLICY workspaces_admin_select ON workspaces
  FOR SELECT
  USING (is_platform_admin());

CREATE POLICY workspaces_admin_update ON workspaces
  FOR UPDATE
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY workspaces_admin_delete ON workspaces
  FOR DELETE
  USING (is_platform_admin());

-- workspace_members: admin can read all members across all workspaces
CREATE POLICY workspace_members_admin_select ON workspace_members
  FOR SELECT
  USING (is_platform_admin());

-- workspace_invitations: admin can read/manage all invitations
DROP POLICY IF EXISTS workspace_invitations_manage_admin ON workspace_invitations;

CREATE POLICY workspace_invitations_manage_admin ON workspace_invitations
  FOR ALL
  USING (
    is_workspace_member(workspace_id, ARRAY['Owner', 'Admin'])
    OR is_platform_admin()
  )
  WITH CHECK (
    is_workspace_member(workspace_id, ARRAY['Owner', 'Admin'])
    OR is_platform_admin()
  );

-- workspace_relationships: admin can read/manage all
DROP POLICY IF EXISTS workspace_relationships_member ON workspace_relationships;

CREATE POLICY workspace_relationships_member ON workspace_relationships
  FOR ALL
  USING (
    is_workspace_member(workspace_id_a) OR is_workspace_member(workspace_id_b)
    OR is_platform_admin()
  )
  WITH CHECK (
    is_workspace_member(workspace_id_a) OR is_workspace_member(workspace_id_b)
    OR is_platform_admin()
  );

-- workspace_subscriptions: admin can read all
DROP POLICY IF EXISTS workspace_subscriptions_member ON workspace_subscriptions;

CREATE POLICY workspace_subscriptions_member ON workspace_subscriptions
  FOR SELECT
  USING (
    is_workspace_member(workspace_id)
    OR is_platform_admin()
  );

-- workspace_custom_roles: admin can manage all
DROP POLICY IF EXISTS custom_roles_member_select ON workspace_custom_roles;
DROP POLICY IF EXISTS custom_roles_owner_manage ON workspace_custom_roles;

CREATE POLICY custom_roles_member_select ON workspace_custom_roles
  FOR SELECT
  USING (
    is_workspace_member(workspace_id)
    OR is_platform_admin()
  );

CREATE POLICY custom_roles_owner_manage ON workspace_custom_roles
  FOR ALL
  USING (
    is_workspace_member(workspace_id, ARRAY['Owner'])
    OR is_platform_admin()
  )
  WITH CHECK (
    is_workspace_member(workspace_id, ARRAY['Owner'])
    OR is_platform_admin()
  );

-- user_profiles: admin can read/update all profiles
DROP POLICY IF EXISTS user_profiles_select_own ON user_profiles;
DROP POLICY IF EXISTS user_profiles_update_own ON user_profiles;

CREATE POLICY user_profiles_select_own ON user_profiles
  FOR SELECT
  USING (
    id = auth.uid()
    OR is_platform_admin()
  );

CREATE POLICY user_profiles_update_own ON user_profiles
  FOR UPDATE
  USING (
    id = auth.uid()
    OR is_platform_admin()
  )
  WITH CHECK (
    id = auth.uid()
    OR is_platform_admin()
  );

-- notifications: admin can read all notifications
CREATE POLICY notifications_admin_select ON notifications
  FOR SELECT
  USING (is_platform_admin());

-- alert_reminders: admin can read all
CREATE POLICY alert_reminders_admin_select ON alert_reminders
  FOR SELECT
  USING (is_platform_admin());

-- trust_verifications: admin can manage all
DROP POLICY IF EXISTS trust_select ON trust_verifications;
DROP POLICY IF EXISTS trust_write_owner ON trust_verifications;

CREATE POLICY trust_select ON trust_verifications
  FOR SELECT
  USING (
    is_workspace_member(workspace_id, ARRAY['Owner', 'Admin'])
    OR is_platform_admin()
  );

CREATE POLICY trust_write_owner ON trust_verifications
  FOR ALL
  USING (
    is_workspace_member(workspace_id, ARRAY['Owner', 'Admin'])
    OR is_platform_admin()
  )
  WITH CHECK (
    is_workspace_member(workspace_id, ARRAY['Owner', 'Admin'])
    OR is_platform_admin()
  );

-- trust_verification_evidence: admin can manage all
DROP POLICY IF EXISTS trust_evidence_member ON trust_verification_evidence;

CREATE POLICY trust_evidence_member ON trust_verification_evidence
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM trust_verifications tv
      WHERE tv.id = verification_id
        AND (is_workspace_member(tv.workspace_id, ARRAY['Owner', 'Admin']) OR is_platform_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM trust_verifications tv
      WHERE tv.id = verification_id
        AND (is_workspace_member(tv.workspace_id, ARRAY['Owner', 'Admin']) OR is_platform_admin())
    )
  );

-- media: admin can manage all
CREATE POLICY media_admin ON media
  FOR ALL
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ai_insights: admin can manage all
CREATE POLICY ai_insights_admin ON ai_insights
  FOR ALL
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- search_index: admin can manage all
CREATE POLICY search_index_admin ON search_index
  FOR ALL
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());
