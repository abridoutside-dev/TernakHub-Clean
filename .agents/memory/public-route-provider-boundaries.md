---
name: Public route provider boundaries
description: How public route pages can safely use workspace-scoped hooks after route-level splitting.
---

Public access and provider access are separate concerns: a route can remain outside authentication and initialization guards while receiving only the context providers required by its page subtree.

**Why:** Moving public Marketplace and News routes outside the protected route tree exposed that their existing hooks still require WorkspaceProvider. Removing the provider caused runtime crashes; putting them back under the auth guard broke guest navigation.

**How to apply:** When changing route boundaries, inspect every page and hook dependency in the subtree. Keep public routes outside auth guards, but add the narrowest provider wrapper needed for existing context consumers. Keep transactional/admin subroutes protected.