// ─── Admin Settings Data — ADM-003C ──────────────────────────────────────────
// Realistic dummy data only. No production database, no external API.

export type SettingCategory =
  | 'Platform'
  | 'Security'
  | 'AI'
  | 'Marketplace'
  | 'Notification';

export type SettingType = 'String' | 'Number' | 'Boolean' | 'JSON' | 'Enum' | 'Secret';
export type SettingScope = 'Global' | 'Per Workspace' | 'Per User';
export type SettingStatus = 'Active' | 'Deprecated' | 'Experimental';

export interface AdminSettingRecord {
  id: string;
  key: string;               // config key name (e.g. platform.max_workspaces_per_user)
  displayName: string;
  category: SettingCategory;
  type: SettingType;
  scope: SettingScope;
  status: SettingStatus;
  currentValue: string;       // display string (secrets masked)
  defaultValue: string;
  description: string;
  lastModifiedAt: string;
  lastModifiedBy: string;
  isEditable: boolean;        // some system constants are read-only
  requiresRestart: boolean;
  validationRule?: string;    // e.g. "min:1,max:100" or "enum:Free,Pro,Enterprise"
  notes?: string;
}

// ─── Platform stats ───────────────────────────────────────────────────────────

export interface SettingsPlatformStats {
  platformConfigs: number;
  securityConfigs: number;
  aiConfigs: number;
  marketplaceConfigs: number;
  notificationConfigs: number;
  totalConfigs: number;
  lastAuditAt: string;
  environmentLabel: string;
}

export const SETTINGS_PLATFORM_STATS: SettingsPlatformStats = {
  platformConfigs: 18,
  securityConfigs: 14,
  aiConfigs: 12,
  marketplaceConfigs: 10,
  notificationConfigs: 9,
  totalConfigs: 63,
  lastAuditAt: '2026-07-15 00:00',
  environmentLabel: 'Production',
};

// ─── Config maps ─────────────────────────────────────────────────────────────

export const SETTING_CATEGORY_CONFIG: Record<SettingCategory, { icon: string; color: string; bg: string }> = {
  'Platform':     { icon: '🏢', color: '#3b82f6', bg: '#dbeafe' },
  'Security':     { icon: '🔐', color: '#dc2626', bg: '#fee2e2' },
  'AI':           { icon: '🤖', color: '#8b5cf6', bg: '#ede9fe' },
  'Marketplace':  { icon: '🛒', color: '#f59e0b', bg: '#fef3c7' },
  'Notification': { icon: '🔔', color: '#10b981', bg: '#d1fae5' },
};

