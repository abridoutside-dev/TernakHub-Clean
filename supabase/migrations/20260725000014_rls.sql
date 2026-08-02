-- DB-001A / 014 — Row-level security.
-- All application tables are protected. Service-role calls bypass RLS in
-- Supabase; client policies below are intentionally workspace-scoped.

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE ownership_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE livestock ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE livestock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_checkups ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_control_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE stok_obat ENABLE ROW LEVEL SECURITY;
ALTER TABLE stok_obat_masuk ENABLE ROW LEVEL SECURITY;
ALTER TABLE stok_obat_keluar ENABLE ROW LEVEL SECURITY;
ALTER TABLE stok_obat_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reproduksi_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pelaksanaan_reproduksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_reproduksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE pemeriksaan_kebuntingan ENABLE ROW LEVEL SECURITY;
ALTER TABLE kebuntingan ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelahiran ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrasi_anak ENABLE ROW LEVEL SECURITY;
ALTER TABLE sapih ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_formula_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_formula_productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stok_inventaris ENABLE ROW LEVEL SECURITY;
ALTER TABLE stok_inventaris_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jadwal_pemberian_pakan ENABLE ROW LEVEL SECURITY;
ALTER TABLE pemberian_pakan ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listing_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_moderations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE layanan_transport ENABLE ROW LEVEL SECURITY;
ALTER TABLE layanan_dokter_hewan ENABLE ROW LEVEL SECURITY;
ALTER TABLE layanan_klinik_hewan ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_verification_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_profiles_select_own ON user_profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY user_profiles_update_own ON user_profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY user_profiles_insert_own ON user_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY workspaces_select_members ON workspaces
  FOR SELECT USING (
    verification_status = 'Verified'
    OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspaces.id
        AND wm.user_id = auth.uid()
        AND wm.status = 'Aktif'
    )
  );
CREATE POLICY workspaces_insert_owner ON workspaces
  FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY workspaces_update_admin ON workspaces
  FOR UPDATE USING (is_workspace_member(id, ARRAY['Owner', 'Admin']))
  WITH CHECK (is_workspace_member(id, ARRAY['Owner', 'Admin']));

CREATE POLICY workspace_members_select_member ON workspace_members
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY workspace_members_manage_admin ON workspace_members
  FOR ALL USING (is_workspace_member(workspace_id, ARRAY['Owner', 'Admin']))
  WITH CHECK (is_workspace_member(workspace_id, ARRAY['Owner', 'Admin']));

CREATE POLICY workspace_invitations_manage_admin ON workspace_invitations
  FOR ALL USING (is_workspace_member(workspace_id, ARRAY['Owner', 'Admin']))
  WITH CHECK (is_workspace_member(workspace_id, ARRAY['Owner', 'Admin']));
CREATE POLICY workspace_relationships_member ON workspace_relationships
  FOR ALL USING (
    is_workspace_member(workspace_id_a) OR is_workspace_member(workspace_id_b)
  ) WITH CHECK (
    is_workspace_member(workspace_id_a) OR is_workspace_member(workspace_id_b)
  );
CREATE POLICY ownership_transfers_member ON ownership_transfers
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY workspace_subscriptions_member ON workspace_subscriptions
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY livestock_select_workspace ON livestock
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY livestock_write_staff ON livestock
  FOR ALL USING (is_workspace_member(workspace_id, ARRAY['Owner', 'Admin', 'Staff']))
  WITH CHECK (is_workspace_member(workspace_id, ARRAY['Owner', 'Admin', 'Staff']));

CREATE POLICY batches_workspace_member ON batches
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY batch_members_workspace_member ON batch_members
  FOR ALL USING (EXISTS (
    SELECT 1 FROM batches b WHERE b.id = batch_id AND is_workspace_member(b.workspace_id)
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM batches b WHERE b.id = batch_id AND is_workspace_member(b.workspace_id)
  ));
CREATE POLICY batch_history_workspace_member ON batch_history
  FOR ALL USING (EXISTS (
    SELECT 1 FROM batches b WHERE b.id = batch_id AND is_workspace_member(b.workspace_id)
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM batches b WHERE b.id = batch_id AND is_workspace_member(b.workspace_id)
  ));
