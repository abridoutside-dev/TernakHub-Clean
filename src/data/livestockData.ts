import { generateUUID } from '../utils/uuid';
import { getGrowthParameter } from './growthParameterData';

// ─── Shared Livestock Data Registry ──────────────────────────────────────────
// All pages that display livestock by ID must look up data from this file.
// Never hardcode a single livestock object in a page component.
//
// LIVESTOCK_DB, PEDIGREE_DB, OWNERSHIP_DB, and all history DBs are intentionally
// empty — they are populated at runtime when users register livestock through the app.

export type LivestockRecord = {
  id: string;
  name: string | null;
  type: string;
  typeIcon: string;
  typeColor: string;
  typeBg: string;
  ras: string;
  kelamin: string;
  birthDate: string;
  /** Raw ISO date string (YYYY-MM-DD) from Supabase — preserved so edit forms
   *  can round-trip without converting through the display label.
   *  Optional: only set when the record was hydrated from Supabase. */
  birthDateIso?: string | null;
  birthDateEstimated: boolean;
  age: string;
  /** Approximate age in months — used for filtering. */
  ageMonths: number;
  birthWeight: string;
  weight: string;
  weightUnit: string;
  program: string;
  /** Health status: Sehat | Sakit | Pemantauan — NOT to be confused with livestock location status. */
  status: string;
  /**
   * For Di Kandang animals: the pen/block location (e.g. "Kandang A, Blok 3").
   * For Luar Kandang animals: the current outside destination (updated on transfer, restored on return).
   * Location status (Di Kandang / Luar Kandang / Arsip) lives in transferData.ts.
   */
  location: string;
  batch: { id: string; program: string; joinedDate: string; totalMembers: number } | null;
  digitalIdentity: { verified: boolean; registeredDate: string; issuedBy: string };
};

export type PedigreeRelative = {
  role: string;
  id: string | null;
  name: string | null;
  icon: string;
  typeBg: string;
  status: 'Aktif' | 'Arsip' | 'Mati' | 'Terjual' | null;
};

export type PedigreeRecord = {
  parents: PedigreeRelative[];
  grandparents: PedigreeRelative[];
  greatGrandparents: PedigreeRelative[];
  offspring: PedigreeRelative[];
};

// ─── Livestock Database ───────────────────────────────────────────────────────
// Intentionally empty — populated when users register livestock through the app.

export const LIVESTOCK_DB: Record<string, LivestockRecord> = {};

// ─── Pedigree Database ────────────────────────────────────────────────────────
// Intentionally empty — populated when users record lineage through the app.

export const PEDIGREE_DB: Record<string, PedigreeRecord> = {};

// Fallback for IDs not in PEDIGREE_DB
const EMPTY_PEDIGREE: PedigreeRecord = {
  parents: [
    { role: 'Ayah', id: null, name: 'Tidak Diketahui', icon: '❓', typeBg: '#f5f5f5', status: null },
    { role: 'Ibu',  id: null, name: 'Tidak Diketahui', icon: '❓', typeBg: '#f5f5f5', status: null },
  ],
  grandparents: [
    { role: 'Kakek (Ayah)', id: null, name: 'Tidak Diketahui', icon: '❓', typeBg: '#f5f5f5', status: null },
    { role: 'Nenek (Ayah)', id: null, name: 'Tidak Diketahui', icon: '❓', typeBg: '#f5f5f5', status: null },
    { role: 'Kakek (Ibu)',  id: null, name: 'Tidak Diketahui', icon: '❓', typeBg: '#f5f5f5', status: null },
    { role: 'Nenek (Ibu)',  id: null, name: 'Tidak Diketahui', icon: '❓', typeBg: '#f5f5f5', status: null },
  ],
  greatGrandparents: [
    { role: 'Moyang (KA-A)', id: null, name: 'Tidak Diketahui', icon: '❓', typeBg: '#f5f5f5', status: null },
    { role: 'Moyang (KA-I)', id: null, name: 'Tidak Diketahui', icon: '❓', typeBg: '#f5f5f5', status: null },
    { role: 'Moyang (NA-A)', id: null, name: 'Tidak Diketahui', icon: '❓', typeBg: '#f5f5f5', status: null },
    { role: 'Moyang (NA-I)', id: null, name: 'Tidak Diketahui', icon: '❓', typeBg: '#f5f5f5', status: null },
    { role: 'Moyang (KI-A)', id: null, name: 'Tidak Diketahui', icon: '❓', typeBg: '#f5f5f5', status: null },
    { role: 'Moyang (KI-I)', id: null, name: 'Tidak Diketahui', icon: '❓', typeBg: '#f5f5f5', status: null },
    { role: 'Moyang (NI-A)', id: null, name: 'Tidak Diketahui', icon: '❓', typeBg: '#f5f5f5', status: null },
    { role: 'Moyang (NI-I)', id: null, name: 'Tidak Diketahui', icon: '❓', typeBg: '#f5f5f5', status: null },
  ],
  offspring: [],
};

