// ─── News & Event — News Feed, Event Feed & Listing (NEWS-003) ──────────────
// Mengikuti docs/architecture/NEWS_EVENT_MODULE_CONSTITUTION.md.
//
// Data diambil dari database melalui newsEventService.ts (Supabase).
// Tidak ada fallback ke seed/mock data — jika database kosong, tampilkan
// Empty State yang informatif.
//
// Urutan state yang benar: Loading → Data / Empty State / Error State.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDebounce } from '../utils/useDebounce';
import { loadPublishedNewsEvents } from '../services/newsEventService';
import {
  applySort,
  getHighlightList,
  getLatestEvents,
  getNewsFeed,
  getUpcomingEvents,
  searchNewsEvent,
  formatTanggalIndonesia,
  FILTER_LIST,
  KATEGORI_TOPIK_LIST,
  SORT_LIST,
  type NewsEventFilter,
  type NewsEventItem,
  type NewsEventKategori,
  type NewsEventSort,
} from '../data/newsEventData';
import {
  EmptyState,
  PublisherBadge,
  RssLabel,
  SkeletonCard,
  StatusAcaraBadge,
  TabBadge,
  TagChips,
  VerifiedBadge,
} from '../components/NewsEventShared';

// ─── Filter & Kategori chips ──────────────────────────────────────────────────

const FILTER_ICON: Record<NewsEventFilter, string> = {
  Semua: '🗞️', News: '📰', Event: '📅', Edukasi: '📘', Pengumuman: '📢', RSS: '📡', Workspace: '🏢',
};

// ─── Cards ────────────────────────────────────────────────────────────────────

function NewsCard({ item }: { item: NewsEventItem }) {
  return (
    <Link
      to={`/news-event/${item.id}`}
      style={{
        display: 'flex', gap: 12, padding: 14, textDecoration: 'none',
        background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{
        width: 56, height: 56, borderRadius: 'var(--radius-sm)', flexShrink: 0,
        background: 'var(--color-primary-light)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: 26,
      }}>
        {item.cover}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
          <TabBadge tipeKonten={item.tipeKonten} />
          <PublisherBadge tipe={item.publisher.tipe} />
          {item.sumberPublikasi === 'Trusted RSS Feed' && <RssLabel />}
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.35 }}>
          {item.judul}
        </div>
        <div style={{
          fontSize: 12.5, color: 'var(--color-muted)', marginTop: 4,
          lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {item.ringkasan}
        </div>
        <div style={{ marginTop: 8 }}>
          <TagChips tag={item.tag} />
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginTop: 8,
          fontSize: 11.5, color: 'var(--color-muted)',
        }}>
          <span style={{ fontWeight: 600 }}>{item.publisher.nama}</span>
          <VerifiedBadge terverifikasi={item.publisher.terverifikasi} />
          <span>·</span>
          <span>{formatTanggalIndonesia(item.publishDate)}</span>
        </div>
      </div>
    </Link>
  );
}

function EventCard({ item }: { item: NewsEventItem }) {
  if (!item.acara) return null;
  const a = item.acara;
  return (
    <Link
      to={`/news-event/${item.id}`}
      style={{
        display: 'flex', gap: 12, padding: 14, textDecoration: 'none',
        background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{
        width: 56, height: 56, borderRadius: 'var(--radius-sm)', flexShrink: 0,
        background: '#fff8e1', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: 26,
      }}>
        {a.poster}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
          <StatusAcaraBadge acara={a} />
          <PublisherBadge tipe={item.publisher.tipe} />
          <VerifiedBadge terverifikasi={item.publisher.terverifikasi} />
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.35 }}>
          {a.namaEvent}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--color-muted)', marginTop: 4, lineHeight: 1.5 }}>
          <div>👤 {a.penyelenggara}</div>
          <div>📍 {a.lokasi}</div>
          <div>
            🗓️ {formatTanggalIndonesia(a.jadwalMulai)}
            {a.jadwalSelesai ? ` – ${formatTanggalIndonesia(a.jadwalSelesai)}` : ''}
            {a.jam ? ` · ${a.jam}` : ''}
          </div>
        </div>
      </div>
    </Link>
  );
}

