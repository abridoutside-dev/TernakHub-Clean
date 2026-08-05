// ─────────────────────────────────────────────────────────────────────────────
// DB-003 / AID-001 — Dashboard AI Insight Aggregator
// Mengikuti docs/architecture/DASHBOARD_MODULE_CONSTITUTION.md
//
// Dashboard AI BUKAN rule engine. Ia hanya mengumpulkan, mengurut, dan
// menampilkan Insight yang sudah dihasilkan oleh setiap modul AI.
//
// Modul AI yang diagregasi (seluruh analisis tetap berada di masing-masing):
//   - AI Livestock  (aiInsightLivestockData.ts)
//   - AI Bobot      (aiInsightBobotData.ts)
//   - AI Kesehatan  (aiInsightKesehatanData.ts)
//   - AI Pakan      (aiInsightPakanData.ts)
//   - AI Batch      (aiInsightBatchData.ts)
//   - AI Mutasi     (aiInsightMutasiData.ts)
//   - AI Reproduksi (aiInsightReproduksiData.ts)
//
// Jika satu modul belum memiliki data, ia dilewati secara graceful (try-catch).
// ─────────────────────────────────────────────────────────────────────────────

import { generateLivestockInsights } from './aiInsightLivestockData';
import { generateBobotInsights }     from './aiInsightBobotData';
import { generateInsights as generateKesehatanInsights } from './aiInsightKesehatanData';
import { generatePakanInsights }     from './aiInsightPakanData';
import { generateBatchInsights }     from './aiInsightBatchData';
import { generateMutasiInsights }    from './aiInsightMutasiData';
import { generateReproduksiInsights } from './aiInsightReproduksiData';

// ─── Priority ────────────────────────────────────────────────────────────────
export type InsightPriority = 'critical' | 'high' | 'medium' | 'low' | 'info';

// ─── Layout Section ──────────────────────────────────────────────────────────
// Urutan tampil Card AI Insight: Critical → Warning → Recommendation → Information.
export type InsightSection = 'Critical' | 'Warning' | 'Recommendation' | 'Information';

export const SECTION_ORDER: InsightSection[] = ['Critical', 'Warning', 'Recommendation', 'Information'];

export const PRIORITY_META: Record<
  InsightPriority,
  { icon: string; label: string; color: string; bg: string; section: InsightSection; order: number }
> = {
  critical: { icon: '🔴', label: 'Critical',    color: '#b3261e', bg: '#fdecea', section: 'Critical',       order: 0 },
  high:     { icon: '🟠', label: 'High',        color: '#a35a00', bg: '#fff3e0', section: 'Warning',        order: 1 },
  medium:   { icon: '🟡', label: 'Medium',      color: '#8a7000', bg: '#fffbe0', section: 'Warning',        order: 2 },
  low:      { icon: '🟢', label: 'Low',         color: '#1f8a4c', bg: '#e6f7ec', section: 'Recommendation', order: 3 },
  info:     { icon: 'ℹ️', label: 'Informasi',   color: '#1565c0', bg: '#e8f1fb', section: 'Information',    order: 4 },
};

// ─── Category ────────────────────────────────────────────────────────────────
// Minimal 8 kategori. Menambah kategori baru hanya perlu menambah 1 union
// value + 1 entri di CATEGORY_META — tidak perlu mengubah komponen render.
export type InsightCategory =
  | 'Livestock'
  | 'Feed'
  | 'Medicine'
  | 'Marketplace'
  | 'Business'
  | 'News'
  | 'Event'
  | 'Workspace';

export const CATEGORY_META: Record<InsightCategory, { icon: string; label: string }> = {
  Livestock:   { icon: '🐑', label: 'Livestock' },
  Feed:        { icon: '🌾', label: 'Feed' },
  Medicine:    { icon: '💊', label: 'Medicine' },
  Marketplace: { icon: '🛒', label: 'Marketplace' },
  Business:    { icon: '📊', label: 'Business' },
  News:        { icon: '📰', label: 'News' },
  Event:       { icon: '📅', label: 'Event' },
  Workspace:   { icon: '🏷️', label: 'Workspace' },
};

