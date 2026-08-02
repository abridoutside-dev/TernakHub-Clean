// ─── News & Event — Admin Master RSS Source (NEWS-006) ───────────────────────
// Constitution → TRUSTED RSS SOURCES: hanya website terpercaya.
// Halaman ini memungkinkan Admin mengelola daftar RSS Source:
// • Lihat semua source (filter kategori / status, search)
// • Ringkasan (total, active, per kategori)
// • Ubah status (Active / Inactive / Suspended)
// • Manual Refresh (simulasi crawl)
// • Tambah Source baru (form singkat)

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAllRssSources,
  getRssSourceRingkasan,
  updateRssSourceStatus,
  addRssSource,
  RSS_SOURCE_CATEGORY_LIST,
  RSS_SOURCE_CATEGORY_LABEL,
  RSS_SOURCE_CATEGORY_EMOJI,
  RSS_SOURCE_STATUS_COLOR,
  type RssSource,
  type RssSourceCategory,
  type RssSourceStatus,
} from '../data/rssSourceData';
import {
  getCollectorJobsBySource,
  triggerManualRefresh,
} from '../data/rssCollectorData';

// ─── Shared helpers ───────────────────────────────────────────────────────────
function formatDt(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: RssSourceStatus }) {
  const c = RSS_SOURCE_STATUS_COLOR[status];
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
}

