---
name: Platform Health internal token wiring
description: The server bridge and Edge Function must share a token; the Edge Function reads PLATFORM_HEALTH_INTERNAL_TOKEN (Supabase secret), the server sends SESSION_SECRET.
---

The platform-health auth-integrity flow uses a server-to-server token:
- API server (`server/index.ts`) reads `SESSION_SECRET` and sends it as `x-platform-health-internal-token` header to the Edge Function.
- Edge Function reads `PLATFORM_HEALTH_INTERNAL_TOKEN` from `Deno.env` and compares (constant-time) against the supplied header.
- If either is missing or they don't match → `status: 'warning'`, code `SYSTEM_ADMIN_TOKEN_MISSING` or `SYSTEM_ADMIN_TOKEN_INVALID`.

**Why:** Auth integrity bypasses the user JWT path and uses an internal service token so the check never depends on an expiring browser session.

**How to apply:** When SESSION_SECRET changes, re-set PLATFORM_HEALTH_INTERNAL_TOKEN in Supabase Edge Function secrets to the same value via Management API:
```bash
curl -X POST https://api.supabase.com/v1/projects/<ref>/secrets \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[{"name":"PLATFORM_HEALTH_INTERNAL_TOKEN","value":"<SESSION_SECRET value>"}]'
```

The API server uses `SUPABASE_ANON_KEY` (not `SUPABASE_SERVICE_ROLE_KEY`) for caller identity verification — `auth.getUser(jwt)` does not require service role; the JWT itself carries the auth claim.
