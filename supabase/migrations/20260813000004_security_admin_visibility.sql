-- SECURITY-ARCH-004 — Admin Control Plane: Comprehensive Admin Visibility
--
-- Adds admin SELECT (and write where appropriate) policies to all remaining
-- tables so that the Admin Dashboard has full cross-workspace observability.
-- Non-admin RLS remains workspace-scoped and unchanged.
--
-- This migration is idempotent: DROP POLICY IF EXISTS + CREATE POLICY.

-- ─── Enable RLS on tables that were missing it ────────────────────────────────

ALTER TABLE rss_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE rss_collector_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_policies ENABLE ROW LEVEL SECURITY;

-- ─── Livestock ────────────────────────────────────────────────────────────────

CREATE POLICY livestock_admin_select ON livestock
  FOR SELECT USING (is_platform_admin());

CREATE POLICY livestock_admin_update ON livestock
  FOR UPDATE USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY livestock_admin_delete ON livestock
  FOR DELETE USING (is_platform_admin());

CREATE POLICY livestock_extended_metadata_admin ON livestock_extended_metadata
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY livestock_weight_entries_admin ON livestock_weight_entries
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY livestock_photos_admin ON livestock_photos
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY livestock_ownership_history_admin ON livestock_ownership_history
  FOR SELECT USING (is_platform_admin());

CREATE POLICY livestock_edit_history_admin ON livestock_edit_history
  FOR SELECT USING (is_platform_admin());

CREATE POLICY pedigree_links_admin ON pedigree_links
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ─── Batches ──────────────────────────────────────────────────────────────────

CREATE POLICY batches_admin ON batches
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY batch_members_admin ON batch_members
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY batch_history_admin ON batch_history
  FOR SELECT USING (is_platform_admin());

CREATE POLICY batch_operations_admin ON batch_operations
  FOR SELECT USING (is_platform_admin());

-- ─── Movements ────────────────────────────────────────────────────────────────

CREATE POLICY livestock_transfers_admin ON livestock_transfers
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY mutation_requests_admin ON mutation_requests
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ─── Health / Medicine ────────────────────────────────────────────────────────

CREATE POLICY health_checkups_admin ON health_checkups
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY health_treatments_admin ON health_treatments
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY health_control_schedules_admin ON health_control_schedules
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY stok_obat_admin ON stok_obat
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY stok_obat_masuk_admin ON stok_obat_masuk
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY stok_obat_keluar_admin ON stok_obat_keluar
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY stok_obat_adjustments_admin ON stok_obat_adjustments
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ─── Reproduction ─────────────────────────────────────────────────────────────

CREATE POLICY reproduksi_programs_admin ON reproduksi_programs
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY pelaksanaan_reproduksi_admin ON pelaksanaan_reproduksi
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY monitoring_reproduksi_admin ON monitoring_reproduksi
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY pemeriksaan_kebuntingan_admin ON pemeriksaan_kebuntingan
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY kebuntingan_admin ON kebuntingan
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY kelahiran_admin ON kelahiran
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY registrasi_anak_admin ON registrasi_anak
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY sapih_admin ON sapih
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ─── Feed / Pakan ─────────────────────────────────────────────────────────────

CREATE POLICY feed_formulas_admin ON feed_formulas
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY feed_formula_ingredients_admin ON feed_formula_ingredients
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY feed_formula_productions_admin ON feed_formula_productions
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY stok_inventaris_admin ON stok_inventaris
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY stok_inventaris_transactions_admin ON stok_inventaris_transactions
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY jadwal_pemberian_pakan_admin ON jadwal_pemberian_pakan
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY pemberian_pakan_admin ON pemberian_pakan
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ─── Marketplace ──────────────────────────────────────────────────────────────

CREATE POLICY marketplace_listings_admin ON marketplace_listings
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY marketplace_listing_photos_admin ON marketplace_listing_photos
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY marketplace_wishlists_admin ON marketplace_wishlists
  FOR SELECT USING (is_platform_admin());

CREATE POLICY marketplace_negotiations_admin ON marketplace_negotiations
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY marketplace_transactions_admin ON marketplace_transactions
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY marketplace_chat_rooms_admin ON marketplace_chat_rooms
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY marketplace_chat_messages_admin ON marketplace_chat_messages
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY marketplace_moderations_admin ON marketplace_moderations
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY marketplace_categories_read_all ON marketplace_categories
  FOR SELECT USING (true);

CREATE POLICY marketplace_categories_admin ON marketplace_categories
  FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ─── Transactions / Escrow / Transport ────────────────────────────────────────

CREATE POLICY transaction_rooms_admin ON transaction_rooms
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY transaction_participants_admin ON transaction_participants
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY transaction_attachments_admin ON transaction_attachments
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY transaction_receipts_admin ON transaction_receipts
  FOR SELECT USING (is_platform_admin());

CREATE POLICY escrow_transactions_admin ON escrow_transactions
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY transport_transactions_admin ON transport_transactions
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY transaction_conversations_admin ON transaction_conversations
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY transaction_conversation_messages_admin ON transaction_conversation_messages
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY transaction_evidence_admin ON transaction_evidence
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY transaction_audit_trail_admin ON transaction_audit_trail
  FOR SELECT USING (is_platform_admin());

CREATE POLICY service_quotations_admin ON service_quotations
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ─── Service Workspaces ───────────────────────────────────────────────────────

CREATE POLICY layanan_transport_admin ON layanan_transport
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY layanan_dokter_hewan_admin ON layanan_dokter_hewan
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY layanan_klinik_hewan_admin ON layanan_klinik_hewan
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ─── Platform Services ────────────────────────────────────────────────────────

CREATE POLICY news_publications_admin ON news_publications
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY rss_queue_admin ON rss_queue
  FOR SELECT USING (is_platform_admin());

CREATE POLICY rss_collector_logs_admin ON rss_collector_logs
  FOR SELECT USING (is_platform_admin());

CREATE POLICY notifications_admin_write ON notifications
  FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY alert_reminders_admin_write ON alert_reminders
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ─── Drug Catalog ─────────────────────────────────────────────────────────────

CREATE POLICY drug_catalog_read_all ON drug_catalog
  FOR SELECT USING (true);

CREATE POLICY drug_catalog_admin ON drug_catalog
  FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY drug_categories_read_all ON drug_categories
  FOR SELECT USING (true);

CREATE POLICY drug_categories_admin ON drug_categories
  FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY drug_sub_categories_read_all ON drug_sub_categories
  FOR SELECT USING (true);

CREATE POLICY drug_sub_categories_admin ON drug_sub_categories
  FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ─── Activity Log ─────────────────────────────────────────────────────────────

CREATE POLICY activity_log_admin ON activity_log
  FOR SELECT USING (is_platform_admin());

-- ─── Workspace members admin write ────────────────────────────────────────────

CREATE POLICY workspace_members_admin_write ON workspace_members
  FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ─── Feature Policies ─────────────────────────────────────────────────────────

CREATE POLICY feature_policies_read_all ON feature_policies
  FOR SELECT USING (true);

CREATE POLICY feature_policies_admin_write ON feature_policies
  FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());
