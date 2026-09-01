-- Transport Trip Costs — TRANSPORT-COST-001
-- Per-trip / per-delivery operational expenses (BBM, tol, parkir, uang jalan, etc.)
-- that roll up into the transport financial ledger.
--
-- Depends on (already applied / Step 2):
--   workspaces(id), transport_vehicles(id), transport_drivers(id),
--   transport_transactions(id), transport_shipment_batches(id)

CREATE TYPE transport_cost_category_enum AS ENUM (
  'BBM','Tol','Parkir','Uang Jalan','Makan','Penginapan','Spare Part','Biaya Darurat','Lainnya'
);

CREATE TABLE transport_trip_costs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  batch_id      uuid REFERENCES transport_shipment_batches(id) ON DELETE SET NULL,
  transaction_id uuid REFERENCES transport_transactions(id) ON DELETE SET NULL,
  kendaraan_id  uuid REFERENCES transport_vehicles(id) ON DELETE SET NULL,
  driver_id     uuid REFERENCES transport_drivers(id) ON DELETE SET NULL,
  tanggal       date NOT NULL DEFAULT CURRENT_DATE,
  kategori      transport_cost_category_enum NOT NULL DEFAULT 'Lainnya',
  nominal       bigint NOT NULL CHECK (nominal >= 0),
  catatan       text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_trip_costs_workspace    ON transport_trip_costs (workspace_id);
CREATE INDEX idx_trip_costs_batch        ON transport_trip_costs (batch_id);
CREATE INDEX idx_trip_costs_transaction   ON transport_trip_costs (transaction_id);
CREATE INDEX idx_trip_costs_vehicle      ON transport_trip_costs (kendaraan_id);
CREATE INDEX idx_trip_costs_driver       ON transport_trip_costs (driver_id);
CREATE INDEX idx_trip_costs_tanggal      ON transport_trip_costs (tanggal);

ALTER TABLE transport_trip_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_trip_cost_member ON transport_trip_costs
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY transport_trip_cost_admin ON transport_trip_costs
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE transport_trip_costs TO authenticated;
