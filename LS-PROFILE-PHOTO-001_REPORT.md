# LS-PROFILE-PHOTO-001 — Redesign Livestock Profile Gallery

**Status:** ✅ Selesai  
**File yang diubah:** `src/pages/LivestockProfile.tsx`  
**File yang TIDAK disentuh:** KTP, Edit Ternak, Tambah Ternak, data layer, upload workflow

---

## Ringkasan Perubahan

Bagian **Galeri Foto** di halaman Profil Ternak telah didesain ulang agar ketiga kategori (Foto Identitas, Foto Prestasi, Foto Terbaru) menggunakan layout yang identik.

---

## Sebelum vs Sesudah

### Sebelum
| Kategori | Layout | Ukuran Thumbnail | Kontrol |
|---|---|---|---|
| Foto Identitas | Card horizontal — thumbnail besar di kiri, teks+tombol di kanan | 96×96 | Tombol terpisah: Ganti, Lihat, Jadikan Cover |
| Foto Prestasi | Strip scroll horizontal — thumbnail kecil + date label | 84×68 (dipotong) | Tombol Cover di bawah tiap thumbnail |
| Foto Terbaru | Strip scroll horizontal — thumbnail kecil | 84×84 | Tombol Cover di bawah tiap thumbnail |

### Sesudah
| Kategori | Layout | Ukuran Thumbnail | Kontrol |
|---|---|---|---|
| Foto Identitas | **Card seragam** — header row + placeholder/thumbnail strip | **84×84** | Tombol ⋮ di overlay thumbnail |
| Foto Prestasi | **Card seragam** — header row + placeholder/thumbnail strip | **84×84** | Tombol ⋮ di overlay thumbnail |
| Foto Terbaru | **Card seragam** — header row + placeholder/thumbnail strip | **84×84** | Tombol ⋮ di overlay thumbnail |

---

## Detail Implementasi

### Struktur Card Seragam (berlaku untuk ketiga kategori)
```
<Card padding="14px 16px" border="1.5px solid var(--color-border)" borderRadius="var(--radius-md)">
  ├── Header row: [EMOJI + LABEL] ........... [Ganti/+ Tambah button]
  │
  ├── JIKA belum ada foto:
  │     Placeholder full-width (border dashed)
  │     Emoji muted + teks deskripsi
  │     Tombol "📷 Tambah Foto" (pill, primary color)
  │     (Tombol tidak muncul jika ternak Diarsipkan)
  │
  └── JIKA sudah ada foto:
        Strip scroll horizontal
        Tiap thumbnail 84×84:
          ├── Gambar (cover: border emas + bintang)
          └── Tombol ⋮ (overlay pojok kanan atas, gelap semi-transparan)
                Menu dropdown:
                  • 👁️ Lihat          → buka FotoViewer fullscreen
                  • 🔄 Ganti Foto      → (Identitas saja) pilih file baru
                  • ☆ Jadikan Cover   → set sebagai cover photo
                  • ⭐ Cover Aktif     → (disabled, emas) sudah jadi cover
                  • 🗑️ Hapus          → (Prestasi/Terbaru, merah) soft-delete
```

### Style Constants Baru
| Konstanta | Fungsi |
|---|---|
| `THUMB_SIZE = 84` | Ukuran seragam semua thumbnail |
| `THUMB_STYLE` | Style thumbnail (overflow hidden, border, radius) |
| `PLACEHOLDER_STYLE` | Style placeholder kosong (full-width, dashed border) |
| `ADD_BTN_PILL` | Tombol "Tambah Foto" di empty state |
| `HEADER_ADD_BTN` | Tombol kecil "Ganti/+ Tambah" di header card |
| `MENU_BTN` | Tombol ⋮ overlay pada thumbnail |
| `DROPDOWN` | Dropdown menu posisi absolut di bawah thumbnail |

### State Baru
- `menuOpen: string | null` — menyimpan `photoId` yang sedang buka menu ⋮
- Backdrop transparan `position:fixed` menutup menu saat klik di luar

### Yang TIDAK Berubah
- Semua handler: `handleFileSelect`, `submitIdentitas`, `submitPrestasi`, `handleDelete`, `handleSetCover`
- Upload sheets (bottom sheet Identitas & Prestasi)
- `FotoViewer` fullscreen component
- Logika cover photo (`effectiveCoverId`, `CoverStar`)
- `coverBtnStyle` → **dihapus** (sudah tidak dipakai setelah redesign)

---

## Perbaikan Tambahan

- **`html2canvas` & `jspdf` diinstall** — package ini diperlukan oleh `ktpPdf.ts` tetapi belum ada di `node_modules`, menyebabkan error Vite yang memblokir seluruh halaman. Package telah diinstall sebagai bagian dari task ini.

---

## Verifikasi

| Check | Hasil |
|---|---|
| TypeScript errors di `LivestockProfile.tsx` | ✅ 0 errors |
| Build/runtime errors di browser | ✅ Tidak ada |
| KTP tidak disentuh | ✅ Tidak ada perubahan di `KtpOfficialCard`, `KtpFullscreenViewer`, `ktpPdf` |
| Edit Ternak tidak disentuh | ✅ Tidak ada perubahan |
| Tambah Ternak tidak disentuh | ✅ Tidak ada perubahan |
| Data layer tidak disentuh | ✅ `livestockFotoData.ts` tidak diubah |
| Upload workflow tidak disentuh | ✅ `handleFileSelect`, submit handlers, refs tidak diubah |
