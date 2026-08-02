# MOR-003 — Master Obat Database Audit Report
**Date:** 12 Juli 2026  
**Scope:** Full data quality audit of all Master Obat source files  
**Status:** ✅ Selesai — semua isu kritis telah diperbaiki

---

## 1. Ringkasan Eksekutif

Audit mencakup 5 file sumber Master Obat. Ditemukan **5 isu data quality** yang telah diperbaiki, **2 isu arsitektur** yang dicatat sebagai technical debt (tidak diperbaiki dalam scope MOR-003), dan **1 isu open/semantic** yang memerlukan keputusan bisnis.

Setelah perbaikan, `obatData.ts` + `obatDetailData.ts` dinyatakan **siap sebagai SSOT** untuk modul Master Obat di TernakHub.

---

## 2. File yang Diaudit

| File | Peran | Ukuran |
|------|-------|--------|
| `src/data/obatData.ts` | SSOT — data item obat (274 item) | 6.959 baris |
| `src/data/obatDetailData.ts` | SSOT — data dosis per obat (247 blok, 795 entri dosis) | 9.623 baris |
| `src/data/masterObatKategoriData.ts` | Admin CRUD scaffold — 9 Kategori | ~80 baris |
| `src/data/masterObatSubKategoriData.ts` | Admin CRUD scaffold — 5 Sub Kategori (Antibiotik only) | ~60 baris |
| `src/data/masterObatDetailData.ts` | Admin CRUD scaffold — 3 Detail Obat (placeholder) | ~90 baris |

---

## 3. Statistik Database (Post-Audit)

### 3.1 `obatData.ts` — OBAT_DB

| Kategori | Jumlah Item |
|----------|-------------|
| lainnya | 61 |
| antibiotik | 40 |
| suplemen | 38 |
| antiparasit | 34 |
| vitamin | 27 |
| vaksin | 24 |
| hormon | 19 |
| antiseptik | 17 |
| anti-inflamasi | 14 |
| **Total** | **274** |

### 3.2 `obatDetailData.ts` — DOSIS_DB

| Metrik | Nilai |
|--------|-------|
| Blok dosis (obatId) | 247 |
| Entri dosis individual | 795 |
| Rata-rata dosis per obat | ~3,2 per item |
| Obat tanpa dosis | 0 (semua item punya coverage) |
| Orphan dosis (tanpa obatId valid) | 0 |

### 3.3 Distribusi SubKategori (Top 15)

| SubKategori | Jumlah | Kategori Induk |
|-------------|--------|----------------|
| Lainnya | 28 | campuran |
| Hormon Reproduksi | 17 | hormon |
| Antelmintik Benzimidazol | 14 | antiparasit |
| Vaksin Virus | 14 | vaksin |
| Mineral & Trace Element | 13 | vitamin |
| Antiseptik Topikal | 11 | antiseptik |
| Topikal | 10 | lainnya |
| Vitamin Larut Air | 10 | vitamin |
| Cairan Infus & Elektrolit | 10 | lainnya |
| NSAID | 10 | anti-inflamasi |
| Makrolid | 9 | antibiotik |
| Antiparasit Eksternal | 7 | antiparasit |
| Respirasi Suportif | 7 | lainnya |
| Vaksin Bakteri | 7 | vaksin |
| Vitamin Larut Lemak | 6 | vitamin |

---

## 4. Isu Ditemukan & Status Perbaikan

### 4.1 ✅ DIPERBAIKI — Duplicate Dosis IDs (KRITIS)

**File:** `src/data/obatDetailData.ts`  
**Severity:** Kritis

`dosis-se-001` dan `dosis-se-002` digunakan di **dua blok berbeda**:
- Blok `vaksin-se` (baris ~568) — Vaksin SE untuk Sapi dan Kerbau
- Blok `sodium-selenite-injectable` (baris ~7863) — Sodium Selenite Injectable

Ini akan menyebabkan collision jika dosis pernah diindeks per ID. ID harus unik di seluruh database.

**Fix yang diterapkan:**
- `dosis-se-001` → `dosis-selenit-001` (blok `sodium-selenite-injectable`)
- `dosis-se-002` → `dosis-selenit-002` (blok `sodium-selenite-injectable`)
- `dosis-se-003` → `dosis-selenit-003` (blok `sodium-selenite-injectable`)

ID di blok `vaksin-se` tidak diubah (`dosis-se-001`, `dosis-se-002` tetap valid di sana).

---

### 4.2 ✅ DIPERBAIKI — Niclosamide SubKategori Salah

**File:** `src/data/obatData.ts` | ID: `niclosamide`  
**Severity:** Data Quality

