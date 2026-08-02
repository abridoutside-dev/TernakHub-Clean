# P0-005-005A — Audit Header Layout Consistency

**Tanggal:** 2026-07-23  
**Scope:** Seluruh halaman dengan action button di area header  
**Prioritas viewport:** Mobile portrait (≤390px) → Mobile landscape → Tablet  
**Perubahan kode:** Tidak ada (audit only)

---

## Ringkasan Eksekutif

Ditemukan **13 kelompok bug** yang mempengaruhi konsistensi, kegunaan, dan aksesibilitas header di seluruh aplikasi. Penyebab utamanya adalah **tidak adanya slot action standar di TopAppBar** — halaman-halaman menyiasatinya dengan menyuntikkan overlay `position: fixed` terpisah ke dalam area header yang sama, menghasilkan tumpang-tindih yang tak terduga, posisi yang rapuh, dan ukuran touch target yang tidak memenuhi standar 44px.

---

## Grup Temuan

### GRUP A — Overlay Halaman Bertabrakan dengan Notification Bell TopAppBar ⚠️ KRITIS

**File:** `BatchList.tsx`, `BatchProfile.tsx`, `LivestockProfile.tsx`, `MarketplaceDetailListing.tsx`

**Mekanisme:**

TopAppBar tidak memiliki slot kanan untuk action halaman. Halaman-halaman ini menyiasatinya dengan menyuntikkan `position: fixed; top: 0; height: 56px; zIndex: 110` di dalam render tree halaman — melayang di atas header yang sama.

**Geometri tabrakan (showBack=true, no Switcher):**

```
[←  Profil Ternak                    🔔]   ← TopAppBar (zIndex: 100)
                              [✏️]  [⋮]    ← LivestockProfile overlay (zIndex: 110)
```

Notification Bell di TopAppBar: `padding: '6px 8px'`, `fontSize: 20` → lebar efektif ≈36px, menempati zone `right: 12px → right: 48px` dari tepi layar.

| Halaman | Posisi Overlay | Konflik |
|---|---|---|
| `BatchList.tsx` L1471 | `right: 0, paddingRight: 12` | 2 tombol (📋 + Buat) mendarat tepat di atas bell |
| `BatchProfile.tsx` L209 | `right: 0, paddingRight: 4` | Edit + ⋮ tumpang-tindih bell |
| `LivestockProfile.tsx` L105 | `right: 44` + `right: 0, paddingRight: 8` | ✏️ (right: 44~81px) bertabrakan dengan bell (right: 12~48px) |
| `MarketplaceDetailListing.tsx` L139 | `right: 44` | Wishlist icon berada di zona bell |

**Dampak:**
- Di mobile portrait (375px), dua tombol yang berbeda (bell & action halaman) berada di area klik yang sama
- Pengguna mungkin membuka notifikasi saat ingin menekan Edit atau sebaliknya
- Pada layar dengan `env(safe-area-inset-right)` (iPhone landscape), zone tabrakan meluas

**Rekomendasi:** Tambah slot `rightActions?: ReactNode` ke `TopAppBar` dan hapus semua overlay `position: fixed` di level halaman.

---

### GRUP B — Sticky Sub-header Tersembunyi di Bawah TopAppBar ⚠️ KRITIS

**File:** `MarketplaceEscrowInfo.tsx` (L463), `RiwayatKesehatanHewan.tsx` (L526)

**Kode yang bermasalah:**

```tsx
// MarketplaceEscrowInfo.tsx L463
<div style={{ position: 'sticky', top: 0, zIndex: 10, ... }}>

// RiwayatKesehatanHewan.tsx L526
<div style={{ position: 'sticky', top: 0, zIndex: 10, ... }}>
```

**Mekanisme:**

TopAppBar `position: fixed; zIndex: 100`. App.tsx membungkus konten halaman dengan `paddingTop: 56`. Ketika sub-header ini di-scroll ke atas, mereka mencoba menempel di `top: 0` — tepat di bawah TopAppBar. Karena `zIndex: 10 < zIndex: 100`, sub-header "menghilang" ke balik TopAppBar alih-alih menempel di bawahnya.

**Dampak:**
- Saat scroll, search bar dan filter tiba-tiba menghilang di balik header
- Pengguna kehilangan akses ke fungsi pencarian/filter
- `MarketplaceEscrowInfo` mengalami masalah ganda (lihat Grup H)

**Rekomendasi:** Ganti semua `top: 0` pada sub-header sticky menjadi `top: 56px` dan `zIndex` minimal `101`.

---