CREATE POLICY batch_operations_workspace_member ON batch_operations
  FOR ALL USING (EXISTS (
    SELECT 1 FROM batches b WHERE b.id = batch_id AND is_workspace_member(b.workspace_id)
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM batches b WHERE b.id = batch_id AND is_workspace_member(b.workspace_id)
  ));

CREATE POLICY livestock_transfer_workspace_member ON livestock_transfers
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY mutation_request_workspace_member ON mutation_requests
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY health_checkups_workspace_member ON health_checkups
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY health_treatments_workspace_member ON health_treatments
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY health_schedules_workspace_member ON health_control_schedules
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY medicine_stock_workspace_member ON stok_obat
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY medicine_stock_in_workspace_member ON stok_obat_masuk
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY medicine_stock_out_workspace_member ON stok_obat_keluar
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY medicine_stock_adjust_workspace_member ON stok_obat_adjustments
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY reproduction_program_workspace_member ON reproduksi_programs
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY reproduction_execution_workspace_member ON pelaksanaan_reproduksi
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY reproduction_monitoring_workspace_member ON monitoring_reproduksi
  FOR ALL USING (EXISTS (
    SELECT 1 FROM reproduksi_programs rp
    WHERE rp.id = program_id AND is_workspace_member(rp.workspace_id)
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM reproduksi_programs rp
    WHERE rp.id = program_id AND is_workspace_member(rp.workspace_id)
  ));
CREATE POLICY pregnancy_exam_workspace_member ON pemeriksaan_kebuntingan
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY pregnancy_workspace_member ON kebuntingan
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY birth_workspace_member ON kelahiran
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY child_registration_workspace_member ON registrasi_anak
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY weaning_workspace_member ON sapih
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY formula_workspace_member ON feed_formulas
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY formula_ingredients_workspace_member ON feed_formula_ingredients
  FOR ALL USING (EXISTS (
    SELECT 1 FROM feed_formulas f
    WHERE f.id = formula_id AND is_workspace_member(f.workspace_id)
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM feed_formulas f
    WHERE f.id = formula_id AND is_workspace_member(f.workspace_id)
  ));
CREATE POLICY formula_productions_workspace_member ON feed_formula_productions
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY feed_inventory_workspace_member ON stok_inventaris
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY feed_inventory_transactions_workspace_member ON stok_inventaris_transactions
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY feed_schedule_workspace_member ON jadwal_pemberian_pakan
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY feed_record_workspace_member ON pemberian_pakan
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY listings_select_public ON marketplace_listings
  FOR SELECT USING (
    status = 'Aktif' OR is_workspace_member(workspace_id)
  );
CREATE POLICY listings_write_owner ON marketplace_listings
  FOR ALL USING (is_workspace_member(workspace_id, ARRAY['Owner', 'Admin', 'Staff']))
  WITH CHECK (is_workspace_member(workspace_id, ARRAY['Owner', 'Admin', 'Staff']));
CREATE POLICY listing_photos_member ON marketplace_listing_photos
  FOR ALL USING (EXISTS (
    SELECT 1 FROM marketplace_listings ml
    WHERE ml.id = listing_id AND is_workspace_member(ml.workspace_id)
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM marketplace_listings ml
    WHERE ml.id = listing_id AND is_workspace_member(ml.workspace_id)
  ));
CREATE POLICY wishlist_owner ON marketplace_wishlists
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY marketplace_negotiation_member ON marketplace_negotiations
  FOR ALL USING (
    is_workspace_member(buyer_workspace_id) OR is_workspace_member(seller_workspace_id)
  ) WITH CHECK (
    is_workspace_member(buyer_workspace_id) OR is_workspace_member(seller_workspace_id)
  );
CREATE POLICY marketplace_transaction_member ON marketplace_transactions
  FOR ALL USING (
    is_workspace_member(buyer_workspace_id) OR is_workspace_member(seller_workspace_id)
  ) WITH CHECK (
    is_workspace_member(buyer_workspace_id) OR is_workspace_member(seller_workspace_id)
  );
