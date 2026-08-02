/**
 * livestockEditData.ts — Edit history & extended metadata for livestock
 *
 * Architecture:
 *  - LivestockRecord (in livestockData.ts) is NOT modified. All new optional
 *    fields live in EXTENDED_METADATA_DB here as a separate metadata store.
 *  - Core fields (name, ras, kelamin, etc.) are patched directly onto LIVESTOCK_DB
 *    via the single write function updateLivestock().
 *  - Every save produces an immutable LivestockEditRecord appended to EDIT_HISTORY_DB.
 *    Records are never removed or edited.
 *  - Both stores are persisted to localStorage with try/catch quota guards.
 */

import { generateUUID } from '../utils/uuid';
import { LIVESTOCK_DB } from './livestockData';
import { MASTER_SPECIES } from './speciesData';

// ── Species visual lookup (matches factory master; avoids dev-only import) ─────

const SPECIES_VISUALS: Record<string, { color: string; bg: string }> = {
  Domba:   { color: '#1b7a43', bg: '#e8f5ee' },
  Kambing: { color: '#b5651d', bg: '#fbeee0' },
  Sapi:    { color: '#7a1b3a', bg: '#f5e8ee' },
  Kerbau:  { color: '#3a3a3a', bg: '#eceff1' },
  Kuda:    { color: '#8a5a2b', bg: '#f6ede1' },
  Babi:    { color: '#c2185b', bg: '#fde4ec' },
};
const FALLBACK_VISUAL = { color: '#546e7a', bg: '#eceff1' };

export function getSpeciesVisualForEdit(species: string) {
  return SPECIES_VISUALS[species] ?? FALLBACK_VISUAL;
}

// ── Extended metadata ─────────────────────────────────────────────────────────
// Fields that don't exist on LivestockRecord but are editable on the Edit page.

export type LivestockExtendedMetadata = {
  earTag:        string | null;
  internalCode:  string | null;
  notes:         string | null;
  breedCategory: string | null;   // Fullblood, Purebred, Cross, F1, F2, F3, F4
  crossBreed:    string | null;   // Silangan dengan ras apa (when breedCategory === 'Cross')
  color:         string | null;
  horn:          string | null;
  tail:          string | null;
  specialMarks:  string | null;
  purchaseDate:  string | null;
  purchasePrice: string | null;
  supplier:      string | null;
  originFarm:    string | null;   // Asal Daerah / Peternakan (biological origin)
  siblingCount:  string | null;   // Jumlah Saudara Lahir (litter size)
};

const EMPTY_EXTENDED: LivestockExtendedMetadata = {
  earTag: null, internalCode: null, notes: null, breedCategory: null,
  crossBreed: null, color: null, horn: null, tail: null, specialMarks: null,
  purchaseDate: null, purchasePrice: null, supplier: null,
  originFarm: null, siblingCount: null,
};

// ── Edit history ──────────────────────────────────────────────────────────────

/** One field's before/after pair within a single edit event. */
export type EditChangeItem = {
  /** Human-readable Indonesian label, e.g. "Nama", "Tanggal Lahir". */
  field:  string;
  before: string | null;
  after:  string | null;
};

/** Immutable record of one save action. Never deleted or mutated. */
export type LivestockEditRecord = {
  id:          string;   // UUID v4
  livestockId: string;
  editedAt:    string;   // ISO 8601
  editedBy:    string;
  reason:      string | null;
  /** Empty when the user clicked Save with no actual field changes. */
  changes:     EditChangeItem[];
};

// ── Persistence ───────────────────────────────────────────────────────────────

const EXTENDED_KEY = 'ternakhub_livestock_extended';
const HISTORY_KEY  = 'ternakhub_livestock_edit_history';

function safeLoad<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return fallback;
    return parsed as T;
  } catch { return fallback; }
}

