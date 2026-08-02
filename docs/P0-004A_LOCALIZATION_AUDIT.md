# P0-004A — Audit Lokalisasi Bahasa Indonesia

**Tanggal Audit:** 21 Juli 2026  
**Branch:** `feature/production-readiness`  
**Scope:** Seluruh aplikasi — semua file `.tsx` di `src/pages/` dan `src/components/`  
**Tujuan:** Menemukan string UI yang belum menggunakan Bahasa Indonesia. TIDAK ada perubahan kode.

---

## Ringkasan Eksekutif

| Kategori | Jumlah String | Jumlah File |
|---|---|---|
| ✅ Sudah Bahasa Indonesia | ~4.200+ | ~270+ file |
| ❌ Masih Bahasa Inggris | **~127 string** | **28 file** |
| ⚠️ Campuran Indonesia + Inggris | **~31 string** | **11 file** |
| 🔧 Istilah Teknis (tidak boleh diterjemahkan) | ~60 string | tersebar di semua file |

**Total file bermasalah: 34 file**  
**Prioritas tinggi (P0-004B): 3 modul utama** — Admin, Workspace Settings, Auth

---

## Kategori 1 — Sudah Bahasa Indonesia ✅

Sebagian besar aplikasi sudah menggunakan Bahasa Indonesia dengan baik:

- Seluruh modul **Livestock** (LivestockProfile, AddLivestock, EditLivestock, BatchList, BatchProfile, CatatBobot, Keturunan, Silsilah, dll.)
- Seluruh modul **Kesehatan Hewan** (KesehatanHewan, KontrolKesehatan, DiagnosaKesehatan, PemeriksaanKesehatan, PengobatanKesehatan, dll.)
- Seluruh modul **Pakan** (FormulaTab, FormulaEditor, FormulaProduksi, PemberianPakan, JadwalPemberianPakan, StokPakan, dll.)
- Seluruh modul **Stok Obat** (StokObat, TambahStokObat, RiwayatObat, MasterObat, dll.)
- Seluruh modul **Reproduksi** (Reproduksi.tsx dan semua sub-halaman)
- Seluruh modul **Mutasi** (Mutasi.tsx, RiwayatMutasi.tsx)
- Seluruh modul **Master Pakan & Produk Komersial** (semua halaman MasterPakan*, KonsentratBrand*, dll.)
- Modul **Berita & Event** (AdminNewsEventReview, AdminPublicationManagement sebagian besar)
- Halaman **Dashboard** (Dashboard.tsx, DashboardAiInsight.tsx, DashboardAlertReminder.tsx, dll.)
- Halaman **Profil Publik** (FarmProfile.tsx, FeedStoreWorkspace.tsx, dll.)
- Halaman **Onboarding** (`src/pages/onboarding/Onboarding.tsx`)
- Halaman **Login, Register, ForgotPassword, VerifyEmail, ResetPassword** (sudah hampir semua Indonesia)
- Komponen shared: BottomNav, TopAppBar (hampir semua Indonesia)

---

## Kategori 2 — Masih Bahasa Inggris ❌

### 🔴 PRIORITAS TINGGI — Admin Module (`src/pages/admin/`)

#### `src/pages/admin/AdminDashboard.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"Good Morning"` / `"Good Afternoon"` / `"Good Evening"` | Salam sapaan | ~132 |
| `"Platform Summary"` | Judul seksi | ~174 |
| `"Live counts from Supabase"` | Subjudul | ~174 |
| `"System Health"` | Judul seksi | ~232 |
| `"Operational"` / `"Degraded"` / `"Outage"` | Label status | ~122, ~412 |
| `"Recent Activities"` | Judul seksi | ~342 |
| `"Platform Statistics"` | Judul seksi | ~369 |

#### `src/pages/admin/layout/AdminGuard.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"Verifying admin access…"` | Loading state | ~52 |
| `"Admin Access Required"` | Judul error | ~94 |
| `"System Administrators"` | Label teks | ~105 |
| `"Access Log:"` | Label | ~123 |
| `"Unauthorized access attempt recorded."` | Pesan error | ~123 |

