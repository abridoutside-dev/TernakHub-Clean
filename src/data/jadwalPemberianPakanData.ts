// ─── Jadwal Pemberian Pakan — Data Layer (LP-004) ────────────────────────────
// Jadwal adalah PENGINGAT pemberian pakan — bukan transaksi. Membuat, mengubah,
// atau membatalkan jadwal TIDAK PERNAH mengurangi Stok Pakan dan TIDAK PERNAH
// membuat Riwayat. Jadwal murni template; realisasi pemberian pakan tetap
// diproses lewat modul Pemberian Pakan (LP-002/LP-003) saat pengguna menekan
// "Laksanakan Jadwal".
//
// Semua pakan pada jadwal WAJIB berasal dari Stok Pakan (stokInventarisData.ts).
// Modul ini tidak boleh menerima referensi langsung dari Master Pakan, Produk
// Komersial, atau Formula.

import { getInventarisById } from './stokInventarisData';
import { getTodayISO as todayIso } from '../utils/dateUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type JadwalPemberianJenis = 'Sekali' | 'Harian' | 'Mingguan' | 'Kustom';

export type JadwalPemberianStatus =
  | 'Terjadwal'
  | 'Terlewat'
  | 'Selesai'
  | 'Dibatalkan';

/** Satu item pakan rencana dalam satu jadwal (bisa lebih dari satu). */
export interface JadwalPemberianItem {
  inventarisId: string;
  namaPakan: string;
  brand?: string;
  kategori: string;
  sumber: string;        // label asal ('Master Pakan' | 'Produk Komersial') — tampilan saja
  jumlahRencana: number;  // rencana jumlah pengingat — TIDAK mengurangi stok
  satuan: string;
}

