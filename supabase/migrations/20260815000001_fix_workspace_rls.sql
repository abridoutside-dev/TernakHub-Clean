-- BUG-001FIX — Restrict workspace visibility to owner and active members only
--
-- Root cause: workspaces_select_members allowed any authenticated user to see
-- ALL workspaces with verification_status = 'Verified'. This caused the workspace
-- selector to list test/verified workspaces that do not belong to the current user.
--
-- Fix: remove the verification_status = 'Verified' clause. A workspace is now
-- visible only to:
--   - its owner (owner_id = auth.uid())
--   - active members (workspace_members with status = 'Aktif')
-- Admin visibility is handled separately by workspaces_admin_select.

DROP POLICY IF EXISTS workspaces_select_members ON workspaces;

CREATE POLICY workspaces_select_members ON workspaces
  FOR SELECT USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = workspaces.id
        AND wm.user_id = auth.uid()
        AND wm.status = 'Aktif'
    )
  );
