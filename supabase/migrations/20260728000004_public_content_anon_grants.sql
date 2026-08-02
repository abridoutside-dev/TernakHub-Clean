-- FLOW-001D fix: grant SELECT to anon on public-content tables.
--
-- Problem: marketplace_listings and news_publications both have RLS policies
-- that allow anon SELECT (status='Aktif' / status='Published'), but those
-- policies are never evaluated because the table-level SELECT grant for the
-- anon role is missing.  Supabase checks the grant before evaluating RLS, so
-- anon gets "permission denied" instead of an empty result set.
--
-- Root cause: extensions.sql grants USAGE ON SCHEMA public to anon, but does
-- NOT use ALTER DEFAULT PRIVILEGES, so each table created afterward needs its
-- own explicit GRANT.  platform_config was fixed in 20260728000001/000002;
-- these public-content tables were missed.
--
-- Fix: add the minimum required SELECT grants so the existing RLS policies
-- (listings_select_public, news_select_published) can filter rows as designed.

-- ── marketplace_listings ───────────────────────────────────────────────────────
-- Existing policy: listings_select_public  → status = 'Aktif' OR is_workspace_member()
GRANT SELECT ON TABLE marketplace_listings    TO anon, authenticated;
GRANT SELECT ON TABLE marketplace_categories  TO anon, authenticated;
GRANT SELECT ON TABLE marketplace_listing_photos TO anon, authenticated;

-- ── news_publications ──────────────────────────────────────────────────────────
-- Existing policy: news_select_published → status = 'Published' OR workspace_id IS NULL
GRANT SELECT ON TABLE news_publications TO anon, authenticated;

-- ── global_reference (lookup / dropdown data) ─────────────────────────────────
-- Used by onboarding forms, workspace creation, and public pages.
GRANT SELECT ON TABLE global_reference TO anon, authenticated;

-- ── data_master (admin reference tables) ──────────────────────────────────────
GRANT SELECT ON TABLE data_master TO anon, authenticated;