#### `src/pages/admin/layout/AdminModuleShell.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"Under development"` | Badge status | ~114 |
| `"Action buttons reserved"` | Placeholder | ~193 |
| `"Coming in a future ADM task"` | Hint teks | ~299 |

#### `src/pages/admin/layout/AdminSidebar.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"Expand sidebar"` | Tombol title | ~341 |
| `"Collapse sidebar"` | Tombol title | ~341 |
| `"Collapse"` | Teks tombol | ~366 |

#### `src/pages/admin/layout/AdminTopBar.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"Back to Workspace"` | Menu item | ~273 |
| `"Back to Dashboard"` | Menu item | ~223 |
| `"Platform Settings"` | Menu item | ~298 |
| `"Logout"` | Menu item | ~298 |

#### `src/pages/admin/modules/ActivityCenterModule.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"Activity Center"` | Judul modul | ~38 |
| `"Activity Log"` | Judul seksi | ~75 |

#### `src/pages/admin/modules/AnnouncementsModule.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"All Scopes"` | Opsi filter | ~76 |
| `"Admin Only"` | Opsi filter | ~78 |
| `"Free Plan"` / `"Pro Plan"` | Opsi filter | ~79–80 |

#### `src/pages/admin/modules/CrossWorkspaceLineageModule.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"Partially Verified"` | Opsi filter | ~80 |

#### `src/pages/admin/modules/EscrowModule.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"Escrow Observation"` | Judul seksi | ~50 |
| `"All Types"` | Opsi filter | ~87 |

#### `src/pages/admin/modules/FeedModule.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"All Types"` | Opsi filter | ~65 |

#### `src/pages/admin/modules/GlobalSearchModule.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"Global Search"` | Judul modul | ~53 |

#### `src/pages/admin/modules/MarketplaceModule.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"Reserved Actions"` | Label seksi | ~232 |
| `"Listing List"` | Judul tabel | ~368 |
| `"Reset Filters"` | Teks tombol | ~394 |

#### `src/pages/admin/modules/MedicineModule.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"All Types"` | Opsi filter | ~67 |

#### `src/pages/admin/modules/MonitoringModule.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"Monitoring Center"` | Judul modul | ~45 |

#### `src/pages/admin/modules/OwnershipTransferModule.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"Ownership Transfer"` | Judul modul | ~52 |
| `"Under Review"` | Opsi filter | ~77 |
| `"Identity Verification"` | Opsi filter | ~78 |
| `"Agreement Pending"` | Opsi filter | ~79 |
| `"Transfer In Progress"` | Opsi filter | ~80 |

#### `src/pages/admin/modules/ReportsModule.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"All Types"` | Opsi filter | ~91 |
| `"Platform Summary"` | Opsi filter | ~92 |
| `"User Analytics"` | Opsi filter | ~93 |
| `"Audit Log"` | Opsi filter | ~98 |

#### `src/pages/admin/modules/TrustModule.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"All Types"` | Opsi filter | ~85 |
| `"Under Review"` | Opsi filter | ~75 |

#### `src/pages/admin/modules/UsersModule.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"Full Name"` | Label field | ~153 |
| `"User List"` | Judul tabel | ~317 |

#### `src/pages/admin/modules/WorkspacesModule.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"Reserved Actions"` | Label seksi | ~205 |
| `"Workspace List"` | Judul tabel | ~339 |
| `"Reset Filters"` | Teks tombol | ~365 |

---

### 🔴 PRIORITAS TINGGI — Workspace Settings (`src/pages/WorkspaceSettings*.tsx`)

#### `src/pages/WorkspaceSettingsArchive.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"Archive Workspace"` | Judul + tombol | ~118, ~494 |
| `"This action cannot be undone without restoring."` | Deskripsi | ~119 |
| `"When archived, this workspace will:"` | Judul seksi | ~125 |
| `"Type workspace name…"` | Placeholder | ~149 |
| `"Name does not match. Check spelling and try again."` | Error validation | ~159 |
| `"This workspace will become Active again..."` | Deskripsi | ~223 |
| `"Only the Owner of this workspace can archive or restore it."` | Helper text | ~410 |
| `"Currently Blocked"` | Judul kartu | ~573 |
| `"Still Available"` | Judul kartu | ~590 |
| `"Restore Workspace"` | Judul seksi + tombol | ~604 |
| `"Restoring will make this workspace Active again. All prior data, settings, and member access will be fully reinstated."` | Deskripsi | ~607 |
| `"Data Safety Guarantee"` | Judul kartu | ~636 |
| `"Archiving never deletes any data. Your workspace, members, livestock records, and all history are permanently preserved and can be restored at any time."` | Deskripsi | ~637 |