### GRUP C — Duplikat Header di MarketplaceEscrowInfo ⚠️ KRITIS

**File:** `MarketplaceEscrowInfo.tsx`  
**Route:** `/marketplace/escrow-info`

**Masalah:**

`App.tsx` mengkonfigurasi route ini dengan `showBack: true` → TopAppBar dirender dengan back button "←". NAMUN halaman ini JUGA merender header kustom sendiri dengan back button terpisah:

```tsx
// MarketplaceEscrowInfo.tsx L470-485
<button onClick={() => navigate('/marketplace')} aria-label="Kembali">
  ←
</button>
<span>Escrow TernakHub</span>
<span>Fitur Platform</span>
```

**Hasil:**
- 2 back button muncul: satu di TopAppBar (global) dan satu di header kustom halaman
- Header kustom menggunakan `top: 0` sehingga awalnya tersembunyi di balik TopAppBar (lihat Grup B)
- Tinggi header kustom (`padding: 12px 16px` + font 16px ≈ 52px) tidak konsisten dengan standar 56px
- `maxWidth: 480` + `margin: 0 auto` menyebabkan back button tidak rata dengan tepi layar pada layar lebar

**Dampak:** Confusing UX, pemborosan vertical space, inkonsistensi visual.

**Rekomendasi:** Hapus header kustom di halaman ini. Gunakan slot `rightActions` TopAppBar untuk badge "Fitur Platform".

---

### GRUP D — Touch Target Di Bawah Minimum 44px ⚠️ PENTING

**Standar:** Apple HIG & Google Material Design mensyaratkan minimum 44×44px touch target.

| Komponen | File | Padding | Font | Tinggi Efektif |
|---|---|---|---|---|
| Back button | `TopAppBar.tsx` L283 | `8px 10px` | 20px | **36px** |
| Notification Bell | `TopAppBar.tsx` L325 | `6px 8px` | 20px | **32px** |
| Back button (Escrow Info) | `MarketplaceEscrowInfo.tsx` L475 | `2px 4px` | 20px | **28px** |
| Riwayat icon overlay | `BatchList.tsx` L1481 | `6px 8px` | 13px | **32px** |
| Buat button overlay | `BatchList.tsx` L1492 | `6px 10px` | 13px | **32px** |
| Edit button overlay | `BatchProfile.tsx` L218 | `6px 10px` | 13px | **32px** |
| ⋮ button (BatchProfile) | `BatchProfile.tsx` L231 | `8px 10px` | 20px | **36px** |
| ✏️ button (LivestockProfile) | `LivestockProfile.tsx` L107 | `8px 10px` | 17px | **36px** |
| TransactionTabBar tabs | `TransactionTabBar.tsx` | `8px 10px` | 11px | **30px** |

**Dampak:** Pengguna dengan jari besar atau motorik kurang tepat sering salah tekan, terutama di area header yang padat.

**Rekomendasi:** Minimum padding: `12px 8px` (vertikal) untuk semua tombol header agar tinggi efektif ≥44px.

---

### GRUP E — Safe-Area Inset Diterapkan Salah di TopAppBar ⚠️ PENTING

**File:** `TopAppBar.tsx` L269

**Kode yang bermasalah:**

```tsx
<header style={{
  height: 56,                                    // ← FIXED, tidak tumbuh
  paddingTop: 'env(safe-area-inset-top, 0px)',  // ← ditekan ke dalam height 56
  ...
}}>
```

**Masalah:**

Pada iPhone dengan notch (iPhone 12/13/14/15 series), `env(safe-area-inset-top)` ≈ 47–59px. `paddingTop: 47px` di dalam `height: 56px` menyisakan hanya ~9px ruang untuk konten header — tombol back, title, dan bell semuanya tergencet.

**Pola yang benar:**

```tsx
<header style={{
  height: 'calc(56px + env(safe-area-inset-top, 0px))',  // ← tumbuh
  paddingTop: 'env(safe-area-inset-top, 0px)',
  ...
}}>
```

**Efek berantai:**

Semua page-level overlay (`BatchList`, `BatchProfile`, `LivestockProfile`, `MarketplaceDetailListing`) menggunakan `top: 0, height: 56` tanpa memperhitungkan safe-area — posisinya akan salah pada notch devices (overlay tombol tidak sejajar dengan konten TopAppBar).

App.tsx menggunakan `paddingTop: 56` yang tetap — harus `calc(56px + env(safe-area-inset-top, 0px))`.

**Dampak:** Pada iPhone dengan notch, seluruh header area menjadi tidak dapat digunakan atau sangat padat.

