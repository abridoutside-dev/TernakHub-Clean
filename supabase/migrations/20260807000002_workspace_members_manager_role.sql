-- Workspace Members Prompt 3: keep the persisted member-role enum aligned
-- with the roles exposed by the Workspace Members UI.
ALTER TYPE member_role ADD VALUE IF NOT EXISTS 'Manager';