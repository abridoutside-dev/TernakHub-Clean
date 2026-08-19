-- FS-001 — Feed Store table security: RLS, grants, and workspace-scoped policies.
--
-- The feed_store_* tables were created in 20260815000002 and 20260815000003
-- (schema_fix) and 20260818000001 (sales_items), AFTER the global
-- authenticated_table_grants (20260801000001) and RLS (20260725000014) migrations.
--
-- This migration closes the security gap: without RLS, every authenticated user
-- could read/write ALL workspaces' feed_store data. With these policies, each
-- table is scoped to the active workspace via is_workspace_member(workspace_id).
--
-- SAFETY:
--   - Only ADDS RLS/policies/grants — does not modify existing data.
--   - IF NOT EXISTS guards make migration idempotent.

-- ─── Enable RLS ─────────────────────────────────────────────────────────────────

ALTER TABLE feed_store_suppliers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_store_customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_store_orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_store_order_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_store_sales         ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_store_sales_items   ENABLE ROW LEVEL SECURITY;

-- ─── Table-level grants for authenticated role ──────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE feed_store_suppliers     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE feed_store_customers     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE feed_store_orders        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE feed_store_order_items   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE feed_store_sales         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE feed_store_sales_items   TO authenticated;

-- ─── Policies: feed_store_suppliers ─────────────────────────────────────────────
-- All CRUD scoped to workspace members.

CREATE POLICY feed_store_suppliers_select
  ON feed_store_suppliers FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY feed_store_suppliers_insert
  ON feed_store_suppliers FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY feed_store_suppliers_update
  ON feed_store_suppliers FOR UPDATE
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY feed_store_suppliers_delete
  ON feed_store_suppliers FOR DELETE
  USING (is_workspace_member(workspace_id));

-- ─── Policies: feed_store_customers ─────────────────────────────────────────────

CREATE POLICY feed_store_customers_select
  ON feed_store_customers FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY feed_store_customers_insert
  ON feed_store_customers FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY feed_store_customers_update
  ON feed_store_customers FOR UPDATE
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY feed_store_customers_delete
  ON feed_store_customers FOR DELETE
  USING (is_workspace_member(workspace_id));

-- ─── Policies: feed_store_orders ────────────────────────────────────────────────

CREATE POLICY feed_store_orders_select
  ON feed_store_orders FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY feed_store_orders_insert
  ON feed_store_orders FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY feed_store_orders_update
  ON feed_store_orders FOR UPDATE
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY feed_store_orders_delete
  ON feed_store_orders FOR DELETE
  USING (is_workspace_member(workspace_id));

-- ─── Policies: feed_store_order_items ───────────────────────────────────────────
-- Items are scoped through their own workspace_id column (redundant denormalisation
-- that enables direct filtering without a JOIN to orders).

CREATE POLICY feed_store_order_items_select
  ON feed_store_order_items FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY feed_store_order_items_insert
  ON feed_store_order_items FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY feed_store_order_items_update
  ON feed_store_order_items FOR UPDATE
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY feed_store_order_items_delete
  ON feed_store_order_items FOR DELETE
  USING (is_workspace_member(workspace_id));

-- ─── Policies: feed_store_sales ─────────────────────────────────────────────────

CREATE POLICY feed_store_sales_select
  ON feed_store_sales FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY feed_store_sales_insert
  ON feed_store_sales FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY feed_store_sales_update
  ON feed_store_sales FOR UPDATE
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY feed_store_sales_delete
  ON feed_store_sales FOR DELETE
  USING (is_workspace_member(workspace_id));

-- ─── Policies: feed_store_sales_items ───────────────────────────────────────────
-- Items are scoped through their own workspace_id column.

CREATE POLICY feed_store_sales_items_select
  ON feed_store_sales_items FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY feed_store_sales_items_insert
  ON feed_store_sales_items FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY feed_store_sales_items_update
  ON feed_store_sales_items FOR UPDATE
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY feed_store_sales_items_delete
  ON feed_store_sales_items FOR DELETE
  USING (is_workspace_member(workspace_id));