| Field | Sebelum | Sesudah |
|-------|---------|---------|
| `subKategori` | `'Antelmintik Benzimidazol'` | `'Lainnya'` |
| `golonganObat` | `'Antelmintik Sestodasid Salisilanilid'` | (tidak berubah) |

**Alasan:** Niclosamide adalah **salisilanilid/cestocide**, bukan benzimidazol. Golongannya sendiri (`golonganObat`) sudah benar ("Sestodasid Salisilanilid"), tetapi `subKategori` salah klasifikasi. Tidak ada subKategori "Antelmintik Cestocide" di tipe `ObatSubKategori`, sehingga `'Lainnya'` adalah nilai paling tepat.

---

### 4.3 ✅ DIPERBAIKI — DMSO Salah Kategori & SubKategori

**File:** `src/data/obatData.ts` | ID: `dimethyl-sulfoxide`  
**Severity:** Data Quality

| Field | Sebelum | Sesudah |
|-------|---------|---------|
| `kategoriSlug` | `'anti-inflamasi'` | `'lainnya'` |
| `subKategori` | `'NSAID'` | `'Topikal'` |
| `golonganObat` | `'Anti-inflamasi Topikal Non-NSAID'` | (tidak berubah) |

**Alasan:** `golonganObat` sendiri menyebut "Non-NSAID" — menempatkannya di `subKategori: 'NSAID'` adalah kontradiksi internal. DMSO adalah **anti-inflamasi topikal** dengan mekanisme non-NSAID (bukan inhibitor COX). Dipindahkan ke `lainnya` dengan `subKategori: 'Topikal'`, sesuai `OBAT_SUB_KATEGORI_ORDER['lainnya']` yang mencakup `'Topikal'`.

---

### 4.4 ✅ DIPERBAIKI — Bromhexine Salah Kategori & SubKategori

**File:** `src/data/obatData.ts` | ID: `bromhexine`  
**Severity:** Data Quality

| Field | Sebelum | Sesudah |
|-------|---------|---------|
| `kategoriSlug` | `'anti-inflamasi'` | `'lainnya'` |
| `subKategori` | `'NSAID'` | `'Respirasi Suportif'` |
| `golonganObat` | `'Mukolitik / Anti-inflamasi Saluran Napas'` | (tidak berubah) |

**Alasan:** Bromhexine adalah **mukolitik/ekspektoran** — bukan NSAID dan bukan anti-inflamasi sistemik. Mekanisme kerjanya mengencerkan sekresi mukus bronkial melalui depolimerisasi mukopolisakarida. Sudah ada 7 item di `subKategori: 'Respirasi Suportif'` (termasuk ambroxol, yang merupakan metabolit aktif bromhexine itu sendiri). `OBAT_SUB_KATEGORI_ORDER['lainnya']` mencakup `'Respirasi Suportif'`.

---

### 4.5 ✅ DIPERBAIKI — Formatting Defect: Missing Newline

**File:** `src/data/obatData.ts` | Baris ~2821  
**Severity:** Kosmetik

```
// Sebelum (formatting rusak):
  },  {
    id: 'altrenogest',

// Sesudah (benar):
  },
  {
    id: 'altrenogest',
```

Entry `estradiol-benzoate` dan `altrenogest` menyatu tanpa baris kosong pemisah — inconsistent dengan pola keseluruhan file.

---

## 5. Isu Dicatat (Tidak Diperbaiki dalam MOR-003)

### 5.1 ⚠️ TECHNICAL DEBT — UUID Format Non-Standar (Items 33+)

**Severity:** Low (tidak memengaruhi fungsi)  
**Scope:** Items dengan UUID sequence ≥ 0033

UUID items 1–32 menggunakan format valid (12-char last segment):
```
a1b2c3d4-0001-4000-8000-000000000001  ✓ (12 hex chars)
```

UUID items 33+ memiliki last segment 14 karakter (bukan 12):
```
a1b2c3d4-0033-4000-8000-00000000000033  ✗ (14 hex chars — 2 extra zeros)
```

Standar UUID v4 mengharuskan last segment tepat 12 hex char. Items 33+ secara teknis bukan UUID v4 yang valid.

**Tidak diperbaiki** karena: (1) constraint MOR-003 melarang perubahan UUID; (2) tidak menyebabkan bug runtime di implementasi saat ini; (3) perubahan bersifat massal (241 item) dan berisiko jika ada relasi UUID di tempat lain (misalnya `produkKomersialObatData.ts` yang menyimpan `masterObatUuid`).

**Rekomendasi untuk task terpisah:** Sebelum memperbaiki, lakukan grep `masterObatUuid` dan relasi UUID lainnya di seluruh codebase untuk memastikan tidak ada data yang bergantung pada format UUID yang ada saat ini.

---

### 5.2 ⚠️ TECHNICAL DEBT — UUID Sequence Gaps

