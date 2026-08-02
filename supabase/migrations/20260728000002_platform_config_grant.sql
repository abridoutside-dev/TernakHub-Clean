-- FLOW-001 fix (part 2): table-level SELECT grant for platform_config.
--
-- Migration 20260728000001 added the RLS policy but the GRANT SELECT was not
-- present in the version that was first applied.  This migration adds it
-- separately so the anon role can execute the query (RLS is applied after
-- the grant check).

GRANT SELECT ON TABLE platform_config TO anon, authenticated;
