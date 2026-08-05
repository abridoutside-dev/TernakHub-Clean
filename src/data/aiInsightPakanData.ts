/**
 * aiInsightPakanData.ts  (LP-006)
 * ─────────────────────────────────────────────────────────────────────────────
 * Rule-based AI Insight Engine untuk Modul Pemberian Pakan.
 *
 * Membaca data dari LP-002, LP-003, LP-004, LP-005 (riwayat & jadwal),
 * Stok Pakan, dan Master Pakan secara read-only.
 * TIDAK mengubah, menambah, atau menghapus data apapun.
 * Seluruh analisis berbasis aturan deterministik.
 *
 * Sections:
 *   1. Types
 *   2. Helper utilities
 *   3. Rule engine: generatePakanInsights()
 */

import { getPemberianPakanList, type PemberianPakanRecord } from './pemberianPakanData';
import { getJadwalList, getEffectiveStatus }                 from './jadwalPemberianPakanData';
import { getInventarisList }                                  from './stokInventarisData';
import { MASTER_PAKAN_DB }                                   from './masterPakanData';

// ─── AI Constitution metadata constants ──────────────────────────────────────
// Per 03_AI_CONSTITUTION.md: every AI analysis must carry Analysis Time,
// Data Source, and Version. Added in CP-SYNC-001 to reach full compliance
// (Pemberian Pakan was the only module with analyzedAt but missing the other two).
const DATA_SOURCE: string[] = [
  'Pemberian Pakan Registry (pemberianPakanData.ts)',
  'Jadwal Pemberian Pakan (jadwalPemberianPakanData.ts)',
  'Stok Inventaris (stokInventarisData.ts)',
  'Master Pakan (masterPakanData.ts)',
];

const VERSION = 'Rule-Based v1';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Types
// ═══════════════════════════════════════════════════════════════════════════════

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
}

export type KondisiPakan =
  | 'Normal'
  | 'Meningkat'
  | 'Menurun'
  | 'Tidak Konsisten'
  | 'Belum Cukup Data';

export interface PrediksiStokItem {
  inventarisId:  string;
  nama:          string;
  satuan:        string;
  currentStock:  number;
  avgDailyUsage: number;
  /** Estimated days remaining based on avg daily usage. null = no recent usage. */
  estHabis:      number | null;
}

export interface NutrisiEstimate {
  /** Average daily dry-matter intake (kg DM/day) from last-7d confirmed feeds with nutrisi data */
  avgDailyBK:    number;
  /** Average daily crude-protein intake (kg/day, DM basis) */
  avgDailyPK:    number;
  /** Average daily TDN intake (kg/day, DM basis) */
  avgDailyTDN:   number;
  /** Fraction of item-occurrences that had masterPakanUuid nutrisi data */
  coverageRatio: number;
}

export interface PakanInsightReport {
  analyzedAt:       string;    // ISO timestamp — AI Constitution: Analysis Time
  dataSource:       string[];  // AI Constitution: Data Source
  confidenceStatus: string;    // AI Constitution: Confidence Status (Rule-Based)
  version:          string;    // AI Constitution: Version
  kondisi:          KondisiPakan;
  kondisiSummary:   string;
  totalSesi:        number;
  totalSelesai:     number;
  sesiHariIni:      number;
  /** All insight items sorted critical → warning → info */
  items:            InsightItem[];
  prediksiStok:     PrediksiStokItem[];
  nutrisiEstimate:  NutrisiEstimate | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Helper utilities
// ═══════════════════════════════════════════════════════════════════════════════

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Days from fromIso to toIso (positive = toIso is later). */
function daysDiff(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 86_400_000);
}

/** ISO date for N days before today. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * Convert a pakan quantity to kilograms.
 * Returns 0 for volumetric or unrecognised units (they're skipped in kg analysis).
 */
function toKg(jumlah: number, satuan: string): number {
  switch (satuan.toLowerCase().trim()) {
    case 'kg':      return jumlah;
    case 'g':
    case 'gram':    return jumlah / 1000;
    case 'ton':     return jumlah * 1_000;
    case 'kwintal':
    case 'kw':      return jumlah * 100;
    default:        return 0; // Liter, ml, sachet, dll — skip
  }
}

