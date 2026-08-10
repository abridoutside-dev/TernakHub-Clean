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
  TrustVerificationPreflight,
  TrustVerificationRecord,
  TrustVerificationType,
} from '../types/workspaceTrustVerification';

export class WorkspaceTrustVerificationRepoError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'WorkspaceTrustVerificationRepoError';
  }
}

type Envelope<T> = { ok: true; data: T } | { ok: false; error?: string; code?: string };

function isResponse(value: unknown): value is Response {
  return typeof Response !== 'undefined' && value instanceof Response;
}

async function errorMessage(error: unknown, fallback: string): Promise<string> {
  if (error && typeof error === 'object') {
    const candidate = error as { message?: unknown; context?: unknown };
    if (isResponse(candidate.context)) {
      try {
        const raw = await candidate.context.clone().text();
        if (raw.trim()) {
          const body = JSON.parse(raw) as Record<string, unknown>;
          const message = [body.error, body.message, body.error_description, body.msg, body.details, body.hint]
            .find(value => typeof value === 'string' && value.trim());
          if (typeof message === 'string') return message.replace(/\s+/g, ' ').trim();
        }
      } catch {
        // Fall through to the SDK error below.
      }
      if (candidate.context.status) return fallback;
    }
    if (typeof candidate.message === 'string' && candidate.message.trim()
      && !/edge function returned.*non-2xx|failed to send a request/i.test(candidate.message)) {
      return candidate.message.replace(/\s+/g, ' ').trim();
    }
  }
  return fallback;
}

async function invoke<T>(
  operation: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<Envelope<T>>(
    'workspace-trust-verification',
    { body: { action: 'workspace-trust-verification', operation, ...payload } },
  );
  if (error) {
    throw new WorkspaceTrustVerificationRepoError(await errorMessage(error, 'Permintaan trust dan verifikasi gagal.'));
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

export function repoGetTrustVerificationPreflight(
  verificationId: string,
): Promise<TrustVerificationPreflight> {
  return invoke('preflight', { verification_id: verificationId });
}

export function repoSubmitTrustVerification(
  workspaceId: string,
  verificationType: TrustVerificationType,
): Promise<TrustVerificationRecord> {
  return invoke('submit', {
    workspace_id: workspaceId,
    verification_type: verificationType,
  });
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