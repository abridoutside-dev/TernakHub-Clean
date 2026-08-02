# PCR-003 — Commercial Medicine Catalog Audit & Validation Report

**Branch:** `feature/master-obat-reference-v2`  
**Date:** 13 July 2026  
**Scope:** `src/data/produkKomersialObatData.ts` ↔ `src/data/obatData.ts`  
**Status:** ✅ Audit Complete — No blocking issues. Formatting inconsistencies and coverage gaps documented below.

---

## Executive Summary

| Metric | Value |
|---|---|
| Total Brands | **13** |
| Total Commercial Products | **363** |
| Master Obat Reference DB | **325** items |
| Coverage (Master → Commercial) | **231 / 325 = 71.1%** |
| Uncovered Master Obat | **94** |
| Duplicate Product UUIDs | **0** ✅ |
| Broken `masterObatUuid` References | **0** ✅ |
| Orphan Products (no `masterObatUuid`) | **0** ✅ |
| Missing Required Fields | **0** ✅ |
| Duplicate Product Slugs | **0** ✅ |
| Duplicate Product Names | **0** ✅ |

The catalog is **relationally sound**. Every commercial product points to a valid Master Obat record. No broken links, no orphans, no missing required fields, and no duplicate identifiers of any kind.

---

## 1. Relationship Audit

### 1.1 masterObatUuid Reference Integrity

- **363 products** each carry a `masterObatUuid` field.
- All 363 values resolve to an existing `ObatItem.uuid` in `OBAT_DB`.
- **Broken references: 0**
- **Null/empty `masterObatUuid`: 0**
- **Orphan products: 0**

### 1.2 Brand UUID Integrity

- **13 brands** registered in `OBAT_BRAND_UUID`.
- All 363 products reference a `brandId` from `OBAT_BRAND_UUID`.
- All `brandNama` values in the product list exactly match the corresponding `nama` in `OBAT_BRAND_LIST`.
- **Broken brand references: 0**

### 1.3 Product UUID Registry Integrity

- `OBAT_PRODUK_UUID` registry: **363 entries** (keys and values both unique).
- All 363 products use `uuid: OBAT_PRODUK_UUID['slug']`; all 363 keys exist in the registry.
- **Missing UUID registry entries: 0**
- **Duplicate UUID values in registry: 0**

---

## 2. Product Field Completeness Audit

All fields — required and enrichment — are 100% populated across all 363 products.

| Field | Required? | Coverage |
|---|---|---|
| `uuid` | ✅ | 363 / 363 (100%) |
| `slug` | ✅ | 363 / 363 (100%) |
| `nama` | ✅ | 363 / 363 (100%) |
| `brandId` | ✅ | 363 / 363 (100%) |
| `brandNama` | ✅ | 363 / 363 (100%) |
| `bentukSediaan` | ✅ | 363 / 363 (100%) |
| `kemasan` | ✅ | 363 / 363 (100%) |
| `status` | ✅ | 363 / 363 (100%) |
| `masterObatUuid` | ✅ | 363 / 363 (100%) |
| `namaKomersial` | Enrichment | 363 / 363 (100%) |
| `produsen` | Enrichment | 363 / 363 (100%) |
| `bahanAktif` | Enrichment | 363 / 363 (100%) |
| `kekuatan` | Enrichment | 363 / 363 (100%) |

> **Note:** The `ObatProdukKomersial` interface also defines `distributor`, `nomorRegistrasi`, `fotoProduk`, `catatan`, `negaraAsal`, and `penyimpanan` as optional fields. These are intentionally partial and not counted as required.

---

## 3. Data Quality Audit

### 3.1 Duplicate Check

| Check | Result |
|---|---|
| Duplicate product UUID values | **0** ✅ |
| Duplicate product slug keys | **0** ✅ |
| Duplicate product names (`nama`) | **0** ✅ |
| Duplicate Master Obat UUIDs | **0** ✅ |

### 3.2 Master Obat UUID Format

**Finding — Tech Debt (non-blocking):**

- Items 1–32 in `OBAT_DB` use correctly-formed v4 UUIDs (12 hex chars in final segment):
  ```
  a1b2c3d4-0001-4000-8000-000000000001  ✅ valid
  ```
- Items 33–329 (293 items) have an oversized last segment (14 hex chars):
  ```
  a1b2c3d4-0033-4000-8000-00000000000033  ⚠️ non-standard
  ```
  Standard v4 requires exactly 12 hex chars in the final group.

