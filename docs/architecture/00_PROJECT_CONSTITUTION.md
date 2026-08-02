# TernakHub Project Constitution

Status: **Ratified** — this document is the highest-level architecture reference for TernakHub. Every future roadmap, module, and implementation must conform to it. It documents the architecture and conventions already agreed and in use across the codebase; it does not introduce new architecture.

---

# Project Vision

TernakHub is a mobile-first livestock management application that gives farm operators an honest, evidence-based, single source of truth for their livestock, feed (Pakan), medicine (Obat), reproduction, and commercial product data — with AI assistance that informs decisions without ever acting on the operator's behalf.

---

# Core Principles

- **Honest data** — every number shown in the UI must be derived live from the underlying data registries; no hardcoded or stale summary values.
- **Evidence-based trust** — every record (stock movement, feeding event, medicine use, reproduction event) must be traceable to its source and, where applicable, logged to its module's Riwayat (history) trail.
- **Workspace architecture** — each domain (Livestock, Batch, Stok Pakan, Stok Obat, Produk Komersial, Reproduksi, Kesehatan Hewan, etc.) owns its own data registry and mutation functions; domains compose, they do not reach into each other's internals.
- **Marketplace independence** — Marketplace is a distinct module and does not dictate the internal shape of Livestock, Stok, or other domain data.
- **Modular architecture** — new capability is added as a new module or an additive extension of an existing module's data file, never by collapsing modules together.
- **No unnecessary duplication** — a concept that already has a registry, hook, validator, or utility must be reused, not re-implemented.

---

# Architecture Rules

- Never redesign existing architecture. If an existing pattern (e.g. UUID relations, mutation chokepoints, Riwayat logging) already solves the problem, extend it.
- Extend existing implementation rather than replacing it.
- Reuse components. Reuse services. Reuse hooks. Reuse validators. Reuse utilities.
- Cross-module references use stable identifiers (UUIDs) into the owning module's registry — never copy or fork another module's data.

---

# Development Rules

- One roadmap = one implementation. A roadmap item is implemented as a single coherent unit of work.
- No implementation outside the roadmap. Work not defined in the current roadmap item is out of scope for that change.
- No unrelated refactoring bundled into a roadmap implementation.
- No unnecessary folder creation. New structure is only introduced when the domain genuinely requires it.

---

# UI Rules

- Consistent UI across all modules — shared components (e.g. TopAppBar, BottomNav, SheetShell) are reused rather than re-implemented per module.
- Consistent Dashboard pattern across modules (module-level summary/hub pages follow the same structure).
- Consistent AI Insight presentation across modules that surface AI-derived insight cards.
- Consistent Timeline presentation for any module that shows a chronological history of events.
- Consistent Summary card presentation across modules.
- Consistent Search & Filter UX across list/history views.

---

# AI Rules

- AI is **READ ONLY**.
- AI never creates transactions.
- AI never changes data.
- Rule-based logic is the first-class implementation; AI augments it, it does not replace it.

---

# UUID Rules

- Reuse the existing UUID strategy (UUID v4, generated via the shared UUID utility) for all entity identities.
- Never redesign or introduce a parallel identifier scheme.
- Cross-module relations point to another module's UUID, never to a name, slug, or array index.

---

# Media Rules

- Use the Global Media UUID reference pattern for any media asset.
- Never embed media directly inline in a record; reference it by UUID.

---

# Transaction Rules

- Mutations that touch more than one record (e.g. stock movements affecting origin and destination, production runs consuming and producing inventory) are atomic.
- Failed mutations roll back fully.
- No partial success is ever persisted.

---

# Audit Rules

Every module's implementation lifecycle ends with the same sequence:

```
Audit
  ↓
Final Review
  ↓
Pull Request
  ↓
Merge
```

No module is considered complete until it has passed through all four stages.
