-- ADMIN-FOUNDATION-001 — activity_log platform table
--
-- Platform-wide activity log for all workspace domains.
-- Distinct from global_audit_trail (which is an immutable change-audit trail).
-- activity_log is an observable event feed: who did what, when, on which entity,
-- across every domain and module.
--
-- Fields as specified in ADMIN-FOUNDATION-001:
--   id (uuid), workspace_id (uuid), domain, module, entity_type, entity_id,
--   action, description, actor_id (uuid), created_at, metadata (jsonb),
--   status, source, severity
--
-- Usage:
--   • Workspace-scoped reads: filter by workspace_id
--   • Domain reads: filter by domain (e.g. 'farm', 'feed_store', 'veterinary')
--   • Admin cross-workspace: no workspace_id filter
--   • Severity: 'info' | 'warning' | 'error' | 'critical'
--   • Status:   'success' | 'failed' | 'pending'
--   • Source:   'web' | 'api' | 'system' | 'trigger' | 'import' | 'export'

-- ─── Enums ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE activity_severity_enum AS ENUM ('info', 'warning', 'error', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE activity_status_enum AS ENUM ('success', 'failed', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE activity_source_enum AS ENUM ('web', 'api', 'system', 'trigger', 'import', 'export');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE activity_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  domain       text NOT NULL,
  module       text NOT NULL,
  entity_type  text NOT NULL,
  entity_id    uuid,
  action       text NOT NULL,
  description  text,
  actor_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata     jsonb,
  status       activity_status_enum NOT NULL DEFAULT 'success',
  source       activity_source_enum NOT NULL DEFAULT 'web',
  severity     activity_severity_enum NOT NULL DEFAULT 'info',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_activity_log_workspace     ON activity_log (workspace_id, created_at DESC);
CREATE INDEX idx_activity_log_domain        ON activity_log (domain, created_at DESC);
CREATE INDEX idx_activity_log_entity        ON activity_log (entity_type, entity_id);
CREATE INDEX idx_activity_log_actor         ON activity_log (actor_id, created_at DESC);
CREATE INDEX idx_activity_log_severity      ON activity_log (severity, created_at DESC);
CREATE INDEX idx_activity_log_created_at    ON activity_log (created_at DESC);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Workspace members can read their own workspace's activity log
CREATE POLICY activity_log_workspace_member ON activity_log
  FOR SELECT TO authenticated
  USING (
    workspace_id IS NULL OR
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = activity_log.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

-- Any authenticated user can insert activity log entries (scoped to their session)
CREATE POLICY activity_log_insert ON activity_log
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);

-- ─── Grants ───────────────────────────────────────────────────────────────────

GRANT SELECT, INSERT ON TABLE activity_log TO authenticated;
