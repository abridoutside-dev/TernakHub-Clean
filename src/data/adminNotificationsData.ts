// ─── Notification Center Data — NOT-001 ──────────────────────────────────────
// Centralized per-user notification inbox.
// Updated from ADM-003B broadcast log to NOT-001 inbox model.
// NOTIFICATION-FIX-001: added mutation functions for mark-read, archive, delete.

// ─── Types ────────────────────────────────────────────────────────────────────

/** Which platform module generated the notification */
export type NotificationSource =
  | 'Authentication'
  | 'Workspace'
  | 'Livestock'
  | 'Feed'
  | 'Feed Formula'
  | 'Medicine'
  | 'Marketplace'
  | 'Subscription'
  | 'Trust & Verification'
  | 'Announcement'
  | 'AI Insight'
  | 'Reports'
  | 'Monitoring'
  | 'System';

/** Nature / intent of the notification */
export type NotificationType =
  | 'Information'
  | 'Success'
  | 'Warning'
  | 'Error'
  | 'Reminder'
  | 'Action Required';

export type NotificationReadStatus = 'Unread' | 'Read';
export type NotificationPriority   = 'High' | 'Normal' | 'Low';

/** Which context the notification belongs to */
export type NotificationContext = 'Platform Admin' | 'Workspace';

export interface NotificationRecord {
  id: string;
  title: string;
  source: NotificationSource;
  type: NotificationType;
  priority: NotificationPriority;
  readStatus: NotificationReadStatus;
  createdAt: string;                   // ISO-8601
  excerpt: string;                     // ≤ 120 chars preview
  fullMessage: string;                 // complete notification body
  relatedObjectType?: string;          // e.g. "ID Ternak", "ID Transaksi"
  relatedObjectId?: string;            // e.g. "LST-00123"
  context: NotificationContext;
  workspaceName?: string;
  workspaceId?: string;
}

// ─── Config maps ──────────────────────────────────────────────────────────────

export const SOURCE_CONFIG: Record<
  NotificationSource,
  { icon: string; color: string }
> = {
  Authentication:      { icon: '🔐', color: '#6366f1' },
  Workspace:           { icon: '🏢', color: '#0ea5e9' },
  Livestock:           { icon: '🐄', color: '#16a34a' },
  Feed:                { icon: '🌾', color: '#ca8a04' },
  'Feed Formula':      { icon: '🧪', color: '#0891b2' },
  Medicine:            { icon: '💊', color: '#dc2626' },
  Marketplace:         { icon: '🛒', color: '#d97706' },
  Subscription:        { icon: '⭐', color: '#7c3aed' },
  'Trust & Verification': { icon: '✅', color: '#059669' },
  Announcement:        { icon: '📢', color: '#0284c7' },
  'AI Insight':        { icon: '🤖', color: '#8b5cf6' },
  Reports:             { icon: '📊', color: '#475569' },
  Monitoring:          { icon: '📡', color: '#0891b2' },
  System:              { icon: '⚙️', color: '#64748b' },
};

export const TYPE_CONFIG: Record<
  NotificationType,
  { icon: string; color: string; bg: string }
> = {
  Information:      { icon: 'ℹ️',  color: '#0369a1', bg: '#e0f2fe' },
  Success:          { icon: '✅', color: '#059669', bg: '#d1fae5' },
  Warning:          { icon: '⚠️', color: '#d97706', bg: '#fef3c7' },
  Error:            { icon: '❌', color: '#dc2626', bg: '#fee2e2' },
  Reminder:         { icon: '🔔', color: '#7c3aed', bg: '#ede9fe' },
  'Action Required':{ icon: '⚡', color: '#b45309', bg: '#fef3c7' },
};

export const READ_STATUS_CONFIG: Record<
  NotificationReadStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  Unread: { label: 'Belum Dibaca', color: '#0369a1', bg: '#e0f2fe', dot: '#3b82f6' },
  Read:   { label: 'Sudah Dibaca', color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' },
};

export const PRIORITY_CONFIG: Record<
  NotificationPriority,
  { color: string; bg: string }
> = {
  High:   { color: '#dc2626', bg: '#fee2e2' },
  Normal: { color: '#0369a1', bg: '#e0f2fe' },
  Low:    { color: '#64748b', bg: '#f1f5f9' },
};

// Keep legacy exports so any existing import of NOTIF_STATUS_CONFIG, etc. still compiles.
export const NOTIF_STATUS_CONFIG = READ_STATUS_CONFIG as unknown as Record<string, { label: string; color: string; bg: string; dot: string }>;
export const NOTIF_TYPE_CONFIG   = SOURCE_CONFIG     as unknown as Record<string, { icon: string; color: string }>;
export const NOTIF_CHANNEL_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  'In-App': { icon: '📱', color: '#3b82f6', bg: '#eff6ff' },
  Email:    { icon: '📧', color: '#0369a1', bg: '#e0f2fe' },
  Push:     { icon: '🔔', color: '#7c3aed', bg: '#ede9fe' },
  WhatsApp: { icon: '💬', color: '#059669', bg: '#d1fae5' },
};

// ─── Summary stats ─────────────────────────────────────────────────────────────

export interface NotificationSummaryStats {
  total: number;
  unread: number;
  read: number;
  highPriority: number;
  systemNotifications: number;
  announcementNotifications: number;
}

export const NOTIFICATION_PLATFORM_STATS: NotificationSummaryStats = {
  total:                   3_284,
  unread:                  847,
  read:                    2_437,
  highPriority:            312,
  systemNotifications:     204,
  announcementNotifications: 118,
};

// ─── Mutable notification list (28 entries) ───────────────────────────────────
// Array is mutable — use markAdminNotificationAsRead / archiveAdminNotification
// / deleteAdminNotification to mutate; increment a `tick` state in consuming
// components to force re-render after each mutation.

