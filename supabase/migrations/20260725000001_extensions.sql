-- DB-001A / 001 — Extensions and schema foundation.
-- This migration intentionally creates no application data.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;