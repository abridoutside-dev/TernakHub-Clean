// ─── News & Event — Struktur Konten, Kategori & Sumber Publikasi (NEWS-002) ──
// Mengikuti docs/architecture/NEWS_EVENT_MODULE_CONSTITUTION.md.
//
// News & Event BUKAN media sosial: tidak ada like/follow/comment/share/chat.
// Struktur data ini disiapkan agar dapat ditumpangi oleh 4 sumber publikasi
// (Trusted RSS Feed, Official Event, Workspace PRO, Workspace Enterprise)
// tanpa mengubah arsitektur — lihat Constitution → CONTENT PRIORITY.
//
// Lingkup NEWS-002 HANYA struktur data (Content, Event, RSS, Publisher).
// TIDAK ada UI AI Validation, UI Approval, atau RSS Crawler di sini — itu
// adalah pekerjaan task selanjutnya (NEWS-003+). Seluruh item seed di bawah
// sudah berstatus "Published" agar halaman listing (NEWS-001) tetap berfungsi;
// status lain (Draft/AI Validation/Waiting Approval/Scheduled/Rejected/
// Archived) sudah didukung oleh tipe data namun belum memiliki UI pengelola.

import { generateUUID } from '../utils/uuid';

// ─── Jenis Konten ─────────────────────────────────────────────────────────────
// Minimal 5 (Constitution → CONTENT TYPES). Union string dipilih agar mudah
// ditambah di masa depan tanpa mengubah struktur relasi lain.
export type NewsEventTipeKonten = 'News' | 'Event' | 'Announcement' | 'Education' | 'Article';

// ─── Sumber Publikasi & Priority (Constitution → CONTENT PRIORITY) ───────────
export type NewsEventSumberPublikasi =
  | 'Trusted RSS Feed'
  | 'Official Event'
  | 'Workspace PRO'
  | 'Workspace Enterprise';

/** Priority 1 (tertinggi) → Priority 4 (terendah), persis urutan Constitution. */
export const SUMBER_PUBLIKASI_PRIORITAS: Record<NewsEventSumberPublikasi, number> = {
  'Trusted RSS Feed': 1,
  'Official Event': 2,
  'Workspace PRO': 3,
  'Workspace Enterprise': 4,
};

export const SUMBER_PUBLIKASI_LIST: NewsEventSumberPublikasi[] = [
  'Trusted RSS Feed',
  'Official Event',
  'Workspace PRO',
  'Workspace Enterprise',
];

// ─── Status Publikasi (Constitution → PUBLICATION WORKFLOW) ─────────────────
// Draft → AI Validation → Waiting Approval → (Scheduled) → Published → Archived
// Rejected dapat terjadi setelah AI Validation / Waiting Approval.
export type NewsEventStatusPublikasi =
  | 'Draft'
  | 'AI Validation'
  | 'Waiting Approval'
  | 'Scheduled'
  | 'Published'
  | 'Rejected'
  | 'Archived';

export const STATUS_PUBLIKASI_URUTAN: NewsEventStatusPublikasi[] = [
  'Draft',
  'AI Validation',
  'Waiting Approval',
  'Scheduled',
  'Published',
  'Rejected',
  'Archived',
];

// ─── Kategori (Supported Topics — Constitution → SUPPORTED TOPICS) ───────────
// Minimal 21 kategori. Satu konten dapat memiliki lebih dari satu kategori
// (mis. artikel tentang pakan sapi → ['Sapi', 'Pakan']), sehingga disimpan
// sebagai array — konsisten dengan pernyataan Constitution "Kategori dapat
// bertambah tanpa mengubah arsitektur".
export type NewsEventKategori =
  | 'Peternakan'
  | 'Domba'
  | 'Kambing'
  | 'Sapi'
  | 'Kerbau'
  | 'Kuda'
  | 'Babi'
  | 'Ayam'
  | 'Bebek'
  | 'Pakan'
  | 'Nutrisi'
  | 'Hijauan'
  | 'Silase'
  | 'Hay'
  | 'Obat Hewan'
  | 'Penyakit Hewan'
  | 'Teknologi'
  | 'Marketplace'
  | 'Regulasi'
  | 'Event'
  | 'Lainnya';