function safeSave(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// Extended metadata — keyed by livestock ID
// Exported so useLivestock can hydrate it from Supabase on workspace load.
export const EXTENDED_DB: Record<string, LivestockExtendedMetadata> =
  safeLoad(EXTENDED_KEY, {});

// Edit history — keyed by livestock ID, each value is an append-only array
const EDIT_HISTORY_DB: Record<string, LivestockEditRecord[]> =
  safeLoad(HISTORY_KEY, {});

// ── Read helpers ──────────────────────────────────────────────────────────────

export function getExtendedMetadata(id: string): LivestockExtendedMetadata {
  return { ...EMPTY_EXTENDED, ...(EXTENDED_DB[id] ?? {}) };
}

/** Edit history for one livestock, newest first. Never empty (returns []). */
export function getEditHistory(id: string): LivestockEditRecord[] {
  return (EDIT_HISTORY_DB[id] ?? [])
    .slice()
    .sort((a, b) => b.editedAt.localeCompare(a.editedAt));
}

/** Total number of edit records across all fields. */
export function getEditCount(id: string): number {
  return (EDIT_HISTORY_DB[id] ?? []).length;
}

// ── Age computation ───────────────────────────────────────────────────────────

/** Derive `age` (Indonesian label) and `ageMonths` from an ISO date string. */
export function computeAge(birthDateStr: string): { age: string; ageMonths: number } {
  if (!birthDateStr || birthDateStr === '—') return { age: '—', ageMonths: 0 };
  try {
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) return { age: '—', ageMonths: 0 };
    const now   = new Date();
    const totalMonths =
      (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (totalMonths < 0) return { age: '< 1 Bulan', ageMonths: 0 };
    const years     = Math.floor(totalMonths / 12);
    const remMonths = totalMonths % 12;
    const age = years > 0
      ? `${years} Tahun${remMonths > 0 ? ' ' + remMonths + ' Bulan' : ''}`
      : `${totalMonths} Bulan`;
    return { age, ageMonths: totalMonths };
  } catch { return { age: '—', ageMonths: 0 }; }
}

// ── Field labels (for human-readable diff) ────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  name: 'Nama', type: 'Jenis Ternak', ras: 'Ras', kelamin: 'Jenis Kelamin',
  birthDate: 'Tanggal Lahir', birthDateEstimated: 'Perkiraan Tanggal Lahir',
  birthWeight: 'Berat Lahir', program: 'Program', status: 'Status Kesehatan',
  location: 'Lokasi Kandang',
  earTag: 'Tag Telinga', internalCode: 'Kode Internal', notes: 'Catatan',
  breedCategory: 'Kategori Ras', crossBreed: 'Silangan Dengan',
  color: 'Warna Tubuh', horn: 'Tanduk', tail: 'Ekor',
  specialMarks: 'Tanda Khusus', purchaseDate: 'Tanggal Beli',
  purchasePrice: 'Harga Beli', supplier: 'Pemasok / Penjual',
  originFarm: 'Asal Daerah / Peternakan', siblingCount: 'Jumlah Saudara Lahir',
};

// ── Update types ──────────────────────────────────────────────────────────────

export type CoreLivestockUpdate = {
  name?:                string | null;
  type?:                string;
  ras?:                 string;
  kelamin?:             string;
  birthDate?:           string;
  birthDateEstimated?:  boolean;
  birthWeight?:         string;
  program?:             string;
  status?:              string;
  location?:            string;
};

export type ExtendedUpdate = Partial<LivestockExtendedMetadata>;

// ── Main write function ───────────────────────────────────────────────────────

/**
 * Apply an edit to a livestock animal.
 *
 * - Patches LIVESTOCK_DB[id] for core fields.
 * - Patches EXTENDED_DB[id] for extended metadata.
 * - Appends an immutable LivestockEditRecord to EDIT_HISTORY_DB[id].
 * - Persists both stores to localStorage.
 *
 * Throws if `id` is not in LIVESTOCK_DB.
 * Returns the new edit record even if there are no changes (empty changes[]).
 */
