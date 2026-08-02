==================================================
PROFILE MODULE CONSTITUTION
==================================================

Version:
1.0

Status:
Official Architecture

==================================================
PURPOSE
==================================================

Profile merupakan Control Center
bagi seluruh identitas pengguna TernakHub.

Profile

BUKAN

halaman biodata biasa.

Profile menjadi pusat:

• Akun

• Workspace

• Business Insight

• Subscription

• Security

• Notification

• About TernakHub

• Support

==================================================
CORE PRINCIPLE
==================================================

Profile

BUKAN

Dashboard.

Profile

BUKAN

Marketplace.

Profile

BUKAN

Livestock.

Profile merupakan Control Center.

Semua modul lain tidak tergantung
pada keberadaan Profile.

Profile hanya membaca
atau mengelola data yang dimiliki.

Profile tidak boleh mengubah
arsitektur Workspace.

==================================================
WORKSPACE PRINCIPLE
==================================================

Workspace merupakan inti arsitektur TernakHub.

Perpindahan Workspace

BUKAN

dilakukan pada halaman Profile.

Workspace Switching

tetap berada di Global Header
(setiap halaman, bukan hanya Profile).

Profile hanya digunakan untuk:

Kelola Workspace.

Bukan untuk:

❌ Pindah Workspace aktif

❌ Mengganti konteks sesi

❌ Duplikasi Global Header Workspace Switcher

==================================================
MAIN MENU
==================================================

Minimal:

• Account

• Workspace

• Business Insight

• Subscription

• Security

• Notification

• About TernakHub

• Support

Urutan menu mencerminkan
prioritas penggunaan harian.

==================================================
ACCOUNT
==================================================

Kelola identitas pengguna.

Minimal:

• Foto profil

• Nama lengkap

• Username

• Email

• Nomor HP

• Status Verifikasi

Catatan:

Email dan Username adalah identitas permanen.
Perubahan email dan username memerlukan
konfirmasi keamanan tambahan.

==================================================
WORKSPACE
==================================================

Workspace Management.

Minimal:

• Daftar Workspace

• Tambah Workspace

• Edit Workspace

• Arsip Workspace
  (jika didukung)

• Role

• Membership

Workspace yang dikelola di sini
merupakan Workspace milik pengguna tersebut.

Tidak boleh mengelola Workspace
milik pengguna lain.

==================================================
BUSINESS INSIGHT
==================================================

Business Insight

BUKAN

Wallet.

BUKAN

Dompet Digital.

BUKAN

Payment Gateway.

Business Insight mengolah data
yang sudah dimiliki oleh Workspace.

Tidak membuat data baru.

Tidak menyimpan transaksi keuangan baru.

==================================================
BUSINESS INSIGHT — DATA
==================================================

Seluruh data berasal dari modul lain.

Minimal:

• Nilai Aset Ternak
  ← src/data/livestockData.ts

• Nilai Stok Pakan
  ← src/data/stokInventarisData.ts

• Nilai Stok Obat
  ← src/data/stokObatData.ts

• Pendapatan Marketplace
  ← src/data/marketplaceTransaksiData.ts

• Pengeluaran

• Margin

• Grafik

• Laporan

Semua angka dibaca live
dari modul asalnya.

Tidak boleh ada duplikasi data
di dalam modul Profile.

==================================================
BUSINESS INSIGHT — ATURAN BACA
==================================================

Profile membaca data modul lain.

Profile

TIDAK

menulis ke modul lain.

Profile

TIDAK

menyimpan salinan data bisnis.

Satu-satunya pengecualian:

Preferensi tampilan laporan
(rentang waktu, format, filter)
dapat disimpan di dalam Profile.

==================================================
SUBSCRIPTION
==================================================

Kelola paket langganan Workspace.

Minimal:

• Paket aktif

• Status langganan

• Upgrade paket

• Riwayat langganan

Subscription yang dikelola di sini
merujuk pada Workspace aktif pengguna.