// ─── Source Card ──────────────────────────────────────────────────────────────
function SourceCard({
  src,
  onStatusChange,
  onRefresh,
}: {
  src: RssSource;
  onStatusChange: (id: string, status: RssSourceStatus) => void;
  onRefresh: (src: RssSource) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const recentJobs = getCollectorJobsBySource(src.id);
  const lastJob = recentJobs[0];

  return (
    <div style={{
      background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
      border: `1.5px solid ${src.status === 'Suspended' ? '#e8b4b4' : src.status === 'Inactive' ? '#d0d0d0' : 'var(--color-border)'}`,
      boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
    }}>
      {/* Header row */}
      <div style={{ padding: '13px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-sm)', flexShrink: 0,
          background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>
          {RSS_SOURCE_CATEGORY_EMOJI[src.category]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 3 }}>
            <StatusBadge status={src.status} />
            <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'var(--color-primary-light)', color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
              {RSS_SOURCE_CATEGORY_LABEL[src.category]}
            </span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{src.name}</div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>{src.organization}</div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
            Last crawl: {formatDt(src.lastCrawl)}
            {src.crawlIntervalHours === 0 ? ' · Manual only' : ` · Setiap ${src.crawlIntervalHours} jam`}
          </div>
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

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--color-border)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>{src.description}</p>

          {/* URL info */}
          <div style={{ fontSize: 11.5, color: 'var(--color-text)', lineHeight: 1.8 }}>
            <div>🌐 <a href={src.sourceUrl} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{src.sourceUrl}</a></div>
            <div>📡 RSS: <span style={{ color: 'var(--color-muted)', wordBreak: 'break-all' }}>{src.rssUrl}</span></div>
            <div>🌏 {src.country} · {src.language.toUpperCase()}</div>
            {src.lastSuccess && <div>✅ Last success: {formatDt(src.lastSuccess)}</div>}
          </div>

          {/* Last collector job */}
          {lastJob && (
            <div style={{
              background: lastJob.status === 'Failed' ? '#fbe1e1' : '#eef7f0',
              border: `1px solid ${lastJob.status === 'Failed' ? '#e8b4b4' : '#c8e6ce'}`,
              borderRadius: 'var(--radius-sm)', padding: '8px 11px', fontSize: 11.5,
              color: lastJob.status === 'Failed' ? '#a02020' : '#2f6b45',
            }}>
              {lastJob.status === 'Failed' ? '❌' : '✅'} Job terakhir ({lastJob.type}):
              {' '}Fetched {lastJob.itemsFetched} · Baru {lastJob.itemsNew} · Duplikat {lastJob.itemsDuplicate}
              {lastJob.error && <div style={{ marginTop: 4 }}>{lastJob.error}</div>}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => onRefresh(src)}
              disabled={src.status !== 'Active'}
              style={{
                padding: '7px 13px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-primary)',
                background: src.status === 'Active' ? 'var(--color-primary)' : 'var(--color-border)',
                color: '#fff', fontSize: 12, fontWeight: 700, cursor: src.status === 'Active' ? 'pointer' : 'not-allowed',
              }}
            >
              🔄 Manual Refresh
            </button>
            {src.status === 'Active' && (
              <button type="button" onClick={() => onStatusChange(src.id, 'Inactive')}
                style={{ padding: '7px 13px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Nonaktifkan
              </button>
            )}
            {src.status === 'Inactive' && (
              <button type="button" onClick={() => onStatusChange(src.id, 'Active')}
                style={{ padding: '7px 13px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-primary)', background: 'var(--color-surface)', color: 'var(--color-primary)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Aktifkan Kembali
              </button>
            )}
            {src.status !== 'Suspended' && (
              <button type="button" onClick={() => onStatusChange(src.id, 'Suspended')}
                style={{ padding: '7px 13px', borderRadius: 'var(--radius-sm)', border: '1.5px solid #e8b4b4', background: 'var(--color-surface)', color: '#a02020', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Suspend
              </button>
            )}
            {src.status === 'Suspended' && (
              <button type="button" onClick={() => onStatusChange(src.id, 'Active')}
                style={{ padding: '7px 13px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-primary)', background: 'var(--color-surface)', color: 'var(--color-primary)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Reaktivasi
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tambah Source Form ───────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: '', sourceUrl: '', rssUrl: '', publisher: '', organization: '',
  country: 'ID', language: 'id', category: 'Government' as RssSourceCategory,
  status: 'Active' as RssSourceStatus, description: '', crawlIntervalHours: 12,
};

function TambahSourceForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ ...EMPTY_FORM });

  function set(k: keyof typeof form, v: string | number) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.rssUrl.trim()) {
      window.alert('Name dan RSS URL wajib diisi.');
      return;
    }
    addRssSource({ ...form, crawlIntervalHours: Number(form.crawlIntervalHours) });
    onClose();
  }

  const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', marginBottom: 10 };

  return (
    <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Tambah RSS Source Baru</div>

      <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 3 }}>Name *</label>
      <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Nama singkat (misal: Kementan RI)" style={inputStyle} />

      <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 3 }}>RSS URL *</label>
      <input value={form.rssUrl} onChange={(e) => set('rssUrl', e.target.value)} placeholder="https://sumber.id/feed" style={inputStyle} />

      <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 3 }}>Source URL</label>
      <input value={form.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} placeholder="https://sumber.id" style={inputStyle} />

      <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 3 }}>Publisher</label>
      <input value={form.publisher} onChange={(e) => set('publisher', e.target.value)} placeholder="Nama publisher/redaksi" style={inputStyle} />

      <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 3 }}>Organization</label>
      <input value={form.organization} onChange={(e) => set('organization', e.target.value)} placeholder="Nama organisasi resmi" style={inputStyle} />

      <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 3 }}>Deskripsi</label>
      <textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Deskripsi singkat sumber" rows={2} style={{ ...inputStyle }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 3 }}>Kategori</label>
          <select value={form.category} onChange={(e) => set('category', e.target.value as RssSourceCategory)} style={{ width: '100%' }}>
            {RSS_SOURCE_CATEGORY_LIST.map((c) => <option key={c} value={c}>{RSS_SOURCE_CATEGORY_LABEL[c]}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 3 }}>Interval (jam)</label>
          <input type="number" value={form.crawlIntervalHours} onChange={(e) => set('crawlIntervalHours', Number(e.target.value))} min={0} style={{ width: '100%', boxSizing: 'border-box' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" onClick={onClose}
          style={{ flex: 1, padding: '11px 0', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Batal
        </button>
        <button type="button" onClick={handleSubmit}
          style={{ flex: 2, padding: '11px 0', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Simpan Source
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminRssSources() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState('');
  const [filterCat, setFilterCat] = useState<RssSourceCategory | 'Semua'>('Semua');
  const [filterStatus, setFilterStatus] = useState<RssSourceStatus | 'Semua'>('Semua');
  const [showForm, setShowForm] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  const ringkasan = getRssSourceRingkasan();

  const daftar = getAllRssSources().filter((s) => {
    if (filterCat !== 'Semua' && s.category !== filterCat) return false;
    if (filterStatus !== 'Semua' && s.status !== filterStatus) return false;
    const kw = query.trim().toLowerCase();
    if (!kw) return true;
    return (
      s.name.toLowerCase().includes(kw) ||
      s.organization.toLowerCase().includes(kw) ||
      s.publisher.toLowerCase().includes(kw)
    );
  });

  function handleStatusChange(id: string, status: RssSourceStatus) {
    updateRssSourceStatus(id, status);
    setTick((t) => t + 1);
  }

  function handleRefresh(src: RssSource) {
    const job = triggerManualRefresh(src);
    setRefreshMsg(`✅ Manual Refresh selesai — ${src.name}: ${job.itemsNew} item baru, ${job.itemsDuplicate} duplikat.`);
    setTimeout(() => setRefreshMsg(null), 4000);
    setTick((t) => t + 1);
  }

  return (
    <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--color-text)' }}>Master RSS Source</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--color-muted)' }}>
            {ringkasan.active} Aktif · {ringkasan.inactive} Tidak Aktif · {ringkasan.suspended} Ditangguhkan
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          style={{ flexShrink: 0, padding: '9px 14px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
        >
          + Tambah Source
        </button>
      </div>

      {/* Tambah form */}
      {showForm && (
        <TambahSourceForm onClose={() => { setShowForm(false); setTick((t) => t + 1); }} />
      )}

      {/* Refresh msg */}
      {refreshMsg && (
        <div style={{ background: '#e8f5ee', border: '1.5px solid #c8e6ce', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 12.5, color: '#1b7a43', fontWeight: 600 }}>
          {refreshMsg}
        </div>
      )}

      {/* Ringkasan per kategori */}
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 }}>Ringkasan per Kategori</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {RSS_SOURCE_CATEGORY_LIST.map((cat) => (
            <div
              key={cat}
              onClick={() => setFilterCat(filterCat === cat ? 'Semua' : cat)}
              style={{
                background: filterCat === cat ? '#e8f5ee' : 'var(--color-surface)',
                border: `1.5px solid ${filterCat === cat ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-sm)', padding: '8px 6px', textAlign: 'center', cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 16 }}>{RSS_SOURCE_CATEGORY_EMOJI[cat]}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-primary)' }}>{ringkasan.byCategory[cat] ?? 0}</div>
              <div style={{ fontSize: 9.5, color: 'var(--color-muted)', fontWeight: 600, lineHeight: 1.2 }}>{RSS_SOURCE_CATEGORY_LABEL[cat].split(' ').slice(0, 2).join(' ')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari nama, organisasi, publisher…"
        aria-label="Cari RSS Source"
      />

      {/* Filter Status */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
        {(['Semua', 'Active', 'Inactive', 'Suspended'] as (RssSourceStatus | 'Semua')[]).map((f) => {
          const active = filterStatus === f;
          const labelMap: Record<string, string> = { 'Semua': 'Semua', 'Active': 'Aktif', 'Inactive': 'Tidak Aktif', 'Suspended': 'Ditangguhkan' };
          return (
            <button key={f} type="button" onClick={() => setFilterStatus(f)}
              style={{
                flexShrink: 0, padding: '6px 13px', borderRadius: 20,
                background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                color: active ? '#fff' : 'var(--color-text)',
                border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>
              {labelMap[f] ?? f}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
          {daftar.length} Source
        </div>
        {daftar.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>Tidak ada source yang cocok.</div>
        ) : (
          daftar.map((s) => (
            <SourceCard key={s.id + tick} src={s} onStatusChange={handleStatusChange} onRefresh={handleRefresh} />
          ))
        )}
      </div>

      {/* Back */}
      <button type="button" onClick={() => navigate('/admin/news-event/review')}
        style={{ width: '100%', padding: '13px 0', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
        ← Kembali ke Admin Dashboard
      </button>
    </div>
  );
}
