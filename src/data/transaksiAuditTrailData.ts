// ─── PROFILE-006 — Transaction Audit Trail Foundation ────────────────────────
// Audit Trail menyimpan metadata kejadian penting dalam transaksi.
// Mengacu pada: docs/architecture/TRANSACTION_CONVERSATION_CONSTITUTION.md
//
// Aturan utama:
//  - Audit Trail hanya menyimpan METADATA — bukan salinan Chat atau Evidence.
//  - Audit Trail bersifat PERMANEN — tidak dapat dihapus.
//  - Audit Trail dibaca oleh seluruh Participant yang terlibat.
//  - addAuditEvent() adalah satu-satunya cara menulis ke Audit Trail.

import { generateUUID } from '../utils/uuid';
import {
  getTransaksiById,
  type TransaksiStatus,
} from './marketplaceTransaksiData';
import { WORKSPACES } from '../components/TopAppBar';

// ─── Tipe ─────────────────────────────────────────────────────────────────────

export type AuditEvent =
  | 'Conversation Created'
  | 'Deal'
  | 'Payment Requested'
  | 'Payment Confirmed'
  | 'Holding Fund'
  | 'Delivery Started'
  | 'Delivery Finished'
  | 'Arrival Confirmed'
  | 'Dispute Opened'
  | 'Dispute Closed'
  | 'Transfer Released'
  | 'Final Confirmation'
  // ─── Transport Events (PROFILE-008) ───────────────────────────────────────
  | 'Transport Assigned'
  | 'Transport Pickup'
  | 'Transport Loading'
  | 'Transport Departure'
  | 'Transport Arrived'
  | 'Transport Unloading'
  | 'Transport Completed';

export type AuditActorRole = 'Buyer' | 'Seller' | 'Escrow' | 'Transport' | 'Veterinarian' | 'System';

// ─── Audit Trail Record ───────────────────────────────────────────────────────

export interface AuditTrailRecord {
  /** UUID v4 */
  id: string;
  transaksiId: string;
  event: AuditEvent;
  /** workspaceId atau 'System' */
  actor: string;
  actorNama: string;
  actorRole: AuditActorRole;
  /** ISO datetime */
  timestamp: string;
  description: string;
  /** Hanya metadata — bukan salinan data */
  metadata?: Record<string, string | number | boolean>;
}

// ─── Konfigurasi Event ────────────────────────────────────────────────────────

export const AUDIT_EVENT_CONFIG: Record<
  AuditEvent,
  { icon: string; color: string; bg: string; label: string }
> = {
  'Conversation Created': { icon: '💬', color: '#1565c0', bg: '#e3f2fd', label: 'Conversation Dibuat' },
  'Deal':                 { icon: '🤝', color: '#1b7a43', bg: '#e8f5ee', label: 'Deal Disepakati' },
  'Payment Requested':    { icon: '💳', color: '#e65100', bg: '#fff3e0', label: 'Pembayaran Diminta' },
  'Payment Confirmed':    { icon: '✅', color: '#1b7a43', bg: '#e8f5ee', label: 'Pembayaran Dikonfirmasi' },
  'Holding Fund':         { icon: '🔐', color: '#7b5e2a', bg: '#fff8e1', label: 'Dana Ditahan Escrow' },
  'Delivery Started':     { icon: '🚚', color: '#006064', bg: '#e0f7fa', label: 'Pengiriman Dimulai' },
  'Delivery Finished':    { icon: '📍', color: '#6a1b9a', bg: '#f3e5f5', label: 'Pengiriman Selesai' },
  'Arrival Confirmed':    { icon: '🏁', color: '#1b7a43', bg: '#e8f5ee', label: 'Kedatangan Dikonfirmasi' },
  'Dispute Opened':       { icon: '⚠️', color: '#c62828', bg: '#ffebee', label: 'Sengketa Dibuka' },
  'Dispute Closed':       { icon: '🔒', color: '#5d4037', bg: '#efebe9', label: 'Sengketa Ditutup' },
  'Transfer Released':    { icon: '💸', color: '#1565c0', bg: '#e3f2fd', label: 'Dana Dilepaskan' },
  'Final Confirmation':   { icon: '🎉', color: '#1b5e20', bg: '#e8f5ee', label: 'Konfirmasi Akhir' },
  // ─── Transport Events (PROFILE-008) ─────────────────────────────────────
  'Transport Assigned':   { icon: '🚛', color: '#5d4037', bg: '#efebe9', label: 'Transport Ditugaskan' },
  'Transport Pickup':     { icon: '🚗', color: '#1565c0', bg: '#e3f2fd', label: 'Transport Siap Jemput' },
  'Transport Loading':    { icon: '📦', color: '#e65100', bg: '#fff3e0', label: 'Transport Loading' },
  'Transport Departure':  { icon: '🚚', color: '#006064', bg: '#e0f7fa', label: 'Transport Berangkat' },
  'Transport Arrived':    { icon: '📍', color: '#6a1b9a', bg: '#f3e5f5', label: 'Transport Tiba' },
  'Transport Unloading':  { icon: '🏗️', color: '#7b5e2a', bg: '#fff8e1', label: 'Transport Unloading' },
  'Transport Completed':  { icon: '🏁', color: '#1b5e20', bg: '#e8f5ee', label: 'Pengiriman Selesai' },
};