// ─── Lookup helpers ───────────────────────────────────────────────────────────

// Static fallback when a livestock ID is not found in LIVESTOCK_DB.
// Used only as a safe default — pages should check LIVESTOCK_DB directly
// before rendering, or handle the empty/not-found state explicitly.
const FALLBACK_LIVESTOCK: LivestockRecord = {
  id: '', name: null,
  type: 'Domba', typeIcon: '🐑', typeColor: '#1b7a43', typeBg: '#e8f5ee',
  ras: '—', kelamin: 'Jantan',
  birthDate: '—', birthDateEstimated: false,
  age: '—', ageMonths: 0, birthWeight: '—', weight: '—', weightUnit: 'Kg',
  program: 'Lainnya', status: 'Sehat', location: '—',
  batch: null,
  digitalIdentity: { verified: false, registeredDate: '—', issuedBy: '—' },
};

export function getLivestock(id: string): LivestockRecord {
  return LIVESTOCK_DB[id] ?? { ...FALLBACK_LIVESTOCK, id };
}

export function getPedigree(id: string): PedigreeRecord {
  return PEDIGREE_DB[id] ?? EMPTY_PEDIGREE;
}

// ─── Descendants (multi-generation BFS) ───────────────────────────────────────

export type DescendantEntry = {
  node: PedigreeRelative;
  generation: number;
  lv: LivestockRecord;
};

export function getDescendants(id: string): DescendantEntry[] {
  const result: DescendantEntry[] = [];
  const visited = new Set<string>([id]);
  const queue: Array<{ id: string; generation: number }> = [];

  for (const node of getPedigree(id).offspring) {
    if (node.id && !visited.has(node.id)) {
      visited.add(node.id);
      queue.push({ id: node.id, generation: 1 });
      result.push({ node, generation: 1, lv: getLivestock(node.id) });
    }
  }

  while (queue.length > 0) {
    const entry = queue.shift()!;
    const pedigree = PEDIGREE_DB[entry.id];
    if (!pedigree) continue;
    for (const node of pedigree.offspring) {
      if (node.id && !visited.has(node.id)) {
        visited.add(node.id);
        const nextGen = entry.generation + 1;
        queue.push({ id: node.id, generation: nextGen });
        result.push({ node, generation: nextGen, lv: getLivestock(node.id) });
      }
    }
  }

  return result;
}

// ─── Ownership History ────────────────────────────────────────────────────────

export type OwnershipMethod =
  | 'Lahir'
  | 'Pembelian'
  | 'Penjualan'
  | 'Hibah'
  | 'Beli Kembali'
  | 'Transfer'
  | 'Registrasi Manual'
  | 'Impor'
  | 'Transfer Masuk'
  | 'Lainnya';

export type OwnershipRecord = {
  id: string;
  owner: string;
  workspace: string;
  startDate: string;
  endDate: string | null;   // null = current owner
  method: OwnershipMethod;
  notes: string | null;
  isCurrent: boolean;
};

// Intentionally empty — populated when users register ownership through the app.
export const OWNERSHIP_DB: Record<string, OwnershipRecord[]> = {};

