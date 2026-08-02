// ─── Pemberian Pakan — Data Layer (LP-002 / LP-003) ──────────────────────────
// LP-002: pencatatan sesi pemberian pakan (Draft / Siap Diproses).
// LP-003: penyelesaian atomik — mengurangi Stok Pakan, mencatat Riwayat Stok,
//         dan menghubungkan keduanya via UUID. Rollback otomatis jika gagal.
//
// Semua pakan WAJIB berasal dari Inventaris Stok Pakan; modul ini tidak boleh
// menerima referensi langsung dari Master Pakan, Produk Komersial, atau Formula.

import {
  addPerubahanStok,
  rollbackPerubahanStok,
  getInventarisById,
} from './stokInventarisData';
import { getActiveBatchMembersWithLivestock } from './batchData';
import { getTodayISO as todayIso } from '../utils/dateUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PemberianPakanStatus =
  | 'Draft'
  | 'Siap Diproses'
  | 'Pemberian Pakan Selesai';  // LP-003: stok sudah dikurangi

/** Satu item pakan dalam satu sesi pemberian. */
export interface PemberianPakanItem {
  inventarisId: string;
  namaPakan: string;
  brand?: string;
  kategori: string;
  sumber: string;          // 'Master Pakan' | 'Produk Komersial'
  jumlah: number;
  satuan: string;
  stokSebelum: number;     // snapshot — jumlahStok saat pencatatan (LP-002)
  nomorBatch?: string;
  lokasiPenyimpanan?: string;
  // ── LP-003 UUID links (opsional — terisi dari referensiId item inventaris) ──
  masterPakanUuid?: string;
  produkKomersialUuid?: string;
  formulaUuid?: string;
  /** UUID PerubahanStokRecord yang dibuat saat selesaikan (diisi LP-003). */
  riwayatStokId?: string;
}

/** Satu sesi pemberian pakan (bisa multi-item pakan). */
export interface PemberianPakanRecord {
  id: string;
  targetKind: 'individu' | 'batch';
  targetId: string;                 // Livestock UUID atau Batch UUID
  targetName: string | null;
  targetIcon: string;
  targetTypeBg: string;
  tanggal: string;                  // ISO date yyyy-mm-dd
  waktuPemberian: string;           // HH:mm
  items: PemberianPakanItem[];
  catatan?: string;
  petugas?: string;                 // nama/id petugas (opsional)
  status: PemberianPakanStatus;
  createdAt: string;                // ISO timestamp
  // ── LP-003: diisi setelah selesaikan ──
  /** ISO timestamp saat selesaikan berhasil. */
  selesaiAt?: string;
  /** UUID-uuid PerubahanStokRecord yang terhubung (satu per item). */
  riwayatStokIds?: string[];
  /** LP-004: id JadwalPemberianRecord asal, jika pencatatan ini berasal dari "Laksanakan Jadwal". Hanya tautan riwayat — jadwal itu sendiri tidak pernah menulis ke sini secara otomatis. */
  sumberJadwalId?: string;
  /**
   * BT-003: diisi HANYA pada child record individu yang dibuat otomatis saat
   * sesi pemberian pakan Batch induk diselesaikan. Menautkan ke
   * PemberianPakanRecord.id (targetKind:'batch') asal. Child record ini
   * TIDAK pernah mengurangi stok sendiri — riwayatStokIds-nya menunjuk ke
   * PerubahanStokRecord yang sama dengan induknya (satu pengurangan stok
   * untuk keseluruhan batch, bukan per-ekor).
   */
  parentPemberianPakanId?: string;
}

// ─── In-memory stores ─────────────────────────────────────────────────────────

const PEMBERIAN_PAKAN_DB: PemberianPakanRecord[] = [];

// ─── Timeline (CP-SYNC-001) ───────────────────────────────────────────────────
// Every completed feed session is appended here so the module has a structured
// Timeline log — matching the pattern of BATCH_TIMELINE_LOG (batchData.ts) and
// WEIGHT_TIMELINE_LOG (livestockData.ts).
// The log is in-memory (same as all other Timeline logs in this codebase).

export type PakanTimelineEventType =
  | 'feed_session_completed';   // selesaikanPemberianPakan succeeded

export type PakanTimelineEvent = {
  id:          string;
  type:        PakanTimelineEventType;
  recordId:    string;          // PemberianPakanRecord.id
  targetKind:  'individu' | 'batch';
  targetId:    string;
  targetName:  string | null;
  tanggal:     string;          // ISO date yyyy-mm-dd (session date)
  recordedAt:  string;          // ISO timestamp (when the event was logged)
  notes:       string | null;
};

