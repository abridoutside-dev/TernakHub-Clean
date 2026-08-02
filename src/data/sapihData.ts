// ─── RP-009: Sapih (Weaning Management) ──────────────────────────────────────
// Sapih mengelola proses penyapihan satu Livestock yang SUDAH terdaftar
// (RP-008) — menutup ketergantungan Anak pada induk (menyusu), TIDAK mengakhiri
// siklus hidup Livestock. Sapih TIDAK membuat catatan Pemberian Pakan dan
// TIDAK membuat catatan Kesehatan; field Pasca Sapih (Kondisi Pertumbuhan,
// Adaptasi Pakan, Observasi Kesehatan) murni deskriptif pada record Sapih itu
// sendiri — bukan transaksi ke modul lain.
//
// Entry requirement: hanya Livestock yang berasal dari Anak yang SUDAH
// didaftarkan (RP-008 — AnakRecord.statusRegistrasi === 'Sudah Didaftarkan'
// && livestockId cocok) yang dapat memulai Sapih. Anak sementara (belum
// didaftarkan) tidak dapat disapih. Relasi Kelahiran/Program/Dam SELALU
// diturunkan dari AnakRecord terkait — tidak pernah diinput bebas oleh user,
// menjaga integritas relasi Parent (Dam) dan Birth (Kelahiran).

import { generateUUID } from '../utils/uuid';
import {
  ANAK_DB,
  KELAHIRAN_DB,
  getKelahiranById,
  type AnakRecord,
  type KelahiranRecord,
} from './kelahiranData';
import { LIVESTOCK_DB, getLivestock, type LivestockRecord } from './livestockData';
import type { EventType, ReproduksiEvent } from './monitoringReproduksiData';
import { getFullTimelineForProgram as getRp008TimelineForProgram } from './registrasiAnakData';
import type { ReproduksiProgramRecord } from './reproduksiProgramData';

// ─── Metode Sapih (Weaning Method) ────────────────────────────────────────────
// Arsitektur mendukung penambahan metode baru di masa depan — tambahkan ke
// daftar ini saja, tidak perlu mengubah bentuk data lain.

export const METODE_SAPIH_LIST = [
  'Sapih Alami',   // Natural Weaning
  'Sapih Dini',    // Early Weaning
  'Sapih Bertahap', // Gradual Weaning
  'Sapih Buatan',  // Artificial Weaning
  'Lainnya',       // Other
] as const;
export type MetodeSapih = typeof METODE_SAPIH_LIST[number];

// ─── Status Sapih ──────────────────────────────────────────────────────────────

export const STATUS_SAPIH_LIST = ['Direncanakan', 'Berlangsung', 'Selesai', 'Dibatalkan'] as const;
export type StatusSapih = typeof STATUS_SAPIH_LIST[number];

/** Status akhir (final) — tidak dapat diubah lagi setelah tercapai. */
const FINAL_STATUSES: StatusSapih[] = ['Selesai', 'Dibatalkan'];
function isStatusFinal(status: StatusSapih): boolean {
  return FINAL_STATUSES.includes(status);
}

// ─── Kondisi Pasca Sapih (Post Weaning) ───────────────────────────────────────
// Murni deskriptif — tidak membuat catatan Pemberian Pakan atau Kesehatan.

export const KONDISI_PERTUMBUHAN_LIST = ['Baik', 'Cukup', 'Kurang', 'Perlu Perhatian'] as const;
export type KondisiPertumbuhan = typeof KONDISI_PERTUMBUHAN_LIST[number];

export const ADAPTASI_PAKAN_LIST = ['Baik', 'Cukup', 'Sulit Beradaptasi', 'Belum Mau Makan Pakan Padat'] as const;
export type AdaptasiPakan = typeof ADAPTASI_PAKAN_LIST[number];

export const OBSERVASI_KESEHATAN_LIST = ['Sehat', 'Perlu Observasi', 'Perlu Penanganan', 'Kritis'] as const;
export type ObservasiKesehatan = typeof OBSERVASI_KESEHATAN_LIST[number];

export type PascaSapihInput = {
  kondisiPertumbuhan: KondisiPertumbuhan | null;
  adaptasiPakan: AdaptasiPakan | null;
  observasiKesehatan: ObservasiKesehatan | null;
  catatan: string | null;
};

// ─── Weaning Record ────────────────────────────────────────────────────────────

