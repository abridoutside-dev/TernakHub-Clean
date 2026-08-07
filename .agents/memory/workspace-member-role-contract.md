---
name: Workspace member role contract
description: Keeps Workspace Members role values aligned across the UI, Edge Function, and database enum.
---

The Workspace Members role set is a shared contract: frontend types, Edge Function validation, and the persisted `member_role` enum must contain the same supported values.

**Why:** A role accepted by the UI but rejected by the Edge Function or database makes Edit appear available while the operation fails at runtime.

**How to apply:** When adding or renaming a workspace role, update all three layers in the same change and validate both the TypeScript build and the migration contract.