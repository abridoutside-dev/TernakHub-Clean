# AUTH-005A — Workspace Selector
**Date:** 2026-07-17  
**Status:** ✅ COMPLETE

---

## Files Created

| File | Purpose |
|------|---------|
| `src/pages/auth/WorkspaceSelect.tsx` | Workspace selection page at `/workspace/select` |

## Files Modified

| File | Change |
|------|--------|
| `src/App.tsx` | +1 import, +1 resolveMeta entry, +1 `<Route>` |

---

## Route

```
/workspace/select
  hideTopBar: true
  hideNav:    true
```

---

## Data sources

| Concern | Source |
|---------|--------|
| Workspace list (with rich data) | `getWorkspaces()` — `workspaceManagementData.ts` |
| Currently active workspace | `getActiveWorkspace()` — `TopAppBar.tsx` |
| Activating a workspace | `setActiveWorkspace(id)` — `TopAppBar.tsx` |
| Archived workspaces | Filtered out — only `status === 'Aktif'` shown |

Seed data has 6 workspaces; `Klinik Hewan Sejahtera` (status `Arsip`) is excluded → **5 cards displayed**.

---

## Auto-redirect rules

| Condition | Behaviour |
|-----------|-----------|
| 0 active workspaces | Stay on page → show **empty state** with disabled "Buat Workspace" button |
| 1 active workspace | `setActiveWorkspace(id)` → `navigate('/', { replace: true })` immediately on mount |
| 2+ active workspaces | Show workspace selector cards |

---

## Workspace card — what's displayed

| Element | Detail |
|---------|--------|
| Icon | Emoji from `WorkspaceManagementRecord.icon` |
| Name | `WorkspaceManagementRecord.nama` |
| Type badge | Colour-coded per `jenis` (6 workspace types, each with a distinct bg/text pair) |
| Verified badge | Shown only when `statusVerifikasi === 'Terverifikasi'` |
| Active indicator | Green top-stripe + highlighted border + "Aktif" pill on the currently active workspace |
| Button | **"Buka"** (solid green) for active workspace; **"Pilih & Buka"** (outline) for others |

---

## Interaction

1. User clicks **"Pilih & Buka"** (or **"Buka"** on the already-active workspace)
2. All buttons disabled immediately (`selecting` state)
3. `setActiveWorkspace(id)` mutates the TopAppBar WORKSPACES registry
4. 120ms pause → `navigate('/', { replace: true })`

---

## Special states

### Empty state (0 workspaces)
- Icon: 🏚️
- Title: "Belum Ada Workspace"
- Body copy explaining the situation
- "Buat Workspace" button — **disabled placeholder** (`cursor: not-allowed`, `opacity: 0.4`)
- Hint: "Fitur buat workspace segera hadir."

### Footer
- "Kelola Workspace" link → `/profile/workspace`
- Copyright line

---

## CRUD operations excluded

| Operation | Status |
|-----------|--------|
| Create workspace | ❌ Excluded (button disabled placeholder) |
| Edit workspace | ❌ Excluded |
| Delete workspace | ❌ Excluded |
| Invite members | ❌ Excluded |

---

## Verification

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✅ Zero errors |
| `/workspace/select` screenshot | ✅ 5 cards rendered |
| Aktif workspace highlighted correctly | ✅ Berkah Farm Garut — green border + stripe + "Aktif" badge |
| Arsip workspace excluded | ✅ Klinik Hewan Sejahtera not shown |
| Type badge colours distinct per jenis | ✅ |
| No TopAppBar / BottomNav | ✅ |
| Browser console — no new errors | ✅ |

---

## Remaining TODO (future tasks)

| Item | Task |
|------|------|
| Create Workspace page | Future workspace task |
| Route guard: redirect unauthenticated users away from `/workspace/select` | Future ProtectedRoute task |
| Persist selected workspace to Supabase user metadata | Future auth integration task |
| Register page (AUTH-006) | AUTH-006 |