export const KATEGORI_TOPIK_LIST: NewsEventKategori[] = [
  'Peternakan', 'Domba', 'Kambing', 'Sapi', 'Kerbau', 'Kuda', 'Babi', 'Ayam', 'Bebek',
  'Pakan', 'Nutrisi', 'Hijauan', 'Silase', 'Hay', 'Obat Hewan', 'Penyakit Hewan',
  'Teknologi', 'Marketplace', 'Regulasi', 'Event', 'Lainnya',
];

// ─── Publisher (Constitution → PUBLISHER) ────────────────────────────────────
export type NewsEventPublisherTipe =
  | 'RSS'
  | 'Administrator'
  | 'Workspace PRO'
  | 'Workspace Enterprise'
  | 'Mitra Resmi';

export interface NewsEventPublisher {
  nama: string;
  tipe: NewsEventPublisherTipe;
  terverifikasi: boolean;
  /** Hanya terisi jika tipe === 'Workspace PRO' | 'Workspace Enterprise'. */
  workspaceId?: string;
}

// ─── Gallery ──────────────────────────────────────────────────────────────────
export interface NewsEventGalleryItem {
  id: string;
  url: string; // placeholder emoji/ikon — belum ada upload media (NEWS-002 = struktur saja)
  keterangan?: string;
}

// ─── Struktur Event (Constitution → STRUKTUR EVENT) ──────────────────────────
export interface NewsEventTitikMaps {
  latitude: number;
  longitude: number;
}

export interface NewsEventDetailAcara {
  namaEvent: string;
  penyelenggara: string;
  lokasi: string;
  titikMaps?: NewsEventTitikMaps;
  jadwalMulai: string; // ISO yyyy-mm-dd
  jadwalSelesai?: string; // ISO yyyy-mm-dd
  jam?: string;
  kontak: string;
  poster: string; // placeholder emoji/ikon poster
  linkPendaftaran?: string;
  biaya?: string;
  kuota?: number;
}

// ─── Struktur RSS (Constitution → STRUKTUR RSS + RSS VALIDATION) ─────────────
export type NewsEventAiValidationStatus =
  | 'Belum Divalidasi'
  | 'Layak Dipublikasikan'
  | 'Perlu Revisi'
  | 'Ditolak';

export interface NewsEventDetailRss {
  sourceName: string;
  sourceUrl: string;
  originalUrl: string;
  rssUrl: string;
  publishDate: string; // ISO yyyy-mm-dd — tanggal terbit di sumber asli
  crawlDate: string; // ISO yyyy-mm-dd — tanggal diambil oleh (calon) crawler
  aiValidationStatus: NewsEventAiValidationStatus;
}

// ─── Struktur Konten Utama (Constitution → STRUKTUR KONTEN) ──────────────────
export interface NewsEventItem {
  id: string; // UUID v4 — dibuat oleh generateUUID(), tidak pernah ditampilkan
  tipeKonten: NewsEventTipeKonten;
  judul: string;
  ringkasan: string;
  isi: string; // konten lengkap (rich text disederhanakan sebagai paragraf teks)
  cover: string; // placeholder emoji/ikon cover
  gallery: NewsEventGalleryItem[];
  publisher: NewsEventPublisher;
  /** Hanya terisi jika publisher berasal dari Workspace PRO/Enterprise. */
  workspaceId?: string;
  kategori: NewsEventKategori[];
  tag: string[];
  status: NewsEventStatusPublikasi;
  sumberPublikasi: NewsEventSumberPublikasi;
  publishDate: string | null; // ISO yyyy-mm-dd — null selama belum Published
  createdAt: string; // ISO yyyy-mm-dd
  updatedAt: string; // ISO yyyy-mm-dd
  /** Hanya terisi untuk tipeKonten === 'Event' (Constitution → EVENT PRINCIPLE). */
  acara?: NewsEventDetailAcara;
  /** Hanya terisi jika sumberPublikasi === 'Trusted RSS Feed'. */
  rss?: NewsEventDetailRss;
  /**
   * Kurasi editorial untuk section Highlight pada listing (NEWS-001).
   * BUKAN metrik popularitas/like — murni penanda tampil-di-highlight yang
   * diatur pada saat Admin Review, sesuai larangan Constitution atas
   * "popularitas sebagai dasar publikasi".
   */
  isHighlight: boolean;
}

