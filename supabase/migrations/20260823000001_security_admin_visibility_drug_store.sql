-- SECURITY-ARCH-005 — Admin Visibility for DrugStore Tables
--
-- Adds admin RLS policies for all DrugStore workspace tables so that
-- platform administrators can perform cross-workspace observability
-- and management via the Admin Dashboard.
--
-- Non-admin RLS remains workspace-scoped and unchanged.
-- This migration is idempotent: DROP POLICY IF EXISTS + CREATE POLICY.

-- ─── Drug Store Suppliers ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS drug_store_suppliers_admin ON drug_store_suppliers;

CREATE POLICY drug_store_suppliers_admin ON drug_store_suppliers
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ─── Drug Store Customers ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS drug_store_customers_admin ON drug_store_customers;

CREATE POLICY drug_store_customers_admin ON drug_store_customers
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ─── Drug Store Orders ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS drug_store_orders_admin ON drug_store_orders;

CREATE POLICY drug_store_orders_admin ON drug_store_orders
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ─── Drug Store Order Items ────────────────────────────────────────────────────

DROP POLICY IF EXISTS drug_store_order_items_admin ON drug_store_order_items;

CREATE POLICY drug_store_order_items_admin ON drug_store_order_items
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ─── Drug Store Sales ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS drug_store_sales_admin ON drug_store_sales;

CREATE POLICY drug_store_sales_admin ON drug_store_sales
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ─── Drug Store Sales Items ────────────────────────────────────────────────────

DROP POLICY IF EXISTS drug_store_sales_items_admin ON drug_store_sales_items;

CREATE POLICY drug_store_sales_items_admin ON drug_store_sales_items
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());
