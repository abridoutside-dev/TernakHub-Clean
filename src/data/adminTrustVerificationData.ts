// ─── Admin Trust & Verification Data — TV-001 ────────────────────────────────
// UI config constants and DB-aligned types only.
// All actual verification data is queried from Supabase trust_verifications.
// Types match verification_type_enum and verification_status_enum in DB.

// ─── Types ────────────────────────────────────────────────────────────────────

/** Matches verification_type_enum in Supabase DB. */
export type TVVerificationType = 'KTP' | 'NPWP' | 'SIUP' | 'Sertifikat' | 'LokasiUsaha' | 'Rekening' | 'Lainnya';

/** Matches verification_status_enum in Supabase DB. */
export type TVTrustStatus =
  | 'Draft'
  | 'Submitted'
  | 'Pending'
  | 'UnderReview'
  | 'Approved'
  | 'Verified'
  | 'Unverified'
  | 'Rejected'
  | 'Suspended'
  | 'Expired';

export type TVSubjectType =
  | 'User'
  | 'Workspace'
  | 'Livestock'
  | 'Veterinarian'
  | 'Document'
  | 'Listing';

// ─── Sub-entity interfaces ────────────────────────────────────────────────────

export interface TVEvidenceItem {
  evidenceId: string;
  type: string;
  label: string;
  status: 'Submitted' | 'Pending' | 'Verified' | 'Rejected' | 'Missing';
  submittedDate: string | null;
  notes: string;
}

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

export interface TVTimelineEvent {
  id: string;
  date: string;
  event: string;
  actor: string;
  icon: string;
  color: string;
}

export interface TVTrustIndicator {
  indicatorId: string;
  label: string;
  category: 'Identity' | 'Credential' | 'Compliance' | 'Activity' | 'Reputation';
  hasEvidence: boolean;
  evidenceCount: number;
  notes: string;
}

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

export interface TVVerificationRecord {
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
  evidence: TVEvidenceItem[];
  statusHistory: TVStatusHistoryEvent[];
  timeline: TVTimelineEvent[];
  trustIndicators: TVTrustIndicator[];
  auditTrail: TVAuditEntry[];
  evidenceCount: number;
  verificationHistoryCount: number;
}

export interface TVPlatformStats {
  totalVerified: number;
  pending: number;
  suspended: number;
  rejected: number;
  unverified: number;
  totalRecords: number;
  typeBreakdown: Record<TVVerificationType, number>;
}

// ─── Config Maps ──────────────────────────────────────────────────────────────

export const TV_STATUS_CONFIG: Record<
  TVTrustStatus,
  { label: string; bg: string; color: string; dot: string; icon: string }
> = {
  'Draft':       { label: 'Draft',              bg: '#f1f5f9', color: '#475569', dot: '#94a3b8', icon: '📝' },
  'Submitted':   { label: 'Dikirim',            bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6', icon: '📤' },
  'Pending':     { label: 'Menunggu',           bg: '#fef3c7', color: '#92400e', dot: '#d97706', icon: '⏳' },
  'UnderReview': { label: 'Sedang Ditinjau',    bg: '#fef3c7', color: '#92400e', dot: '#d97706', icon: '🔍' },
  'Approved':    { label: 'Disetujui',          bg: '#d1fae5', color: '#065f46', dot: '#059669', icon: '✅' },
  'Verified':    { label: 'Terverifikasi',      bg: '#d1fae5', color: '#065f46', dot: '#059669', icon: '✅' },
  'Unverified':  { label: 'Belum Diverifikasi', bg: '#f1f5f9', color: '#475569', dot: '#94a3b8', icon: '⚪' },
  'Rejected':    { label: 'Ditolak',            bg: '#fee2e2', color: '#991b1b', dot: '#ef4444', icon: '❌' },
  'Suspended':   { label: 'Ditangguhkan',       bg: '#ede9fe', color: '#5b21b6', dot: '#8b5cf6', icon: '🚫' },
  'Expired':     { label: 'Kadaluarsa',         bg: '#fef3c7', color: '#92400e', dot: '#f59e0b', icon: '⌛' },
};

export const TV_TYPE_CONFIG: Record<
  TVVerificationType,
  { icon: string; bg: string; color: string; short: string }
> = {
  'KTP':         { icon: '🪪', bg: '#dbeafe', color: '#1e40af', short: 'KTP' },
  'NPWP':        { icon: '📋', bg: '#fef3c7', color: '#92400e', short: 'NPWP' },
  'SIUP':        { icon: '📜', bg: '#d1fae5', color: '#065f46', short: 'SIUP' },
  'Sertifikat':  { icon: '🎓', bg: '#ede9fe', color: '#5b21b6', short: 'Sertifikat' },
  'LokasiUsaha': { icon: '📍', bg: '#e0f2fe', color: '#0369a1', short: 'Lokasi Usaha' },
  'Rekening':    { icon: '🏦', bg: '#fce7f3', color: '#9d174d', short: 'Rekening' },
  'Lainnya':     { icon: '📁', bg: '#f1f5f9', color: '#475569', short: 'Lainnya' },
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
  Submitted: { label: 'Dikirim',   bg: '#dbeafe', color: '#1e40af' },
  Pending:   { label: 'Menunggu',  bg: '#fef3c7', color: '#92400e' },
  Verified:  { label: 'Valid',     bg: '#d1fae5', color: '#065f46' },
  Rejected:  { label: 'Ditolak',   bg: '#fee2e2', color: '#991b1b' },
  Missing:   { label: 'Tidak Ada', bg: '#f1f5f9', color: '#94a3b8' },
};
