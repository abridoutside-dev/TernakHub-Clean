// ─── Profile About Data (PROFILE-010) ────────────────────────────────────────
// Seluruh konten bersifat statis — tidak tergantung Workspace.
// Mengikuti docs/architecture/PROFILE_MODULE_CONSTITUTION.md

// ─── App Info ─────────────────────────────────────────────────────────────────

export const APP_INFO = {
  nama:        'TernakHub',
  tagline:     'Platform Ternak Terintegrasi',
  deskripsi:   'TernakHub adalah ekosistem digital untuk peternak modern — mengelola ternak, pakan, obat, marketplace, dan komunitas dalam satu platform.',
  versi:       '1.0.0',
  buildVersion:'20260715.001',
  buildDate:   '2026-07-15',
  platform:    'Web & Mobile (PWA)',
  logoEmoji:   '🐄',
};

// ─── Company ──────────────────────────────────────────────────────────────────

export const COMPANY = {
  tentangKami: `TernakHub lahir dari keprihatinan mendalam terhadap kondisi peternakan Indonesia yang masih berjalan secara tradisional dan tersebar. Kami percaya bahwa setiap peternak — dari yang memiliki satu ekor ternak hingga ribuan ekor — berhak mendapatkan akses teknologi yang mudah, terjangkau, dan relevan dengan kebutuhan nyata di lapangan.

  Dibangun oleh tim yang memahami ekosistem peternakan dari dalam, TernakHub hadir sebagai mitra digital yang mendampingi peternak dari kandang hingga pasar.`,

  visi: 'Menjadi platform manajemen ternak terpadu terpercaya yang memberdayakan peternak Indonesia untuk bertumbuh secara berkelanjutan melalui teknologi digital.',

  misi: [
    'Menyederhanakan pengelolaan ternak dengan teknologi yang intuitif dan mudah digunakan.',
    'Menghubungkan peternak dengan pasar, mitra, dan komunitas yang relevan.',
    'Membangun ekosistem data ternak yang akurat untuk pengambilan keputusan berbasis fakta.',
    'Mendukung keberlanjutan usaha peternakan melalui inovasi dan edukasi berkelanjutan.',
    'Membuka akses seluas-luasnya kepada peternak di seluruh pelosok Indonesia.',
  ],

  filosofi: `Teknologi harus datang ke peternak, bukan peternak yang harus datang ke teknologi.

  Kami percaya bahwa inovasi terbaik adalah yang tidak terasa seperti teknologi — melainkan seperti pembantu yang sudah lama dikenal. Setiap fitur TernakHub dirancang bukan hanya untuk bekerja, tetapi untuk benar-benar bermanfaat bagi kehidupan peternak sehari-hari.`,

  nilaiUtama: [
    {
      judul:    'Kepercayaan',
      ikon:     '🤝',
      deskripsi:'Data peternak adalah amanah. Kami menjaga setiap informasi dengan standar keamanan tertinggi.',
    },
    {
      judul:    'Kesederhanaan',
      ikon:     '✨',
      deskripsi:'Fitur sekompleks apapun harus dapat digunakan oleh siapa saja, tanpa perlu pelatihan panjang.',
    },
    {
      judul:    'Keberpihakan',
      ikon:     '🌱',
      deskripsi:'Kami berpihak pada peternak kecil dan menengah — yang sering kali tidak mendapat perhatian cukup.',
    },
    {
      judul:    'Kolaborasi',
      ikon:     '🔗',
      deskripsi:'Ekosistem yang kuat dibangun bersama — bersama peternak, mitra, komunitas, dan pemangku kepentingan.',
    },
    {
      judul:    'Inovasi Bermakna',
      ikon:     '💡',
      deskripsi:'Inovasi hanya bernilai jika berdampak nyata. Kami mengukur keberhasilan dari perubahan di lapangan.',
    },
  ],

  tahunBerdiri: '2025',
  kota:         'Garut, Jawa Barat',
  negara:       'Indonesia',
};

// ─── Contact ──────────────────────────────────────────────────────────────────
// Derived from ADMIN_CONTACT_CONFIG — do NOT hardcode values here.
// Edit src/data/adminSettingsData.ts → ADMIN_CONTACT_CONFIG to update contact info.

