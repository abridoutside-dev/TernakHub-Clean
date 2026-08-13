-- SECURITY-LIFECYCLE-003 — Atomic user suspension with workspace cascade
--
-- Replaces admin_suspend_account() with a single SECURITY DEFINER
-- transaction so owner suspension and workspace inactivation are atomic.

CREATE OR REPLACE FUNCTION admin_suspend_account(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_count integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND status = 'active') THEN
    RAISE EXCEPTION 'Account is not active' USING ERRCODE = '42501';
  END IF;
  UPDATE user_profiles SET status = 'suspended' WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found' USING ERRCODE = '23500';
  END IF;
  SELECT count(*) INTO v_workspace_count FROM workspaces WHERE owner_id = p_user_id;
  IF v_workspace_count > 0 THEN
    UPDATE workspaces SET status = 'Nonaktif' WHERE owner_id = p_user_id;
  END IF;
END;
$$;
