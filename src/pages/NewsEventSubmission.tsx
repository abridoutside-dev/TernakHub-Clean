// ─── News & Event — Workspace Submission Dashboard (NEWS-004) ───────────────
// Layout (Constitution NEWS-004): Header → Ringkasan → Quick Action → Search
// → Filter → Daftar Submission. Workspace FREE dibatasi total (tidak dapat
// membuat News/Event) — ditampilkan sebagai info Upgrade, bukan disembunyikan
// diam-diam, agar pengguna tahu kenapa fitur ini terkunci.
//
// GATING: Akses halaman ini dan navigasi ke form submission WAJIB melalui
//   useSubscription().hasFeature('news_submit') / hasFeature('event_create')
// Tidak ada lagi penggunaan WORKSPACE_TIER_MAP atau canWorkspaceSubmit()
// sebagai penjaga akses — keduanya adalah display-metadata saja.

import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import {
  deleteDraft,
  getJenisEventLabel,
  getRingkasanCounts,
  getSubmissionsByWorkspace,
  RINGKASAN_STATUS_LIST,
  type SubmissionRecord,
  type SubmissionStatus,
} from '../data/newsEventSubmissionData';
import { useSubscription } from '../contexts/SubscriptionContext';
import { EmptyState } from '../components/NewsEventShared';

const STATUS_COLOR: Record<SubmissionStatus, { bg: string; color: string }> = {
  Draft: { bg: '#fdf3d0', color: '#7a6b1c' },
  'Waiting Approval': { bg: '#fff3e0', color: '#e65100' },
  'Revisi Diminta': { bg: '#ede7f6', color: '#5e35b1' },
  Published: { bg: '#e8f5ee', color: '#1b7a43' },
  Rejected: { bg: '#fbe1e1', color: '#a02020' },
  Archived: { bg: '#eceff1', color: '#607d8b' },
};

const STATUS_LABEL: Record<SubmissionStatus | 'Semua', string> = {
  'Semua': 'Semua',
  Draft: 'Draft',
  'Waiting Approval': 'Menunggu Persetujuan',
  'Revisi Diminta': 'Revisi Diminta',
  Published: 'Diterbitkan',
  Rejected: 'Ditolak',
  Archived: 'Diarsipkan',
};

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const c = STATUS_COLOR[status];
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
}

function judulSubmission(s: SubmissionRecord): string {
  if (s.tipeKonten === 'News') return s.news?.judul || '(Tanpa Judul)';
  return s.event?.namaEvent || '(Tanpa Nama Event)';
}

function coverSubmission(s: SubmissionRecord): string {
  if (s.tipeKonten === 'News') return s.news?.cover || '📰';
  return s.event?.poster || '🗓️';
}

function SubmissionCard({ s, onHapus }: { s: SubmissionRecord; onHapus: (id: string) => void }) {
  const navigate = useNavigate();
  const editPath = s.tipeKonten === 'News' ? `/news-event/submission/news/${s.id}` : `/news-event/submission/event/${s.id}`;

  return (
    <div style={{
      display: 'flex', gap: 12, padding: 14,
      background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 'var(--radius-sm)', flexShrink: 0,
        background: 'var(--color-bg)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: 24,
      }}>
        {coverSubmission(s)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
          <StatusBadge status={s.status} />
          <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
            {s.tipeKonten === 'Event' ? `Event · ${getJenisEventLabel(s.event?.jenisEventId || '')}` : 'News'}
          </span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.35 }}>
          {judulSubmission(s)}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 4 }}>
          Diperbarui {s.updatedAt}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          {s.status === 'Draft' && (
            <>
              <button type="button" onClick={() => navigate(editPath)} style={btnSecondary}>Ubah</button>
              <button
                type="button"
                onClick={() => navigate(`/news-event/submission/${s.id}/preview`)}
                style={btnPrimary}
              >
                Submit
              </button>
              <button type="button" onClick={() => onHapus(s.id)} style={btnDanger}>Hapus</button>
            </>
          )}
          {s.status === 'Waiting Approval' && (
            <button type="button" onClick={() => navigate(`/news-event/submission/${s.id}`)} style={btnSecondary}>Lihat</button>
          )}
          {s.status === 'Published' && (
            <>
              {s.publishedNewsEventId ? (
                <Link to={`/news-event/${s.publishedNewsEventId}`} style={{ ...btnSecondary, textDecoration: 'none', display: 'inline-flex' }}>Lihat</Link>
              ) : (
                <button type="button" onClick={() => navigate(`/news-event/submission/${s.id}`)} style={btnSecondary}>Lihat</button>
              )}
            </>
          )}
          {s.status === 'Rejected' && (
            <>
              <button type="button" onClick={() => navigate(`/news-event/submission/${s.id}`)} style={btnSecondary}>Lihat Alasan</button>
              <button type="button" onClick={() => navigate(editPath)} style={btnPrimary}>Perbaiki &amp; Submit Ulang</button>
            </>
          )}
          {s.status === 'Revisi Diminta' && (
            <>
              <button type="button" onClick={() => navigate(`/news-event/submission/${s.id}`)} style={btnSecondary}>Lihat Catatan Admin</button>
              <button type="button" onClick={() => navigate(editPath)} style={btnPrimary}>Perbaiki &amp; Submit Ulang</button>
            </>
          )}
          {s.status === 'Archived' && (
            <button type="button" onClick={() => navigate(`/news-event/submission/${s.id}`)} style={btnSecondary}>Lihat</button>
          )}
        </div>
      </div>
    </div>
  );
}

