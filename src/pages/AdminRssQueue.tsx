// ─── News & Event — Admin RSS Queue (NEWS-006) ───────────────────────────────
// Constitution → PUBLISH RULE, ADMIN DASHBOARD (RSS Queue):
// RSS yang lolos AI Validation tidak langsung publish — masuk Waiting Publish.
// Admin memutuskan: Publish / Reject / Archive.
//
// Filter: RSS category (Government / University / Research / Association /
// Official Partner / Trusted Media), Status, Confidence AI.
// Search: Judul, Publisher, Keyword (tags), Kategori.

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAllRssQueueItems,
  getRssQueueRingkasan,
  publishRssQueueItem,
  rejectRssQueueItem,
  archiveRssQueueItem,
  RSS_QUEUE_STATUS_COLOR,
  type RssQueueItem,
  type RssQueueStatus,
} from '../data/rssQueueData';
import {
  RSS_SOURCE_CATEGORY_LABEL,
  RSS_SOURCE_CATEGORY_EMOJI,
  RSS_SOURCE_CATEGORY_LIST,
  type RssSourceCategory,
} from '../data/rssSourceData';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDt(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
}

function confidenceEmoji(score: number): string {
  if (score >= 70) return '🟢';
  if (score >= 40) return '🟡';
  return '🔴';
}

function confidenceLabel(score: number): string {
  if (score >= 70) return 'Tinggi';
  if (score >= 40) return 'Sedang';
  return 'Rendah';
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: RssQueueStatus }) {
  const c = RSS_QUEUE_STATUS_COLOR[status];
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
}

