export type SubscriptionDbStatus = 'Aktif' | 'Trial' | 'Kadaluarsa' | 'Dibatalkan' | 'Ditangguhkan';

export interface SubscriptionPackage {
  id: string;
  plan_key: string;
  name: string;
  description: string | null;
  price_monthly: number | null;
  price_yearly: number | null;
  max_livestock: number | null;
  max_members: number | null;
  max_batches: number | null;
  max_listings: number | null;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  dependency_count?: number;
}

export interface SubscriptionPackageInput {
  plan_key: string;
  name: string;
  description?: string | null;
  price_monthly?: number | null;
  price_yearly?: number | null;
  max_livestock?: number | null;
  max_members?: number | null;
  max_batches?: number | null;
  max_listings?: number | null;
  features?: string[];
}

export interface SubscriptionWorkspaceOption {
  id: string;
  name: string;
  type: string;
  owner_id: string | null;
  owner_name: string | null;
  member_count: number;
  subscription_id: string | null;
}

export interface SubscriptionRecordAdmin {
  id: string;
  workspace_id: string;
  workspace_name: string;
  workspace_type: string;
  plan_id: string;
  plan_key: string;
  plan_name: string;
  status: SubscriptionDbStatus;
  started_at: string | null;
  expires_at: string | null;
  trial_ends_at: string | null;
  billing_cycle: 'monthly' | 'yearly' | null;
  auto_renew: boolean;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionHistoryEntryAdmin {
  id: string;
  subscription_id: string | null;
  workspace_id: string;
  workspace_name: string;
  action: string;
  from_plan_key: string | null;
  to_plan_key: string | null;
  from_status: SubscriptionDbStatus | null;
  to_status: SubscriptionDbStatus | null;
  note: string | null;
  changed_by: string | null;
  created_at: string;
}

export interface SubscriptionAuditEntry {
  id: string;
  workspace_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

export interface SubscriptionPreflight {
  package: SubscriptionPackage;
  dependencies: Array<{
    key: string;
    label: string;
    count: number;
    description: string;
    blocks_delete: boolean;
  }>;
  checked_at: string;
}

export interface SubscriptionAdminData {
  packages: SubscriptionPackage[];
  subscriptions: SubscriptionRecordAdmin[];
  workspaces: SubscriptionWorkspaceOption[];
  stats: {
    total_packages: number;
    active_packages: number;
    total_subscriptions: number;
    active_subscriptions: number;
    trial_subscriptions: number;
    expired_subscriptions: number;
  };
}