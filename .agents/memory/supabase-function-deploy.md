---
name: Supabase function deploy workflow
description: Workaround for deploying one Edge Function when the imported Supabase config uses an older key format.
---

When the installed Supabase CLI rejects the imported `supabase/config.toml` because it contains `[project] id`, deploy the target function from a temporary workdir containing only `supabase/functions/<function>` and a temporary `supabase/config.toml` with `project_id`. Use `--project-ref` and `--use-api`.

**Why:** The older CLI accepts `project_id` but rejects the imported `[project] id` shape, while deploying from the project root risks coupling the operation to unrelated project files.

**How to apply:** Copy only the requested function into the temporary workdir, deploy with the explicit function name, and verify the CLI upload list contains only that function's entrypoint. Do not copy migrations or other functions.