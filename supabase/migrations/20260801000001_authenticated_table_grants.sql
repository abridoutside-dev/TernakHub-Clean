-- DB-001A / GRANT FIX — Table-level grants for authenticated role.
--
-- Root cause (same as 20260728000004):
--   20260725000001_extensions.sql grants USAGE ON SCHEMA public to anon /
--   authenticated but does NOT use ALTER DEFAULT PRIVILEGES.  As a result,
--   every table created after that migration needs an explicit GRANT before
--   Supabase/PostgREST can even attempt to evaluate RLS policies.
--
--   20260728000004 fixed marketplace_listings and news_publications (public
--   read).  This migration fixes every workspace-scoped table that was missed.
--
-- Symptom:
--   "permission denied for table livestock"  (Dashboard)
--   "permission denied for table batches"    (Livestock page)
--   (and the same silent failure on any other table first touched after login)
--
-- Fix:
--   Grant SELECT / INSERT / UPDATE / DELETE to authenticated on all
--   application tables.  RLS policies (already in place) enforce the actual
--   row-level access rules — the table-level grant is only the prerequisite
--   that allows PostgREST to submit the query to the RLS evaluator.
--
-- Notes:
--   - GRANT is idempotent for roles that already have the privilege.
--   - Tables already covered by earlier migrations are re-listed here for
--     completeness; re-granting is a no-op and does not break anything.
--   - anon SELECT is granted only for tables with existing public-read RLS
--     policies (marketplace_listings, news_publications, global_reference,
--     data_master).  All other tables are authenticated-only.

-- ─── Core workspace / membership tables ──────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE workspaces               TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE workspace_members        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE workspace_invitations    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE workspace_relationships  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE workspace_subscriptions  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ownership_transfers      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_profiles            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE workspace_custom_roles   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE feature_policies         TO authenticated;

-- ─── Livestock / batches ───────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE livestock                       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE livestock_extended_metadata     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE livestock_weight_entries        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE livestock_photos                TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE livestock_ownership_history     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE livestock_edit_history          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE pedigree_links                  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE batches                         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE batch_members                   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE batch_history                   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE batch_operations                TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE livestock_transfers             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE mutation_requests               TO authenticated;

-- ─── Health / medicine ─────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE health_checkups             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE health_treatments           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE health_control_schedules    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE stok_obat                   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE stok_obat_masuk             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE stok_obat_keluar            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE stok_obat_adjustments       TO authenticated;

-- ─── Reproduction ──────────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE reproduksi_programs         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE pelaksanaan_reproduksi      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE monitoring_reproduksi       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE pemeriksaan_kebuntingan     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE kebuntingan                 TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE kelahiran                   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE registrasi_anak             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE sapih                       TO authenticated;

-- ─── Feed / pakan ──────────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE feed_formulas                    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE feed_formula_ingredients         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE feed_formula_productions         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE stok_inventaris                  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE stok_inventaris_transactions     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jadwal_pemberian_pakan           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE pemberian_pakan                  TO authenticated;

-- ─── Marketplace ───────────────────────────────────────────────────────────────
-- SELECT for anon already granted in 20260728000004; re-grant is idempotent.
GRANT SELECT ON TABLE marketplace_listings         TO anon;
GRANT SELECT ON TABLE marketplace_listing_photos   TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE marketplace_listings         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE marketplace_listing_photos   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE marketplace_wishlists        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE marketplace_negotiations     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE marketplace_transactions     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE marketplace_chat_rooms       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE marketplace_chat_messages    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE marketplace_moderations      TO authenticated;

-- ─── Transactions / escrow / transport ─────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE transaction_rooms                    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE transaction_participants             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE transaction_attachments              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE transaction_receipts                 TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE escrow_transactions                  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE transport_transactions               TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE transaction_conversations            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE transaction_conversation_messages    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE transaction_evidence                 TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE transaction_audit_trail              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE escrow_accounts                      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE service_quotations                   TO authenticated;

-- ─── Service workspaces ────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE layanan_transport      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE layanan_dokter_hewan   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE layanan_klinik_hewan   TO authenticated;

-- ─── News / notifications / alerts ────────────────────────────────────────────
-- SELECT for anon already granted in 20260728000004; re-grant is idempotent.
GRANT SELECT ON TABLE news_publications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE news_publications  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE rss_sources        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE rss_collector_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE rss_queue          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE notifications      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE alert_reminders    TO authenticated;

-- ─── Trust & verification ──────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE trust_verifications         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE trust_verification_evidence TO authenticated;

-- ─── Media / AI / audit ────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE media             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ai_insights       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE global_audit_trail TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE search_index      TO authenticated;

-- ─── Platform / admin tables ───────────────────────────────────────────────────
-- platform_config: already granted in 20260728000002; re-grant is idempotent.
GRANT SELECT ON TABLE platform_config TO anon, authenticated;
-- global_reference / data_master: already granted in 20260728000004.
GRANT SELECT ON TABLE global_reference    TO anon, authenticated;
GRANT SELECT ON TABLE data_master         TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE subscription_plans    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE backup_records        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE admin_announcements   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE system_logs           TO authenticated;