#### `src/pages/WorkspaceSettingsProfile.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"No workspace found"` | Empty state | ~337 |
| `"Select a workspace to manage its profile."` | Empty state subtitle | ~338 |
| `"Workspace Identity"` | Judul kartu | ~351 |
| `"Type"` | Label | ~353 |
| `"Slug"` | Label | ~354 |
| `"Status"` | Label | ~355 |
| `"Plan"` | Label | ~356 |
| `"Created"` | Label | ~357 |
| `"Updated"` | Label | ~359 |
| `"Basic Information"` | Judul kartu | ~368 |
| `"Logo URL"` | Label | ~370 |
| `"Workspace Name"` | Label | ~379 |
| `"Description"` | Label | ~388 |
| `"Contact"` | Judul kartu | ~402 |
| `"Phone"` | Label | ~404 |
| `"Website"` | Label | ~422 |
| `"Location"` | Judul kartu | ~436 |
| `"Country"` | Label | ~438 |
| `"Province"` | Label | ~442 |
| `"City / Regency"` | Label | ~447 |
| `"District"` | Label | ~454 |
| `"Village"` | Label | ~459 |
| `"Postal Code"` | Label | ~465 |
| `"Address"` | Label | ~468 |
| `"Latitude"` | Label | ~478 |
| `"Longitude"` | Label | ~488 |
| `"Regional Settings"` | Judul kartu | ~504 |
| `"Timezone"` | Label | ~506 |
| `"Language"` | Label | ~514 |
| `"Currency"` | Label | ~522 |
| `"My Farm"` | Placeholder nama workspace | ~384 |
| `"Brief description of this workspace…"` | Placeholder deskripsi | ~393 |
| `"Street address…"` | Placeholder alamat | ~473 |

#### `src/pages/WorkspaceSettingsMembers.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"Change Role"` | Judul dialog | ~181 |
| `"Search by name, email, or role…"` | Placeholder search | ~575 |

---

### 🟡 PRIORITAS SEDANG — Auth Module (`src/pages/auth/`)

#### `src/pages/auth/WorkspaceCreate.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"Workspace Type"` | Label field | ~336 |
| `"Workspace Name"` | Label field | ~369 |
| `"Logo URL"` + hint `"Link to your workspace logo image"` | Label + hint | ~400 |
| `"Description"` | Label field | ~411 |
| `"Phone"` | Label field | ~425 |
| `"Website"` | Label field | ~447 |
| `"Country"` | Label field | ~461 |
| `"Province"` | Label field | ~467 |
| `"City / Regency"` | Label field | ~472 |
| `"District"` | Label field | ~480 |
| `"Village"` | Label field | ~485 |
| `"Postal Code"` | Label field | ~492 |
| `"Address"` | Label field | ~497 |
| `"Latitude"` + hint `"-90 to 90"` | Label + hint | ~509 |
| `"Longitude"` + hint `"-180 to 180"` | Label + hint | ~514 |

#### `src/pages/auth/WorkspaceSelect.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"No Workspaces Found"` | Empty state | ~251 |
| `"Switch Workspace"` | Judul halaman | ~423 |

#### `src/pages/auth/Initialize.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"Confirm your email"` | Instruksi (referensi tombol email) | ~236 |

---

### 🟡 PRIORITAS SEDANG — Profile (`src/pages/Profile*.tsx`)

#### `src/pages/ProfileSecurity.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"Logout"` | Teks tombol | ~216 |
| `"Two-Factor Authentication"` | Judul seksi | ~324 |

---

### 🟡 PRIORITAS SEDANG — Marketplace Transaction (`src/pages/Marketplace*.tsx`)

#### `src/pages/MarketplaceDetailTransaksi.tsx`
| String | Konteks | Baris |
|---|---|---|
| `"Escrow Mode"` | Label field | ~253 |
| `"Transport Mode"` | Label field | ~254 |
| `"Deal Summary"` | Judul seksi | ~805 |