export function updateLivestock(
  id:        string,
  core:      CoreLivestockUpdate,
  extended:  ExtendedUpdate,
  editedBy:  string,
  reason:    string | null,
): LivestockEditRecord {
  const lv = LIVESTOCK_DB[id];
  if (!lv) throw new Error(`Ternak "${id}" tidak ditemukan dalam database.`);

  const prevExtended = getExtendedMetadata(id);
  const changes: EditChangeItem[] = [];

  // ── Species change: cascade typeIcon / typeColor / typeBg ──────────────────
  let typeOverride: { typeIcon: string; typeColor: string; typeBg: string } | undefined;
  if ('type' in core && core.type && core.type !== lv.type) {
    const sp  = MASTER_SPECIES.find((s) => s.value === core.type);
    const vis = SPECIES_VISUALS[core.type!] ?? FALLBACK_VISUAL;
    typeOverride = {
      typeIcon:  sp?.icon   ?? lv.typeIcon,
      typeColor: vis.color,
      typeBg:    vis.bg,
    };
    changes.push({ field: FIELD_LABELS['type'], before: lv.type, after: core.type! });
  }

  // ── Birth date: recompute age/ageMonths ────────────────────────────────────
  let ageOverride: { age: string; ageMonths: number } | undefined;
  if ('birthDate' in core && core.birthDate !== undefined && core.birthDate !== lv.birthDate) {
    ageOverride = computeAge(core.birthDate ?? '—');
    changes.push({
      field: FIELD_LABELS['birthDate'],
      before: lv.birthDate,
      after: core.birthDate ?? null,
    });
  }

  // ── Other core scalars ─────────────────────────────────────────────────────
  const coreScalars = [
    'name', 'ras', 'kelamin', 'birthDateEstimated',
    'birthWeight', 'program', 'status', 'location',
  ] as const;

  for (const k of coreScalars) {
    if (k in core) {
      const before = String(lv[k as keyof typeof lv] ?? '');
      const after  = String((core as Record<string, unknown>)[k] ?? '');
      if (before !== after) {
        changes.push({
          field:  FIELD_LABELS[k] ?? k,
          before: before || null,
          after:  after  || null,
        });
      }
    }
  }

  // ── Extended field diff ────────────────────────────────────────────────────
  for (const [k, after] of Object.entries(extended) as Array<[keyof LivestockExtendedMetadata, string | null | undefined]>) {
    const before = prevExtended[k] ?? null;
    const afterV = after ?? null;
    if (before !== afterV) {
      changes.push({
        field:  FIELD_LABELS[k] ?? k,
        before: before,
        after:  afterV,
      });
    }
  }

  // ── Build the edit record ──────────────────────────────────────────────────
  const record: LivestockEditRecord = {
    id:          generateUUID(),
    livestockId: id,
    editedAt:    new Date().toISOString(),
    editedBy:    editedBy.trim() || 'Pemilik',
    reason:      reason?.trim() || null,
    changes,
  };

  // Only write to DBs when there are real changes
  if (changes.length > 0) {
    // Apply core patch
    const corePatch: Partial<typeof lv> = {};
    if ('name' in core)               corePatch.name               = core.name ?? null;
    if ('type' in core)               corePatch.type               = core.type!;
    if (typeOverride)                 Object.assign(corePatch, typeOverride);
    if ('ras' in core)                corePatch.ras                = core.ras!;
    if ('kelamin' in core)            corePatch.kelamin            = core.kelamin!;
    if ('birthDate' in core)          corePatch.birthDate          = core.birthDate ?? '—';
    if ('birthDateEstimated' in core) corePatch.birthDateEstimated = core.birthDateEstimated!;
    if ('birthWeight' in core)        corePatch.birthWeight        = core.birthWeight ?? '—';
    if (ageOverride)                  Object.assign(corePatch, ageOverride);
    if ('program' in core)            corePatch.program            = core.program!;
    if ('status' in core)             corePatch.status             = core.status!;
    if ('location' in core)           corePatch.location           = core.location ?? '—';

    LIVESTOCK_DB[id] = { ...lv, ...corePatch };

    // Apply extended patch
    EXTENDED_DB[id] = { ...prevExtended, ...extended };
    safeSave(EXTENDED_KEY, EXTENDED_DB);
  }

  // Always append edit record (so you can see "no-op" saves in the log too)
  if (!EDIT_HISTORY_DB[id]) EDIT_HISTORY_DB[id] = [];
  EDIT_HISTORY_DB[id].push(record);
  safeSave(HISTORY_KEY, EDIT_HISTORY_DB);

  return record;
}

// ── DEV helpers ───────────────────────────────────────────────────────────────

export function __clearEditData(id?: string): void {
  if (id) {
    delete EXTENDED_DB[id];
    delete EDIT_HISTORY_DB[id];
  } else {
    for (const k of Object.keys(EXTENDED_DB))     delete EXTENDED_DB[k];
    for (const k of Object.keys(EDIT_HISTORY_DB)) delete EDIT_HISTORY_DB[k];
  }
  safeSave(EXTENDED_KEY, EXTENDED_DB);
  safeSave(HISTORY_KEY, EDIT_HISTORY_DB);
}
