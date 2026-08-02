// ─── Admin Announcements Data — ANN-001 ──────────────────────────────────────
// Realistic dummy data only. No production database, no external API.
// Updated from ADM-003B to satisfy ANN-001 requirements.

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnnouncementStatus =
  | 'Published'
  | 'Draft'
  | 'Scheduled'
  | 'Archived'
  | 'Expired';

export type AnnouncementType =
  | 'Information'
  | 'Maintenance'
  | 'Feature Release'
  | 'Security'
  | 'Emergency'
  | 'Policy Update';

// Keep legacy alias so any existing code importing AnnouncementCategory still compiles.
export type AnnouncementCategory = AnnouncementType;

export type AnnouncementAudience =
  | 'All Users'
  | 'Workspace Owners'
  | 'Farm Workspace'
  | 'Veterinary Workspace'
  | 'Feed Store Workspace'
  | 'Transport Workspace'
  | 'Platform Admin';

export interface AdminAnnouncementRecord {
  id: string;
  title: string;
  /** Announcement type / category */
  category: AnnouncementType;
  audience: AnnouncementAudience;
  status: AnnouncementStatus;
  priority: 'High' | 'Normal' | 'Low';
  isPinned: boolean;
  authorName: string;
  authorEmail: string;
  createdAt: string;        // YYYY-MM-DD
  lastUpdatedAt: string;    // YYYY-MM-DD
  publishedAt?: string;
  scheduledAt?: string;
  archivedAt?: string;
  expiresAt?: string;       // null/absent = no expiry
  /** Short preview shown in list rows */
  excerpt: string;
  /** Full announcement body (multi-paragraph) */
  fullContent: string;
  hasAttachment: boolean;
  attachmentLabel?: string;
  tags: string[];
  views: number;
}

// ─── Status config ─────────────────────────────────────────────────────────────

export const ANN_STATUS_CONFIG: Record<
  AnnouncementStatus,
  { label: string; color: string; bg: string; dot: string; icon: string }
