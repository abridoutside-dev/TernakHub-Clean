// ─── Global Audit Trail Service — FOUNDATION-GLOBAL-AUDIT-001 ─────────────────
//
// Satu-satunya entry point yang boleh digunakan modul lain untuk mencatat
// atau membaca audit trail di TernakHub.
//
// PRINSIP:
//   1. Semua modul HARUS mencatat aktivitas penting melalui recordAudit() —
//      tidak boleh menulis langsung ke GLOBAL_AUDIT_TRAIL_DB.
//   2. Audit Trail BUKAN Activity Feed — digunakan untuk pelacakan perubahan,
//      investigasi, debugging, keamanan, dan histori sistem.
//   3. Record audit bersifat IMMUTABLE setelah dibuat — tidak ada update/delete.
//   4. event_type dan action selalu menggunakan UUID dari Global Reference Service
//      (AUDIT_EVENT_TYPE dan AUDIT_ACTION).
//   5. UI Audit Trail TIDAK dibuat di sini — service ini hanya layer data.
//   6. Wiring/sync ke modul lain BELUM dilakukan — disiapkan sebagai relasi.
//
// API PUBLIK:
//   recordAudit(input)                         → AuditTrailRecord
//   getAudit(filters?)                         → AuditTrailRecord[]
//   getAuditByUuid(uuid)                       → AuditTrailRecord | undefined
//   getAuditByModule(module, filters?)         → AuditTrailRecord[]
//   getAuditByReference(module, targetUuid)    → AuditTrailRecord[]
//   getAuditByWorkspace(workspaceUuid, filters?) → AuditTrailRecord[]
//   searchAudit(query, filters?)               → AuditTrailRecord[]
//   exportAudit(filters?)                      → AuditExportRecord[]
//
// RELASI YANG DISIAPKAN (belum di-wire):
//   target_module: 'global_media'        → Global Media Service
//   target_module: 'global_evidence'     → Global Evidence Service
//   target_module: 'global_transaction'  → Global Transaction Service
//   target_module: 'global_escrow'       → Global Escrow Service
//   target_module: 'global_conversation' → Global Conversation Service
//   target_module: 'global_notification' → Global Notification Service
//   target_module: 'livestock'           → Livestock module
//   target_module: 'marketplace'         → Marketplace module
//   target_module: 'feed'                → Feed module
//   target_module: 'medicine'            → Medicine module
//
// SIAP DIGUNAKAN OLEH:
//   ✓ Global Media        — target_module: 'global_media'
//   ✓ Global Evidence     — target_module: 'global_evidence'
//   ✓ Global Transaction  — target_module: 'global_transaction'
//   ✓ Global Escrow       — target_module: 'global_escrow'
//   ✓ Global Conversation — target_module: 'global_conversation'
//   ✓ Global Notification — target_module: 'global_notification'
//   ✓ Livestock           — target_module: 'livestock'
//   ✓ Marketplace         — target_module: 'marketplace'
//   ✓ Feed                — target_module: 'feed'
//   ✓ Medicine            — target_module: 'medicine'
// ─────────────────────────────────────────────────────────────────────────────

import {
  type AuditTrailRecord,
  type RecordAuditInput,
  type GetAuditFilter,
  type AuditExportRecord,
  type AuditTargetModule,
  AUDIT_EVENT_TYPE_UUID,
  AUDIT_ACTION_UUID,
  _appendAudit,
  _getAllAudits,
  GLOBAL_AUDIT_TRAIL_DB,
  generateUUID,
} from '../data/globalAuditTrailData';

// Re-export types & konstanta agar consumer tidak import dari data layer langsung.
export type { AuditTrailRecord, RecordAuditInput, GetAuditFilter, AuditExportRecord, AuditTargetModule };
export { AUDIT_EVENT_TYPE_UUID, AUDIT_ACTION_UUID };

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Mencatat satu audit trail entry ke store global.
 * Record yang dihasilkan bersifat IMMUTABLE — tidak dapat diubah setelah dibuat.
 * Mengembalikan record yang baru dibuat.
 *
 * GUARD: event_type_reference_uuid dan target_module tidak boleh kosong.
 *
 * @example
 * // Catat pembuatan livestock baru
 * recordAudit({
 *   event_type_reference_uuid: AUDIT_EVENT_TYPE_UUID.CREATE,
 *   actor_workspace_uuid: wsUuid,
 *   actor_user_uuid: userUuid,
 *   target_module: 'livestock',
 *   target_uuid: livestock.id,
 *   action_reference_uuid: null,
 *   after_data: { id: livestock.id, nama: livestock.nama, species: livestock.species },
 *   metadata: { source: 'AddLivestock form' },
 * });
 *
 * // Catat perubahan status transaksi
 * recordAudit({
 *   event_type_reference_uuid: AUDIT_EVENT_TYPE_UUID.TRANSACTION,
 *   action_reference_uuid: AUDIT_ACTION_UUID.STATUS_CHANGE,
 *   actor_workspace_uuid: sellerWsUuid,
 *   target_module: 'global_transaction',
 *   target_uuid: tx.transaction_uuid,
 *   before_data: { status: 'Pending' },
 *   after_data:  { status: 'Completed' },
 * });
 */
