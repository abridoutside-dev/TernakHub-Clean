// ─────────────────────────────────────────────────────────────────────────────
// DB-005 — Dashboard Today's Activity
// Mengikuti docs/architecture/DASHBOARD_MODULE_CONSTITUTION.md
//
// Today's Activity adalah RINGKASAN aktivitas hari ini pada Workspace aktif.
// BUKAN Audit Trail, BUKAN Timeline penuh, BUKAN riwayat permanen.
//
// File ini TIDAK memiliki database sendiri — seluruh item dibaca live setiap
// kali getTodayActivities() dipanggil, langsung dari modul asal:
//   • Livestock   ← src/data/livestockData.ts (+ src/utils/livestockSummary.ts)
//   • Feed        ← src/data/stokInventarisData.ts
//   • Medicine    ← src/data/riwayatObatData.ts (SSOT audit trail Stok Obat)
//   • Health      ← src/data/livestockData.ts (getHealthHistory)
//   • Marketplace ← src/data/marketplaceRiwayatAktivitasData.ts
//   • News/Event  ← src/data/newsEventData.ts
//
// Tidak ada tulis-menulis ke modul manapun dari file ini — murni agregator
// baca-saja, tidak menghitung ulang logika bisnis modul asal (hanya membaca
// hasil/record yang sudah ada dan menyusunnya menjadi bentuk siap-tampil).
//
// EXTENSIBLE: menambah ActivityType baru hanya perlu:
//   1. Tambah value baru ke union ActivityType.
//   2. Tambah builder function yang mengembalikan TodayActivityItem[].
//   3. Panggil builder tersebut di dalam buildAllActivities().
// Tidak perlu mengubah komponen render maupun tipe Filter (filter mengikuti
// ActivityCategory, bukan ActivityType, sehingga tetap stabil).
// ─────────────────────────────────────────────────────────────────────────────

import { getActiveWorkspace } from '../components/TopAppBar';
import { LIVESTOCK_DB, getWeightHistory, getHealthHistory } from './livestockData';
import { getAllRiwayatMasuk, getAllRiwayatPerubahan, getInventarisById } from './stokInventarisData';
import { getRiwayatObatList } from './riwayatObatData';
import { getAllAktivitas } from './marketplaceRiwayatAktivitasData';
import { getAllNewsEvent } from './newsEventData';

// ─── Kategori (dipakai untuk Filter) ───────────────────────────────────────────

export type ActivityCategory =
  | 'Livestock'
  | 'Feed'
  | 'Medicine'
  | 'Health'
  | 'Marketplace'
  | 'News'
  | 'Event';

export const ACTIVITY_CATEGORY_LIST: ActivityCategory[] = [
  'Livestock', 'Feed', 'Medicine', 'Health', 'Marketplace', 'News', 'Event',
];

export type ActivityFilter = 'All' | ActivityCategory;

export const ACTIVITY_FILTER_LIST: ActivityFilter[] = ['All', ...ACTIVITY_CATEGORY_LIST];

// ─── Jenis Aktivitas (minimal set Constitution — mudah ditambah) ─────────────

export type ActivityType =
  | 'Livestock Added'
  | 'Weight Recorded'
  | 'Feed Recorded'
  | 'Feed Stock Updated'
  | 'Medicine Stock Updated'
  | 'Health Case Created'
  | 'Marketplace Activity'
  | 'News Published'
  | 'Event Today'
  | string; // union terbuka — builder baru boleh memakai label baru tanpa mengubah tipe ini

// ─── Action (HANYA navigasi — tidak ada Edit/Delete) ─────────────────────────

export interface ActivityAction {
  label: 'Lihat Detail' | 'Buka Modul';
  route: string;
}

export type ActivityState = 'ok' | 'empty' | 'error';

