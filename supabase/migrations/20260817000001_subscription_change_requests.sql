-- SUB-REQ-001 — Subscription change request queue
-- Persistent user-facing requests that Admin can review and process.
-- Does NOT create new communication channels; requests live in Supabase
-- and are surfaced in Admin Dashboard → Subscription.

CREATE TABLE IF NOT EXISTS subscription_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES workspace_subscriptions(id) ON DELETE SET NULL,
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  from_plan_key text NOT NULL,
  to_plan_key text NOT NULL,
  status text NOT NULL DEFAULT 'Pending',
  note text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_subscription_change_requests_workspace
  ON subscription_change_requests (workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscription_change_requests_status
  ON subscription_change_requests (status);

ALTER TABLE subscription_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscription_change_requests_owner_insert ON subscription_change_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (is_workspace_member(workspace_id, ARRAY['Owner', 'Admin']));

CREATE POLICY subscription_change_requests_owner_select ON subscription_change_requests
  FOR SELECT
  TO authenticated
  USING (is_workspace_member(workspace_id));

CREATE POLICY subscription_change_requests_admin_all ON subscription_change_requests
  FOR ALL
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE subscription_change_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE subscription_change_requests TO service_role;