import { ADMIN_CONTACT_CONFIG } from './adminSettingsData';

export const CONTACT = {
  email:    ADMIN_CONTACT_CONFIG.email,
  website:  ADMIN_CONTACT_CONFIG.website,
  whatsApp: ADMIN_CONTACT_CONFIG.phone,
  mediaSosial: ADMIN_CONTACT_CONFIG.mediaSosial.map(s => ({
    platform: s.platform,
    handle:   null as string | null,   // not stored until platform is confirmed live
    url:      s.url,
    tersedia: s.tersedia,
  })),
};

// ─── Roadmap ──────────────────────────────────────────────────────────────────

export type RoadmapStatus = 'Selesai' | 'Sedang Berjalan' | 'Direncanakan';

export interface RoadmapItem {
  id:        string;
  status:    RoadmapStatus;
  fase:      string;
  judul:     string;
  deskripsi: string;
  periode:   string;
}

export const ROADMAP_STATUS_CONFIG: Record<RoadmapStatus, { warna: string; bg: string; ikon: string }> = {
  'Selesai':          { warna: '#1b7a43', bg: '#d1fae5', ikon: '✅' },
  'Sedang Berjalan':  { warna: '#b45309', bg: '#fef3c7', ikon: '🔄' },
  'Direncanakan':     { warna: '#6366f1', bg: '#ede9fe', ikon: '📋' },
};

export const ROADMAP: RoadmapItem[] = [
  // ── Selesai ─────────────────────────────────────────────────────────────────
  {
    id:        'rm-001',
    status:    'Selesai',
    fase:      'Fase 1 — Fondasi',
    judul:     'Manajemen Ternak (Livestock)',
    deskripsi: 'Pencatatan ternak, profil individu, silsilah, transfer, arsip, dan batch manajemen.',
    periode:   'Q4 2025',
  },
  {
    id:        'rm-002',
    status:    'Selesai',
    fase:      'Fase 1 — Fondasi',
    judul:     'Stok Pakan',
    deskripsi: 'Inventaris pakan, master referensi bahan, formula pakan, produksi, dan riwayat.',
    periode:   'Q4 2025',
  },
  {
    id:        'rm-003',
    status:    'Selesai',
    fase:      'Fase 1 — Fondasi',
    judul:     'Stok Obat',
    deskripsi: 'Inventaris obat, master referensi obat, penyakit, dan riwayat penggunaan.',
    periode:   'Q1 2026',
  },
  {
    id:        'rm-004',
    status:    'Selesai',
    fase:      'Fase 2 — Ekosistem',
    judul:     'Marketplace',
    deskripsi: 'Listing jual beli ternak dan produk, chat, transaksi, moderasi, dan laporan.',
    periode:   'Q1 2026',
  },
  {
    id:        'rm-005',
    status:    'Selesai',
    fase:      'Fase 2 — Ekosistem',
    judul:     'News & Event',
    deskripsi: 'Portal berita dan acara peternakan, RSS collector, submission workspace, dan admin review.',
    periode:   'Q2 2026',
  },
  {
    id:        'rm-006',
    status:    'Selesai',
    fase:      'Fase 2 — Ekosistem',
    judul:     'Profile & Control Center',
    deskripsi: 'Akun, Workspace, Business Insight, Subscription, Security, Notification, About, dan Support.',
    periode:   'Q3 2026',
  },
  // ── Sedang Berjalan ─────────────────────────────────────────────────────────
  {
    id:        'rm-007',
    status:    'Sedang Berjalan',
    fase:      'Fase 3 — Pendalaman',
    judul:     'Transaksi Percakapan & Escrow',
    deskripsi: 'Percakapan terstruktur dalam transaksi marketplace, sistem escrow, transport, dan audit trail.',
    periode:   'Q3 2026',
  },
  {
    id:        'rm-008',
    status:    'Sedang Berjalan',
    fase:      'Fase 3 — Pendalaman',
    judul:     'AI Insight & Analitik',
    deskripsi: 'Insight berbasis data nyata untuk stok pakan, obat, ternak, dan performa bisnis.',
    periode:   'Q3 2026',
  },
];

