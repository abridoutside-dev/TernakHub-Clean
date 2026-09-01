-- Transport Shipment Batches — TRANSPORT-BATCH-001
-- Adds persistent batch/combined-delivery support so a single vehicle + driver
-- can carry multiple transport_transactions (shipments) on one trip, with
-- capacity validation enforced at the repository layer.
--
-- Canonical tables referenced (already applied: 20260824 batch):
--   workspaces(id), transport_vehicles(id), transport_drivers(id),
--   transport_transactions(id)

-- ── Batch (one trip / perjalanan) ───────────────────────────────────────────────
CREATE TABLE transport_shipment_batches (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  kendaraan_id    uuid REFERENCES transport_vehicles(id) ON DELETE SET NULL,
  driver_id       uuid REFERENCES transport_drivers(id) ON DELETE SET NULL,
  tanggal         date,
  jam             time,
  rute            text,
  kapasitas_kg    int,
  biaya_perjalanan numeric(14,2) NOT NULL DEFAULT 0 CHECK (biaya_perjalanan >= 0),
  status          text NOT NULL DEFAULT 'Draft'
    CHECK (status IN ('Draft','Menunggu','Siap Berangkat','Dalam Perjalanan','Selesai','Dibatalkan')),
  catatan         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Batch line items (which shipments belong to a batch) ──────────────────────
CREATE TABLE transport_shipment_batch_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  batch_id       uuid NOT NULL REFERENCES transport_shipment_batches(id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES transport_transactions(id) ON DELETE CASCADE,
  muatan_kg      int,
  urutan         int NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (batch_id, transaction_id)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_shipment_batches_workspace  ON transport_shipment_batches (workspace_id);
CREATE INDEX idx_shipment_batches_vehicle    ON transport_shipment_batches (kendaraan_id);
CREATE INDEX idx_shipment_batches_driver     ON transport_shipment_batches (driver_id);
CREATE INDEX idx_shipment_batches_status     ON transport_shipment_batches (status);
CREATE INDEX idx_shipment_batches_tanggal    ON transport_shipment_batches (tanggal);
CREATE INDEX idx_batch_items_batch           ON transport_shipment_batch_items (batch_id);
CREATE INDEX idx_batch_items_transaction     ON transport_shipment_batch_items (transaction_id);

-- ── RLS (pattern: member = workspace membership, admin = platform admin) ───────
ALTER TABLE transport_shipment_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_shipment_batch_member ON transport_shipment_batches
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY transport_shipment_batch_admin ON transport_shipment_batches
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

ALTER TABLE transport_shipment_batch_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_shipment_batch_item_member ON transport_shipment_batch_items
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY transport_shipment_batch_item_admin ON transport_shipment_batch_items
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ── Grants: table-level privilege is the prerequisite that lets PostgREST
--     evaluate the RLS policies (see 20260801 grant-fix root-cause note).
--     GRANT is idempotent. ───────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE transport_shipment_batches        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE transport_shipment_batch_items    TO authenticated;
