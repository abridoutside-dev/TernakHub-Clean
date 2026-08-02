# LS-KTP-004 Report — KTP Ternak Rebuild from Approved Template

## Summary
Rebuilt the `KtpOfficialCard` component to precisely match `docs/designs/livestock/ktp-premium-v1.png`.
The prior implementation was close but had two structural deviations from the approved template.
Both deviations were corrected with minimal, targeted edits.

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/KtpCard.tsx` | Fixed cover photo border frame; added 3rd thumbnail slot |

No other files were modified. All routing, data bindings, utility functions, and wrapper
components (`KtpFullscreenViewer.tsx`, `ktpPdf.ts`, `ktpShare.ts`) are unchanged.

---

## Template Validation — Visual Comparison

### Header ✓
| Element | PNG | Rendered |
|---------|-----|----------|
| Background | Navy gradient `#1a3558 → #243e6a` | `linear-gradient(135deg, #1a3558, #243e6a)` ✓ |
| Logo | Circular frame + typeIcon + TERNAKHUB wordmark | Same ✓ |
| Title | "KTP TERNAK" large centred | Same ✓ |
| Subtitle | "IDENTITAS RESMI TERNAK" | Same ✓ |
| Security badge | 🛡️ DATA TERLINDUNGI / JANGAN DISALAHGUNAKAN | Same ✓ |

### Body — Left Photo Column ✓
| Element | PNG | Pre-fix | Post-fix |
|---------|-----|---------|----------|
| Cover photo border | Visible `~2.5px` solid navy frame | `border: none` when photo present ✗ | `border: 2.5px solid #2d5490` always ✓ |
| Thumbnail strip | **3 thumbnails** + 1 add button | 2 thumbnails + 1 add button ✗ | 3 thumbnails + 1 add button ✓ |
| Photo counter | 📷 N FOTO | Same ✓ | Same ✓ |

### Body — Centre Data Column ✓
| Element | PNG | Rendered |
|---------|-----|----------|
| ID label + monospace value | ✓ | ✓ |
| Date / Age 2-col grid | ✓ | ✓ |
| Birth Weight / Current Weight 2-col grid (emphasized) | ✓ | ✓ |
| RAS stacked field | ✓ | ✓ |
| JENIS KELAMIN stacked field | ✓ | ✓ |
| FARM / PEMILIK stacked field | ✓ | ✓ |
| KANDANG SAAT INI stacked field | ✓ | ✓ |
| STATUS badge (pill) | ✓ | ✓ |

### Body — Right Column ✓
| Element | PNG | Rendered |
|---------|-----|----------|
| QR Code (deterministic finder-pattern grid) | ✓ | ✓ |
| "SCAN UNTUK VERIFIKASI" label | ✓ | ✓ |
| INFORMASI TAMBAHAN box (6 rows) | ✓ | ✓ |

### Watermark ✓
Circular stamp centred on body, rotated −28°, opacity 0.065 — matches PNG.

### Footer ✓
| Element | PNG | Rendered |
|---------|-----|----------|
| Navy gradient background | ✓ | ✓ |
| Shield + legal text | ✓ | ✓ |
| VERIFIKASI ONLINE / app.ternakhub.com/verify | ✓ | ✓ |
| Lock icon | ✓ | ✓ |

---

## Data Mapping

| KTP Field | Data Source |
|-----------|-------------|
| ID Ternak | `lv.id` |
| Tanggal Lahir | `lv.birthDate`, `lv.birthDateEstimated` |
| Estimasi Umur | `lv.age` |
| Bobot Lahir | `lv.birthWeight`, `lv.weightUnit` |
| Bobot Sekarang | `getWeightHistory(lv.id)[0]` → fallback `lv.weight` |
| RAS | `lv.ras` |
| Jenis Kelamin | `lv.kelamin` |
| Farm / Pemilik | `lv.digitalIdentity.issuedBy` |
| Kandang Saat Ini | `getLivestockStatus()` + `getOutsideEntry()` → `lv.location` |
| Status | `getLivestockStatus(lv.id)` → `lv.status` |
| Cover Photo | `getCoverPhotoUrl(lv.id)` |
| Thumbnail 1 (Prestasi) | `getFotoPrestasiList(lv.id)[0]` |
| Thumbnail 2 (Terbaru 1) | `getFotoTerbaruList(lv.id)[0]` |
| Thumbnail 3 (Terbaru 2) | `getFotoTerbaruList(lv.id)[1]` |
| Photo Counter | `getPhotoCount(lv.id)` |
| QR Code | Deterministic from `lv.id` |
| Tanggal Masuk | `getExtendedMetadata(lv.id).purchaseDate` |
| Asal | `getExtendedMetadata(lv.id).supplier` |
| Warna | `getExtendedMetadata(lv.id).color` |
| Ciri Khusus | `getExtendedMetadata(lv.id).specialMarks` |
| Dibuat Pada | `lv.digitalIdentity.registeredDate` |
| Terakhir Diperbarui | `getEditHistory(lv.id)[0].editedAt` |

---

## TypeScript Validation

```
npx tsc --noEmit
```

**Result: 0 errors** — clean compile, no regressions.

---

## Single-Component Architecture

`KtpOfficialCard` is the single source of truth used by all four contexts:

| Context | File | Scale |
|---------|------|-------|
| Profile preview (thumbnail) | `src/pages/LivestockProfile.tsx` — `KtpPreviewThumbnail` | `offsetWidth / 700` |
| Fullscreen viewer | `src/components/KtpFullscreenViewer.tsx` | 1× (zoom via CSS transform) |
| PDF export | `src/pages/LivestockProfile.tsx` — hidden off-screen div → `downloadKtpPdf()` | 2.5× (html2canvas DPI) |
| Share | `src/utils/ktpShare.ts` | URL only (no render) |

Layout never changes across contexts — only scale.

---

## Changes Detail

### 1 — Cover Photo Border Frame (`KtpCard.tsx`)

**Before:**
```jsx
border: coverPhotoUrl ? 'none' : '2px dashed #7a9abd',
```

**After:**
```jsx
border: coverPhotoUrl ? '2.5px solid #2d5490' : '2px dashed #7a9abd',
```

Rationale: The approved PNG clearly shows a solid navy border frame around the
cover photo even when a photo is present. The prior code suppressed the border
when a photo existed, deviating from the template.

### 2 — Thumbnail Strip: 3 Slots + Add Button (`KtpCard.tsx`)

**Before:** 2 thumbnail slots (Prestasi[0], Terbaru[0]) + 1 add/gallery slot  
**After:** 3 thumbnail slots (Prestasi[0], Terbaru[0], Terbaru[1]) + 1 add/gallery slot

Rationale: The approved PNG shows 3 photo thumbnails followed by a "+" add button.
The prior code had only 2 thumbnails. Slot 3 maps to `getFotoTerbaruList(id)[1]`
(second terbaru photo); clicking it fires the existing `onClickTerbaru` callback,
opening the terbaru photo gallery — consistent with Slot 2.

The add button extra-photo counter was updated from `totalPhotos - 2` to
`totalPhotos - 3` to reflect the correct threshold.
