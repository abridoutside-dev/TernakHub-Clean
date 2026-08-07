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

-- Ownership transfer data is intentionally available only through the
-- ownership-transfers Edge Function. The browser must not query or mutate
-- these tables directly.
REVOKE ALL ON TABLE ownership_transfers FROM authenticated;
REVOKE ALL ON TABLE ownership_transfer_history FROM authenticated;

-- The Edge Function uses the service role through PostgREST. RLS is bypassed
-- by service_role, but table privileges still need to be explicit.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ownership_transfers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ownership_transfer_history TO service_role;
GRANT SELECT ON TABLE workspaces, workspace_members, user_profiles TO service_role;
GRANT SELECT, INSERT ON TABLE global_audit_trail TO service_role;

CREATE OR REPLACE FUNCTION ownership_transfer_create(
  p_workspace_id uuid,
  p_to_user_id uuid,
  p_actor_id uuid,
  p_reason text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS SETOF ownership_transfers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  source_workspace workspaces%ROWTYPE;
  inserted_transfer ownership_transfers%ROWTYPE;
BEGIN
  SELECT * INTO source_workspace
  FROM workspaces
  WHERE id = p_workspace_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workspace tidak ditemukan' USING ERRCODE = 'P0002';
  END IF;

  IF source_workspace.owner_id = p_to_user_id THEN
    RAISE EXCEPTION 'User penerima sudah menjadi owner workspace' USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_to_user_id) THEN
    RAISE EXCEPTION 'User penerima tidak ditemukan' USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM ownership_transfers
    WHERE workspace_id = p_workspace_id
      AND status IN ('Draft', 'Requested', 'PendingVerification', 'Approved')
  ) THEN
    RAISE EXCEPTION 'Workspace masih memiliki transfer aktif lainnya' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO ownership_transfers (
    workspace_id,
    from_user_id,
    to_user_id,
    status,
    reason,
    notes,
    workspace_snapshot,
    requested_at
  ) VALUES (
    p_workspace_id,
    source_workspace.owner_id,
    p_to_user_id,
    'Requested',
    nullif(trim(p_reason), ''),
    nullif(trim(p_notes), ''),
    jsonb_build_object(
      'id', source_workspace.id,
      'name', source_workspace.name,
      'type', source_workspace.type,
      'owner_id', source_workspace.owner_id,
      'metadata', source_workspace.metadata
    ),
    now()
  )
  RETURNING * INTO inserted_transfer;

  INSERT INTO ownership_transfer_history (
    ownership_transfer_id, from_status, to_status, changed_by
  ) VALUES (
    inserted_transfer.id, 'Draft', 'Requested', p_actor_id
  );

  PERFORM add_audit_event(
    p_workspace_id,
    p_actor_id,
    'ownership_transfer_create',
    'ownership_transfer',
    inserted_transfer.id,
    NULL,
    jsonb_build_object(
      'status', inserted_transfer.status,
      'workspace_id', p_workspace_id,
      'from_user_id', inserted_transfer.from_user_id,
      'to_user_id', inserted_transfer.to_user_id
    )
  );

  RETURN QUERY SELECT inserted_transfer.*;
END;
$$;

GRANT EXECUTE ON FUNCTION ownership_transfer_create(uuid, uuid, uuid, text, text) TO service_role;

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

  IF p_action = 'approve' AND current_transfer.status IN ('Requested', 'PendingVerification', 'Approved') THEN
    -- Approval is the terminal ownership operation exposed by the UI. Keep
    -- Approved as an accepted legacy input so an already-approved WIP record
    -- can still be completed safely.
    next_status := 'Completed';
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
      completed_at = CASE WHEN next_status = 'Completed' THEN COALESCE(completed_at, now()) ELSE completed_at END,
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