export interface TodayActivityItem {
  id: string;
  type: ActivityType;
  category: ActivityCategory;
  icon: string;
  title: string;
  summary: string;
  /** Modul Asal. */
  sourceModule: string;
  /** ISO datetime — dipakai untuk sort & Relative Time. */
  timestamp: string;
  action: ActivityAction;
  // ── FUTURE READY (Constitution → FUTURE READY) ──────────────────────────
  // Struktur disiapkan agar AI Highlight / Priority / Favorite / Pinned dapat
  // ditambahkan tanpa mengubah arsitektur. Belum ada UI/logic yang mengisi
  // field ini pada DB-005 — semua opsional & default undefined/false.
  aiHighlight?: boolean;
  priority?: 'Rendah' | 'Sedang' | 'Tinggi';
  isFavorite?: boolean;
  isPinned?: boolean;
}

export interface TodayActivityResult {
  state: ActivityState;
  items: TodayActivityItem[];
}

// ─── Helper tanggal ────────────────────────────────────────────────────────────
// Shared via src/utils/dateUtils.ts — do NOT duplicate here.
import { parseFlexibleDateToIso, todayIso, isoAtNoon } from '../utils/dateUtils';

function isToday(rawDate: string | undefined | null, today: string): boolean {
  if (!rawDate) return false;
  return parseFlexibleDateToIso(rawDate) === today;
}

// ─── Meta tampilan per jenis aktivitas ────────────────────────────────────────

const TYPE_ICON: Record<string, string> = {
  'Livestock Added': '🐣',
  'Weight Recorded': '⚖️',
  'Feed Recorded': '🌿',
  'Feed Stock Updated': '🌾',
  'Medicine Stock Updated': '💊',
  'Health Case Created': '🩺',
  'Marketplace Activity': '🛒',
  'News Published': '📰',
  'Event Today': '📅',
};

// ─── 1. Livestock Added ← Livestock (digitalIdentity.registeredDate) ─────────

