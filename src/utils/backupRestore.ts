// ─── Backup & Restore Utility ─────────────────────────────────────────────────
// Collects all local in-memory data into a JSON snapshot and triggers a browser
// download — same blob+anchor pattern as masterObatImportExport.ts (BUG-001).
// Restore reads a .json file produced by this module and applies it to the live
// in-memory stores. No backend, no cloud, no Supabase Storage.

import { LIVESTOCK_DB, PEDIGREE_DB, OWNERSHIP_DB, type LivestockRecord, type PedigreeRecord, type OwnershipRecord } from '../data/livestockData';
import { getInventarisList } from '../data/stokInventarisData';
import { getFormulaList, replaceFormulaList, type FormulaRecord } from '../data/formulaData';
import { getMasterPakanList } from '../data/masterPakanData';
import { getProdukKomersialList } from '../data/produkKomersialData';
// DB-001B-3: workspaceManagementData removed — workspace data lives in Supabase.

// ─── Snapshot schema ──────────────────────────────────────────────────────────

export const BACKUP_SCHEMA = 'ternakhub-backup' as const;
export const BACKUP_VERSION = 1 as const;

export interface BackupSnapshot {
  schema: typeof BACKUP_SCHEMA;
  version: typeof BACKUP_VERSION;
  createdAt: string;
  label: string;
  modules: string[];
  data: {
    livestock: Record<string, LivestockRecord>;
    pedigree: Record<string, PedigreeRecord>;
    ownership: Record<string, OwnershipRecord[]>;
    stokPakan: ReturnType<typeof getInventarisList>;
    formulaPakan: FormulaRecord[];
    masterPakan: ReturnType<typeof getMasterPakanList>;
    produkKomersial: ReturnType<typeof getProdukKomersialList>;
    // workspaces: removed in DB-001B-3 — workspace data lives in Supabase.
  };
}

// ─── Session history (in-memory for current session) ─────────────────────────

export interface BackupSessionRecord {
  id: string;
  type: 'Manual' | 'Full System' | 'Export';
  status: 'Berhasil' | 'Gagal';
  filename: string;
  modules: string[];
  sizeLabel: string;
  createdAt: string;
}

export interface RestoreSessionRecord {
  id: string;
  sourceFile: string;
  status: 'Berhasil' | 'Gagal';
  restoredAt: string;
  summary: string;
  errorMessage?: string;
}

export const BACKUP_SESSION: BackupSessionRecord[] = [];
export const RESTORE_SESSION: RestoreSessionRecord[] = [];

let backupCounter = 1;
let restoreCounter = 1;

