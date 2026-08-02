// ─── Health Repository — FLOW-003M1 ──────────────────────────────────────────
//
// Supabase adapter for the Health module.
// Tables covered:
//   health_checkups, health_treatments, health_control_schedules
//
// Rules:
//  - All functions are async and return typed results.
//  - requireAuthSession() guards every exported function.
//  - Never import from pages, components, or contexts.
//  - Business logic lives in healthService.ts, not here.
//  - Supabase is the SSOT; in-memory stores are populated by useHealth().
//
// DB Schema reference:
//   supabase/migrations/20260725000006_health_reproduction.sql

import { supabase } from '../lib/supabase';
import { requireAuthSession } from '../lib/authSession';
import type {
  HealthCheckupDbRow,
  HealthCheckupCreateInput,
  HealthCheckupPatchInput,
  HealthTreatmentDbRow,
  HealthTreatmentCreateInput,
  HealthControlScheduleDbRow,
  HealthControlScheduleCreateInput,
  HealthControlSchedulePatchInput,
} from '../types/health';

// ─── Error ────────────────────────────────────────────────────────────────────

export class HealthRepoError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'HealthRepoError';
  }
}

function guard(error: { message: string; code?: string } | null): void {
  if (error) throw new HealthRepoError(error.message, error.code);
}

// ─── Health Checkups ──────────────────────────────────────────────────────────

/**
 * All health checkups for a workspace, newest first.
 * Used by useHealth() to hydrate the in-memory PEMERIKSAAN_DB.
 */
export async function repoGetCheckupsByWorkspace(
  workspaceId: string,
): Promise<HealthCheckupDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('health_checkups')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('checkup_date', { ascending: false });
  guard(error);
  return (data ?? []) as HealthCheckupDbRow[];
}

/**
 * All health checkups for a specific livestock, newest first.
 */
export async function repoGetCheckupsByLivestock(
  workspaceId: string,
  livestockId: string,
): Promise<HealthCheckupDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('health_checkups')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('livestock_id', livestockId)
    .order('checkup_date', { ascending: false });
  guard(error);
  return (data ?? []) as HealthCheckupDbRow[];
}

/**
 * Single health checkup by UUID.
 * Returns null when not found.
 */
export async function repoGetCheckupById(id: string): Promise<HealthCheckupDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('health_checkups')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  guard(error);
  return data as HealthCheckupDbRow | null;
}

/**
 * Insert a new health checkup row.
 * Returns the persisted row (with server-generated id).
 */
export async function repoInsertCheckup(
  input: HealthCheckupCreateInput,
): Promise<HealthCheckupDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('health_checkups')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as HealthCheckupDbRow;
}

/**
 * Apply a partial update to a health checkup row.
 * Returns the updated row or null if not found.
 */
export async function repoPatchCheckup(
  id: string,
  patch: HealthCheckupPatchInput,
): Promise<HealthCheckupDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('health_checkups')
    .update(patch)
    .eq('id', id)
    .select()
    .maybeSingle();
  guard(error);
  return data as HealthCheckupDbRow | null;
}

/**
 * Delete a health checkup row (and cascade to treatments via FK).
 * Use with caution — this is permanent.
 */
export async function repoDeleteCheckup(id: string): Promise<void> {
  await requireAuthSession();
  const { error } = await supabase
    .from('health_checkups')
    .delete()
    .eq('id', id);
  guard(error);
}

// ─── Health Treatments ────────────────────────────────────────────────────────

/**
 * All health treatments for a workspace, newest first.
 * Used by useHealth() to hydrate the in-memory treatment stores.
 */
export async function repoGetTreatmentsByWorkspace(
  workspaceId: string,
): Promise<HealthTreatmentDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('health_treatments')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('treatment_date', { ascending: false });
  guard(error);
  return (data ?? []) as HealthTreatmentDbRow[];
}

/**
 * All health treatments linked to a specific checkup.
 */