function HighlightCard({ item }: { item: NewsEventItem }) {
  return (
    <Link
      to={`/news-event/${item.id}`}
      style={{
        minWidth: 220, maxWidth: 220, flexShrink: 0, textDecoration: 'none',
        background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden', display: 'block',
      }}
    >
      <div style={{
        height: 90, background: 'var(--color-primary-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
      }}>
        {item.tipeKonten === 'Event' && item.acara ? item.acara.poster : item.cover}
      </div>
      <div style={{ padding: 10 }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 5 }}>
          <TabBadge tipeKonten={item.tipeKonten} />
          {item.sumberPublikasi === 'Trusted RSS Feed' && <RssLabel />}
        </div>
        <div style={{
          fontSize: 13, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.35,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {item.judul}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4, marginTop: 6,
          fontSize: 10.5, color: 'var(--color-muted)',
        }}>
          <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.publisher.nama}
          </span>
          <VerifiedBadge terverifikasi={item.publisher.terverifikasi} />
        </div>
      </div>
    </Link>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 16px' }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
        Gagal Memuat News & Event
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 18 }}>
        Tidak dapat terhubung ke database. Periksa koneksi dan coba lagi.
      </div>
      <button
        type="button"
        onClick={onRetry}
        style={{
          padding: '10px 24px', borderRadius: 20,
          background: 'var(--color-primary)', color: '#fff',
          border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}
      >
        Coba Lagi
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewsEvent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<NewsEventFilter>('Semua');
  const [kategoriTopik, setKategoriTopik] = useState<NewsEventKategori | 'Semua'>('Semua');
  const [sort, setSort] = useState<NewsEventSort>('Terbaru');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const fetchData = () => {
    setLoading(true);
    setError(false);
    loadPublishedNewsEvents()
      .then(() => setLoading(false))
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Hitung derived data dari NEWS_EVENT_LIST (diperbarui oleh loadPublishedNewsEvents)
  const highlight = getHighlightList();
  const newsFeedRaw = searchNewsEvent(getNewsFeed(), filter, debouncedQuery, kategoriTopik);
  const newsFeed = applySort(newsFeedRaw, sort, debouncedQuery);
  const upcomingEvents = searchNewsEvent(getUpcomingEvents(), filter, debouncedQuery, kategoriTopik);
  const latestEvents = searchNewsEvent(getLatestEvents(), filter, debouncedQuery, kategoriTopik);
  const hasNoContentAtAll = !loading && !error && highlight.length === 0 &&
    newsFeed.length === 0 && upcomingEvents.length === 0 && latestEvents.length === 0;
  const isFilteringActive = filter !== 'Semua' || kategoriTopik !== 'Semua' || !!debouncedQuery;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--color-text)' }}>
            News &amp; Event
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-muted)' }}>
            Informasi terpercaya untuk ekosistem peternakan.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, alignItems: 'flex-end' }}>
          <Link
            to="/news-event/submission"
            style={{
              padding: '8px 12px', borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--color-primary)', background: 'var(--color-surface)',
              color: 'var(--color-primary)', fontSize: 12, fontWeight: 700, textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            + Ajukan Konten
          </Link>
          <Link
            to="/admin/news-event/review"
            style={{
              padding: '6px 12px', borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
              color: 'var(--color-muted)', fontSize: 11, fontWeight: 700, textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            🛡️ Admin Review
          </Link>
        </div>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari judul, ringkasan, tag, atau publisher..."
          aria-label="Cari News & Event"
        />
      </div>

      {/* Filter */}
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Filter
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {FILTER_LIST.map((slug) => {
            const active = filter === slug;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => setFilter(slug)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                  padding: '8px 14px', borderRadius: 20,
                  background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: active ? '#fff' : 'var(--color-text)',
                  border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap',
                }}
              >
                <span>{FILTER_ICON[slug]}</span>
                {slug}
              </button>
            );
          })}
        </div>
      </div>

      {/* Kategori (topik) */}
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Kategori
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {(['Semua', ...KATEGORI_TOPIK_LIST] as (NewsEventKategori | 'Semua')[]).map((k) => {
            const active = kategoriTopik === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setKategoriTopik(k)}
                style={{
                  flexShrink: 0, padding: '7px 13px', borderRadius: 20,
                  background: active ? 'var(--color-primary-light)' : 'var(--color-surface)',
                  color: active ? 'var(--color-primary)' : 'var(--color-text)',
                  border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                }}
              >
                {k}
              </button>
            );
          })}
        </div>
      </div>

      {/* States: Loading / Error / Empty / Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <ErrorState onRetry={fetchData} />
      ) : hasNoContentAtAll ? (
        <EmptyState pesan="Belum ada News & Event." />
      ) : (
        <>
          {/* Highlight */}
          {!isFilteringActive && (
            <section>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 10 }}>
                ⭐ Highlight
              </div>
              {highlight.length === 0 ? (
                <EmptyState pesan="Belum ada konten highlight." />
              ) : (
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                  {highlight.map((item) => <HighlightCard key={item.id} item={item} />)}
                </div>
              )}
            </section>
          )}

          {/* News Feed */}
          <section>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 8, marginBottom: 10,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                📰 News Feed
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--color-muted)' }}>
                Urutkan:
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as NewsEventSort)}
                  aria-label="Urutkan News Feed"
                  style={{
                    fontSize: 11.5, fontWeight: 600, padding: '5px 8px', borderRadius: 8,
                    border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)',
                  }}
                >
                  {SORT_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>
            {newsFeed.length === 0 ? (
              <EmptyState pesan={isFilteringActive ? 'Tidak ada konten yang cocok dengan pencarian/filter ini.' : 'Belum ada berita.'} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {newsFeed.map((item) => <NewsCard key={item.id} item={item} />)}
              </div>
            )}
          </section>

          {/* Upcoming Event */}
          <section>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 10 }}>
              📅 Upcoming Event
            </div>
            {upcomingEvents.length === 0 ? (
              <EmptyState pesan={isFilteringActive ? 'Tidak ada event mendatang yang cocok.' : 'Belum ada event mendatang.'} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {upcomingEvents.map((item) => <EventCard key={item.id} item={item} />)}
              </div>
            )}
          </section>

          {/* Latest Event */}
          <section>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 10 }}>
              🆕 Latest Event
            </div>
            {latestEvents.length === 0 ? (
              <EmptyState pesan={isFilteringActive ? 'Tidak ada event yang cocok.' : 'Belum ada event.'} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {latestEvents.map((item) => <EventCard key={item.id} item={item} />)}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
