# WS-003 — Workspace Profile Management: Completion Report

## Status: ✅ COMPLETE

---

## Route

```
/workspace/settings/profile
```

TopAppBar: title "Workspace Profile", back button, no bottom nav (`hideNav: true`).

---

## Page — `src/pages/WorkspaceSettingsProfile.tsx`

Uses `useWorkspace()` from WS-001's `WorkspaceContext` to load the active workspace and call `saveWorkspace()`.

---

## Sections

### Read-Only — Workspace Identity

| Field | Notes |
|---|---|
| UUID | monospace, 🔒 locked |
| Type | human-readable label (Farm / Feed Store / Veterinary / Transport) |
| Slug | monospace, 🔒 locked — immutable |
| Status | Active / Inactive / Archived |
| Plan | Free / Pro / Enterprise |
| Created At | formatted date |
| Updated At | formatted date |

All rows display a 🔒 icon to communicate immutability to the user.

---

### Editable — Basic Information

| Field | Validation |
|---|---|
| Logo URL | optional URL text input |
| Workspace Name | **required**, 2–120 chars |
| Description | optional textarea |

---

### Editable — Contact

| Field | Validation |
|---|---|
| Phone | optional, format `/^[+\d][\d\s\-().]{5,19}$/` |
| Email | optional, RFC-style format check |
| Website | optional, must be valid URL |

---

### Editable — Location

| Field | Notes |
|---|---|
| Country | text |
| Province | text, 2-column grid |
| City | text, 2-column grid |
| District | text, 2-column grid |
| Village | text, 2-column grid |
| Postal Code | text, maxLength 10 |
| Address | textarea |
| Latitude | number, −90 to +90 |
| Longitude | number, −180 to +180 |

---

### Editable — Regional Settings

| Field | Options |
|---|---|
| Timezone | Asia/Jakarta, Asia/Makassar, Asia/Jayapura, Asia/Singapore, Asia/Kuala_Lumpur, UTC |
| Language | Bahasa Indonesia (id), English (en) |
| Currency | IDR, USD, MYR, SGD |

---

## Save Behaviour

- **Delta-only update:** only fields that differ from the current workspace record are included in the patch. If nothing changed, shows "No changes to save." and exits early.
- **Loading state:** save button shows a CSS spinner and "Saving…" text; button is disabled during save.
- **Success toast:** green banner auto-dismisses after 4 seconds.
- **Error toast:** red banner shows validation error messages from the service layer; auto-dismisses after 4 seconds.
- **Network failure:** caught in try/catch, shows error toast — app does not crash.

---

## Validation

| Rule | Enforcement |
|---|---|
| Workspace Name required | client-side + service-layer |
| Name 2–120 chars | client-side + service-layer |
| Valid email format | client-side (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) |
| Valid URL format | client-side (`new URL()` parse) |
| Phone format | client-side (`/^[+\d][\d\s\-().]{5,19}$/`) |
| Latitude −90..90 | client-side (`parseFloat` + range check) |
| Longitude −180..180 | client-side (`parseFloat` + range check) |
| Slug immutable | not exposed as an editable field |
| Type cannot change | not exposed as an editable field |

Fields with errors show a red border and an inline error message beneath the input.

---

## Constraints Honored

- ❌ Workspace Type cannot be changed
- ❌ Owner cannot be changed
- ❌ No Members / Invitation / Role / Permission / Archive / Workspace Switch
- ✅ Uses TernakHub design system (CSS variables, card pattern, inline styles)
- ✅ Mobile-first layout (maxWidth 600px, paddings, 2-column grid for small paired fields)
- ✅ Responsive
- ✅ TypeScript compiles with zero errors (`tsc --noEmit`)
- ✅ No console errors

---

## Files Created

```
src/pages/WorkspaceSettingsProfile.tsx    (535 lines)
```

## Files Modified

```
src/App.tsx    (+import WorkspaceSettingsProfile; +resolveMeta entry; +Route)
```

---

## App.tsx Changes

```
resolveMeta:
  /workspace/settings/profile → { title: 'Workspace Profile', showBack: true, hideNav: true }

Route:
  <Route path="/workspace/settings/profile" element={<WorkspaceSettingsProfile />} />
```
