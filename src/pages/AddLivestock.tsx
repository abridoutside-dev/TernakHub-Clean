import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MASTER_SPECIES, RAS_OPTIONS } from '../data/speciesData';
import { LIVESTOCK_DB } from '../data/livestockData';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import { createLivestock as createLivestockService, createBatch as createBatchService } from '../services/livestockService';
import { useLivestock } from '../hooks/useLivestock';
import { type BatchStatus } from '../data/batchData';
import { PROGRAM_OPTIONS } from '../data/programData';

// ── In-session ID counters ────────────────────────────────────────────────────
type CounterMap = Record<string, number>;
function padNumber(n: number) { return String(n).padStart(6, '0'); }
function buildId(jCode: string, kCode: string, c: CounterMap, farm: string) {
  if (!kCode) return `${jCode}-?-??????-${farm}`;
  const key = `${jCode}-${kCode}`;
  return `${jCode}-${kCode}-${padNumber(c[key] ?? 1)}-${farm}`;
}

// ── Data ──────────────────────────────────────────────────────────────────────
// Jenis Ternak now reads from the Master Species registry (src/data/speciesData.ts) —
// adding a species there makes it appear here automatically, no code change needed.
const JENIS_TERNAK = MASTER_SPECIES;

const FREE_TEXT_BREEDS = new Set(['Kerbau', 'Kuda', 'Babi']);
const RAS_WITH_LINEAGE = new Set(['Dorper', 'Texel', 'Merino', 'Suffolk', 'Boer', 'Saanen', 'Limousin', 'Simental', 'Angus', 'Brahman', 'Belgian Blue']);
const TIPE_KETURUNAN   = ['Fullblood (FB)', 'Purebred (PB)', 'Cross', 'F1', 'F2', 'F3', 'F4', 'Lainnya'];
const STATUS_KESEHATAN = ['Sehat', 'Sakit', 'Dalam Perawatan', 'Karantina', 'Pemantauan'];
const ASAL_TERNAK      = ['Dibeli', 'Lahir di Peternakan', 'Lainnya'];
const HORN_OPTIONS     = ['Tidak Bertanduk', 'Bertanduk Kecil', 'Bertanduk Sedang', 'Bertanduk Besar', 'Lainnya'];
const TAIL_OPTIONS     = ['Ekor Tipis', 'Ekor Gemuk', 'Ekor Panjang', 'Ekor Pendek', 'Lainnya'];
const KELAMIN_CODE: Record<string, string> = { jantan: 'J', betina: 'B' };

// Parent picker reads live from LIVESTOCK_DB so any registered animal appears immediately.
// (The former static PLACEHOLDER_TERNAK constant has been removed — it was always empty.)

// ── Species visual map (mirrors dev factory — no dev import needed) ────────────
const SPECIES_VISUALS: Record<string, { color: string; bg: string }> = {
  Domba:   { color: '#1b7a43', bg: '#e8f5ee' },
  Kambing: { color: '#b5651d', bg: '#fbeee0' },
  Sapi:    { color: '#7a1b3a', bg: '#f5e8ee' },
  Kerbau:  { color: '#3a3a3a', bg: '#eceff1' },
  Kuda:    { color: '#8a5a2b', bg: '#f6ede1' },
  Babi:    { color: '#c2185b', bg: '#fde4ec' },
};
const FALLBACK_VISUAL = { color: '#546e7a', bg: '#eceff1' };

// ── Date / age helpers ────────────────────────────────────────────────────────
function todayLabel(): string {
  const d = new Date();
  const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatIndonesianDate(isoDate: string): string {
  if (!isoDate) return '\u2014';
  const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return '\u2014';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function computeAgeFromDate(isoDate: string): { age: string; ageMonths: number } {
  if (!isoDate) return { age: '\u2014', ageMonths: 0 };
  const birth = new Date(isoDate);
  if (isNaN(birth.getTime())) return { age: '\u2014', ageMonths: 0 };
  const now = new Date();
  const months = Math.max(0, (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth()));
  if (months >= 12) {
    const years = Math.floor(months / 12);
    const rem   = months % 12;
    return { age: rem > 0 ? `${years} tahun ${rem} bulan` : `${years} tahun`, ageMonths: months };
  }
  return { age: months === 0 ? '< 1 bulan' : `${months} bulan`, ageMonths: months };
}

/** Scan LIVESTOCK_DB for the highest counter already used for this species+gender+farm. */
function findMaxCounter(jCode: string, kCode: string, farm: string): number {
  const pattern = new RegExp(String.raw`^${jCode}-${kCode}-(\d+)-${farm}$`);
  let max = 0;
  for (const id of Object.keys(LIVESTOCK_DB)) {
    const m = id.match(pattern);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max;
}

// ── Shared primitives ─────────────────────────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      marginBottom: 14,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 16px 11px',
        borderBottom: '1px solid var(--color-border)',
        background: '#f7faf8',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '16px 16px 4px' }}>{children}</div>
    </div>
  );
}

function FieldGroup({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return <div style={{ marginBottom: last ? 12 : 18 }}>{children}</div>;
}

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>
      {children}
    </label>
  );
}

function Opt() {
  return <span style={{ fontWeight: 400, color: 'var(--color-muted)', fontSize: 12 }}> (Opsional)</span>;
}

function HelperText({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.5 }}>{children}</p>;
}

// ── Segmented Control ─────────────────────────────────────────────────────────
type Mode = 'individu' | 'batch';