export function getOwnershipHistory(id: string): OwnershipRecord[] {
  const existing = OWNERSHIP_DB[id];
  if (existing && existing.length > 0) return existing;

  // Auto-generate the first ownership record from the livestock's registered data.
  // Every livestock must always have at least one ownership record.
  const lv = getLivestock(id);
  // Only generate if the livestock actually exists in the DB
  if (!LIVESTOCK_DB[id]) return [];
  return [
    {
      id: `OWN-${id}-AUTO`,
      owner: lv.digitalIdentity.issuedBy,
      workspace: lv.digitalIdentity.issuedBy,
      startDate: lv.digitalIdentity.registeredDate,
      endDate: null,
      method: 'Lahir',
      notes: null,
      isCurrent: true,
    },
  ];
}

// ─── Weight History ───────────────────────────────────────────────────────────

export type WeightEntry = {
  /** UUID v4 — generated once at record creation (generateUUID()); never regenerated or shown in the UI. */
  id: string;
  date: string;
  weight: string;
  unit: string;
  diff: string | null;   // e.g. "+2.0" or "-1.0"
  notes: string | null;
};

// ─── Weight History — Two-Layer Architecture ─────────────────────────────────
//
// WEIGHT_HISTORY_DB  — ephemeral seed/QA data; reset on every page load.
// USER_WEIGHT_DB     — user-recorded entries; persisted in localStorage and
//                      survives page refreshes / app reloads.
//
// getWeightHistory merges both layers: user entries appear first (newest) and
// any seeded entry whose date is already covered by a user entry is suppressed
// to prevent duplicates in the displayed history.
//
// addWeightRecord writes to both layers simultaneously.
//
// restoreUserWeightToLivestock must be called once after the seed runs (see
// main.tsx) so that LIVESTOCK_DB base records reflect the user's latest weights
// rather than the seed values.

const WEIGHT_HISTORY_STORAGE_KEY = 'ternakhub_weight_user_entries';

// Populated on every page load (ephemeral — cleared on refresh).
const WEIGHT_HISTORY_DB: Record<string, WeightEntry[]> = {};

// Loaded from localStorage once at module init — survives page refreshes.
const USER_WEIGHT_DB: Record<string, WeightEntry[]> = (() => {
  try {
    const raw = localStorage.getItem(WEIGHT_HISTORY_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    // Guard against valid JSON with unexpected shape (e.g. primitive, array).
    // If the top-level value is not a plain object, discard and start fresh.
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    // Ensure each value is an array; drop malformed per-animal entries.
    // CB-FIX-002 / MIN-001: Back-fill the `id` field on legacy entries that
    // were stored before CB-SYNC-002 added it. Records already carrying a
    // string `id` are left untouched; only the truly missing ones get a new
    // UUID so that the TypeScript contract (id: string) is never violated.
    const safe: Record<string, WeightEntry[]> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (Array.isArray(v)) {
        safe[k] = (v as WeightEntry[]).map((e) =>
          typeof e.id === 'string' ? e : { ...e, id: generateUUID() },
        );
      }
    }
    return safe;
  } catch {
    return {};
  }
})();

function persistUserWeightDB(): void {
  try {
    localStorage.setItem(WEIGHT_HISTORY_STORAGE_KEY, JSON.stringify(USER_WEIGHT_DB));
  } catch {
    // localStorage unavailable (e.g. private browsing quota) — in-memory still works.
  }
}

/**
 * Returns the merged weight history for a livestock animal.
 *
 * User-recorded entries (from localStorage) are returned first and take
 * precedence. Seeded entries whose date is already covered by a user entry
 * are filtered out to prevent duplicates in the history list.
 */
export function getWeightHistory(id: string): WeightEntry[] {
  const seeded = WEIGHT_HISTORY_DB[id] ?? [];
  const user   = USER_WEIGHT_DB[id]   ?? [];
  if (user.length === 0) return seeded;
  const userDates = new Set(user.map((e) => e.date));
  return [...user, ...seeded.filter((e) => !userDates.has(e.date))];
}

