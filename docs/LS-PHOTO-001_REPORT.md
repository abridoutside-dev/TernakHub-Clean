# LS-PHOTO-001 — Livestock Photo Management System

**Status:** ✅ COMPLETE  
**Date:** 2026-07-16  
**Scope:** Photo upload, storage, viewing, deletion, and audit trail for all livestock profiles in TernakHub.

---

## Summary

Adds a full-featured photo management system to livestock profiles without touching KTP (`KtpCard.tsx`), Edit Livestock, or any existing architecture. Photos are stored as resized base64 data URLs in localStorage via a dedicated, isolated data layer.

---

## Files Created

### `src/data/livestockFotoData.ts` (~240 lines)
The complete photo data layer. All state lives in this module — nothing was added to `LivestockRecord`.

**Types:**
- `FotoIdentitasRecord` — current identity photo (most-recent wins; replaced entries shift into history)
- `FotoPrestasiRecord` — achievement photos with `achievementDate` + `description`
- `FotoTerbaruRecord` — recent-condition snapshots
- `FotoHistoryEntry` — immutable audit event (append-only)

**Storage:** `LIVESTOCK_FOTO_DB` (module-level Map) + two localStorage keys per record (`livestockFoto_${id}` and `livestockFotoHistory_${id}`). Uses the same `safeLoad`/`safeSave` pattern (try/catch on quota errors) as `livestockData.ts`.

**Utilities:**
- `resizeImageForStorage(dataUrl)` — canvas-based resize to max 1400×1400 px, JPEG 0.82 quality
- `readFileAsDataUrl(file)` — FileReader Promise wrapper

**CRUD:**
| Function | Behaviour |
|---|---|
| `getFotoIdentitas(id)` | Returns current identity photo or `null` |
| `setFotoIdentitas(id, url, by, reason)` | Prepend new entry; old entries shift — never deleted; logs `identitas_diatur` / `identitas_diganti` |
| `getFotoPrestasiList(id)` | Returns non-deleted prestasi, newest first |
| `addFotoPrestasi(id, url, date, desc, by)` | Append; logs `prestasi_ditambah` |
| `deleteFotoPrestasi(id, photoId, by)` | Soft-delete (`deleted: true`); logs `prestasi_dihapus` |
| `getFotoTerbaruList(id)` | Returns non-deleted terbaru, newest first |
| `addFotoTerbaru(id, url, by)` | Append; logs `terbaru_ditambah` |
| `deleteFotoTerbaru(id, photoId, by)` | Soft-delete; logs `terbaru_dihapus` |
| `getPhotoAuditTrail(id)` | Returns all history events, newest first |
| `getPhotoCount(id)` | Returns `{ identitas, prestasi, terbaru, total }` |
| `__clearFotoData(id?)` | DEV only — wipes store + localStorage |

---

### `src/components/FotoViewer.tsx` (~280 lines)
Full-screen photo viewer overlay.

**Features:**
- Dark overlay, `z-index: 1300` (above all sheets)
- **Swipe navigation** — horizontal swipe (≥48 px delta, <80 px vertical drift) → prev/next photo
- **Pinch-to-zoom** — two-finger pinch updates zoom 0.5×–4×; zoom buttons in toolbar (+/-)
- **Keyboard** — `←` / `→` navigate, `Esc` closes
- **Download** — creates a temporary `<a>` with the data URL and clicks it
- **Share** — Web Share API with File share; clipboard-URL fallback when unavailable
- **Delete** — shows confirm dialog before calling `onDelete(photoId)` callback; hidden when `isReadOnly`
- **Info bar** — type label, date, description, dot-strip navigation indicator
- **Toast** — ephemeral status messages (success / error)
- Tap backdrop → close

**Props:**
```ts
photos: FotoViewerPhoto[]   // { id, url, typeLabel, dateLabel, description? }
startIndex?: number
onClose: () => void
onDelete?: (photoId: string) => void
isReadOnly?: boolean
```

---

### `src/pages/FotoHistory.tsx` (~220 lines)
Immutable photo audit trail.

**Route:** `/livestock/:id/foto/riwayat`  
**Access:** Registered in App.tsx; `resolveMeta` returns `{ title: 'Riwayat Foto', showBack: true, hideNav: true }`.

