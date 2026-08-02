// ─── Reproduksi Service — FLOW-003M11 ────────────────────────────────────────
//
// Business logic layer for persisting Reproduksi module data to Supabase.
// Called fire-and-forget from Reproduksi.tsx after each in-memory write
// succeeds (Phase 1). Failure is logged but never blocks the UI.
//
// Tables wired:
//   reproduksi_programs, pelaksanaan_reproduksi, monitoring_reproduksi,
//   kebuntingan, kelahiran
//
// Deferred:
//   pemeriksaan_kebuntingan — livestock_id NOT NULL but absent from in-memory record
//   registrasi_anak, sapih  — require livestock Supabase UUID (M12+)

import {
  repoInsertReprodukasiProgram,
  repoInsertPelaksanaan,
  repoInsertMonitoring,
  repoInsertKebuntingan,
  repoInsertKelahiran,
  repoInsertRegistrasiAnak,
  repoInsertSapih,
  repoInsertPemeriksaanKebuntingan,
  repoUpdateKebuntinganStatus,
  repoUpdateProgramStatus,
  repoUpdateProgram,
} from '../repositories/reproduksiRepository';
import type { ReproduksiProgramRecord }       from '../data/reproduksiProgramData';
import type { PelaksanaanRecord }             from '../data/pelaksanaanReproduksiData';
import type { MonitoringRecord }              from '../data/monitoringReproduksiData';
import type { KebuntinganRecord, KebuntinganMonitoringRecord } from '../data/kebuntinganData';
import { KEBUNTINGAN_DB }                     from '../data/kebuntinganData';
import type { PemeriksaanKebuntinganRecord }  from '../data/pemeriksaanKebuntinganData';
import { ANAK_DB, KELAHIRAN_DB }              from '../data/kelahiranData';
import type { KelahiranRecord }               from '../data/kelahiranData';
import type { WeaningRecord }                 from '../data/sapihData';

// ─── Service result ───────────────────────────────────────────────────────────

export type ReproduksiServiceResult<T = { id: string }> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

// ─── Status mappers ───────────────────────────────────────────────────────────
// In-memory status values differ from DB enum values.

type ProgramStatusDb   = 'Aktif' | 'Selesai' | 'Dihentikan' | 'Draft';
type PregnancyStatusDb = 'Aktif' | 'Selesai' | 'Gugur' | 'Dibatalkan';

function mapProgramStatus(status: ReproduksiProgramRecord['status']): ProgramStatusDb {
  switch (status) {
    case 'Draft':      return 'Draft';
    case 'Berjalan':   return 'Aktif';
    case 'Selesai':    return 'Selesai';
    case 'Dibatalkan': return 'Dihentikan';
    default:           return 'Draft';
  }
}

function mapPregnancyStatus(status: KebuntinganRecord['status']): PregnancyStatusDb {
  switch (status) {
    case 'Kebuntingan Aktif': return 'Aktif';
    case 'Berisiko Tinggi':   return 'Aktif';
    case 'Dalam Observasi':   return 'Aktif';
    case 'Keguguran':         return 'Gugur';
    case 'Selesai':           return 'Selesai';
    default:                  return 'Aktif';
  }
}

// ─── recordProgram ────────────────────────────────────────────────────────────
// Persist a newly created ReproduksiProgramRecord to reproduksi_programs.

export async function recordProgram(
  workspaceId: string,
  record: ReproduksiProgramRecord,
): Promise<ReproduksiServiceResult> {
  if (!workspaceId || !record.id) {
    return { ok: false, error: 'recordProgram: missing workspaceId or record.id' };
  }

  const result = await repoInsertReprodukasiProgram({
    id:              record.id,
    workspace_id:    workspaceId,
    name:            record.namaProgram,
    status:          mapProgramStatus(record.status),
    start_date:      record.tanggalMulai || null,
    end_date:        record.targetSelesai || null,
    mating_method:   record.metode || null,
    participant_ids: [...record.betinaIds, ...record.pejantanIds],
    notes:           record.catatan || null,
    species:         null,
  });

  if (result.error) return { ok: false, error: result.error };
  return { ok: true, data: result.data! };
}

