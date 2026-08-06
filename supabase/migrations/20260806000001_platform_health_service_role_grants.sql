-- U-005 — Auth integrity service-role read grants.
--
-- The platform-health Edge Function uses SUPABASE_SERVICE_ROLE_KEY for the
-- integrity scan. RLS is bypassed by service_role, but table privileges still
-- need to be explicit for tables created by migrations that did not inherit
-- the expected default privileges.

GRANT SELECT ON TABLE user_profiles       TO service_role;
GRANT SELECT ON TABLE workspaces          TO service_role;
GRANT SELECT ON TABLE workspace_members   TO service_role;