// ─── useLivestock Hook — FLOW-002M2 ───────────────────────────────────────────
//
// React hook that provides workspace-scoped livestock data from Supabase.
//
// Design:
//  - Fetches livestock, batches, active batch members, and recent transfers
//    in one parallel Promise.all to avoid N+1 queries.
//  - Converts DB rows → legacy app-layer shapes (LivestockRecord, BatchRecord,
//    MembershipRecord) and populates the in-memory stores (LIVESTOCK_DB,
//    BATCH_DB, MEMBERSHIP_DB, LIVESTOCK_STATUS_DB, OUTSIDE_LIVESTOCK_DB) so
//    that existing utility functions (buildIndividuList, getLivestockStatus,
//    etc.) work without modification.
//  - Re-fetches whenever the active workspace changes.
//  - Uses an abort flag to prevent stale-closure races when the workspace
//    changes while a fetch is in-flight.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import {
  repoGetLivestockByWorkspace,
  repoGetBatchesByWorkspace,
  repoGetActiveBatchMembersByWorkspace,
  repoGetAllBatchMembersByWorkspace,
  repoGetTransfersByWorkspace,
  repoGetExtendedMetadataByLivestockIds,
  repoGetPedigreeLinksByLivestockIds,
} from '../repositories/livestockRepository';

// Legacy in-memory stores — populated here so existing code continues to work.
import { LIVESTOCK_DB, PEDIGREE_DB, addPedigreeLink, type LivestockRecord } from '../data/livestockData';
import { EXTENDED_DB } from '../data/livestockEditData';
import {
  LIVESTOCK_STATUS_DB,
  OUTSIDE_LIVESTOCK_DB,
  type LivestockStatus,
} from '../data/transferData';
import {
  BATCH_DB,
  MEMBERSHIP_DB,
  type BatchRecord,
  type BatchStatus,
  type MembershipRecord,
} from '../data/batchData';

import type {
  LivestockDbRow,
  BatchDbRow,
  BatchMemberDbRow,
  LivestockTransferDbRow,
} from '../types/livestock';

// ─── Species visual maps (must mirror AddLivestock.tsx) ───────────────────────

const SPECIES_ICON: Record<string, string> = {
  Domba:   '🐑',
  Kambing: '🐐',
  Sapi:    '🐄',
  Kerbau:  '🐃',
  Kuda:    '🐎',
  Babi:    '🐷',
};

const SPECIES_VISUALS: Record<string, { color: string; bg: string }> = {
  Domba:   { color: '#1b7a43', bg: '#e8f5ee' },
  Kambing: { color: '#b5651d', bg: '#fbeee0' },
  Sapi:    { color: '#7a1b3a', bg: '#f5e8ee' },
  Kerbau:  { color: '#3a3a3a', bg: '#eceff1' },
  Kuda:    { color: '#8a5a2b', bg: '#f6ede1' },
  Babi:    { color: '#c2185b', bg: '#fde4ec' },
};
const FALLBACK_VISUAL = { color: '#546e7a', bg: '#eceff1' };

// ─── Date helpers ─────────────────────────────────────────────────────────────

const MONTHS_ID = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];

/** Converts 'YYYY-MM-DD' or ISO timestamp to Indonesian date label e.g. "7 Juli 2026". */
export function isoToIndonesianDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso.length > 10 ? iso : iso + 'T00:00:00');
  if (isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

function computeAge(isoDate: string | null): { age: string; ageMonths: number } {
  if (!isoDate) return { age: '—', ageMonths: 0 };
  const birth = new Date(isoDate + 'T00:00:00');
  if (isNaN(birth.getTime())) return { age: '—', ageMonths: 0 };
  const now = new Date();
  const months = Math.max(
    0,
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth()),
  );
  if (months >= 12) {
    const years = Math.floor(months / 12);
    const rem   = months % 12;
    return {
      age: rem > 0 ? `${years} tahun ${rem} bulan` : `${years} tahun`,
      ageMonths: months,
    };
  }
  return { age: months === 0 ? '< 1 bulan' : `${months} bulan`, ageMonths: months };
}

// ─── DB → App adapters ────────────────────────────────────────────────────────

