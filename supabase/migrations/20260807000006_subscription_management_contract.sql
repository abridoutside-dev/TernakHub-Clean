-- SUB-ADMIN-001 — subscription management contract.
-- The admin UI reaches these tables only through the workspace-subscriptions
-- Edge Function. History is append-only and package deletion is preflighted.

ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS subscription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES workspace_subscriptions(id) ON DELETE SET NULL,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  action text NOT NULL,
  from_plan_id uuid REFERENCES subscription_plans(id) ON DELETE SET NULL,
  to_plan_id uuid REFERENCES subscription_plans(id) ON DELETE SET NULL,
  from_status subscription_status,
  to_status subscription_status,
  note text,
  changed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_history_workspace
  ON subscription_history (workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_history_plan
  ON subscription_history (from_plan_id, to_plan_id);

ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE subscription_history FROM anon, authenticated;
GRANT SELECT, INSERT ON TABLE subscription_history TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE subscription_plans TO service_role;
GRANT DELETE ON TABLE subscription_plans TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE workspace_subscriptions TO service_role;
GRANT SELECT, INSERT ON TABLE global_audit_trail TO service_role;

CREATE OR REPLACE FUNCTION subscription_plans_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION subscription_plans_updated_at();