export type WeaningRecord = {
  id: string;                    // UUID v4 (Weaning UUID)
  livestockId: string;           // relasi ke LivestockRecord.id (Livestock UUID)
  kelahiranId: string;           // relasi ke KelahiranRecord.id (Birth UUID) — diturunkan, tidak diinput
  programId: string;             // relasi ke ReproduksiProgramRecord.id (Program UUID) — diturunkan
  damId: string;                 // relasi ke LivestockRecord.id induk (Dam UUID) — diturunkan
  tanggalSapih: string;          // yyyy-mm-dd (Weaning Date)
  beratBadan: number;            // kg (Body Weight)
  bcs: number | null;            // Body Condition Score, opsional
  metode: MetodeSapih;
  petugas: string;
  catatan: string | null;
  status: StatusSapih;
  // Pasca Sapih — deskriptif, dapat dilengkapi setelah Sapih berlangsung.
  kondisiPertumbuhan: KondisiPertumbuhan | null;
  adaptasiPakan: AdaptasiPakan | null;
  observasiKesehatan: ObservasiKesehatan | null;
  catatanPascaSapih: string | null;
  alasanBatal: string | null;
  createdDate: string;
  updatedDate: string;
  startedDate: string | null;
  completedDate: string | null;
  cancelledDate: string | null;
};

export type SapihInput = {
  tanggalSapih: string;
  beratBadan: number;
  bcs: number | null;
  metode: MetodeSapih;
  petugas: string;
  catatan: string | null;
};

// ─── Registry (empty — populated at runtime) ────────────────────────────────

export const SAPIH_DB: Record<string, WeaningRecord> = {};

// ─── Umur Saat Sapih (Age at Weaning) ─────────────────────────────────────────
// Dihitung, tidak disimpan sebagai input bebas — selalu konsisten dengan
// Tanggal Lahir (Kelahiran) dan Tanggal Sapih.

function daysBetween(isoFrom: string, isoTo: string): number {
  const from = new Date(`${isoFrom}T00:00:00`);
  const to = new Date(`${isoTo}T00:00:00`);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) return 0;
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function umurSaatSapihHari(kelahiran: KelahiranRecord, tanggalSapih: string): number {
  return Math.max(0, daysBetween(kelahiran.tanggalLahir, tanggalSapih));
}

export function formatUmurSaatSapih(hari: number): string {
  if (hari < 7) return `${hari} hari`;
  if (hari < 30) return `${Math.floor(hari / 7)} minggu`;
  const months = Math.floor(hari / 30);
  const remDays = hari % 30;
  return remDays === 0 ? `${months} bulan` : `${months} bulan ${remDays} hari`;
}

// ─── Lookup & entry requirement ────────────────────────────────────────────────

/** Menemukan Anak (RP-007/RP-008) yang menghasilkan Livestock ini — hanya Anak yang SUDAH didaftarkan yang valid. */
function findAnakByLivestockId(livestockId: string): AnakRecord | null {
  return Object.values(ANAK_DB).find(
    (a) => a.statusRegistrasi === 'Sudah Didaftarkan' && a.livestockId === livestockId,
  ) ?? null;
}

export type SapihContext = {
  livestock: LivestockRecord;
  anak: AnakRecord;
  kelahiran: KelahiranRecord;
};

/**
 * Throws dengan pesan siap tampil bila Livestock tidak memenuhi syarat untuk
 * memulai Sapih: harus ada di registry (bukan fallback), harus berasal dari
 * Anak yang sudah didaftarkan (RP-008), dan data Kelahiran terkait harus ada.
 */
export function resolveSapihContext(livestockId: string): SapihContext {
  const livestock = LIVESTOCK_DB[livestockId];
  if (!livestock) throw new Error('Ternak tidak ditemukan.');

  const anak = findAnakByLivestockId(livestockId);
  if (!anak) {
    throw new Error('Ternak ini bukan hasil pendaftaran Anak (RP-008) — Sapih hanya berlaku untuk Ternak yang sudah terdaftar.');
  }

  const kelahiran = getKelahiranById(anak.kelahiranId);
  if (!kelahiran) throw new Error('Data Kelahiran terkait tidak ditemukan.');

  return { livestock, anak, kelahiran };
}

/** Seluruh Sapih milik satu Livestock, terbaru → terlama. */
export function getSapihListByLivestock(livestockId: string): WeaningRecord[] {
  return Object.values(SAPIH_DB)
    .filter((s) => s.livestockId === livestockId)
    .sort((a, b) => (a.tanggalSapih === b.tanggalSapih ? 0 : (a.tanggalSapih < b.tanggalSapih ? 1 : -1)));
}

export function getSapihById(id: string): WeaningRecord | null {
  return SAPIH_DB[id] ?? null;
}

