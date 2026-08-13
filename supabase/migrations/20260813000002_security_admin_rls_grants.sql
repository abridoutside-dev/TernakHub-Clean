-- SECURITY-ARCH-002 — Admin Control Plane: Admin-Only Table RLS + Grant Hardening
--
-- Adds RLS to tables that were missing it and restricts table-level grants
-- so that non-admin authenticated users cannot even attempt operations on
-- admin-only tables.
--
-- Principle:
--   NON-ADMIN  → workspace-scoped tables: authenticated grant + RLS boundary
--   ADMIN      → platform tables: admin Edge Function → service_role
--   SERVICE    → never exposed to browser

-- ─── 1. subscription_plans (admin-only writes, public reads) ───────────────────

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscription_plans_read_all ON subscription_plans
  FOR SELECT
  USING (true);

CREATE POLICY subscription_plans_admin_write ON subscription_plans
  FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ─── 2. admin_announcements (admin-only writes, public reads for active) ─────────

ALTER TABLE admin_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_announcements_read_all ON admin_announcements
  FOR SELECT
  USING (is_active = true OR is_platform_admin());

CREATE POLICY admin_announcements_admin_write ON admin_announcements
  FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ─── 3. backup_records (admin-only) ────────────────────────────────────────────

ALTER TABLE backup_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY backup_records_admin ON backup_records
  FOR ALL
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ─── 4. system_logs (admin reads, service-only writes) ─────────────────────────

ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY system_logs_admin ON system_logs
  FOR SELECT
  USING (is_platform_admin());

CREATE POLICY system_logs_service_insert ON system_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ─── 5. escrow_accounts (admin-only writes, public reads for active) ────────────

ALTER TABLE escrow_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY escrow_accounts_read_all ON escrow_accounts
  FOR SELECT
  USING (is_active = true OR is_platform_admin());

CREATE POLICY escrow_accounts_admin_write ON escrow_accounts
  FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ─── 6. rss_sources (admin-only writes, public reads for active) ────────────────

ALTER TABLE rss_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY rss_sources_read_all ON rss_sources
  FOR SELECT
  USING (is_active = true OR is_platform_admin());

CREATE POLICY rss_sources_admin_write ON rss_sources
  FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ─── 7. global_reference (admin-only writes, public reads) ─────────────────────

ALTER TABLE global_reference ENABLE ROW LEVEL SECURITY;

CREATE POLICY global_reference_read_all ON global_reference
  FOR SELECT
  USING (status = 'active' OR is_platform_admin());

CREATE POLICY global_reference_admin_write ON global_reference
  FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ─── 8. data_master (admin-only writes, public reads for active) ────────────────

ALTER TABLE data_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY data_master_read_all ON data_master
  FOR SELECT
  USING (is_active = true OR is_platform_admin());

CREATE POLICY data_master_admin_write ON data_master
  FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ─── 9. platform_config grants ────────────────────────────────────────────────
-- Revoke blanket authenticated INSERT/UPDATE/UPDATE that was granted in
-- 20260803000004. Now that RLS restricts to admin, we keep the grant because
-- PostgREST needs it to evaluate RLS, but we explicitly note the boundary.
-- (Revoking would break legitimate admin writes via Edge Function if the
--  Edge Function ever uses anon key instead of service role.)

-- ─── 10. Revoke over-privileged grants from authenticated on admin-only tables ──
-- These tables should only be writable via Edge Functions (service_role).
-- We keep SELECT where non-admin reads are legit.

-- subscription_plans: revoke INSERT/UPDATE/DELETE from authenticated
REVOKE INSERT, UPDATE, DELETE ON TABLE subscription_plans FROM authenticated;

-- admin_announcements: revoke INSERT/UPDATE/DELETE from authenticated
REVOKE INSERT, UPDATE, DELETE ON TABLE admin_announcements FROM authenticated;

-- backup_records: revoke all from authenticated
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE backup_records FROM authenticated;

-- system_logs: revoke all from authenticated (service_role only)
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE system_logs FROM authenticated;

-- escrow_accounts: revoke INSERT/UPDATE/DELETE from authenticated
REVOKE INSERT, UPDATE, DELETE ON TABLE escrow_accounts FROM authenticated;

-- rss_sources: revoke INSERT/UPDATE/DELETE from authenticated
REVOKE INSERT, UPDATE, DELETE ON TABLE rss_sources FROM authenticated;