**Severity:** Informational  
**Lokasi:** `obatData.ts`

Ditemukan 2 gap di sequence UUID:
- **GAP 0110**: UUID `0109` (estradiol-benzoate) → `0111` (altrenogest) — UUID `0110` tidak ada
- **GAP 0148–0150**: UUID `0147` → `0151` — UUID `0148`, `0149`, `0150` tidak ada

Gap ini menunjukkan item yang pernah dihapus atau dilewati saat penomoran. Tidak memengaruhi fungsi tetapi perlu dicatat untuk konsistensi dokumentasi.

---

### 5.3 🔍 OPEN — Potensi Semantic Duplicate: PGF2α

**Severity:** Medium (perlu keputusan bisnis)

Terdapat **dua entri terpisah** untuk konsep yang sama (Prostaglandin F2α):

| Aspek | `pgf2-alpha` | `pgf2alpha` |
|-------|-------------|-------------|
| UUID | `0026` (urutan awal) | `0106` (ditambah di MOD-001) |
| Status | `Terbatas` | `Aktif` |
| Kandungan aktif | Dinoprost + Cloprostenol | Dinoprost saja |
| Data dosis | ✅ Ada | ✅ Ada |
| Kelengkapan | Lebih lengkap (mencakup analog sintetik) | Hanya dinoprost |

Ini bisa intentional (memisahkan "PGF2α kelas" dari "dinoprost spesifik") atau merupakan duplikasi tidak disengaja saat batch import MOD-001. Karena keduanya memiliki data dosis sendiri dan aktif digunakan, **tidak dihapus** tanpa keputusan eksplisit.

**Rekomendasi:** Tentukan apakah keduanya perlu dipertahankan (sebagai "kelas" vs "produk spesifik") atau digabungkan menjadi satu entri komprehensif. Jika digabungkan, pertahankan `pgf2-alpha` (UUID lebih awal, data lebih lengkap) dan hapus `pgf2alpha`.

---

## 6. Arsitektur Dua Sistem: Konfirmasi SSOT

Ditemukan **dua sistem data paralel** yang berbeda untuk Master Obat:

### Sistem 1 — SSOT Aktif (digunakan UI)
- `obatData.ts` — 274 ObatItem dengan data farmakologi lengkap
- `obatDetailData.ts` — 247 blok dosis, 795 entri dosis individual

### Sistem 2 — Admin CRUD Scaffold (placeholder, belum diisi)
- `masterObatKategoriData.ts` — 9 Kategori (struktur saja)
- `masterObatSubKategoriData.ts` — 5 Sub Kategori (Antibiotik only, placeholder)
- `masterObatDetailData.ts` — 3 Detail Obat (Penicillin sub-kategori, placeholder)

**Sistem 2 tidak pernah diisi dengan data nyata** dan tidak digunakan oleh UI routing. Ia ada sebagai kerangka untuk fitur admin CRUD yang belum diimplementasikan. Jangan mengisi Sistem 2 dari Sistem 1 — ini bukan konversi data, hanya scaffold untuk UI admin masa depan.

---

## 7. Checklist SSOT Readiness

| Kriteria | Status | Catatan |
|----------|--------|---------|
| Tidak ada item ID duplikat | ✅ | Diverifikasi dengan `sort \| uniq -d` |
| Tidak ada UUID duplikat | ✅ | Tidak ada duplikat UUID |
| Semua item punya dosis | ✅ | 274 item = 247 blok dosis (beberapa item share blok multi-ternak) |
| Tidak ada orphan dosis | ✅ | Semua obatId valid di OBAT_DB |
| Tidak ada dosis ID duplikat | ✅ | Diperbaiki (dosis-se-001/002 di sodium-selenite) |
| subKategori konsisten dengan golonganObat | ✅ | Diperbaiki (niclosamide, DMSO, bromhexine) |
| subKategori valid per OBAT_SUB_KATEGORI_ORDER | ✅ | Diverifikasi TypeScript `npx tsc --noEmit` |
| Semua item punya `dataLengkap: true` | ✅ | Diverifikasi |
| Format UUID konsisten | ⚠️ | Items 33+ punya last-segment 14 char (non-standar UUID v4) — dicatat sebagai tech debt |
| Tidak ada semantic duplicate | ⚠️ | pgf2-alpha vs pgf2alpha — open, perlu keputusan bisnis |

---

## 8. File yang Dimodifikasi

| File | Perubahan |
|------|-----------|
| `src/data/obatDetailData.ts` | Rename 3 dosis IDs di blok `sodium-selenite-injectable` |
| `src/data/obatData.ts` | Fix subKategori niclosamide, kategori+subKategori DMSO dan bromhexine, formatting |

---

*Laporan dihasilkan oleh MOR-003 audit — TernakHub, 12 Juli 2026*
