// ─── News & Event — Admin Dashboard (NEWS-005 + NEWS-006) ────────────────────
// Constitution → ADMIN REVIEW, ADMIN DASHBOARD, FILTER, SEARCH, RSS QUEUE.
//
// Admin tidak melakukan validasi dari awal — hanya membaca Validation Report
// AI dan memutuskan. Halaman ini adalah Dashboard lengkap dengan:
// • RSS Queue ringkasan & link (NEWS-006)
// • Ringkasan Submission (Waiting Validation / Waiting Approval / Published / Revision / Rejected)
// • Filter multi-dimensi (Tipe, Status, Confidence, Rekomendasi AI)
// • Search (Judul, Workspace, Penyelenggara, Jenis Event)
// • Daftar seluruh Submission (bukan hanya Waiting Approval)

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAllSubmissionsForAdmin,
  getAdminRingkasan,
  getConfidenceLevel,
  CONFIDENCE_LEVEL_EMOJI,
  CONFIDENCE_LEVEL_COLOR,
  type AdminRingkasan,
  type ConfidenceLevel,
} from '../data/newsEventAdminReviewData';
import { getRssQueueRingkasan } from '../data/rssQueueData';
import { getRssSourceRingkasan } from '../data/rssSourceData';
import { getPublicationRingkasan } from '../data/publicationManagementData';
import {
  getJenisEventLabel,
  type SubmissionRecord,
  type SubmissionStatus,
} from '../data/newsEventSubmissionData';
import { REKOMENDASI_EMOJI, type RekomendasiAi } from '../data/newsEventValidationData';
import { EmptyState } from '../components/NewsEventShared';

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<SubmissionStatus, { bg: string; color: string }> = {
  Draft: { bg: '#fdf3d0', color: '#7a6b1c' },
  'Waiting Approval': { bg: '#fff3e0', color: '#e65100' },
  'Revisi Diminta': { bg: '#ede7f6', color: '#5e35b1' },
  Published: { bg: '#e8f5ee', color: '#1b7a43' },
  Rejected: { bg: '#fbe1e1', color: '#a02020' },
  Archived: { bg: '#eceff1', color: '#607d8b' },
};

