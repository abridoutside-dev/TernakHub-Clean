// ─────────────────────────────────────────────────────────────────────────────
// DB-007 — Dashboard Recent Activity
// Mengikuti docs/architecture/DASHBOARD_MODULE_CONSTITUTION.md
//
// Recent Activity = ringkasan aktivitas TERBARU lintas modul, meskipun
// terjadi kemarin atau beberapa hari lalu.
// BUKAN Today's Activity (todayActivityData.ts — hanya hari ini).
// BUKAN Audit Trail (riwayat permanen milik modul Profile/Escrow/Transport).
// BUKAN Log Sistem.
//
// File ini TIDAK memiliki database sendiri — seluruh item dibaca live setiap
// kali getRecentActivities() dipanggil, langsung dari modul asal:
//   • Livestock   ← src/data/livestockData.ts
//   • Feed        ← src/data/stokInventarisData.ts
//   • Medicine    ← src/data/riwayatObatData.ts (SSOT audit trail Stok Obat)
//   • Health      ← src/data/livestockData.ts (getHealthHistory)
//   • Marketplace ← src/data/marketplaceRiwayatAktivitasData.ts
//   • News/Event  ← src/data/newsEventData.ts (hanya status Published)
//
// Workspace tetap terdaftar sebagai Data Source yang SAH (Constitution),
// namun belum ada builder aktif untuknya — mengikuti preseden yang sama pada
// alertReminderData.ts (DB-006). Menambah builder Workspace di masa depan
// tidak memerlukan perubahan arsitektur file ini.
//
// Tidak ada tulis-menulis ke modul manapun dari file ini — murni agregator
// baca-saja, tidak menghitung ulang logika bisnis modul asal.
//
// EXTENSIBLE: menambah jenis aktivitas baru hanya perlu:
//   1. Tambah value baru ke union ActivityType (opsional — union terbuka).
//   2. Tambah builder function yang mengembalikan RecentActivityItem[].
//   3. Panggil builder tersebut di dalam buildAllRecentActivities().
// Tidak perlu mengubah komponen render maupun tipe Filter.
// ─────────────────────────────────────────────────────────────────────────────

import { LIVESTOCK_DB, getWeightHistory, getHealthHistory } from './livestockData';
import { getAllRiwayatPerubahan, getInventarisById } from './stokInventarisData';
import { getRiwayatObatList } from './riwayatObatData';
import { getAllAktivitas } from './marketplaceRiwayatAktivitasData';
import { getAllNewsEvent } from './newsEventData';
import { getActiveWorkspace } from '../components/TopAppBar';

// ─── Kategori (dipakai untuk Filter di halaman "Lihat Semua") ────────────────

export type RecentActivityCategory =
  | 'Livestock'
  | 'Feed'
  | 'Medicine'
  | 'Health'
  | 'Marketplace'
  | 'News'
  | 'Event';

export const RECENT_ACTIVITY_CATEGORY_LIST: RecentActivityCategory[] = [
  'Livestock', 'Feed', 'Medicine', 'Health', 'Marketplace', 'News', 'Event',
];

export type RecentActivityFilter = 'All' | RecentActivityCategory;

export const RECENT_ACTIVITY_FILTER_LIST: RecentActivityFilter[] = ['All', ...RECENT_ACTIVITY_CATEGORY_LIST];

// ─── Jenis Aktivitas (Constitution → AKTIVITAS, contoh minimal) ──────────────

export type RecentActivityType =
  | 'Livestock Added'
  | 'Weight Recorded'
  | 'Feed Recorded'
  | 'Medicine Stock Added'
  | 'Health Case Created'
  | 'Marketplace Published'
  | 'News Published'
  | 'Event Created'
  | string; // union terbuka — builder baru boleh memakai label baru tanpa mengubah tipe ini

// ─── Action (HANYA navigasi — "Lihat Detail") ────────────────────────────────

export interface RecentActivityAction {
  label: 'Lihat Detail';
  route: string;
}

