/**
 * aiInsightLivestockData.ts  (LS-FIX-001)
 * ─────────────────────────────────────────────────────────────────────────────
 * Rule-based insight engine for the Livestock Hub.
 *
 * Analysis is READ ONLY — no mutations or transactions.
 * Mirrors the pattern from aiInsightMutasiData.ts / aiInsightKesehatanData.ts.
 *
 * Sections:
 *   1. Types
 *   2. Constants & thresholds
 *   3. Engine: generateLivestockInsights()
 */

import { LIVESTOCK_DB }           from './livestockData';
import { countByStatus }           from './transferData';
import { BATCH_DB, MEMBERSHIP_DB } from './batchData';
import { TINDAKAN_SESI_DB }        from './tindakanKesehatanData';
import { getKasusStatus }          from './kontrolKesehatanData';
import { getInventarisList }       from './stokInventarisData';
import {
  buildArchiveList,
  buildOutsideIndividu,
} from '../utils/livestockSummary';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Types
// ═══════════════════════════════════════════════════════════════════════════════

export type InsightLevel    = 'info' | 'warning' | 'critical';
/** Aligned with aiInsightBobotData.InsightCategory for cross-module consistency. */
export type InsightCategory = 'ringkasan' | 'analisis' | 'peringatan' | 'rekomendasi' | 'prediksi';

export interface InsightItem {
  id:            string;
  level:         InsightLevel;
  category:      InsightCategory;
  icon:          string;
  title:         string;
  message:       string;
  subjectLabel?: string;
}

