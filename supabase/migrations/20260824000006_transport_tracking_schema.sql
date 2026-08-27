-- Transport Tracking schema — TRANSPORT-SCHEMA-004
-- Adds transport_tracking for persistent live-location sharing during active
-- transport deliveries. Replaces the previous in-memory-only location state.

CREATE TABLE transport_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES transaction_rooms(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES transport_transactions(id) ON DELETE CASCADE,
  latitude numeric(10,8),
  longitude numeric(11,8),
  location_name text,
  speed numeric,
  distance_remaining numeric,
  eta text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  shared_by uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_transport_tracking_chat
  ON transport_tracking (chat_id);

CREATE INDEX idx_transport_tracking_transaction
  ON transport_tracking (transaction_id);

ALTER TABLE transport_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY transport_tracking_member ON transport_tracking
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM transaction_rooms tr
      WHERE tr.id = chat_id
        AND (is_workspace_member(tr.buyer_workspace_id) OR is_workspace_member(tr.seller_workspace_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transaction_rooms tr
      WHERE tr.id = chat_id
        AND (is_workspace_member(tr.buyer_workspace_id) OR is_workspace_member(tr.seller_workspace_id))
    )
  );

CREATE POLICY transport_tracking_admin ON transport_tracking
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());
