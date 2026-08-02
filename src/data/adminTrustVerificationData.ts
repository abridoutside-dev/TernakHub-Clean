// ─── Admin Trust & Verification Data — TV-001 ────────────────────────────────
// Foundation architecture for evidence-based trust measurement.
// Read-only dummy data only. No scoring logic. No verification engine.
// Trust must be explainable — every indicator requires supporting evidence.

// ─── Types ────────────────────────────────────────────────────────────────────

/** Six supported verification types — architecture only. */
export type TVVerificationType =
  | 'Identity Verification'
  | 'Workspace Verification'
  | 'Livestock Verification'
  | 'Veterinary Verification'
  | 'Document Verification'
  | 'Marketplace Verification';

/** Six trust statuses — no partial or implicit states allowed. */
export type TVTrustStatus =
  | 'Not Verified'
  | 'Pending'
  | 'Partially Verified'
  | 'Verified'
  | 'Suspended'
  | 'Revoked';

/** What the verification record is about. */
export type TVSubjectType =
  | 'User'
  | 'Workspace'
  | 'Livestock'
  | 'Veterinarian'
  | 'Document'
  | 'Listing';

// ─── Sub-entities ─────────────────────────────────────────────────────────────

/**
 * A single piece of evidence submitted for verification.
 * Placeholder — real file/hash references live in a future storage module.
 */
export interface TVEvidenceItem {
  evidenceId: string;
  type: string;            // e.g. "KTP", "Selfie", "Sertifikat Dokter Hewan"
  label: string;
  status: 'Submitted' | 'Pending' | 'Verified' | 'Rejected' | 'Missing';
  submittedDate: string | null;
  notes: string;
}

/** One entry in the verification status history. */
export interface TVStatusHistoryEvent {
  id: string;
  date: string;
  previousStatus: TVTrustStatus | null;
  newStatus: TVTrustStatus;
  actor: string;
  reason: string;
  icon: string;
  color: string;
}

/** One entry in the overall timeline of this verification record. */
export interface TVTimelineEvent {
  id: string;
  date: string;
  event: string;
  actor: string;
  icon: string;
  color: string;
}

/**
 * A trust indicator — a specific verifiable claim.
 * Every indicator MUST have at least one supporting piece of evidence.
 * No scoring is computed here; indicators are architecture placeholders.
 */
export interface TVTrustIndicator {
  indicatorId: string;
  label: string;
  category: 'Identity' | 'Credential' | 'Compliance' | 'Activity' | 'Reputation';
  hasEvidence: boolean;
  evidenceCount: number;
  notes: string;
}

/** Immutable audit trail entry — records every state change. */
export interface TVAuditEntry {
  id: string;
  date: string;
  action: string;
  actor: string;
  field: string;
  previousValue: string | null;
  newValue: string;
  ipAddress: string;
}

// ─── Main Verification Record ─────────────────────────────────────────────────

export interface TVVerificationRecord {
  /** Permanent verification ID — format TV-VRF-NNN. */
  verificationId: string;

  subjectType: TVSubjectType;
  subjectId: string;
  subjectName: string;
  subjectDescription: string;
  subjectIcon: string;
  subjectBg: string;

  workspaceId: string;
  workspaceName: string;
  ownerName: string;

  verificationType: TVVerificationType;
  status: TVTrustStatus;

  submittedDate: string;
  lastUpdatedDate: string;

  reviewer: string | null;
  reviewedDate: string | null;

  notes: string;

  /** Evidence items — each maps to a physical document or data record. */
  evidence: TVEvidenceItem[];

  /** Full history of status transitions — immutable append-only. */
  statusHistory: TVStatusHistoryEvent[];

  /** Chronological activity log for this verification record. */
  timeline: TVTimelineEvent[];

  /**
   * Trust indicators — explainable claims backed by evidence.
   * No score computed here; architecture only.
   */
  trustIndicators: TVTrustIndicator[];

  /** Immutable audit trail for compliance. */
  auditTrail: TVAuditEntry[];

  /** Convenience totals — derived, never stored separately. */
  evidenceCount: number;
  verificationHistoryCount: number;
}

// ─── Platform Statistics ──────────────────────────────────────────────────────

export interface TVPlatformStats {
  totalVerified: number;
  pending: number;
  partiallyVerified: number;
  suspended: number;
  revoked: number;
  notVerified: number;
  totalRecords: number;
  typeBreakdown: Record<TVVerificationType, number>;
}

// ─── Config Maps ──────────────────────────────────────────────────────────────

export const TV_STATUS_CONFIG: Record<
  TVTrustStatus,
  { label: string; bg: string; color: string; dot: string; icon: string }
