// ─── Admin Activity Center Data — ADM-004A ────────────────────────────────────
// Realistic dummy platform activity records. Read-only. No production data.

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActivityModule =
  | 'Authentication'
  | 'Workspace'
  | 'Livestock'
  | 'Feed'
  | 'Medicine'
  | 'Marketplace'
  | 'Subscription'
  | 'Verification'
  | 'Announcement'
  | 'Notification'
  | 'Admin'
  | 'Monitoring'
  | 'System';

export type ActivitySeverity = 'Information' | 'Warning' | 'Critical';
export type ActivityResult = 'Success' | 'Failed' | 'Warning' | 'Pending';

export interface ActivityRecord {
  id: string;
  timestamp: string;            // ISO-8601
  module: ActivityModule;
  actorName: string;
  actorId: string;
  workspaceName: string;
  workspaceId: string;
  action: string;
  result: ActivityResult;
  severity: ActivitySeverity;
  device: string;
  ip: string;
  description: string;
  additionalInfo: Record<string, string>;
}

// ─── Config Maps ──────────────────────────────────────────────────────────────

export const SEVERITY_CONFIG: Record<ActivitySeverity, { color: string; bg: string; dot: string; label: string }> = {
  Information: { color: '#2563eb', bg: '#eff6ff', dot: '#3b82f6', label: 'Informasi' },
  Warning:     { color: '#d97706', bg: '#fffbeb', dot: '#f59e0b', label: 'Peringatan' },
  Critical:    { color: '#dc2626', bg: '#fef2f2', dot: '#ef4444', label: 'Critical' },
};

export const RESULT_CONFIG: Record<ActivityResult, { color: string; bg: string; label: string }> = {
  Success: { color: '#059669', bg: '#ecfdf5', label: 'Berhasil' },
  Failed:  { color: '#dc2626', bg: '#fef2f2', label: 'Gagal' },
  Warning: { color: '#d97706', bg: '#fffbeb', label: 'Peringatan' },
  Pending: { color: '#7c3aed', bg: '#f5f3ff', label: 'Menunggu' },
};

export const MODULE_CONFIG: Record<ActivityModule, { icon: string; color: string }> = {
  Authentication: { icon: '🔐', color: '#6366f1' },
  Workspace:      { icon: '🏢', color: '#0ea5e9' },
  Livestock:      { icon: '🐄', color: '#16a34a' },
  Feed:           { icon: '🌾', color: '#ca8a04' },
  Medicine:       { icon: '💊', color: '#dc2626' },
  Marketplace:    { icon: '🛒', color: '#d97706' },
  Subscription:   { icon: '⭐', color: '#7c3aed' },
  Verification:   { icon: '✅', color: '#059669' },
  Announcement:   { icon: '📢', color: '#0284c7' },
  Notification:   { icon: '🔔', color: '#ea580c' },
  Admin:          { icon: '⚙️', color: '#475569' },
  Monitoring:     { icon: '📡', color: '#0891b2' },
  System:         { icon: '🖥️', color: '#64748b' },
};

// ─── Dummy Activity Records ───────────────────────────────────────────────────

