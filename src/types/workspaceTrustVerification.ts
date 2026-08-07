// ─── Workspace Trust & Verification domain contract ─────────────────────────
//
// The browser only receives these mapped records from the
// workspace-trust-verification Edge Function.

export type TrustVerificationStatus =
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

export type TrustVerificationType =
  | 'KTP'
  | 'NPWP'
  | 'SIUP'
  | 'Sertifikat'
  | 'LokasiUsaha'
  | 'Rekening'
  | 'Lainnya';

export type TrustVerificationAction = 'approve' | 'reject' | 'suspend' | 'reactivate';

export interface TrustEvidence {
  id: string;
  file_name: string;
  storage_url: string;
  file_type: string | null;
  description: string | null;
  uploaded_at: string;
}

export interface TrustTimelineEvent {
  id: string;
  action: string;
  actor_id: string | null;
  actor_name: string;
  previous_status: TrustVerificationStatus | null;
  next_status: TrustVerificationStatus | null;
  reason: string | null;
  created_at: string;
}

export interface TrustVerificationRecord {
  id: string;
  workspace_id: string;
  workspace_name: string;
  workspace_type: string | null;
  owner_name: string | null;
  verification_type: TrustVerificationType;
  status: TrustVerificationStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  expires_at: string | null;
  notes: string | null;
  trust_score: number | null;
  evidence: TrustEvidence[];
  timeline: TrustTimelineEvent[];
}

export interface TrustVerificationStats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
  suspended: number;
  unverified: number;
  average_score: number | null;
}

export interface TrustVerificationListResponse {
  records: TrustVerificationRecord[];
  stats: TrustVerificationStats;
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface TrustVerificationListQuery {
  page?: number;
  page_size?: number;
  search?: string;
  status?: TrustVerificationStatus | 'All';
  verification_type?: TrustVerificationType | 'All';
}

export interface TrustVerificationAuditEntry {
  id: string;
  action: string;
  actor_id: string | null;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}