function SegmentedControl({ value, onChange }: { value: Mode; onChange: (v: Mode) => void }) {
  const options: { value: Mode; label: string }[] = [
    { value: 'individu', label: 'Individu' },
    { value: 'batch',    label: 'Kelompok / Batch' },
  ];
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 12, fontWeight: 700, color: 'var(--color-muted)',
        letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
      }}>
        Mode Pencatatan
      </div>
      <div style={{
        display: 'flex',
        background: 'var(--color-border)',
        borderRadius: 10,
        padding: 3,
        gap: 3,
      }}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              style={{
                flex: 1,
                padding: '10px 8px',
                borderRadius: 8,
                border: 'none',
                background: active ? 'var(--color-surface)' : 'transparent',
                color: active ? 'var(--color-primary)' : 'var(--color-muted)',
                fontWeight: active ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'background 0.18s, color 0.18s',
                boxShadow: active ? 'var(--shadow-sm)' : 'none',
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

// ── Parent Picker ─────────────────────────────────────────────────────────────
function ParentPicker({ label, id, kelaminHint, value, onChange }: {
  label: string; id: string; kelaminHint?: string;
  value: string; onChange: (v: string) => void;
}) {
  const [open,     setOpen]    = useState(false);
  const [query,    setQuery]   = useState('');
  const setValue = onChange;

  // Build picker list live from LIVESTOCK_DB so newly registered animals appear immediately.
  const allLivestock = Object.values(LIVESTOCK_DB).map((lv) => ({
    id: lv.id,
    name: lv.name,
    icon: lv.typeIcon,
    jenis: lv.type,
    ras: lv.ras,
    kelamin: lv.kelamin,
  }));
  const filtered = allLivestock.filter((t) => {
    const q = query.toLowerCase();
    const matchK = !kelaminHint || t.kelamin === kelaminHint;
    const matchQ = !q || t.id.toLowerCase().includes(q) || (t.name ?? '').toLowerCase().includes(q);
    return matchK && matchQ;
  });

  function pick(tid: string) {
    setValue(tid);
    setOpen(false);
    setQuery('');
  }

  return (
    <div>
      {/* Text input (Method 1: type/search) */}
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type="text"
          value={value}
          placeholder="Ketik ID atau nama ternak..."
          style={{ fontFamily: 'monospace', paddingRight: 40 }}
          onChange={(e) => setValue(e.target.value)}
        />
        {value && (
          <button
            type="button"
            onClick={() => setValue('')}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', fontSize: 14, color: 'var(--color-muted)',
              cursor: 'pointer', padding: 0, lineHeight: 1,
            }}
          >
            {'\u2715'}
          </button>
        )}
      </div>

      {/* Method 2: Livestock Picker toggle */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          marginTop: 8,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1.5px solid var(--color-border)',
          background: open ? 'var(--color-primary-light)' : 'var(--color-surface)',
          color: open ? 'var(--color-primary)' : 'var(--color-muted)',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        <span>{'\uD83D\uDC3E'}</span>
        <span>{open ? 'Tutup Daftar Ternak' : 'Pilih dari Daftar Ternak'}</span>
      </button>

      {/* Inline picker panel */}
      {open && (
        <div style={{
          marginTop: 8,
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}>
          {/* Search inside picker */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border)', background: '#f7faf8' }}>
            <input
              type="search"
              placeholder="Cari ID atau nama..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ fontSize: 12, height: 34 }}
            />
          </div>

          {/* Livestock cards */}
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', fontSize: 13, color: 'var(--color-muted)' }}>
                Tidak ada ternak ditemukan.
              </div>
            ) : (
              filtered.map((t) => {
                const selected = value === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => pick(t.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      padding: '10px 12px',
                      background: selected ? 'var(--color-primary-light)' : 'var(--color-surface)',
                      border: 'none',
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'background 0.1s',
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: selected ? 'var(--color-primary)' : '#f0f4f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, flexShrink: 0,
                    }}>
                      {t.icon}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: selected ? 'var(--color-primary)' : 'var(--color-text)' }}>
                        {t.name ?? <span style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--color-muted)' }}>Tanpa Nama</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'monospace', marginTop: 1 }}>
                        {t.id}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>
                        {t.jenis} {'\u00B7'} {t.ras} {'\u00B7'} {t.kelamin}
                      </div>
                    </div>
                    {selected && (
                      <span style={{ fontSize: 16, color: 'var(--color-primary)', flexShrink: 0 }}>{'\u2713'}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      <HelperText>Kosongkan jika tidak diketahui atau tidak ingin dicatat.</HelperText>
    </div>
  );
}

// ── Section 3 sub-panels ──────────────────────────────────────────────────────
function AsalDibeli({
  supplier, onSupplierChange,
  originFarm, onOriginFarmChange,
  purchaseDate, onPurchaseDateChange,
  purchasePrice, onPurchasePriceChange,
}: {
  supplier: string; onSupplierChange: (v: string) => void;
  originFarm: string; onOriginFarmChange: (v: string) => void;
  purchaseDate: string; onPurchaseDateChange: (v: string) => void;
  purchasePrice: string; onPurchasePriceChange: (v: string) => void;
}) {
  return (
    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <FieldLabel htmlFor="nama-penjual">Nama Penjual<Opt /></FieldLabel>
        <input id="nama-penjual" type="text" placeholder="Contoh: Pak Ahmad"
          value={supplier} onChange={(e) => onSupplierChange(e.target.value)} />
      </div>
      <div>
        <FieldLabel htmlFor="asal-daerah">Asal Daerah / Peternakan<Opt /></FieldLabel>
        <input id="asal-daerah" type="text" placeholder="Contoh: Garut, Jawa Barat"
          value={originFarm} onChange={(e) => onOriginFarmChange(e.target.value)} />
        <HelperText>Asal biologis atau asal peternakan ternak ini.</HelperText>
      </div>
      <div>
        <FieldLabel htmlFor="tgl-beli">Tanggal Pembelian<Opt /></FieldLabel>
        <input id="tgl-beli" type="date"
          value={purchaseDate} onChange={(e) => onPurchaseDateChange(e.target.value)} />
      </div>
      <div>
        <FieldLabel htmlFor="harga-beli">Harga Beli (Rp)<Opt /></FieldLabel>
        <input id="harga-beli" type="number" min="0" step="1000" placeholder="Contoh: 3500000"
          value={purchasePrice} onChange={(e) => onPurchasePriceChange(e.target.value)} />
      </div>
    </div>
  );
}

function AsalLahir({
  damId, onDamChange,
  sireId, onSireChange,
  siblingCount, onSiblingCountChange,
}: {
  damId: string; onDamChange: (v: string) => void;
  sireId: string; onSireChange: (v: string) => void;
  siblingCount: string; onSiblingCountChange: (v: string) => void;
}) {
  return (
    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <FieldLabel htmlFor="id-induk">ID Induk (Ibu)<Opt /></FieldLabel>
        <ParentPicker label="ID Induk" id="id-induk" kelaminHint="Betina"
          value={damId} onChange={onDamChange} />
      </div>
      <div>
        <FieldLabel htmlFor="id-pejantan">ID Pejantan (Ayah)<Opt /></FieldLabel>
        <ParentPicker label="ID Pejantan" id="id-pejantan" kelaminHint="Jantan"
          value={sireId} onChange={onSireChange} />
      </div>
      <div>
        <FieldLabel htmlFor="jml-saudara">Jumlah Saudara Lahir<Opt /></FieldLabel>
        <input id="jml-saudara" type="number" min="0" step="1" placeholder="Contoh: 2"
          value={siblingCount} onChange={(e) => onSiblingCountChange(e.target.value)} />
        <HelperText>Jumlah anak yang lahir bersamaan dalam satu kelahiran.</HelperText>
      </div>
    </div>
  );
}

function AsalLainnya() {
  return (
    <div style={{ marginTop: 14 }}>
      <FieldLabel htmlFor="keterangan-asal">Keterangan</FieldLabel>
      <textarea id="keterangan-asal" placeholder="Jelaskan asal-usul ternak ini..." rows={3} />
    </div>
  );
}

// ── Section 4 – Foto ──────────────────────────────────────────────────────────
function FotoSection() {
  return (
    <div style={{
      borderRadius: 'var(--radius-md)',
      background: '#f0f4f0', border: '1.5px dashed var(--color-border)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 8, padding: '24px 16px', textAlign: 'center',
      color: 'var(--color-muted)',
    }}>
      <span style={{ fontSize: 32 }}>🖼️</span>
      <span style={{ fontSize: 12, fontWeight: 600 }}>Foto dapat ditambahkan di halaman profil ternak setelah data berhasil disimpan.</span>
    </div>
  );
}

// ── Batch Form ────────────────────────────────────────────────────────────────
function BatchForm({ onCancel }: { onCancel: () => void }) {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const { currentUser }     = useAuth();

  const [jenis,      setJenis]      = useState('Domba');
  const [ras,        setRas]        = useState('');
  const [rasLainnya, setRasLainnya] = useState('');
  const [tipe,       setTipe]       = useState('');
  const [silangan,   setSilangan]   = useState('');

  const [bNama,      setBNama]      = useState('');
  const [bLokasi,    setBLokasi]    = useState('');
  const [bCatatan,   setBCatatan]   = useState('');
  const [bSubmitted, setBSubmitted] = useState(false);
  const [bSaving,    setBSaving]    = useState(false);
  const [bSaveError, setBSaveError] = useState<string | null>(null);

  const isFreeText = FREE_TEXT_BREEDS.has(jenis);
  const rasOptions = RAS_OPTIONS[jenis] ?? [];
  const showTipe   = !isFreeText && RAS_WITH_LINEAGE.has(ras);

  function handleJenisChange(next: string) {
    setJenis(next);
    setRas(''); setRasLainnya(''); setTipe(''); setSilangan('');
  }
  function handleRasChange(next: string) {
    setRas(next);
    setRasLainnya(''); setTipe(''); setSilangan('');
  }

  async function handleBatchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBSubmitted(true);
    if (!bNama.trim()) return;
    if (!activeWorkspace) {
      setBSaveError('Workspace tidak tersedia. Pilih workspace terlebih dahulu.');
      return;
    }

    setBSaving(true);
    setBSaveError(null);
    try {
      const result = await createBatchService(
        activeWorkspace.workspace_uuid,
        currentUser?.id ?? '',
        {
          label:            bNama.trim(),
          species:          jenis || null,
          start_date:       null,
          target_weight_kg: null,
          notes:            bCatatan.trim() || null,
        },
      );
      if (!result.ok) throw new Error(result.error);
      // Navigate to the batch list; BatchProfile will load the new batch via useLivestock.
      navigate('/batch', { replace: true });
    } catch (err) {
      setBSaveError(err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.');
      setBSaving(false);
    }
  }

  return (
    <form onSubmit={handleBatchSubmit} noValidate>

      {/* ══ Identitas Batch ═══════════════════════════════════════════════ */}
      <SectionCard title="Identitas Batch">
        {/* ID Batch */}
        <FieldGroup>
          <FieldLabel htmlFor="b-id-batch">ID Batch</FieldLabel>
          <input
            id="b-id-batch"
            type="text"
            value="B-000001-KAY"
            readOnly
            style={{ fontFamily: 'monospace', background: '#f5f5f5', color: 'var(--color-muted)' }}
          />
          <HelperText>ID Batch dibuat otomatis saat data disimpan.</HelperText>
        </FieldGroup>

        {/* Nama Batch */}
        <FieldGroup>
          <FieldLabel htmlFor="b-nama-batch">Nama Batch</FieldLabel>
          <input
            id="b-nama-batch" type="text" placeholder="Contoh: Penggemukan Juli 2026"
            value={bNama} onChange={(e) => setBNama(e.target.value)}
            style={bSubmitted && !bNama.trim() ? { borderColor: '#e53935' } : {}}
          />
          {bSubmitted && !bNama.trim() && (
            <p style={{ margin: '5px 0 0', fontSize: 11, color: '#e53935' }}>
              Nama batch wajib diisi.
            </p>
          )}
        </FieldGroup>

        <FieldGroup last>
          <FieldLabel>Jenis Ternak</FieldLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {JENIS_TERNAK.map((j) => {
              const active = jenis === j.value;
              return (
                <button
                  key={j.value}
                  type="button"
                  onClick={() => handleJenisChange(j.value)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '11px 6px',
                    borderRadius: 'var(--radius-md)',
                    border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                    background: active ? 'var(--color-primary-light)' : 'var(--color-surface)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 24, lineHeight: 1 }}>{j.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? 'var(--color-primary)' : 'var(--color-muted)' }}>
                    {j.label}
                  </span>
                </button>
              );
            })}
          </div>
        </FieldGroup>
      </SectionCard>

      {/* ══ Informasi Batch ═══════════════════════════════════════════════ */}
      <SectionCard title="Informasi Batch">

        {/* Ras */}
        <FieldGroup>
          <FieldLabel htmlFor="b-ras">Ras</FieldLabel>
          {isFreeText ? (
            <input
              id="b-ras" type="text" placeholder="Masukkan Nama Ras"
              value={rasLainnya} onChange={(e) => setRasLainnya(e.target.value)}
            />
          ) : (
            <>
              <select id="b-ras" value={ras} onChange={(e) => handleRasChange(e.target.value)}>
                <option value="">{'\u2014'} Pilih Ras {'\u2014'}</option>
                {rasOptions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {ras === 'Lainnya' && (
                <input
                  style={{ marginTop: 10 }} type="text" placeholder="Masukkan Nama Ras"
                  value={rasLainnya} onChange={(e) => setRasLainnya(e.target.value)}
                />
              )}
            </>
          )}
        </FieldGroup>

        {/* Tipe / Keturunan */}
        {showTipe && (
          <FieldGroup>
            <FieldLabel htmlFor="b-tipe">Tipe / Keturunan</FieldLabel>
            <select
              id="b-tipe" value={tipe}
              onChange={(e) => { setTipe(e.target.value); setSilangan(''); }}
            >
              <option value="">{'\u2014'} Pilih Tipe {'\u2014'}</option>
              {TIPE_KETURUNAN.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {tipe === 'Cross' && (
              <div style={{ marginTop: 14 }}>
                <FieldLabel htmlFor="b-silangan">Silangan Dengan</FieldLabel>
                <select id="b-silangan" value={silangan} onChange={(e) => setSilangan(e.target.value)}>
                  <option value="">{'\u2014'} Pilih Ras {'\u2014'}</option>
                  {rasOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}
          </FieldGroup>
        )}

        {/* Jumlah Ternak */}
        <FieldGroup>
          <FieldLabel htmlFor="b-jumlah">Jumlah Ternak</FieldLabel>
          <input id="b-jumlah" type="number" min="1" step="1" placeholder="Contoh: 20" />
        </FieldGroup>

        {/* Jenis Kelamin */}
        <FieldGroup>
          <FieldLabel>Jenis Kelamin</FieldLabel>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Jantan', 'Betina', 'Campuran'].map((opt) => (
              <label
                key={opt}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 5,
                  padding: '10px 6px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--color-text)',
                  textAlign: 'center',
                }}
              >
                <input type="radio" name="b-kelamin" value={opt} style={{ accentColor: 'var(--color-primary)' }} />
                {opt}
              </label>
            ))}
          </div>
        </FieldGroup>

        {/* Perkiraan Umur */}
        <FieldGroup>
          <FieldLabel htmlFor="b-umur">Perkiraan Umur<Opt /></FieldLabel>
          <input id="b-umur" type="text" placeholder="Contoh: 6\u20138 bulan" />
        </FieldGroup>

        {/* Rata-rata Bobot Awal */}
        <FieldGroup>
          <FieldLabel htmlFor="b-bobot">Rata-rata Bobot Awal (kg)<Opt /></FieldLabel>
          <input id="b-bobot" type="number" min="0" step="0.1" placeholder="Contoh: 22.5" />
        </FieldGroup>

        {/* Lokasi Kandang Awal */}
        <FieldGroup>
          <FieldLabel htmlFor="b-lokasi">Lokasi Kandang Awal<Opt /></FieldLabel>
          <input id="b-lokasi" type="text" placeholder="Contoh: Kandang A, Blok 3"
            value={bLokasi} onChange={(e) => setBLokasi(e.target.value)} />
          <HelperText>Lokasi saat ternak pertama kali didaftarkan.</HelperText>
        </FieldGroup>

        {/* Status Kesehatan Awal */}
        <FieldGroup last>
          <FieldLabel htmlFor="b-status">Status Kesehatan</FieldLabel>
          <select id="b-status">
            <option value="">{'\u2014'} Pilih Status {'\u2014'}</option>
            {STATUS_KESEHATAN.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </FieldGroup>
      </SectionCard>

      {/* ══ Catatan ═══════════════════════════════════════════════════════ */}
      <SectionCard title="Catatan">
        <FieldGroup last>
          <FieldLabel htmlFor="b-catatan">Catatan<Opt /></FieldLabel>
          <textarea id="b-catatan" placeholder="Tambahkan catatan tentang batch ini..." rows={3}
            value={bCatatan} onChange={(e) => setBCatatan(e.target.value)} />
          <HelperText>Data individu dapat ditambahkan kemudian.</HelperText>
        </FieldGroup>
      </SectionCard>

      {/* ══ Tentang Batch (info card) ══════════════════════════════════════ */}
      <div style={{
        background: '#eaf4ff',
        border: '1.5px solid #b3d6f5',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
        }}>
          <span style={{ fontSize: 16 }}>{'\u2139\uFE0F'}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1565c0' }}>Tentang Batch</span>
        </div>
        <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            'Batch adalah kelompok ternak.',
            'Batch tidak menghapus identitas ternak individu.',
          ].map((text) => (
            <li key={text} style={{ fontSize: 13, color: '#1a3a5c', lineHeight: 1.5 }}>
              {text}
            </li>
          ))}
        </ul>
      </div>

      {/* ══ Helper text ════════════════════════════════════════════════════ */}
      <p style={{
        fontSize: 12,
        color: 'var(--color-muted)',
        lineHeight: 1.6,
        margin: 0,
        padding: '0 2px',
      }}>
        Batch digunakan untuk mempermudah pencatatan kelompok ternak seperti penggemukan, pembibitan, karantina, atau penjualan.
      </p>

      {/* ── Bottom buttons ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: 'var(--color-surface)', color: 'var(--color-muted)',
            borderRadius: 'var(--radius-sm)', padding: '13px',
            fontSize: 15, fontWeight: 600, border: '1.5px solid var(--color-border)', cursor: 'pointer',
          }}
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={bSaving}
          style={{
            background: bSaving ? 'var(--color-muted)' : 'var(--color-primary)', color: '#fff',
            borderRadius: 'var(--radius-sm)', padding: '13px',
            fontSize: 15, fontWeight: 600, border: 'none', cursor: bSaving ? 'not-allowed' : 'pointer',
            opacity: bSaving ? 0.75 : 1,
          }}
        >
          {bSaving ? 'Menyimpan...' : 'Simpan Batch'}
        </button>
      </div>
      {bSaveError && (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#c62828', fontWeight: 600 }}>
          ⚠ {bSaveError}
        </p>
      )}
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AddLivestock() {
  const navigate = useNavigate();

  const [mode,              setMode]              = useState<Mode>('individu');
  const [jenis,             setJenis]             = useState('Domba');
  const [kelamin,           setKelamin]           = useState('');
  const [ras,               setRas]               = useState('');
  const [rasLainnya,        setRasLainnya]        = useState('');
  const [tipe,              setTipe]              = useState('');
  const [silangan,          setSilangan]          = useState('');
  const [silanganLainnya,   setSilanganLainnya]   = useState('');
  const [asal,              setAsal]              = useState('');

  // ── Individu form controlled fields ─────────────────────────────────────────
  const [nama,              setNama]              = useState('');
  const [tglLahir,          setTglLahir]          = useState('');
  const [birthDateEstimated,setBirthDateEstimated]= useState(false);
  const [beratLahir,        setBeratLahir]        = useState('');
  const [bobot,             setBobot]             = useState('');
  const [program,           setProgram]           = useState('');
  const [lokasiKandang,     setLokasiKandang]     = useState('');
  const [statusKesehatan,   setStatusKesehatan]   = useState('');
  const [catatan,           setCatatan]           = useState('');
  const [submitted,         setSubmitted]         = useState(false);

  // ── Asal Lahir — pedigree IDs ────────────────────────────────────────────────
  const [damId,             setDamId]             = useState('');
  const [sireId,            setSireId]            = useState('');

  // ── Asal Dibeli — purchase details ───────────────────────────────────────────
  const [supplier,          setSupplier]          = useState('');
  const [originFarm,        setOriginFarm]        = useState('');
  const [purchaseDate,      setPurchaseDate]      = useState('');
  const [purchasePrice,     setPurchasePrice]     = useState('');

  // ── Asal Lahir — birth / pedigree extras ─────────────────────────────────────
  const [siblingCount,      setSiblingCount]      = useState('');

  // ── Identifikasi tambahan ────────────────────────────────────────────────────
  const [earTag,            setEarTag]            = useState('');
  const [internalCode,      setInternalCode]      = useState('');

  // ── Ciri Fisik ───────────────────────────────────────────────────────────────
  const [color,             setColor]             = useState('');
  const [horn,              setHorn]              = useState('');
  const [tail,              setTail]              = useState('');
  const [specialMarks,      setSpecialMarks]      = useState('');

  // ── Batch (opsional saat registrasi) ─────────────────────────────────────────
  const [selectedBatchId,   setSelectedBatchId]   = useState('');

  const { activeWorkspace }             = useWorkspace();
  const { currentUser }                 = useAuth();
  // Ensures LIVESTOCK_DB/BATCH_DB are populated from Supabase on hard-refresh / deep link.
  const { batches }                     = useLivestock();
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [submitError,   setSubmitError]   = useState<string | null>(null);

  const counters  = useRef<CounterMap>({});
  // Derive a short farm code from the active workspace name for the ID preview display.
  const FARM_CODE = (activeWorkspace?.workspace_name ?? 'WS')
    .split(/\s+/)
    .slice(0, 3)
    .map((w) => w.charAt(0).toUpperCase())
    .join('') || 'WS';

  const jenisData  = JENIS_TERNAK.find((j) => j.value === jenis)!;
  const isFreeText = FREE_TEXT_BREEDS.has(jenis);
  const rasOptions = RAS_OPTIONS[jenis] ?? [];
  const showTipe   = !isFreeText && RAS_WITH_LINEAGE.has(ras);

  const jenisCode   = jenisData.code;
  const kelaminCode = kelamin ? (KELAMIN_CODE[kelamin] ?? '') : '';
  const generatedId = buildId(jenisCode, kelaminCode, counters.current, FARM_CODE);

  // ── Submit handler — Individu mode ──────────────────────────────────────────
  async function handleSubmitIndividu(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setSubmitError(null);

    // Required: kelamin and ras (or rasLainnya for free-text species)
    const rasFinal = isFreeText
      ? rasLainnya.trim()
      : ras === 'Lainnya' ? rasLainnya.trim() : ras;
    if (!kelamin || !rasFinal) return;

    if (!activeWorkspace?.workspace_uuid) {
      setSubmitError('Tidak ada workspace aktif. Silakan pilih workspace terlebih dahulu.');
      return;
    }
    if (!currentUser?.id) {
      setSubmitError('Sesi tidak ditemukan. Silakan login ulang.');
      return;
    }

    setIsSubmitting(true);

    const crossBreedFinal = silangan === 'Lainnya' ? silanganLainnya.trim() : silangan;

    const result = await createLivestockService({
      workspaceId: activeWorkspace.workspace_uuid,
      userId:      currentUser.id,
      core: {
        name:               nama.trim() || null,
        species:            jenis,
        breed:              rasFinal || null,
        sex:                kelamin === 'jantan' ? 'Jantan' : 'Betina',
        birth_date:         tglLahir || null,
        birth_date_estimated: birthDateEstimated,
        birth_weight_kg:    beratLahir ? parseFloat(beratLahir) : null,
        current_weight_kg:  bobot ? parseFloat(bobot) : null,
        health_status:      statusKesehatan === 'Sehat' ? 'Sehat' : statusKesehatan === 'Sakit' ? 'Sakit' : 'Pemantauan',
        location_detail:    lokasiKandang.trim() || null,
        program:            program || 'Lainnya',
        digital_identity_issued_by: activeWorkspace.workspace_name,
      },
      extended: {
        breed_category:  tipe || null,
        cross_breed:     crossBreedFinal || null,
        supplier:        supplier.trim()      || null,
        origin_farm:     originFarm.trim()    || null,
        purchase_date:   purchaseDate         || null,
        purchase_price:  purchasePrice ? parseFloat(purchasePrice) : null,
        sibling_count:   siblingCount ? parseInt(siblingCount, 10) : null,
        ear_tag:         earTag.trim()        || null,
        internal_code:   internalCode.trim()  || null,
        color:           color.trim()         || null,
        horn:            horn                 || null,
        tail:            tail                 || null,
        special_marks:   specialMarks.trim()  || null,
        notes:           catatan.trim()       || null,
      },
      damId:   damId.trim()   || null,
      sireId:  sireId.trim()  || null,
      batchId: selectedBatchId || null,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }

    navigate(`/livestock/${result.data.id}`, { replace: true });
  }

  function handleJenisChange(next: string) {
    setJenis(next);
    setRas(''); setRasLainnya(''); setTipe(''); setSilangan(''); setSilanganLainnya('');
  }
  function handleRasChange(next: string) {
    setRas(next);
    setRasLainnya(''); setTipe(''); setSilangan(''); setSilanganLainnya('');
  }

  return (
    <>

      {/* ── Mode selector ─────────────────────────────────────────────── */}
      <SegmentedControl value={mode} onChange={setMode} />

      {/* ══ BATCH MODE ════════════════════════════════════════════════════ */}
      {mode === 'batch' && (
        <BatchForm onCancel={() => navigate(-1)} />
      )}

      {/* ══ INDIVIDU MODE ═════════════════════════════════════════════════ */}
      {mode === 'individu' && (
        <form onSubmit={handleSubmitIndividu} noValidate>

          {/* ══ SECTION 1 – IDENTITAS TERNAK ══════════════════════════════ */}
          <SectionCard title="Identitas Ternak">

            {/* ID Ternak */}
            <FieldGroup>
              <FieldLabel htmlFor="id-ternak">ID Ternak</FieldLabel>
              <input
                id="id-ternak"
                type="text"
                value={generatedId}
                readOnly
                style={{ fontFamily: 'monospace', background: '#f5f5f5', color: 'var(--color-muted)' }}
              />
              <HelperText>Otomatis dibuat saat data disimpan.</HelperText>
            </FieldGroup>

            {/* Nama / Panggilan */}
            <FieldGroup>
              <FieldLabel htmlFor="nama">Nama / Panggilan<Opt /></FieldLabel>
              <input id="nama" type="text" placeholder="Contoh: Si Putih, Domba 01"
                value={nama} onChange={(e) => setNama(e.target.value)} />
            </FieldGroup>

            {/* Tag Telinga — PO B4 */}
            <FieldGroup>
              <FieldLabel htmlFor="tag-telinga">Tag Telinga<Opt /></FieldLabel>
              <input id="tag-telinga" type="text" placeholder="Contoh: ET-001, Y-2024"
                value={earTag} onChange={(e) => setEarTag(e.target.value)} />
              <HelperText>Nomor tag fisik yang dipasang di telinga ternak.</HelperText>
            </FieldGroup>

            {/* Kode Internal — PO B5 */}
            <FieldGroup>
              <FieldLabel htmlFor="kode-internal">Kode Internal<Opt /></FieldLabel>
              <input id="kode-internal" type="text" placeholder="Contoh: DOM-001, K23-01"
                value={internalCode} onChange={(e) => setInternalCode(e.target.value)} />
              <HelperText>Nomor penomoran internal peternakan (jika ada).</HelperText>
            </FieldGroup>

            {/* Jenis Ternak */}
            <FieldGroup last>
              <FieldLabel>Jenis Ternak</FieldLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {JENIS_TERNAK.map((j) => {
                  const active = jenis === j.value;
                  return (
                    <button
                      key={j.value}
                      type="button"
                      onClick={() => handleJenisChange(j.value)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        padding: '11px 6px',
                        borderRadius: 'var(--radius-md)',
                        border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                        background: active ? 'var(--color-primary-light)' : 'var(--color-surface)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 24, lineHeight: 1 }}>{j.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? 'var(--color-primary)' : 'var(--color-muted)' }}>
                        {j.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </FieldGroup>
          </SectionCard>

          {/* ══ SECTION 2 – INFORMASI TERNAK ══════════════════════════════ */}
          <SectionCard title="Informasi Ternak">

            {/* Ras */}
            <FieldGroup>
              <FieldLabel htmlFor="ras">Ras</FieldLabel>
              {isFreeText ? (
                <input
                  id="ras" type="text" placeholder="Masukkan Nama Ras"
                  value={rasLainnya} onChange={(e) => setRasLainnya(e.target.value)}
                />
              ) : (
                <>
                  <select id="ras" value={ras} onChange={(e) => handleRasChange(e.target.value)}>
                    <option value="">{'\u2014'} Pilih Ras {'\u2014'}</option>
                    {rasOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {ras === 'Lainnya' && (
                    <input
                      style={{ marginTop: 10 }} type="text" placeholder="Masukkan Nama Ras"
                      value={rasLainnya} onChange={(e) => setRasLainnya(e.target.value)}
                    />
                  )}
                </>
              )}
              {submitted && !isFreeText && !ras && (
                <p style={{ margin: '5px 0 0', fontSize: 11, color: '#e53935' }}>
                  Ras wajib dipilih.
                </p>
              )}
              {submitted && isFreeText && !rasLainnya.trim() && (
                <p style={{ margin: '5px 0 0', fontSize: 11, color: '#e53935' }}>
                  Ras wajib diisi.
                </p>
              )}
            </FieldGroup>

            {/* Tipe / Keturunan */}
            {showTipe && (
              <FieldGroup>
                <FieldLabel htmlFor="tipe-keturunan">Tipe / Keturunan</FieldLabel>
                <select
                  id="tipe-keturunan" value={tipe}
                  onChange={(e) => { setTipe(e.target.value); setSilangan(''); setSilanganLainnya(''); }}
                >
                  <option value="">{'\u2014'} Pilih Tipe {'\u2014'}</option>
                  {TIPE_KETURUNAN.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>

                {/* Silangan Dengan */}
                {tipe === 'Cross' && (
                  <div style={{ marginTop: 14 }}>
                    <FieldLabel htmlFor="silangan">Silangan Dengan</FieldLabel>
                    <select
                      id="silangan" value={silangan}
                      onChange={(e) => { setSilangan(e.target.value); setSilanganLainnya(''); }}
                    >
                      <option value="">{'\u2014'} Pilih Ras {'\u2014'}</option>
                      {rasOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {silangan === 'Lainnya' && (
                      <input
                        style={{ marginTop: 10 }} type="text" placeholder="Masukkan Nama Ras Silangan"
                        value={silanganLainnya} onChange={(e) => setSilanganLainnya(e.target.value)}
                      />
                    )}
                  </div>
                )}
              </FieldGroup>
            )}

            {/* Jenis Kelamin */}
            <FieldGroup>
              <FieldLabel htmlFor="jenis-kelamin">Jenis Kelamin</FieldLabel>
              <select id="jenis-kelamin" value={kelamin} onChange={(e) => setKelamin(e.target.value)}>
                <option value="">{'\u2014'} Pilih Jenis Kelamin {'\u2014'}</option>
                <option value="jantan">Jantan</option>
                <option value="betina">Betina</option>
              </select>
              {submitted && !kelamin && (
                <p style={{ margin: '5px 0 0', fontSize: 11, color: '#e53935' }}>
                  Jenis kelamin wajib dipilih.
                </p>
              )}
            </FieldGroup>

            {/* Program */}
            <FieldGroup>
              <FieldLabel htmlFor="program">Program<Opt /></FieldLabel>
              <select id="program" value={program} onChange={(e) => setProgram(e.target.value)}>
                <option value="">{'\u2014'} Pilih Program {'\u2014'}</option>
                {PROGRAM_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <HelperText>Tujuan pemeliharaan ternak (Fattening, Breeding, dll.).</HelperText>
            </FieldGroup>

            {/* Tanggal Lahir + Perkiraan */}
            <FieldGroup>
              <FieldLabel htmlFor="tgl-lahir">Tanggal Lahir<Opt /></FieldLabel>
              <input id="tgl-lahir" type="date"
                value={tglLahir} onChange={(e) => setTglLahir(e.target.value)} />
              {/* Bug 5 fix: birthDateEstimated checkbox */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={birthDateEstimated}
                  onChange={(e) => setBirthDateEstimated(e.target.checked)}
                  style={{ accentColor: 'var(--color-primary)', width: 15, height: 15 }}
                />
                <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>Tanggal lahir merupakan perkiraan</span>
              </label>
            </FieldGroup>

            {/* Berat Lahir — Bug 4 fix */}
            <FieldGroup>
              <FieldLabel htmlFor="berat-lahir">Berat Lahir (kg)<Opt /></FieldLabel>
              <input id="berat-lahir" type="number" min="0" step="0.1" placeholder="Contoh: 3.5"
                value={beratLahir} onChange={(e) => setBeratLahir(e.target.value)} />
              <HelperText>Berat ternak saat lahir, jika diketahui.</HelperText>
            </FieldGroup>

            {/* Bobot Awal (saat ini) */}
            <FieldGroup>
              <FieldLabel htmlFor="bobot">Bobot Awal / Saat Ini (kg)<Opt /></FieldLabel>
              <input id="bobot" type="number" min="0" step="0.1" placeholder="Contoh: 25.5"
                value={bobot} onChange={(e) => setBobot(e.target.value)} />
              <HelperText>Bobot ternak saat pertama kali didaftarkan.</HelperText>
            </FieldGroup>

            {/* Lokasi Kandang Awal */}
            <FieldGroup>
              <FieldLabel htmlFor="lokasi-kandang">Lokasi Kandang Awal<Opt /></FieldLabel>
              <input id="lokasi-kandang" type="text" placeholder="Contoh: Kandang A, Blok 3"
                value={lokasiKandang} onChange={(e) => setLokasiKandang(e.target.value)} />
              <HelperText>Lokasi saat ternak pertama kali didaftarkan.</HelperText>
            </FieldGroup>

            {/* Status Kesehatan */}
            <FieldGroup last>
              <FieldLabel htmlFor="status-kesehatan">Status Kesehatan<Opt /></FieldLabel>
              <select id="status-kesehatan" value={statusKesehatan} onChange={(e) => setStatusKesehatan(e.target.value)}>
                <option value="">{'\u2014'} Pilih Status {'\u2014'}</option>
                {STATUS_KESEHATAN.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </FieldGroup>
          </SectionCard>

          {/* ══ SECTION 3 – ASAL TERNAK ═══════════════════════════════════ */}
          <SectionCard title="Asal Ternak">
            <FieldGroup last={asal === ''}>
              <FieldLabel htmlFor="asal">Asal Ternak<Opt /></FieldLabel>
              <select id="asal" value={asal} onChange={(e) => setAsal(e.target.value)}>
                <option value="">{'\u2014'} Pilih Asal {'\u2014'}</option>
                {ASAL_TERNAK.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </FieldGroup>

            {asal === 'Dibeli'              && (
              <FieldGroup last>
                <AsalDibeli
                  supplier={supplier} onSupplierChange={setSupplier}
                  originFarm={originFarm} onOriginFarmChange={setOriginFarm}
                  purchaseDate={purchaseDate} onPurchaseDateChange={setPurchaseDate}
                  purchasePrice={purchasePrice} onPurchasePriceChange={setPurchasePrice}
                />
              </FieldGroup>
            )}
            {asal === 'Lahir di Peternakan' && (
              <FieldGroup last>
                <AsalLahir
                  damId={damId} onDamChange={setDamId}
                  sireId={sireId} onSireChange={setSireId}
                  siblingCount={siblingCount} onSiblingCountChange={setSiblingCount}
                />
              </FieldGroup>
            )}
            {asal === 'Lainnya'             && (
              <FieldGroup last><AsalLainnya /></FieldGroup>
            )}
          </SectionCard>

          {/* ══ SECTION 4 – CIRI FISIK ═══════════════════════════════════ */}
          {/* PO B6 */}
          <SectionCard title="Ciri Fisik">

            {/* Warna */}
            <FieldGroup>
              <FieldLabel htmlFor="warna">Warna Tubuh<Opt /></FieldLabel>
              <input id="warna" type="text" placeholder="Contoh: Hitam, Putih, Coklat kemerahan"
                value={color} onChange={(e) => setColor(e.target.value)} />
            </FieldGroup>

            {/* Tanduk */}
            <FieldGroup>
              <FieldLabel htmlFor="tanduk">Tanduk<Opt /></FieldLabel>
              <select id="tanduk" value={horn} onChange={(e) => setHorn(e.target.value)}>
                <option value="">{'\u2014'} Pilih {'\u2014'}</option>
                {HORN_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </FieldGroup>

            {/* Ekor */}
            <FieldGroup>
              <FieldLabel htmlFor="ekor">Ekor<Opt /></FieldLabel>
              <select id="ekor" value={tail} onChange={(e) => setTail(e.target.value)}>
                <option value="">{'\u2014'} Pilih {'\u2014'}</option>
                {TAIL_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </FieldGroup>

            {/* Tanda Khusus */}
            <FieldGroup last>
              <FieldLabel htmlFor="tanda-khusus">Tanda Khusus<Opt /></FieldLabel>
              <textarea id="tanda-khusus" placeholder="Contoh: Bercak putih di telinga kanan..." rows={2}
                value={specialMarks} onChange={(e) => setSpecialMarks(e.target.value)} />
            </FieldGroup>
          </SectionCard>

          {/* ══ SECTION 5 – BATCH ═════════════════════════════════════════ */}
          {/* PO B7 */}
          <SectionCard title="Batch / Kelompok">
            <FieldGroup last>
              <FieldLabel htmlFor="batch-picker">Masukkan ke Batch<Opt /></FieldLabel>
              <select id="batch-picker" value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)}>
                <option value="">{'\u2014'} Tidak dalam batch {'\u2014'}</option>
                {batches
                  .filter((b) => b.status === 'Aktif')
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}{b.name && b.name !== b.label ? ` — ${b.name}` : ''}
                    </option>
                  ))}
              </select>
              <HelperText>Opsional. Ternak dapat ditambahkan ke batch kapan saja dari modul Batch.</HelperText>
            </FieldGroup>
          </SectionCard>

          {/* ══ SECTION 6 – FOTO ══════════════════════════════════════════ */}
          <SectionCard title="Foto">
            <FieldGroup last>
              <FotoSection />
            </FieldGroup>
          </SectionCard>

          {/* ══ SECTION 7 – CATATAN ═══════════════════════════════════════ */}
          <SectionCard title="Catatan">
            <FieldGroup last>
              <FieldLabel htmlFor="catatan">Catatan<Opt /></FieldLabel>
              <textarea
                id="catatan"
                placeholder="Tambahkan catatan tambahan tentang ternak ini..."
                rows={3}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
              />
            </FieldGroup>
          </SectionCard>

          {/* ── Bottom buttons ──────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                background: 'var(--color-surface)', color: 'var(--color-muted)',
                borderRadius: 'var(--radius-sm)', padding: '13px',
                fontSize: 15, fontWeight: 600, border: '1.5px solid var(--color-border)', cursor: 'pointer',
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: isSubmitting ? 'var(--color-muted)' : 'var(--color-primary)',
                color: '#fff',
                borderRadius: 'var(--radius-sm)', padding: '13px',
                fontSize: 15, fontWeight: 600, border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>

          {/* Submit error banner */}
          {submitError && (
            <div style={{
              margin: '12px 0 0',
              padding: '12px 14px',
              background: '#fdecea',
              border: '1.5px solid #f44336',
              borderRadius: 'var(--radius-md)',
              color: '#c62828',
              fontSize: 13,
              fontWeight: 500,
            }}>
              ⚠️ {submitError}
            </div>
          )}

        </form>
      )}

    </>
  );
}
