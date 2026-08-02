// ─── Admin Navigation Data — ADM-002 ─────────────────────────────────────────
// Single source of truth for sidebar nav tree and module configs.

export interface AdminNavChild {
  key: string;
  label: string;
  path: string;
  icon?: string;
}

export interface AdminNavItem {
  key: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
  badgeColor?: string;
  children?: AdminNavChild[];
}

export interface AdminModuleConfig {
  key: string;
  icon: string;
  title: string;
  description: string;
  purpose: string;              // one-paragraph future purpose
  subSections: AdminSubSection[];
}

export interface AdminSubSection {
  key: string;
  icon: string;
  title: string;
  description: string;
}

// ─── Nav Tree ────────────────────────────────────────────────────────────────

export const ADMIN_NAV_TREE: AdminNavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    path: '/admin',
  },
  {
    key: 'activity',
    label: 'Pusat Aktivitas',
    icon: '📋',
    path: '/admin/activity',
  },
  {
    key: 'search',
    label: 'Pencarian Global',
    icon: '🔍',
    path: '/admin/search',
  },
  {
    key: 'users',
    label: 'Pengguna',
    icon: '👤',
    path: '/admin/users',
    children: [
      { key: 'users-list',     label: 'Daftar Pengguna',  path: '/admin/users',          icon: '📋' },
      { key: 'users-roles',    label: 'Peran & Izin',     path: '/admin/users/roles',    icon: '🔑' },
      { key: 'users-activity', label: 'Log Aktivitas',    path: '/admin/users/activity', icon: '📜' },
    ],
  },
  {
    key: 'workspaces',
    label: 'Workspaces',
    icon: '🏢',
    path: '/admin/workspaces',
    children: [
      { key: 'ws-all',          label: 'Semua Workspace', path: '/admin/workspaces',              icon: '🗂️' },
      { key: 'ws-plans',        label: 'Paket',           path: '/admin/workspaces/plans',        icon: '⭐' },
      { key: 'ws-verification', label: 'Verifikasi',      path: '/admin/workspaces/verification', icon: '✅' },
    ],
  },
  {
    key: 'marketplace',
    label: 'Marketplace',
    icon: '🛒',
    path: '/admin/marketplace',
    children: [
      { key: 'mp-listings',     label: 'Listing',    path: '/admin/marketplace',              icon: '📦' },
      { key: 'mp-transactions', label: 'Transaksi',  path: '/admin/marketplace/transactions', icon: '💳' },
      { key: 'mp-reports',      label: 'Laporan',    path: '/admin/marketplace/reports',      icon: '🚩' },
    ],
  },
  {
    key: 'ownership-transfer',
    label: 'Transfer Kepemilikan',
    icon: '🔄',
    path: '/admin/ownership-transfer',
    children: [
      { key: 'own-all',     label: 'Semua Permintaan', path: '/admin/ownership-transfer',         icon: '📋' },
      { key: 'own-pending', label: 'Dalam Proses',     path: '/admin/ownership-transfer/pending', icon: '⏳' },
      { key: 'own-done',    label: 'Selesai',           path: '/admin/ownership-transfer/done',    icon: '✅' },
    ],
  },
  {
    key: 'relationships',
    label: 'Hubungan',
    icon: '🤝',
    path: '/admin/relationships',
    children: [
      { key: 'rel-all',     label: 'Semua Hubungan', path: '/admin/relationships',         icon: '📋' },
      { key: 'rel-active',  label: 'Aktif',           path: '/admin/relationships/active',  icon: '✅' },
      { key: 'rel-pending', label: 'Menunggu',         path: '/admin/relationships/pending', icon: '⏳' },
    ],
  },
  {
    key: 'escrow',
    label: 'Escrow',
    icon: '🔐',
    path: '/admin/escrow',
    children: [
      { key: 'esc-list',    label: 'Semua Escrow',  path: '/admin/escrow',         icon: '📋' },
      { key: 'esc-active',  label: 'Aktif',          path: '/admin/escrow/active',  icon: '⏳' },
      { key: 'esc-dispute', label: 'Sengketa',       path: '/admin/escrow/dispute', icon: '⚠️' },
    ],
  },
  {
    key: 'master-escrow',
    label: 'Master Escrow',
    icon: '🛡️',
    path: '/admin/master-escrow',
    children: [
      { key: 'me-providers', label: 'Penyedia Escrow', path: '/admin/master-escrow', icon: '🛡️' },
    ],
  },
  {
    key: 'livestock',
    label: 'Livestock',
    icon: '🐄',
    path: '/admin/livestock',
    children: [
      { key: 'ls-registry', label: 'Registri',        path: '/admin/livestock',          icon: '📋' },
      { key: 'ls-health',   label: 'Rekam Kesehatan', path: '/admin/livestock/health',   icon: '🩺' },
      { key: 'ls-breeding', label: 'Data Pembiakan',  path: '/admin/livestock/breeding', icon: '🔬' },
    ],
  },
  {
    key: 'lineage',
    label: 'Silsilah Lintas WS',
    icon: '🌳',
    path: '/admin/lineage',
    children: [
      { key: 'lin-registry',  label: 'Registri Silsilah',   path: '/admin/lineage',              icon: '📋' },
      { key: 'lin-crossws',   label: 'Referensi Lintas WS', path: '/admin/lineage/cross-ws',     icon: '🌐' },
      { key: 'lin-verify',    label: 'Antrian Verifikasi',  path: '/admin/lineage/verification', icon: '✅' },
    ],
  },
  {
    key: 'feed',
    label: 'Pakan',
    icon: '🌾',
    path: '/admin/feed',
    children: [
      { key: 'fd-master', label: 'Data Master', path: '/admin/feed',             icon: '📚' },
      { key: 'fd-stock',  label: 'Stok',        path: '/admin/feed/stock',       icon: '📦' },
      { key: 'fd-cons',   label: 'Konsumsi',    path: '/admin/feed/consumption', icon: '📊' },
    ],
  },
  {
    key: 'medicine',
    label: 'Obat',
    icon: '💊',
    path: '/admin/medicine',
    children: [
      { key: 'med-catalog', label: 'Katalog',          path: '/admin/medicine',       icon: '📚' },
      { key: 'med-stock',   label: 'Stok',             path: '/admin/medicine/stock', icon: '📦' },
      { key: 'med-usage',   label: 'Rekam Penggunaan', path: '/admin/medicine/usage', icon: '📋' },
    ],
  },
  {
    key: 'subscription',
    label: 'Langganan',
    icon: '⭐',
    path: '/admin/subscription',
    children: [
      { key: 'sub-plans',    label: 'Paket',         path: '/admin/subscription',          icon: '📋' },
      { key: 'sub-billing',  label: 'Tagihan',       path: '/admin/subscription/billing',  icon: '💳' },
      { key: 'sub-features', label: 'Matriks Fitur', path: '/admin/subscription/features', icon: '🔧' },
    ],
  },
  {
    key: 'trust',
    label: 'Kepercayaan & Verifikasi',
    icon: '✅',
    path: '/admin/trust',
    children: [
      { key: 'tv-pending',  label: 'Antrian Menunggu', path: '/admin/trust',          icon: '⏳' },
      { key: 'tv-approved', label: 'Disetujui',        path: '/admin/trust/approved', icon: '✅' },
      { key: 'tv-rejected', label: 'Ditolak',          path: '/admin/trust/rejected', icon: '❌' },
    ],
  },
  {
    key: 'announcements',
    label: 'Pengumuman',
    icon: '📢',
    path: '/admin/announcements',
    children: [
      { key: 'ann-published',  label: 'Diterbitkan', path: '/admin/announcements',           icon: '✅' },
      { key: 'ann-drafts',     label: 'Draf',        path: '/admin/announcements/drafts',    icon: '✏️' },
      { key: 'ann-scheduled',  label: 'Terjadwal',   path: '/admin/announcements/scheduled', icon: '📅' },
    ],
  },
  {
    key: 'notifications',
    label: 'Notifikasi',
    icon: '🔔',
    path: '/admin/notifications',
    children: [
      { key: 'notif-all',       label: 'Semua Notifikasi', path: '/admin/notifications',           icon: '📋' },
      { key: 'notif-templates', label: 'Template',         path: '/admin/notifications/templates', icon: '📝' },
    ],
  },
  {
    key: 'reports',
    label: 'Laporan',
    icon: '🚩',
    path: '/admin/reports',
    children: [
      { key: 'rpt-user',      label: 'Laporan Pengguna', path: '/admin/reports',          icon: '👤' },
      { key: 'rpt-content',   label: 'Laporan Konten',   path: '/admin/reports/content',   icon: '📄' },
      { key: 'rpt-financial', label: 'Keuangan',         path: '/admin/reports/financial', icon: '💰' },
    ],
  },
  {
    key: 'monitoring',
    label: 'Pemantauan',
    icon: '📡',
    path: '/admin/monitoring',
    children: [
      { key: 'mon-health', label: 'Kesehatan Sistem', path: '/admin/monitoring',             icon: '❤️' },
      { key: 'mon-errors', label: 'Log Kesalahan',    path: '/admin/monitoring/errors',      icon: '⚠️' },
      { key: 'mon-perf',   label: 'Performa',         path: '/admin/monitoring/performance', icon: '⚡' },
    ],
  },
  {
    key: 'data_master',
    label: 'Data Master',
    icon: '🗂️',
    path: '/admin/data-master',
    children: [
      { key: 'dm-categories', label: 'Kategori',    path: '/admin/data-master',         icon: '📁' },
      { key: 'dm-master',     label: 'Daftar Master', path: '/admin/data-master/master',  icon: '📋' },
      { key: 'dm-imports',    label: 'Impor',        path: '/admin/data-master/imports', icon: '📥' },
    ],
  },
  {
    key: 'settings',
    label: 'Pengaturan',
    icon: '⚙️',
    path: '/admin/settings',
    children: [
      { key: 'set-general',  label: 'Umum',     path: '/admin/settings',          icon: '🔧' },
      { key: 'set-security', label: 'Keamanan', path: '/admin/settings/security', icon: '🔒' },
      { key: 'set-api',      label: 'API Keys', path: '/admin/settings/api',      icon: '🔑' },
      { key: 'set-email',    label: 'Email',    path: '/admin/settings/email',    icon: '📧' },
    ],
  },
];