export const ACTIVITY_LIST: ActivityRecord[] = [
  {
    id: 'ACT-20260718-0001',
    timestamp: '2026-07-18T07:42:11.000Z',
    module: 'Authentication',
    actorName: 'Budi Santoso',
    actorId: 'USR-0034',
    workspaceName: 'Berkah Farm Garut',
    workspaceId: 'WS-0012',
    action: 'Login',
    result: 'Success',
    severity: 'Information',
    device: 'Chrome 126 / Android 14',
    ip: '103.118.45.22',
    description: 'Pengguna berhasil masuk ke platform menggunakan email dan kata sandi.',
    additionalInfo: {
      'Metode Auth': 'Email + Password',
      'Sesi ID': 'SES-7a3f9b21',
      'Durasi Sesi': '—',
      '2FA': 'Tidak Aktif',
    },
  },
  {
    id: 'ACT-20260718-0002',
    timestamp: '2026-07-18T07:39:55.000Z',
    module: 'Marketplace',
    actorName: 'Dewi Rahayu',
    actorId: 'USR-0071',
    workspaceName: 'Maju Jaya Ternak',
    workspaceId: 'WS-0029',
    action: 'Buat Listing Baru',
    result: 'Success',
    severity: 'Information',
    device: 'Safari 17 / iOS 17.5',
    ip: '180.244.132.7',
    description: 'Pengguna membuat listing baru untuk ternak sapi Limousin seberat 420 kg.',
    additionalInfo: {
      'ID Listing': 'LST-00891',
      'Kategori': 'Ternak — Sapi',
      'Harga': 'Rp 22.500.000',
      'Status Awal': 'Draft',
    },
  },
  {
    id: 'ACT-20260718-0003',
    timestamp: '2026-07-18T07:35:02.000Z',
    module: 'System',
    actorName: 'System Scheduler',
    actorId: 'SYS-0001',
    workspaceName: '—',
    workspaceId: '—',
    action: 'Jadwal Backup Harian',
    result: 'Success',
    severity: 'Information',
    device: 'Server / Node.js 20',
    ip: '10.0.0.1',
    description: 'Proses backup database harian berhasil diselesaikan. Ukuran snapshot 14.2 GB.',
    additionalInfo: {
      'Ukuran Backup': '14.2 GB',
      'Durasi': '4 menit 12 detik',
      'Lokasi': 'gs://ternakhub-backups/2026-07-18',
      'Checksum': 'sha256:a3f9b21c…',
    },
  },
  {
    id: 'ACT-20260718-0004',
    timestamp: '2026-07-18T07:28:44.000Z',
    module: 'Authentication',
    actorName: 'Rahmat Hidayat',
    actorId: 'USR-0112',
    workspaceName: 'Sumber Rejeki Agro',
    workspaceId: 'WS-0047',
    action: 'Login Gagal',
    result: 'Failed',
    severity: 'Warning',
    device: 'Firefox 127 / Windows 11',
    ip: '202.67.88.15',
    description: 'Percobaan login gagal 3 kali berturut-turut. Akun diberikan cooldown 10 menit.',
    additionalInfo: {
      'Percobaan': '3 dari 5',
      'Alasan': 'Kata sandi salah',
      'Cooldown': '10 menit',
      'Notifikasi Email': 'Dikirim',
    },
  },
  {
    id: 'ACT-20260718-0005',
    timestamp: '2026-07-18T07:21:30.000Z',
    module: 'Workspace',
    actorName: 'Siti Aminah',
    actorId: 'USR-0088',
    workspaceName: 'Cahaya Tani Sukabumi',
    workspaceId: 'WS-0063',
    action: 'Tambah Anggota Workspace',
    result: 'Success',
    severity: 'Information',
    device: 'Chrome 126 / macOS 14',
    ip: '114.79.14.55',
    description: 'Pemilik workspace menambahkan 2 anggota baru dengan peran Operator.',
    additionalInfo: {
      'Anggota Baru': 'Ahmad Fauzi, Rina Kusuma',
      'Peran Diberikan': 'Operator',
      'Undangan Via': 'Email',
    },
  },
  {
    id: 'ACT-20260718-0006',
    timestamp: '2026-07-18T07:15:18.000Z',
    module: 'Subscription',
    actorName: 'Hendra Gunawan',
    actorId: 'USR-0022',
    workspaceName: 'Pantura Livestock Hub',
    workspaceId: 'WS-0009',
    action: 'Upgrade Paket ke PRO',
    result: 'Success',
    severity: 'Information',
    device: 'Chrome 126 / Windows 10',
    ip: '118.96.201.44',
    description: 'Workspace berhasil diupgrade dari paket Free ke PRO. Pembayaran dikonfirmasi.',
    additionalInfo: {
      'Paket Sebelumnya': 'Free',
      'Paket Baru': 'PRO',
      'Metode Bayar': 'Transfer Bank BCA',
      'ID Transaksi': 'TRX-2026071800441',
      'Berlaku Hingga': '18 Juli 2027',
    },
  },
  {
    id: 'ACT-20260718-0007',
    timestamp: '2026-07-18T07:09:05.000Z',
    module: 'Livestock',
    actorName: 'Agus Prayitno',
    actorId: 'USR-0145',
    workspaceName: 'Gemilang Farm Blitar',
    workspaceId: 'WS-0081',
    action: 'Registrasi Ternak Massal',
    result: 'Success',
    severity: 'Information',
    device: 'Chrome 126 / Android 13',
    ip: '36.73.112.88',
    description: 'Pengguna mendaftarkan 18 ekor sapi perah secara massal melalui fitur import.',
    additionalInfo: {
      'Jumlah Ternak': '18 ekor',
      'Jenis': 'Sapi Perah — FH (Friesian Holstein)',
      'Metode': 'Import CSV',
      'Gagal': '0 ekor',
    },
  },
  {
    id: 'ACT-20260718-0008',
    timestamp: '2026-07-18T07:02:33.000Z',
    module: 'Monitoring',
    actorName: 'System Monitor',
    actorId: 'SYS-0002',
    workspaceName: '—',
    workspaceId: '—',
    action: 'Deteksi Latensi Tinggi',
    result: 'Warning',
    severity: 'Warning',
    device: 'Server / Prometheus',
    ip: '10.0.0.2',
    description: 'API Gateway melaporkan latensi p99 di atas ambang batas 800ms selama 5 menit.',
    additionalInfo: {
      'Layanan': 'API Gateway — Region Jakarta',
      'Latensi p99': '1.240 ms',
      'Ambang Batas': '800 ms',
      'Durasi Anomali': '5 menit 33 detik',
      'Tindakan': 'Alert dikirim ke tim DevOps',
    },
  },
  {
    id: 'ACT-20260718-0009',
    timestamp: '2026-07-18T06:55:47.000Z',
    module: 'Marketplace',
    actorName: 'Yusuf Mahmud',
    actorId: 'USR-0203',
    workspaceName: 'Ternak Sejahtera Kediri',
    workspaceId: 'WS-0102',
    action: 'Transaksi Selesai',
    result: 'Success',
    severity: 'Information',
    device: 'Safari 17 / iOS 16.7',
    ip: '125.164.33.71',
    description: 'Transaksi jual beli kambing Boer berhasil diselesaikan. Dana escrow dicairkan.',
    additionalInfo: {
      'ID Transaksi': 'TRX-2026071800338',
      'Nilai Transaksi': 'Rp 4.800.000',
      'Biaya Platform': 'Rp 96.000 (2%)',
      'Escrow': 'Dicairkan ke penjual',
      'Durasi Transaksi': '2 hari 4 jam',
    },
  },
  {
    id: 'ACT-20260718-0010',
    timestamp: '2026-07-18T06:48:14.000Z',
    module: 'Admin',
    actorName: 'Admin Platform',
    actorId: 'ADM-0001',
    workspaceName: '—',
    workspaceId: '—',
    action: 'Publikasikan Pengumuman',
    result: 'Success',
    severity: 'Information',
    device: 'Chrome 126 / macOS 14',
    ip: '203.0.113.45',
    description: 'Admin mempublikasikan pengumuman pemeliharaan sistem terjadwal untuk 20 Juli 2026.',
    additionalInfo: {
      'Judul': 'Pemeliharaan Sistem 20 Juli 2026',
      'Target Audiens': 'Semua Pengguna',
      'Jenis': 'Informasi Sistem',
      'Kanal': 'In-App + Email',
    },
  },
  {
    id: 'ACT-20260718-0011',
    timestamp: '2026-07-18T06:41:09.000Z',
    module: 'Verification',
    actorName: 'Admin Verifikasi',
    actorId: 'ADM-0003',
    workspaceName: 'Nusantara Agribisnis',
    workspaceId: 'WS-0055',
    action: 'Verifikasi Workspace Disetujui',
    result: 'Success',
    severity: 'Information',
    device: 'Chrome 126 / Windows 11',
    ip: '203.0.113.45',
    description: 'Workspace berhasil diverifikasi sebagai bisnis ternak resmi setelah dokumen diperiksa.',
    additionalInfo: {
      'Tingkat Verifikasi': 'Terverifikasi Bisnis',
      'Dokumen Diunggah': '3 berkas',
      'Reviewer': 'Admin Verifikasi — ADM-0003',
      'Berlaku': '18 Juli 2026 – 18 Juli 2027',
    },
  },
  {
    id: 'ACT-20260718-0012',
    timestamp: '2026-07-18T06:33:55.000Z',
    module: 'Feed',
    actorName: 'Nurul Hidayah',
    actorId: 'USR-0177',
    workspaceName: 'Harapan Makmur Farm',
    workspaceId: 'WS-0038',
    action: 'Stok Pakan Menipis',
    result: 'Warning',
    severity: 'Warning',
    device: 'Chrome 126 / Android 14',
    ip: '110.137.68.99',
    description: 'Sistem mendeteksi stok konsentrat sapi perah kurang dari 20% kapasitas gudang.',
    additionalInfo: {
      'Item Pakan': 'Konsentrat Sapi Perah — CP 118',
      'Stok Tersisa': '120 kg (18%)',
      'Batas Minimum': '150 kg (22%)',
      'Rekomendasi': 'Segera lakukan pemesanan ulang',
    },
  },
  {
    id: 'ACT-20260718-0013',
    timestamp: '2026-07-18T06:25:41.000Z',
    module: 'Medicine',
    actorName: 'Eko Prasetyo',
    actorId: 'USR-0091',
    workspaceName: 'Sari Bumi Ternak',
    workspaceId: 'WS-0074',
    action: 'Penyesuaian Stok Obat',
    result: 'Success',
    severity: 'Information',
    device: 'Firefox 127 / Ubuntu 22',
    ip: '180.254.77.13',
    description: 'Operator melakukan koreksi stok vaksin ND karena data tidak sesuai fisik gudang.',
    additionalInfo: {
      'Obat': 'Vaksin ND (Newcastle Disease)',
      'Stok Sebelum': '45 dosis',
      'Stok Sesudah': '38 dosis',
      'Selisih': '-7 dosis',
      'Alasan': 'Koreksi data gudang',
    },
  },
  {
    id: 'ACT-20260718-0014',
    timestamp: '2026-07-18T06:18:22.000Z',
    module: 'System',
    actorName: 'System Auto-Cleanup',
    actorId: 'SYS-0003',
    workspaceName: '—',
    workspaceId: '—',
    action: 'Pembersihan Sesi Kedaluwarsa',
    result: 'Success',
    severity: 'Information',
    device: 'Server / Cron Job',
    ip: '10.0.0.1',
    description: 'Proses otomatis membersihkan 1.847 sesi yang kedaluwarsa dari database.',
    additionalInfo: {
      'Sesi Dihapus': '1.847',
      'Tabel': 'auth.sessions',
      'Durasi': '12 detik',
      'Ruang Dibebaskan': '~45 MB',
    },
  },
  {
    id: 'ACT-20260718-0015',
    timestamp: '2026-07-18T06:11:08.000Z',
    module: 'Authentication',
    actorName: 'Farhan Rizky',
    actorId: 'USR-0318',
    workspaceName: 'Mitra Tani Indramayu',
    workspaceId: 'WS-0119',
    action: 'Daftar Akun Baru',
    result: 'Success',
    severity: 'Information',
    device: 'Chrome 126 / Android 13',
    ip: '114.122.88.31',
    description: 'Pengguna baru berhasil mendaftar dan email verifikasi telah dikirimkan.',
    additionalInfo: {
      'Email': 'f.rizky@mitratani.id',
      'Tipe Akun': 'Perorangan',
      'Verifikasi Email': 'Menunggu',
      'Referral': 'Iklan Instagram',
    },
  },
  {
    id: 'ACT-20260718-0016',
    timestamp: '2026-07-18T06:04:33.000Z',
    module: 'Marketplace',
    actorName: 'Rizki Ananda',
    actorId: 'USR-0241',
    workspaceName: 'Peternak Muda Bogor',
    workspaceId: 'WS-0093',
    action: 'Laporan Listing Mencurigakan',
    result: 'Pending',
    severity: 'Warning',
    device: 'Safari 17 / iOS 17',
    ip: '125.161.99.44',
    description: 'Pengguna melaporkan listing kambing dengan harga jauh di bawah pasaran sebagai dugaan penipuan.',
    additionalInfo: {
      'ID Listing': 'LST-00774',
      'Alasan Laporan': 'Harga tidak wajar / dugaan penipuan',
      'Status Moderasi': 'Menunggu Review',
      'Prioritas': 'Tinggi',
    },
  },
  {
    id: 'ACT-20260718-0017',
    timestamp: '2026-07-18T05:57:19.000Z',
    module: 'System',
    actorName: 'System Alert',
    actorId: 'SYS-0004',
    workspaceName: '—',
    workspaceId: '—',
    action: 'Disk Usage Tinggi',
    result: 'Warning',
    severity: 'Critical',
    device: 'Server / Alertmanager',
    ip: '10.0.0.3',
    description: 'Penggunaan disk storage server produksi mencapai 87%. Kapasitas kritis dalam 48 jam.',
    additionalInfo: {
      'Server': 'db-prod-01 (jakarta-1)',
      'Penggunaan Disk': '87% (4.35 TB / 5 TB)',
      'Sisa Estimasi': '~48 jam',
      'Tindakan': 'Alert eskalasi ke tim infrastruktur',
      'Rekomendasi': 'Tambah volume atau arsipkan data lama',
    },
  },
  {
    id: 'ACT-20260718-0018',
    timestamp: '2026-07-18T05:44:07.000Z',
    module: 'Workspace',
    actorName: 'Linda Pertiwi',
    actorId: 'USR-0055',
    workspaceName: 'Karya Mandiri Livestock',
    workspaceId: 'WS-0031',
    action: 'Arsipkan Workspace',
    result: 'Success',
    severity: 'Information',
    device: 'Chrome 126 / Windows 10',
    ip: '103.43.221.88',
    description: 'Pemilik mengarsipkan workspace setelah mengkonfirmasi nama workspace dengan benar.',
    additionalInfo: {
      'Konfirmasi Nama': 'Karya Mandiri Livestock ✓',
      'Anggota Aktif': '4 orang (dinonaktifkan)',
      'Data': 'Diarsipkan, tidak dihapus',
    },
  },
  {
    id: 'ACT-20260718-0019',
    timestamp: '2026-07-18T05:31:50.000Z',
    module: 'Notification',
    actorName: 'Sistem Notifikasi',
    actorId: 'SYS-0005',
    workspaceName: '—',
    workspaceId: '—',
    action: 'Pengiriman Notifikasi Massal',
    result: 'Success',
    severity: 'Information',
    device: 'Server / Node.js 20',
    ip: '10.0.0.1',
    description: 'Notifikasi reminder pembayaran langganan berhasil dikirim ke 234 workspace.',
    additionalInfo: {
      'Jenis Notifikasi': 'Reminder Langganan',
      'Target': '234 workspace',
      'Berhasil Dikirim': '231 (98.7%)',
      'Gagal': '3 (bounce email)',
    },
  },
  {
    id: 'ACT-20260718-0020',
    timestamp: '2026-07-18T05:18:33.000Z',
    module: 'Admin',
    actorName: 'Admin Platform',
    actorId: 'ADM-0001',
    workspaceName: 'Sunrise Poultry Farm',
    workspaceId: 'WS-0144',
    action: 'Suspend Akun Pengguna',
    result: 'Success',
    severity: 'Critical',
    device: 'Chrome 126 / macOS 14',
    ip: '203.0.113.45',
    description: 'Akun pengguna disuspend selama 30 hari karena pelanggaran berulang kebijakan marketplace.',
    additionalInfo: {
      'ID Pengguna': 'USR-0298',
      'Nama Pengguna': 'Tono Susanto',
      'Alasan': 'Listing palsu berulang (3x pelanggaran)',
      'Durasi Suspend': '30 hari',
      'Banding': 'Dibuka',
    },
  },
  {
    id: 'ACT-20260718-0021',
    timestamp: '2026-07-18T04:59:44.000Z',
    module: 'Livestock',
    actorName: 'Wahyu Setiawan',
    actorId: 'USR-0166',
    workspaceName: 'Bintang Pagi Ranch',
    workspaceId: 'WS-0087',
    action: 'Rekam Kelahiran Ternak',
    result: 'Success',
    severity: 'Information',
    device: 'Chrome 126 / Android 12',
    ip: '36.82.144.77',
    description: 'Operator merekam kelahiran anak sapi dari program reproduksi aktif.',
    additionalInfo: {
      'Induk': 'SW-F-0022 (Sapi FH)',
      'Anak': '1 ekor betina',
      'Berat Lahir': '32 kg',
      'Kondisi': 'Sehat',
      'Program Reproduksi': 'RP-2026-003',
    },
  },
  {
    id: 'ACT-20260718-0022',
    timestamp: '2026-07-18T04:41:19.000Z',
    module: 'Announcement',
    actorName: 'Admin Konten',
    actorId: 'ADM-0002',
    workspaceName: '—',
    workspaceId: '—',
    action: 'Publikasikan Artikel News',
    result: 'Success',
    severity: 'Information',
    device: 'Firefox 127 / Windows 11',
    ip: '203.0.113.48',
    description: 'Artikel tentang tren harga sapi Limosin semester II 2026 dipublikasikan.',
    additionalInfo: {
      'Judul Artikel': 'Tren Harga Sapi Limosin Semester II 2026',
      'Kategori': 'Analisis Pasar',
      'Penulis': 'Tim Editorial TernakHub',
      'Pembaca Estimasi': '2.400+ pengguna',
    },
  },
  {
    id: 'ACT-20260718-0023',
    timestamp: '2026-07-18T04:22:05.000Z',
    module: 'System',
    actorName: 'System Health Check',
    actorId: 'SYS-0002',
    workspaceName: '—',
    workspaceId: '—',
    action: 'Health Check Gagal — Layanan Email',
    result: 'Failed',
    severity: 'Critical',
    device: 'Server / Prometheus',
    ip: '10.0.0.2',
    description: 'Layanan pengiriman email gagal merespons health check selama 3 menit. Fallback aktif.',
    additionalInfo: {
      'Layanan': 'Email Delivery (Postmark)',
      'Durasi Down': '3 menit 17 detik',
      'Fallback': 'SMTP Internal',
      'Email Tertunda': '47 email',
      'Status Saat Ini': 'Pulih (fallback aktif)',
    },
  },
  {
    id: 'ACT-20260718-0024',
    timestamp: '2026-07-18T03:55:38.000Z',
    module: 'Subscription',
    actorName: 'Imelda Tanjung',
    actorId: 'USR-0133',
    workspaceName: 'Prima Daging Sapi',
    workspaceId: 'WS-0066',
    action: 'Batalkan Langganan',
    result: 'Success',
    severity: 'Warning',
    device: 'Safari 17 / macOS 14',
    ip: '114.79.88.21',
    description: 'Pemilik workspace membatalkan paket PRO dan kembali ke paket Free.',
    additionalInfo: {
      'Paket Dibatalkan': 'PRO',
      'Efektif Turun': '18 Agustus 2026',
      'Alasan': 'Biaya terlalu tinggi',
      'Churn Survey': 'Diisi',
    },
  },
  {
    id: 'ACT-20260718-0025',
    timestamp: '2026-07-18T03:31:14.000Z',
    module: 'Feed',
    actorName: 'Bagas Nugroho',
    actorId: 'USR-0201',
    workspaceName: 'Makmur Jaya Peternak',
    workspaceId: 'WS-0112',
    action: 'Pemberian Pakan Tercatat',
    result: 'Success',
    severity: 'Information',
    device: 'Chrome 126 / Android 13',
    ip: '112.215.77.31',
    description: 'Operator mencatat pemberian pakan pagi untuk kandang sapi perah sebanyak 8 ekor.',
    additionalInfo: {
      'Kandang': 'Kandang B — Sapi Perah',
      'Jumlah Ternak': '8 ekor',
      'Pakan': 'Rumput Gajah 120 kg + Konsentrat 24 kg',
      'Sesi': 'Pagi (06:00)',
    },
  },
  {
    id: 'ACT-20260718-0026',
    timestamp: '2026-07-18T03:12:02.000Z',
    module: 'Verification',
    actorName: 'Admin Verifikasi',
    actorId: 'ADM-0003',
    workspaceName: 'Ternak Maju Magelang',
    workspaceId: 'WS-0135',
    action: 'Verifikasi Ditolak',
    result: 'Failed',
    severity: 'Warning',
    device: 'Chrome 126 / Windows 11',
    ip: '203.0.113.45',
    description: 'Permohonan verifikasi workspace ditolak karena dokumen izin usaha tidak valid.',
    additionalInfo: {
      'Alasan Penolakan': 'Dokumen SIUP kedaluwarsa (2023)',
      'Dokumen Kurang': 'SIUP terbaru',
      'Notifikasi': 'Email + In-App dikirim',
      'Bisa Ajukan Ulang': 'Ya, setelah 7 hari',
    },
  },
  {
    id: 'ACT-20260718-0027',
    timestamp: '2026-07-18T02:48:55.000Z',
    module: 'Medicine',
    actorName: 'Dini Kusumawati',
    actorId: 'USR-0089',
    workspaceName: 'Agro Lestari Purwokerto',
    workspaceId: 'WS-0044',
    action: 'Tambah Stok Obat',
    result: 'Success',
    severity: 'Information',
    device: 'Firefox 127 / Windows 10',
    ip: '103.55.44.99',
    description: 'Operator menambahkan 100 dosis vaksin Brucellosis dari pembelian baru.',
    additionalInfo: {
      'Obat': 'Vaksin Brucellosis S19',
      'Jumlah Ditambah': '100 dosis',
      'Supplier': 'PT Medion Farma Jaya',
      'Tanggal Kedaluwarsa': '2027-03-15',
    },
  },
  {
    id: 'ACT-20260718-0028',
    timestamp: '2026-07-18T02:14:41.000Z',
    module: 'Monitoring',
    actorName: 'System Alert',
    actorId: 'SYS-0004',
    workspaceName: '—',
    workspaceId: '—',
    action: 'CPU Spike Terdeteksi',
    result: 'Warning',
    severity: 'Warning',
    device: 'Server / Prometheus',
    ip: '10.0.0.2',
    description: 'Worker node mengalami lonjakan CPU 94% selama batch proses notifikasi malam.',
    additionalInfo: {
      'Node': 'worker-02 (jakarta-1)',
      'Peak CPU': '94.3%',
      'Durasi': '8 menit',
      'Proses Penyebab': 'notification-batch-worker',
      'Resolusi': 'Auto-scaling triggered',
    },
  },
  {
    id: 'ACT-20260718-0029',
    timestamp: '2026-07-18T01:55:22.000Z',
    module: 'Authentication',
    actorName: 'Putri Anggraini',
    actorId: 'USR-0277',
    workspaceName: 'Lembah Subur Ternak',
    workspaceId: 'WS-0098',
    action: 'Reset Kata Sandi',
    result: 'Success',
    severity: 'Information',
    device: 'Chrome 126 / Android 14',
    ip: '114.4.201.77',
    description: 'Pengguna berhasil mereset kata sandi melalui tautan yang dikirim ke email.',
    additionalInfo: {
      'Metode Reset': 'Email Link',
      'Link Kedaluwarsa': '60 menit',
      'Digunakan Setelah': '12 menit',
      'Sesi Lama': 'Diinvalidasi',
    },
  },
  {
    id: 'ACT-20260718-0030',
    timestamp: '2026-07-18T01:22:09.000Z',
    module: 'Marketplace',
    actorName: 'Admin Moderasi',
    actorId: 'ADM-0004',
    workspaceName: '—',
    workspaceId: '—',
    action: 'Hapus Listing Melanggar',
    result: 'Success',
    severity: 'Critical',
    device: 'Chrome 126 / macOS 14',
    ip: '203.0.113.45',
    description: 'Admin menghapus listing yang terbukti menggunakan foto ternak curian dari website lain.',
    additionalInfo: {
      'ID Listing': 'LST-00691',
      'Pelanggaran': 'Foto tidak sah / hak cipta',
      'Penjual': 'USR-0298 (Tono Susanto)',
      'Laporan Asal': '2 laporan pengguna',
      'Tindak Lanjut': 'Warning ke akun penjual',
    },
  },
];