/**
 * Records a new weight entry for a livestock animal.
 *
 * Writes to both the ephemeral in-memory layer (WEIGHT_HISTORY_DB) and the
 * persistent localStorage layer (USER_WEIGHT_DB) so the entry survives refresh.
 * Computes `diff` against the most-recent entry in the merged history.
 * Keeps LIVESTOCK_DB[id].weight / .weightUnit in sync.
 */
export function addWeightRecord(
  id: string,
  weight: string,
  unit: string,
  date: string,
  notes: string | null,
): void {
  // Compute diff against the current latest entry (merged view).
  const prev = getWeightHistory(id)[0] ?? null;
  let diff: string | null = null;
  if (prev) {
    const prevW = parseFloat(prev.weight);
    const newW  = parseFloat(weight);
    if (!isNaN(prevW) && !isNaN(newW)) {
      const delta = newW - prevW;
      diff = (delta >= 0 ? '+' : '') + delta.toFixed(1);
    }
  }

  const entry: WeightEntry = { id: generateUUID(), date, weight, unit, diff, notes };

  // Ephemeral layer — fast in-memory read within the same session.
  WEIGHT_HISTORY_DB[id] = [entry, ...(WEIGHT_HISTORY_DB[id] ?? [])];

  // Persistent layer — survives page refresh.
  USER_WEIGHT_DB[id] = [entry, ...(USER_WEIGHT_DB[id] ?? [])];
  persistUserWeightDB();

  // Keep the base livestock record in sync.
  if (LIVESTOCK_DB[id]) {
    LIVESTOCK_DB[id] = { ...LIVESTOCK_DB[id], weight, weightUnit: unit };
  }

  // Timeline — immutable log of the weight-recording event itself.
  addWeightTimelineEvent({
    livestockId: id,
    livestockName: LIVESTOCK_DB[id]?.name ?? null,
    date,
    weight,
    unit,
    diff,
  });
}

// ─── Weight Timeline Log ──────────────────────────────────────────────────────
// Immutable event log for weight-recording events, mirroring the pattern used
// by BATCH_TIMELINE_LOG (batchData.ts) / MUTATION_EVENT_LOG (mutasiData.ts).
// Read-only outside this file — every entry is appended exclusively from
// addWeightRecord above, never edited or removed.
//
// CB-FIX-001: The log is now persisted to localStorage so it survives browser
// refresh and application restart, matching the USER_WEIGHT_DB persistence
// pattern already in this file.

export type WeightTimelineEvent = {
  id: string;
  livestockId: string;
  livestockName: string | null;
  date: string;
  weight: string;
  unit: string;
  diff: string | null;
  recordedAt: string; // ISO timestamp — when the event was logged
};

const WEIGHT_TIMELINE_STORAGE_KEY = 'ternakhub_weight_timeline';

// Loaded from localStorage once at module init — survives page refreshes.
// Each entry is validated before acceptance; malformed records are discarded
// rather than crashing the init path (same defensive strategy as USER_WEIGHT_DB).
const WEIGHT_TIMELINE_LOG: WeightTimelineEvent[] = (() => {
  try {
    const raw = localStorage.getItem(WEIGHT_TIMELINE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is WeightTimelineEvent =>
        e !== null &&
        typeof e === 'object' &&
        typeof e.id === 'string' &&
        typeof e.livestockId === 'string' &&
        typeof e.recordedAt === 'string',
    );
  } catch {
    return [];
  }
})();

function persistWeightTimelineLog(): void {
  try {
    localStorage.setItem(WEIGHT_TIMELINE_STORAGE_KEY, JSON.stringify(WEIGHT_TIMELINE_LOG));
  } catch {
    // localStorage unavailable (e.g. private browsing quota) — in-memory still works.
  }
}

function addWeightTimelineEvent(event: Omit<WeightTimelineEvent, 'id' | 'recordedAt'>): WeightTimelineEvent {
  const entry: WeightTimelineEvent = { id: generateUUID(), recordedAt: new Date().toISOString(), ...event };
  WEIGHT_TIMELINE_LOG.push(entry);
  persistWeightTimelineLog();
  return entry;
}

/** All weight-recording events for a single animal, newest → oldest. */
export function getWeightTimeline(id: string): WeightTimelineEvent[] {
  return WEIGHT_TIMELINE_LOG
    .filter((e) => e.livestockId === id)
    .slice()
    .sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1));
}