export async function repoGetTreatmentsByCheckup(
  checkupId: string,
): Promise<HealthTreatmentDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('health_treatments')
    .select('*')
    .eq('checkup_id', checkupId)
    .order('treatment_date', { ascending: false });
  guard(error);
  return (data ?? []) as HealthTreatmentDbRow[];
}

/**
 * All health treatments for a specific livestock, newest first.
 */
export async function repoGetTreatmentsByLivestock(
  workspaceId: string,
  livestockId: string,
): Promise<HealthTreatmentDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('health_treatments')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('livestock_id', livestockId)
    .order('treatment_date', { ascending: false });
  guard(error);
  return (data ?? []) as HealthTreatmentDbRow[];
}

/**
 * Single health treatment by UUID.
 * Returns null when not found.
 */
export async function repoGetTreatmentById(id: string): Promise<HealthTreatmentDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('health_treatments')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  guard(error);
  return data as HealthTreatmentDbRow | null;
}

/**
 * Insert a new health treatment row.
 * Returns the persisted row (with server-generated id).
 */
export async function repoInsertTreatment(
  input: HealthTreatmentCreateInput,
): Promise<HealthTreatmentDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('health_treatments')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as HealthTreatmentDbRow;
}

/**
 * Insert multiple treatment rows in one round-trip.
 * Atomic — all succeed or all fail.
 */
export async function repoInsertTreatments(
  inputs: HealthTreatmentCreateInput[],
): Promise<HealthTreatmentDbRow[]> {
  if (inputs.length === 0) return [];
  await requireAuthSession();
  const { data, error } = await supabase
    .from('health_treatments')
    .insert(inputs)
    .select();
  guard(error);
  return (data ?? []) as HealthTreatmentDbRow[];
}

// ─── Health Control Schedules ─────────────────────────────────────────────────

/**
 * All health control schedules for a workspace, ordered by scheduled_date ascending.
 * Used by useHealth() to hydrate the in-memory KONTROL_RECORDS.
 */
export async function repoGetControlSchedulesByWorkspace(
  workspaceId: string,
): Promise<HealthControlScheduleDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('health_control_schedules')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('scheduled_date', { ascending: true });
  guard(error);
  return (data ?? []) as HealthControlScheduleDbRow[];
}

/**
 * All control schedules for a specific livestock, ordered by scheduled_date.
 */
export async function repoGetControlSchedulesByLivestock(
  workspaceId: string,
  livestockId: string,
): Promise<HealthControlScheduleDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('health_control_schedules')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('livestock_id', livestockId)
    .order('scheduled_date', { ascending: true });
  guard(error);
  return (data ?? []) as HealthControlScheduleDbRow[];
}

/**
 * Single control schedule by UUID.
 * Returns null when not found.
 */
export async function repoGetControlScheduleById(
  id: string,
): Promise<HealthControlScheduleDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('health_control_schedules')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  guard(error);
  return data as HealthControlScheduleDbRow | null;
}

/**
 * Insert a new health control schedule row.
 * Returns the persisted row (with server-generated id).
 */
export async function repoInsertControlSchedule(
  input: HealthControlScheduleCreateInput,
): Promise<HealthControlScheduleDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('health_control_schedules')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as HealthControlScheduleDbRow;
}

/**
 * Apply a partial update to a control schedule (status, notes).
 * Returns the updated row or null if not found.
 */
export async function repoPatchControlSchedule(
  id: string,
  patch: HealthControlSchedulePatchInput,
): Promise<HealthControlScheduleDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('health_control_schedules')
    .update(patch)
    .eq('id', id)
    .select()
    .maybeSingle();
  guard(error);
  return data as HealthControlScheduleDbRow | null;
}

/**
 * Mark a scheduled control as completed.
 */
export async function repoCompleteControlSchedule(
  id: string,
): Promise<void> {
  await requireAuthSession();
  const { error } = await supabase
    .from('health_control_schedules')
    .update({ status: 'Selesai' })
    .eq('id', id);
  guard(error);
}