// ─── Changelog ────────────────────────────────────────────────────────────────

export interface ChangelogEntry {
  id:       string;
  versi:    string;
  tanggal:  string;
  jenis:    'Major' | 'Minor' | 'Patch';
  ringkasan: string;
  perubahan: Array<{ kategori: 'Baru' | 'Peningkatan' | 'Perbaikan' | 'Keamanan'; deskripsi: string }>;
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    id:      'cl-001',
    versi:   '1.0.0',
    tanggal: '2026-07-15',
    jenis:   'Major',
    ringkasan: 'Peluncuran perdana TernakHub — platform manajemen ternak terpadu.',
    perubahan: [
      { kategori: 'Baru',         deskripsi: 'Modul Livestock: pencatatan ternak, profil, silsilah, batch, transfer, arsip.' },
      { kategori: 'Baru',         deskripsi: 'Modul Stok Pakan: inventaris, master referensi, formula, produksi, riwayat.' },
      { kategori: 'Baru',         deskripsi: 'Modul Stok Obat: inventaris, master obat, penyakit, riwayat.' },
      { kategori: 'Baru',         deskripsi: 'Modul Marketplace: listing, chat, transaksi, moderasi, laporan.' },
      { kategori: 'Baru',         deskripsi: 'Modul News & Event: portal berita, RSS, submission workspace, admin review.' },
      { kategori: 'Baru',         deskripsi: 'Profile Control Center: akun, workspace, business insight, subscription, security, notification.' },
      { kategori: 'Baru',         deskripsi: 'About TernakHub: company, roadmap, changelog, legal, partner, contact.' },
      { kategori: 'Baru',         deskripsi: 'Support Center: FAQ, report bug, feedback, contact support.' },
      { kategori: 'Keamanan',     deskripsi: 'Sesi login per perangkat dengan kemampuan logout jarak jauh.' },
      { kategori: 'Keamanan',     deskripsi: 'Audit trail permanen untuk seluruh perubahan data sensitif.' },
    ],
  },
  {
    id:      'cl-002',
    versi:   '0.9.0',
    tanggal: '2026-06-01',
    jenis:   'Minor',
    ringkasan: 'Beta release — Profile, News & Event, dan finalisasi Marketplace.',
    perubahan: [
      { kategori: 'Baru',         deskripsi: 'Profile module: subscription tier (Free/Pro/Enterprise).' },
      { kategori: 'Baru',         deskripsi: 'News & Event: RSS trusted source collector dan admin review.' },
      { kategori: 'Peningkatan',  deskripsi: 'Marketplace: escrow foundation dan transport integration.' },
      { kategori: 'Perbaikan',    deskripsi: 'Perbaikan UI konsistensi di seluruh modul.' },
    ],
  },
  {
    id:      'cl-003',
    versi:   '0.8.0',
    tanggal: '2026-04-15',
    jenis:   'Minor',
    ringkasan: 'Alpha release — Marketplace dan integrasi lintas modul.',
    perubahan: [
      { kategori: 'Baru',         deskripsi: 'Marketplace: listing, chat antar pengguna, dan manajemen transaksi.' },
      { kategori: 'Baru',         deskripsi: 'Integrasi Marketplace ↔ Stok Pakan dan Stok Obat.' },
      { kategori: 'Peningkatan',  deskripsi: 'AI Insight placeholder di Stok Pakan dan Stok Obat.' },
      { kategori: 'Perbaikan',    deskripsi: 'Bug fix seed data livestock saat cold start.' },
    ],
  },
  {
    id:      'cl-004',
    versi:   '0.5.0',
    tanggal: '2025-12-01',
    jenis:   'Minor',
    ringkasan: 'Pre-alpha — Fondasi Livestock dan Stok.',
    perubahan: [
      { kategori: 'Baru',         deskripsi: 'Modul Livestock: pencatatan dasar dan profil ternak.' },
      { kategori: 'Baru',         deskripsi: 'Modul Stok Pakan dan Stok Obat: inventaris dasar.' },
      { kategori: 'Baru',         deskripsi: 'Dashboard ringkasan lintas modul.' },
    ],
  },
];