export type RecentActivityState = 'ok' | 'empty' | 'error';

export interface RecentActivityItem {
  id: string;
  type: RecentActivityType;
  category: RecentActivityCategory;
  icon: string;
  title: string;
  summary: string;
  /** Nama Modul asal (Constitution → ITEM). */
  sourceModule: string;
  /** ISO datetime — dipakai untuk sort Terbaru → Terlama & Relative Time. */
  timestamp: string;
  action: RecentActivityAction;
  // ── FUTURE READY (Constitution → FUTURE READY) ──────────────────────────
  // Struktur disiapkan agar Pinned/Favorite/AI Highlight/Smart Grouping dapat
  // ditambahkan tanpa mengubah arsitektur. Belum ada UI/logic yang mengisi
  // field ini pada DB-007 — semua opsional & default undefined/false.
  aiHighlight?: boolean;
  isFavorite?: boolean;
  isPinned?: boolean;
  /** Smart Grouping (future) — key opsional untuk mengelompokkan item serupa. */
  groupKey?: string;
}

export interface RecentActivityResult {
  state: RecentActivityState;
  items: RecentActivityItem[];
}

// ─── Helper tanggal (sama seperti todayActivityData.ts) ──────────────────────
// Shared via src/utils/dateUtils.ts — do NOT duplicate here.
import { parseFlexibleDateToIso, isoAtNoon } from '../utils/dateUtils';

// ─── Meta tampilan per jenis aktivitas ────────────────────────────────────────

const TYPE_ICON: Record<string, string> = {
  'Livestock Added': '🐣',
  'Weight Recorded': '⚖️',
  'Feed Recorded': '🌿',
  'Medicine Stock Added': '💊',
  'Health Case Created': '🩺',
  'Marketplace Published': '🛒',
  'News Published': '📰',
  'Event Created': '📅',
};

// ─── 1. Livestock Added ← Livestock (digitalIdentity.registeredDate) ─────────

function buildLivestockAddedActivities(): RecentActivityItem[] {
  const items: RecentActivityItem[] = [];
  for (const lv of Object.values(LIVESTOCK_DB)) {
    const iso = parseFlexibleDateToIso(lv.digitalIdentity?.registeredDate ?? '');
    if (!iso) continue;
    items.push({
      id: `recent-livestock-added-${lv.id}`,
      type: 'Livestock Added',
      category: 'Livestock',
      icon: TYPE_ICON['Livestock Added'],
      title: 'Ternak Baru Ditambahkan',
      summary: `${lv.name ?? lv.id} (${lv.type} — ${lv.ras}) terdaftar ke Livestock`,
      sourceModule: 'Livestock',
      timestamp: isoAtNoon(iso),
      action: { label: 'Lihat Detail', route: `/livestock/${lv.id}` },
    });
  }
  return items;
}

// ─── 2. Weight Recorded ← Livestock (getWeightHistory per animal) ────────────

function buildWeightRecordedActivities(): RecentActivityItem[] {
  const items: RecentActivityItem[] = [];
  for (const lv of Object.values(LIVESTOCK_DB)) {
    for (const entry of getWeightHistory(lv.id)) {
      const iso = parseFlexibleDateToIso(entry.date);
      if (!iso) continue;
      items.push({
        id: `recent-weight-${lv.id}-${entry.date}-${entry.weight}`,
        type: 'Weight Recorded',
        category: 'Livestock',
        icon: TYPE_ICON['Weight Recorded'],
        title: 'Bobot Dicatat',
        summary: `${lv.name ?? lv.id}: ${entry.weight} ${entry.unit}${entry.diff ? ` (${entry.diff})` : ''}`,
        sourceModule: 'Livestock',
        timestamp: isoAtNoon(iso),
        action: { label: 'Lihat Detail', route: `/livestock/${lv.id}/bobot` },
      });
    }
  }
  return items;
}

