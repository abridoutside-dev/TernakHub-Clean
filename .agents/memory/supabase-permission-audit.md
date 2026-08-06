---
name: Supabase service-role permission audits
description: Read-only PostgREST integrity scans need explicit table grants even when service_role bypasses RLS.
---

`service_role` bypasses RLS but does not automatically receive table-level `SELECT` on application tables created without matching default privileges. Confirm both `rolbypassrls` and `has_table_privilege` before diagnosing an integrity scan.

**Why:** The Auth Integrity scan used the correct service-role client but still received `permission denied` because the public tables had grants only for `authenticated`.

**How to apply:** Audit `current_user`, `session_user`, `current_setting('role', true)`, owners, ACLs, schema usage, RLS, and effective privileges. If needed, use a narrowly scoped `GRANT SELECT ... TO service_role`; do not change existing policies or add write privileges.