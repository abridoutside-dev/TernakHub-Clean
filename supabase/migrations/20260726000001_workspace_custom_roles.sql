-- AUTH-001B: Workspace custom roles, invitation phone support, and server-side functions.
-- Safe to run against a DB that already has DB-001A migrations applied.

-- ── 1. workspace_custom_roles ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workspace_custom_roles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         text NOT NULL,
  description  text,
  permissions  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, name)
);

ALTER TABLE workspace_custom_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY custom_roles_member_select ON workspace_custom_roles
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY custom_roles_owner_manage ON workspace_custom_roles
  FOR ALL USING (is_workspace_member(workspace_id, ARRAY['Owner']))
  WITH CHECK (is_workspace_member(workspace_id, ARRAY['Owner']));

-- ── 2. Extend workspace_members with custom_role_id ───────────────────────────

ALTER TABLE workspace_members
  ADD COLUMN IF NOT EXISTS custom_role_id uuid
    REFERENCES workspace_custom_roles(id) ON DELETE SET NULL;

-- ── 3. Extend workspace_invitations with phone + Rejected status ──────────────

ALTER TABLE workspace_invitations
  ADD COLUMN IF NOT EXISTS phone text;

-- Extend status CHECK to include 'Rejected' (invitee declines).
-- DROP + ADD because ALTER CONSTRAINT is not supported for CHECK constraints.
ALTER TABLE workspace_invitations
  DROP CONSTRAINT IF EXISTS workspace_invitations_status_check;

ALTER TABLE workspace_invitations
  ADD CONSTRAINT workspace_invitations_status_check
  CHECK (status IN ('Pending', 'Accepted', 'Expired', 'Revoked', 'Rejected'));

-- ── 4. Server-side functions (SECURITY DEFINER) ───────────────────────────────

-- 4a. Register the first Owner of a workspace.
--     Called immediately after workspace creation (no member row exists yet,
--     so client-side RLS would block the INSERT).
CREATE OR REPLACE FUNCTION register_workspace_owner(
  p_workspace_id uuid,
  p_user_id      uuid
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO workspace_members (workspace_id, user_id, role, status, joined_at)
  VALUES (p_workspace_id, p_user_id, 'Owner', 'Aktif', now())
  ON CONFLICT (workspace_id, user_id) DO NOTHING;
END;
$$;

-- 4b. Look up a pending invitation by token.
--     Allows any authenticated user to read ONE invitation for the accept-flow
--     without granting blanket table access.
CREATE OR REPLACE FUNCTION get_invitation_details(p_token text)
RETURNS TABLE (
  id           uuid,
  workspace_id uuid,
  workspace_name text,
  invited_by   uuid,
  email        text,
  phone        text,
  role         text,
  status       text,
  expires_at   timestamptz,
  created_at   timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.workspace_id,
    w.name AS workspace_name,
    i.invited_by,
    i.email,
    i.phone,
    i.role::text,
    i.status,
    i.expires_at,
    i.created_at
  FROM workspace_invitations i
  JOIN workspaces w ON w.id = i.workspace_id
  WHERE i.token = p_token;
END;
$$;

-- 4c. Atomically accept an invitation.
--     Verifies the token, inserts the member, marks the invitation Accepted.
CREATE OR REPLACE FUNCTION accept_workspace_invitation(
  p_token   text,
  p_user_id uuid
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_inv workspace_invitations%ROWTYPE;
BEGIN
  SELECT * INTO v_inv
  FROM workspace_invitations
  WHERE token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Undangan tidak ditemukan.');
  END IF;

  IF v_inv.status <> 'Pending' THEN
    RETURN jsonb_build_object('ok', false, 'error',
      CASE v_inv.status
        WHEN 'Accepted' THEN 'Undangan sudah diterima sebelumnya.'
        WHEN 'Rejected' THEN 'Undangan sudah ditolak.'
        WHEN 'Revoked'  THEN 'Undangan telah dibatalkan oleh pengirim.'
        WHEN 'Expired'  THEN 'Undangan sudah kadaluarsa.'
        ELSE 'Undangan tidak valid.'
      END
    );
  END IF;

  IF v_inv.expires_at IS NOT NULL AND v_inv.expires_at < now() THEN
    UPDATE workspace_invitations SET status = 'Expired' WHERE id = v_inv.id;
    RETURN jsonb_build_object('ok', false, 'error', 'Undangan sudah kadaluarsa.');
  END IF;

  -- Insert member (idempotent: do nothing if already a member).
  INSERT INTO workspace_members (workspace_id, user_id, role, status, invited_by, joined_at)
  VALUES (v_inv.workspace_id, p_user_id, v_inv.role, 'Aktif', v_inv.invited_by, now())
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  UPDATE workspace_invitations SET status = 'Accepted' WHERE id = v_inv.id;

  RETURN jsonb_build_object(
    'ok',           true,
    'workspace_id', v_inv.workspace_id::text,
    'role',         v_inv.role::text
  );
END;
$$;

-- 4d. Reject an invitation (invitee declines).
CREATE OR REPLACE FUNCTION reject_workspace_invitation(p_token text)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE workspace_invitations
  SET status = 'Rejected'
  WHERE token = p_token AND status = 'Pending';
  RETURN FOUND;
END;
$$;