/** Livestock ini sudah punya Sapih berstatus Selesai — mencegah duplikasi Sapih Selesai. */
export function hasCompletedSapih(livestockId: string): boolean {
  return getSapihListByLivestock(livestockId).some((s) => s.status === 'Selesai');
}

/** Livestock ini memiliki Sapih yang masih berjalan (Direncanakan/Berlangsung). */
export function getActiveSapih(livestockId: string): WeaningRecord | null {
  return getSapihListByLivestock(livestockId).find((s) => !isStatusFinal(s.status)) ?? null;
}

// ─── Validasi ────────────────────────────────────────────────────────────────

function validateSapihFields(kelahiran: KelahiranRecord, input: SapihInput): string | null {
  if (!input.tanggalSapih)                  return 'Tanggal Sapih wajib diisi.';
  if (input.tanggalSapih <= kelahiran.tanggalLahir) {
    return 'Tanggal Sapih harus setelah Tanggal Lahir.';
  }
  if (!input.beratBadan || input.beratBadan <= 0) return 'Berat Badan harus lebih dari 0.';
  if (input.bcs !== null && input.bcs <= 0) return 'BCS harus lebih dari 0.';
  if (!input.metode)                        return 'Metode Sapih wajib dipilih.';
  if (!input.petugas.trim())                return 'Petugas wajib diisi.';
  return null;
}

// ─── CRUD & state machine ──────────────────────────────────────────────────────

/**
 * Membuat Sapih baru berstatus 'Direncanakan'. Throws dengan pesan siap
 * tampil bila Livestock belum memenuhi entry requirement atau field tidak
 * valid. Relasi kelahiranId/programId/damId SELALU diturunkan dari Anak
 * terkait (RP-008) — tidak pernah diambil dari input user.
 */
export function addSapih(livestockId: string, input: SapihInput): WeaningRecord {
  const { anak, kelahiran } = resolveSapihContext(livestockId);

  if (hasCompletedSapih(livestockId)) {
    throw new Error('Ternak ini sudah memiliki Sapih berstatus Selesai — tidak dapat membuat Sapih baru.');
  }
  if (getActiveSapih(livestockId)) {
    throw new Error('Ternak ini sudah memiliki proses Sapih yang masih berjalan (Direncanakan/Berlangsung).');
  }

  const fieldError = validateSapihFields(kelahiran, input);
  if (fieldError) throw new Error(fieldError);

  const today = new Date().toISOString().slice(0, 10);
  const record: WeaningRecord = {
    id: generateUUID(),
    livestockId,
    kelahiranId: kelahiran.id,
    programId: kelahiran.programId,
    damId: kelahiran.damId,
    tanggalSapih: input.tanggalSapih,
    beratBadan: input.beratBadan,
    bcs: input.bcs,
    metode: input.metode,
    petugas: input.petugas.trim(),
    catatan: input.catatan?.trim() || null,
    status: 'Direncanakan',
    kondisiPertumbuhan: null,
    adaptasiPakan: null,
    observasiKesehatan: null,
    catatanPascaSapih: null,
    alasanBatal: null,
    createdDate: today,
    updatedDate: today,
    startedDate: null,
    completedDate: null,
    cancelledDate: null,
  };
  SAPIH_DB[record.id] = record;
  void anak; // dipakai hanya untuk validasi entry requirement di atas
  return record;
}

/** Direncanakan → Berlangsung. Throws bila status bukan Direncanakan. */
export function startSapih(id: string): WeaningRecord {
  const existing = SAPIH_DB[id];
  if (!existing) throw new Error('Sapih tidak ditemukan.');
  if (existing.status !== 'Direncanakan') {
    throw new Error(`Sapih hanya dapat dimulai dari status "Direncanakan" — status saat ini "${existing.status}".`);
  }
  const today = new Date().toISOString().slice(0, 10);
  const updated: WeaningRecord = { ...existing, status: 'Berlangsung', startedDate: today, updatedDate: today };
  SAPIH_DB[id] = updated;
  return updated;
}

export type SelesaikanSapihInput = {
  beratBadan: number;
  bcs: number | null;
  catatan: string | null;
};

/** Direncanakan | Berlangsung → Selesai. Mencatat berat badan/BCS final saat Sapih benar-benar selesai. */
export function completeSapih(id: string, input: SelesaikanSapihInput): WeaningRecord {
  const existing = SAPIH_DB[id];
  if (!existing) throw new Error('Sapih tidak ditemukan.');
  if (isStatusFinal(existing.status)) {
    throw new Error(`Sapih sudah berstatus "${existing.status}" — tidak dapat diubah lagi.`);
  }
  if (!input.beratBadan || input.beratBadan <= 0) throw new Error('Berat Badan harus lebih dari 0.');
  if (input.bcs !== null && input.bcs <= 0) throw new Error('BCS harus lebih dari 0.');

  const today = new Date().toISOString().slice(0, 10);
  const updated: WeaningRecord = {
    ...existing,
    status: 'Selesai',
    beratBadan: input.beratBadan,
    bcs: input.bcs ?? existing.bcs,
    catatan: input.catatan?.trim() || existing.catatan,
    completedDate: today,
    updatedDate: today,
  };
  SAPIH_DB[id] = updated;
  return updated;
}

