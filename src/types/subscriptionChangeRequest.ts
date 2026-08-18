export type SubscriptionChangeRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface SubscriptionChangeRequest {
  id: string;
  workspace_id: string;
  subscription_id: string | null;
  requested_by: string;
  from_plan_key: string;
  to_plan_key: string;
  status: SubscriptionChangeRequestStatus;
  note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  workspace_name?: string;
  owner_name?: string;
}

export interface CreateSubscriptionChangeRequestInput {
  workspace_id: string;
  subscription_id?: string | null;
  from_plan_key: string;
  to_plan_key: string;
  note?: string | null;
  requested_by: string;
}
