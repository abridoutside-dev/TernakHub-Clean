-- SECURITY-LIFECYCLE-001 — Enforce owner suspension before workspace deletion
--
-- Adds owner account status validation to admin_delete_workspace().
-- A workspace may only be deleted after its owner account is suspended.

CREATE OR REPLACE FUNCTION admin_delete_workspace(p_workspace_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_owner_id uuid;
  v_owner_status text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND status = 'active') THEN
    RAISE EXCEPTION 'Account is not active' USING ERRCODE = '42501';
  END IF;
  SELECT status, owner_id INTO v_status, v_owner_id FROM workspaces WHERE id = p_workspace_id;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Workspace not found' USING ERRCODE = '23500';
  END IF;
  IF v_status = 'Aktif' THEN
    RAISE EXCEPTION 'Workspace must be suspended before deletion' USING ERRCODE = '23500';
  END IF;
  SELECT status INTO v_owner_status FROM user_profiles WHERE id = v_owner_id;
  IF v_owner_status IS NULL OR v_owner_status <> 'suspended' THEN
    RAISE EXCEPTION 'Account owner must be suspended before workspace deletion' USING ERRCODE = '42501';
  END IF;
  DELETE FROM workspaces WHERE id = p_workspace_id;
END;
$$;
