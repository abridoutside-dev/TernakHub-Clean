// ─────────────────────────────────────────────────────────────────────────────
// DB-003 — Dashboard AI Insight
// Mengikuti docs/architecture/DASHBOARD_MODULE_CONSTITUTION.md
//
// AI Insight hanya: Merangkum, Memberikan Prioritas, Memberikan Insight,
// Memberikan Rekomendasi. AI TIDAK mengubah data, TIDAK membuat AI Engine,
// TIDAK membuat prediksi nyata. Seluruh isi pada fase ini adalah dummy data
// / placeholder — disiapkan agar struktur mudah disambungkan ke AI Engine
// dan pembacaan data live pada fase berikutnya, TANPA mengubah struktur ini.
//
// AI Insight hanya MEMBACA (secara konseptual) dari: Livestock, Feed,
// Medicine, Marketplace, Business Insight, News & Event, Workspace.
// Tidak ada database sendiri — array di bawah ini murni dummy/placeholder.
// ─────────────────────────────────────────────────────────────────────────────

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
  timestamp: string;    // ISO string — dummy, belum live
  actions: InsightAction[];
}

// ─── AI Generated Summary (Future Ready placeholder) ────────────────────────
// Disiapkan agar AI Engine masa depan (Summary/Prediction/Recommendation)
// tinggal mengisi field ini tanpa mengubah struktur komponen.
export interface AiGeneratedSummary {
  generatedAt: string;
  summaryText: string;
  predictionText: string;
  recommendationText: string;
}

export function getAiGeneratedSummary(): AiGeneratedSummary {
  return {
    generatedAt: '2026-07-15T07:00:00+07:00',
    summaryText: 'Belum ada data yang cukup untuk dianalisis hari ini. Ringkasan AI akan dihasilkan otomatis setelah AI Engine terhubung.',
    predictionText: 'Prediksi AI (misalnya proyeksi stok/produksi) belum tersedia — placeholder untuk fase implementasi berikutnya.',
    recommendationText: 'Rekomendasi AI akan tersedia pada fase implementasi berikutnya, mengikuti data live dari seluruh modul.',
  };
}

// ─── Dummy Insight Data ──────────────────────────────────────────────────────
// Seluruh item di bawah ini adalah PLACEHOLDER. Belum ada pembacaan live ke
// Livestock/Feed/Medicine/Marketplace/Business Insight/News & Event/Workspace
// — sourceModule hanya label ilustratif dari mana insight ini "akan" berasal.
const AI_INSIGHT_DUMMY_LIST: AiInsightItem[] = [
  {
    id: 'ai-001',
    priority: 'critical',
    category: 'Medicine',
    title: 'Stok Obat Vaksin ND hampir habis',
    summary: 'Contoh Insight: stok salah satu obat diperkirakan tidak cukup untuk kebutuhan minggu ini.',
    sourceModule: 'Stok Obat',
    timestamp: '2026-07-15T06:30:00+07:00',
    actions: [
      { type: 'buka-modul', label: 'Buka Modul', to: '/stok-obat' },
      { type: 'tandai-dibaca', label: 'Tandai Sudah Dibaca' },
    ],
  },
  {
    id: 'ai-002',
    priority: 'high',
    category: 'Feed',
    title: 'Stok Pakan menipis',
    summary: 'Contoh Insight: beberapa item stok pakan diperkirakan mendekati batas minimum.',
    sourceModule: 'Stok Pakan',
    timestamp: '2026-07-15T06:15:00+07:00',
    actions: [
      { type: 'buka-modul', label: 'Buka Modul', to: '/stok-pakan' },
      { type: 'tandai-dibaca', label: 'Tandai Sudah Dibaca' },
    ],
  },
  {
    id: 'ai-003',
    priority: 'medium',
    category: 'Livestock',
    title: 'Beberapa ternak belum ditimbang minggu ini',
    summary: 'Contoh Insight: pencatatan bobot mingguan belum lengkap untuk sebagian ternak.',
    sourceModule: 'Livestock',
    timestamp: '2026-07-14T18:00:00+07:00',
    actions: [
      { type: 'buka-modul', label: 'Buka Modul', to: '/livestock' },
      { type: 'lihat-detail', label: 'Lihat Detail', to: '/catat-bobot' },
      { type: 'tandai-dibaca', label: 'Tandai Sudah Dibaca' },
    ],
  },
  {
    id: 'ai-004',
    priority: 'medium',
    category: 'Event',
    title: 'Ada Event terjadwal dalam waktu dekat',
    summary: 'Contoh Insight: satu Event pada modul News & Event akan berlangsung dalam waktu dekat.',
    sourceModule: 'News & Event',
    timestamp: '2026-07-14T12:00:00+07:00',
    actions: [
      { type: 'buka-modul', label: 'Buka Modul', to: '/news-event' },
      { type: 'tandai-dibaca', label: 'Tandai Sudah Dibaca' },
    ],
  },
  {
    id: 'ai-005',
    priority: 'low',
    category: 'Marketplace',
    title: 'Beberapa listing menunggu ditinjau',
    summary: 'Contoh Insight: ada listing Marketplace yang bisa ditinjau ulang atau diperbarui.',
    sourceModule: 'Marketplace',
    timestamp: '2026-07-14T09:00:00+07:00',
    actions: [
      { type: 'buka-modul', label: 'Buka Modul', to: '/marketplace' },
      { type: 'tandai-dibaca', label: 'Tandai Sudah Dibaca' },
    ],
  },
  {
    id: 'ai-006',
    priority: 'info',
    category: 'Business',
    title: 'Ringkasan Business Insight minggu ini tersedia',
    summary: 'Contoh Insight: ringkasan performa bisnis (read-only) dapat dilihat di Business Insight.',
    sourceModule: 'Business Insight',
    timestamp: '2026-07-13T08:00:00+07:00',
    actions: [
      { type: 'lihat-detail', label: 'Lihat Detail', to: '/profile/business-insight' },
      { type: 'tandai-dibaca', label: 'Tandai Sudah Dibaca' },
    ],
  },
  {
    id: 'ai-007',
    priority: 'info',
    category: 'News',
    title: 'Artikel baru telah dipublikasikan',
    summary: 'Contoh Insight: ada konten baru dengan status Published di modul News & Event.',
    sourceModule: 'News & Event',
    timestamp: '2026-07-13T07:30:00+07:00',
    actions: [
      { type: 'buka-modul', label: 'Buka Modul', to: '/news-event' },
      { type: 'tandai-dibaca', label: 'Tandai Sudah Dibaca' },
    ],
  },
  {
    id: 'ai-008',
    priority: 'info',
    category: 'Workspace',
    title: 'Workspace Anda aktif pada paket FREE',
    summary: 'Contoh Insight: informasi status Workspace aktif saat ini.',
    sourceModule: 'Workspace',
    timestamp: '2026-07-13T07:00:00+07:00',
    actions: [
      { type: 'tandai-dibaca', label: 'Tandai Sudah Dibaca' },
    ],
  },
];

/**
 * Mengambil seluruh Insight (dummy/placeholder), diurutkan berdasarkan
 * prioritas (Critical → High → Medium → Low → Information) lalu waktu
 * terbaru. Komponen pemanggil bertanggung jawab mengelompokkan ke dalam
 * Section (lihat groupInsightsBySection).
 */
export function getAiInsights(): AiInsightItem[] {
  return AI_INSIGHT_DUMMY_LIST.slice().sort((a, b) => {
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
