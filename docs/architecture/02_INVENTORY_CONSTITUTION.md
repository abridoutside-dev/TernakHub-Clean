# Inventory Module Constitution

Status: **Ratified** — this document is the implementation standard for every inventory-domain module. It documents the architecture already agreed and in use; it does not introduce new architecture. It governs:

- Master Pakan
- Produk Komersial Pakan
- Stock Pakan
- Master Obat
- Produk Komersial Obat
- Stock Obat

Future inventory modules must also follow this constitution.

This document sits under the [Project Constitution](00_PROJECT_CONSTITUTION.md) and inherits all of its rules.

---

# Inventory Architecture

Inventory consists of three layers:

```
Reference Layer
  ↓
Stock Layer
  ↓
Transaction Layer
```

---

# Reference Layer

The Reference Layer contains:

- Master
- Produk Komersial

Purpose: reference database only. It is **never** used directly in transactions.

## Master

Master is the Single Source of Truth. It contains:

- Nutrition reference
- Medicine reference
- Technical reference

Master **never**:

- Creates stock
- Reduces stock
- Becomes a transaction source

## Produk Komersial

Commercial Product is reference only. It contains:

- Brand
- Product
- Packaging
- Commercial information

Commercial Product **never**:

- Creates stock
- Reduces stock
- Becomes a transaction source

---

# Stock

Stock is the **only** transaction source. Every outgoing transaction must use Stock.

Examples:

```
Feeding
  ↓
Stock Feed
```

```
Treatment
  ↓
Stock Medicine
```

Never consume directly from Master or Commercial Product.

---

# Relationship

Stock may reference:

- Master UUID
- Commercial Product UUID
- Formula UUID (optional)

Transactions always use the Stock UUID.

---

# Transaction

Every inventory transaction:

- Uses Stock
- Creates History
- Uses Atomic Transaction
- Supports Rollback

No partial transaction is ever persisted.

---

# History

History is immutable:

- No Edit
- No Delete

Order is always:

```
Newest
  ↓
Oldest
```

---

# UUID

Reuse the existing UUID strategy. Never redesign UUID.

---

# Media

Use the Global Media UUID pattern.

---

# Search

Reuse the existing Search component.

---

# Summary

Reuse existing Summary cards.

---

# Dashboard

Dashboard is **read only**.

---

# AI

AI reads:

- Stock
- History
- Reference

AI **never**:

- Creates stock
- Reduces stock
- Creates a transaction

Rule-based.

---

# Replit Agent Rules

Reuse:

- Components
- Services
- Hooks
- Validators
- Models
- Utilities

Do **not**:

- Duplicate inventory logic
- Recreate stock service
- Recreate history service
- Redesign architecture
- Scan the whole project repeatedly

Only extend existing implementation.
