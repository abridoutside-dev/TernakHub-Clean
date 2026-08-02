// ─── Admin Reports Data — ADM-003C ───────────────────────────────────────────
// Realistic dummy data only. No production database, no external API.

export type ReportType = 'Platform Summary' | 'User Analytics' | 'Subscription' | 'Marketplace' | 'Livestock' | 'Financial' | 'Audit Log';
export type ReportStatus = 'Completed' | 'Generating' | 'Scheduled' | 'Failed' | 'Cancelled';
export type ReportFormat = 'PDF' | 'Excel' | 'CSV' | 'JSON';
export type ReportPeriod = 'Harian' | 'Mingguan' | 'Bulanan' | 'Kuartalan' | 'Tahunan' | 'Custom';

export interface ReportParameter {
  key: string;
  value: string;
}

export interface AdminReportRecord {
  id: string;
  title: string;
  type: ReportType;
  status: ReportStatus;
  format: ReportFormat;
  period: ReportPeriod;
  periodLabel: string;         // e.g. "Juni 2026" or "Q2 2026"
  requestedBy: string;
  requestedAt: string;
  completedAt: string | null;
  fileSizeKb: number | null;
  rowCount: number | null;
  scheduleCron: string | null;  // null = ad-hoc
  parameters: ReportParameter[];
  description: string;
  errorMessage: string | null;
}

// ─── Platform stats ───────────────────────────────────────────────────────────

export interface ReportPlatformStats {
  totalReports: number;
  generatedToday: number;
  scheduledReports: number;
  totalExports: number;
  failedToday: number;
}

export const REPORT_PLATFORM_STATS: ReportPlatformStats = {
  totalReports: 12_847,
  generatedToday: 34,
  scheduledReports: 18,
  totalExports: 9_204,
  failedToday: 2,
};

// ─── Config maps ─────────────────────────────────────────────────────────────

