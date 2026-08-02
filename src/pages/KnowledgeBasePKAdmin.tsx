// ─── Knowledge Base Produk Komersial — Kelola Admin (PK-013) ─────────────────
// Halaman CRUD artikel Knowledge Base. Hanya Admin yang dapat menambah,
// mengubah, mengarsipkan, dan menghapus artikel.
// Pengguna umum hanya melihat tampilan kosong + prompt login Admin.

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getAllArticles,
  getArtikelById,
  addArtikel,
  updateArtikel,
  arsipkanArtikel,
  deleteArtikel,
  TOPIK_KB_LIST,
  TOPIK_KB_ICONS,
  SUMBER_INFORMASI_KB_LIST,
  type ArtikelKB,
  type TopikKB,
  type SumberInformasiKB,
  type FaqItem,
  type ReferensiResmi,
} from '../data/knowledgeBasePKData';
import {
  isAdminMode, setAdminMode, getCurrentUser, getAllRiwayat,
} from '../data/produkKomersialLivingDB';
import {
  getActiveList,
} from '../data/masterReferensiPKData';
import {
  KONSENTRAT_SERI_LIST,
} from '../data/konsentratSeriData';
import {
  KONSENTRAT_MEREK_LIST,
} from '../data/konsentratMerekData';

// Kategori Konsentrat UUID — untuk relasi produkId ke seri
const KAT_KONSENTRAT = 'ef284065-b9f3-4f7f-828e-9868206ebf3c';

// ─── Shared UI ────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '9px 11px', fontSize: 13,
  border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
  background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: 'vertical', minHeight: 90, lineHeight: 1.55,
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>{label}</label>
      {hint && <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>{hint}</div>}
      {children}
    </div>
  );
}

function SectionCard({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', marginBottom: 14, overflow: 'hidden',
    }}>
      <div style={{
        padding: '11px 14px', borderBottom: '1px solid var(--color-border)', background: '#f7faf8',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {title}
        </span>
        {right}
      </div>
      <div style={{ padding: '13px 14px' }}>{children}</div>
    </div>
  );
}

function PrimaryButton({ children, onClick, danger, disabled }: { children: React.ReactNode; onClick?: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      style={{
        border: 'none', borderRadius: 'var(--radius-sm)', padding: '9px 14px',
        fontSize: 12, fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
        color: '#fff', opacity: disabled ? 0.55 : 1,
        background: danger ? 'var(--color-danger, #c62828)' : 'var(--color-primary)',
      }}>
      {children}
    </button>
  );
}

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        border: '1.5px solid var(--color-border)', background: 'transparent',
        color: 'var(--color-text)', borderRadius: 'var(--radius-sm)',
        padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
      }}>
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    'Aktif':             { bg: '#e8f5e9', color: '#2e7d32' },
    'Tidak Diproduksi':  { bg: '#fff3e0', color: '#e65100' },
    'Arsip':             { bg: '#eceff1', color: '#546e7a' },
  };
  const s = map[status] ?? { bg: '#eceff1', color: '#546e7a' };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: s.bg, borderRadius: 20, padding: '2px 8px' }}>
      {status}
    </span>
  );
}

// ─── Admin Mode Bar ───────────────────────────────────────────────────────────

function AdminModeBar({ admin, onToggle }: { admin: boolean; onToggle: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      background: admin ? '#e8f5e9' : '#fff8e1', border: `1.5px solid ${admin ? '#2e7d32' : '#f9a825'}`,
      borderRadius: 'var(--radius-md)', marginBottom: 14,
    }}>
      <span style={{ fontSize: 18 }}>{admin ? '🔓' : '🔒'}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: admin ? '#2e7d32' : '#7b5e2a' }}>
          {admin ? `Mode Admin aktif — ${getCurrentUser()}` : 'Mode Pengguna Umum'}
        </div>
        <div style={{ fontSize: 11, color: admin ? '#2e7d32' : '#7b5e2a', opacity: 0.85 }}>
          {admin ? 'Anda dapat menambah, mengubah, dan menghapus artikel.' : 'Aktifkan Mode Admin untuk mengelola Knowledge Base.'}
        </div>
      </div>
      <GhostButton onClick={onToggle}>{admin ? 'Keluar' : 'Masuk Admin'}</GhostButton>
    </div>
  );
}