> = {
  Published: { label: 'Published',  color: '#059669', bg: '#d1fae5', dot: '#10b981', icon: '✅' },
  Draft:     { label: 'Draft',      color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8', icon: '✏️' },
  Scheduled: { label: 'Scheduled',  color: '#0369a1', bg: '#e0f2fe', dot: '#0ea5e9', icon: '📅' },
  Archived:  { label: 'Archived',   color: '#92400e', bg: '#fef3c7', dot: '#f59e0b', icon: '📦' },
  Expired:   { label: 'Expired',    color: '#6b21a8', bg: '#f3e8ff', dot: '#a855f7', icon: '⏰' },
};

// ─── Type config ──────────────────────────────────────────────────────────────

export const ANN_TYPE_CONFIG: Record<
  AnnouncementType,
  { icon: string; color: string }
> = {
  Information:      { icon: 'ℹ️',  color: '#0369a1' },
  Maintenance:      { icon: '🔧', color: '#d97706' },
  'Feature Release':{ icon: '🚀', color: '#7c3aed' },
  Security:         { icon: '🔒', color: '#dc2626' },
  Emergency:        { icon: '🚨', color: '#b91c1c' },
  'Policy Update':  { icon: '📜', color: '#0284c7' },
};

// Keep legacy alias
export const ANN_CATEGORY_CONFIG = ANN_TYPE_CONFIG;

// ─── Priority config ───────────────────────────────────────────────────────────

export const PRIORITY_CONFIG: Record<
  'High' | 'Normal' | 'Low',
  { color: string; bg: string }
> = {
  High:   { color: '#dc2626', bg: '#fee2e2' },
  Normal: { color: '#0369a1', bg: '#e0f2fe' },
  Low:    { color: '#64748b', bg: '#f1f5f9' },
};

// ─── Summary stats ─────────────────────────────────────────────────────────────

export interface AnnouncementPlatformStats {
  published: number;
  draft: number;
  scheduled: number;
  archived: number;
  expired: number;
}

export const ANNOUNCEMENT_PLATFORM_STATS: AnnouncementPlatformStats = {
  published: 48,
  draft:     7,
  scheduled: 5,
  archived:  61,
  expired:   14,
};

// ─── Dummy records (20 entries) ────────────────────────────────────────────────

export const ADMIN_ANNOUNCEMENT_LIST: AdminAnnouncementRecord[] = [
  // ── Published ──────────────────────────────────────────────────────────────
  {
    id: 'ANN-0001',
    title: 'Pemeliharaan Sistem Terjadwal — 20 Juli 2026',
    category: 'Maintenance',
    audience: 'All Users',
    status: 'Published',
    priority: 'High',
    isPinned: true,
    authorName: 'Tim Infrastruktur TernakHub',
    authorEmail: 'infra@ternakhub.id',
    createdAt: '2026-07-15',
    lastUpdatedAt: '2026-07-16',
    publishedAt: '2026-07-16',
    expiresAt: '2026-07-21',
    excerpt: 'Sistem TernakHub akan mengalami pemeliharaan terjadwal pada Minggu, 20 Juli 2026 pukul 02.00–05.00 WIB. Selama periode ini, semua fitur tidak dapat diakses.',
    fullContent: `Kepada seluruh pengguna TernakHub,

Kami ingin memberitahukan bahwa sistem TernakHub akan menjalani pemeliharaan terjadwal pada:

📅 Tanggal: Minggu, 20 Juli 2026
⏰ Waktu: 02.00 – 05.00 WIB (3 jam)

Selama periode pemeliharaan ini, seluruh fitur platform — termasuk Livestock Management, Marketplace, Feed & Medicine, dan halaman profil — tidak dapat diakses.

Yang kami lakukan selama pemeliharaan:
• Optimasi performa database utama
• Pembaruan library keamanan ke versi terbaru
• Migrasi infrastruktur penyimpanan file (foto ternak, dokumen)
• Pengujian sistem failover otomatis

Kami menyarankan Anda untuk menyelesaikan transaksi dan pencatatan penting sebelum pukul 01.30 WIB.

Setelah pemeliharaan selesai, sistem akan kembali normal secara otomatis. Tidak diperlukan tindakan apa pun dari pihak pengguna.

Mohon maaf atas ketidaknyamanan yang ditimbulkan.

Terima kasih atas pengertian dan kepercayaan Anda kepada TernakHub.`,
    hasAttachment: false,
    tags: ['maintenance', 'downtime', 'sistem'],
    views: 8_421,
  },
  {
    id: 'ANN-0002',
    title: 'Fitur Baru: Modul Mutasi Ternak Hadir!',
    category: 'Feature Release',
    audience: 'Farm Workspace',
    status: 'Published',
    priority: 'Normal',
    isPinned: true,
    authorName: 'Tim Produk TernakHub',
    authorEmail: 'product@ternakhub.id',
    createdAt: '2026-07-10',
    lastUpdatedAt: '2026-07-10',
    publishedAt: '2026-07-10',
    excerpt: 'Kami dengan bangga memperkenalkan Modul Mutasi Ternak — fitur baru untuk mencatat dan mengelola perpindahan ternak antar kandang, lokasi, atau kepemilikan dengan jejak audit lengkap.',
    fullContent: `Halo Peternak TernakHub!

Kami dengan bangga mempersembahkan fitur terbaru: **Modul Mutasi Ternak** 🎉

Fitur ini memungkinkan Anda untuk:
✅ Mencatat perpindahan ternak antar kandang secara akurat
✅ Mendokumentasikan mutasi ke lokasi atau kepemilikan berbeda
✅ Melihat riwayat lengkap perpindahan setiap hewan
✅ Menghasilkan laporan mutasi dengan jejak audit penuh

Cara mengakses:
Buka menu Livestock → pilih Mutasi → klik tombol "Buat Permintaan Mutasi"

Jenis mutasi yang didukung:
• Pindah Kandang (dalam workspace)
• Pindah Lokasi (antar cabang)
• Transfer Kepemilikan (ke workspace lain)
• Mutasi Keluar (penjualan, hibah, kematian)

Semua mutasi memerlukan persetujuan Owner atau Admin workspace sebelum efektif. Riwayat mutasi tersimpan permanen dan tidak dapat dihapus, menjamin integritas data ternak Anda.

Fitur ini tersedia untuk semua pengguna mulai hari ini!`,
    hasAttachment: true,
    attachmentLabel: 'Panduan Penggunaan Modul Mutasi.pdf',
    tags: ['fitur-baru', 'mutasi', 'livestock'],
    views: 12_887,
  },
  {
    id: 'ANN-0003',
    title: 'Pembaruan Kebijakan Privasi — Berlaku 1 Agustus 2026',
    category: 'Policy Update',
    audience: 'All Users',
    status: 'Published',
    priority: 'High',
    isPinned: false,
    authorName: 'Tim Legal TernakHub',
    authorEmail: 'legal@ternakhub.id',
    createdAt: '2026-07-01',
    lastUpdatedAt: '2026-07-04',
    publishedAt: '2026-07-05',
    expiresAt: '2026-09-01',
    excerpt: 'TernakHub memperbarui Kebijakan Privasi sesuai regulasi Perlindungan Data Pribadi (PDP) Indonesia. Harap baca perubahan penting yang berlaku mulai 1 Agustus 2026.',
    fullContent: `Kepada seluruh pengguna TernakHub yang terhormat,

Kami memberitahukan pembaruan penting pada Kebijakan Privasi TernakHub yang akan berlaku efektif mulai 1 Agustus 2026.

Pembaruan ini dilakukan untuk mematuhi Undang-Undang No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP) yang mulai diberlakukan penuh pada tahun 2026.

Ringkasan perubahan utama:

1. Hak Pengguna Diperkuat
   Anda kini memiliki hak penuh untuk mengakses, mengoreksi, dan menghapus data pribadi yang tersimpan di TernakHub.

2. Dasar Hukum Pemrosesan Data Dipertegas
   Kami hanya memproses data Anda berdasarkan persetujuan eksplisit, kewajiban kontraktual, atau kepentingan hukum yang sah.

3. Retensi Data Diperjelas
   Data akun tidak aktif akan dihapus otomatis setelah 36 bulan tanpa aktivitas.

4. Transfer Data Internasional
   Jika data Anda diproses di luar Indonesia, kami wajib memastikan negara tujuan memiliki perlindungan setara.

Untuk membaca kebijakan lengkap, kunjungi: ternakhub.id/kebijakan-privasi

Jika Anda tidak setuju dengan perubahan ini, Anda dapat menghapus akun sebelum 1 Agustus 2026. Kelanjutan penggunaan setelah tanggal tersebut dianggap sebagai persetujuan.

Pertanyaan dapat diajukan ke: privasi@ternakhub.id`,
    hasAttachment: true,
    attachmentLabel: 'Kebijakan Privasi TernakHub v3.0.pdf',
    tags: ['privasi', 'hukum', 'PDP'],
    views: 5_341,
  },
  {
    id: 'ANN-0004',
    title: 'Peringatan Keamanan: Aktivitas Login Mencurigakan Terdeteksi',
    category: 'Security',
    audience: 'All Users',
    status: 'Published',
    priority: 'High',
    isPinned: true,
    authorName: 'Tim Keamanan TernakHub',
    authorEmail: 'security@ternakhub.id',
    createdAt: '2026-07-17',
    lastUpdatedAt: '2026-07-18',
    publishedAt: '2026-07-18',
    expiresAt: '2026-07-25',
    excerpt: 'Tim keamanan kami mendeteksi peningkatan percobaan login tidak sah dari beberapa wilayah. Segera aktifkan autentikasi dua faktor untuk melindungi akun Anda.',
    fullContent: `PERINGATAN KEAMANAN PENTING

Tim Keamanan TernakHub telah mendeteksi peningkatan signifikan percobaan login tidak sah pada platform kami dalam 48 jam terakhir.

Sumber aktivitas mencurigakan terdeteksi dari rentang IP di beberapa wilayah. Tidak ada bukti bahwa data pengguna telah diakses secara tidak sah, namun kami mengimbau seluruh pengguna untuk segera mengambil langkah pencegahan.

TINDAKAN YANG HARUS ANDA LAKUKAN SEKARANG:

🔒 1. Aktifkan Autentikasi Dua Faktor (2FA)
   Buka Profil → Keamanan → Aktifkan 2FA

🔑 2. Ganti Kata Sandi Anda
   Gunakan kata sandi baru minimal 12 karakter, kombinasi huruf besar, kecil, angka, dan simbol.

📱 3. Periksa Sesi Aktif
   Buka Profil → Keamanan → Sesi Aktif, lalu akhiri semua sesi yang tidak Anda kenal.

⚠️ 4. Waspada Phishing
   TernakHub tidak pernah meminta kata sandi melalui email, WhatsApp, atau SMS.

Jika Anda mencurigai akun Anda telah diakses tanpa izin, segera hubungi kami di: keamanan@ternakhub.id atau gunakan fitur "Laporkan Akun Dibobol" di halaman login.

Tim kami sedang aktif memantau situasi ini 24/7.`,
    hasAttachment: false,
    tags: ['keamanan', 'login', 'phishing', 'darurat'],
    views: 15_203,
  },
  {
    id: 'ANN-0005',
    title: 'DARURAT: Gangguan Layanan Marketplace — Sedang Ditangani',
    category: 'Emergency',
    audience: 'All Users',
    status: 'Published',
    priority: 'High',
    isPinned: true,
    authorName: 'Tim Operasional TernakHub',
    authorEmail: 'ops@ternakhub.id',
    createdAt: '2026-07-18',
    lastUpdatedAt: '2026-07-18',
    publishedAt: '2026-07-18',
    expiresAt: '2026-07-19',
    excerpt: 'Kami sedang menangani gangguan pada Modul Marketplace yang menyebabkan transaksi baru tidak dapat diproses. Tim teknis sedang bekerja untuk memulihkan layanan.',
    fullContent: `⚠️ PEMBERITAHUAN DARURAT ⚠️

Kami menginformasikan bahwa saat ini terdapat gangguan pada Modul Marketplace TernakHub.

Status: SEDANG DITANGANI
Terdeteksi: 18 Juli 2026, pukul 09.15 WIB
Estimasi Pemulihan: 18 Juli 2026, pukul 12.00 WIB

Dampak yang dialami pengguna:
• Transaksi baru tidak dapat dibuat atau diproses
• Pembayaran escrow mungkin tertunda
• Listing baru tidak dapat diterbitkan
• Fitur chat marketplace mungkin lambat

Fitur yang TIDAK terdampak:
✅ Login dan manajemen akun
✅ Modul Livestock, Feed, dan Medicine
✅ Fitur non-marketplace lainnya

Penyebab: Kami mendeteksi kegagalan pada komponen payment gateway eksternal yang terintegrasi dengan sistem kami.

Update status akan kami berikan setiap 30 menit melalui pengumuman ini.

UPDATE 10.00 WIB: Tim teknis telah mengidentifikasi sumber masalah. Proses rollback sedang dilakukan.

Untuk transaksi mendesak, Anda dapat menghubungi penjual langsung melalui fitur Chat.

Mohon maaf atas gangguan yang ditimbulkan.`,
    hasAttachment: false,
    tags: ['darurat', 'marketplace', 'gangguan'],
    views: 22_541,
  },
  {
    id: 'ANN-0006',
    title: 'Panduan: Cara Menggunakan Fitur Batch Ternak',
    category: 'Information',
    audience: 'Farm Workspace',
    status: 'Published',
    priority: 'Normal',
    isPinned: false,
    authorName: 'Tim Edukasi TernakHub',
    authorEmail: 'education@ternakhub.id',
    createdAt: '2026-06-25',
    lastUpdatedAt: '2026-06-26',
    publishedAt: '2026-06-27',
    excerpt: 'Panduan lengkap penggunaan Modul Batch Ternak — dari membuat batch baru, mengelola anggota batch, hingga menganalisis kinerja pertumbuhan per batch.',
    fullContent: `Halo Peternak TernakHub!

Fitur Batch Ternak membantu Anda mengelola kelompok ternak secara lebih efisien. Berikut panduan lengkapnya:

APA ITU BATCH TERNAK?
Batch adalah pengelompokan ternak berdasarkan program tertentu — misalnya batch penggemukan, batch reproduksi, atau batch vaksinasi. Satu ternak dapat menjadi anggota beberapa batch sekaligus.

CARA MEMBUAT BATCH BARU:
1. Buka menu Livestock → Batch
2. Klik tombol "Buat Batch Baru"
3. Isi nama program, jenis batch, dan periode
4. Tambahkan anggota ternak dari daftar ternak aktif
5. Klik "Simpan"

FITUR UNGGULAN BATCH:
📊 Dashboard Analytics — Pantau pertumbuhan rata-rata, bobot terkini, dan performa tiap batch
🤖 AI Insight — Analisis otomatis kecenderungan pertumbuhan dan rekomendasi pakan
📋 Riwayat Operasi — Catat semua kegiatan batch (pemberian pakan, vaksinasi, penimbangan)
📅 Upcoming Events — Ingatkan jadwal operasi batch berikutnya

TIPS PENGGUNAAN:
• Beri nama batch yang deskriptif: "Penggemukan Sapi Q3 2026" lebih mudah dicari daripada "Batch 1"
• Review dashboard batch minimal seminggu sekali
• Arsipkan batch yang sudah selesai agar daftar tetap bersih

Butuh bantuan? Hubungi tim support kami atau kunjungi Pusat Bantuan TernakHub.`,
    hasAttachment: true,
    attachmentLabel: 'Panduan Batch Ternak v2.1.pdf',
    tags: ['panduan', 'batch', 'edukasi'],
    views: 4_218,
  },
  {
    id: 'ANN-0007',
    title: 'Aturan Baru: Listing Layanan Veteriner Wajib Nomor Registrasi',
    category: 'Policy Update',
    audience: 'Veterinary Workspace',
    status: 'Published',
    priority: 'High',
    isPinned: false,
    authorName: 'Tim Legal TernakHub',
    authorEmail: 'legal@ternakhub.id',
    createdAt: '2026-06-18',
    lastUpdatedAt: '2026-06-19',
    publishedAt: '2026-06-20',
    excerpt: 'Mulai 1 Juli 2026, semua listing layanan veteriner wajib menyertakan nomor registrasi dokter hewan atau izin operasional klinik yang valid.',
    fullContent: `Kepada seluruh Workspace Veteriner dan Klinik Hewan di TernakHub,

Kami memberitahukan perubahan kebijakan penting terkait listing layanan veteriner di Marketplace TernakHub.

KEBIJAKAN BARU (berlaku 1 Juli 2026):

Semua listing yang menawarkan layanan veteriner — termasuk konsultasi, pemeriksaan, vaksinasi, pengobatan, dan operasi — WAJIB mencantumkan salah satu dari:

a) Nomor Surat Izin Praktik Dokter Hewan (SIPDH) yang masih berlaku
b) Nomor Izin Operasional Klinik Hewan dari Dinas setempat
c) Nomor registrasi dari Persatuan Dokter Hewan Indonesia (PDHI)

ALASAN PERUBAHAN KEBIJAKAN:
Kami menerima laporan dari pengguna terkait layanan veteriner yang tidak berlisensi. Kebijakan ini diberlakukan untuk melindungi pengguna dan hewan ternak mereka.

CARA MEMPERBARUI LISTING ANDA:
1. Buka Marketplace → Listing Saya
2. Edit listing yang relevan
3. Tambahkan nomor registrasi di kolom "Informasi Lisensi"
4. Simpan dan tunggu verifikasi admin (1-3 hari kerja)

SANKSI:
Listing yang tidak memenuhi ketentuan ini setelah 1 Juli 2026 akan dinonaktifkan sementara hingga dilengkapi.

Pertanyaan? Hubungi: kebijakan@ternakhub.id`,
    hasAttachment: true,
    attachmentLabel: 'Kebijakan Listing Veteriner Versi 2.0.pdf',
    tags: ['marketplace', 'veteriner', 'aturan', 'lisensi'],
    views: 2_033,
  },
  {
    id: 'ANN-0008',
    title: 'Laporan Transparansi Platform — Q2 2026',
    category: 'Information',
    audience: 'All Users',
    status: 'Published',
    priority: 'Normal',
    isPinned: false,
    authorName: 'CEO TernakHub',
    authorEmail: 'ceo@ternakhub.id',
    createdAt: '2026-07-05',
    lastUpdatedAt: '2026-07-07',
    publishedAt: '2026-07-08',
    excerpt: 'Laporan kuartalan transparansi TernakHub Q2 2026 — statistik pengguna, keamanan platform, penanganan laporan, dan roadmap Q3 2026.',
    fullContent: `Kepada seluruh keluarga besar TernakHub,

Sesuai komitmen kami terhadap transparansi, berikut laporan platform untuk kuartal kedua 2026 (April–Juni 2026).

📊 PERTUMBUHAN PLATFORM:
• Total workspace aktif: 12.847 (+23% dari Q1)
• Total pengguna terdaftar: 48.211 (+31% dari Q1)
• Total ternak terdaftar di platform: 892.441 ekor
• Volume transaksi Marketplace Q2: Rp 47,3 Miliar

🔒 KEAMANAN:
• Insiden keamanan signifikan: 0
• Percobaan akses tidak sah yang diblokir: 14.221
• Akun yang terkena pelanggaran: 0
• Penerapan 2FA oleh pengguna: 34% (naik dari 21%)

⚖️ PENEGAKAN KEBIJAKAN:
• Laporan konten masuk: 847
• Listing dihapus karena melanggar: 93
• Akun disuspend: 12
• Penyelesaian sengketa Marketplace: 99,2%

🛣️ ROADMAP Q3 2026:
• Agustus: Peluncuran sistem Escrow Marketplace
• September: Fitur AI Rekomendasi Pakan berbasis data aktual
• Oktober: Integrasi QRIS untuk pembayaran subscription

Terima kasih telah menjadi bagian dari TernakHub. Kami berkomitmen untuk terus meningkatkan platform demi kemajuan industri peternakan Indonesia.`,
    hasAttachment: true,
    attachmentLabel: 'Laporan Transparansi TernakHub Q2-2026.pdf',
    tags: ['transparansi', 'laporan', 'Q2'],
    views: 4_429,
  },
  {
    id: 'ANN-0009',
    title: 'Informasi: Kebijakan Penggunaan Layanan Penyimpanan Pakan',
    category: 'Information',
    audience: 'Feed Store Workspace',
    status: 'Published',
    priority: 'Normal',
    isPinned: false,
    authorName: 'Tim Kebijakan TernakHub',
    authorEmail: 'policy@ternakhub.id',
    createdAt: '2026-06-30',
    lastUpdatedAt: '2026-07-01',
    publishedAt: '2026-07-02',
    excerpt: 'Panduan dan informasi lengkap penggunaan fitur manajemen stok pakan khusus untuk workspace toko pakan dan distributor pakan ternak.',
    fullContent: `Kepada seluruh pengguna Workspace Toko Pakan & Distributor Pakan,

Kami menyampaikan informasi penting mengenai penggunaan fitur Manajemen Stok Pakan yang dioptimalkan khusus untuk workspace Toko Pakan.

FITUR EKSKLUSIF WORKSPACE TOKO PAKAN:

📦 Inventaris Multi-Gudang
Kelola stok dari beberapa lokasi penyimpanan dalam satu dashboard.

🔄 Integrasi Marketplace Pakan
Listing produk pakan Anda langsung terhubung dengan inventaris — stok otomatis berkurang saat transaksi selesai.

📊 Laporan Penjualan & Stok
Unduh laporan periodik dalam format Excel/CSV untuk keperluan pembukuan.

🔔 Notifikasi Stok Minimum
Atur batas minimum untuk setiap item dan dapatkan notifikasi saat mendekati batas.

PANDUAN INTEGRASI DENGAN MARKETPLACE:
1. Buka Stok Pakan → Inventaris
2. Pilih item yang ingin didaftarkan di Marketplace
3. Klik "Daftarkan ke Marketplace"
4. Atur harga, deskripsi, dan batas minimum stok yang tersedia
5. Listing akan aktif dan terhubung dengan stok Anda

Untuk pertanyaan teknis: support@ternakhub.id`,
    hasAttachment: false,
    tags: ['pakan', 'toko', 'informasi', 'stok'],
    views: 1_872,
  },
  {
    id: 'ANN-0010',
    title: 'Informasi Keamanan Sistem untuk Admin Platform',
    category: 'Security',
    audience: 'Platform Admin',
    status: 'Published',
    priority: 'High',
    isPinned: false,
    authorName: 'Tim Keamanan Internal',
    authorEmail: 'security-internal@ternakhub.id',
    createdAt: '2026-07-12',
    lastUpdatedAt: '2026-07-13',
    publishedAt: '2026-07-14',
    excerpt: 'Pembaruan protokol keamanan internal untuk seluruh Platform Administrator TernakHub — wajib dibaca dan diimplementasikan sebelum 25 Juli 2026.',
    fullContent: `UNTUK: Seluruh Platform Administrator TernakHub
KLASIFIKASI: Internal — Jangan Disebarluaskan

Tim Keamanan TernakHub menerbitkan pembaruan protokol keamanan internal yang WAJIB diimplementasikan oleh semua Platform Admin sebelum 25 Juli 2026.

PERUBAHAN PROTOKOL:

🔐 1. Rotasi Credential Admin Panel
Semua credential akses Admin Panel harus diperbarui. Hubungi IT Security untuk mendapatkan credential baru via saluran terenkripsi.

📋 2. Wajib Logging Semua Aksi Admin
Mulai 25 Juli 2026, semua tindakan di Admin Panel akan dicatat ke immutable audit log. Tidak ada pengecualian.

🖥️ 3. Pembatasan IP Admin Panel
Akses Admin Panel akan dibatasi hanya dari IP yang telah didaftarkan. Daftarkan IP kerja Anda ke IT Security sebelum 22 Juli 2026.

🔄 4. Jadwal Review Akses
Setiap tiga bulan, akses admin akan di-review ulang. Admin tidak aktif selama >60 hari akan dinonaktifkan otomatis.

⚠️ PENTING:
Kegagalan mengikuti protokol ini akan mengakibatkan penonaktifan akses admin sementara hingga compliance terpenuhi.

Hubungi: it-security@ternakhub.id untuk pertanyaan atau pengecualian yang memerlukan approval khusus.`,
    hasAttachment: true,
    attachmentLabel: 'Protokol Keamanan Admin TernakHub v4.pdf',
    tags: ['keamanan', 'admin', 'internal', 'protokol'],
    views: 28,
  },

  // ── Scheduled ─────────────────────────────────────────────────────────────
  {
    id: 'ANN-0011',
    title: 'Peluncuran Fitur Escrow Marketplace — Agustus 2026',
    category: 'Feature Release',
    audience: 'All Users',
    status: 'Scheduled',
    priority: 'Normal',
    isPinned: false,
    authorName: 'Tim Produk TernakHub',
    authorEmail: 'product@ternakhub.id',
    createdAt: '2026-07-12',
    lastUpdatedAt: '2026-07-14',
    scheduledAt: '2026-08-01',
    excerpt: 'TernakHub akan meluncurkan sistem Escrow Marketplace pada Agustus 2026 — layanan rekening bersama digital untuk keamanan transaksi lebih tinggi.',
    fullContent: `Kepada seluruh pengguna Marketplace TernakHub,

Kami dengan antusias mengumumkan peluncuran fitur terbaru yang telah lama ditunggu: Sistem Escrow Marketplace TernakHub!

APA ITU ESCROW?
Escrow adalah sistem rekening bersama di mana pembayaran dari pembeli ditahan secara aman oleh TernakHub, dan baru diteruskan ke penjual setelah pembeli mengonfirmasi penerimaan barang/ternak.

MANFAAT UNTUK PEMBELI:
✅ Dana aman — tidak langsung masuk ke penjual
✅ Perlindungan jika ternak tidak sesuai deskripsi
✅ Proses klaim lebih mudah jika ada sengketa

MANFAAT UNTUK PENJUAL:
✅ Pembayaran terjamin — tidak ada risiko pembeli kabur
✅ Proses lebih profesional — meningkatkan kepercayaan pembeli
✅ Pencairan cepat setelah konfirmasi penerimaan

CARA KERJA:
1. Pembeli melakukan pembayaran → dana masuk ke Escrow TernakHub
2. Penjual mengirim ternak/barang
3. Pembeli mengonfirmasi penerimaan dalam 3×24 jam
4. Dana dicairkan otomatis ke rekening penjual

Fitur ini akan tersedia mulai 1 Agustus 2026 untuk semua transaksi di atas Rp 5.000.000.`,
    hasAttachment: false,
    tags: ['marketplace', 'escrow', 'keamanan', 'fitur-baru'],
    views: 0,
  },
  {
    id: 'ANN-0012',
    title: 'Pemeliharaan Database — 25 Juli 2026 Dini Hari',
    category: 'Maintenance',
    audience: 'All Users',
    status: 'Scheduled',
    priority: 'Normal',
    isPinned: false,
    authorName: 'Tim Infrastruktur TernakHub',
    authorEmail: 'infra@ternakhub.id',
    createdAt: '2026-07-17',
    lastUpdatedAt: '2026-07-17',
    scheduledAt: '2026-07-25',
    excerpt: 'Optimasi database pada Jumat, 25 Juli 2026 pukul 00.00–02.00 WIB. Fitur baca-tulis data mungkin terpengaruh selama periode ini.',
    fullContent: `Kepada seluruh pengguna TernakHub,

Kami akan melakukan pemeliharaan database terjadwal pada:
📅 Jumat, 25 Juli 2026 pukul 00.00 – 02.00 WIB

Dampak yang mungkin Anda rasakan:
• Penulisan data baru (penambahan ternak, pencatatan pakan, dll.) mungkin gagal sementara
• Pembacaan data (melihat daftar, laporan) tetap tersedia namun mungkin lebih lambat dari biasanya
• Marketplace dalam mode read-only — transaksi baru tidak dapat dibuat

Yang kami lakukan:
• Indeksasi ulang tabel database utama untuk mempercepat query
• Pembersihan log transaksi lama (>2 tahun)
• Pengujian backup dan restore otomatis
• Peningkatan kapasitas storage

Kami menyarankan untuk tidak menjadwalkan kegiatan pencatatan penting antara pukul 23.30 – 02.30 WIB pada malam tersebut.

Terima kasih atas kerja sama Anda.`,
    hasAttachment: false,
    tags: ['maintenance', 'database', 'jadwal'],
    views: 0,
  },
  {
    id: 'ANN-0013',
    title: 'Kebijakan Layanan Transportasi Ternak — Berlaku September 2026',
    category: 'Policy Update',
    audience: 'Transport Workspace',
    status: 'Scheduled',
    priority: 'High',
    isPinned: false,
    authorName: 'Tim Legal TernakHub',
    authorEmail: 'legal@ternakhub.id',
    createdAt: '2026-07-16',
    lastUpdatedAt: '2026-07-17',
    scheduledAt: '2026-09-01',
    excerpt: 'Kebijakan baru untuk penyedia layanan transportasi ternak yang terdaftar di TernakHub, berlaku mulai September 2026. Termasuk standar keselamatan hewan dan persyaratan asuransi.',
    fullContent: `Kepada seluruh Workspace Penyedia Layanan Transportasi Ternak,

Kami memberitahukan kebijakan baru yang akan berlaku mulai 1 September 2026 untuk seluruh penyedia layanan transportasi ternak di TernakHub.

PERSYARATAN BARU:

🚛 1. Standar Armada Kendaraan
   • Kendaraan pengangkut ternak wajib berusia ≤ 10 tahun
   • Kandang/sekat kendaraan harus bersertifikasi layak
   • Sistem ventilasi yang memadai untuk jenis ternak yang diangkut

📋 2. Dokumentasi Wajib
   • Surat Keterangan Kesehatan Hewan (SKKH) dari dokter hewan
   • Surat Angkut Ternak (SAT) dari Dinas Peternakan setempat
   • Foto kondisi ternak sebelum dan sesudah pengiriman

🛡️ 3. Asuransi Pengiriman
   • Wajib menyediakan opsi asuransi ternak selama pengiriman
   • Minimal coverage: 80% dari nilai ternak yang diangkut

⭐ 4. Sistem Rating
   • Pembeli dapat memberikan rating dan ulasan setelah pengiriman selesai
   • Rating di bawah 3.0 setelah minimum 10 ulasan akan mengakibatkan peninjauan akun

Penyedia yang belum memenuhi persyaratan sebelum 1 September 2026 akan dinonaktifkan sementara dari Marketplace.`,
    hasAttachment: true,
    attachmentLabel: 'Standar Layanan Transportasi Ternak TernakHub.pdf',
    tags: ['transportasi', 'kebijakan', 'standar'],
    views: 0,
  },

  // ── Draft ──────────────────────────────────────────────────────────────────
  {
    id: 'ANN-0014',
    title: '[Draft] Kebijakan Baru Verifikasi Workspace Bisnis',
    category: 'Policy Update',
    audience: 'Workspace Owners',
    status: 'Draft',
    priority: 'High',
    isPinned: false,
    authorName: 'Tim Legal TernakHub',
    authorEmail: 'legal@ternakhub.id',
    createdAt: '2026-07-13',
    lastUpdatedAt: '2026-07-18',
    excerpt: '[DRAFT] Pembaruan kebijakan verifikasi workspace yang akan mewajibkan NPWP perusahaan untuk workspace dengan transaksi di atas Rp 50 juta/bulan.',
    fullContent: `[DRAFT — BELUM DIPUBLIKASIKAN]

Kepada seluruh Pemilik Workspace TernakHub,

[DRAFT IN PROGRESS — konten sedang direview oleh tim legal]

Kami akan memperbarui kebijakan verifikasi workspace yang akan mewajibkan semua workspace aktif dengan volume transaksi di atas Rp 50 juta per bulan untuk melengkapi:

1. NPWP Perusahaan atau Perorangan yang valid
2. Rekening bank atas nama usaha/perorangan yang sama dengan nama workspace
3. [TBD] Dokumen tambahan yang masih dalam pembahasan

Tujuan perubahan:
• Memastikan kepatuhan perpajakan sesuai regulasi yang berlaku
• Meningkatkan kepercayaan pembeli di Marketplace
• Memudahkan proses audit dan pelaporan keuangan platform

[CATATAN INTERNAL: Perlu review dari divisi hukum dan konfirmasi threshold Rp 50 juta — apakah ini per bulan atau kumulatif? Juga perlu mempertimbangkan workspace nonprofit/komunitas.]

Target publikasi: Agustus 2026`,
    hasAttachment: false,
    tags: ['verifikasi', 'kebijakan', 'draft', 'NPWP'],
    views: 0,
  },
  {
    id: 'ANN-0015',
    title: '[Draft] Fitur Integrasi QRIS untuk Pembayaran Subscription',
    category: 'Feature Release',
    audience: 'All Users',
    status: 'Draft',
    priority: 'Normal',
    isPinned: false,
    authorName: 'Tim Produk TernakHub',
    authorEmail: 'product@ternakhub.id',
    createdAt: '2026-07-16',
    lastUpdatedAt: '2026-07-17',
    excerpt: '[DRAFT] Integrasi QRIS sebagai metode pembayaran baru untuk subscription, memperluas pilihan dari saat ini hanya transfer bank dan e-wallet.',
    fullContent: `[DRAFT — BELUM DIPUBLIKASIKAN]

Kepada seluruh pengguna TernakHub,

[DRAFT IN PROGRESS]

Kabar baik! Kami sedang mengintegrasikan QRIS (Quick Response Code Indonesian Standard) sebagai metode pembayaran baru untuk subscription TernakHub.

MANFAAT QRIS:
• Scan & bayar langsung dari aplikasi bank atau e-wallet apapun
• Transaksi real-time, konfirmasi instan
• Tidak perlu transfer manual dan upload bukti

METODE YANG DIDUKUNG (via QRIS):
GoPay, OVO, DANA, LinkAja, ShopeePay, semua mobile banking

[CATATAN INTERNAL: Masih menunggu approval integrasi dari penyedia payment gateway. Target go-live Q4 2026 jika proses onboarding selesai tepat waktu.]

Status implementasi: 60% — menunggu approval regulator`,
    hasAttachment: false,
    tags: ['pembayaran', 'QRIS', 'subscription', 'draft'],
    views: 0,
  },
  {
    id: 'ANN-0016',
    title: '[Draft] Panduan Keselamatan Transportasi Darurat Ternak',
    category: 'Emergency',
    audience: 'Transport Workspace',
    status: 'Draft',
    priority: 'Normal',
    isPinned: false,
    authorName: 'Tim Konten TernakHub',
    authorEmail: 'content@ternakhub.id',
    createdAt: '2026-07-14',
    lastUpdatedAt: '2026-07-15',
    excerpt: '[DRAFT] Panduan prosedur darurat untuk penyedia layanan transportasi ternak saat terjadi kecelakaan, kemacetan ekstrem, atau kondisi cuaca berbahaya dalam perjalanan.',
    fullContent: `[DRAFT — BELUM DIPUBLIKASIKAN]

PANDUAN DARURAT TRANSPORTASI TERNAK
[DRAFT — Sedang dalam penyusunan]

Dokumen ini memberikan panduan singkat bagi pengemudi dan pemilik layanan transportasi ternak saat menghadapi situasi darurat.

SITUASI DARURAT UMUM:

🚗 Kecelakaan di jalan
1. Amankan kendaraan dan aktifkan lampu hazard
2. Hubungi layanan darurat: 112
3. Hubungi pemilik ternak segera
4. Dokumentasikan kondisi ternak (foto/video)
5. Laporkan insiden ke TernakHub dalam 2 jam

[DRAFT IN PROGRESS — konten belum lengkap]
[Perlu review dari konsultan transportasi ternak]`,
    hasAttachment: false,
    tags: ['darurat', 'transportasi', 'panduan', 'draft'],
    views: 0,
  },

  // ── Archived ───────────────────────────────────────────────────────────────
  {
    id: 'ANN-0017',
    title: 'Gangguan Layanan Email Notifikasi — Sudah Diperbaiki',
    category: 'Emergency',
    audience: 'All Users',
    status: 'Archived',
    priority: 'High',
    isPinned: false,
    authorName: 'Tim Teknis TernakHub',
    authorEmail: 'tech@ternakhub.id',
    createdAt: '2026-06-14',
    lastUpdatedAt: '2026-06-15',
    publishedAt: '2026-06-14',
    archivedAt: '2026-06-15',
    expiresAt: '2026-06-16',
    excerpt: 'Gangguan layanan email notifikasi pada 14 Juni 2026 pukul 10.00–13.30 WIB. Masalah telah diselesaikan. Notifikasi tertunda sudah dikirimkan ulang.',
    fullContent: `[INSIDEN SELESAI — Diarsipkan 15 Juni 2026]

Kami menginformasikan bahwa insiden gangguan layanan email notifikasi pada 14 Juni 2026 telah diselesaikan sepenuhnya.

RINGKASAN INSIDEN:
• Mulai: 14 Juni 2026, 10.00 WIB
• Selesai: 14 Juni 2026, 13.30 WIB
• Durasi: 3 jam 30 menit

DAMPAK:
• ~2.847 email notifikasi tidak terkirim selama periode insiden
• Termasuk: notifikasi transaksi marketplace, reminder jadwal pakan, dan alert stok

PENYEBAB:
Kegagalan komponen autentikasi pada server email provider eksternal (Postmark) akibat pembaruan sertifikat SSL yang tidak ter-refresh otomatis.

TINDAKAN PEMULIHAN:
✅ Semua 2.847 email yang tertunda telah dikirimkan ulang pada pukul 14.00 WIB
✅ Sistem beralih ke SMTP backup selama pemulihan
✅ Monitoring diperkuat untuk mencegah kejadian serupa

PENCEGAHAN KE DEPAN:
• Implementasi alert otomatis untuk kegagalan pengiriman email >100 dalam 10 menit
• Rotasi sertifikat SSL dijadwalkan otomatis 30 hari sebelum kedaluwarsa

Mohon maaf atas ketidaknyamanan yang terjadi.`,
    hasAttachment: false,
    tags: ['sistem', 'notifikasi', 'email', 'insiden', 'selesai'],
    views: 3_104,
  },
  {
    id: 'ANN-0018',
    title: 'Peringatan Keamanan: Celah di Fitur Upload Foto Ternak (Ditambal)',
    category: 'Security',
    audience: 'All Users',
    status: 'Archived',
    priority: 'High',
    isPinned: false,
    authorName: 'Tim Keamanan TernakHub',
    authorEmail: 'security@ternakhub.id',
    createdAt: '2026-05-10',
    lastUpdatedAt: '2026-05-11',
    publishedAt: '2026-05-11',
    archivedAt: '2026-05-25',
    excerpt: 'Tim keamanan telah mengidentifikasi dan memperbaiki celah keamanan pada fitur upload foto ternak. Tidak ada data pengguna yang terdampak.',
    fullContent: `[DIARSIPKAN — Insiden telah diselesaikan sepenuhnya pada 11 Mei 2026]

PEMBERITAHUAN KEAMANAN

Tim keamanan TernakHub telah mengidentifikasi dan memperbaiki celah keamanan (security vulnerability) pada fitur upload foto ternak.

STATUS: SELESAI — Celah telah ditambal pada 11 Mei 2026 pukul 03.00 WIB.

DETAIL TEKNIS (ringkasan untuk publik):
Celah ini memungkinkan pengunggahan file dengan ekstensi tertentu yang seharusnya tidak diizinkan. Celah ditemukan melalui program bug bounty internal kami.

DAMPAK:
• Tidak ada data pengguna yang diakses atau dicuri
• Tidak ada foto ternak yang dimanipulasi
• Celah telah aktif selama sekitar 3 minggu sebelum ditemukan dan ditambal

TINDAKAN YANG TELAH DILAKUKAN:
✅ Patch keamanan diterapkan
✅ Seluruh upload file dari periode rentan telah di-scan ulang
✅ Tidak ditemukan file berbahaya yang berhasil diunggah
✅ Validasi file diperketat di sisi server dan client

Terima kasih kepada peneliti keamanan yang melaporkan temuan ini melalui program bug bounty.`,
    hasAttachment: false,
    tags: ['keamanan', 'celah', 'upload', 'patch', 'selesai'],
    views: 2_891,
  },

  // ── Expired ────────────────────────────────────────────────────────────────
  {
    id: 'ANN-0019',
    title: 'Promo Lebaran: Upgrade ke Pro Diskon 30% (Berakhir)',
    category: 'Information',
    audience: 'All Users',
    status: 'Expired',
    priority: 'Normal',
    isPinned: false,
    authorName: 'Tim Marketing TernakHub',
    authorEmail: 'marketing@ternakhub.id',
    createdAt: '2026-03-01',
    lastUpdatedAt: '2026-03-01',
    publishedAt: '2026-03-10',
    expiresAt: '2026-04-10',
    excerpt: '[BERAKHIR] Promo spesial Lebaran 2026 — upgrade ke paket Pro dengan diskon 30% untuk pembayaran pertama. Promo berlaku 10 Maret – 10 April 2026.',
    fullContent: `[PENGUMUMAN BERAKHIR — Promo telah selesai pada 10 April 2026]

Kepada seluruh pengguna TernakHub,

Kami mengumumkan promo spesial menyambut Hari Raya Idul Fitri 1447 H!

🎉 PROMO LEBARAN TERNAKHUB 2026 🎉

Upgrade ke paket Pro dan nikmati:
• Diskon 30% untuk pembayaran pertama
• Berlaku: 10 Maret – 10 April 2026
• Kode promo: LEBARAN2026

Keuntungan Paket Pro:
✅ Listing marketplace tanpa batas
✅ Akses fitur AI Insight premium
✅ Manajemen ternak hingga 500 ekor
✅ Priority customer support
✅ Export laporan ke Excel/PDF

[PROMO INI TELAH BERAKHIR PADA 10 APRIL 2026]
Untuk promo terkini, pantau halaman Beranda TernakHub.

Terima kasih kepada lebih dari 1.200 workspace yang telah memanfaatkan promo ini!`,
    hasAttachment: false,
    tags: ['promo', 'lebaran', 'diskon', 'berakhir'],
    views: 9_882,
  },
  {
    id: 'ANN-0020',
    title: 'Pemeliharaan Rutin Server — Januari 2026 (Sudah Selesai)',
    category: 'Maintenance',
    audience: 'All Users',
    status: 'Expired',
    priority: 'Normal',
    isPinned: false,
    authorName: 'Tim Infrastruktur TernakHub',
    authorEmail: 'infra@ternakhub.id',
    createdAt: '2025-12-28',
    lastUpdatedAt: '2026-01-05',
    publishedAt: '2026-01-05',
    expiresAt: '2026-01-07',
    excerpt: '[BERAKHIR] Pemeliharaan server rutin awal tahun 2026 pada 6 Januari pukul 01.00–04.00 WIB. Pemeliharaan telah selesai lebih cepat dari jadwal.',
    fullContent: `[BERAKHIR — Pemeliharaan selesai 6 Januari 2026 pukul 03.15 WIB, lebih cepat 45 menit dari jadwal]

Kepada seluruh pengguna TernakHub,

Kami memberitahukan pemeliharaan server rutin awal tahun:
📅 Selasa, 6 Januari 2026, pukul 01.00 – 04.00 WIB

Yang dilakukan:
• Pembaruan sistem operasi server ke versi stabil terbaru
• Peningkatan kapasitas RAM server produksi
• Optimasi query database yang sering digunakan
• Pengujian sistem disaster recovery

Status setelah pemeliharaan:
✅ Semua sistem berjalan normal
✅ Performa query meningkat ~40% untuk halaman daftar ternak
✅ Tidak ada data yang hilang atau terdampak

Terima kasih atas kesabaran Anda.`,
    hasAttachment: false,
    tags: ['maintenance', 'server', 'rutin', 'berakhir'],
    views: 1_247,
  },
];

// ─── Filter helper ─────────────────────────────────────────────────────────────

export function filterAnnouncements(
  list: AdminAnnouncementRecord[],
  opts: {
    keyword?: string;
    status?: AnnouncementStatus | 'All';
    category?: AnnouncementType | 'All';
    audience?: AnnouncementAudience | 'All';
    priority?: 'All' | 'High' | 'Normal' | 'Low';
  },
): AdminAnnouncementRecord[] {
  return list.filter((r) => {
    const kw = opts.keyword?.toLowerCase().trim();
    if (kw && !r.title.toLowerCase().includes(kw) && !r.id.toLowerCase().includes(kw) && !r.authorName.toLowerCase().includes(kw) && !r.excerpt.toLowerCase().includes(kw)) return false;
    if (opts.status && opts.status !== 'All' && r.status !== opts.status) return false;
    if (opts.category && opts.category !== 'All' && r.category !== opts.category) return false;
    if (opts.audience && opts.audience !== 'All' && r.audience !== opts.audience) return false;
    if (opts.priority && opts.priority !== 'All' && r.priority !== opts.priority) return false;
    return true;
  });
}
