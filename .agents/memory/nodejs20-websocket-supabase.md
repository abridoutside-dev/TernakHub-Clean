---
name: Node.js 20 Supabase WebSocket crash in Express server
description: createClient() in Node.js 20 throws a WebSocket error on auth.getUser() — replace with direct REST call.
---

## Rule
Never use `createClient()` + `auth.getUser()` in the Express server on Node.js 20. Use the Supabase Auth REST API directly instead.

**Why:** Node.js 20 has no native WebSocket. The `@supabase/supabase-js` client tries to open a Realtime WebSocket connection during initialization, which throws:
> "Node.js 20 detected without native WebSocket support. For Node.js < 22, install 'ws' package..."

This exception propagates up through the `/api/admin/platform-health` try-catch → returns HTTP 502 "Platform health service tidak dapat dijangkau." → frontend's `response.ok` is false → throws "platform-health auth-health gagal".

**How to apply:** In `server/index.ts`, any server-side user verification must call the Supabase Auth REST endpoint directly:

```typescript
const userRes = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
  headers: {
    Authorization: `Bearer ${userJwt}`,
    apikey: callerKey,
  },
});
if (!userRes.ok) { /* 401 */ }
const userData = await userRes.json() as { id?: string; user_metadata?: Record<string, unknown> } | null;
if (!userData?.id) { /* 401 */ }
if (userData.user_metadata?.role !== 'system_admin') { /* 403 */ }
```

File changed: `server/index.ts` — removed `import { createClient }` from `@supabase/supabase-js` and replaced the createClient + auth.getUser block in the `/api/admin/platform-health` handler.
