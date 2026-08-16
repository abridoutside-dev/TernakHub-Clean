// ─── News & Event — Form News Submission (NEWS-004) ─────────────────────────
// Constitution → FORM NEWS: Judul, Ringkasan, Isi Artikel, Cover, Gallery
// (Opsional), Kategori, Tag, Referensi, Sumber.
//
// GATING: Halaman ini dilindungi oleh hasFeature('news_submit') via
// FeatureGate. Pengguna Free yang mengakses langsung via URL akan melihat
// locked state, BUKAN form. Tidak ada form yang dirender sebelum otorisasi.

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import FeatureGate from '../components/subscription/FeatureGate';
import {
  createDraftNews,
  emptyNewsForm,
  getSubmissionById,
  updateDraftNews,
  type NewsSubmissionForm as NewsForm,
} from '../data/newsEventSubmissionData';
import { KATEGORI_TOPIK_LIST, type NewsEventKategori } from '../data/newsEventData';

const EMOJI_PALETTE = ['📰', '📘', '📢', '🏛️', '🌾', '🩺', '🐄', '🐑', '🐐', '🐔', '🚢', '🛰️', '💻', '📦'];

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

export default function NewsSubmissionForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id && id !== 'baru';
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


  const existing = isEdit ? getSubmissionById(id!) : undefined;
  const [form, setForm] = useState<NewsForm>(existing?.news ?? emptyNewsForm());
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof NewsForm>(key: K, value: NewsForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleKategori(k: NewsEventKategori) {
    setForm((f) => ({
      ...f,
      kategori: f.kategori.includes(k) ? f.kategori.filter((x) => x !== k) : [...f.kategori, k],
    }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.judul.trim()) e.judul = 'Judul wajib diisi.';
    if (!form.ringkasan.trim()) e.ringkasan = 'Ringkasan wajib diisi.';
    if (!form.isi.trim()) e.isi = 'Isi Artikel wajib diisi.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function persist(): string | undefined {
    if (isEdit && existing) {
      updateDraftNews(existing.id, form);
      return existing.id;
    }
    const rec = createDraftNews(ws!.workspace_uuid, ws!.workspace_name, form);
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

  return (
    <FeatureGate feature="news_submit" featureLabel="Ajukan Artikel / Berita">
    <div style={{ padding: '16px 16px 100px' }}>
      <SectionCard title="Form News">
        <FieldGroup>
          <FieldLabel>Judul</FieldLabel>
          <input type="text" value={form.judul} onChange={(e) => set('judul', e.target.value)} placeholder="Judul berita/artikel" />
          {errors.judul && <ErrorText>{errors.judul}</ErrorText>}
        </FieldGroup>
        <FieldGroup>
          <FieldLabel>Ringkasan</FieldLabel>
          <textarea value={form.ringkasan} onChange={(e) => set('ringkasan', e.target.value)} rows={2} placeholder="Ringkasan singkat (1-2 kalimat)" style={{ width: '100%', resize: 'vertical' }} />
          {errors.ringkasan && <ErrorText>{errors.ringkasan}</ErrorText>}
        </FieldGroup>
        <FieldGroup>
          <FieldLabel>Isi Artikel</FieldLabel>
          <textarea value={form.isi} onChange={(e) => set('isi', e.target.value)} rows={6} placeholder="Isi lengkap artikel" style={{ width: '100%', resize: 'vertical' }} />
          {errors.isi && <ErrorText>{errors.isi}</ErrorText>}
        </FieldGroup>
        <FieldGroup>
          <FieldLabel>Cover</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {EMOJI_PALETTE.map((e) => (
              <button key={e} type="button" onClick={() => set('cover', e)} style={emojiBtn(form.cover === e)}>{e}</button>
            ))}
          </div>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel>Gallery<Opt /></FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {EMOJI_PALETTE.map((e) => {
              const active = form.gallery.includes(e);
              return (
                <button
                  key={e}
                  type="button"
                  onClick={() => set('gallery', active ? form.gallery.filter((x) => x !== e) : [...form.gallery, e])}
                  style={emojiBtn(active)}
                >
                  {e}
                </button>
              );
            })}
          </div>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel>Kategori</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {KATEGORI_TOPIK_LIST.map((k) => {
              const active = form.kategori.includes(k);
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggleKategori(k)}
                  style={{
                    padding: '6px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                    border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: active ? 'var(--color-primary-light)' : 'var(--color-surface)',
                    color: active ? 'var(--color-primary)' : 'var(--color-text)', cursor: 'pointer',
                  }}
                >
                  {k}
                </button>
              );
            })}
          </div>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel>Tag</FieldLabel>
          <input
            type="text"
            value={form.tag.join(', ')}
            onChange={(e) => set('tag', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))}
            placeholder="Pisahkan dengan koma, misal: Pakan, Sapi"
          />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel>Referensi<Opt /></FieldLabel>
          <input type="text" value={form.referensi} onChange={(e) => set('referensi', e.target.value)} placeholder="Link atau nama sumber referensi" />
        </FieldGroup>
        <FieldGroup last>
          <FieldLabel>Sumber<Opt /></FieldLabel>
          <input type="text" value={form.sumber} onChange={(e) => set('sumber', e.target.value)} placeholder="Nama penulis/sumber" />
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
