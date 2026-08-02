// ─── Profile Support Data (PROFILE-010) ──────────────────────────────────────
// Support Center: FAQ, Report Bug, Feedback.
// Laporan dan feedback disimpan di localStorage perangkat agar tidak hilang saat reload.
// Mengikuti docs/architecture/PROFILE_MODULE_CONSTITUTION.md

import { generateUUID } from '../utils/uuid';

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export type FaqKategori =
  | 'Akun & Profil'
  | 'Workspace'
  | 'Ternak'
  | 'Stok Pakan'
  | 'Stok Obat'
  | 'Marketplace'
  | 'Subscription'
  | 'Keamanan'
  | 'Teknis';

export interface FaqItem {
  id:        string;
  kategori:  FaqKategori;
  pertanyaan:string;
  jawaban:   string;
}

export const FAQ_KATEGORI_CONFIG: Record<FaqKategori, { ikon: string }> = {
  'Akun & Profil':  { ikon: '👤' },
  'Workspace':      { ikon: '🏢' },
  'Ternak':         { ikon: '🐄' },
  'Stok Pakan':     { ikon: '🌾' },
  'Stok Obat':      { ikon: '💊' },
  'Marketplace':    { ikon: '🛒' },
  'Subscription':   { ikon: '⭐' },
  'Keamanan':       { ikon: '🔒' },
  'Teknis':         { ikon: '⚙️' },
};

