// ─────────────────────────────────────────────────────────────────────────────
// DB-010 — Dashboard Personalization & Customization
// Mengikuti docs/architecture/DASHBOARD_MODULE_CONSTITUTION.md
//
// TUJUAN: menyiapkan STRUKTUR agar Dashboard dapat disesuaikan pengguna
// (urutan widget, tampilkan/sembunyikan widget, widget favorit, preferensi
// layout) tanpa mengubah arsitektur modul. Ini BUKAN implementasi penuh —
// belum ada drag & drop, belum ada halaman pengaturan tersendiri.
//
// Personalisasi HANYA mengubah tampilan (order/visibility/preference).
// Personalisasi TIDAK PERNAH mengubah data bisnis modul lain — modul ini
// tidak membaca ataupun menulis Livestock/Marketplace/Pakan/Obat/dll.
//
// Disimpan PER WORKSPACE (Workspace Farm A punya layout sendiri, terpisah
// dari Workspace Farm B), konsisten dengan pola in-memory store lain di
// project ini (mis. workspace data stores).
// ─────────────────────────────────────────────────────────────────────────────

// ─── Widget Registry ───────────────────────────────────────────────────────
// Urutan array ini = urutan default Dashboard (Constitution "MAIN SECTION").

export type WidgetId =
  | 'ai-insight'
  | 'quick-action'
  | 'summary-card'
  | 'today-activity'
  | 'alert-reminder'
  | 'recent-activity'
  | 'news-event'
  | 'business-snapshot';

export interface WidgetMeta {
  id: WidgetId;
  label: string;
  /** Widget wajib TIDAK BOLEH disembunyikan (Constitution: AI Insight, Quick Action, Summary Card). */
  mandatory: boolean;
}

export const WIDGET_REGISTRY: WidgetMeta[] = [
  { id: 'ai-insight',        label: 'AI Insight',           mandatory: true  },
  { id: 'quick-action',      label: 'Aksi Cepat',           mandatory: true  },
  { id: 'summary-card',      label: 'Ringkasan Hari Ini',   mandatory: true  },
  { id: 'today-activity',    label: 'Aktivitas Hari Ini',   mandatory: false },
  { id: 'alert-reminder',    label: 'Alert & Reminder',     mandatory: false },
  { id: 'recent-activity',   label: 'Aktivitas Terbaru',    mandatory: false },
  { id: 'news-event',        label: 'News & Event',         mandatory: false },
  { id: 'business-snapshot', label: 'Business Snapshot',    mandatory: false },
];

export const DEFAULT_WIDGET_ORDER: WidgetId[] = [
  'ai-insight',
  'quick-action',
  'summary-card',
  'today-activity',
  'alert-reminder',
  'recent-activity',
  'news-event',
  'business-snapshot',
];

export const MANDATORY_WIDGET_IDS: WidgetId[] = WIDGET_REGISTRY
  .filter((w) => w.mandatory)
  .map((w) => w.id);

export function getWidgetMeta(id: WidgetId): WidgetMeta {
  return WIDGET_REGISTRY.find((w) => w.id === id)!;
}

export function isMandatoryWidget(id: WidgetId): boolean {
  return MANDATORY_WIDGET_IDS.includes(id);
}

// ─── Layout Preference ──────────────────────────────────────────────────────
// "Siapkan struktur: Compact Mode / Comfortable Mode / Default Layout.
//  Belum perlu halaman pengaturan." — hanya struktur nilai, belum ada UI
// pengaturan penuh; render Dashboard hanya membaca preference ini opsional.

export type DashboardLayoutMode = 'Default' | 'Compact' | 'Nyaman';

export const LAYOUT_MODE_OPTIONS: { value: DashboardLayoutMode; label: string }[] = [
  { value: 'Default', label: 'Default Layout' },
  { value: 'Compact', label: 'Compact Mode' },
  { value: 'Nyaman',  label: 'Comfortable Mode' },
];

// ─── Widget Config (per Workspace) ─────────────────────────────────────────

export interface WidgetConfig {
  id: WidgetId;
  visible: boolean;
  favorite: boolean;
  // ── Future-ready, belum diimplementasikan ──────────────────────────────
  pinned?: boolean;   // future: Widget Pin
}

export interface DashboardPersonalizationRecord {
  workspaceId: string;
  widgetOrder: WidgetId[];               // urutan widget saat ini (drag & drop nanti tinggal menulis ke sini)
  widgets: Record<WidgetId, WidgetConfig>;
  preference: DashboardLayoutMode;
  // ── Future-ready structure, belum diimplementasikan ────────────────────
  dragDropEnabled: false;                // future: Drag & Drop
  resizeEnabled: false;                  // future: Widget Resize
  templateId: string | null;             // future: Dashboard Template
  aiDashboardEnabled: false;             // future: AI Dashboard
}

// ─── In-memory Store (per Workspace, lazy-created) ─────────────────────────
// Tidak menambah database baru — ini adalah store sementara di memori,
// mengikuti pola in-memory lain di project ini. Direset saat reload halaman.

