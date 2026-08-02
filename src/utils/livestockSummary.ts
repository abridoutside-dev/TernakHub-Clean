/**
 * Shared livestock list builders — single source of truth for
 * Dashboard, ActiveLivestock, OutsideLivestock, and ArchiveLivestock.
 *
 * All counters and preview data on the Dashboard are derived from
 * the same functions the module pages use, guaranteeing sync.
 * Dashboard is a presenter only — it never owns data or calculates
 * its own counts.
 */

import { LIVESTOCK_DB } from '../data/livestockData';
import {
  getLivestockStatus,
  getActiveOutsideLivestock,
  LIVESTOCK_STATUS_DB,
  TRANSFER_HISTORY,
} from '../data/transferData';
import type { PermanentTransferReason } from '../data/transferData';

// ─── Active Livestock ─────────────────────────────────────────────────────────

export type IndividuItem = {
  id: string; name: string | null;
  type: string; icon: string; typeColor: string; typeBg: string;
  ras: string; blok: string;
  weight: string; unit: string; weightNum: number;
  ageMonths: number; gender: string; program: string; status: string;
};

function extractBlok(location: string): string {
  const parts = location.split(', ');
  const blokPart = parts.find((p) => /blok/i.test(p));
  return blokPart ?? parts[parts.length - 1] ?? location;
}

/** All Di-Kandang livestock — same source as ActiveLivestock page. */
export function buildIndividuList(): IndividuItem[] {
  return Object.values(LIVESTOCK_DB)
    .filter((lv) => getLivestockStatus(lv.id) === 'Di Kandang')
    .map((lv) => ({
      id: lv.id, name: lv.name,
      type: lv.type, icon: lv.typeIcon, typeColor: lv.typeColor, typeBg: lv.typeBg,
      ras: lv.ras, blok: extractBlok(lv.location),
      weight: lv.weight, unit: lv.weightUnit, weightNum: parseFloat(lv.weight) || 0,
      ageMonths: lv.ageMonths, gender: lv.kelamin, program: lv.program, status: lv.status,
    }));
}

// ─── Outside Livestock ────────────────────────────────────────────────────────

export type OutsideIndividuItem = {
  id: string; name: string | null;
  type: string; icon: string; typeColor: string; typeBg: string;
  ras: string;
  program: string; gender: string; ageMonths: number;
  weightNum: number; weight: string; unit: string;
  reason: string;
  since: string; daysOut: number;
  currentLocation: string;
  status: string;
};

/** All Luar-Kandang livestock — same source as OutsideLivestock page. */
export function buildOutsideIndividu(): OutsideIndividuItem[] {
  return getActiveOutsideLivestock()
    .map((entry): OutsideIndividuItem | null => {
      const lv = LIVESTOCK_DB[entry.livestockId];
      if (!lv) return null;
      return {
        id: lv.id, name: lv.name,
        type: lv.type, icon: lv.typeIcon, typeColor: lv.typeColor, typeBg: lv.typeBg,
        ras: lv.ras,
        program: lv.program, gender: lv.kelamin,
        ageMonths: lv.ageMonths,
        weightNum: parseFloat(lv.weight) || 0, weight: lv.weight, unit: lv.weightUnit,
        reason: entry.reason,
        since: entry.since, daysOut: entry.daysOut,
        currentLocation: entry.destinationName,
        status: lv.status,
      };
    })
    .filter((x): x is OutsideIndividuItem => x !== null);
}

// ─── Archive ──────────────────────────────────────────────────────────────────

/**
 * FINAL — exactly 3 valid archive reasons. Not nullable.
 * Any data that cannot be mapped to one of these is a DATA BUG, not a UI category.
 *
 * Normalization rules (applied in archiveReasonFromTransfer):
 *   PermanentTransferReason 'Penjualan'    → 'Terjual'
 *   PermanentTransferReason 'Rumah Potong' → 'Mati'  (slaughter is a form of death)
 *   PermanentTransferReason 'Mati'         → 'Mati'
 *   PermanentTransferReason 'Hilang'       → 'Mati'  (closest valid category; log DATA BUG)
 *   PermanentTransferReason 'Hibah'        → 'Hibah'
 */
export type ArchiveReason = 'Mati' | 'Terjual' | 'Hibah';