CREATE POLICY marketplace_chat_room_member ON marketplace_chat_rooms
  FOR ALL USING (
    is_workspace_member(buyer_workspace_id) OR is_workspace_member(seller_workspace_id)
  ) WITH CHECK (
    is_workspace_member(buyer_workspace_id) OR is_workspace_member(seller_workspace_id)
  );
CREATE POLICY chat_messages_participants ON marketplace_chat_messages
  FOR ALL USING (EXISTS (
    SELECT 1 FROM marketplace_chat_rooms cr
    WHERE cr.id = room_id
      AND (is_workspace_member(cr.buyer_workspace_id) OR is_workspace_member(cr.seller_workspace_id))
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM marketplace_chat_rooms cr
    WHERE cr.id = room_id
      AND is_workspace_member(sender_workspace_id)
  ));
CREATE POLICY marketplace_moderation_member ON marketplace_moderations
  FOR ALL USING (
    reported_by_workspace_id IS NULL OR is_workspace_member(reported_by_workspace_id)
  ) WITH CHECK (
    reported_by_workspace_id IS NULL OR is_workspace_member(reported_by_workspace_id)
  );

CREATE POLICY transaction_room_participants ON transaction_rooms
  FOR ALL USING (
    is_workspace_member(buyer_workspace_id) OR is_workspace_member(seller_workspace_id)
    OR EXISTS (
      SELECT 1 FROM transaction_participants tp
      WHERE tp.room_id = transaction_rooms.id AND is_workspace_member(tp.workspace_id)
    )
  ) WITH CHECK (
    is_workspace_member(buyer_workspace_id) OR is_workspace_member(seller_workspace_id)
  );
CREATE POLICY transaction_participants_member ON transaction_participants
  FOR ALL USING (
    is_workspace_member(workspace_id) OR EXISTS (
      SELECT 1 FROM transaction_rooms tr
      WHERE tr.id = room_id
        AND (is_workspace_member(tr.buyer_workspace_id) OR is_workspace_member(tr.seller_workspace_id))
    )
  ) WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY transaction_attachments_member ON transaction_attachments
  FOR ALL USING (EXISTS (
    SELECT 1 FROM transaction_rooms tr
    WHERE tr.id = room_id
      AND (is_workspace_member(tr.buyer_workspace_id) OR is_workspace_member(tr.seller_workspace_id))
  )) WITH CHECK (uploaded_by_workspace_id IS NULL OR is_workspace_member(uploaded_by_workspace_id));
CREATE POLICY transaction_receipts_member ON transaction_receipts
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM transaction_rooms tr
    WHERE tr.id = room_id
      AND (is_workspace_member(tr.buyer_workspace_id) OR is_workspace_member(tr.seller_workspace_id))
  ));
CREATE POLICY escrow_transaction_member ON escrow_transactions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM transaction_rooms tr
    WHERE tr.id = room_id
      AND (is_workspace_member(tr.buyer_workspace_id) OR is_workspace_member(tr.seller_workspace_id))
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM transaction_rooms tr
    WHERE tr.id = room_id
      AND (is_workspace_member(tr.buyer_workspace_id) OR is_workspace_member(tr.seller_workspace_id))
  ));
CREATE POLICY transport_transaction_member ON transport_transactions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM transaction_rooms tr
    WHERE tr.id = room_id
      AND (is_workspace_member(tr.buyer_workspace_id) OR is_workspace_member(tr.seller_workspace_id))
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM transaction_rooms tr
    WHERE tr.id = room_id
      AND (is_workspace_member(tr.buyer_workspace_id) OR is_workspace_member(tr.seller_workspace_id))
  ));
CREATE POLICY transaction_conversation_member ON transaction_conversations
  FOR ALL USING (EXISTS (
    SELECT 1 FROM transaction_rooms tr
    WHERE tr.id = room_id AND is_workspace_member(tr.buyer_workspace_id)
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM transaction_rooms tr
    WHERE tr.id = room_id AND is_workspace_member(tr.buyer_workspace_id)
  ));
