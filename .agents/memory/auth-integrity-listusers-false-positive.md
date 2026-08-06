---
name: Auth integrity listUsers false positive
description: auth.admin.listUsers paginated endpoint returns identities:null even when auth.identities rows exist; fix via app_metadata.providers fallback.
---

The Supabase GoTrue Admin API paginated list endpoint (`/auth/v1/admin/users?page=N&per_page=M`) returns `identities: null` for users even when rows exist in `auth.identities`. This causes false-positive `missing_identity` flags in any integrity check that reads `user.identities` from the `listUsers` SDK response.

**Why:** The paginated GoTrue endpoint does not always hydrate the `identities` array. The `app_metadata.providers` field, however, is always kept accurate by GoTrue whenever identities are added/removed.

**How to apply:** When checking for email identity existence, use both sources:
```typescript
const appMetaProviders: string[] = Array.isArray(user.app_metadata?.providers)
  ? user.app_metadata.providers as string[]
  : [];
const emailIdentities = (user.identities ?? []).filter(i => i.provider === 'email');
const hasEmailIdentity = emailIdentities.length > 0 || appMetaProviders.includes('email');
```
Only flag `missing_identity` when `!hasEmailIdentity`. This fix was applied to `supabase/functions/platform-health/index.ts`.
