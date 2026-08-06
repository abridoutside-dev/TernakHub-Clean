---
name: Admin user Edge Function path
description: Durable routing rule for the admin user management module.
---

Admin user reads and mutations must be dispatched through the existing `platform-health` Supabase Edge Function under its `admin-users` action. The browser must not call `/api/admin/users*`, because Cloudflare Pages treats those paths as SPA routes and can return `index.html`.

**Why:** The frontend is hosted by Cloudflare Pages and the project architecture has no Node API runtime in production; service-role Auth Admin API access must remain inside Supabase Edge Functions.

**How to apply:** Keep `adminUserService` on `supabase.functions.invoke('platform-health', { body: { action: 'admin-users', ... } })`; add new admin-user operations to that dispatcher rather than introducing a server route or a second function.