function buildLivestockAddedActivities(today: string): TodayActivityItem[] {
  const items: TodayActivityItem[] = [];
  for (const lv of Object.values(LIVESTOCK_DB)) {
    if (!isToday(lv.digitalIdentity?.registeredDate, today)) continue;
    const iso = parseFlexibleDateToIso(lv.digitalIdentity.registeredDate) ?? today;
    items.push({
      id: `livestock-added-${lv.id}`,
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

function buildWeightRecordedActivities(today: string): TodayActivityItem[] {
  const items: TodayActivityItem[] = [];
  for (const lv of Object.values(LIVESTOCK_DB)) {
    const history = getWeightHistory(lv.id);
    for (const entry of history) {
      if (!isToday(entry.date, today)) continue;
      const iso = parseFlexibleDateToIso(entry.date) ?? today;
      items.push({
        id: `weight-${lv.id}-${entry.date}-${entry.weight}`,
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

// ─── 3 & 4. Feed Recorded + Feed Stock Updated ← Stok Pakan ──────────────────

function buildFeedActivities(today: string): TodayActivityItem[] {
  const items: TodayActivityItem[] = [];

  // Feed Stock Updated — seluruh Stok Masuk (Tambah Stok, Marketplace, Produksi
  // Formula, Penyesuaian Stok, Pindah Gudang).
  for (const r of getAllRiwayatMasuk()) {
    if (!isToday(r.createdAt, today)) continue;
    const inv = getInventarisById(r.inventarisId);
    items.push({
      id: `feed-masuk-${r.id}`,
      type: 'Feed Stock Updated',
      category: 'Feed',
      icon: TYPE_ICON['Feed Stock Updated'],
      title: 'Stok Pakan Bertambah',
      summary: `${inv?.nama ?? r.inventarisId}: +${r.jumlah} ${r.satuan} (${r.sumber})`,
      sourceModule: 'Stok Pakan',
      timestamp: r.createdAt,
      action: { label: 'Lihat Detail', route: `/stok-pakan/inventaris/${r.inventarisId}` },
    });
  }

  // Feed Recorded (Pemberian Pakan) vs Feed Stock Updated (jenis perubahan lain).
  for (const r of getAllRiwayatPerubahan()) {
    if (!isToday(r.createdAt, today)) continue;
    const inv = getInventarisById(r.inventarisId);
    if (r.sumberPerubahan === 'Pemberian Pakan') {
      items.push({
        id: `feed-pemberian-${r.id}`,
        type: 'Feed Recorded',
        category: 'Feed',
        icon: TYPE_ICON['Feed Recorded'],
        title: 'Pakan Diberikan',
        summary: `${inv?.nama ?? r.inventarisId} diberikan ke ${r.namaTernak ?? r.grupTernak ?? 'ternak'} (-${r.jumlah} ${r.satuan})`,
        sourceModule: 'Stok Pakan',
        timestamp: r.createdAt,
        action: { label: 'Lihat Detail', route: `/stok-pakan/inventaris/${r.inventarisId}` },
      });
    } else {
      items.push({
        id: `feed-keluar-${r.id}`,
        type: 'Feed Stock Updated',
        category: 'Feed',
        icon: TYPE_ICON['Feed Stock Updated'],
        title: 'Stok Pakan Berkurang',
        summary: `${inv?.nama ?? r.inventarisId}: -${r.jumlah} ${r.satuan} (${r.jenis})`,
        sourceModule: 'Stok Pakan',
        timestamp: r.createdAt,
        action: { label: 'Lihat Detail', route: `/stok-pakan/inventaris/${r.inventarisId}` },
      });
    }
  }

  return items;
}

// ─── 5. Medicine Stock Updated ← Riwayat Obat (SO-006, SSOT) ─────────────────

function buildMedicineActivities(today: string): TodayActivityItem[] {
  const items: TodayActivityItem[] = [];
  for (const r of getRiwayatObatList()) {
    if (!isToday(r.timestamp, today)) continue;
    items.push({
      id: `medicine-${r.uuid}`,
      type: 'Medicine Stock Updated',
      category: 'Medicine',
      icon: TYPE_ICON['Medicine Stock Updated'],
      title: 'Stok Obat Diperbarui',
      summary: `${r.namaProduk} (${r.brand}): ${r.jenisAktivitas} — ${r.jumlahPerubahan > 0 ? '+' : ''}${r.jumlahPerubahan} ${r.satuan}`,
      sourceModule: 'Stok Obat',
      timestamp: r.timestamp,
      action: { label: 'Lihat Detail', route: `/stok-obat/riwayat/${r.uuid}` },
    });
  }
  return items;
}

// ─── 6. Health Case Created ← Livestock (getHealthHistory per animal) ────────

function buildHealthActivities(today: string): TodayActivityItem[] {
  const items: TodayActivityItem[] = [];
  for (const lv of Object.values(LIVESTOCK_DB)) {
    const history = getHealthHistory(lv.id);
    for (const entry of history) {
      if (!isToday(entry.date, today)) continue;
      const iso = parseFlexibleDateToIso(entry.date) ?? today;
      items.push({
        id: `health-${lv.id}-${entry.date}-${entry.activity}`,
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

// ─── 7. Marketplace Activity ← Riwayat Aktivitas Marketplace (MPK-016) ───────

function buildMarketplaceActivities(today: string, workspaceId: string): TodayActivityItem[] {
  const items: TodayActivityItem[] = [];
  for (const a of getAllAktivitas(workspaceId)) {
    if (!isToday(a.waktu, today)) continue;
    items.push({
      id: `marketplace-${a.id}`,
      type: 'Marketplace Activity',
      category: 'Marketplace',
      icon: a.icon || TYPE_ICON['Marketplace Activity'],
      title: a.jenisAktivitas,
      summary: a.ringkasan,
      sourceModule: 'Marketplace',
      timestamp: a.waktu,
      action: { label: 'Buka Modul', route: '/marketplace/riwayat' },
    });
  }
  return items;
}

// ─── 8 & 9. News Published + Event Today ← News & Event (hanya Published) ────

function buildNewsAndEventActivities(today: string): TodayActivityItem[] {
  const items: TodayActivityItem[] = [];
  for (const n of getAllNewsEvent()) {
    // Hanya konten dengan status Published yang boleh muncul di Today's Activity
    // (sama dengan pola di recentActivityData.ts). Draft/Scheduled/Archived
    // TIDAK ditampilkan meskipun publishDate-nya cocok dengan hari ini.
    if (n.status !== 'Published') continue;

    // News Published — konten (bukan Event) yang dipublikasikan hari ini.
    if (n.tipeKonten !== 'Event' && n.publishDate === today) {
      items.push({
        id: `news-${n.id}`,
        type: 'News Published',
        category: 'News',
        icon: TYPE_ICON['News Published'],
        title: 'Berita Dipublikasikan',
        summary: n.judul,
        sourceModule: 'News & Event',
        timestamp: isoAtNoon(n.publishDate),
        action: { label: 'Lihat Detail', route: `/news-event/${n.id}` },
      });
    }
    // Event Today — Event yang jadwalnya berlangsung hari ini.
    if (n.tipeKonten === 'Event' && n.acara) {
      const mulai = n.acara.jadwalMulai;
      const selesai = n.acara.jadwalSelesai ?? mulai;
      if (mulai <= today && today <= selesai) {
        items.push({
          id: `event-${n.id}`,
          type: 'Event Today',
          category: 'Event',
          icon: TYPE_ICON['Event Today'],
          title: 'Event Hari Ini',
          summary: `${n.acara.namaEvent} — ${n.acara.lokasi}`,
          sourceModule: 'News & Event',
          timestamp: isoAtNoon(today),
          action: { label: 'Lihat Detail', route: `/news-event/${n.id}` },
        });
      }
    }
  }
  return items;
}

// ─── Agregator utama ──────────────────────────────────────────────────────────

function buildAllActivities(now: Date): TodayActivityItem[] {
  const today = todayIso(now);
  const workspaceId = getActiveWorkspace().id;

  const items: TodayActivityItem[] = [
    ...buildLivestockAddedActivities(today),
    ...buildWeightRecordedActivities(today),
    ...buildFeedActivities(today),
    ...buildMedicineActivities(today),
    ...buildHealthActivities(today),
    ...buildMarketplaceActivities(today, workspaceId),
    ...buildNewsAndEventActivities(today),
  ];

  // Urut Terbaru → Terlama (Constitution → LAYOUT).
  items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return items;
}

/**
 * Live-computed Today's Activity — dipanggil langsung di body komponen
 * (tidak di-cache/disimpan) sehingga selalu mencerminkan kondisi terbaru
 * dari seluruh modul sumber. `now` hanya untuk keperluan test/override —
 * default selalu waktu sistem sesungguhnya.
 */
export function getTodayActivities(now: Date = new Date()): TodayActivityResult {
  try {
    const items = buildAllActivities(now);
    return { state: items.length === 0 ? 'empty' : 'ok', items };
  } catch {
    return { state: 'error', items: [] };
  }
}

/** Menyaring hasil sesuai Filter (All atau salah satu Kategori). */
export function filterActivities(items: TodayActivityItem[], filter: ActivityFilter): TodayActivityItem[] {
  if (filter === 'All') return items;
  return items.filter((item) => item.category === filter);
}

export const TODAY_ACTIVITY_DEFAULT_LIMIT = 10;

// DB-003R — Dashboard (Control Center) hanya menampilkan ringkasan singkat:
// maksimal 5 aktivitas terbaru, dengan tombol "Lihat Semua" menuju halaman
// terpisah (lihat DashboardTodayActivity.tsx) yang masih memakai
// TODAY_ACTIVITY_DEFAULT_LIMIT + filter kategori + "Muat Lebih Banyak".
export const TODAY_ACTIVITY_DASHBOARD_LIMIT = 5;
