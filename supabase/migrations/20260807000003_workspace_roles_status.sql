-- Workspace Roles lifecycle status and Edge Function privileges.

ALTER TABLE workspace_custom_roles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Active';

ALTER TABLE workspace_custom_roles
  DROP CONSTRAINT IF EXISTS workspace_custom_roles_status_check;

ALTER TABLE workspace_custom_roles
  ADD CONSTRAINT workspace_custom_roles_status_check
  CHECK (status IN ('Active', 'Inactive'));

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE workspace_custom_roles TO service_role;
GRANT SELECT ON TABLE role_permissions TO service_role;