/** Visual config for each archive reason. */
export const ARCHIVE_REASON_CONFIG: Record<ArchiveReason, { bg: string; color: string; icon: string }> = {
  Mati:    { bg: '#eceff1', color: '#546e7a', icon: '⚰️' },
  Terjual: { bg: '#e3f2fd', color: '#0277bd', icon: '💰' },
  Hibah:   { bg: '#f3e5f5', color: '#6a1b9a', icon: '🎁' },
};

export type ArchiveItem = {
  id: string; name: string | null;
  type: string; icon: string; typeBg: string; typeColor: string;
  ras: string; gender: string; ageMonths: number;
  /** Always one of 'Mati' | 'Terjual' | 'Hibah'. Never null. */
  reason: ArchiveReason;
  date: string | null;
  notes: string | null;
};

/**
 * Map a PermanentTransferReason to a non-nullable ArchiveReason.
 *
 * If the reason cannot be cleanly mapped, a DATA BUG is logged and the
 * closest valid category is returned. No new UI categories are created.
 */
export function archiveReasonFromTransfer(reason: PermanentTransferReason): ArchiveReason {
  if (reason === 'Penjualan')    return 'Terjual';
  if (reason === 'Rumah Potong') return 'Mati';
  if (reason === 'Mati')         return 'Mati';
  if (reason === 'Hibah')        return 'Hibah';
  // 'Hilang' has no matching category — log as data bug, normalize to 'Mati'
  console.error(`[DATA BUG] PermanentTransferReason "${reason}" cannot be mapped to a valid ArchiveReason. Normalizing to 'Mati'.`);
  return 'Mati';
}

/**
 * Look up archive metadata for a single livestock by ID.
 * Returns null if the animal is not archived, not found in LIVESTOCK_DB,
 * or has no Keluar Permanen record (DATA BUG — logged to console).
 */
export function getArchiveInfoById(id: string): { reason: ArchiveReason; date: string | null; notes: string | null } | null {
  if (LIVESTOCK_STATUS_DB[id] !== 'Arsip') return null;
  if (!LIVESTOCK_DB[id]) return null;
  const transferRecord = [...TRANSFER_HISTORY]
    .reverse()
    .find((r) => r.livestockId === id && r.action === 'Keluar Permanen');
  if (!transferRecord || !transferRecord.reason) {
    console.error(`[DATA BUG] Archived livestock "${id}" has no Keluar Permanen record with a valid reason.`);
    return null;
  }
  return {
    reason: archiveReasonFromTransfer(transferRecord.reason as PermanentTransferReason),
    date:   transferRecord.departDate,
    notes:  transferRecord.notes,
  };
}

/**
 * All Arsip livestock.
 *
 * Single Source of Truth: LIVESTOCK_STATUS_DB.
 * Every animal whose status === 'Arsip' MUST appear here.
 * Animals without a valid Keluar Permanen record are a DATA BUG —
 * they are skipped and logged; no null-reason items are included.
 *
 * TRANSFER_HISTORY is used only for enrichment (reason, date, notes).
 */
export function buildArchiveList(): ArchiveItem[] {
  return Object.entries(LIVESTOCK_STATUS_DB)
    .filter(([, status]) => status === 'Arsip')
    .flatMap(([id]): ArchiveItem[] => {
      const lv = LIVESTOCK_DB[id];
      if (!lv) return []; // ID in status DB but not in livestock DB — data gap, skip

      const transferRecord = [...TRANSFER_HISTORY]
        .reverse()
        .find((r) => r.livestockId === id && r.action === 'Keluar Permanen');

      if (!transferRecord || !transferRecord.reason) {
        console.error(`[DATA BUG] Archived livestock "${id}" has no Keluar Permanen record. Fix seed data or migration.`);
        return []; // Skip — do not invent a fallback category
      }

      const reason: ArchiveReason = archiveReasonFromTransfer(
        transferRecord.reason as PermanentTransferReason
      );

      return [{
        id: lv.id, name: lv.name,
        type: lv.type, icon: lv.typeIcon, typeBg: lv.typeBg, typeColor: lv.typeColor,
        ras: lv.ras, gender: lv.kelamin, ageMonths: lv.ageMonths,
        reason,
        date:  transferRecord.departDate,
        notes: transferRecord.notes,
      }];
    });
}
