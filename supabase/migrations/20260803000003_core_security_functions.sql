-- CORE-SECURITY-001 — Global Platform Security Helper Functions
--
-- Defines shared security primitives used across all platform-wide tables.
-- This migration must run before any migration that references these functions.
--
-- Functions defined here are intentionally table-agnostic so they can be
-- reused by any module that needs to restrict access to Platform Administrators:
--
--   Current consumers:
--     • platform_config          (service configuration)
--
--   Planned consumers:
--     • global_audit_trail       (already uses equivalent inline check)
--     • notifications            (platform-level notifications)
--     • job_queue                (background job management)
--     • scheduler                (task scheduling)
--     • ai_service               (AI engine configuration)
--     • infrastructure           (infrastructure metrics)
--     • and all future global platform tables
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── is_platform_admin() ─────────────────────────────────────────────────────
-- Returns true when the calling user's JWT carries a Platform Administrator
-- claim.  Mirrors the three conditions checked by AdminGuard.tsx so that
-- database-level enforcement matches the UI-level access control exactly.
--
-- Recognised admin claims (OR logic — any one is sufficient):
--   • user_metadata.is_admin  = true
--   • user_metadata.role      = 'admin'
--   • user_metadata.role      = 'system_admin'
--
-- Implementation notes:
--   SECURITY INVOKER — runs as the calling user; auth.jwt() returns their token.
--   STABLE            — result is constant within a transaction; planner can
--                       inline the call, avoiding repeated JWT parsing.

CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'system_admin'
  );
$$;