// ─── Multi-select Checkbox Group ──────────────────────────────────────────────

function CheckboxGroup<T extends string>({
  options,
  selected,
  onChange,
  labelFn,
}: {
  options: T[];
  selected: T[];
  onChange: (v: T[]) => void;
  labelFn?: (v: T) => string;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(opt => {
        const checked = selected.includes(opt);
        return (
          <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={checked}
              onChange={() => {
                if (checked) onChange(selected.filter(v => v !== opt));
                else onChange([...selected, opt]);
              }}
            />
            <span style={{ fontSize: 12, color: 'var(--color-text)' }}>{labelFn ? labelFn(opt) : opt}</span>
          </label>
        );
      })}
    </div>
  );
}

// ─── UUID Ref Multi-select ─────────────────────────────────────────────────────

function UUIDCheckboxGroup({
  options,
  selected,
  onChange,
}: {
  options: { uuid: string; nama: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(opt => {
        const checked = selected.includes(opt.uuid);
        return (
          <label key={opt.uuid} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={checked}
              onChange={() => {
                if (checked) onChange(selected.filter(v => v !== opt.uuid));
                else onChange([...selected, opt.uuid]);
              }}
            />
            <span style={{ fontSize: 12, color: 'var(--color-text)' }}>{opt.nama}</span>
          </label>
        );
      })}
    </div>
  );
}

// ─── FAQ Editor ───────────────────────────────────────────────────────────────

