// ─── Workspace Trust & Verification Repository ──────────────────────────────
//
// The only browser adapter for Admin trust and verification. It never queries
// trust tables directly; all reads and writes go through the Edge Function.

import { supabase } from '../lib/supabase';
import type {
  TrustVerificationAction,
  TrustVerificationAuditEntry,
  TrustVerificationListQuery,
  TrustVerificationListResponse,
  TrustVerificationRecord,
} from '../types/workspaceTrustVerification';

export class WorkspaceTrustVerificationRepoError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'WorkspaceTrustVerificationRepoError';
  }
}

type Envelope<T> = { ok: true; data: T } | { ok: false; error?: string; code?: string };

async function invoke<T>(
  operation: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<Envelope<T>>(
    'workspace-trust-verification',
    { body: { action: 'workspace-trust-verification', operation, ...payload } },
  );
  if (error) {
    throw new WorkspaceTrustVerificationRepoError(
      error.message || 'Permintaan trust dan verifikasi gagal.',
    );
  }
  if (!data?.ok) {
    throw new WorkspaceTrustVerificationRepoError(
      data?.error || 'Operasi trust dan verifikasi gagal.',
      data?.code,
    );
  }
  return data.data;
}

export function repoListTrustVerifications(
  query: TrustVerificationListQuery = {},
): Promise<TrustVerificationListResponse> {
  return invoke('list', query as Record<string, unknown>);
}

export function repoGetTrustVerification(
  verificationId: string,
): Promise<TrustVerificationRecord | null> {
  return invoke('detail', { verification_id: verificationId });
}

export function repoTransitionTrustVerification(
  verificationId: string,
  action: TrustVerificationAction,
  reason?: string,
): Promise<TrustVerificationRecord> {
  return invoke('transition', {
    verification_id: verificationId,
    transition: action,
    reason: reason?.trim() || null,
  });
}

export function repoListTrustVerificationAudit(
  verificationId?: string,
): Promise<TrustVerificationAuditEntry[]> {
  return invoke('audit', { verification_id: verificationId || null });
}