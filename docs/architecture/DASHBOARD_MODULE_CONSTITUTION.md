==================================================
DASHBOARD MODULE CONSTITUTION
==================================================

Version:
1.0

Status:
Official Architecture

==================================================
PURPOSE
==================================================

Dashboard merupakan

CONTROL CENTER

Workspace.

Dashboard adalah halaman pertama
yang dilihat pengguna saat membuka
Workspace aktif.

Dashboard hanya:

• membaca

• merangkum

• memprioritaskan

• memberikan shortcut

• memberikan AI Insight

==================================================
CORE PRINCIPLE
==================================================

Dashboard

BUKAN

Master Data.

Dashboard

BUKAN

CRUD.

Dashboard

BUKAN

tempat edit data.

Dashboard

BUKAN

tempat penyimpanan data.

Dashboard hanya
menampilkan
ringkasan dari
modul lain.

Semua modul lain tidak tergantung
pada keberadaan Dashboard.

==================================================
DATA SOURCE
==================================================

Dashboard
tidak memiliki
database sendiri.

Seluruh informasi
berasal dari modul lain,
dibaca secara live,
minimal:

• Livestock
  ← src/data/livestockData.ts

• Marketplace
  ← src/data/marketplaceTransaksiData.ts,
    src/data/marketplaceListingData.ts

• Feed (Stok Pakan)
  ← src/data/stokInventarisData.ts

• Medicine (Stok Obat)
  ← src/data/stokObatData.ts

• News & Event
  ← modul News & Event

• Business Insight
  ← src/data/businessInsightData.ts

• Workspace
  ← src/data/workspaceManagementData.ts

Tidak boleh ada
duplikasi data
di dalam modul Dashboard.

Tidak boleh ada
data yang di-cache
secara permanen
di dalam modul Dashboard.

==================================================
WORKSPACE
==================================================

Dashboard
mengikuti

Workspace Aktif.

Pergantian Workspace
tetap dilakukan
melalui Global Header.

Dashboard otomatis
mengikuti Workspace
yang sedang aktif.

Dashboard

TIDAK

boleh menempatkan
Workspace Switcher
sendiri.

Dashboard

TIDAK

boleh mengubah
arsitektur Workspace.

==================================================
MAIN SECTION
==================================================

Minimal terdiri dari:

1.

Header

↓

2.

AI Insight

↓

3.

Quick Action

↓

4.

Summary Card

↓

5.

Today's Activity

↓

6.

Alert & Reminder

↓

7.

Recent Activity

↓

8.

News & Event

↓

9.

Business Snapshot

Urutan section mencerminkan
prioritas informasi harian.

==================================================
HEADER
==================================================

Minimal:

• Workspace

• Greeting

• Membership

• Search

Workspace Switcher
tetap berada
di Global Header.

Header Dashboard

TIDAK

menduplikasi
Workspace Switcher
Global Header.

==================================================
AI INSIGHT
==================================================

Dashboard menjadi
entry point utama
AI Insight.

AI hanya
memberikan:

• Ringkasan

• Prioritas

• Rekomendasi

AI

TIDAK

mengubah data.

AI

TIDAK

menyimpan data baru.

Seluruh data yang diolah AI
berasal dari modul lain,
dibaca live.

==================================================
QUICK ACTION
==================================================

Quick Action
berupa shortcut
ke modul lain.

Contoh:

• Tambah Ternak

• Catat Bobot

• Catat Pakan

• Tambah Stok Pakan

• Tambah Stok Obat

• Marketplace

• News

Quick Action
tidak memiliki
logic sendiri.

Quick Action
hanya melakukan
navigasi ke halaman
modul asal.

Aksi (tambah/catat/simpan)
tetap dieksekusi
di dalam modul asal,
bukan di dalam Dashboard.

==================================================
SUMMARY CARD
==================================================

Summary hanya membaca
data dari modul.

Contoh:

• Total Ternak

• Nilai Aset

• Stok Pakan

• Stok Obat

• Kasus Kesehatan

Summary Card

TIDAK

menghitung ulang
logika bisnis modul asal.

Summary Card
hanya menampilkan
hasil yang sudah tersedia
dari modul asal.

==================================================
TODAY ACTIVITY
==================================================

Menampilkan
aktivitas hari ini.

Data berasal
dari modul lain.

Today's Activity

TIDAK

memiliki
data store sendiri.

==================================================
ALERT
==================================================

Alert merupakan
prioritas tertinggi.

Contoh:

• Obat hampir habis

• Pakan menipis

• Jadwal vaksin

• Bobot terlambat dicatat

• Event hari ini

Alert dibaca live
dari kondisi data
modul asal.

Alert

TIDAK

dapat ditutup
(dismiss) secara permanen
selama kondisi pemicu
masih berlaku.

==================================================
RECENT ACTIVITY
==================================================

Timeline singkat.

Bukan Audit Trail.

Menampilkan
aktivitas terbaru
dari seluruh modul.

Recent Activity

TIDAK

menggantikan
Audit Trail modul
Profile/Escrow/Transport.

Recent Activity
bersifat ringkasan,
bukan pencatatan permanen.

==================================================
NEWS & EVENT
==================================================

Menampilkan
ringkasan News
dan Event.

Data berasal
dari modul
News & Event.

Hanya konten
dengan status Published
yang ditampilkan,
mengikuti aturan
News & Event Constitution.

==================================================
BUSINESS SNAPSHOT
==================================================

Business Snapshot

Read Only.

Data berasal dari:

Business Insight.

Tidak menghitung
ulang data.

Business Snapshot
merupakan ringkasan singkat
dari Business Insight,
bukan pengganti
halaman Business Insight.

==================================================
GENERAL RULE
==================================================

Dashboard

tidak boleh
mengubah data.

Dashboard

tidak boleh
menyimpan data.

Dashboard

tidak boleh
menggantikan
fungsi modul lain.

Dashboard

tidak boleh
menulis ke modul lain.

Seluruh implementasi
DB-001 dan seterusnya

WAJIB

mengikuti Constitution ini.

==================================================
LARANGAN ABSOLUT
==================================================

❌ Menempatkan Workspace Switcher
   di halaman Dashboard

❌ Menyimpan salinan data bisnis
   dari modul lain (Livestock, Pakan, Obat,
   Marketplace, News & Event, dll.)

❌ Menulis ke modul lain
   dari dalam modul Dashboard

❌ Membuat CRUD/form edit
   di dalam Dashboard

❌ Menghitung ulang logika bisnis
   yang sudah ada di modul asal

❌ Menggantikan Audit Trail
   atau Business Insight

❌ Mengubah arsitektur Global Header

❌ Mengubah Constitution modul lain

==================================================
MODUL TERDAFTAR
==================================================

DB-000 — Constitution (dokumen ini)

DB-001 dan seterusnya
mengacu pada Constitution ini.

==================================================
END OF CONSTITUTION
==================================================

Versi: 1.0 — Dibuat: 2026-07-15
Setiap perubahan arsitektur wajib
diperbarui di dokumen ini terlebih dahulu.
