---
name: Supabase CLI config compatibility
description: Environment-specific constraint for deploying Supabase Edge Functions from this workspace.
---

The workspace currently includes a Supabase CLI version that rejects the modern `[project] id = ...` configuration shape. A function-only deployment can still proceed by using a temporary deploy workdir with the legacy top-level `project_id` shape and only the target function source/config; the temporary workdir must contain the expected nested `supabase/functions/<name>` path.

**Why:** The CLI parser fails before upload when it sees the modern project table, while the Management API deployment itself works with the compatible temporary layout.

**How to apply:** Keep the repository configuration unchanged. For a single-function deploy, create a temporary workdir containing `supabase/config.toml` and `supabase/functions/<name>/index.ts`, use top-level `project_id`, deploy with the project ref and access token, then verify the production function list. Keep migration timestamps unique because the CLI/database migration history treats timestamp collisions as ambiguous.