---

### GRUP F — Dua Fixed Div Terpisah untuk Tombol di LivestockProfile ⚠️ PENTING

**File:** `LivestockProfile.tsx` L105–116

```tsx
// Dua div terpisah — rapuh
<div style={{ position: 'fixed', top: 0, right: 44, height: 56, ... }}>
  <button>✏️</button>
</div>
<div style={{ position: 'fixed', top: 0, right: 0, height: 56, ... }}>
  <button>⋮</button>
</div>
```

**Masalah:**
- `right: 44` diasumsikan ⋮ berukuran tepat 44px — hardcoded brittle assumption
- Jika icon atau padding ⋮ berubah, ✏️ akan overlap atau gap
- Tidak ada flexbox container → dua elemen fixed tidak dapat bergerak bersama
- Pada tablet landscape (≥768px), `right: 44` dan `right: 0` terlalu dekat dengan tepi yang jauh dari center content area

**Dampak:** Pemeliharaan sangat susah. Setiap perubahan pada salah satu tombol mengharuskan kalkulasi ulang offset yang lain.

**Rekomendasi:** Satukan dalam satu container: `<div style={{ position: 'fixed', top: 0, right: 0, height: 56, display: 'flex', alignItems: 'center', paddingRight: 4 }}>`.

---

### GRUP G — Dropdown Menu Tumpang-tindih Border Bawah Header ⚠️ PENTING

**File:** `BatchProfile.tsx` L243, `LivestockProfile.tsx` L120

```tsx
// Keduanya menggunakan top: 52 — padahal TopAppBar height: 56
<div style={{ position: 'fixed', top: 52, right: 8, zIndex: 112, ... }}>
```

**Masalah:**

TopAppBar berakhir di `top: 56px`. Dropdown muncul di `top: 52px` — **4px di dalam area header**, tumpang-tindih dengan border bawah header (`borderBottom: '1px solid var(--color-border)'`). Hasilnya dropdown terlihat "tumbuh dari dalam" header bukan "jatuh dari bawah" header.

**Dampak:** Secara visual tidak rapi. Border bawah header tersembunyi di balik pojok atas dropdown, mengurangi kesan kedalaman/layering.

**Rekomendasi:** Ganti `top: 52` → `top: 56` (atau `top: calc(56px + env(safe-area-inset-top, 0px))` setelah Grup E diperbaiki).

---

### GRUP H — Title Terpotong Parah di Halaman showBackWithSwitcher ⚠️ PENTING

**Route:** `/stok-pakan` (`showBackWithSwitcher: true`), `/marketplace` (`showBackWithSwitcher: true`)

**Analisis ruang (layar 375px lebar):**

```
[←]  [Judul...]  [🔔]  [🐑 Berkah Farm Garut ▼]
 40px   ???       36px        ~180px
```

- Left padding: 4px
- Back button: ≈40px
- Right padding: 12px
- Notification Bell: ≈36px
- Gap antar elemen: 4px
- Workspace Switcher (`maxWidth: 180, text maxWidth: 110`): 110–180px

**Sisa untuk title:** 375 − 4 − 40 − 4 − 36 − 4 − 180 − 12 = **95px**

Dengan `fontSize: 17, fontWeight: 700`, 95px hanya cukup untuk ±6–7 karakter sebelum ellipsis. "Stok Pakan" (10 karakter) akan terpotong jadi "Stok P…" atau "Stok…".

**Dampak:** Pengguna tidak bisa membaca nama halaman saat workspace name panjang. Di landscape, workspace name lebih pendek relatif terhadap lebar — masalah berkurang.

**Rekomendasi:** Batasi workspace switcher button maxWidth ke 120px pada layar ≤390px, atau sembunyikan label teks dan tampilkan icon saja di layar kecil.

---

### GRUP I — MarketplaceChat Menggunakan `100vh` Bukan `100dvh` ⚠️ SEDANG

**File:** `MarketplaceChat.tsx` L339

```tsx
// MarketplaceChat.tsx
height: 'calc(100vh - 56px)',  // ← salah

// Halaman lain (benar):
height: 'calc(100dvh - 56px)', // MarketplaceConversation, MarketplaceEscrowDetail, dll
```

**Masalah:**

`100vh` di mobile browser menyertakan tinggi URL bar/browser chrome. Pada Chrome Android, `100vh ≈ screenHeight − notch`, bukan `innerHeight`. Saat URL bar visible, `100vh > innerHeight`, sehingga chat room meluber ke bawah viewport yang tidak terlihat, menyembunyikan input pesan.

