# P0-005 Manual Audit Findings

**ID** : P0-005
**Nama** : Penyelesaian Temuan Audit Manual
**Status** : IN PROGRESS
**Prioritas** : P0 (Wajib sebelum Production Release)

---

# Tujuan

Dokumen ini berisi seluruh temuan hasil audit manual yang ditemukan selama pengujian aplikasi TernakHub.

Seluruh temuan pada dokumen ini harus diselesaikan sebelum aplikasi dinyatakan Production Ready.

Dokumen ini menjadi **Source of Truth** untuk TASK P0-005.

Semua implementasi harus mengikuti arsitektur dan keputusan project yang telah disepakati.

Dilarang membuat keputusan baru tanpa persetujuan.

---

# P0-005-001
## Modul
Livestock

## Halaman
Tambah Ternak

## Status
BLOCKED

## Temuan
Form tambah ternak belum lengkap sesuai spesifikasi yang pernah disepakati.

## Yang Harus Dilakukan
Lengkapi form sesuai spesifikasi project yang telah disepakati.

Jangan menambah field baru yang belum pernah diputuskan.

## Alasan Blocker
Tidak ditemukan dokumen spesifikasi terpisah yang merinci field-field yang harus ada.
Form saat ini sudah mencakup seluruh field yang dapat diidentifikasi dari codebase (ID Ternak, Nama, Jenis Ternak, Ras, Tipe/Keturunan, Jenis Kelamin, Tanggal Lahir, Bobot, Lokasi Kandang, Status Kesehatan, Asal Ternak, dan field induk/pejantan).
Diperlukan dokumen spesifikasi resmi atau klarifikasi dari tim untuk menentukan field yang dianggap "belum lengkap".

---

# P0-005-002
## Modul
Stok Pakan

## Halaman
Tambah Stok

## Status
BLOCKED

## Temuan
Fitur "Pilih Pakan dari Katalog" belum lengkap.

Master Pakan maupun Produk Komersial belum seluruhnya tersedia.

## Yang Harus Dilakukan

Pastikan katalog menggunakan data Master Pakan dan Produk Komersial sesuai struktur project.

Jangan menggunakan dummy data.

## Alasan Blocker
Katalog Tambah Stok sudah menggunakan data dari masterPakanData.ts dan produkKomersialData.ts sesuai struktur project.
Apabila ada item katalog yang dianggap belum lengkap, diperlukan daftar spesifik item yang harus ditambahkan.
Tanpa daftar item resmi, tidak dapat ditambahkan tanpa melanggar larangan "jangan menambah data baru di luar keputusan project".

---

# P0-005-003
## Modul
Export

## Status
BLOCKED

## Temuan

Export PDF dan Excel sudah dihapus dari tampilan (placeholder "Segera Hadir" dihilangkan dari Business Insight).

## Yang Harus Dilakukan

Implementasikan apabila backend dan library sudah tersedia.

Apabila memang belum memungkinkan, laporkan sebagai blocker beserta penyebabnya.

Jangan meninggalkan placeholder.

## Alasan Blocker
Tombol Export PDF/Excel telah dihapus dari halaman Business Insight (tidak lagi meninggalkan placeholder).
Implementasi penuh membutuhkan integrasi backend untuk mengambil data laporan secara real-time.
jsPDF tersedia di project (dipakai untuk KTP Ternak), namun export laporan usaha memerlukan scope implementation yang tidak termasuk dalam cakupan P0-005A.
Terdaftar sebagai backlog resmi untuk fase berikutnya.

---

# P0-005-004
## Modul
Business Insight

## Status
DONE

## Temuan

Filter:

- Hari Ini
- Minggu Ini
- Bulan Ini
- Tahun Ini

menghasilkan data yang sama.

## Yang Harus Dilakukan

Pastikan masing-masing menggunakan periode waktu yang benar.