export const FAQ_LIST: FaqItem[] = [
  // ── Akun & Profil ───────────────────────────────────────────────────────────
  {
    id: 'faq-001', kategori: 'Akun & Profil',
    pertanyaan: 'Bagaimana cara mengubah foto profil?',
    jawaban: 'Buka halaman Profile → Account, kemudian ketuk foto profil Anda. Pilih foto dari galeri atau ambil foto baru. Foto akan tersimpan secara otomatis.',
  },
  {
    id: 'faq-002', kategori: 'Akun & Profil',
    pertanyaan: 'Apakah username dapat diubah setelah dibuat?',
    jawaban: 'Username merupakan identitas permanen pada TernakHub. Perubahan username memerlukan verifikasi keamanan tambahan dan dapat dilakukan melalui menu Account → Ubah Username.',
  },
  {
    id: 'faq-003', kategori: 'Akun & Profil',
    pertanyaan: 'Bagaimana cara mengganti email akun?',
    jawaban: 'Penggantian email memerlukan verifikasi dari email lama dan email baru. Buka Profile → Account → Ubah Email. Kami akan mengirimkan tautan konfirmasi ke kedua alamat email.',
  },
  // ── Workspace ───────────────────────────────────────────────────────────────
  {
    id: 'faq-004', kategori: 'Workspace',
    pertanyaan: 'Apa itu Workspace di TernakHub?',
    jawaban: 'Workspace adalah unit operasional dalam TernakHub — bisa berupa satu kandang, satu kebun ternak, atau satu entitas bisnis peternakan. Setiap data (ternak, stok, listing) terikat pada Workspace tertentu.',
  },
  {
    id: 'faq-005', kategori: 'Workspace',
    pertanyaan: 'Berapa banyak Workspace yang dapat dibuat?',
    jawaban: 'Pada paket Free, Anda dapat membuat 1 Workspace. Paket Pro memungkinkan hingga 3 Workspace, dan Enterprise tidak terbatas. Silakan cek halaman Subscription untuk detail lengkap.',
  },
  {
    id: 'faq-006', kategori: 'Workspace',
    pertanyaan: 'Bagaimana cara mengundang anggota ke Workspace?',
    jawaban: 'Buka Profile → Workspace → pilih Workspace → Kelola Anggota. Masukkan email atau username yang ingin diundang dan tentukan peran (Role) mereka.',
  },
  // ── Ternak ──────────────────────────────────────────────────────────────────
  {
    id: 'faq-007', kategori: 'Ternak',
    pertanyaan: 'Bagaimana cara menambahkan ternak baru?',
    jawaban: 'Dari halaman Livestock, ketuk tombol "+" di pojok kanan atas. Isi data dasar ternak (jenis, nama/ID, tanggal lahir, jenis kelamin) dan simpan. Data dapat dilengkapi kemudian dari halaman profil ternak.',
  },
  {
    id: 'faq-008', kategori: 'Ternak',
    pertanyaan: 'Apa yang terjadi jika ternak diarsipkan?',
    jawaban: 'Ternak yang diarsipkan (Mati, Terjual, atau Hibah) tidak lagi muncul di daftar aktif, namun seluruh riwayat (bobot, kesehatan, silsilah) tetap tersimpan dan dapat diakses dari menu Arsip.',
  },
  {
    id: 'faq-009', kategori: 'Ternak',
    pertanyaan: 'Bisakah ternak yang sudah diarsipkan dikembalikan ke aktif?',
    jawaban: 'Pengarsipan bersifat permanen karena terkait dengan integritas data (sinkronisasi stok, marketplace, dll.). Jika terjadi kesalahan, silakan hubungi Support untuk penanganan manual.',
  },
  // ── Stok Pakan ──────────────────────────────────────────────────────────────
  {
    id: 'faq-010', kategori: 'Stok Pakan',
    pertanyaan: 'Bagaimana cara mencatat pemasukan pakan baru?',
    jawaban: 'Buka Stok Pakan → Tab Stok → Tambah Stok. Pilih sumber bahan (Master Referensi atau Produk Komersial), masukkan jumlah, harga, dan tanggal pembelian.',
  },
  {
    id: 'faq-011', kategori: 'Stok Pakan',
    pertanyaan: 'Apa itu Formula Pakan?',
    jawaban: 'Formula Pakan adalah komposisi bahan pakan yang diracik sendiri. Anda dapat membuat formula dengan komposisi bahan, menghitung nilai nutrisi otomatis, dan memproduksi pakan dari formula tersebut.',
  },
  // ── Marketplace ─────────────────────────────────────────────────────────────
  {
    id: 'faq-012', kategori: 'Marketplace',
    pertanyaan: 'Bagaimana cara membuat listing di Marketplace?',
    jawaban: 'Buka Marketplace → Workspace Explorer → Buat Listing Baru. Isi informasi produk (jenis, harga, kondisi, foto) dan publikasikan. Listing akan muncul di feed Marketplace setelah disetujui.',
  },
  {
    id: 'faq-013', kategori: 'Marketplace',
    pertanyaan: 'Apakah ada biaya untuk berjualan di Marketplace?',
    jawaban: 'Pada paket Free, terdapat batasan jumlah listing aktif. Paket Pro dan Enterprise memberikan kuota listing lebih besar. Transaksi marketplace tidak dikenakan komisi pada versi saat ini.',
  },
  // ── Subscription ────────────────────────────────────────────────────────────
  {
    id: 'faq-014', kategori: 'Subscription',
    pertanyaan: 'Apa perbedaan paket Free, Pro, dan Enterprise?',
    jawaban: 'Free: fitur dasar, 1 Workspace, listing terbatas. Pro: fitur lengkap, 3 Workspace, News & Event submission, prioritas support. Enterprise: semua fitur, Workspace tak terbatas, dedicated support, dan API access.',
  },
  {
    id: 'faq-015', kategori: 'Subscription',
    pertanyaan: 'Bagaimana cara upgrade paket?',
    jawaban: 'Buka Profile → Subscription → pilih paket yang diinginkan → ketuk Upgrade. Perubahan paket akan segera berlaku. Sistem pembayaran akan tersedia sepenuhnya pada pembaruan berikutnya.',
  },
  // ── Keamanan ────────────────────────────────────────────────────────────────
  {
    id: 'faq-016', kategori: 'Keamanan',
    pertanyaan: 'Bagaimana cara melihat sesi login aktif?',
    jawaban: 'Buka Profile → Security → bagian "Login Session Aktif". Anda dapat melihat seluruh perangkat yang sedang masuk dan melakukan logout dari perangkat tertentu jika mencurigakan.',
  },
  {
    id: 'faq-017', kategori: 'Keamanan',
    pertanyaan: 'Apa yang harus dilakukan jika akun diretas?',
    jawaban: 'Segera ubah password melalui Profile → Security → Ganti Password. Lakukan logout semua sesi lain. Jika tidak dapat mengakses akun, hubungi support@ternakhub.id dengan menyertakan bukti kepemilikan akun.',
  },
  // ── Teknis ──────────────────────────────────────────────────────────────────
  {
    id: 'faq-018', kategori: 'Teknis',
    pertanyaan: 'Apakah TernakHub dapat digunakan tanpa koneksi internet?',
    jawaban: 'TernakHub versi saat ini memerlukan koneksi internet aktif. Fitur offline-first dengan sinkronisasi otomatis sedang dalam tahap pengembangan (lihat Roadmap Fase 4).',
  },
  {
    id: 'faq-019', kategori: 'Teknis',
    pertanyaan: 'Browser apa saja yang didukung TernakHub?',
    jawaban: 'TernakHub mendukung Chrome 90+, Safari 14+, Firefox 88+, dan Edge 90+. Untuk pengalaman terbaik, gunakan Chrome versi terbaru pada perangkat mobile maupun desktop.',
  },
  {
    id: 'faq-020', kategori: 'Teknis',
    pertanyaan: 'Bagaimana cara mengekspor data dari TernakHub?',
    jawaban: 'Fitur ekspor data (CSV/Excel) tersedia di beberapa modul (Laporan Marketplace, Riwayat Stok). Ekspor komprehensif seluruh data akun sedang dalam pengembangan.',
  },
];