function toLivestockRecord(
  row: LivestockDbRow,
  activeBatch: { id: string; label: string; joinedDate: string; totalMembers: number } | null,
): LivestockRecord {
  const visual = SPECIES_VISUALS[row.species] ?? FALLBACK_VISUAL;
  const { age, ageMonths } = computeAge(row.birth_date);

  return {
    id:                 row.id,
    name:               row.name,
    type:               row.species,
    typeIcon:           SPECIES_ICON[row.species] ?? '🐾',
    typeColor:          visual.color,
    typeBg:             visual.bg,
    ras:                row.breed ?? '—',
    kelamin:            row.sex ?? 'Jantan',
    birthDate:          isoToIndonesianDate(row.birth_date),
    birthDateEstimated: row.birth_date_estimated,
    age,
    ageMonths,
    birthWeight:
      row.birth_weight_kg != null ? String(row.birth_weight_kg) : '—',
    weight:
      row.current_weight_kg != null ? String(row.current_weight_kg) : '—',
    weightUnit:         'Kg',
    program:            row.program ?? 'Lainnya',
    status:             row.health_status,
    location:           row.location_detail ?? '—',
    batch:              activeBatch
      ? {
          id:           activeBatch.id,
          program:      activeBatch.label,
          joinedDate:   activeBatch.joinedDate,
          totalMembers: activeBatch.totalMembers,
        }
      : null,
    digitalIdentity: {
      verified:       row.digital_identity_verified,
      registeredDate: isoToIndonesianDate(row.digital_identity_registered_date),
      issuedBy:       row.digital_identity_issued_by ?? '—',
    },
  };
}

function toBatchRecord(row: BatchDbRow, memberCount: number): BatchRecord {
  const visual = SPECIES_VISUALS[row.species ?? ''] ?? FALLBACK_VISUAL;
  // DB batch_status_enum ⊆ app BatchStatus — direct pass-through is safe.
  const status = row.status as BatchStatus;

  return {
    id:              row.id,
    name:            row.label,
    label:           row.label,
    status,
    createdDate:     isoToIndonesianDate(row.created_at),
    updatedDate:     isoToIndonesianDate(row.updated_at),
    finishedDate:    row.finished_date ? isoToIndonesianDate(row.finished_date) : null,
    description:     row.notes ?? null,
    purpose:         null,
    location:        null,
    startDate:       row.start_date ? isoToIndonesianDate(row.start_date) : null,
    endDate:         null,
    livestockType:   row.species ?? '—',
    livestockIcon:   SPECIES_ICON[row.species ?? ''] ?? '🐾',
    livestockTypeBg:    visual.bg,
    livestockTypeColor: visual.color,
  };
}