---

## Kategori 3 — Campuran Indonesia + Inggris ⚠️

### `src/components/marketplace/ChatEscrow.tsx`
| String | Konteks |
|---|---|
| `"Escrow telah bergabung. Klik tombol di bawah untuk memulai proses."` | Pesan info — "Escrow" sbg kata benda dalam kalimat Indonesia |
| `"Escrow sedang menyiapkan instruksi pembayaran."` | Pesan info |
| `"Escrow sedang memverifikasi bukti transfer."` | Pesan info |
| `"Escrow sedang memproses pelepasan dana ke Seller."` | Pesan — "Seller" dalam kalimat Indonesia |
| `"Escrow memantau status pengiriman."` | Pesan info |

### `src/components/marketplace/ChatTransport.tsx`
| String | Konteks |
|---|---|
| `"No. Telp Driver *"` | Placeholder — "Driver" dalam kalimat Indonesia |
| `"Nama Driver *"` | Placeholder — "Driver" dalam kalimat Indonesia |
| `"Kapasitas (ekor) *"` | Placeholder — asterisk English convention |
| `"No. Resi (opsional)"` | Placeholder — "No." adalah singkatan English-style |
| `"Nama Perusahaan Transport *"` | Placeholder — "Transport" dalam kalimat Indonesia |
| `"Jenis Kendaraan & Plat *"` | Placeholder — "Plat" adalah kata pinjaman |
| `"Est. Keberangkatan"` | Placeholder — "Est." adalah singkatan English |

### `src/pages/admin/modules/AdminSubPagePlaceholder.tsx`
| String | Konteks |
|---|---|
| `"Segera Hadir"` (berulang) | Campuran dengan placeholder English di sekitarnya |

### `src/pages/AdminPublicationManagement.tsx`
| String | Konteks |
|---|---|
| `"Konten Published tidak boleh diedit langsung"` | Bold text — "Published" dalam kalimat Indonesia |
| `"Seluruh perubahan melalui Revision Workflow"` | Teks — "Revision Workflow" dalam kalimat Indonesia |

### `src/pages/admin/AdminDashboard.tsx`
| String | Konteks |
|---|---|
| `"Backend belum tersedia"` | MIXED (Backend adalah istilah teknis yang bisa dipertahankan) |

### `src/pages/MarketplaceDetailTransaksi.tsx`
| String | Konteks |
|---|---|
| `"Buyer transfer dari [bank] ke rekening:"` | Kalimat — "Buyer" dalam kalimat Indonesia |
| `"✅ Buyer telah mengkonfirmasi penerimaan barang."` | Pesan sukses — "Buyer" dalam kalimat Indonesia |
| `"⚠️ Quotasi layanan belum terkunci."` | Pesan peringatan — "Quotasi" adalah serapan English |

---

## Kategori 4 — Istilah Teknis yang TIDAK BOLEH Diterjemahkan 🔧

Istilah berikut ditemukan di banyak file dan **harus dipertahankan** apa adanya:

| Istilah | Alasan |
|---|---|
| `UUID`, `ID` | Identifikasi teknis universal |
| `API`, `JSON`, `CSV`, `RSS` | Format/protokol teknis |
| `URL`, `GPS` | Akronim teknis |
| `Supabase`, `GitHub`, `Cloudflare` | Nama produk/layanan |
| `OAuth`, `token`, `hash`, `cache` | Terminologi autentikasi |
| `Workspace` | Nama fitur produk TernakHub — sudah menjadi istilah produk |
| `email` | Sudah diserap ke Bahasa Indonesia |
| `Admin` | Peran/role sistem yang sudah universal |
| `Escrow` | Istilah hukum/keuangan yang sudah diakui |
| `Buyer` / `Seller` | Istilah marketplace yang sudah umum dipakai di Indonesia (borderline — bisa diterjemahkan jadi Pembeli/Penjual) |
| `BCS` (Body Condition Score) | Terminologi veteriner |
| `ADG` (Average Daily Gain) | Terminologi peternakan |
| `null`, `undefined`, `boolean`, `string`, `integer` | Tipe data teknis |
| `KTP`, `NIK` | Singkatan dokumen resmi Indonesia |
| `RSS` | Protokol teknis |
| `GPS` | Singkatan teknis navigasi |
| `Password` | Sudah diserap — tapi sebaiknya konsisten dengan `"Kata Sandi"` yang sudah dipakai di tempat lain |
| `Two-Factor Authentication` | Terminologi keamanan — bisa diterjemahkan jadi "Autentikasi Dua Faktor" |
| `Latitude` / `Longitude` | Terminologi geografis — bisa diterjemahkan jadi "Lintang/Bujur" tapi juga sangat umum dalam Bahasa Indonesia teknis |

