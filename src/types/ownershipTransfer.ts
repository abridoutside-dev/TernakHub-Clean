// ─── Ownership Transfer domain contract ───────────────────────────────────────
//
// The browser uses this stable contract. Database enum translation and joins
// are owned by the ownership-transfers Edge Function.

export type OwnershipTransferStatus =
  | 'Draft'
  | 'Requested'
  | 'PendingVerification'
  | 'Approved'
  | 'Rejected'
  | 'Completed'
  | 'Cancelled'
  | 'Failed';

export type OwnershipTransferAction = 'approve' | 'reject' | 'cancel';

export interface OwnershipTransferUser {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
}

export interface OwnershipTransferWorkspace {
  workspace_id: string;
  workspace_name: string;
  workspace_type: string;
  workspace_slug: string;
  location: string;
  owner_user_id: string;
  member_count: number;
}

export interface OwnershipTransferDependency {
  key: string;
  label: string;
  count: number;
  description: string;
  blocks_transfer: boolean;
}

export interface OwnershipTransferHistoryEntry {
  id: string;
  from_status: OwnershipTransferStatus | null;
  to_status: OwnershipTransferStatus;
  changed_by: string;
  reason: string | null;
  created_at: string;
}

export interface OwnershipTransferAuditEntry {
  id: string;
  action: string;
  user_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

export interface OwnershipTransferRecord {
  transfer_id: string;
  workspace: OwnershipTransferWorkspace;
  current_owner: OwnershipTransferUser;
  proposed_owner: OwnershipTransferUser;
  status: OwnershipTransferStatus;
  reason: string | null;
  notes: string | null;
  requested_at: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  dependencies?: OwnershipTransferDependency[];
  history?: OwnershipTransferHistoryEntry[];
  audit_log?: OwnershipTransferAuditEntry[];
}

export interface OwnershipTransferStats {
  total: number;
  requested: number;
  pending_verification: number;
  approved: number;
  rejected: number;
  cancelled: number;
  completed: number;
}

export interface OwnershipTransferWorkspaceOption extends OwnershipTransferWorkspace {
  owner: OwnershipTransferUser;
}

export interface OwnershipTransferListResponse {
  transfers: OwnershipTransferRecord[];
  workspaces: OwnershipTransferWorkspaceOption[];
  users: OwnershipTransferUser[];
  stats: OwnershipTransferStats;
}

export interface CreateOwnershipTransferInput {
  workspace_id: string;
  to_user_id: string;
  reason?: string;
  notes?: string;
}

export interface OwnershipTransferPreflight {
  transfer: OwnershipTransferRecord;
  dependencies: OwnershipTransferDependency[];
  checked_at: string;
}