- **Impact:** No functional breakage. All cross-references (`masterObatUuid` in PKO) use the same non-standard string, so lookups succeed. The format is internally consistent.
- **Risk:** If any future code validates UUID format strictly (regex `[0-9a-f]{12}$`), items 33+ will fail.
- **Note:** This is a pre-existing condition documented in project memory. **Do not fix without a dedicated migration that updates all `masterObatUuid` references in lockstep.**

### 3.3 Terbatas Master Obat Referenced by Commercial Products

7 `Terbatas` (restricted-use) Master Obat items are linked to commercial products:

| UUID Seq | namaGenerik | Category |
|---|---|---|
| 0005 | Enrofloxacin | antibiotik / Fluorokuinolon |
| 0017 | Vaksin Brucellosis (Strain 19 / RB51) | vaksin / Vaksin Bakteri |
| 0026 | Prostaglandin F2α (PGF2α) | hormon / Hormon Reproduksi |
| 0041 | Gentamicin | antibiotik / Aminoglikosida |
| 0043 | Streptomycin | antibiotik / Aminoglikosida |
| 0098 | Phenylbutazone | anti-inflamasi / NSAID |
| 0109 | Estradiol Benzoate | hormon / Hormon Reproduksi |

**Assessment: Expected and correct.** `Terbatas` means commercially available under restricted conditions (veterinary prescription, controlled distribution), not banned. Having commercial products reference these is appropriate. UI should surface the restriction status to users when displaying these products.

### 3.4 Kekuatan Generic Fallback

13 products use `kekuatan: 'Sesuai formulasi label kemasan'` — a non-specific value.

**Assessment: Low priority.** Not a data error. These are typically multi-component products (B-complex vitamins, mineral mixes) where a single strength string is not meaningful. Acceptable as-is; consider adding a `catatan` field entry if more detail is needed.

---

## 4. Consistency Audit

### 4.1 Brand Names

All `brandNama` values used in products exactly match the `nama` field in `OBAT_BRAND_LIST`. **No inconsistencies.**

### 4.2 Produsen Name Variants ⚠️

Two manufacturers have inconsistent spellings across products:

| Manufacturer | Variant A | Count | Variant B | Count |
|---|---|---|---|---|
| Interchemie | `Interchemie werken De Adelaar BV` | 10 | `Interchemie Werken B.V.` | 8 |
| Vetoquinol | `Vetoquinol SA` | 12 | `Vétoquinol SA` | 6 |

