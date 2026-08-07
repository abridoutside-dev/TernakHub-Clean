---
name: Supabase admin session revocation
description: Supabase Auth behavior for revoking every session from an admin operation.
---

Supabase Auth does not expose an Admin API route that accepts a user ID to revoke that user's sessions. The supported logout endpoint requires a JWT belonging to the target user and accepts `scope=global`.

**Why:** A guessed `/auth/v1/admin/users/{id}/logout` route returns 404, while `service_role` authenticates the admin API but is not a target user's session JWT.

**How to apply:** Keep the operation inside the dedicated admin function. If the product requires ID-only admin revocation, obtain a short-lived target-user token through the supported Auth Admin generate-link flow, exchange its hash at `/auth/v1/verify`, then call `/auth/v1/logout?scope=global`; never claim success from the nonexistent admin route.