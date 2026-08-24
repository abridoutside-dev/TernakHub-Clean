-- Fix transaction_rooms RLS recursion — TRANSPORT-RLS-001
--
-- Root cause:
--   transaction_room_participants ON transaction_rooms
--     contains a subquery on transaction_participants, and
--   transaction_participants_member ON transaction_participants
--     contains a subquery on transaction_rooms.
--   This mutual recursion triggers:
--     "infinite recursion detected in policy for relation 'transaction_rooms'"
--   whenever the Transport workspace (or any caller) evaluates
--   transport_transactions → transaction_rooms → transaction_participants
--   → transaction_rooms.
--
-- Fix:
--   Replace the direct cross-table subqueries with SECURITY DEFINER helper
--   functions that bypass RLS on the queried table while preserving the
--   original authorization logic (workspace membership checks).

-- 1. Helper: is this user a participant of the given transaction room?
CREATE OR REPLACE FUNCTION is_transaction_room_participant(p_room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM transaction_participants
    WHERE room_id = p_room_id
      AND is_workspace_member(workspace_id)
  );
$$;

-- 2. Helper: is this user the buyer or seller of the given transaction room?
CREATE OR REPLACE FUNCTION is_transaction_room_buyer_or_seller(p_room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM transaction_rooms
    WHERE id = p_room_id
      AND (is_workspace_member(buyer_workspace_id) OR is_workspace_member(seller_workspace_id))
  );
$$;

-- 3. Drop the recursive policies
DROP POLICY IF EXISTS transaction_room_participants ON transaction_rooms;
DROP POLICY IF EXISTS transaction_participants_member ON transaction_participants;

-- 4. Recreate non-recursive policies using the helper functions
CREATE POLICY transaction_room_participants ON transaction_rooms
  FOR ALL USING (
    is_workspace_member(buyer_workspace_id)
    OR is_workspace_member(seller_workspace_id)
    OR is_transaction_room_participant(transaction_rooms.id)
  )
  WITH CHECK (
    is_workspace_member(buyer_workspace_id)
    OR is_workspace_member(seller_workspace_id)
  );

CREATE POLICY transaction_participants_member ON transaction_participants
  FOR ALL USING (
    is_workspace_member(workspace_id)
    OR is_transaction_room_buyer_or_seller(room_id)
  )
  WITH CHECK (is_workspace_member(workspace_id));
