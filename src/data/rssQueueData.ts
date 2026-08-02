// ─── News & Event — RSS Queue & Reference Source (NEWS-006) ──────────────────
// Mengikuti docs/architecture/NEWS_EVENT_MODULE_CONSTITUTION.md →
// DUPLICATE DETECTION, REFERENCE SOURCE, PUBLISH RULE.
//
// RSS yang lolos AI Classification → masuk ke RssQueueItem (Waiting Publish).
// Admin memutuskan Publish / Reject / Archive — RSS tidak langsung publish.
//
// Duplicate Detection: artikel sama dari beberapa RSS sumber → satu QueueItem,
// sumber lain disimpan sebagai RssReferenceSource (bukan item terpisah).
//
// Publish: publishRssQueueItem() adalah satu-satunya jalur yang mendorong
// item ke NEWS_EVENT_LIST publik — konsisten dengan pola approveSubmission()
// di newsEventAdminReviewData.ts.

import { generateUUID } from '../utils/uuid';
import { NEWS_EVENT_LIST, type NewsEventKategori } from './newsEventData';
import { type AiClassificationResult } from './rssCollectorData';
import { getRssSourceById } from './rssSourceData';

// ─── RSS Queue Status ──────────────────────────────────────────────────────────
export type RssQueueStatus = 'Waiting Publish' | 'Published' | 'Rejected' | 'Archived';

export const RSS_QUEUE_STATUS_COLOR: Record<RssQueueStatus, { bg: string; color: string }> = {
  'Waiting Publish': { bg: '#fff3e0', color: '#e65100' },
  Published: { bg: '#e8f5ee', color: '#1b7a43' },
  Rejected: { bg: '#fbe1e1', color: '#a02020' },
  Archived: { bg: '#eceff1', color: '#607d8b' },
};

// ─── Reference Source — sumber duplikat yang tetap dicatat ───────────────────
// Constitution → DUPLICATE DETECTION + REFERENCE SOURCE:
// "Satu News dapat memiliki lebih dari satu Source."
export interface RssReferenceSource {
  sourceId: string;
  sourceName: string;
  sourceCategory: string; // RssSourceCategory value
  originalUrl: string;
  pubDate: string;        // ISO datetime — tanggal terbit di sumber tsb
  fetchedAt: string;
}

// ─── RSS Queue Item ────────────────────────────────────────────────────────────
export interface RssQueueItem {
  id: string;
  // Konten agregat (dari primary source)
  title: string;
  description: string;   // ringkasan / lead paragraph
  content: string;       // isi lengkap (jika tersedia dari feed)
  cover: string;         // placeholder emoji — konsisten dengan pola seluruh modul
  originalUrl: string;   // URL artikel di sumber primer
  pubDate: string;       // ISO datetime — tanggal terbit di sumber primer
  author?: string;
  // Primary Source
  primarySourceId: string;
  primarySourceName: string;
  primarySourceCategory: string; // RssSourceCategory
  // Klasifikasi AI
  topics: string[];              // RssTopik[]
  categories: NewsEventKategori[];
  tags: string[];
  language: string;
  aiClassification: AiClassificationResult;
  // Reference Sources (duplikat yang bergabung ke item ini)
  referenceSources: RssReferenceSource[];
  // Status
  status: RssQueueStatus;
  adminNote?: string;
  publishedNewsEventId?: string; // ID di NEWS_EVENT_LIST jika sudah Published
  createdAt: string;   // ISO datetime — kapan masuk queue
  updatedAt: string;
}

// ─── RSS Queue Store ──────────────────────────────────────────────────────────
// RSS_QUEUE_LIST dimulai kosong — tidak ada seed/dummy data.
// Item diisi oleh RSS Collector saat feed baru masuk dan lolos AI Classification.
// Jika belum ada item, halaman menampilkan Empty State yang sesuai.

export const RSS_QUEUE_LIST: RssQueueItem[] = [];

// ─── Query Helpers ─────────────────────────────────────────────────────────────

export function getAllRssQueueItems(): RssQueueItem[] {
  return RSS_QUEUE_LIST;
}

export function getRssQueueItemById(id: string): RssQueueItem | undefined {
  return RSS_QUEUE_LIST.find((i) => i.id === id);
}

export function getWaitingPublishList(): RssQueueItem[] {
  return RSS_QUEUE_LIST.filter((i) => i.status === 'Waiting Publish');
}

export function getRssQueueRingkasan() {
  const all = RSS_QUEUE_LIST;
  return {
    waitingPublish: all.filter((i) => i.status === 'Waiting Publish').length,
    published: all.filter((i) => i.status === 'Published').length,
    rejected: all.filter((i) => i.status === 'Rejected').length,
    archived: all.filter((i) => i.status === 'Archived').length,
    total: all.length,
  };
}

// ─── Admin Actions ─────────────────────────────────────────────────────────────

/**
 * Publish RSS Queue Item → NEWS_EVENT_LIST.
 * Satu-satunya jalur yang mendorong RSS item ke listing publik.
 * Admin tetap harus memutuskan — RSS tidak publish otomatis.
 */
export function publishRssQueueItem(id: string, adminNote?: string): RssQueueItem | undefined {
  const item = getRssQueueItemById(id);
  if (!item || item.status !== 'Waiting Publish') return item;

  const source = getRssSourceById(item.primarySourceId);
  const newsEventId = generateUUID();
  const today = new Date().toISOString().slice(0, 10);

  NEWS_EVENT_LIST.unshift({
    id: newsEventId,
    tipeKonten: 'News',
    judul: item.title,
    ringkasan: item.description,
    isi: item.content,
    cover: item.cover,
    gallery: [],
    publisher: {
      nama: item.primarySourceName,
      tipe: 'RSS',
      terverifikasi: true,
    },
    kategori: item.categories,
    tag: item.tags,
    status: 'Published',
    sumberPublikasi: 'Trusted RSS Feed',
    publishDate: today,
    createdAt: item.createdAt.slice(0, 10),
    updatedAt: today,
    isHighlight: false,
    rss: {
      sourceName: item.primarySourceName,
      sourceUrl: source?.sourceUrl ?? '',
      originalUrl: item.originalUrl,
      rssUrl: source?.rssUrl ?? '',
      publishDate: item.pubDate.slice(0, 10),
      crawlDate: item.createdAt.slice(0, 10),
      aiValidationStatus: 'Layak Dipublikasikan',
    },
  });

  item.status = 'Published';
  item.publishedNewsEventId = newsEventId;
  item.adminNote = adminNote;
  item.updatedAt = today;
  return item;
}

/** Reject RSS Queue Item. Admin wajib memberikan catatan alasan. */
export function rejectRssQueueItem(id: string, adminNote: string): RssQueueItem | undefined {
  const item = getRssQueueItemById(id);
  if (!item || item.status !== 'Waiting Publish') return item;
  if (!adminNote.trim()) return item;

  item.status = 'Rejected';
  item.adminNote = adminNote.trim();
  item.updatedAt = new Date().toISOString().slice(0, 10);
  return item;
}

/** Archive item (dari Published atau Waiting Publish). */
export function archiveRssQueueItem(id: string): RssQueueItem | undefined {
  const item = getRssQueueItemById(id);
  if (!item) return undefined;
  if (item.status === 'Rejected' || item.status === 'Archived') return item;

  item.status = 'Archived';
  item.updatedAt = new Date().toISOString().slice(0, 10);
  return item;
}
