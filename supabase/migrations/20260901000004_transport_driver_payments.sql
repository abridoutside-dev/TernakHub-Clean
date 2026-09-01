-- Transport Driver Payments — TRANSPORT-DRIVER-PAY-001
-- Records driver compensation (gaji, uang jalan, insentif, overtime, bonus,
-- potongan) per period or per trip/batch. All payments feed the financial ledger.
--
-- Depends on (already applied / Step 2-4):
--   workspaces(id), transport_drivers(id),
--   transport_transactions(id) [nullable], transport_shipment_batches(id) [nullable]

CREATE TYPE transport_driver_payment_type_enum AS ENUM (
  'Gaji','Uang Jalan','Insentif','Overtime','Bonus','Potongan','Lainnya'
);

CREATE TYPE transport_driver_payment_status_enum AS ENUM (
  'Belum Dibayar','Lunas','Dibatalkan'
);

CREATE TABLE transport_driver_payments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  driver_id     uuid NOT NULL REFERENCES transport_drivers(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES transport_transactions(id) ON DELETE SET NULL,
  batch_id      uuid REFERENCES transport_shipment_batches(id) ON DELETE SET NULL,
  periode       date NOT NULL,
  tanggal       date NOT NULL DEFAULT CURRENT_DATE,
  jenis         transport_driver_payment_type_enum NOT NULL DEFAULT 'Gaji',
  nominal       bigint NOT NULL CHECK (nominal >= 0),
  status        transport_driver_payment_status_enum NOT NULL DEFAULT 'Belum Dibayar',
  catatan       text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_driver_payments_workspace  ON transport_driver_payments (workspace_id);
CREATE INDEX idx_driver_payments_driver     ON transport_driver_payments (driver_id);
CREATE INDEX idx_driver_payments_transaction  ON transport_driver_payments (transaction_id);
CREATE INDEX idx_driver_payments_batch      ON transport_driver_payments (batch_id);
CREATE INDEX idx_driver_payments_periode    ON transport_driver_payments (periode);

ALTER TABLE transport_driver_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_driver_payment_member ON transport_driver_payments
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY transport_driver_payment_admin ON transport_driver_payments
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE transport_driver_payments TO authenticated;
