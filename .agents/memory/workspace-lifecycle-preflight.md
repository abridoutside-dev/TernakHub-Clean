---
name: Workspace lifecycle preflight
description: Durable rule for safe Workspace archive and delete dependency checks.
---

Workspace lifecycle actions must use one schema-verified dependency reader as the source of truth. The delete confirmation should display that preflight result and pass it into the delete command so the same action does not re-read every dependency table.

**Why:** Workspace data spans many Supabase tables, and an unchecked table name or a second independent fetch can either make a valid delete fail or produce inconsistent UI and command decisions.

**How to apply:** When adding a Workspace-scoped table, update the canonical dependency map and its domain key/label, then keep archive/delete policy decisions in the service layer rather than in page components.