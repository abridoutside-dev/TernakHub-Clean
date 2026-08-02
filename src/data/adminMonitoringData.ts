// ─── Admin Monitoring Data — ADM-003C ────────────────────────────────────────
// Realistic dummy data only. No production database, no external API.

export type ServiceType = 'API Gateway' | 'Database' | 'Storage' | 'Queue' | 'AI Service' | 'CDN' | 'Auth Service' | 'Scheduler';
export type ServiceStatus = 'Healthy' | 'Degraded' | 'Down' | 'Maintenance';
export type IncidentSeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';

export interface MetricPoint {
  time: string;
  value: number;
}

export interface IncidentRecord {
  id: string;
  title: string;
  severity: IncidentSeverity;
  occurredAt: string;
  resolvedAt: string | null;
  description: string;
}

export interface AdminServiceRecord {
  id: string;
  name: string;
  type: ServiceType;
  status: ServiceStatus;
  region: string;
  version: string;
  uptimePercent: number;      // 30-day rolling
  responseTimeMs: number;     // p50 median
  p99ResponseTimeMs: number;
  requestsPerMin: number;
  errorRatePercent: number;
  lastChecked: string;
  lastIncident: string | null;
  description: string;
  recentIncidents: IncidentRecord[];
  // Queue-specific
  queueDepth?: number;
  queueProcessingRate?: number;
  // DB-specific
  connectionPoolUsed?: number;
  connectionPoolMax?: number;
  replicationLagMs?: number;
  // Storage-specific
  storageUsedGb?: number;
  storageTotalGb?: number;
  // AI-specific
  inferenceTimeMs?: number;
  modelVersion?: string;
}

// ─── Platform stats ───────────────────────────────────────────────────────────

export interface MonitoringPlatformStats {
  systemHealth: 'Operational' | 'Partial Outage' | 'Major Outage' | 'Maintenance';
  healthScore: number;          // 0–100
  activeServices: number;
  totalServices: number;
  queueDepthTotal: number;
  errorCountToday: number;
  uptimePercent: number;        // 30-day platform-wide
  incidentsOpenCount: number;
}

export const MONITORING_PLATFORM_STATS: MonitoringPlatformStats = {
  systemHealth: 'Operational',
  healthScore: 97,
  activeServices: 14,
  totalServices: 15,
  queueDepthTotal: 247,
  errorCountToday: 94,
  uptimePercent: 99.87,
  incidentsOpenCount: 1,
};

// ─── Config maps ─────────────────────────────────────────────────────────────

