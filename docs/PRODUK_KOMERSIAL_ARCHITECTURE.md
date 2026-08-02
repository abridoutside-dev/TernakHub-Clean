TernakHub - Produk Komersial Architecture Standard (PK-000)

Status: Ratified standard. All future Produk Komersial work (PK-001 and onward)
must follow this document. Changes to this standard require an explicit new
instruction — it is not to be reinterpreted implicitly by later tasks.

---

Purpose

Produk Komersial is the Living Database of commercial (factory/brand-made)
feed products — distinct from Master Pakan and Formula. This document fixes
its architecture so future data and UI work never requires restructuring.

---

Philosophy — Three Distinct Domains

1. Master Pakan
   - Single raw ingredients / nutrition references.
   - Examples: Jagung, Dedak, Rumput, Bungkil, single minerals.

2. Produk Komersial
   - Finished products bought directly from a producer (company, cooperative,
     or UMKM) — never mixed/produced by the user.
   - Examples: Konsentrat, factory Complete Feed, Premix, Mineral Mix, Feed
     Additive, Milk Replacer, UMB, Mineral Block, Probiotik, Enzim.

3. Formula
   - User-mixed rations, which may draw ingredients from Master Pakan and/or
     Produk Komersial.

These three domains never overlap. A page or dataset belongs to exactly one.

---

Canonical Data Architecture

Produk Komersial
  -> Kategori        (e.g. Konsentrat, Premix, Mineral Mix — fixed list)
    -> Brand          (e.g. Mixfeed, Charoen Pokphand — Living Database, grows freely)
      -> Seri/Varian   (e.g. Mixfeed SMG S18, SMG S20 — Living Database, grows freely)
        -> Detail Produk (full composition/spec — Living Database, grows freely)

Rules:
- Kategori is a structural concept fixed by this standard (adding a wholly new
  Kategori is an architecture decision, not a data-entry action).
  - Brand, Seri/Varian, and Detail Produk are pure data — they are Living
    Database content. Adding/editing/removing them must NEVER require a UI or
    source-code change; it is only a data addition to the relevant dataset.
- Every level must be reachable by drilling down from the level above it
  (Kategori list -> Brand list -> Seri/Varian list -> Detail Produk). No level
  may be skipped in the navigation flow.
- Each implementation phase builds one level down the hierarchy for one
  Kategori at a time (see PK-001 = Kategori page, PK-002 = Brand page for
  Konsentrat, PK-003 = Seri/Varian + Detail Produk for Konsentrat, etc.).
  Other Kategori pages remain at their already-implemented level until their
  own phase is scheduled.

---

Living Database Principle

- Seed data is populated as completely as possible from trustworthy public
  references, but the dataset is never considered final or complete.
- New Brand, new Seri, or new Produk are added by appending records to the
  relevant data file (or, once available, a real datastore) — never by
  editing page components, routes, or layout.
- All counts, summaries (Ringkasan), and badges must be computed LIVE from the
  underlying data arrays/queries — never hardcoded — so the UI is always
  correct as the Living Database grows.

---

Access Model (conceptual — no admin panel is built under this standard)

- Admin: may add Brand, add Seri/Varian, edit product information, delete
  products. This is a data-write capability, not a UI feature to build now.
- Regular user: may only view, search, and use Produk Komersial data when
  building Stock entries or Formula recipes. Regular users never mutate the
  Produk Komersial database.
- No admin UI, auth roles, or permission enforcement is implemented as part of
  this standard — it is documented so future write-access work is consistent
  with this model when it is eventually scoped.

---

Integration Surface (future, not built by this standard)

Produk Komersial data is designed to be consumed — without ever changing its
own structure — by:
- Stock (Stok Pakan) — recording purchased/used commercial products.
- Formula — as an ingredient source alongside Master Pakan.
- Marketplace — listing/selling commercial products.
- AI — insights, recommendations, comparisons.
- Analisis Nutrisi — nutrition analysis referencing product composition.

Any future integration must read from the existing Kategori -> Brand ->
Seri/Varian -> Detail Produk hierarchy as-is; it must not require reshaping
that hierarchy.

---

Explicit Exclusions (this standard does not implement any of the following)

- No transactions.
- No stock records.
- No formula records.
- No marketplace listings.
- No admin panel.
- No changes to Master Pakan, Stock, Formula, or Riwayat.
- No changes to the Produk Komersial tab structure or overall app tab order.