/** Format number with 1 decimal if fractional, else integer. */
function fmt1(n: number): string {
  return Number.isFinite(n) ? (n % 1 === 0 ? String(n) : n.toFixed(1)) : '—';
}

/** Sum total Kg consumed across all items in a set of records. */
function sumKgRecords(recs: PemberianPakanRecord[]): number {
  let total = 0;
  for (const r of recs) {
    for (const item of r.items) {
      total += toKg(item.jumlah, item.satuan);
    }
  }
  return total;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Main engine
// ═══════════════════════════════════════════════════════════════════════════════

export function generatePakanInsights(): PakanInsightReport {
  const today      = todayStr();
  const analyzedAt = new Date().toISOString();
  const items: InsightItem[] = [];

  // ── Load data ─────────────────────────────────────────────────────────────
  const allRecords  = getPemberianPakanList();   // newest first
  const selesaiRecs = allRecords.filter((r) => r.status === 'Pemberian Pakan Selesai');
  const hariIniRecs = allRecords.filter((r) => r.tanggal === today);
  const allJadwal   = getJadwalList();
  const inventaris  = getInventarisList();

  const totalSesi    = allRecords.length;
  const totalSelesai = selesaiRecs.length;
  const sesiHariIni  = hariIniRecs.length;

  // Time windows
  const startLast7  = daysAgo(6);   // 7-day:  today-6 → today
  const startPrev7  = daysAgo(13);  // prev 7: today-13 → today-7
  const endPrev7    = daysAgo(7);
  const startLast14 = daysAgo(13);  // 14-day window for usage estimation

  const last7Recs   = selesaiRecs.filter((r) => r.tanggal >= startLast7);
  const prev7Recs   = selesaiRecs.filter((r) => r.tanggal >= startPrev7 && r.tanggal <= endPrev7);
  const last14Recs  = selesaiRecs.filter((r) => r.tanggal >= startLast14);

  // ── RULE R-01: Ringkasan global ──────────────────────────────────────────
  if (totalSesi > 0) {
    const pendingCount = totalSesi - totalSelesai;
    items.push({
      id: 'r01-ringkasan',
      level: 'info',
      category: 'ringkasan',
      icon: '📊',
      title: 'Ringkasan Pemberian Pakan',
      message:
        `Total ${totalSesi} catatan: ${totalSelesai} selesai, ${pendingCount} menunggu proses.` +
        (sesiHariIni > 0 ? ` Hari ini: ${sesiHariIni}× pemberian.` : ''),
    });
  }

  // ── RULE W-01: Jadwal terlewat ───────────────────────────────────────────
  const jadwalTerlewat = allJadwal.filter((j) => getEffectiveStatus(j, today) === 'Terlewat');
  if (jadwalTerlewat.length > 0) {
    const level: InsightLevel = jadwalTerlewat.length >= 3 ? 'critical' : 'warning';
    items.push({
      id: 'w01-jadwal-terlewat',
      level,
      category: 'peringatan',
      icon: '⏰',
      title: 'Jadwal Pemberian Terlewat',
      message:
        `${jadwalTerlewat.length} jadwal pemberian pakan terlewat tanpa dilaksanakan. ` +
        `Segera periksa dan laksanakan jadwal yang tertunda untuk menjaga konsistensi pemberian.`,
    });
  }

  // ── RULE W-02 & W-03: Stok habis / menipis ──────────────────────────────
  const habisAll   = inventaris.filter((i) => i.status === 'Habis');
  const menipisAll = inventaris.filter((i) => i.status === 'Menipis');

  if (habisAll.length > 0) {
    items.push({
      id: 'w02-stok-habis',
      level: 'critical',
      category: 'peringatan',
      icon: '🚨',
      title: 'Stok Pakan Habis',
      message:
        `${habisAll.length} item stok pakan sudah habis: ` +
        habisAll.slice(0, 3).map((i) => i.nama).join(', ') +
        (habisAll.length > 3 ? ` +${habisAll.length - 3} lainnya` : '') +
        '. Segera lakukan pengisian stok.',
    });
  }

  if (menipisAll.length > 0) {
    items.push({
      id: 'w03-stok-menipis',
      level: 'warning',
      category: 'peringatan',
      icon: '⚠️',
      title: 'Stok Pakan Menipis',
      message:
        `${menipisAll.length} item stok mendekati batas minimum: ` +
        menipisAll.slice(0, 3).map((i) => `${i.nama} (${i.jumlahStok} ${i.satuan})`).join(', ') +
        (menipisAll.length > 3 ? ` +${menipisAll.length - 3} lainnya` : '') +
        '. Pertimbangkan pengisian stok segera.',
    });
  }

  // ── Consumption trend (used by multiple rules) ───────────────────────────
  const kgLast7 = sumKgRecords(last7Recs);
  const kgPrev7 = sumKgRecords(prev7Recs);
  let consumptionTrendPct: number | null = null;
  if (kgPrev7 > 0) {
    consumptionTrendPct = ((kgLast7 - kgPrev7) / kgPrev7) * 100;
  }

  // ── RULE C-02: Tren konsumsi 7 hari ─────────────────────────────────────
  if (last7Recs.length > 0 && kgLast7 > 0) {
    if (consumptionTrendPct !== null) {
      if (consumptionTrendPct >= 30) {
        items.push({
          id: 'c02-trend-naik',
          level: 'info',
          category: 'perkembangan',
          icon: '📈',
          title: 'Konsumsi Pakan Meningkat',
          message:
            `Total konsumsi 7 hari terakhir ${fmt1(kgLast7)} Kg — meningkat ` +
            `${fmt1(consumptionTrendPct)}% dibanding 7 hari sebelumnya (${fmt1(kgPrev7)} Kg).`,
        });
      } else if (consumptionTrendPct <= -30) {
        items.push({
          id: 'c02-trend-turun',
          level: consumptionTrendPct <= -50 ? 'critical' : 'warning',
          category: 'perkembangan',
          icon: '📉',
          title: 'Konsumsi Pakan Menurun',
          message:
            `Total konsumsi 7 hari terakhir ${fmt1(kgLast7)} Kg — turun ` +
            `${fmt1(Math.abs(consumptionTrendPct))}% dibanding 7 hari sebelumnya (${fmt1(kgPrev7)} Kg).`,
        });
      } else {
        items.push({
          id: 'c02-trend-stabil',
          level: 'info',
          category: 'perkembangan',
          icon: '📊',
          title: 'Konsumsi Pakan Stabil',
          message:
            `Total konsumsi 7 hari terakhir ${fmt1(kgLast7)} Kg ` +
            `(${consumptionTrendPct >= 0 ? '+' : ''}${fmt1(consumptionTrendPct)}% vs 7 hari sebelumnya).`,
        });
      }
    } else {
      // Not enough history yet for a trend comparison
      items.push({
        id: 'c02-early',
        level: 'info',
        category: 'perkembangan',
        icon: '📊',
        title: 'Konsumsi 7 Hari Terakhir',
        message:
          `Total ${fmt1(kgLast7)} Kg dari ${last7Recs.length} sesi selesai. ` +
          `Perlu data lebih lanjut untuk analisis tren pembanding.`,
      });
    }
  }

  // ── RULE C-01: Frekuensi harian ─────────────────────────────────────────
  if (last7Recs.length > 0) {
    const activeDays   = new Set(last7Recs.map((r) => r.tanggal)).size;
    const avgPerDay    = last7Recs.length / 7;
    items.push({
      id: 'c01-frekuensi',
      level: 'info',
      category: 'perkembangan',
      icon: '🔁',
      title: 'Frekuensi Pemberian 7 Hari',
      message:
        `${last7Recs.length} sesi selesai dalam 7 hari (${activeDays} hari aktif). ` +
        `Rata-rata ${fmt1(avgPerDay)}× per hari.`,
    });
  }

  // ── RULE C-03: Tidak ada pemberian beberapa hari ─────────────────────────
  if (totalSelesai > 0) {
    const lastSelesai = selesaiRecs[0]; // newest first
    const daysSince   = daysDiff(lastSelesai.tanggal, today);
    if (daysSince >= 3) {
      items.push({
        id: 'c03-gap',
        level: daysSince >= 5 ? 'critical' : 'warning',
        category: 'peringatan',
        icon: '⚠️',
        title: 'Tidak Ada Pemberian Pakan',
        message:
          `Tidak ada pemberian pakan yang selesai dalam ${daysSince} hari terakhir. ` +
          (daysSince >= 5
            ? 'Segera periksa kondisi ternak dan pastikan kebutuhan pakan tercukupi.'
            : 'Pastikan pemberian pakan berjalan sesuai jadwal.'),
      });
    }
  }

  // ── RULE N-01: Estimasi nutrisi harian (dari master pakan) ───────────────
  let nutrisiEstimate: NutrisiEstimate | null = null;
  {
    let totalBK = 0, totalPK = 0, totalTDN = 0;
    let coveredItems = 0, totalItems = 0;

    for (const r of last7Recs) {
      for (const item of r.items) {
        totalItems++;
        const kgAsFed = toKg(item.jumlah, item.satuan);
        if (kgAsFed <= 0 || !item.masterPakanUuid) continue;
        const mp = MASTER_PAKAN_DB[item.masterPakanUuid];
        if (!mp || mp.bahanKering === null) continue;
        coveredItems++;
        const bkKg = kgAsFed * (mp.bahanKering / 100);
        totalBK  += bkKg;
        if (mp.proteinKasar !== null) totalPK  += bkKg * (mp.proteinKasar / 100);
        if (mp.tdn           !== null) totalTDN += bkKg * (mp.tdn           / 100);
      }
    }

    if (coveredItems > 0) {
      const avgDailyBK    = totalBK  / 7;
      const avgDailyPK    = totalPK  / 7;
      const avgDailyTDN   = totalTDN / 7;
      const coverageRatio = totalItems > 0 ? coveredItems / totalItems : 0;
      nutrisiEstimate = { avgDailyBK, avgDailyPK, avgDailyTDN, coverageRatio };

      const caveat = coverageRatio < 0.5
        ? ' (estimasi parsial — sebagian pakan belum memiliki data nutrisi)'
        : '';
      items.push({
        id: 'n01-nutrisi',
        level: 'info',
        category: 'perkembangan',
        icon: '🧪',
        title: 'Estimasi Nutrisi Harian',
        message:
          `Rata-rata per hari (7 hari terakhir, basis bahan kering)${caveat}: ` +
          `BK ≈ ${fmt1(avgDailyBK)} Kg · PK ≈ ${fmt1(avgDailyPK)} Kg · TDN ≈ ${fmt1(avgDailyTDN)} Kg.`,
      });

      // ── RULE N-02: Nutrisi tidak seimbang ─────────────────────────
      if (avgDailyBK > 0) {
        const pkPct  = (avgDailyPK  / avgDailyBK) * 100;
        const tdnPct = (avgDailyTDN / avgDailyBK) * 100;

        if (pkPct < 6) {
          items.push({
            id: 'n02-pk-rendah',
            level: 'warning',
            category: 'peringatan',
            icon: '🥩',
            title: 'Protein Kasar Diperkirakan Rendah',
            message:
              `Estimasi PK ≈ ${fmt1(pkPct)}% dari BK (minimal ~8% untuk ruminansia). ` +
              `Pertimbangkan penambahan sumber protein seperti konsentrat atau leguminosa.`,
          });
        }
        if (tdnPct < 45) {
          items.push({
            id: 'n02-tdn-rendah',
            level: 'warning',
            category: 'peringatan',
            icon: '⚡',
            title: 'Energi (TDN) Diperkirakan Rendah',
            message:
              `Estimasi TDN ≈ ${fmt1(tdnPct)}% dari BK (minimal ~50% untuk ruminansia). ` +
              `Pertimbangkan penambahan pakan berenergi tinggi seperti biji-bijian atau konsentrat.`,
          });
        }
      }
    }
  }

  // ── RULE Re-01: Evaluasi jumlah pemberian ────────────────────────────────
  const hasTrendDown = consumptionTrendPct !== null && consumptionTrendPct <= -30;
  const hasLongGap   = totalSelesai > 0 && daysDiff(selesaiRecs[0].tanggal, today) >= 3;

  if (hasTrendDown || hasLongGap) {
    items.push({
      id: 're01-evaluasi-jumlah',
      level: 'info',
      category: 'rekomendasi',
      icon: '💡',
      title: 'Evaluasi Jumlah Pemberian',
      message: hasTrendDown
        ? `Konsumsi pakan turun signifikan (${fmt1(Math.abs(consumptionTrendPct!))}%). Evaluasi jumlah dan komposisi ransum — pastikan ternak mendapat asupan yang cukup.`
        : 'Pemberian pakan tidak tercatat dalam beberapa hari. Evaluasi konsistensi jadwal dan pastikan setiap sesi dicatat.',
    });
  }

  // ── RULE Re-02: Tambah stok ──────────────────────────────────────────────
  if (habisAll.length > 0 || menipisAll.length > 0) {
    items.push({
      id: 're02-tambah-stok',
      level: 'info',
      category: 'rekomendasi',
      icon: '🏪',
      title: 'Tambah Stok Pakan',
      message:
        (habisAll.length > 0 ? `${habisAll.length} item stok habis. ` : '') +
        (menipisAll.length > 0 ? `${menipisAll.length} item stok menipis. ` : '') +
        'Segera lakukan penambahan stok melalui menu Tambah Stok Pakan.',
    });
  }

  // ── RULE Re-03: Periksa kesehatan ternak ────────────────────────────────
  if (consumptionTrendPct !== null && consumptionTrendPct <= -50) {
    items.push({
      id: 're03-periksa-kesehatan',
      level: 'warning',
      category: 'rekomendasi',
      icon: '🩺',
      title: 'Periksa Kondisi Ternak',
      message:
        `Penurunan konsumsi ${fmt1(Math.abs(consumptionTrendPct))}% sangat signifikan. ` +
        'Penurunan nafsu makan yang drastis bisa mengindikasikan masalah kesehatan. Pertimbangkan pemeriksaan melalui modul Kesehatan Hewan.',
    });
  }

  // ── RULE Re-04: Penimbangan berkala ─────────────────────────────────────
  if (totalSelesai >= 5) {
    items.push({
      id: 're04-timbang',
      level: 'info',
      category: 'rekomendasi',
      icon: '⚖️',
      title: 'Penimbangan Berkala',
      message:
        'Lakukan penimbangan ternak secara berkala untuk memantau pertumbuhan dan menyesuaikan ransum pakan sesuai kebutuhan bobot target.',
    });
  }

  // ── RULE P-01 & P-02: Prediksi kebutuhan 7 & 30 hari ───────────────────
  if (last14Recs.length > 0) {
    const totalKg14    = sumKgRecords(last14Recs);
    const avgDailyKg14 = totalKg14 / 14;
    if (avgDailyKg14 > 0) {
      items.push({
        id: 'p01-prediksi-7',
        level: 'info',
        category: 'prediksi',
        icon: '📅',
        title: 'Estimasi Kebutuhan 7 Hari',
        message:
          `Berdasarkan rata-rata 14 hari terakhir (${fmt1(avgDailyKg14)} Kg/hari), ` +
          `estimasi kebutuhan 7 hari ke depan: ≈ ${fmt1(avgDailyKg14 * 7)} Kg.`,
      });
      items.push({
        id: 'p02-prediksi-30',
        level: 'info',
        category: 'prediksi',
        icon: '📆',
        title: 'Estimasi Kebutuhan 30 Hari',
        message:
          `Estimasi kebutuhan 30 hari ke depan: ≈ ${fmt1(avgDailyKg14 * 30)} Kg ` +
          `(${fmt1(avgDailyKg14)} Kg/hari × 30 hari).`,
      });
    }
  }

  // ── RULE P-03: Prediksi stok per item + insight ──────────────────────────
  const prediksiStok: PrediksiStokItem[] = [];
  {
    // Compute usage per inventarisId over last 14 selesai records
    const usageMap = new Map<string, number>(); // inventarisId → total Kg in 14 days
    for (const r of last14Recs) {
      for (const item of r.items) {
        const kg = toKg(item.jumlah, item.satuan);
        if (kg <= 0) continue;
        usageMap.set(item.inventarisId, (usageMap.get(item.inventarisId) ?? 0) + kg);
      }
    }

    for (const inv of inventaris) {
      const totalUsed    = usageMap.get(inv.id) ?? 0;
      const avgDaily     = totalUsed / 14;
      const currentKg    = toKg(inv.jumlahStok, inv.satuan);
      const estHabis     = avgDaily > 0 ? Math.floor(currentKg / avgDaily) : null;

      prediksiStok.push({
        inventarisId:  inv.id,
        nama:          inv.nama,
        satuan:        inv.satuan,
        currentStock:  inv.jumlahStok,
        avgDailyUsage: avgDaily,
        estHabis,
      });

      // P-03 warning: stok diperkirakan habis < 7 hari (only for actively-used items)
      if (estHabis !== null && estHabis < 7 && estHabis >= 0 && avgDaily > 0) {
        const lvl: InsightLevel = estHabis < 3 ? 'critical' : 'warning';
        items.push({
          id: `p03-stok-${inv.id}`,
          level: lvl,
          category: 'prediksi',
          icon: '📦',
          title: `Estimasi Stok Hampir Habis — ${inv.nama}`,
          message:
            `Sisa ${inv.jumlahStok} ${inv.satuan}. Dengan rata-rata penggunaan ` +
            `${fmt1(avgDaily)} Kg/hari, diperkirakan habis dalam ${estHabis} hari. ` +
            (lvl === 'critical' ? 'Segera lakukan pengisian stok!' : 'Pertimbangkan pengisian stok.'),
          subjectLabel: inv.nama,
        });
      }
    }
  }

  // ── Overall kondisi ──────────────────────────────────────────────────────
  let kondisi: KondisiPakan;
  let kondisiSummary: string;

  if (totalSelesai === 0) {
    kondisi        = 'Belum Cukup Data';
    kondisiSummary =
      'Belum ada catatan pemberian pakan yang selesai. ' +
      'Catat dan selesaikan sesi pemberian pakan untuk mendapatkan analisis konsumsi.';
  } else {
    const critCount = items.filter((i) => i.level === 'critical').length;
    const warnCount = items.filter((i) => i.level === 'warning').length;

    if (consumptionTrendPct !== null && consumptionTrendPct <= -50) {
      kondisi        = 'Menurun';
      kondisiSummary = `Konsumsi pakan turun drastis ${fmt1(Math.abs(consumptionTrendPct))}%. Perlu perhatian segera.`;
    } else if (critCount > 0) {
      kondisi        = 'Tidak Konsisten';
      kondisiSummary = `${critCount} peringatan kritis terdeteksi. Tindakan segera diperlukan.`;
    } else if (hasTrendDown) {
      kondisi        = 'Menurun';
      kondisiSummary = `Konsumsi pakan turun ${fmt1(Math.abs(consumptionTrendPct!))}% dalam 7 hari terakhir. Perlu evaluasi.`;
    } else if (consumptionTrendPct !== null && consumptionTrendPct >= 30) {
      kondisi        = 'Meningkat';
      kondisiSummary = `Konsumsi pakan meningkat ${fmt1(consumptionTrendPct)}% dalam 7 hari terakhir.`;
    } else if (jadwalTerlewat.length >= 2 || warnCount >= 3) {
      kondisi        = 'Tidak Konsisten';
      kondisiSummary =
        jadwalTerlewat.length >= 2
          ? `${jadwalTerlewat.length} jadwal pemberian terlewat. Konsistensi perlu ditingkatkan.`
          : `${warnCount} peringatan aktif. Perlu perhatian pada konsistensi pemberian pakan.`;
    } else {
      kondisi        = 'Normal';
      kondisiSummary = `${totalSelesai} sesi pemberian selesai. Konsumsi pakan dalam kondisi normal.`;
    }
  }

  // ── Sort: critical → warning → info, then by category priority ──────────
  const LEVEL_ORDER: Record<InsightLevel, number>    = { critical: 0, warning: 1, info: 2 };
  const CAT_ORDER:   Record<InsightCategory, number> = {
    peringatan:   0,
    rekomendasi:  1,
    perkembangan: 2,
    ringkasan:    3,
    prediksi:     4,
  };
  items.sort((a, b) => {
    const ld = LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level];
    return ld !== 0 ? ld : CAT_ORDER[a.category] - CAT_ORDER[b.category];
  });

  return {
    analyzedAt,
    dataSource:       DATA_SOURCE,
    confidenceStatus: 'Rule-Based',
    version:          VERSION,
    kondisi,
    kondisiSummary,
    totalSesi,
    totalSelesai,
    sesiHariIni,
    items,
    prediksiStok,
    nutrisiEstimate,
  };
}
