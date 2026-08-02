-- FLOW-003M14 — Seed master_pakan_categories + master_pakan_catalog
--
-- Seeds the 6 categories and 8 ingredient items referenced by seed formulas
-- (formulaData.ts BahanFormula entries with referensiId mp-1..mp-14).
--
-- IDs use a fixed, recognisable UUID pattern so the lookup service can rely on
-- stable name→id resolution across environments.
--
-- Idempotent: ON CONFLICT DO NOTHING — safe to re-run.

-- ─── Categories ───────────────────────────────────────────────────────────────

INSERT INTO master_pakan_categories (id, slug, name, icon, sort_order) VALUES
  ('a1000001-feed-4000-a000-000000000001', 'hijauan-rumput',   'Hijauan & Rumput',      '🌿', 1),
  ('a1000001-feed-4000-a000-000000000002', 'limbah-pertanian', 'Limbah Pertanian',       '🌾', 2),
  ('a1000001-feed-4000-a000-000000000003', 'serealia-biji',    'Serealia & Biji-bijian', '🌽', 3),
  ('a1000001-feed-4000-a000-000000000004', 'protein-nabati',   'Protein Nabati',         '🫘', 4),
  ('a1000001-feed-4000-a000-000000000005', 'suplemen-energi',  'Suplemen Energi',        '⚡', 5),
  ('a1000001-feed-4000-a000-000000000006', 'mineral-vitamin',  'Mineral & Vitamin',      '💊', 6)
ON CONFLICT (id) DO NOTHING;

-- ─── Catalog items (8 items referenced by seed formulas) ──────────────────────
-- mp-1  → Rumput Gajah
-- mp-5  → Jerami Kering
-- mp-6  → Dedak Padi
-- mp-8  → Jagung Giling
-- mp-9  → Bungkil Kedelai
-- mp-11 → Molases
-- mp-13 → Mineral Mix
-- mp-14 → Garam Dapur

INSERT INTO master_pakan_catalog (id, category_id, name, species_suitability) VALUES
  ('b2000001-feed-4000-a000-000000000001',
   'a1000001-feed-4000-a000-000000000001',
   'Rumput Gajah',
   ARRAY['Sapi', 'Kambing', 'Domba', 'Kerbau']),

  ('b2000001-feed-4000-a000-000000000002',
   'a1000001-feed-4000-a000-000000000002',
   'Jerami Kering',
   ARRAY['Sapi', 'Kambing', 'Domba', 'Kerbau']),

  ('b2000001-feed-4000-a000-000000000003',
   'a1000001-feed-4000-a000-000000000002',
   'Dedak Padi',
   ARRAY['Sapi', 'Kambing', 'Domba', 'Babi', 'Unggas']),

  ('b2000001-feed-4000-a000-000000000004',
   'a1000001-feed-4000-a000-000000000003',
   'Jagung Giling',
   ARRAY['Sapi', 'Kambing', 'Domba', 'Babi', 'Unggas']),

  ('b2000001-feed-4000-a000-000000000005',
   'a1000001-feed-4000-a000-000000000004',
   'Bungkil Kedelai',
   ARRAY['Sapi', 'Kambing', 'Domba', 'Babi', 'Unggas']),

  ('b2000001-feed-4000-a000-000000000006',
   'a1000001-feed-4000-a000-000000000005',
   'Molases',
   ARRAY['Sapi', 'Kambing', 'Domba', 'Kerbau']),

  ('b2000001-feed-4000-a000-000000000007',
   'a1000001-feed-4000-a000-000000000006',
   'Mineral Mix',
   ARRAY['Sapi', 'Kambing', 'Domba', 'Babi', 'Unggas']),

  ('b2000001-feed-4000-a000-000000000008',
   'a1000001-feed-4000-a000-000000000006',
   'Garam Dapur',
   ARRAY['Sapi', 'Kambing', 'Domba'])
ON CONFLICT (id) DO NOTHING;