// ─── 3. Feed Recorded ← Stok Pakan (Pemberian Pakan saja) ───────────────────
// "Pakan dicatat" (Constitution → AKTIVITAS) — bukan seluruh perubahan stok,
// hanya pencatatan pemberian pakan ke ternak.

function buildFeedRecordedActivities(): RecentActivityItem[] {
  const items: RecentActivityItem[] = [];
  for (const r of getAllRiwayatPerubahan()) {
    if (r.sumberPerubahan !== 'Pemberian Pakan') continue;
    const inv = getInventarisById(r.inventarisId);
    items.push({
      id: `recent-feed-${r.id}`,
      type: 'Feed Recorded',
      category: 'Feed',
      icon: TYPE_ICON['Feed Recorded'],
      title: 'Pakan Diberikan',
      summary: `${inv?.nama ?? r.inventarisId} diberikan ke ${r.namaTernak ?? 'ternak'} (-${r.jumlah} ${r.satuan})`,
      sourceModule: 'Stok Pakan',
      timestamp: r.createdAt,
      action: { label: 'Lihat Detail', route: `/stok-pakan/inventaris/${r.inventarisId}` },
    });
  }
  return items;
}

// ─── 4. Medicine Stock Added ← Riwayat Obat (jumlah bertambah saja) ─────────
// "Stok obat bertambah" (Constitution → AKTIVITAS) — hanya perubahan positif.

function buildMedicineStockAddedActivities(): RecentActivityItem[] {
  const items: RecentActivityItem[] = [];
  for (const r of getRiwayatObatList()) {
    if (r.jumlahPerubahan <= 0) continue;
    items.push({
      id: `recent-medicine-${r.uuid}`,
      type: 'Medicine Stock Added',
      category: 'Medicine',
      icon: TYPE_ICON['Medicine Stock Added'],
      title: 'Stok Obat Bertambah',
      summary: `${r.namaProduk} (${r.brand}): +${r.jumlahPerubahan} ${r.satuan} — ${r.jenisAktivitas}`,
      sourceModule: 'Stok Obat',
      timestamp: r.timestamp,
      action: { label: 'Lihat Detail', route: `/stok-obat/riwayat/${r.uuid}` },
    });
  }
  return items;
}

// ─── 5. Health Case Created ← Livestock (getHealthHistory per animal) ───────

function buildHealthCaseActivities(): RecentActivityItem[] {
  const items: RecentActivityItem[] = [];
  for (const lv of Object.values(LIVESTOCK_DB)) {
    for (const entry of getHealthHistory(lv.id)) {
      const iso = parseFlexibleDateToIso(entry.date);
      if (!iso) continue;
      items.push({
        id: `recent-health-${lv.id}-${entry.date}-${entry.activity}`,
        type: 'Health Case Created',
        category: 'Health',
        icon: TYPE_ICON['Health Case Created'],
        title: 'Kasus Kesehatan Dicatat',
        summary: `${lv.name ?? lv.id}: ${entry.activity} — ${entry.status}`,
        sourceModule: 'Livestock',
        timestamp: isoAtNoon(iso),
        action: { label: 'Lihat Detail', route: `/livestock/${lv.id}/kesehatan` },
      });
    }
  }
  return items;
}

// ─── 6. Marketplace Published ← Riwayat Aktivitas Marketplace (MPK-016) ─────
// "Marketplace dipublikasikan" (Constitution → AKTIVITAS) — hanya listing
// yang baru dipublikasikan, bukan seluruh jenis aktivitas Marketplace.

function buildMarketplacePublishedActivities(workspaceId: string): RecentActivityItem[] {
  const items: RecentActivityItem[] = [];
  for (const a of getAllAktivitas(workspaceId)) {
    if (a.jenisAktivitas !== 'Listing Dipublikasikan') continue;
    items.push({
      id: `recent-marketplace-${a.id}`,
      type: 'Marketplace Published',
      category: 'Marketplace',
      icon: a.icon || TYPE_ICON['Marketplace Published'],
      title: a.jenisAktivitas,
      summary: a.ringkasan,
      sourceModule: 'Marketplace',
      timestamp: a.waktu,
      action: { label: 'Lihat Detail', route: '/marketplace/riwayat' },
    });
  }
  return items;
}