// ─── recordPelaksanaan ────────────────────────────────────────────────────────
// Persist a newly created PelaksanaanRecord to pelaksanaan_reproduksi.

export async function recordPelaksanaan(
  workspaceId: string,
  record: PelaksanaanRecord,
): Promise<ReproduksiServiceResult> {
  if (!workspaceId || !record.id) {
    return { ok: false, error: 'recordPelaksanaan: missing workspaceId or record.id' };
  }

  const result = await repoInsertPelaksanaan({
    id:             record.id,
    program_id:     record.programId,
    workspace_id:   workspaceId,
    execution_date: record.tanggal,
    method:         record.metode || null,
    notes:          record.catatan || null,
  });

  if (result.error) return { ok: false, error: result.error };
  return { ok: true, data: result.data! };
}

// ─── recordMonitoring ─────────────────────────────────────────────────────────
// Persist a newly created MonitoringRecord to monitoring_reproduksi.

export async function recordMonitoring(
  workspaceId: string,
  record: MonitoringRecord,
): Promise<ReproduksiServiceResult> {
  if (!workspaceId || !record.id) {
    return { ok: false, error: 'recordMonitoring: missing workspaceId or record.id' };
  }

  const result = await repoInsertMonitoring({
    id:             record.id,
    program_id:     record.programId,
    pelaksanaan_id: record.pelaksanaanId || null,
    event_type:     record.eventType,
    event_date:     record.tanggal,
    description:    record.catatan || null,
    data: {
      jam:     record.jam,
      petugas: record.petugas,
      kondisi: record.kondisi,
      status:  record.status,
    },
  });

  if (result.error) return { ok: false, error: result.error };
  return { ok: true, data: result.data! };
}

// ─── recordKebuntingan ────────────────────────────────────────────────────────
// Persist a newly created KebuntinganRecord to kebuntingan.

export async function recordKebuntingan(
  workspaceId: string,
  record: KebuntinganRecord,
): Promise<ReproduksiServiceResult> {
  if (!workspaceId || !record.id) {
    return { ok: false, error: 'recordKebuntingan: missing workspaceId or record.id' };
  }

  const result = await repoInsertKebuntingan({
    id:                  record.id,
    program_id:          record.programId,
    pemeriksaan_id:      record.pemeriksaanId,
    dam_id:              record.damId,
    sire_id:             null,   // sire not tracked in in-memory KebuntinganRecord
    workspace_id:        workspaceId,
    conception_date:     record.tanggalKawinPerkiraan || null,
    expected_birth_date: record.tanggalLahirPerkiraan || null,
    status:              mapPregnancyStatus(record.status),
    notes:               record.catatan || null,
  });

  if (result.error) return { ok: false, error: result.error };
  return { ok: true, data: result.data! };
}

// ─── recordKelahiran ──────────────────────────────────────────────────────────
// Persist a newly created KelahiranRecord to kelahiran.
// total_born/alive/dead default to 0 — anak counts are written separately
// when individual AnakRecord are registered (M12+).

export async function recordKelahiran(
  workspaceId: string,
  record: KelahiranRecord,
): Promise<ReproduksiServiceResult> {
  if (!workspaceId || !record.id) {
    return { ok: false, error: 'recordKelahiran: missing workspaceId or record.id' };
  }

  // jamLahir is 'HH:mm'; PostgreSQL time type expects 'HH:MM:SS'
  const birthTime = record.jamLahir
    ? `${record.jamLahir}:00`
    : null;

  const result = await repoInsertKelahiran({
    id:             record.id,
    kebuntingan_id: record.kebuntinganId,
    workspace_id:   workspaceId,
    birth_date:     record.tanggalLahir,
    birth_time:     birthTime,
    birth_process:  record.metode || null,
    total_born:     0,
    total_alive:    0,
    total_dead:     0,
    notes:          record.catatan || null,
  });

  if (result.error) return { ok: false, error: result.error };
  return { ok: true, data: result.data! };
}