/** Most recent weight-recording events across the whole herd, newest → oldest. */
export function getRecentWeightEvents(limit = 5): WeightTimelineEvent[] {
  return WEIGHT_TIMELINE_LOG
    .slice()
    .sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1))
    .slice(0, limit);
}

// ─── ADG (Average Daily Gain) — shared species thresholds ────────────────────
// Single source of truth for ADG validation, reused by both CatatBobot.tsx
// (soft-validation dialog, CB-005) and aiInsightBobotData.ts (rule-based
// growth analysis) so the two never drift out of sync.

export type AdgThresholds = {
  /** Minimum kg/day — can be negative (e.g. post-partum weight loss is normal) */
  minKgPerDay: number;
  /** Maximum kg/day */
  maxKgPerDay: number;
};

/**
 * Returns ADG thresholds for the given livestock species.
 *
 * Returns null when no threshold is defined for the species (validation is
 * skipped in that case). Covers every species in MASTER_SPECIES so no
 * species silently bypasses validation due to a missing entry.
 */
export function getAdgThresholds(livestockType: string): AdgThresholds | null {
  const parameter = getGrowthParameter(livestockType);
  return parameter
    ? { minKgPerDay: parameter.adgMinKgPerDay, maxKgPerDay: parameter.adgMaxKgPerDay }
    : null;
}

/**
 * Calculates Average Daily Gain in kg/day.
 * Returns null when calculation is not possible (missing/invalid inputs or
 * zero-day interval — same-day or reversed dates).
 */
export function calculateAdg(
  lastWeightStr: string,
  lastDateStr: string | null,
  newWeightStr: string,
  newDateStr: string,
): number | null {
  const lastWeight = parseFloat(lastWeightStr);
  const newWeight  = parseFloat(newWeightStr);
  if (isNaN(lastWeight) || isNaN(newWeight)) return null;
  if (!lastDateStr || !newDateStr) return null;

  const lastMs = Date.parse(lastDateStr);
  const newMs  = Date.parse(newDateStr);
  if (isNaN(lastMs) || isNaN(newMs)) return null;

  const days = (newMs - lastMs) / 86_400_000;
  if (days <= 0) return null; // same day or reversed — cannot compute ADG

  return (newWeight - lastWeight) / days;
}

/** True when the ADG value falls outside the species normal range. */
export function isAdgOutsideNormal(adg: number, thresholds: AdgThresholds): boolean {
  return adg < thresholds.minKgPerDay || adg > thresholds.maxKgPerDay;
}

/**
 * Applies the latest user-recorded weight from localStorage onto each
 * livestock record in LIVESTOCK_DB.
 *
 * Must be called once after the seed runs (in main.tsx boot sequence) so
 * that LIVESTOCK_DB reflects the user's most recent weight, not the seed
 * value that was written before user entries were loaded from localStorage.
 */
export function restoreUserWeightToLivestock(): void {
  for (const [id, entries] of Object.entries(USER_WEIGHT_DB)) {
    if (entries.length === 0) continue;
    const latest = entries[0]; // USER_WEIGHT_DB is always newest-first
    if (LIVESTOCK_DB[id]) {
      LIVESTOCK_DB[id] = { ...LIVESTOCK_DB[id], weight: latest.weight, weightUnit: latest.unit };
    }
  }
}

// ─── Health History ───────────────────────────────────────────────────────────

export type HealthEntry = {
  activity: 'Pemeriksaan' | 'Pengobatan' | 'Vaksinasi' | 'Deworming' | 'Vitamin';
  date: string;
  status: string;
  notes: string | null;
};

// Intentionally empty — populated when users record health events through the app.
const HEALTH_HISTORY_DB: Record<string, HealthEntry[]> = {};

export function getHealthHistory(id: string): HealthEntry[] {
  return HEALTH_HISTORY_DB[id] ?? [];
}

// ─── Reproduction History ─────────────────────────────────────────────────────

