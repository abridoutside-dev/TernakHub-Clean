-- FLOW-001C / 003 — Workspace members owner-bootstrap RLS policy
--
-- Problem: workspace_members INSERT is governed by workspace_members_manage_admin
-- (FOR ALL … USING is_workspace_member(workspace_id, ARRAY['Owner','Admin'])).
-- For INSERT the USING clause is NOT evaluated — only WITH CHECK is. The WITH
-- CHECK requires the caller to already be an Owner/Admin member. This creates a
-- chicken-and-egg deadlock: after createWorkspace() succeeds, the owner cannot
-- insert their own workspace_members row because they have no row yet.
--
-- Fix: a dedicated INSERT-only policy that lets the workspace owner (i.e. the
-- auth.users row whose UUID matches workspaces.owner_id) insert exactly one row
-- for themselves with role='Owner'. All other INSERT paths still go through
-- workspace_members_manage_admin.

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Allow the workspace owner to self-bootstrap their first membership row.
-- Conditions (all must hold):
--   1. The row being inserted is for the caller themselves  (user_id = auth.uid())
--   2. The role is 'Owner'                                  (role = 'Owner')
--   3. The caller owns the target workspace                 (owner_id = auth.uid())
-- Idempotent: drop first so re-running the migration (e.g. after a partial apply)
-- does not fail with "policy already exists".
DROP POLICY IF EXISTS workspace_members_owner_bootstrap ON workspace_members;
CREATE POLICY workspace_members_owner_bootstrap ON workspace_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND role = 'Owner'
    AND EXISTS (
      SELECT 1
      FROM workspaces w
      WHERE w.id = workspace_id
        AND w.owner_id = auth.uid()
    )
  );

-- Ensure authenticated role can read and write workspace_members rows that RLS
-- permits (Supabase default privileges cover all tables, but we pin this
-- explicitly so the grant survives schema resets).
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE workspace_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE workspaces            TO authenticated;