// ─── In-Memory Cache ──────────────────────────────────────────────────────────
// NEWS_EVENT_LIST adalah cache runtime — dimuat oleh newsEventService.ts dari
// Supabase saat halaman News & Event pertama kali dibuka. Tidak ada seed data.
// Admin mutations (approveSubmission, publishNow, publishRssQueueItem)
// mendorong item langsung ke array ini setelah berhasil.
//
// Jika database kosong atau belum tersedia, array tetap kosong dan halaman
// menampilkan Empty State yang sesuai.

export const NEWS_EVENT_LIST: NewsEventItem[] = [];

// ─── Query Helpers ────────────────────────────────────────────────────────────
// Sesuai batasan NEWS-002 ("Jangan mengubah arsitektur"), fungsi-fungsi ini
// tetap mempertahankan kontrak dari NEWS-001 (getAllNewsEvent/getHighlightList/
// getNewsFeed/getUpcomingEvents/searchNewsEvent/formatTanggalIndonesia), hanya
// disesuaikan terhadap struktur field baru. Seluruh query hanya mengembalikan
// konten berstatus "Published" — Draft/AI Validation/Waiting Approval/
// Scheduled/Rejected/Archived tidak pernah tampil di listing publik.

export function getAllNewsEvent(): NewsEventItem[] {
  return NEWS_EVENT_LIST.filter((item) => item.status === 'Published');
}

function byTanggalTerbaru(a: NewsEventItem, b: NewsEventItem): number {
  return (b.publishDate ?? '').localeCompare(a.publishDate ?? '');
}

/** Highlight: maksimal 5, diurutkan sesuai Content Priority pada Constitution. */
export function getHighlightList(): NewsEventItem[] {
  return getAllNewsEvent()
    .filter((item) => item.isHighlight)
    .sort(
      (a, b) =>
        SUMBER_PUBLIKASI_PRIORITAS[a.sumberPublikasi] - SUMBER_PUBLIKASI_PRIORITAS[b.sumberPublikasi] ||
        byTanggalTerbaru(a, b)
    )
    .slice(0, 5);
}

/** News Feed: gabungan Trusted RSS + Official Publication + Workspace Publication, terbaru dahulu (default). */
export function getNewsFeed(): NewsEventItem[] {
  return getAllNewsEvent()
    .filter((item) => item.tipeKonten !== 'Event')
    .sort(byTanggalTerbaru);
}

/** Upcoming Event: hanya event yang belum berakhir relatif terhadap `now`, diurutkan jadwal terdekat. */
export function getUpcomingEvents(now: Date = new Date()): NewsEventItem[] {
  const today = now.toISOString().slice(0, 10);
  return getAllNewsEvent()
    .filter((item) => item.tipeKonten === 'Event' && item.acara)
    .filter((item) => (item.acara!.jadwalSelesai ?? item.acara!.jadwalMulai) >= today)
    .sort((a, b) => a.acara!.jadwalMulai.localeCompare(b.acara!.jadwalMulai));
}

