-- ADMIN-PLATFORM-003 — Platform Health: Service Configuration
--
-- Grants authenticated users the ability to insert and update platform_config
-- rows so that the Admin Dashboard can persist service configuration.
--
-- Access control:
--   • SELECT: already granted (anon public rows, authenticated all rows)
--     via 20260728000001 + 20260728000002.
--   • INSERT / UPDATE: granted here to authenticated role only.
--     AdminGuard in the UI ensures only admin-level users reach these forms;
--     RLS adds a server-side safety net matching auth.role() = 'authenticated'.
-- ─────────────────────────────────────────────────────────────────────────────

-- Table-level DML grants for authenticated role
GRANT INSERT, UPDATE ON TABLE platform_config TO authenticated;

-- INSERT policy: any authenticated user may insert config rows
CREATE POLICY platform_config_auth_insert ON platform_config
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE policy: any authenticated user may update existing config rows
CREATE POLICY platform_config_auth_update ON platform_config
  FOR UPDATE
  TO authenticated
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
