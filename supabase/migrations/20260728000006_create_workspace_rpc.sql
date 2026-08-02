-- FLOW-001F4 — Atomic workspace creation via SECURITY DEFINER RPC
--
-- Root cause confirmed (FLOW-001F4 investigation):
--   The RLS bootstrap policy workspace_members_owner_bootstrap cannot reliably
--   evaluate `auth.uid()` in the INSERT WITH CHECK context under Supabase's
--   PostgREST + PostgreSQL 17 execution model. Even the simplest possible
--   INSERT policy (user_id = auth.uid()) fails with 42501. The issue is that
--   the RLS WITH CHECK evaluation for workspace_members INSERT does not have
--   a valid auth.uid() context in all code paths, making the policy universally
--   deny all authenticated INSERT attempts.
--
-- Fix:
--   Replace the two-step (INSERT workspaces + INSERT workspace_members) flow
--   with a single SECURITY DEFINER RPC function create_workspace_with_owner().
--   This function:
--     1. Validates the caller is the declared owner (auth.uid() = p_owner_id)
--     2. Inserts the workspace row
--     3. Bootstraps the owner member row in the same transaction
--   Being SECURITY DEFINER it runs as the function owner (postgres role),
--   bypassing the broken RLS path entirely while still enforcing ownership.
--
-- Side-effects (all intentional):
--   - workspace_members_owner_bootstrap RLS policy is kept (for safety / future use)
--     but is no longer the primary path for workspace creation.
--   - workspaceService.createWorkspace() is updated to call this RPC instead of
--     the sequential repoInsertWorkspace() + repoInsertMember() calls.
--   - The workspace_members_owner_bootstrap policy can be removed in a future
--     cleanup migration once we are confident the RPC path is the only writer.

-- ─── RPC: create_workspace_with_owner ────────────────────────────────────────
-- Creates a workspace + owner membership row atomically.
-- Security: caller must be authenticated AND p_owner_id must equal auth.uid().
-- Returns: the created workspace row.

CREATE OR REPLACE FUNCTION create_workspace_with_owner(
  p_owner_id       uuid,
  p_name           text,
  p_type           workspace_type,
  p_status         workspace_status DEFAULT 'Aktif',
  p_description    text             DEFAULT NULL,
  p_icon           text             DEFAULT NULL,
  p_province       text             DEFAULT NULL,
  p_city           text             DEFAULT NULL,
  p_district       text             DEFAULT NULL,
  p_village        text             DEFAULT NULL,
  p_address        text             DEFAULT NULL,
  p_latitude       numeric          DEFAULT NULL,
  p_longitude      numeric          DEFAULT NULL,
  p_phone          text             DEFAULT NULL,
  p_email          text             DEFAULT NULL,
  p_website        text             DEFAULT NULL,
  p_metadata       jsonb            DEFAULT '{}'
)
RETURNS workspaces
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace workspaces;
BEGIN
  -- Security check: caller must be the declared owner
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF auth.uid() <> p_owner_id THEN
    RAISE EXCEPTION 'Owner mismatch: caller is not the declared owner' USING ERRCODE = '42501';
  END IF;

  -- Insert workspace
  INSERT INTO workspaces (
    owner_id, name, type, status,
    description, icon,
    province, city, district, village, address, latitude, longitude,
    phone, email, website,
    metadata
  )
  VALUES (
    p_owner_id, p_name, p_type, p_status,
    p_description, p_icon,
    p_province, p_city, p_district, p_village, p_address, p_latitude, p_longitude,
    p_phone, p_email, p_website,
    p_metadata
  )
  RETURNING * INTO v_workspace;

  -- Bootstrap owner membership row (same transaction, SECURITY DEFINER bypasses RLS)
  INSERT INTO workspace_members (workspace_id, user_id, role, status)
  VALUES (v_workspace.id, p_owner_id, 'Owner', 'Aktif')
  ON CONFLICT DO NOTHING;

  RETURN v_workspace;
END;
$$;

-- Grant EXECUTE to authenticated role so PostgREST can invoke it via .rpc()
GRANT EXECUTE ON FUNCTION create_workspace_with_owner(
  uuid, text, workspace_type, workspace_status,
  text, text, text, text, text, text, text, numeric, numeric,
  text, text, text, jsonb
) TO authenticated;
