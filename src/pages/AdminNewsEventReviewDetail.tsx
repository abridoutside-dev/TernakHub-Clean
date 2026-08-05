// ─── News & Event — Admin Review: Detail & Keputusan (NEWS-005) ──────────────
// Constitution → ADMIN REVIEW + ADMIN ACTION.
//
// Admin membaca Validation Report AI secara lengkap — Summary, Confidence
// (🟢/🟡/🔴), Temuan (Risiko/Warning/Info), Evidence, Source Validation,
// Duplicate Check, OCR Poster, Saran — lalu memutuskan:
// • Approve  → konten langsung Published ke listing publik
// • Minta Revisi  → Publisher memperbaiki, Submit ulang → AI Validation ulang
// • Reject  → alasan wajib (preset + catatan bebas)
//
// AI TIDAK pernah Approve/Reject otomatis. Keputusan akhir selalu Admin.

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  approveSubmission,
  rejectSubmission,
  requestRevisionSubmission,
  REJECT_ALASAN_OPTIONS,
  getConfidenceLevel,
  CONFIDENCE_LEVEL_EMOJI,
  CONFIDENCE_LEVEL_COLOR,
} from '../data/newsEventAdminReviewData';
import { getJenisEventLabel, getSubmissionById } from '../data/newsEventSubmissionData';
import { REKOMENDASI_EMOJI } from '../data/newsEventValidationData';
import { formatTanggalIndonesia } from '../data/newsEventData';

// ─── Severity Style ───────────────────────────────────────────────────────────
const SEVERITY_STYLE: Record<string, { bg: string; border: string; color: string; emoji: string }> = {
  Risiko: { bg: '#fbe1e1', border: '#e8b4b4', color: '#a02020', emoji: '🔴' },
  Warning: { bg: '#fff8e1', border: '#f0dca0', color: '#7b5e2a', emoji: '🟡' },
  Info: { bg: '#eef7f0', border: '#c8e6ce', color: '#2f6b45', emoji: '🟢' },
};