// ─── recordPemeriksaanKebuntingan ─────────────────────────────────────────────
// Persist a newly created PemeriksaanKebuntinganRecord to pemeriksaan_kebuntingan.
// Skips silently if livestockId is null or a non-UUID seed value — the DB column
// is NOT NULL so we cannot insert without a valid livestock Supabase UUID.

export async function recordPemeriksaanKebuntingan(
  workspaceId: string,
  record: PemeriksaanKebuntinganRecord,
): Promise<ReproduksiServiceResult<Record<string, never>>> {
  if (!workspaceId || !record.id) {
    return { ok: false, error: 'recordPemeriksaanKebuntingan: missing workspaceId or record.id' };
  }
  // livestock_id NOT NULL in DB — skip if not a valid Supabase UUID
  if (!isReproUUID(record.livestockId)) return { ok: true, data: {} };

  try {
    const result = await repoInsertPemeriksaanKebuntingan({
      program_id:    record.programId,
      livestock_id:  record.livestockId!,
      workspace_id:  workspaceId,
      check_date:    record.tanggalPemeriksaan,
      method:        record.metode,
      result:        record.hasil,
      days_pregnant: null,
      examiner:      record.petugas || null,
      notes:         record.catatan || null,
    });
    if (result.error) return { ok: false, error: result.error };
    return { ok: true, data: {} };
  } catch (err) {
    const msg = String(err);
    console.error('[reproduksiService] recordPemeriksaanKebuntingan error:', msg);
    return { ok: false, error: msg };
  }
}

// ─── recordKebuntinganMonitoring ─────────────────────────────────────────────
// Persists KebuntinganMonitoringRecord to monitoring_reproduksi, reusing the
// existing table with event_type='Monitoring Kebuntingan' and extra fields
// (kebuntinganId, beratBadan, bcs, petugas, kondisi) in the JSONB `data` column.
// populateKebuntinganMonitoringFromDb() (kebuntinganData.ts) reconstructs records
// from these rows on hard-refresh.

export async function recordKebuntinganMonitoring(
  workspaceId: string,
  record: KebuntinganMonitoringRecord,
): Promise<ReproduksiServiceResult<Record<string, never>>> {
  if (!workspaceId || !record.id) {
    return { ok: false, error: 'recordKebuntinganMonitoring: missing workspaceId or record.id' };
  }

  const kebuntingan = KEBUNTINGAN_DB[record.kebuntinganId];
  if (!kebuntingan) {
    console.warn('[reproduksiService] recordKebuntinganMonitoring: kebuntingan not found:', record.kebuntinganId);
    return { ok: true, data: {} };
  }

  try {
    const result = await repoInsertMonitoring({
      id:             record.id,
      program_id:     kebuntingan.programId,
      pelaksanaan_id: null,
      event_type:     'Monitoring Kebuntingan',
      event_date:     record.tanggal,
      description:    record.catatan || null,
      data: {
        jam:           '',
        petugas:       record.petugas,
        kondisi:       record.kondisi,
        status:        'Tersimpan',
        kebuntinganId: record.kebuntinganId,
        beratBadan:    record.beratBadan,
        bcs:           record.bcs,
      },
    });
    if (result.error) return { ok: false, error: result.error };
    return { ok: true, data: {} };
  } catch (err) {
    const msg = String(err);
    console.error('[reproduksiService] recordKebuntinganMonitoring error:', msg);
    return { ok: false, error: msg };
  }
}

// ─── updateKebuntinganStatusInDb ─────────────────────────────────────────────
// Called fire-and-forget after in-memory abortKebuntingan / completeKebuntingan.
// Skips silently for seed / non-UUID in-memory IDs.