// ─── Retention ────────────────────────────────────────────────────────────────

/** Audit Trail disimpan permanen — tidak terikat periode retensi Chat. */
export const AUDIT_TRAIL_RETENTION = {
  retentionDays: null as null,
  label: 'Permanen (kebijakan sistem)',
};

// ─── In-memory Store ──────────────────────────────────────────────────────────

let AUDIT_TRAIL: AuditTrailRecord[] = [];
let _seeded = false;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWorkspaceNama(id: string): string {
  return WORKSPACES.find((w) => w.id === id)?.name ?? id;
}

function makeRecord(
  transaksiId: string,
  event: AuditEvent,
  actor: string,
  actorRole: AuditActorRole,
  timestamp: string,
  description: string,
  metadata?: Record<string, string | number | boolean>,
): AuditTrailRecord {
  return {
    id: generateUUID(),
    transaksiId,
    event,
    actor,
    actorNama: actor === 'System' ? 'System' : getWorkspaceNama(actor),
    actorRole,
    timestamp,
    description,
    metadata,
  };
}

/** Peta TransaksiStatus → AuditEvent (best-match). */
const STATUS_TO_EVENT: Partial<Record<TransaksiStatus, AuditEvent>> = {
  'Disetujui':           'Deal',
  'Menunggu Pembayaran': 'Payment Requested',
  'Diproses':            'Payment Confirmed',
  'Sedang Dikirim':      'Delivery Started',
  'Selesai':             'Final Confirmation',
};

// ─── Seed Data ────────────────────────────────────────────────────────────────

function seedIfNeeded(): void {
  if (_seeded) return;
  _seeded = true;

  const SEED_IDS = [
    'TRX-20260711-001',
    'TRX-20260711-002',
    'TRX-20260712-004',
    'TRX-20260712-005',
  ];

  for (const transaksiId of SEED_IDS) {
    const trx = getTransaksiById(transaksiId);
    if (!trx) continue;

    // Event pertama: Conversation Created
    AUDIT_TRAIL.push(
      makeRecord(
        transaksiId,
        'Conversation Created',
        'System',
        'System',
        trx.riwayatStatus[0]?.timestamp ?? trx.createdAt + 'T00:00:00.000Z',
        `Conversation untuk transaksi ${transaksiId} dibuat otomatis saat transaksi diproses.`,
        { listingJudul: trx.judulListing },
      ),
    );

    // Konversi setiap riwayatStatus ke AuditEvent yang relevan
    for (const entry of trx.riwayatStatus) {
      const event = STATUS_TO_EVENT[entry.status];
      if (!event) continue;

      // Actor: penjual untuk Deal/Delivery, pembeli untuk Payment, System untuk sisanya
      let actor = 'System';
      let actorRole: AuditActorRole = 'System';
      if (event === 'Deal') {
        actor = trx.workspaceIdPenjual;
        actorRole = 'Seller';
      } else if (event === 'Payment Requested' || event === 'Payment Confirmed') {
        actor = trx.workspaceIdPembeli;
        actorRole = 'Buyer';
      } else if (event === 'Delivery Started') {
        actor = trx.workspaceIdPenjual;
        actorRole = 'Seller';
      } else if (event === 'Final Confirmation') {
        actor = 'System';
        actorRole = 'System';
      }

      const description = entry.catatan
        ? `${entry.status}: ${entry.catatan}`
        : `Status transaksi berubah menjadi "${entry.status}".`;

      AUDIT_TRAIL.push(
        makeRecord(
          transaksiId,
          event,
          actor,
          actorRole,
          entry.timestamp,
          description,
          { statusBaru: entry.status },
        ),
      );
    }
  }
}

// ─── Fungsi Publik ────────────────────────────────────────────────────────────

/**
 * Mengambil seluruh Audit Trail untuk satu transaksi, diurutkan terbaru → terlama.
 */
export function getAuditTrailByTransaksiId(transaksiId: string): AuditTrailRecord[] {
  seedIfNeeded();
  return AUDIT_TRAIL
    .filter((r) => r.transaksiId === transaksiId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/**
 * Menambah event ke Audit Trail.
 * Dipanggil oleh mutation functions lain (Escrow, Transport, dst.) — bukan oleh UI langsung.
 */
export function addAuditEvent(
  transaksiId: string,
  event: AuditEvent,
  actor: string,
  actorRole: AuditActorRole,
  description: string,
  metadata?: Record<string, string | number | boolean>,
): AuditTrailRecord {
  seedIfNeeded();
  const record = makeRecord(
    transaksiId,
    event,
    actor,
    actorRole,
    new Date().toISOString(),
    description,
    metadata,
  );
  AUDIT_TRAIL.push(record);
  return record;
}
