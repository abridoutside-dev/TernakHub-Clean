# LS-EDIT-001 — Edit Livestock Report

**Date:** July 16, 2026  
**Status:** IMPLEMENTED  

---

## Overview

Implemented a full **Edit Livestock** page at `/livestock/:id/edit` and the supporting data layer for extended metadata and edit history. Every editable attribute of a livestock record can now be updated safely, with an immutable audit trail and instant UI refresh.

---

## Files Created

| File | Purpose |
|------|---------|
| `src/data/livestockEditData.ts` | Data layer: extended metadata store, edit history log, `updateLivestock()` write function |
| `src/pages/EditLivestock.tsx` | Full edit page (form, validation, archive guard, history viewer) |
| `docs/LS-EDIT-001_REPORT.md` | This report |

## Files Modified

| File | Change |
|------|--------|
| `src/App.tsx` | Added `EditLivestock` import; replaced Placeholder route; added `hideNav: true` to edit route meta |

---

## Architecture

### Why two data stores instead of extending `LivestockRecord`

`LivestockRecord` was intentionally left unchanged (per the architecture constraint). New optional fields — ear tag, internal code, color, horn, tail, marks, purchase info — live in a separate `EXTENDED_METADATA_DB` keyed by livestock ID. This mirrors the `livestockFotoData.ts` precedent exactly.

Core fields that already exist on `LivestockRecord` (name, ras, kelamin, birthDate, program, status, location, type) are patched directly onto `LIVESTOCK_DB[id]` via the single write path `updateLivestock()`.

### Edit history

`EDIT_HISTORY_DB` stores an append-only array of `LivestockEditRecord` per livestock ID. Records are never deleted or mutated. Every `updateLivestock()` call appends one record, even for no-op saves (so you can see that a save happened, even with no field changes).

Both stores are persisted to `localStorage` with `try/catch` quota guards.

### Species change cascade

When the user changes the species (Jenis Ternak), `typeIcon`, `typeColor`, and `typeBg` are derived from an inline `SPECIES_VISUALS` map (mirrors the factory master without importing dev-only code) and applied to `LIVESTOCK_DB` in the same atomic patch.

### Birth date age recompute

When `birthDate` changes, `computeAge()` derives `age` (Indonesian label) and `ageMonths` and patches them into `LIVESTOCK_DB` in the same write, keeping them in sync.

### Batch changes

Batch changes go through the existing `addBatchMember` / `removeBatchMember` APIs from `batchData.ts`, not through `updateLivestock()`. The batch section shows the current active batch and allows add, remove, or swap in one save action.

---

## Editable Fields

### Section 1 — Identitas
| Field | Source | DB |
|-------|--------|----|
| Nama | `LivestockRecord.name` | `LIVESTOCK_DB` |
| Tag Telinga (Ear Tag) | `LivestockExtendedMetadata.earTag` | `EXTENDED_METADATA_DB` |
| Kode Internal | `LivestockExtendedMetadata.internalCode` | `EXTENDED_METADATA_DB` |
| Catatan | `LivestockExtendedMetadata.notes` | `EXTENDED_METADATA_DB` |

### Section 2 — Klasifikasi
| Field | Source | DB |
|-------|--------|----|
| Jenis Ternak (species) | `LivestockRecord.type` + cascade | `LIVESTOCK_DB` |
| Ras | `LivestockRecord.ras` | `LIVESTOCK_DB` |
| Kategori Ras | `LivestockExtendedMetadata.breedCategory` | `EXTENDED_METADATA_DB` |
| Jenis Kelamin | `LivestockRecord.kelamin` | `LIVESTOCK_DB` |
| Program | `LivestockRecord.program` | `LIVESTOCK_DB` |

### Section 3 — Kelahiran
| Field | Source | DB |
|-------|--------|----|
| Tanggal Lahir | `LivestockRecord.birthDate` + age recompute | `LIVESTOCK_DB` |
| Perkiraan Tanggal Lahir | `LivestockRecord.birthDateEstimated` | `LIVESTOCK_DB` |
| Berat Lahir | `LivestockRecord.birthWeight` | `LIVESTOCK_DB` |

### Section 4 — Ciri Fisik
| Field | Source | DB |
|-------|--------|----|
| Warna Tubuh | `LivestockExtendedMetadata.color` | `EXTENDED_METADATA_DB` |
| Tanduk | `LivestockExtendedMetadata.horn` | `EXTENDED_METADATA_DB` |
| Ekor | `LivestockExtendedMetadata.tail` | `EXTENDED_METADATA_DB` |
| Tanda Khusus | `LivestockExtendedMetadata.specialMarks` | `EXTENDED_METADATA_DB` |