// ─── Queue Item Card ──────────────────────────────────────────────────────────
function QueueCard({
  item, onPublish, onReject, onArchive,
}: {
  item: RssQueueItem;
  onPublish: (id: string) => void;
  onReject: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cls = item.aiClassification;
  const isWaiting = item.status === 'Waiting Publish';

  return (
    <div style={{
      background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
      border: `1.5px solid ${isWaiting ? '#f0c060' : 'var(--color-border)'}`,
      boxShadow: isWaiting ? '0 0 0 1px #f0c06030' : 'var(--shadow-sm)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '13px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--radius-sm)', flexShrink: 0,
          background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>
          {item.cover}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
            <StatusBadge status={item.status} />
            <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'var(--color-primary-light)', color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
              {RSS_SOURCE_CATEGORY_EMOJI[item.primarySourceCategory as RssSourceCategory] ?? '📡'} {item.primarySourceName}
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 700 }}>
              {confidenceEmoji(cls.confidenceScore)} {cls.confidenceScore}% ({confidenceLabel(cls.confidenceScore)})
            </span>
          </div>
          <div style={{
            fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.35,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {item.title}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 3 }}>
            {formatDt(item.pubDate)} · Topik: {item.topics.slice(0, 3).join(', ') || '—'}
          </div>
          {item.referenceSources.length > 0 && (
            <div style={{ fontSize: 10.5, color: '#1565c0', marginTop: 2, fontWeight: 700 }}>
              📎 {item.referenceSources.length} Reference Source
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{ flexShrink: 0, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--color-muted)', padding: '4px' }}
          aria-label="Toggle detail"
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--color-border)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Description */}
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.6 }}>{item.description}</p>

          {/* AI Classification */}
          <div style={{ background: '#f7faf8', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>AI Classification</div>
            <div style={{ fontSize: 11.5, color: 'var(--color-text)', lineHeight: 1.7 }}>
              <div>Status: <strong>{cls.status}</strong></div>
              <div>Relevance: {cls.relevanceScore}/100</div>
              <div>Language: {cls.language.toUpperCase()}</div>
              {cls.isClickbait && <div style={{ color: '#7b5e2a' }}>⚠️ Potensi Clickbait</div>}
              {cls.isPotentialHoaks && <div style={{ color: '#a02020' }}>🔴 Potensi Hoaks</div>}
              <div style={{ marginTop: 4, fontSize: 11, color: 'var(--color-muted)' }}>{cls.reasoning}</div>
            </div>
          </div>

          {/* Topik & Kategori */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Topik Terdeteksi</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {item.topics.map((t) => (
                <span key={t} style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                  {t}
                </span>
              ))}
              {item.topics.length === 0 && <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>Tidak ada topik terdeteksi.</span>}
            </div>
          </div>

          {/* Reference Sources */}
          {item.referenceSources.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
                Reference Sources ({item.referenceSources.length})
              </div>
              {item.referenceSources.map((ref, i) => (
                <div key={i} style={{
                  background: '#e3f2fd', border: '1px solid #b3d6f5', borderRadius: 'var(--radius-sm)',
                  padding: '7px 10px', fontSize: 11.5, color: '#1a3a5c', marginBottom: 6,
                }}>
                  <div style={{ fontWeight: 700 }}>{ref.sourceName} <span style={{ fontWeight: 400, color: '#4a7ab8' }}>({ref.sourceCategory})</span></div>
                  <div style={{ wordBreak: 'break-all', fontSize: 11, marginTop: 2 }}>{ref.originalUrl}</div>
                  <div style={{ fontSize: 11, color: '#4a7ab8', marginTop: 2 }}>{formatDt(ref.pubDate)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Admin note */}
          {item.adminNote && (
            <div style={{ background: '#fff3e0', border: '1px solid #f0c060', borderRadius: 'var(--radius-sm)', padding: '8px 11px', fontSize: 12, color: '#7b5e2a' }}>
              📝 Catatan Admin: {item.adminNote}
            </div>
          )}

          {/* Primary URL */}
          <div style={{ fontSize: 11, color: 'var(--color-muted)', wordBreak: 'break-all' }}>
            🔗 {item.originalUrl}
          </div>
        </div>
      )}

      {/* Actions */}
      {isWaiting && (
        <div style={{ borderTop: '1px solid var(--color-border)', padding: '10px 14px', display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => onPublish(item.id)}
            style={{ flex: 2, padding: '10px 0', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
            ✅ Publish
          </button>
          <button type="button" onClick={() => onReject(item.id)}
            style={{ flex: 1, padding: '10px 0', borderRadius: 'var(--radius-sm)', border: '1.5px solid #f0c4c4', background: '#fff', color: '#a02020', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
            🔴 Reject
          </button>
          <button type="button" onClick={() => onArchive(item.id)}
            style={{ flex: 1, padding: '10px 0', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
            Archive
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type FilterStatus = 'Semua' | RssQueueStatus;
type FilterCat = 'Semua' | RssSourceCategory;

export default function AdminRssQueue() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('Semua');
  const [filterCat, setFilterCat] = useState<FilterCat>('Semua');
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const ringkasan = getRssQueueRingkasan();

  const daftar = useMemo(() => {
    const kw = query.trim().toLowerCase();
    return getAllRssQueueItems().filter((item) => {
      if (filterStatus !== 'Semua' && item.status !== filterStatus) return false;
      if (filterCat !== 'Semua' && item.primarySourceCategory !== filterCat) return false;
      if (!kw) return true;
      return (
        item.title.toLowerCase().includes(kw) ||
        item.primarySourceName.toLowerCase().includes(kw) ||
        item.tags.some((t) => t.toLowerCase().includes(kw)) ||
        item.categories.some((c) => c.toLowerCase().includes(kw)) ||
        item.topics.some((t) => t.toLowerCase().includes(kw))
      );
    });
  }, [tick, query, filterStatus, filterCat]);

  function handlePublish(id: string) {
    if (!window.confirm('Publish artikel ini ke listing publik?')) return;
    publishRssQueueItem(id);
    setTick((t) => t + 1);
  }

  function handleRejectConfirm() {
    if (!rejectNote.trim()) { window.alert('Catatan alasan wajib diisi.'); return; }
    rejectRssQueueItem(rejectTarget!, rejectNote);
    setRejectTarget(null);
    setRejectNote('');
    setTick((t) => t + 1);
  }

  function handleArchive(id: string) {
    archiveRssQueueItem(id);
    setTick((t) => t + 1);
  }

  // Ringkasan cards — clickable untuk filter
  const RINGKASAN_CARDS = [
    { label: 'Menunggu Terbit', value: ringkasan.waitingPublish, emoji: '⏳', color: '#e65100', status: 'Waiting Publish' as RssQueueStatus },
    { label: 'Diterbitkan', value: ringkasan.published, emoji: '✅', color: '#1b7a43', status: 'Published' as RssQueueStatus },
    { label: 'Ditolak', value: ringkasan.rejected, emoji: '🔴', color: '#a02020', status: 'Rejected' as RssQueueStatus },
    { label: 'Diarsipkan', value: ringkasan.archived, emoji: '📦', color: '#607d8b', status: 'Archived' as RssQueueStatus },
  ];

  const QUEUE_STATUS_LABEL: Record<string, string> = {
    'Semua': 'Semua',
    'Waiting Publish': 'Menunggu Terbit',
    'Published': 'Diterbitkan',
    'Rejected': 'Ditolak',
    'Archived': 'Diarsipkan',
  };

  return (
    <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--color-text)' }}>RSS Queue</h1>
        <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--color-muted)' }}>
          Artikel RSS yang telah melewati AI Classification — Admin memutuskan Publish / Reject / Archive.
        </p>
      </div>

      {/* Panduan */}
      <div style={{ background: '#eaf4ff', border: '1.5px solid #b3d6f5', borderRadius: 'var(--radius-md)', padding: '11px 14px', fontSize: 11.5, color: '#1a3a5c', lineHeight: 1.6 }}>
        RSS <strong>tidak langsung publish</strong> — seluruh artikel lolos AI Classification wajib di-review Admin.
        Artikel yang sudah Published otomatis masuk ke News Feed publik.
      </div>

      {/* Reject modal */}
      {rejectTarget && (
        <div style={{ background: '#fff0f0', border: '1.5px solid #e8b4b4', borderRadius: 'var(--radius-md)', padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#a02020', marginBottom: 10 }}>Reject — Catatan Alasan</div>
          <textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Jelaskan alasan penolakan (wajib)"
            rows={3}
            style={{ width: '100%', boxSizing: 'border-box', marginBottom: 10 }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => { setRejectTarget(null); setRejectNote(''); }}
              style={{ flex: 1, padding: '11px 0', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Batal
            </button>
            <button type="button" onClick={handleRejectConfirm}
              style={{ flex: 2, padding: '11px 0', borderRadius: 'var(--radius-sm)', border: 'none', background: '#a02020', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Ringkasan */}
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 }}>Ringkasan Queue</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {RINGKASAN_CARDS.map(({ label, value, emoji, color, status }) => (
            <div
              key={label}
              onClick={() => setFilterStatus((prev) => prev === status ? 'Semua' : status)}
              style={{
                background: filterStatus === status ? '#e8f5ee' : 'var(--color-surface)',
                border: `1.5px solid ${filterStatus === status ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-sm)', padding: '11px 10px', textAlign: 'center', cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 18 }}>{emoji}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 10.5, color: 'var(--color-muted)', fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>
        {ringkasan.waitingPublish > 0 && (
          <div style={{ marginTop: 10, background: '#fff3e0', border: '1.5px solid #f0c060', borderRadius: 'var(--radius-sm)', padding: '9px 12px', fontSize: 12, color: '#e65100', fontWeight: 700 }}>
            ⏳ {ringkasan.waitingPublish} artikel menunggu keputusan Admin.
          </div>
        )}
      </div>

      {/* Search */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari judul, publisher, topik, kategori, tag…"
        aria-label="Cari RSS Queue"
      />

      {/* Filter Status */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4 }}>Status</div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {(['Semua', 'Waiting Publish', 'Published', 'Rejected', 'Archived'] as FilterStatus[]).map((f) => {
            const active = filterStatus === f;
            return (
              <button key={f} type="button" onClick={() => setFilterStatus(f)}
                style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 20, background: active ? 'var(--color-primary)' : 'var(--color-surface)', color: active ? '#fff' : 'var(--color-text)', border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {QUEUE_STATUS_LABEL[f] ?? f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Kategori Source */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4 }}>Sumber</div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {(['Semua', ...RSS_SOURCE_CATEGORY_LIST] as FilterCat[]).map((f) => {
            const active = filterCat === f;
            const label = f === 'Semua' ? 'Semua' : `${RSS_SOURCE_CATEGORY_EMOJI[f as RssSourceCategory]} ${RSS_SOURCE_CATEGORY_LABEL[f as RssSourceCategory]}`;
            return (
              <button key={f} type="button" onClick={() => setFilterCat(f)}
                style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 20, background: active ? 'var(--color-primary)' : 'var(--color-surface)', color: active ? '#fff' : 'var(--color-text)', border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Daftar */}
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Daftar ({daftar.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {daftar.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>Tidak ada artikel yang cocok.</div>
          ) : (
            daftar.map((item) => (
              <QueueCard
                key={item.id + tick}
                item={item}
                onPublish={handlePublish}
                onReject={(id) => { setRejectTarget(id); setRejectNote(''); }}
                onArchive={handleArchive}
              />
            ))
          )}
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" onClick={() => navigate('/admin/rss/sources')}
          style={{ flex: 1, padding: '12px 0', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-primary)', background: 'var(--color-surface)', color: 'var(--color-primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          📡 Master RSS Source
        </button>
        <button type="button" onClick={() => navigate('/admin/news-event/review')}
          style={{ flex: 1, padding: '12px 0', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          ← Admin Dashboard
        </button>
      </div>
    </div>
  );
}