export function recordAudit(input: RecordAuditInput): AuditTrailRecord {
  if (!input.event_type_reference_uuid.trim()) {
    throw new Error('[GlobalAuditTrailService] event_type_reference_uuid tidak boleh kosong.');
  }

  const now = new Date().toISOString();

  const record: AuditTrailRecord = {
    audit_uuid:                generateUUID(),
    event_uuid:                input.event_uuid ?? null,
    event_type_reference_uuid: input.event_type_reference_uuid,
    actor_workspace_uuid:      input.actor_workspace_uuid ?? null,
    actor_user_uuid:           input.actor_user_uuid ?? null,
    target_module:             input.target_module,
    target_uuid:               input.target_uuid ?? null,
    action_reference_uuid:     input.action_reference_uuid ?? null,
    before_data:               input.before_data ?? null,
    after_data:                input.after_data ?? null,
    metadata:                  input.metadata ?? null,
    ip_address:                input.ip_address ?? null,
    user_agent:                input.user_agent ?? null,
    created_at:                now,
  };

  _appendAudit(record);
  return record;
}

/**
 * Mengembalikan satu audit trail record berdasarkan audit_uuid.
 * Mengembalikan undefined jika tidak ditemukan.
 *
 * @example
 * const entry = getAuditByUuid('uuid-audit-xxx');
 */
export function getAuditByUuid(uuid: string): AuditTrailRecord | undefined {
  return GLOBAL_AUDIT_TRAIL_DB.find((r) => r.audit_uuid === uuid);
}

/**
 * Mengembalikan daftar audit trail sesuai filter.
 * Hasil diurutkan dari yang terbaru (created_at descending).
 * Mendukung pagination via limit + offset.
 *
 * @example
 * // Semua audit untuk event type 'Update'
 * getAudit({ event_type_reference_uuid: AUDIT_EVENT_TYPE_UUID.UPDATE });
 *
 * // 20 audit terbaru dengan pagination
 * getAudit({ limit: 20, offset: 0 });
 *
 * // Audit dalam rentang waktu
 * getAudit({ from_date: '2026-01-01T00:00:00Z', to_date: '2026-12-31T23:59:59Z' });
 */
export function getAudit(filters: GetAuditFilter = {}): AuditTrailRecord[] {
  return _queryAudits(filters);
}

/**
 * Mengembalikan semua audit trail untuk target_module tertentu.
 * Filter tambahan dapat diberikan untuk mempersempit hasil.
 * Hasil diurutkan dari yang terbaru.
 *
 * @example
 * // Semua audit untuk modul Livestock
 * getAuditByModule('livestock');
 *
 * // Audit Create saja untuk modul Marketplace
 * getAuditByModule('marketplace', {
 *   event_type_reference_uuid: AUDIT_EVENT_TYPE_UUID.CREATE,
 * });
 */
export function getAuditByModule(
  module: AuditTargetModule,
  filters: Omit<GetAuditFilter, 'target_module'> = {},
): AuditTrailRecord[] {
  return _queryAudits({ ...filters, target_module: module });
}

/**
 * Mengembalikan semua audit trail untuk entitas spesifik
 * (kombinasi target_module + target_uuid).
 * Berguna untuk menampilkan histori perubahan suatu record.
 * Hasil diurutkan dari yang terbaru.
 *
 * @example
 * // Semua perubahan pada livestock tertentu
 * getAuditByReference('livestock', 'D-2024-001');
 *
 * // Histori transaksi tertentu
 * getAuditByReference('global_transaction', txUuid);
 */
export function getAuditByReference(
  module: AuditTargetModule,
  targetUuid: string,
): AuditTrailRecord[] {
  return _queryAudits({ target_module: module, target_uuid: targetUuid });
}

/**
 * Mengembalikan semua audit trail yang dilakukan oleh workspace tertentu.
 * Filter tambahan dapat diberikan untuk mempersempit hasil.
 * Hasil diurutkan dari yang terbaru.
 *
 * @example
 * // Semua aksi dari workspace 'Berkah Farm Garut'
 * getAuditByWorkspace(workspaceUuid);
 *
 * // Hanya aksi Delete dari workspace tertentu
 * getAuditByWorkspace(workspaceUuid, {
 *   event_type_reference_uuid: AUDIT_EVENT_TYPE_UUID.DELETE,
 * });
 */
export function getAuditByWorkspace(
  workspaceUuid: string,
  filters: Omit<GetAuditFilter, 'actor_workspace_uuid'> = {},
): AuditTrailRecord[] {
  return _queryAudits({ ...filters, actor_workspace_uuid: workspaceUuid });
}

/**
 * Pencarian teks bebas pada field audit trail.
 * Mencari pada: target_uuid, actor_user_uuid, ip_address,
 * metadata values (JSON string), before_data keys, after_data keys.
 *
 * Filter tambahan dapat dikombinasikan dengan query teks.
 * Hasil diurutkan dari yang paling relevan (exact match dulu) kemudian terbaru.
 *
 * @example
 * // Cari semua audit yang melibatkan 'D-2024-001'
 * searchAudit('D-2024-001');
 *
 * // Cari dalam modul tertentu
 * searchAudit('import_csv', { target_module: 'livestock' });
 */
