-- OWN-001 — ownership transfer history, audit, and atomic transitions.

CREATE TABLE ownership_transfer_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ownership_transfer_id uuid NOT NULL REFERENCES ownership_transfers(id) ON DELETE CASCADE,
  from_status ownership_transfer_status,
  to_status ownership_transfer_status NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ownership_transfer_history_transfer
  ON ownership_transfer_history (ownership_transfer_id, created_at DESC);

ALTER TABLE ownership_transfer_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY ownership_transfer_history_admin_read ON ownership_transfer_history
  FOR SELECT USING (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
    OR coalesce((auth.jwt() -> 'user_metadata' ->> 'system_admin')::boolean, false)
  );

GRANT SELECT, INSERT ON TABLE ownership_transfer_history TO authenticated;

CREATE OR REPLACE FUNCTION ownership_transfer_transition(
  p_transfer_id uuid,
  p_actor_id uuid,
  p_action text,
  p_reason text DEFAULT NULL
)
RETURNS SETOF ownership_transfers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_transfer ownership_transfers%ROWTYPE;
  next_status ownership_transfer_status;
BEGIN
  SELECT * INTO current_transfer
  FROM ownership_transfers
  WHERE id = p_transfer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer tidak ditemukan' USING ERRCODE = 'P0002';
  END IF;

  IF p_action = 'approve' AND current_transfer.status IN ('Requested', 'PendingVerification') THEN
    next_status := 'Approved';
  ELSIF p_action = 'reject' AND current_transfer.status IN ('Requested', 'PendingVerification') THEN
    next_status := 'Rejected';
  ELSIF p_action = 'cancel' AND current_transfer.status IN ('Draft', 'Requested', 'PendingVerification') THEN
    next_status := 'Cancelled';
  ELSE
    RAISE EXCEPTION 'Transisi status transfer tidak valid' USING ERRCODE = 'P0001';
  END IF;

  IF p_action = 'approve' THEN
    UPDATE workspace_members
    SET role = 'Viewer', updated_at = now()
    WHERE workspace_id = current_transfer.workspace_id
      AND user_id = current_transfer.from_user_id
      AND role = 'Owner';

    INSERT INTO workspace_members (workspace_id, user_id, role, status, joined_at)
    VALUES (current_transfer.workspace_id, current_transfer.to_user_id, 'Owner', 'Aktif', now())
    ON CONFLICT (workspace_id, user_id)
    DO UPDATE SET role = 'Owner', status = 'Aktif', updated_at = now();

    UPDATE workspaces
    SET owner_id = current_transfer.to_user_id, updated_at = now()
    WHERE id = current_transfer.workspace_id;
  END IF;

  UPDATE ownership_transfers
  SET status = next_status,
      completed_at = CASE WHEN p_action = 'approve' THEN now() ELSE completed_at END,
      updated_at = now()
  WHERE id = p_transfer_id;

  INSERT INTO ownership_transfer_history (
    ownership_transfer_id, from_status, to_status, changed_by, reason
  ) VALUES (
    p_transfer_id, current_transfer.status, next_status, p_actor_id, nullif(trim(p_reason), '')
  );

  PERFORM add_audit_event(
    current_transfer.workspace_id,
    p_actor_id,
    'ownership_transfer_' || lower(p_action),
    'ownership_transfer',
    p_transfer_id,
    jsonb_build_object('status', current_transfer.status, 'workspace_id', current_transfer.workspace_id),
    jsonb_build_object('status', next_status, 'from_user_id', current_transfer.from_user_id, 'to_user_id', current_transfer.to_user_id)
  );

  RETURN QUERY SELECT * FROM ownership_transfers WHERE id = p_transfer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION ownership_transfer_transition(uuid, uuid, text, text) TO service_role;