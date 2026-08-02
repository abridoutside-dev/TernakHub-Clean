// ─── Dashboard News & Event Widget — Data Adapter ──────────────────────────
// DB-008 — Dashboard News & Event Widget
// Mengikuti docs/architecture/DASHBOARD_MODULE_CONSTITUTION.md dan
// docs/architecture/NEWS_EVENT_MODULE_CONSTITUTION.md.
//
// Widget ini BUKAN halaman News, BUKAN halaman Event — hanya ringkasan.
// Seluruh data dibaca live dari src/data/newsEventData.ts (satu-satunya
// sumber). Tidak ada data store baru, tidak ada duplikasi/penghitungan
// ulang logika modul asal: filter status Published sudah dilakukan oleh
// getAllNewsEvent()/getNewsFeed()/getUpcomingEvents(), status acara
// (Akan Datang/Berlangsung/Selesai) sudah dihitung oleh getStatusAcara() —
// di sini hanya diterjemahkan ke label widget ("Hari Ini"/"Segera"/
// "Membuka") tanpa mengubah tanggal atau logika penentuannya.

import {
  getNewsFeed,
  getUpcomingEvents,
  getStatusAcara,
  formatTanggalIndonesia,
  type NewsEventItem,
} from './newsEventData';

// ─── Types ───────────────────────────────────────────────────────────────────

export type DashboardNewsEventState = 'ok' | 'empty' | 'error';

/** Label status widget — turunan tampilan dari getStatusAcara(), bukan status baru. */
export type DashboardEventStatusLabel = 'Hari Ini' | 'Segera' | 'Membuka';

export interface DashboardEventCard {
  id: string;
  poster: string;
  title: string;
  tanggal: string;
  lokasi: string;
  statusLabel: DashboardEventStatusLabel;
  route: string;
}

export interface DashboardNewsCard {
  id: string;
  thumbnail: string;
  title: string;
  kategori: string;
  tanggal: string;
  route: string;
}

export interface DashboardEventResult {
  state: DashboardNewsEventState;
  items: DashboardEventCard[];
}

export interface DashboardNewsResult {
  state: DashboardNewsEventState;
  items: DashboardNewsCard[];
}

export const DASHBOARD_NEWS_EVENT_LIMIT = 2;

const AMBANG_SEGERA_HARI = 3;

/**
 * Menerjemahkan getStatusAcara() (Akan Datang/Berlangsung/Selesai) menjadi
 * label widget sesuai spesifikasi DB-008. "Selesai" tidak pernah muncul di
 * sini karena getUpcomingEvents() sudah menyaring event yang belum berakhir.
 */
function toStatusLabel(item: NewsEventItem, now: Date): DashboardEventStatusLabel {
  const acara = item.acara!;
  const status = getStatusAcara(acara, now);
  if (status === 'Berlangsung') return 'Hari Ini';

  const today = now.toISOString().slice(0, 10);
  const diffMs = new Date(acara.jadwalMulai).getTime() - new Date(today).getTime();
  const diffHari = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return diffHari <= AMBANG_SEGERA_HARI ? 'Segera' : 'Membuka';
}

/**
 * Event untuk widget Dashboard — maksimal 2, prioritas Event Hari Ini →
 * Event Terdekat. getUpcomingEvents() sudah mengurutkan berdasarkan jadwal
 * terdekat, sehingga event yang berlangsung/dimulai hari ini otomatis
 * berada di posisi teratas tanpa logika pengurutan baru di sini.
 */
export function getDashboardEvents(now: Date = new Date()): DashboardEventResult {
  try {
    const items = getUpcomingEvents(now)
      .slice(0, DASHBOARD_NEWS_EVENT_LIMIT)
      .map((item): DashboardEventCard => ({
        id: item.id,
        poster: item.acara!.poster,
        title: item.judul,
        tanggal: formatTanggalIndonesia(item.acara!.jadwalMulai),
        lokasi: item.acara!.lokasi,
        statusLabel: toStatusLabel(item, now),
        route: `/news-event/${item.id}`,
      }));
    return { state: items.length === 0 ? 'empty' : 'ok', items };
  } catch {
    return { state: 'error', items: [] };
  }
}

/** News/Article untuk widget Dashboard — maksimal 2, terbaru dahulu (dari getNewsFeed()). */
export function getDashboardNews(): DashboardNewsResult {
  try {
    const items = getNewsFeed()
      .slice(0, DASHBOARD_NEWS_EVENT_LIMIT)
      .map((item): DashboardNewsCard => ({
        id: item.id,
        thumbnail: item.cover,
        title: item.judul,
        kategori: item.kategori[0] ?? '-',
        tanggal: formatTanggalIndonesia(item.publishDate),
        route: `/news-event/${item.id}`,
      }));
    return { state: items.length === 0 ? 'empty' : 'ok', items };
  } catch {
    return { state: 'error', items: [] };
  }
}