**Dampak:** Di Android Chrome portrait, bagian bawah chat (input teks, send button) bisa tertutup browser chrome bar.

**Rekomendasi:** Ganti `100vh` → `100dvh` (sudah digunakan di 4 halaman lain, konsisten).

---

### GRUP J — Duplikasi: MarketplaceChat Memiliki TopAppBar + RoomHeader Ganda ⚠️ SEDANG

**File:** `MarketplaceChat.tsx`, `ChatRoomHeader.tsx`  
**Route:** `/marketplace/chat/:id` → `showBack: true`

**Situasi:**

App.tsx merender TopAppBar (56px) dengan title "Chat" dan back button. Di dalam halaman, `RoomHeader` dirender langsung sebagai elemen pertama konten — menambah header kedua yang berisi listing thumbnail, deal status chip, participant avatars, action buttons (Info, Deal, Participants).

**Total header area:**
- TopAppBar: 56px
- RoomHeader row 1 (listing + actions): `padding: '10px 14px'` + konten ≈ 60px
- Role indicator strip: `padding: '4px 14px'` + text ≈ 26px
- DealBar (conditional): `padding: '8px 14px'` ≈ 36px
- **Total: 56 + 60 + 26 + 36 = 178px** sebelum konten chat muncul

**Dampak:**

Di layar mobile portrait 667px (iPhone SE): hanya 667 − 178 = **489px** untuk konten chat — terasa sempit. Judul "Chat" di TopAppBar mubazir karena RoomHeader sudah menampilkan konteks lengkap.

**Rekomendasi (jangka panjang):** Route ini sebaiknya menggunakan `hideTopBar: true` dan menjadikan RoomHeader sebagai satu-satunya header dengan back navigation terintegrasi.

---

### GRUP K — TransactionTabBar: Tab Kecil dan Overflow Tanpa Indikator ⚠️ SEDANG

**File:** `src/components/TransactionTabBar.tsx`

```tsx
// Tab button
style={{
  flex: '0 0 auto',
  minWidth: 56,
  padding: '8px 10px',  // → height: 8+11+8 = ~30px (11 = fontSize)
  fontSize: 11, fontWeight: isActive ? 700 : 500,
  ...
}}
```

**Masalah:**
1. Tinggi tab ≈ 30px — jauh di bawah minimum 44px
2. Container `overflowX: 'auto'` tanpa `scrollbarWidth: 'none'` atau indikator visual — pengguna tidak tahu ada tab tersembunyi di kanan
3. Pada 5–6 tab, lebar total: 5 × 56px = 280px minimum, namun font + icon bisa membuatnya lebih lebar, meluber pada layar 320px

**Dampak:** Pengguna tidak sengaja melewatkan tab Escrow/Receipt karena tidak tahu bisa di-scroll. Touch target terlalu kecil, terutama pada tab aktif.

**Rekomendasi:** Tingkatkan padding ke `12px 10px`, tambah `scrollbarWidth: 'none'` + fade-out gradient di tepi kanan sebagai indikator scroll.

---

### GRUP L — RiwayatStokPakan Sticky Benar, RiwayatKesehatanHewan Tidak ⚠️ INKONSISTENSI

**Perbedaan implementasi sticky bar antar modul sejenis:**

| Halaman | Sticky `top` | Benar? |
|---|---|---|
| `StokPakan.tsx` | `top: 56` | ✅ |
| `RiwayatStokPakan.tsx` | `top: 56` | ✅ |
| `RiwayatPemberianPakan.tsx` | `top: 56` | ✅ |
| `RiwayatObatTab.tsx` | `top: 56` | ✅ |
| `TambahStokObat.tsx` | `top: 56` | ✅ |
| `ProfileBusinessInsight.tsx` | `top: 56` | ✅ |
| **`RiwayatKesehatanHewan.tsx`** | **`top: 0`** | ❌ |
| **`MarketplaceEscrowInfo.tsx`** | **`top: 0`** | ❌ |

Pola `top: 56` sudah benar dan konsisten di 6 halaman. Dua halaman menyimpang tanpa alasan jelas.

---

### GRUP M — Tinggi Header Tidak Konsisten di Berbagai Konteks ⚠️ INKONSISTENSI

| Konteks | Tinggi Header | Catatan |
|---|---|---|
| TopAppBar standar | 56px | Semua halaman main app |
| MarketplaceEscrowInfo custom header | ~52px | padding 12+16+font 16 |
| ChatRoomHeader (MarketplaceChat) | ~60px | padding 10+14+konten |
| Admin pages (`/admin/*`) | Custom (sidebar layout) | hideTopBar: true |
| Onboarding (`/onboarding`) | Custom (hideTopBar) | Logo saja |