const btnBase: React.CSSProperties = {
  padding: '7px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
};
const btnPrimary: React.CSSProperties = { ...btnBase, border: 'none', background: 'var(--color-primary)', color: '#fff' };
const btnSecondary: React.CSSProperties = { ...btnBase, border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' };
const btnDanger: React.CSSProperties = { ...btnBase, border: '1.5px solid #f0c4c4', background: '#fff', color: '#a02020' };

export default function NewsEventSubmission() {
  const { activeWorkspace } = useWorkspace();
  const ws = activeWorkspace;  if (!ws) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🏢</div>
        <p style={{ fontSize: 14, fontWeight: 600 }}>Workspace tidak ditemukan</p>
        <p style={{ fontSize: 12 }}>Pilih atau buat workspace terlebih dahulu.</p>
      </div>
    );
  }

  const { hasFeature, plan } = useSubscription();
  // ── Gating: single source of truth via FEATURE_GATE → hasFeature() ──────
  // canWorkspaceSubmit() / WORKSPACE_TIER_MAP sudah TIDAK digunakan untuk
  // keputusan akses. Satu-satunya otoritas adalah hasFeature() dari
  // workspaceSubscriptionData.ts melalui SubscriptionContext.
  const bisaSubmit = hasFeature('news_submit') || hasFeature('event_create');
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<SubmissionStatus | 'Semua'>('Semua');

  const semuaSubmission = getSubmissionsByWorkspace(ws.workspace_uuid);
  const ringkasan = getRingkasanCounts(ws.workspace_uuid);

  const daftar = useMemo(() => {
    const kw = query.trim().toLowerCase();
    return semuaSubmission.filter((s) => {
      if (filterStatus !== 'Semua' && s.status !== filterStatus) return false;
      if (!kw) return true;
      return judulSubmission(s).toLowerCase().includes(kw);
    });
  }, [semuaSubmission, query, filterStatus]);

  function handleHapus(id: string) {
    if (window.confirm('Hapus Draft ini? Tindakan tidak dapat dibatalkan.')) {
      deleteDraft(id);
      navigate(0);
    }
  }

  if (!bisaSubmit) {
    return (
      <div style={{ padding: '16px 16px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--color-text)' }}>Workspace Submission</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-muted)' }}>
            Ajukan News &amp; Event resmi dari Workspace Anda.
          </p>
        </div>
        <div style={{
          background: '#fff8e1', border: '1.5px solid #f0dca0', borderRadius: 'var(--radius-md)',
          padding: '20px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
        }}>
          <div style={{ fontSize: 34 }}>🔒</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#7b5e2a' }}>
            Upgrade ke Pro untuk mempublikasikan News &amp; Event.
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: '#8a7238', lineHeight: 1.6 }}>
            Workspace <strong>{ws.workspace_name}</strong> saat ini menggunakan paket <strong>{plan}</strong>. Paket Pro dan
            Enterprise dapat mengirim News maupun Event untuk ditinjau AI Validation dan Admin sebelum dipublikasikan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 16px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--color-text)' }}>Workspace Submission</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-muted)' }}>
          {ws.workspace_name} · Paket {plan} — Ajukan News &amp; Event untuk ditinjau AI Validation &amp; Admin.
        </p>
      </div>

      {/* Ringkasan */}
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Ringkasan
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {RINGKASAN_STATUS_LIST.map((r) => (
            <div key={r.label} style={{
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)', padding: '10px 8px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary)' }}>
                {ringkasan[r.label] ?? 0}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--color-muted)', fontWeight: 600 }}>{r.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action */}
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Quick Action
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => navigate('/news-event/submission/news/baru')}
            style={{ flex: 1, padding: '14px 0', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
          >
            <span style={{ fontSize: 20 }}>📰</span>
            Buat News
          </button>
          <button
            type="button"
            onClick={() => navigate('/news-event/submission/event/baru')}
            style={{ flex: 1, padding: '14px 0', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-primary)', background: 'var(--color-surface)', color: 'var(--color-primary)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
          >
            <span style={{ fontSize: 20 }}>🗓️</span>
            Buat Event
          </button>
        </div>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari judul submission..."
          aria-label="Cari Submission"
        />
      </div>

      {/* Filter */}
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Filter
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {(['Semua', 'Draft', 'Waiting Approval', 'Revisi Diminta', 'Published', 'Rejected', 'Archived'] as (SubmissionStatus | 'Semua')[]).map((f) => {
            const active = filterStatus === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilterStatus(f)}
                style={{
                  flexShrink: 0, padding: '7px 13px', borderRadius: 20,
                  background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: active ? '#fff' : 'var(--color-text)',
                  border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                }}
              >
                {STATUS_LABEL[f] ?? f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Daftar Submission */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {daftar.length === 0 ? (
          <EmptyState pesan="Belum ada Submission yang cocok." />
        ) : (
          daftar.map((s) => <SubmissionCard key={s.id} s={s} onHapus={handleHapus} />)
        )}
      </div>
    </div>
  );
}
