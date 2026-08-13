-- SECURITY-ARCH-003 — Admin Control Plane: FK Cascade + Account Lifecycle
--
-- 1. Fixes missing ON DELETE CASCADE / SET NULL on workspace-scoped and
--    audit-scoped foreign keys so that workspace/account lifecycle operations
--    do not fail with FK violations.
-- 2. Adds account lifecycle status to user_profiles.
-- 3. Adds SECURITY DEFINER functions for admin control-plane lifecycle
--    operations (suspend/unsuspend/delete workspace and account).
--
-- Principle:
--   Operational workspace data  → ON DELETE CASCADE
--   Audit / history data        → ON DELETE SET NULL (preserve record)
--   User references in audit    → ON DELETE SET NULL (preserve audit)

-- ─── 1. Ownership transfers (critical: blocks workspace deletion) ──────────────

ALTER TABLE ownership_transfers
  DROP CONSTRAINT IF EXISTS ownership_transfers_workspace_id_fkey,
  ADD CONSTRAINT ownership_transfers_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- ─── 2. Feed / formula / inventory ────────────────────────────────────────────

ALTER TABLE feed_formula_productions
  DROP CONSTRAINT IF EXISTS feed_formula_productions_workspace_id_fkey,
  ADD CONSTRAINT feed_formula_productions_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE stok_inventaris_transactions
  DROP CONSTRAINT IF EXISTS stok_inventaris_transactions_workspace_id_fkey,
  ADD CONSTRAINT stok_inventaris_transactions_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE pemberian_pakan
  DROP CONSTRAINT IF EXISTS pemberian_pakan_workspace_id_fkey,
  ADD CONSTRAINT pemberian_pakan_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- ─── 3. Marketplace ───────────────────────────────────────────────────────────

