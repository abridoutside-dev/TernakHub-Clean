-- FLOW-001F3 — Fix circular RLS dependency breaking workspace creation
--
-- Root cause:
--   workspace_members_owner_bootstrap (migration 20260728000003) contains:
--     EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid())
--
--   That sub-SELECT on workspaces runs through workspaces_select_members RLS:
--     USING (verification_status = 'Verified'
--            OR EXISTS(workspace_members WHERE user_id = auth.uid() AND status = 'Aktif'))
--
--   For a brand-new workspace:
--     • verification_status = 'Unverified'   → first condition FALSE
--     • No member rows exist yet              → second condition FALSE
--     → Workspace is invisible to the inserting user
--     → Bootstrap policy WITH CHECK returns FALSE
--     → workspace_members INSERT is blocked by RLS
--     → repoInsertMember() throws a Postgres RLS violation (42501)
--     → workspaceService.createWorkspace() returns { ok: false }
--     → WorkspaceCreate shows error and stays at /workspace/create
--
-- Fix:
--   Add owner_id = auth.uid() as the first condition in workspaces_select_members.
--   Workspace owners must always be able to see their own workspace regardless of
--   member rows or verification status.  This breaks the circular dependency:
--     • bootstrap policy sub-SELECT sees the workspace (owner_id matches)  → TRUE
--     • workspace_members INSERT is now allowed                              → TRUE
--
-- Side-effects (all intentional):
--   • repoGetAllWorkspaces() now returns workspaces where the user is the owner,
--     even before they have a member row.  This is correct — the workspace was
--     just created.
--   • WorkspaceSelect ownerFallback was already handling this case; now the
--     primary fromMemberships path will also find it once the member row is created.
--   • Archived/inactive workspaces owned by the user remain visible; app-layer
--     filtering (activeWorkspaces = workspaces.filter(status==='Active')) handles
--     access control above the DB layer.

DROP POLICY IF EXISTS workspaces_select_members ON workspaces;

CREATE POLICY workspaces_select_members ON workspaces
  FOR SELECT USING (
    owner_id = auth.uid()
    OR verification_status = 'Verified'
    OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspaces.id
        AND wm.user_id = auth.uid()
        AND wm.status = 'Aktif'
    )
  );