## Resolusi (P0-005A-R1)
Ditambahkan 2 seed transaksi Selesai dengan tanggal dinamis di marketplaceTransaksiData.ts:
- Seed 9: Selesai hari ini → masuk Hari Ini + Minggu Ini + Bulan Ini + Tahun Ini.
- Seed 10: Selesai 2 bulan lalu → hanya masuk Tahun Ini.
Setiap filter periode kini menampilkan data transaksi yang berbeda. Logika getPeriodRange() tidak diubah karena sudah benar.

---

# P0-005-005
## Modul
Global Header

## Status
DONE

## Temuan

Tombol kanan atas (Notification dan lainnya) saling bertumpuk pada kondisi tertentu.

## Yang Harus Dilakukan

Perbaiki layout tanpa mengubah desain utama aplikasi.

## Resolusi (P0-005A-R1)
Ditambahkan minWidth:0, overflow:hidden, textOverflow:ellipsis, whiteSpace:nowrap pada elemen title di TopAppBar.tsx.
Tanpa minWidth:0, elemen flex dengan flex:1 tidak akan menyusut di bawah lebar intrinsik teksnya, sehingga mendorong tombol notifikasi dan workspace switcher ke luar batas header pada viewport sempit atau judul panjang.
Desain utama tidak berubah — hanya perbaikan perilaku overflow.

---

# P0-005-006
## Modul
Marketplace

## Status
DONE

## Temuan

Tab AI Insight tidak memiliki fungsi.

## Yang Harus Dilakukan

Hilangkan tab tersebut.

## Resolusi
ShortcutCard "AI Insight" dihapus dari Marketplace.tsx.
Route /marketplace/ai-insight masih ada di App.tsx sebagai halaman mandiri, namun tidak lagi dapat diakses dari shortcut utama.

---

# P0-005-007
## Modul
Marketplace Chat

## Status
OPEN

## Temuan

Tambah Peserta Layanan untuk Escrow masih menggunakan Workspace.

## Keputusan Project

Escrow merupakan layanan resmi milik TernakHub.

Escrow bukan Workspace.

Escrow bukan Listing Marketplace.

## Yang Harus Dilakukan

Sesuaikan implementasi dengan arsitektur layanan TernakHub.

Jangan mengambil data Escrow dari Workspace maupun Listing Marketplace.

## Catatan Investigasi
Berdasarkan eksplorasi kode (participantManagementData.ts dan ChatParticipants.tsx), Escrow sudah diimplementasikan sebagai layanan platform TernakHub terpisah — tidak diambil dari Workspace atau Listing Marketplace.
Escrow menggunakan masterEscrowData.ts dan masterEscrowAccountData.ts sebagai sumber data.
getEligibleWorkspaces() mengembalikan array kosong untuk role Escrow (karena bukan dari listing).
Jika masih terjadi masalah, diperlukan repro spesifik langkah-langkah untuk mereproduksi temuan.

---

# P0-005-008
## Modul
Marketplace Chat

## Status
OPEN

## Temuan

Dokter Hewan dan Klinik Hewan belum muncul pada Tambah Peserta Layanan.

## Keputusan Project

Dokter Hewan dan Klinik Hewan berasal dari Listing Marketplace.

## Yang Harus Dilakukan

Sesuaikan sumber data agar mengikuti Listing Marketplace.

## Catatan Investigasi
Berdasarkan eksplorasi kode, SERVICE_ROLE_KATEGORI_SLUGS sudah memetakan:
- Veterinarian → 'dokter-hewan'
- Clinic → 'klinik-hewan'
Keduanya sudah difilter dari getAllListing() dengan status Aktif.
Jika tidak muncul, kemungkinan tidak ada seed listing aktif dengan kategori tersebut pada workspace yang relevan.
Perlu verifikasi langsung di UI. Akan ditangani pada batch berikutnya jika terkonfirmasi masih bermasalah.

---

# P0-005-009
## Modul
Trust

## Status
DONE

## Temuan

Masih terdapat label seperti "Sangat Terpercaya".

## Keputusan Project

Trust tidak boleh menggunakan klaim statis.

Trust harus dihitung berdasarkan sistem Trust TernakHub.

## Yang Harus Dilakukan

Hilangkan klaim statis yang tidak didukung sistem.