// ─── Shared Components ────────────────────────────────────────────────────────
const SectionCard = ({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) => (
  <div style={{
    background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', marginBottom: 14, overflow: 'hidden',
  }}>
    <div style={{
      padding: '12px 16px 11px', borderBottom: '1px solid var(--color-border)',
      background: accent ?? '#f7faf8',
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {title}
      </span>
    </div>
    <div style={{ padding: 16 }}>{children}</div>
  </div>
);

function Baris({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)', fontSize: 12.5, gap: 10 }}>
      <span style={{ color: 'var(--color-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600, color: 'var(--color-text)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

type AksiModal = 'reject' | 'revisi' | null;

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminNewsEventReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const rec = id ? getSubmissionById(id) : undefined;

  const [modal, setModal] = useState<AksiModal>(null);
  const [alasanTerpilih, setAlasanTerpilih] = useState<string[]>([]);
  const [catatan, setCatatan] = useState('');

  if (!rec) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)' }}>
        Submission tidak ditemukan.
      </div>
    );
  }

  const judul = rec.tipeKonten === 'News' ? rec.news?.judul : rec.event?.namaEvent;
  const report = rec.validationReport;
  const sudahDiputuskan = rec.status !== 'Waiting Approval';

  // Confidence
  const confidenceLevel = report ? getConfidenceLevel(report.confidence) : null;
  const confidenceColors = confidenceLevel ? CONFIDENCE_LEVEL_COLOR[confidenceLevel] : null;

  // Partition temuan by severity
  const temuanRisiko = report?.temuan.filter((t) => t.severity === 'Risiko') ?? [];
  const temuanWarning = report?.temuan.filter((t) => t.severity === 'Warning') ?? [];
  const temuanInfo = report?.temuan.filter((t) => t.severity === 'Info') ?? [];

  // Source Validation — temuan bertopik kredibilitas/sumber/referensi
  const SOURCE_KATA = ['sumber', 'penulis', 'referensi', 'kredibilitas', 'domain'];
  const temuanSource = report?.temuan.filter((t) =>
    SOURCE_KATA.some((k) => t.kategori.toLowerCase().includes(k))
  ) ?? [];

  // Duplicate Check — temuan bertopik duplikasi/jadwal
  const DUPLIKAT_KATA = ['duplikat', 'duplikasi', 'jadwal'];
  const temuanDuplikat = report?.temuan.filter((t) =>
    DUPLIKAT_KATA.some((k) => t.kategori.toLowerCase().includes(k))
  ) ?? [];

  function toggleAlasan(a: string) {
    setAlasanTerpilih((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  function handleApprove() {
    if (!window.confirm('Approve Submission ini? Konten akan langsung Published ke listing publik.')) return;
    approveSubmission(rec!.id);
    navigate('/admin/news-event/review');
  }

  function handleReject() {
    if (alasanTerpilih.length === 0 && !catatan.trim()) {
      window.alert('Pilih minimal satu alasan atau tambahkan catatan.');
      return;
    }
    rejectSubmission(rec!.id, alasanTerpilih, catatan);
    navigate('/admin/news-event/review');
  }

  function handleRevisi() {
    if (!catatan.trim()) {
      window.alert('Catatan revisi wajib diisi agar Publisher tahu apa yang perlu diperbaiki.');
      return;
    }
    requestRevisionSubmission(rec!.id, catatan);
    navigate('/admin/news-event/review');
  }

  return (
    <div style={{ padding: '16px 16px 110px' }}>

      {/* ── Konten Submission ── */}
      <SectionCard title="Konten Submission">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{
            fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
            background: 'var(--color-primary-light)', color: 'var(--color-primary)',
          }}>
            {rec.tipeKonten === 'Event'
              ? `Event · ${getJenisEventLabel(rec.event?.jenisEventId || '')}`
              : 'News'}
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>{rec.workspaceName}</span>
          <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>·</span>
          <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>{rec.updatedAt}</span>
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>{judul}</h3>

        {rec.tipeKonten === 'News' && rec.news && (
          <>
            <p style={{ margin: '0 0 8px', fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.6 }}>
              {rec.news.ringkasan}
            </p>
            {rec.news.isi && (
              <p style={{ margin: '0 0 8px', fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {rec.news.isi}
              </p>
            )}
            <Baris label="Sumber/Penulis" value={rec.news.sumber} />
            <Baris label="Referensi" value={rec.news.referensi} />
            <Baris label="Kategori" value={rec.news.kategori.join(', ')} />
          </>
        )}

        {rec.tipeKonten === 'Event' && rec.event && (
          <div style={{ fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.9 }}>
            <Baris label="Poster" value={rec.event.poster} />
            <Baris label="Tanggal" value={`${formatTanggalIndonesia(rec.event.tanggalMulai)}${rec.event.tanggalSelesai && rec.event.tanggalSelesai !== rec.event.tanggalMulai ? ` – ${formatTanggalIndonesia(rec.event.tanggalSelesai)}` : ''}`} />
            <Baris label="Jam" value={`${rec.event.jamMulai} – ${rec.event.jamSelesai} WIB`} />
            <Baris label="Lokasi" value={rec.event.lokasi} />
            <Baris label="Penyelenggara" value={rec.event.penyelenggara} />
            <Baris label="Kontak" value={rec.event.kontak} />
            <Baris label="HTM" value={rec.event.htm} />
            <Baris label="Link Pendaftaran" value={rec.event.linkPendaftaran} />
            <Baris label="Sponsor" value={rec.event.sponsor} />
          </div>
        )}
      </SectionCard>

      {/* ── Catatan disclaimer AI ── */}
      <div style={{
        background: '#f3f0fa', border: '1px solid #d1c4e9', borderRadius: 'var(--radius-md)',
        padding: '10px 14px', fontSize: 11, color: '#5e35b1', lineHeight: 1.6, marginBottom: 14,
      }}>
        ℹ️ Validation Report di bawah dihasilkan oleh Validation Engine berbasis-aturan (rule-based) dari data
        submission. Engine <strong>tidak pernah Approve atau Reject otomatis</strong>. Keputusan akhir sepenuhnya
        berada pada Admin.
      </div>

      {/* ── AI Validation Report ── */}
      {report ? (
        <>
          {/* Summary & Confidence */}
          <SectionCard title="AI Validation Report — Summary">
            {/* Rekomendasi */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
              padding: '12px 14px', borderRadius: 'var(--radius-sm)',
              background: report.rekomendasi === 'Layak Dipublikasikan' ? '#e8f5ee'
                : report.rekomendasi === 'Perlu Revisi' ? '#fff8e1' : '#fbe1e1',
              border: `1.5px solid ${report.rekomendasi === 'Layak Dipublikasikan' ? '#c8e6ce'
                : report.rekomendasi === 'Perlu Revisi' ? '#f0dca0' : '#e8b4b4'}`,
            }}>
              <div style={{ fontSize: 26 }}>{REKOMENDASI_EMOJI[report.rekomendasi]}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)' }}>
                  Rekomendasi AI: {report.rekomendasi}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 2 }}>
                  Keputusan akhir tetap berada pada Admin.
                </div>
              </div>
            </div>

            {/* Confidence Indicator */}
            {confidenceLevel && confidenceColors && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
                padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                background: confidenceColors.bg, border: `1px solid ${confidenceColors.color}40`,
              }}>
                <div style={{ fontSize: 20 }}>{CONFIDENCE_LEVEL_EMOJI[confidenceLevel]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: confidenceColors.color }}>
                    Confidence: {report.confidence}% — {confidenceLevel}
                  </div>
                  <div style={{ height: 6, background: '#e0e0e0', borderRadius: 99, marginTop: 6, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${report.confidence}%`,
                      background: confidenceLevel === 'Tinggi' ? '#1b7a43' : confidenceLevel === 'Sedang' ? '#f59e0b' : '#a02020',
                      borderRadius: 99, transition: 'width 0.3s',
                    }} />
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--color-muted)', marginTop: 3 }}>
                    🟢 Tinggi ≥70% · 🟡 Sedang 40-69% · 🔴 Rendah &lt;40% — Confidence bukan penentu Approve.
                  </div>
                </div>
              </div>
            )}

            {/* Ringkasan teks */}
            <div style={{ fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.6, marginBottom: 10 }}>
              {report.ringkasan}
            </div>

            {/* Jumlah temuan per severity */}
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { label: 'Risiko', count: temuanRisiko.length, bg: '#fbe1e1', color: '#a02020' },
                { label: 'Peringatan', count: temuanWarning.length, bg: '#fff8e1', color: '#7b5e2a' },
                { label: 'Informasi', count: temuanInfo.length, bg: '#eef7f0', color: '#1b7a43' },
              ].map(({ label, count, bg, color }) => (
                <div key={label} style={{
                  flex: 1, textAlign: 'center', padding: '8px 4px',
                  background: bg, borderRadius: 'var(--radius-sm)',
                }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color }}>{count}</div>
                  <div style={{ fontSize: 10.5, color, fontWeight: 600 }}>{label}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Temuan — Risiko (jika ada) */}
          {temuanRisiko.length > 0 && (
            <SectionCard title={`Risiko (${temuanRisiko.length})`} accent="#fff0f0">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {temuanRisiko.map((f, i) => {
                  const st = SEVERITY_STYLE[f.severity];
                  return (
                    <div key={i} style={{ background: st.bg, border: `1px solid ${st.border}`, borderRadius: 'var(--radius-sm)', padding: '9px 11px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: st.color }}>{st.emoji} {f.kategori}</div>
                      <div style={{ fontSize: 12, color: st.color, marginTop: 2, opacity: 0.9 }}>{f.detail}</div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* Temuan — Warning (jika ada) */}
          {temuanWarning.length > 0 && (
            <SectionCard title={`Warning (${temuanWarning.length})`} accent="#fffdf0">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {temuanWarning.map((f, i) => {
                  const st = SEVERITY_STYLE[f.severity];
                  return (
                    <div key={i} style={{ background: st.bg, border: `1px solid ${st.border}`, borderRadius: 'var(--radius-sm)', padding: '9px 11px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: st.color }}>{st.emoji} {f.kategori}</div>
                      <div style={{ fontSize: 12, color: st.color, marginTop: 2, opacity: 0.9 }}>{f.detail}</div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* Evidence — Info findings */}
          {temuanInfo.length > 0 && (
            <SectionCard title={`Evidence / Bukti (${temuanInfo.length})`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {temuanInfo.map((f, i) => {
                  const st = SEVERITY_STYLE[f.severity];
                  return (
                    <div key={i} style={{ background: st.bg, border: `1px solid ${st.border}`, borderRadius: 'var(--radius-sm)', padding: '8px 11px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: st.color }}>{st.emoji} {f.kategori}</div>
                      <div style={{ fontSize: 12, color: st.color, marginTop: 2, opacity: 0.9 }}>{f.detail}</div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* Source Validation */}
          {temuanSource.length > 0 && (
            <SectionCard title="Source Validation">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {temuanSource.map((f, i) => {
                  const st = SEVERITY_STYLE[f.severity];
                  return (
                    <div key={i} style={{ background: st.bg, border: `1px solid ${st.border}`, borderRadius: 'var(--radius-sm)', padding: '8px 11px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: st.color }}>{st.emoji} {f.kategori}</div>
                      <div style={{ fontSize: 12, color: st.color, marginTop: 2, opacity: 0.9 }}>{f.detail}</div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* Duplicate Check */}
          {temuanDuplikat.length > 0 && (
            <SectionCard title="Duplicate Check">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {temuanDuplikat.map((f, i) => {
                  const st = SEVERITY_STYLE[f.severity];
                  return (
                    <div key={i} style={{ background: st.bg, border: `1px solid ${st.border}`, borderRadius: 'var(--radius-sm)', padding: '8px 11px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: st.color }}>{st.emoji} {f.kategori}</div>
                      <div style={{ fontSize: 12, color: st.color, marginTop: 2, opacity: 0.9 }}>{f.detail}</div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* OCR Poster (Event only) */}
          {report.ocrExtracted && Object.keys(report.ocrExtracted).length > 0 && (
            <SectionCard title="Simulasi OCR Poster">
              <div style={{
                background: '#fff8e1', border: '1px solid #f0dca0', borderRadius: 'var(--radius-sm)',
                padding: '8px 12px', fontSize: 11, color: '#7b5e2a', marginBottom: 10,
              }}>
              ⚠️ "OCR Poster" merupakan pemeriksaan deterministik pada data submission.
                Labeli jelas kepada pengguna bahwa ini adalah simulasi.
              </div>
              {Object.entries(report.ocrExtracted).map(([k, v]) => (
                <div key={k} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '6px 0',
                  borderBottom: '1px solid var(--color-border)', fontSize: 12,
                }}>
                  <span style={{ color: 'var(--color-muted)' }}>{k}</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{v}</span>
                </div>
              ))}
            </SectionCard>
          )}

          {/* Saran AI */}
          {report.saran.length > 0 && (
            <SectionCard title="Saran AI">
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.8 }}>
                {report.saran.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </SectionCard>
          )}
        </>
      ) : (
        <div style={{
          background: '#eceff1', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
          padding: '14px 16px', fontSize: 12.5, color: 'var(--color-muted)', marginBottom: 14,
        }}>
          Validation Report belum tersedia (Submission belum pernah di-submit untuk divalidasi AI).
        </div>
      )}

      {/* ── Riwayat / Audit Trail ── */}
      <SectionCard title="Audit Trail">
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

      {/* ── Status sudah diputuskan ── */}
      {sudahDiputuskan && (
        <div style={{
          background: '#eef7f0', border: '1.5px solid #c8e6ce', borderRadius: 'var(--radius-md)',
          padding: '11px 14px', fontSize: 12, color: '#2f6b45', fontWeight: 600, marginBottom: 14,
        }}>
          Submission ini sudah diputuskan: <strong>{rec.status}</strong>.
          {rec.alasanRejected && (
            <div style={{ marginTop: 6, color: '#a02020', fontSize: 12 }}>Alasan: {rec.alasanRejected}</div>
          )}
          {rec.catatanRevisi && (
            <div style={{ marginTop: 6, color: '#5e35b1', fontSize: 12 }}>Catatan Revisi: {rec.catatanRevisi}</div>
          )}
        </div>
      )}

      {/* ── Action Buttons (hanya untuk Waiting Approval) ── */}
      {!sudahDiputuskan && modal === null && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleApprove}
            style={{ flex: 1, minWidth: 110, padding: '13px 0', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            ✅ Approve
          </button>
          <button
            type="button"
            onClick={() => { setModal('revisi'); setCatatan(''); }}
            style={{ flex: 1, minWidth: 110, padding: '13px 0', borderRadius: 'var(--radius-sm)', border: '1.5px solid #c9b8f0', background: '#fff', color: '#5e35b1', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            🟡 Minta Revisi
          </button>
          <button
            type="button"
            onClick={() => { setModal('reject'); setCatatan(''); setAlasanTerpilih([]); }}
            style={{ flex: 1, minWidth: 110, padding: '13px 0', borderRadius: 'var(--radius-sm)', border: '1.5px solid #f0c4c4', background: '#fff', color: '#a02020', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            🔴 Reject
          </button>
        </div>
      )}

      {/* ── Modal Reject ── */}
      {modal === 'reject' && (
        <SectionCard title="Reject — Pilih atau Tambahkan Alasan" accent="#fff0f0">
          <p style={{ margin: '0 0 10px', fontSize: 12, color: '#a02020', lineHeight: 1.5 }}>
            Admin wajib memilih minimal satu alasan atau menambahkan catatan. Alasan AI (Validation Report) tetap
            tersimpan dan tidak ditimpa.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {REJECT_ALASAN_OPTIONS.map((a) => (
              <label key={a} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: 'var(--color-text)', cursor: 'pointer' }}>
                <input type="checkbox" checked={alasanTerpilih.includes(a)} onChange={() => toggleAlasan(a)} style={{ marginTop: 2 }} />
                {a}
              </label>
            ))}
          </div>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Catatan tambahan Admin (opsional jika alasan preset sudah dipilih)"
            rows={3}
            style={{ width: '100%', boxSizing: 'border-box', marginBottom: 12 }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => setModal(null)}
              style={{ flex: 1, padding: '12px 0', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleReject}
              style={{ flex: 2, padding: '12px 0', borderRadius: 'var(--radius-sm)', border: 'none', background: '#a02020', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
            >
              Reject Submission
            </button>
          </div>
        </SectionCard>
      )}

      {/* ── Modal Minta Revisi ── */}
      {modal === 'revisi' && (
        <SectionCard title="Minta Revisi — Catatan untuk Publisher" accent="#f3f0fa">
          <p style={{ margin: '0 0 10px', fontSize: 12, color: '#5e35b1', lineHeight: 1.5 }}>
            Publisher akan menerima catatan ini. Setelah diperbaiki dan Submit Ulang, AI Validation akan berjalan
            kembali secara otomatis.
          </p>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Jelaskan dengan spesifik apa yang perlu diperbaiki Publisher sebelum Submit Ulang"
            rows={4}
            style={{ width: '100%', boxSizing: 'border-box', marginBottom: 12 }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => setModal(null)}
              style={{ flex: 1, padding: '12px 0', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleRevisi}
              style={{ flex: 2, padding: '12px 0', borderRadius: 'var(--radius-sm)', border: 'none', background: '#5e35b1', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
            >
              Kirim Permintaan Revisi
            </button>
          </div>
        </SectionCard>
      )}

      {/* ── Back button ── */}
      <div style={{ marginTop: 14 }}>
        <button
          type="button"
          onClick={() => navigate('/admin/news-event/review')}
          style={{ width: '100%', padding: '13px 0', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          ← Kembali ke Dashboard
        </button>
      </div>
    </div>
  );
}
