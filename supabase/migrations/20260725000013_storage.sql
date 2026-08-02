-- DB-001A / 013 — Supabase Storage buckets.
-- No files or application data are inserted.

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('livestock-photos', 'livestock-photos', false, 10485760),
  ('marketplace-media', 'marketplace-media', true, 20971520),
  ('trust-documents', 'trust-documents', false, 20971520),
  ('news-media', 'news-media', true, 10485760),
  ('workspace-media', 'workspace-media', true, 10485760),
  ('transaction-evidence', 'transaction-evidence', false, 31457280)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

CREATE POLICY "storage_livestock_photos_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'livestock-photos');

CREATE POLICY "storage_livestock_photos_write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'livestock-photos');

CREATE POLICY "storage_livestock_photos_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'livestock-photos' AND owner_id = auth.uid());

CREATE POLICY "storage_marketplace_media_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'marketplace-media');

CREATE POLICY "storage_marketplace_media_write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'marketplace-media');

CREATE POLICY "storage_trust_documents_owner_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'trust-documents' AND owner_id = auth.uid());

CREATE POLICY "storage_trust_documents_write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'trust-documents' AND owner_id = auth.uid());

CREATE POLICY "storage_news_media_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'news-media');

CREATE POLICY "storage_news_media_write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'news-media');

CREATE POLICY "storage_workspace_media_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'workspace-media');

CREATE POLICY "storage_workspace_media_write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'workspace-media');

CREATE POLICY "storage_transaction_evidence_participant_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'transaction-evidence' AND owner_id = auth.uid());

CREATE POLICY "storage_transaction_evidence_write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'transaction-evidence' AND owner_id = auth.uid());