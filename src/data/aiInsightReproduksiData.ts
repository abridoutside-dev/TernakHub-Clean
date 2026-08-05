/**
 * aiInsightReproduksiData.ts  (RP-011)
 * ─────────────────────────────────────────────────────────────────────────────
 * Rule-based AI Insight Engine untuk Modul Reproduksi.
 *
 * AI is Decision Support only — AI is READ ONLY (see docs/architecture/03_AI_CONSTITUTION.md).
 * Reads existing data from RP-002..RP-010 (Program, Pelaksanaan, Monitoring,
 * Pemeriksaan Kebuntingan, Kebuntingan, Kelahiran, Registrasi Anak, Sapih,
 * Riwayat Reproduksi) — TIDAK membuat, mengubah, atau menghapus data apapun,
 * dan TIDAK membuat sumber data baru. Seluruh analisis berbasis aturan
 * deterministik (rule-based).
 *
 * Sections:
 *   1. Types
 *   2. Helper utilities
 *   3. Rule engine: generateReproduksiInsights()
 */

import {
  getProgramList,
  getProgramById,
  type ReproduksiProgramRecord,
} from './reproduksiProgramData';
import { getPelaksanaanListByProgram } from './pelaksanaanReproduksiData';
import { getMonitoringListByProgram } from './monitoringReproduksiData';
import { getPemeriksaanListByProgram } from './pemeriksaanKebuntinganData';
import {
  getPregnancyListByProgram,
  isStatusFinal,
  type KebuntinganRecord,
} from './kebuntinganData';
import { KEBUNTINGAN_MONITORING_DB } from './kebuntinganData';
import {
  getKelahiranListByProgram,
  getAnakListByKelahiran,
} from './kelahiranData';
import { ANAK_DB } from './kelahiranData';
import { SAPIH_DB, umurSaatSapihHari } from './sapihData';
import { getAllReproduksiHistory, auditReproduksiHistoryIntegrity } from './riwayatReproduksiData';
import { getLivestock } from './livestockData';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Types
// ═══════════════════════════════════════════════════════════════════════════════

export type InsightLevel    = 'info' | 'warning' | 'critical';
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

export interface ReproduksiSummary {
  programAktif:     number;
  betinaBunting:    number;
  kelahiranMendatang: number; // due within UPCOMING_BIRTH_WINDOW_DAYS
  kelahiranTerbaru:   number; // completed within RECENT_BIRTH_WINDOW_DAYS
  sapihDirencanakan:  number;
  sapihBerlangsung:   number;
  sapihSelesai:       number;
}

