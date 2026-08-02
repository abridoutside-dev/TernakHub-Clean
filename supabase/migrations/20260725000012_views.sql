-- DB-001A / 012 — Read models and materialized aggregates.

CREATE VIEW v_livestock_with_status AS
SELECT
  l.*,
  lem.ear_tag,
  lem.internal_code,
  (
    SELECT count(*)
    FROM batch_members bm
    WHERE bm.livestock_id = l.id AND bm.removed_date IS NULL
  ) AS active_batch_count,
  (
    SELECT max(lwe.date)
    FROM livestock_weight_entries lwe
    WHERE lwe.livestock_id = l.id
  ) AS last_weight_date,
  (
    SELECT lwe.weight_kg
    FROM livestock_weight_entries lwe
    WHERE lwe.livestock_id = l.id
    ORDER BY lwe.date DESC, lwe.created_at DESC
    LIMIT 1
  ) AS last_weight_kg
FROM livestock l
LEFT JOIN livestock_extended_metadata lem ON lem.livestock_id = l.id;

CREATE VIEW v_workspace_subscription_plan AS
SELECT
  w.id,
  w.name,
  w.type,
  w.status,
  ws.status AS sub_status,
  ws.expires_at,
  sp.plan_key,
  sp.name AS plan_name,
  sp.features
FROM workspaces w
LEFT JOIN workspace_subscriptions ws ON ws.workspace_id = w.id
LEFT JOIN subscription_plans sp ON sp.id = ws.plan_id;

CREATE VIEW v_marketplace_listing_full AS
SELECT
  ml.*,
  w.name AS seller_name,
  w.verification_status AS seller_verification,
  (
    SELECT storage_url
    FROM marketplace_listing_photos mlp
    WHERE mlp.listing_id = ml.id AND mlp.is_primary = true
    ORDER BY mlp.sort_order
    LIMIT 1
  ) AS primary_photo_url
FROM marketplace_listings ml
JOIN workspaces w ON w.id = ml.workspace_id
WHERE ml.status = 'Aktif';

CREATE VIEW v_transaction_room_summary AS
SELECT
  tr.*,
  et.status AS escrow_status,
  et.amount AS escrow_amount,
  tt.status AS transport_status,
  tt.fee AS transport_fee,
  trc.id AS receipt_id
FROM transaction_rooms tr
LEFT JOIN escrow_transactions et ON et.room_id = tr.id
LEFT JOIN transport_transactions tt ON tt.room_id = tr.id
LEFT JOIN transaction_receipts trc ON trc.room_id = tr.id;

CREATE VIEW v_stok_obat_summary AS
SELECT
  so.*,
  dc.name AS drug_name_catalog,
  dc.category_id AS catalog_category_id,
  coalesce((
    SELECT sum(quantity)
    FROM stok_obat_masuk
    WHERE stok_obat_id = so.id
  ), 0) AS total_masuk,
  coalesce((
    SELECT sum(quantity)
    FROM stok_obat_keluar
    WHERE stok_obat_id = so.id
  ), 0) AS total_keluar
FROM stok_obat so
LEFT JOIN drug_catalog dc ON dc.id = so.drug_id;

CREATE VIEW v_active_notifications AS
SELECT *
FROM notifications
WHERE is_read = false
  AND (expires_at IS NULL OR expires_at > now())
ORDER BY created_at DESC;

CREATE VIEW v_health_overview_per_livestock AS
SELECT
  l.id AS livestock_id,
  l.name,
  l.health_status,
  max(hc.checkup_date) AS last_checkup_date,
  max(ht.treatment_date) AS last_treatment_date,
  count(DISTINCT hcs.id) FILTER (
    WHERE hcs.status = 'Terjadwal' AND hcs.scheduled_date >= CURRENT_DATE
  ) AS upcoming_schedules
FROM livestock l
LEFT JOIN health_checkups hc ON hc.livestock_id = l.id
LEFT JOIN health_treatments ht ON ht.livestock_id = l.id
LEFT JOIN health_control_schedules hcs ON hcs.livestock_id = l.id
GROUP BY l.id, l.name, l.health_status;

CREATE VIEW v_reproduksi_program_summary AS
SELECT
  rp.*,
  count(DISTINCT pk.id) AS total_pemeriksaan,
  count(DISTINCT k.id) AS total_kebuntingan,
  count(DISTINCT kl.id) AS total_kelahiran,
  count(DISTINCT ra.id) FILTER (WHERE ra.condition = 'Hidup') AS total_anak_hidup