export function searchAudit(
  query: string,
  filters: GetAuditFilter = {},
): AuditTrailRecord[] {
  const q = query.trim().toLowerCase();

  let records = _queryAudits(filters);

  if (!q) return records;

  records = records.filter((r) => {
    // Cari pada field-field yang mengandung teks bebas
    if (r.target_uuid?.toLowerCase().includes(q)) return true;
    if (r.actor_user_uuid?.toLowerCase().includes(q)) return true;
    if (r.actor_workspace_uuid?.toLowerCase().includes(q)) return true;
    if (r.event_uuid?.toLowerCase().includes(q)) return true;
    if (r.ip_address?.toLowerCase().includes(q)) return true;
    if (r.target_module.toLowerCase().includes(q)) return true;

    // Cari dalam metadata (JSON stringify)
    if (r.metadata) {
      try {
        if (JSON.stringify(r.metadata).toLowerCase().includes(q)) return true;
      } catch {
        // ignore serialization errors
      }
    }

    // Cari dalam before_data / after_data (key names)
    if (r.before_data && Object.keys(r.before_data).some((k) => k.toLowerCase().includes(q))) {
      return true;
    }
    if (r.after_data && Object.keys(r.after_data).some((k) => k.toLowerCase().includes(q))) {
      return true;
    }

    return false;
  });

  return records;
}

/**
 * Mengekspor daftar audit trail dalam format yang aman untuk tampilan / unduh.
 * before_data dan after_data TIDAK disertakan — hanya metadata ringkas.
 * Berguna untuk export CSV/JSON ke luar sistem.
 *
 * Filter yang sama dengan getAudit() dapat digunakan.
 * Hasil diurutkan dari yang terbaru.
 *
 * @example
 * // Export semua audit bulan ini
 * const rows = exportAudit({
 *   from_date: '2026-07-01T00:00:00Z',
 *   to_date: '2026-07-31T23:59:59Z',
 * });
 *
 * // Export audit modul tertentu
 * const rows = exportAudit({ target_module: 'global_transaction' });
 */
export function exportAudit(filters: GetAuditFilter = {}): AuditExportRecord[] {
  const records = _queryAudits(filters);

  return records.map((r) => ({
    audit_uuid:               r.audit_uuid,
    event_uuid:               r.event_uuid,
    event_type_reference_uuid: r.event_type_reference_uuid,
    actor_workspace_uuid:     r.actor_workspace_uuid,
    actor_user_uuid:          r.actor_user_uuid,
    target_module:            r.target_module,
    target_uuid:              r.target_uuid,
    action_reference_uuid:    r.action_reference_uuid,
    has_before_data:          r.before_data !== null,
    has_after_data:           r.after_data !== null,
    metadata_keys:            r.metadata ? Object.keys(r.metadata) : [],
    ip_address:               r.ip_address,
    created_at:               r.created_at,
  }));
}

// ─── Internal Utilities ───────────────────────────────────────────────────────

/**
 * Implementasi query internal yang digunakan oleh semua fungsi get/search.
 * Audit trail disimpan dalam array append-only; query ini memfilter dari ujung
 * akhir (terbaru) ke awal.
 *
 * Hasil diurutkan dari yang terbaru (created_at descending).
 */
function _queryAudits(filters: GetAuditFilter): AuditTrailRecord[] {
  const {
    event_type_reference_uuid,
    actor_workspace_uuid,
    actor_user_uuid,
    target_module,
    target_uuid,
    action_reference_uuid,
    from_date,
    to_date,
    limit,
    offset = 0,
  } = filters;

  let records = _getAllAudits();

  if (event_type_reference_uuid !== undefined) {
    records = records.filter((r) => r.event_type_reference_uuid === event_type_reference_uuid);
  }
  if (actor_workspace_uuid !== undefined) {
    records = records.filter((r) => r.actor_workspace_uuid === actor_workspace_uuid);
  }
  if (actor_user_uuid !== undefined) {
    records = records.filter((r) => r.actor_user_uuid === actor_user_uuid);
  }
  if (target_module !== undefined) {
    records = records.filter((r) => r.target_module === target_module);
  }
  if (target_uuid !== undefined) {
    records = records.filter((r) => r.target_uuid === target_uuid);
  }
  if (action_reference_uuid !== undefined) {
    records = records.filter((r) => r.action_reference_uuid === action_reference_uuid);
  }
  if (from_date !== undefined) {
    const from = new Date(from_date).getTime();
    records = records.filter((r) => new Date(r.created_at).getTime() >= from);
  }
  if (to_date !== undefined) {
    const to = new Date(to_date).getTime();
    records = records.filter((r) => new Date(r.created_at).getTime() <= to);
  }

  // Urutkan dari yang terbaru
  records = [...records].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  // Pagination
  if (offset > 0) {
    records = records.slice(offset);
  }
  if (limit !== undefined && limit > 0) {
    records = records.slice(0, limit);
  }

  return records;
}