function toMembershipRecord(m: BatchMemberDbRow): MembershipRecord {
  return {
    id:          `MBR-${m.batch_id.replace(/-/g, '')}-${m.livestock_id.replace(/-/g, '').slice(0, 6)}`,
    batchId:     m.batch_id,
    livestockId: m.livestock_id,
    joinDate:    isoToIndonesianDate(m.joined_date),
    leaveDate:   m.removed_date ? isoToIndonesianDate(m.removed_date) : null,
    status:      m.removed_date ? 'Keluar' : 'Aktif',
    notes:       m.removal_reason ?? null,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseLivestockResult {
  /** All livestock (all location statuses) for the active workspace. */
  livestock: LivestockRecord[];
  /** All batches for the active workspace. */
  batches: BatchRecord[];
  /** True while a fetch is in-flight. */
  isLoading: boolean;
  /** Non-null when the last fetch failed. */
  error: string | null;
  /** Re-fetches from Supabase and refreshes in-memory stores. */
  refresh: () => void;
}

export function useLivestock(): UseLivestockResult {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.workspace_uuid ?? null;

  const [livestock, setLivestock] = useState<LivestockRecord[]>([]);
  const [batches,   setBatches]   = useState<BatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  // Abort flag — prevents stale-closure races when workspace changes mid-fetch.
  const abortRef = useRef(false);

  const fetchAll = useCallback(async () => {
    if (!workspaceId) {
      // No active workspace — clear stores and stop loading.
      for (const k of Object.keys(LIVESTOCK_DB)) delete LIVESTOCK_DB[k];
      for (const k of Object.keys(LIVESTOCK_STATUS_DB)) delete LIVESTOCK_STATUS_DB[k];
      OUTSIDE_LIVESTOCK_DB.length = 0;
      for (const k of Object.keys(BATCH_DB)) delete BATCH_DB[k];
      MEMBERSHIP_DB.length = 0;
      setLivestock([]);
      setBatches([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    abortRef.current = false;
    setIsLoading(true);
    setError(null);

    try {
      // Parallel fetch — no N+1 queries.
      // mRows (active only) → used for per-livestock active-batch card + member counts.
      // allMRows (all members) → used for MEMBERSHIP_DB so getBatchMemberships() returns
      //   full history (join + leave) after hard refresh, not just current-session members.
      // extRows → bulk-fetched after lRows IDs are known; populates EXTENDED_DB.
      const [lRows, bRows, mRows, allMRows, tRows] = await Promise.all([
        repoGetLivestockByWorkspace(workspaceId),
        repoGetBatchesByWorkspace(workspaceId),
        repoGetActiveBatchMembersByWorkspace(workspaceId),
        repoGetAllBatchMembersByWorkspace(workspaceId),
        repoGetTransfersByWorkspace(workspaceId),
      ]);

      // Bulk-fetch extended metadata and pedigree links in parallel (both need lRows IDs).
      const livestockIds = lRows.map((r) => r.id);
      const [extRows, pedigreeLinks] = await Promise.all([
        repoGetExtendedMetadataByLivestockIds(livestockIds),
        repoGetPedigreeLinksByLivestockIds(livestockIds),
      ]);

      if (abortRef.current) return; // workspace changed mid-flight

      // ── Index: active member per livestock → batch row ───────────────────
      const activeMember = new Map<string, BatchMemberDbRow>();
      const memberCountPerBatch = new Map<string, number>();

      for (const m of mRows) {
        if (!m.removed_date) {
          activeMember.set(m.livestock_id, m);
          memberCountPerBatch.set(
            m.batch_id,
            (memberCountPerBatch.get(m.batch_id) ?? 0) + 1,
          );
        }
      }

      const batchById = new Map<string, BatchDbRow>(bRows.map((b) => [b.id, b]));

      // ── Index: latest Keluar Sementara transfer per livestock ─────────────
      const latestOutside = new Map<string, LivestockTransferDbRow>();
      for (const t of tRows) {
        if (t.transfer_type === 'Keluar Sementara') {
          const ex = latestOutside.get(t.livestock_id);
          if (!ex || t.transfer_date > ex.transfer_date) {
            latestOutside.set(t.livestock_id, t);
          }
        }
      }

      // ── Convert livestock rows ─────────────────────────────────────────────
      const records: LivestockRecord[] = lRows.map((row) => {
        const member  = activeMember.get(row.id);
        const bRow    = member ? (batchById.get(member.batch_id) ?? null) : null;
        const abatch  = bRow
          ? {
              id:           bRow.id,
              label:        bRow.label,
              joinedDate:   isoToIndonesianDate(member!.joined_date),
              totalMembers: memberCountPerBatch.get(bRow.id) ?? 0,
            }
          : null;
        return toLivestockRecord(row, abatch);
      });

      // ── Populate EXTENDED_DB from Supabase rows ───────────────────────────
      // Supabase is the source of truth; localStorage is only a write-through
      // cache. We overwrite any stale localStorage entries with fresh DB data.
      for (const row of extRows) {
        EXTENDED_DB[row.livestock_id] = {
          earTag:        row.ear_tag,
          internalCode:  row.internal_code,
          notes:         row.notes,
          breedCategory: row.breed_category,
          crossBreed:    row.cross_breed,
          color:         row.color,
          horn:          row.horn,
          tail:          row.tail,
          specialMarks:  row.special_marks,
          purchaseDate:  row.purchase_date,
          purchasePrice: row.purchase_price != null ? String(row.purchase_price) : null,
          supplier:      row.supplier,
          originFarm:    row.origin_farm,
          siblingCount:  row.sibling_count != null ? String(row.sibling_count) : null,
        };
      }

      // ── Populate LIVESTOCK_DB ─────────────────────────────────────────────
      for (const k of Object.keys(LIVESTOCK_DB)) delete LIVESTOCK_DB[k];
      for (const r of records) LIVESTOCK_DB[r.id] = r;

      // ── Populate PEDIGREE_DB from Supabase pedigree_links ─────────────────
      // Must run after LIVESTOCK_DB is populated: addPedigreeLink calls
      // getLivestock() internally to resolve names/icons for each relative.
      // Group links by child (livestock_id), then call addPedigreeLink once
      // per child so offspring lists on parent entries are also back-filled.
      for (const k of Object.keys(PEDIGREE_DB)) delete PEDIGREE_DB[k];
      const linksByChild = new Map<string, { damId: string | null; sireId: string | null }>();
      for (const link of pedigreeLinks) {
        const entry = linksByChild.get(link.livestock_id) ?? { damId: null, sireId: null };
        if (link.role === 'Induk')    entry.damId  = link.relative_id;
        if (link.role === 'Pejantan') entry.sireId = link.relative_id;
        linksByChild.set(link.livestock_id, entry);
      }
      for (const [childId, { damId, sireId }] of linksByChild) {
        try {
          addPedigreeLink(childId, damId, sireId);
        } catch {
          // Skip malformed links (e.g. self-reference) without breaking load.
        }
      }

      // ── Populate LIVESTOCK_STATUS_DB ──────────────────────────────────────
      for (const k of Object.keys(LIVESTOCK_STATUS_DB)) delete LIVESTOCK_STATUS_DB[k];
      for (const row of lRows) {
        LIVESTOCK_STATUS_DB[row.id] = row.location_status as LivestockStatus;
      }

      // ── Populate OUTSIDE_LIVESTOCK_DB ─────────────────────────────────────
      OUTSIDE_LIVESTOCK_DB.length = 0;
      for (const row of lRows) {
        if (row.location_status === 'Luar Kandang') {
          const t = latestOutside.get(row.id);
          const since = t ? isoToIndonesianDate(t.transfer_date) : '—';
          const tMs   = t
            ? new Date(t.transfer_date + 'T00:00:00').getTime()
            : Date.now();
          const daysOut = Math.floor((Date.now() - tMs) / 86_400_000);
          OUTSIDE_LIVESTOCK_DB.push({
            livestockId:     row.id,
            reason:          (t?.reason ?? 'Lainnya') as typeof OUTSIDE_LIVESTOCK_DB[0]['reason'],
            destinationName: t?.destination ?? t?.to_location ?? '—',
            since,
            daysOut,
            previousLocation: row.location_detail ?? '—',
          });
        }
      }

      // ── Populate BATCH_DB ─────────────────────────────────────────────────
      const batchRecords: BatchRecord[] = bRows.map((b) =>
        toBatchRecord(b, memberCountPerBatch.get(b.id) ?? 0),
      );
      for (const k of Object.keys(BATCH_DB)) delete BATCH_DB[k];
      for (const b of batchRecords) BATCH_DB[b.id] = b;

      // ── Populate MEMBERSHIP_DB (flat array — ALL members including removed) ──
      // allMRows contains active + removed members so getBatchMemberships() returns
      // full history (join/leave events) after hard refresh, not just this session.
      MEMBERSHIP_DB.length = 0;
      for (const m of allMRows) {
        MEMBERSHIP_DB.push(toMembershipRecord(m));
      }

      setLivestock(records);
      setBatches(batchRecords);
    } catch (err) {
      if (abortRef.current) return;
      const msg = err instanceof Error ? err.message : 'Gagal memuat data ternak.';
      console.error('[useLivestock]', err);
      setError(msg);
    } finally {
      if (!abortRef.current) setIsLoading(false);
    }
  }, [workspaceId]);

  // Re-fetch whenever workspace changes (or on first mount).
  useEffect(() => {
    void fetchAll();
    return () => {
      abortRef.current = true;
    };
  }, [fetchAll]);

  const refresh = useCallback(() => {
    void fetchAll();
  }, [fetchAll]);

  return { livestock, batches, isLoading, error, refresh };
}