const PERSONALIZATION_STORE = new Map<string, DashboardPersonalizationRecord>();

function buildDefaultRecord(workspaceId: string): DashboardPersonalizationRecord {
  const widgets = {} as Record<WidgetId, WidgetConfig>;
  for (const meta of WIDGET_REGISTRY) {
    widgets[meta.id] = { id: meta.id, visible: true, favorite: false };
  }
  return {
    workspaceId,
    widgetOrder: [...DEFAULT_WIDGET_ORDER],
    widgets,
    preference: 'Default',
    dragDropEnabled: false,
    resizeEnabled: false,
    templateId: null,
    aiDashboardEnabled: false,
  };
}

/** Mengambil (atau membuat, jika belum ada) konfigurasi personalisasi milik sebuah Workspace. */
function getOrCreateRecord(workspaceId: string): DashboardPersonalizationRecord {
  let record = PERSONALIZATION_STORE.get(workspaceId);
  if (!record) {
    record = buildDefaultRecord(workspaceId);
    PERSONALIZATION_STORE.set(workspaceId, record);
  }
  return record;
}

// ─── Queries ────────────────────────────────────────────────────────────────

/** Salinan read-only konfigurasi personalisasi Workspace tertentu. */
export function getDashboardLayout(workspaceId: string): DashboardPersonalizationRecord {
  const record = getOrCreateRecord(workspaceId);
  return {
    ...record,
    widgetOrder: [...record.widgetOrder],
    widgets: { ...record.widgets },
  };
}

/**
 * Daftar WidgetId yang harus dirender, sudah terurut, sudah difilter dari
 * widget yang disembunyikan. Widget wajib (AI Insight, Quick Action,
 * Summary Card) selalu ikut tampil — ini otomatis memenuhi aturan EMPTY
 * STATE Constitution ("jika seluruh widget opsional disembunyikan, tetap
 * tampilkan AI Insight, Quick Action, Summary Card") karena widget wajib
 * memang tidak pernah bisa disembunyikan.
 */
export function getVisibleWidgetsInOrder(workspaceId: string): WidgetId[] {
  const record = getOrCreateRecord(workspaceId);
  return record.widgetOrder.filter((id) => {
    const cfg = record.widgets[id];
    return isMandatoryWidget(id) || (cfg?.visible ?? true);
  });
}

/** Daftar widget yang ditandai favorit oleh pengguna untuk Workspace tertentu. */
export function getFavoriteWidgets(workspaceId: string): WidgetId[] {
  const record = getOrCreateRecord(workspaceId);
  return record.widgetOrder.filter((id) => record.widgets[id]?.favorite);
}

// ─── Mutations ──────────────────────────────────────────────────────────────
// Semua mutasi HANYA mengubah tampilan Dashboard (order/visibility/preference)
// milik satu Workspace. Tidak ada mutasi di sini yang menyentuh data modul
// lain — sesuai Constitution "Dashboard tidak boleh menulis ke modul lain".

/** Mengubah urutan widget. Menerima permutasi penuh dari DEFAULT_WIDGET_ORDER. */
export function setWidgetOrder(workspaceId: string, newOrder: WidgetId[]): void {
  const record = getOrCreateRecord(workspaceId);
  const isValidPermutation =
    newOrder.length === DEFAULT_WIDGET_ORDER.length &&
    DEFAULT_WIDGET_ORDER.every((id) => newOrder.includes(id));
  if (!isValidPermutation) return; // urutan tidak valid — abaikan, jangan korup state
  record.widgetOrder = [...newOrder];
}

/**
 * Menampilkan/menyembunyikan sebuah widget. Widget wajib (mandatory) tidak
 * dapat disembunyikan — permintaan menyembunyikannya diabaikan (guard).
 */
export function setWidgetVisibility(workspaceId: string, widgetId: WidgetId, visible: boolean): void {
  const record = getOrCreateRecord(workspaceId);
  if (!visible && isMandatoryWidget(widgetId)) return; // guard: widget wajib terlindungi
  const cfg = record.widgets[widgetId];
  if (!cfg) return;
  record.widgets[widgetId] = { ...cfg, visible };
}

/** Menandai/melepas widget sebagai favorit. */
export function toggleWidgetFavorite(workspaceId: string, widgetId: WidgetId): void {
  const record = getOrCreateRecord(workspaceId);
  const cfg = record.widgets[widgetId];
  if (!cfg) return;
  record.widgets[widgetId] = { ...cfg, favorite: !cfg.favorite };
}

/** Mengganti preferensi tampilan Dashboard (Compact/Comfortable/Default). */
export function setLayoutPreference(workspaceId: string, preference: DashboardLayoutMode): void {
  const record = getOrCreateRecord(workspaceId);
  record.preference = preference;
}

/** Mengembalikan seluruh personalisasi Workspace ke kondisi default. */
export function resetDashboardToDefault(workspaceId: string): void {
  PERSONALIZATION_STORE.set(workspaceId, buildDefaultRecord(workspaceId));
}