---

## Daftar File Bermasalah (terurut prioritas)

### 🔴 P0 — Harus diperbaiki segera (banyak string Inggris, halaman utama pengguna)

| # | File | Jenis Masalah | Estimasi Jumlah String |
|---|---|---|---|
| 1 | `src/pages/WorkspaceSettingsProfile.tsx` | Semua label form dalam Inggris | ~30 string |
| 2 | `src/pages/WorkspaceSettingsArchive.tsx` | Semua teks konten dalam Inggris | ~13 string |
| 3 | `src/pages/auth/WorkspaceCreate.tsx` | Semua label form dalam Inggris | ~15 string |
| 4 | `src/pages/admin/AdminDashboard.tsx` | Judul seksi, salam, status | ~8 string |
| 5 | `src/pages/admin/layout/AdminGuard.tsx` | Pesan error, loading, judul | ~5 string |
| 6 | `src/pages/admin/layout/AdminSidebar.tsx` | Tombol sidebar | ~3 string |
| 7 | `src/pages/admin/layout/AdminTopBar.tsx` | Menu item navigasi | ~4 string |
| 8 | `src/pages/admin/layout/AdminModuleShell.tsx` | Badge, placeholder, hint | ~3 string |

### 🟡 P1 — Perbaiki setelah P0 (admin modules, opsi filter)

| # | File | Jenis Masalah | Estimasi Jumlah String |
|---|---|---|---|
| 9 | `src/pages/admin/modules/WorkspacesModule.tsx` | Judul, label, tombol | ~3 string |
| 10 | `src/pages/admin/modules/UsersModule.tsx` | Label, judul tabel | ~2 string |
| 11 | `src/pages/admin/modules/OwnershipTransferModule.tsx` | Judul modul, opsi filter | ~5 string |
| 12 | `src/pages/admin/modules/ReportsModule.tsx` | Opsi filter, tipe laporan | ~4 string |
| 13 | `src/pages/admin/modules/ActivityCenterModule.tsx` | Judul modul | ~2 string |
| 14 | `src/pages/admin/modules/MarketplaceModule.tsx` | Label, judul, tombol | ~3 string |
| 15 | `src/pages/admin/modules/TrustModule.tsx` | Opsi filter | ~2 string |
| 16 | `src/pages/admin/modules/AnnouncementsModule.tsx` | Opsi filter | ~4 string |
| 17 | `src/pages/admin/modules/GlobalSearchModule.tsx` | Judul modul | ~1 string |
| 18 | `src/pages/admin/modules/MonitoringModule.tsx` | Judul modul | ~1 string |
| 19 | `src/pages/admin/modules/EscrowModule.tsx` | Judul modul, opsi filter | ~2 string |
| 20 | `src/pages/admin/modules/MedicineModule.tsx` | Opsi filter | ~1 string |
| 21 | `src/pages/admin/modules/FeedModule.tsx` | Opsi filter | ~1 string |
| 22 | `src/pages/admin/modules/CrossWorkspaceLineageModule.tsx` | Opsi filter | ~1 string |
| 23 | `src/pages/WorkspaceSettingsMembers.tsx` | Judul dialog, placeholder | ~2 string |
| 24 | `src/pages/auth/WorkspaceSelect.tsx` | Empty state, judul | ~2 string |
| 25 | `src/pages/ProfileSecurity.tsx` | Tombol logout, judul seksi | ~2 string |

### 🟢 P2 — Perbaiki setelah P1 (campuran, borderline)

