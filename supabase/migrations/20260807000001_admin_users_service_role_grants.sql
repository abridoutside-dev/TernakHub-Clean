-- Admin Users — explicit service-role privileges for User & Workspace workflow.
--
-- service_role bypasses RLS, but it still needs table privileges for the
-- REST calls made by the admin-users Edge Function.

GRANT SELECT, UPDATE ON TABLE user_profiles TO service_role;
GRANT SELECT, UPDATE ON TABLE workspaces TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE workspace_members TO service_role;
GRANT SELECT, DELETE ON TABLE workspace_custom_roles TO service_role;
GRANT SELECT, DELETE ON TABLE workspace_invitations TO service_role;