export const SETTING_STATUS_CONFIG: Record<SettingStatus, { label: string; color: string; bg: string; dot: string }> = {
  'Active':       { label: 'Aktif',        color: '#059669', bg: '#d1fae5', dot: '#10b981' },
  'Deprecated':   { label: 'Deprecated',   color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
  'Experimental': { label: 'Eksperimental', color: '#d97706', bg: '#fef3c7', dot: '#f59e0b' },
};

export const SETTING_TYPE_CONFIG: Record<SettingType, { color: string; bg: string }> = {
  'String':  { color: '#3b82f6', bg: '#dbeafe' },
  'Number':  { color: '#059669', bg: '#d1fae5' },
  'Boolean': { color: '#7c3aed', bg: '#ede9fe' },
  'JSON':    { color: '#d97706', bg: '#fef3c7' },
  'Enum':    { color: '#f97316', bg: '#ffedd5' },
  'Secret':  { color: '#64748b', bg: '#f1f5f9' },
};

// ─── Dummy settings (30 records, spread across 5 categories) ─────────────────

export const ADMIN_SETTINGS_LIST: AdminSettingRecord[] = [
  // ── Platform ──────────────────────────────────────────────────────────────────
  {
    id: 'CFG-P001', key: 'platform.app_name', displayName: 'Nama Aplikasi',
    category: 'Platform', type: 'String', scope: 'Global', status: 'Active',
    currentValue: 'TernakHub', defaultValue: 'TernakHub',
    description: 'Nama resmi platform yang ditampilkan di header, email, dan notifikasi.',
    lastModifiedAt: '2023-01-01 00:00', lastModifiedBy: 'System Init',
    isEditable: false, requiresRestart: false,
  },
  {
    id: 'CFG-P002', key: 'platform.app_version', displayName: 'Versi Aplikasi',
    category: 'Platform', type: 'String', scope: 'Global', status: 'Active',
    currentValue: '1.4.2', defaultValue: '1.0.0',
    description: 'Versi release saat ini — diperbarui otomatis saat deployment.',
    lastModifiedAt: '2026-07-15 09:00', lastModifiedBy: 'CI/CD Pipeline',
    isEditable: false, requiresRestart: false,
  },
  {
    id: 'CFG-P003', key: 'platform.max_workspaces_per_user', displayName: 'Maks Workspace per User',
    category: 'Platform', type: 'Number', scope: 'Per User', status: 'Active',
    currentValue: '10', defaultValue: '5',
    description: 'Jumlah maksimum workspace yang dapat dimiliki satu akun pengguna.',
    lastModifiedAt: '2025-03-10 14:00', lastModifiedBy: 'Budi Admin',
    isEditable: true, requiresRestart: false, validationRule: 'min:1,max:50',
  },
  {
    id: 'CFG-P004', key: 'platform.free_plan_livestock_limit', displayName: 'Limit Ternak Plan Free',
    category: 'Platform', type: 'Number', scope: 'Per Workspace', status: 'Active',
    currentValue: '50', defaultValue: '25',
    description: 'Batas jumlah ternak aktif untuk workspace dengan plan Free.',
    lastModifiedAt: '2025-08-01 00:00', lastModifiedBy: 'Siti Admin',
    isEditable: true, requiresRestart: false, validationRule: 'min:10,max:500',
  },
  {
    id: 'CFG-P005', key: 'platform.maintenance_mode', displayName: 'Mode Maintenance',
    category: 'Platform', type: 'Boolean', scope: 'Global', status: 'Active',
    currentValue: 'false', defaultValue: 'false',
    description: 'Aktifkan untuk memblokir akses pengguna saat pemeliharaan sistem.',
    lastModifiedAt: '2026-07-10 01:00', lastModifiedBy: 'System Admin',
    isEditable: true, requiresRestart: false,
    notes: 'Terakhir digunakan saat Escrow Engine maintenance, 18 Jul 2026 02:00 WIB.',
  },
  {
    id: 'CFG-P006', key: 'platform.default_timezone', displayName: 'Zona Waktu Default',
    category: 'Platform', type: 'Enum', scope: 'Global', status: 'Active',
    currentValue: 'Asia/Jakarta', defaultValue: 'Asia/Jakarta',
    description: 'Zona waktu default untuk kalkulasi tanggal dan laporan platform.',
    lastModifiedAt: '2023-01-01 00:00', lastModifiedBy: 'System Init',
    isEditable: true, requiresRestart: false, validationRule: 'enum:Asia/Jakarta,Asia/Makassar,Asia/Jayapura',
  },
  {
    id: 'CFG-P007', key: 'platform.session_timeout_minutes', displayName: 'Timeout Sesi (menit)',
    category: 'Platform', type: 'Number', scope: 'Per User', status: 'Active',
    currentValue: '480', defaultValue: '60',
    description: 'Durasi sesi sebelum pengguna otomatis logout saat tidak aktif.',
    lastModifiedAt: '2024-06-01 00:00', lastModifiedBy: 'Ahmad Admin',
    isEditable: true, requiresRestart: false, validationRule: 'min:15,max:1440',
  },
  {
    id: 'CFG-P008', key: 'platform.enable_public_marketplace', displayName: 'Marketplace Publik',
    category: 'Platform', type: 'Boolean', scope: 'Global', status: 'Active',
    currentValue: 'true', defaultValue: 'true',
    description: 'Izinkan listing marketplace dilihat tanpa login untuk meningkatkan jangkauan.',
    lastModifiedAt: '2024-09-15 00:00', lastModifiedBy: 'Budi Admin',
    isEditable: true, requiresRestart: false,
  },

  // ── Security ─────────────────────────────────────────────────────────────────
  {
    id: 'CFG-S001', key: 'security.jwt_secret', displayName: 'JWT Secret Key',
    category: 'Security', type: 'Secret', scope: 'Global', status: 'Active',
    currentValue: '••••••••••••••••••••••••••••••••••••••••••••••',
    defaultValue: '<generated>',
    description: 'Kunci rahasia untuk signing JWT token autentikasi. Jangan pernah ditampilkan.',
    lastModifiedAt: '2026-01-01 00:00', lastModifiedBy: 'Security Rotation',
    isEditable: false, requiresRestart: true,
    notes: 'Auto-rotasi setiap 6 bulan oleh sistem. Rotasi berikutnya: 2026-07-01.',
  },
  {
    id: 'CFG-S002', key: 'security.max_login_attempts', displayName: 'Maks Percobaan Login',
    category: 'Security', type: 'Number', scope: 'Per User', status: 'Active',
    currentValue: '5', defaultValue: '5',
    description: 'Jumlah percobaan login gagal sebelum akun dikunci sementara.',
    lastModifiedAt: '2023-01-01 00:00', lastModifiedBy: 'System Init',
    isEditable: true, requiresRestart: false, validationRule: 'min:3,max:10',
  },
  {
    id: 'CFG-S003', key: 'security.lockout_duration_minutes', displayName: 'Durasi Kunci Akun (menit)',
    category: 'Security', type: 'Number', scope: 'Per User', status: 'Active',
    currentValue: '30', defaultValue: '15',
    description: 'Durasi kunci akun setelah melebihi batas percobaan login.',
    lastModifiedAt: '2024-02-20 00:00', lastModifiedBy: 'Siti Admin',
    isEditable: true, requiresRestart: false, validationRule: 'min:5,max:1440',
  },
  {
    id: 'CFG-S004', key: 'security.require_email_verification', displayName: 'Wajib Verifikasi Email',
    category: 'Security', type: 'Boolean', scope: 'Global', status: 'Active',
    currentValue: 'true', defaultValue: 'true',
    description: 'Pengguna baru wajib memverifikasi email sebelum dapat menggunakan platform.',
    lastModifiedAt: '2023-01-01 00:00', lastModifiedBy: 'System Init',
    isEditable: true, requiresRestart: false,
  },
  {
    id: 'CFG-S005', key: 'security.password_min_length', displayName: 'Panjang Password Minimum',
    category: 'Security', type: 'Number', scope: 'Global', status: 'Active',
    currentValue: '8', defaultValue: '8',
    description: 'Panjang minimum karakter password yang diperbolehkan.',
    lastModifiedAt: '2023-01-01 00:00', lastModifiedBy: 'System Init',
    isEditable: true, requiresRestart: false, validationRule: 'min:6,max:32',
  },
  {
    id: 'CFG-S006', key: 'security.allowed_file_types', displayName: 'Tipe File yang Diizinkan',
    category: 'Security', type: 'JSON', scope: 'Global', status: 'Active',
    currentValue: '["jpg","jpeg","png","webp","pdf","xlsx","csv"]',
    defaultValue: '["jpg","jpeg","png","pdf"]',
    description: 'Ekstensi file yang diizinkan untuk upload di seluruh platform.',
    lastModifiedAt: '2025-04-01 00:00', lastModifiedBy: 'Ahmad Admin',
    isEditable: true, requiresRestart: false,
  },
  {
    id: 'CFG-S007', key: 'security.max_file_size_mb', displayName: 'Ukuran File Maks (MB)',
    category: 'Security', type: 'Number', scope: 'Per Workspace', status: 'Active',
    currentValue: '20', defaultValue: '10',
    description: 'Batas ukuran file per upload untuk semua workspace.',
    lastModifiedAt: '2025-04-01 00:00', lastModifiedBy: 'Ahmad Admin',
    isEditable: true, requiresRestart: false, validationRule: 'min:1,max:100',
  },

  // ── AI ───────────────────────────────────────────────────────────────────────
  {
    id: 'CFG-A001', key: 'ai.insight_enabled', displayName: 'AI Insight Aktif',
    category: 'AI', type: 'Boolean', scope: 'Global', status: 'Active',
    currentValue: 'true', defaultValue: 'true',
    description: 'Aktifkan fitur AI insight di seluruh modul (ternak, pakan, kesehatan, dll).',
    lastModifiedAt: '2024-03-01 00:00', lastModifiedBy: 'Budi Admin',
    isEditable: true, requiresRestart: false,
  },
  {
    id: 'CFG-A002', key: 'ai.inference_timeout_ms', displayName: 'Timeout Inferensi AI (ms)',
    category: 'AI', type: 'Number', scope: 'Global', status: 'Active',
    currentValue: '10000', defaultValue: '5000',
    description: 'Batas waktu tunggu respons AI inference sebelum fallback ke data statis.',
    lastModifiedAt: '2026-07-18 07:00', lastModifiedBy: 'Siti Admin',
    isEditable: true, requiresRestart: false, validationRule: 'min:1000,max:60000',
    notes: 'Dinaikkan dari 5000 menjadi 10000 pada 18 Jul 2026 saat investigasi degradasi AI inference.',
  },
  {
    id: 'CFG-A003', key: 'ai.model_version', displayName: 'Versi Model AI Aktif',
    category: 'AI', type: 'String', scope: 'Global', status: 'Active',
    currentValue: 'TernakAI-v2.1.0', defaultValue: 'TernakAI-v1.0.0',
    description: 'Versi model AI yang digunakan untuk semua inferensi platform.',
    lastModifiedAt: '2026-05-20 09:00', lastModifiedBy: 'ML Team',
    isEditable: false, requiresRestart: true,
  },
  {
    id: 'CFG-A004', key: 'ai.insight_cache_ttl_seconds', displayName: 'Cache AI Insight (detik)',
    category: 'AI', type: 'Number', scope: 'Per Workspace', status: 'Active',
    currentValue: '300', defaultValue: '300',
    description: 'Durasi cache hasil AI insight per workspace sebelum diregenerasi.',
    lastModifiedAt: '2024-08-01 00:00', lastModifiedBy: 'System Admin',
    isEditable: true, requiresRestart: false, validationRule: 'min:60,max:3600',
  },
  {
    id: 'CFG-A005', key: 'ai.ocr_enabled', displayName: 'AI OCR Aktif',
    category: 'AI', type: 'Boolean', scope: 'Global', status: 'Experimental',
    currentValue: 'true', defaultValue: 'false',
    description: 'Aktifkan OCR berbasis AI untuk validasi dokumen submission berita workspace.',
    lastModifiedAt: '2026-02-15 00:00', lastModifiedBy: 'ML Team',
    isEditable: true, requiresRestart: false,
    notes: 'Fitur eksperimental — simulasi deterministik, bukan model OCR nyata.',
  },
  {
    id: 'CFG-A006', key: 'ai.disease_detection_threshold', displayName: 'Threshold Deteksi Penyakit',
    category: 'AI', type: 'Number', scope: 'Global', status: 'Active',
    currentValue: '0.72', defaultValue: '0.80',
    description: 'Confidence threshold AI untuk memunculkan alert deteksi penyakit ternak.',
    lastModifiedAt: '2026-04-10 00:00', lastModifiedBy: 'ML Team',
    isEditable: true, requiresRestart: false, validationRule: 'min:0.5,max:0.99',
  },

  // ── Marketplace ───────────────────────────────────────────────────────────────
  {
    id: 'CFG-M001', key: 'marketplace.commission_rate_percent', displayName: 'Komisi Marketplace (%)',
    category: 'Marketplace', type: 'Number', scope: 'Global', status: 'Active',
    currentValue: '2.5', defaultValue: '3.0',
    description: 'Persentase komisi platform dari setiap transaksi marketplace yang selesai.',
    lastModifiedAt: '2025-10-01 00:00', lastModifiedBy: 'Budi Finance',
    isEditable: true, requiresRestart: false, validationRule: 'min:0,max:20',
  },
  {
    id: 'CFG-M002', key: 'marketplace.escrow_hold_days', displayName: 'Masa Tahan Escrow (hari)',
    category: 'Marketplace', type: 'Number', scope: 'Global', status: 'Active',
    currentValue: '3', defaultValue: '3',
    description: 'Jumlah hari dana ditahan di escrow setelah pembeli konfirmasi penerimaan.',
    lastModifiedAt: '2026-03-01 00:00', lastModifiedBy: 'Budi Admin',
    isEditable: true, requiresRestart: false, validationRule: 'min:1,max:14',
  },
  {
    id: 'CFG-M003', key: 'marketplace.max_listing_photos', displayName: 'Maks Foto per Listing',
    category: 'Marketplace', type: 'Number', scope: 'Per Workspace', status: 'Active',
    currentValue: '12', defaultValue: '8',
    description: 'Jumlah maksimum foto yang dapat diupload per listing marketplace.',
    lastModifiedAt: '2025-06-15 00:00', lastModifiedBy: 'Ahmad Admin',
    isEditable: true, requiresRestart: false, validationRule: 'min:1,max:20',
  },
  {
    id: 'CFG-M004', key: 'marketplace.moderation_auto_reject_keywords', displayName: 'Kata Kunci Auto-Reject',
    category: 'Marketplace', type: 'JSON', scope: 'Global', status: 'Active',
    currentValue: '["pinjol","investasi bodong","MLM","pyramid"]',
    defaultValue: '[]',
    description: 'Daftar kata kunci yang memicu auto-reject saat moderasi konten listing.',
    lastModifiedAt: '2026-01-20 00:00', lastModifiedBy: 'Siti Admin',
    isEditable: true, requiresRestart: false,
  },
  {
    id: 'CFG-M005', key: 'marketplace.enable_negotiation', displayName: 'Aktifkan Fitur Negosiasi',
    category: 'Marketplace', type: 'Boolean', scope: 'Global', status: 'Active',
    currentValue: 'true', defaultValue: 'false',
    description: 'Izinkan pembeli mengajukan harga negosiasi kepada penjual.',
    lastModifiedAt: '2025-11-01 00:00', lastModifiedBy: 'Budi Admin',
    isEditable: true, requiresRestart: false,
  },

  // ── Notification ──────────────────────────────────────────────────────────────
  {
    id: 'CFG-N001', key: 'notification.push_enabled', displayName: 'Push Notification Aktif',
    category: 'Notification', type: 'Boolean', scope: 'Global', status: 'Active',
    currentValue: 'true', defaultValue: 'true',
    description: 'Aktifkan pengiriman push notification ke aplikasi mobile TernakHub.',
    lastModifiedAt: '2023-01-01 00:00', lastModifiedBy: 'System Init',
    isEditable: true, requiresRestart: false,
  },
  {
    id: 'CFG-N002', key: 'notification.email_enabled', displayName: 'Email Notification Aktif',
    category: 'Notification', type: 'Boolean', scope: 'Global', status: 'Active',
    currentValue: 'true', defaultValue: 'true',
    description: 'Aktifkan pengiriman notifikasi melalui email transaksional.',
    lastModifiedAt: '2023-01-01 00:00', lastModifiedBy: 'System Init',
    isEditable: true, requiresRestart: false,
  },
  {
    id: 'CFG-N003', key: 'notification.whatsapp_enabled', displayName: 'WhatsApp Notification Aktif',
    category: 'Notification', type: 'Boolean', scope: 'Global', status: 'Active',
    currentValue: 'true', defaultValue: 'false',
    description: 'Aktifkan notifikasi melalui WhatsApp Business API untuk pengingat kritis.',
    lastModifiedAt: '2024-11-01 00:00', lastModifiedBy: 'Budi Admin',
    isEditable: true, requiresRestart: false,
  },
  {
    id: 'CFG-N004', key: 'notification.max_daily_push_per_user', displayName: 'Maks Push per User/Hari',
    category: 'Notification', type: 'Number', scope: 'Per User', status: 'Active',
    currentValue: '20', defaultValue: '10',
    description: 'Batas pengiriman push notification per pengguna per hari untuk mencegah spam.',
    lastModifiedAt: '2025-07-01 00:00', lastModifiedBy: 'Ahmad Admin',
    isEditable: true, requiresRestart: false, validationRule: 'min:1,max:100',
  },
  {
    id: 'CFG-N005', key: 'notification.digest_mode_enabled', displayName: 'Mode Digest Aktif',
    category: 'Notification', type: 'Boolean', scope: 'Per User', status: 'Experimental',
    currentValue: 'false', defaultValue: 'false',
    description: 'Gabungkan notifikasi non-kritis menjadi satu ringkasan harian.',
    lastModifiedAt: '2026-05-01 00:00', lastModifiedBy: 'ML Team',
    isEditable: true, requiresRestart: false,
    notes: 'Fitur eksperimental — belum diaktifkan untuk production users.',
  },
];

// ─── Contact & Organisation Config (SSOT for About page) ─────────────────────
// This is the single source of truth for contact and organisation information
// displayed on the About TernakHub page and Support pages.
// Edit this object to update contact info across the entire app.

export interface AdminContactConfig {
  namaOrganisasi: string;
  email:          string;
  website:        string;
  phone:          string | null;      // WhatsApp / telepon; null = belum tersedia
  address:        string | null;
  operasional:    string | null;      // jam operasional; null = belum ditetapkan
  mediaSosial: Array<{
    platform: string;
    tersedia: boolean;
    url:      string | null;
  }>;
}

export const ADMIN_CONTACT_CONFIG: AdminContactConfig = {
  namaOrganisasi: 'TernakHub',
  email:          'hello@ternakhub.id',
  website:        'https://ternakhub.id',
  phone:          null,
  address:        'Garut, Jawa Barat, Indonesia',
  operasional:    null,
  mediaSosial: [
    { platform: 'Instagram', tersedia: false, url: null },
    { platform: 'Twitter/X', tersedia: false, url: null },
    { platform: 'YouTube',   tersedia: false, url: null },
    { platform: 'TikTok',    tersedia: false, url: null },
    { platform: 'LinkedIn',  tersedia: false, url: null },
  ],
};

// ─── Filter helper ────────────────────────────────────────────────────────────

export function filterSettings(
  list: AdminSettingRecord[],
  opts: {
    keyword?: string;
    category?: SettingCategory | 'All';
    status?: SettingStatus | 'All';
    type?: SettingType | 'All';
  },
): AdminSettingRecord[] {
  return list.filter((r) => {
    const kw = opts.keyword?.toLowerCase();
    if (kw && !r.key.toLowerCase().includes(kw) && !r.displayName.toLowerCase().includes(kw) && !r.description.toLowerCase().includes(kw)) return false;
    if (opts.category && opts.category !== 'All' && r.category !== opts.category) return false;
    if (opts.status && opts.status !== 'All' && r.status !== opts.status) return false;
    if (opts.type && opts.type !== 'All' && r.type !== opts.type) return false;
    return true;
  });
}