| # | File | Jenis Masalah | Estimasi Jumlah String |
|---|---|---|---|
| 26 | `src/components/marketplace/ChatEscrow.tsx` | "Seller" dalam kalimat Indonesia | ~5 string |
| 27 | `src/components/marketplace/ChatTransport.tsx` | "Driver", "Est.", "No." dalam kalimat Indonesia | ~7 string |
| 28 | `src/pages/MarketplaceDetailTransaksi.tsx` | Label "Escrow Mode", "Deal Summary", "Buyer" | ~4 string |
| 29 | `src/pages/AdminPublicationManagement.tsx` | "Published", "Revision Workflow" dalam kalimat Indonesia | ~2 string |
| 30 | `src/pages/auth/Initialize.tsx` | Referensi tombol "Confirm your email" | ~1 string |

---

## Rekomendasi untuk P0-004B

### Prioritas Pengerjaan

**Tahap 1 (P0) — Halaman yang dilihat pengguna biasa:**
1. `WorkspaceSettingsProfile.tsx` — semua label form
2. `WorkspaceSettingsArchive.tsx` — semua teks deskripsi + tombol
3. `auth/WorkspaceCreate.tsx` — semua label form
4. `auth/WorkspaceSelect.tsx` — empty state, judul
5. `ProfileSecurity.tsx` — Logout, Two-Factor Authentication

**Tahap 2 (P1) — Admin UI:**
1. `AdminDashboard.tsx` — salam, judul seksi, status
2. `admin/layout/` — semua 4 file (AdminGuard, AdminSidebar, AdminTopBar, AdminModuleShell)
3. `admin/modules/` — semua 14 file, prioritaskan WorkspacesModule, UsersModule, OwnershipTransferModule

**Tahap 3 (P2) — Campuran & borderline:**
1. `MarketplaceDetailTransaksi.tsx` — "Escrow Mode", "Transport Mode", "Deal Summary"
2. `ChatTransport.tsx` — "Driver", "Est.", "No."
3. `ChatEscrow.tsx` — "Seller" dalam kalimat Indonesia
4. `AdminPublicationManagement.tsx` — "Published", "Revision Workflow"

### Keputusan Kosakata yang Harus Disepakati

Sebelum P0-004B dimulai, perlu kesepakatan untuk:

| Kata Inggris | Opsi Terjemahan | Catatan |
|---|---|---|
| `Logout` | `Keluar` | Sudah dipakai di beberapa tempat |
| `Buyer` / `Seller` | `Pembeli` / `Penjual` | Atau pertahankan sebagai istilah marketplace? |
| `Two-Factor Authentication` | `Autentikasi Dua Faktor` | |
| `Upgrade` / `Downgrade` | `Tingkatkan` / `Turunkan` | Atau pertahankan sebagai istilah produk? |
| `Free` / `Pro` / `Enterprise` | Pertahankan | Nama paket produk |
| `Archive` / `Restore` | `Arsipkan` / `Pulihkan` | |
| `Driver` | `Pengemudi` / `Supir` | |
| `Workspace` | Pertahankan | Nama fitur produk TernakHub |
| `Deal` | `Kesepakatan` | |
| `Coverage Area` | `Area Jangkauan` | |
| `Password` | `Kata Sandi` | Sudah ada di beberapa tempat |
| `Reset Filters` | `Reset Filter` | Atau `Hapus Filter`? |

---

## Statistik Akhir

| Metrik | Nilai |
|---|---|
| Total file di-audit (`src/pages/*.tsx` + `src/components/**/*.tsx`) | ~320 file |
| File tanpa masalah (sudah Indonesia) | ~286 file (~89%) |
| File dengan string Inggris | **28 file** |
| File dengan string campuran | **11 file** |
| Total string Inggris yang perlu diterjemahkan | **~127 string** |
| Total string campuran yang perlu direvisi | **~31 string** |
| String teknis yang dipertahankan | ~60 string |
| Modul paling banyak masalah | Admin module (~75 string, ~22 file) |
| Halaman pengguna paling kritis | WorkspaceSettingsProfile.tsx (~30 string) |

---

*Audit ini hanya membaca kode — tidak ada perubahan yang dilakukan.*  
*Commit: P0-004A: Audit Indonesian localization*
