==================================================
TRANSACTION CONVERSATION CONSTITUTION
==================================================

Version:
1.0

Status:
Official Architecture

==================================================
PURPOSE
==================================================

Transaction Conversation merupakan
media komunikasi berbasis transaksi
di dalam ekosistem TernakHub Marketplace.

Conversation

BUKAN

chat biasa.

Conversation

BUKAN

WhatsApp.

Conversation merupakan
pendukung transaksi.

Seluruh komunikasi, bukti,
dan catatan dalam Conversation
mengacu pada transaksi yang sedang berjalan.

==================================================
CORE PRINCIPLE
==================================================

Conversation hanya dapat dibuka
dalam konteks transaksi aktif.

Tidak ada Conversation
tanpa transaksi.

Conversation

TIDAK

berdiri sendiri.

Conversation merupakan
lapisan komunikasi resmi
yang mendukung:

• Evidence (Bukti)

• Audit Trail

• Escrow

• Transport

• Veterinarian

==================================================
PARTICIPANT
==================================================

Conversation menggunakan
sistem Participant.

Participant

BUKAN

hardcode Buyer ↔ Seller.

Participant bergabung
berdasarkan peran dalam transaksi.

Participant yang diakui:

• Buyer
  Pihak pembeli dalam transaksi.

• Seller
  Pihak penjual dalam transaksi.

• Escrow (Opsional)
  Bergabung ketika dana dititipkan
  melalui layanan escrow.

• Transport (Opsional)
  Bergabung ketika layanan
  pengiriman ternak diaktifkan.

• Veterinarian (Opsional)
  Bergabung ketika pemeriksaan
  kesehatan ternak diperlukan.

Setiap Participant memiliki:

• Role
• Hak akses spesifik
• Quick Template yang sesuai peran

Participant bergabung secara otomatis
berdasarkan layanan yang diaktifkan
dalam transaksi.

Participant tidak dapat bergabung
ke Conversation di luar transaksi
yang bersangkutan.

==================================================
CONVERSATION ASSISTANT
==================================================

Setiap Role memiliki
Conversation Assistant
dengan Quick Template masing-masing.

Quick Template membantu Participant
berkomunikasi secara efektif
dan konsisten.

Minimal Role yang memiliki Quick Template:

• Buyer
• Seller
• Escrow
• Transport
• Veterinarian

==================================================
QUICK TEMPLATE — BUYER
==================================================

Minimal:

• Konfirmasi Minat Beli

• Minta Detail Ternak

• Minta Foto Terbaru

• Minta Video Terbaru

• Konfirmasi Alamat Pengiriman

• Konfirmasi Penerimaan

==================================================
QUICK TEMPLATE — SELLER
==================================================

Minimal:

• Konfirmasi Ketersediaan

• Kirim Detail Ternak

• Kirim Foto Terbaru

• Kirim Video Terbaru

• Konfirmasi Pengiriman

• Minta Konfirmasi Penerimaan

==================================================
QUICK TEMPLATE — ESCROW
==================================================

Minimal:

• Minta Bukti Transfer

• Minta Foto Saat Diterima

• Minta Video Saat Diterima

• Minta Nomor Resi

• Konfirmasi Dana Diterima

• Konfirmasi Dana Ditahan

• Notifikasi Pelepasan Dana

==================================================
QUICK TEMPLATE — TRANSPORT
==================================================

Minimal:

• Foto Loading

• Video Loading

• Lokasi Berangkat

• Update Posisi

• Foto Unloading

• Video Unloading

• Konfirmasi Tiba

==================================================
QUICK TEMPLATE — VETERINARIAN
==================================================

Minimal:

• Foto Mata

• Foto Mulut

• Foto Kaki

• Video Berjalan

• Laporan Kondisi Kesehatan

• Rekomendasi Tindakan

• Sertifikat Kesehatan

==================================================
AI ASSISTANT
==================================================

AI Assistant tersedia di dalam Conversation
sebagai pendukung, bukan pengambil keputusan.

AI dapat:

• Merekomendasikan Quick Template
  yang relevan berdasarkan konteks transaksi

• Menandai Candidate Evidence
  dari pesan atau lampiran dalam Conversation

• OCR Screenshot
  untuk mengekstrak informasi dari gambar

• OCR Dokumen
  untuk mengekstrak informasi dari dokumen

AI

TIDAK

mengambil keputusan transaksi.

AI

TIDAK

mengonfirmasi, menolak,
atau memproses pembayaran.

AI

TIDAK

menggantikan peran Participant manapun.

AI hanya memberikan rekomendasi.
Keputusan tetap berada pada Participant.

==================================================
CHAT
==================================================

Chat merupakan media komunikasi
antar Participant dalam transaksi.

Chat

BUKAN

Evidence.

Chat hanya mencatat
percakapan antara Participant.

Chat tidak memiliki kekuatan hukum
sebagai bukti transaksi secara mandiri.

Untuk menjadi bukti, pesan atau lampiran
harus secara eksplisit
didaftarkan sebagai Evidence.

==================================================
EVIDENCE
==================================================

Evidence merupakan bukti resmi transaksi.

Evidence dipisahkan dari Chat.

Evidence memiliki:

• ID unik (UUID v4)

• Kategori

• Timestamp pencatatan

• Participant yang mencatat

• Lampiran (jika ada)

• Status (Pending / Verified / Disputed)

Kategori Evidence minimal:

• Agreement
  Kesepakatan harga, syarat, dan kondisi.

• Payment
  Bukti pembayaran atau transfer dana.

• Delivery
  Bukti pengiriman ternak.