export const CHANGELOG_JENIS_CONFIG: Record<ChangelogEntry['jenis'], { warna: string; bg: string }> = {
  Major: { warna: '#7c3aed', bg: '#ede9fe' },
  Minor: { warna: '#1b7a43', bg: '#d1fae5' },
  Patch: { warna: '#1d4ed8', bg: '#dbeafe' },
};

export const CHANGELOG_KATEGORI_CONFIG: Record<string, { ikon: string; warna: string }> = {
  'Baru':        { ikon: '✨', warna: '#1b7a43' },
  'Peningkatan': { ikon: '⬆️', warna: '#1d4ed8' },
  'Perbaikan':   { ikon: '🔧', warna: '#b45309' },
  'Keamanan':    { ikon: '🔒', warna: '#7c3aed' },
};

// ─── Legal ────────────────────────────────────────────────────────────────────

export const LEGAL = {
  privacyPolicy: {
    judul:        'Kebijakan Privasi',
    versi:        '1.0',
    tanggalBerlaku: '2026-07-15',
    konten: [
      {
        judul: 'Data yang Kami Kumpulkan',
        isi:   'TernakHub mengumpulkan data yang Anda berikan secara langsung saat mendaftar dan menggunakan layanan, meliputi: (a) Data akun — nama lengkap, alamat email, dan kata sandi terenkripsi; (b) Data Workspace — nama usaha, lokasi, jenis usaha peternakan, dan informasi profil yang Anda masukkan; (c) Data ternak — identitas, silsilah, riwayat bobot, riwayat kesehatan, catatan pemberian pakan, catatan reproduksi, dan mutasi ternak; (d) Data inventaris — stok pakan, stok obat, formula pakan, dan catatan penggunaan; (e) Data Marketplace — listing jual beli, riwayat transaksi, percakapan dengan calon pembeli atau penjual, dan dokumen pendukung transaksi; (f) Data penggunaan — log aktivitas, preferensi tampilan, dan data navigasi dalam aplikasi.',
      },
      {
        judul: 'Cara Kami Menggunakan Data',
        isi:   'Data yang dikumpulkan digunakan untuk: (a) Menyediakan dan mengoperasikan seluruh layanan TernakHub, termasuk manajemen ternak, marketplace, dan Business Insight; (b) Menampilkan ringkasan bisnis dan insight yang relevan berdasarkan data Workspace Anda; (c) Mengirimkan notifikasi yang berkaitan dengan aktivitas akun, transaksi, dan pembaruan layanan; (d) Memverifikasi identitas pengguna dan Workspace dalam proses Trust & Verification; (e) Memproses dan memantau transaksi Marketplace termasuk sistem escrow; (f) Meningkatkan kualitas dan keandalan platform berdasarkan pola penggunaan agregat yang tidak dapat diidentifikasi secara personal.',
      },
      {
        judul: 'Data Ternak dan Bisnis',
        isi:   'Seluruh data ternak, inventaris pakan, inventaris obat, formula pakan, dan data bisnis yang Anda masukkan ke dalam TernakHub adalah milik Anda sepenuhnya. TernakHub tidak menggunakan data operasional spesifik Workspace Anda untuk kepentingan komersial pihak ketiga. Data ini hanya dapat diakses oleh anggota Workspace yang telah Anda tambahkan dengan izin yang sesuai, serta oleh administrator TernakHub dalam kapasitas dukungan teknis dan kepatuhan.',
      },
      {
        judul: 'Marketplace dan Transaksi',
        isi:   'Saat Anda melakukan transaksi di Marketplace TernakHub, data yang terkait dengan transaksi — termasuk detail listing, riwayat negosiasi, catatan percakapan, dokumen bukti, dan status escrow — disimpan sebagai bagian dari audit trail permanen. Data transaksi ini tidak dapat dihapus guna memastikan akuntabilitas dan perlindungan bagi seluruh pihak yang terlibat. Percakapan di fitur Chat Marketplace hanya dapat diakses oleh peserta percakapan dan administrator TernakHub dalam konteks penyelesaian sengketa.',
      },
      {
        judul: 'Keamanan Data',
        isi:   'TernakHub menerapkan langkah-langkah keamanan teknis yang mencakup: enkripsi data saat transmisi menggunakan protokol HTTPS; autentikasi berbasis sesi yang dikelola secara aman; kontrol akses berbasis peran di dalam setiap Workspace; dan audit trail permanen untuk seluruh perubahan data sensitif. Meskipun demikian, tidak ada sistem yang sepenuhnya bebas risiko. Anda bertanggung jawab menjaga kerahasiaan kata sandi akun Anda dan segera melapor jika mencurigai akses tidak sah.',
      },
      {
        judul: 'Berbagi Data dengan Pihak Ketiga',
        isi:   'TernakHub tidak menjual, menyewakan, atau memperdagangkan data pribadi Anda kepada pihak ketiga untuk tujuan pemasaran. Data dapat dibagikan kepada pihak ketiga hanya dalam kondisi berikut: (a) Penyedia layanan teknis yang membantu operasional platform (misalnya layanan hosting dan autentikasi), tunduk pada perjanjian kerahasiaan; (b) Otoritas hukum yang berwenang jika diwajibkan oleh peraturan perundang-undangan Indonesia yang berlaku; (c) Dalam konteks penyelesaian sengketa transaksi Marketplace atas permintaan pihak yang berkepentingan.',
      },
      {
        judul: 'Hak Pengguna',
        isi:   'Anda memiliki hak-hak berikut terkait data pribadi Anda: (a) Hak akses — meminta salinan data yang kami simpan tentang Anda; (b) Hak koreksi — memperbarui data yang tidak akurat melalui pengaturan akun; (c) Hak penghapusan — meminta penghapusan akun dan data pribadi, tunduk pada kewajiban retensi data transaksi; (d) Hak pembatasan — meminta pembatasan pemrosesan data dalam kondisi tertentu. Untuk menggunakan hak-hak ini, hubungi kami di privacy@ternakhub.id.',
      },
      {
        judul: 'Retensi Data',
        isi:   'Data akun aktif disimpan selama akun Anda aktif. Setelah penghapusan akun, data pribadi dihapus dalam 30 hari, kecuali data yang terkait dengan transaksi Marketplace yang diselesaikan — data ini dipertahankan selama 5 tahun sesuai kebutuhan audit dan kepatuhan. Log keamanan dan audit trail dipertahankan selama 1 tahun.',
      },
      {
        judul: 'Perubahan Kebijakan Privasi',
        isi:   'Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Setiap perubahan material akan diberitahukan melalui notifikasi dalam aplikasi minimal 14 hari sebelum perubahan berlaku. Penggunaan layanan setelah tanggal berlaku perubahan berarti Anda menerima kebijakan yang diperbarui. Jika Anda tidak menyetujui perubahan tersebut, Anda dapat menghentikan penggunaan layanan dan meminta penghapusan akun.',
      },
    ],
  },

  termsConditions: {
    judul:        'Syarat & Ketentuan',
    versi:        '1.0',
    tanggalBerlaku: '2026-07-15',
    konten: [
      {
        judul: 'Penerimaan Ketentuan',
        isi:   'Dengan mendaftar, mengakses, atau menggunakan layanan TernakHub, Anda menyatakan telah membaca, memahami, dan menyetujui Syarat & Ketentuan ini secara penuh. Syarat & Ketentuan ini merupakan perjanjian yang mengikat secara hukum antara Anda (selaku pengguna) dan TernakHub. Jika Anda tidak menyetujui ketentuan ini, Anda tidak berhak menggunakan layanan TernakHub.',
      },
      {
        judul: 'Pendaftaran Akun dan Workspace',
        isi:   'Untuk menggunakan layanan TernakHub, Anda harus mendaftar dengan email yang valid dan membuat akun pribadi. Satu akun dapat memiliki atau bergabung dalam beberapa Workspace. Setiap Workspace merepresentasikan satu entitas usaha peternakan. Anda bertanggung jawab atas: (a) keakuratan data yang Anda masukkan saat pendaftaran dan pengoperasian Workspace; (b) kerahasiaan kata sandi dan keamanan akses akun Anda; (c) seluruh aktivitas yang terjadi di bawah akun Anda. Anda harus segera melapor kepada TernakHub jika mengetahui adanya akses tidak sah ke akun Anda.',
      },
      {
        judul: 'Layanan Manajemen Peternakan',
        isi:   'TernakHub menyediakan alat untuk mencatat dan mengelola data ternak (identitas, silsilah, bobot, kesehatan, reproduksi, mutasi, dan batch), stok pakan (inventaris, formula, produksi), serta stok obat (inventaris, riwayat penggunaan). Anda bertanggung jawab penuh atas keakuratan data yang Anda masukkan. TernakHub tidak menjamin keakuratan insight atau analitik yang dihasilkan dari data yang tidak akurat. Fitur AI Insight bersifat informatif dan tidak menggantikan keputusan profesional dokter hewan atau ahli nutrisi ternak.',
      },
      {
        judul: 'Marketplace dan Transaksi',
        isi:   'Marketplace TernakHub memungkinkan pengguna untuk membuat listing jual beli ternak dan produk peternakan. Penjual bertanggung jawab penuh atas: (a) keakuratan deskripsi, foto, dan harga pada setiap listing; (b) legalitas ternak atau produk yang diperdagangkan; (c) pemenuhan kewajiban terhadap pembeli setelah kesepakatan tercapai. Pembeli bertanggung jawab melakukan verifikasi kondisi ternak atau produk sebelum menyelesaikan transaksi. TernakHub bertindak sebagai fasilitator transaksi, bukan sebagai pihak dalam jual beli. Listing yang melanggar ketentuan dapat dihapus atau dilaporkan ke moderator.',
      },
      {
        judul: 'Sistem Escrow',
        isi:   'TernakHub menyediakan sistem escrow sebagai mekanisme perlindungan dalam transaksi Marketplace. Dana atau komitmen transaksi yang masuk ke dalam escrow dikelola sesuai dengan ketentuan yang disepakati antara penjual dan pembeli. Pelepasan escrow hanya dapat dilakukan setelah penerima mengkonfirmasi penerimaan sesuai prosedur yang berlaku. Sengketa terkait escrow dapat diajukan melalui mekanisme moderasi yang tersedia dalam platform. TernakHub tidak bertanggung jawab atas kerugian yang timbul dari informasi yang tidak akurat yang diberikan oleh salah satu pihak dalam transaksi.',
      },
      {
        judul: 'Subscription dan Akses Fitur',
        isi:   'TernakHub menawarkan beberapa tingkatan subscription untuk Workspace (termasuk paket Free, Pro, dan Enterprise). Fitur yang tersedia bergantung pada tingkatan subscription aktif Workspace Anda. Perubahan tingkatan subscription berlaku pada siklus penagihan berikutnya kecuali ditentukan lain. TernakHub berhak mengubah fitur yang termasuk dalam setiap tingkatan subscription dengan pemberitahuan yang wajar.',
      },
      {
        judul: 'Kewajiban Pengguna dan Larangan',
        isi:   'Anda setuju untuk tidak: (a) menggunakan TernakHub untuk aktivitas ilegal atau penipuan; (b) membuat listing palsu, memanipulasi harga, atau menyesatkan pengguna lain di Marketplace; (c) mencoba mengakses data Workspace atau akun pengguna lain tanpa izin; (d) mengunggah konten yang mengandung malware, virus, atau kode berbahaya; (e) melakukan tindakan yang dapat merusak, membebani, atau mengganggu infrastruktur TernakHub; (f) mengumpulkan data pengguna lain tanpa persetujuan yang sah; (g) memalsukan identitas atau informasi Workspace dalam proses verifikasi kepercayaan.',
      },
      {
        judul: 'Pembatasan Tanggung Jawab',
        isi:   'TernakHub menyediakan layanan "sebagaimana adanya" tanpa jaminan ketersediaan tanpa gangguan. TernakHub tidak bertanggung jawab atas: (a) kerugian yang timbul dari keputusan bisnis berdasarkan data atau insight dalam platform; (b) kerugian akibat transaksi Marketplace yang tidak dipenuhi oleh pihak lain; (c) kehilangan data akibat kegagalan perangkat pengguna atau koneksi internet; (d) tindakan atau kelalaian pihak ketiga yang terlibat dalam transaksi. Tanggung jawab maksimal TernakHub dalam situasi apapun tidak melebihi jumlah yang dibayarkan oleh pengguna kepada TernakHub dalam 3 bulan terakhir.',
      },
      {
        judul: 'Penghentian Akun',
        isi:   'TernakHub berhak menangguhkan atau menghentikan akun Anda jika: (a) Anda melanggar Syarat & Ketentuan ini; (b) akun digunakan untuk aktivitas penipuan atau ilegal; (c) terdapat permintaan dari otoritas hukum yang berwenang. Anda juga dapat mengajukan penghapusan akun kapan saja melalui pengaturan profil. Setelah penghentian akun, akses ke seluruh layanan akan dihentikan dan data akan diproses sesuai Kebijakan Privasi yang berlaku.',
      },
      {
        judul: 'Notifikasi Layanan',
        isi:   'TernakHub mengirimkan notifikasi dalam aplikasi yang berkaitan dengan aktivitas akun Anda, termasuk pembaruan transaksi, aktivitas Workspace, pengumuman dari administrator, dan informasi layanan. Notifikasi ini merupakan bagian integral dari layanan dan tidak dapat dinonaktifkan sepenuhnya selama akun aktif. Anda dapat mengelola preferensi notifikasi melalui pengaturan yang tersedia.',
      },
      {
        judul: 'Perubahan Layanan dan Ketentuan',
        isi:   'TernakHub berhak memperbarui atau mengubah layanan, fitur, dan Syarat & Ketentuan ini kapan saja. Perubahan material akan diberitahukan melalui notifikasi dalam aplikasi minimal 14 hari sebelum berlaku. Penggunaan layanan setelah perubahan berlaku berarti Anda menyetujui ketentuan yang diperbarui. Ketentuan ini tunduk pada hukum yang berlaku di Republik Indonesia.',
      },
    ],
  },

  license: {
    judul:   'Lisensi Perangkat Lunak',
    versi:   '1.0',
    tanggalBerlaku: '2026-07-15',
    jenis:   'Proprietary Software License',
    konten: [
      {
        judul: 'Hak Cipta',
        isi:   '© 2025–2026 TernakHub. Seluruh hak cipta dilindungi undang-undang. Perangkat lunak TernakHub, termasuk kode sumber, antarmuka pengguna, desain, logo, dan dokumentasi, adalah kekayaan intelektual eksklusif TernakHub dan dilindungi oleh hukum hak cipta Republik Indonesia serta perjanjian internasional yang berlaku.',
      },
      {
        judul: 'Lisensi Penggunaan Terbatas',
        isi:   'TernakHub memberikan kepada Anda lisensi yang bersifat terbatas, non-eksklusif, tidak dapat dipindahtangankan, dan dapat dicabut sewaktu-waktu untuk mengakses dan menggunakan platform TernakHub semata-mata untuk keperluan manajemen usaha peternakan Anda sesuai dengan Syarat & Ketentuan yang berlaku. Lisensi ini tidak mencakup hak untuk menyalin, memodifikasi, mendistribusikan, atau mengeksploitasi perangkat lunak dalam bentuk apapun di luar penggunaan normal platform.',
      },
      {
        judul: 'Batasan Penggunaan',
        isi:   'Anda dilarang untuk: (a) menyalin, mereproduksi, atau mendistribusikan bagian apapun dari perangkat lunak TernakHub; (b) memodifikasi, menerjemahkan, atau membuat karya turunan berdasarkan perangkat lunak; (c) melakukan rekayasa balik (reverse engineering), dekompilasi, atau pembongkaran kode; (d) menghapus atau mengubah pemberitahuan hak cipta, merek dagang, atau informasi kepemilikan lainnya; (e) menggunakan perangkat lunak untuk membangun produk atau layanan yang bersaing secara langsung dengan TernakHub; (f) menjual, menyewakan, atau mensublisensikan akses ke perangkat lunak kepada pihak ketiga.',
      },
      {
        judul: 'Komponen Open Source',
        isi:   'TernakHub dibangun menggunakan sejumlah komponen open source, antara lain React (MIT License), React Router (MIT License), Vite (MIT License), TypeScript (Apache 2.0), dan Supabase JS Client (MIT License). Penggunaan komponen-komponen ini tunduk pada lisensi masing-masing yang tidak mengubah ketentuan lisensi proprietary TernakHub secara keseluruhan. Informasi lengkap mengenai lisensi komponen open source yang digunakan tersedia atas permintaan melalui legal@ternakhub.id.',
      },
      {
        judul: 'Pembaruan dan Modifikasi Perangkat Lunak',
        isi:   'TernakHub berhak merilis pembaruan, perbaikan, atau modifikasi pada perangkat lunak kapan saja. Pembaruan tersebut dapat mencakup penambahan fitur baru, perbaikan keamanan, atau penghapusan fitur yang sudah tidak didukung. Penggunaan versi terbaru platform dianggap sebagai penerimaan terhadap pembaruan yang dilakukan. TernakHub tidak berkewajiban mempertahankan kompatibilitas dengan versi sebelumnya.',
      },
    ],
  },
};

