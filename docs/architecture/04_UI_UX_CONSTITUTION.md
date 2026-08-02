# UI/UX Constitution

Status: **Ratified** — this document is the implementation standard for every screen, page, and module across TernakHub. It documents the architecture already agreed and in use; it does not introduce new UI architecture. It applies to:

- Livestock
- Inventory
- Marketplace
- Future modules

This document sits under the [Project Constitution](00_PROJECT_CONSTITUTION.md) and inherits all of its rules.

---

# General Layout

Standard page layout:

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

---

# Header

Reuse the existing Header pattern. Do not redesign.

---

# AI Insight

Positioned below the Header. Maximum of 3 cards.

---

# Summary

Reuse the existing Summary Card.

---

# Mode

Support:

- Individual
- Batch

---

# Search & Filter

Reuse existing components.

---

# Main Content

- Use Cards.
- Responsive.
- Consistent spacing.

---

# Timeline

Order is always:

```
Newest
  ↓
Oldest
```

---

# Empty State

Every module must have:

- Illustration
- Description
- Primary Action

---

# Detail Page

Readability first. Information is grouped.

---

# Dashboard

Dashboard is **read only**.

---

# Media

Images only. Video is not supported.

---

# Replit Agent Rules

- Reuse existing UI components.
- Never redesign UI.
- Never duplicate components.