export interface ReproduksiInsightReport {
  analyzedAt:       string;   // ISO timestamp — AI Constitution: Analysis Time
  dataSource:       string[]; // AI Constitution: Data Source
  confidenceStatus: string;   // AI Constitution: Confidence Status (Rule-Based)
  version:          string;   // AI Constitution: Version
  summary:          ReproduksiSummary;
  /** All insight items sorted critical → warning → info */
  items:            InsightItem[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Helper utilities
// ═══════════════════════════════════════════════════════════════════════════════

const DATA_SOURCE = [
  'Program Reproduksi (RP-002)',
  'Pelaksanaan Program (RP-003)',
  'Monitoring Program (RP-004)',
  'Pemeriksaan Kebuntingan (RP-005)',
  'Kebuntingan (RP-006)',
  'Kelahiran (RP-007)',
  'Registrasi Anak (RP-008)',
  'Sapih (RP-009)',
  'Riwayat Reproduksi (RP-010)',
];

const VERSION = 'Rule-Based v1';

// ── Thresholds (hari) — murni ambang batas rule-based, tidak mengubah data ──
const PEMERIKSAAN_OVERDUE_DAYS  = 21; // sejak Pelaksanaan terakhir tanpa Pemeriksaan Kebuntingan
const MONITORING_OVERDUE_DAYS   = 14; // sejak Monitoring/Kebuntingan-Monitoring terakhir pada Program/Kebuntingan aktif
const BIRTH_FOLLOWUP_DAYS       = 14; // sejak Kelahiran Selesai tanpa Registrasi Anak
const WEANING_DELAY_DAYS        = 90; // usia tipikal mulai Sapih
const UPCOMING_BIRTH_WINDOW_DAYS = 14; // due date dalam N hari ke depan
const RECENT_BIRTH_WINDOW_DAYS   = 14; // kelahiran selesai dalam N hari terakhir

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Days from fromIso to toIso (positive = toIso is later). */
function daysDiff(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 86_400_000);
}

function livestockLabel(id: string): string {
  const lv = getLivestock(id);
  return lv.name ?? id;
}

function programLabel(programId: string): string {
  const p = getProgramById(programId);
  return p ? (p.nomorProgram ?? programId) : programId;
}

let seq = 0;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Main engine
// ═══════════════════════════════════════════════════════════════════════════════

export function generateReproduksiInsights(): ReproduksiInsightReport {
  seq = 0;
  const today      = todayStr();
  const analyzedAt = new Date().toISOString();
  const items: InsightItem[] = [];

  // ── Load data (read-only) ───────────────────────────────────────────────
  const programs        = getProgramList();
  const programAktifList = programs.filter((p) => p.status === 'Berjalan');

  const allPregnancies  = programs.flatMap((p) => getPregnancyListByProgram(p.id));
  const activePregnancies = allPregnancies.filter((k) => !isStatusFinal(k.status));

  const allKelahiran    = programs.flatMap((p) => getKelahiranListByProgram(p.id));
  const kelahiranSelesai = allKelahiran.filter((k) => k.status === 'Selesai');

  const allSapih        = Object.values(SAPIH_DB);
  const allAnak          = Object.values(ANAK_DB);

  const history          = getAllReproduksiHistory();
  const auditReport      = auditReproduksiHistoryIntegrity();

  // ── AI SUMMARY ───────────────────────────────────────────────────────────
  const upcomingBirths = activePregnancies.filter(
    (k) => daysDiff(today, k.tanggalLahirPerkiraan) >= 0 && daysDiff(today, k.tanggalLahirPerkiraan) <= UPCOMING_BIRTH_WINDOW_DAYS,
  );
  const recentBirths = kelahiranSelesai.filter(
    (k) => daysDiff(k.updatedDate.slice(0, 10), today) <= RECENT_BIRTH_WINDOW_DAYS && daysDiff(k.updatedDate.slice(0, 10), today) >= 0,
  );

  const summary: ReproduksiSummary = {
    programAktif:        programAktifList.length,
    betinaBunting:        activePregnancies.length,
    kelahiranMendatang:   upcomingBirths.length,
    kelahiranTerbaru:     recentBirths.length,
    sapihDirencanakan:    allSapih.filter((s) => s.status === 'Direncanakan').length,
    sapihBerlangsung:     allSapih.filter((s) => s.status === 'Berlangsung').length,
    sapihSelesai:         allSapih.filter((s) => s.status === 'Selesai').length,
  };

  items.push({
    id: nextId('ringkasan'), level: 'info', category: 'ringkasan', icon: '🗂️',
    title: 'Program Aktif',
    message: summary.programAktif > 0
      ? `${summary.programAktif} Program Reproduksi sedang berjalan.`
      : 'Tidak ada Program Reproduksi yang sedang berjalan saat ini.',
  });
  items.push({
    id: nextId('ringkasan'), level: 'info', category: 'ringkasan', icon: '🤰',
    title: 'Betina Bunting',
    message: summary.betinaBunting > 0
      ? `${summary.betinaBunting} kebuntingan aktif sedang dipantau.`
      : 'Belum ada kebuntingan aktif yang tercatat.',
  });
  items.push({
    id: nextId('ringkasan'), level: summary.kelahiranMendatang > 0 ? 'info' : 'info', category: 'ringkasan', icon: '🍼',
    title: 'Kelahiran Mendatang',
    message: summary.kelahiranMendatang > 0
      ? `${summary.kelahiranMendatang} kebuntingan diperkirakan lahir dalam ${UPCOMING_BIRTH_WINDOW_DAYS} hari ke depan.`
      : `Tidak ada perkiraan kelahiran dalam ${UPCOMING_BIRTH_WINDOW_DAYS} hari ke depan.`,
  });
  items.push({
    id: nextId('ringkasan'), level: 'info', category: 'ringkasan', icon: '🐣',
    title: 'Kelahiran Terbaru',
    message: summary.kelahiranTerbaru > 0
      ? `${summary.kelahiranTerbaru} kelahiran selesai dalam ${RECENT_BIRTH_WINDOW_DAYS} hari terakhir.`
      : `Tidak ada kelahiran yang selesai dalam ${RECENT_BIRTH_WINDOW_DAYS} hari terakhir.`,
  });
  items.push({
    id: nextId('ringkasan'), level: 'info', category: 'ringkasan', icon: '🌱',
    title: 'Status Sapih',
    message: (summary.sapihDirencanakan + summary.sapihBerlangsung + summary.sapihSelesai) > 0
      ? `${summary.sapihDirencanakan} direncanakan · ${summary.sapihBerlangsung} berlangsung · ${summary.sapihSelesai} selesai.`
      : 'Belum ada proses Sapih yang tercatat.',
  });

  // ── AI ANALYSIS ──────────────────────────────────────────────────────────

  // Pregnancy progression — status distribution among active pregnancies.
  if (activePregnancies.length > 0) {
    const tinggi = activePregnancies.filter((k) => k.riskLevel === 'Tinggi').length;
    items.push({
      id: nextId('analisis'), level: tinggi > 0 ? 'warning' : 'info', category: 'analisis', icon: '📈',
      title: 'Perkembangan Kebuntingan',
      message: tinggi > 0
        ? `${tinggi} dari ${activePregnancies.length} kebuntingan aktif berada pada risiko Tinggi — perlu perhatian lebih.`
        : `${activePregnancies.length} kebuntingan aktif — seluruhnya pada tingkat risiko Rendah/Sedang.`,
    });
  }

  // Reproductive performance — hasil pemeriksaan (Bunting vs Tidak Bunting) lintas Program.
  const allPemeriksaan = programs.flatMap((p) => getPemeriksaanListByProgram(p.id));
  if (allPemeriksaan.length > 0) {
    const bunting = allPemeriksaan.filter((p) => p.hasil === 'Bunting').length;
    const rate = Math.round((bunting / allPemeriksaan.length) * 100);
    items.push({
      id: nextId('analisis'), level: 'info', category: 'analisis', icon: '🔬',
      title: 'Performa Reproduksi',
      message: `Tingkat konfirmasi bunting: ${rate}% (${bunting} dari ${allPemeriksaan.length} pemeriksaan).`,
    });
  }

  // Birth performance — Hidup vs Lahir Mati vs Mati Setelah Lahir.
  if (allAnak.length > 0) {
    const hidup = allAnak.filter((a) => a.jenis === 'Hidup').length;
    const abnormal = allAnak.length - hidup;
    const rate = Math.round((hidup / allAnak.length) * 100);
    items.push({
      id: nextId('analisis'), level: abnormal > 0 ? 'warning' : 'info', category: 'analisis', icon: '📊',
      title: 'Performa Kelahiran',
      message: `${hidup} dari ${allAnak.length} anak lahir hidup (${rate}%)${abnormal > 0 ? ` — ${abnormal} kasus tidak normal.` : '.'}`,
    });
  }

  // Weaning performance — average age at weaning for completed Sapih.
  const sapihSelesai = allSapih.filter((s) => s.status === 'Selesai');
  if (sapihSelesai.length > 0) {
    const durations = sapihSelesai
      .map((s) => {
        const kelahiran = allKelahiran.find((k) => k.id === s.kelahiranId);
        return kelahiran ? umurSaatSapihHari(kelahiran, s.tanggalSapih) : null;
      })
      .filter((d): d is number => d !== null);
    if (durations.length > 0) {
      const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
      items.push({
        id: nextId('analisis'), level: 'info', category: 'analisis', icon: '🌾',
        title: 'Performa Sapih',
        message: `Rata-rata usia sapih: ${avg} hari dari ${durations.length} proses Sapih yang selesai.`,
      });
    }
  }

  // Reproduction history trend — event count last 30d vs previous 30d.
  if (history.length > 0) {
    const last30 = history.filter((h) => {
      const d = daysDiff(h.event.timestamp, today);
      return d >= 0 && d <= 30;
    }).length;
    const prev30 = history.filter((h) => {
      const d = daysDiff(h.event.timestamp, today);
      return d > 30 && d <= 60;
    }).length;
    let trendMsg: string;
    if (prev30 === 0 && last30 === 0) {
      trendMsg = 'Belum cukup data riwayat untuk menganalisis tren.';
    } else if (last30 > prev30) {
      trendMsg = `Aktivitas reproduksi meningkat — ${last30} event dalam 30 hari terakhir (sebelumnya ${prev30}).`;
    } else if (last30 < prev30) {
      trendMsg = `Aktivitas reproduksi menurun — ${last30} event dalam 30 hari terakhir (sebelumnya ${prev30}).`;
    } else {
      trendMsg = `Aktivitas reproduksi stabil — ${last30} event dalam 30 hari terakhir.`;
    }
    items.push({
      id: nextId('analisis'), level: 'info', category: 'analisis', icon: '📉',
      title: 'Tren Riwayat Reproduksi',
      message: trendMsg,
    });
  }

  // ── AI WARNING ───────────────────────────────────────────────────────────

  // Overdue pregnancy examination — Program aktif dengan Pelaksanaan tapi belum ada Pemeriksaan.
  for (const p of programAktifList) {
    const pelaksanaan = getPelaksanaanListByProgram(p.id).filter((x) => x.status === 'Dilaksanakan');
    const pemeriksaan = getPemeriksaanListByProgram(p.id);
    if (pelaksanaan.length > 0 && pemeriksaan.length === 0) {
      const latest = pelaksanaan.reduce((a, b) => (a.tanggal > b.tanggal ? a : b));
      const overdue = daysDiff(latest.tanggal, today);
      if (overdue >= PEMERIKSAAN_OVERDUE_DAYS) {
        items.push({
          id: nextId('peringatan'), level: 'warning', category: 'peringatan', icon: '⚠️',
          title: 'Pemeriksaan Kebuntingan Terlambat',
          subjectLabel: programLabel(p.id),
          message: `Program ${programLabel(p.id)}: sudah ${overdue} hari sejak Pelaksanaan terakhir tanpa Pemeriksaan Kebuntingan.`,
        });
      }
    }
  }

  // Overdue monitoring — Program aktif tanpa Monitoring dalam ambang batas.
  for (const p of programAktifList) {
    const monitoring = getMonitoringListByProgram(p.id);
    if (monitoring.length === 0) continue;
    const latest = monitoring.reduce((a, b) => (a.tanggal > b.tanggal ? a : b));
    const overdue = daysDiff(latest.tanggal, today);
    if (overdue >= MONITORING_OVERDUE_DAYS) {
      items.push({
        id: nextId('peringatan'), level: 'warning', category: 'peringatan', icon: '⏰',
        title: 'Monitoring Terlambat',
        subjectLabel: programLabel(p.id),
        message: `Program ${programLabel(p.id)}: belum ada Monitoring baru sejak ${overdue} hari yang lalu.`,
      });
    }
  }
  // Overdue monitoring — Kebuntingan aktif tanpa Monitoring Kebuntingan dalam ambang batas.
  for (const k of activePregnancies) {
    const monitoring = Object.values(KEBUNTINGAN_MONITORING_DB).filter((m) => m.kebuntinganId === k.id);
    const baseline = monitoring.length > 0
      ? monitoring.reduce((a, b) => (a.tanggal > b.tanggal ? a : b)).tanggal
      : k.createdDate.slice(0, 10);
    const overdue = daysDiff(baseline, today);
    if (overdue >= MONITORING_OVERDUE_DAYS) {
      items.push({
        id: nextId('peringatan'), level: 'warning', category: 'peringatan', icon: '⏰',
        title: 'Monitoring Kebuntingan Terlambat',
        subjectLabel: livestockLabel(k.damId),
        message: `Kebuntingan ${livestockLabel(k.damId)}: belum dipantau selama ${overdue} hari.`,
      });
    }
  }

  // Pregnancy exceeds expected due date.
  for (const k of activePregnancies) {
    const overdue = daysDiff(k.tanggalLahirPerkiraan, today);
    if (overdue > 0) {
      items.push({
        id: nextId('peringatan'), level: 'critical', category: 'peringatan', icon: '🔴',
        title: 'Kebuntingan Melewati Perkiraan Lahir',
        subjectLabel: livestockLabel(k.damId),
        message: `${livestockLabel(k.damId)}: sudah ${overdue} hari melewati perkiraan tanggal lahir (${k.tanggalLahirPerkiraan}).`,
      });
    }
  }

  // Abnormal birth records.
  const abnormalAnak = allAnak.filter((a) => a.jenis !== 'Hidup' || a.kondisiAwal === 'Kritis' || a.kondisiAwal === 'Perlu Penanganan');
  if (abnormalAnak.length > 0) {
    items.push({
      id: nextId('peringatan'), level: 'warning', category: 'peringatan', icon: '⚠️',
      title: 'Catatan Kelahiran Tidak Normal',
      message: `${abnormalAnak.length} catatan anak dengan kondisi tidak normal (Lahir Mati / Mati Setelah Lahir / Kritis / Perlu Penanganan).`,
    });
  }

  // Duplicate active pregnancy — defensive audit (creation flow already blocks this).
  const activeByDam = new Map<string, KebuntinganRecord[]>();
  for (const k of activePregnancies) {
    const list = activeByDam.get(k.damId) ?? [];
    list.push(k);
    activeByDam.set(k.damId, list);
  }
  for (const [damId, list] of activeByDam) {
    if (list.length > 1) {
      items.push({
        id: nextId('peringatan'), level: 'critical', category: 'peringatan', icon: '🔴',
        title: 'Kebuntingan Aktif Ganda',
        subjectLabel: livestockLabel(damId),
        message: `${livestockLabel(damId)} memiliki ${list.length} kebuntingan aktif secara bersamaan — periksa integritas data.`,
      });
    }
  }

  // Missing follow-up after birth — Kelahiran Selesai, ada anak Hidup, belum diregistrasi.
  for (const k of kelahiranSelesai) {
    const anak = getAnakListByKelahiran(k.id).filter((a) => a.jenis === 'Hidup');
    const belum = anak.filter((a) => a.statusRegistrasi === 'Belum Didaftarkan');
    if (belum.length === 0) continue;
    const sinceLahir = daysDiff(k.tanggalLahir, today);
    if (sinceLahir >= BIRTH_FOLLOWUP_DAYS) {
      items.push({
        id: nextId('peringatan'), level: 'warning', category: 'peringatan', icon: '📝',
        title: 'Registrasi Anak Belum Ditindaklanjuti',
        subjectLabel: livestockLabel(k.damId),
        message: `${belum.length} anak dari kelahiran ${livestockLabel(k.damId)} (${sinceLahir} hari lalu) belum didaftarkan sebagai Ternak.`,
      });
    }
  }

  // Delayed weaning — registered offspring past typical weaning age, no active/complete Sapih.
  for (const a of allAnak) {
    if (a.statusRegistrasi !== 'Sudah Didaftarkan' || !a.livestockId) continue;
    const kelahiran = allKelahiran.find((k) => k.id === a.kelahiranId);
    if (!kelahiran) continue;
    const age = daysDiff(kelahiran.tanggalLahir, today);
    if (age < WEANING_DELAY_DAYS) continue;
    const sapihList = allSapih.filter((s) => s.livestockId === a.livestockId);
    const hasActiveOrDone = sapihList.some((s) => s.status === 'Berlangsung' || s.status === 'Selesai');
    if (!hasActiveOrDone) {
      items.push({
        id: nextId('peringatan'), level: 'warning', category: 'peringatan', icon: '⏳',
        title: 'Sapih Tertunda',
        subjectLabel: livestockLabel(a.livestockId),
        message: `${livestockLabel(a.livestockId)}: usia ${age} hari, melewati usia sapih tipikal (${WEANING_DELAY_DAYS} hari) tanpa proses Sapih.`,
      });
    }
  }

  // Data integrity issues surfaced from RP-010 audit.
  if (!auditReport.isValid) {
    items.push({
      id: nextId('peringatan'), level: 'critical', category: 'peringatan', icon: '🔴',
      title: 'Integritas Riwayat Reproduksi Bermasalah',
      message: `${auditReport.issues.length} isu ditemukan pada Riwayat Reproduksi (lihat halaman Riwayat Reproduksi).`,
    });
  }

  // ── AI RECOMMENDATION ────────────────────────────────────────────────────
  // Derived directly from the warnings above — one recommendation per warning category present.
  const warningTitles = new Set(items.filter((i) => i.category === 'peringatan').map((i) => i.title));

  if (warningTitles.has('Pemeriksaan Kebuntingan Terlambat')) {
    items.push({
      id: nextId('rekomendasi'), level: 'info', category: 'rekomendasi', icon: '💡',
      title: 'Jadwalkan Pemeriksaan Kebuntingan',
      message: 'Segera jadwalkan Pemeriksaan Kebuntingan untuk Program yang sudah melewati Pelaksanaan tanpa hasil pemeriksaan.',
    });
  }
  if (warningTitles.has('Monitoring Terlambat') || warningTitles.has('Monitoring Kebuntingan Terlambat')) {
    items.push({
      id: nextId('rekomendasi'), level: 'info', category: 'rekomendasi', icon: '💡',
      title: 'Jadwalkan Monitoring',
      message: 'Lakukan Monitoring rutin pada Program/Kebuntingan yang belum dipantau dalam waktu lama.',
    });
  }
  if (upcomingBirths.length > 0) {
    items.push({
      id: nextId('rekomendasi'), level: 'info', category: 'rekomendasi', icon: '💡',
      title: 'Persiapan Kelahiran',
      message: `Siapkan lokasi dan petugas untuk ${upcomingBirths.length} kebuntingan yang diperkirakan lahir dalam ${UPCOMING_BIRTH_WINDOW_DAYS} hari ke depan.`,
    });
  }
  if (warningTitles.has('Registrasi Anak Belum Ditindaklanjuti')) {
    items.push({
      id: nextId('rekomendasi'), level: 'info', category: 'rekomendasi', icon: '💡',
      title: 'Daftarkan Anak',
      message: 'Segera lakukan Registrasi Anak untuk anak hidup yang belum terdaftar sebagai Ternak.',
    });
  }
  if (warningTitles.has('Sapih Tertunda')) {
    items.push({
      id: nextId('rekomendasi'), level: 'info', category: 'rekomendasi', icon: '💡',
      title: 'Lakukan Sapih',
      message: 'Mulai proses Sapih untuk Ternak yang sudah melewati usia sapih tipikal.',
    });
  }
  if (!auditReport.isValid) {
    items.push({
      id: nextId('rekomendasi'), level: 'info', category: 'rekomendasi', icon: '💡',
      title: 'Tinjau Riwayat Reproduksi',
      message: 'Periksa halaman Riwayat Reproduksi untuk menelusuri isu integritas data yang ditemukan.',
    });
  }

  // ── AI PREDICTION ────────────────────────────────────────────────────────

  // Expected birth date — soonest first.
  const sortedDue = [...activePregnancies].sort((a, b) => (a.tanggalLahirPerkiraan < b.tanggalLahirPerkiraan ? -1 : 1));
  if (sortedDue.length > 0) {
    const next = sortedDue[0];
    const d = daysDiff(today, next.tanggalLahirPerkiraan);
    items.push({
      id: nextId('prediksi'), level: 'info', category: 'prediksi', icon: '📅',
      title: 'Estimasi Kelahiran Berikutnya',
      subjectLabel: livestockLabel(next.damId),
      message: d >= 0
        ? `${livestockLabel(next.damId)} diperkirakan lahir dalam ${d} hari (${next.tanggalLahirPerkiraan}). Informasional, bukan kepastian.`
        : `${livestockLabel(next.damId)} sudah melewati perkiraan tanggal lahir (${next.tanggalLahirPerkiraan}).`,
    });
  }

  // Upcoming weaning schedule — registered offspring approaching typical weaning age.
  const upcomingWeaning = allAnak
    .filter((a) => a.statusRegistrasi === 'Sudah Didaftarkan' && a.livestockId)
    .map((a) => {
      const kelahiran = allKelahiran.find((k) => k.id === a.kelahiranId);
      if (!kelahiran) return null;
      const age = daysDiff(kelahiran.tanggalLahir, today);
      const hasSapih = allSapih.some((s) => s.livestockId === a.livestockId && (s.status === 'Berlangsung' || s.status === 'Selesai'));
      if (hasSapih) return null;
      return { livestockId: a.livestockId as string, remaining: WEANING_DELAY_DAYS - age };
    })
    .filter((x): x is { livestockId: string; remaining: number } => x !== null && x.remaining >= 0 && x.remaining <= 14)
    .sort((a, b) => a.remaining - b.remaining);
  if (upcomingWeaning.length > 0) {
    const next = upcomingWeaning[0];
    items.push({
      id: nextId('prediksi'), level: 'info', category: 'prediksi', icon: '📅',
      title: 'Estimasi Jadwal Sapih',
      subjectLabel: livestockLabel(next.livestockId),
      message: `${upcomingWeaning.length} Ternak mendekati usia sapih tipikal; terdekat: ${livestockLabel(next.livestockId)} dalam ≈${next.remaining} hari. Informasional.`,
    });
  }

  // Active reproduction workload gauge.
  const workload = programAktifList.length + activePregnancies.length + allKelahiran.filter((k) => k.status === 'Berlangsung').length;
  const workloadLabel = workload === 0 ? 'Tidak Ada' : workload <= 3 ? 'Rendah' : workload <= 8 ? 'Sedang' : 'Tinggi';
  items.push({
    id: nextId('prediksi'), level: 'info', category: 'prediksi', icon: '📦',
    title: 'Beban Kerja Reproduksi Aktif',
    message: `Beban kerja saat ini: ${workloadLabel} (${workload} aktivitas aktif — Program berjalan, Kebuntingan aktif, Kelahiran berlangsung).`,
  });

  // ── Sort: critical → warning → info ─────────────────────────────────────
  const levelRank: Record<InsightLevel, number> = { critical: 0, warning: 1, info: 2 };
  items.sort((a, b) => levelRank[a.level] - levelRank[b.level]);

  return {
    analyzedAt,
    dataSource: DATA_SOURCE,
    confidenceStatus: 'Rule-Based',
    version: VERSION,
    summary,
    items,
  };
}