/**
 * Latest Event: Event yang sudah Published dan belum berakhir, diurutkan Publish Date terbaru.
 * Expired events (jadwalSelesai < today) dikecualikan — gunakan Riwayat/arsip untuk event lama.
 * Tidak ada limit internal — pemanggil boleh menerapkan .slice() setelah filter lebih lanjut.
 */
export function getLatestEvents(now: Date = new Date()): NewsEventItem[] {
  const today = now.toISOString().slice(0, 10);
  return getAllNewsEvent()
    .filter((item) => item.tipeKonten === 'Event' && item.acara)
    .filter((item) => (item.acara!.jadwalSelesai ?? item.acara!.jadwalMulai) >= today)
    .sort(byTanggalTerbaru);
}

/** Mengambil satu konten Published berdasarkan id. Draft/AI Validation/dst tidak pernah dikembalikan. */
export function getNewsEventById(id: string): NewsEventItem | undefined {
  return getAllNewsEvent().find((item) => item.id === id);
}

// ─── Status Event (dihitung otomatis dari tanggal, bukan disimpan) ──────────
export type NewsEventStatusAcara = 'Akan Datang' | 'Berlangsung' | 'Selesai';

export function getStatusAcara(
  acara: NewsEventDetailAcara,
  now: Date = new Date()
): NewsEventStatusAcara {
  const today = now.toISOString().slice(0, 10);
  const mulai = acara.jadwalMulai;
  const selesai = acara.jadwalSelesai ?? acara.jadwalMulai;
  if (today < mulai) return 'Akan Datang';
  if (today > selesai) return 'Selesai';
  return 'Berlangsung';
}

function cocok(haystack: string | undefined, keyword: string): boolean {
  if (!haystack) return false;
  return haystack.toLowerCase().includes(keyword.toLowerCase());
}

/**
 * Filter utama (Constitution's minimal content types + sumber RSS/Workspace).
 * "RSS" dan "Workspace" adalah filter berbasis Sumber Publikasi, terpisah dari
 * filter berbasis Jenis Konten (News/Event/Edukasi/Pengumuman).
 */
export type NewsEventFilter = 'Semua' | 'News' | 'Event' | 'Edukasi' | 'Pengumuman' | 'RSS' | 'Workspace';

export const FILTER_LIST: NewsEventFilter[] = [
  'Semua', 'News', 'Event', 'Edukasi', 'Pengumuman', 'RSS', 'Workspace',
];

const FILTER_KE_TIPE_KONTEN: Record<
  Exclude<NewsEventFilter, 'Semua' | 'RSS' | 'Workspace'>,
  NewsEventTipeKonten[]
> = {
  News: ['News', 'Article'],
  Event: ['Event'],
  Edukasi: ['Education'],
  Pengumuman: ['Announcement'],
};

function cocokFilter(item: NewsEventItem, filter: NewsEventFilter): boolean {
  if (filter === 'Semua') return true;
  if (filter === 'RSS') return item.sumberPublikasi === 'Trusted RSS Feed';
  if (filter === 'Workspace')
    return item.sumberPublikasi === 'Workspace PRO' || item.sumberPublikasi === 'Workspace Enterprise';
  return FILTER_KE_TIPE_KONTEN[filter].includes(item.tipeKonten);
}

/** Sort minimal (Constitution → SORT): Terbaru, Terlama, Paling Relevan, Event Terdekat. */
export type NewsEventSort = 'Terbaru' | 'Terlama' | 'Paling Relevan' | 'Event Terdekat';

export const SORT_LIST: NewsEventSort[] = ['Terbaru', 'Terlama', 'Paling Relevan', 'Event Terdekat'];

/** Skor relevansi sederhana terhadap kata kunci: judul > tag > kategori > ringkasan > publisher. */
function skorRelevansi(item: NewsEventItem, kw: string): number {
  if (!kw) return 0;
  let skor = 0;
  if (cocok(item.judul, kw)) skor += 5;
  if (item.tag.some((t) => cocok(t, kw))) skor += 3;
  if (item.kategori.some((k) => cocok(k, kw))) skor += 2;
  if (cocok(item.ringkasan, kw)) skor += 2;
  if (cocok(item.publisher.nama, kw)) skor += 1;
  return skor;
}

