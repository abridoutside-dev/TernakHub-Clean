-- DB-001A / 011 — Indexes and triggers.

CREATE INDEX idx_workspace_members_user ON workspace_members (user_id, status);
CREATE INDEX idx_workspace_members_workspace ON workspace_members (workspace_id, status);
CREATE INDEX idx_livestock_workspace ON livestock (workspace_id);
CREATE INDEX idx_livestock_location_status ON livestock (workspace_id, location_status);
CREATE INDEX idx_livestock_species ON livestock (workspace_id, species);
CREATE INDEX idx_batch_members_livestock ON batch_members (livestock_id);
CREATE INDEX idx_batch_members_active ON batch_members (batch_id) WHERE removed_date IS NULL;
CREATE INDEX idx_transfers_livestock_date ON livestock_transfers (livestock_id, transfer_date DESC);
CREATE INDEX idx_mutation_requests_workspace_status ON mutation_requests (workspace_id, status);
CREATE INDEX idx_stok_obat_workspace ON stok_obat (workspace_id, status);
CREATE INDEX idx_reproduction_program_workspace ON reproduksi_programs (workspace_id, status);
CREATE INDEX idx_feed_formulas_workspace ON feed_formulas (workspace_id, status);
CREATE INDEX idx_listings_status ON marketplace_listings (status);
CREATE INDEX idx_listings_workspace ON marketplace_listings (workspace_id, status);
CREATE INDEX idx_listings_category ON marketplace_listings (kategori_slug, status);
CREATE INDEX idx_chat_messages_room_created ON marketplace_chat_messages (room_id, created_at DESC);
CREATE INDEX idx_transaction_participants_workspace ON transaction_participants (workspace_id);
CREATE INDEX idx_transaction_audit_room_event ON transaction_audit_trail (room_id, event_at DESC);
CREATE INDEX idx_notifications_recipient ON notifications (recipient_user_id);
CREATE INDEX idx_notifications_is_read ON notifications (recipient_user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications (created_at DESC);
CREATE INDEX idx_ai_insights_workspace_id ON ai_insights (workspace_id);
CREATE INDEX idx_ai_insights_source_module ON ai_insights (source_module);
CREATE INDEX idx_ai_insights_priority ON ai_insights (priority);
CREATE INDEX idx_global_audit_workspace_id ON global_audit_trail (workspace_id);
CREATE INDEX idx_global_audit_entity ON global_audit_trail (entity_type, entity_id);
CREATE INDEX idx_global_audit_created_at ON global_audit_trail (created_at DESC);
CREATE INDEX idx_search_fts ON search_index USING gin (search_vector);
CREATE INDEX idx_news_status ON news_publications (status);
CREATE INDEX idx_news_tipe_konten ON news_publications (tipe_konten);
CREATE INDEX idx_news_published_at ON news_publications (published_at DESC);
CREATE INDEX idx_news_fts ON news_publications USING gin (
  to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(summary, ''))
);
CREATE UNIQUE INDEX idx_one_current_ownership
  ON livestock_ownership_history (livestock_id)
  WHERE is_current = true;
CREATE UNIQUE INDEX idx_one_active_pregnancy
  ON kebuntingan (dam_id)
  WHERE status = 'Aktif';

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_workspace_members_updated_at
  BEFORE UPDATE ON workspace_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_workspace_relationships_updated_at
  BEFORE UPDATE ON workspace_relationships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_ownership_transfers_updated_at
  BEFORE UPDATE ON ownership_transfers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_workspace_subscriptions_updated_at
  BEFORE UPDATE ON workspace_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_livestock_updated_at
  BEFORE UPDATE ON livestock
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_batches_updated_at
  BEFORE UPDATE ON batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_mutation_requests_updated_at
  BEFORE UPDATE ON mutation_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_stok_obat_updated_at
  BEFORE UPDATE ON stok_obat
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_reproduksi_programs_updated_at
  BEFORE UPDATE ON reproduksi_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_kebuntingan_updated_at
  BEFORE UPDATE ON kebuntingan
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_feed_formulas_updated_at
  BEFORE UPDATE ON feed_formulas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_stok_inventaris_updated_at
  BEFORE UPDATE ON stok_inventaris
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_marketplace_listings_updated_at
  BEFORE UPDATE ON marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_marketplace_negotiations_updated_at
  BEFORE UPDATE ON marketplace_negotiations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_marketplace_transactions_updated_at
  BEFORE UPDATE ON marketplace_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_transaction_rooms_updated_at
  BEFORE UPDATE ON transaction_rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_escrow_transactions_updated_at
  BEFORE UPDATE ON escrow_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_transport_transactions_updated_at
  BEFORE UPDATE ON transport_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_service_quotations_updated_at
  BEFORE UPDATE ON service_quotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_layanan_transport_updated_at
  BEFORE UPDATE ON layanan_transport
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_layanan_dokter_hewan_updated_at
  BEFORE UPDATE ON layanan_dokter_hewan
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_layanan_klinik_hewan_updated_at
  BEFORE UPDATE ON layanan_klinik_hewan
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_trust_verifications_updated_at
  BEFORE UPDATE ON trust_verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_news_publications_updated_at
  BEFORE UPDATE ON news_publications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_media_updated_at
  BEFORE UPDATE ON media
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER after_transfer_sync_location
  AFTER INSERT ON livestock_transfers
  FOR EACH ROW EXECUTE FUNCTION sync_livestock_location_after_transfer();
CREATE TRIGGER after_stok_obat_keluar
  AFTER INSERT ON stok_obat_keluar
  FOR EACH ROW EXECUTE FUNCTION deduct_stok_obat();
CREATE TRIGGER after_stok_obat_masuk
  AFTER INSERT ON stok_obat_masuk
  FOR EACH ROW EXECUTE FUNCTION add_stok_obat();
CREATE TRIGGER after_chat_message
  AFTER INSERT ON marketplace_chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_chat_room_last_message();
CREATE TRIGGER sync_wishlist_count_insert
  AFTER INSERT ON marketplace_wishlists
  FOR EACH ROW EXECUTE FUNCTION sync_listing_wishlist_count();
CREATE TRIGGER sync_wishlist_count_delete
  AFTER DELETE ON marketplace_wishlists
  FOR EACH ROW EXECUTE FUNCTION sync_listing_wishlist_count();
CREATE TRIGGER after_stok_inventaris_transaction
  AFTER INSERT ON stok_inventaris_transactions
  FOR EACH ROW EXECUTE FUNCTION apply_stok_inventaris_transaction();
CREATE TRIGGER guard_active_pregnancy
  BEFORE INSERT OR UPDATE OF dam_id, status ON kebuntingan
  FOR EACH ROW EXECUTE FUNCTION reject_active_pregnancy();