// ─── Core download helper (mirrors masterObatImportExport.ts) ─────────────────

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sizeLabel(json: string): string {
  const kb = Math.round(json.length / 1024);
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function dateSlug(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowISO(): string {
  return new Date().toISOString();
}

// ─── Snapshot builder ─────────────────────────────────────────────────────────

export function buildBackupSnapshot(label: string): BackupSnapshot {
  return {
    schema: BACKUP_SCHEMA,
    version: BACKUP_VERSION,
    createdAt: nowISO(),
    label,
    modules: ['Livestock', 'Stok Pakan', 'Formula Pakan', 'Master Pakan', 'Produk Komersial'],
    data: {
      livestock:      JSON.parse(JSON.stringify(LIVESTOCK_DB)),
      pedigree:       JSON.parse(JSON.stringify(PEDIGREE_DB)),
      ownership:      JSON.parse(JSON.stringify(OWNERSHIP_DB)),
      stokPakan:      JSON.parse(JSON.stringify(getInventarisList())),
      formulaPakan:   JSON.parse(JSON.stringify(getFormulaList())),
      masterPakan:    JSON.parse(JSON.stringify(getMasterPakanList())),
      produkKomersial: JSON.parse(JSON.stringify(getProdukKomersialList())),
      // workspaces: removed in DB-001B-3 — workspace data lives in Supabase.
    },
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface BackupValidationResult {
  valid: boolean;
  errors: string[];
  snapshot?: BackupSnapshot;
}

export function validateBackupFile(raw: unknown): BackupValidationResult {
  const errors: string[] = [];

  if (typeof raw !== 'object' || raw === null) {
    return { valid: false, errors: ['File tidak valid: bukan objek JSON.'] };
  }
  const obj = raw as Record<string, unknown>;

  if (obj.schema !== BACKUP_SCHEMA) {
    errors.push(`File tidak valid: schema tidak dikenali ("${String(obj.schema ?? '')}"). Hanya file backup TernakHub yang didukung.`);
  }
  if (typeof obj.version !== 'number') {
    errors.push('File tidak valid: field "version" tidak ditemukan.');
  }
  if (typeof obj.data !== 'object' || obj.data === null) {
    return { valid: false, errors: [...errors, 'File tidak valid: field "data" tidak ditemukan.'] };
  }

  const data = obj.data as Record<string, unknown>;
  if (typeof data.livestock !== 'object' || data.livestock === null) errors.push('Struktur rusak: "livestock" tidak valid.');
  if (typeof data.pedigree !== 'object' || data.pedigree === null)   errors.push('Struktur rusak: "pedigree" tidak valid.');
  if (!Array.isArray(data.formulaPakan))   errors.push('Struktur rusak: "formulaPakan" harus berupa daftar.');
  if (!Array.isArray(data.stokPakan))      errors.push('Struktur rusak: "stokPakan" harus berupa daftar.');

  if (errors.length > 0) return { valid: false, errors };

  return { valid: true, errors: [], snapshot: obj as unknown as BackupSnapshot };
}

export function parseBackupFile(text: string): BackupValidationResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { valid: false, errors: ['File tidak valid: bukan format JSON yang benar.'] };
  }
  return validateBackupFile(raw);
}

// ─── Apply (restore) ──────────────────────────────────────────────────────────

export interface ApplyResult {
  livestock: number;
  pedigree: number;
  ownership: number;
  formulaPakan: number;
}

export function applyBackupSnapshot(snapshot: BackupSnapshot): ApplyResult {
  // Livestock
  for (const k of Object.keys(LIVESTOCK_DB)) delete LIVESTOCK_DB[k];
  Object.assign(LIVESTOCK_DB, snapshot.data.livestock);

  // Pedigree
  for (const k of Object.keys(PEDIGREE_DB)) delete PEDIGREE_DB[k];
  Object.assign(PEDIGREE_DB, snapshot.data.pedigree);

  // Ownership
  for (const k of Object.keys(OWNERSHIP_DB)) delete OWNERSHIP_DB[k];
  Object.assign(OWNERSHIP_DB, snapshot.data.ownership);

  // Formula Pakan (via exposed replace helper)
  replaceFormulaList(snapshot.data.formulaPakan);

  return {
    livestock: Object.keys(snapshot.data.livestock).length,
    pedigree: Object.keys(snapshot.data.pedigree).length,
    ownership: Object.keys(snapshot.data.ownership).length,
    formulaPakan: snapshot.data.formulaPakan.length,
  };
}

// ─── Public actions ───────────────────────────────────────────────────────────

/** Builds and downloads a backup JSON. Records the result in session history. */
export function downloadBackup(type: BackupSessionRecord['type']): BackupSessionRecord {
  const label = type === 'Full System' ? 'Full System Backup' : `${type} Backup`;
  const snapshot = buildBackupSnapshot(label);
  const json = JSON.stringify(snapshot, null, 2);
  const filename = `ternakhub-backup-${dateSlug()}-${type.toLowerCase().replace(/ /g, '-')}.json`;
  downloadFile(json, filename, 'application/json');

  const record: BackupSessionRecord = {
    id: `BKP-SESSION-${String(backupCounter++).padStart(3, '0')}`,
    type,
    status: 'Berhasil',
    filename,
    modules: snapshot.modules,
    sizeLabel: sizeLabel(json),
    createdAt: snapshot.createdAt,
  };
  BACKUP_SESSION.unshift(record);
  return record;
}

/** Reads a File from a restore input, validates, applies, and records history. */
export async function restoreFromFile(file: File): Promise<RestoreSessionRecord> {
  const text = await file.text();
  const validation = parseBackupFile(text);
  const restoredAt = nowISO();

  if (!validation.valid || !validation.snapshot) {
    const record: RestoreSessionRecord = {
      id: `RST-SESSION-${String(restoreCounter++).padStart(3, '0')}`,
      sourceFile: file.name,
      status: 'Gagal',
      restoredAt,
      summary: 'Validasi file gagal.',
      errorMessage: validation.errors.join(' | '),
    };
    RESTORE_SESSION.unshift(record);
    return record;
  }

  const applied = applyBackupSnapshot(validation.snapshot);
  const summary = [
    `${applied.livestock} livestock`,
    `${applied.pedigree} pedigree`,
    `${applied.formulaPakan} formula pakan`,
  ].join(', ') + ' dipulihkan.';

  const record: RestoreSessionRecord = {
    id: `RST-SESSION-${String(restoreCounter++).padStart(3, '0')}`,
    sourceFile: file.name,
    status: 'Berhasil',
    restoredAt,
    summary,
  };
  RESTORE_SESSION.unshift(record);
  return record;
}