FROM reproduksi_programs rp
LEFT JOIN pemeriksaan_kebuntingan pk ON pk.program_id = rp.id
LEFT JOIN kebuntingan k ON k.program_id = rp.id
LEFT JOIN kelahiran kl ON kl.kebuntingan_id = k.id
LEFT JOIN registrasi_anak ra ON ra.kelahiran_id = kl.id
GROUP BY rp.id;

CREATE VIEW v_feed_formula_cost AS
SELECT
  ff.*,
  coalesce(sum(ffi.percentage), 0) AS total_percentage,
  coalesce(sum(ffi.cost_per_kg * ffi.percentage / 100), 0) AS calculated_cost_per_kg,
  count(ffi.id) AS ingredient_count
FROM feed_formulas ff
LEFT JOIN feed_formula_ingredients ffi ON ffi.formula_id = ff.id
GROUP BY ff.id;

CREATE VIEW v_workspace_trust_score AS
SELECT
  w.id,
  w.name,
  w.trust_score,
  w.verification_status,
  count(tv.id) FILTER (WHERE tv.status = 'Approved') AS verified_count,
  count(tv.id) FILTER (WHERE tv.status = 'Submitted') AS pending_count,
  array_agg(tv.verification_type ORDER BY tv.verification_type)
    FILTER (WHERE tv.status = 'Approved') AS verified_types
FROM workspaces w
LEFT JOIN trust_verifications tv ON tv.workspace_id = w.id
GROUP BY w.id, w.name, w.trust_score, w.verification_status;

CREATE VIEW v_rss_queue_pending AS
SELECT
  rq.*,
  rs.name AS source_name,
  rs.category AS source_category
FROM rss_queue rq
JOIN rss_sources rs ON rs.id = rq.rss_source_id
WHERE rq.status = 'Pending'
ORDER BY rq.ai_score DESC NULLS LAST, rq.created_at ASC;

CREATE MATERIALIZED VIEW mv_workspace_livestock_summary AS
SELECT
  l.workspace_id,
  count(*) FILTER (WHERE l.location_status = 'Di Kandang') AS total_di_kandang,
  count(*) FILTER (WHERE l.location_status = 'Luar Kandang') AS total_luar_kandang,
  count(*) FILTER (WHERE l.location_status = 'Arsip') AS total_arsip,
  count(*) FILTER (WHERE l.health_status = 'Sakit') AS total_sakit,
  count(*) FILTER (WHERE l.health_status = 'Pemantauan') AS total_pemantauan,
  count(*) FILTER (WHERE l.sex = 'Betina') AS total_betina,
  count(*) FILTER (WHERE l.sex = 'Jantan') AS total_jantan,
  now() AS refreshed_at
FROM livestock l
GROUP BY l.workspace_id
WITH DATA;

CREATE UNIQUE INDEX mv_workspace_livestock_summary_workspace_idx
  ON mv_workspace_livestock_summary (workspace_id);

CREATE MATERIALIZED VIEW mv_marketplace_stats AS
SELECT
  kategori_slug,
  count(*) FILTER (WHERE status = 'Aktif') AS active_listings,
  avg(price) FILTER (WHERE status = 'Aktif') AS avg_price,
  min(price) FILTER (WHERE status = 'Aktif') AS min_price,
  max(price) FILTER (WHERE status = 'Aktif') AS max_price,
  now() AS refreshed_at
FROM marketplace_listings
GROUP BY kategori_slug
WITH DATA;

CREATE UNIQUE INDEX mv_marketplace_stats_category_idx
  ON mv_marketplace_stats (kategori_slug);

CREATE MATERIALIZED VIEW mv_platform_dashboard_kpi AS
SELECT
  (SELECT count(*) FROM auth.users) AS total_users,
  (SELECT count(*) FROM workspaces WHERE status = 'Aktif') AS active_workspaces,
  (SELECT count(*) FROM livestock WHERE location_status <> 'Arsip') AS total_active_livestock,
  (SELECT count(*) FROM marketplace_listings WHERE status = 'Aktif') AS active_listings,
  (SELECT count(*) FROM marketplace_transactions WHERE status = 'Selesai') AS completed_transactions,
  (SELECT count(*) FROM trust_verifications WHERE status = 'Submitted') AS pending_verifications,
  now() AS refreshed_at
WITH DATA;