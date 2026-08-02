# WS-006 — Workspace Archive: Completion Report

## Status: ✅ COMPLETE

---

## Route

```
/workspace/settings/archive
```

`resolveMeta`: `{ title: 'Workspace Archive', showBack: true, hideNav: true }`

---

## Files Created / Modified

| File | Change |
|---|---|
| `src/pages/WorkspaceSettingsArchive.tsx` | New — full WS-006 implementation |
| `src/App.tsx` | +import, +resolveMeta entry, +Route |

No changes to the data layer or service layer — archive/restore flow through the existing `saveWorkspace({ workspace_status: 'Archived' | 'Active' })` pipeline, which already handles `archived_at` auto-management in `patchWorkspace()`.

---

## Access Control

Role check via `getMemberByUserId(activeWorkspace.workspace_uuid, currentUserId)`.

| Role | Archive | Restore |
|---|---|---|
| Owner | ✅ | ✅ |
| Admin | ❌ | ❌ |
| Manager | ❌ | ❌ |
| Staff | ❌ | ❌ |
| Viewer | ❌ | ❌ |

Non-owners see a full-screen "Owner Access Required" error card with their current role displayed and a ← Go Back button.

---

## Page — Active Workspace View

**Workspace identity card:** name, type, slug, status badge (● Active)

**Archive section:**
- Introductory explanation (read-only, data preserved, always restorable)
- 🚫 "When archived, these will be blocked" list:
  - Livestock record updates and new registrations
  - Feed and inventory modifications
  - Medicine and health record updates
  - Marketplace listings and transactions
  - Member management changes
  - Dashboard data entry and edits
- ✅ "You will still be able to" list:
  - View all workspace information and history
  - Export your data at any time
  - Restore the workspace whenever you're ready
- **"🔒 Archive This Workspace" button** (red) → triggers ArchiveConfirmDialog
- Owner-only note below button

**Data Safety Guarantee card:** explains data is never deleted, always restorable

---

## Page — Archived Workspace View

**Prominent amber archived banner:** 🔒 icon + "This Workspace Is Archived" + explanation

**Currently Blocked card:** all 6 blocked operations listed

**Still Available card:** 3 allowed operations listed

**Restore section card:**
- Brief explanation
- **"♻️ Restore This Workspace" button** (green) → triggers RestoreConfirmDialog
- Owner-only note

**Data Safety Guarantee card** (same as Active view)

---

## Archive Confirm Dialog

GitHub-style safety confirmation:
- 🔒 icon + title + subtitle
- Red consequences recap box (4 bullet points)
- **Workspace name input**: user must type the exact workspace name to enable the confirm button
  - Match detection: `typed.trim() === workspaceName.trim()`
  - Real-time validation: "Name does not match" message if typed but wrong
  - Confirm button stays disabled until match is exact
- **"🔒 Archive Workspace"** button (red, disabled until name matches)
- Cancel button
- Loading spinner during async save

---

## Restore Confirm Dialog

Simple confirmation:
- ♻️ icon + workspace name in title
- Green "what will be restored" box (4 items)
- **"♻️ Restore Workspace"** button (green)
- Cancel button
- Loading spinner during async save

---

## Archive / Restore Flow

```
Archive:
  checkCanArchive(uuid)        → stub: always passes (no active transfers in prototype)
  saveWorkspace(uuid, { workspace_status: 'Archived' })
    → patchWorkspace sets archived_at = now
  removeRecentWorkspace(uuid)  → remove from localStorage recent list (now inaccessible for switching)
  refreshWorkspaces()          → context re-reads WORKSPACE_DB
  toast: success or error

Restore:
  saveWorkspace(uuid, { workspace_status: 'Active' })
    → patchWorkspace clears archived_at = null
  refreshWorkspaces()
  toast: success or error
```

---

## Stub Validation — `checkCanArchive()`

```typescript
function checkCanArchive(workspaceUuid: string): { blocked: boolean; reason?: string } {
  // Always passes in prototype — no real transfer / background-process tracking yet.
  // Future: check marketplace pending transactions, active data migrations, etc.
  return { blocked: false };
}
```

Designed so that future integrations can plug in real checks without changing the page structure. A `blocked: true` result with a `reason` string surfaces a user-friendly error toast and prevents the dialog from opening.

---

## Data Safety

- `deleteWorkspace()` (repo hard-delete) is **never called** anywhere in WS-006.
- All archive/restore goes through `patchWorkspace()` only.
- `archived_at` is set on archive and cleared on restore by the existing `patchWorkspace` logic.
- Workspace seed entry w6 (Klinik Hewan Sejahtera) is already seeded as `status: 'Archived'` and exercises the "Archived workspace view" code path.

---

## Constraints Honored

- ❌ No permanent delete
- ❌ No workspace transfer
- ❌ No billing or subscription changes
- ✅ Only Owner can archive or restore
- ✅ TypeScript compiles with zero errors (`tsc --noEmit`)
- ✅ No console errors
