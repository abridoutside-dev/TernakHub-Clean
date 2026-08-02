// ─── Master Obat — Import & Export (SO-005) ──────────────────────────────────
// Full backup/restore of the Master Obat reference database: Kategori → Sub
// Kategori → Detail Obat, including every internal UUID. JSON only. Scoped
// strictly to Master Obat — does not touch Master Pakan or any other module.

import { KATEGORI_OBAT, isDuplicateKategoriNama, type KategoriObat } from '../data/masterObatKategoriData';
import { SUB_KATEGORI_OBAT, isDuplicateSubKategoriNama, type SubKategoriObat } from '../data/masterObatSubKategoriData';
import { DETAIL_OBAT, isDuplicateDetailObatNama, type DetailObat } from '../data/masterObatDetailData';
import { logMasterObatEvent } from './masterObatAuditLog';

const VALID_STATUS = new Set(['Aktif', 'Nonaktif']);

export const MASTER_OBAT_EXPORT_VERSION = 1;

export interface MasterObatExportPayload {
  schema: 'master-obat-export';
  version: number;
  exportedAt: string;
  data: {
    kategori: KategoriObat[];
    subKategori: SubKategoriObat[];
    detailObat: DetailObat[];
  };
}

export type ImportMode = 'merge' | 'replace';

export interface ImportStats {
  kategori: { added: number; skipped: number };
  subKategori: { added: number; skipped: number };
  detailObat: { added: number; skipped: number };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v);
}

// ─── Export ───────────────────────────────────────────────────────────────────

/** Builds the full export payload — deep-cloned so later mutations to the live registries never affect an already-downloaded file. */
export function buildMasterObatExportPayload(): MasterObatExportPayload {
  return {
    schema: 'master-obat-export',
    version: MASTER_OBAT_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      kategori: JSON.parse(JSON.stringify(KATEGORI_OBAT)),
      subKategori: JSON.parse(JSON.stringify(SUB_KATEGORI_OBAT)),
      detailObat: JSON.parse(JSON.stringify(DETAIL_OBAT)),
    },
  };
}