export const REPORT_STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; bg: string; dot: string }> = {
  'Completed':  { label: 'Selesai',      color: '#059669', bg: '#d1fae5', dot: '#10b981' },
  'Generating': { label: 'Membuat...',   color: '#7c3aed', bg: '#ede9fe', dot: '#8b5cf6' },
  'Scheduled':  { label: 'Terjadwal',   color: '#d97706', bg: '#fef3c7', dot: '#f59e0b' },
  'Failed':     { label: 'Gagal',        color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
  'Cancelled':  { label: 'Dibatalkan',   color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' },
};

export const REPORT_TYPE_CONFIG: Record<ReportType, { icon: string; color: string }> = {
  'Platform Summary': { icon: '🏢', color: '#3b82f6' },
  'User Analytics':   { icon: '👤', color: '#8b5cf6' },
  'Subscription':     { icon: '⭐', color: '#7c3aed' },
  'Marketplace':      { icon: '🛒', color: '#f59e0b' },
  'Livestock':        { icon: '🐄', color: '#10b981' },
  'Financial':        { icon: '💰', color: '#059669' },
  'Audit Log':        { icon: '📋', color: '#64748b' },
};

export const REPORT_FORMAT_CONFIG: Record<ReportFormat, { color: string; bg: string }> = {
  'PDF':   { color: '#dc2626', bg: '#fee2e2' },
  'Excel': { color: '#059669', bg: '#d1fae5' },
  'CSV':   { color: '#d97706', bg: '#fef3c7' },
  'JSON':  { color: '#7c3aed', bg: '#ede9fe' },
};

// ─── Dummy data (20 records) ──────────────────────────────────────────────────

export const ADMIN_REPORT_LIST: AdminReportRecord[] = [
  {
    id: 'RPT-20260718-001',
    title: 'Ringkasan Platform Harian — 18 Juli 2026',
    type: 'Platform Summary', status: 'Completed', format: 'PDF',
    period: 'Harian', periodLabel: '18 Jul 2026',
    requestedBy: 'System Auto-Scheduler', requestedAt: '2026-07-18 00:01',
    completedAt: '2026-07-18 00:04', fileSizeKb: 284, rowCount: null,
    scheduleCron: '0 0 * * *',
    parameters: [{ key: 'Tanggal', value: '18 Juli 2026' }, { key: 'Zona Waktu', value: 'WIB (UTC+7)' }],
    description: 'Laporan harian otomatis: jumlah pengguna aktif, transaksi marketplace, dan event platform.',
    errorMessage: null,
  },
  {
    id: 'RPT-20260718-002',
    title: 'Analitik Pengguna — Juli 2026',
    type: 'User Analytics', status: 'Completed', format: 'Excel',
    period: 'Bulanan', periodLabel: 'Juli 2026',
    requestedBy: 'Siti Admin', requestedAt: '2026-07-18 08:30',
    completedAt: '2026-07-18 08:45', fileSizeKb: 1_240, rowCount: 8_412,
    scheduleCron: null,
    parameters: [{ key: 'Bulan', value: 'Juli 2026' }, { key: 'Include Inactive', value: 'Ya' }],
    description: 'Analitik lengkap pengguna termasuk registrasi baru, churn rate, dan distribusi workspace.',
    errorMessage: null,
  },
  {
    id: 'RPT-20260718-003',
    title: 'Laporan Subscription Aktif',
    type: 'Subscription', status: 'Completed', format: 'CSV',
    period: 'Bulanan', periodLabel: 'Juli 2026',
    requestedBy: 'Budi Finance', requestedAt: '2026-07-18 09:00',
    completedAt: '2026-07-18 09:08', fileSizeKb: 620, rowCount: 2_608,
    scheduleCron: null,
    parameters: [{ key: 'Plan', value: 'Semua' }, { key: 'Status', value: 'Active' }],
    description: 'Daftar seluruh subscription aktif dengan detail billing dan renewal date.',
    errorMessage: null,
  },
  {
    id: 'RPT-20260718-004',
    title: 'Transaksi Marketplace — Q2 2026',
    type: 'Marketplace', status: 'Generating', format: 'Excel',
    period: 'Kuartalan', periodLabel: 'Q2 2026',
    requestedBy: 'Ahmad Marketplace', requestedAt: '2026-07-18 10:15',
    completedAt: null, fileSizeKb: null, rowCount: null,
    scheduleCron: null,
    parameters: [{ key: 'Kuartal', value: 'Q2 2026' }, { key: 'Include Cancelled', value: 'Tidak' }],
    description: 'Rekapitulasi transaksi marketplace kuartal kedua 2026.',
    errorMessage: null,
  },
  {
    id: 'RPT-20260717-005',
    title: 'Laporan Ternak — Juni 2026',
    type: 'Livestock', status: 'Completed', format: 'PDF',
    period: 'Bulanan', periodLabel: 'Juni 2026',
    requestedBy: 'Dewi Livestock', requestedAt: '2026-07-17 14:00',
    completedAt: '2026-07-17 14:12', fileSizeKb: 890, rowCount: null,
    scheduleCron: null,
    parameters: [{ key: 'Bulan', value: 'Juni 2026' }, { key: 'Spesies', value: 'Semua' }],
    description: 'Statistik ternak terdaftar, mutasi, kelahiran, dan kematian selama Juni 2026.',
    errorMessage: null,
  },
  {
    id: 'RPT-20260717-006',
    title: 'Laporan Keuangan — H1 2026',
    type: 'Financial', status: 'Completed', format: 'Excel',
    period: 'Kuartalan', periodLabel: 'H1 2026',
    requestedBy: 'Budi Finance', requestedAt: '2026-07-17 09:00',
    completedAt: '2026-07-17 09:25', fileSizeKb: 3_450, rowCount: null,
    scheduleCron: null,
    parameters: [{ key: 'Periode', value: 'Jan–Jun 2026' }, { key: 'Currency', value: 'IDR' }],
    description: 'Laporan keuangan komprehensif semester pertama 2026 termasuk MRR, churn revenue, dan proyeksi.',
    errorMessage: null,
  },
  {
    id: 'RPT-20260716-007',
    title: 'Audit Log Admin — 15 Juli 2026',
    type: 'Audit Log', status: 'Completed', format: 'JSON',
    period: 'Harian', periodLabel: '15 Jul 2026',
    requestedBy: 'System Auto-Scheduler', requestedAt: '2026-07-16 00:01',
    completedAt: '2026-07-16 00:02', fileSizeKb: 142, rowCount: 847,
    scheduleCron: '0 0 * * *',
    parameters: [{ key: 'Tanggal', value: '15 Juli 2026' }, { key: 'Include System Events', value: 'Ya' }],
    description: 'Log seluruh aksi admin panel dalam periode harian untuk keperluan compliance.',
    errorMessage: null,
  },
  {
    id: 'RPT-20260715-008',
    title: 'Ringkasan Platform Mingguan — W28 2026',
    type: 'Platform Summary', status: 'Completed', format: 'PDF',
    period: 'Mingguan', periodLabel: 'W28 2026 (7–13 Jul)',
    requestedBy: 'System Auto-Scheduler', requestedAt: '2026-07-14 00:01',
    completedAt: '2026-07-14 00:06', fileSizeKb: 520, rowCount: null,
    scheduleCron: '0 0 * * 1',
    parameters: [{ key: 'Minggu', value: 'W28 2026' }],
    description: 'Ringkasan performa platform mingguan: DAU, MAU, revenue, dan incident summary.',
    errorMessage: null,
  },
  {
    id: 'RPT-20260714-009',
    title: 'Laporan Subscription MRR — Juni 2026',
    type: 'Subscription', status: 'Completed', format: 'Excel',
    period: 'Bulanan', periodLabel: 'Juni 2026',
    requestedBy: 'Budi Finance', requestedAt: '2026-07-14 10:00',
    completedAt: '2026-07-14 10:14', fileSizeKb: 980, rowCount: 2_547,
    scheduleCron: null,
    parameters: [{ key: 'Bulan', value: 'Juni 2026' }, { key: 'Include Churn', value: 'Ya' }],
    description: 'MRR breakdown per plan dengan analisa churn, upgrade, dan downgrade.',
    errorMessage: null,
  },
  {
    id: 'RPT-20260713-010',
    title: 'Audit Log Admin — 12 Juli 2026',
    type: 'Audit Log', status: 'Failed', format: 'JSON',
    period: 'Harian', periodLabel: '12 Jul 2026',
    requestedBy: 'System Auto-Scheduler', requestedAt: '2026-07-13 00:01',
    completedAt: null, fileSizeKb: null, rowCount: null,
    scheduleCron: '0 0 * * *',
    parameters: [{ key: 'Tanggal', value: '12 Juli 2026' }],
    description: 'Log harian admin panel — gagal karena koneksi storage timeout.',
    errorMessage: 'Storage write timeout after 30s — blob service unreachable. Retry scheduled.',
  },
  {
    id: 'RPT-20260712-011',
    title: 'Analitik Pengguna — Q2 2026',
    type: 'User Analytics', status: 'Completed', format: 'Excel',
    period: 'Kuartalan', periodLabel: 'Q2 2026',
    requestedBy: 'Siti Admin', requestedAt: '2026-07-12 08:00',
    completedAt: '2026-07-12 08:18', fileSizeKb: 2_800, rowCount: 8_219,
    scheduleCron: null,
    parameters: [{ key: 'Kuartal', value: 'Q2 2026' }, { key: 'Segment', value: 'Semua' }],
    description: 'Analitik pengguna kuartalan dengan breakdown per tipe workspace dan region.',
    errorMessage: null,
  },
  {
    id: 'RPT-20260710-012',
    title: 'Laporan Ternak Tahunan — 2025',
    type: 'Livestock', status: 'Completed', format: 'PDF',
    period: 'Tahunan', periodLabel: '2025',
    requestedBy: 'Dewi Livestock', requestedAt: '2026-07-10 09:00',
    completedAt: '2026-07-10 09:35', fileSizeKb: 4_200, rowCount: null,
    scheduleCron: null,
    parameters: [{ key: 'Tahun', value: '2025' }, { key: 'Include Archives', value: 'Ya' }],
    description: 'Laporan ternak komprehensif tahunan 2025 untuk keperluan audit dan pelaporan.',
    errorMessage: null,
  },
  {
    id: 'RPT-SCHED-013',
    title: 'Ringkasan Platform Harian — Auto',
    type: 'Platform Summary', status: 'Scheduled', format: 'PDF',
    period: 'Harian', periodLabel: '19 Jul 2026',
    requestedBy: 'System Auto-Scheduler', requestedAt: '2026-07-18 23:00',
    completedAt: null, fileSizeKb: null, rowCount: null,
    scheduleCron: '0 0 * * *',
    parameters: [{ key: 'Tanggal', value: '19 Juli 2026' }],
    description: 'Jadwal otomatis laporan harian platform untuk besok.',
    errorMessage: null,
  },
  {
    id: 'RPT-SCHED-014',
    title: 'Laporan Subscription Mingguan — W29',
    type: 'Subscription', status: 'Scheduled', format: 'Excel',
    period: 'Mingguan', periodLabel: 'W29 2026',
    requestedBy: 'System Auto-Scheduler', requestedAt: '2026-07-18 23:00',
    completedAt: null, fileSizeKb: null, rowCount: null,
    scheduleCron: '0 0 * * 1',
    parameters: [{ key: 'Minggu', value: 'W29 2026' }],
    description: 'Laporan subscription mingguan terjadwal untuk W29.',
    errorMessage: null,
  },
  {
    id: 'RPT-20260708-015',
    title: 'Laporan Marketplace — Juni 2026',
    type: 'Marketplace', status: 'Completed', format: 'Excel',
    period: 'Bulanan', periodLabel: 'Juni 2026',
    requestedBy: 'Ahmad Marketplace', requestedAt: '2026-07-08 10:00',
    completedAt: '2026-07-08 10:22', fileSizeKb: 1_870, rowCount: 3_241,
    scheduleCron: null,
    parameters: [{ key: 'Bulan', value: 'Juni 2026' }, { key: 'Status', value: 'Selesai' }],
    description: 'Rekapitulasi transaksi marketplace Juni 2026 — listing, pembeli, GMV.',
    errorMessage: null,
  },
  {
    id: 'RPT-20260705-016',
    title: 'Audit Log Admin — W27 2026',
    type: 'Audit Log', status: 'Completed', format: 'JSON',
    period: 'Mingguan', periodLabel: 'W27 2026',
    requestedBy: 'System Auto-Scheduler', requestedAt: '2026-07-07 00:01',
    completedAt: '2026-07-07 00:03', fileSizeKb: 890, rowCount: 5_847,
    scheduleCron: '0 0 * * 1',
    parameters: [{ key: 'Minggu', value: 'W27 2026' }],
    description: 'Log mingguan aksi admin panel untuk periode W27.',
    errorMessage: null,
  },
  {
    id: 'RPT-20260701-017',
    title: 'Laporan Keuangan — Juni 2026',
    type: 'Financial', status: 'Completed', format: 'Excel',
    period: 'Bulanan', periodLabel: 'Juni 2026',
    requestedBy: 'Budi Finance', requestedAt: '2026-07-01 08:00',
    completedAt: '2026-07-01 08:19', fileSizeKb: 1_540, rowCount: null,
    scheduleCron: null,
    parameters: [{ key: 'Bulan', value: 'Juni 2026' }, { key: 'Currency', value: 'IDR' }],
    description: 'Laporan keuangan bulanan Juni 2026: revenue, expense, net margin.',
    errorMessage: null,
  },
  {
    id: 'RPT-20260701-018',
    title: 'Analitik Pengguna — Juni 2026',
    type: 'User Analytics', status: 'Cancelled', format: 'CSV',
    period: 'Bulanan', periodLabel: 'Juni 2026',
    requestedBy: 'Siti Admin', requestedAt: '2026-07-01 09:30',
    completedAt: null, fileSizeKb: null, rowCount: null,
    scheduleCron: null,
    parameters: [{ key: 'Bulan', value: 'Juni 2026' }],
    description: 'Analitik pengguna Juni 2026 — dibatalkan karena duplikasi dengan RPT-20260714-009.',
    errorMessage: null,
  },
  {
    id: 'RPT-SCHED-019',
    title: 'Laporan Keuangan Bulanan — Auto',
    type: 'Financial', status: 'Scheduled', format: 'Excel',
    period: 'Bulanan', periodLabel: 'Agustus 2026',
    requestedBy: 'System Auto-Scheduler', requestedAt: '2026-07-18 23:00',
    completedAt: null, fileSizeKb: null, rowCount: null,
    scheduleCron: '0 9 1 * *',
    parameters: [{ key: 'Bulan', value: 'Agustus 2026' }],
    description: 'Laporan keuangan bulanan terjadwal — dijalankan otomatis tanggal 1 setiap bulan.',
    errorMessage: null,
  },
  {
    id: 'RPT-20260718-020',
    title: 'Laporan Ternak Harian — 18 Juli 2026',
    type: 'Livestock', status: 'Completed', format: 'CSV',
    period: 'Harian', periodLabel: '18 Jul 2026',
    requestedBy: 'Dewi Livestock', requestedAt: '2026-07-18 07:00',
    completedAt: '2026-07-18 07:05', fileSizeKb: 312, rowCount: 1_248,
    scheduleCron: null,
    parameters: [{ key: 'Tanggal', value: '18 Juli 2026' }, { key: 'Spesies', value: 'Sapi' }],
    description: 'Data harian ternak sapi: bobot harian, pemberian pakan, dan status kesehatan.',
    errorMessage: null,
  },
];

// ─── Filter helper ────────────────────────────────────────────────────────────

export function filterReports(
  list: AdminReportRecord[],
  opts: {
    keyword?: string;
    type?: ReportType | 'All';
    status?: ReportStatus | 'All';
    format?: ReportFormat | 'All';
    period?: ReportPeriod | 'All';
  },
): AdminReportRecord[] {
  return list.filter((r) => {
    const kw = opts.keyword?.toLowerCase();
    if (kw && !r.title.toLowerCase().includes(kw) && !r.id.toLowerCase().includes(kw) && !r.requestedBy.toLowerCase().includes(kw)) return false;
    if (opts.type && opts.type !== 'All' && r.type !== opts.type) return false;
    if (opts.status && opts.status !== 'All' && r.status !== opts.status) return false;
    if (opts.format && opts.format !== 'All' && r.format !== opts.format) return false;
    if (opts.period && opts.period !== 'All' && r.period !== opts.period) return false;
    return true;
  });
}
