// ─── News & Event — Preview Submission sebelum Submit (NEWS-004) ────────────
// Constitution → PREVIEW EVENT: Poster → Jenis Event → Nama Event → Tanggal →
// Jam → Lokasi → Penyelenggara → Kontak → HTM → Kuota → Deskripsi.
// Submit menjalankan AI Pre-check (simulasi) lalu memindahkan status ke
// Waiting Approval — Admin Review bukan cakupan task ini (NEWS-005).

import { useNavigate, useParams } from 'react-router-dom';
import {
  getJenisEventLabel,
  getSubmissionById,
  submitSubmission,
} from '../data/newsEventSubmissionData';
import { KategoriChips, TagChips } from '../components/NewsEventShared';
import { formatTanggalIndonesia } from '../data/newsEventData';

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginBottom: 14, overflow: 'hidden' }}>
    <div style={{ padding: '12px 16px 11px', borderBottom: '1px solid var(--color-border)', background: '#f7faf8' }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 0.6 }}>{title}</span>
    </div>
    <div style={{ padding: '16px 16px 4px' }}>{children}</div>
  </div>
);

function Baris({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--color-border)', fontSize: 12.5, gap: 10 }}>
      <span style={{ color: 'var(--color-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600, color: 'var(--color-text)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export default function NewsEventSubmissionPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const rec = id ? getSubmissionById(id) : undefined;

  if (!rec) {
    return <div style={{ padding: 16 }}>Submission tidak ditemukan.</div>;
  }

  function handleSubmit() {
    submitSubmission(rec!.id);
    navigate(`/news-event/submission/${rec!.id}`);
  }

  const editPath = rec.tipeKonten === 'News' ? `/news-event/submission/news/${rec.id}` : `/news-event/submission/event/${rec.id}`;

  return (
    <div style={{ padding: '16px 16px 100px' }}>
      {rec.tipeKonten === 'News' && rec.news ? (
        <SectionCard title="Pratinjau Berita">
          <div style={{ paddingBottom: 16 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 44, width: '100%', aspectRatio: '16 / 9',
              background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', marginBottom: 12,
            }}>
              {rec.news.cover}
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>{rec.news.judul}</h3>
            <p style={{ margin: '0 0 12px', fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.6 }}>{rec.news.ringkasan}</p>
            <div style={{ marginBottom: 10 }}><KategoriChips kategori={rec.news.kategori} /></div>
            <div style={{ marginBottom: 12 }}><TagChips tag={rec.news.tag} /></div>
            <p style={{ fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{rec.news.isi}</p>
            <Baris label="Referensi" value={rec.news.referensi} />
            <Baris label="Sumber" value={rec.news.sumber} />
          </div>
        </SectionCard>
      ) : rec.event ? (
        <SectionCard title="Pratinjau Acara">
          <div style={{ paddingBottom: 16 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 60, width: '100%', aspectRatio: '3 / 4', maxHeight: 240,
              background: '#fff8e1', borderRadius: 'var(--radius-md)', marginBottom: 12,
            }}>
              {rec.event.poster}
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                {getJenisEventLabel(rec.event.jenisEventId)}
              </span>
            </div>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>{rec.event.namaEvent}</h3>
            <Baris label="Tanggal" value={`${formatTanggalIndonesia(rec.event.tanggalMulai)}${rec.event.tanggalSelesai && rec.event.tanggalSelesai !== rec.event.tanggalMulai ? ` – ${formatTanggalIndonesia(rec.event.tanggalSelesai)}` : ''}`} />
            <Baris label="Jam" value={`${rec.event.jamMulai} – ${rec.event.jamSelesai} WIB`} />
            <Baris label="Lokasi" value={rec.event.lokasi} />
            <Baris label="Penyelenggara" value={rec.event.penyelenggara} />
            <Baris label="Kontak" value={rec.event.kontak} />
            <Baris label="HTM" value={rec.event.htm} />
            <Baris label="Kuota" value={rec.event.kuota} />
            {rec.event.deskripsiSingkat && (
              <p style={{ fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.6, marginTop: 12 }}>{rec.event.deskripsiSingkat}</p>
            )}
          </div>
        </SectionCard>
      ) : null}

      <div style={{
        background: '#eaf4ff', border: '1.5px solid #b3d6f5', borderRadius: 'var(--radius-md)',
        padding: '12px 14px', marginBottom: 14, fontSize: 11.5, color: '#1a3a5c', lineHeight: 1.6,
      }}>
        Setelah Submit, sistem akan menjalankan AI Validation Engine (rule-based) untuk menghasilkan Validation
        Report, lalu Submission masuk ke status Waiting Approval untuk ditinjau Admin. AI tidak mengambil keputusan
        Approve/Reject/Minta Revisi — keputusan akhir selalu berada di tangan Admin.
      </div>

      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, display: 'flex', gap: 10,
        padding: '12px 16px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)',
      }}>
        <button
          type="button"
          onClick={() => navigate(editPath)}
          style={{ flex: 1, padding: '13px 0', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          ← Edit
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          style={{ flex: 2, padding: '13px 0', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