export const SERVICE_STATUS_CONFIG: Record<ServiceStatus, { label: string; color: string; bg: string; dot: string }> = {
  'Healthy':     { label: 'Sehat',       color: '#059669', bg: '#d1fae5', dot: '#10b981' },
  'Degraded':    { label: 'Degradasi',   color: '#d97706', bg: '#fef3c7', dot: '#f59e0b' },
  'Down':        { label: 'Down',        color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
  'Maintenance': { label: 'Maintenance', color: '#7c3aed', bg: '#ede9fe', dot: '#8b5cf6' },
};

export const SERVICE_TYPE_CONFIG: Record<ServiceType, { icon: string; color: string }> = {
  'API Gateway':   { icon: '🌐', color: '#3b82f6' },
  'Database':      { icon: '🗄️', color: '#8b5cf6' },
  'Storage':       { icon: '📦', color: '#f59e0b' },
  'Queue':         { icon: '📨', color: '#10b981' },
  'AI Service':    { icon: '🤖', color: '#ec4899' },
  'CDN':           { icon: '⚡', color: '#06b6d4' },
  'Auth Service':  { icon: '🔐', color: '#64748b' },
  'Scheduler':     { icon: '⏰', color: '#f97316' },
};

export const INCIDENT_SEVERITY_CONFIG: Record<IncidentSeverity, { color: string; bg: string }> = {
  'Critical': { color: '#dc2626', bg: '#fee2e2' },
  'High':     { color: '#d97706', bg: '#fef3c7' },
  'Medium':   { color: '#7c3aed', bg: '#ede9fe' },
  'Low':      { color: '#3b82f6', bg: '#dbeafe' },
  'Info':     { color: '#64748b', bg: '#f1f5f9' },
};

// ─── Dummy service list (15 records) ─────────────────────────────────────────

export const ADMIN_SERVICE_LIST: AdminServiceRecord[] = [
  {
    id: 'SVC-001', name: 'API Gateway — Primary', type: 'API Gateway',
    status: 'Healthy', region: 'Asia Pacific (Jakarta)', version: 'v4.2.1',
    uptimePercent: 99.98, responseTimeMs: 48, p99ResponseTimeMs: 142,
    requestsPerMin: 12_840, errorRatePercent: 0.04,
    lastChecked: '2026-07-18 10:42:00', lastIncident: '2026-06-14',
    description: 'Primary API gateway melayani seluruh request dari aplikasi mobile dan web TernakHub.',
    recentIncidents: [
      { id: 'INC-0241', title: 'Elevated latency spike — 14 Jun 2026', severity: 'Medium', occurredAt: '2026-06-14 02:10', resolvedAt: '2026-06-14 02:48', description: 'Lonjakan latensi p99 hingga 820ms akibat spike traffic dari batch job notifikasi.' },
    ],
  },
  {
    id: 'SVC-002', name: 'PostgreSQL Primary (RDS)', type: 'Database',
    status: 'Healthy', region: 'Asia Pacific (Jakarta)', version: 'PostgreSQL 15.4',
    uptimePercent: 99.99, responseTimeMs: 3, p99ResponseTimeMs: 18,
    requestsPerMin: 28_400, errorRatePercent: 0.01,
    lastChecked: '2026-07-18 10:42:00', lastIncident: '2026-04-02',
    description: 'Database utama platform TernakHub. Menyimpan seluruh data user, workspace, livestock, dan transaksi.',
    connectionPoolUsed: 84, connectionPoolMax: 200, replicationLagMs: 12,
    recentIncidents: [
      { id: 'INC-0198', title: 'High connection pool usage', severity: 'High', occurredAt: '2026-04-02 14:30', resolvedAt: '2026-04-02 15:10', description: 'Connection pool mencapai 95% kapasitas akibat query tidak ter-index pada tabel ternak.' },
    ],
  },
  {
    id: 'SVC-003', name: 'PostgreSQL Replica (Read)', type: 'Database',
    status: 'Healthy', region: 'Asia Pacific (Singapore)', version: 'PostgreSQL 15.4',
    uptimePercent: 99.95, responseTimeMs: 5, p99ResponseTimeMs: 22,
    requestsPerMin: 9_200, errorRatePercent: 0.02,
    lastChecked: '2026-07-18 10:42:00', lastIncident: null,
    description: 'Read replica untuk query reporting dan analytics. Mengurangi beban primary database.',
    connectionPoolUsed: 31, connectionPoolMax: 100, replicationLagMs: 28,
    recentIncidents: [],
  },
  {
    id: 'SVC-004', name: 'Object Storage — Media', type: 'Storage',
    status: 'Healthy', region: 'Asia Pacific (Jakarta)', version: 'S3-compatible v3',
    uptimePercent: 99.97, responseTimeMs: 82, p99ResponseTimeMs: 340,
    requestsPerMin: 3_140, errorRatePercent: 0.07,
    lastChecked: '2026-07-18 10:42:00', lastIncident: '2026-07-12',
    description: 'Penyimpanan media: foto ternak, dokumen KTP, attachment marketplace, dan konten berita.',
    storageUsedGb: 4_820, storageTotalGb: 10_000,
    recentIncidents: [
      { id: 'INC-0302', title: 'Storage write timeout — Audit Log Report', severity: 'Low', occurredAt: '2026-07-12 00:01', resolvedAt: '2026-07-12 00:08', description: 'Timeout singkat pada bucket audit-logs saat peak write dari scheduler. Auto-retry berhasil.' },
    ],
  },
  {
    id: 'SVC-005', name: 'Notification Queue (SQS)', type: 'Queue',
    status: 'Healthy', region: 'Asia Pacific (Jakarta)', version: 'SQS Standard',
    uptimePercent: 99.96, responseTimeMs: 14, p99ResponseTimeMs: 68,
    requestsPerMin: 6_480, errorRatePercent: 0.12,
    lastChecked: '2026-07-18 10:42:00', lastIncident: '2026-05-30',
    description: 'Antrean notifikasi push, email, dan WhatsApp. Memproses event-driven notification secara async.',
    queueDepth: 142, queueProcessingRate: 890,
    recentIncidents: [
      { id: 'INC-0224', title: 'Queue backlog spike', severity: 'Medium', occurredAt: '2026-05-30 08:10', resolvedAt: '2026-05-30 08:55', description: 'Backlog mencapai 12.000 messages saat pengumuman platform besar dikirim bersamaan.' },
    ],
  },
  {
    id: 'SVC-006', name: 'AI Inference Service', type: 'AI Service',
    status: 'Degraded', region: 'Asia Pacific (Jakarta)', version: 'v2.1.0',
    uptimePercent: 98.42, responseTimeMs: 1_240, p99ResponseTimeMs: 4_800,
    requestsPerMin: 284, errorRatePercent: 2.4,
    lastChecked: '2026-07-18 10:42:00', lastIncident: '2026-07-18',
    description: 'Layanan AI untuk insight ternak, analitik marketplace, deteksi penyakit, dan OCR dokumen.',
    inferenceTimeMs: 1_240, modelVersion: 'TernakAI-v2.1.0',
    recentIncidents: [
      { id: 'INC-0318', title: 'AI inference latency degradation (OPEN)', severity: 'High', occurredAt: '2026-07-18 06:20', resolvedAt: null, description: 'Latensi AI meningkat 5× baseline sejak 06:20 WIB. Tim ML sedang investigasi kemungkinan memory leak pada model inference container.' },
    ],
  },
  {
    id: 'SVC-007', name: 'Report Generator Worker', type: 'Queue',
    status: 'Healthy', region: 'Asia Pacific (Jakarta)', version: 'v1.8.3',
    uptimePercent: 99.82, responseTimeMs: 0, p99ResponseTimeMs: 0,
    requestsPerMin: 12, errorRatePercent: 0.3,
    lastChecked: '2026-07-18 10:42:00', lastIncident: '2026-07-12',
    description: 'Worker yang memproses permintaan generate report PDF, Excel, CSV, dan JSON secara async.',
    queueDepth: 3, queueProcessingRate: 8,
    recentIncidents: [
      { id: 'INC-0303', title: 'Report generation failed — Storage timeout', severity: 'Low', occurredAt: '2026-07-12 00:01', resolvedAt: '2026-07-12 00:08', description: 'Gagal tulis hasil report ke storage karena timeout. 1 report affected, auto-retry sukses.' },
    ],
  },
  {
    id: 'SVC-008', name: 'Auth Service (Supabase)', type: 'Auth Service',
    status: 'Healthy', region: 'Asia Pacific (Singapore)', version: 'Supabase v2.39',
    uptimePercent: 99.99, responseTimeMs: 62, p99ResponseTimeMs: 188,
    requestsPerMin: 4_820, errorRatePercent: 0.02,
    lastChecked: '2026-07-18 10:42:00', lastIncident: null,
    description: 'Layanan autentikasi berbasis Supabase Auth. Mengelola sesi, token, dan OAuth.',
    recentIncidents: [],
  },
  {
    id: 'SVC-009', name: 'CDN — Static Assets', type: 'CDN',
    status: 'Healthy', region: 'Global Edge (24 PoP)', version: 'Cloudflare Edge',
    uptimePercent: 100.00, responseTimeMs: 12, p99ResponseTimeMs: 38,
    requestsPerMin: 84_200, errorRatePercent: 0.00,
    lastChecked: '2026-07-18 10:42:00', lastIncident: null,
    description: 'CDN global untuk aset statis: JS bundle, CSS, gambar UI, dan font. Hit rate 99.2%.',
    recentIncidents: [],
  },
  {
    id: 'SVC-010', name: 'Email Service (Mailgun)', type: 'Queue',
    status: 'Healthy', region: 'Global', version: 'Mailgun API v3',
    uptimePercent: 99.90, responseTimeMs: 280, p99ResponseTimeMs: 840,
    requestsPerMin: 380, errorRatePercent: 0.8,
    lastChecked: '2026-07-18 10:42:00', lastIncident: '2026-06-28',
    description: 'Pengiriman email transaksional: verifikasi akun, reset password, notifikasi langganan.',
    queueDepth: 18, queueProcessingRate: 420,
    recentIncidents: [
      { id: 'INC-0289', title: 'Email delivery delay — Mailgun region outage', severity: 'Medium', occurredAt: '2026-06-28 11:00', resolvedAt: '2026-06-28 13:30', description: 'Keterlambatan pengiriman email 2–3 jam akibat outage parsial Mailgun region EU yang mempengaruhi routing.' },
    ],
  },
  {
    id: 'SVC-011', name: 'WhatsApp Business API', type: 'Queue',
    status: 'Healthy', region: 'Global (Meta Infrastructure)', version: 'Cloud API v18.0',
    uptimePercent: 99.78, responseTimeMs: 420, p99ResponseTimeMs: 1_200,
    requestsPerMin: 248, errorRatePercent: 1.4,
    lastChecked: '2026-07-18 10:42:00', lastIncident: '2026-07-05',
    description: 'Notifikasi WhatsApp untuk pengingat jadwal pakan, pembayaran, dan event kesehatan ternak.',
    queueDepth: 84, queueProcessingRate: 180,
    recentIncidents: [
      { id: 'INC-0309', title: 'WA API rate limit hit', severity: 'Low', occurredAt: '2026-07-05 09:15', resolvedAt: '2026-07-05 09:40', description: 'Rate limit 250 msg/min tercapai saat blast notifikasi perpanjangan subscription.' },
    ],
  },
  {
    id: 'SVC-012', name: 'Cron Scheduler', type: 'Scheduler',
    status: 'Healthy', region: 'Asia Pacific (Jakarta)', version: 'v1.4.0',
    uptimePercent: 99.99, responseTimeMs: 0, p99ResponseTimeMs: 0,
    requestsPerMin: 4, errorRatePercent: 0.0,
    lastChecked: '2026-07-18 10:42:00', lastIncident: null,
    description: 'Scheduler untuk laporan harian/mingguan otomatis, cleanup log lama, dan sync data referensi.',
    recentIncidents: [],
  },
  {
    id: 'SVC-013', name: 'Redis Cache Cluster', type: 'Database',
    status: 'Healthy', region: 'Asia Pacific (Jakarta)', version: 'Redis 7.2',
    uptimePercent: 99.97, responseTimeMs: 1, p99ResponseTimeMs: 4,
    requestsPerMin: 48_200, errorRatePercent: 0.01,
    lastChecked: '2026-07-18 10:42:00', lastIncident: null,
    description: 'Cache layer untuk session, rate limiting, AI insight cache, dan feed aggregation.',
    connectionPoolUsed: 24, connectionPoolMax: 64,
    recentIncidents: [],
  },
  {
    id: 'SVC-014', name: 'RSS Collector Worker', type: 'Scheduler',
    status: 'Healthy', region: 'Asia Pacific (Jakarta)', version: 'v1.2.1',
    uptimePercent: 99.85, responseTimeMs: 0, p99ResponseTimeMs: 0,
    requestsPerMin: 2, errorRatePercent: 0.5,
    lastChecked: '2026-07-18 10:42:00', lastIncident: '2026-07-10',
    description: 'Worker yang mengumpulkan dan memproses feed RSS dari sumber berita peternakan terpercaya.',
    recentIncidents: [
      { id: 'INC-0312', title: 'RSS source timeout — satu sumber tidak merespons', severity: 'Info', occurredAt: '2026-07-10 04:00', resolvedAt: '2026-07-10 04:15', description: 'Satu sumber RSS timeout, auto-skip dan dilanjutkan ke sumber berikutnya.' },
    ],
  },
  {
    id: 'SVC-015', name: 'Marketplace Escrow Engine', type: 'API Gateway',
    status: 'Maintenance', region: 'Asia Pacific (Jakarta)', version: 'v0.9.2-beta',
    uptimePercent: 94.20, responseTimeMs: 0, p99ResponseTimeMs: 0,
    requestsPerMin: 0, errorRatePercent: 0.0,
    lastChecked: '2026-07-18 10:42:00', lastIncident: '2026-07-18',
    description: 'Engine escrow marketplace dalam maintenance window terjadwal — upgrade ke v1.0.0.',
    recentIncidents: [
      { id: 'INC-0319', title: 'Scheduled maintenance window (OPEN)', severity: 'Info', occurredAt: '2026-07-18 02:00', resolvedAt: null, description: 'Maintenance window terjadwal 02:00–12:00 WIB untuk upgrade Escrow Engine ke v1.0.0.' },
    ],
  },
];

// ─── MON-001: Monitoring Center Foundation ────────────────────────────────────
// New data structures for the full Monitoring Center dashboard.

// ── Summary Stats ─────────────────────────────────────────────────────────────

export interface MonitoringCenterStats {
  activeUsers: number;
  activeUsersDelta: string;
  activeWorkspaces: number;
  activeWorkspacesDelta: string;
  marketplaceTransactionsToday: number;
  marketplaceTransactionsDelta: string;
  backgroundJobsRunning: number;
  backgroundJobsPending: number;
  backgroundJobsFailed: number;
  systemStatus: 'Operational' | 'Partial Outage' | 'Major Outage' | 'Maintenance';
  systemHealthScore: number;
  lastUpdated: string;   // display string — placeholder
}

export const MONITORING_CENTER_STATS: MonitoringCenterStats = {
  activeUsers:                    1_248,
  activeUsersDelta:               '+84 dibanding kemarin',
  activeWorkspaces:               342,
  activeWorkspacesDelta:          '+12 minggu ini',
  marketplaceTransactionsToday:   89,
  marketplaceTransactionsDelta:   '+23% dari rata-rata harian',
  backgroundJobsRunning:          15,
  backgroundJobsPending:           3,
  backgroundJobsFailed:            1,
  systemStatus:                   'Operational',
  systemHealthScore:              97,
  lastUpdated:                    '18 Jul 2026 · 10:42 WIB',   // static placeholder
};

// ── System Health Panels ───────────────────────────────────────────────────────

export type HealthComponentKey = 'database' | 'api' | 'storage' | 'queue' | 'scheduler';

export interface HealthComponentPanel {
  key: HealthComponentKey;
  label: string;
  icon: string;
  status: ServiceStatus;
  serviceId: string;       // links to ADMIN_SERVICE_LIST for detail
  uptimePercent: number;
  latencyDisplay: string;
  detail: string;
}

export const HEALTH_PANELS: HealthComponentPanel[] = [
  {
    key:            'database',
    label:          'Database',
    icon:           '🗄️',
    status:         'Healthy',
    serviceId:      'SVC-002',
    uptimePercent:  99.99,
    latencyDisplay: '3 ms',
    detail:         'PostgreSQL 15.4 — Jakarta · Pool: 84/200',
  },
  {
    key:            'api',
    label:          'API',
    icon:           '🌐',
    status:         'Healthy',
    serviceId:      'SVC-001',
    uptimePercent:  99.98,
    latencyDisplay: '48 ms',
    detail:         'API Gateway v4.2.1 — Jakarta · 12.840 req/min',
  },
  {
    key:            'storage',
    label:          'Storage',
    icon:           '📦',
    status:         'Healthy',
    serviceId:      'SVC-004',
    uptimePercent:  99.97,
    latencyDisplay: '82 ms',
    detail:         'Object Storage — Jakarta · 4.820 GB / 10.000 GB',
  },
  {
    key:            'queue',
    label:          'Queue',
    icon:           '📨',
    status:         'Healthy',
    serviceId:      'SVC-005',
    uptimePercent:  99.96,
    latencyDisplay: '14 ms',
    detail:         'Notification Queue (SQS) — Depth: 142 · 890 msg/min',
  },
  {
    key:            'scheduler',
    label:          'Scheduler',
    icon:           '⏰',
    status:         'Healthy',
    serviceId:      'SVC-012',
    uptimePercent:  99.99,
    latencyDisplay: '—',
    detail:         'Cron Scheduler v1.4.0 — Jakarta · 4 jobs/min',
  },
];

// ── Activity Overview Charts ───────────────────────────────────────────────────

export interface ActivityChartDataset {
  key: string;
  label: string;
  module: string;
  icon: string;
  color: string;
  unit: string;
  labels: string[];   // x-axis labels (last 7 days abbreviated)
  values: number[];   // y-axis values
}

const LAST_7_DAYS = ['12 Jul', '13 Jul', '14 Jul', '15 Jul', '16 Jul', '17 Jul', '18 Jul'];

export const ACTIVITY_CHART_DATASETS: ActivityChartDataset[] = [
  {
    key:    'dau',
    label:  'Daily Active Users',
    module: 'User',
    icon:   '👥',
    color:  '#3b82f6',
    unit:   'pengguna/hari',
    labels: LAST_7_DAYS,
    values: [1_084, 1_102, 1_148, 1_196, 1_221, 1_204, 1_248],
  },
  {
    key:    'workspace',
    label:  'Workspace Activity',
    module: 'Workspace',
    icon:   '🏢',
    color:  '#8b5cf6',
    unit:   'workspace aktif/hari',
    labels: LAST_7_DAYS,
    values: [304, 316, 328, 338, 345, 340, 342],
  },
  {
    key:    'marketplace',
    label:  'Marketplace Activity',
    module: 'Marketplace',
    icon:   '🛒',
    color:  '#10b981',
    unit:   'transaksi/hari',
    labels: LAST_7_DAYS,
    values: [58, 72, 65, 80, 91, 78, 89],
  },
  {
    key:    'livestock',
    label:  'Livestock Records',
    module: 'Ternak',
    icon:   '🐄',
    color:  '#f59e0b',
    unit:   'catatan baru/hari',
    labels: LAST_7_DAYS,
    values: [142, 128, 156, 171, 149, 163, 158],
  },
  {
    key:    'feed',
    label:  'Feed Records',
    module: 'Pakan',
    icon:   '🌾',
    color:  '#f97316',
    unit:   'catatan pakan/hari',
    labels: LAST_7_DAYS,
    values: [84, 91, 79, 103, 98, 110, 96],
  },
  {
    key:    'medicine',
    label:  'Medicine Records',
    module: 'Obat',
    icon:   '💊',
    color:  '#ec4899',
    unit:   'catatan obat/hari',
    labels: LAST_7_DAYS,
    values: [23, 31, 28, 19, 34, 27, 30],
  },
];

// ── Recent Events ─────────────────────────────────────────────────────────────

export type EventSeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
export type EventStatus   = 'Resolved' | 'Open' | 'In Progress' | 'Acknowledged';

export const EVENT_SEVERITY_CONFIG: Record<EventSeverity, { color: string; bg: string; border: string }> = {
  Critical: { color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
  High:     { color: '#d97706', bg: '#fef3c7', border: '#fcd34d' },
  Medium:   { color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd' },
  Low:      { color: '#2563eb', bg: '#dbeafe', border: '#93c5fd' },
  Info:     { color: '#475569', bg: '#f1f5f9', border: '#cbd5e1' },
};

export const EVENT_STATUS_CONFIG: Record<EventStatus, { color: string; bg: string }> = {
  Resolved:     { color: '#059669', bg: '#d1fae5' },
  Open:         { color: '#dc2626', bg: '#fee2e2' },
  'In Progress':{ color: '#d97706', bg: '#fef3c7' },
  Acknowledged: { color: '#7c3aed', bg: '#ede9fe' },
};

export interface MonitoringEventRecord {
  eventId: string;
  module: string;
  moduleIcon: string;
  title: string;
  severity: EventSeverity;
  status: EventStatus;
  timestamp: string;
}

export const RECENT_MONITORING_EVENTS: MonitoringEventRecord[] = [
  { eventId: 'EVT-0318', module: 'AI Service',   moduleIcon: '🤖', title: 'AI inference latency degradation — investigasi ML', severity: 'High',     status: 'In Progress', timestamp: '18 Jul 2026 · 06:20' },
  { eventId: 'EVT-0319', module: 'Marketplace',  moduleIcon: '🛒', title: 'Escrow Engine maintenance window terjadwal',          severity: 'Info',     status: 'In Progress', timestamp: '18 Jul 2026 · 02:00' },
  { eventId: 'EVT-0317', module: 'User',         moduleIcon: '👥', title: 'Login anomali terdeteksi — 3 akun IP asing',          severity: 'Medium',   status: 'Acknowledged', timestamp: '17 Jul 2026 · 22:14' },
  { eventId: 'EVT-0316', module: 'Marketplace',  moduleIcon: '🛒', title: 'Volume transaksi harian 91 — di atas rata-rata',       severity: 'Info',     status: 'Resolved',    timestamp: '16 Jul 2026 · 23:59' },
  { eventId: 'EVT-0315', module: 'Pakan',        moduleIcon: '🌾', title: 'Bulk import stok pakan 1.200+ record berhasil',        severity: 'Info',     status: 'Resolved',    timestamp: '16 Jul 2026 · 14:32' },
  { eventId: 'EVT-0314', module: 'Ternak',       moduleIcon: '🐄', title: 'Duplikasi data livestock terdeteksi — workspace w4',  severity: 'Low',      status: 'Resolved',    timestamp: '15 Jul 2026 · 09:18' },
  { eventId: 'EVT-0313', module: 'Queue',        moduleIcon: '📨', title: 'Notification blast subscription — 8.400 pesan',        severity: 'Low',      status: 'Resolved',    timestamp: '15 Jul 2026 · 08:00' },
  { eventId: 'EVT-0312', module: 'Storage',      moduleIcon: '📦', title: 'Storage write timeout — audit-log bucket',             severity: 'Low',      status: 'Resolved',    timestamp: '12 Jul 2026 · 00:08' },
  { eventId: 'EVT-0311', module: 'Obat',         moduleIcon: '💊', title: 'Batch update master obat selesai — 32 item',           severity: 'Info',     status: 'Resolved',    timestamp: '11 Jul 2026 · 16:45' },
  { eventId: 'EVT-0310', module: 'Workspace',    moduleIcon: '🏢', title: 'Workspace w8 diarsipkan oleh Owner',                  severity: 'Low',      status: 'Resolved',    timestamp: '10 Jul 2026 · 11:20' },
  { eventId: 'EVT-0309', module: 'Email',        moduleIcon: '📧', title: 'Rate limit WA API tercapai — blast notifikasi',        severity: 'Low',      status: 'Resolved',    timestamp: '05 Jul 2026 · 09:40' },
  { eventId: 'EVT-0308', module: 'Database',     moduleIcon: '🗄️', title: 'High connection pool usage — query tidak ter-index',  severity: 'High',     status: 'Resolved',    timestamp: '02 Apr 2026 · 15:10' },
];

// ─── Filter helper ────────────────────────────────────────────────────────────

export function filterServices(
  list: AdminServiceRecord[],
  opts: {
    keyword?: string;
    type?: ServiceType | 'All';
    status?: ServiceStatus | 'All';
  },
): AdminServiceRecord[] {
  return list.filter((r) => {
    const kw = opts.keyword?.toLowerCase();
    if (kw && !r.name.toLowerCase().includes(kw) && !r.id.toLowerCase().includes(kw) && !r.description.toLowerCase().includes(kw)) return false;
    if (opts.type && opts.type !== 'All' && r.type !== opts.type) return false;
    if (opts.status && opts.status !== 'All' && r.status !== opts.status) return false;
    return true;
  });
}
