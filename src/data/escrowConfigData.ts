// ─── FARM-FIX-005.8 — Escrow Settlement Configuration ─────────────────────────
// Stores per-chatId escrow settlement choice: TernakHub Escrow, External Escrow,
// or Direct Payment (no escrow).
//
// Architecture rules:
//  - One config record per chatId. Immutable once workflow is active.
//  - External Escrow records company/officer/reference for audit trail.
//  - Direct Payment records choice only — no fund management.
//  - Timeline appended on every change (non-destructive audit).
//  - AI MUST NOT read this file to make fund decisions.

import { generateUUID } from '../utils/uuid';
import { WORKSPACES } from '../components/TopAppBar';

// ─── Config Type ───────────────────────────────────────────────────────────────

export type EscrowConfigType = 'TernakHub' | 'External' | 'Direct';

export const ESCROW_CONFIG_TYPE_CONFIG: Record<
  EscrowConfigType,
  { icon: string; label: string; description: string; color: string; bg: string; border: string }
> = {
  TernakHub: {
    icon: '🏦',
    label: 'TernakHub Escrow',
    description: 'Dana ditahan oleh Escrow Officer TernakHub yang terverifikasi. Paling aman — dana tidak bisa dirilis tanpa konfirmasi Buyer.',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.07)',
    border: 'rgba(124,58,237,0.25)',
  },
  External: {
    icon: '🏢',
    label: 'Escrow Eksternal',
    description: 'Gunakan jasa escrow pihak ketiga di luar TernakHub. Catat detail layanan untuk rekap dan bukti audit.',
    color: '#d97706',
    bg: 'rgba(217,119,6,0.07)',
    border: 'rgba(217,119,6,0.25)',
  },
  Direct: {
    icon: '💸',
    label: 'Pembayaran Langsung',
    description: 'Buyer membayar langsung ke Seller tanpa perantara. Risiko ditanggung sendiri oleh kedua pihak.',
    color: '#16a34a',
    bg: 'rgba(22,163,74,0.07)',
    border: 'rgba(22,163,74,0.25)',
  },
};

// ─── External Escrow Details ───────────────────────────────────────────────────

export interface ExternalEscrowDetails {
  /** Nama perusahaan / layanan escrow eksternal */
  company: string;
  /** Nama petugas / officer yang menangani */
  officerName: string;
  /** Nomor referensi dari layanan eksternal */
  referenceNumber: string;
  /** Nomor telepon layanan eksternal */
  phone: string;
  /** Catatan tambahan */
  notes: string;
  /** ISO datetime pencatatan */
  recordedAt: string;
  /** WorkspaceId yang mencatat */
  recordedBy: string;
}

// ─── Timeline Event ────────────────────────────────────────────────────────────

export interface EscrowConfigTimelineEvent {
  id: string;
  eventType: string;
  description: string;
  actor: string;
  actorName: string;
  timestamp: string;
}

// ─── Config Record ─────────────────────────────────────────────────────────────

export interface EscrowConfigRecord {
  chatId: string;
  configType: EscrowConfigType;
  externalDetails: ExternalEscrowDetails | null;
  timeline: EscrowConfigTimelineEvent[];
  configuredAt: string;
  configuredBy: string;
  lastUpdatedAt: string;
}

// ─── In-Memory Store ──────────────────────────────────────────────────────────

const ESCROW_CONFIG_STORE = new Map<string, EscrowConfigRecord>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveWsName(id: string): string {
  return WORKSPACES.find(w => w.id === id)?.name ?? id;
}

function makeEvent(
  eventType: string,
  description: string,
  actor: string,
): EscrowConfigTimelineEvent {
  return {
    id: generateUUID(),
    eventType,
    description,
    actor,
    actorName: resolveWsName(actor),
    timestamp: new Date().toISOString(),
  };
}

// ─── Getters ──────────────────────────────────────────────────────────────────

export function getEscrowConfig(chatId: string): EscrowConfigRecord | undefined {
  return ESCROW_CONFIG_STORE.get(chatId);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Set or update the escrow configuration for a Transaction Room.
 * Switching config type resets external details.
 * Safe to call multiple times — each call appends to timeline.
 */
export function setEscrowConfig(
  chatId: string,
  configType: EscrowConfigType,
  byWorkspaceId: string,
): EscrowConfigRecord {
  const existing = ESCROW_CONFIG_STORE.get(chatId);
  const now = new Date().toISOString();
  const cfg = ESCROW_CONFIG_TYPE_CONFIG[configType];

  const event = makeEvent(
    'Konfigurasi Diubah',
    `Metode pembayaran dipilih: ${cfg.label}`,
    byWorkspaceId,
  );

  if (existing) {
    const wasExternal = existing.configType === 'External';
    existing.configType = configType;
    existing.lastUpdatedAt = now;
    // Reset external details when switching away from External
    if (wasExternal && configType !== 'External') {
      existing.externalDetails = null;
    }
    existing.timeline.push(event);
    return existing;
  }

  const record: EscrowConfigRecord = {
    chatId,
    configType,
    externalDetails: null,
    timeline: [event],
    configuredAt: now,
    configuredBy: byWorkspaceId,
    lastUpdatedAt: now,
  };

  ESCROW_CONFIG_STORE.set(chatId, record);
  return record;
}

/**
 * Record or update external escrow details.
 * Only valid when configType === 'External'.
 */
export function updateExternalEscrowDetails(
  chatId: string,
  details: Omit<ExternalEscrowDetails, 'recordedAt' | 'recordedBy'>,
  byWorkspaceId: string,
): EscrowConfigRecord | null {
  const record = ESCROW_CONFIG_STORE.get(chatId);
  if (!record || record.configType !== 'External') return null;

  const now = new Date().toISOString();
  record.externalDetails = {
    ...details,
    recordedAt: now,
    recordedBy: byWorkspaceId,
  };
  record.lastUpdatedAt = now;
  record.timeline.push(
    makeEvent(
      'Detail Eksternal Diperbarui',
      `Escrow eksternal: ${details.company} — Ref: ${details.referenceNumber || '(belum ada)'}`,
      byWorkspaceId,
    ),
  );
  return record;
}