ALTER TABLE marketplace_listings
  DROP CONSTRAINT IF EXISTS marketplace_listings_workspace_id_fkey,
  ADD CONSTRAINT marketplace_listings_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE marketplace_chat_rooms
  DROP CONSTRAINT IF EXISTS marketplace_chat_rooms_buyer_workspace_id_fkey,
  ADD CONSTRAINT marketplace_chat_rooms_buyer_workspace_id_fkey
    FOREIGN KEY (buyer_workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE marketplace_chat_rooms
  DROP CONSTRAINT IF EXISTS marketplace_chat_rooms_seller_workspace_id_fkey,
  ADD CONSTRAINT marketplace_chat_rooms_seller_workspace_id_fkey
    FOREIGN KEY (seller_workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE marketplace_negotiations
  DROP CONSTRAINT IF EXISTS marketplace_negotiations_buyer_workspace_id_fkey,
  ADD CONSTRAINT marketplace_negotiations_buyer_workspace_id_fkey
    FOREIGN KEY (buyer_workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE marketplace_negotiations
  DROP CONSTRAINT IF EXISTS marketplace_negotiations_seller_workspace_id_fkey,
  ADD CONSTRAINT marketplace_negotiations_seller_workspace_id_fkey
    FOREIGN KEY (seller_workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE marketplace_transactions
  DROP CONSTRAINT IF EXISTS marketplace_transactions_buyer_workspace_id_fkey,
  ADD CONSTRAINT marketplace_transactions_buyer_workspace_id_fkey
    FOREIGN KEY (buyer_workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE marketplace_transactions
  DROP CONSTRAINT IF EXISTS marketplace_transactions_seller_workspace_id_fkey,
  ADD CONSTRAINT marketplace_transactions_seller_workspace_id_fkey
    FOREIGN KEY (seller_workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE marketplace_chat_messages
  DROP CONSTRAINT IF EXISTS marketplace_chat_messages_sender_workspace_id_fkey,
  ADD CONSTRAINT marketplace_chat_messages_sender_workspace_id_fkey
    FOREIGN KEY (sender_workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE marketplace_moderations
  DROP CONSTRAINT IF EXISTS marketplace_moderations_reported_by_workspace_id_fkey,
  ADD CONSTRAINT marketplace_moderations_reported_by_workspace_id_fkey
    FOREIGN KEY (reported_by_workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;

-- ─── 4. Transaction / escrow / transport ──────────────────────────────────────

ALTER TABLE transaction_rooms
  DROP CONSTRAINT IF EXISTS transaction_rooms_buyer_workspace_id_fkey,
  ADD CONSTRAINT transaction_rooms_buyer_workspace_id_fkey
    FOREIGN KEY (buyer_workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE transaction_rooms
  DROP CONSTRAINT IF EXISTS transaction_rooms_seller_workspace_id_fkey,
  ADD CONSTRAINT transaction_rooms_seller_workspace_id_fkey
    FOREIGN KEY (seller_workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE transaction_participants
  DROP CONSTRAINT IF EXISTS transaction_participants_workspace_id_fkey,
  ADD CONSTRAINT transaction_participants_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE transaction_attachments
  DROP CONSTRAINT IF EXISTS transaction_attachments_uploaded_by_workspace_id_fkey,
  ADD CONSTRAINT transaction_attachments_uploaded_by_workspace_id_fkey
    FOREIGN KEY (uploaded_by_workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;

ALTER TABLE service_quotations
  DROP CONSTRAINT IF EXISTS service_quotations_provider_workspace_id_fkey,
  ADD CONSTRAINT service_quotations_provider_workspace_id_fkey
    FOREIGN KEY (provider_workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE transport_transactions
  DROP CONSTRAINT IF EXISTS transport_transactions_transport_workspace_id_fkey,
  ADD CONSTRAINT transport_transactions_transport_workspace_id_fkey
    FOREIGN KEY (transport_workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE transaction_conversation_messages
  DROP CONSTRAINT IF EXISTS transaction_conversation_messages_sender_workspace_id_fkey,
  ADD CONSTRAINT transaction_conversation_messages_sender_workspace_id_fkey
    FOREIGN KEY (sender_workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE transaction_evidence
  DROP CONSTRAINT IF EXISTS transaction_evidence_submitted_by_workspace_id_fkey,
  ADD CONSTRAINT transaction_evidence_submitted_by_workspace_id_fkey
    FOREIGN KEY (submitted_by_workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE transaction_audit_trail
  DROP CONSTRAINT IF EXISTS transaction_audit_trail_actor_workspace_id_fkey,
  ADD CONSTRAINT transaction_audit_trail_actor_workspace_id_fkey
    FOREIGN KEY (actor_workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;

-- ─── 5. Health / reproduction ─────────────────────────────────────────────────

ALTER TABLE health_checkups
  DROP CONSTRAINT IF EXISTS health_checkups_workspace_id_fkey,
  ADD CONSTRAINT health_checkups_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE health_treatments
  DROP CONSTRAINT IF EXISTS health_treatments_workspace_id_fkey,
  ADD CONSTRAINT health_treatments_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE reproduksi_programs
  DROP CONSTRAINT IF EXISTS reproduksi_programs_workspace_id_fkey,
  ADD CONSTRAINT reproduksi_programs_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE pelaksanaan_reproduksi
  DROP CONSTRAINT IF EXISTS pelaksanaan_reproduksi_workspace_id_fkey,
  ADD CONSTRAINT pelaksanaan_reproduksi_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE monitoring_reproduksi
  DROP CONSTRAINT IF EXISTS monitoring_reproduksi_workspace_id_fkey,
  ADD CONSTRAINT monitoring_reproduksi_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE pemeriksaan_kebuntingan
  DROP CONSTRAINT IF EXISTS pemeriksaan_kebuntingan_workspace_id_fkey,
  ADD CONSTRAINT pemeriksaan_kebuntingan_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE kebuntingan
  DROP CONSTRAINT IF EXISTS kebuntingan_workspace_id_fkey,
  ADD CONSTRAINT kebuntingan_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE kelahiran
  DROP CONSTRAINT IF EXISTS kelahiran_workspace_id_fkey,
  ADD CONSTRAINT kelahiran_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE registrasi_anak
  DROP CONSTRAINT IF EXISTS registrasi_anak_workspace_id_fkey,
  ADD CONSTRAINT registrasi_anak_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE sapih
  DROP CONSTRAINT IF EXISTS sapih_workspace_id_fkey,
  ADD CONSTRAINT sapih_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE stok_obat_masuk
  DROP CONSTRAINT IF EXISTS stok_obat_masuk_workspace_id_fkey,
  ADD CONSTRAINT stok_obat_masuk_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE stok_obat_keluar
  DROP CONSTRAINT IF EXISTS stok_obat_keluar_workspace_id_fkey,
  ADD CONSTRAINT stok_obat_keluar_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- ─── 6. Livestock audit/history (SET NULL for user references) ────────────────

ALTER TABLE livestock_edit_history
  DROP CONSTRAINT IF EXISTS livestock_edit_history_edited_by_fkey,
  ADD CONSTRAINT livestock_edit_history_edited_by_fkey
    FOREIGN KEY (edited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE livestock_photos
  DROP CONSTRAINT IF EXISTS livestock_photos_uploaded_by_fkey,
  ADD CONSTRAINT livestock_photos_uploaded_by_fkey
    FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE livestock_weight_entries
  DROP CONSTRAINT IF EXISTS livestock_weight_entries_recorded_by_fkey,
  ADD CONSTRAINT livestock_weight_entries_recorded_by_fkey
    FOREIGN KEY (recorded_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE batch_history
  DROP CONSTRAINT IF EXISTS batch_history_performed_by_fkey,
  ADD CONSTRAINT batch_history_performed_by_fkey
    FOREIGN KEY (performed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE batch_operations
  DROP CONSTRAINT IF EXISTS batch_operations_performed_by_fkey,
  ADD CONSTRAINT batch_operations_performed_by_fkey
    FOREIGN KEY (performed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE livestock_transfers
  DROP CONSTRAINT IF EXISTS livestock_transfers_transferred_by_fkey,
  ADD CONSTRAINT livestock_transfers_transferred_by_fkey
    FOREIGN KEY (transferred_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE mutation_requests
  DROP CONSTRAINT IF EXISTS mutation_requests_requested_by_fkey,
  ADD CONSTRAINT mutation_requests_requested_by_fkey
    FOREIGN KEY (requested_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE mutation_requests
  DROP CONSTRAINT IF EXISTS mutation_requests_approved_by_fkey,
  ADD CONSTRAINT mutation_requests_approved_by_fkey
    FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ─── 7. Other user references (SET NULL) ─────────────────────────────────────

ALTER TABLE feed_formulas
  DROP CONSTRAINT IF EXISTS feed_formulas_created_by_fkey,
  ADD CONSTRAINT feed_formulas_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE feed_formula_productions
  DROP CONSTRAINT IF EXISTS feed_formula_productions_produced_by_fkey,
  ADD CONSTRAINT feed_formula_productions_produced_by_fkey
    FOREIGN KEY (produced_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE stok_inventaris_transactions
  DROP CONSTRAINT IF EXISTS stok_inventaris_transactions_recorded_by_fkey,
  ADD CONSTRAINT stok_inventaris_transactions_recorded_by_fkey
    FOREIGN KEY (recorded_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE jadwal_pemberian_pakan
  DROP CONSTRAINT IF EXISTS jadwal_pemberian_pakan_created_by_fkey,
  ADD CONSTRAINT jadwal_pemberian_pakan_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE pemberian_pakan
  DROP CONSTRAINT IF EXISTS pemberian_pakan_recorded_by_fkey,
  ADD CONSTRAINT pemberian_pakan_recorded_by_fkey
    FOREIGN KEY (recorded_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE marketplace_moderations
  DROP CONSTRAINT IF EXISTS marketplace_moderations_reviewed_by_fkey,
  ADD CONSTRAINT marketplace_moderations_reviewed_by_fkey
    FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE batches
  DROP CONSTRAINT IF EXISTS batches_created_by_fkey,
  ADD CONSTRAINT batches_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE trust_verifications
  DROP CONSTRAINT IF EXISTS trust_verifications_reviewed_by_fkey,
  ADD CONSTRAINT trust_verifications_reviewed_by_fkey
    FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE media
  DROP CONSTRAINT IF EXISTS media_created_by_fkey,
  ADD CONSTRAINT media_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ─── 8. Account lifecycle status ──────────────────────────────────────────────

DO $$
BEGIN
  ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'deleted'));
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- ─── 8a. Enforce account status in workspace membership ────────────────────────
-- Suspended or deleted accounts must not be treated as workspace members.
-- This updates the core SECURITY DEFINER helper used by all workspace-scoped
-- RLS policies, ensuring lifecycle rules are enforced at the database boundary.

CREATE OR REPLACE FUNCTION is_workspace_member(
  p_workspace_id uuid,
  p_role text[] DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM workspace_members wm
    JOIN user_profiles up ON up.id = wm.user_id
    WHERE wm.workspace_id = p_workspace_id
      AND wm.user_id = auth.uid()
      AND wm.status = 'Aktif'
      AND up.status = 'active'
      AND (p_role IS NULL OR role::text = ANY (p_role))
  );
$$;

-- ─── 9. Admin lifecycle functions ─────────────────────────────────────────────
-- These run as SECURITY DEFINER (postgres) so admin Edge Functions can call
-- them with service_role, bypassing RLS entirely.

-- 9a. Account lifecycle

CREATE OR REPLACE FUNCTION admin_suspend_account(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND status = 'active') THEN
    RAISE EXCEPTION 'Account is not active' USING ERRCODE = '42501';
  END IF;
  UPDATE user_profiles SET status = 'suspended' WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found' USING ERRCODE = '23500';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION admin_unsuspend_account(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND status = 'active') THEN
    RAISE EXCEPTION 'Account is not active' USING ERRCODE = '42501';
  END IF;
  UPDATE user_profiles SET status = 'active' WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found' USING ERRCODE = '23500';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION admin_delete_account(p_user_id uuid)
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
  SELECT count(*) INTO v_workspace_count FROM workspaces WHERE owner_id = p_user_id;
  IF v_workspace_count > 0 THEN
    RAISE EXCEPTION 'Account still owns % workspace(s); delete all workspaces first' USING ERRCODE = '23500';
  END IF;
  SELECT status INTO v_workspace_count FROM user_profiles WHERE id = p_user_id;
  IF v_workspace_count IS NULL OR v_workspace_count <> 'suspended' THEN
    RAISE EXCEPTION 'Account must be suspended before deletion' USING ERRCODE = '23500';
  END IF;
  UPDATE user_profiles SET status = 'deleted' WHERE id = p_user_id;
END;
$$;

-- 9b. Workspace lifecycle

CREATE OR REPLACE FUNCTION admin_suspend_workspace(p_workspace_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND status = 'active') THEN
    RAISE EXCEPTION 'Account is not active' USING ERRCODE = '42501';
  END IF;
  UPDATE workspaces SET status = 'Nonaktif' WHERE id = p_workspace_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workspace not found' USING ERRCODE = '23500';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION admin_unsuspend_workspace(p_workspace_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND status = 'active') THEN
    RAISE EXCEPTION 'Account is not active' USING ERRCODE = '42501';
  END IF;
  UPDATE workspaces SET status = 'Aktif' WHERE id = p_workspace_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workspace not found' USING ERRCODE = '23500';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION admin_delete_workspace(p_workspace_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND status = 'active') THEN
    RAISE EXCEPTION 'Account is not active' USING ERRCODE = '42501';
  END IF;
  SELECT status INTO v_status FROM workspaces WHERE id = p_workspace_id;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Workspace not found' USING ERRCODE = '23500';
  END IF;
  IF v_status = 'Aktif' THEN
    RAISE EXCEPTION 'Workspace must be suspended before deletion' USING ERRCODE = '23500';
  END IF;
  DELETE FROM workspaces WHERE id = p_workspace_id;
END;
$$;

-- 9c. Ownership transfer admin actions

CREATE OR REPLACE FUNCTION admin_approve_ownership_transfer(p_transfer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer ownership_transfers%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND status = 'active') THEN
    RAISE EXCEPTION 'Account is not active' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_transfer FROM ownership_transfers WHERE id = p_transfer_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer request not found' USING ERRCODE = '23500';
  END IF;
  IF v_transfer.status <> 'PendingVerification' AND v_transfer.status <> 'Approved' THEN
    RAISE EXCEPTION 'Transfer must be in PendingVerification or Approved status' USING ERRCODE = '23500';
  END IF;

  UPDATE ownership_transfers
  SET status = 'Completed', completed_at = now()
  WHERE id = p_transfer_id;

  UPDATE workspace_members
  SET user_id = v_transfer.to_user_id, role = 'Owner'
  WHERE workspace_id = v_transfer.workspace_id AND role = 'Owner';
END;
$$;

CREATE OR REPLACE FUNCTION admin_reject_ownership_transfer(p_transfer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND status = 'active') THEN
    RAISE EXCEPTION 'Account is not active' USING ERRCODE = '42501';
  END IF;
  UPDATE ownership_transfers
  SET status = 'Rejected'
  WHERE id = p_transfer_id AND status NOT IN ('Completed', 'Rejected', 'Cancelled');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer request not found or already finalized' USING ERRCODE = '23500';
  END IF;
END;
$$;

-- ─── 10. Admin lifecycle functions ────────────────────────────────────────────
-- These SECURITY DEFINER functions are callable ONLY by the Admin Edge Function
-- via service_role. No GRANT to authenticated — browser clients cannot invoke
-- them directly through PostgREST .rpc().

-- Note: Supabase service_role bypasses GRANT EXECUTE checks for trusted
-- server-side operations. If your deployment requires explicit grants, add:
--   GRANT EXECUTE ON FUNCTION ... TO service_role;
-- but DO NOT grant to authenticated.
