---
name: Admin user error and pagination handling
description: Durable Supabase behavior relevant to the Admin User Edge Function.
---

Admin User failures returned by `supabase.functions.invoke` can expose the useful Edge Function JSON only through the error context response; the SDK's generic message is not sufficient for debugging.

**Why:** The browser otherwise shows “Edge Function returned non-2xx” even when the function already returned a specific Supabase error.

**How to apply:** Read and parse the response body from the invocation error context before falling back to the SDK error message.

Supabase Auth Admin pagination headers and links should be treated as hints. The function must continue until a short page is returned and use the number of fetched users as the authoritative total for stats and filtered pagination.

**Why:** Auth deployments can omit or misstate pagination metadata while individual pages remain readable.

**How to apply:** Fetch bounded pages, stop on a short page, and derive the total from the collected users before applying Admin User filters.