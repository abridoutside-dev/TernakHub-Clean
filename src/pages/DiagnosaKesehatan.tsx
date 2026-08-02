/**
 * DiagnosaKesehatan.tsx  (KH-003)
 * ─────────────────────────────────────────────────────────────────
 * Diagnosa page — second step in the health workflow.
 * Route: /kesehatan-hewan/diagnosa/:id  (id = pemeriksaanId)
 *
 * Workflow: Pemeriksaan → [Diagnosa] → Tindakan → Pengobatan → Kontrol → Selesai
 *
 * Sumber Diagnosa:
 *   1. Dari Master Penyakit (search + filter + pilih dari katalog)
 *   2. Diagnosa Manual (ketik nama + catatan)
 *
 * On save → markSiapDiagnosa(pemeriksaanId) + addDiagnosa() → navigate KH-004
 */

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDebounce } from '../utils/useDebounce';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { updateCheckupDiagnosis } from '../services/healthService';

import { getPemeriksaan, markSiapDiagnosa } from '../data/pemeriksaanKesehatanData';
import { addDiagnosa, type SumberDiagnosa }  from '../data/diagnosaKesehatanData';
import { getAllPenyakit, type PenyakitListItem } from '../data/daftarPenyakitData';
import { JENIS_TERNAK_PENYAKIT }               from '../data/jenisTernakPenyakitData';

// ─── Style constants ──────────────────────────────────────────────────────────

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
  background: 'var(--color-bg)', color: 'var(--color-text)',
  fontSize: 13, fontWeight: 500, outline: 'none', boxSizing: 'border-box',
};

const INPUT_ERR: React.CSSProperties = {
  ...INPUT_STYLE,
  border: '1.5px solid var(--color-danger)',
};

const TEXTAREA_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  minHeight: 80, resize: 'vertical', lineHeight: 1.6,
};

// Severity / contagion badge colours
const KEPARAHAN_COLOR: Record<string, { bg: string; color: string }> = {
  Ringan: { bg: '#e8f5e9', color: '#2e7d32' },
  Sedang: { bg: '#fff3e0', color: '#e65100' },
  Berat:  { bg: '#ffebee', color: '#c62828' },
};
const PENULARAN_COLOR: Record<string, { bg: string; color: string }> = {
  'Tidak Menular':   { bg: '#f5f5f5',  color: '#757575' },
  'Menular Rendah':  { bg: '#e8f5e9',  color: '#2e7d32' },
  'Menular Sedang':  { bg: '#fff3e0',  color: '#e65100' },
  'Sangat Menular':  { bg: '#ffebee',  color: '#c62828' },
};

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{
        fontSize: 12, fontWeight: 700, color: 'var(--color-muted)',
        letterSpacing: 0.8, textTransform: 'uppercase', margin: '0 0 10px',
      }}>
        {title}
      </h2>
      <div style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {children}
      </div>
    </section>
  );
}

function FieldWrap({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '14px 16px 4px' }}>{children}</div>;
}

function FieldLabel({
  children, htmlFor, optional, required,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  optional?: boolean;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{children}</span>
      {optional && <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 400 }}>(opsional)</span>}
      {required && <span style={{ fontSize: 11, color: 'var(--color-danger)', fontWeight: 700 }}>*</span>}
    </label>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--color-border)', margin: '0 16px' }} />;
}

function ErrorHint({ msg }: { msg: string }) {
  return (
    <p style={{ fontSize: 11.5, color: 'var(--color-danger)', fontWeight: 600, margin: '4px 0 8px' }}>
      ⚠ {msg}
    </p>
  );
}

// ─── Pemeriksaan context card ─────────────────────────────────────────────────

function PemeriksaanContextCard({
  pemId, tanggal, petugas, mode, subjectId,
}: {
  pemId: string;
  tanggal: string;
  petugas: string;
  mode: string;
  subjectId: string | null;
}) {
  return (
    <div style={{
      background: 'var(--color-primary-light)',
      border: '1.5px solid var(--color-primary)',
      borderRadius: 'var(--radius-lg)',
      padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>🩺</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>
          Berdasarkan Pemeriksaan
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
          background: 'var(--color-primary)', color: '#fff', marginLeft: 'auto',
        }}>
          {mode === 'individu' ? 'Individu' : 'Batch'}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
        <span style={{ fontSize: 12, color: 'var(--color-text)' }}>
          📅 <strong>{tanggal}</strong>
        </span>
        <span style={{ fontSize: 12, color: 'var(--color-text)' }}>
          👤 <strong>{petugas}</strong>
        </span>
        {subjectId && (
          <span style={{ fontSize: 12, color: 'var(--color-muted)', fontFamily: 'monospace' }}>
            #{subjectId}
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'monospace' }}>
        ID Pemeriksaan: {pemId}
      </div>
    </div>
  );
}

