// ─── News & Event — Form Event Submission (NEWS-004) ────────────────────────
// Constitution → FORM EVENT + JENIS EVENT + FIELD EVENT. Event berorientasi
// pada Poster (elemen utama) — artikel panjang tidak wajib. Jenis Event WAJIB
// dipilih dari struktur yang mudah ditambah (JENIS_EVENT_LIST).
//
// GATING: Halaman ini dilindungi oleh hasFeature('event_create') via
// FeatureGate. Pengguna Free yang mengakses langsung via URL akan melihat
// locked state, BUKAN form. Tidak ada form yang dirender sebelum otorisasi.

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getActiveWorkspace } from '../components/TopAppBar';
import FeatureGate from '../components/subscription/FeatureGate';
import {
  createDraftEvent,
  emptyEventForm,
  getSubmissionById,
  JENIS_EVENT_LIST,
  updateDraftEvent,
  type EventSubmissionForm as EventForm,
} from '../data/newsEventSubmissionData';

const POSTER_PALETTE = ['🗓️', '🎪', '🏟️', '🎓', '💻', '🐐', '🐄', '🐑', '🐔', '🩺', '💉', '📢', '🏆', '🛒'];

function FieldGroup({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return <div style={{ marginBottom: last ? 12 : 18 }}>{children}</div>;
}
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>{children}</label>;
}
function Opt() {
  return <span style={{ fontWeight: 400, color: 'var(--color-muted)', fontSize: 12 }}> (Opsional)</span>;
}
function ErrorText({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--color-danger)', lineHeight: 1.5, fontWeight: 600 }}>{children}</p>;
}
const emojiBtn = (active: boolean): React.CSSProperties => ({
  width: 40, height: 40, fontSize: 20, borderRadius: 'var(--radius-sm)',
  border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
  background: active ? 'var(--color-primary-light)' : 'var(--color-surface)',
  cursor: 'pointer',
});
const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginBottom: 14, overflow: 'hidden' }}>
    <div style={{ padding: '12px 16px 11px', borderBottom: '1px solid var(--color-border)', background: '#f7faf8' }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 0.6 }}>{title}</span>
    </div>
    <div style={{ padding: '16px 16px 4px' }}>{children}</div>
  </div>
);