**Features:**
- Livestock identity header card (species avatar, name, ID, event count badge)
- Immutability notice banner
- Empty state with "Kembali ke Profil" CTA
- Events grouped by calendar date, newest groups first
- Each event shows: icon, label chip, timestamp, uploader, reason/meta, photo thumbnail(s)
- Tap any thumbnail → opens `FotoViewer` (read-only, no delete)
- Replace events show "before photo → new photo" side-by-side

---

## Files Modified

### `src/pages/LivestockProfile.tsx`

**`IdentityPhoto` component** (top-of-profile avatar):
- Reads `getFotoIdentitas(lv.id)` on every render
- If a photo exists: renders `<img>` filling the circular avatar; circle is tappable → opens `FotoViewer` (read-only) for that single photo
- If no photo: renders species emoji as before (no visual change)

**`PhotoGallery` component** (full replacement of the stub):

Three sections with identical archive-awareness (`isArchived` prop blocks all writes):

| Section | Empty state | Add flow | Viewer |
|---|---|---|---|
| **Foto Identitas** | Species emoji + descriptive text | File picker → resize → bottom sheet (optional reason field) → `setFotoIdentitas` | Tappable thumbnail; "Lihat" button |
| **Foto Prestasi** | Dashed "+" tile only | File picker → resize → bottom sheet (date required, description optional) → `addFotoPrestasi` | Horizontal scroll; tap thumbnail at index `i` → viewer starts at `i`; swipe to others |
| **Foto Terbaru** | Dashed "+" tile only | File picker → resize → **direct save** (no form needed) → `addFotoTerbaru` | Same scroll+viewer pattern |

Common patterns:
- Hidden `<input type="file" accept="image/*" capture="environment">` per section, clicked programmatically
- Processing state disables add buttons and shows ⏳ spinner
- Error banner shown inline if `readFileAsDataUrl` or `resizeImageForStorage` throws
- `tick` state counter forces re-read of foto stores after every mutation (same pattern as Batch module)
- Delete button in viewer soft-deletes; viewer auto-closes or moves to next photo
- **"📋 Lihat Riwayat & Audit Foto"** button at bottom navigates to `/livestock/:id/foto/riwayat`
- All add/delete/replace actions hidden when `isArchived === true`

### `src/App.tsx`
- Import: `import FotoHistory from './pages/FotoHistory'`
- Route: `<Route path="/livestock/:id/foto/riwayat" element={<FotoHistory />} />`  
  *(placed before `/livestock/:id/edit` to avoid false prefix matches)*
- `resolveMeta`: added guard for `pathname.endsWith('/foto/riwayat') && pathname.startsWith('/livestock/')` returning `{ title: 'Riwayat Foto', showBack: true, hideNav: true }`

---

## Constraints Honoured

| Constraint | Status |
|---|---|
| KtpCard.tsx not modified | ✅ Untouched |
| Edit Livestock not modified | ✅ Untouched |
| Architecture unchanged | ✅ No new global state, no schema changes to `LivestockRecord` |
| Archive read-only | ✅ All write controls hidden when `getLivestockStatus(id) === 'Arsip'` |
| No backend | ✅ localStorage + canvas resize, pure client |
| `LivestockRecord` unchanged | ✅ Photo data lives entirely in `livestockFotoData.ts` |

---

## Storage Budget Notes

Images are resized to max 1400×1400 px at JPEG 0.82 before storage. A typical livestock photo compresses to ~150–400 KB as a data URL. localStorage quota is browser-dependent (~5–10 MB). The system silently catches `QuotaExceededError` on save but does not deduct a failed write from the in-memory store — future hardening should detect the error and surface it to the user.

---

## Known Limitations / Future Work

1. **Quota error UX** — silent catch; should surface a "Storage penuh" toast when localStorage write fails.
2. **KTP photo slot** — `KtpCard.tsx` still shows the species emoji. Wiring the identity photo into KTP is a separate feature (would require modifying `KtpCard.tsx`, explicitly excluded from this scope).
3. **Marketplace listings** — still use `photoBg` + emoji placeholders; connecting them to `getFotoIdentitas` is future work.
4. **Photo count badge** — `getPhotoCount()` is available but not yet surfaced in the livestock list cards or dashboard.