export async function updateKebuntinganStatusInDb(
  kebuntingan: KebuntinganRecord,
): Promise<ReproduksiServiceResult<Record<string, never>>> {
  if (!isReproUUID(kebuntingan.id)) return { ok: true, data: {} };

  const { error } = await repoUpdateKebuntinganStatus(
    kebuntingan.id,
    mapPregnancyStatus(kebuntingan.status),
  );
  if (error) {
    console.warn('[reproduksiService] updateKebuntinganStatusInDb failed:', error);
    return { ok: false, error };
  }
  return { ok: true, data: {} };
}

// ─── updateProgramStatusInDb ─────────────────────────────────────────────────
// Called fire-and-forget after in-memory cancelProgram.
// Skips silently for seed / non-UUID in-memory IDs.

export async function updateProgramStatusInDb(
  record: ReproduksiProgramRecord,
): Promise<ReproduksiServiceResult<Record<string, never>>> {
  if (!isReproUUID(record.id)) return { ok: true, data: {} };

  const { error } = await repoUpdateProgramStatus(
    record.id,
    mapProgramStatus(record.status),
  );
  if (error) {
    console.warn('[reproduksiService] updateProgramStatusInDb failed:', error);
    return { ok: false, error };
  }
  return { ok: true, data: {} };
}

// ─── updateProgramInDb ────────────────────────────────────────────────────────
// Called fire-and-forget after in-memory updateProgram (edit mode).
// Syncs all editable fields (name, dates, method, participants, notes, species).
// Skips silently for seed / non-UUID in-memory IDs.

export async function updateProgramInDb(
  record: ReproduksiProgramRecord,
): Promise<ReproduksiServiceResult<Record<string, never>>> {
  if (!isReproUUID(record.id)) return { ok: true, data: {} };

  const { error } = await repoUpdateProgram(record.id, {
    name:            record.namaProgram,
    status:          mapProgramStatus(record.status),
    start_date:      record.tanggalMulai   || null,
    end_date:        record.targetSelesai  || null,
    mating_method:   record.metode         || null,
    participant_ids: [...record.betinaIds, ...record.pejantanIds],
    notes:           record.catatan        || null,
    species:         null,
  });
  if (error) {
    console.warn('[reproduksiService] updateProgramInDb failed:', error);
    return { ok: false, error };
  }
  return { ok: true, data: {} };
}

// ─── UUID guard ───────────────────────────────────────────────────────────────
// Detects Supabase-loaded UUIDs vs non-UUID in-memory seed IDs.

const REPRO_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isReproUUID(val: string | null | undefined): val is string {
  return !!val && REPRO_UUID_RE.test(val);
}

// ─── REGISTRASI_SUPABASE_ID_MAP ───────────────────────────────────────────────
// Session-level map: anakId (in-memory) → Supabase-generated registrasi_anak.id
// Written by recordRegistrasiAnak(); read by recordSapih() to resolve registrasi_id FK.

const REGISTRASI_SUPABASE_ID_MAP = new Map<string, string>();

// ─── recordRegistrasiAnak ─────────────────────────────────────────────────────
// Called from Reproduksi.tsx (RegistrasiAnakFormSheet) after registerAnak() succeeds.
// kelahiranId must be UUID (set by RP-008's parent kelahiran); newly created livestock
// IDs are non-UUID so livestock_id is always null here (linked in a later phase).