**Dampak:** Persepsi "ketinggian" header berbeda di setiap bagian aplikasi, mengurangi koherensi visual.

---

## Peta Bug per Halaman

| Halaman | Grup Bug |
|---|---|
| `TopAppBar.tsx` | C, E |
| `BatchList.tsx` | A, C |
| `BatchProfile.tsx` | A, C, G |
| `LivestockProfile.tsx` | A, C, F, G |
| `MarketplaceDetailListing.tsx` | A, C |
| `MarketplaceEscrowInfo.tsx` | B, C, H, L, M |
| `RiwayatKesehatanHewan.tsx` | B, L |
| `MarketplaceChat.tsx` | I, J |
| `ChatRoomHeader.tsx` | C, J |
| `TransactionTabBar.tsx` | C, K |
| `/stok-pakan`, `/marketplace` (routes) | H |

---

## Prioritas Perbaikan (Dikelompokkan untuk Efisiensi)

### Batch 1 — Satu Sesi (1–2 jam) — Perbaiki KRITIS + Tabrakan
**Bug:** A, B, C (sebagian), G, L

1. Tambah `rightActions?: ReactNode` slot ke `TopAppBar`
2. Pindahkan overlay tombol dari `BatchList`, `BatchProfile`, `LivestockProfile`, `MarketplaceDetailListing` ke slot tersebut
3. Gabungkan dua fixed div di `LivestockProfile` menjadi satu container
4. Ganti `top: 52` → `top: 56` pada dropdown di `BatchProfile` + `LivestockProfile`
5. Ganti `top: 0` → `top: 56`, `zIndex: 10` → `zIndex: 101` pada sticky bar di `RiwayatKesehatanHewan` + `MarketplaceEscrowInfo`

### Batch 2 — Satu Sesi (1 jam) — Safe-Area
**Bug:** E

1. Fix `TopAppBar` height: `calc(56px + env(safe-area-inset-top, 0px))`
2. Update App.tsx `paddingTop` wrapper menggunakan nilai yang sama
3. Update semua page-level overlay `top` ke `env(safe-area-inset-top, 0px)` atau setelah TopAppBar diperbaiki ke slot baru

### Batch 3 — Satu Sesi (30 menit) — MarketplaceEscrowInfo
**Bug:** C (Escrow back button), H (duplikat header)

1. Hapus header kustom di `MarketplaceEscrowInfo.tsx`
2. Pindahkan badge "Fitur Platform" ke slot rightActions TopAppBar
3. Pastikan route config di App.tsx tetap `showBack: true`

### Batch 4 — Satu Sesi (30 menit) — Touch Targets & TabBar
**Bug:** C (keseluruhan), K

1. Naikkan padding semua tombol header ke minimum `12px 8px`
2. TransactionTabBar: `padding: '12px 10px'`, tambah scroll fade indicator

### Batch 5 — Satu Sesi (1 jam) — title truncation + Chat
**Bug:** H (title), I, J

1. Workspace Switcher: batasi maxWidth pada layar kecil
2. `MarketplaceChat.tsx`: ganti `100vh` → `100dvh`
3. Pertimbangkan `hideTopBar: true` pada `/marketplace/chat/:id` dan integrasikan back navigation ke RoomHeader

---

## Catatan Teknis

### Tidak Ditemukan Masalah di Area Berikut
- Horizontal overflow konten halaman (**tidak ada** — semua halaman menggunakan `maxWidth: 480` dengan `margin: 0 auto`)
- Icon terpotong — semua icon menggunakan emoji/fontSize, tidak ada `overflow: hidden` yang memotong icon
- Sticky header menyebabkan konten tertutup pada implementasi yang **benar** (`top: 56`) — hanya `top: 0` yang bermasalah
- BottomNav z-index — tidak ada konflik dengan konten (zIndex: 10 cukup)
- Admin panel (`/admin/*`) — menggunakan sidebar layout terpisah dengan `hideTopBar: true`, di luar scope audit ini

### Build & Type-Check Status

```bash
$ npm run build
✓ 1001 modules transformed.
✓ built in 13.82s
# Tidak ada TypeScript error
# Warning: circular chunk (tidak terkait header)
# Warning: chunk > 800KB (tidak terkait header)
```

Tidak ada perubahan implementasi yang dilakukan dalam audit ini. Build bersih.

---

*Audit oleh: Agent — P0-005-005A*
