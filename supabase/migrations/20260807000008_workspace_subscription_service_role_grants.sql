-- FIX-SUB-001 — restore service_role access on workspace_subscriptions.
-- This is intentionally scoped to privilege repair only.
-- It does not alter schema, data, or any other table.

GRANT SELECT, INSERT, UPDATE ON TABLE workspace_subscriptions TO service_role;