/** Direncanakan | Berlangsung → Dibatalkan. */
export function cancelSapih(id: string, alasan: string | null): WeaningRecord {
  const existing = SAPIH_DB[id];
  if (!existing) throw new Error('Sapih tidak ditemukan.');
  if (isStatusFinal(existing.status)) {
    throw new Error(`Sapih sudah berstatus "${existing.status}" — tidak dapat dibatalkan lagi.`);
  }
  const today = new Date().toISOString().slice(0, 10);
  const updated: WeaningRecord = {
    ...existing,
    status: 'Dibatalkan',
    alasanBatal: alasan?.trim() || null,
    cancelledDate: today,
    updatedDate: today,
  };
  SAPIH_DB[id] = updated;
  return updated;
}

/**
 * Melengkapi observasi Pasca Sapih (Growth Condition / Feed Adaptation /
 * Health Observation / Notes) — murni deskriptif, TIDAK membuat catatan
 * Pemberian Pakan maupun Kesehatan. Hanya dapat dicatat setelah Sapih
 * berlangsung (Berlangsung/Selesai) — belum relevan saat masih Direncanakan
 * atau setelah Dibatalkan.
 */
export function recordPascaSapih(id: string, input: PascaSapihInput): WeaningRecord {
  const existing = SAPIH_DB[id];
  if (!existing) throw new Error('Sapih tidak ditemukan.');
  if (existing.status !== 'Berlangsung' && existing.status !== 'Selesai') {
    throw new Error('Observasi Pasca Sapih hanya dapat dicatat setelah Sapih berlangsung.');
  }
  const updated: WeaningRecord = {
    ...existing,
    kondisiPertumbuhan: input.kondisiPertumbuhan,
    adaptasiPakan: input.adaptasiPakan,
    observasiKesehatan: input.observasiKesehatan,
    catatanPascaSapih: input.catatan?.trim() || null,
    updatedDate: new Date().toISOString().slice(0, 10),
  };
  SAPIH_DB[id] = updated;
  return updated;
}

// ─── Timeline integration ─────────────────────────────────────────────────────
// Sapih tidak menyimpan Timeline-nya sendiri — ia menambahkan Event ke
// Timeline Reproduksi yang sudah ada. getFullTimelineForProgram (RP-008, yang
// sendiri menggabungkan RP-004..RP-007) TIDAK diubah; fungsi di bawah ini
// hanya menggabungkan hasilnya dengan Event Sapih (RP-009).

function sapihLabel(s: WeaningRecord): string {
  const lv = getLivestock(s.livestockId);
  return `${lv.name ?? lv.id} (${lv.id})`;
}

function sapihToEvents(s: WeaningRecord): ReproduksiEvent[] {
  const events: ReproduksiEvent[] = [
    {
      eventId: `sapih-${s.id}-planned`,
      programId: s.programId,
      eventType: 'Sapih Direncanakan' as EventType,
      timestamp: s.createdDate,
      jam: null,
      petugas: s.petugas,
      catatan: `Sapih direncanakan untuk ${sapihLabel(s)} pada ${s.tanggalSapih}.`,
      source: 'monitoring',
      livestockId: s.livestockId,
      kelahiranId: s.kelahiranId,
    },
  ];

  if (s.startedDate) {
    events.push({
      eventId: `sapih-${s.id}-started`,
      programId: s.programId,
      eventType: 'Sapih Dimulai' as EventType,
      timestamp: s.startedDate,
      jam: null,
      petugas: s.petugas,
      catatan: `Sapih dimulai untuk ${sapihLabel(s)}.`,
      source: 'monitoring',
      livestockId: s.livestockId,
      kelahiranId: s.kelahiranId,
    });
  }

  if (s.status === 'Selesai' && s.completedDate) {
    events.push({
      eventId: `sapih-${s.id}-completed`,
      programId: s.programId,
      eventType: 'Sapih Selesai' as EventType,
      timestamp: s.completedDate,
      jam: null,
      petugas: s.petugas,
      catatan: `Sapih selesai untuk ${sapihLabel(s)} — Berat Badan ${s.beratBadan} kg${s.bcs != null ? `, BCS ${s.bcs}` : ''}.`,
      source: 'monitoring',
      livestockId: s.livestockId,
      kelahiranId: s.kelahiranId,
    });
  }

  if (s.status === 'Dibatalkan' && s.cancelledDate) {
    events.push({
      eventId: `sapih-${s.id}-cancelled`,
      programId: s.programId,
      eventType: 'Sapih Dibatalkan' as EventType,
      timestamp: s.cancelledDate,
      jam: null,
      petugas: s.petugas,
      catatan: s.alasanBatal ? `Sapih dibatalkan: ${s.alasanBatal}` : `Sapih dibatalkan untuk ${sapihLabel(s)}.`,
      source: 'monitoring',
      livestockId: s.livestockId,
      kelahiranId: s.kelahiranId,
    });
  }

  return events;
}

