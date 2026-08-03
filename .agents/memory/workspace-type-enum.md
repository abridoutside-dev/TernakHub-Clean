---
name: Workspace type enum alignment
description: DB workspace_type enum uses English keys; UI display labels are Indonesian. WS_TYPE_CONFIG maps DB keys to labels.
---

## Rule
The `workspace_type` Supabase enum has English values: `'Farm' | 'FeedStore' | 'VeterinaryClinic' | 'VeterinaryDoctor' | 'Transport' | 'Marketplace'`.

All code that maps or validates workspace types must use these DB keys, not the old Indonesian strings ('Peternakan', 'Klinik Hewan', etc.).

**Why:** The old `adminWorkspacesData.ts` had Indonesian keys predating the DB migration. After alignment, all VALID_TYPES arrays, WS_TYPE_CONFIG, and TYPE_MAP in admin modules use DB keys.

**How to apply:**
- `WS_TYPE_CONFIG` keys are DB values; `WS_TYPE_CONFIG[type].label` gives the Indonesian display name.
- `WorkspacesModule.tsx` VALID_TYPES = DB enum array; adaptWorkspace default = 'Farm'.
- `WorkspacesSubPages.tsx` TYPE_MAP maps workspace service types → WsType DB keys.
- TypeBadge renders `{c.icon} {c.label}` (not `{c.icon} {type}`).
