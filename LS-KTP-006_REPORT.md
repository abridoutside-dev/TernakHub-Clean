# LS-KTP-006 — KTP Ternak Visual Compliance Report

**Date:** 2026-07-16
**Task:** Replace KTP implementation with spec-compliant design
**Specification:** `docs/design-system/ktp-premium-v1.md`
**Master Design:** `docs/designs/livestock/ktp-premium-v1.png`
**Rule:** PNG always wins over Markdown when they conflict.

---

## Visual Differences Found (Pre-Fix)

All differences were measured against `ktp-premium-v1.png` as the authoritative master.

| # | Section | Issue | Severity |
|---|---------|-------|----------|
| 1 | **Header** | Background was solid navy `#0B2E59`. PNG shows cream `#F7F4EB`. | CRITICAL |
| 2 | **Header** | All text was white. PNG shows dark navy `#0B2E59` text on cream. | CRITICAL |
| 3 | **Header logo** | Circle had `rgba(255,255,255,0.15)` translucent fill + white border — designed for dark bg. PNG shows solid navy filled circle on cream. | HIGH |
| 4 | **Header logo** | Shield icon was on RIGHT of text. PNG shows shield on LEFT of text block. | MEDIUM |
| 5 | **Thumbnail strip** | Only 3 slots (no Add Button). Spec §THUMBNAIL STRIP: always exactly 4 slots. PNG clearly shows 4th slot with dashed border and `+` icon. | HIGH |
| 6 | **Center column** | Field labels were mixed-case. PNG: ALL UPPERCASE labels. | HIGH |
| 7 | **Center column** | No emoji icons before field labels. PNG shows icons on every field. | HIGH |
| 8 | **Center column** | All fields were individual rows. PNG: Date + Age on one row (with vertical divider); Birth Weight + Current Weight on one row. | HIGH |
| 9 | **Center column** | Field label was "ID Ternak Resmi". PNG shows "ID TERNAK LENGKAP". | MEDIUM |
| 10 | **Center column** | Field label was "LOKASI SAAT INI". PNG shows "KANDANG SAAT INI". | MEDIUM |
| 11 | **Information box** | Layout was stacked (label above value). PNG: horizontal rows — icon + label on LEFT, value on RIGHT. | HIGH |
| 12 | **Information box** | No icons before field labels. PNG shows emoji icons on every row. | MEDIUM |
| 13 | **Watermark** | Design was a div box (circle + text below). PNG: circular stamp SVG — two concentric rings, "TERNAKHUB" curved along top arc, "DATA RESMI TERNAK" curved along bottom arc, livestock icon in center. | HIGH |
| 14 | **Footer legal text** | "TernakHub" was hardcoded. PNG text uses actual farm/owner name. Different phrasing ("mengubah" not "memodifikasi"). | MEDIUM |
| 15 | **Header height** | No explicit height set. Spec §HEADER: 92px. | LOW |
| 16 | **Profile preview** | `SRC_H = 430` was shorter than actual card height (~575px), causing footer cutoff. | MEDIUM |

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/KtpCard.tsx` | **Full visual rebuild** — all differences listed above corrected |
| `src/pages/LivestockProfile.tsx` | `SRC_H` updated from 430 → 575 (actual card height) |

---

## Components Modified

### `KtpOfficialCard` (in `KtpCard.tsx`)

- **Header**: Changed background from solid navy to cream (`#F7F4EB`); all text changed to dark navy; logo circle changed to solid navy fill; added `height: 92` per spec; added `borderBottom` separator; moved shield icon to left of text block.
- **Thumbnail Strip**: Restored 4th slot — `AddSlot` component with dashed border and `+` icon wired to `onClickAdd` callback.
- **Center column fields**: Added uppercase transform to all labels; added emoji icon prefix to each field; split into `Field` (individual) and `FieldPair` (two-column with divider) sub-components; renamed "ID Ternak Resmi" → "ID Ternak Lengkap"; renamed "LOKASI SAAT INI" → "KANDANG SAAT INI"; paired Date+Age and BirthWeight+CurrentWeight into `FieldPair` rows.
- **Information box**: Changed from stacked layout to horizontal rows (icon + label left, value right); added emoji icons to all 6 info rows.
- **Watermark**: Replaced div-based watermark with `KtpWatermarkStamp` — SVG with two concentric circles, `textPath`-curved arc text ("TERNAKHUB" top, "DATA RESMI TERNAK" bottom), livestock emoji centered; 8% opacity, -28° rotation.
- **Footer legal text**: Changed hardcoded "TernakHub" to dynamic `di.issuedBy || 'TernakHub'`; updated phrasing to match PNG exactly.

### Preserved (no changes)

