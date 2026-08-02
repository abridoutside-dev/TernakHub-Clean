// ─── News & Event Service (DB-001B) ───────────────────────────────────────────
// Repository resmi untuk data News & Event.
// Mengambil data dari Supabase table `news_publications` (DB-001A).
// Jika tabel belum tersedia atau terjadi error, mengembalikan array kosong
// dan mencatat peringatan di console — tidak ada fallback ke data statis.
//
// Alur data:
//   Supabase news_publications → loadPublishedNewsEvents() → NEWS_EVENT_LIST (cache) →
//   helper functions (getAllNewsEvent, getHighlightList, dst.) → UI
//
// Mutation admin (approveSubmission, publishNow, publishRssQueueItem) tetap
// berjalan in-memory dan mendorong item ke NEWS_EVENT_LIST secara langsung,
// sesuai arsitektur yang ada.

import { supabase } from '../lib/supabase';
import {
  NEWS_EVENT_LIST,
  type NewsEventItem,
  type NewsEventTipeKonten,
  type NewsEventStatusPublikasi,
  type NewsEventSumberPublikasi,
} from '../data/newsEventData';

// ─── DB row shape (news_publications, DB-001A) ────────────────────────────────

interface NewsPublicationRow {
  id: string;
  workspace_id: string | null;
  title: string;
  slug: string;
  content: string | null;
  summary: string | null;
  thumbnail_url: string | null;
  tipe_konten: string;
  kategori: string | null;
  tags: string[] | null;
  status: string;
  source: string | null;
  source_url: string | null;
  rss_source_id: string | null;
  author_name: string | null;
  published_at: string | null;
  event_start_date: string | null;
  event_end_date: string | null;
  event_location: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

// ─── Field mappers ────────────────────────────────────────────────────────────

function mapTipeKonten(db: string): NewsEventTipeKonten {
  const map: Record<string, NewsEventTipeKonten> = {
    Berita:      'News',
    Artikel:     'Article',
    Event:       'Event',
    Pengumuman:  'Announcement',
    Tips:        'Education',
    Regulasi:    'Education',
  };
  return map[db] ?? 'News';
}

function mapStatus(db: string): NewsEventStatusPublikasi {
  const map: Record<string, NewsEventStatusPublikasi> = {
    Draft:         'Draft',
    PendingReview: 'Waiting Approval',
    Published:     'Published',
    Rejected:      'Rejected',
    Archived:      'Archived',
  };
  return (map[db] as NewsEventStatusPublikasi) ?? 'Draft';
}

function mapSumber(db: string | null): NewsEventSumberPublikasi {
  if (db === 'RSS')       return 'Trusted RSS Feed';
  if (db === 'Workspace') return 'Workspace PRO';
  return 'Official Event'; // Admin or unknown
}

/** Converts an ISO datetime string to yyyy-mm-dd. */
function toDate(iso: string | null): string {
  if (!iso) return '';
  return iso.length >= 10 ? iso.substring(0, 10) : iso;
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

function adaptRow(row: NewsPublicationRow): NewsEventItem {
  const tipeKonten = mapTipeKonten(row.tipe_konten);
  const isWorkspaceSource = row.source === 'Workspace';

  return {
    id:          row.id,
    tipeKonten,
    judul:       row.title,
    ringkasan:   row.summary    ?? '',
    isi:         row.content    ?? '',
    cover:       row.thumbnail_url ?? '📰',
    gallery:     row.thumbnail_url
      ? [{ id: `${row.id}-cover`, url: row.thumbnail_url, keterangan: '' }]
      : [],
    publisher: {
      tipe:         isWorkspaceSource ? 'Workspace PRO' : 'Administrator',
      nama:         row.author_name ?? 'TernakHub',
      terverifikasi: true,
      workspaceId:  row.workspace_id ?? undefined,
    },
    workspaceId:      row.workspace_id ?? undefined,
    kategori:         row.kategori ? [row.kategori as NewsEventItem['kategori'][0]] : [],
    tag:              row.tags ?? [],
    status:           mapStatus(row.status),
    sumberPublikasi:  mapSumber(row.source),
    publishDate:      row.published_at ? toDate(row.published_at) : null,
    createdAt:        toDate(row.created_at),
    updatedAt:        toDate(row.updated_at),
    isHighlight:      false,
  } satisfies NewsEventItem;
}

// ─── Fetch Published News & Events ────────────────────────────────────────────

/**
 * Memuat seluruh News & Event berstatus Published dari Supabase.
 * Memperbarui NEWS_EVENT_LIST (in-memory cache) dengan hasil query.
 * Mengembalikan array kosong jika tabel tidak ada atau terjadi error.
 */
export async function loadPublishedNewsEvents(): Promise<NewsEventItem[]> {
  try {
    const { data, error } = await supabase
      .from('news_publications')
      .select('*')
      .eq('status', 'Published')
      .order('published_at', { ascending: false });

    if (error) {
      console.warn('[newsEventService] Tidak dapat memuat News & Event:', error.message);
      NEWS_EVENT_LIST.length = 0;
      return [];
    }

    const items = (data ?? []).map((row) => adaptRow(row as NewsPublicationRow));
    NEWS_EVENT_LIST.length = 0;
    NEWS_EVENT_LIST.push(...items);
    return items;
  } catch (err) {
    console.warn('[newsEventService] Error tidak terduga saat memuat News & Event:', err);
    NEWS_EVENT_LIST.length = 0;
    return [];
  }
}

// ─── Fetch Single Item ────────────────────────────────────────────────────────

/**
 * Memuat satu item News & Event berdasarkan ID.
 * Hanya mengembalikan item berstatus Published.
 * Memeriksa cache in-memory terlebih dahulu sebelum query Supabase.
 */
export async function loadNewsEventById(id: string): Promise<NewsEventItem | null> {
  if (!id) return null;

  // Periksa cache in-memory (sudah di-load oleh loadPublishedNewsEvents)
  const cached = NEWS_EVENT_LIST.find(
    (item) => item.id === id && item.status === 'Published',
  );
  if (cached) return cached;

  // Fallback: query Supabase langsung jika cache kosong
  try {
    const { data, error } = await supabase
      .from('news_publications')
      .select('*')
      .eq('id', id)
      .eq('status', 'Published')
      .maybeSingle();

    if (error || !data) return null;
    return adaptRow(data as NewsPublicationRow);
  } catch {
    return null;
  }
}
