-- Add Ampas Kedelai Kering to master_pakan_catalog
--
-- Item: Ampas Kedelai Kering (Dried Soy Pulp)
-- Category: Protein Nabati (existing DB category)
-- Source: limbahIndustriPanganData.ts — Ampas Protein Nabati sub-category
--
-- Nutrisi: TIDAK diisi karena belum ada data laboratorium verified.
-- Harga: TIDAK diisi karena belum ada harga canonical.

INSERT INTO master_pakan_catalog (
  id,
  category_id,
  name,
  local_name,
  latin_name,
  species_suitability,
  nutritional_content,
  dry_matter_pct,
  description,
  preparation_notes,
  created_at,
  updated_at
) VALUES (
  'b2000001-feed-4000-a000-000000000009',
  'a1000001-feed-4000-a000-000000000004',
  'Ampas Kedelai Kering',
  NULL,
  'Glycine max (L.) Merr. dried pulp',
  ARRAY['Sapi', 'Kambing', 'Domba', 'Babi', 'Unggas'],
  NULL,
  NULL,
  'Sisa padat kering hasil ekstraksi susu kedelai (soy milk) sebelum menjadi tahu. Berbeda dari ampas tahu basah; versi kering lebih tahan simpan karena kadar air rendah. Digunakan sebagai sumber protein nabati ekonomis dalam ransum ternak.',
  NULL,
  now(),
  now()
)
ON CONFLICT (name) DO NOTHING;