export default function EventSubmissionForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id && id !== 'baru';
  const navigate = useNavigate();
  const ws = getActiveWorkspace();

  const existing = isEdit ? getSubmissionById(id!) : undefined;
  const [form, setForm] = useState<EventForm>(existing?.event ?? emptyEventForm());
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof EventForm>(key: K, value: EventForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.poster) e.poster = 'Poster wajib dipilih.';
    if (!form.jenisEventId) e.jenisEventId = 'Jenis Event wajib dipilih.';
    if (!form.namaEvent.trim()) e.namaEvent = 'Nama Event wajib diisi.';
    if (!form.penyelenggara.trim()) e.penyelenggara = 'Penyelenggara wajib diisi.';
    if (!form.lokasi.trim()) e.lokasi = 'Lokasi wajib diisi.';
    if (!form.tanggalMulai) e.tanggalMulai = 'Tanggal Mulai wajib diisi.';
    if (!form.tanggalSelesai) e.tanggalSelesai = 'Tanggal Selesai wajib diisi.';
    if (!form.jamMulai) e.jamMulai = 'Jam Mulai wajib diisi.';
    if (!form.jamSelesai) e.jamSelesai = 'Jam Selesai wajib diisi.';
    if (!form.kontak.trim()) e.kontak = 'Kontak wajib diisi.';
    if (form.tanggalMulai && form.tanggalSelesai && form.tanggalSelesai < form.tanggalMulai) {
      e.tanggalSelesai = 'Tanggal Selesai tidak boleh sebelum Tanggal Mulai.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function persist(): string | undefined {
    if (isEdit && existing) {
      updateDraftEvent(existing.id, form);
      return existing.id;
    }
    const rec = createDraftEvent(ws.id, ws.name, form);
    return rec.id;
  }

  function handleSimpanDraft() {
    persist();
    navigate('/news-event/submission');
  }

  function handleLanjutPreview() {
    if (!validate()) return;
    const savedId = persist();
    if (savedId) navigate(`/news-event/submission/${savedId}/preview`);
  }

  const inputStyle: React.CSSProperties = { width: '100%' };

  return (
    <FeatureGate feature="event_create" featureLabel="Buat Event">
    <div style={{ padding: '16px 16px 100px' }}>
      <SectionCard title="Poster & Jenis Event">
        <FieldGroup>
          <FieldLabel>Poster</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {POSTER_PALETTE.map((e) => (
              <button key={e} type="button" onClick={() => set('poster', e)} style={emojiBtn(form.poster === e)}>{e}</button>
            ))}
          </div>
          {errors.poster && <ErrorText>{errors.poster}</ErrorText>}
        </FieldGroup>
        <FieldGroup last>
          <FieldLabel>Jenis Event</FieldLabel>
          <select value={form.jenisEventId} onChange={(e) => set('jenisEventId', e.target.value)} style={inputStyle} aria-label="Jenis Event">
            <option value="">Pilih Jenis Event</option>
            {JENIS_EVENT_LIST.map((j) => <option key={j.id} value={j.id}>{j.label}</option>)}
          </select>
          {errors.jenisEventId && <ErrorText>{errors.jenisEventId}</ErrorText>}
        </FieldGroup>
      </SectionCard>

      <SectionCard title="Informasi Event">
        <FieldGroup>
          <FieldLabel>Nama Event</FieldLabel>
          <input type="text" value={form.namaEvent} onChange={(e) => set('namaEvent', e.target.value)} style={inputStyle} placeholder="Nama Event" />
          {errors.namaEvent && <ErrorText>{errors.namaEvent}</ErrorText>}
        </FieldGroup>
        <FieldGroup>
          <FieldLabel>Penyelenggara</FieldLabel>
          <input type="text" value={form.penyelenggara} onChange={(e) => set('penyelenggara', e.target.value)} style={inputStyle} placeholder="Nama penyelenggara" />
          {errors.penyelenggara && <ErrorText>{errors.penyelenggara}</ErrorText>}
        </FieldGroup>
        <FieldGroup>
          <FieldLabel>Lokasi</FieldLabel>
          <input type="text" value={form.lokasi} onChange={(e) => set('lokasi', e.target.value)} style={inputStyle} placeholder="Lokasi acara" />
          {errors.lokasi && <ErrorText>{errors.lokasi}</ErrorText>}
        </FieldGroup>
        <FieldGroup>
          <FieldLabel>Google Maps<Opt /></FieldLabel>
          <input type="text" value={form.googleMaps} onChange={(e) => set('googleMaps', e.target.value)} style={inputStyle} placeholder="Link Google Maps" />
        </FieldGroup>
        <div style={{ display: 'flex', gap: 12 }}>
          <FieldGroup>
            <FieldLabel>Tanggal Mulai</FieldLabel>
            <input type="date" value={form.tanggalMulai} onChange={(e) => set('tanggalMulai', e.target.value)} style={inputStyle} />
            {errors.tanggalMulai && <ErrorText>{errors.tanggalMulai}</ErrorText>}
          </FieldGroup>
          <FieldGroup>
            <FieldLabel>Tanggal Selesai</FieldLabel>
            <input type="date" value={form.tanggalSelesai} onChange={(e) => set('tanggalSelesai', e.target.value)} style={inputStyle} />
            {errors.tanggalSelesai && <ErrorText>{errors.tanggalSelesai}</ErrorText>}
          </FieldGroup>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <FieldGroup>
            <FieldLabel>Jam Mulai</FieldLabel>
            <input type="time" value={form.jamMulai} onChange={(e) => set('jamMulai', e.target.value)} style={inputStyle} />
            {errors.jamMulai && <ErrorText>{errors.jamMulai}</ErrorText>}
          </FieldGroup>
          <FieldGroup>
            <FieldLabel>Jam Selesai</FieldLabel>
            <input type="time" value={form.jamSelesai} onChange={(e) => set('jamSelesai', e.target.value)} style={inputStyle} />
            {errors.jamSelesai && <ErrorText>{errors.jamSelesai}</ErrorText>}
          </FieldGroup>
        </div>
        <FieldGroup>
          <FieldLabel>Kontak</FieldLabel>
          <input type="text" value={form.kontak} onChange={(e) => set('kontak', e.target.value)} style={inputStyle} placeholder="No. HP / email kontak" />
          {errors.kontak && <ErrorText>{errors.kontak}</ErrorText>}
        </FieldGroup>
        <FieldGroup>
          <FieldLabel>Link Pendaftaran<Opt /></FieldLabel>
          <input type="text" value={form.linkPendaftaran} onChange={(e) => set('linkPendaftaran', e.target.value)} style={inputStyle} placeholder="https://..." />
        </FieldGroup>
        <div style={{ display: 'flex', gap: 12 }}>
          <FieldGroup>
            <FieldLabel>HTM / Biaya<Opt /></FieldLabel>
            <input type="text" value={form.htm} onChange={(e) => set('htm', e.target.value)} style={inputStyle} placeholder="Gratis / Rp ..." />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel>Kuota<Opt /></FieldLabel>
            <input type="number" min={0} value={form.kuota} onChange={(e) => set('kuota', e.target.value)} style={inputStyle} placeholder="Jumlah peserta" />
          </FieldGroup>
        </div>
        <FieldGroup>
          <FieldLabel>Sponsor<Opt /></FieldLabel>
          <input type="text" value={form.sponsor} onChange={(e) => set('sponsor', e.target.value)} style={inputStyle} placeholder="Nama sponsor" />
        </FieldGroup>
        <FieldGroup last>
          <FieldLabel>Deskripsi Singkat<Opt /></FieldLabel>
          <textarea value={form.deskripsiSingkat} onChange={(e) => set('deskripsiSingkat', e.target.value)} rows={3} style={{ width: '100%', resize: 'vertical' }} placeholder="Deskripsi singkat event" />
        </FieldGroup>
      </SectionCard>

      <SectionCard title="Gallery Dokumentasi">
        <FieldGroup last>
          <FieldLabel>Gallery Dokumentasi<Opt /></FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {POSTER_PALETTE.map((e) => {
              const active = form.galleryDokumentasi.includes(e);
              return (
                <button
                  key={e}
                  type="button"
                  onClick={() => set('galleryDokumentasi', active ? form.galleryDokumentasi.filter((x) => x !== e) : [...form.galleryDokumentasi, e])}
                  style={emojiBtn(active)}
                >
                  {e}
                </button>
              );
            })}
          </div>
        </FieldGroup>
      </SectionCard>

      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, display: 'flex', gap: 10,
        padding: '12px 16px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)',
      }}>
        <button
          type="button"
          onClick={() => navigate('/news-event/submission')}
          style={{ flex: 1, padding: '13px 0', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          ← Kembali
        </button>
        <button
          type="button"
          onClick={handleSimpanDraft}
          style={{ flex: 1, padding: '13px 0', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-primary)', background: 'var(--color-surface)', color: 'var(--color-primary)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          Simpan Draft
        </button>
        <button
          type="button"
          onClick={handleLanjutPreview}
          style={{ flex: 1.3, padding: '13px 0', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          Lanjut ke Preview
        </button>
      </div>
    </div>
    </FeatureGate>
  );
}