function sortEventsTerbaruKeTerlama(a: ReproduksiEvent, b: ReproduksiEvent): number {
  const aKey = `${a.timestamp}T${a.jam ?? '00:00'}`;
  const bKey = `${b.timestamp}T${b.jam ?? '00:00'}`;
  return aKey === bKey ? 0 : (aKey < bKey ? 1 : -1);
}

/**
 * Timeline lengkap satu Program termasuk Sapih: Timeline RP-008 (sudah
 * menggabungkan RP-004..RP-007, tidak diubah) + event Sapih (RP-009),
 * terbaru → terlama.
 */
export function getFullTimelineForProgram(program: ReproduksiProgramRecord): ReproduksiEvent[] {
  const sapihEvents = Object.values(SAPIH_DB)
    .filter((s) => s.programId === program.id)
    .flatMap(sapihToEvents);

  return [
    ...getRp008TimelineForProgram(program),
    ...sapihEvents,
  ].sort(sortEventsTerbaruKeTerlama);
}

// ─── populateSapihFromDb — FLOW-003M21 ────────────────────────────────────────
// Hydrates SAPIH_DB from sapih rows.
// Must run AFTER populateKelahiranFromDb — derives kelahiranId/programId/damId
// via: sapih.registrasi_id → ANAK_DB[registrasi_id] → KELAHIRAN_DB[kelahiranId].
//
// This works because after populateKelahiranFromDb, ANAK_DB keys are Supabase
// registrasi_anak UUIDs, and sapih.registrasi_id is the same UUID.
//
// Deferred (FUTURE FEATURE):
//   petugas, bcs not stored in sapih → defaults.
//   status defaults to 'Selesai' (only completed sapih are persisted).
//   Pasca-sapih fields (kondisiPertumbuhan, adaptasiPakan, etc.) not in DB.

type SapihDbRowMinimal = {
  id:                   string;
  livestock_id:         string;
  registrasi_id:        string;
  weaning_date:         string;
  weight_at_weaning_kg: number | null;
  method:               string | null;
  notes:                string | null;
  created_at:           string;
};

export function populateSapihFromDb(rows: SapihDbRowMinimal[]): void {
  if (rows.length === 0) return;

  for (const key of Object.keys(SAPIH_DB)) {
    delete SAPIH_DB[key];
  }

  const validMetode = new Set<string>(METODE_SAPIH_LIST);

  for (const row of rows) {
    // Derive denormalized IDs via registrasi_id → ANAK_DB → KELAHIRAN_DB.
    const anak      = ANAK_DB[row.registrasi_id];
    const kelahiran = anak ? KELAHIRAN_DB[anak.kelahiranId] : null;

    const record: WeaningRecord = {
      id:                   row.id,
      livestockId:          row.livestock_id,
      kelahiranId:          anak?.kelahiranId    ?? '',
      programId:            kelahiran?.programId  ?? '',
      damId:                kelahiran?.damId       ?? '',
      tanggalSapih:         row.weaning_date,
      beratBadan:           row.weight_at_weaning_kg ?? 0,
      bcs:                  null,
      metode:               validMetode.has(row.method ?? '')
                              ? (row.method as MetodeSapih)
                              : 'Sapih Bertahap',
      petugas:              '',
      catatan:              row.notes ?? null,
      status:               'Selesai',
      kondisiPertumbuhan:   null,
      adaptasiPakan:        null,
      observasiKesehatan:   null,
      catatanPascaSapih:    null,
      alasanBatal:          null,
      createdDate:          row.created_at,
      updatedDate:          row.created_at,
      startedDate:          null,
      completedDate:        row.weaning_date,
      cancelledDate:        null,
    };

    SAPIH_DB[record.id] = record;
  }
}
