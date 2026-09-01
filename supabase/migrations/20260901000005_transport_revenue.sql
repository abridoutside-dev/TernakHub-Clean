-- Transport Revenue — TRANSPORT-REVENUE-001
-- Explicit revenue ledger. Source of truth for transport revenue = this table.
-- transport_transactions.fee is the agreed tariff (reference only) and is NOT
-- summed into financial revenue, so there is no double counting. A revenue row
-- is recorded (manually or derived from a delivery fee) per delivery.
--
-- Depends on (already applied): workspaces(id), transport_transactions(id).

CREATE TYPE transport_revenue_type_enum AS ENUM (
  'Delivery Fee','Insentif Penjemputan','Lainnya'
);

CREATE TYPE transport_revenue_status_enum AS ENUM (
  'Pending','Received','Failed'
);

CREATE TABLE transport_revenue (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES transport_transactions(id) ON DELETE CASCADE,
  jenis          transport_revenue_type_enum NOT NULL DEFAULT 'Delivery Fee',
  nominal        bigint NOT NULL CHECK (nominal >= 0),
  tanggal        date NOT NULL DEFAULT CURRENT_DATE,
  status         transport_revenue_status_enum NOT NULL DEFAULT 'Pending',
  catatan        text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, transaction_id)
);

CREATE INDEX idx_revenue_workspace    ON transport_revenue (workspace_id);
CREATE INDEX idx_revenue_transaction  ON transport_revenue (transaction_id);
CREATE INDEX idx_revenue_status       ON transport_revenue (status);

ALTER TABLE transport_revenue ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_revenue_member ON transport_revenue
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY transport_revenue_admin ON transport_revenue
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE transport_revenue TO authenticated;