### Section 5 — Lokasi & Kandang
| Field | Source | DB |
|-------|--------|----|
| Lokasi Kandang (free text) | `LivestockRecord.location` | `LIVESTOCK_DB` |

### Section 6 — Informasi Pembelian
| Field | Source | DB |
|-------|--------|----|
| Pemasok / Penjual | `LivestockExtendedMetadata.supplier` | `EXTENDED_METADATA_DB` |
| Tanggal Pembelian | `LivestockExtendedMetadata.purchaseDate` | `EXTENDED_METADATA_DB` |
| Harga Beli | `LivestockExtendedMetadata.purchasePrice` | `EXTENDED_METADATA_DB` |

### Section 7 — Batch / Kelompok
Managed through `addBatchMember` / `removeBatchMember` (batchData.ts). Current active batch shown read-only; picker lets user add, swap, or remove in one save.

### Section 8 — Status Kesehatan
| Field | Source | DB |
|-------|--------|----|
| Status | `LivestockRecord.status` | `LIVESTOCK_DB` |

Ownership info (from `getOwnershipHistory`) is shown **read-only** — actual ownership changes go through the Mutasi / Transfer module.

---

## Constraints Honoured

| Constraint | How |
|------------|-----|
| Archived animals are read-only | Archive guard renders info-only view; form never mounts |
| Livestock UUID is immutable | ID field shown as `readOnly` input; never passed to `updateLivestock` |
| Weight/health/feeding history not editable here | Only `LivestockRecord` core fields and `EXTENDED_METADATA_DB` are written |
| No modification to KTP / Photo Management | `LivestockProfile`, `KtpCard`, `FotoViewer`, `FotoHistory` untouched |
| No modification to Livestock Architecture | `LivestockRecord` type unchanged; all new fields in separate DB |
| Batch API unchanged | Uses existing `addBatchMember`/`removeBatchMember` |

---

## UX Features

- **Unsaved-changes warning** — `beforeunload` event prevents accidental navigation away; Cancel button shows a confirm dialog if `isDirty`
- **Validation** — inline error messages per field; form blocks save until all errors are resolved
- **Success feedback** — green banner on save + auto-navigate back to profile after 1.5 s
- **Error feedback** — red banner with caught error message; form remains editable
- **Dirty banner** — yellow reminder bar when form has unsaved changes
- **Luar Kandang notice** — context banner in location section explaining that edits to location apply on return
- **Edit history** — collapsible timeline at page bottom showing all past edits with before/after diffs per field
- **Archive read-only view** — full summary of frozen data + edit history, with back button

---

## Public API (livestockEditData.ts)

```typescript
// Reads
getExtendedMetadata(id: string): LivestockExtendedMetadata
getEditHistory(id: string): LivestockEditRecord[]
getEditCount(id: string): number
computeAge(birthDateStr: string): { age: string; ageMonths: number }
getSpeciesVisualForEdit(species: string): { color: string; bg: string }

// Write (single path for all livestock edits)
updateLivestock(
  id: string,
  core: CoreLivestockUpdate,
  extended: ExtendedUpdate,
  editedBy: string,
  reason: string | null,
): LivestockEditRecord
```

---

## Validation Rules

| Field | Rule |
|-------|------|
| Jenis Ternak | Required |
| Ras | Required (free text for Kerbau/Kuda/Babi) |
| Jenis Kelamin | Required |
| Program | Required |
| Status Kesehatan | Required |
| Tanggal Lahir | Valid date, not in future |
| Berat Lahir | Positive number if provided |
| Harga Beli | Digits only; non-negative |
| Tanggal Pembelian | Valid date if provided |
| Nama | Max 60 characters |
| Tag Telinga | Max 30 characters |
| Kode Internal | Max 30 characters |
| Lokasi | Max 100 characters |

---

## No Regressions

- `LivestockRecord` type: **unchanged**
- `LIVESTOCK_DB` write pattern: consistent with `addWeightRecord`, `performReturn`, `applyMutationLocationEffect`
- `batchData.ts`: **not modified**
- `transferData.ts`: **not modified**
- `livestockFotoData.ts`: **not modified**
- `KtpCard.tsx`, `LivestockProfile.tsx`, `FotoViewer.tsx`, `FotoHistory.tsx`: **not modified**