export async function recordRegistrasiAnak(
  workspaceId: string,
  anakId: string,
): Promise<ReproduksiServiceResult<Record<string, never>>> {
  if (!workspaceId) {
    return { ok: false, error: 'recordRegistrasiAnak: workspaceId diperlukan.' };
  }

  const anak = ANAK_DB[anakId];
  if (!anak) {
    console.warn('[reproduksiService] recordRegistrasiAnak: anak tidak ditemukan:', anakId);
    return { ok: true, data: {} };
  }

  // kelahiran_id must be UUID — seed kelahiran have non-UUID IDs → skip silently
  if (!isReproUUID(anak.kelahiranId)) return { ok: true, data: {} };

  // DB sex enum only accepts 'Jantan' | 'Betina' — map 'Tidak Diketahui' to null
  const sex: 'Jantan' | 'Betina' | null =
    anak.jenisKelamin === 'Jantan' || anak.jenisKelamin === 'Betina'
      ? anak.jenisKelamin
      : null;

  try {
    const result = await repoInsertRegistrasiAnak({
      kelahiran_id:    anak.kelahiranId,
      livestock_id:    null,           // newly registered livestock has non-UUID in-memory ID
      workspace_id:    workspaceId,
      birth_order:     null,           // not tracked in AnakRecord
      sex,
      birth_weight_kg: anak.beratLahir,
      condition:       'Hidup',        // only 'Hidup' anak can be registered via RP-008
      notes:           anak.catatan ?? null,
    });

    if (result.error) {
      console.warn('[reproduksiService] repoInsertRegistrasiAnak failed:', result.error);
      return { ok: false, error: result.error };
    }
    if (result.data?.id) {
      REGISTRASI_SUPABASE_ID_MAP.set(anakId, result.data.id);
    }
    return { ok: true, data: {} };
  } catch (err) {
    const msg = String(err);
    console.error('[reproduksiService] recordRegistrasiAnak error:', msg);
    return { ok: false, error: msg };
  }
}

// ─── recordSapih ─────────────────────────────────────────────────────────────
// Called from Reproduksi.tsx (SapihPlanForm) after addSapih() succeeds.
// Requires livestock_id to be a Supabase UUID AND the anak's registrasi_anak to
// have been dual-written in this session (REGISTRASI_SUPABASE_ID_MAP populated).
// Both conditions silently skip if unmet — fire-and-forget pattern.

export async function recordSapih(
  workspaceId: string,
  userId: string | null,
  record: WeaningRecord,
): Promise<ReproduksiServiceResult<Record<string, never>>> {
  if (!workspaceId) {
    return { ok: false, error: 'recordSapih: workspaceId diperlukan.' };
  }

  // livestock_id must be Supabase UUID — seed livestock silently skipped
  if (!isReproUUID(record.livestockId)) return { ok: true, data: {} };

  // Find anak from ANAK_DB to resolve registrasi_anak Supabase UUID
  const anakEntry = Object.values(ANAK_DB).find(
    (a) => a.statusRegistrasi === 'Sudah Didaftarkan' && a.livestockId === record.livestockId,
  );
  if (!anakEntry) {
    console.warn('[reproduksiService] recordSapih: anak tidak ditemukan untuk livestock:', record.livestockId);
    return { ok: true, data: {} };
  }

  const registrasiSupabaseId = REGISTRASI_SUPABASE_ID_MAP.get(anakEntry.id);
  if (!registrasiSupabaseId) {
    // registrasi_anak not dual-written this session — skip without error
    return { ok: true, data: {} };
  }

  try {
    // Compute age_at_weaning_days from kelahiran.tanggalLahir (no extra DB call)
    let ageAtWeaningDays: number | null = null;
    if (anakEntry.kelahiranId && KELAHIRAN_DB[anakEntry.kelahiranId]) {
      const lahir = KELAHIRAN_DB[anakEntry.kelahiranId].tanggalLahir;
      const wean  = record.tanggalSapih;
      if (lahir && wean > lahir) {
        ageAtWeaningDays = Math.round(
          (new Date(wean).getTime() - new Date(lahir).getTime()) / 86_400_000,
        );
      }
    }

    const result = await repoInsertSapih({
      livestock_id:         record.livestockId,
      registrasi_id:        registrasiSupabaseId,
      workspace_id:         workspaceId,
      weaning_date:         record.tanggalSapih,
      age_at_weaning_days:  ageAtWeaningDays,
      weight_at_weaning_kg: record.beratBadan,
      method:               record.metode,
      notes:                record.catatan ?? null,
      recorded_by:          userId,
    });

    if (result.error) {
      console.warn('[reproduksiService] repoInsertSapih failed:', result.error);
      return { ok: false, error: result.error };
    }
    return { ok: true, data: {} };
  } catch (err) {
    const msg = String(err);
    console.error('[reproduksiService] recordSapih error:', msg);
    return { ok: false, error: msg };
  }
}