**Recommended normalization:**
- Interchemie → **`Interchemie Werken De Adelaar BV`** (capitalize "Werken", drop "B.V." period inconsistency — confirm against official name)
- Vetoquinol → **`Vétoquinol SA`** (use the diacritical mark, matching the brand's registered name)

### 4.3 Kemasan Format Inconsistency ⚠️

8 kemasan values have mixed-case variants in use simultaneously:

| Canonical Form | Current Variants | Occurrences |
|---|---|---|
| `100 mL` | `100 ml` (35), `100 mL` (16) | 51 total |
| `50 mL` | `50 ml` (29), `50 mL` (14) | 43 total |
| `1 L` | `1 L` (29), `1 Liter` (2) | 31 total |
| `20 mL` | `20 ml` (21), `20 mL` (5) | 26 total |
| `500 mL` | `500 mL` (15), `500 ml` (9) | 24 total |
| `10 mL` | `10 ml` (15), `10 mL` (13) | 28 total |
| `250 mL` | `250 ml` (15), `250 mL` (5) | 20 total |
| `1 kg` | `1 kg` (18), `1 Kg` (3) | 21 total |

**Recommendation:** Standardize to SI conventions — uppercase `mL`, uppercase `L`, lowercase `kg`. This affects approximately 150–180 records (many products have the same kemasan string). A single find-replace pass per variant is sufficient.

### 4.4 BentukSediaan Terminology ⚠️ (Minor)

Three variants exist for the "Pour-On" route of administration:

| Variant | Count |
|---|---|
| `Pour On` | 1 |
| `Pour-On` | 1 |
| `Larutan Pour-On` | 2 |

**Recommendation:** Standardize to `Pour-On` (hyphenated, no "Larutan" prefix — route, not formulation). `Larutan Pour-On` should be split: bentukSediaan = `Pour-On`, kemasan description carries the "Larutan" detail.

Other bentukSediaan fragmentation (e.g., `Injeksi` / `Injeksi IM` / `Injeksi (IV/SC)` / `Injeksi Suspensi`) appears to reflect genuine product-level distinctions and is **intentional, not an error**.

### 4.5 Product Naming Conventions

No systematic naming issues detected. All product names follow `[Generic/Brand Name] [Brand]` or `[Brand Name] [Formulation]` patterns consistently within each brand's portfolio.

---

## 5. Master Coverage Audit

### 5.1 Summary

| Metric | Value |
|---|---|
| Total Master Obat | 325 |
| Linked to ≥ 1 commercial product | 231 |
| **Coverage** | **71.1%** |
| Uncovered | 94 |

### 5.2 Uncovered Items by Category

| Category | Total Uncovered | Aktif | Terbatas | Tidak Aktif |
|---|---|---|---|---|
| lainnya | 35 | 32 | 3 | 0 |
| suplemen | 14 | 14 | 0 | 0 |
| antibiotik | 12 | 7 | 5 | 0 |
| antiparasit | 12 | 11 | 1 | 0 |
| hormon | 7 | 4 | 2 | 1 |
| vitamin | 5 | 5 | 0 | 0 |
| antiseptik | 5 | 5 | 0 | 0 |
| anti-inflamasi | 3 | 2 | 1 | 0 |
| vaksin | 1 | 0 | 1 | 0 |
| **TOTAL** | **94** | **80** | **13** | **1** |

### 5.3 Classification of Uncovered Items

#### 🔴 Controlled / Terbatas — Do not add commercial products without legal review (13 items)

| ID Seq | namaGenerik | Reason |
|---|---|---|
| 0044 | Norfloxacin | Terbatas — restricted antibiotic |
| 0045 | Danofloxacin | Terbatas — restricted fluoroquinolone |
| 0144 | Clenbuterol | Terbatas — banned as growth promoter in most markets |
| 0154 | Vaksin Brucellosis (Strain 19) | Terbatas — government-program-only vaccine |
| 0159 | Colistin Sulfate | Terbatas — WHO critical antibiotic |
| 0171 | Sarafloxacin | Terbatas — restricted fluoroquinolone |
| 0172 | Chloramphenicol (Veteriner) | Terbatas — banned in food animals in many jurisdictions |
| 0182 | Selamectin | Terbatas — companion animal only |
| 0203 | Diclofenac Sodium (Veteriner) | Terbatas — banned in food animals in many countries |
| 0206 | Testosterone Propionate | Terbatas — controlled growth promoter |
| 0207 | Bovine Somatotropin (bST) | Terbatas — controversial/restricted in many markets |
| 0250 | Succinylcholine Chloride | Terbatas — veterinary controlled substance |
| 0253 | Phenobarbital | Terbatas — controlled substance |

#### ⚫ Tidak Aktif — Superseded, no commercial product warranted (1 item)

| ID Seq | namaGenerik | Note |
|---|---|---|
| 0106 | Prostaglandin F2α (Dinoprost) | Marked `Tidak Aktif`; canonical reference is UUID 0026 (PGF2α / Luteolytic Agent) which is already covered |

#### 🟡 Specialist Clinical — Not typically in commercial farm catalogs (19 items from `lainnya`)

These are hospital/veterinary-clinic-only agents. Adding commercial catalog entries is possible but low priority for a farm-focused app.

| Item | SubKategori |
|---|---|
| Ketamine HCl | Anestesi Dissosiatif |
| Propofol | Anestesi Dissosiatif |
| Alfaxalone | Anestesi Dissosiatif |
| Tiletamine-Zolazepam (Telazol) | Anestesi Dissosiatif |
| Acepromazine Maleate | Sedatif Fenotiazin |
| Diazepam | Sedatif Benzodiazepin |
| Romifidine | Sedatif Alpha-2 |
| Detomidine HCl | Sedatif Alpha-2 |
| Medetomidine HCl | Sedatif Alpha-2 |
| Guaifenesin | Pelemas Otot |
| Hyoscine Butylbromide | Antispasmodik |
| Yohimbine HCl (Antagonis Alpha-2) | Antidot |
| Naloxone HCl | Antidot |
| Atipamezole HCl | Antidot |
| Serum Antitetanus (Tetanus Antitoxin) | Adsorben & Antidot |
| Serum Anti Bisa Ular Polivalen | Adsorben & Antidot |
| Pentobarbital Sodium | Euthanasia |
| Glycopyrrolate | Antikolinergik |
| Diphenhydramine HCl | Antihistamin |

#### 🟢 Future Expansion — Commercially available, appropriate for catalog (61 items)

These are the genuine coverage gaps representing real commercial products not yet entered. Grouped by priority:

**Antibiotik (7 items)**
- Tetracycline HCl, Valnemulin, Bacitracin Zinc, Virginiamycin, Rifampicin (Rifampin), Difloxacin, Avilamycin

**Antiparasit (11 items)**
- Coumaphos, Cyromazine, Nitroxynil, Salinomycin Sodium, Lasalocid Sodium, Maduramicin Ammonium, Halofuginone Hydrobromide, Narasin, Flumethrin, Phoxim, Pyrantel Tartrate

**Suplemen (14 items)**
- Dexpanthenol Injectable, Betaine Anhydrous, Selenium Organik, Chromium Propionate, Saccharomyces cerevisiae (Live Yeast), Humic Acid, Thymol+Carvacrol (Oregano Oil), Inulin/FOS, Omega-3 Fatty Acid, L-Threonine, Inositol, Selenium (Seleno-Methionine), Suplemen Omega-3, Copper Methionine Chelate

**Vitamin & Mineral (5 items)**
- Asam Pantotenat (Vit B5), Riboflavin (Vit B2), Cobalt Chloride, Asam Askorbat Injectable, Sodium Fosfat

**Antiseptik / Desinfektan (5 items)**
- Acriflavine, Creolin, Cresol Compound Solution (Lysol), Kalium Permanganat, Chloramine-T

**Hormon (4 items)**
- Oxytocin Sintetik (Sediaan Partus), Melengestrol Acetate, Trenbolone Acetate (Implan), Zeranol (Implan)

**Anti-inflamasi (2 items)**
- Vedaprofen, Grapiprant

**Lainnya — suitably commercial (13 items)**
- Interferon Alpha Rekombinan, Levamisole (Imunostimulan), Levamisole Injeksi, Salep Hydrocortisone Topikal, Zinc Oxide Topikal, Propolis Ekstrak, Mannitol 20%, Neostigmine, Dextran 70, Butorphanol, Dextrose Saline, Sodium Thiosulfate, Dimercaprol (BAL)

---

## 6. Recommendations for Future Expansion

### Immediate (Formatting — low effort, high quality impact)

1. **Normalize `kemasan` to SI casing**: `mL` (not `ml`), `L` (not `Liter`), `kg` (not `Kg`). Affects ~150 records, but only 8 distinct string values to change. This is a find-replace operation, not a data redesign.

2. **Normalize `produsen` spelling variants**:
   - Decide on one canonical form for Interchemie and Vetoquinol, then update the minority spellings (~14 records combined).

3. **Normalize `bentukSediaan` Pour-On**: Pick one form (`Pour-On`) and update the 2 affected records.

### Short-term (Coverage — medium effort)

4. **Add 61 commercial products for genuinely uncovered Aktif Master Obat**: Priority order — Antibiotik supplemental (Tetracycline HCl, Bacitracin, etc.), Antiparasit (ionophores, external antiparasitics), then Suplemen/Vitamin/Antiseptik. This would bring coverage from 71.1% to approximately **90%+**.

### Long-term (Tech Debt — do not rush)

5. **Master Obat UUID format migration**: Normalize items 33–329 from 14-char to 12-char last segment. **Must** update all `masterObatUuid` values in `produkKomersialObatData.ts` in the same commit. Requires a migration script, not manual edits.

6. **`kekuatan` specificity**: For the 13 products using `'Sesuai formulasi label kemasan'`, add a structured alternative (e.g., per-component breakdown in `catatan`) if the catalog evolves toward clinical-grade data.

---

## 7. Data Quality Scorecard

| Check | Count | Status |
|---|---|---|
| Duplicate UUID (products) | 0 | ✅ PASS |
| Duplicate UUID (master) | 0 | ✅ PASS |
| Broken `masterObatUuid` references | 0 | ✅ PASS |
| Orphan products | 0 | ✅ PASS |
| Missing required fields | 0 | ✅ PASS |
| Missing enrichment fields | 0 | ✅ PASS |
| Duplicate product slugs | 0 | ✅ PASS |
| Duplicate product names | 0 | ✅ PASS |
| Invalid brand relations | 0 | ✅ PASS |
| `brandNama` denormalization drift | 0 | ✅ PASS |
| Kemasan case inconsistency | 8 groups (~150 records) | ⚠️ NORMALIZE |
| Produsen name variants | 2 manufacturers (14 records) | ⚠️ NORMALIZE |
| `bentukSediaan` Pour-On variants | 3 forms (4 records) | ⚠️ NORMALIZE |
| Non-standard Master Obat UUID format | 293 / 325 items | ⚠️ TECH DEBT |
| `kekuatan` generic fallback | 13 records | ℹ️ LOW PRIORITY |

**Overall: Production-ready for its current scope. No blocking data integrity issues.**

---

*Report generated by PCR-003 audit. Branch: `feature/master-obat-reference-v2`. Do not commit this file if the branch is being used for data-only changes.*
