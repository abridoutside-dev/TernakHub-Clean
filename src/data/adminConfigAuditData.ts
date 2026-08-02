// ─── Admin Configuration Audit Trail & Approval — P0-005-020B ────────────────
// In-memory store for config change audit trail and approval workflow.
//
// DESIGN:
//   • Each AdminSettingRecord produces one seed entry (sourced from
//     lastModifiedAt / lastModifiedBy — no fabrication).
//   • New changes are created as 'Pending', then approved/rejected.
//   • Single-admin path: caller approves immediately after creating (no block).
//   • Approved changes are written back into ADMIN_SETTINGS_LIST.currentValue.
//
// REACTIVITY: callers must manage their own tick / re-render after mutations.

import { ADMIN_SETTINGS_LIST } from './adminSettingsData';
import { generateUUID } from '../utils/uuid';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConfigAuditAction    = 'Create' | 'Update' | 'Delete' | 'Restore';
export type ConfigApprovalStatus = 'Draft'  | 'Pending' | 'Approved' | 'Rejected';

export interface ConfigAuditEntry {
  auditId:           string;
  configId:          string;            // matches AdminSettingRecord.id
  configKey:         string;
  configDisplayName: string;
  action:            ConfigAuditAction;
  oldValue:          string | null;     // null for 'Create'
  newValue:          string;
  changedBy:         string;
  changedAt:         string;            // 'YYYY-MM-DD HH:mm'
  approvalStatus:    ConfigApprovalStatus;
  approvedBy:        string | null;
  approvedAt:        string | null;
  rejectedBy:        string | null;
  rejectedAt:        string | null;
  rejectionReason:   string | null;
  notes:             string | null;
}

// ─── In-memory store ──────────────────────────────────────────────────────────
// Seeded from existing records: one Approved entry per config = known last state.

function buildSeedEntries(): ConfigAuditEntry[] {
  return ADMIN_SETTINGS_LIST.map(r => {
    const isInit =
      r.lastModifiedBy === 'System Init' ||
      r.lastModifiedBy === 'CI/CD Pipeline';
    return {
      auditId:           `AUDIT-SEED-${r.id}`,
      configId:          r.id,
      configKey:         r.key,
      configDisplayName: r.displayName,
      action:            isInit ? 'Create' : 'Update',
      oldValue:          isInit ? null : r.defaultValue,
      newValue:          r.currentValue,
      changedBy:         r.lastModifiedBy,
      changedAt:         r.lastModifiedAt,
      approvalStatus:    'Approved',
      approvedBy:        'System',
      approvedAt:        r.lastModifiedAt,
      rejectedBy:        null,
      rejectedAt:        null,
      rejectionReason:   null,
      notes:             r.notes ?? null,
    } satisfies ConfigAuditEntry;
  });
}

// Mutable log — mutations push / update entries in place.
const AUDIT_LOG: ConfigAuditEntry[] = buildSeedEntries();

// ─── Queries ──────────────────────────────────────────────────────────────────

/** All audit entries for a config, newest first. */
export function getAuditEntriesForConfig(configId: string): ConfigAuditEntry[] {
  return AUDIT_LOG
    .filter(e => e.configId === configId)
    .sort((a, b) => b.changedAt.localeCompare(a.changedAt));
}

/** First pending (Draft or Pending) entry for a config, or undefined. */
export function getPendingForConfig(configId: string): ConfigAuditEntry | undefined {
  return AUDIT_LOG.find(
    e => e.configId === configId &&
         (e.approvalStatus === 'Draft' || e.approvalStatus === 'Pending'),
  );
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export interface CreateChangeInput {
  configId:          string;
  configKey:         string;
  configDisplayName: string;
  oldValue:          string;
  newValue:          string;
  changedBy:         string;
  notes?:            string;
}

function nowStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Creates a Pending change request.
 *
 * Single-admin path: call approveConfigChange(entry.auditId, admin) right after
 * to apply immediately without blocking the operator.
 */
export function createConfigChangeRequest(input: CreateChangeInput): ConfigAuditEntry {
  const entry: ConfigAuditEntry = {
    auditId:           generateUUID(),
    configId:          input.configId,
    configKey:         input.configKey,
    configDisplayName: input.configDisplayName,
    action:            'Update',
    oldValue:          input.oldValue,
    newValue:          input.newValue,
    changedBy:         input.changedBy,
    changedAt:         nowStr(),
    approvalStatus:    'Pending',
    approvedBy:        null,
    approvedAt:        null,
    rejectedBy:        null,
    rejectedAt:        null,
    rejectionReason:   null,
    notes:             input.notes ?? null,
  };
  AUDIT_LOG.push(entry);
  return entry;
}

/**
 * Approves a Pending entry and writes the new value to the live config record.
 * Returns true on success.
 */
export function approveConfigChange(auditId: string, approvedBy: string): boolean {
  const entry = AUDIT_LOG.find(e => e.auditId === auditId);
  if (!entry || entry.approvalStatus !== 'Pending') return false;

  const at = nowStr();
  entry.approvalStatus = 'Approved';
  entry.approvedBy     = approvedBy;
  entry.approvedAt     = at;

  // Write back to the live config record so the table reflects the change.
  const record = ADMIN_SETTINGS_LIST.find(r => r.id === entry.configId);
  if (record) {
    record.currentValue   = entry.newValue;
    record.lastModifiedBy = entry.changedBy;
    record.lastModifiedAt = at;
  }

  return true;
}

/**
 * Rejects a Pending entry.
 * Returns true on success.
 */
export function rejectConfigChange(
  auditId:    string,
  rejectedBy: string,
  reason:     string,
): boolean {
  const entry = AUDIT_LOG.find(e => e.auditId === auditId);
  if (!entry || entry.approvalStatus !== 'Pending') return false;

  entry.approvalStatus  = 'Rejected';
  entry.rejectedBy      = rejectedBy;
  entry.rejectedAt      = nowStr();
  entry.rejectionReason = reason || 'Ditolak oleh admin.';

  return true;
}