/** Satu jadwal (template) pemberian pakan untuk satu individu atau batch. */
export interface JadwalPemberianRecord {
  id: string;
  targetKind: 'individu' | 'batch';
  targetId: string;               // Livestock UUID atau Batch UUID
  targetName: string | null;
  targetIcon: string;
  targetTypeBg: string;
  tanggal: string;                 // ISO date — tanggal mulai / kejadian pertama
  jam: string;                     // HH:mm
  jenis: JadwalPemberianJenis;
  /** Hanya dipakai untuk jenis 'Mingguan' — hari dalam minggu (0=Minggu..6=Sabtu). Default: hari dari `tanggal`. */
  hariMingguan?: number;
  /** Hanya dipakai untuk jenis 'Kustom' — interval pengulangan dalam hari (mis. tiap 3 hari). */
  intervalHari?: number;
  items: JadwalPemberianItem[];
  catatan?: string;
  /** Status siklus hidup TEMPLATE jadwal. Bukan status kejadian per-hari. */
  status: JadwalPemberianStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── In-memory store ──────────────────────────────────────────────────────────

const JADWAL_PEMBERIAN_DB: JadwalPemberianRecord[] = [];

// ─── Supabase read-path ───────────────────────────────────────────────────────

/** Minimal subset of a jadwal_pemberian_pakan DB row. */
interface JadwalPemberianDbRowMinimal {
  id:                    string;
  livestock_id:          string | null;
  batch_id:              string | null;
  schedule_name:         string | null;
  frequency:             string | null;
  time_slots:            string[] | null;
  amount_per_session_kg: number | null;
  is_active:             boolean;
  start_date:            string | null;
  notes:                 string | null;
  created_at:            string;
}

/** Maps a DB frequency string to the local JadwalPemberianJenis enum. */
function mapFrequency(freq: string | null): JadwalPemberianJenis {
  switch ((freq ?? '').toLowerCase()) {
    case 'once':
    case 'one_time':
    case 'sekali':
      return 'Sekali';
    case 'daily':
    case 'harian':
      return 'Harian';
    case 'weekly':
    case 'mingguan':
      return 'Mingguan';
    case 'custom':
    case 'kustom':
      return 'Kustom';
    default:
      return 'Harian';
  }
}

/**
 * Hydrates JADWAL_PEMBERIAN_DB from Supabase jadwal_pemberian_pakan rows.
 * Creates one JadwalPemberianRecord per DB row with a synthetic single-item
 * (because the DB stores only amount_per_session_kg, not full item detail).
 * If rows is empty, existing in-session records are preserved intact.
 *
 * Called by useJadwal() on workspace mount / change.
 */
export function populateJadwalFromDb(rows: JadwalPemberianDbRowMinimal[]): void {
  if (rows.length === 0) return;

  const dbIds = new Set(rows.map((r) => r.id));

  // Retain any in-session records not yet in DB (created this session, not yet synced)
  const inSession = JADWAL_PEMBERIAN_DB.filter((r) => !dbIds.has(r.id));

  // Clear and re-seed: in-session first, then DB-sourced records
  JADWAL_PEMBERIAN_DB.splice(0, JADWAL_PEMBERIAN_DB.length, ...inSession);

  for (const row of rows) {

    const targetKind: 'individu' | 'batch' = row.livestock_id ? 'individu' : 'batch';
    const targetId = row.livestock_id ?? row.batch_id ?? '';

    const syntheticItem: JadwalPemberianItem = {
      inventarisId:  '',
      namaPakan:     row.schedule_name ?? 'Jadwal Pakan',
      kategori:      '',
      sumber:        '',
      jumlahRencana: row.amount_per_session_kg ?? 0,
      satuan:        'Kg',
    };

    const status: JadwalPemberianStatus = row.is_active ? 'Terjadwal' : 'Dibatalkan';
    const now = row.created_at;

    const record: JadwalPemberianRecord = {
      id:           row.id,
      targetKind,
      targetId,
      targetName:   null,
      targetIcon:   targetKind === 'individu' ? '🐑' : '📦',
      targetTypeBg: targetKind === 'individu' ? 'bg-green-100' : 'bg-blue-100',
      tanggal:      row.start_date ?? now.slice(0, 10),
      jam:          (row.time_slots && row.time_slots.length > 0) ? row.time_slots[0] : '',
      jenis:        mapFrequency(row.frequency),
      items:        [syntheticItem],
      catatan:      row.notes ?? undefined,
      status,
      createdAt:    now,
      updatedAt:    now,
    };

    JADWAL_PEMBERIAN_DB.push(record);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00`);
  const to   = new Date(`${toIso}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

/**
 * Status efektif jadwal, dihitung live setiap dipanggil — tidak mengubah
 * `status` tersimpan. 'Selesai' dan 'Dibatalkan' selalu final (tidak pernah
 * dihitung ulang). Hanya jenis 'Sekali' yang tanggalnya sudah lewat menjadi
 * 'Terlewat'; jadwal berulang tetap 'Terjadwal' karena selalu ada kejadian
 * berikutnya.
 */
export function getEffectiveStatus(
  record: JadwalPemberianRecord,
  today: string = todayIso(),
): JadwalPemberianStatus {
  if (record.status === 'Selesai' || record.status === 'Dibatalkan') return record.status;
  if (record.jenis === 'Sekali' && record.tanggal < today) return 'Terlewat';
  return 'Terjadwal';
}

/** Apakah jadwal ini jatuh tempo pada tanggal tertentu (dipakai untuk "Jadwal Hari Ini"). */
export function isJadwalOnDate(record: JadwalPemberianRecord, dateIso: string): boolean {
  if (getEffectiveStatus(record, dateIso) !== 'Terjadwal') return false;
  if (dateIso < record.tanggal) return false; // belum mulai

  switch (record.jenis) {
    case 'Sekali':
      return record.tanggal === dateIso;
    case 'Harian':
      return true;
    case 'Mingguan': {
      const targetDay = new Date(`${dateIso}T00:00:00`).getDay();
      const day = record.hariMingguan ?? new Date(`${record.tanggal}T00:00:00`).getDay();
      return targetDay === day;
    }
    case 'Kustom': {
      const interval = record.intervalHari && record.intervalHari > 0 ? record.intervalHari : 1;
      const diff = daysBetween(record.tanggal, dateIso);
      return diff >= 0 && diff % interval === 0;
    }
    default:
      return false;
  }
}

// ─── Accessors ────────────────────────────────────────────────────────────────

/** Seluruh jadwal, terurut tanggal+jam terbaru di atas. */
export function getJadwalList(): JadwalPemberianRecord[] {
  return [...JADWAL_PEMBERIAN_DB].sort((a, b) => {
    if (a.tanggal !== b.tanggal) return a.tanggal < b.tanggal ? 1 : -1;
    if (a.jam !== b.jam) return a.jam < b.jam ? 1 : -1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function getJadwalById(id: string): JadwalPemberianRecord | undefined {
  return JADWAL_PEMBERIAN_DB.find((r) => r.id === id);
}

/** Jadwal untuk satu individu atau batch tertentu. */
export function getJadwalByTarget(targetId: string): JadwalPemberianRecord[] {
  return getJadwalList().filter((r) => r.targetId === targetId);
}

/** Jadwal yang jatuh tempo pada tanggal tertentu (default: hari ini). */
export function getJadwalHariIni(today: string = todayIso()): JadwalPemberianRecord[] {
  return getJadwalList().filter((r) => isJadwalOnDate(r, today));
}

/** Tanggal ISO kejadian berikutnya (>= fromIso) untuk satu jadwal, atau null jika tidak ada lagi (final/tidak aktif). */
export function getNextOccurrence(record: JadwalPemberianRecord, fromIso: string = todayIso()): string | null {
  if (getEffectiveStatus(record, fromIso) !== 'Terjadwal') return null;
  const start = record.tanggal > fromIso ? record.tanggal : fromIso;

  switch (record.jenis) {
    case 'Sekali':
      return record.tanggal >= fromIso ? record.tanggal : null;
    case 'Harian':
      return start;
    case 'Mingguan': {
      const targetDay = record.hariMingguan ?? new Date(`${record.tanggal}T00:00:00`).getDay();
      for (let i = 0; i < 7; i++) {
        const d = new Date(`${start}T00:00:00`);
        d.setDate(d.getDate() + i);
        if (d.getDay() === targetDay) return d.toISOString().split('T')[0];
      }
      return null;
    }
    case 'Kustom': {
      const interval = record.intervalHari && record.intervalHari > 0 ? record.intervalHari : 1;
      for (let i = 0; i < interval; i++) {
        const d = new Date(`${start}T00:00:00`);
        d.setDate(d.getDate() + i);
        const candidateIso = d.toISOString().split('T')[0];
        if (daysBetween(record.tanggal, candidateIso) % interval === 0) return candidateIso;
      }
      return null;
    }
    default:
      return null;
  }
}

/** Jadwal aktif dengan kejadian berikutnya paling dekat (dipakai kartu "Jadwal Berikutnya"). */
export function getJadwalBerikutnya(fromIso: string = todayIso()): { record: JadwalPemberianRecord; tanggal: string } | null {
  let best: { record: JadwalPemberianRecord; tanggal: string } | null = null;
  for (const record of JADWAL_PEMBERIAN_DB) {
    const next = getNextOccurrence(record, fromIso);
    if (!next) continue;
    if (!best || next < best.tanggal || (next === best.tanggal && record.jam < best.record.jam)) {
      best = { record, tanggal: next };
    }
  }
  return best;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export interface AddJadwalPemberianInput {
  targetKind: 'individu' | 'batch';
  targetId: string;
  targetName: string | null;
  targetIcon: string;
  targetTypeBg: string;
  tanggal: string;
  jam: string;
  jenis: JadwalPemberianJenis;
  hariMingguan?: number;
  intervalHari?: number;
  items: JadwalPemberianItem[];
  catatan?: string;
}

/**
 * Membuat jadwal baru. Tidak menyentuh Stok Pakan atau Riwayat sama sekali —
 * murni menyimpan template pengingat. Melempar Error jika validasi gagal.
 */
export function addJadwalPemberian(input: AddJadwalPemberianInput): JadwalPemberianRecord {
  if (!input.tanggal) throw new Error('Tanggal jadwal wajib diisi.');
  if (!input.jam) throw new Error('Jam jadwal wajib diisi.');
  if (input.items.length === 0) throw new Error('Minimal satu item pakan harus dipilih.');
  for (const item of input.items) {
    if (item.jumlahRencana <= 0) {
      throw new Error(`Jumlah rencana untuk "${item.namaPakan}" harus lebih dari nol.`);
    }
    if (!getInventarisById(item.inventarisId)) {
      throw new Error(`Item stok "${item.namaPakan}" tidak ditemukan di inventaris.`);
    }
  }
  if (input.jenis === 'Kustom' && (!input.intervalHari || input.intervalHari <= 0)) {
    throw new Error('Interval pengulangan (hari) wajib diisi untuk jenis Kustom.');
  }

  const now = new Date().toISOString();
  const record: JadwalPemberianRecord = {
    id: `jp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...input,
    status: 'Terjadwal',
    createdAt: now,
    updatedAt: now,
  };
  JADWAL_PEMBERIAN_DB.push(record);
  return record;
}

/**
 * Membatalkan jadwal. No-op jika sudah Selesai/Dibatalkan — status akhir
 * bersifat final dan tidak bisa dibuka kembali.
 */
export function cancelJadwal(id: string): void {
  const record = JADWAL_PEMBERIAN_DB.find((r) => r.id === id);
  if (!record) return;
  if (record.status === 'Selesai' || record.status === 'Dibatalkan') return;
  record.status = 'Dibatalkan';
  record.updatedAt = new Date().toISOString();
}

/**
 * Dipanggil oleh modul Pemberian Pakan (LP-002) setelah pengguna menekan
 * "Laksanakan Jadwal" dan berhasil menyimpan pencatatan. Hanya menandai
 * jadwal jenis 'Sekali' sebagai Selesai — jadwal berulang tetap Terjadwal
 * karena kejadian berikutnya masih berlaku. Tidak mengurangi stok, tidak
 * membuat riwayat — hanya memperbarui status template ini sendiri.
 */
export function markJadwalDilaksanakan(id: string): void {
  const record = JADWAL_PEMBERIAN_DB.find((r) => r.id === id);
  if (!record) return;
  if (record.status === 'Selesai' || record.status === 'Dibatalkan') return;
  if (record.jenis === 'Sekali') {
    record.status = 'Selesai';
    record.updatedAt = new Date().toISOString();
  }
}
