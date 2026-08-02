# LS-PHOTO-003 — Selectable Livestock Cover Photo
**Status:** COMPLETE  
**Date:** 2026-07-16

---

## Summary

Implemented a configurable Cover Photo for every livestock record. Any uploaded photo (Identity, Achievement, Recent) can be designated as the cover. The cover drives all primary photo display surfaces without duplicating files or moving photos between categories. Changing cover photo creates an immutable audit entry.

---

## Architecture

### Cover Photo Resolution Order

```
getCoverPhotoUrl(livestockId)
  │
  ├─ 1. COVER_DB[livestockId] exists?
  │        └─ resolvePhotoUrl() searches across all 3 stores
  │             ├─ Found (even if soft-deleted — URL preserved) → return URL
  │             └─ Not found (record removed from DB) → fall through
  │
  └─ 2. Default: getFotoIdentitas(livestockId)?.url ?? null
```

### Rule: Identity Photo ≠ Automatic Cover

- Identity Photo is stored and managed independently in `IDENTITAS_DB`.
- When the user has **never** explicitly set a cover, `getCoverPhotoUrl()` returns the identity photo URL as the default — but no `coverPhotoId` is stored.
- If the user explicitly sets the identity photo as cover, `COVER_DB` stores its photoId and a `cover_diatur` event is logged.
- These are two distinct, independent pieces of data.

---

## Files Changed

### 1. `src/data/livestockFotoData.ts`

#### New event type
```typescript
'cover_diatur'   // cover photo explicitly set or changed
```

#### New storage
```
KEY: 'ternakhub_cover_photo'
Type: Record<livestockId, photoId>  (explicit selections only)
Persistence: localStorage (same pattern as all other photo stores)
```

#### New exports

| Function | Description |
|---|---|
| `getCoverPhotoId(livestockId)` | Returns the explicitly stored photoId, or `null` when default applies |
| `getCoverPhotoUrl(livestockId)` | Resolves the effective cover URL with full fallback chain |
| `setCoverPhoto(livestockId, photoId, setBy)` | Stores ref + appends immutable `cover_diatur` history entry |

#### Private helper
`resolvePhotoUrl(livestockId, photoId)` — looks up a photoId across all three stores (identitas history, prestasi including soft-deleted, terbaru including soft-deleted). Used by `getCoverPhotoUrl` and for audit trail `previousPhotoUrl` field.

#### `__clearFotoData` updated
Also deletes `COVER_DB[livestockId]` so dev seed clears are complete.

#### `init()` / `persistAll()` updated
COVER_DB is now loaded and saved alongside the other stores.

---

### 2. `src/components/KtpCard.tsx`

- Added `getCoverPhotoUrl` import.
- Added `const coverPhotoUrl = getCoverPhotoUrl(lv.id);` alongside existing photo reads.
- Main photo slot background, border, and `<img>` src all now use `coverPhotoUrl` instead of `fotoIdentitas.url`.
- Placeholder text ("FOTO IDENTITAS") and emoji fallback remain unchanged — task requirement: do not redesign the template.
- `fotoIdentitas` variable kept — still used by gallery slots (Identity slot stays as Identity Photo source).

---

### 3. `src/pages/LivestockProfile.tsx`

#### New imports
```typescript
getCoverPhotoId, getCoverPhotoUrl, setCoverPhoto as saveCoverPhoto
```

#### `IdentityPhoto` component
- New optional `tick` prop forces re-render when cover changes.
- Avatar `<img>` src now uses `getCoverPhotoUrl(lv.id)` — shows cover photo.
- FotoViewer (opened on avatar tap) still shows the identity photo — for disambiguation.

#### `LivestockProfile` page
- Added `const [photoTick, setPhotoTick] = useState(0);` at page level.
- Passes `tick={photoTick}` to `IdentityPhoto`.
- Passes `onCoverChange={() => setPhotoTick(t => t+1)}` to `PhotoGallery`.
- This ensures the avatar re-renders immediately after cover changes without a page reload.

