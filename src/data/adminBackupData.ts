// ─── Backup & Restore Foundation (BAR-001) ────────────────────────────────────
// Realistic dummy data only. No actual backup, restore, cloud storage, or scheduler.

// ─── Types ────────────────────────────────────────────────────────────────────

export type BackupType =
  | 'Full Backup'
  | 'Incremental Backup'
  | 'Workspace Backup'
  | 'System Configuration Backup'
  | 'Media Backup';

export type BackupStatus =
  | 'Scheduled'
  | 'Running'
  | 'Completed'
  | 'Failed'
  | 'Cancelled'
  | 'Restoring';

export type BackupScope = 'Platform' | 'Workspace' | 'System' | 'Media';

export type RestoreStatus = 'Completed' | 'Failed' | 'In Progress' | 'Cancelled';

// ─── Config Maps ──────────────────────────────────────────────────────────────

export const BACKUP_TYPE_CONFIG: Record<
  BackupType,
  { icon: string; color: string; bg: string; border: string; desc: string }
> = {
  'Full Backup':                  { icon: '📦', color: '#1d4ed8', bg: '#dbeafe', border: '#93c5fd', desc: 'Cadangan lengkap seluruh data platform' },
  'Incremental Backup':           { icon: '📈', color: '#0369a1', bg: '#e0f2fe', border: '#7dd3fc', desc: 'Cadangan perubahan sejak backup terakhir' },
  'Workspace Backup':             { icon: '🏢', color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd', desc: 'Cadangan data workspace spesifik' },
  'System Configuration Backup':  { icon: '⚙️',  color: '#374151', bg: '#f3f4f6', border: '#d1d5db', desc: 'Cadangan konfigurasi dan pengaturan sistem' },
  'Media Backup':                 { icon: '🖼️', color: '#b45309', bg: '#fef3c7', border: '#fcd34d', desc: 'Cadangan media: foto ternak, dokumen, attachment' },
};

export const BACKUP_STATUS_CONFIG: Record<
  BackupStatus,
  { label: string; color: string; bg: string; dot: string; border: string }
> = {
  Scheduled:  { label: 'Terjadwal',  color: '#0369a1', bg: '#e0f2fe', dot: '#38bdf8', border: '#7dd3fc' },
  Running:    { label: 'Berjalan',   color: '#d97706', bg: '#fef3c7', dot: '#f59e0b', border: '#fcd34d' },
  Completed:  { label: 'Selesai',    color: '#059669', bg: '#d1fae5', dot: '#10b981', border: '#6ee7b7' },
  Failed:     { label: 'Gagal',      color: '#dc2626', bg: '#fee2e2', dot: '#ef4444', border: '#fca5a5' },
  Cancelled:  { label: 'Dibatalkan', color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af', border: '#d1d5db' },
  Restoring:  { label: 'Restoring',  color: '#7c3aed', bg: '#ede9fe', dot: '#8b5cf6', border: '#c4b5fd' },
};

export const RESTORE_STATUS_CONFIG: Record<
  RestoreStatus,
  { color: string; bg: string; border: string }
> = {
  Completed:    { color: '#059669', bg: '#d1fae5', border: '#6ee7b7' },
  Failed:       { color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
  'In Progress':{ color: '#d97706', bg: '#fef3c7', border: '#fcd34d' },
  Cancelled:    { color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db' },
};

export const BACKUP_SCOPE_CONFIG: Record<
  BackupScope,
  { icon: string; color: string; bg: string }
> = {
  Platform:  { icon: '🌐', color: '#1d4ed8', bg: '#dbeafe' },
  Workspace: { icon: '🏢', color: '#7c3aed', bg: '#ede9fe' },
  System:    { icon: '⚙️', color: '#374151', bg: '#f3f4f6' },
  Media:     { icon: '🖼️', color: '#b45309', bg: '#fef3c7' },
};

// ─── Backup Timeline Event ─────────────────────────────────────────────────────

export interface BackupTimelineEvent {
  timestamp: string;
  event: string;
  detail: string;
  ok: boolean;
}

// ─── Backup Record ─────────────────────────────────────────────────────────────

export interface BackupRecord {
  backupId:        string;
  type:            BackupType;
  scope:           BackupScope;
  workspaceId:     string | null;   // null = platform-wide
  workspaceName:   string | null;
  status:          BackupStatus;
  sizeGb:          number;
  sizeMb:          number;
  createdAt:       string;          // ISO
  completedAt:     string | null;
  durationDisplay: string;          // placeholder e.g. "4m 38s"
  triggeredBy:     string;          // "Otomatis" | "Admin: ..." | "Workspace Owner: ..."
  retentionDays:   number;
  storagePath:     string;          // placeholder path, never real
  checksum:        string;          // dummy SHA-256 prefix
  includedModules: string[];
  notes:           string;
  timeline:        BackupTimelineEvent[];
}

// ─── Restore Record ────────────────────────────────────────────────────────────

export interface RestoreRecord {
  restoreId:    string;
  backupId:     string;
  backupType:   BackupType;
  status:       RestoreStatus;
  requestedBy:  string;
  requestedAt:  string;
  completedAt:  string | null;
  durationDisplay: string;
  targetScope:  string;
  notes:        string;
}

// ─── Summary Stats ─────────────────────────────────────────────────────────────

export interface BackupSummaryStats {
  totalBackups:       number;
  successfulBackups:  number;
  failedBackups:      number;
  storageUsedGb:      number;
  storageTotalGb:     number;
  lastRestoreDate:    string;
  lastRestoreStatus:  RestoreStatus;
  lastBackupDate:     string;      // display string — placeholder
  nextScheduledDate:  string;      // placeholder
}

export const BACKUP_SUMMARY_STATS: BackupSummaryStats = {
  totalBackups:      47,
  successfulBackups: 43,
  failedBackups:      3,
  storageUsedGb:    284,
  storageTotalGb:  1000,
  lastRestoreDate:  '12 Jul 2026',
  lastRestoreStatus:'Completed',
  lastBackupDate:   '18 Jul 2026 · 03:00 WIB',
  nextScheduledDate:'19 Jul 2026 · 03:00 WIB (placeholder)',
};

// ─── Seed Backup Records ───────────────────────────────────────────────────────

export const BACKUP_RECORDS: BackupRecord[] = [
  {
    backupId:        'BKP-20260718-001',
    type:            'Full Backup',
    scope:           'Platform',
    workspaceId:     null,
    workspaceName:   null,
    status:          'Completed',
    sizeGb:          42.7,
    sizeMb:          0,
    createdAt:       '2026-07-18T03:00:00.000Z',
    completedAt:     '2026-07-18T03:04:38.000Z',
    durationDisplay: '4m 38s',
    triggeredBy:     'Otomatis (Scheduler)',
    retentionDays:   30,
    storagePath:     's3://ternakhub-backup/platform/2026-07-18/full/',
    checksum:        'sha256:a3f91c…',
    includedModules: ['Livestock', 'Marketplace', 'Stok Pakan', 'Stok Obat', 'Reproduksi', 'Mutasi', 'Workspace', 'Auth', 'News & Events'],
    notes:           'Full backup rutin harian. Semua modul berhasil dicadangkan.',
    timeline: [
      { timestamp: '2026-07-18 03:00:00', event: 'Dimulai',              detail: 'Scheduler memulai full backup.',                              ok: true  },
      { timestamp: '2026-07-18 03:00:12', event: 'Snapshot Database',    detail: 'PostgreSQL snapshot berhasil diambil.',                       ok: true  },
      { timestamp: '2026-07-18 03:01:45', event: 'Ekspor Data Ternak',   detail: '75 livestock records + pedigree + foto berhasil diekspor.',   ok: true  },
      { timestamp: '2026-07-18 03:02:30', event: 'Ekspor Marketplace',   detail: '342 listing + 89 transaksi berhasil diekspor.',               ok: true  },
      { timestamp: '2026-07-18 03:03:50', event: 'Upload ke Storage',    detail: 'Upload ke S3-compatible bucket berhasil.',                    ok: true  },
      { timestamp: '2026-07-18 03:04:38', event: 'Selesai',              detail: 'Full backup selesai. Checksum diverifikasi.',                 ok: true  },
    ],
  },
  {
    backupId:        'BKP-20260718-002',
    type:            'Incremental Backup',
    scope:           'Platform',
    workspaceId:     null,
    workspaceName:   null,
    status:          'Completed',
    sizeGb:          0,
    sizeMb:          847,
    createdAt:       '2026-07-18T09:00:00.000Z',
    completedAt:     '2026-07-18T09:01:22.000Z',
    durationDisplay: '1m 22s',
    triggeredBy:     'Otomatis (Scheduler)',
    retentionDays:   7,
    storagePath:     's3://ternakhub-backup/platform/2026-07-18/incremental-09h/',
    checksum:        'sha256:b72e44…',
    includedModules: ['Livestock', 'Marketplace', 'Stok Pakan'],
    notes:           'Incremental backup 6-jam. Perubahan sejak 03:00 WIB.',
    timeline: [
      { timestamp: '2026-07-18 09:00:00', event: 'Dimulai',            detail: 'Incremental backup dimulai.',                         ok: true },
      { timestamp: '2026-07-18 09:00:08', event: 'Delta Analysis',     detail: '847 MB perubahan terdeteksi sejak backup terakhir.', ok: true },
      { timestamp: '2026-07-18 09:01:10', event: 'Upload ke Storage',  detail: 'Delta berhasil di-upload.',                          ok: true },
      { timestamp: '2026-07-18 09:01:22', event: 'Selesai',            detail: 'Incremental backup selesai.',                        ok: true },
    ],
  },
  {
    backupId:        'BKP-20260717-001',
    type:            'Full Backup',
    scope:           'Platform',
    workspaceId:     null,
    workspaceName:   null,
    status:          'Completed',
    sizeGb:          41.9,
    sizeMb:          0,
    createdAt:       '2026-07-17T03:00:00.000Z',
    completedAt:     '2026-07-17T03:05:02.000Z',
    durationDisplay: '5m 02s',
    triggeredBy:     'Otomatis (Scheduler)',
    retentionDays:   30,
    storagePath:     's3://ternakhub-backup/platform/2026-07-17/full/',
    checksum:        'sha256:c18f3a…',
    includedModules: ['Livestock', 'Marketplace', 'Stok Pakan', 'Stok Obat', 'Reproduksi', 'Mutasi', 'Workspace', 'Auth', 'News & Events'],
    notes:           'Full backup rutin harian.',
    timeline: [
      { timestamp: '2026-07-17 03:00:00', event: 'Dimulai',           detail: 'Scheduler memulai full backup.', ok: true },
      { timestamp: '2026-07-17 03:05:02', event: 'Selesai',           detail: 'Backup selesai tanpa error.',    ok: true },
    ],
  },
  {
    backupId:        'BKP-20260716-WS-W1',
    type:            'Workspace Backup',
    scope:           'Workspace',
    workspaceId:     'w1',
    workspaceName:   'Berkah Farm Garut',
    status:          'Completed',
    sizeGb:          0,
    sizeMb:          218,
    createdAt:       '2026-07-16T14:30:00.000Z',
    completedAt:     '2026-07-16T14:30:48.000Z',
    durationDisplay: '48s',
    triggeredBy:     'Admin: Super Admin',
    retentionDays:   14,
    storagePath:     's3://ternakhub-backup/workspace/w1/2026-07-16/',
    checksum:        'sha256:d29b7e…',
    includedModules: ['Livestock', 'Batch', 'Pakan', 'Obat', 'Reproduksi', 'Mutasi', 'Profil Farm'],
    notes:           'Backup manual sebelum migrasi data ternak workspace w1.',
    timeline: [
      { timestamp: '2026-07-16 14:30:00', event: 'Dimulai',           detail: 'Admin memulai workspace backup.',          ok: true },
      { timestamp: '2026-07-16 14:30:22', event: 'Ekspor Workspace',  detail: 'Data w1 Berkah Farm Garut diekspor.',      ok: true },
      { timestamp: '2026-07-16 14:30:48', event: 'Selesai',           detail: 'Workspace backup berhasil.',               ok: true },
    ],
  },
  {
    backupId:        'BKP-20260715-CFG',
    type:            'System Configuration Backup',
    scope:           'System',
    workspaceId:     null,
    workspaceName:   null,
    status:          'Completed',
    sizeGb:          0,
    sizeMb:          14,
    createdAt:       '2026-07-15T02:00:00.000Z',
    completedAt:     '2026-07-15T02:00:09.000Z',
    durationDisplay: '9s',
    triggeredBy:     'Otomatis (Scheduler)',
    retentionDays:   90,
    storagePath:     's3://ternakhub-backup/config/2026-07-15/',
    checksum:        'sha256:e54a12…',
    includedModules: ['Feature Flags', 'Subscription Plans', 'Admin Settings', 'Notification Templates', 'Webhook Configs'],
    notes:           'Backup konfigurasi mingguan. Mencakup seluruh pengaturan platform.',
    timeline: [
      { timestamp: '2026-07-15 02:00:00', event: 'Dimulai',           detail: 'Config backup dimulai.',           ok: true },
      { timestamp: '2026-07-15 02:00:09', event: 'Selesai',           detail: 'Config backup selesai (14 MB).',   ok: true },
    ],
  },
  {
    backupId:        'BKP-20260714-MEDIA',
    type:            'Media Backup',
    scope:           'Media',
    workspaceId:     null,
    workspaceName:   null,
    status:          'Completed',
    sizeGb:          128.4,
    sizeMb:          0,
    createdAt:       '2026-07-14T04:00:00.000Z',
    completedAt:     '2026-07-14T04:22:17.000Z',
    durationDisplay: '22m 17s',
    triggeredBy:     'Otomatis (Scheduler)',
    retentionDays:   60,
    storagePath:     's3://ternakhub-backup/media/2026-07-14/',
    checksum:        'sha256:f63c80…',
    includedModules: ['Foto Ternak', 'Dokumen KTP/Sertifikat', 'Foto Marketplace', 'Attachment Berita', 'Galeri Farm'],
    notes:           'Media backup mingguan. Mencakup 48.200+ file media.',
    timeline: [
      { timestamp: '2026-07-14 04:00:00', event: 'Dimulai',         detail: 'Media backup dimulai.',                           ok: true  },
      { timestamp: '2026-07-14 04:00:45', event: 'Inventarisasi',   detail: '48.247 file media teridentifikasi.',               ok: true  },
      { timestamp: '2026-07-14 04:18:30', event: 'Upload Selesai',  detail: '48.247 file berhasil dicadangkan.',                ok: true  },
      { timestamp: '2026-07-14 04:22:17', event: 'Selesai',         detail: 'Media backup selesai. Checksum diverifikasi.',     ok: true  },
    ],
  },
  {
    backupId:        'BKP-20260712-001',
    type:            'Full Backup',
    scope:           'Platform',
    workspaceId:     null,
    workspaceName:   null,
    status:          'Failed',
    sizeGb:          0,
    sizeMb:          0,
    createdAt:       '2026-07-12T03:00:00.000Z',
    completedAt:     null,
    durationDisplay: '2m 11s (gagal)',
    triggeredBy:     'Otomatis (Scheduler)',
    retentionDays:   0,
    storagePath:     '—',
    checksum:        '—',
    includedModules: ['Livestock', 'Marketplace', 'Stok Pakan', 'Stok Obat'],
    notes:           'Gagal karena timeout koneksi ke storage provider saat peak traffic. Retry otomatis berhasil di 03:30.',
    timeline: [
      { timestamp: '2026-07-12 03:00:00', event: 'Dimulai',           detail: 'Scheduler memulai full backup.',                  ok: true  },
      { timestamp: '2026-07-12 03:00:12', event: 'Snapshot Database', detail: 'PostgreSQL snapshot berhasil.',                    ok: true  },
      { timestamp: '2026-07-12 03:02:11', event: 'Gagal',             detail: 'Storage upload timeout setelah 120 detik.',        ok: false },
    ],
  },
  {
    backupId:        'BKP-20260712-001R',
    type:            'Full Backup',
    scope:           'Platform',
    workspaceId:     null,
    workspaceName:   null,
    status:          'Completed',
    sizeGb:          40.8,
    sizeMb:          0,
    createdAt:       '2026-07-12T03:30:00.000Z',
    completedAt:     '2026-07-12T03:34:55.000Z',
    durationDisplay: '4m 55s',
    triggeredBy:     'Otomatis (Retry)',
    retentionDays:   30,
    storagePath:     's3://ternakhub-backup/platform/2026-07-12/full-retry/',
    checksum:        'sha256:g71d5b…',
    includedModules: ['Livestock', 'Marketplace', 'Stok Pakan', 'Stok Obat', 'Reproduksi', 'Mutasi', 'Workspace', 'Auth', 'News & Events'],
    notes:           'Retry otomatis setelah kegagalan BKP-20260712-001. Berhasil.',
    timeline: [
      { timestamp: '2026-07-12 03:30:00', event: 'Retry Dimulai', detail: 'Retry otomatis dipicu setelah kegagalan.',   ok: true },
      { timestamp: '2026-07-12 03:34:55', event: 'Selesai',       detail: 'Full backup berhasil pada percobaan kedua.', ok: true },
    ],
  },
  {
    backupId:        'BKP-20260710-WS-W2',
    type:            'Workspace Backup',
    scope:           'Workspace',
    workspaceId:     'w2',
    workspaceName:   'Berkah Farm Tasik',
    status:          'Completed',
    sizeGb:          0,
    sizeMb:          94,
    createdAt:       '2026-07-10T10:00:00.000Z',
    completedAt:     '2026-07-10T10:00:22.000Z',
    durationDisplay: '22s',
    triggeredBy:     'Workspace Owner: Budi Santoso',
    retentionDays:   14,
    storagePath:     's3://ternakhub-backup/workspace/w2/2026-07-10/',
    checksum:        'sha256:h84f6c…',
    includedModules: ['Livestock', 'Pakan', 'Reproduksi', 'Profil Farm'],
    notes:           'Backup manual diminta oleh Owner workspace w2.',
    timeline: [
      { timestamp: '2026-07-10 10:00:00', event: 'Dimulai', detail: 'Owner meminta workspace backup.', ok: true },
      { timestamp: '2026-07-10 10:00:22', event: 'Selesai', detail: 'Workspace backup w2 selesai.',    ok: true },
    ],
  },
  {
    backupId:        'BKP-20260707-001',
    type:            'Full Backup',
    scope:           'Platform',
    workspaceId:     null,
    workspaceName:   null,
    status:          'Completed',
    sizeGb:          39.2,
    sizeMb:          0,
    createdAt:       '2026-07-07T03:00:00.000Z',
    completedAt:     '2026-07-07T03:04:20.000Z',
    durationDisplay: '4m 20s',
    triggeredBy:     'Otomatis (Scheduler)',
    retentionDays:   30,
    storagePath:     's3://ternakhub-backup/platform/2026-07-07/full/',
    checksum:        'sha256:i92g4d…',
    includedModules: ['Livestock', 'Marketplace', 'Stok Pakan', 'Stok Obat', 'Reproduksi', 'Mutasi', 'Workspace', 'Auth', 'News & Events'],
    notes:           'Full backup rutin mingguan (Senin).',
    timeline: [
      { timestamp: '2026-07-07 03:00:00', event: 'Dimulai', detail: 'Full backup mingguan.', ok: true },
      { timestamp: '2026-07-07 03:04:20', event: 'Selesai', detail: 'Selesai tanpa error.',  ok: true },
    ],
  },
  {
    backupId:        'BKP-20260705-001',
    type:            'Incremental Backup',
    scope:           'Platform',
    workspaceId:     null,
    workspaceName:   null,
    status:          'Cancelled',
    sizeGb:          0,
    sizeMb:          0,
    createdAt:       '2026-07-05T09:00:00.000Z',
    completedAt:     null,
    durationDisplay: '0m 12s (dibatalkan)',
    triggeredBy:     'Otomatis (Scheduler)',
    retentionDays:   0,
    storagePath:     '—',
    checksum:        '—',
    includedModules: [],
    notes:           'Dibatalkan otomatis karena maintenance window Escrow Engine sedang berjalan.',
    timeline: [
      { timestamp: '2026-07-05 09:00:00', event: 'Dimulai',    detail: 'Incremental backup dimulai.',                              ok: true  },
      { timestamp: '2026-07-05 09:00:12', event: 'Dibatalkan', detail: 'Deteksi konflik maintenance window. Auto-cancel.',         ok: false },
    ],
  },
  {
    backupId:        'BKP-20260701-CFG',
    type:            'System Configuration Backup',
    scope:           'System',
    workspaceId:     null,
    workspaceName:   null,
    status:          'Completed',
    sizeGb:          0,
    sizeMb:          13,
    createdAt:       '2026-07-01T02:00:00.000Z',
    completedAt:     '2026-07-01T02:00:08.000Z',
    durationDisplay: '8s',
    triggeredBy:     'Otomatis (Scheduler)',
    retentionDays:   90,
    storagePath:     's3://ternakhub-backup/config/2026-07-01/',
    checksum:        'sha256:j45h2a…',
    includedModules: ['Feature Flags', 'Subscription Plans', 'Admin Settings', 'Notification Templates'],
    notes:           'Backup konfigurasi mingguan.',
    timeline: [
      { timestamp: '2026-07-01 02:00:00', event: 'Dimulai', detail: 'Config backup otomatis.', ok: true },
      { timestamp: '2026-07-01 02:00:08', event: 'Selesai', detail: 'Config backup selesai.',  ok: true },
    ],
  },
  {
    backupId:        'BKP-20260625-MEDIA',
    type:            'Media Backup',
    scope:           'Media',
    workspaceId:     null,
    workspaceName:   null,
    status:          'Failed',
    sizeGb:          0,
    sizeMb:          0,
    createdAt:       '2026-06-25T04:00:00.000Z',
    completedAt:     null,
    durationDisplay: '8m 03s (gagal)',
    triggeredBy:     'Otomatis (Scheduler)',
    retentionDays:   0,
    storagePath:     '—',
    checksum:        '—',
    includedModules: ['Foto Ternak', 'Dokumen', 'Foto Marketplace'],
    notes:           'Gagal karena insufficient storage quota. Admin perlu menambah kapasitas storage.',
    timeline: [
      { timestamp: '2026-06-25 04:00:00', event: 'Dimulai',          detail: 'Media backup dimulai.',                          ok: true  },
      { timestamp: '2026-06-25 04:00:50', event: 'Inventarisasi',    detail: '47.890 file media teridentifikasi.',              ok: true  },
      { timestamp: '2026-06-25 04:08:03', event: 'Gagal',            detail: 'Storage quota habis — upload terhenti.',         ok: false },
    ],
  },
  {
    backupId:        'BKP-20260620-WS-W7',
    type:            'Workspace Backup',
    scope:           'Workspace',
    workspaceId:     'w7',
    workspaceName:   'Toko Pakan Berkah Tani',
    status:          'Completed',
    sizeGb:          0,
    sizeMb:          51,
    createdAt:       '2026-06-20T11:00:00.000Z',
    completedAt:     '2026-06-20T11:00:18.000Z',
    durationDisplay: '18s',
    triggeredBy:     'Admin: Super Admin',
    retentionDays:   14,
    storagePath:     's3://ternakhub-backup/workspace/w7/2026-06-20/',
    checksum:        'sha256:k37i9b…',
    includedModules: ['Katalog Produk', 'Area Layanan', 'Aktivitas Toko'],
    notes:           'Backup sebelum workspace w7 onboarding selesai.',
    timeline: [
      { timestamp: '2026-06-20 11:00:00', event: 'Dimulai', detail: 'Workspace backup dimulai.', ok: true },
      { timestamp: '2026-06-20 11:00:18', event: 'Selesai', detail: 'Backup w7 selesai.',        ok: true },
    ],
  },
  {
    backupId:        'BKP-20260618-001',
    type:            'Incremental Backup',
    scope:           'Platform',
    workspaceId:     null,
    workspaceName:   null,
    status:          'Scheduled',
    sizeGb:          0,
    sizeMb:          0,
    createdAt:       '2026-07-19T03:00:00.000Z',
    completedAt:     null,
    durationDisplay: '—',
    triggeredBy:     'Otomatis (Scheduler)',
    retentionDays:   7,
    storagePath:     '—',
    checksum:        '—',
    includedModules: [],
    notes:           'Backup terjadwal otomatis — belum dieksekusi.',
    timeline: [],
  },
];

// ─── Seed Restore Records ──────────────────────────────────────────────────────

export const RESTORE_RECORDS: RestoreRecord[] = [
  {
    restoreId:       'RST-20260712-001',
    backupId:        'BKP-20260710-WS-W2',
    backupType:      'Workspace Backup',
    status:          'Completed',
    requestedBy:     'Admin: Super Admin',
    requestedAt:     '2026-07-12T08:00:00.000Z',
    completedAt:     '2026-07-12T08:01:14.000Z',
    durationDisplay: '1m 14s',
    targetScope:     'Workspace w2 — Berkah Farm Tasik',
    notes:           'Restore setelah penghapusan data livestock secara tidak sengaja oleh anggota workspace.',
  },
  {
    restoreId:       'RST-20260705-001',
    backupId:        'BKP-20260701-CFG',
    backupType:      'System Configuration Backup',
    status:          'Completed',
    requestedBy:     'Admin: Super Admin',
    requestedAt:     '2026-07-05T15:30:00.000Z',
    completedAt:     '2026-07-05T15:30:11.000Z',
    durationDisplay: '11s',
    targetScope:     'Platform — System Configuration',
    notes:           'Rollback konfigurasi setelah percobaan update feature flags yang menyebabkan error.',
  },
  {
    restoreId:       'RST-20260628-001',
    backupId:        'BKP-20260625-MEDIA',
    backupType:      'Media Backup',
    status:          'Failed',
    requestedBy:     'Admin: Super Admin',
    requestedAt:     '2026-06-28T09:00:00.000Z',
    completedAt:     null,
    durationDisplay: '3m 45s (gagal)',
    targetScope:     'Platform — Media Storage',
    notes:           'Gagal karena source backup tidak lengkap (backup asal gagal). Gunakan backup dari 14 Jul.',
  },
  {
    restoreId:       'RST-20260615-001',
    backupId:        'BKP-20260614-001',
    backupType:      'Full Backup',
    status:          'Completed',
    requestedBy:     'Admin: Super Admin',
    requestedAt:     '2026-06-15T03:00:00.000Z',
    completedAt:     '2026-06-15T03:12:48.000Z',
    durationDisplay: '12m 48s',
    targetScope:     'Platform — Full Restore',
    notes:           'Disaster recovery drill bulanan. Semua data berhasil dipulihkan ke lingkungan staging.',
  },
  {
    restoreId:       'RST-20260601-001',
    backupId:        'BKP-20260531-WS-W1',
    backupType:      'Workspace Backup',
    status:          'Completed',
    requestedBy:     'Workspace Owner: Budi Santoso',
    requestedAt:     '2026-06-01T14:00:00.000Z',
    completedAt:     '2026-06-01T14:00:58.000Z',
    durationDisplay: '58s',
    targetScope:     'Workspace w1 — Berkah Farm Garut',
    notes:           'Restore data batch livestock yang terhapus akibat bug import.',
  },
  {
    restoreId:       'RST-20260520-001',
    backupId:        'BKP-20260519-CFG',
    backupType:      'System Configuration Backup',
    status:          'Cancelled',
    requestedBy:     'Admin: Super Admin',
    requestedAt:     '2026-05-20T10:00:00.000Z',
    completedAt:     null,
    durationDisplay: '0s (dibatalkan)',
    targetScope:     'Platform — System Configuration',
    notes:           'Dibatalkan setelah tim menemukan solusi lain tanpa perlu rollback.',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatSizeBAR(record: BackupRecord): string {
  if (record.sizeGb > 0)   return `${record.sizeGb.toLocaleString('id-ID')} GB`;
  if (record.sizeMb > 0)   return `${record.sizeMb.toLocaleString('id-ID')} MB`;
  return '—';
}

export function formatDateBAR(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function formatDateTimeBAR(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function filterBackups(
  list: BackupRecord[],
  opts: { keyword?: string; type?: BackupType | 'All'; status?: BackupStatus | 'All'; scope?: BackupScope | 'All' },
): BackupRecord[] {
  return list.filter((r) => {
    const kw = opts.keyword?.toLowerCase();
    if (kw && !r.backupId.toLowerCase().includes(kw) && !r.type.toLowerCase().includes(kw) && !r.notes.toLowerCase().includes(kw) && !(r.workspaceName ?? '').toLowerCase().includes(kw)) return false;
    if (opts.type   && opts.type   !== 'All' && r.type   !== opts.type)   return false;
    if (opts.status && opts.status !== 'All' && r.status !== opts.status) return false;
    if (opts.scope  && opts.scope  !== 'All' && r.scope  !== opts.scope)  return false;
    return true;
  });
}