export const ADMIN_NOTIFICATION_LIST: NotificationRecord[] = [
  // ── Marketplace ─────────────────────────────────────────────────────────────
  {
    id: 'NOT-0001',
    title: 'Transaksi Selesai — Sapi Simmental #TRX-20260718-0091',
    source: 'Marketplace',
    type: 'Success',
    priority: 'High',
    readStatus: 'Unread',
    createdAt: '2026-07-18T07:44:12.000Z',
    excerpt: 'Transaksi pembelian 3 ekor Sapi Simmental senilai Rp 42.500.000 telah selesai. Dana escrow berhasil dicairkan ke penjual.',
    fullMessage: `Transaksi Anda telah berhasil diselesaikan.

Detail Transaksi:
• ID Transaksi: TRX-20260718-0091
• Item: 3 ekor Sapi Simmental Jantan
• Penjual: Berkah Farm Garut (Terverifikasi ✅)
• Total Nilai: Rp 42.500.000
• Biaya Platform: Rp 850.000 (2%)
• Dana Diterima Penjual: Rp 41.650.000

Status Escrow: DICAIRKAN
Dana telah diteruskan ke rekening penjual setelah Anda mengkonfirmasi penerimaan ternak pada 18 Juli 2026 pukul 07:30 WIB.

Terima kasih telah bertransaksi di TernakHub Marketplace.`,
    relatedObjectType: 'ID Transaksi',
    relatedObjectId: 'TRX-20260718-0091',
    context: 'Workspace',
    workspaceName: 'Maju Jaya Ternak',
    workspaceId: 'WS-0029',
  },
  {
    id: 'NOT-0002',
    title: 'Penawaran Baru: Kambing Boer Jantan Siap Jual',
    source: 'Marketplace',
    type: 'Information',
    priority: 'Normal',
    readStatus: 'Read',
    createdAt: '2026-07-18T06:30:00.000Z',
    excerpt: 'Ada 8 listing kambing Boer baru dari peternak terverifikasi di area Jawa Barat. Stok terbatas, cek sekarang.',
    fullMessage: `Ada penawaran baru yang mungkin menarik minat Anda di Marketplace TernakHub.

Kambing Boer Jantan — Kualitas Premium
• Peternak: Sumber Rejeki Farm (Terverifikasi ✅)
• Lokasi: Garut, Jawa Barat
• Jumlah Tersedia: 12 ekor
• Bobot Rata-rata: 35–42 kg
• Harga: Rp 2.800.000 – Rp 3.500.000 / ekor
• Usia: 8–14 bulan
• Kondisi: Sehat, sudah divaksin

8 listing serupa tersedia dari peternak lain di area Jawa Barat.

Rekomendasi berdasarkan riwayat pencarian Anda.`,
    relatedObjectType: 'ID Listing',
    relatedObjectId: 'LST-00891',
    context: 'Workspace',
    workspaceName: 'Maju Jaya Ternak',
    workspaceId: 'WS-0029',
  },
  {
    id: 'NOT-0003',
    title: 'Laporan Mencurigakan Diterima pada Listing Anda',
    source: 'Marketplace',
    type: 'Action Required',
    priority: 'High',
    readStatus: 'Unread',
    createdAt: '2026-07-18T05:12:00.000Z',
    excerpt: 'Listing sapi Limosin Anda (LST-00774) menerima 2 laporan dari pengguna lain. Tim moderasi akan memeriksa dalam 24 jam.',
    fullMessage: `Listing Anda menerima laporan dari pengguna lain dan sedang dalam proses review moderasi.

Detail Listing:
• ID Listing: LST-00774
• Judul: Sapi Limosin Jantan 500kg — Siap Potong
• Laporan Masuk: 2 laporan

Alasan Laporan:
1. Harga tidak sesuai pasar (harga terlalu rendah, terindikasi penipuan)
2. Foto tidak sesuai deskripsi

Tindakan yang Diperlukan:
⚡ Silakan perbarui foto listing dengan foto asli ternak yang dijual
⚡ Pastikan harga yang dicantumkan sesuai nilai pasar
⚡ Respons tim moderasi dalam 24 jam

Jika listing terbukti tidak melanggar, laporan akan ditolak dan listing tetap aktif.
Jika terbukti melanggar, listing akan dinonaktifkan sementara.

Hubungi dukungan jika ada pertanyaan: marketplace@ternakhub.id`,
    relatedObjectType: 'ID Listing',
    relatedObjectId: 'LST-00774',
    context: 'Workspace',
    workspaceName: 'Berkah Farm Garut',
    workspaceId: 'WS-0012',
  },

  // ── Subscription ─────────────────────────────────────────────────────────────
  {
    id: 'NOT-0004',
    title: 'Pembayaran Subscription Pro Berhasil',
    source: 'Subscription',
    type: 'Success',
    priority: 'Normal',
    readStatus: 'Read',
    createdAt: '2026-07-18T07:15:00.000Z',
    excerpt: 'Pembayaran Pro Annual Rp 1.188.000 untuk Berkah Farm Garut berhasil diproses. Subscription aktif hingga 18 Juli 2027.',
    fullMessage: `Pembayaran subscription Anda telah berhasil diproses.

Detail Pembayaran:
• Workspace: Berkah Farm Garut (WS-0012)
• Paket: Pro Annual
• Nominal: Rp 1.188.000
• Metode: Transfer Bank BCA
• ID Transaksi: PAY-2026071800441
• Tanggal: 18 Juli 2026, 07:10 WIB

Status Subscription:
✅ AKTIF — Berlaku hingga 18 Juli 2027 (365 hari)

Fitur yang kini tersedia:
• Listing marketplace tanpa batas
• AI Insight premium di semua modul
• Manajemen hingga 500 ekor ternak
• Export laporan Excel/PDF
• Priority support

Terima kasih telah mempercayai TernakHub!`,
    relatedObjectType: 'ID Pembayaran',
    relatedObjectId: 'PAY-2026071800441',
    context: 'Workspace',
    workspaceName: 'Berkah Farm Garut',
    workspaceId: 'WS-0012',
  },
  {
    id: 'NOT-0005',
    title: 'Pengingat: Subscription Anda Berakhir dalam 7 Hari',
    source: 'Subscription',
    type: 'Reminder',
    priority: 'High',
    readStatus: 'Unread',
    createdAt: '2026-07-11T10:00:00.000Z',
    excerpt: 'Subscription Pro workspace Maju Jaya Ternak akan berakhir pada 18 Juli 2026. Perpanjang sekarang untuk menghindari gangguan layanan.',
    fullMessage: `Subscription workspace Anda akan segera berakhir.

Detail Subscription:
• Workspace: Maju Jaya Ternak
• Paket: Pro (Bulanan)
• Tanggal Berakhir: 18 Juli 2026 (7 hari lagi)

Jika tidak diperpanjang, fitur berikut akan terbatas mulai 19 Juli 2026:
• Listing marketplace dibatasi maksimal 3 listing aktif
• AI Insight premium tidak tersedia
• Export laporan dinonaktifkan
• Batas ternak turun ke 50 ekor

Opsi Perpanjangan:
📋 Pro Bulanan: Rp 99.000 / bulan
📋 Pro Annual: Rp 990.000 / tahun (hemat Rp 198.000)

Perpanjang melalui: Profil → Subscription → Perpanjang`,
    relatedObjectType: 'ID Workspace',
    relatedObjectId: 'WS-0029',
    context: 'Workspace',
    workspaceName: 'Maju Jaya Ternak',
    workspaceId: 'WS-0029',
  },

  // ── Livestock ─────────────────────────────────────────────────────────────────
  {
    id: 'NOT-0006',
    title: 'Pengingat: Jadwal Vaksinasi Minggu Ini — 5 Ekor Ternak',
    source: 'Livestock',
    type: 'Reminder',
    priority: 'High',
    readStatus: 'Unread',
    createdAt: '2026-07-18T06:00:00.000Z',
    excerpt: '5 ekor ternak di Berkah Farm Garut dijadwalkan mendapat vaksinasi ND minggu ini (18–24 Juli 2026). Segera konfirmasi jadwal.',
    fullMessage: `Pengingat jadwal kesehatan ternak Anda.

Jadwal Vaksinasi Minggu Ini (18–24 Juli 2026):
• Ternak: BFG-S-0012, BFG-S-0015, BFG-S-0021, BFG-S-0033, BFG-S-0044
• Jenis Vaksin: Newcastle Disease (ND) — Dosis Booster
• Dokter Hewan: drh. Ahmad Fauzi (Klinik Sehat Hewan Garut)
• Jadwal: Kamis, 22 Juli 2026, pukul 09.00 WIB

Stok Vaksin:
• ND (Booster) tersedia: 38 dosis ✅
• Cukup untuk 5 ekor yang dijadwalkan

Tindakan yang diperlukan:
🔔 Konfirmasi kehadiran dokter hewan
🔔 Pastikan ternak dalam kondisi sehat sebelum vaksinasi
🔔 Catat hasil vaksinasi di Modul Kesehatan Hewan

Hubungi klinik: +62 812-3456-7890`,
    relatedObjectType: 'Program Kesehatan',
    relatedObjectId: 'KH-2026-0088',
    context: 'Workspace',
    workspaceName: 'Berkah Farm Garut',
    workspaceId: 'WS-0012',
  },
  {
    id: 'NOT-0007',
    title: 'Kelahiran Ternak Berhasil Direkam',
    source: 'Livestock',
    type: 'Success',
    priority: 'Normal',
    readStatus: 'Read',
    createdAt: '2026-07-18T04:59:00.000Z',
    excerpt: 'Kelahiran 1 ekor anak sapi betina dari induk BFG-F-0022 (FH) berhasil direkam. Berat lahir 32 kg, kondisi sehat.',
    fullMessage: `Data kelahiran ternak berhasil disimpan ke sistem.

Detail Kelahiran:
• Induk: BFG-F-0022 — Sapi FH (Friesian Holstein) Betina
• Pejantan: BFG-M-0008 (IB — Semen Beku FH Import)
• Anak Lahir: 1 ekor Betina
• Berat Lahir: 32 kg
• Kondisi: Sehat — normal
• Waktu Lahir: 18 Juli 2026, 04:45 WIB
• Petugas: Agus Prayitno (Operator)

Program Reproduksi:
• ID Program: RP-2026-003 — Inseminasi Buatan Siklus Q3
• Lama Kebuntingan: 279 hari (normal: 270–285 hari)

Langkah Selanjutnya:
✅ Daftarkan anak ke Modul Livestock (Registrasi Anak)
✅ Catat berat badan awal
✅ Jadwalkan pemeriksaan 7 hari pasca lahir`,
    relatedObjectType: 'ID Program Reproduksi',
    relatedObjectId: 'RP-2026-003',
    context: 'Workspace',
    workspaceName: 'Berkah Farm Garut',
    workspaceId: 'WS-0012',
  },
  {
    id: 'NOT-0008',
    title: 'Peringatan: Berat Badan Ternak BFG-S-0044 Menurun',
    source: 'Livestock',
    type: 'Warning',
    priority: 'High',
    readStatus: 'Unread',
    createdAt: '2026-07-17T14:30:00.000Z',
    excerpt: 'Berat badan sapi BFG-S-0044 turun 8,3% dalam 2 minggu terakhir. AI Insight merekomendasikan pemeriksaan kesehatan segera.',
    fullMessage: `Sistem mendeteksi penurunan berat badan signifikan pada ternak Anda.

Data Ternak:
• ID: BFG-S-0044
• Jenis: Sapi Brahman Jantan
• Usia: 18 bulan

Riwayat Berat Badan:
• 3 Juli 2026: 312 kg
• 10 Juli 2026: 308 kg (-4 kg)
• 17 Juli 2026: 286 kg (-22 kg total, -8.3%)

Analisis AI Insight:
Penurunan >5% dalam 2 minggu mengindikasikan kemungkinan:
1. Gangguan pencernaan atau parasit internal
2. Kekurangan nutrisi mikro (mineral/vitamin)
3. Stres lingkungan (panas, kepadatan kandang)
4. Infeksi awal (belum bergejala klinis)

Rekomendasi:
⚠️ Segera lakukan pemeriksaan fisik oleh dokter hewan
⚠️ Isolasi sementara dari kandang utama jika ada gejala klinis
⚠️ Periksa kualitas pakan dan air minum
⚠️ Catat di Modul Kesehatan Hewan`,
    relatedObjectType: 'ID Ternak',
    relatedObjectId: 'BFG-S-0044',
    context: 'Workspace',
    workspaceName: 'Berkah Farm Garut',
    workspaceId: 'WS-0012',
  },

  // ── Feed ──────────────────────────────────────────────────────────────────────
  {
    id: 'NOT-0009',
    title: 'Stok Pakan Menipis — Konsentrat CP 118 Tersisa 18%',
    source: 'Feed',
    type: 'Warning',
    priority: 'High',
    readStatus: 'Unread',
    createdAt: '2026-07-18T06:33:00.000Z',
    excerpt: 'Stok Konsentrat Sapi Perah CP 118 di gudang utama tersisa 120 kg (18% dari kapasitas). Batas minimum 150 kg.',
    fullMessage: `PERINGATAN STOK PAKAN

Sistem mendeteksi stok pakan mendekati batas minimum.

Detail Stok:
• Item: Konsentrat Sapi Perah — CP 118
• Gudang: Gudang Utama Berkah Farm
• Stok Tersisa: 120 kg (18% kapasitas)
• Kapasitas Gudang: 650 kg
• Batas Minimum: 150 kg (22%)
• Status: ⚠️ DI BAWAH BATAS MINIMUM

Estimasi Ketahanan:
• Konsumsi harian: ~24 kg (8 sapi perah × 3 kg)
• Ketahanan tersisa: ±5 hari
• Perkiraan habis: 23 Juli 2026

Rekomendasi Pemesanan:
• Supplier Terakhir: PT Charoen Pokphand Indonesia
• Harga Terakhir: Rp 8.200 / kg
• Minimal Pesan: 200 kg
• Estimasi Pengiriman: 2–3 hari kerja

Segera lakukan pemesanan untuk menghindari kekurangan pakan.`,
    relatedObjectType: 'ID Inventaris',
    relatedObjectId: 'INV-PAKAN-0044',
    context: 'Workspace',
    workspaceName: 'Berkah Farm Garut',
    workspaceId: 'WS-0012',
  },
  {
    id: 'NOT-0010',
    title: 'Pemberian Pakan Pagi Berhasil Dicatat',
    source: 'Feed',
    type: 'Success',
    priority: 'Low',
    readStatus: 'Read',
    createdAt: '2026-07-18T06:15:00.000Z',
    excerpt: 'Pemberian pakan pagi untuk kandang sapi perah (8 ekor) berhasil dicatat. Total: Rumput Gajah 120 kg + Konsentrat 24 kg.',
    fullMessage: `Pencatatan pemberian pakan berhasil disimpan.

Detail Pemberian Pakan:
• Sesi: Pagi (06:00 WIB)
• Kandang: Kandang B — Sapi Perah
• Jumlah Ternak: 8 ekor
• Petugas: Bagas Nugroho (Operator)

Pakan yang Diberikan:
• Rumput Gajah Segar: 120 kg (15 kg/ekor)
• Konsentrat CP 118: 24 kg (3 kg/ekor)
• Air Minum: tersedia ad libitum

Total Stok Terpakai:
• Rumput Gajah: -120 kg → Sisa 380 kg
• Konsentrat CP 118: -24 kg → Sisa 120 kg ⚠️

Catatan: Stok konsentrat sudah di bawah batas minimum. Segera lakukan restok.`,
    relatedObjectType: 'ID Pemberian Pakan',
    relatedObjectId: 'LP-20260718-0012',
    context: 'Workspace',
    workspaceName: 'Berkah Farm Garut',
    workspaceId: 'WS-0012',
  },

  // ── Feed Formula ─────────────────────────────────────────────────────────────
  {
    id: 'NOT-0011',
    title: 'Produksi Formula Pakan Selesai — Formula Penggemukan A3',
    source: 'Feed Formula',
    type: 'Success',
    priority: 'Normal',
    readStatus: 'Read',
    createdAt: '2026-07-17T15:20:00.000Z',
    excerpt: 'Produksi Formula Penggemukan A3 sebanyak 200 kg selesai. Hasil telah ditambahkan ke inventaris stok pakan.',
    fullMessage: `Produksi formula pakan berhasil diselesaikan.

Detail Produksi:
• Nama Formula: Formula Penggemukan Sapi A3
• Nomor Batch: PROD-2026071700031
• Jumlah Diproduksi: 200 kg
• Waktu Produksi: 17 Juli 2026, 14:00–15:15 WIB
• Petugas: Wahyu Setiawan (Operator)

Bahan yang Digunakan:
• Jagung Giling: 80 kg (-80 kg dari stok)
• Dedak Padi: 50 kg (-50 kg dari stok)
• Bungkil Kedelai: 40 kg (-40 kg dari stok)
• Tepung Ikan: 20 kg (-20 kg dari stok)
• Mineral Mix: 8 kg (-8 kg dari stok)
• Premix Vitamin: 2 kg (-2 kg dari stok)

Hasil Ditambahkan ke Stok:
• Formula Penggemukan A3: +200 kg → Total stok: 350 kg

Estimasi Nilai Produksi: Rp 1.240.000
(Biaya bahan: Rp 6.200/kg rata-rata)`,
    relatedObjectType: 'Nomor Batch Produksi',
    relatedObjectId: 'PROD-2026071700031',
    context: 'Workspace',
    workspaceName: 'Berkah Farm Garut',
    workspaceId: 'WS-0012',
  },

  // ── Medicine ──────────────────────────────────────────────────────────────────
  {
    id: 'NOT-0012',
    title: 'Stok Vaksin ND Hampir Habis — Sisa 38 Dosis',
    source: 'Medicine',
    type: 'Warning',
    priority: 'High',
    readStatus: 'Unread',
    createdAt: '2026-07-18T07:02:00.000Z',
    excerpt: 'Stok Vaksin Newcastle Disease (ND) tersisa 38 dosis. Dengan jadwal vaksinasi 5 ekor pekan ini, stok cukup namun perlu segera dipesan ulang.',
    fullMessage: `Peringatan stok obat mendekati batas minimum.

Detail Stok Obat:
• Nama Obat: Vaksin Newcastle Disease (ND) — Booster
• Merek: Medivac ND Clone 45 (Medion)
• Stok Tersisa: 38 dosis
• Batas Minimum: 50 dosis
• Status: ⚠️ DI BAWAH BATAS MINIMUM

Penggunaan Terjadwal:
• Vaksinasi 5 ekor (22 Juli 2026): -5 dosis
• Sisa setelah vaksinasi: 33 dosis

Tanggal Kedaluwarsa: 15 Maret 2027 (masih valid)

Rekomendasi Pemesanan:
• Supplier: PT Medion Farma Jaya
• Harga Terakhir: Rp 45.000 / dosis
• Minimal Pesan: 100 dosis
• Estimasi Total: Rp 4.500.000
• Lead Time: 3–5 hari kerja

Pemesanan disarankan sebelum 22 Juli 2026 untuk memastikan stok aman.`,
    relatedObjectType: 'ID Stok Obat',
    relatedObjectId: 'SO-VAKSIN-ND-001',
    context: 'Workspace',
    workspaceName: 'Berkah Farm Garut',
    workspaceId: 'WS-0012',
  },
  {
    id: 'NOT-0013',
    title: 'Penyesuaian Stok Obat Disetujui',
    source: 'Medicine',
    type: 'Information',
    priority: 'Low',
    readStatus: 'Read',
    createdAt: '2026-07-18T06:25:00.000Z',
    excerpt: 'Penyesuaian stok Vaksin ND dari 45 → 38 dosis (-7 dosis) telah dicatat. Alasan: koreksi data gudang.',
    fullMessage: `Penyesuaian stok obat berhasil disimpan.

Detail Penyesuaian:
• Obat: Vaksin Newcastle Disease (ND)
• Stok Sebelum: 45 dosis
• Stok Sesudah: 38 dosis
• Selisih: -7 dosis
• Alasan: Koreksi data gudang (perbedaan fisik vs sistem)
• Petugas: Eko Prasetyo (Operator)
• Waktu: 18 Juli 2026, 06:20 WIB

Catatan Audit:
Penyesuaian ini tercatat permanen di riwayat stok obat dan tidak dapat diubah. Jika ada kekeliruan, hubungi Owner/Admin workspace untuk klarifikasi.

Lihat riwayat lengkap di: Stok Obat → Riwayat`,
    relatedObjectType: 'ID Stok Obat',
    relatedObjectId: 'SO-VAKSIN-ND-001',
    context: 'Workspace',
    workspaceName: 'Sari Bumi Ternak',
    workspaceId: 'WS-0074',
  },

  // ── Trust & Verification ──────────────────────────────────────────────────────
  {
    id: 'NOT-0014',
    title: 'Verifikasi Workspace Anda Disetujui!',
    source: 'Trust & Verification',
    type: 'Success',
    priority: 'High',
    readStatus: 'Read',
    createdAt: '2026-07-18T06:41:00.000Z',
    excerpt: 'Workspace Nusantara Agribisnis telah berhasil diverifikasi sebagai bisnis ternak resmi. Badge Terverifikasi kini aktif.',
    fullMessage: `Selamat! Verifikasi workspace Anda telah berhasil.

Detail Verifikasi:
• Workspace: Nusantara Agribisnis (WS-0055)
• Status Baru: ✅ TERVERIFIKASI BISNIS
• Disetujui Oleh: Admin Verifikasi TernakHub
• Tanggal Disetujui: 18 Juli 2026
• Berlaku Hingga: 18 Juli 2027

Dokumen yang Diterima:
✅ KTP Pemilik Usaha
✅ SIUP (Surat Izin Usaha Perdagangan)
✅ NPWP Perusahaan

Keuntungan Status Terverifikasi:
🏆 Badge "Terverifikasi" muncul di semua listing Marketplace Anda
🏆 Prioritas lebih tinggi di hasil pencarian Marketplace
🏆 Kepercayaan pembeli meningkat
🏆 Akses ke fitur Listing Premium (jika berlangganan Pro+)

Status verifikasi akan diperbarui otomatis menjelang masa berlaku habis.`,
    relatedObjectType: 'ID Workspace',
    relatedObjectId: 'WS-0055',
    context: 'Workspace',
    workspaceName: 'Nusantara Agribisnis',
    workspaceId: 'WS-0055',
  },
  {
    id: 'NOT-0015',
    title: 'Verifikasi Workspace Ditolak — Dokumen Tidak Lengkap',
    source: 'Trust & Verification',
    type: 'Error',
    priority: 'High',
    readStatus: 'Unread',
    createdAt: '2026-07-18T03:12:00.000Z',
    excerpt: 'Permohonan verifikasi Ternak Maju Magelang ditolak. SIUP kedaluwarsa dan KTP tidak terbaca. Silakan ajukan ulang setelah dokumen diperbaiki.',
    fullMessage: `Permohonan verifikasi workspace Anda ditolak.

Workspace: Ternak Maju Magelang (WS-0135)
Status: ❌ DITOLAK

Alasan Penolakan:
1. SIUP (Surat Izin Usaha Perdagangan) sudah kedaluwarsa sejak 2023
2. Foto KTP terlalu buram, data tidak terbaca dengan jelas

Langkah Selanjutnya:
1. Perbarui SIUP Anda di instansi terkait (Dinas Perindustrian dan Perdagangan)
2. Siapkan foto KTP yang jelas (resolusi minimal 1 MP, pencahayaan cukup)
3. Ajukan ulang verifikasi melalui: Profil → Verifikasi Workspace

Anda dapat mengajukan ulang setelah 7 hari (mulai 25 Juli 2026).

Pertanyaan? Hubungi: verifikasi@ternakhub.id`,
    relatedObjectType: 'ID Permohonan Verifikasi',
    relatedObjectId: 'VER-20260718-0031',
    context: 'Workspace',
    workspaceName: 'Ternak Maju Magelang',
    workspaceId: 'WS-0135',
  },

  // ── Announcement ─────────────────────────────────────────────────────────────
  {
    id: 'NOT-0016',
    title: 'Pengumuman: Pemeliharaan Sistem 20 Juli 2026',
    source: 'Announcement',
    type: 'Information',
    priority: 'High',
    readStatus: 'Read',
    createdAt: '2026-07-16T08:00:00.000Z',
    excerpt: 'Sistem TernakHub akan menjalani pemeliharaan terjadwal pada 20 Juli 2026 pukul 02.00–05.00 WIB. Semua fitur tidak dapat diakses selama periode tersebut.',
    fullMessage: `Pengumuman Resmi Platform TernakHub

Sistem TernakHub akan menjalani pemeliharaan terjadwal:
📅 Minggu, 20 Juli 2026
⏰ 02.00 – 05.00 WIB (3 jam)

Selama pemeliharaan, semua fitur — termasuk Livestock, Marketplace, Feed, dan Profil — tidak dapat diakses.

Harap selesaikan pekerjaan penting sebelum pukul 01.30 WIB.

Sistem akan kembali normal secara otomatis setelah pemeliharaan selesai. Tidak diperlukan tindakan dari pengguna.

— Tim Infrastruktur TernakHub`,
    relatedObjectType: 'ID Pengumuman',
    relatedObjectId: 'ANN-0001',
    context: 'Workspace',
    workspaceName: 'Berkah Farm Garut',
    workspaceId: 'WS-0012',
  },
  {
    id: 'NOT-0017',
    title: 'Pengumuman Keamanan: Aktifkan 2FA Sekarang',
    source: 'Announcement',
    type: 'Action Required',
    priority: 'High',
    readStatus: 'Unread',
    createdAt: '2026-07-18T07:18:00.000Z',
    excerpt: 'Tim keamanan mendeteksi peningkatan percobaan login tidak sah. Segera aktifkan autentikasi dua faktor (2FA) untuk melindungi akun Anda.',
    fullMessage: `Pengumuman Keamanan Penting dari TernakHub

Tim keamanan kami mendeteksi peningkatan percobaan login tidak sah dalam 48 jam terakhir.

Tindakan yang harus Anda lakukan SEKARANG:

🔒 Aktifkan 2FA: Profil → Keamanan → Aktifkan 2FA
🔑 Ganti kata sandi (minimal 12 karakter)
📱 Periksa sesi aktif dan akhiri sesi yang tidak dikenal

TernakHub tidak pernah meminta kata sandi melalui email, WhatsApp, atau SMS.

Jika akun Anda terasa dikompromikan, segera hubungi: keamanan@ternakhub.id

— Tim Keamanan TernakHub`,
    relatedObjectType: 'ID Pengumuman',
    relatedObjectId: 'ANN-0004',
    context: 'Workspace',
    workspaceName: 'Berkah Farm Garut',
    workspaceId: 'WS-0012',
  },

  // ── AI Insight ───────────────────────────────────────────────────────────────
  {
    id: 'NOT-0018',
    title: 'AI Insight Baru: Efisiensi Pakan Turun 12% Bulan Ini',
    source: 'AI Insight',
    type: 'Warning',
    priority: 'Normal',
    readStatus: 'Unread',
    createdAt: '2026-07-18T05:00:00.000Z',
    excerpt: 'AI Insight Pakan mendeteksi penurunan rasio konversi pakan (FCR) sebesar 12% dibanding bulan lalu. Analisis lengkap tersedia di modul Pakan.',
    fullMessage: `Laporan AI Insight — Modul Pakan
Periode: 1–17 Juli 2026

⚠️ TEMUAN UTAMA: Efisiensi Pakan Menurun

Rasio Konversi Pakan (FCR):
• Juni 2026: 7.2 (baik)
• Juli 2026 (s.d. 17 Juli): 8.1 (perlu perhatian)
• Perubahan: +0.9 (+12.5%) — lebih buruk

Analisis Penyebab (3 faktor teratas):
1. Stok konsentrat berkurang → pemberian tidak konsisten
2. Cuaca panas (rata-rata 32°C) → nafsu makan ternak turun
3. 2 ekor ternak (BFG-S-0044, BFG-S-0031) menunjukkan konsumsi rendah

Rekomendasi AI:
✅ Pastikan pasokan konsentrat tidak terputus
✅ Tambah frekuensi pemberian air minum di cuaca panas
✅ Periksa kesehatan BFG-S-0044 (sudah ada notifikasi terpisah)
✅ Pertimbangkan menambah suplemen elektrolit di musim kemarau

Lihat analisis lengkap di: Stok Pakan → AI Insight`,
    relatedObjectType: 'Modul',
    relatedObjectId: 'Stok Pakan — AI Insight',
    context: 'Workspace',
    workspaceName: 'Berkah Farm Garut',
    workspaceId: 'WS-0012',
  },
  {
    id: 'NOT-0019',
    title: 'AI Insight: 3 Rekomendasi Prioritas Minggu Ini',
    source: 'AI Insight',
    type: 'Reminder',
    priority: 'Normal',
    readStatus: 'Read',
    createdAt: '2026-07-14T07:00:00.000Z',
    excerpt: 'AI Platform merangkum 3 rekomendasi prioritas untuk workspace Anda minggu ini: kesehatan, pakan, dan reproduksi.',
    fullMessage: `Rangkuman AI Insight Mingguan
Periode: 14–20 Juli 2026

3 Rekomendasi Prioritas:

🔴 PRIORITAS TINGGI
1. Kesehatan — BFG-S-0044 menunjukkan penurunan berat signifikan. Segera lakukan pemeriksaan.

🟡 PRIORITAS SEDANG
2. Pakan — Stok konsentrat di bawah minimum. Estimasi habis 23 Juli. Pesan sekarang.

🟢 PRIORITAS RENDAH
3. Reproduksi — Program IB siklus Q3 berjalan baik. 1 kelahiran baru tercatat minggu ini.

Skor Kesehatan Farm Keseluruhan: 74/100 (Cukup Baik)
Perubahan dari minggu lalu: -3 poin (turun akibat isu pakan dan kesehatan ternak)

Laporan lengkap tersedia di Dashboard → AI Insight.`,
    relatedObjectType: 'Modul',
    relatedObjectId: 'Dashboard — AI Insight',
    context: 'Workspace',
    workspaceName: 'Berkah Farm Garut',
    workspaceId: 'WS-0012',
  },

  // ── Reports ───────────────────────────────────────────────────────────────────
  {
    id: 'NOT-0020',
    title: 'Laporan Bulanan Siap Diunduh — Juni 2026',
    source: 'Reports',
    type: 'Information',
    priority: 'Normal',
    readStatus: 'Read',
    createdAt: '2026-07-01T06:00:00.000Z',
    excerpt: 'Laporan performa peternakan bulan Juni 2026 sudah siap. Ringkasan: 75 ternak aktif, 1 kelahiran, FCR rata-rata 7.2, pengeluaran pakan Rp 8,4 juta.',
    fullMessage: `Laporan Bulanan Berkah Farm Garut — Juni 2026

Laporan otomatis telah digenerate oleh sistem.

RINGKASAN EKSEKUTIF:

🐄 Livestock
• Total Ternak Aktif: 75 ekor
• Kelahiran Baru: 1 ekor (anak sapi FH betina)
• Kematian: 0 ekor
• Mutasi Masuk: 0 | Keluar: 0

🌾 Pakan
• Total Pakan Digunakan: 2.140 kg
• Biaya Pakan: Rp 8.420.000
• Rasio Konversi Pakan (FCR): 7.2 (target: ≤8.0) ✅

💊 Kesehatan
• Vaksinasi: 12 ekor
• Pengobatan: 2 kasus minor
• Biaya Obat: Rp 1.240.000

💰 Finansial (Estimasi)
• Pengeluaran Operasional: Rp 12.800.000
• Estimasi Nilai Aset Ternak: Rp 2.840.000.000

Unduh laporan lengkap dalam format PDF/Excel melalui:
Profil → Laporan → Juni 2026`,
    relatedObjectType: 'Periode Laporan',
    relatedObjectId: 'REPORT-2026-06',
    context: 'Workspace',
    workspaceName: 'Berkah Farm Garut',
    workspaceId: 'WS-0012',
  },

  // ── Monitoring (Platform Admin context) ──────────────────────────────────────
  {
    id: 'NOT-0021',
    title: 'Alert: Latensi API Gateway Melebihi Ambang Batas',
    source: 'Monitoring',
    type: 'Warning',
    priority: 'High',
    readStatus: 'Unread',
    createdAt: '2026-07-18T07:02:00.000Z',
    excerpt: 'API Gateway Jakarta melaporkan latensi p99 1.240ms (ambang: 800ms) selama 5 menit berturut-turut. Tim DevOps diberitahu secara otomatis.',
    fullMessage: `PLATFORM MONITORING ALERT

Layanan: API Gateway — Region Jakarta
Severity: ⚠️ WARNING
Waktu Deteksi: 18 Juli 2026, 07:02 WIB
Durasi Anomali: 5 menit 33 detik

Metrik yang Terdampak:
• Latensi p99: 1.240 ms (ambang: 800 ms) — MELEWATI BATAS
• Latensi p50: 420 ms (ambang: 300 ms) — MELEWATI BATAS
• Error Rate: 0.8% (ambang: 1%) — masih dalam batas
• Request/min: 2.847 (normal)

Layanan yang Mungkin Terdampak:
• Halaman daftar ternak: loading lebih lambat
• Marketplace listing: respons agak lambat
• Notifikasi in-app: delay ringan

Tindakan Otomatis:
✅ Alert dikirim ke tim DevOps via PagerDuty
✅ Traffic monitoring diaktifkan (mode watchdog)
⏳ Auto-scaling sedang dievaluasi oleh sistem

Pantau status di: Admin → Monitoring`,
    relatedObjectType: 'ID Layanan',
    relatedObjectId: 'SVC-API-GW-JKT-01',
    context: 'Platform Admin',
  },
  {
    id: 'NOT-0022',
    title: 'KRITIS: Disk Usage Server Produksi 87%',
    source: 'Monitoring',
    type: 'Error',
    priority: 'High',
    readStatus: 'Unread',
    createdAt: '2026-07-18T05:57:00.000Z',
    excerpt: 'Server db-prod-01 mencapai 87% penggunaan disk (4.35 TB dari 5 TB). Kapasitas kritis diperkirakan dalam 48 jam tanpa intervensi.',
    fullMessage: `🚨 PLATFORM MONITORING — ALERT KRITIS 🚨

Server: db-prod-01 (Region: jakarta-1)
Severity: ❌ CRITICAL
Terdeteksi: 18 Juli 2026, 05:57 WIB

Status Disk:
• Penggunaan: 4.35 TB / 5 TB (87%)
• Tersisa: 650 GB
• Tren Pertumbuhan: ~15 GB/hari
• Estimasi Penuh: ±43 jam (sekitar 20 Juli 2026, 00:00 WIB)

Risiko Jika Tidak Ditangani:
❌ Database write operations akan gagal
❌ Backup harian tidak dapat disimpan
❌ Platform tidak dapat menerima data baru dari pengguna
❌ Potensi downtime total

Tindakan yang Diperlukan (urgensi TINGGI):
1. Tambah volume disk segera (minta persetujuan infrastructure budget)
2. Jalankan script cleanup log lama (>6 bulan)
3. Pindahkan backup lama ke cold storage
4. Evaluasi partisi terbesar (kemungkinan tabel audit_logs atau file uploads)

Eskalasi: Alert sudah dikirim ke CTO dan tim infrastruktur.`,
    relatedObjectType: 'ID Server',
    relatedObjectId: 'SRV-db-prod-01',
    context: 'Platform Admin',
  },
  {
    id: 'NOT-0023',
    title: 'Health Check Pulih — Layanan Email Kembali Normal',
    source: 'Monitoring',
    type: 'Success',
    priority: 'Normal',
    readStatus: 'Read',
    createdAt: '2026-07-18T04:25:00.000Z',
    excerpt: 'Layanan email (Postmark) kembali normal setelah gangguan 3 menit. 47 email tertunda berhasil dikirimkan ulang via SMTP fallback.',
    fullMessage: `PLATFORM MONITORING — PEMULIHAN LAYANAN

Layanan: Email Delivery (Postmark)
Status Sebelumnya: ❌ DOWN
Status Sekarang: ✅ PULIH

Timeline Insiden:
• 04:22 WIB: Health check gagal terdeteksi
• 04:22 WIB: Fallback SMTP internal diaktifkan otomatis
• 04:25 WIB: Postmark pulih, koneksi kembali normal
• 04:26 WIB: 47 email tertunda dikirimkan ulang
• 04:27 WIB: Semua email berhasil terkirim

Durasi Gangguan: 3 menit 17 detik

Dampak Aktual:
• Email tertunda: 47 email (notifikasi transaksi dan reminder)
• Email gagal permanen: 0
• Pengguna terdampak: minimal

Root Cause (sementara): Timeout sertifikat SSL pada koneksi API Postmark — investigasi lanjutan berlangsung.

Tidak diperlukan tindakan tambahan saat ini.`,
    relatedObjectType: 'ID Layanan',
    relatedObjectId: 'SVC-EMAIL-POSTMARK',
    context: 'Platform Admin',
  },

  // ── Authentication ───────────────────────────────────────────────────────────
  {
    id: 'NOT-0024',
    title: 'Login dari Perangkat Baru Terdeteksi',
    source: 'Authentication',
    type: 'Warning',
    priority: 'High',
    readStatus: 'Unread',
    createdAt: '2026-07-17T22:15:00.000Z',
    excerpt: 'Akun Anda diakses dari perangkat baru: iPhone 15, Jakarta, pada 17 Juli 2026 pukul 22:14 WIB. Bukan Anda? Segera ganti password.',
    fullMessage: `Peringatan keamanan akun Anda.

Login Baru Terdeteksi:
• Perangkat: iPhone 15 Pro (iOS 17.5)
• Browser: Safari Mobile 17
• Lokasi: Jakarta Selatan, DKI Jakarta
• Waktu: 17 Juli 2026, 22:14:33 WIB
• Alamat IP: 125.164.33.71

Status: Login berhasil

Apakah ini Anda?

✅ Ya, ini saya — Abaikan notifikasi ini
❌ Bukan saya — Lakukan langkah berikut SEGERA:
   1. Ganti kata sandi: Profil → Keamanan → Ubah Kata Sandi
   2. Akhiri semua sesi aktif: Profil → Keamanan → Sesi Aktif
   3. Aktifkan 2FA jika belum aktif
   4. Laporkan ke: keamanan@ternakhub.id

TernakHub tidak pernah meminta tindakan via telepon atau SMS.`,
    relatedObjectType: 'ID Sesi',
    relatedObjectId: 'SES-7a3f9b21cde4',
    context: 'Workspace',
    workspaceName: 'Maju Jaya Ternak',
    workspaceId: 'WS-0029',
  },
  {
    id: 'NOT-0025',
    title: 'Verifikasi Email Berhasil',
    source: 'Authentication',
    type: 'Success',
    priority: 'Normal',
    readStatus: 'Read',
    createdAt: '2026-07-18T06:11:00.000Z',
    excerpt: 'Alamat email f.rizky@mitratani.id berhasil diverifikasi. Akun kini aktif penuh dan dapat digunakan.',
    fullMessage: `Verifikasi email Anda berhasil!

Akun TernakHub Anda kini aktif penuh.

Detail Akun:
• Nama: Farhan Rizky
• Email: f.rizky@mitratani.id
• Terdaftar: 18 Juli 2026, 06:08 WIB
• Email Diverifikasi: 18 Juli 2026, 06:11 WIB

Langkah Selanjutnya:
1. Buat workspace pertama Anda (atau bergabung dengan yang sudah ada)
2. Lengkapi profil akun
3. Jelajahi fitur TernakHub

Butuh bantuan memulai? Kunjungi Pusat Bantuan TernakHub atau hubungi support@ternakhub.id

Selamat bergabung dengan keluarga besar TernakHub! 🐄`,
    context: 'Workspace',
    workspaceName: 'Mitra Tani Indramayu',
    workspaceId: 'WS-0119',
  },

  // ── Workspace ─────────────────────────────────────────────────────────────────
  {
    id: 'NOT-0026',
    title: 'Anggota Baru Bergabung ke Workspace Anda',
    source: 'Workspace',
    type: 'Information',
    priority: 'Normal',
    readStatus: 'Read',
    createdAt: '2026-07-18T07:21:00.000Z',
    excerpt: '2 anggota baru (Ahmad Fauzi, Rina Kusuma) telah ditambahkan ke Cahaya Tani Sukabumi dengan peran Operator.',
    fullMessage: `Anggota baru telah bergabung ke workspace Anda.

Workspace: Cahaya Tani Sukabumi (WS-0063)
Ditambahkan Oleh: Siti Aminah (Owner)
Waktu: 18 Juli 2026, 07:21 WIB

Anggota Baru:
1. Ahmad Fauzi — Peran: Operator
   Email: ahmad.fauzi@cahayatani.id

2. Rina Kusuma — Peran: Operator
   Email: rina.kusuma@cahayatani.id

Hak Akses Operator:
✅ Lihat semua data workspace
✅ Catat kegiatan (pakan, kesehatan, reproduksi)
✅ Buat draft listing marketplace
❌ Tidak dapat mengubah pengaturan workspace
❌ Tidak dapat mengelola anggota

Kelola anggota di: Profil → Workspace → Anggota`,
    relatedObjectType: 'ID Workspace',
    relatedObjectId: 'WS-0063',
    context: 'Workspace',
    workspaceName: 'Cahaya Tani Sukabumi',
    workspaceId: 'WS-0063',
  },

  // ── System ───────────────────────────────────────────────────────────────────
  {
    id: 'NOT-0027',
    title: 'Backup Harian Berhasil — 18 Juli 2026',
    source: 'System',
    type: 'Success',
    priority: 'Low',
    readStatus: 'Read',
    createdAt: '2026-07-18T03:35:00.000Z',
    excerpt: 'Proses backup database harian 18 Juli 2026 selesai dalam 4 menit 12 detik. Ukuran snapshot: 14.2 GB. Disimpan di Google Cloud Storage.',
    fullMessage: `Laporan Backup Harian Otomatis

Tanggal: 18 Juli 2026
Waktu Mulai: 03:30:05 WIB
Waktu Selesai: 03:34:17 WIB
Durasi: 4 menit 12 detik

Hasil:
✅ STATUS: BERHASIL

Detail Backup:
• Ukuran Total: 14.2 GB
• Database utama: 11.8 GB
• File uploads (foto ternak, dokumen): 2.1 GB
• Logs dan metadata: 0.3 GB

Penyimpanan:
• Lokasi: gs://ternakhub-backups/2026/07/18/
• Enkripsi: AES-256
• Checksum SHA-256: a3f9b21cde4f7890abc12345...
• Retensi: 30 hari (harian), 12 bulan (bulanan)

Restore Point Tersedia:
Backup ini dapat digunakan sebagai restore point jika diperlukan. Hubungi tim infrastruktur untuk proses pemulihan.`,
    context: 'Platform Admin',
  },
  {
    id: 'NOT-0028',
    title: 'Pembaruan Sistem Berhasil Diterapkan — v1.4.3',
    source: 'System',
    type: 'Information',
    priority: 'Normal',
    readStatus: 'Unread',
    createdAt: '2026-07-17T23:45:00.000Z',
    excerpt: 'TernakHub versi 1.4.3 berhasil di-deploy. Pembaruan mencakup perbaikan bug modul reproduksi dan peningkatan performa halaman daftar ternak.',
    fullMessage: `Pembaruan Platform TernakHub v1.4.3

Pembaruan berhasil di-deploy pada 17 Juli 2026, 23:45 WIB.

Changelog v1.4.3:

🐛 Perbaikan Bug:
• [Reproduksi] Fixed: Timeline program reproduksi tidak menampilkan event kelahiran dengan benar
• [Livestock] Fixed: Filter batch di halaman daftar ternak tidak berfungsi pada mobile
• [Marketplace] Fixed: Foto listing kadang tidak termuat di koneksi lambat
• [Feed] Fixed: Riwayat pemberian pakan menampilkan data duplikat

⚡ Peningkatan Performa:
• Halaman daftar ternak (Livestock List): waktu muat berkurang ~40%
• Query laporan bulanan: optimasi indeks database

🔒 Keamanan:
• Pembaruan library autentikasi ke versi terbaru
• Peningkatan validasi input di form marketplace

Tidak diperlukan tindakan dari pengguna. Semua perubahan aktif otomatis.`,
    context: 'Platform Admin',
  },
];