> = {
  'Not Verified':      { label: 'Belum Diverifikasi', bg: '#f1f5f9', color: '#475569', dot: '#94a3b8', icon: '⚪' },
  Pending:             { label: 'Menunggu',            bg: '#fef3c7', color: '#92400e', dot: '#d97706', icon: '⏳' },
  'Partially Verified':{ label: 'Sebagian Terverifikasi', bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6', icon: '🔵' },
  Verified:            { label: 'Terverifikasi',       bg: '#d1fae5', color: '#065f46', dot: '#059669', icon: '✅' },
  Suspended:           { label: 'Ditangguhkan',        bg: '#ede9fe', color: '#5b21b6', dot: '#8b5cf6', icon: '🚫' },
  Revoked:             { label: 'Dicabut',             bg: '#fee2e2', color: '#991b1b', dot: '#ef4444', icon: '❌' },
};

export const TV_TYPE_CONFIG: Record<
  TVVerificationType,
  { icon: string; bg: string; color: string; short: string }
> = {
  'Identity Verification':   { icon: '🪪', bg: '#dbeafe', color: '#1e40af', short: 'Identitas' },
  'Workspace Verification':  { icon: '🏢', bg: '#fef3c7', color: '#92400e', short: 'Workspace' },
  'Livestock Verification':  { icon: '🐄', bg: '#d1fae5', color: '#065f46', short: 'Ternak' },
  'Veterinary Verification': { icon: '👨‍⚕️', bg: '#ede9fe', color: '#5b21b6', short: 'Veteriner' },
  'Document Verification':   { icon: '📄', bg: '#e0f2fe', color: '#0369a1', short: 'Dokumen' },
  'Marketplace Verification':{ icon: '🛒', bg: '#fce7f3', color: '#9d174d', short: 'Marketplace' },
};

export const TV_SUBJECT_CONFIG: Record<
  TVSubjectType,
  { icon: string; bg: string; color: string }
> = {
  User:         { icon: '👤', bg: '#dbeafe', color: '#1e40af' },
  Workspace:    { icon: '🏢', bg: '#fef3c7', color: '#92400e' },
  Livestock:    { icon: '🐄', bg: '#d1fae5', color: '#065f46' },
  Veterinarian: { icon: '👨‍⚕️', bg: '#ede9fe', color: '#5b21b6' },
  Document:     { icon: '📄', bg: '#e0f2fe', color: '#0369a1' },
  Listing:      { icon: '🛒', bg: '#fce7f3', color: '#9d174d' },
};

export const TV_EVIDENCE_STATUS_CONFIG: Record<
  TVEvidenceItem['status'],
  { label: string; bg: string; color: string }
> = {
  Submitted: { label: 'Dikirim',     bg: '#dbeafe', color: '#1e40af' },
  Pending:   { label: 'Menunggu',    bg: '#fef3c7', color: '#92400e' },
  Verified:  { label: 'Valid',       bg: '#d1fae5', color: '#065f46' },
  Rejected:  { label: 'Ditolak',     bg: '#fee2e2', color: '#991b1b' },
  Missing:   { label: 'Tidak Ada',   bg: '#f1f5f9', color: '#94a3b8' },
};

// ─── Dummy Verification Records (12) ─────────────────────────────────────────

export const TV_VERIFICATION_LIST: TVVerificationRecord[] = [
  // ── 1. Identity Verification — Budi Santoso (Verified) ───────────────────
  {
    verificationId:    'TV-VRF-001',
    subjectType:       'User',
    subjectId:         'USR-BS-001',
    subjectName:       'Budi Santoso',
    subjectDescription:'Peternak sapi — Peternakan Maju Jaya',
    subjectIcon:       '👤',
    subjectBg:         '#dbeafe',
    workspaceId:       'WS-001',
    workspaceName:     'Peternakan Maju Jaya',
    ownerName:         'Budi Santoso',
    verificationType:  'Identity Verification',
    status:            'Verified',
    submittedDate:     '2024-01-10',
    lastUpdatedDate:   '2024-01-13',
    reviewer:          'admin@ternakhub.id',
    reviewedDate:      '2024-01-13',
    notes:             'Identitas lengkap dan valid. KTP asli terverifikasi.',
    evidence: [
      { evidenceId: 'EV-001-A', type: 'KTP', label: 'Kartu Tanda Penduduk', status: 'Verified', submittedDate: '2024-01-10', notes: 'NIK valid, foto sesuai wajah.' },
      { evidenceId: 'EV-001-B', type: 'Selfie', label: 'Foto Diri dengan KTP', status: 'Verified', submittedDate: '2024-01-10', notes: 'Wajah sesuai dengan foto KTP.' },
      { evidenceId: 'EV-001-C', type: 'NPWP', label: 'Nomor Pokok Wajib Pajak', status: 'Verified', submittedDate: '2024-01-11', notes: 'NPWP aktif, terdaftar atas nama yang sama.' },
    ],
    statusHistory: [
      { id: 'SH-001-1', date: '2024-01-10', previousStatus: null, newStatus: 'Pending', actor: 'Budi Santoso', reason: 'Pengajuan awal verifikasi identitas.', icon: '📨', color: '#3b82f6' },
      { id: 'SH-001-2', date: '2024-01-13', previousStatus: 'Pending', newStatus: 'Verified', actor: 'admin@ternakhub.id', reason: 'Semua dokumen identitas valid dan sesuai.', icon: '✅', color: '#059669' },
    ],
    timeline: [
      { id: 'TL-001-1', date: '2024-01-10', event: 'Pengajuan verifikasi dikirim', actor: 'Budi Santoso', icon: '📨', color: '#3b82f6' },
      { id: 'TL-001-2', date: '2024-01-11', event: 'NPWP ditambahkan sebagai bukti', actor: 'Budi Santoso', icon: '📄', color: '#6366f1' },
      { id: 'TL-001-3', date: '2024-01-12', event: 'Review dimulai oleh admin', actor: 'admin@ternakhub.id', icon: '🔍', color: '#f59e0b' },
      { id: 'TL-001-4', date: '2024-01-13', event: 'Verifikasi disetujui', actor: 'admin@ternakhub.id', icon: '✅', color: '#059669' },
    ],
    trustIndicators: [
      { indicatorId: 'TI-001-A', label: 'Identitas Pemerintah Valid', category: 'Identity', hasEvidence: true, evidenceCount: 2, notes: 'KTP + Selfie cocok.' },
      { indicatorId: 'TI-001-B', label: 'Status Pajak Aktif', category: 'Compliance', hasEvidence: true, evidenceCount: 1, notes: 'NPWP terdaftar dan aktif.' },
      { indicatorId: 'TI-001-C', label: 'Konsistensi Data', category: 'Identity', hasEvidence: true, evidenceCount: 3, notes: 'Nama, NIK, dan NPWP konsisten di semua dokumen.' },
    ],
    auditTrail: [
      { id: 'AT-001-1', date: '2024-01-10T09:15:00', action: 'SUBMIT', actor: 'Budi Santoso', field: 'status', previousValue: null, newValue: 'Pending', ipAddress: '103.xx.xx.45' },
      { id: 'AT-001-2', date: '2024-01-13T14:22:00', action: 'APPROVE', actor: 'admin@ternakhub.id', field: 'status', previousValue: 'Pending', newValue: 'Verified', ipAddress: '202.xx.xx.10' },
    ],
    evidenceCount: 3,
    verificationHistoryCount: 2,
  },

  // ── 2. Workspace Verification — Peternakan Maju Jaya (Verified) ───────────
  {
    verificationId:    'TV-VRF-002',
    subjectType:       'Workspace',
    subjectId:         'WS-001',
    subjectName:       'Peternakan Maju Jaya',
    subjectDescription:'Peternakan sapi — Jawa Tengah',
    subjectIcon:       '🏢',
    subjectBg:         '#fef3c7',
    workspaceId:       'WS-001',
    workspaceName:     'Peternakan Maju Jaya',
    ownerName:         'Budi Santoso',
    verificationType:  'Workspace Verification',
    status:            'Verified',
    submittedDate:     '2024-02-01',
    lastUpdatedDate:   '2024-02-05',
    reviewer:          'superadmin@ternakhub.id',
    reviewedDate:      '2024-02-05',
    notes:             'Workspace usaha sah dan beroperasi aktif.',
    evidence: [
      { evidenceId: 'EV-002-A', type: 'SIUP', label: 'Surat Izin Usaha Peternakan', status: 'Verified', submittedDate: '2024-02-01', notes: 'SIUP aktif, diterbitkan Dinas Peternakan Kab. Boyolali.' },
      { evidenceId: 'EV-002-B', type: 'NPWP', label: 'NPWP Badan Usaha', status: 'Verified', submittedDate: '2024-02-01', notes: 'Terdaftar sebagai badan usaha aktif.' },
      { evidenceId: 'EV-002-C', type: 'Akta Usaha', label: 'Akta Pendirian Usaha', status: 'Verified', submittedDate: '2024-02-02', notes: 'Akta notaris sah, dicap Kemenkumham.' },
      { evidenceId: 'EV-002-D', type: 'Foto Lokasi', label: 'Foto Kandang & Lokasi', status: 'Verified', submittedDate: '2024-02-03', notes: 'Lokasi sesuai alamat terdaftar.' },
    ],
    statusHistory: [
      { id: 'SH-002-1', date: '2024-02-01', previousStatus: null, newStatus: 'Pending', actor: 'Budi Santoso', reason: 'Pengajuan verifikasi workspace.', icon: '📨', color: '#3b82f6' },
      { id: 'SH-002-2', date: '2024-02-04', previousStatus: 'Pending', newStatus: 'Partially Verified', actor: 'superadmin@ternakhub.id', reason: 'SIUP + NPWP valid, menunggu akta usaha.', icon: '🔵', color: '#3b82f6' },
      { id: 'SH-002-3', date: '2024-02-05', previousStatus: 'Partially Verified', newStatus: 'Verified', actor: 'superadmin@ternakhub.id', reason: 'Semua dokumen valid.', icon: '✅', color: '#059669' },
    ],
    timeline: [
      { id: 'TL-002-1', date: '2024-02-01', event: 'Pengajuan verifikasi workspace', actor: 'Budi Santoso', icon: '📨', color: '#3b82f6' },
      { id: 'TL-002-2', date: '2024-02-04', event: 'Status: Sebagian Terverifikasi', actor: 'superadmin@ternakhub.id', icon: '🔵', color: '#3b82f6' },
      { id: 'TL-002-3', date: '2024-02-05', event: 'Verifikasi penuh disetujui', actor: 'superadmin@ternakhub.id', icon: '✅', color: '#059669' },
    ],
    trustIndicators: [
      { indicatorId: 'TI-002-A', label: 'Izin Usaha Sah', category: 'Compliance', hasEvidence: true, evidenceCount: 1, notes: 'SIUP aktif dari instansi berwenang.' },
      { indicatorId: 'TI-002-B', label: 'Badan Hukum Terdaftar', category: 'Credential', hasEvidence: true, evidenceCount: 2, notes: 'Akta + NPWP badan usaha.' },
      { indicatorId: 'TI-002-C', label: 'Lokasi Terverifikasi', category: 'Identity', hasEvidence: true, evidenceCount: 1, notes: 'Foto lokasi cocok dengan alamat pendaftaran.' },
    ],
    auditTrail: [
      { id: 'AT-002-1', date: '2024-02-01T10:00:00', action: 'SUBMIT', actor: 'Budi Santoso', field: 'status', previousValue: null, newValue: 'Pending', ipAddress: '103.xx.xx.45' },
      { id: 'AT-002-2', date: '2024-02-04T11:30:00', action: 'PARTIAL_VERIFY', actor: 'superadmin@ternakhub.id', field: 'status', previousValue: 'Pending', newValue: 'Partially Verified', ipAddress: '202.xx.xx.10' },
      { id: 'AT-002-3', date: '2024-02-05T09:15:00', action: 'APPROVE', actor: 'superadmin@ternakhub.id', field: 'status', previousValue: 'Partially Verified', newValue: 'Verified', ipAddress: '202.xx.xx.10' },
    ],
    evidenceCount: 4,
    verificationHistoryCount: 3,
  },

  // ── 3. Livestock Verification — Rajawali (Pending) ────────────────────────
  {
    verificationId:    'TV-VRF-003',
    subjectType:       'Livestock',
    subjectId:         'LS-CWL-001',
    subjectName:       'Rajawali',
    subjectDescription:'Sapi Limosin × Simmental, Jantan — WS-001',
    subjectIcon:       '🐄',
    subjectBg:         '#d1fae5',
    workspaceId:       'WS-001',
    workspaceName:     'Peternakan Maju Jaya',
    ownerName:         'Budi Santoso',
    verificationType:  'Livestock Verification',
    status:            'Pending',
    submittedDate:     '2025-03-02',
    lastUpdatedDate:   '2025-03-05',
    reviewer:          null,
    reviewedDate:      null,
    notes:             'Menunggu pemeriksaan fisik dan konfirmasi silsilah dari Farm Berkah Mandiri.',
    evidence: [
      { evidenceId: 'EV-003-A', type: 'Foto Ternak', label: 'Foto Tubuh Penuh', status: 'Submitted', submittedDate: '2025-03-02', notes: 'Foto dari 4 sudut.' },
      { evidenceId: 'EV-003-B', type: 'Sertifikat Kelahiran', label: 'Sertifikat Kelahiran Ternak', status: 'Pending', submittedDate: null, notes: 'Menunggu dokumen dari pemilik induk.' },
      { evidenceId: 'EV-003-C', type: 'Rekam Medis', label: 'Riwayat Kesehatan Ternak', status: 'Submitted', submittedDate: '2025-03-03', notes: '3 catatan kesehatan terlampir.' },
      { evidenceId: 'EV-003-D', type: 'Konfirmasi Silsilah', label: 'Konfirmasi Silsilah Lintas-WS', status: 'Pending', submittedDate: null, notes: 'Menunggu konfirmasi Farm Berkah Mandiri.' },
    ],
    statusHistory: [
      { id: 'SH-003-1', date: '2025-03-02', previousStatus: null, newStatus: 'Pending', actor: 'Budi Santoso', reason: 'Pengajuan verifikasi ternak.', icon: '📨', color: '#3b82f6' },
    ],
    timeline: [
      { id: 'TL-003-1', date: '2025-03-02', event: 'Pengajuan verifikasi ternak', actor: 'Budi Santoso', icon: '📨', color: '#3b82f6' },
      { id: 'TL-003-2', date: '2025-03-03', event: 'Riwayat kesehatan diunggah', actor: 'Budi Santoso', icon: '🩺', color: '#6366f1' },
      { id: 'TL-003-3', date: '2025-03-05', event: 'Permintaan konfirmasi silsilah dikirim', actor: 'Sistem', icon: '🌐', color: '#8b5cf6' },
    ],
    trustIndicators: [
      { indicatorId: 'TI-003-A', label: 'Identitas Ternak Valid', category: 'Identity', hasEvidence: true, evidenceCount: 1, notes: 'Foto ternak tersedia.' },
      { indicatorId: 'TI-003-B', label: 'Riwayat Kesehatan Ada', category: 'Activity', hasEvidence: true, evidenceCount: 1, notes: 'Rekam medis terlampir.' },
      { indicatorId: 'TI-003-C', label: 'Silsilah Terverifikasi', category: 'Credential', hasEvidence: false, evidenceCount: 0, notes: 'Menunggu konfirmasi lintas-workspace.' },
    ],
    auditTrail: [
      { id: 'AT-003-1', date: '2025-03-02T08:00:00', action: 'SUBMIT', actor: 'Budi Santoso', field: 'status', previousValue: null, newValue: 'Pending', ipAddress: '103.xx.xx.45' },
    ],
    evidenceCount: 2,
    verificationHistoryCount: 1,
  },

  // ── 4. Veterinary Verification — Dr. Maya Dewi (Verified) ────────────────
  {
    verificationId:    'TV-VRF-004',
    subjectType:       'Veterinarian',
    subjectId:         'VET-MD-001',
    subjectName:       'Dr. Maya Dewi, drh.',
    subjectDescription:'Dokter Hewan — Klinik Hewan Sehat Sentosa',
    subjectIcon:       '👨‍⚕️',
    subjectBg:         '#ede9fe',
    workspaceId:       'WS-004',
    workspaceName:     'Klinik Hewan Sehat Sentosa',
    ownerName:         'Dr. Maya Dewi',
    verificationType:  'Veterinary Verification',
    status:            'Verified',
    submittedDate:     '2023-11-15',
    lastUpdatedDate:   '2023-11-20',
    reviewer:          'superadmin@ternakhub.id',
    reviewedDate:      '2023-11-20',
    notes:             'Dokter hewan terdaftar aktif di PDHI. Semua kredensial valid.',
    evidence: [
      { evidenceId: 'EV-004-A', type: 'STR', label: 'Surat Tanda Registrasi Dokter Hewan', status: 'Verified', submittedDate: '2023-11-15', notes: 'STR aktif, diterbitkan PDHI 2023.' },
      { evidenceId: 'EV-004-B', type: 'Ijazah', label: 'Ijazah Profesi Dokter Hewan', status: 'Verified', submittedDate: '2023-11-15', notes: 'Ijazah drh. dari Universitas Gadjah Mada.' },
      { evidenceId: 'EV-004-C', type: 'SIP', label: 'Surat Izin Praktik', status: 'Verified', submittedDate: '2023-11-16', notes: 'SIP berlaku hingga Desember 2025.' },
      { evidenceId: 'EV-004-D', type: 'KTP', label: 'Kartu Tanda Penduduk', status: 'Verified', submittedDate: '2023-11-15', notes: 'Identitas sesuai data PDHI.' },
    ],
    statusHistory: [
      { id: 'SH-004-1', date: '2023-11-15', previousStatus: null, newStatus: 'Pending', actor: 'Dr. Maya Dewi', reason: 'Pengajuan verifikasi veteriner.', icon: '📨', color: '#3b82f6' },
      { id: 'SH-004-2', date: '2023-11-18', previousStatus: 'Pending', newStatus: 'Partially Verified', actor: 'superadmin@ternakhub.id', reason: 'KTP dan STR valid, menunggu SIP.', icon: '🔵', color: '#3b82f6' },
      { id: 'SH-004-3', date: '2023-11-20', previousStatus: 'Partially Verified', newStatus: 'Verified', actor: 'superadmin@ternakhub.id', reason: 'SIP terkonfirmasi. Semua kredensial valid.', icon: '✅', color: '#059669' },
    ],
    timeline: [
      { id: 'TL-004-1', date: '2023-11-15', event: 'Pengajuan verifikasi veteriner', actor: 'Dr. Maya Dewi', icon: '📨', color: '#3b82f6' },
      { id: 'TL-004-2', date: '2023-11-18', event: 'Status: Sebagian Terverifikasi', actor: 'superadmin@ternakhub.id', icon: '🔵', color: '#3b82f6' },
      { id: 'TL-004-3', date: '2023-11-20', event: 'Verifikasi penuh disetujui', actor: 'superadmin@ternakhub.id', icon: '✅', color: '#059669' },
    ],
    trustIndicators: [
      { indicatorId: 'TI-004-A', label: 'Registrasi Profesi Aktif', category: 'Credential', hasEvidence: true, evidenceCount: 1, notes: 'STR PDHI aktif.' },
      { indicatorId: 'TI-004-B', label: 'Izin Praktik Sah', category: 'Compliance', hasEvidence: true, evidenceCount: 1, notes: 'SIP berlaku.' },
      { indicatorId: 'TI-004-C', label: 'Gelar Akademik Terverifikasi', category: 'Credential', hasEvidence: true, evidenceCount: 1, notes: 'Ijazah drh. dari institusi terakreditasi.' },
    ],
    auditTrail: [
      { id: 'AT-004-1', date: '2023-11-15T10:00:00', action: 'SUBMIT', actor: 'Dr. Maya Dewi', field: 'status', previousValue: null, newValue: 'Pending', ipAddress: '180.xx.xx.77' },
      { id: 'AT-004-2', date: '2023-11-18T13:00:00', action: 'PARTIAL_VERIFY', actor: 'superadmin@ternakhub.id', field: 'status', previousValue: 'Pending', newValue: 'Partially Verified', ipAddress: '202.xx.xx.10' },
      { id: 'AT-004-3', date: '2023-11-20T09:30:00', action: 'APPROVE', actor: 'superadmin@ternakhub.id', field: 'status', previousValue: 'Partially Verified', newValue: 'Verified', ipAddress: '202.xx.xx.10' },
    ],
    evidenceCount: 4,
    verificationHistoryCount: 3,
  },

  // ── 5. Document Verification — Akta Usaha Farm Berkah (Partially Verified) ─
  {
    verificationId:    'TV-VRF-005',
    subjectType:       'Document',
    subjectId:         'DOC-FBM-001',
    subjectName:       'Akta Pendirian CV Farm Berkah Mandiri',
    subjectDescription:'Akta notaris badan usaha — Farm Berkah Mandiri',
    subjectIcon:       '📄',
    subjectBg:         '#e0f2fe',
    workspaceId:       'WS-002',
    workspaceName:     'Farm Berkah Mandiri',
    ownerName:         'Siti Rahayu',
    verificationType:  'Document Verification',
    status:            'Partially Verified',
    submittedDate:     '2024-06-10',
    lastUpdatedDate:   '2024-06-15',
    reviewer:          'admin@ternakhub.id',
    reviewedDate:      '2024-06-15',
    notes:             'Akta notaris valid. Menunggu cap pengesahan Kemenkumham.',
    evidence: [
      { evidenceId: 'EV-005-A', type: 'Akta Notaris', label: 'Akta Pendirian (Asli)', status: 'Verified', submittedDate: '2024-06-10', notes: 'Ditandatangani Notaris Adi Nugroho, SH.' },
      { evidenceId: 'EV-005-B', type: 'Cap Kemenkumham', label: 'Pengesahan Kemenkumham', status: 'Pending', submittedDate: null, notes: 'Proses pengesahan masih berjalan.' },
      { evidenceId: 'EV-005-C', type: 'NPWP Badan', label: 'NPWP Badan Usaha', status: 'Verified', submittedDate: '2024-06-11', notes: 'NPWP terdaftar atas nama CV.' },
    ],
    statusHistory: [
      { id: 'SH-005-1', date: '2024-06-10', previousStatus: null, newStatus: 'Pending', actor: 'Siti Rahayu', reason: 'Pengajuan verifikasi dokumen pendirian usaha.', icon: '📨', color: '#3b82f6' },
      { id: 'SH-005-2', date: '2024-06-15', previousStatus: 'Pending', newStatus: 'Partially Verified', actor: 'admin@ternakhub.id', reason: 'Akta dan NPWP valid. Menunggu cap Kemenkumham.', icon: '🔵', color: '#3b82f6' },
    ],
    timeline: [
      { id: 'TL-005-1', date: '2024-06-10', event: 'Pengajuan dokumen akta usaha', actor: 'Siti Rahayu', icon: '📄', color: '#3b82f6' },
      { id: 'TL-005-2', date: '2024-06-11', event: 'NPWP badan ditambahkan', actor: 'Siti Rahayu', icon: '📄', color: '#6366f1' },
      { id: 'TL-005-3', date: '2024-06-15', event: 'Direview — sebagian terverifikasi', actor: 'admin@ternakhub.id', icon: '🔵', color: '#3b82f6' },
    ],
    trustIndicators: [
      { indicatorId: 'TI-005-A', label: 'Akta Notaris Valid', category: 'Credential', hasEvidence: true, evidenceCount: 1, notes: 'Ditandatangani notaris berlisensi.' },
      { indicatorId: 'TI-005-B', label: 'Pengesahan Pemerintah', category: 'Compliance', hasEvidence: false, evidenceCount: 0, notes: 'Menunggu cap Kemenkumham.' },
      { indicatorId: 'TI-005-C', label: 'NPWP Badan Aktif', category: 'Compliance', hasEvidence: true, evidenceCount: 1, notes: 'Terdaftar aktif.' },
    ],
    auditTrail: [
      { id: 'AT-005-1', date: '2024-06-10T08:30:00', action: 'SUBMIT', actor: 'Siti Rahayu', field: 'status', previousValue: null, newValue: 'Pending', ipAddress: '110.xx.xx.33' },
      { id: 'AT-005-2', date: '2024-06-15T14:00:00', action: 'PARTIAL_VERIFY', actor: 'admin@ternakhub.id', field: 'status', previousValue: 'Pending', newValue: 'Partially Verified', ipAddress: '202.xx.xx.10' },
    ],
    evidenceCount: 2,
    verificationHistoryCount: 2,
  },

  // ── 6. Marketplace Verification — Listing Sapi Limosin (Pending) ──────────
  {
    verificationId:    'TV-VRF-006',
    subjectType:       'Listing',
    subjectId:         'LST-MPK-2241',
    subjectName:       'Sapi Limosin Jantan 3 Tahun',
    subjectDescription:'Listing Marketplace — Farm Berkah Mandiri',
    subjectIcon:       '🛒',
    subjectBg:         '#fce7f3',
    workspaceId:       'WS-002',
    workspaceName:     'Farm Berkah Mandiri',
    ownerName:         'Siti Rahayu',
    verificationType:  'Marketplace Verification',
    status:            'Pending',
    submittedDate:     '2025-06-20',
    lastUpdatedDate:   '2025-06-20',
    reviewer:          null,
    reviewedDate:      null,
    notes:             'Listing baru — menunggu verifikasi identitas ternak dan kesesuaian harga.',
    evidence: [
      { evidenceId: 'EV-006-A', type: 'Foto Listing', label: 'Foto Ternak (5 gambar)', status: 'Submitted', submittedDate: '2025-06-20', notes: 'Foto dari berbagai sudut.' },
      { evidenceId: 'EV-006-B', type: 'Livestock ID', label: 'Kode Identifikasi Ternak', status: 'Pending', submittedDate: null, notes: 'Perlu dicocokkan dengan registri ternak.' },
      { evidenceId: 'EV-006-C', type: 'Sertifikat Kesehatan', label: 'Surat Keterangan Kesehatan Hewan', status: 'Missing', submittedDate: null, notes: 'Wajib untuk jual-beli ternak.' },
    ],
    statusHistory: [
      { id: 'SH-006-1', date: '2025-06-20', previousStatus: null, newStatus: 'Pending', actor: 'Siti Rahayu', reason: 'Listing baru dikirim untuk verifikasi.', icon: '📨', color: '#3b82f6' },
    ],
    timeline: [
      { id: 'TL-006-1', date: '2025-06-20', event: 'Listing baru diajukan', actor: 'Siti Rahayu', icon: '🛒', color: '#9d174d' },
      { id: 'TL-006-2', date: '2025-06-20', event: 'Foto ternak diunggah', actor: 'Siti Rahayu', icon: '📷', color: '#6366f1' },
    ],
    trustIndicators: [
      { indicatorId: 'TI-006-A', label: 'Foto Listing Ada', category: 'Activity', hasEvidence: true, evidenceCount: 1, notes: '5 foto diunggah.' },
      { indicatorId: 'TI-006-B', label: 'Identitas Ternak Terverifikasi', category: 'Identity', hasEvidence: false, evidenceCount: 0, notes: 'Belum dicocokkan dengan registri.' },
      { indicatorId: 'TI-006-C', label: 'Sertifikat Kesehatan Ada', category: 'Compliance', hasEvidence: false, evidenceCount: 0, notes: 'Dokumen wajib belum dikirim.' },
    ],
    auditTrail: [
      { id: 'AT-006-1', date: '2025-06-20T15:30:00', action: 'SUBMIT', actor: 'Siti Rahayu', field: 'status', previousValue: null, newValue: 'Pending', ipAddress: '110.xx.xx.33' },
    ],
    evidenceCount: 1,
    verificationHistoryCount: 1,
  },

  // ── 7. Identity Verification — Ahmad Fauzi (Partially Verified) ───────────
  {
    verificationId:    'TV-VRF-007',
    subjectType:       'User',
    subjectId:         'USR-AF-003',
    subjectName:       'Ahmad Fauzi',
    subjectDescription:'Peternak — Ternak Unggul Nusantara',
    subjectIcon:       '👤',
    subjectBg:         '#dbeafe',
    workspaceId:       'WS-003',
    workspaceName:     'Ternak Unggul Nusantara',
    ownerName:         'Ahmad Fauzi',
    verificationType:  'Identity Verification',
    status:            'Partially Verified',
    submittedDate:     '2025-01-15',
    lastUpdatedDate:   '2025-01-18',
    reviewer:          'admin@ternakhub.id',
    reviewedDate:      '2025-01-18',
    notes:             'KTP valid. Selfie blur — diminta ulang.',
    evidence: [
      { evidenceId: 'EV-007-A', type: 'KTP', label: 'Kartu Tanda Penduduk', status: 'Verified', submittedDate: '2025-01-15', notes: 'NIK valid.' },
      { evidenceId: 'EV-007-B', type: 'Selfie', label: 'Foto Diri dengan KTP', status: 'Rejected', submittedDate: '2025-01-15', notes: 'Foto blur, tidak dapat diverifikasi. Diminta ulang.' },
      { evidenceId: 'EV-007-C', type: 'Selfie (Ulang)', label: 'Foto Diri Ulang', status: 'Pending', submittedDate: null, notes: 'Menunggu foto baru dari pengguna.' },
    ],
    statusHistory: [
      { id: 'SH-007-1', date: '2025-01-15', previousStatus: null, newStatus: 'Pending', actor: 'Ahmad Fauzi', reason: 'Pengajuan verifikasi identitas.', icon: '📨', color: '#3b82f6' },
      { id: 'SH-007-2', date: '2025-01-18', previousStatus: 'Pending', newStatus: 'Partially Verified', actor: 'admin@ternakhub.id', reason: 'KTP valid. Selfie blur — diminta ulang.', icon: '🔵', color: '#3b82f6' },
    ],
    timeline: [
      { id: 'TL-007-1', date: '2025-01-15', event: 'Pengajuan verifikasi identitas', actor: 'Ahmad Fauzi', icon: '📨', color: '#3b82f6' },
      { id: 'TL-007-2', date: '2025-01-18', event: 'Selfie ditolak — diminta ulang', actor: 'admin@ternakhub.id', icon: '❌', color: '#ef4444' },
      { id: 'TL-007-3', date: '2025-01-18', event: 'Status diperbarui ke Sebagian Terverifikasi', actor: 'admin@ternakhub.id', icon: '🔵', color: '#3b82f6' },
    ],
    trustIndicators: [
      { indicatorId: 'TI-007-A', label: 'NIK Terverifikasi', category: 'Identity', hasEvidence: true, evidenceCount: 1, notes: 'KTP valid.' },
      { indicatorId: 'TI-007-B', label: 'Wajah Terverifikasi', category: 'Identity', hasEvidence: false, evidenceCount: 0, notes: 'Selfie belum valid.' },
    ],
    auditTrail: [
      { id: 'AT-007-1', date: '2025-01-15T09:00:00', action: 'SUBMIT', actor: 'Ahmad Fauzi', field: 'status', previousValue: null, newValue: 'Pending', ipAddress: '114.xx.xx.88' },
      { id: 'AT-007-2', date: '2025-01-18T10:15:00', action: 'PARTIAL_VERIFY', actor: 'admin@ternakhub.id', field: 'status', previousValue: 'Pending', newValue: 'Partially Verified', ipAddress: '202.xx.xx.10' },
    ],
    evidenceCount: 1,
    verificationHistoryCount: 2,
  },

  // ── 8. Workspace Verification — Klinik Hewan Sehat (Partially Verified) ───
  {
    verificationId:    'TV-VRF-008',
    subjectType:       'Workspace',
    subjectId:         'WS-004',
    subjectName:       'Klinik Hewan Sehat Sentosa',
    subjectDescription:'Klinik hewan terdaftar — Jakarta Selatan',
    subjectIcon:       '🏢',
    subjectBg:         '#fef3c7',
    workspaceId:       'WS-004',
    workspaceName:     'Klinik Hewan Sehat Sentosa',
    ownerName:         'Dr. Maya Dewi',
    verificationType:  'Workspace Verification',
    status:            'Partially Verified',
    submittedDate:     '2024-08-01',
    lastUpdatedDate:   '2024-08-10',
    reviewer:          'admin@ternakhub.id',
    reviewedDate:      '2024-08-10',
    notes:             'Izin klinik valid. SIUP sedang diperpanjang oleh pemilik.',
    evidence: [
      { evidenceId: 'EV-008-A', type: 'Izin Klinik Hewan', label: 'Surat Izin Klinik dari Dinas', status: 'Verified', submittedDate: '2024-08-01', notes: 'Izin aktif dari Dinas Ketahanan Pangan, Kelautan, dan Pertanian.' },
      { evidenceId: 'EV-008-B', type: 'SIUP', label: 'Surat Izin Usaha', status: 'Pending', submittedDate: null, notes: 'Proses perpanjangan SIUP sedang berjalan.' },
      { evidenceId: 'EV-008-C', type: 'Profil Lokasi', label: 'Foto dan Denah Klinik', status: 'Verified', submittedDate: '2024-08-02', notes: 'Lokasi sesuai alamat terdaftar.' },
    ],
    statusHistory: [
      { id: 'SH-008-1', date: '2024-08-01', previousStatus: null, newStatus: 'Pending', actor: 'Dr. Maya Dewi', reason: 'Pengajuan verifikasi klinik hewan.', icon: '📨', color: '#3b82f6' },
      { id: 'SH-008-2', date: '2024-08-10', previousStatus: 'Pending', newStatus: 'Partially Verified', actor: 'admin@ternakhub.id', reason: 'Izin klinik dan profil lokasi valid. SIUP dalam proses perpanjangan.', icon: '🔵', color: '#3b82f6' },
    ],
    timeline: [
      { id: 'TL-008-1', date: '2024-08-01', event: 'Pengajuan verifikasi klinik', actor: 'Dr. Maya Dewi', icon: '📨', color: '#3b82f6' },
      { id: 'TL-008-2', date: '2024-08-02', event: 'Foto klinik diunggah', actor: 'Dr. Maya Dewi', icon: '📷', color: '#6366f1' },
      { id: 'TL-008-3', date: '2024-08-10', event: 'Status: Sebagian Terverifikasi', actor: 'admin@ternakhub.id', icon: '🔵', color: '#3b82f6' },
    ],
    trustIndicators: [
      { indicatorId: 'TI-008-A', label: 'Izin Klinik Resmi', category: 'Compliance', hasEvidence: true, evidenceCount: 1, notes: 'Dari instansi berwenang.' },
      { indicatorId: 'TI-008-B', label: 'SIUP Aktif', category: 'Compliance', hasEvidence: false, evidenceCount: 0, notes: 'Dalam proses perpanjangan.' },
      { indicatorId: 'TI-008-C', label: 'Lokasi Terverifikasi', category: 'Identity', hasEvidence: true, evidenceCount: 1, notes: 'Foto cocok dengan alamat.' },
    ],
    auditTrail: [
      { id: 'AT-008-1', date: '2024-08-01T11:00:00', action: 'SUBMIT', actor: 'Dr. Maya Dewi', field: 'status', previousValue: null, newValue: 'Pending', ipAddress: '180.xx.xx.77' },
      { id: 'AT-008-2', date: '2024-08-10T15:00:00', action: 'PARTIAL_VERIFY', actor: 'admin@ternakhub.id', field: 'status', previousValue: 'Pending', newValue: 'Partially Verified', ipAddress: '202.xx.xx.10' },
    ],
    evidenceCount: 2,
    verificationHistoryCount: 2,
  },

  // ── 9. Livestock Verification — Cemara (Not Verified) ────────────────────
  {
    verificationId:    'TV-VRF-009',
    subjectType:       'Livestock',
    subjectId:         'LS-CWL-009',
    subjectName:       'Cemara',
    subjectDescription:'Kambing Kacang, Betina — CV Berkah Ternak Makmur',
    subjectIcon:       '🐐',
    subjectBg:         '#d1fae5',
    workspaceId:       'WS-005',
    workspaceName:     'CV Berkah Ternak Makmur',
    ownerName:         'Eko Prasetyo',
    verificationType:  'Livestock Verification',
    status:            'Not Verified',
    submittedDate:     '2023-06-30',
    lastUpdatedDate:   '2023-07-20',
    reviewer:          'admin@ternakhub.id',
    reviewedDate:      '2023-07-20',
    notes:             'Verifikasi silsilah ditolak. ID ayah tidak ditemukan di registri sumber.',
    evidence: [
      { evidenceId: 'EV-009-A', type: 'Foto Ternak', label: 'Foto Kambing Cemara', status: 'Submitted', submittedDate: '2023-06-30', notes: 'Foto dari 2 sudut.' },
      { evidenceId: 'EV-009-B', type: 'Klaim Silsilah', label: 'Klaim ID Ayah Bajra', status: 'Rejected', submittedDate: '2023-07-01', notes: 'ID LS-CWL-P10 tidak ditemukan di registri Ternak Unggul Nusantara.' },
    ],
    statusHistory: [
      { id: 'SH-009-1', date: '2023-06-30', previousStatus: null, newStatus: 'Pending', actor: 'Eko Prasetyo', reason: 'Pengajuan verifikasi ternak.', icon: '📨', color: '#3b82f6' },
      { id: 'SH-009-2', date: '2023-07-20', previousStatus: 'Pending', newStatus: 'Not Verified', actor: 'admin@ternakhub.id', reason: 'Silsilah tidak dapat diverifikasi — ID tidak valid.', icon: '⚪', color: '#94a3b8' },
    ],
    timeline: [
      { id: 'TL-009-1', date: '2023-06-30', event: 'Pengajuan verifikasi ternak', actor: 'Eko Prasetyo', icon: '📨', color: '#3b82f6' },
      { id: 'TL-009-2', date: '2023-07-01', event: 'Klaim silsilah dikirim', actor: 'Eko Prasetyo', icon: '🌳', color: '#6366f1' },
      { id: 'TL-009-3', date: '2023-07-20', event: 'Klaim silsilah ditolak — ID tidak valid', actor: 'admin@ternakhub.id', icon: '❌', color: '#ef4444' },
      { id: 'TL-009-4', date: '2023-07-20', event: 'Status: Belum Diverifikasi', actor: 'admin@ternakhub.id', icon: '⚪', color: '#94a3b8' },
    ],
    trustIndicators: [
      { indicatorId: 'TI-009-A', label: 'Identitas Ternak Ada', category: 'Identity', hasEvidence: true, evidenceCount: 1, notes: 'Foto tersedia.' },
      { indicatorId: 'TI-009-B', label: 'Silsilah Terverifikasi', category: 'Credential', hasEvidence: false, evidenceCount: 0, notes: 'Klaim silsilah ditolak.' },
    ],
    auditTrail: [
      { id: 'AT-009-1', date: '2023-06-30T08:00:00', action: 'SUBMIT', actor: 'Eko Prasetyo', field: 'status', previousValue: null, newValue: 'Pending', ipAddress: '125.xx.xx.55' },
      { id: 'AT-009-2', date: '2023-07-20T09:00:00', action: 'MARK_NOT_VERIFIED', actor: 'admin@ternakhub.id', field: 'status', previousValue: 'Pending', newValue: 'Not Verified', ipAddress: '202.xx.xx.10' },
    ],
    evidenceCount: 1,
    verificationHistoryCount: 2,
  },

  // ── 10. Document Verification — SIUP Ternak Makmur (Suspended) ───────────
  {
    verificationId:    'TV-VRF-010',
    subjectType:       'Document',
    subjectId:         'DOC-TM-002',
    subjectName:       'SIUP CV Berkah Ternak Makmur',
    subjectDescription:'Surat Izin Usaha Peternakan — CV Berkah Ternak Makmur',
    subjectIcon:       '📄',
    subjectBg:         '#e0f2fe',
    workspaceId:       'WS-005',
    workspaceName:     'CV Berkah Ternak Makmur',
    ownerName:         'Eko Prasetyo',
    verificationType:  'Document Verification',
    status:            'Suspended',
    submittedDate:     '2023-03-01',
    lastUpdatedDate:   '2024-04-15',
    reviewer:          'superadmin@ternakhub.id',
    reviewedDate:      '2024-04-15',
    notes:             'SIUP sebelumnya valid, namun tidak diperpanjang — ditangguhkan otomatis per 15 April 2024.',
    evidence: [
      { evidenceId: 'EV-010-A', type: 'SIUP Lama', label: 'SIUP 2023 (Kedaluwarsa)', status: 'Rejected', submittedDate: '2023-03-01', notes: 'Masa berlaku habis Maret 2024.' },
      { evidenceId: 'EV-010-B', type: 'SIUP Perpanjangan', label: 'SIUP Perpanjangan 2024', status: 'Missing', submittedDate: null, notes: 'Tidak dikirim oleh pemilik.' },
    ],
    statusHistory: [
      { id: 'SH-010-1', date: '2023-03-01', previousStatus: null, newStatus: 'Verified', actor: 'admin@ternakhub.id', reason: 'SIUP 2023 valid saat pertama kali diterbitkan.', icon: '✅', color: '#059669' },
      { id: 'SH-010-2', date: '2024-04-15', previousStatus: 'Verified', newStatus: 'Suspended', actor: 'Sistem Otomatis', reason: 'SIUP kedaluwarsa. Perpanjangan tidak dikirim.', icon: '🚫', color: '#8b5cf6' },
    ],
    timeline: [
      { id: 'TL-010-1', date: '2023-03-01', event: 'SIUP 2023 diverifikasi', actor: 'admin@ternakhub.id', icon: '✅', color: '#059669' },
      { id: 'TL-010-2', date: '2024-03-01', event: 'Peringatan: SIUP akan kedaluwarsa 30 hari lagi', actor: 'Sistem', icon: '⚠️', color: '#f59e0b' },
      { id: 'TL-010-3', date: '2024-04-15', event: 'SIUP kedaluwarsa — ditangguhkan otomatis', actor: 'Sistem Otomatis', icon: '🚫', color: '#8b5cf6' },
    ],
    trustIndicators: [
      { indicatorId: 'TI-010-A', label: 'Izin Usaha Aktif', category: 'Compliance', hasEvidence: false, evidenceCount: 0, notes: 'SIUP kedaluwarsa, perpanjangan belum ada.' },
    ],
    auditTrail: [
      { id: 'AT-010-1', date: '2023-03-01T10:00:00', action: 'APPROVE', actor: 'admin@ternakhub.id', field: 'status', previousValue: null, newValue: 'Verified', ipAddress: '202.xx.xx.10' },
      { id: 'AT-010-2', date: '2024-04-15T00:00:00', action: 'AUTO_SUSPEND', actor: 'Sistem', field: 'status', previousValue: 'Verified', newValue: 'Suspended', ipAddress: 'system' },
    ],
    evidenceCount: 0,
    verificationHistoryCount: 2,
  },

  // ── 11. Marketplace Verification — Listing Kambing PE (Revoked) ───────────
  {
    verificationId:    'TV-VRF-011',
    subjectType:       'Listing',
    subjectId:         'LST-MPK-1875',
    subjectName:       'Kambing Peranakan Ettawa Betina',
    subjectDescription:'Listing Marketplace — Listing melanggar aturan platform',
    subjectIcon:       '🛒',
    subjectBg:         '#fce7f3',
    workspaceId:       'WS-003',
    workspaceName:     'Ternak Unggul Nusantara',
    ownerName:         'Ahmad Fauzi',
    verificationType:  'Marketplace Verification',
    status:            'Revoked',
    submittedDate:     '2024-09-10',
    lastUpdatedDate:   '2024-10-02',
    reviewer:          'superadmin@ternakhub.id',
    reviewedDate:      '2024-10-02',
    notes:             'Listing dicabut karena ditemukan informasi harga yang menyesatkan dan foto tidak sesuai dengan ternak yang dijual.',
    evidence: [
      { evidenceId: 'EV-011-A', type: 'Foto Listing', label: 'Foto Asli yang Diunggah', status: 'Rejected', submittedDate: '2024-09-10', notes: 'Foto ternyata bukan milik penjual.' },
      { evidenceId: 'EV-011-B', type: 'Laporan Pembeli', label: 'Laporan Pembeli #RPT-1023', status: 'Verified', submittedDate: '2024-09-28', notes: 'Pembeli melaporkan ketidaksesuaian foto dan fisik hewan.' },
    ],
    statusHistory: [
      { id: 'SH-011-1', date: '2024-09-10', previousStatus: null, newStatus: 'Verified', actor: 'admin@ternakhub.id', reason: 'Listing diverifikasi awal oleh admin.', icon: '✅', color: '#059669' },
      { id: 'SH-011-2', date: '2024-09-28', previousStatus: 'Verified', newStatus: 'Suspended', actor: 'superadmin@ternakhub.id', reason: 'Laporan pembeli diterima — investigasi dimulai.', icon: '🚫', color: '#8b5cf6' },
      { id: 'SH-011-3', date: '2024-10-02', previousStatus: 'Suspended', newStatus: 'Revoked', actor: 'superadmin@ternakhub.id', reason: 'Terbukti pelanggaran — foto tidak sesuai dan harga menyesatkan.', icon: '❌', color: '#ef4444' },
    ],
    timeline: [
      { id: 'TL-011-1', date: '2024-09-10', event: 'Listing diverifikasi oleh admin', actor: 'admin@ternakhub.id', icon: '✅', color: '#059669' },
      { id: 'TL-011-2', date: '2024-09-28', event: 'Laporan pembeli diterima', actor: 'Pembeli Anonim', icon: '🚨', color: '#ef4444' },
      { id: 'TL-011-3', date: '2024-09-28', event: 'Listing ditangguhkan — investigasi', actor: 'superadmin@ternakhub.id', icon: '🚫', color: '#8b5cf6' },
      { id: 'TL-011-4', date: '2024-10-02', event: 'Verifikasi dicabut — pelanggaran terbukti', actor: 'superadmin@ternakhub.id', icon: '❌', color: '#ef4444' },
    ],
    trustIndicators: [
      { indicatorId: 'TI-011-A', label: 'Foto Listing Valid', category: 'Identity', hasEvidence: false, evidenceCount: 0, notes: 'Foto terbukti bukan milik penjual.' },
      { indicatorId: 'TI-011-B', label: 'Harga Wajar', category: 'Reputation', hasEvidence: false, evidenceCount: 0, notes: 'Harga terbukti menyesatkan.' },
    ],
    auditTrail: [
      { id: 'AT-011-1', date: '2024-09-10T08:00:00', action: 'APPROVE', actor: 'admin@ternakhub.id', field: 'status', previousValue: null, newValue: 'Verified', ipAddress: '202.xx.xx.10' },
      { id: 'AT-011-2', date: '2024-09-28T16:00:00', action: 'SUSPEND', actor: 'superadmin@ternakhub.id', field: 'status', previousValue: 'Verified', newValue: 'Suspended', ipAddress: '202.xx.xx.10' },
      { id: 'AT-011-3', date: '2024-10-02T11:00:00', action: 'REVOKE', actor: 'superadmin@ternakhub.id', field: 'status', previousValue: 'Suspended', newValue: 'Revoked', ipAddress: '202.xx.xx.10' },
    ],
    evidenceCount: 2,
    verificationHistoryCount: 3,
  },

  // ── 12. Veterinary Verification — Dr. Eko Pramono (Pending) ──────────────
  {
    verificationId:    'TV-VRF-012',
    subjectType:       'Veterinarian',
    subjectId:         'VET-EP-002',
    subjectName:       'Dr. Eko Pramono, drh.',
    subjectDescription:'Dokter Hewan Praktisi Mandiri — Jawa Timur',
    subjectIcon:       '👨‍⚕️',
    subjectBg:         '#ede9fe',
    workspaceId:       'WS-003',
    workspaceName:     'Ternak Unggul Nusantara',
    ownerName:         'Dr. Eko Pramono',
    verificationType:  'Veterinary Verification',
    status:            'Pending',
    submittedDate:     '2025-05-20',
    lastUpdatedDate:   '2025-05-20',
    reviewer:          null,
    reviewedDate:      null,
    notes:             'Pengajuan baru. Menunggu verifikasi STR dan SIP.',
    evidence: [
      { evidenceId: 'EV-012-A', type: 'STR', label: 'Surat Tanda Registrasi', status: 'Submitted', submittedDate: '2025-05-20', notes: 'Menunggu verifikasi dengan PDHI.' },
      { evidenceId: 'EV-012-B', type: 'KTP', label: 'Kartu Tanda Penduduk', status: 'Submitted', submittedDate: '2025-05-20', notes: 'Diterima, menunggu review.' },
      { evidenceId: 'EV-012-C', type: 'SIP', label: 'Surat Izin Praktik', status: 'Missing', submittedDate: null, notes: 'Belum dikirim oleh pemohon.' },
    ],
    statusHistory: [
      { id: 'SH-012-1', date: '2025-05-20', previousStatus: null, newStatus: 'Pending', actor: 'Dr. Eko Pramono', reason: 'Pengajuan verifikasi dokter hewan.', icon: '📨', color: '#3b82f6' },
    ],
    timeline: [
      { id: 'TL-012-1', date: '2025-05-20', event: 'Pengajuan verifikasi veteriner', actor: 'Dr. Eko Pramono', icon: '📨', color: '#3b82f6' },
      { id: 'TL-012-2', date: '2025-05-20', event: 'STR dan KTP diunggah', actor: 'Dr. Eko Pramono', icon: '📄', color: '#6366f1' },
    ],
    trustIndicators: [
      { indicatorId: 'TI-012-A', label: 'STR Terdaftar', category: 'Credential', hasEvidence: true, evidenceCount: 1, notes: 'Menunggu konfirmasi PDHI.' },
      { indicatorId: 'TI-012-B', label: 'Identitas Valid', category: 'Identity', hasEvidence: true, evidenceCount: 1, notes: 'KTP diterima, belum diverifikasi.' },
      { indicatorId: 'TI-012-C', label: 'SIP Aktif', category: 'Compliance', hasEvidence: false, evidenceCount: 0, notes: 'SIP belum dikirim.' },
    ],
    auditTrail: [
      { id: 'AT-012-1', date: '2025-05-20T14:00:00', action: 'SUBMIT', actor: 'Dr. Eko Pramono', field: 'status', previousValue: null, newValue: 'Pending', ipAddress: '139.xx.xx.22' },
    ],
    evidenceCount: 2,
    verificationHistoryCount: 1,
  },
];

// ─── Platform Stats ───────────────────────────────────────────────────────────

export const TV_PLATFORM_STATS: TVPlatformStats = {
  totalVerified:      3,
  pending:            3,
  partiallyVerified:  3,
  suspended:          1,
  revoked:            1,
  notVerified:        1,
  totalRecords:       12,
  typeBreakdown: {
    'Identity Verification':   2,
    'Workspace Verification':  2,
    'Livestock Verification':  2,
    'Veterinary Verification': 2,
    'Document Verification':   2,
    'Marketplace Verification':2,
  },
};

// ─── Filter Function ──────────────────────────────────────────────────────────

export interface TVFilterParams {
  workspace?: string;
  user?: string;
  livestockId?: string;
  verificationId?: string;
  verificationType?: TVVerificationType | 'All';
  status?: TVTrustStatus | 'All';
  workspaceId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function filterTVRecords(
  records: TVVerificationRecord[],
  params: TVFilterParams,
): TVVerificationRecord[] {
  return records.filter((r) => {
    if (params.workspace && !r.workspaceName.toLowerCase().includes(params.workspace.toLowerCase())) return false;
    if (params.user && !r.ownerName.toLowerCase().includes(params.user.toLowerCase())) return false;
    if (params.livestockId && !r.subjectId.toLowerCase().includes(params.livestockId.toLowerCase())) return false;
    if (params.verificationId && !r.verificationId.toLowerCase().includes(params.verificationId.toLowerCase())) return false;
    if (params.verificationType && params.verificationType !== 'All' && r.verificationType !== params.verificationType) return false;
    if (params.status && params.status !== 'All' && r.status !== params.status) return false;
    if (params.workspaceId && params.workspaceId !== 'All' && r.workspaceId !== params.workspaceId) return false;
    if (params.dateFrom && r.submittedDate < params.dateFrom) return false;
    if (params.dateTo && r.submittedDate > params.dateTo) return false;
    return true;
  });
}
