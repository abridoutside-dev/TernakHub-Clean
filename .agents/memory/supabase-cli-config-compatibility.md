---
name: Supabase CLI config compatibility
description: Environment-specific constraint for deploying Supabase Edge Functions from this workspace.
---

The workspace currently includes a Supabase CLI version that rejects the modern `[project] id = ...` configuration shape. A function-only deployment can still proceed by using a temporary deploy workdir with the legacy top-level `project_id` shape and only the target function source/config.

**Why:** The CLI parser fails before upload when it sees the modern project table, while the Management API deployment itself works with the compatible temporary layout.

**How to apply:** Keep the repository configuration unchanged. For a single-function deploy, copy only the target function into a temporary Supabase workdir, use top-level `project_id`, deploy with the project ref and access token, then verify the production function list.