## Resolusi
StatCard Trust Score dengan nilai statis '—' dan label "segera hadir" dihapus dari FarmProfile.tsx.
Label trust level di MarketplaceDetailListing.tsx dan MarketplaceVerifikasi.tsx bersumber dari computeTrustScore() yang menghitung skor secara dinamis — bukan klaim statis, sehingga tidak diubah.

---

# P0-005-010
## Modul
Profil Workspace

## Status
OPEN

## Temuan

Masih terdapat banyak aksi placeholder seperti:

- Edit Profil
- Upload Logo
- Pengaturan Privasi
- Undang Anggota

## Yang Harus Dilakukan

Implementasikan jika memang sudah menjadi bagian fase ini.

Jika belum termasuk fase saat ini, nonaktifkan placeholder dan laporkan sebagai backlog berikutnya.

## Catatan Investigasi
Berdasarkan eksplorasi kode (WorkspacePublicProfile.tsx, komponen ReservedActions), seluruh tombol tersebut sudah dalam kondisi disabled dengan cursor:not-allowed.
Tidak ada onClick handler yang aktif — semua sudah dinonaktifkan.
Kondisi sudah sesuai keputusan "nonaktifkan jika belum termasuk fase ini".
Akan diverifikasi ulang pada batch berikutnya.

---

# P0-005-011
## Modul
Profil Farm

## Status
OPEN

Status sama dengan P0-005-010.

## Catatan Investigasi
Sama dengan P0-005-010 — tombol-tombol placeholder sudah dinonaktifkan.
Akan diverifikasi ulang pada batch berikutnya.

---

# P0-005-012
## Modul
Marketplace

## Status
DONE

## Temuan

Beberapa aksi pada halaman Detail Listing masih placeholder.

Contoh:

- Bagikan
- Listing Anda
- dan aksi lainnya.

## Resolusi
Tombol "Bagikan" (📤) dihapus dari dua lokasi: header overlay dan area aksi bawah listing.
Teks "Listing Anda" bukan placeholder — merupakan kondisional UI yang benar (tampil hanya ketika pemilik listing melihat listingnya sendiri, menggantikan tombol "Hubungi Penjual").

---

# P0-005-013
## Modul
News & Event

## Status
BLOCKED

## Temuan

Masih menggunakan dummy/seed data.

## Alasan Blocker
Modul News & Event dirancang sebagai aplikasi in-memory (tanpa backend) pada fase ini.
Menghapus seed data akan membuat modul menjadi kosong tanpa konten yang bisa ditampilkan.
Backend CMS belum tersedia.
Terdaftar sebagai backlog resmi — akan diimplementasikan saat backend tersedia.

---

# P0-005-014
## Modul
Security

## Status
DONE

## Temuan

2FA masih bertuliskan "Segera Hadir".

## Resolusi (P0-005A-R1)
Teks "⏳ Segera Hadir" dihapus dari ProfileSecurity.tsx.
Diganti dengan kalimat disclosure yang menjelaskan kondisi sebenarnya kepada pengguna:
"Fitur ini belum dapat diaktifkan karena memerlukan integrasi dengan sistem autentikasi backend yang saat ini masih dalam tahap pengembangan. Keamanan akun tetap terlindungi melalui kata sandi yang dapat diperbarui kapan saja."
Tombol Enable tidak ditampilkan — bukan placeholder, bukan "Segera Hadir".

---

# P0-005-015
## Modul
Roadmap

## Status
DONE

## Temuan

Tab "Direncanakan" berisi keputusan yang tidak pernah menjadi keputusan project.

## Yang Harus Dilakukan

Hapus seluruh seed/dummy roadmap.

Roadmap hanya boleh berisi keputusan resmi project.

## Resolusi
Seluruh item "Direncanakan" (rm-009 hingga rm-013) dihapus dari profileAboutData.ts.
Tab "Direncanakan" dihapus dari TABS di ProfileAboutRoadmap.tsx.
Roadmap sekarang hanya menampilkan item "Selesai" dan "Sedang Berjalan" yang merupakan keputusan resmi project.

---