CREATE POLICY transaction_conversation_messages_member ON transaction_conversation_messages
  FOR ALL USING (EXISTS (
    SELECT 1
    FROM transaction_conversations tc
    JOIN transaction_rooms tr ON tr.id = tc.room_id
    WHERE tc.id = conversation_id
      AND (is_workspace_member(tr.buyer_workspace_id) OR is_workspace_member(tr.seller_workspace_id))
  )) WITH CHECK (is_workspace_member(sender_workspace_id));
CREATE POLICY transaction_evidence_member ON transaction_evidence
  FOR ALL USING (is_workspace_member(submitted_by_workspace_id))
  WITH CHECK (is_workspace_member(submitted_by_workspace_id));
CREATE POLICY transaction_audit_member ON transaction_audit_trail
  FOR SELECT USING (
    actor_workspace_id IS NOT NULL AND is_workspace_member(actor_workspace_id)
  );

CREATE POLICY service_workspace_member ON layanan_transport
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY veterinarian_workspace_member ON layanan_dokter_hewan
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY clinic_workspace_member ON layanan_klinik_hewan
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY quotation_transaction_member ON service_quotations
  FOR ALL USING (EXISTS (
    SELECT 1 FROM transaction_rooms tr
    WHERE tr.id = room_id
      AND (is_workspace_member(tr.buyer_workspace_id) OR is_workspace_member(tr.seller_workspace_id))
  )) WITH CHECK (is_workspace_member(provider_workspace_id));

CREATE POLICY news_select_published ON news_publications
  FOR SELECT USING (
    status = 'Published' OR workspace_id IS NULL OR is_workspace_member(workspace_id)
  );
CREATE POLICY news_write_workspace ON news_publications
  FOR INSERT WITH CHECK (
    workspace_id IS NOT NULL AND is_workspace_member(workspace_id, ARRAY['Owner', 'Admin'])
  );

CREATE POLICY notifications_select_recipient ON notifications
  FOR SELECT USING (recipient_user_id = auth.uid());
CREATE POLICY notifications_update_recipient ON notifications
  FOR UPDATE USING (recipient_user_id = auth.uid())
  WITH CHECK (recipient_user_id = auth.uid());
CREATE POLICY notifications_insert_service ON notifications
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY reminders_workspace_member ON alert_reminders
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY trust_select ON trust_verifications
  FOR SELECT USING (
    is_workspace_member(workspace_id, ARRAY['Owner', 'Admin'])
  );
CREATE POLICY trust_write_owner ON trust_verifications
  FOR ALL USING (is_workspace_member(workspace_id, ARRAY['Owner', 'Admin']))
  WITH CHECK (is_workspace_member(workspace_id, ARRAY['Owner', 'Admin']));
CREATE POLICY trust_evidence_member ON trust_verification_evidence
  FOR ALL USING (EXISTS (
    SELECT 1 FROM trust_verifications tv
    WHERE tv.id = verification_id AND is_workspace_member(tv.workspace_id, ARRAY['Owner', 'Admin'])
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM trust_verifications tv
    WHERE tv.id = verification_id AND is_workspace_member(tv.workspace_id, ARRAY['Owner', 'Admin'])
  ));

CREATE POLICY media_workspace_member ON media
  FOR ALL USING (
    owner_workspace_id IS NULL OR is_workspace_member(owner_workspace_id)
  ) WITH CHECK (
    owner_workspace_id IS NULL OR is_workspace_member(owner_workspace_id)
  );
CREATE POLICY ai_insights_workspace ON ai_insights
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY audit_trail_admin_only ON global_audit_trail
  FOR SELECT USING (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'system_admin')::boolean, false)
  );
CREATE POLICY audit_trail_insert_service ON global_audit_trail
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY search_index_workspace_member ON search_index
  FOR ALL USING (
    workspace_id IS NULL OR is_workspace_member(workspace_id)
  ) WITH CHECK (
    workspace_id IS NULL OR is_workspace_member(workspace_id)
  );