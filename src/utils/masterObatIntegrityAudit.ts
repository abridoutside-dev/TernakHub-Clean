// ─── Master Obat — Internal Integrity Audit (SO-008) ─────────────────────────
// Pure, read-only diagnostic checks over the live Kategori → Sub Kategori →
// Detail Obat registries. Not wired into any UI or workflow — this exists so
// the health of the Master Obat SSOT can be verified on demand (e.g. from a
// dev console or a future automated check) without adding any new screen.
//
// Checks performed:
// - Duplicate UUIDs within a level, and across all three levels combined.
// - Orphans: a Sub Kategori whose kategoriUuid/kategoriSlug doesn't resolve
//   to a live Kategori; a Detail Obat whose subKategoriUuid doesn't resolve
//   to a live Sub Kategori.
// - Denormalization drift: a Sub Kategori's kategoriSlug pointing at a
//   different Kategori than its kategoriUuid (the two must always agree).

import { KATEGORI_OBAT } from '../data/masterObatKategoriData';
import { SUB_KATEGORI_OBAT } from '../data/masterObatSubKategoriData';
import { DETAIL_OBAT } from '../data/masterObatDetailData';

export interface MasterObatIntegrityIssue {
  level: 'kategori' | 'subKategori' | 'detailObat';
  uuid: string;
  problem: string;
}

export interface MasterObatIntegrityReport {
  ok: boolean;
  checkedAt: string;
  counts: { kategori: number; subKategori: number; detailObat: number };
  issues: MasterObatIntegrityIssue[];
}

function findDuplicateUuids(uuids: string[]): Set<string> {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const u of uuids) {
    if (seen.has(u)) dupes.add(u); else seen.add(u);
  }
  return dupes;
}

/** Runs a full referential-integrity sweep over the Master Obat registries. Read-only — never mutates anything. */
export function auditMasterObatIntegrity(): MasterObatIntegrityReport {
  const issues: MasterObatIntegrityIssue[] = [];

  const kategoriUuidSet = new Set(KATEGORI_OBAT.map(k => k.uuid));
  const kategoriSlugToUuid = new Map(KATEGORI_OBAT.map(k => [k.slug, k.uuid]));
  const subKategoriUuidSet = new Set(SUB_KATEGORI_OBAT.map(s => s.uuid));

  // ── Duplicate UUIDs — within each level, and across the whole database ──
  const taggedUuids: { level: MasterObatIntegrityIssue['level']; uuid: string }[] = [
    ...KATEGORI_OBAT.map(k => ({ level: 'kategori' as const, uuid: k.uuid })),
    ...SUB_KATEGORI_OBAT.map(s => ({ level: 'subKategori' as const, uuid: s.uuid })),
    ...DETAIL_OBAT.map(d => ({ level: 'detailObat' as const, uuid: d.uuid })),
  ];
  const dupUuids = findDuplicateUuids(taggedUuids.map(t => t.uuid));
  for (const dup of dupUuids) {
    // A duplicate can span levels (e.g. a Kategori and a Detail Obat sharing
    // a uuid by mistake) — report every level it actually appears in, not
    // just the first, so the diagnostic points at every offending record.
    const levels = taggedUuids.filter(t => t.uuid === dup).map(t => t.level);
    for (const level of new Set(levels)) {
      issues.push({ level, uuid: dup, problem: 'UUID duplikat ditemukan di lebih dari satu record.' });
    }
  }

  // ── Sub Kategori: orphan / dangling parent, and slug↔uuid drift ──
  for (const s of SUB_KATEGORI_OBAT) {
    if (!kategoriUuidSet.has(s.kategoriUuid)) {
      issues.push({ level: 'subKategori', uuid: s.uuid, problem: `kategoriUuid "${s.kategoriUuid}" tidak ditemukan pada Kategori manapun (orphan).` });
      continue;
    }
    const expectedUuidForSlug = kategoriSlugToUuid.get(s.kategoriSlug);
    if (expectedUuidForSlug !== s.kategoriUuid) {
      issues.push({
        level: 'subKategori', uuid: s.uuid,
        problem: `kategoriSlug "${s.kategoriSlug}" dan kategoriUuid "${s.kategoriUuid}" tidak konsisten (denormalization drift).`,
      });
    }
  }

  // ── Detail Obat: orphan parent ──
  for (const d of DETAIL_OBAT) {
    if (!subKategoriUuidSet.has(d.subKategoriUuid)) {
      issues.push({ level: 'detailObat', uuid: d.uuid, problem: `subKategoriUuid "${d.subKategoriUuid}" tidak ditemukan pada Sub Kategori manapun (orphan).` });
    }
  }

  return {
    ok: issues.length === 0,
    checkedAt: new Date().toISOString(),
    counts: { kategori: KATEGORI_OBAT.length, subKategori: SUB_KATEGORI_OBAT.length, detailObat: DETAIL_OBAT.length },
    issues,
  };
}
