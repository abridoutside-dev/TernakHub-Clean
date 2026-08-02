TernakHub — Produk Komersial UUID Standard (PK-000A)

Status: Ratified. All Produk Komersial work from PK-001 onward must comply.
This document amends and extends PK-000 (docs/PRODUK_KOMERSIAL_ARCHITECTURE.md).

---

Purpose

Establish UUID v4 as the permanent primary identity for all Produk Komersial
entities so that data relationships remain consistent regardless of changes to
product names, brand names, or any other mutable information.

---

UUID Standard

- Every entity uses UUID Version 4 (randomly generated, cryptographically unique).
- UUID is created automatically by the system at record creation time.
- UUID is permanent — it never changes after creation.
- UUID is never displayed in the UI.
- UUID is the only valid key for data relationships between entities.

---

Entities with UUID (mandatory)

Entity                  | Field      | Source file
------------------------|------------|----------------------------------------
Kategori Produk Komersial | uuid     | src/data/produkKomersialData.ts
Brand / Merek           | uuid       | src/data/konsentratMerekData.ts (and
                        |            | equivalent files for future categories)
Seri / Varian Produk    | uuid       | (built in PK-003+)
Detail Produk           | uuid       | (built in PK-003+)
Produsen                | uuid       | (built when Produsen registry is created)
Distributor             | uuid       | (built when Distributor registry is created)

---

Relationship Rules

All inter-entity references MUST use UUID fields. Never use:
  ❌ Nama Brand (nama)
  ❌ Nama Produk (nama)
  ❌ Slug (routing-only field)
  ❌ Sequential number / index

Correct field names for relationships in ProdukKomersialItem:
  ✅ kategoriId  → KategoriProdukKomersial.uuid
  ✅ brandId     → KonsentratMerek.uuid (or equivalent Brand entity)

Slug fields (slug, kategoriSlug) exist ONLY for URL routing and navigation.
They must never be used as relational keys.

---

UUID Generation

Runtime:  call generateUUID() from src/utils/uuid.ts — uses crypto.randomUUID()
Seed data: UUIDs are pre-generated once and stored as static string constants
           in the corresponding UUID registry (KATEGORI_UUID, KONSENTRAT_MEREK_UUID).
           Seed UUIDs must never be regenerated or changed.

---

UUID Registries (current)

KATEGORI_UUID (produkKomersialData.ts) — 20 entries
  konsentrat:        ef284065-b9f3-4f7f-828e-9868206ebf3c
  complete-feed:     2bc49fe7-8908-4aa1-9efd-bed0b6b0d550
  premix:            9eac54c7-3470-4058-9830-ba1fa61a2964
  mineral-mix:       d64ef8c5-f751-49ec-b84d-e4dec5eb2aef
  vitamin:           a2e67f79-4610-4e99-9cff-f0444d85352b
  feed-additive:     2305e1e2-fe14-44ec-90cb-b0fdd47fdd55
  milk-replacer:     90cd2db1-ad65-4ba2-a77b-e26cea1db351
  umb:               580b220e-b4fb-4e5a-9485-ce6dff21bb88
  mineral-block:     854adc57-d1bd-4250-b39d-bbe1d825f15b
  probiotik:         87b36b79-df48-4165-8c3c-d5794f6b386b
  enzim:             91abe4b1-a359-4147-9f3e-6e851e3c1ad8
  acidifier:         01d4a969-69ba-432e-b7fd-185371e87637
  buffer:            0718a41a-bb00-4885-ac63-b51b25b09527
  binder:            08224f98-1e4b-489b-991b-7991e1942282
  toxin-binder:      0bb8aa0c-b4a6-4a25-bd4e-3b766ef611dc
  yeast:             aafdceb5-c9d6-4bdd-9c9c-a63d2ae7ed7a
  herbal-komersial:  4adc8bbb-e12a-43b7-a1e9-3f783e3325a3
  silase-komersial:  925db808-3b5c-4167-926e-248818783539
  hay-komersial:     23d74ddd-0ff0-4d5b-ab39-d888fe9b4b28
  lainnya-komersial: 1de7491f-8ce5-409e-bbbb-bab0cdaba72c

KONSENTRAT_MEREK_UUID (konsentratMerekData.ts) — 15 entries
  charoen-pokphand:  b09ee868-38ff-4244-9756-ec6f894706a9
  japfa-comfeed:     2b7ec703-1df9-4d09-915c-38fcd2262cba
  nutrefeed:         a76c54b6-9ce0-45b2-aa55-a535310ce322
  mixfeed:           32072869-6881-46a4-bc04-6a19580a38c4
  gold-coin:         5e392801-c22e-4f38-9c9e-1a78d2e40b46
  new-hope:          540071be-027b-443a-979b-207b5ae4e8d1
  cj-feed:           2551115b-d59d-41b2-8c81-e0ad4c2fd9a5
  wonokoyo:          371fe1ae-6792-495c-892d-11cbe544b4e8
  malindo:           be3c0bf0-948b-47d6-8006-b478820b372f
  berdikari:         b4f9d4db-f8f2-495f-9c49-32ca81314248
  greenfeed:         f6226b4e-c26f-4b70-b42c-4fc8d10f92c2
  cargill:           cb25e47c-2346-4508-bc25-324857ccf11e
  shs-feed:          02e5dc2e-8ad3-428f-af95-294a3f850b30
  produk-koperasi:   37d58f16-4026-4dfa-be8e-ac7f564805b0
  produk-umkm:       da37db17-5ac6-4493-bd4c-504cf3238424

---

What is Allowed vs Prohibited

Admin may change freely (does not affect UUID or any relation):
  ✅ Nama Brand
  ✅ Nama Produk
  ✅ Deskripsi
  ✅ Informasi Nutrisi
  ✅ Kemasan
  ✅ Informasi lainnya

Never allowed:
  ❌ Displaying UUID in the UI
  ❌ Using nama as a primary key
  ❌ Manually constructing UUID strings (always use generateUUID())
  ❌ Changing a UUID after a record has been created
  ❌ Using slug as a relational key (slug is UI/routing only)

---

Data Import Rules

New record   → generate a new UUID via generateUUID().
Update       → keep the existing UUID. Only update mutable fields (nama, etc.).
Merge/dedupe → one UUID survives. All relations pointing to removed UUID must be
               updated to point to the surviving UUID before the merge.

---

Integration

This UUID standard is the identity contract for all future integrations:
  • Stok Pakan     — references products by ProdukKomersialItem.id (UUID)
  • Formula        — references products by ProdukKomersialItem.id (UUID)
  • Marketplace    — references products by ProdukKomersialItem.id (UUID)
  • AI / Analisis  — references categories by KategoriProdukKomersial.uuid
  • Riwayat        — references all of the above by UUID
  • Supplier       — references products by UUID when integration is built

No integration may use name, slug, or sequential ID as a foreign key.

---

Acceptance Criteria (ratified)

✅ All Produk Komersial entities have UUID (KategoriProdukKomersial, KonsentratMerek).
✅ UUID is generated automatically by the system (generateUUID() in src/utils/uuid.ts).
✅ UUID is never displayed in any UI element.
✅ All data relations use UUID (kategoriId, brandId in ProdukKomersialItem).
✅ Changing nama or any mutable field does not break data relations.
✅ This standard governs all subsequent Produk Komersial development phases.