// ─── Partner ──────────────────────────────────────────────────────────────────

export type PartnerKategori = 'Official Partner' | 'Community Partner' | 'Research Partner' | 'Government Partner';

export interface PartnerItem {
  id:        string;
  kategori:  PartnerKategori;
  nama:      string;
  deskripsi: string;
  logoEmoji: string;
  tersedia:  boolean;   // false = placeholder
}

export const PARTNER_KATEGORI_CONFIG: Record<PartnerKategori, { ikon: string; warna: string; bg: string }> = {
  'Official Partner':     { ikon: '🤝', warna: '#1b7a43', bg: '#d1fae5' },
  'Community Partner':    { ikon: '🌱', warna: '#1d4ed8', bg: '#dbeafe' },
  'Research Partner':     { ikon: '🔬', warna: '#7c3aed', bg: '#ede9fe' },
  'Government Partner':   { ikon: '🏛️', warna: '#b45309', bg: '#fef3c7' },
};

export const PARTNERS: PartnerItem[] = [
  // Official
  {
    id: 'pt-001', kategori: 'Official Partner', logoEmoji: '🏢',
    nama: 'Mitra Resmi Terdaftar', deskripsi: 'Pendaftaran kemitraan resmi sedang dibuka. Hubungi kami untuk informasi lebih lanjut.', tersedia: false,
  },
  // Community
  {
    id: 'pt-002', kategori: 'Community Partner', logoEmoji: '👨‍🌾',
    nama: 'Komunitas Peternak Indonesia', deskripsi: 'Jaringan komunitas peternak lokal di seluruh nusantara. (Placeholder)', tersedia: false,
  },
  {
    id: 'pt-003', kategori: 'Community Partner', logoEmoji: '🐄',
    nama: 'Asosiasi Peternak Sapi', deskripsi: 'Asosiasi nasional peternak sapi perah dan sapi potong. (Placeholder)', tersedia: false,
  },
  // Research
  {
    id: 'pt-004', kategori: 'Research Partner', logoEmoji: '🎓',
    nama: 'Lembaga Riset Peternakan', deskripsi: 'Kolaborasi riset dan inovasi teknologi peternakan. (Placeholder)', tersedia: false,
  },
  {
    id: 'pt-005', kategori: 'Research Partner', logoEmoji: '🔬',
    nama: 'Universitas Mitra', deskripsi: 'Program kemitraan dengan fakultas peternakan universitas terkemuka. (Placeholder)', tersedia: false,
  },
  // Government
  {
    id: 'pt-006', kategori: 'Government Partner', logoEmoji: '🏛️',
    nama: 'Dinas Peternakan Daerah', deskripsi: 'Kerja sama dengan dinas peternakan kabupaten dan provinsi. (Placeholder)', tersedia: false,
  },
  {
    id: 'pt-007', kategori: 'Government Partner', logoEmoji: '🇮🇩',
    nama: 'Kementerian Pertanian RI', deskripsi: 'Sinkronisasi data dengan sistem nasional peternakan. (Placeholder)', tersedia: false,
  },
];

