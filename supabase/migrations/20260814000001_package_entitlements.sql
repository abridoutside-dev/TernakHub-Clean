-- ENT-001 — Package Entitlement & Usage Limit System
-- Adds per-package entitlement configuration and resource usage tracking.

-- ─── package_entitlements ──────────────────────────────────────────────────────
-- Stores explicit access control settings per package per feature.
-- If no row exists for a feature, the system falls back to plan-based defaults
-- (the existing FEATURE_GATE matrix in the application).

CREATE TABLE IF NOT EXISTS package_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  access_mode text NOT NULL DEFAULT 'allowed',
  usage_limit integer,
  capabilities jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(package_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_package_entitlements_package
  ON package_entitlements (package_id);

-- ─── resource_usage ────────────────────────────────────────────────────────────
-- Tracks actual usage of limited resources per workspace per period.

CREATE TABLE IF NOT EXISTS resource_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, feature_key, period_start)
);

CREATE INDEX IF NOT EXISTS idx_resource_usage_workspace_period
  ON resource_usage (workspace_id, feature_key, period_start);

-- ─── RPC: check_entitlement ────────────────────────────────────────────────────
-- Returns whether a workspace is entitled to use a feature, plus current usage.
-- Returns NULL usage_limit / remaining when the feature is unlimited or allowed
-- without a numeric cap.

