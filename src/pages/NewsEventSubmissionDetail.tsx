// ─── News & Event — Detail Submission (NEWS-004/NEWS-005) ───────────────────
// Menampilkan status terkini, Validation Report AI, Alasan Rejected/Catatan
// Revisi, dan Aksi kontekstual sesuai status (Constitution → AKSI).

import { useNavigate, useParams } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import {
  archiveSubmission,
  getJenisEventLabel,
  getSubmissionById,
  type SubmissionStatus,
} from '../data/newsEventSubmissionData';
import { REKOMENDASI_EMOJI } from '../data/newsEventValidationData';
import { formatTanggalIndonesia } from '../data/newsEventData';

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

const SEVERITY_STYLE: Record<string, { bg: string; border: string; color: string; emoji: string }> = {
  Risiko: { bg: '#fbe1e1', border: '#e8b4b4', color: '#a02020', emoji: '🔴' },
  Warning: { bg: '#fff8e1', border: '#f0dca0', color: '#7b5e2a', emoji: '🟡' },
  Info: { bg: '#eef7f0', border: '#c8e6ce', color: '#2f6b45', emoji: '🟢' },
};

const SEVERITY_LABEL: Record<string, string> = {
  Risiko: 'Risiko',
  Warning: 'Peringatan',
  Info: 'Informasi',
};

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const c = STATUS_COLOR[status];
  return (
    <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 11px', borderRadius: 20, background: c.bg, color: c.color }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginBottom: 14, overflow: 'hidden' }}>
    <div style={{ padding: '12px 16px 11px', borderBottom: '1px solid var(--color-border)', background: '#f7faf8' }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 0.6 }}>{title}</span>
    </div>
    <div style={{ padding: '16px' }}>{children}</div>
  </div>
);

export default function NewsEventSubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  const rec = id ? getSubmissionById(id) : undefined;

  if (!rec) {
    return <div style={{ padding: 16 }}>Submission tidak ditemukan.</div>;
  }

  const judul = rec.tipeKonten === 'News' ? rec.news?.judul : rec.event?.namaEvent;
  const editPath = rec.tipeKonten === 'News' ? `/news-event/submission/news/${rec.id}` : `/news-event/submission/event/${rec.id}`;

  function handleArsipkan() {
    if (window.confirm('Arsipkan konten Published ini?')) {
      archiveSubmission(rec!.id);
      navigate(0);
    }
  }

  return (
    <div style={{ padding: '16px 16px 28px' }}>
      <SectionCard title="Status Submission">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <StatusBadge status={rec.status} />
          <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>
            {rec.tipeKonten} · {ws.workspace_name}
          </span>
        </div>
        <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>{judul}</h3>
        {rec.tipeKonten === 'Event' && rec.event && (
          <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginBottom: 8 }}>
            {getJenisEventLabel(rec.event.jenisEventId)} · {formatTanggalIndonesia(rec.event.tanggalMulai)}
          </div>
        )}
        <div style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>Diperbarui {rec.updatedAt}</div>
      </SectionCard>

      {rec.alasanRejected && (
        <SectionCard title="Alasan Ditolak">
          <p style={{ margin: 0, fontSize: 12.5, color: '#a02020', lineHeight: 1.6, fontWeight: 600 }}>{rec.alasanRejected}</p>
        </SectionCard>
      )}

      {rec.catatanRevisi && (
        <SectionCard title="Catatan Revisi dari Admin">
          <p style={{ margin: 0, fontSize: 12.5, color: '#5e35b1', lineHeight: 1.6, fontWeight: 600 }}>{rec.catatanRevisi}</p>
        </SectionCard>
      )}

      {rec.validationReport && (
        <SectionCard title="AI Validation Report">
          <p style={{ margin: '0 0 12px', fontSize: 11.5, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Report ini dihasilkan oleh Validation Engine berbasis-aturan (rule-based) dari data submission. Engine
            hanya membuat temuan &amp; rekomendasi, keputusan akhir tetap berada pada Admin.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 800 }}>
              {REKOMENDASI_EMOJI[rec.validationReport.rekomendasi]} {rec.validationReport.rekomendasi}
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>Confidence: {rec.validationReport.confidence}%</span>
          </div>

          <div style={{ fontSize: 12.5, color: 'var(--color-text)', marginBottom: 12, lineHeight: 1.6 }}>
            {rec.validationReport.ringkasan}
          </div>

          {rec.validationReport.ocrExtracted && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
                Hasil Simulasi OCR Poster
              </div>
              {Object.entries(rec.validationReport.ocrExtracted).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--color-border)', fontSize: 12 }}>
                  <span style={{ color: 'var(--color-muted)' }}>{k}</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
            Temuan ({rec.validationReport.temuan.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {rec.validationReport.temuan.map((f, i) => {
              const st = SEVERITY_STYLE[f.severity];
              return (
                <div key={i} style={{ background: st.bg, border: `1px solid ${st.border}`, borderRadius: 'var(--radius-sm)', padding: '9px 11px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: st.color }}>{st.emoji} {f.kategori}</div>
                  <div style={{ fontSize: 12, color: st.color, marginTop: 2, opacity: 0.9 }}>{f.detail}</div>
                </div>
              );
            })}
          </div>

          {rec.validationReport.saran.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
                Saran AI
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.7 }}>
                {rec.validationReport.saran.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </SectionCard>
      )}

      <SectionCard title="Riwayat">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rec.riwayat.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)', marginTop: 5, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>{r.aksi}</div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{new Date(r.tanggal).toLocaleString('id-ID')}</div>
                {r.catatan && <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 2 }}>{r.catatan}</div>}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {(rec.status === 'Rejected' || rec.status === 'Revisi Diminta') && (
          <button
            type="button"
            onClick={() => navigate(editPath)}
            style={{ flex: 1, padding: '13px 0', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Perbaiki &amp; Submit Ulang
          </button>
        )}
        {rec.status === 'Published' && (
          <button
            type="button"
            onClick={handleArsipkan}
            style={{ flex: 1, padding: '13px 0', borderRadius: 'var(--radius-sm)', border: '1.5px solid #f0c4c4', background: '#fff', color: '#a02020', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Arsipkan
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate('/news-event/submission')}
          style={{ flex: 1, padding: '13px 0', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          Kembali ke Daftar
        </button>
      </div>
    </div>
  );
}