// ─── Disease list card ────────────────────────────────────────────────────────

function PenyakitCard({
  item, selected, onSelect,
}: {
  item: PenyakitListItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const kep = KEPARAHAN_COLOR[item.tingkatKeparahan] ?? KEPARAHAN_COLOR['Sedang'];
  const pen = PENULARAN_COLOR[item.tingkatPenularan] ?? PENULARAN_COLOR['Tidak Menular'];

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        width: '100%', textAlign: 'left', cursor: 'pointer',
        padding: '12px 14px',
        background: selected ? 'var(--color-primary-light)' : 'var(--color-surface)',
        border: selected ? '2px solid var(--color-primary)' : '1.5px solid transparent',
        borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'flex-start', gap: 12,
        transition: 'background 0.1s',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>
            {item.namaPenyakit}
          </span>
          {item.namaIlmiah && (
            <span style={{ fontSize: 11, color: 'var(--color-muted)', fontStyle: 'italic' }}>
              ({item.namaIlmiah})
            </span>
          )}
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--color-muted)', margin: '0 0 6px', lineHeight: 1.5 }}>
          {item.ringkasan}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: kep.bg, color: kep.color }}>
            {item.tingkatKeparahan}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: pen.bg, color: pen.color }}>
            {item.tingkatPenularan}
          </span>
        </div>
      </div>
      {selected && (
        <div style={{
          width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 2,
          background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 13, color: '#fff', lineHeight: 1 }}>✓</span>
        </div>
      )}
    </button>
  );
}

// ─── Unique kategori helper ───────────────────────────────────────────────────