==================================================
SUBSCRIPTION — TIER
==================================================

FREE

↓

Fitur dasar tersedia.
Tidak dapat mengirim konten
ke News & Event.
Tidak dapat membuat listing Marketplace
(tergantung kebijakan masing-masing modul).

PRO

↓

Fitur lebih lengkap.
Dapat mengirim News dan Event
ke News & Event Module.

ENTERPRISE

↓

Fitur penuh.
Dapat mengirim News dan Event
ke News & Event Module.

==================================================
SECURITY
==================================================

Minimal:

• Ubah Password

• Login Session aktif

• Daftar Device

• Two-Factor Authentication (2FA)
  jika tersedia

Setiap perubahan di Security

WAJIB

dicatat di Audit Log.

Session yang tidak aktif
dapat diakhiri oleh pengguna.

==================================================
NOTIFICATION
==================================================

Kelola preferensi notifikasi.

Minimal:

• Push Notification

• Email

• WhatsApp
  jika tersedia

Notifikasi

TIDAK

disimpan di modul Profile.

Notifikasi dibaca live
dari modul asalnya
(Marketplace, News & Event, dll.).

Profile hanya menyimpan
preferensi (aktif/nonaktif)
per channel notifikasi.

==================================================
ABOUT TERNAKHUB
==================================================

Minimal:

• Tentang Kami

• Filosofi

• Roadmap

• Changelog

• Versi aplikasi

• Partner

• Privacy Policy

• Terms of Service

• License

Konten bersifat statis
(tidak tergantung Workspace).

Konten dapat diperbarui
tanpa mengubah arsitektur modul.

==================================================
SUPPORT
==================================================

Minimal:

• Help Center

• FAQ

• Feedback

• Report Bug

• Contact

Support tidak menyimpan tiket secara permanen
di modul Profile pada versi awal.

Feedback dan Bug Report dapat
diteruskan ke sistem eksternal.

==================================================
ID & DATA
==================================================

Seluruh ID di modul Profile

WAJIB

menggunakan UUID v4
dari generateUUID().

Tidak boleh menggunakan
ID sequential atau hardcoded.

==================================================
AUDIT TRAIL
==================================================

Seluruh perubahan data sensitif

WAJIB

dicatat dalam Audit Log.

Minimal:

• Perubahan email

• Perubahan password

• Perubahan nomor HP

• Penambahan/penghapusan device

• Perubahan 2FA

• Perubahan Workspace (tambah/edit/arsip)

Audit Trail bersifat permanen.

Tidak dapat dihapus.

==================================================
UI PRINCIPLE
==================================================

Setiap halaman dalam Profile

WAJIB

memiliki Empty State
yang informatif ketika data kosong.

Profile menggunakan navigasi
yang konsisten dengan modul lain.

Global Header tidak dimodifikasi
oleh modul Profile.

==================================================
LARANGAN ABSOLUT
==================================================

❌ Menempatkan Workspace Switcher
   di halaman Profile

❌ Menyimpan salinan data bisnis
   dari modul lain (Livestock, Pakan, Obat, dll.)

❌ Menulis ke modul lain
   dari dalam modul Profile

❌ Menghapus Audit Trail

❌ Membuat transaksi keuangan baru

❌ Mengubah arsitektur Global Header

❌ Mengubah Constitution modul lain

==================================================
GENERAL RULES
==================================================

Profile tidak boleh
mengubah arsitektur Workspace.

Profile hanya membaca
atau mengelola data yang dimiliki.

Seluruh implementasi
PROFILE-001 dan seterusnya

WAJIB

mengikuti Constitution ini.

==================================================
MODUL TERDAFTAR
==================================================

PROFILE-000 — Constitution (dokumen ini)

PROFILE-001 dan seterusnya
mengacu pada Constitution ini.

==================================================
END OF CONSTITUTION
==================================================

Versi: 1.0 — Dibuat: 2026-07-15
Setiap perubahan arsitektur wajib
diperbarui di dokumen ini terlebih dahulu.
