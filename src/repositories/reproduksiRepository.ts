// ─── Reproduksi Repository — FLOW-003M11 ─────────────────────────────────────
//
// Raw Supabase access for reproduksi module tables.
// Never call this from pages or hooks — go through reproduksiService.ts.
//
// Tables covered:
//   reproduksi_programs, pelaksanaan_reproduksi, monitoring_reproduksi,
//   kebuntingan, kelahiran
//
// Deferred (schema constraint or FK dependency):
//   pemeriksaan_kebuntingan  — livestock_id NOT NULL but not in in-memory record
//   registrasi_anak, sapih   — require livestock Supabase UUID (M12+)

import { supabase } from '../lib/supabase';

// ─── Error type ───────────────────────────────────────────────────────────────

export class ReprodukasiRepoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReprodukasiRepoError';
  }
}

// ─── reproduksi_programs ──────────────────────────────────────────────────────

export interface ReproduksiProgramDbInsert {
  id:               string;
  workspace_id:     string;
  name:             string;
  /** Mapped from in-memory StatusProgram → program_status_enum */
  status:           'Aktif' | 'Selesai' | 'Dihentikan' | 'Draft';
  start_date:       string | null;   // YYYY-MM-DD
  end_date:         string | null;   // YYYY-MM-DD (targetSelesai)
  mating_method:    string | null;   // MetodeReproduksi
  participant_ids:  string[] | null; // betinaIds + pejantanIds
  notes:            string | null;
  species:          null;            // not tracked in in-memory model
}