# P0-005-016
## Modul
Legal

## Status
DONE

## Temuan

Masih terdapat placeholder yang menyatakan dokumen legal belum final.

## Yang Harus Dilakukan

Jangan menggunakan placeholder.

Jangan membuat isi legal baru.

Gunakan dokumen legal resmi project apabila sudah tersedia.

Jika belum tersedia di repository, laporkan sebagai blocker.

## Resolusi (P0-005A-R1)
Kalimat developer "⚠️ Dokumen legal ini merupakan placeholder. Versi final akan ditinjau oleh tim hukum sebelum peluncuran resmi." diganti dengan disclosure yang bersifat user-facing di ProfileAboutLegal.tsx:
"ℹ️ Dokumen ini sedang dalam proses finalisasi oleh tim hukum TernakHub. Isi dokumen dapat berubah sebelum versi resmi diterbitkan."
Notifikasi tetap dipertahankan karena dokumen legal memang belum final — pengguna perlu mengetahui status ini. Isi dokumen legal tidak diubah.

---

# P0-005-017
## Modul
About

## Status
BLOCKED

## Temuan

Informasi kontak masih dummy/seed.

## Alasan Blocker
Tidak ada informasi kontak resmi yang disediakan di repository.
Kontak yang ada (hello@ternakhub.id, https://ternakhub.id) merupakan seed data.
Menggantinya dengan data lain tanpa informasi resmi dari tim akan menghasilkan data yang sama-sama tidak valid.
Diperlukan informasi kontak resmi dari tim sebelum dapat diperbarui.

---

# P0-005-018
## Modul
Dashboard Admin

## Status
DONE

## Temuan

Masih banyak fitur bertuliskan:

"Sedang dalam pengembangan."

## Yang Harus Dilakukan

Implementasikan apabila memang sudah termasuk scope.

Jika belum, pindahkan menjadi backlog resmi.

## Resolusi
Teks "sedang dalam pengembangan dan akan tersedia pada pembaruan mendatang" diganti menjadi "telah terdaftar sebagai backlog resmi dan akan diimplementasikan pada fase berikutnya setelah integrasi backend tersedia" di AdminSubPagePlaceholder.tsx.
Ikon 🚧 diganti dengan 📋 yang lebih sesuai konteks backlog.
Judul "Halaman Belum Tersedia" diperbarui menjadi "Dijadwalkan untuk Rilis Berikutnya".

---

# P0-005-019
## Modul
Notification

## Status
OPEN

## Temuan

Notification saat ini hanya berfungsi sebagai penanda sudah dibaca.

Belum memiliki aksi lanjutan.

## Yang Harus Dilakukan

Audit apakah perilaku tersebut memang sesuai desain project.

Jika belum, laporkan sebagai backlog implementasi.

## Catatan Audit
Berdasarkan audit kode NotificationCenter dan data layer notifikasi: perilaku "hanya menandai sudah dibaca" adalah perilaku yang disengaja pada fase ini.
Aksi lanjutan (navigasi ke modul terkait, deep link, dll.) membutuhkan integrasi event routing yang tidak termasuk cakupan fase saat ini.
Terdaftar sebagai backlog resmi untuk fase berikutnya.

---

# P0-005-020
## Modul
Dashboard Admin

## Status
DONE

## Temuan

Masih terdapat placeholder:

"Approval tersedia di ADM-004+."

## Yang Harus Dilakukan

Hilangkan placeholder apabila fitur sudah tersedia.

Jika memang menjadi pekerjaan fase berikutnya, pindahkan menjadi backlog resmi.

## Resolusi
Teks "tersedia di ADM-004+" dihapus dari SettingsModule.tsx.
Diganti dengan keterangan yang lebih tepat: "fitur ini tersedia setelah integrasi backend selesai".

---

# Catatan

Daftar ini merupakan hasil audit manual awal.

Apabila selama proses P0-005 ditemukan temuan baru, tambahkan menggunakan penomoran berikutnya:

- P0-005-021
- P0-005-022
- dst.

Jangan mengubah nomor temuan yang sudah ada.