// ─── Module Configs (used by AdminModuleShell) ────────────────────────────────

export const ADMIN_MODULE_CONFIGS: Record<string, AdminModuleConfig> = {
  users: {
    key: 'users',
    icon: '👤',
    title: 'Pengguna',
    description: 'Kelola pengguna platform, peran, dan izin akses.',
    purpose:
      'Modul ini menyediakan tampilan lengkap seluruh pengguna terdaftar di platform TernakHub. ' +
      'Administrator dapat mencari, memfilter, menangguhkan, atau menghapus akun secara permanen, ' +
      'menetapkan peran dan izin, serta meninjau log aktivitas pengguna.',
    subSections: [
      { key: 'list',     icon: '📋', title: 'Daftar Pengguna',  description: 'Telusuri dan cari semua pengguna terdaftar dengan filter berdasarkan status, paket, dan tanggal daftar.' },
      { key: 'roles',    icon: '🔑', title: 'Peran & Izin',     description: 'Tentukan dan tetapkan peran (Admin, Moderator, Support) dengan cakupan izin yang terperinci.' },
      { key: 'activity', icon: '📜', title: 'Log Aktivitas',    description: 'Jejak audit lengkap semua tindakan yang dilakukan pengguna untuk keperluan kepatuhan dan keamanan.' },
    ],
  },
  workspaces: {
    key: 'workspaces',
    icon: '🏢',
    title: 'Workspaces',
    description: 'Kelola semua workspace terdaftar, paket, dan verifikasi workspace.',
    purpose:
      'Modul ini memberikan pengawasan atas setiap workspace di platform — termasuk yang aktif, ditangguhkan, ' +
      'dan diarsipkan. Admin dapat meninjau detail workspace, meningkatkan atau menurunkan paket, ' +
      'mengelola anggota, dan memproses lencana verifikasi resmi workspace.',
    subSections: [
      { key: 'all',          icon: '🗂️', title: 'Semua Workspace', description: 'Registri lengkap semua workspace dengan status, tingkat paket, jumlah anggota, dan tanggal pembuatan.' },
      { key: 'plans',        icon: '⭐', title: 'Paket',            description: 'Lihat dan kelola penugasan paket, masa percobaan, dan penggantian tagihan.' },
      { key: 'verification', icon: '✅', title: 'Verifikasi',       description: 'Proses permintaan verifikasi workspace dan kelola lencana resmi.' },
    ],
  },
  marketplace: {
    key: 'marketplace',
    icon: '🛒',
    title: 'Marketplace',
    description: 'Awasi listing marketplace, transaksi, dan penyelesaian sengketa.',
    purpose:
      'Modul Marketplace memberi admin pengawasan penuh atas semua aktivitas jual beli di TernakHub. ' +
      'Ini mencakup moderasi listing, pemantauan transaksi, dan penyelesaian sengketa atau konten yang dilaporkan. ' +
      'Admin dapat menangguhkan listing, menerbitkan pengembalian dana, dan mengeskalasi kasus.',
    subSections: [
      { key: 'listings',     icon: '📦', title: 'Listing',    description: 'Tinjau, setujui, tangguhkan, atau hapus semua listing marketplace di seluruh platform.' },
      { key: 'transactions', icon: '💳', title: 'Transaksi',  description: 'Pantau semua catatan transaksi, status pembayaran, dan aktivitas escrow.' },
      { key: 'reports',      icon: '🚩', title: 'Laporan',    description: 'Tindak lanjuti laporan sengketa pembeli/penjual dan tanda konten yang dikirimkan pengguna.' },
    ],
  },
  livestock: {
    key: 'livestock',
    icon: '🐄',
    title: 'Livestock',
    description: 'Registri ternak seluruh platform, pengawasan kesehatan, dan data pembiakan.',
    purpose:
      'Menyediakan tampilan administratif hanya-baca atas semua ternak yang terdaftar di seluruh workspace. ' +
      'Admin dapat mengaudit catatan, memverifikasi integritas data, dan membuat laporan agregat tentang populasi ' +
      'ternak, tren kesehatan, dan distribusi spesies di seluruh platform.',
    subSections: [
      { key: 'registry', icon: '📋', title: 'Registri',        description: 'Tampilan agregat semua entri ternak terdaftar di seluruh platform.' },
      { key: 'health',   icon: '🩺', title: 'Rekam Kesehatan', description: 'Ringkasan kejadian kesehatan seluruh platform, pemantauan wabah penyakit, dan statistik pengobatan.' },
      { key: 'breeding', icon: '🔬', title: 'Data Pembiakan',  description: 'Analitik program pembiakan lintas workspace dan pemeriksaan integritas data silsilah.' },
    ],
  },
  feed: {
    key: 'feed',
    icon: '🌾',
    title: 'Pakan',
    description: 'Kelola data referensi pakan master, tingkat stok, dan analitik konsumsi.',
    purpose:
      'Modul admin Pakan memberikan pengawasan atas pustaka referensi pakan dan nutrisi master ' +
      'yang mendukung semua modul pakan tingkat workspace. Admin dapat menambahkan bahan baru, memperbarui ' +
      'data gizi, mengelola entri produk komersial, dan melihat statistik konsumsi agregat.',
    subSections: [
      { key: 'master', icon: '📚', title: 'Data Master', description: 'Kelola pustaka referensi bahan pakan master yang digunakan oleh semua workspace.' },
      { key: 'stock',  icon: '📦', title: 'Stok',        description: 'Tampilan agregat tingkat stok pakan yang dilaporkan di seluruh workspace.' },
      { key: 'cons',   icon: '📊', title: 'Konsumsi',    description: 'Analitik konsumsi pakan seluruh platform dan laporan tren gizi.' },
    ],
  },
  medicine: {
    key: 'medicine',
    icon: '💊',
    title: 'Obat',
    description: 'Kelola katalog obat hewan, pengawasan stok, dan rekam penggunaan.',
    purpose:
      'Mengadministrasikan katalog obat dan produk kesehatan hewan seluruh platform. Admin dapat menambahkan ' +
      'obat baru, memperbarui panduan dosis, mengelola merek produk komersial, dan meninjau rekam ' +
      'penggunaan obat agregat untuk mengidentifikasi tren penyakit atau masalah pasokan.',
    subSections: [
      { key: 'catalog', icon: '📚', title: 'Katalog',          description: 'Katalog obat hewan master mencakup semua kategori obat dan produk komersial.' },
      { key: 'stock',   icon: '📦', title: 'Stok',             description: 'Tampilan tingkat stok agregat di semua inventaris obat workspace.' },
      { key: 'usage',   icon: '📋', title: 'Rekam Penggunaan', description: 'Jejak audit penggunaan obat seluruh platform untuk kepatuhan regulasi.' },
    ],
  },
  subscription: {
    key: 'subscription',
    icon: '⭐',
    title: 'Langganan',
    description: 'Kelola paket langganan, penggantian tagihan, dan matriks akses fitur.',
    purpose:
      'Mengontrol lapisan langganan dan monetisasi TernakHub. Admin dapat menentukan tingkatan paket ' +
      '(Free, Basic, Pro, Enterprise), menetapkan harga, mengonfigurasi matriks akses fitur, mengelola ' +
      'penggantian tagihan, dan meninjau metrik kesehatan langganan.',
    subSections: [
      { key: 'plans',    icon: '📋', title: 'Paket',         description: 'Tentukan dan kelola tingkatan paket langganan, harga, dan konfigurasi percobaan.' },
      { key: 'billing',  icon: '💳', title: 'Tagihan',       description: 'Tinjau catatan tagihan, proses penggantian manual, dan lihat ringkasan pendapatan.' },
      { key: 'features', icon: '🔧', title: 'Matriks Fitur', description: 'Konfigurasikan fitur mana yang dapat diakses di bawah setiap paket langganan.' },
    ],
  },
  trust: {
    key: 'trust',
    icon: '✅',
    title: 'Kepercayaan & Verifikasi',
    description: 'Proses permintaan verifikasi workspace dan kelola tingkat kepercayaan platform.',
    purpose:
      'Mengelola lapisan kepercayaan dan kredibilitas marketplace TernakHub. Workspace dapat mengajukan ' +
      'lencana verifikasi resmi. Admin meninjau dokumen yang dikirimkan, menyetujui atau menolak permohonan, ' +
      'dan menetapkan tingkat kepercayaan yang memengaruhi visibilitas marketplace dan akses fitur.',
    subSections: [
      { key: 'pending',  icon: '⏳', title: 'Antrian Menunggu', description: 'Tinjau permintaan verifikasi masuk beserta dokumen dan detail workspace yang dikirimkan.' },
      { key: 'approved', icon: '✅', title: 'Disetujui',        description: 'Registri semua workspace terverifikasi dengan tanggal verifikasi dan jenis lencana.' },
      { key: 'rejected', icon: '❌', title: 'Ditolak',          description: 'Riwayat permohonan yang ditolak beserta alasan penolakan untuk pemrosesan banding.' },
    ],
  },
  announcements: {
    key: 'announcements',
    icon: '📢',
    title: 'Pengumuman',
    description: 'Buat dan kelola pengumuman dan spanduk seluruh platform.',
    purpose:
      'Memungkinkan administrator platform berkomunikasi langsung dengan semua pengguna atau segmen audiens tertentu. ' +
      'Admin dapat menerbitkan pemberitahuan pemeliharaan, pengumuman fitur, dan pembaruan regulasi, ' +
      'serta menjadwalkannya untuk publikasi mendatang dengan pengiriman bertarget.',
    subSections: [
      { key: 'published',  icon: '✅', title: 'Diterbitkan', description: 'Semua pengumuman aktif yang saat ini terlihat oleh pengguna.' },
      { key: 'drafts',     icon: '✏️', title: 'Draf',        description: 'Pengumuman yang sedang dikerjakan dan belum diterbitkan.' },
      { key: 'scheduled',  icon: '📅', title: 'Terjadwal',   description: 'Pengumuman dalam antrian untuk publikasi mendatang dengan waktu pengiriman yang dikonfigurasi.' },
    ],
  },
  notifications: {
    key: 'notifications',
    icon: '🔔',
    title: 'Notifikasi',
    description: 'Kelola template notifikasi platform, log pengiriman, dan pengaturan push.',
    purpose:
      'Mengontrol infrastruktur notifikasi yang mendorong semua peringatan dalam aplikasi, ringkasan email, dan ' +
      'notifikasi push. Admin dapat mengedit template pesan, meninjau tingkat keberhasilan pengiriman, ' +
      'mengonfigurasi pemicu notifikasi, dan mengelola catatan opt-out.',
    subSections: [
      { key: 'all',       icon: '📋', title: 'Semua Notifikasi', description: 'Log lengkap semua notifikasi yang dikirim di seluruh platform dengan status pengiriman.' },
      { key: 'templates', icon: '📝', title: 'Template',         description: 'Edit dan pratinjau template pesan notifikasi untuk semua jenis pemicu.' },
    ],
  },
  reports: {
    key: 'reports',
    icon: '🚩',
    title: 'Laporan',
    description: 'Tinjau dan tindak lanjuti semua laporan, tanda, dan eskalasi yang dikirimkan pengguna.',
    purpose:
      'Antrian triase pusat untuk semua laporan yang dibuat pengguna. Admin dapat meninjau laporan yang dikategorikan ' +
      'berdasarkan jenis (perilaku pengguna, kebijakan konten, penipuan finansial), menetapkan tingkat keparahan, mengambil tindakan ' +
      '(peringatan, penangguhan, pemblokiran), dan melacak status penyelesaian.',
    subSections: [
      { key: 'user',      icon: '👤', title: 'Laporan Pengguna', description: 'Laporan yang menargetkan akun pengguna — pelecehan, peniruan identitas, penipuan.' },
      { key: 'content',   icon: '📄', title: 'Laporan Konten',   description: 'Laporan yang menargetkan listing, pengumuman, atau item konten lainnya.' },
      { key: 'financial', icon: '💰', title: 'Keuangan',         description: 'Sengketa transaksi, laporan penipuan pembayaran, dan eskalasi escrow.' },
    ],
  },
  monitoring: {
    key: 'monitoring',
    icon: '📡',
    title: 'Pemantauan',
    description: 'Kesehatan sistem real-time, pelacakan kesalahan, dan metrik performa.',
    purpose:
      'Memberikan visibilitas operasional ke dalam infrastruktur platform TernakHub. Admin dapat memantau ' +
      'waktu respons API, performa kueri database, tingkat kesalahan, kedalaman antrian, dan pemanfaatan penyimpanan. ' +
      'Peringatan dan pelanggaran SLA ditampilkan di sini untuk tindakan segera.',
    subSections: [
      { key: 'health', icon: '❤️', title: 'Kesehatan Sistem', description: 'Status langsung semua layanan platform dengan metrik uptime dan latensi.' },
      { key: 'errors', icon: '⚠️', title: 'Log Kesalahan',    description: 'Log kesalahan dan pengecualian yang diagregasi dengan stack trace dan analisis frekuensi.' },
      { key: 'perf',   icon: '⚡', title: 'Performa',         description: 'Throughput API, persentil waktu respons, dan analitik kueri database.' },
    ],
  },
  'data-master': {
    key: 'data-master',
    icon: '🗂️',
    title: 'Data Master',
    description: 'Kelola kategori data master, tabel lookup, dan pipeline impor massal.',
    purpose:
      'Modul Data Master adalah tulang punggung lapisan data referensi TernakHub. Admin mengelola ' +
      'katalog spesies, registri ras, taksonomi penyakit, data lokasi, dan tabel lookup lainnya ' +
      'yang direferensikan oleh semua modul tingkat workspace di seluruh platform.',
    subSections: [
      { key: 'categories', icon: '📁', title: 'Kategori',    description: 'Kategori data tingkat atas: Spesies, Ras, Penyakit, Lokasi, dan lainnya.' },
      { key: 'master',     icon: '📋', title: 'Daftar Master', description: 'Kelola daftar lookup individual dengan kemampuan tambah, ubah, arsip.' },
      { key: 'imports',    icon: '📥', title: 'Impor',        description: 'Pipeline impor massal untuk pengisian atau pembaruan data referensi master.' },
    ],
  },
  settings: {
    key: 'settings',
    icon: '⚙️',
    title: 'Pengaturan',
    description: 'Konfigurasikan pengaturan platform, kebijakan keamanan, API keys, dan pengiriman email.',
    purpose:
      'Pusat konfigurasi seluruh platform. Admin dapat memperbarui pengaturan platform umum (nama, logo, ' +
      'lokal), menerapkan kebijakan keamanan (aturan kata sandi, persyaratan 2FA), mengelola kredensial API ' +
      'untuk integrasi pihak ketiga, dan mengonfigurasi penyedia pengiriman email.',
    subSections: [
      { key: 'general',  icon: '🔧', title: 'Umum',     description: 'Nama platform, logo, zona waktu, bahasa, dan pengaturan mode pemeliharaan.' },
      { key: 'security', icon: '🔒', title: 'Keamanan', description: 'Kebijakan kata sandi, penegakan 2FA, batas waktu sesi, dan daftar izin IP.' },
      { key: 'api',      icon: '🔑', title: 'API Keys', description: 'Kelola kredensial API untuk integrasi layanan pihak ketiga.' },
      { key: 'email',    icon: '📧', title: 'Email',    description: 'Konfigurasi penyedia pengiriman email, template, dan log pengiriman.' },
    ],
  },
};