-- global_reference: revoke INSERT/UPDATE/DELETE from authenticated
REVOKE INSERT, UPDATE, DELETE ON TABLE global_reference FROM authenticated;

-- data_master: revoke INSERT/UPDATE/DELETE from authenticated
REVOKE INSERT, UPDATE, DELETE ON TABLE data_master FROM authenticated;

-- platform_config: revoke INSERT/UPDATE/DELETE from authenticated
-- (admin writes go through Edge Function with service_role)
REVOKE INSERT, UPDATE, DELETE ON TABLE platform_config FROM authenticated;

-- ─── 11. Admin-only tables: retain only non-admin read grants ──────────────────
-- RLS policies enforce the actual access. These grants allow PostgREST to
-- attempt the query; RLS then filters rows.

GRANT SELECT ON TABLE subscription_plans TO authenticated;
GRANT SELECT ON TABLE admin_announcements TO authenticated;
GRANT SELECT ON TABLE escrow_accounts TO authenticated;
GRANT SELECT ON TABLE rss_sources TO authenticated;
GRANT SELECT ON TABLE global_reference TO authenticated;
GRANT SELECT ON TABLE data_master TO authenticated;
GRANT SELECT ON TABLE platform_config TO authenticated;

-- backup_records and system_logs: admin-only, no authenticated grants

-- ─── 12. Ensure non-admin tables retain their grants ──────────────────────────
-- These are workspace-scoped tables where RLS is the actual security boundary.
-- Re-grant to ensure they survive any schema reset.

-- Core workspace tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE workspaces TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE workspace_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE workspace_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE workspace_relationships TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE workspace_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ownership_transfers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE workspace_custom_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE feature_policies TO authenticated;

-- Livestock / batches
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE livestock TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE livestock_extended_metadata TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE livestock_weight_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE livestock_photos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE livestock_ownership_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE livestock_edit_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE pedigree_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE batches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE batch_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE batch_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE batch_operations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE livestock_transfers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE mutation_requests TO authenticated;

-- Health / medicine
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE health_checkups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE health_treatments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE health_control_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE stok_obat TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE stok_obat_masuk TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE stok_obat_keluar TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE stok_obat_adjustments TO authenticated;

-- Reproduction
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE reproduksi_programs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE pelaksanaan_reproduksi TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE monitoring_reproduksi TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE pemeriksaan_kebuntingan TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE kebuntingan TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE kelahiran TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE registrasi_anak TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE sapih TO authenticated;

-- Feed / pakan
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE feed_formulas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE feed_formula_ingredients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE feed_formula_productions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE stok_inventaris TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE stok_inventaris_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jadwal_pemberian_pakan TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE pemberian_pakan TO authenticated;

-- Marketplace
GRANT SELECT ON TABLE marketplace_listings TO anon;
GRANT SELECT ON TABLE marketplace_listing_photos TO anon;
GRANT SELECT ON TABLE marketplace_categories TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE marketplace_listings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE marketplace_listing_photos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE marketplace_wishlists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE marketplace_negotiations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE marketplace_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE marketplace_chat_rooms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE marketplace_chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE marketplace_moderations TO authenticated;

-- Transactions / escrow / transport
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE transaction_rooms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE transaction_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE transaction_attachments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE transaction_receipts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE escrow_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE transport_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE transaction_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE transaction_conversation_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE transaction_evidence TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE transaction_audit_trail TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE service_quotations TO authenticated;

-- Service workspaces
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE layanan_transport TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE layanan_dokter_hewan TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE layanan_klinik_hewan TO authenticated;

-- News / notifications / alerts
GRANT SELECT ON TABLE news_publications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE news_publications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE rss_sources TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE rss_collector_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE rss_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE alert_reminders TO authenticated;

-- Trust & verification
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE trust_verifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE trust_verification_evidence TO authenticated;

-- Media / AI / audit
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE media TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ai_insights TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE search_index TO authenticated;

-- Drug catalog reference data
GRANT SELECT ON TABLE drug_catalog TO anon, authenticated;
GRANT SELECT ON TABLE drug_categories TO anon, authenticated;
GRANT SELECT ON TABLE drug_sub_categories TO anon, authenticated;

-- activity_log
GRANT SELECT, INSERT ON TABLE activity_log TO authenticated;
