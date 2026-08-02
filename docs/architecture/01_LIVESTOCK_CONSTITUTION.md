# Livestock Module Constitution

Status: **Ratified** — this document is the implementation standard for every Livestock-domain module. It documents the architecture already agreed and in use; it does not introduce new architecture. It governs:

- Livestock
- Catat Bobot
- Kesehatan Hewan
- Pemberian Pakan
- Reproduksi
- Mutasi
- Batch
- Profil Ternak
- Edit Data Ternak

This document sits under the [Project Constitution](00_PROJECT_CONSTITUTION.md) and inherits all of its rules.

---

# Livestock Module Architecture

## Standard Layout

Every Livestock module follows the same top-to-bottom composition:

```
Header
  ↓
AI Insight
  ↓
Summary
  ↓
Mode
  ↓
Search & Filter
  ↓
Main Content
  ↓
History
```

## Mode

Every module that lists livestock supports two modes:

- **Individual**
- **Batch**

Mode switching reuses the existing Individual/Batch implementation pattern — it is not re-implemented per module.

## Search & Filter

Search & Filter reuses the existing implementation pattern and supports:

- Search
- Location
- Batch
- Status

## Summary

Summary reuses the existing Summary Card component.

## Timeline

Timeline order is always:

```
Newest
  ↓
Oldest
```

Timelines are **read only**.

## History

History is **immutable**:

- No Edit
- No Delete

## Dashboard

Any Livestock-domain dashboard is **read only**.

## AI Insight

- Reuses the existing AI Insight component.
- Rule-based.
- Never changes data.
- Never creates a transaction.

## Attachment

Supported attachment types:

- Image
- Document

Video is **not** supported.

## Global Media

All media references use the Global Media UUID pattern — media is never embedded directly.

## UUID

Reuse the existing UUID strategy. Do not introduce a parallel identifier scheme.

## Audit

Every Livestock roadmap item ends with the same sequence:

```
Audit
  ↓
Final Review
  ↓
Pull Request
  ↓
Merge
```

---

# Replit Agent Rules

Before implementing any Livestock roadmap item:

1. Read this Constitution.
2. Reuse:
   - Components
   - Services
   - Hooks
   - Validators
   - Utilities
   - Existing patterns

Do **not**:

- Redesign folders
- Duplicate code
- Recreate existing components
- Scan the whole project repeatedly

Only implement the requested roadmap item — nothing outside its scope.