// ─── 7 & 8. News Published + Event Created ← News & Event (hanya Published) ─

function buildNewsAndEventActivities(): RecentActivityItem[] {
  const items: RecentActivityItem[] = [];
  for (const n of getAllNewsEvent()) {
    if (n.status !== 'Published') continue;

    if (n.tipeKonten !== 'Event' && n.publishDate) {
      items.push({
        id: `recent-news-${n.id}`,
        type: 'News Published',
        category: 'News',
        icon: TYPE_ICON['News Published'],
        title: 'Artikel Dipublikasikan',
        summary: n.judul,
        sourceModule: 'News & Event',
        timestamp: isoAtNoon(n.publishDate),
        action: { label: 'Lihat Detail', route: `/news-event/${n.id}` },
      });
    }

    if (n.tipeKonten === 'Event' && n.acara) {
      items.push({
        id: `recent-event-${n.id}`,
        type: 'Event Created',
        category: 'Event',
        icon: TYPE_ICON['Event Created'],
        title: 'Event Dibuat',
        summary: `${n.acara.namaEvent} — ${n.acara.lokasi}`,
        sourceModule: 'News & Event',
        timestamp: isoAtNoon(n.createdAt),
        action: { label: 'Lihat Detail', route: `/news-event/${n.id}` },
      });
    }
  }
  return items;
}

// ─── Agregator utama ──────────────────────────────────────────────────────────

function buildAllRecentActivities(): RecentActivityItem[] {
  const workspaceId = getActiveWorkspace().id;

  const items: RecentActivityItem[] = [
    ...buildLivestockAddedActivities(),
    ...buildWeightRecordedActivities(),
    ...buildFeedRecordedActivities(),
    ...buildMedicineStockAddedActivities(),
    ...buildHealthCaseActivities(),
    ...buildMarketplacePublishedActivities(workspaceId),
    ...buildNewsAndEventActivities(),
  ];

  // Urut Terbaru → Terlama (Constitution → JUMLAH).
  items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return items;
}

/**
 * Live-computed Recent Activity — dipanggil langsung di body komponen (tidak
 * di-cache/disimpan) sehingga selalu mencerminkan kondisi terbaru dari
 * seluruh modul sumber. Berbeda dari Today's Activity: TIDAK dibatasi ke
 * "hari ini" — aktivitas kemarin/beberapa hari lalu tetap tampil selama
 * termasuk yang terbaru.
 */
export function getRecentActivities(): RecentActivityResult {
  try {
    const items = buildAllRecentActivities();
    return { state: items.length === 0 ? 'empty' : 'ok', items };
  } catch {
    return { state: 'error', items: [] };
  }
}

/** Menyaring hasil sesuai Filter (All atau salah satu Kategori) — hanya dipakai halaman "Lihat Semua". */
export function filterRecentActivities(items: RecentActivityItem[], filter: RecentActivityFilter): RecentActivityItem[] {
  if (filter === 'All') return items;
  return items.filter((item) => item.category === filter);
}

export const RECENT_ACTIVITY_DEFAULT_LIMIT = 10;

// Dashboard (Control Center) HANYA menampilkan ringkasan singkat: maksimal 5
// aktivitas terbaru, TANPA filter (Constitution → FILTER). Filter kategori +
// "Muat Lebih Banyak" lengkap ada di halaman terpisah (DashboardRecentActivity.tsx).
export const RECENT_ACTIVITY_DASHBOARD_LIMIT = 5;

export function getDashboardRecentActivities(): RecentActivityResult {
  const result = getRecentActivities();
  if (result.state !== 'ok') return result;
  return { state: 'ok', items: result.items.slice(0, RECENT_ACTIVITY_DASHBOARD_LIMIT) };
}