// ─── Action ──────────────────────────────────────────────────────────────────
// Quick Action-style: Insight Card hanya membuka modul / menandai dibaca.
// Tidak ada logic bisnis, tidak ada dismiss permanen pada fase ini.
export type InsightActionType = 'buka-modul' | 'lihat-detail' | 'tandai-dibaca';

export interface InsightAction {
  type: InsightActionType;
  label: string;
  to?: string; // route tujuan, wajib untuk 'buka-modul' / 'lihat-detail'
}

// ─── Insight Card ────────────────────────────────────────────────────────────
export interface AiInsightItem {
  id: string;
  priority: InsightPriority;
  category: InsightCategory;
  title: string;
  summary: string;
  sourceModule: string; // label modul asal, ditampilkan di card
  timestamp: string;    // ISO timestamp from the module's current analysis
  actions: InsightAction[];
}

// ─── Analysis Summary ─────────────────────────────────────────────────────────
export interface AiGeneratedSummary {
  generatedAt: string;
  summaryText: string;
  predictionText: string;
  recommendationText: string;
}

export function getAiGeneratedSummary(): AiGeneratedSummary {
  return {
    generatedAt: new Date().toISOString(),
    summaryText: 'Ringkasan dihitung dari analisis rule-based Livestock, Bobot, Kesehatan, Pakan, Batch, Mutasi, dan Reproduksi.',
    predictionText: 'Proyeksi ditampilkan hanya jika tersedia dari data historis modul terkait.',
    recommendationText: 'Rekomendasi berasal dari kondisi data dan aturan operasional yang dapat ditelusuri.',
  };
}

// ─── Level → Priority mapping ─────────────────────────────────────────────────
// Setiap modul AI menghasilkan InsightLevel ('info'|'warning'|'critical').
// Dashboard memetakan ke InsightPriority ('critical'|'high'|'info') agar
// tampilan section (Critical/Warning/Information) tetap konsisten.
function levelToPriority(level: 'info' | 'warning' | 'critical'): InsightPriority {
  switch (level) {
    case 'critical': return 'critical';
    case 'warning':  return 'high';
    case 'info':     return 'info';
  }
}

// ─── Module adapter ───────────────────────────────────────────────────────────
// Mengubah satu item dari modul AI menjadi AiInsightItem dashboard.
interface ModuleItemSource {
  id:      string;
  level:   'info' | 'warning' | 'critical';
  title:   string;
  message: string;
}

function adaptItem(
  item:       ModuleItemSource,
  prefix:     string,
  category:   InsightCategory,
  sourceModule: string,
  moduleRoute: string,
  analyzedAt: string,
): AiInsightItem {
  return {
    id:           `${prefix}-${item.id}`,
    priority:     levelToPriority(item.level),
    category,
    title:        item.title,
    summary:      item.message,
    sourceModule,
    timestamp:    analyzedAt,
    actions: [
      { type: 'buka-modul', label: 'Buka Modul', to: moduleRoute },
      { type: 'tandai-dibaca', label: 'Tandai Sudah Dibaca' },
    ],
  };
}

