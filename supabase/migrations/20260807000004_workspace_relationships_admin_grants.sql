-- Workspace Relationships — platform admin Edge Function access.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE workspace_relationships TO service_role;
GRANT SELECT ON TABLE workspaces TO service_role;
GRANT SELECT ON TABLE user_profiles TO service_role;