function generateLocalId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function FaqEditor({ faq, onChange }: { faq: FaqItem[]; onChange: (v: FaqItem[]) => void }) {
  return (
    <div>
      {faq.map((item, idx) => (
        <div key={item.id} style={{
          border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
          padding: '10px 12px', marginBottom: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)' }}>FAQ #{idx + 1}</span>
            <button type="button"
              onClick={() => onChange(faq.filter(f => f.id !== item.id))}
              style={{ border: 'none', background: 'none', color: '#c62828', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              Hapus
            </button>
          </div>
          <Field label="Pertanyaan">
            <input value={item.pertanyaan} style={inputStyle}
              onChange={e => onChange(faq.map(f => f.id === item.id ? { ...f, pertanyaan: e.target.value } : f))} />
          </Field>
          <Field label="Jawaban">
            <textarea value={item.jawaban} style={textareaStyle}
              onChange={e => onChange(faq.map(f => f.id === item.id ? { ...f, jawaban: e.target.value } : f))} />
          </Field>
        </div>
      ))}
      <button type="button"
        onClick={() => onChange([...faq, { id: generateLocalId(), pertanyaan: '', jawaban: '' }])}
        style={{
          border: '1.5px dashed var(--color-border)', background: 'transparent',
          color: 'var(--color-primary)', borderRadius: 'var(--radius-sm)',
          padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', width: '100%',
        }}>
        + Tambah Pertanyaan
      </button>
    </div>
  );
}

// ─── Referensi Editor ─────────────────────────────────────────────────────────

function ReferensiEditor({ refs, onChange }: { refs: ReferensiResmi[]; onChange: (v: ReferensiResmi[]) => void }) {
  return (
    <div>
      {refs.map((ref, idx) => (
        <div key={ref.id} style={{
          border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
          padding: '10px 12px', marginBottom: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)' }}>Referensi #{idx + 1}</span>
            <button type="button"
              onClick={() => onChange(refs.filter(r => r.id !== ref.id))}
              style={{ border: 'none', background: 'none', color: '#c62828', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              Hapus
            </button>
          </div>
          <Field label="Judul Referensi">
            <input value={ref.judul} style={inputStyle}
              onChange={e => onChange(refs.map(r => r.id === ref.id ? { ...r, judul: e.target.value } : r))} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Penerbit">
              <input value={ref.penerbit ?? ''} style={inputStyle}
                onChange={e => onChange(refs.map(r => r.id === ref.id ? { ...r, penerbit: e.target.value } : r))} />
            </Field>
            <Field label="Tahun">
              <input value={ref.tahun ?? ''} style={inputStyle} placeholder="2024"
                onChange={e => onChange(refs.map(r => r.id === ref.id ? { ...r, tahun: e.target.value } : r))} />
            </Field>
          </div>
          <Field label="URL (opsional)">
            <input value={ref.url ?? ''} style={inputStyle} placeholder="https://..."
              onChange={e => onChange(refs.map(r => r.id === ref.id ? { ...r, url: e.target.value } : r))} />
          </Field>
        </div>
      ))}
      <button type="button"
        onClick={() => onChange([...refs, { id: generateLocalId(), judul: '' }])}
        style={{
          border: '1.5px dashed var(--color-border)', background: 'transparent',
          color: 'var(--color-primary)', borderRadius: 'var(--radius-sm)',
          padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', width: '100%',
        }}>
        + Tambah Referensi
      </button>
    </div>
  );
}

// ─── Form Blank ───────────────────────────────────────────────────────────────

interface FormState {
  produkId: string; namaProduk: string; namaBrand: string;
  kategoriId: string; namaKategori: string;
  topik: TopikKB; judul: string;
  ringkasan: string; fungsi: string; keunggulan: string; keterbatasan: string;
  targetPenggunaan: string; caraPenggunaan: string; catatanLapangan: string;
  targetTernak: string[]; fasePemeliharaan: string[];
  faq: FaqItem[]; referensiResmi: ReferensiResmi[]; sumberInformasi: SumberInformasiKB[];
}

function blankForm(): FormState {
  return {
    produkId: '', namaProduk: '', namaBrand: '',
    kategoriId: KAT_KONSENTRAT, namaKategori: 'Konsentrat',
    topik: 'Ringkasan Produk', judul: '',
    ringkasan: '', fungsi: '', keunggulan: '', keterbatasan: '',
    targetPenggunaan: '', caraPenggunaan: '', catatanLapangan: '',
    targetTernak: [], fasePemeliharaan: [],
    faq: [], referensiResmi: [], sumberInformasi: [],
  };
}

// ─── Artikel Form ─────────────────────────────────────────────────────────────

function ArtikelForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: ArtikelKB;
  onSave: (data: Omit<ArtikelKB, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => void;
  onCancel: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<FormState>(() =>
    initial
      ? {
          produkId: initial.produkId,
          namaProduk: initial.namaProduk,
          namaBrand: initial.namaBrand,
          kategoriId: initial.kategoriId,
          namaKategori: initial.namaKategori,
          topik: initial.topik,
          judul: initial.judul,
          ringkasan: initial.ringkasan ?? '',
          fungsi: initial.fungsi ?? '',
          keunggulan: initial.keunggulan ?? '',
          keterbatasan: initial.keterbatasan ?? '',
          targetPenggunaan: initial.targetPenggunaan ?? '',
          caraPenggunaan: initial.caraPenggunaan ?? '',
          catatanLapangan: initial.catatanLapangan ?? '',
          targetTernak: [...initial.targetTernak],
          fasePemeliharaan: [...initial.fasePemeliharaan],
          faq: initial.faq.map(f => ({ ...f })),
          referensiResmi: initial.referensiResmi.map(r => ({ ...r })),
          sumberInformasi: [...initial.sumberInformasi],
        }
      : blankForm()
  );
  const [err, setErr] = useState<string | null>(null);

  // Convenience setter
  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  // Produk selector (Konsentrat seri only for now)
  const konsentratOptions = useMemo(() =>
    KONSENTRAT_SERI_LIST.map(s => {
      const merek = KONSENTRAT_MEREK_LIST.find(m => m.uuid === s.brandId);
      return { uuid: s.uuid, namaProduk: s.namaSeri, namaBrand: merek?.nama ?? s.brandSlug };
    }),
  []);

  const targetTernakOptions = getActiveList('TargetTernak');
  const faseOptions = getActiveList('FasePemeliharaan');

  function handleProdukSelect(uuid: string) {
    const opt = konsentratOptions.find(o => o.uuid === uuid);
    if (opt) {
      set('produkId', opt.uuid);
      set('namaProduk', opt.namaProduk);
      set('namaBrand', opt.namaBrand);
      set('kategoriId', KAT_KONSENTRAT);
      set('namaKategori', 'Konsentrat');
    } else {
      set('produkId', '');
    }
  }

  function handleSubmit() {
    setErr(null);
    if (!form.produkId.trim()) { setErr('Pilih produk terlebih dahulu.'); return; }
    if (!form.judul.trim())   { setErr('Judul artikel tidak boleh kosong.'); return; }
    onSave({
      ...form,
      ringkasan:       form.ringkasan.trim()       || undefined,
      fungsi:          form.fungsi.trim()          || undefined,
      keunggulan:      form.keunggulan.trim()      || undefined,
      keterbatasan:    form.keterbatasan.trim()    || undefined,
      targetPenggunaan:form.targetPenggunaan.trim()|| undefined,
      caraPenggunaan:  form.caraPenggunaan.trim()  || undefined,
      catatanLapangan: form.catatanLapangan.trim() || undefined,
      faq: form.faq.filter(f => f.pertanyaan.trim() && f.jawaban.trim()),
      referensiResmi: form.referensiResmi.filter(r => r.judul.trim()),
    } as Omit<ArtikelKB, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>);
  }

  return (
    <div>
      {err && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
          background: '#ffebee', border: '1.5px solid #ef9a9a',
          borderRadius: 'var(--radius-sm)', padding: '10px 12px',
        }}>
          <span>⚠️</span>
          <span style={{ fontSize: 12, color: '#c62828', flex: 1 }}>{err}</span>
          <button type="button" onClick={() => setErr(null)}
            style={{ border: 'none', background: 'none', color: '#c62828', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      )}

      <SectionCard title="Identitas Produk">
        <Field label="Pilih Produk (Konsentrat)" hint="Pilih dari daftar seri konsentrat yang tersedia.">
          <select
            value={form.produkId}
            onChange={e => handleProdukSelect(e.target.value)}
            style={inputStyle}
          >
            <option value="">— Pilih Produk —</option>
            {konsentratOptions.map(opt => (
              <option key={opt.uuid} value={opt.uuid}>
                {opt.namaBrand} · {opt.namaProduk}
              </option>
            ))}
          </select>
        </Field>
        {form.produkId && (
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: -8, marginBottom: 8 }}>
            UUID: {form.produkId}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Topik Artikel">
            <select value={form.topik} onChange={e => set('topik', e.target.value as TopikKB)} style={inputStyle}>
              {TOPIK_KB_LIST.map(t => (
                <option key={t} value={t}>{TOPIK_KB_ICONS[t]} {t}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Judul Artikel">
          <input value={form.judul} onChange={e => set('judul', e.target.value)}
            placeholder="Judul yang deskriptif..."
            style={inputStyle} />
        </Field>
      </SectionCard>

      <SectionCard title="Konten Artikel">
        <Field label="Ringkasan Produk" hint="2–5 kalimat tentang produk ini.">
          <textarea value={form.ringkasan} onChange={e => set('ringkasan', e.target.value)}
            placeholder="Apa ini? Untuk apa? Dibuat oleh siapa?" style={textareaStyle} />
        </Field>
        <Field label="Fungsi" hint="Mekanisme kerja, kandungan utama, cara kerja.">
          <textarea value={form.fungsi} onChange={e => set('fungsi', e.target.value)}
            placeholder="Fungsi dan mekanisme kerja produk ini..." style={textareaStyle} />
        </Field>
        <Field label="Keunggulan" hint="Kelebihan dibanding produk sejenis atau pendekatan manual.">
          <textarea value={form.keunggulan} onChange={e => set('keunggulan', e.target.value)}
            placeholder="• Keunggulan 1&#10;• Keunggulan 2" style={textareaStyle} />
        </Field>
        <Field label="Keterbatasan" hint="Batasan, kontraindikasi, hal yang perlu diperhatikan.">
          <textarea value={form.keterbatasan} onChange={e => set('keterbatasan', e.target.value)}
            placeholder="• Keterbatasan 1&#10;• Keterbatasan 2" style={textareaStyle} />
        </Field>
        <Field label="Target Penggunaan" hint="Kondisi optimal — kapan produk ini paling efektif.">
          <textarea value={form.targetPenggunaan} onChange={e => set('targetPenggunaan', e.target.value)}
            placeholder="Paling efektif digunakan saat..." style={textareaStyle} />
        </Field>
        <Field label="Cara Penggunaan" hint="Dosis, frekuensi, metode pencampuran, transisi pakan.">
          <textarea value={form.caraPenggunaan} onChange={e => set('caraPenggunaan', e.target.value)}
            placeholder="**Dosis Harian:**&#10;• Fase X: ...&#10;&#10;**Waktu Pemberian:**&#10;..." style={{ ...textareaStyle, minHeight: 120 }} />
        </Field>
        <Field label="Catatan Lapangan" hint="Pengalaman nyata dari farm — observasi, tips, peringatan.">
          <textarea value={form.catatanLapangan} onChange={e => set('catatanLapangan', e.target.value)}
            placeholder="Observasi dari penggunaan lapangan..." style={{ ...textareaStyle, minHeight: 120 }} />
        </Field>
      </SectionCard>

      <SectionCard title="Target Ternak & Fase">
        <Field label="Target Ternak" hint="Pilih satu atau lebih jenis ternak yang relevan.">
          <UUIDCheckboxGroup
            options={targetTernakOptions}
            selected={form.targetTernak}
            onChange={v => set('targetTernak', v)}
          />
        </Field>
        <Field label="Fase Pemeliharaan" hint="Pilih fase yang relevan untuk produk ini.">
          <UUIDCheckboxGroup
            options={faseOptions}
            selected={form.fasePemeliharaan}
            onChange={v => set('fasePemeliharaan', v)}
          />
        </Field>
      </SectionCard>

      <SectionCard title="FAQ">
        <FaqEditor faq={form.faq} onChange={v => set('faq', v)} />
      </SectionCard>

      <SectionCard title="Referensi Resmi">
        <ReferensiEditor refs={form.referensiResmi} onChange={v => set('referensiResmi', v)} />
      </SectionCard>

      <SectionCard title="Sumber Informasi">
        <Field label="Pilih sumber yang menjadi dasar artikel ini.">
          <CheckboxGroup<SumberInformasiKB>
            options={SUMBER_INFORMASI_KB_LIST}
            selected={form.sumberInformasi}
            onChange={v => set('sumberInformasi', v)}
          />
        </Field>
      </SectionCard>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingBottom: 8 }}>
        <GhostButton onClick={onCancel}>Batal</GhostButton>
        <PrimaryButton onClick={handleSubmit}>
          {isEdit ? '💾 Simpan Perubahan' : '➕ Tambah Artikel'}
        </PrimaryButton>
      </div>
    </div>
  );
}

// ─── Artikel List Row ─────────────────────────────────────────────────────────

function ArtikelRow({
  artikel,
  onEdit,
  onArsip,
  onDelete,
  onDetail,
}: {
  artikel: ArtikelKB;
  onEdit: () => void;
  onArsip: () => void;
  onDelete: () => void;
  onDetail: () => void;
}) {
  const [confirm, setConfirm] = useState<'arsip' | 'delete' | null>(null);
  return (
    <>
      <div style={{
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)', padding: '12px 13px', marginBottom: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{TOPIK_KB_ICONS[artikel.topik]}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 3, lineHeight: 1.35 }}>
              {artikel.judul}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 5 }}>
              {artikel.namaBrand} · {artikel.namaProduk} · {artikel.topik}
            </div>
            <StatusBadge status={artikel.status} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <button type="button" onClick={onDetail}
            style={{ border: '1.5px solid var(--color-border)', background: 'transparent', color: 'var(--color-primary)', borderRadius: 'var(--radius-sm)', padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            👁 Baca
          </button>
          <button type="button" onClick={onEdit}
            style={{ border: '1.5px solid var(--color-primary)', background: 'transparent', color: 'var(--color-primary)', borderRadius: 'var(--radius-sm)', padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            ✏️ Edit
          </button>
          {artikel.status !== 'Arsip' && (
            <button type="button" onClick={() => setConfirm('arsip')}
              style={{ border: '1.5px solid #546e7a', background: 'transparent', color: '#546e7a', borderRadius: 'var(--radius-sm)', padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              📦 Arsip
            </button>
          )}
          <button type="button" onClick={() => setConfirm('delete')}
            style={{ border: '1.5px solid #c62828', background: 'transparent', color: '#c62828', borderRadius: 'var(--radius-sm)', padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            🗑️ Hapus
          </button>
        </div>
      </div>

      {/* Confirm Modal */}
      {confirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 1000 }}
          onClick={() => setConfirm(null)}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: 22, maxWidth: 300, width: '100%' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
              {confirm === 'arsip' ? 'Arsipkan Artikel?' : 'Hapus Artikel Permanen?'}
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: '0 0 16px', lineHeight: 1.55 }}>
              {confirm === 'arsip'
                ? 'Artikel disembunyikan dari pengguna. Dapat dipulihkan.'
                : 'Artikel dihapus permanen dan tidak dapat dikembalikan.'}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <GhostButton onClick={() => setConfirm(null)}>Batal</GhostButton>
              <PrimaryButton danger onClick={() => { setConfirm(null); confirm === 'arsip' ? onArsip() : onDelete(); }}>
                {confirm === 'arsip' ? 'Arsipkan' : 'Hapus'}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function KnowledgeBasePKAdmin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [admin, setAdmin] = useState(isAdminMode());
  const [, setTick] = useState(0);
  const [mode, setMode] = useState<'list' | 'tambah' | 'edit'>('list');
  const [editArtikel, setEditArtikel] = useState<ArtikelKB | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle ?edit=<id> from detail page
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && admin) {
      const a = getArtikelById(editId);
      if (a) { setEditArtikel(a); setMode('edit'); }
    }
  }, [searchParams, admin]);

  function toggleAdmin() {
    setAdminMode(!admin);
    setAdmin(!admin);
  }

  const articles = getAllArticles();

  function handleSave(data: Omit<ArtikelKB, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) {
    try {
      if (mode === 'edit' && editArtikel) {
        updateArtikel(editArtikel.id, data);
        setSuccess(`Artikel "${data.judul}" berhasil diperbarui.`);
      } else {
        addArtikel(data);
        setSuccess(`Artikel "${data.judul}" berhasil ditambahkan.`);
      }
      setMode('list');
      setEditArtikel(null);
      setTick(t => t + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan.');
    }
  }


  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '14px 16px 0' }}>

        <AdminModeBar admin={admin} onToggle={toggleAdmin} />

        {/* Feedback */}
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, background: '#e8f5e9', border: '1.5px solid #a5d6a7', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
            <span>✅</span>
            <span style={{ fontSize: 12, color: '#2e7d32', flex: 1 }}>{success}</span>
            <button type="button" onClick={() => setSuccess(null)} style={{ border: 'none', background: 'none', color: '#2e7d32', cursor: 'pointer', fontWeight: 700 }}>✕</button>
          </div>
        )}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, background: '#ffebee', border: '1.5px solid #ef9a9a', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
            <span>⚠️</span>
            <span style={{ fontSize: 12, color: '#c62828', flex: 1 }}>{error}</span>
            <button type="button" onClick={() => setError(null)} style={{ border: 'none', background: 'none', color: '#c62828', cursor: 'pointer', fontWeight: 700 }}>✕</button>
          </div>
        )}

        {!admin && mode === 'list' && (
          <div style={{
            background: '#fff8e1', border: '1.5px solid #f9a825',
            borderRadius: 'var(--radius-md)', padding: '18px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔒</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#7b5e2a', marginBottom: 6 }}>
              Mode Admin Diperlukan
            </div>
            <p style={{ fontSize: 13, color: '#7b5e2a', margin: '0 0 14px', lineHeight: 1.55 }}>
              Aktifkan Mode Admin di atas untuk mengelola artikel Knowledge Base.
            </p>
            <button type="button"
              onClick={() => navigate('/stok-pakan/komersial/knowledge-base')}
              style={{ border: '1.5px solid #f9a825', background: 'transparent', color: '#7b5e2a', borderRadius: 'var(--radius-sm)', padding: '9px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              ← Kembali ke Knowledge Base
            </button>
          </div>
        )}

        {/* Form: Tambah / Edit */}
        {admin && (mode === 'tambah' || mode === 'edit') && (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>
              {mode === 'edit' ? '✏️ Edit Artikel' : '➕ Tambah Artikel Baru'}
            </div>
            <ArtikelForm
              initial={mode === 'edit' ? editArtikel ?? undefined : undefined}
              onSave={handleSave}
              onCancel={() => { setMode('list'); setEditArtikel(null); }}
            />
          </>
        )}

        {/* List */}
        {admin && mode === 'list' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                {articles.length} artikel total
              </div>
              <PrimaryButton onClick={() => setMode('tambah')}>
                ➕ Tambah Artikel
              </PrimaryButton>
            </div>

            {articles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-muted)', fontSize: 13 }}>
                Belum ada artikel. Klik "Tambah Artikel" untuk memulai.
              </div>
            ) : (
              articles.map(a => (
                <ArtikelRow
                  key={a.id}
                  artikel={a}
                  onDetail={() => navigate(`/stok-pakan/komersial/knowledge-base/${a.id}`)}
                  onEdit={() => { setEditArtikel(a); setMode('edit'); }}
                  onArsip={() => {
                    try {
                      arsipkanArtikel(a.id);
                      setTick(t => t + 1);
                      setSuccess(`Artikel "${a.judul}" diarsipkan.`);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Terjadi kesalahan.');
                    }
                  }}
                  onDelete={() => {
                    try {
                      deleteArtikel(a.id);
                      setTick(t => t + 1);
                      setSuccess(`Artikel "${a.judul}" dihapus.`);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Terjadi kesalahan.');
                    }
                  }}
                />
              ))
            )}

            {/* Riwayat */}
            <SectionCard title="Riwayat Perubahan KB">
              {(() => {
                const riwayat = getAllRiwayat('Dokumen Pendukung').slice(0, 15);
                if (riwayat.length === 0) return <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: 0 }}>Belum ada riwayat.</p>;
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {riwayat.map(r => (
                      <div key={r.id} style={{ borderLeft: '3px solid var(--color-primary)', paddingLeft: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>
                          {r.jenisPerubahan} — {r.entityLabel}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                          {new Date(r.waktu).toLocaleString('id-ID')} · {r.pengguna}
                        </div>
                        {r.catatan && <div style={{ fontSize: 11, color: 'var(--color-muted)', fontStyle: 'italic' }}>{r.catatan}</div>}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </SectionCard>
          </>
        )}
      </div>
    </div>
  );
}