// ─── Dashboard AI Aggregator (AID-001) ───────────────────────────────────────
// Memanggil setiap modul AI, mengubah hasilnya ke AiInsightItem[], dan
// menggabungkan semua. Jika satu modul tidak memiliki data atau gagal,
// dilewati secara graceful tanpa mempengaruhi modul lain.
function aggregateAiInsights(): AiInsightItem[] {
  const result: AiInsightItem[] = [];

  // ── AI Livestock ────────────────────────────────────────────────────────────
  try {
    const report = generateLivestockInsights();
    for (const item of report.items) {
      result.push(adaptItem(item, 'ls', 'Livestock', 'AI Livestock', '/livestock', report.analyzedAt));
    }
  } catch { /* no data yet — skip gracefully */ }

  // ── AI Bobot ────────────────────────────────────────────────────────────────
  try {
    const report = generateBobotInsights();
    for (const item of report.items) {
      result.push(adaptItem(item, 'bbt', 'Livestock', 'AI Bobot', '/catat-bobot', report.analyzedAt));
    }
  } catch { /* no data yet — skip gracefully */ }

  // ── AI Kesehatan ────────────────────────────────────────────────────────────
  try {
    const report = generateKesehatanInsights();
    for (const item of report.items) {
      result.push(adaptItem(item, 'kes', 'Medicine', 'AI Kesehatan', '/kesehatan-hewan', report.analyzedAt));
    }
  } catch { /* no data yet — skip gracefully */ }

  // ── AI Pakan ────────────────────────────────────────────────────────────────
  try {
    const report = generatePakanInsights();
    for (const item of report.items) {
      result.push(adaptItem(item, 'pk', 'Feed', 'AI Pakan', '/pemberian-pakan', report.analyzedAt));
    }
  } catch { /* no data yet — skip gracefully */ }

  // ── AI Batch ────────────────────────────────────────────────────────────────
  try {
    const report = generateBatchInsights();
    for (const item of report.items) {
      result.push(adaptItem(item, 'bt', 'Livestock', 'AI Batch', '/livestock', report.analyzedAt));
    }
  } catch { /* no data yet — skip gracefully */ }

  // ── AI Mutasi ───────────────────────────────────────────────────────────────
  try {
    const report = generateMutasiInsights();
    for (const item of report.items) {
      result.push(adaptItem(item, 'mt', 'Livestock', 'AI Mutasi', '/mutasi', report.analyzedAt));
    }
  } catch { /* no data yet — skip gracefully */ }

  // ── AI Reproduksi ───────────────────────────────────────────────────────────
  try {
    const report = generateReproduksiInsights();
    for (const item of report.items) {
      result.push(adaptItem(item, 'rp', 'Livestock', 'AI Reproduksi', '/reproduksi', report.analyzedAt));
    }
  } catch { /* no data yet — skip gracefully */ }

  return result;
}

/**
 * Mengambil seluruh Insight dari semua modul AI yang aktif, diurutkan
 * berdasarkan prioritas (Critical → High → Information) lalu waktu terbaru.
 * Komponen pemanggil bertanggung jawab mengelompokkan ke dalam Section
 * (lihat groupInsightsBySection). Modul tanpa data dilewati secara graceful.
 */
export function getAiInsights(): AiInsightItem[] {
  return aggregateAiInsights().sort((a, b) => {
    const orderDiff = PRIORITY_META[a.priority].order - PRIORITY_META[b.priority].order;
    if (orderDiff !== 0) return orderDiff;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}

/**
 * Mengelompokkan Insight ke dalam Section sesuai urutan layout Constitution
 * (Critical → Warning → Recommendation → Information). Section tanpa item
 * tidak disertakan.
 */
export function groupInsightsBySection(items: AiInsightItem[]): { section: InsightSection; items: AiInsightItem[] }[] {
  return SECTION_ORDER.map((section) => ({
    section,
    items: items.filter((item) => PRIORITY_META[item.priority].section === section),
  })).filter((group) => group.items.length > 0);
}

// ─── DB-003R / HOME-002 — Insight Prioritas (ringkas untuk Dashboard) ──────
// Dashboard menampilkan maksimal 3 Insight prioritas tertinggi, urutan:
// Critical → Warning → Recommendation → Information.
// Jika tidak ada Critical, naikkan Warning. Jika tidak ada Warning, naikkan
// Recommendation. Jika tidak ada Recommendation, naikkan Information.
// Artinya: ambil 3 item teratas dari seluruh daftar terurut — tanpa filter
// per-priority-type — agar slot tidak pernah kosong jika masih ada item.
export const TOP_INSIGHT_LIMIT = 3;

export function getTopInsights(limit: number = TOP_INSIGHT_LIMIT): AiInsightItem[] {
  return getAiInsights().slice(0, limit);
}

// ─── Shared relative-time formatter ──────────────────────────────────────────
// Diekspor agar Dashboard card dan halaman Lihat Semua memakai logika yang sama,
// dan tidak ada duplikasi. Selalu baca waktu dari Date.now() — tidak hardcode.
export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours < 1)  return 'Baru saja';
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} hari lalu`;
}
