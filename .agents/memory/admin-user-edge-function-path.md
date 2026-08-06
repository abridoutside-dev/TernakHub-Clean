---
name: Admin user Edge Function path
description: Durable routing rule for the admin user management module.
---

Admin user reads and mutations must be dispatched through the dedicated `admin-users` Supabase Edge Function. The browser must not call `/api/admin/users*`, because Cloudflare Pages treats those paths as SPA routes and can return `index.html`. The `platform-health` function is a separate monitoring boundary and must not contain Admin User logic.

**Why:** The frontend is hosted by Cloudflare Pages and the project architecture has no Node API runtime in production; service-role Auth Admin API access must remain inside Supabase Edge Functions.

**How to apply:** Keep `adminUserService` on `supabase.functions.invoke('admin-users', { body: { action: 'admin-users', ... } })`; add new Admin User operations to that function only.