export async function repoInsertReprodukasiProgram(
  input: ReproduksiProgramDbInsert,
): Promise<{ data: { id: string } | null; error: string | null }> {
  const { data, error } = await supabase
    .from('reproduksi_programs')
    .insert({
      id:              input.id,
      workspace_id:    input.workspace_id,
      name:            input.name,
      status:          input.status,
      start_date:      input.start_date,
      end_date:        input.end_date,
      mating_method:   input.mating_method,
      participant_ids: input.participant_ids,
      notes:           input.notes,
      species:         input.species,
    })
    .select('id')
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// ─── pelaksanaan_reproduksi ───────────────────────────────────────────────────

export interface PelaksanaanDbInsert {
  id:             string;
  program_id:     string;
  workspace_id:   string;
  execution_date: string;   // YYYY-MM-DD
  method:         string | null;
  notes:          string | null;
}

export async function repoInsertPelaksanaan(
  input: PelaksanaanDbInsert,
): Promise<{ data: { id: string } | null; error: string | null }> {
  const { data, error } = await supabase
    .from('pelaksanaan_reproduksi')
    .insert({
      id:             input.id,
      program_id:     input.program_id,
      workspace_id:   input.workspace_id,
      execution_date: input.execution_date,
      method:         input.method,
      notes:          input.notes,
    })
    .select('id')
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// ─── monitoring_reproduksi ────────────────────────────────────────────────────

export interface MonitoringReproduksiDbInsert {
  id:              string;
  program_id:      string;
  pelaksanaan_id:  string | null;
  event_type:      string;
  event_date:      string;   // YYYY-MM-DD
  description:     string | null;
  /** Extra fields (kondisi, jam, petugas) stored as JSONB */
  data:            Record<string, unknown> | null;
}

export async function repoInsertMonitoring(
  input: MonitoringReproduksiDbInsert,
): Promise<{ data: { id: string } | null; error: string | null }> {
  const { data, error } = await supabase
    .from('monitoring_reproduksi')
    .insert({
      id:             input.id,
      program_id:     input.program_id,
      pelaksanaan_id: input.pelaksanaan_id,
      event_type:     input.event_type,
      event_date:     input.event_date,
      description:    input.description,
      data:           input.data,
    })
    .select('id')
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// ─── kebuntingan ──────────────────────────────────────────────────────────────

export interface KebuntinganDbInsert {
  id:                  string;
  program_id:          string;
  pemeriksaan_id:      string;   // FK → pemeriksaan_kebuntingan.id
  dam_id:              string;   // FK → livestock.id
  sire_id:             string | null;
  workspace_id:        string;
  conception_date:     string | null;
  expected_birth_date: string | null;
  /** Mapped from in-memory StatusKebuntingan → pregnancy_status_enum */
  status:              'Aktif' | 'Selesai' | 'Gugur' | 'Dibatalkan';
  notes:               string | null;
}

export async function repoInsertKebuntingan(
  input: KebuntinganDbInsert,
): Promise<{ data: { id: string } | null; error: string | null }> {
  const { data, error } = await supabase
    .from('kebuntingan')
    .insert({
      id:                  input.id,
      program_id:          input.program_id,
      pemeriksaan_id:      input.pemeriksaan_id,
      dam_id:              input.dam_id,
      sire_id:             input.sire_id,
      workspace_id:        input.workspace_id,
      conception_date:     input.conception_date,
      expected_birth_date: input.expected_birth_date,
      status:              input.status,
      notes:               input.notes,
    })
    .select('id')
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// ─── kelahiran ────────────────────────────────────────────────────────────────

export interface KelahiranDbInsert {
  id:            string;
  kebuntingan_id: string;
  workspace_id:  string;
  birth_date:    string;         // YYYY-MM-DD
  birth_time:    string | null;  // HH:MM:SS
  birth_process: string | null;  // MetodeKelahiran free text
  total_born:    number;         // initial 0 — updated when anak are registered
  total_alive:   number;
  total_dead:    number;
  notes:         string | null;
}

// ─── registrasi_anak ──────────────────────────────────────────────────────────

export interface RegistrasiAnakInsertInput {
  kelahiran_id:    string;         // FK → kelahiran.id (Supabase UUID required)
  livestock_id:    string | null;  // FK → livestock.id (null for newly registered anak — non-UUID in-memory ID)
  workspace_id:    string;
  birth_order:     number | null;
  sex:             'Jantan' | 'Betina' | null;
  birth_weight_kg: number | null;
  condition:       'Hidup' | 'Mati';
  notes:           string | null;
}

/**
 * Insert a registrasi_anak row. Returns the Supabase-generated UUID.
 * livestock_id is nullable — pass null when the livestock has a non-UUID in-memory ID.
 */
export async function repoInsertRegistrasiAnak(
  input: RegistrasiAnakInsertInput,
): Promise<{ data: { id: string } | null; error: string | null }> {
  const { data, error } = await supabase
    .from('registrasi_anak')
    .insert({
      kelahiran_id:    input.kelahiran_id,
      livestock_id:    input.livestock_id,
      workspace_id:    input.workspace_id,
      birth_order:     input.birth_order,
      sex:             input.sex,
      birth_weight_kg: input.birth_weight_kg,
      condition:       input.condition,
      notes:           input.notes,
    })
    .select('id')
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// ─── sapih ────────────────────────────────────────────────────────────────────

export interface SapihInsertInput {
  livestock_id:         string;   // FK → livestock.id (Supabase UUID required — NOT NULL)
  registrasi_id:        string;   // FK → registrasi_anak.id (Supabase UUID from REGISTRASI_SUPABASE_ID_MAP)
  workspace_id:         string;
  weaning_date:         string;   // YYYY-MM-DD
  age_at_weaning_days:  number | null;
  weight_at_weaning_kg: number | null;
  method:               string | null;
  notes:                string | null;
  recorded_by:          string | null;
}

export async function repoInsertSapih(
  input: SapihInsertInput,
): Promise<{ data: { id: string } | null; error: string | null }> {
  const { data, error } = await supabase
    .from('sapih')
    .insert({
      livestock_id:         input.livestock_id,
      registrasi_id:        input.registrasi_id,
      workspace_id:         input.workspace_id,
      weaning_date:         input.weaning_date,
      age_at_weaning_days:  input.age_at_weaning_days,
      weight_at_weaning_kg: input.weight_at_weaning_kg,
      method:               input.method,
      notes:                input.notes,
      recorded_by:          input.recorded_by,
    })
    .select('id')
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// ─── pemeriksaan_kebuntingan (insert) ─────────────────────────────────────────

export interface PemeriksaanKebuntinganDbInsert {
  program_id:      string;
  livestock_id:    string;
  workspace_id:    string;
  check_date:      string;  // YYYY-MM-DD
  method:          string | null;
  result:          string;
  days_pregnant:   number | null;
  examiner:        string | null;
  notes:           string | null;
}

export async function repoInsertPemeriksaanKebuntingan(
  input: PemeriksaanKebuntinganDbInsert,
): Promise<{ data: { id: string } | null; error: string | null }> {
  const { data, error } = await supabase
    .from('pemeriksaan_kebuntingan')
    .insert({
      program_id:    input.program_id,
      livestock_id:  input.livestock_id,
      workspace_id:  input.workspace_id,
      check_date:    input.check_date,
      method:        input.method,
      result:        input.result,
      days_pregnant: input.days_pregnant,
      examiner:      input.examiner,
      notes:         input.notes,
    })
    .select('id')
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function repoInsertKelahiran(
  input: KelahiranDbInsert,
): Promise<{ data: { id: string } | null; error: string | null }> {
  const { data, error } = await supabase
    .from('kelahiran')
    .insert({
      id:             input.id,
      kebuntingan_id: input.kebuntingan_id,
      workspace_id:   input.workspace_id,
      birth_date:     input.birth_date,
      birth_time:     input.birth_time,
      birth_process:  input.birth_process,
      total_born:     input.total_born,
      total_alive:    input.total_alive,
      total_dead:     input.total_dead,
      notes:          input.notes,
    })
    .select('id')
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// ═══════════════════════════════════════════════════════════════════════════════
// READ-PATH — FLOW-003M21
// ═══════════════════════════════════════════════════════════════════════════════
// DB row types for read queries (workspace-scoped SELECTs).
// These are minimal projections — only columns the populate functions need.

// ─── Row types ────────────────────────────────────────────────────────────────

export interface ReproduksiProgramDbRow {
  id:              string;
  name:            string;
  status:          'Aktif' | 'Selesai' | 'Dihentikan' | 'Draft';
  start_date:      string | null;
  end_date:        string | null;
  mating_method:   string | null;
  notes:           string | null;
  created_at:      string;
  updated_at:      string;
}

export interface PelaksanaanDbRow {
  id:             string;
  program_id:     string;
  execution_date: string;
  method:         string | null;
  notes:          string | null;
  created_at:     string;
}

export interface MonitoringDbRow {
  id:             string;
  program_id:     string;
  pelaksanaan_id: string | null;
  event_type:     string;
  event_date:     string;
  description:    string | null;
  data:           Record<string, unknown> | null;
  created_at:     string;
}

export interface PemeriksaanDbRow {
  id:            string;
  program_id:    string;
  livestock_id:  string;
  check_date:    string;
  method:        string | null;
  result:        string;
  days_pregnant: number | null;
  examiner:      string | null;
  notes:         string | null;
  created_at:    string;
}

export interface KebuntinganDbRow {
  id:                  string;
  program_id:          string;
  pemeriksaan_id:      string;
  dam_id:              string;
  conception_date:     string | null;
  expected_birth_date: string | null;
  actual_birth_date:   string | null;
  status:              'Aktif' | 'Selesai' | 'Gugur' | 'Dibatalkan';
  notes:               string | null;
  created_at:          string;
  updated_at:          string;
}

export interface KelahiranDbRow {
  id:             string;
  kebuntingan_id: string;
  birth_date:     string;
  birth_time:     string | null;
  birth_process:  string | null;
  notes:          string | null;
  created_at:     string;
}

export interface RegistrasiAnakDbRow {
  id:              string;
  kelahiran_id:    string;
  livestock_id:    string | null;
  sex:             'Jantan' | 'Betina' | null;
  birth_weight_kg: number | null;
  condition:       'Hidup' | 'Mati';
  notes:           string | null;
  created_at:      string;
}

export interface SapihDbRow {
  id:                   string;
  livestock_id:         string;
  registrasi_id:        string;
  weaning_date:         string;
  weight_at_weaning_kg: number | null;
  method:               string | null;
  notes:                string | null;
  created_at:           string;
}

// ─── Read functions ───────────────────────────────────────────────────────────

export async function repoGetProgramsByWorkspace(
  workspaceId: string,
): Promise<ReproduksiProgramDbRow[]> {
  const { data, error } = await supabase
    .from('reproduksi_programs')
    .select('id,name,status,start_date,end_date,mating_method,notes,created_at,updated_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });
  if (error) throw new ReprodukasiRepoError(error.message);
  return (data ?? []) as ReproduksiProgramDbRow[];
}

export async function repoGetPelaksanaanByWorkspace(
  workspaceId: string,
): Promise<PelaksanaanDbRow[]> {
  const { data, error } = await supabase
    .from('pelaksanaan_reproduksi')
    .select('id,program_id,execution_date,method,notes,created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });
  if (error) throw new ReprodukasiRepoError(error.message);
  return (data ?? []) as PelaksanaanDbRow[];
}

export async function repoGetMonitoringByWorkspace(
  workspaceId: string,
): Promise<MonitoringDbRow[]> {
  const { data, error } = await supabase
    .from('monitoring_reproduksi')
    .select('id,program_id,pelaksanaan_id,event_type,event_date,description,data,created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });
  if (error) throw new ReprodukasiRepoError(error.message);
  return (data ?? []) as MonitoringDbRow[];
}

export async function repoGetPemeriksaanByWorkspace(
  workspaceId: string,
): Promise<PemeriksaanDbRow[]> {
  const { data, error } = await supabase
    .from('pemeriksaan_kebuntingan')
    .select('id,program_id,livestock_id,check_date,method,result,days_pregnant,examiner,notes,created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });
  if (error) throw new ReprodukasiRepoError(error.message);
  return (data ?? []) as PemeriksaanDbRow[];
}

export async function repoGetKebuntinganByWorkspace(
  workspaceId: string,
): Promise<KebuntinganDbRow[]> {
  const { data, error } = await supabase
    .from('kebuntingan')
    .select('id,program_id,pemeriksaan_id,dam_id,conception_date,expected_birth_date,actual_birth_date,status,notes,created_at,updated_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });
  if (error) throw new ReprodukasiRepoError(error.message);
  return (data ?? []) as KebuntinganDbRow[];
}

export async function repoGetKelahiranByWorkspace(
  workspaceId: string,
): Promise<KelahiranDbRow[]> {
  const { data, error } = await supabase
    .from('kelahiran')
    .select('id,kebuntingan_id,birth_date,birth_time,birth_process,notes,created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });
  if (error) throw new ReprodukasiRepoError(error.message);
  return (data ?? []) as KelahiranDbRow[];
}

export async function repoGetRegistrasiAnakByWorkspace(
  workspaceId: string,
): Promise<RegistrasiAnakDbRow[]> {
  const { data, error } = await supabase
    .from('registrasi_anak')
    .select('id,kelahiran_id,livestock_id,sex,birth_weight_kg,condition,notes,created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });
  if (error) throw new ReprodukasiRepoError(error.message);
  return (data ?? []) as RegistrasiAnakDbRow[];
}

export async function repoGetSapihByWorkspace(
  workspaceId: string,
): Promise<SapihDbRow[]> {
  const { data, error } = await supabase
    .from('sapih')
    .select('id,livestock_id,registrasi_id,weaning_date,weight_at_weaning_kg,method,notes,created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });
  if (error) throw new ReprodukasiRepoError(error.message);
  return (data ?? []) as SapihDbRow[];
}

// ─── UPDATE functions — FLOW-003M26 ─────────────────────────────────────────

/**
 * Updates the status (and updated_at) of a kebuntingan row.
 * Called fire-and-forget after in-memory abortKebuntingan / completeKebuntingan.
 */
export async function repoUpdateKebuntinganStatus(
  id: string,
  status: 'Aktif' | 'Selesai' | 'Gugur' | 'Dibatalkan',
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('kebuntingan')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Updates the status (and updated_at) of a reproduksi_programs row.
 * Called fire-and-forget after in-memory cancelProgram.
 */
export async function repoUpdateProgramStatus(
  id: string,
  status: 'Aktif' | 'Selesai' | 'Dihentikan' | 'Draft',
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('reproduksi_programs')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

// ─── Full program field update ────────────────────────────────────────────────

export interface ReproduksiProgramDbUpdate {
  name:            string;
  status:          string;
  start_date:      string | null;
  end_date:        string | null;
  mating_method:   string | null;
  participant_ids: string[];
  notes:           string | null;
  species:         string | null;
}

export async function repoUpdateProgram(
  id: string,
  patch: ReproduksiProgramDbUpdate,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('reproduksi_programs')
    .update({
      name:            patch.name,
      status:          patch.status,
      start_date:      patch.start_date,
      end_date:        patch.end_date,
      mating_method:   patch.mating_method,
      participant_ids: patch.participant_ids,
      notes:           patch.notes,
      species:         patch.species,
      updated_at:      new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}
