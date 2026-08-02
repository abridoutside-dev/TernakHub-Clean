# LS-PHOTO-002 — Final Gallery Layout Revision
**Status:** COMPLETE  
**Date:** 2026-07-16

---

## Summary

Revised the gallery strip inside `KtpOfficialCard` from a 4-slot uniform grid to the approved 3-slot model, and wired interactive behavior into `KtpFullscreenViewer`.

---

## Changes Delivered

### 1. `src/components/KtpCard.tsx`

#### Props interface — new callbacks
Added `KtpOfficialCardCallbacks` interface and spread it onto `KtpOfficialCard` props:

| Prop | Purpose |
|---|---|
| `onClickPrestasi?` | Called when Slot 1 is tapped (only if a prestasi photo exists) |
| `onClickTerbaru?` | Called when Slot 2 is tapped (only if a terbaru photo exists) |
| `onClickAdd?` | Called when Slot 3 is tapped; omit to make slot non-interactive |

All callbacks are optional — callers that don't provide them get a purely visual (non-interactive) strip.

#### Gallery strip — 3 slots

| Slot | Content | Placeholder | Click behaviour |
|---|---|---|---|
| **1 — Prestasi** | Latest `FotoPrestasiRecord` thumbnail | 🏆 + "PRESTASI" label | Calls `onClickPrestasi` if photo exists |
| **2 — Terbaru** | Latest `FotoTerbaruRecord` thumbnail | 📷 + "TERBARU" label | Calls `onClickTerbaru` if photo exists |
| **3 — Add / Gallery** | `+` button with `+N` overflow badge (non-archived) · `🗂️` icon (archived) | *(slot always renders)* | Calls `onClickAdd` if provided |

- Strip height preserved: `flex: 1` + `aspectRatio: '1'` per slot, `gap: 5` — identical proportions to approved template.
- `+N` badge on Slot 3 shows `totalPhotos − 2` (photos beyond what slots 1 & 2 display).
- Archived animals: Slot 3 renders the read-only `🗂️` icon; the "+" and dashed border are suppressed.
- The photo count bar (`📷 N FOTO`) below the strip is unchanged and stays.
- The separate "+" button that was previously appended to the count row has been removed (superseded by Slot 3).

---

### 2. `src/components/KtpFullscreenViewer.tsx`

Wired the three slot callbacks so the KTP card is interactive when viewed at full scale.

#### New imports
- `useNavigate` from `react-router-dom`
- `FotoViewer`, `type FotoViewerPhoto` from `./FotoViewer`
- `getFotoPrestasiList`, `getFotoTerbaruList` from `../data/livestockFotoData`

#### New state
- `photoViewer: { photos: FotoViewerPhoto[]; startIndex: number } | null` — drives the `FotoViewer` overlay.

#### Handler: `handleClickPrestasi` (Slot 1)
Reads `getFotoPrestasiList(lv.id)` and opens `FotoViewer` in **read-only** mode, showing all prestasi photos starting from the latest.

#### Handler: `handleClickTerbaru` (Slot 2)
Reads `getFotoTerbaruList(lv.id)` and opens `FotoViewer` in **read-only** mode, showing all terbaru photos starting from the latest.

#### Handler: `handleClickAdd` (Slot 3 — non-archived only)
Calls `onClose()` then `navigate(\`/livestock/${lv.id}/foto/riwayat\`)`, opening the Photo Management page for the animal.

#### Props passed to `KtpOfficialCard`
```tsx
<KtpOfficialCard
  lv={lv}
  isArchived={isArchived}
  onClickPrestasi={handleClickPrestasi}
  onClickTerbaru={handleClickTerbaru}
  onClickAdd={isArchived ? undefined : handleClickAdd}
/>
```
Archived animals: `onClickAdd` is `undefined` → Slot 3 renders read-only `🗂️`, no navigation.

#### Hint bar
Updated hint text to include "Ketuk foto untuk melihat" so users discover the gallery interaction.

#### FotoViewer overlay
Rendered as a sibling at the bottom of the fullscreen viewer JSX; its z-index stacks above the viewer automatically via the document paint order.

---

## Audit History Preservation

No writes to any photo store were introduced. All photo display paths are read-only:
- `getFotoPrestasiList()` / `getFotoTerbaruList()` / `getFotoIdentitas()` / `getPhotoCount()` — all read-only getters.
- `FotoViewer` is always opened with `isReadOnly` flag inside the fullscreen viewer.
- The `onDelete` callback is never passed to `FotoViewer` from this component.
- The audit trail (`FOTO_HISTORY_LOG`) is append-only by design in `livestockFotoData.ts` and is untouched here.

---

## Behavior Matrix

| Context | Slot 1 tap | Slot 2 tap | Slot 3 tap |
|---|---|---|---|
| KTP preview card (profile page, pointer-events: none) | *(no interaction)* | *(no interaction)* | *(no interaction)* |
| KTP fullscreen viewer — non-archived, photo exists | Opens FotoViewer (Prestasi, read-only) | Opens FotoViewer (Terbaru, read-only) | Closes viewer → navigates to Foto Riwayat |
| KTP fullscreen viewer — non-archived, no photo | *(placeholder, no click)* | *(placeholder, no click)* | Closes viewer → navigates to Foto Riwayat |
| KTP fullscreen viewer — **Arsip** | Opens FotoViewer if photo exists | Opens FotoViewer if photo exists | 🗂️ icon, non-interactive |
| Off-screen PDF capture element | *(pointer-events irrelevant)* | *(pointer-events irrelevant)* | *(pointer-events irrelevant)* |

---

## Verification

- `npx tsc --noEmit` → **0 errors**
- Vite HMR applied to both changed files with no runtime errors in browser console
- No unrelated files modified
