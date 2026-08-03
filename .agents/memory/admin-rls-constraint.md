---
name: Admin RLS constraint
description: workspace_subscriptions and trust_verifications are RLS-blocked for cross-workspace platform-admin reads from the browser.
---

## Rule
Both `workspace_subscriptions` (policy: `is_workspace_member(workspace_id)`) and `trust_verifications` (policy: `is_workspace_member(workspace_id, ARRAY['Owner','Admin'])`) are RLS-restricted to workspace members.

A platform admin querying from the browser can only see records for workspaces they personally belong to. Cross-workspace aggregation (total MRR, platform-wide stats) requires a `service_role` key (server-side only).

**Why:** No `is_platform_admin()` bypass exists in the RLS migration. The browser client uses the anon/user key only.

**How to apply:**
- Admin modules for these tables must: (1) attempt a real Supabase query, (2) show a yellow RLS notice banner, (3) display real data (0 rows if no access), (4) never use dummy data.
- Stats (Aktif, Trial, Kadaluarsa counts) are computed from real query results.
- Control plane widget status: mark LIVE (real query attempted), not blocked (data IS returned, just scoped).