export const PAKAN_TIMELINE_LOG: PakanTimelineEvent[] = [];

/** Append a feed event to the immutable timeline log. Internal use only. */
function addPakanTimelineEvent(
  event: Omit<PakanTimelineEvent, 'id' | 'recordedAt'>,
): PakanTimelineEvent {
  const entry: PakanTimelineEvent = {
    id: `ptl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    recordedAt: new Date().toISOString(),
    ...event,
  };
  PAKAN_TIMELINE_LOG.push(entry);
  return entry;
}

/** All timeline events for a specific target (livestock or batch), newest → oldest. */
export function getPakanTimeline(targetId: string): PakanTimelineEvent[] {
  return PAKAN_TIMELINE_LOG
    .filter((e) => e.targetId === targetId)
    .slice()
    .reverse();
}

/** Most-recent feed timeline events across all targets, newest → oldest. */
export function getRecentPakanEvents(limit = 5): PakanTimelineEvent[] {
  return PAKAN_TIMELINE_LOG
    .slice()
    .reverse()
    .slice(0, limit);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isExpiredCheck(kadaluarsa?: string): boolean {
  if (!kadaluarsa) return false;
  return kadaluarsa < todayIso();
}

// ─── Accessors ────────────────────────────────────────────────────────────────

// ─── Supabase read-path (FLOW-003M19) ─────────────────────────────────────────

/** Minimal subset of a pemberian_pakan DB row — avoids importing repository types into the data layer. */
interface PemberianPakanDbRowMinimal {
  id:           string;
  livestock_id: string | null;
  batch_id:     string | null;
  feed_date:    string;
  feed_time:    string | null;
  amount_kg:    number;
  notes:        string | null;
  created_at:   string;
}

/**
 * Hydrates PEMBERIAN_PAKAN_DB from Supabase pemberian_pakan rows.
 * Creates one synthetic single-item PemberianPakanRecord per DB row because
 * individual feed items are not stored in the DB (only the total amount_kg is).
 * If rows is empty, existing session records are preserved intact.
 *
 * Called by usePemberianPakan() on workspace mount / change.
 */
export function populatePemberianPakanFromDb(rows: PemberianPakanDbRowMinimal[]): void {
  if (rows.length === 0) return;

  // Retain any in-progress drafts created in this session that aren't yet in DB
  const inProgress = PEMBERIAN_PAKAN_DB.filter((r) => r.status !== 'Pemberian Pakan Selesai');
  const sessionIds = new Set(PEMBERIAN_PAKAN_DB.map((r) => r.id));

  // Clear everything; re-add drafts, then DB-sourced completed records
  PEMBERIAN_PAKAN_DB.splice(0, PEMBERIAN_PAKAN_DB.length, ...inProgress);

  for (const row of rows) {
    // Skip if a session record with this id is already present (just completed)
    if (sessionIds.has(row.id)) continue;

    const targetKind: 'individu' | 'batch' = row.livestock_id ? 'individu' : 'batch';
    const targetId = row.livestock_id ?? row.batch_id ?? '';

    const syntheticItem: PemberianPakanItem = {
      inventarisId:  '',
      namaPakan:     'Pemberian Pakan',
      kategori:      '',
      sumber:        '',
      jumlah:        row.amount_kg,
      satuan:        'Kg',
      stokSebelum:   0,
    };

    const record: PemberianPakanRecord = {
      id:             row.id,
      targetKind,
      targetId,
      targetName:     null,
      targetIcon:     targetKind === 'individu' ? '🐑' : '📦',
      targetTypeBg:   targetKind === 'individu' ? 'bg-green-100' : 'bg-blue-100',
      tanggal:        row.feed_date,
      waktuPemberian: row.feed_time ?? '',
      items:          [syntheticItem],
      catatan:        row.notes ?? undefined,
      status:         'Pemberian Pakan Selesai',
      createdAt:      row.created_at,
      selesaiAt:      row.created_at,
    };

    PEMBERIAN_PAKAN_DB.push(record);
  }
}

// ─── Accessors ────────────────────────────────────────────────────────────────

/** Seluruh catatan pemberian pakan, terbaru di atas. */
export function getPemberianPakanList(): PemberianPakanRecord[] {
  return [...PEMBERIAN_PAKAN_DB].reverse();
}

/** Satu catatan berdasarkan id. */
export function getPemberianPakanById(id: string): PemberianPakanRecord | undefined {
  return PEMBERIAN_PAKAN_DB.find((r) => r.id === id);
}

/** Catatan untuk satu ternak atau batch tertentu (terbaru di atas). */
export function getPemberianPakanByTarget(targetId: string): PemberianPakanRecord[] {
  return [...PEMBERIAN_PAKAN_DB]
    .filter((r) => r.targetId === targetId)
    .reverse();
}

// ─── LP-002: Add (create) ──────────────────────────────────────────────────────

export interface AddPemberianPakanInput {
  targetKind: 'individu' | 'batch';
  targetId: string;
  targetName: string | null;
  targetIcon: string;
  targetTypeBg: string;
  tanggal: string;
  waktuPemberian: string;
  items: PemberianPakanItem[];
  catatan?: string;
  petugas?: string;
  status: PemberianPakanStatus;
  /** LP-004: diisi jika pencatatan ini dibuat lewat "Laksanakan Jadwal". */
  sumberJadwalId?: string;
}

/**
 * Mencatat sesi pemberian pakan. Belum mengurangi stok inventaris — itu LP-003.
 * Melempar Error jika validasi dasar gagal.
 */
export function addPemberianPakan(input: AddPemberianPakanInput): PemberianPakanRecord {
  if (input.items.length === 0) throw new Error('Minimal satu item pakan harus dipilih.');
  for (const item of input.items) {
    if (item.jumlah <= 0) throw new Error(`Jumlah untuk "${item.namaPakan}" harus lebih dari nol.`);
    if (item.jumlah > item.stokSebelum) {
      throw new Error(`Jumlah "${item.namaPakan}" melebihi stok tersedia (${item.stokSebelum} ${item.satuan}).`);
    }
  }

  const record: PemberianPakanRecord = {
    id: `pp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...input,
    createdAt: new Date().toISOString(),
  };
  PEMBERIAN_PAKAN_DB.push(record);
  return record;
}