/** Triggers a browser download of the current Master Obat database as a JSON file. */
export function downloadMasterObatExport(): string {
  const payload = buildMasterObatExportPayload();
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const filename = `master-obat-export-${new Date().toISOString().slice(0, 10)}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return filename;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  payload?: MasterObatExportPayload;
}

/**
 * Validates raw parsed JSON before any import mutation happens:
 * - overall structure (schema/version/data/arrays)
 * - every record has a valid UUID
 * - no duplicate UUIDs within the file (across all three levels combined)
 * - hierarchy is valid: every Sub Kategori's kategoriSlug resolves to a Kategori
 *   in the file, every Detail Obat's subKategoriUuid resolves to a Sub Kategori
 *   in the file (no broken references)
 */
export function validateMasterObatImport(raw: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof raw !== 'object' || raw === null) {
    return { valid: false, errors: ['File tidak valid: bukan objek JSON.'] };
  }
  const obj = raw as Record<string, unknown>;

  if (obj.schema !== 'master-obat-export') {
    errors.push('File tidak valid: schema tidak dikenali (bukan file export Master Obat).');
  }
  if (typeof obj.version !== 'number') {
    errors.push('File tidak valid: versi export tidak ditemukan.');
  }
  if (typeof obj.data !== 'object' || obj.data === null) {
    return { valid: false, errors: [...errors, 'File tidak valid: struktur data tidak ditemukan.'] };
  }

  const data = obj.data as Record<string, unknown>;
  const kategoriRaw = data.kategori;
  const subKategoriRaw = data.subKategori;
  const detailObatRaw = data.detailObat;

  if (!Array.isArray(kategoriRaw)) errors.push('Struktur rusak: "kategori" harus berupa daftar.');
  if (!Array.isArray(subKategoriRaw)) errors.push('Struktur rusak: "subKategori" harus berupa daftar.');
  if (!Array.isArray(detailObatRaw)) errors.push('Struktur rusak: "detailObat" harus berupa daftar.');

  if (errors.length > 0) return { valid: false, errors };

  const kategori = kategoriRaw as KategoriObat[];
  const subKategori = subKategoriRaw as SubKategoriObat[];
  const detailObat = detailObatRaw as DetailObat[];

  const seenUuids = new Set<string>();
  const dupUuids = new Set<string>();

  // ── Kategori ──
  const kategoriSlugs = new Set<string>();
  const kategoriUuidBySlug = new Map<string, string>(); // slug -> uuid, for cross-checking Sub Kategori's kategoriUuid
  const kategoriNamaByOwner = new Map<string, string>(); // normalized nama -> owning uuid, for within-file uniqueness
  kategori.forEach((k, i) => {
    if (!k || typeof k !== 'object') { errors.push(`Kategori index ${i}: struktur rusak.`); return; }
    if (!isValidUuid(k.uuid)) { errors.push(`Kategori index ${i}: UUID tidak valid.`); return; }
    if (seenUuids.has(k.uuid)) dupUuids.add(k.uuid); else seenUuids.add(k.uuid);
    if (typeof k.slug !== 'string' || !k.slug) { errors.push(`Kategori "${k.nama ?? k.uuid}": slug tidak valid.`); return; }
    if (typeof k.nama !== 'string' || !k.nama.trim()) { errors.push(`Kategori ${k.uuid}: nama wajib diisi.`); return; }
    const normNama = k.nama.trim().toLowerCase();
    const owner = kategoriNamaByOwner.get(normNama);
    if (owner && owner !== k.uuid) {
      errors.push(`Kategori "${k.nama.trim()}": nama sudah digunakan oleh kategori lain dalam file ini.`);
    } else {
      kategoriNamaByOwner.set(normNama, k.uuid);
    }
    kategoriSlugs.add(k.slug);
    kategoriUuidBySlug.set(k.slug, k.uuid);
  });

  // ── Sub Kategori ──
  const subKategoriUuids = new Set<string>();
  const subKategoriNamaByOwner = new Map<string, string>(); // "kategoriSlug::normalizedNama" -> owning uuid
  subKategori.forEach((s, i) => {
    if (!s || typeof s !== 'object') { errors.push(`Sub Kategori index ${i}: struktur rusak.`); return; }
    if (!isValidUuid(s.uuid)) { errors.push(`Sub Kategori index ${i}: UUID tidak valid.`); return; }
    if (seenUuids.has(s.uuid)) dupUuids.add(s.uuid); else seenUuids.add(s.uuid);
    if (typeof s.nama !== 'string' || !s.nama.trim()) { errors.push(`Sub Kategori ${s.uuid}: nama wajib diisi.`); return; }
    if (typeof s.kategoriSlug !== 'string' || !kategoriSlugs.has(s.kategoriSlug)) {
      errors.push(`Sub Kategori "${s.nama ?? s.uuid}": parent kategori "${String(s.kategoriSlug)}" tidak ditemukan (referensi rusak).`);
    } else if (s.kategoriUuid !== undefined && !isValidUuid(s.kategoriUuid)) {
      errors.push(`Sub Kategori "${s.nama ?? s.uuid}": kategoriUuid tidak valid.`);
    } else if (s.kategoriUuid !== undefined && s.kategoriUuid !== kategoriUuidBySlug.get(s.kategoriSlug)) {
      // kategoriUuid is optional on import for backward compatibility with
      // files exported before SO-008 (which added the canonical UUID FK),
      // but when present it MUST agree with kategoriSlug within the same
      // file — a mismatch means the file itself is internally inconsistent,
      // which applyMasterObatImport would otherwise silently paper over by
      // always trusting kategoriSlug as the rewrite source.
      errors.push(`Sub Kategori "${s.nama ?? s.uuid}": kategoriUuid tidak sesuai dengan kategoriSlug "${s.kategoriSlug}" (referensi tidak konsisten).`);
    } else {
      const key = `${s.kategoriSlug}::${s.nama.trim().toLowerCase()}`;
      const owner = subKategoriNamaByOwner.get(key);
      if (owner && owner !== s.uuid) {
        errors.push(`Sub Kategori "${s.nama.trim()}": nama sudah digunakan pada kategori yang sama dalam file ini.`);
      } else {
        subKategoriNamaByOwner.set(key, s.uuid);
      }
    }
    subKategoriUuids.add(s.uuid);
  });

  // ── Detail Obat ──
  const detailObatNamaByOwner = new Map<string, string>(); // "subKategoriUuid::normalizedNama" -> owning uuid
  detailObat.forEach((d, i) => {
    if (!d || typeof d !== 'object') { errors.push(`Detail Obat index ${i}: struktur rusak.`); return; }
    if (!isValidUuid(d.uuid)) { errors.push(`Detail Obat index ${i}: UUID tidak valid.`); return; }
    if (seenUuids.has(d.uuid)) dupUuids.add(d.uuid); else seenUuids.add(d.uuid);
    if (typeof d.nama !== 'string' || !d.nama.trim()) { errors.push(`Detail Obat ${d.uuid}: nama wajib diisi.`); return; }
    if (!VALID_STATUS.has(d.status as string)) {
      errors.push(`Detail Obat "${d.nama.trim()}": status tidak valid.`);
    }
    if (typeof d.subKategoriUuid !== 'string' || !subKategoriUuids.has(d.subKategoriUuid)) {
      errors.push(`Detail Obat "${d.nama ?? d.uuid}": parent sub kategori tidak ditemukan (referensi rusak).`);
    } else {
      const key = `${d.subKategoriUuid}::${d.nama.trim().toLowerCase()}`;
      const owner = detailObatNamaByOwner.get(key);
      if (owner && owner !== d.uuid) {
        errors.push(`Detail Obat "${d.nama.trim()}": nama sudah digunakan pada sub kategori yang sama dalam file ini.`);
      } else {
        detailObatNamaByOwner.set(key, d.uuid);
      }
    }
  });

  if (dupUuids.size > 0) {
    errors.push(`UUID duplikat ditemukan dalam file: ${Array.from(dupUuids).join(', ')}`);
  }

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    errors: [],
    payload: {
      schema: 'master-obat-export',
      version: typeof obj.version === 'number' ? obj.version : MASTER_OBAT_EXPORT_VERSION,
      exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
      data: { kategori, subKategori, detailObat },
    },
  };
}

// ─── Import (apply) ───────────────────────────────────────────────────────────

/**
 * Applies an already-validated payload to the live in-memory registries.
 * - 'merge': adds records whose UUID doesn't already exist; existing records
 *   (and their UUIDs) are never touched or removed.
 * - 'replace': clears all three registries and replaces them entirely with the
 *   imported records (UUIDs preserved as-is, never regenerated).
 */
export function applyMasterObatImport(payload: MasterObatExportPayload, mode: ImportMode): ImportStats {
  const stats: ImportStats = {
    kategori: { added: 0, skipped: 0 },
    subKategori: { added: 0, skipped: 0 },
    detailObat: { added: 0, skipped: 0 },
  };

  if (mode === 'replace') {
    // kategoriUuid is always canonicalized from the file's own kategoriSlug
    // -> uuid mapping — never trusted as-is, even when present — so a
    // slug/uuid mismatch can never survive into the live store. This also
    // backfills kategoriUuid for pre-SO-008 export files that don't carry it
    // at all. (validateMasterObatImport already rejects files where a
    // present kategoriUuid disagrees with kategoriSlug, so this is a no-op
    // for any file that passed validation — but replace never depends on
    // that invariant holding, by design.)
    const replaceSlugToUuid = new Map(payload.data.kategori.map(k => [k.slug, k.uuid]));
    const backfilledSubKategori = payload.data.subKategori.map(s => ({
      ...s,
      kategoriUuid: replaceSlugToUuid.get(s.kategoriSlug) ?? '',
    }));

    KATEGORI_OBAT.splice(0, KATEGORI_OBAT.length, ...JSON.parse(JSON.stringify(payload.data.kategori)));
    SUB_KATEGORI_OBAT.splice(0, SUB_KATEGORI_OBAT.length, ...JSON.parse(JSON.stringify(backfilledSubKategori)));
    DETAIL_OBAT.splice(0, DETAIL_OBAT.length, ...JSON.parse(JSON.stringify(payload.data.detailObat)));
    stats.kategori.added = payload.data.kategori.length;
    stats.subKategori.added = payload.data.subKategori.length;
    stats.detailObat.added = payload.data.detailObat.length;
    logMasterObatEvent('import', 'kategori', 'replace', JSON.stringify(stats));
    return stats;
  }

  // merge
  // Sub Kategori link to their parent Kategori by *slug*, not uuid. If a
  // Kategori's uuid already exists in the live store (so its insert is
  // skipped) but under a different slug than the file used, a naively-copied
  // Sub Kategori would end up pointing at a slug that doesn't exist in the
  // live store — an orphan. To prevent that, resolve each Sub Kategori's
  // parent by uuid (via the file's own Kategori list) and rewrite its
  // kategoriSlug to whatever slug that uuid actually has in the live store.
  const fileSlugToKategoriUuid = new Map(payload.data.kategori.map(k => [k.slug, k.uuid]));

  const existingKategoriUuids = new Set(KATEGORI_OBAT.map(k => k.uuid));
  for (const k of payload.data.kategori) {
    if (existingKategoriUuids.has(k.uuid)) { stats.kategori.skipped += 1; continue; }
    if (isDuplicateKategoriNama(k.nama)) { stats.kategori.skipped += 1; continue; } // name uniqueness invariant — never create a live collision
    KATEGORI_OBAT.push(JSON.parse(JSON.stringify(k)));
    existingKategoriUuids.add(k.uuid);
    stats.kategori.added += 1;
  }

  const kategoriUuidToLiveSlug = new Map(KATEGORI_OBAT.map(k => [k.uuid, k.slug]));

  const existingSubKategoriUuids = new Set(SUB_KATEGORI_OBAT.map(s => s.uuid));
  for (const s of payload.data.subKategori) {
    if (existingSubKategoriUuids.has(s.uuid)) { stats.subKategori.skipped += 1; continue; }
    const parentUuid = fileSlugToKategoriUuid.get(s.kategoriSlug);
    const liveSlug = parentUuid ? kategoriUuidToLiveSlug.get(parentUuid) : undefined;
    if (!liveSlug || !parentUuid) { stats.subKategori.skipped += 1; continue; } // parent didn't survive merge — never orphan a record
    if (isDuplicateSubKategoriNama(liveSlug, s.nama)) { stats.subKategori.skipped += 1; continue; } // name uniqueness invariant
    // kategoriUuid is always rewritten to the live parent's uuid (== parentUuid,
    // since Kategori uuids are preserved as-is on insert) — never trusted
    // as-is from the file, and backfilled for pre-SO-008 export files that
    // don't carry it at all.
    const clone: SubKategoriObat = { ...JSON.parse(JSON.stringify(s)), kategoriSlug: liveSlug, kategoriUuid: parentUuid };
    SUB_KATEGORI_OBAT.push(clone);
    existingSubKategoriUuids.add(s.uuid);
    stats.subKategori.added += 1;
  }

  const existingDetailUuids = new Set(DETAIL_OBAT.map(d => d.uuid));
  for (const d of payload.data.detailObat) {
    if (existingDetailUuids.has(d.uuid)) { stats.detailObat.skipped += 1; continue; }
    if (!existingSubKategoriUuids.has(d.subKategoriUuid)) { stats.detailObat.skipped += 1; continue; } // parent didn't survive merge
    if (isDuplicateDetailObatNama(d.subKategoriUuid, d.nama)) { stats.detailObat.skipped += 1; continue; } // name uniqueness invariant
    DETAIL_OBAT.push(JSON.parse(JSON.stringify(d)));
    existingDetailUuids.add(d.uuid);
    stats.detailObat.added += 1;
  }

  logMasterObatEvent('import', 'kategori', 'merge', JSON.stringify(stats));
  return stats;
}

/** Parses raw file text into JSON, catching syntax errors as a validation failure rather than throwing. */
export function parseMasterObatImportFile(text: string): ValidationResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { valid: false, errors: ['File tidak valid: bukan format JSON yang benar.'] };
  }
  return validateMasterObatImport(raw);
}