// Stable slug → nama map from BASE_KATEGORI (reproduced here to avoid circular import)
const KATEGORI_NAMA: Record<string, string> = {
  'penyakit-bakteri':          'Penyakit Bakteri',
  'penyakit-virus':            'Penyakit Virus',
  'penyakit-parasit':          'Penyakit Parasit',
  'penyakit-jamur':            'Penyakit Jamur',
  'gangguan-pencernaan':       'Gangguan Pencernaan',
  'gangguan-pernapasan':       'Gangguan Pernapasan',
  'gangguan-reproduksi':       'Gangguan Reproduksi',
  'gangguan-nutrisi-metabolik':'Gangguan Nutrisi & Metabolik',
  'gangguan-kulit':            'Gangguan Kulit',
  'keracunan':                 'Keracunan',
  'cedera-trauma':             'Cedera & Trauma',
  'lainnya':                   'Lainnya',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DiagnosaKesehatan() {
  const { id: pemeriksaanId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();

  const pemeriksaan = pemeriksaanId ? getPemeriksaan(pemeriksaanId) : null;

  // ── Sumber toggle ─────────────────────────────────────────────────────────────
  const [sumber, setSumber] = useState<SumberDiagnosa>('master_penyakit');

  // ── Master Penyakit state ─────────────────────────────────────────────────────
  const [searchQuery,      setSearchQuery]      = useState('');
  const debouncedSearchQuery                   = useDebounce(searchQuery, 300);
  const [filterTernak,     setFilterTernak]     = useState<string>('');
  const [filterKategori,   setFilterKategori]   = useState<string>('');
  const [selectedPenyakit, setSelectedPenyakit] = useState<PenyakitListItem | null>(null);

  // ── Manual state ──────────────────────────────────────────────────────────────
  const [namaDiagnosa, setNamaDiagnosa] = useState('');
  const [catatan,      setCatatan]      = useState('');

  // ── Form state ────────────────────────────────────────────────────────────────
  const [submitted, setSubmitted] = useState(false);
  const [saving,    setSaving]    = useState(false);

  // ── All active penyakit ───────────────────────────────────────────────────────
  const allPenyakit = useMemo(
    () => getAllPenyakit().filter((p) => p.status === 'Aktif'),
    [],
  );

  // ── Filtered by ternak ────────────────────────────────────────────────────────
  const filteredByTernak = useMemo(() => {
    if (!filterTernak) return allPenyakit;
    return allPenyakit.filter((p) => p.jenisTernak.includes(filterTernak));
  }, [allPenyakit, filterTernak]);

  // ── Available kategori (from filtered-by-ternak list) ─────────────────────────
  const availableKategori = useMemo(() => {
    const slugs = [...new Set(filteredByTernak.map((p) => p.kategoriSlug))];
    return slugs.map((slug) => ({ slug, nama: KATEGORI_NAMA[slug] ?? slug }));
  }, [filteredByTernak]);

  // ── Final filtered list ───────────────────────────────────────────────────────
  const filteredPenyakit = useMemo(() => {
    let list = filteredByTernak;
    if (filterKategori) list = list.filter((p) => p.kategoriSlug === filterKategori);
    if (debouncedSearchQuery) {
      const q = debouncedSearchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.namaPenyakit.toLowerCase().includes(q) ||
          (p.namaIlmiah ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [filteredByTernak, filterKategori, debouncedSearchQuery]);

  // ── Handle ternak filter change (reset kategori if no longer available) ────────
  function handleTernakFilter(slug: string) {
    setFilterTernak(slug === filterTernak ? '' : slug);
    setFilterKategori('');
    setSelectedPenyakit(null);
  }

  function handleKategoriFilter(slug: string) {
    setFilterKategori(slug === filterKategori ? '' : slug);
    setSelectedPenyakit(null);
  }

  function handleSumberChange(s: SumberDiagnosa) {
    setSumber(s);
    setSubmitted(false);
  }

  // ── Validation ────────────────────────────────────────────────────────────────
  const errMasterPenyakit = submitted && sumber === 'master_penyakit' && !selectedPenyakit;
  const errNamaDiagnosa   = submitted && sumber === 'manual' && !namaDiagnosa.trim();

  // ── Submit ────────────────────────────────────────────────────────────────────
  function handleSubmit() {
    setSubmitted(true);

    const valid =
      (sumber === 'master_penyakit' && !!selectedPenyakit) ||
      (sumber === 'manual' && !!namaDiagnosa.trim());

    if (!valid) return;

    setSaving(true);
    try {
      // Upgrade pemeriksaan status
      if (pemeriksaanId) markSiapDiagnosa(pemeriksaanId);

      const diagnosaId = addDiagnosa({
        pemeriksaanId: pemeriksaanId ?? '',
        sumber,
        penyakitUuid:  sumber === 'master_penyakit' ? (selectedPenyakit?.uuid ?? null) : null,
        namaPenyakit:  sumber === 'master_penyakit' ? (selectedPenyakit?.namaPenyakit ?? null) : null,
        namaDiagnosa:  sumber === 'manual'          ? namaDiagnosa.trim() : null,
        catatan:       catatan.trim(),
      });

      // ── Supabase write (dual-write, fire-and-forget) ────────────────────────
      // Uses pemeriksaan.supabaseCheckupId (the server-generated UUID backfilled
      // by KH-002 after createCheckup() succeeded) rather than the local in-memory
      // pemeriksaanId, which does NOT match health_checkups.id in the DB.
      // Only fires when the supabaseCheckupId is set (individu mode only).
      if (pemeriksaan?.mode === 'individu' && pemeriksaan.supabaseCheckupId && activeWorkspace?.workspace_uuid) {
        const diagnosisText = sumber === 'master_penyakit'
          ? (selectedPenyakit?.namaPenyakit ?? '')
          : namaDiagnosa.trim();
        updateCheckupDiagnosis({
          checkupId:       pemeriksaan.supabaseCheckupId,
          diagnosis:       diagnosisText,
          recommendations: catatan.trim() || null,
        }).then((result) => {
          if (!result.ok) console.error('[KH-003] Supabase updateCheckupDiagnosis failed:', result.error);
        }).catch((err) => {
          console.error('[KH-003] Supabase updateCheckupDiagnosis error:', err);
        });
      }

      navigate(`/kesehatan-hewan/tindakan/${diagnosaId}`);
    } catch (err) {
      console.error('[KH-003] addDiagnosa failed:', err);
      setSaving(false);
    }
  }

  // ── Guard: pemeriksaan not found ──────────────────────────────────────────────
  if (!pemeriksaan) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Data Pemeriksaan Tidak Ditemukan
        </h2>
        <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
          Pemeriksaan dengan ID ini tidak tersedia. Pastikan Anda mengakses halaman ini melalui proses Pemeriksaan yang benar.
        </p>
        <button
          type="button"
          onClick={() => navigate('/kesehatan-hewan')}
          style={{
            padding: '11px 24px', fontSize: 13, fontWeight: 700,
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
          }}
        >
          Kembali ke Kesehatan Hewan
        </button>
      </div>
    );
  }

  const subjectId = pemeriksaan.mode === 'individu' ? pemeriksaan.livestockId : pemeriksaan.batchId;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '20px 16px 110px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* ── Workflow indicator ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        fontSize: 11, fontWeight: 600, color: 'var(--color-muted)',
        overflowX: 'auto', paddingBottom: 2,
      }}>
        {[
          { label: 'Pemeriksaan', done: true },
          { label: 'Diagnosa',    done: false, active: true },
          { label: 'Tindakan',    done: false },
          { label: 'Selesai',     done: false },
        ].map((step, i) => (
          <span key={step.label} style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
            {i > 0 && (
              <span style={{ margin: '0 4px', color: 'var(--color-border)' }}>›</span>
            )}
            <span style={{
              padding: '3px 10px', borderRadius: 20,
              background: step.active ? 'var(--color-primary)' : step.done ? 'var(--color-primary-light)' : 'transparent',
              color: step.active ? '#fff' : step.done ? 'var(--color-primary)' : 'var(--color-muted)',
              border: step.active ? 'none' : '1.5px solid transparent',
            }}>
              {step.done ? '✓ ' : ''}{step.label}
            </span>
          </span>
        ))}
      </div>

      {/* ── Pemeriksaan context ─────────────────────────────────────────────────── */}
      <PemeriksaanContextCard
        pemId={pemeriksaan.id}
        tanggal={pemeriksaan.tanggal}
        petugas={pemeriksaan.petugas}
        mode={pemeriksaan.mode}
        subjectId={subjectId}
      />

      {/* ── Sumber Diagnosa toggle ──────────────────────────────────────────────── */}
      <section>
        <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', margin: '0 0 10px' }}>
          Sumber Diagnosa
        </h2>
        <div style={{ display: 'flex', background: 'var(--color-bg)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 3, gap: 3 }}>
          {([
            { val: 'master_penyakit' as SumberDiagnosa, icon: '📋', label: 'Dari Master Penyakit' },
            { val: 'manual'          as SumberDiagnosa, icon: '✏️', label: 'Diagnosa Manual' },
          ]).map((opt) => (
            <button
              key={opt.val}
              type="button"
              onClick={() => handleSumberChange(opt.val)}
              style={{
                flex: 1, padding: '9px 6px',
                border: 'none', borderRadius: 'calc(var(--radius-md) - 3px)',
                background: sumber === opt.val ? 'var(--color-primary)' : 'transparent',
                color: sumber === opt.val ? '#fff' : 'var(--color-muted)',
                fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════
          DARI MASTER PENYAKIT
          ══════════════════════════════════════════════════════════════════════════ */}
      {sumber === 'master_penyakit' && (
        <>
          {/* ── Search ─────────────────────────────────────────────────────────── */}
          <SectionCard title="Cari Penyakit">
            <FieldWrap>
              <input
                type="text"
                placeholder="Cari nama penyakit atau nama ilmiah…"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSelectedPenyakit(null); }}
                style={INPUT_STYLE}
              />
            </FieldWrap>

            <Divider />

            {/* ── Filter Jenis Ternak ─────────────────────────────────────────── */}
            <FieldWrap>
              <FieldLabel>Filter Jenis Ternak</FieldLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, paddingBottom: 6 }}>
                {JENIS_TERNAK_PENYAKIT.map((jt) => {
                  const active = filterTernak === jt.slug;
                  return (
                    <button
                      key={jt.slug}
                      type="button"
                      onClick={() => handleTernakFilter(jt.slug)}
                      style={{
                        padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                        borderRadius: 20,
                        background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                        color: active ? '#fff' : 'var(--color-muted)',
                        transition: 'background 0.1s',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      <span>{jt.icon}</span>
                      <span>{jt.nama}</span>
                    </button>
                  );
                })}
              </div>
            </FieldWrap>

            {/* ── Filter Kategori ─────────────────────────────────────────────── */}
            {availableKategori.length > 0 && (
              <>
                <Divider />
                <FieldWrap>
                  <FieldLabel>Filter Kategori</FieldLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, paddingBottom: 6 }}>
                    {availableKategori.map((kat) => {
                      const active = filterKategori === kat.slug;
                      return (
                        <button
                          key={kat.slug}
                          type="button"
                          onClick={() => handleKategoriFilter(kat.slug)}
                          style={{
                            padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                            borderRadius: 20,
                            background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                            color: active ? '#fff' : 'var(--color-muted)',
                            transition: 'background 0.1s',
                          }}
                        >
                          {kat.nama}
                        </button>
                      );
                    })}
                  </div>
                </FieldWrap>
              </>
            )}
          </SectionCard>

          {/* ── Validation error ───────────────────────────────────────────────── */}
          {errMasterPenyakit && <ErrorHint msg="Pilih salah satu penyakit dari daftar." />}

          {/* ── Disease list ───────────────────────────────────────────────────── */}
          <SectionCard title={`Daftar Penyakit (${filteredPenyakit.length})`}>
            {filteredPenyakit.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: 0 }}>
                  Tidak ada penyakit yang cocok. Coba ubah filter atau gunakan Diagnosa Manual.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 10px' }}>
                {filteredPenyakit.map((p) => (
                  <PenyakitCard
                    key={p.uuid}
                    item={p}
                    selected={selectedPenyakit?.uuid === p.uuid}
                    onSelect={() => setSelectedPenyakit(
                      selectedPenyakit?.uuid === p.uuid ? null : p
                    )}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          {/* ── Selected summary ───────────────────────────────────────────────── */}
          {selectedPenyakit && (
            <div style={{
              background: 'var(--color-primary-light)',
              border: '1.5px solid var(--color-primary)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 16px',
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 18, color: '#fff' }}>✓</span>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-primary)', fontWeight: 700 }}>
                  Penyakit Dipilih
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                  {selectedPenyakit.namaPenyakit}
                </p>
                {selectedPenyakit.namaIlmiah && (
                  <p style={{ margin: '1px 0 0', fontSize: 11.5, color: 'var(--color-muted)', fontStyle: 'italic' }}>
                    {selectedPenyakit.namaIlmiah}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Catatan (opsional) ─────────────────────────────────────────────── */}
          <SectionCard title="Catatan">
            <FieldWrap>
              <FieldLabel htmlFor="catatan-master" optional>Catatan Tambahan</FieldLabel>
              <textarea
                id="catatan-master"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Catatan tambahan tentang diagnosa ini…"
                style={{ ...TEXTAREA_STYLE, paddingBottom: 10 }}
              />
            </FieldWrap>
            <div style={{ height: 10 }} />
          </SectionCard>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          DIAGNOSA MANUAL
          ══════════════════════════════════════════════════════════════════════════ */}
      {sumber === 'manual' && (
        <SectionCard title="Diagnosa Manual">
          <div style={{
            padding: '12px 16px 10px',
            background: '#fff8e1',
            borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
            borderBottom: '1px solid var(--color-border)',
          }}>
            <p style={{ fontSize: 12, color: '#e65100', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
              ℹ️ Diagnosa manual hanya tersimpan pada riwayat ternak ini dan tidak mengubah Master Penyakit.
            </p>
          </div>

          <FieldWrap>
            <FieldLabel htmlFor="nama-diagnosa" required>Nama Diagnosa</FieldLabel>
            <input
              id="nama-diagnosa"
              type="text"
              value={namaDiagnosa}
              onChange={(e) => setNamaDiagnosa(e.target.value)}
              placeholder="Contoh: Suspek Pneumonia, Infeksi Luka Kulit…"
              style={errNamaDiagnosa ? INPUT_ERR : INPUT_STYLE}
            />
            {errNamaDiagnosa && <ErrorHint msg="Nama diagnosa wajib diisi." />}
          </FieldWrap>

          <Divider />

          <FieldWrap>
            <FieldLabel htmlFor="catatan-manual" optional>Catatan</FieldLabel>
            <textarea
              id="catatan-manual"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Deskripsi lebih lanjut, temuan klinis, atau keterangan tambahan…"
              style={TEXTAREA_STYLE}
            />
          </FieldWrap>
          <div style={{ height: 10 }} />
        </SectionCard>
      )}

      {/* ── Save button ────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        style={{
          width: '100%', padding: '14px',
          background: saving ? 'var(--color-muted)' : 'var(--color-primary)',
          color: '#fff', border: 'none',
          borderRadius: 'var(--radius-md)',
          fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s',
        }}
      >
        {saving ? 'Menyimpan…' : '✅ Simpan Diagnosa & Lanjut ke Tindakan'}
      </button>

    </div>
  );
}