// ─── LP-003: Selesaikan (atomic) ───────────────────────────────────────────────
//
// Proses all-or-nothing:
//  1. Pre-validasi semua item (stok tersedia, belum kadaluarsa).
//  2. Kurangi stok satu per satu — rollback semua jika ada yang gagal.
//  3. Perbarui status record → 'Pemberian Pakan Selesai'.
//  4. Simpan UUID riwayat stok pada record dan pada tiap item.
//
// Tidak ada partial commit. Tidak ada stok minus.

export type SelesaikanResult =
  | { success: true;  riwayatStokIds: string[] }
  | { success: false; error: string };

/**
 * Menyelesaikan sesi pemberian pakan secara atomik:
 * mengurangi Stok Pakan dan mencatat Riwayat Stok untuk setiap item.
 * Jika salah satu langkah gagal, seluruh transaksi di-rollback.
 */
export function selesaikanPemberianPakan(recordId: string): SelesaikanResult {
  // ── 1. Temukan record ────────────────────────────────────────────────────────
  const record = PEMBERIAN_PAKAN_DB.find((r) => r.id === recordId);
  if (!record) {
    return { success: false, error: 'Catatan pemberian pakan tidak ditemukan.' };
  }
  if (record.status === 'Pemberian Pakan Selesai') {
    return { success: false, error: 'Pemberian pakan ini sudah diselesaikan.' };
  }

  const today = todayIso();

  // ── 2. Pre-validasi semua item (baca-saja, belum ada mutasi) ────────────────
  for (const item of record.items) {
    const inv = getInventarisById(item.inventarisId);

    if (!inv) {
      return {
        success: false,
        error: `Item stok "${item.namaPakan}" tidak ditemukan di inventaris.`,
      };
    }
    if (isExpiredCheck(inv.kadaluarsa)) {
      return {
        success: false,
        error: `Stok "${item.namaPakan}" sudah kadaluarsa (${inv.kadaluarsa}). Transaksi dibatalkan.`,
      };
    }
    if (inv.status === 'Habis') {
      return {
        success: false,
        error: `Stok "${item.namaPakan}" habis. Transaksi dibatalkan.`,
      };
    }
    if (inv.jumlahStok < item.jumlah) {
      return {
        success: false,
        error: `Stok "${item.namaPakan}" tidak mencukupi. ` +
               `Tersedia: ${inv.jumlahStok} ${item.satuan}, ` +
               `dibutuhkan: ${item.jumlah} ${item.satuan}. Transaksi dibatalkan.`,
      };
    }
  }

  // ── 3. Atomic deduction — rollback jika ada yang gagal ───────────────────────
  const deductedRecords: Array<{ perubahanId: string; itemIndex: number }> = [];

  for (let i = 0; i < record.items.length; i++) {
    const item = record.items[i];
    try {
      const pr = addPerubahanStok({
        inventarisId:     item.inventarisId,
        jenis:            'Pemberian Pakan',
        jumlah:           item.jumlah,
        satuan:           item.satuan,
        tanggal:          today,
        catatan:
          `Pemberian pakan — ${record.targetName ?? record.targetId}` +
          ` (${record.targetKind}). Ref: ${record.id}.` +
          (record.catatan ? ` Catatan: ${record.catatan}` : ''),
        sumberModul:      'Pemberian Pakan',
        alasan:           'Konsumsi Ternak',
        pemberianPakanId: record.id,
      });
      deductedRecords.push({ perubahanId: pr.id, itemIndex: i });
    } catch (err) {
      // ── ROLLBACK: balik semua pengurangan yang sudah berhasil ──────────────
      for (const { perubahanId } of [...deductedRecords].reverse()) {
        try {
          rollbackPerubahanStok(perubahanId);
        } catch (rbErr) {
          // Log saja — jangan sembunyikan error asli
          console.error('[LP-003 rollback error]', rbErr);
        }
      }
      const msg = err instanceof Error ? err.message : 'Gagal mengurangi stok.';
      return {
        success: false,
        error: `Transaksi dibatalkan (rollback berhasil): ${msg}`,
      };
    }
  }

  // ── 4. Semua berhasil — perbarui record ──────────────────────────────────────
  const riwayatStokIds = deductedRecords.map((d) => d.perubahanId);

  // Hubungkan UUID riwayat stok ke tiap item
  for (const { perubahanId, itemIndex } of deductedRecords) {
    record.items[itemIndex].riwayatStokId = perubahanId;
  }

  record.status        = 'Pemberian Pakan Selesai';
  record.riwayatStokIds = riwayatStokIds;
  record.selesaiAt     = new Date().toISOString();

  // ── BT-003: Batch → fan out individual feeding history ──────────────────────
  // A Batch session deducts stock ONCE for the whole group (feed is not split
  // per-animal), but every active member must still get its own feeding
  // history entry. Reuses the same completed record — no new stock deduction.
  if (record.targetKind === 'batch') {
    createIndividualFeedingRecordsForBatch(record);
  }

  // ── CP-SYNC-001: Timeline logging ────────────────────────────────────────────
  // Log every completed feed session to PAKAN_TIMELINE_LOG so the module has a
  // structured timeline — mirrors BATCH_TIMELINE_LOG / WEIGHT_TIMELINE_LOG.
  addPakanTimelineEvent({
    type:       'feed_session_completed',
    recordId:   record.id,
    targetKind: record.targetKind,
    targetId:   record.targetId,
    targetName: record.targetName,
    tanggal:    record.tanggal,
    notes:
      record.catatan
        ? record.catatan
        : `${record.items.length} item pakan — ${record.targetName ?? record.targetId}`,
  });

  return { success: true, riwayatStokIds };
}