const STATUS_LABEL: Record<SubmissionStatus, string> = {
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
      {STATUS_LABEL[status]}
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

function penyelenggaraSubmission(s: SubmissionRecord): string {
  if (s.tipeKonten === 'Event') return s.event?.penyelenggara || '';
  return s.news?.sumber || '';
}

// ─── Filter Types ─────────────────────────────────────────────────────────────
type FilterTipe = 'Semua' | 'News' | 'Event';
type FilterStatus = 'Semua' | SubmissionStatus;
type FilterConfidence = 'Semua' | ConfidenceLevel;
type FilterRekomendasi = 'Semua' | RekomendasiAi;

// ─── Ringkasan Card ───────────────────────────────────────────────────────────
function RingkasanCard({
  label, value, color, emoji, onClick, active,
}: {
  label: string; value: number; color: string; emoji: string;
  onClick?: () => void; active?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: active ? '#e8f5ee' : 'var(--color-surface)',
        border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-sm)', padding: '10px 8px', textAlign: 'center',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ fontSize: 16, marginBottom: 2 }}>{emoji}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

// ─── Chip Filter ──────────────────────────────────────────────────────────────
function ChipFilter<T extends string>({
  label, options, value, onChange,
}: {
  label: string; options: { value: T; label: string }[];
  value: T; onChange: (v: T) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              style={{
                flexShrink: 0, padding: '6px 12px', borderRadius: 20,
                background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                color: active ? '#fff' : 'var(--color-text)',
                border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Submission Card (Admin view) ─────────────────────────────────────────────
function AdminSubmissionCard({ s }: { s: SubmissionRecord }) {
  const navigate = useNavigate();
  const rekomendasi = s.validationReport?.rekomendasi;
  const confidence = s.validationReport?.confidence;
  const level = confidence !== undefined ? getConfidenceLevel(confidence) : null;
  const canReview = s.status === 'Waiting Approval';

  return (
    <div
      onClick={() => navigate(`/admin/news-event/review/${s.id}`)}
      style={{
        display: 'flex', gap: 12, padding: 14, cursor: 'pointer',
        background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
        border: `1.5px solid ${canReview ? '#f0c060' : 'var(--color-border)'}`,
        boxShadow: canReview ? '0 0 0 1px #f0c06040' : 'var(--shadow-sm)',
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 'var(--radius-sm)', flexShrink: 0,
        background: 'var(--color-bg)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: 24,
      }}>
        {coverSubmission(s)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Badge row */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 4, alignItems: 'center' }}>
          <StatusBadge status={s.status} />
          <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'var(--color-primary-light)', color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
            {s.tipeKonten === 'Event' ? `Event · ${getJenisEventLabel(s.event?.jenisEventId || '')}` : 'News'}
          </span>
          {canReview && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#fff3e0', color: '#e65100', border: '1px solid #f0c060' }}>
              ⏳ Perlu Review
            </span>
          )}
        </div>

        {/* Judul */}
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {judulSubmission(s)}
        </div>

        {/* Workspace + tanggal */}
        <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 3 }}>
          {s.workspaceName} · {s.updatedAt}
        </div>

        {/* AI Report row */}
        {s.validationReport && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6, alignItems: 'center' }}>
            {rekomendasi && (
              <span style={{ fontSize: 11, fontWeight: 700 }}>
                {REKOMENDASI_EMOJI[rekomendasi]} {rekomendasi}
              </span>
            )}
            {level && confidence !== undefined && (
              <span style={{
                fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                background: CONFIDENCE_LEVEL_COLOR[level].bg, color: CONFIDENCE_LEVEL_COLOR[level].color,
              }}>
                {CONFIDENCE_LEVEL_EMOJI[level]} Confidence {confidence}% ({level})
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Publication Management Strip ────────────────────────────────────────────
function PublicationStrip() {
  const navigate = useNavigate();
  const r = getPublicationRingkasan();
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', padding: '13px 14px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>📋 Publication Management</div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
            Kelola Publikasi, Jadwal, Arsip &amp; Versioning
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/publication')}
          style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-primary)', background: 'var(--color-surface)', color: 'var(--color-primary)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          Kelola
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {[
          { label: 'Antrian',   value: r.waitingPublish, color: '#e65100', emoji: '⏳' },
          { label: 'Terjadwal', value: r.scheduled,      color: '#3949ab', emoji: '📅' },
          { label: 'Diterbitkan', value: r.published,      color: '#1b7a43', emoji: '✅' },
          { label: 'Arsip',     value: r.archived,       color: '#607d8b', emoji: '📦' },
        ].map(({ label, value, color, emoji }) => (
          <div
            key={label}
            onClick={() => navigate('/admin/publication')}
            style={{
              background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)', padding: '8px 6px',
              textAlign: 'center', cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 14 }}>{emoji}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 9.5, color: 'var(--color-muted)', fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>
      {r.waitingPublish > 0 && (
        <button
          type="button"
          onClick={() => navigate('/admin/publication')}
          style={{ width: '100%', padding: '9px 0', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
        >
          ⏳ {r.waitingPublish} item menunggu keputusan publikasi → Buka Publication Queue
        </button>
      )}
    </div>
  );
}

// ─── RSS Queue Summary Strip ──────────────────────────────────────────────────
function RssQueueStrip() {
  const navigate = useNavigate();
  const rssR = getRssQueueRingkasan();
  const srcR = getRssSourceRingkasan();
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>📡 Trusted RSS Engine</div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
            {srcR.active} source aktif · Priority 1 sumber publikasi
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/rss/sources')}
          style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-primary)', background: 'var(--color-surface)', color: 'var(--color-primary)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          Kelola Source
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {[
          { label: 'Menunggu', value: rssR.waitingPublish, color: '#e65100', emoji: '⏳' },
          { label: 'Diterbitkan', value: rssR.published, color: '#1b7a43', emoji: '✅' },
          { label: 'Ditolak', value: rssR.rejected, color: '#a02020', emoji: '🔴' },
          { label: 'Diarsipkan', value: rssR.archived, color: '#607d8b', emoji: '📦' },
        ].map(({ label, value, color, emoji }) => (
          <div
            key={label}
            onClick={() => navigate('/admin/rss/queue')}
            style={{
              background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)', padding: '8px 6px', textAlign: 'center', cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 14 }}>{emoji}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 9.5, color: 'var(--color-muted)', fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>
      {rssR.waitingPublish > 0 && (
        <button
          type="button"
          onClick={() => navigate('/admin/rss/queue')}
          style={{ width: '100%', padding: '9px 0', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
        >
          ⏳ {rssR.waitingPublish} artikel menunggu keputusan → Buka RSS Queue
        </button>
      )}
      {rssR.waitingPublish === 0 && (
        <button
          type="button"
          onClick={() => navigate('/admin/rss/queue')}
          style={{ width: '100%', padding: '9px 0', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
        >
          Lihat RSS Queue →
        </button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminNewsEventReview() {
  const ringkasan: AdminRingkasan = getAdminRingkasan();
  const semua = getAllSubmissionsForAdmin();

  const [query, setQuery] = useState('');
  const [filterTipe, setFilterTipe] = useState<FilterTipe>('Semua');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('Semua');
  const [filterConfidence, setFilterConfidence] = useState<FilterConfidence>('Semua');
  const [filterRekomendasi, setFilterRekomendasi] = useState<FilterRekomendasi>('Semua');

  // Klik ringkasan card → langsung filter status
  function handleRingkasanClick(status: FilterStatus) {
    setFilterStatus((prev) => (prev === status ? 'Semua' : status));
  }

  const daftar = useMemo(() => {
    const kw = query.trim().toLowerCase();
    return semua.filter((s) => {
      if (filterTipe !== 'Semua' && s.tipeKonten !== filterTipe) return false;
      if (filterStatus !== 'Semua' && s.status !== filterStatus) return false;
      if (filterConfidence !== 'Semua') {
        if (!s.validationReport) return false;
        if (getConfidenceLevel(s.validationReport.confidence) !== filterConfidence) return false;
      }
      if (filterRekomendasi !== 'Semua') {
        if (!s.validationReport) return false;
        if (s.validationReport.rekomendasi !== filterRekomendasi) return false;
      }
      if (!kw) return true;
      const judulLower = judulSubmission(s).toLowerCase();
      const wsLower = s.workspaceName.toLowerCase();
      const penyLower = penyelenggaraSubmission(s).toLowerCase();
      const jenisLower = s.tipeKonten === 'Event' ? getJenisEventLabel(s.event?.jenisEventId || '').toLowerCase() : '';
      return judulLower.includes(kw) || wsLower.includes(kw) || penyLower.includes(kw) || jenisLower.includes(kw);
    });
  }, [semua, query, filterTipe, filterStatus, filterConfidence, filterRekomendasi]);

  const waitingApprovalCount = ringkasan.waitingApproval;

  return (
    <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--color-text)' }}>Admin Dashboard</h1>
        <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--color-muted)' }}>
          News &amp; Event — AI Validation &amp; Approval Workflow
        </p>
      </div>

      {/* Panduan singkat */}
      <div style={{
        background: '#eaf4ff', border: '1.5px solid #b3d6f5', borderRadius: 'var(--radius-md)',
        padding: '11px 14px', fontSize: 11.5, color: '#1a3a5c', lineHeight: 1.6,
      }}>
        Admin <strong>tidak melakukan validasi dari awal</strong>. Baca Validation Report AI (Temuan, Bukti,
        Warning, Risiko, Confidence, Rekomendasi), lalu putuskan: <strong>Approve</strong>, <strong>Minta Revisi</strong>, atau <strong>Reject</strong>.
        AI tidak pernah Approve/Reject otomatis.
      </div>

      {/* Publication Management Strip (NEWS-007) */}
      <PublicationStrip />

      {/* RSS Queue Strip (NEWS-006) */}
      <RssQueueStrip />

      {/* Ringkasan Workspace Submission */}
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Ringkasan
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
          <RingkasanCard
            label="Menunggu Validasi" value={ringkasan.waitingValidation}
            color="var(--color-muted)" emoji="⏳"
          />
          <RingkasanCard
            label="Menunggu Persetujuan" value={ringkasan.waitingApproval}
            color="#e65100" emoji="📋"
            onClick={() => handleRingkasanClick('Waiting Approval')}
            active={filterStatus === 'Waiting Approval'}
          />
          <RingkasanCard
            label="Published" value={ringkasan.published}
            color="#1b7a43" emoji="✅"
            onClick={() => handleRingkasanClick('Published')}
            active={filterStatus === 'Published'}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <RingkasanCard
            label="Revisi" value={ringkasan.revision}
            color="#5e35b1" emoji="🟡"
            onClick={() => handleRingkasanClick('Revisi Diminta')}
            active={filterStatus === 'Revisi Diminta'}
          />
          <RingkasanCard
            label="Ditolak" value={ringkasan.rejected}
            color="#a02020" emoji="🔴"
            onClick={() => handleRingkasanClick('Rejected')}
            active={filterStatus === 'Rejected'}
          />
        </div>
        {waitingApprovalCount > 0 && (
          <div style={{
            marginTop: 10, background: '#fff3e0', border: '1.5px solid #f0c060',
            borderRadius: 'var(--radius-sm)', padding: '9px 12px',
            fontSize: 12, color: '#e65100', fontWeight: 700,
          }}>
            ⏳ {waitingApprovalCount} Submission menunggu keputusan Admin.
          </div>
        )}
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari judul, workspace, penyelenggara, jenis event…"
          aria-label="Cari submission"
        />
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <ChipFilter<FilterTipe>
          label="Tipe Konten"
          options={[
            { value: 'Semua', label: 'Semua' },
            { value: 'News', label: '📰 News' },
            { value: 'Event', label: '🗓️ Event' },
          ]}
          value={filterTipe}
          onChange={setFilterTipe}
        />
        <ChipFilter<FilterStatus>
          label="Status"
          options={[
            { value: 'Semua', label: 'Semua' },
            { value: 'Draft', label: 'Draft' },
            { value: 'Waiting Approval', label: 'Menunggu Persetujuan' },
            { value: 'Revisi Diminta', label: 'Revisi Diminta' },
            { value: 'Published', label: 'Diterbitkan' },
            { value: 'Rejected', label: 'Ditolak' },
            { value: 'Archived', label: 'Diarsipkan' },
          ]}
          value={filterStatus}
          onChange={setFilterStatus}
        />
        <ChipFilter<FilterConfidence>
          label="Confidence AI"
          options={[
            { value: 'Semua', label: 'Semua' },
            { value: 'Tinggi', label: '🟢 Tinggi (≥70%)' },
            { value: 'Sedang', label: '🟡 Sedang (40-69%)' },
            { value: 'Rendah', label: '🔴 Rendah (<40%)' },
          ]}
          value={filterConfidence}
          onChange={setFilterConfidence}
        />
        <ChipFilter<FilterRekomendasi>
          label="Rekomendasi AI"
          options={[
            { value: 'Semua', label: 'Semua' },
            { value: 'Layak Dipublikasikan', label: '🟢 Layak' },
            { value: 'Perlu Revisi', label: '🟡 Perlu Revisi' },
            { value: 'Ditolak', label: '🔴 Ditolak' },
          ]}
          value={filterRekomendasi}
          onChange={setFilterRekomendasi}
        />
      </div>

      {/* Daftar */}
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Daftar Submission ({daftar.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {daftar.length === 0 ? (
            <EmptyState pesan="Tidak ada Submission yang cocok dengan filter." />
          ) : (
            daftar.map((s) => <AdminSubmissionCard key={s.id} s={s} />)
          )}
        </div>
      </div>
    </div>
  );
}