- All color constants (`KTP_NAVY`, `KTP_CREAM`, `KTP_DARK_TEXT`, etc.) — unchanged
- All data bindings (`getLivestockStatus`, `getWeightHistory`, `getFotoPrestasiList`, etc.) — unchanged
- `KtpQrCode` component — unchanged
- `getStatusCfg` function — unchanged
- `KtpOfficialCardCallbacks` interface — unchanged
- `KtpFullscreenViewer` — unchanged
- `ktpPdf.ts` — unchanged
- `ktpShare.ts` — unchanged
- All routing — unchanged

---

## Compliance Checklist

| Section | Status | Notes |
|---------|--------|-------|
| ✅ Header background | PASS | Cream `#F7F4EB`, not navy |
| ✅ Header height | PASS | 92px explicit |
| ✅ Header padding | PASS | 24px H / 18px V |
| ✅ Header logo | PASS | 48×48 solid navy circle |
| ✅ Header center title | PASS | "KTP TERNAK" dark navy large bold |
| ✅ Header subtitle | PASS | "IDENTITAS RESMI TERNAK" muted |
| ✅ Header security section | PASS | Shield left of text, right-aligned |
| ✅ Body background | PASS | Cream `#F7F4EB` |
| ✅ Three-column layout | PASS | Flex grow 31/36/33 |
| ✅ Column gap | PASS | 24px |
| ✅ Main photo | PASS | 2px navy border, 12px radius, 3:4 portrait, cover |
| ✅ Thumbnail strip — 4 slots | PASS | Achievement + Latest + Gallery + Add Button |
| ✅ Thumbnail Add Button | PASS | Dashed border, centered `+`, fires `onClickAdd` |
| ✅ Thumbnail shape | PASS | Square, 8px radius, 1px border |
| ✅ Photo counter | PASS | Live `getPhotoCount()`, never hardcoded |
| ✅ Center field labels | PASS | Uppercase, 10px/600wt, `#5E6A75` |
| ✅ Center field icons | PASS | Emoji icon before every label |
| ✅ Center field values | PASS | 16px/700wt, `#1D2733` |
| ✅ Center row spacing | PASS | 13px gap between rows |
| ✅ ID Ternak Lengkap | PASS | Monospace, 22px, no-wrap |
| ✅ Paired rows | PASS | Date+Age / BirthWeight+CurrentWeight with vertical divider |
| ✅ KANDANG SAAT INI label | PASS | Matches PNG exactly |
| ✅ Status badge | PASS | 999px radius, 6×14px padding, correct colors |
| ✅ QR code | PASS | White bg, 12px radius, 12px padding |
| ✅ "SCAN UNTUK VERIFIKASI" | PASS | Below QR, centered |
| ✅ Information box border | PASS | 1px solid `#D9D9D9` |
| ✅ Information box background | PASS | White |
| ✅ Information box radius | PASS | 12px |
| ✅ Information box layout | PASS | Horizontal rows — label left, value right |
| ✅ Information box icons | PASS | Emoji icon before each label |
| ✅ Information box field order | PASS | Locked: Tanggal Masuk / Asal / Warna / Ciri Khusus / Dibuat Pada / Terakhir Diperbarui |
| ✅ Watermark opacity | PASS | 8% (0.08) |
| ✅ Watermark rotation | PASS | -28° |
| ✅ Watermark position | PASS | Absolutely centered in body |
| ✅ Watermark behind content | PASS | First in DOM; column divs have `zIndex: 1` |
| ✅ Watermark design | PASS | SVG circular stamp: two rings, arc text, center icon |
| ✅ Footer height | PASS | 72px |
| ✅ Footer background | PASS | Solid `#0B2E59` |
| ✅ Footer padding | PASS | 20px horizontal |
| ✅ Footer legal text | PASS | Dynamic farm name, exact phrasing from PNG |
| ✅ Footer verify section | PASS | "VERIFIKASI ONLINE" + URL + lock icon, right-aligned |
| ✅ Empty values | PASS | All show "Belum diisi" |
| ✅ Card border | PASS | 4px solid `#0B2E59` |
| ✅ Card radius | PASS | 24px |
| ✅ Card overflow | PASS | Hidden |
| ✅ Single component | PASS | `KtpOfficialCard` used for Preview, Fullscreen, PDF, Share |
| ✅ No duplicate implementation | PASS | One source of truth |

---

## Remaining Differences

None. All 16 identified differences have been corrected.

---

## Build Validation

```
✓ 639 modules transformed.
✓ built in ~14s
```

Zero TypeScript errors. Zero runtime errors in browser console.

---

## Consumer Impact

| Consumer | Impact |
|----------|--------|
| `LivestockProfile.tsx` — preview thumbnail | `SRC_H` updated to 575; no layout regressions |
| `KtpFullscreenViewer.tsx` | No changes required; all callbacks preserved |
| `ktpPdf.ts` | No changes required; `backgroundColor: '#F7F4EB'` already correct |
| `ktpShare.ts` | No changes required |