export interface LivestockInsightReport {
  /** ISO timestamp — AI Constitution: Analysis Time */
  analyzedAt:       string;
  /** AI Constitution: Data Source */
  dataSource:       string[];
  /** AI Constitution: Confidence Status */
  confidenceStatus: string;
  /** AI Constitution: Version */
  version:          string;
  /** All insight items sorted critical → warning → info */
  items:            InsightItem[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Constants & thresholds
// ═══════════════════════════════════════════════════════════════════════════════

const DATA_SOURCE = [
  'LIVESTOCK_DB (livestockData.ts)',
  'TRANSFER_DB (transferData.ts)',
  'BATCH_DB / MEMBERSHIP_DB (batchData.ts)',
  'TINDAKAN_SESI_DB / KONTROL_RECORDS (tindakanKesehatanData.ts / kontrolKesehatanData.ts)',
  'INVENTARIS (stokInventarisData.ts)',
];

const VERSION = 'Rule-Based v1 (LS-FIX-001)';

/** Warn if > 30% of active livestock are outside kandang. */
const OUTSIDE_WARN_PCT  = 0.30;
/** Note if archived count exceeds 25% of total registered. */
const ARCHIVE_WARN_PCT  = 0.25;
/** Warn if Mati (death) count reaches this threshold. */
const HIGH_MORTALITY_CT = 3;
/** Warn if any animal has been outside for this many days. */
const LONG_OUTSIDE_DAYS = 14;
/** Warn if active health cases reach this count. */
const HIGH_CASES_CT     = 3;
/** Warn if stok pakan issues reach this count. */
const FEED_WARN_CT      = 3;

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Engine
// ═══════════════════════════════════════════════════════════════════════════════

export function generateLivestockInsights(): LivestockInsightReport {
  const analyzedAt = new Date().toISOString();
  const items: InsightItem[] = [];

  // ── Raw data ──────────────────────────────────────────────────────────────
  const allLivestock    = Object.values(LIVESTOCK_DB);
  const { diKandang, luarKandang } = countByStatus();
  const archiveList     = buildArchiveList();
  const outsideList     = buildOutsideIndividu();
  const totalRegistered = allLivestock.length;
  const totalAktif      = diKandang + luarKandang;
  const totalArsip      = archiveList.length;

  // ── Batch stats ───────────────────────────────────────────────────────────
  const activeBatch  = Object.values(BATCH_DB).filter((b) => b.status === 'Aktif');
  const batchedIds   = new Set(
    MEMBERSHIP_DB.filter((m) => m.status === 'Aktif').map((m) => m.livestockId),
  );
  const batchedCount = [...batchedIds].filter((id) => !!LIVESTOCK_DB[id]).length;

  // ── Health stats ──────────────────────────────────────────────────────────
  let activeHealthCases = 0;
  for (const sesi of TINDAKAN_SESI_DB) {
    if (getKasusStatus(sesi.id) === 'Aktif') activeHealthCases++;
  }

  // ── Stok pakan stats ──────────────────────────────────────────────────────
  const pakanList       = getInventarisList();
  const pakanIssueCount = pakanList.filter((i) => i.status !== 'Normal').length;

  // ── RULE R-01: Ringkasan populasi ─────────────────────────────────────────
  if (totalRegistered === 0) {
    items.push({
      id: 'r01-empty',
      level: 'info', category: 'ringkasan', icon: '🐄',
      title: 'Belum Ada Ternak',
      message: 'Belum ada ternak yang terdaftar. Tambahkan ternak pertama untuk mulai memantau populasi kandang.',
    });
  } else {
    const jenisSet = new Set(allLivestock.map((lv) => lv.type));
    items.push({
      id: 'r01-summary',
      level: 'info', category: 'analisis', icon: '📊',
      title: 'Ringkasan Populasi',
      message:
        `${totalRegistered} ternak terdaftar — ${diKandang} di kandang, ${luarKandang} luar kandang, ` +
        `${totalArsip} diarsipkan. ${jenisSet.size} jenis ternak.`,
    });
  }

  // ── RULE R-02: Proporsi luar kandang tinggi ───────────────────────────────
  if (totalAktif > 0 && luarKandang > 0) {
    const outsidePct = luarKandang / totalAktif;
    if (outsidePct >= OUTSIDE_WARN_PCT) {
      items.push({
        id: 'r02-outside-high',
        level: 'warning', category: 'peringatan', icon: '📍',
        title: 'Banyak Ternak di Luar Kandang',
        message:
          `${luarKandang} dari ${totalAktif} ternak aktif (${Math.round(outsidePct * 100)}%) ` +
          `sedang di luar kandang. Pantau jadwal kepulangan ternak.`,
      });
    }
  }

  // ── RULE R-03: Ternak lama di luar kandang ────────────────────────────────
  const longOutside = outsideList.filter((o) => o.daysOut >= LONG_OUTSIDE_DAYS);
  if (longOutside.length > 0) {
    const names = longOutside.slice(0, 2).map((o) => o.name ?? o.id).join(', ');
    items.push({
      id: 'r03-long-outside',
      level: 'warning', category: 'peringatan', icon: '⏳',
      title: 'Ternak Lama di Luar Kandang',
      message:
        `${longOutside.length} ternak sudah ≥${LONG_OUTSIDE_DAYS} hari di luar kandang: ` +
        `${names}${longOutside.length > 2 ? '…' : ''}. Pertimbangkan pemulangan.`,
    });
  }

  // ── RULE R-04: Kematian / arsipasi tinggi ─────────────────────────────────
  if (totalArsip > 0) {
    const matiCount = archiveList.filter((a) => a.reason === 'Mati').length;
    const arsipPct  = totalRegistered > 0 ? totalArsip / totalRegistered : 0;

    if (matiCount >= HIGH_MORTALITY_CT) {
      items.push({
        id: 'r04-mortality',
        level: 'warning', category: 'peringatan', icon: '⚠️',
        title: 'Kematian Ternak Perlu Perhatian',
        message:
          `${matiCount} ternak tercatat mati (dari ${totalArsip} total arsip). ` +
          `Tinjau kondisi kandang dan program kesehatan.`,
      });
    } else if (arsipPct >= ARCHIVE_WARN_PCT) {
      items.push({
        id: 'r04-archive-info',
        level: 'info', category: 'analisis', icon: '📁',
        title: 'Informasi Arsip Ternak',
        message:
          `${totalArsip} dari ${totalRegistered} ternak (${Math.round(arsipPct * 100)}%) diarsipkan — ` +
          `Terjual: ${archiveList.filter((a) => a.reason === 'Terjual').length}, ` +
          `Hibah: ${archiveList.filter((a) => a.reason === 'Hibah').length}, ` +
          `Mati: ${matiCount}.`,
      });
    }
  }

  // ── RULE R-05: Kasus kesehatan aktif ─────────────────────────────────────
  if (activeHealthCases > 0) {
    items.push({
      id: 'r05-health',
      level: activeHealthCases >= HIGH_CASES_CT ? 'warning' : 'info',
      category: 'peringatan', icon: '🩺',
      title: 'Kasus Kesehatan Aktif',
      message:
        `${activeHealthCases} kasus kesehatan sedang aktif. ` +
        `Pantau perkembangan melalui modul Kesehatan Hewan.`,
    });
  }

  // ── RULE R-06: Belum ada batch aktif ─────────────────────────────────────
  if (totalAktif > 0 && activeBatch.length === 0) {
    items.push({
      id: 'r06-no-batch',
      level: 'info', category: 'rekomendasi', icon: '📦',
      title: 'Belum Ada Batch Aktif',
      message:
        `${totalAktif} ternak aktif belum tergabung dalam batch. ` +
        `Gunakan modul Batch untuk mengelompokkan ternak berdasarkan program.`,
    });
  }

  // ── RULE R-07: Cakupan batch baik ────────────────────────────────────────
  if (activeBatch.length > 0 && totalAktif > 0) {
    const pct = Math.round((batchedCount / totalAktif) * 100);
    if (pct >= 50) {
      items.push({
        id: 'r07-batch-ok',
        level: 'info', category: 'analisis', icon: '✅',
        title: 'Cakupan Batch Baik',
        message:
          `${batchedCount} dari ${totalAktif} ternak (${pct}%) tergabung dalam ` +
          `${activeBatch.length} batch aktif.`,
      });
    }
  }

  // ── RULE R-08: Stok pakan bermasalah ─────────────────────────────────────
  if (pakanIssueCount > 0) {
    items.push({
      id: 'r08-feed',
      level: pakanIssueCount >= FEED_WARN_CT ? 'warning' : 'info',
      category: 'peringatan', icon: '🌿',
      title: 'Stok Pakan Perlu Perhatian',
      message:
        `${pakanIssueCount} item stok pakan berstatus Menipis atau Habis. ` +
        `Segera lakukan pengisian stok.`,
    });
  }

  // ── Sort: critical → warning → info ──────────────────────────────────────
  const levelOrd: Record<InsightLevel, number> = { critical: 0, warning: 1, info: 2 };
  items.sort((a, b) => levelOrd[a.level] - levelOrd[b.level]);

  return {
    analyzedAt,
    dataSource:       DATA_SOURCE,
    confidenceStatus: 'Rule-Based',
    version:          VERSION,
    items,
  };
}