// ─── Summary Stats ────────────────────────────────────────────────────────────

export interface ActivitySummaryStats {
  totalToday: number;
  userActivities: number;
  workspaceActivities: number;
  marketplaceActivities: number;
  adminActivities: number;
  systemActivities: number;
}

export const ACTIVITY_SUMMARY: ActivitySummaryStats = {
  totalToday: 1_847,
  userActivities: 1_203,
  workspaceActivities: 312,
  marketplaceActivities: 248,
  adminActivities: 44,
  systemActivities: 40,
};

// ─── Filter Options ───────────────────────────────────────────────────────────

export const MODULE_OPTIONS: ActivityModule[] = [
  'Authentication', 'Workspace', 'Livestock', 'Feed', 'Medicine',
  'Marketplace', 'Subscription', 'Verification', 'Announcement',
  'Notification', 'Admin', 'Monitoring', 'System',
];

export const SEVERITY_OPTIONS: ActivitySeverity[] = ['Information', 'Warning', 'Critical'];
export const RESULT_OPTIONS: ActivityResult[] = ['Success', 'Failed', 'Warning', 'Pending'];

// ─── Filter helper ────────────────────────────────────────────────────────────

export interface ActivityFilters {
  search: string;
  module: ActivityModule | '';
  severity: ActivitySeverity | '';
  result: ActivityResult | '';
}

export function filterActivities(
  list: ActivityRecord[],
  f: ActivityFilters,
): ActivityRecord[] {
  const q = f.search.trim().toLowerCase();
  return list.filter((r) => {
    if (f.module && r.module !== f.module) return false;
    if (f.severity && r.severity !== f.severity) return false;
    if (f.result && r.result !== f.result) return false;
    if (q) {
      const hay =
        r.id + ' ' + r.actorName + ' ' + r.workspaceName + ' ' + r.module + ' ' + r.action + ' ' + r.description;
      if (!hay.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}