export type ReproEntry = {
  activity: 'Perkawinan' | 'Kebuntingan' | 'Melahirkan' | 'Sapih';
  date: string;
  status: string;
  notes: string | null;
};

// Intentionally empty — populated when users record reproduction events through the app.
const REPRO_HISTORY_DB: Record<string, ReproEntry[]> = {};

export function getReproHistory(id: string): ReproEntry[] {
  return REPRO_HISTORY_DB[id] ?? [];
}

// ─── Dev Seed Bridge (Developer Data Factory only) ────────────────────────────
// WEIGHT_HISTORY_DB / HEALTH_HISTORY_DB / REPRO_HISTORY_DB above are module-private,
// so the seed system (src/dev/data-factory) needs a narrow, explicitly-named way to
// populate them. These setters change NO types/shapes (no schema change) and must
// never be called from app pages — pages only ever read via getWeightHistory /
// getHealthHistory / getReproHistory, or write through the app's own recording flows.
export function __seedWeightHistory(id: string, entries: WeightEntry[]): void {
  WEIGHT_HISTORY_DB[id] = entries;
}
export function __seedHealthHistory(id: string, entries: HealthEntry[]): void {
  HEALTH_HISTORY_DB[id] = entries;
}
export function __seedReproHistory(id: string, entries: ReproEntry[]): void {
  REPRO_HISTORY_DB[id] = entries;
}
export function __clearWeightHistory(id: string): void {
  delete WEIGHT_HISTORY_DB[id];
}
export function __clearHealthHistory(id: string): void {
  delete HEALTH_HISTORY_DB[id];
}
export function __clearReproHistory(id: string): void {
  delete REPRO_HISTORY_DB[id];
}

// ─── Ownership Change (write) ──────────────────────────────────────────────────
// MT-004: single write path for changing a livestock's current owner/workspace
// (e.g. as the effect of a Completed Mutation Request). Closes the current
// ownership record and appends a new one — OWNERSHIP_DB history is never
// mutated in place or deleted, only appended to (same invariant as Batch
// membership history).

export type NewOwnershipInput = {
  owner: string;
  workspace: string;
  startDate: string;
  method: OwnershipMethod;
  notes: string | null;
};

/** Closes the current ownership record (if any) and opens a new one. Returns the new record. */
export function addOwnershipRecord(livestockId: string, input: NewOwnershipInput): OwnershipRecord {
  const history = getOwnershipHistory(livestockId);
  const closed = history.map((r) => (r.isCurrent ? { ...r, isCurrent: false, endDate: input.startDate } : r));

  const record: OwnershipRecord = {
    id: `OWN-${livestockId}-${String(closed.length + 1).padStart(2, '0')}`,
    owner: input.owner,
    workspace: input.workspace,
    startDate: input.startDate,
    endDate: null,
    method: input.method,
    notes: input.notes,
    isCurrent: true,
  };

  OWNERSHIP_DB[livestockId] = [...closed, record];
  return record;
}

// ─── Livestock Registration (write) ───────────────────────────────────────────
// The single place LIVESTOCK_DB is populated from a real registration flow.
// AddLivestock.tsx (individual registration) and RP-008 Offspring Registration
// both build a NewLivestockInput using their own ID convention/auto-fill rules
// and call this function — it owns writing LIVESTOCK_DB + the first
// OwnershipRecord so every entry point produces the same record shape.

export type NewLivestockInput = {
  id: string;                 // built by the caller using the app's existing Livestock ID convention
  name: string | null;
  type: string;
  typeIcon: string;
  typeColor: string;
  typeBg: string;
  ras: string;
  kelamin: string;
  birthDate: string;
  birthDateEstimated: boolean;
  age: string;
  ageMonths: number;
  birthWeight: string;
  weight: string;
  weightUnit: string;
  program: string;
  status: string;
  location: string;
  ownerMethod: OwnershipMethod;
  ownerNotes: string | null;
  issuedBy: string;
  registeredDate: string;
};

