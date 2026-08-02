# WS-005 — Workspace Switch: Completion Report

## Status: ✅ COMPLETE

---

## Route

```
/workspace/select
```

`resolveMeta`: `{ title: '', hideTopBar: true, hideNav: true }` (pre-existing entry, no change needed)

---

## Files Created / Modified

| File | Change |
|---|---|
| `src/utils/recentWorkspaces.ts` | New — localStorage tracker for recently-used workspace UUIDs |
| `src/pages/auth/WorkspaceSelect.tsx` | Full rewrite — complete WS-005 implementation |
| `src/data/workspaceMembersData.ts` | +seed members for w4/w5/w6; +`getMembersByUserId()` helper |
| `src/contexts/WorkspaceContext.tsx` | +`trackRecentWorkspace()` call inside `setActiveWorkspaceUuid` |

---

## Recently Used Tracking — `src/utils/recentWorkspaces.ts`

Persists an ordered list of workspace UUIDs to **localStorage** (survives browser sessions, unlike sessionStorage used for the active workspace).

| Export | Description |
|---|---|
| `trackRecentWorkspace(uuid)` | Prepend UUID to list, deduplicate, cap at 5 |
| `getRecentWorkspaceUuids()` | Returns ordered list, most-recent first |
| `removeRecentWorkspace(uuid)` | Remove a specific UUID (e.g. membership removed) |
| `clearRecentWorkspaces()` | Wipe all history |

**Storage key:** `ternakhub_recent_workspaces`  
**Max entries:** 5  
**Trigger:** `setActiveWorkspaceUuid()` in `WorkspaceContext.tsx` calls `trackRecentWorkspace(uuid)` automatically.

---

## Workspace List

The page shows **only workspaces where the current user has a member record** (via `getMembersByUserId(currentUserId)`). This correctly handles the case where a user's membership is removed — the workspace simply disappears from the list.

**Seed coverage:** All 6 workspaces (w1–w6) now have member records for the seed owner:
- w1: Owner/Active, w2: Owner/Active, w3: Owner/Active, w4: Owner/Active
- w5: Admin/Active (drh. Amelia Putri's workspace — tests non-Owner role display)
- w6: Owner/Active — but workspace_status=Archived (tests Archived validation)

---

## Workspace Card

Each card displays:
- **Type icon** (🐄 Farm / 🌾 Feed Store / 🩺 Veterinary / 🚚 Transport) or actual `logo_url`
- **Workspace name** + `ACTIVE` pill (if currently active) + `🔒 ARCHIVED` badge (if archived)
- **Badges row:** Type · User's Role (color-coded per WS-004 ROLE_COLOR) · Plan
- **Location:** City, Province (when set)
- **Inactive membership warning** (if membership.status === 'Inactive')
- **Action button:** "✓ Currently Active" | "Switch to This Workspace →" | "🔒 Archived — Cannot Switch" | "⚠ Inactive Membership"
- **Active top stripe:** 3px green bar for the current workspace

---

## Search

Full-text search across: workspace name, type label, city, province, user's role.  
Shows "No workspaces match…" empty state when no results.

---

## Sort Options

| Value | Description |
|---|---|
| Name A → Z (default) | Alphabetical ascending |
| Name Z → A | Alphabetical descending |
| Type | Alphabetical by workspace type |
| Plan | Enterprise → Pro → Free |
| Recently Used | Most-recently-accessed first (from localStorage) |

---

## Recently Used Section

Shown when:
- At least 1 recently-used UUID matches the user's accessible workspaces
- No search query is active (hides section during search to avoid duplication)

Shows top 3 recent workspaces above the full "All Workspaces" list.

---

## Switch Flow

```
User clicks card / button
  ↓
Already active? → navigate('/') immediately
  ↓
workspace_status === 'Archived'?
  → error toast: "X is archived and cannot be accessed. Contact the workspace owner."
  → NO switch
  ↓
membership.status === 'Inactive'?
  → error toast: "Your membership in X is inactive. Contact the workspace owner to reactivate."
  → NO switch
  ↓
setActiveWorkspaceUuid(uuid)   → persists to sessionStorage + trackRecentWorkspace to localStorage
refreshWorkspaces()            → re-reads WORKSPACE_DB in case of updates
navigate('/', { replace: true }) after 160ms (ensures state propagation)
```

---

## Auto-Redirect

- **Exactly 1 accessible workspace** (not Archived, membership Active): switch immediately and navigate to `/` without showing the selector. Renders `null` during redirect.
- **0 accessible workspaces**: show empty state with "Create Workspace" link → `/workspace/create`
- **2+ accessible workspaces**: show the full selector

---

## Active Workspace Persistence

| Storage | Key | Survives |
|---|---|---|
| `sessionStorage` | `ternakhub_active_workspace_uuid` | Page reloads within the same tab |
| `localStorage` | `ternakhub_recent_workspaces` | Full browser sessions (cross-tab) |

On app load, `WorkspaceContext` restores from `sessionStorage`, falling back to the first Active workspace if the saved UUID is gone or invalid. This satisfies the "Restore automatically on next login" requirement.

**If the saved workspace is unavailable** (archived, membership removed): the context falls back to the first Active workspace. If none exist, `activeWorkspace` is `null`, which the app should detect and redirect to `/workspace/select`.

---

## Validation Errors (Toast)

| Condition | Message |
|---|---|
| Workspace is Archived | `"X is archived and cannot be accessed. Contact the workspace owner."` |
| Membership is Inactive | `"Your membership in X is inactive. Contact the workspace owner to reactivate."` |

Toasts auto-dismiss after 4.5 seconds and are manually dismissable.

---

## Constraints Honored

- ❌ No Workspace Archive
- ❌ No Workspace Delete
- ❌ No Invitation
- ❌ No Member Management
- ❌ No Role Management
- ❌ No Permission Management
- ✅ TypeScript compiles with zero errors (`tsc --noEmit`)
- ✅ No console errors