• Arrival
  Bukti kedatangan ternak di tujuan.

• Livestock Condition
  Kondisi ternak (foto, video, laporan).

• Document
  Dokumen resmi (sertifikat, surat jalan, dll.).

• Other
  Bukti lain yang relevan dengan transaksi.

Evidence

TIDAK

dapat dihapus setelah dicatat.

Evidence dapat ditandai
sebagai Disputed oleh Participant
jika ada perselisihan.

==================================================
AUDIT TRAIL
==================================================

Audit Trail mencatat
seluruh perubahan status
dan kejadian penting dalam transaksi.

Audit Trail hanya menyimpan metadata.

Audit Trail

BUKAN

salinan Chat atau Evidence.

Event yang dicatat minimal:

• Deal
  Kesepakatan harga antara Buyer dan Seller.

• Payment
  Pembayaran dilakukan oleh Buyer.

• Holding Fund
  Dana ditahan oleh Escrow.

• Delivery
  Ternak dikirimkan oleh Seller / Transport.

• Arrival
  Ternak tiba di lokasi Buyer.

• Dispute
  Perselisihan diajukan oleh salah satu Participant.

• Resolution
  Perselisihan diselesaikan.

• Transfer Release
  Dana dilepaskan oleh Escrow ke Seller.

• Final Confirmation
  Konfirmasi akhir transaksi selesai.

Audit Trail bersifat permanen.

Audit Trail

TIDAK

dapat dihapus.

Audit Trail dibaca oleh seluruh
Participant yang terlibat dalam transaksi.

==================================================
RETENTION
==================================================

Chat Umum

Retensi default:
90 Hari
(dapat diubah sesuai kebijakan sistem)

Setelah periode retensi,
Chat dapat dihapus secara otomatis.

Evidence

Retensi lebih lama dari Chat.
Minimal selama transaksi belum ditutup
secara permanen.
Setelah transaksi ditutup,
Evidence disimpan sesuai
kebijakan arsip sistem.

Audit Trail

Disimpan sesuai kebijakan sistem.
Tidak terikat pada periode retensi Chat.
Tidak dapat dihapus.

==================================================
ID & DATA
==================================================

Seluruh ID dalam sistem Conversation

WAJIB

menggunakan UUID v4
dari generateUUID().

Ini mencakup:

• ID Conversation

• ID Pesan (Chat)

• ID Evidence

• ID Audit Trail Event

Tidak boleh menggunakan
ID sequential atau hardcoded.

==================================================
ESCROW INTEGRATION
==================================================

Escrow bergabung sebagai Participant
ketika layanan Escrow diaktifkan
dalam transaksi.

Escrow memiliki akses ke:

• Audit Trail

• Evidence kategori Payment

• Quick Template Escrow

Escrow

TIDAK

memiliki akses ke seluruh Chat
di luar konteks tugasnya.

Seluruh tindakan Escrow
dicatat di Audit Trail.

==================================================
TRANSPORT INTEGRATION
==================================================

Transport bergabung sebagai Participant
ketika layanan pengiriman diaktifkan
dalam transaksi.

Transport memiliki akses ke:

• Quick Template Transport

• Evidence kategori Delivery dan Arrival

Transport

TIDAK

memiliki akses ke informasi keuangan
transaksi.

Seluruh tindakan Transport
dicatat di Audit Trail.

==================================================
VETERINARIAN INTEGRATION
==================================================

Veterinarian bergabung sebagai Participant
ketika pemeriksaan kesehatan ternak
diperlukan dalam transaksi.

Veterinarian memiliki akses ke:

• Quick Template Veterinarian

• Evidence kategori Livestock Condition
  dan Document

Seluruh tindakan Veterinarian
dicatat di Audit Trail.

==================================================
UI PRINCIPLE
==================================================

Setiap halaman Conversation

WAJIB

menampilkan konteks transaksi
yang sedang berjalan.

Participant yang aktif
ditampilkan secara jelas.

Chat dan Evidence

WAJIB

dipisahkan secara visual
dalam antarmuka.

Audit Trail dapat diakses
oleh seluruh Participant
dalam transaksi.

Empty State harus informatif
ketika tidak ada pesan atau Evidence.

==================================================
LARANGAN ABSOLUT
==================================================

❌ Membuat Conversation
   tanpa transaksi aktif

❌ Menghardcode peran sebagai
   Buyer ↔ Seller saja

❌ Mencampur Chat dan Evidence
   dalam satu wadah data

❌ Menghapus Audit Trail

❌ Mengizinkan AI mengambil
   keputusan transaksi

❌ Membuat Conversation yang berdiri sendiri
   di luar konteks Marketplace

❌ Menggunakan ID sequential
   atau hardcoded

❌ Menghapus Evidence
   setelah dicatat

❌ Mengizinkan Participant bergabung
   ke Conversation di luar transaksi
   yang bersangkutan

==================================================
GENERAL RULES
==================================================

Conversation merupakan
pendukung transaksi.

Bukan pengganti transaksi.

Seluruh implementasi:

• Conversation

• Evidence

• Audit Trail

• Escrow

• Transport

• Veterinarian

WAJIB

mengikuti Constitution ini.

Tidak ada pengecualian.

==================================================
MODUL TERDAFTAR
==================================================

PROFILE-004 — Constitution (dokumen ini)

Seluruh implementasi Conversation
mulai PROFILE-005 dan seterusnya
mengacu pada Constitution ini.

==================================================
END OF CONSTITUTION
==================================================

Versi: 1.0 — Dibuat: 2026-07-15
Setiap perubahan arsitektur wajib
diperbarui di dokumen ini terlebih dahulu.