export function getFaqByKategori(kategori: FaqKategori): FaqItem[] {
  return FAQ_LIST.filter(f => f.kategori === kategori);
}

export function searchFaq(query: string): FaqItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return FAQ_LIST;
  return FAQ_LIST.filter(f =>
    f.pertanyaan.toLowerCase().includes(q) ||
    f.jawaban.toLowerCase().includes(q) ||
    f.kategori.toLowerCase().includes(q),
  );
}

// ─── Report Bug ───────────────────────────────────────────────────────────────

export type BugKategori =
  | 'Crash / Aplikasi Berhenti'
  | 'Tampilan / UI'
  | 'Data Tidak Tersimpan'
  | 'Login / Akses'
  | 'Performa Lambat'
  | 'Fitur Tidak Bekerja'
  | 'Lainnya';

export const BUG_KATEGORI_LIST: BugKategori[] = [
  'Crash / Aplikasi Berhenti',
  'Tampilan / UI',
  'Data Tidak Tersimpan',
  'Login / Akses',
  'Performa Lambat',
  'Fitur Tidak Bekerja',
  'Lainnya',
];

export interface BugReport {
  id:          string;
  judul:       string;
  kategori:    BugKategori;
  deskripsi:   string;
  screenshot:  boolean;   // true = user menyatakan ada screenshot (tidak di-upload nyata)
  timestamp:   string;
}

const BUG_REPORTS_KEY = 'ternakhub.support.bug-reports';
const FEEDBACKS_KEY = 'ternakhub.support.feedback';

function readList<T>(key: string): T[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, items: T[]): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Keep the current submission successful even when browser storage is full.
  }
}

export function submitBugReport(data: Omit<BugReport, 'id' | 'timestamp'>): BugReport {
  const entry: BugReport = {
    ...data,
    id:        generateUUID(),
    timestamp: new Date().toISOString(),
  };
  const reports = readList<BugReport>(BUG_REPORTS_KEY);
  reports.push(entry);
  writeList(BUG_REPORTS_KEY, reports);
  return entry;
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

export type FeedbackKategori =
  | 'Saran Fitur'
  | 'Pengalaman Pengguna'
  | 'Performa'
  | 'Desain / UI'
  | 'Konten'
  | 'Lainnya';

export const FEEDBACK_KATEGORI_LIST: FeedbackKategori[] = [
  'Saran Fitur',
  'Pengalaman Pengguna',
  'Performa',
  'Desain / UI',
  'Konten',
  'Lainnya',
];

export interface FeedbackRecord {
  id:        string;
  rating:    1 | 2 | 3 | 4 | 5;
  kategori:  FeedbackKategori;
  pesan:     string;
  timestamp: string;
}

export function submitFeedback(data: Omit<FeedbackRecord, 'id' | 'timestamp'>): FeedbackRecord {
  const entry: FeedbackRecord = {
    ...data,
    id:        generateUUID(),
    timestamp: new Date().toISOString(),
  };
  const feedbacks = readList<FeedbackRecord>(FEEDBACKS_KEY);
  feedbacks.push(entry);
  writeList(FEEDBACKS_KEY, feedbacks);
  return entry;
}

// ─── Help Center Articles ─────────────────────────────────────────────────────

export interface HelpArticle {
  id:        string;
  judul:     string;
  deskripsi: string;
  ikon:      string;
  url:       string | null;
}

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'ha-001', ikon: '🚀',
    judul:     'Panduan Memulai TernakHub',
    deskripsi: 'Langkah awal: buat Workspace, tambah ternak pertama, dan atur stok pakan.',
    url: '/profile/support/help',
  },
  {
    id: 'ha-002', ikon: '🐄',
    judul:     'Mengelola Data Ternak',
    deskripsi: 'Cara mencatat, memperbarui, dan mengarsipkan data ternak dengan benar.',
    url: '/profile/support/help',
  },
  {
    id: 'ha-003', ikon: '🌾',
    judul:     'Panduan Stok Pakan & Formula',
    deskripsi: 'Inventaris pakan, membuat formula, dan mencatat produksi pakan mandiri.',
    url: '/profile/support/help',
  },
  {
    id: 'ha-004', ikon: '🛒',
    judul:     'Berjualan di Marketplace',
    deskripsi: 'Cara membuat listing, mengelola penawaran, dan menyelesaikan transaksi.',
    url: '/profile/support/help',
  },
  {
    id: 'ha-005', ikon: '🔒',
    judul:     'Keamanan Akun',
    deskripsi: 'Tips mengamankan akun: password kuat, 2FA, dan manajemen sesi login.',
    url: '/profile/support/help',
  },
  {
    id: 'ha-006', ikon: '⭐',
    judul:     'Paket Subscription',
    deskripsi: 'Perbedaan fitur antar paket dan cara upgrade atau downgrade paket.',
    url: '/profile/support/help',
  },
];