function jarakJadwalTerdekat(item: NewsEventItem, today: string): number {
  const acuan = item.acara?.jadwalMulai ?? item.publishDate ?? today;
  return Math.abs(new Date(acuan).getTime() - new Date(today).getTime());
}

export function applySort(
  items: NewsEventItem[],
  sort: NewsEventSort,
  keyword: string,
  now: Date = new Date()
): NewsEventItem[] {
  const kw = keyword.trim().toLowerCase();
  const today = now.toISOString().slice(0, 10);
  const hasil = [...items];
  if (sort === 'Terbaru') return hasil.sort(byTanggalTerbaru);
  if (sort === 'Terlama') return hasil.sort((a, b) => -byTanggalTerbaru(a, b));
  if (sort === 'Event Terdekat')
    return hasil.sort((a, b) => jarakJadwalTerdekat(a, today) - jarakJadwalTerdekat(b, today));
  // Paling Relevan — tanpa kata kunci, fallback ke Terbaru agar tetap deterministik.
  if (!kw) return hasil.sort(byTanggalTerbaru);
  return hasil.sort((a, b) => skorRelevansi(b, kw) - skorRelevansi(a, kw) || byTanggalTerbaru(a, b));
}

/**
 * Filter (News/Event/Edukasi/Pengumuman/RSS/Workspace) + kategori topik
 * (opsional, salah satu dari 21 topik) + kata kunci bebas — mencari
 * Judul, Ringkasan, Tag, dan Publisher sesuai Constitution → SEARCH.
 */
export function searchNewsEvent(
  items: NewsEventItem[],
  filter: NewsEventFilter,
  keyword: string,
  kategoriTopik?: NewsEventKategori | 'Semua'
): NewsEventItem[] {
  const kw = keyword.trim().toLowerCase();
  return items.filter((item) => {
    if (!cocokFilter(item, filter)) return false;
    if (kategoriTopik && kategoriTopik !== 'Semua' && !item.kategori.includes(kategoriTopik)) return false;
    if (!kw) return true;
    return (
      cocok(item.judul, kw) ||
      cocok(item.ringkasan, kw) ||
      item.tag.some((t) => cocok(t, kw)) ||
      cocok(item.publisher.nama, kw)
    );
  });
}

/** Related Content ("Mungkin Anda Tertarik") — kecocokan Kategori, Tag, dan Jenis Konten. */
export function getRelatedContent(item: NewsEventItem, limit = 4): NewsEventItem[] {
  const skorTerkait = (kandidat: NewsEventItem): number => {
    let skor = 0;
    if (kandidat.tipeKonten === item.tipeKonten) skor += 2;
    skor += kandidat.kategori.filter((k) => item.kategori.includes(k)).length * 2;
    skor += kandidat.tag.filter((t) => item.tag.includes(t)).length * 3;
    return skor;
  };
  return getAllNewsEvent()
    .filter((kandidat) => kandidat.id !== item.id)
    .map((kandidat) => ({ kandidat, skor: skorTerkait(kandidat) }))
    .filter(({ skor }) => skor > 0)
    .sort((a, b) => b.skor - a.skor || byTanggalTerbaru(a.kandidat, b.kandidat))
    .slice(0, limit)
    .map(({ kandidat }) => kandidat);
}

export function formatTanggalIndonesia(iso: string | null | undefined): string {
  if (!iso) return '-';
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${BULAN[m - 1]} ${y}`;
}

/**
 * Helper penerbitan baru — dipakai oleh alur Draft di masa depan (NEWS-004+).
 * Diletakkan di sini (bukan UI) agar seluruh pembuatan id konsisten UUID v4.
 */
export function createDraftNewsEventId(): string {
  return generateUUID();
}