#### `PhotoGallery` component — new prop
```typescript
onCoverChange?: () => void
```

#### `PhotoGallery` — new internals
```typescript
const coverPhotoId = getCoverPhotoId(id);          // explicit or null
const effectiveCoverId = coverPhotoId ?? fotoIdentitas?.id ?? null;
```

**`handleSetCover(photoId)`** — called by all cover buttons:
1. Guard: archived animals → no-op (Arsip read-only).
2. Guard: `photoId === effectiveCoverId && coverPhotoId !== null` → already cover, skip.
3. Call `saveCoverPhoto(id, photoId, 'Pemilik')`.
4. `setTick(t+1)` to refresh gallery.
5. `onCoverChange?.()` to refresh avatar.

**`coverBtnStyle(isActive)`** — shared style function for cover buttons.

**`CoverStar`** — small `position:absolute` amber star badge rendered inside THUMB when photo is active cover.

#### UI: "Set as Cover" per photo type

| Section | Button location | Active state |
|---|---|---|
| **Foto Identitas** | 3rd button alongside "Ganti Foto" / "Lihat" | "⭐ Cover Saat Ini" (disabled) |
| **Foto Prestasi** | Small button below each 84px THUMB | "⭐ Cover" (disabled) + star badge on THUMB |
| **Foto Terbaru** | Small button below each 84px THUMB | "⭐ Cover" (disabled) + star badge on THUMB |

Buttons hidden for archived animals (`isArchived`). Star badge rendered at `position:absolute, top:3, right:3` inside the THUMB (`overflow:hidden`), safely within the 84px bounds so it is never clipped.

---

### 4. `src/pages/FotoHistory.tsx`

Added `cover_diatur` to `EVENT_CONFIG` (exhaustive `Record<FotoHistoryEventType, ...>`):
```typescript
cover_diatur: { icon: '⭐', label: 'Cover Foto Diatur', color: '#b45309', bg: '#fff8e1' }
```
Cover changes now appear in the Riwayat & Audit Foto page with the correct label.

---

## Immutability Guarantees

| Operation | What happens to files | Audit |
|---|---|---|
| Set cover | Only `COVER_DB[id] = photoId` stored | `cover_diatur` appended to `HISTORY_LOG` |
| Change cover | Same — previous photoId overwritten, previous URL captured in `previousPhotoUrl` | `cover_diatur` with `previousPhotoId` set |
| Delete a photo that was cover | Photo soft-deleted in its store (URL preserved) | `resolvePhotoUrl` still resolves the old URL; next `getCoverPhotoUrl` call falls back to identity photo |

No files are duplicated. No photos move between categories.

---

## Cover Photo Usage Map

| Surface | Change | Mechanism |
|---|---|---|
| **Livestock Profile avatar** | Shows cover photo | `getCoverPhotoUrl()` in `IdentityPhoto` |
| **KTP main photo slot** | Shows cover photo | `getCoverPhotoUrl()` in `KtpOfficialCard` |
| **KTP PDF export** | Shows cover photo | Same `KtpOfficialCard` used off-screen by html2canvas |
| **Livestock Lists** | No real photos today (typeIcon) | `getCoverPhotoUrl()` available for future adoption |
| **Batch** | No real photos today (typeIcon) | `getCoverPhotoUrl()` available for future adoption |
| **Marketplace** | No real photos today (emoji) | `getCoverPhotoUrl()` available for future adoption |

---

## Arsip (Read-Only) Enforcement

- `handleSetCover` guards `isArchived` and returns early.
- Cover buttons are not rendered when `isArchived`.
- `setCoverPhoto` itself has no archive guard — caller responsibility (enforced at the UI layer, same pattern as all other photo mutations in this module).

---

## Verification

- `npx tsc --noEmit` → **0 errors**
- Vite HMR applied to all modified files with no runtime errors
- `FotoHistory.tsx` `cover_diatur` event entry renders correctly in the audit trail page
