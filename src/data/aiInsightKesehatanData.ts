/**
 * aiInsightKesehatanData.ts  (KH-009)
 * ─────────────────────────────────────────────────────────────────
 * Rule-based AI Insight Engine untuk Modul Kesehatan Hewan.
 *
 * Membaca seluruh data KH-002 hingga KH-007 secara read-only.
 * TIDAK mengubah, menambah, atau menghapus data apapun.
 * TIDAK menggunakan LLM — seluruh analisis berbasis aturan deterministik.
 *
 * Sections:
 *   1. Types
 *   2. Helper utilities
 *   3. Rule implementations
 *   4. Main engine: generateInsights()
 */

import { TINDAKAN_SESI_DB, getTindakanItemsBySesi } from './tindakanKesehatanData';
import { getPemeriksaan }                            from './pemeriksaanKesehatanData';
import { getDiagnosa }                               from './diagnosaKesehatanData';
import {
  getPengobatanSesiByTindakan,
  getPengobatanItemsBySesi,
} from './pengobatanKesehatanData';
import { RIWAYAT_KESEHATAN_RECORDS }                  from './riwayatKesehatanData';
import { getKontrolBySesi, getKasusStatus, type StatusKasus } from './kontrolKesehatanData';
import { getLivestock }                               from './livestockData';
import { getBatch }                                   from './batchData';

// ═══════════════════════════════════════════════════════════════════
// 1. Types
// ═══════════════════════════════════════════════════════════════════

export type InsightLevel    = 'info' | 'warning' | 'critical';
export type InsightCategory = 'ringkasan' | 'perkembangan' | 'rekomendasi' | 'peringatan' | 'prediksi';

export interface InsightItem {
  id:            string;
  level:         InsightLevel;
  category:      InsightCategory;
  icon:          string;
  title:         string;
  message:       string;
  subjectLabel?: string;
  /** Forward-compatible LLM-ready field — not populated by rule-based engine. */
  evidence?:     string;
  /** Forward-compatible LLM-ready field — not populated by rule-based engine. */
  reasoning?:    string;
}

export interface PrediksiObatItem {
  tindakanSesiId: string;
  subjectLabel:   string;
  namaProduk:     string;
  namaGenerik:    string;
  /** Estimated remaining treatment days. null = unable to compute. Negative = past due. */
  sisaHari:       number | null;
}

export type OverallKondisi = 'Membaik' | 'Stabil' | 'Memburuk' | 'Belum Cukup Data';

// ─── AI Constitution constants (03_AI_CONSTITUTION.md §Timestamp) ────────────

const DATA_SOURCE = [
  'TINDAKAN_SESI_DB',
  'RIWAYAT_KESEHATAN_RECORDS',
  'pemeriksaanKesehatanData',
  'pengobatanKesehatanData',
  'kontrolKesehatanData',
];

const VERSION = 'Rule-Based v1 (KH-009)';

// ─────────────────────────────────────────────────────────────────────────────

export interface InsightReport {
  analyzedAt:       string;    // ISO timestamp — AI Constitution: Analysis Time
  dataSource:       string[];  // AI Constitution: Data Source
  confidenceStatus: string;    // AI Constitution: Confidence Status (Rule-Based)
  version:          string;    // AI Constitution: Version
  totalKasus:       number;
  aktivKasus:       number;
  selesaiKasus:     number;
  ditutupKasus:     number;
  kondisi:          OverallKondisi;
  kondisiSummary:   string;
  /** All insight items, sorted critical→warning→info */
  items:            InsightItem[];
  prediksiObat:     PrediksiObatItem[];
}

// ═══════════════════════════════════════════════════════════════════
// 2. Helper utilities
// ═══════════════════════════════════════════════════════════════════

/** Days from `fromYMD` (YYYY-MM-DD) to `toYMD`. Positive = toYMD is later. */
function daysDiff(fromYMD: string, toYMD: string): number {
  return Math.round((Date.parse(toYMD) - Date.parse(fromYMD)) / 86_400_000);
}

/** Today as YYYY-MM-DD */
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Ordered score for nafsu makan / aktivitas strings */
const CLINICAL_SCORE: Record<string, number> = {
  'Normal':    2,
  'Menurun':   1,
  'Tidak Ada': 0,
};