// ─── Filter helper ─────────────────────────────────────────────────────────────

export interface NotificationFilters {
  keyword: string;
  readStatus: NotificationReadStatus | 'All';
  source: NotificationSource | 'All';
  priority: NotificationPriority | 'All';
  type: NotificationType | 'All';
}

export function filterNotifications(
  list: NotificationRecord[],
  f: NotificationFilters,
): NotificationRecord[] {
  const q = f.keyword.trim().toLowerCase();
  return list.filter((r) => {
    if (f.readStatus !== 'All' && r.readStatus !== f.readStatus) return false;
    if (f.source !== 'All' && r.source !== f.source) return false;
    if (f.priority !== 'All' && r.priority !== f.priority) return false;
    if (f.type !== 'All' && r.type !== f.type) return false;
    if (q) {
      const hay = `${r.title} ${r.source} ${r.excerpt} ${r.id}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

// ─── Mutable operations — NOTIFICATION-FIX-001 ────────────────────────────────
// After calling any mutation, increment a `tick` state in consuming components
// to force useMemo / re-render.

/** Mark a single notification as read by id. No-op if already read or not found. */
export function markAdminNotificationAsRead(id: string): void {
  const rec = ADMIN_NOTIFICATION_LIST.find((r) => r.id === id);
  if (rec && rec.readStatus === 'Unread') rec.readStatus = 'Read';
}

/** Mark all unread notifications as read. Returns the count of updated records. */
export function markAllAdminNotificationsAsRead(): number {
  let count = 0;
  for (const rec of ADMIN_NOTIFICATION_LIST) {
    if (rec.readStatus === 'Unread') { rec.readStatus = 'Read'; count++; }
  }
  return count;
}

/** Archive (remove) a notification by id. No-op if not found. */
export function archiveAdminNotification(id: string): void {
  const idx = ADMIN_NOTIFICATION_LIST.findIndex((r) => r.id === id);
  if (idx !== -1) ADMIN_NOTIFICATION_LIST.splice(idx, 1);
}

/** Delete (remove) a notification by id. No-op if not found. */
export function deleteAdminNotification(id: string): void {
  const idx = ADMIN_NOTIFICATION_LIST.findIndex((r) => r.id === id);
  if (idx !== -1) ADMIN_NOTIFICATION_LIST.splice(idx, 1);
}

/** Delete all read notifications. Returns the count removed. */
export function deleteAllReadAdminNotifications(): number {
  const before = ADMIN_NOTIFICATION_LIST.length;
  const keep = ADMIN_NOTIFICATION_LIST.filter((r) => r.readStatus === 'Unread');
  ADMIN_NOTIFICATION_LIST.splice(0, ADMIN_NOTIFICATION_LIST.length, ...keep);
  return before - ADMIN_NOTIFICATION_LIST.length;
}

/** Live read — returns the current mutable array. */
export function getAdminNotifications(): NotificationRecord[] {
  return ADMIN_NOTIFICATION_LIST;
}

// Legacy type aliases kept for any existing imports
export type NotificationStatus = NotificationReadStatus;
export type NotificationType_Legacy = NotificationSource;
export type NotificationChannel = 'In-App' | 'Email' | 'Push' | 'WhatsApp';
export type AdminNotificationRecord = NotificationRecord;
