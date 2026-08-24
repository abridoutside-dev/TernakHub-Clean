-- ─── Fix Transport Workspace — TRANSPORT-WS-001 ───────────────────────────────
-- Migration: make transport_transactions support internal workspace deliveries.
--
-- Problems fixed:
--   1. room_id was NOT NULL with FK to transaction_rooms, but the Transport
--      Workspace page creates internal deliveries without a transaction room.
--   2. transport_status_enum only had English values (Pending/Confirmed/InTransit/
--      Delivered/Cancelled), but the workspace UI uses Indonesian delivery statuses.
--   3. No transport_type column to categorize deliveries by service type.
--   4. RLS policy only allowed access via transaction_rooms membership, which
--      blocked internal workspace deliveries from being read back.
--
-- Minimal changes only — no data deletion, no schema reset.

-- 1. Make room_id nullable so internal deliveries can exist without a
--    transaction room. ON DELETE SET NULL preserves referential integrity
--    for marketplace-linked rows while allowing NULL for internal rows.
ALTER TABLE transport_transactions
  DROP CONSTRAINT IF EXISTS transport_transactions_room_id_fkey,
  ALTER COLUMN room_id DROP NOT NULL,
  ADD CONSTRAINT transport_transactions_room_id_fkey
    FOREIGN KEY (room_id) REFERENCES transaction_rooms(id) ON DELETE SET NULL;

-- 2. Expand transport_status_enum with Indonesian delivery statuses used by
--    the Transport Workspace UI. Existing English values are preserved for
--    backward compatibility with any marketplace-linked data.
ALTER TYPE transport_status_enum ADD VALUE 'Menunggu';
ALTER TYPE transport_status_enum ADD VALUE 'Dikonfirmasi';
ALTER TYPE transport_status_enum ADD VALUE 'Pickup Ready';
ALTER TYPE transport_status_enum ADD VALUE 'Dalam Perjalanan';
ALTER TYPE transport_status_enum ADD VALUE 'Tiba';
ALTER TYPE transport_status_enum ADD VALUE 'Selesai';
ALTER TYPE transport_status_enum ADD VALUE 'Dibatalkan';

-- 3. Add transport_type column so deliveries can be categorized by service
--    type (Angkut Ternak, Angkut Pakan, Angkut Obat, etc.).
ALTER TABLE transport_transactions
  ADD COLUMN IF NOT EXISTS transport_type text;

-- 4. Update RLS policy: allow workspace members to read/write their own
--    internal deliveries (where transport_workspace_id matches their workspace)
--    in addition to the existing transaction_rooms-based access.
DROP POLICY IF EXISTS transport_transaction_member ON transport_transactions;
CREATE POLICY transport_transaction_member ON transport_transactions
  FOR ALL USING (
    (room_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM transaction_rooms tr
      WHERE tr.id = room_id
        AND (is_workspace_member(tr.buyer_workspace_id) OR is_workspace_member(tr.seller_workspace_id))
    ))
    OR (transport_workspace_id IS NOT NULL AND is_workspace_member(transport_workspace_id))
  )
  WITH CHECK (
    (room_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM transaction_rooms tr
      WHERE tr.id = room_id
        AND (is_workspace_member(tr.buyer_workspace_id) OR is_workspace_member(tr.seller_workspace_id))
    ))
    OR (transport_workspace_id IS NOT NULL AND is_workspace_member(transport_workspace_id))
  );