// ─── BT-003: Batch → Individual Feeding History ────────────────────────────────

/**
 * Creates one read-only child PemberianPakanRecord (targetKind: 'individu')
 * per currently active member of the batch, mirroring the completed parent
 * record. Does NOT deduct stock again — items keep the parent's riwayatStokId
 * links so the two stay traceable to the same single stock transaction.
 * Idempotent: skips members that already have a child linked to this parent.
 */
function createIndividualFeedingRecordsForBatch(parent: PemberianPakanRecord): void {
  const members = getActiveBatchMembersWithLivestock(parent.targetId);
  const already = new Set(
    PEMBERIAN_PAKAN_DB
      .filter((r) => r.parentPemberianPakanId === parent.id)
      .map((r) => r.targetId),
  );

  for (const member of members) {
    if (!member.lv) continue;
    if (already.has(member.lv.id)) continue;
    const child: PemberianPakanRecord = {
      id: `pp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      targetKind: 'individu',
      targetId: member.lv.id,
      targetName: member.lv.name ?? member.lv.id,
      targetIcon: parent.targetIcon,
      targetTypeBg: parent.targetTypeBg,
      tanggal: parent.tanggal,
      waktuPemberian: parent.waktuPemberian,
      items: parent.items,
      catatan: parent.catatan,
      petugas: parent.petugas,
      status: parent.status,
      createdAt: parent.createdAt,
      selesaiAt: parent.selesaiAt,
      riwayatStokIds: parent.riwayatStokIds,
      parentPemberianPakanId: parent.id,
    };
    PEMBERIAN_PAKAN_DB.push(child);
  }
}