CREATE OR REPLACE FUNCTION check_entitlement(
  p_workspace_id uuid,
  p_feature_key text
)
RETURNS TABLE(
  allowed boolean,
  access_mode text,
  usage_limit integer,
  usage_count integer,
  remaining integer
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_package_id uuid;
  v_entitlement record;
  v_usage_count integer;
BEGIN
  -- 1. Resolve active subscription package
  SELECT ws.plan_id INTO v_package_id
  FROM workspace_subscriptions ws
  WHERE ws.workspace_id = p_workspace_id
    AND ws.status = 'Aktif'
  LIMIT 1;

  IF v_package_id IS NULL THEN
    -- No active subscription — fall back to free plan
    SELECT id INTO v_package_id
    FROM subscription_plans
    WHERE plan_key = 'free'
    LIMIT 1;
  END IF;

  IF v_package_id IS NULL THEN
    allowed := false;
    access_mode := 'denied';
    usage_limit := NULL;
    usage_count := 0;
    remaining := 0;
    RETURN NEXT;
    RETURN;
  END IF;

  -- 2. Read explicit package entitlement
  SELECT access_mode, usage_limit INTO v_entitlement
  FROM package_entitlements
  WHERE package_id = v_package_id
    AND feature_key = p_feature_key
  LIMIT 1;

  -- 3. If no explicit row, default to allowed (plan-based defaults are handled
  --    in the application layer via FEATURE_GATE).
  IF v_entitlement.access_mode IS NULL THEN
    v_entitlement.access_mode := 'allowed';
    v_entitlement.usage_limit := NULL;
  END IF;

  -- 4. Denied → reject immediately
  IF v_entitlement.access_mode = 'denied' THEN
    allowed := false;
    access_mode := 'denied';
    usage_limit := NULL;
    usage_count := 0;
    remaining := 0;
    RETURN NEXT;
    RETURN;
  END IF;

  -- 5. Read current period usage
  SELECT COALESCE(ru.usage_count, 0) INTO v_usage_count
  FROM resource_usage ru
  WHERE ru.workspace_id = p_workspace_id
    AND ru.feature_key = p_feature_key
    AND ru.period_start = date_trunc('month', now())::date
  LIMIT 1;

  -- 6. Limited mode with cap
  IF v_entitlement.access_mode = 'limited'
     AND v_entitlement.usage_limit IS NOT NULL THEN
    IF v_usage_count >= v_entitlement.usage_limit THEN
      allowed := false;
      access_mode := 'limited';
      usage_limit := v_entitlement.usage_limit;
      usage_count := v_usage_count;
      remaining := 0;
      RETURN NEXT;
      RETURN;
    END IF;
    allowed := true;
    access_mode := 'limited';
    usage_limit := v_entitlement.usage_limit;
    usage_count := v_usage_count;
    remaining := v_entitlement.usage_limit - v_usage_count;
    RETURN NEXT;
    RETURN;
  END IF;

  -- 7. Allowed / Unlimited
  allowed := true;
  access_mode := v_entitlement.access_mode;
  usage_limit := v_entitlement.usage_limit;
  usage_count := v_usage_count;
  remaining := NULL;
  RETURN NEXT;
END;
$$;

-- ─── RPC: increment_usage ──────────────────────────────────────────────────────
-- Atomically increments usage count for a workspace + feature in the current
-- monthly period. Creates the period row if it does not exist.

CREATE OR REPLACE FUNCTION increment_usage(
  p_workspace_id uuid,
  p_feature_key text
)
RETURNS TABLE(usage_count integer)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_period_start date;
  v_period_end date;
BEGIN
  v_period_start := date_trunc('month', now())::date;
  v_period_end := (date_trunc('month', now()) + interval '1 month - 1 day')::date;

  INSERT INTO resource_usage (workspace_id, feature_key, period_start, period_end, usage_count)
  VALUES (p_workspace_id, p_feature_key, v_period_start, v_period_end, 1)
  ON CONFLICT (workspace_id, feature_key, period_start)
  DO UPDATE SET
    usage_count = resource_usage.usage_count + 1,
    updated_at = now();

  SELECT ru.usage_count INTO usage_count
  FROM resource_usage ru
  WHERE ru.workspace_id = p_workspace_id
    AND ru.feature_key = p_feature_key
    AND ru.period_start = v_period_start
  LIMIT 1;

  RETURN NEXT;
END;
$$;

-- ─── RPC: create_formula_with_entitlement ─────────────────────────────────────
-- Atomically checks formula entitlement and inserts a new feed_formula row.
-- This is the ONLY server-side enforcement point for formula creation.

CREATE OR REPLACE FUNCTION create_formula_with_entitlement(
  p_workspace_id uuid,
  p_name text,
  p_status text,
  p_target_species text[],
  p_target_age_group text,
  p_description text,
  p_total_cost_per_kg numeric,
  p_created_by uuid
)
RETURNS TABLE(id uuid)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_entitlement record;
  v_usage_count integer;
  v_period_start date;
  v_new_id uuid;
BEGIN
  -- 1. Check entitlement
  SELECT * INTO v_entitlement
  FROM check_entitlement(p_workspace_id, 'formula_feed');

  IF NOT v_entitlement.allowed THEN
    RAISE EXCEPTION 'ENTITLEMENT_DENIED: Formula Pakan tidak termasuk dalam paket Anda.';
  END IF;

  -- 2. If limited, check and increment usage atomically
  IF v_entitlement.access_mode = 'limited'
     AND v_entitlement.usage_limit IS NOT NULL THEN
    IF v_entitlement.usage_count >= v_entitlement.usage_limit THEN
      RAISE EXCEPTION 'USAGE_LIMIT_EXCEEDED: Batas formula tercapai (%/%).', v_entitlement.usage_count, v_entitlement.usage_limit;
    END IF;

    v_period_start := date_trunc('month', now())::date;
    INSERT INTO resource_usage (workspace_id, feature_key, period_start, period_end, usage_count)
    VALUES (p_workspace_id, 'formula_feed', v_period_start,
            (date_trunc('month', now()) + interval '1 month - 1 day')::date, 1)
    ON CONFLICT (workspace_id, feature_key, period_start)
    DO UPDATE SET
      usage_count = resource_usage.usage_count + 1,
      updated_at = now();
  END IF;

  -- 3. Insert formula
  INSERT INTO feed_formulas (
    workspace_id, name, status, target_species, target_age_group,
    description, total_cost_per_kg, created_by
  ) VALUES (
    p_workspace_id, p_name, p_status, p_target_species, p_target_age_group,
    p_description, p_total_cost_per_kg, p_created_by
  )
  RETURNING id INTO v_new_id;

  id := v_new_id;
  RETURN NEXT;
END;
$$;

-- ─── RPC: get_workspace_entitlements ──────────────────────────────────────────
-- Returns all entitlements for a workspace's active package, merged with
-- plan-based defaults. Used by the application layer to build the entitlement
-- tree.

CREATE OR REPLACE FUNCTION get_workspace_entitlements(
  p_workspace_id uuid
)
RETURNS TABLE(
  feature_key text,
  access_mode text,
  usage_limit integer,
  usage_count integer,
  remaining integer,
  is_explicit boolean
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_package_id uuid;
  v_entitlement record;
  v_usage_count integer;
  v_period_start date;
BEGIN
  -- Resolve active package
  SELECT ws.plan_id INTO v_package_id
  FROM workspace_subscriptions ws
  WHERE ws.workspace_id = p_workspace_id
    AND ws.status = 'Aktif'
  LIMIT 1;

  IF v_package_id IS NULL THEN
    SELECT id INTO v_package_id
    FROM subscription_plans
    WHERE plan_key = 'free'
    LIMIT 1;
  END IF;

  v_period_start := date_trunc('month', now())::date;

  -- Return all explicit package entitlements
  FOR v_entitlement IN
    SELECT pe.feature_key, pe.access_mode, pe.usage_limit
    FROM package_entitlements pe
    WHERE pe.package_id = v_package_id
  LOOP
    SELECT COALESCE(ru.usage_count, 0) INTO v_usage_count
    FROM resource_usage ru
    WHERE ru.workspace_id = p_workspace_id
      AND ru.feature_key = v_entitlement.feature_key
      AND ru.period_start = v_period_start
    LIMIT 1;

    feature_key := v_entitlement.feature_key;
    access_mode := v_entitlement.access_mode;
    usage_limit := v_entitlement.usage_limit;
    usage_count := v_usage_count;
    remaining := CASE
      WHEN v_entitlement.access_mode = 'limited'
           AND v_entitlement.usage_limit IS NOT NULL
      THEN GREATEST(v_entitlement.usage_limit - v_usage_count, 0)
      ELSE NULL
    END;
    is_explicit := true;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- ─── Permissions ──────────────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE package_entitlements TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE resource_usage TO service_role;
GRANT EXECUTE ON FUNCTION check_entitlement(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_usage(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_formula_with_entitlement(uuid, text, text, text[], text, text, numeric, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_workspace_entitlements(uuid) TO authenticated;
-- The workspace-subscriptions Edge Function (service_role) calls this RPC from the
-- server side after verifying workspace membership; grant execute to service_role.
GRANT EXECUTE ON FUNCTION get_workspace_entitlements(uuid) TO service_role;

-- ─── Trigger: enforce formula entitlement on direct inserts ───────────────────
-- Even if a client bypasses the create_formula_with_entitlement RPC and calls
-- feed_formulas.insert() directly, this trigger blocks unauthorized inserts.

CREATE OR REPLACE FUNCTION enforce_formula_entitlement()
RETURNS trigger
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_allowed boolean;
BEGIN
  IF NEW.workspace_id IS NULL THEN
    RAISE EXCEPTION 'ENTITLEMENT_DENIED: workspace_id diperlukan.';
  END IF;

  SELECT allowed INTO v_allowed
  FROM check_entitlement(NEW.workspace_id, 'formula_feed')
  LIMIT 1;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'ENTITLEMENT_DENIED: Formula Pakan tidak termasuk dalam paket Anda.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_formula_entitlement ON feed_formulas;
CREATE TRIGGER enforce_formula_entitlement
  BEFORE INSERT ON feed_formulas
  FOR EACH ROW EXECUTE FUNCTION enforce_formula_entitlement();