/** Throws if `id` is already registered — one Livestock ID may only ever be created once. */
export function addLivestock(input: NewLivestockInput): LivestockRecord {
  if (LIVESTOCK_DB[input.id]) {
    throw new Error(`ID Ternak "${input.id}" sudah terdaftar.`);
  }

  const record: LivestockRecord = {
    id: input.id,
    name: input.name,
    type: input.type,
    typeIcon: input.typeIcon,
    typeColor: input.typeColor,
    typeBg: input.typeBg,
    ras: input.ras,
    kelamin: input.kelamin,
    birthDate: input.birthDate,
    birthDateEstimated: input.birthDateEstimated,
    age: input.age,
    ageMonths: input.ageMonths,
    birthWeight: input.birthWeight,
    weight: input.weight,
    weightUnit: input.weightUnit,
    program: input.program,
    status: input.status,
    location: input.location,
    batch: null,
    digitalIdentity: { verified: false, registeredDate: input.registeredDate, issuedBy: input.issuedBy },
  };
  LIVESTOCK_DB[record.id] = record;

  OWNERSHIP_DB[record.id] = [
    {
      id: `OWN-${record.id}-01`,
      owner: input.issuedBy,
      workspace: input.issuedBy,
      startDate: input.registeredDate,
      endDate: null,
      method: input.ownerMethod,
      notes: input.ownerNotes,
      isCurrent: true,
    },
  ];

  return record;
}

// ─── Lineage linking (write) ──────────────────────────────────────────────────
// PEDIGREE_DB has been read-only in every module built so far (no flow has ever
// populated it — see getPedigree's EMPTY_PEDIGREE fallback above). This is the
// first writer: it links a Livestock to its known Dam/Sire and back-fills the
// offspring list on each parent's own pedigree entry, reusing the exact
// PedigreeRecord/PedigreeRelative shape already defined above — no new lineage
// structure is introduced.

function relativeFor(id: string | null, role: string): PedigreeRelative {
  if (!id) return { role, id: null, name: 'Tidak Diketahui', icon: '❓', typeBg: '#f5f5f5', status: null };
  const lv = getLivestock(id);
  return { role, id, name: lv.name, icon: lv.typeIcon, typeBg: lv.typeBg, status: 'Aktif' };
}

/** Links `childId` to its Dam/Sire (either may be null when unknown, e.g. IB with no physical sire). */
export function addPedigreeLink(childId: string, damId: string | null, sireId: string | null): void {
  // Guard: an animal cannot be its own parent
  if (damId !== null && damId === childId) {
    throw new Error(`[LINEAGE ERROR] Ternak "${childId}" tidak dapat menjadi induk (dam) dirinya sendiri.`);
  }
  if (sireId !== null && sireId === childId) {
    throw new Error(`[LINEAGE ERROR] Ternak "${childId}" tidak dapat menjadi pejantan (sire) dirinya sendiri.`);
  }

  const childPedigree = getPedigree(childId);
  PEDIGREE_DB[childId] = {
    ...childPedigree,
    parents: [relativeFor(sireId, 'Ayah'), relativeFor(damId, 'Ibu')],
  };

  const child = getLivestock(childId);
  const childRelative: PedigreeRelative = {
    role: 'Anak', id: childId, name: child.name, icon: child.typeIcon, typeBg: child.typeBg, status: 'Aktif',
  };

  for (const parentId of [damId, sireId]) {
    if (!parentId) continue;
    const parentPedigree = getPedigree(parentId);
    if (parentPedigree.offspring.some((o) => o.id === childId)) continue;
    PEDIGREE_DB[parentId] = {
      ...parentPedigree,
      offspring: [...parentPedigree.offspring, childRelative],
    };
  }
}

export function getSiblings(id: string): PedigreeRelative[] {
  const pedigree = getPedigree(id);
  const siblingIds = new Set<string>();
  const siblings: PedigreeRelative[] = [];
  for (const parent of pedigree.parents) {
    if (!parent.id) continue;
    const parentPedigree = PEDIGREE_DB[parent.id];
    if (!parentPedigree) continue;
    for (const offspring of parentPedigree.offspring) {
      if (offspring.id && offspring.id !== id && !siblingIds.has(offspring.id)) {
        siblingIds.add(offspring.id);
        siblings.push(offspring);
      }
    }
  }
  return siblings;
}
