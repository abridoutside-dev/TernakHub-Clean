---
name: Supabase Auth production quirks
description: Production Auth Admin API and Edge Function secret naming constraints discovered during platform health deployment.
---

Supabase reserves environment names beginning with `SUPABASE_` for injected runtime values, so user-managed Management API credentials must use a non-reserved name such as `MANAGEMENT_API_TOKEN` in Edge Function secrets.

**Why:** The production CLI rejected `SUPABASE_ACCESS_TOKEN` as a user secret even though the same credential existed in the Replit environment.

**How to apply:** Keep the Replit secret protected, copy it into the Supabase Edge Function secret store under the non-reserved name, and have Management API calls read that name.

The production Auth Admin API can return HTTP 500 for a specific user page while neighboring pages succeed. Health reporting should preserve usable counts, expose the page error, and mark the service degraded rather than down when partial data is available.

**Why:** A single malformed or problematic Auth record otherwise made the Platform Health widget appear BLOCKED despite the Auth service and Management API being reachable.

**How to apply:** Use small-page pagination with retries and distinguish total failure from partial results; do not report operational when a page could not be read.