/** Keywords that flag an obat as antibiotic. */
const ANTIBIOTIC_KEYWORDS = [
  'amoxicillin', 'oxytetracycline', 'tetracycline', 'penicillin',
  'enrofloxacin', 'streptomycin', 'ampicillin', 'doxycycline',
  'gentamicin', 'chloramphenicol', 'sulfamethoxazole', 'trimethoprim',
  'florfenicol', 'tylosin', 'erythromycin', 'lincomycin', 'spectinomycin',
  'antibiotik', 'antibiotic',
];

function isAntibiotic(namaGenerik: string): boolean {
  const lower = namaGenerik.toLowerCase();
  return ANTIBIOTIC_KEYWORDS.some((kw) => lower.includes(kw));
}

/** Parse "N hari" / "N days" from lamaPemberian string. Returns null if unrecognised. */
function parseLamaPemberian(s: string): number | null {
  const m = s.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

/** Resolve subject display label from a tindakanSesi id. */
function resolveSubjectLabel(tindakanSesiId: string): string {
  const sesi = TINDAKAN_SESI_DB.find((s) => s.id === tindakanSesiId);
  if (!sesi) return 'Ternak';
  const p = getPemeriksaan(sesi.pemeriksaanId);
  if (!p) return 'Ternak';
  if (p.mode === 'individu' && p.livestockId) {
    const lv = getLivestock(p.livestockId);
    return lv.name ?? lv.id;
  }
  if (p.mode === 'batch' && p.batchId) {
    const b = getBatch(p.batchId);
    return b?.label ?? b?.name ?? `Batch ${p.batchId.slice(-4)}`;
  }
  return 'Ternak';
}

// ═══════════════════════════════════════════════════════════════════
// 3. Main engine
// ═══════════════════════════════════════════════════════════════════

export function generateInsights(): InsightReport {
  const today       = todayStr();
  const analyzedAt  = new Date().toISOString();
  const items:          InsightItem[]      = [];
  const prediksiObat:   PrediksiObatItem[] = [];

  // ── Case statistics ─────────────────────────────────────────────
  const allSesi = TINDAKAN_SESI_DB;
  let aktivKasus = 0, selesaiKasus = 0, ditutupKasus = 0;
  const kasusStatusMap = new Map<string, StatusKasus>();

  for (const sesi of allSesi) {
    const status = getKasusStatus(sesi.id);
    kasusStatusMap.set(sesi.id, status);
    if (status === 'Aktif')   aktivKasus++;
    if (status === 'Selesai') selesaiKasus++;
    if (status === 'Ditutup') ditutupKasus++;
  }
  const totalKasus = allSesi.length;

  // ── RULE R-01: Ringkasan jumlah kasus ───────────────────────────
  if (totalKasus > 0) {
    const level: InsightLevel = aktivKasus === 0 ? 'info' : (aktivKasus >= 3 ? 'warning' : 'info');
    items.push({
      id: 'r01-ringkasan',
      level,
      category: 'ringkasan',
      icon: '📊',
      title: 'Ringkasan Kasus',
      message: `Total ${totalKasus} kasus: ${aktivKasus} aktif, ${selesaiKasus} selesai, ${ditutupKasus} ditutup.`,
    });
  }

  // ── RULE P-01: Jadwal kontrol terlewat ──────────────────────────
  for (const sesi of allSesi) {
    if (kasusStatusMap.get(sesi.id) !== 'Aktif') continue;
    const kontrolList = getKontrolBySesi(sesi.id);
    if (kontrolList.length === 0) continue;
    const last = kontrolList[0]; // newest first
    if (!last.jadwalKontrol) continue;
    if (last.jadwalKontrol.tanggal < today) {
      const daysLate = daysDiff(last.jadwalKontrol.tanggal, today);
      const subjectLabel = resolveSubjectLabel(sesi.id);
      items.push({
        id: `p01-missed-${sesi.id}`,
        level: 'critical',
        category: 'peringatan',
        icon: '🚨',
        title: 'Jadwal Kontrol Terlewat',
        message: `${subjectLabel}: jadwal kontrol ${daysLate} hari yang lalu terlewat. Segera lakukan pemeriksaan ulang.`,
        subjectLabel,
      });
    }
  }

  // ── RULE P-02: Pengobatan terlalu lama ──────────────────────────
  for (const sesi of allSesi) {
    if (kasusStatusMap.get(sesi.id) !== 'Aktif') continue;
    const p = getPemeriksaan(sesi.pemeriksaanId);
    if (!p) continue;
    const daysActive = daysDiff(p.tanggal, today);
    if (daysActive >= 14) {
      const subjectLabel = resolveSubjectLabel(sesi.id);
      items.push({
        id: `p02-long-${sesi.id}`,
        level: daysActive >= 21 ? 'critical' : 'warning',
        category: 'peringatan',
        icon: '⏱️',
        title: 'Pengobatan Terlalu Lama',
        message: `${subjectLabel} sudah ${daysActive} hari dalam perawatan. Pertimbangkan evaluasi diagnosa atau konsultasi dokter hewan.`,
        subjectLabel,
      });
    }
  }

  // ── RULE P-03: Penggunaan antibiotik berulang ───────────────────
  const abBySubject = new Map<string, { count: number; label: string }>();
  for (const r of RIWAYAT_KESEHATAN_RECORDS) {
    if (!isAntibiotic(r.namaGenerik)) continue;
    const key = r.livestockId ?? r.batchId ?? '?';
    if (!abBySubject.has(key)) {
      let label = 'Ternak';
      if (r.livestockId) {
        const lv = getLivestock(r.livestockId);
        label = lv.name ?? lv.id;
      } else if (r.batchId) {
        const b = getBatch(r.batchId);
        label = b?.label ?? b?.name ?? `Batch ${r.batchId.slice(-4)}`;
      }
      abBySubject.set(key, { count: 0, label });
    }
    const entry = abBySubject.get(key)!;
    entry.count++;
  }
  for (const [, entry] of abBySubject) {
    if (entry.count >= 3) {
      items.push({
        id: `p03-ab-${entry.label}`,
        level: 'warning',
        category: 'peringatan',
        icon: '💊',
        title: 'Penggunaan Antibiotik Berulang',
        message: `${entry.label} menerima antibiotik ${entry.count}× dalam riwayat. Pantau potensi resistensi dan konsultasi dokter hewan.`,
        subjectLabel: entry.label,
      });
    }
  }

  // ── RULE P-04: Belum ada kontrol (> 7 hari sejak pemeriksaan) ───
  for (const sesi of allSesi) {
    if (kasusStatusMap.get(sesi.id) !== 'Aktif') continue;
    const p = getPemeriksaan(sesi.pemeriksaanId);
    if (!p) continue;
    const kontrolList = getKontrolBySesi(sesi.id);
    if (kontrolList.length > 0) continue;         // has kontrol already
    const daysSince = daysDiff(p.tanggal, today);
    if (daysSince >= 7) {
      const subjectLabel = resolveSubjectLabel(sesi.id);
      items.push({
        id: `p04-nocontrol-${sesi.id}`,
        level: 'warning',
        category: 'peringatan',
        icon: '📋',
        title: 'Belum Ada Kontrol',
        message: `${subjectLabel}: ${daysSince} hari sejak pemeriksaan tanpa kontrol. Segera lakukan kontrol kesehatan.`,
        subjectLabel,
      });
    }
  }

  // ── RULE P-05: Perlu isolasi ─────────────────────────────────────
  for (const sesi of allSesi) {
    if (kasusStatusMap.get(sesi.id) !== 'Aktif') continue;
    const kontrolList = getKontrolBySesi(sesi.id);
    if (kontrolList.length === 0) continue;
    if (kontrolList[0].statusHasil !== 'Perlu Isolasi') continue;
    const subjectLabel = resolveSubjectLabel(sesi.id);
    items.push({
      id: `p05-isolasi-${sesi.id}`,
      level: 'critical',
      category: 'peringatan',
      icon: '🚧',
      title: 'Perlu Isolasi',
      message: `${subjectLabel} diindikasikan perlu isolasi pada kontrol terakhir. Segera pisahkan dari populasi lain.`,
      subjectLabel,
    });
  }

  // ── RULE K-01: Perkembangan nafsu makan ─────────────────────────
  let improvingCount = 0;
  let worseningCount = 0;

  for (const sesi of allSesi) {
    const p = getPemeriksaan(sesi.pemeriksaanId);
    if (!p) continue;
    const kontrolList = getKontrolBySesi(sesi.id);
    if (kontrolList.length === 0) continue;
    const latestKontrol = kontrolList[0];
    const subjectLabel  = resolveSubjectLabel(sesi.id);

    // Nafsu makan
    const baseNafsu   = CLINICAL_SCORE[p.nafsuMakan]           ?? -1;
    const latestNafsu = CLINICAL_SCORE[latestKontrol.nafsuMakan] ?? -1;
    if (baseNafsu >= 0 && latestNafsu >= 0 && latestNafsu !== baseNafsu) {
      if (latestNafsu > baseNafsu) {
        improvingCount++;
        items.push({
          id: `k01-nafsu-up-${sesi.id}`,
          level: 'info',
          category: 'perkembangan',
          icon: '🌱',
          title: 'Nafsu Makan Meningkat',
          message: `${subjectLabel}: nafsu makan membaik dari "${p.nafsuMakan}" → "${latestKontrol.nafsuMakan}".`,
          subjectLabel,
        });
      } else if (latestNafsu < baseNafsu && kasusStatusMap.get(sesi.id) === 'Aktif') {
        worseningCount++;
        items.push({
          id: `k01-nafsu-down-${sesi.id}`,
          level: 'warning',
          category: 'perkembangan',
          icon: '📉',
          title: 'Nafsu Makan Menurun',
          message: `${subjectLabel}: nafsu makan turun dari "${p.nafsuMakan}" → "${latestKontrol.nafsuMakan}". Perlu perhatian.`,
          subjectLabel,
        });
      }
    }

    // Aktivitas
    const baseAkt   = CLINICAL_SCORE[p.aktivitas]             ?? -1;
    const latestAkt = CLINICAL_SCORE[latestKontrol.aktivitas] ?? -1;
    if (baseAkt >= 0 && latestAkt >= 0 && latestAkt !== baseAkt) {
      if (latestAkt > baseAkt) {
        improvingCount++;
        items.push({
          id: `k01-akt-up-${sesi.id}`,
          level: 'info',
          category: 'perkembangan',
          icon: '⚡',
          title: 'Aktivitas Meningkat',
          message: `${subjectLabel}: aktivitas membaik dari "${p.aktivitas}" → "${latestKontrol.aktivitas}".`,
          subjectLabel,
        });
      } else if (latestAkt < baseAkt && kasusStatusMap.get(sesi.id) === 'Aktif') {
        worseningCount++;
        items.push({
          id: `k01-akt-down-${sesi.id}`,
          level: 'warning',
          category: 'perkembangan',
          icon: '⚠️',
          title: 'Aktivitas Menurun',
          message: `${subjectLabel}: aktivitas turun dari "${p.aktivitas}" → "${latestKontrol.aktivitas}". Perlu perhatian.`,
          subjectLabel,
        });
      }
    }

    // Bobot
    const baseBobot   = parseFloat(p.bobot);
    const latestBobot = parseFloat(latestKontrol.bobot);
    if (!isNaN(baseBobot) && !isNaN(latestBobot) && baseBobot > 0) {
      const diff = latestBobot - baseBobot;
      const pct  = ((diff / baseBobot) * 100).toFixed(1);
      if (diff > 0.5) {
        improvingCount++;
        items.push({
          id: `k01-bobot-up-${sesi.id}`,
          level: 'info',
          category: 'perkembangan',
          icon: '📈',
          title: 'Bobot Meningkat',
          message: `${subjectLabel}: bobot naik ${diff.toFixed(1)} kg (+${pct}%) selama perawatan.`,
          subjectLabel,
        });
      } else if (diff < -0.5 && kasusStatusMap.get(sesi.id) === 'Aktif') {
        worseningCount++;
        items.push({
          id: `k01-bobot-down-${sesi.id}`,
          level: 'warning',
          category: 'perkembangan',
          icon: '⚖️',
          title: 'Bobot Menurun',
          message: `${subjectLabel}: bobot turun ${Math.abs(diff).toFixed(1)} kg (${pct}%) selama perawatan. Pantau asupan pakan.`,
          subjectLabel,
        });
      }
    }

    // Suhu tubuh (normal range sapi/kambing/domba: 37.5–39.5°C)
    const baseSuhu   = parseFloat(p.suhuTubuh);
    const latestSuhu = parseFloat(latestKontrol.suhuTubuh);
    if (!isNaN(baseSuhu) && !isNaN(latestSuhu)) {
      const wasAbnormal    = baseSuhu > 39.5 || baseSuhu < 37.5;
      const nowNormal      = latestSuhu >= 37.5 && latestSuhu <= 39.5;
      const stillCritical  = latestSuhu > 40.5 || latestSuhu < 37.0;
      if (wasAbnormal && nowNormal) {
        improvingCount++;
        items.push({
          id: `k01-suhu-norm-${sesi.id}`,
          level: 'info',
          category: 'perkembangan',
          icon: '🌡️',
          title: 'Suhu Kembali Normal',
          message: `${subjectLabel}: suhu tubuh normal ${latestSuhu}°C (sebelumnya ${baseSuhu}°C).`,
          subjectLabel,
        });
      } else if (stillCritical && kasusStatusMap.get(sesi.id) === 'Aktif') {
        worseningCount++;
        items.push({
          id: `k01-suhu-abn-${sesi.id}`,
          level: 'warning',
          category: 'perkembangan',
          icon: '🌡️',
          title: 'Suhu Masih Tidak Normal',
          message: `${subjectLabel}: suhu ${latestSuhu}°C masih di luar rentang normal. Pertimbangkan evaluasi lebih lanjut.`,
          subjectLabel,
        });
      }
    }
  }

  // ── RULE R-01: Rekomendasi konsultasi dokter ────────────────────
  if (worseningCount >= 2 && aktivKasus > 0) {
    items.push({
      id: 'r01-vet',
      level: 'warning',
      category: 'rekomendasi',
      icon: '👨‍⚕️',
      title: 'Konsultasi Dokter Hewan',
      message: `Terdapat ${worseningCount} indikasi kondisi memburuk. Pertimbangkan konsultasi dokter hewan untuk evaluasi komprehensif.`,
    });
  }

  // ── RULE R-02: Rekomendasi lanjut observasi ─────────────────────
  if (aktivKasus > 0 && improvingCount > 0 && worseningCount === 0) {
    items.push({
      id: 'r02-observe',
      level: 'info',
      category: 'rekomendasi',
      icon: '👁️',
      title: 'Lanjut Observasi',
      message: `Tren perkembangan positif terdeteksi. Lanjutkan observasi sesuai jadwal kontrol yang telah ditetapkan.`,
    });
  }

  // ── RULE R-03: Evaluasi diagnosa untuk kasus lama ───────────────
  for (const sesi of allSesi) {
    if (kasusStatusMap.get(sesi.id) !== 'Aktif') continue;
    const p = getPemeriksaan(sesi.pemeriksaanId);
    if (!p) continue;
    const daysActive  = daysDiff(p.tanggal, today);
    if (daysActive < 10) continue;
    const kontrolList = getKontrolBySesi(sesi.id);
    if (kontrolList.length === 0) continue;
    if (kontrolList[0].statusHasil !== 'Masih Perawatan') continue;
    const subjectLabel = resolveSubjectLabel(sesi.id);
    items.push({
      id: `r03-eval-${sesi.id}`,
      level: 'info',
      category: 'rekomendasi',
      icon: '🔍',
      title: 'Evaluasi Diagnosa',
      message: `${subjectLabel}: masih dalam perawatan setelah ${daysActive} hari. Pertimbangkan evaluasi ulang diagnosa.`,
      subjectLabel,
    });
  }

  // ── RULE PRED-01: Prediksi kebutuhan obat ───────────────────────
  for (const sesi of allSesi) {
    if (kasusStatusMap.get(sesi.id) !== 'Aktif') continue;
    const p = getPemeriksaan(sesi.pemeriksaanId);
    if (!p) continue;
    const pengobatanSesi = getPengobatanSesiByTindakan(sesi.id);
    if (!pengobatanSesi) continue;
    const pengobatanItems = getPengobatanItemsBySesi(pengobatanSesi.id);
    const subjectLabel    = resolveSubjectLabel(sesi.id);

    for (const item of pengobatanItems) {
      const lamaDays  = parseLamaPemberian(item.lamaPemberian);
      const sisaHari  = lamaDays !== null
        ? lamaDays - daysDiff(p.tanggal, today)
        : null;
      prediksiObat.push({
        tindakanSesiId: sesi.id,
        subjectLabel,
        namaProduk:  item.namaProduk,
        namaGenerik: item.namaGenerik,
        sisaHari,
      });
    }
  }

  // Prediksi insight items
  if (prediksiObat.length > 0) {
    const overdue    = prediksiObat.filter((x) => x.sisaHari !== null && x.sisaHari < 0);
    const nearlyDone = prediksiObat.filter((x) => x.sisaHari !== null && x.sisaHari >= 0 && x.sisaHari <= 3);
    const onTrack    = prediksiObat.filter((x) => x.sisaHari === null || x.sisaHari > 3);

    if (overdue.length > 0) {
      items.push({
        id: 'pred-overdue',
        level: 'warning',
        category: 'prediksi',
        icon: '📦',
        title: 'Estimasi Pengobatan Melewati Jadwal',
        message: `${overdue.length} item obat melebihi estimasi durasi pengobatan. Tinjau apakah perlu perpanjangan atau penghentian.`,
      });
    }
    if (nearlyDone.length > 0) {
      items.push({
        id: 'pred-nearly',
        level: 'info',
        category: 'prediksi',
        icon: '📦',
        title: 'Estimasi Obat Akan Habis',
        message: `${nearlyDone.length} item obat diperkirakan habis dalam ≤3 hari. Siapkan stok jika perpanjangan diperlukan.`,
      });
    }
    if (onTrack.length > 0 && overdue.length === 0) {
      items.push({
        id: 'pred-ok',
        level: 'info',
        category: 'prediksi',
        icon: '✅',
        title: 'Estimasi Kebutuhan Obat',
        message: `${onTrack.length} item obat dalam treatment aktif — stok diperkirakan cukup untuk periode pengobatan berjalan.`,
      });
    }
  }

  // ── Overall Kondisi ─────────────────────────────────────────────
  let kondisi: OverallKondisi;
  let kondisiSummary: string;

  if (totalKasus === 0) {
    kondisi        = 'Belum Cukup Data';
    kondisiSummary = 'Belum ada kasus kesehatan tercatat di modul ini.';
  } else if (aktivKasus === 0) {
    kondisi        = 'Stabil';
    kondisiSummary = 'Tidak ada kasus aktif. Seluruh ternak dalam kondisi terpantau normal.';
  } else {
    const criticalCount = items.filter((i) => i.level === 'critical').length;
    if (criticalCount > 0 || worseningCount > improvingCount) {
      kondisi        = 'Memburuk';
      kondisiSummary = `Terdapat ${criticalCount} peringatan kritis. Diperlukan tindakan segera.`;
    } else if (improvingCount > worseningCount) {
      kondisi        = 'Membaik';
      kondisiSummary = `${improvingCount} indikasi perkembangan positif terdeteksi pada kasus aktif.`;
    } else {
      kondisi        = 'Stabil';
      kondisiSummary = `${aktivKasus} kasus aktif dalam pantauan. Kondisi relatif stabil.`;
    }
  }

  // Sort: critical → warning → info
  items.sort((a, b) => {
    const order: Record<InsightLevel, number> = { critical: 0, warning: 1, info: 2 };
    const catOrder: Record<InsightCategory, number> = {
      peringatan:   0,
      rekomendasi:  1,
      perkembangan: 2,
      ringkasan:    3,
      prediksi:     4,
    };
    const lvDiff = order[a.level] - order[b.level];
    return lvDiff !== 0 ? lvDiff : catOrder[a.category] - catOrder[b.category];
  });

  return {
    analyzedAt,
    dataSource:       DATA_SOURCE,
    confidenceStatus: 'Rule-Based',
    version:          VERSION,
    totalKasus,
    aktivKasus,
    selesaiKasus,
    ditutupKasus,
    kondisi,
    kondisiSummary,
    items,
    prediksiObat,
  };
}
