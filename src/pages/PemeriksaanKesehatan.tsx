/**
 * PemeriksaanKesehatan.tsx  (KH-002)
 * ─────────────────────────────────────────────────────────────────
 * Form page for creating a new health examination (Pemeriksaan).
 * Route: /kesehatan-hewan/pemeriksaan/baru
 *
 * On successful save → navigates to KH-003 (/kesehatan-hewan/diagnosa/:id)
 */

import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLivestock } from '../hooks/useLivestock';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { createCheckup } from '../services/healthService';

import { LIVESTOCK_DB }        from '../data/livestockData';
import { getLivestockStatus }  from '../data/transferData';
import { BATCH_DB, getActiveBatchMemberships } from '../data/batchData';
import { type BatchStatus }                    from '../data/batchData';
import {
  addPemeriksaan,
  setPemeriksaanSupabaseId,
  type ModeKesehatan,
  type NafsuMakan,
  type AktivitasTernak,
  type KondisiFeses,
} from '../data/pemeriksaanKesehatanData';

// ─── Types (local) ────────────────────────────────────────────────────────────

type LivestockOption = {
  id: string;
  name: string | null;
  type: string;
  icon: string;
  typeBg: string;
  location: string;
  healthStatus: string;
  locationStatus: string;
};

type BatchOption = {
  id: string;
  name: string | null;
  label: string;
  type: string;
  icon: string;
  typeBg: string;
  status: BatchStatus;
  memberCount: number;
};

// ─── Option builders ──────────────────────────────────────────────────────────

function buildLivestockOptions(): LivestockOption[] {
  return Object.values(LIVESTOCK_DB)
    .filter((lv) => getLivestockStatus(lv.id) !== 'Arsip')
    .map((lv) => ({
      id:             lv.id,
      name:           lv.name,
      type:           lv.type,
      icon:           lv.typeIcon,
      typeBg:         lv.typeBg,
      location:       lv.location,
      healthStatus:   lv.status,
      locationStatus: getLivestockStatus(lv.id) as string,
    }));
}

function buildBatchOptions(): BatchOption[] {
  return Object.values(BATCH_DB)
    .filter((b) => b.status !== 'Diarsipkan')
    .map((b) => ({
      id:          b.id,
      name:        b.name,
      label:       b.label,
      type:        b.livestockType,
      icon:        b.livestockIcon,
      typeBg:      b.livestockTypeBg,
      status:      b.status,
      memberCount: getActiveBatchMemberships(b.id).length,
    }));
}

// ─── Style constants ──────────────────────────────────────────────────────────

const HEALTH_STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  Sehat:             { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  Sakit:             { bg: '#ffebee',                   color: 'var(--color-danger)'  },
  Pemantauan:        { bg: '#fff3e0',                   color: 'var(--color-warning)' },
  'Perlu Perhatian': { bg: '#fff3e0',                   color: 'var(--color-warning)' },
};

const LOC_STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  Aktif:          { bg: '#e8f5e9', color: '#2e7d32' },
  'Luar Kandang': { bg: '#fff8e1', color: '#f57f17' },
};

const BATCH_STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  Aktif:   { bg: '#e8f5e9', color: '#2e7d32' },
  Selesai: { bg: '#eceff1', color: '#546e7a' },
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
      {optional  && <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 400 }}>(opsional)</span>}
      {required  && <span style={{ fontSize: 11, color: 'var(--color-danger)', fontWeight: 700 }}>*</span>}
    </label>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--color-border)', margin: '0 16px' }} />;
}

function ErrorHint({ msg }: { msg: string }) {
  return (
    <div style={{ fontSize: 11.5, color: 'var(--color-danger)', fontWeight: 600, marginTop: 4, marginBottom: 8 }}>
      ⚠ {msg}
    </div>
  );
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
  background: 'var(--color-bg)', color: 'var(--color-text)',
  fontSize: 13, fontWeight: 500, outline: 'none', boxSizing: 'border-box',
};

const INPUT_ERR_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  border: '1.5px solid var(--color-danger)',
};

const TEXTAREA_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  minHeight: 80, resize: 'vertical',
  lineHeight: 1.6,
};

const TEXTAREA_ERR_STYLE: React.CSSProperties = {
  ...TEXTAREA_STYLE,
  border: '1.5px solid var(--color-danger)',
};

// ─── Chip-row selector ────────────────────────────────────────────────────────

function ChipSelect<T extends string>({
  options, value, onChange, id,
}: {
  options: readonly T[];
  value: T | '';
  onChange: (v: T) => void;
  id?: string;
}) {
  return (
    <div id={id} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
              border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
              borderRadius: 20,
              background: active ? 'var(--color-primary)' : 'var(--color-surface)',
              color: active ? '#fff' : 'var(--color-muted)',
              transition: 'background 0.1s',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ─── Livestock picker card ─────────────────────────────────────────────────────

function LivestockCard({
  item, selected, onSelect,
}: {
  item: LivestockOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const hsColor = HEALTH_STATUS_COLOR[item.healthStatus] ?? HEALTH_STATUS_COLOR['Sehat'];
  const lsColor = LOC_STATUS_COLOR[item.locationStatus]  ?? LOC_STATUS_COLOR['Aktif'];
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
        display: 'flex', alignItems: 'center', gap: 12,
        transition: 'background 0.1s',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 44, height: 44, borderRadius: 'var(--radius-sm)', flexShrink: 0,
        background: item.typeBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
      }}>
        {item.icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.name ?? item.id}
          </span>
          {item.name && (
            <span style={{ fontSize: 10.5, color: 'var(--color-muted)', fontFamily: 'monospace', flexShrink: 0 }}>
              #{item.id}
            </span>
          )}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.type} · {item.location}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: lsColor.bg, color: lsColor.color }}>
            {item.locationStatus}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: hsColor.bg, color: hsColor.color }}>
            {item.healthStatus}
          </span>
        </div>
      </div>

      {/* Checkmark */}
      {selected && (
        <div style={{
          width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
          background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 13, color: '#fff', lineHeight: 1 }}>✓</span>
        </div>
      )}
    </button>
  );
}

// ─── Batch picker card ────────────────────────────────────────────────────────

function BatchCard({
  item, selected, onSelect,
}: {
  item: BatchOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const stColor = BATCH_STATUS_COLOR[item.status] ?? BATCH_STATUS_COLOR['Aktif'];
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
        display: 'flex', alignItems: 'center', gap: 12,
        transition: 'background 0.1s',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 44, height: 44, borderRadius: 'var(--radius-sm)', flexShrink: 0,
        background: item.typeBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
      }}>
        {item.icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
          {item.name ?? item.label}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginBottom: 5 }}>
          {item.type} · {item.memberCount} anggota · {item.label}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: stColor.bg, color: stColor.color }}>
            {item.status}
          </span>
        </div>
      </div>

      {selected && (
        <div style={{
          width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
          background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 13, color: '#fff', lineHeight: 1 }}>✓</span>
        </div>
      )}
    </button>
  );
}

// ─── BCS Selector ─────────────────────────────────────────────────────────────

const BCS_LABELS: Record<string, string> = {
  '1': 'Sangat Kurus',
  '2': 'Kurus',
  '3': 'Ideal',
  '4': 'Gemuk',
  '5': 'Sangat Gemuk',
};

function BcsSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {(['1', '2', '3', '4', '5'] as const).map((score) => {
        const active = value === score;
        return (
          <button
            key={score}
            type="button"
            onClick={() => onChange(active ? '' : score)}
            style={{
              flex: 1, padding: '10px 0', cursor: 'pointer',
              border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              background: active ? 'var(--color-primary)' : 'var(--color-surface)',
              color: active ? '#fff' : 'var(--color-muted)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 800 }}>{score}</span>
            <span style={{ fontSize: 9, fontWeight: 600, lineHeight: 1.2, textAlign: 'center' }}>
              {BCS_LABELS[score]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const NAFSU_OPTS    = ['Normal', 'Menurun', 'Tidak Ada'] as const;
const AKTIVITAS_OPTS = ['Normal', 'Menurun', 'Tidak Ada'] as const;
const FESES_OPTS    = ['Normal', 'Lembek', 'Keras', 'Berdarah', 'Berlendir', 'Diare', 'Lainnya'] as const;

export default function PemeriksaanKesehatan() {
  const navigate = useNavigate();
  // M-004 fix: workspace_id is needed to persist checkups to Supabase.
  const { activeWorkspace } = useWorkspace();

  // Populates LIVESTOCK_DB and BATCH_DB from Supabase so deep-link /
  // hard-refresh navigations get live data instead of an empty in-memory store.
  const { isLoading, error, refresh } = useLivestock();
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 36 }}>⏳</span>
        <div style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 600 }}>Memuat data ternak...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ padding: '24px 16px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>⚠️</span>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Gagal Memuat Data</div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: 16 }}>{error}</div>
        <button type="button" onClick={refresh}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Coba Lagi
        </button>
      </div>
    );
  }

  // ── Mode ─────────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<ModeKesehatan>('individu');

  // ── Picker search ─────────────────────────────────────────────────────────────
  const [pickerQuery, setPickerQuery] = useState('');
  const [selectedLivestockId, setSelectedLivestockId] = useState<string | null>(null);
  const [selectedBatchId,     setSelectedBatchId]     = useState<string | null>(null);

  // ── Form fields ───────────────────────────────────────────────────────────────
  const todayISO = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const [tanggal,       setTanggal]       = useState(todayISO);
  const [petugas,       setPetugas]       = useState('');
  const [keluhan,       setKeluhan]       = useState('');
  const [gejala,        setGejala]        = useState('');
  const [suhuTubuh,     setSuhuTubuh]     = useState('');
  const [nafsuMakan,    setNafsuMakan]    = useState<NafsuMakan | ''>('');
  const [aktivitas,     setAktivitas]     = useState<AktivitasTernak | ''>('');
  const [kondisiFeses,  setKondisiFeses]  = useState<KondisiFeses | ''>('');
  const [bcs,           setBcs]           = useState('');
  const [bobot,         setBobot]         = useState('');
  const [catatan,       setCatatan]       = useState('');

  // ── Validation state ──────────────────────────────────────────────────────────
  const [submitted, setSubmitted] = useState(false);
  const [saving,    setSaving]    = useState(false);

  const pickerRef = useRef<HTMLDivElement>(null);

  // ── Live data ─────────────────────────────────────────────────────────────────
  const allLivestock = buildLivestockOptions();
  const allBatches   = buildBatchOptions();

  // ── Filtered picker lists ─────────────────────────────────────────────────────
  const filteredLivestock = useMemo(() => {
    if (!pickerQuery) return allLivestock;
    const q = pickerQuery.toLowerCase();
    return allLivestock.filter(
      (lv) => lv.id.toLowerCase().includes(q) || (lv.name ?? '').toLowerCase().includes(q) || lv.type.toLowerCase().includes(q),
    );
  }, [pickerQuery, allLivestock.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredBatches = useMemo(() => {
    if (!pickerQuery) return allBatches;
    const q = pickerQuery.toLowerCase();
    return allBatches.filter(
      (b) => b.id.toLowerCase().includes(q) || (b.name ?? '').toLowerCase().includes(q) || b.type.toLowerCase().includes(q) || b.label.toLowerCase().includes(q),
    );
  }, [pickerQuery, allBatches.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived selection info ────────────────────────────────────────────────────
  const selectedLivestock = selectedLivestockId ? allLivestock.find((lv) => lv.id === selectedLivestockId) ?? null : null;
  const selectedBatch     = selectedBatchId     ? allBatches.find((b)  => b.id  === selectedBatchId)     ?? null : null;

  // ── Validation helpers ────────────────────────────────────────────────────────
  const noSelection  = mode === 'individu' ? !selectedLivestockId : !selectedBatchId;
  const errTanggal   = submitted && !tanggal.trim();
  const errPetugas   = submitted && !petugas.trim();
  const errKeluhanGejala = submitted && !keluhan.trim() && !gejala.trim();
  const errSelection = submitted && noSelection;

  // ── Mode change: clear picker ─────────────────────────────────────────────────
  function handleModeChange(m: ModeKesehatan) {
    setMode(m);
    setPickerQuery('');
    setSelectedLivestockId(null);
    setSelectedBatchId(null);
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  function handleSubmit() {
    setSubmitted(true);

    const valid =
      tanggal.trim() &&
      petugas.trim() &&
      (keluhan.trim() || gejala.trim()) &&
      (mode === 'individu' ? !!selectedLivestockId : !!selectedBatchId);

    if (!valid) {
      // Scroll to first error
      if (noSelection && pickerRef.current) {
        pickerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    setSaving(true);
    try {
      // ── In-memory write (primary) ─────────────────────────────────────────────
      // addPemeriksaan() returns a local UUID used for immediate navigation.
      // The downstream KH-003..KH-007 workflow still links by this in-memory ID.
      const id = addPemeriksaan({
        mode,
        livestockId: mode === 'individu' ? selectedLivestockId : null,
        batchId:     mode === 'batch'     ? selectedBatchId     : null,
        tanggal:     tanggal.trim(),
        petugas:     petugas.trim(),
        keluhan:     keluhan.trim(),
        gejala:      gejala.trim(),
        suhuTubuh:   suhuTubuh.trim(),
        nafsuMakan,
        aktivitas,
        kondisiFeses,
        bcs:         bcs as '' | '1' | '2' | '3' | '4' | '5',
        bobot:       bobot.trim(),
        catatan:     catatan.trim(),
      });

      // ── Supabase write (dual-write, fire-and-forget) ──────────────────────────
      // Only individu mode is supported by the health_checkups schema
      // (livestock_id NOT NULL — batch mode has no row in DB yet).
      // Failures are logged but do not block navigation.
      if (mode === 'individu' && selectedLivestockId && activeWorkspace?.workspace_uuid) {
        createCheckup(activeWorkspace.workspace_uuid, {
          livestockId: selectedLivestockId,
          tanggal:     tanggal.trim(),
          petugas:     petugas.trim(),
          keluhan:     keluhan.trim(),
          gejala:      gejala.trim(),
          suhuTubuh:   suhuTubuh.trim(),
          bcs:         bcs as '' | '1' | '2' | '3' | '4' | '5',
          bobot:       bobot.trim(),
          nafsuMakan,
          aktivitas,
          kondisiFeses,
          catatan:     catatan.trim(),
          healthStatus: 'Sakit',
        }).then((result) => {
          if (result.ok) {
            // Backfill Supabase UUID so KH-003..KH-007 dual-writes use the
            // correct health_checkups.id (server-generated) instead of the
            // local in-memory UUID.
            setPemeriksaanSupabaseId(id, result.data.id);
          } else {
            console.error('[KH-002] Supabase createCheckup failed:', result.error);
          }
        }).catch((err) => {
          console.error('[KH-002] Supabase createCheckup error:', err);
        });
      }

      navigate(`/kesehatan-hewan/diagnosa/${id}`);
    } catch (err) {
      console.error('[KH-002] addPemeriksaan failed:', err);
      setSaving(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '20px 16px 110px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* ── Mode ──────────────────────────────────────────────────────────────── */}
      <section>
        <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', margin: '0 0 10px' }}>
          Mode
        </h2>
        <div style={{ display: 'flex', background: 'var(--color-bg)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 3, gap: 3 }}>
          {(['individu', 'batch'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleModeChange(m)}
              style={{
                flex: 1, padding: '9px',
                border: 'none', borderRadius: 'calc(var(--radius-md) - 3px)',
                background: mode === m ? 'var(--color-primary)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--color-muted)',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s',
              }}
            >
              {m === 'individu' ? '🐄 Individu' : '🗂 Batch'}
            </button>
          ))}
        </div>
      </section>

      {/* ── Pilih Ternak / Batch ──────────────────────────────────────────────── */}
      <div ref={pickerRef}>
        <SectionCard title={mode === 'individu' ? 'Pilih Ternak' : 'Pilih Batch'}>
          {/* Search bar */}
          <div style={{ padding: '12px 14px 10px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
              background: 'var(--color-bg)', padding: '9px 12px',
            }}>
              <span style={{ fontSize: 15, color: 'var(--color-muted)', flexShrink: 0 }}>🔍</span>
              <input
                type="text"
                placeholder={mode === 'individu' ? 'Cari ID, nama, atau jenis...' : 'Cari ID, nama batch, atau jenis...'}
                value={pickerQuery}
                onChange={(e) => setPickerQuery(e.target.value)}
                style={{ border: 'none', outline: 'none', flex: 1, fontSize: 13, color: 'var(--color-text)', background: 'transparent' }}
              />
              {pickerQuery && (
                <button type="button" onClick={() => setPickerQuery('')}
                  style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                  ✕
                </button>
              )}
            </div>
            {errSelection && (
              <div style={{ fontSize: 11.5, color: 'var(--color-danger)', fontWeight: 600, marginTop: 6 }}>
                ⚠ Pilih {mode === 'individu' ? 'ternak' : 'batch'} terlebih dahulu.
              </div>
            )}
          </div>

          {/* List */}
          <div style={{
            maxHeight: 340, overflowY: 'auto',
            padding: '4px 10px 12px',
            display: 'flex', flexDirection: 'column', gap: 6,
            // border hint when error
            borderTop: errSelection ? '1px solid var(--color-danger)' : '1px solid var(--color-border)',
          }}>
            {mode === 'individu' ? (
              filteredLivestock.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--color-muted)' }}>
                  {pickerQuery ? 'Tidak ada hasil.' : 'Belum ada ternak terdaftar.'}
                </div>
              ) : (
                filteredLivestock.map((lv) => (
                  <LivestockCard
                    key={lv.id}
                    item={lv}
                    selected={selectedLivestockId === lv.id}
                    onSelect={() => setSelectedLivestockId(selectedLivestockId === lv.id ? null : lv.id)}
                  />
                ))
              )
            ) : (
              filteredBatches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--color-muted)' }}>
                  {pickerQuery ? 'Tidak ada hasil.' : 'Belum ada batch terdaftar.'}
                </div>
              ) : (
                filteredBatches.map((b) => (
                  <BatchCard
                    key={b.id}
                    item={b}
                    selected={selectedBatchId === b.id}
                    onSelect={() => setSelectedBatchId(selectedBatchId === b.id ? null : b.id)}
                  />
                ))
              )
            )}
          </div>
        </SectionCard>
      </div>

      {/* ── Selected context banner ───────────────────────────────────────────── */}
      {(selectedLivestock || selectedBatch) && (
        <div style={{
          background: 'var(--color-primary-light)',
          border: '1.5px solid var(--color-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 22 }}>
            {selectedLivestock?.icon ?? selectedBatch?.icon}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>
              {mode === 'individu'
                ? (selectedLivestock?.name ?? selectedLivestock?.id ?? '')
                : (selectedBatch?.name ?? selectedBatch?.label ?? '')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-primary)', opacity: 0.75 }}>
              {mode === 'individu'
                ? `${selectedLivestock?.type} · #${selectedLivestock?.id}`
                : `${selectedBatch?.type} · ${selectedBatch?.memberCount} anggota`}
            </div>
          </div>
          <button
            type="button"
            onClick={() => { mode === 'individu' ? setSelectedLivestockId(null) : setSelectedBatchId(null); }}
            style={{ border: 'none', background: 'none', fontSize: 16, color: 'var(--color-primary)', cursor: 'pointer', padding: 0, opacity: 0.7, flexShrink: 0 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Data Dasar ────────────────────────────────────────────────────────── */}
      <SectionCard title="Data Dasar">
        <FieldWrap>
          <FieldLabel htmlFor="tanggal" required>Tanggal Pemeriksaan</FieldLabel>
          <input
            id="tanggal" type="date" value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            style={errTanggal ? INPUT_ERR_STYLE : INPUT_STYLE}
          />
          {errTanggal && <ErrorHint msg="Tanggal wajib diisi." />}
        </FieldWrap>
        <Divider />
        <FieldWrap>
          <FieldLabel htmlFor="petugas" required>Petugas</FieldLabel>
          <input
            id="petugas" type="text"
            placeholder="Nama dokter / petugas"
            value={petugas}
            onChange={(e) => setPetugas(e.target.value)}
            style={errPetugas ? INPUT_ERR_STYLE : INPUT_STYLE}
          />
          {errPetugas && <ErrorHint msg="Nama petugas wajib diisi." />}
        </FieldWrap>
        <div style={{ height: 14 }} />
      </SectionCard>

      {/* ── Keluhan & Gejala ──────────────────────────────────────────────────── */}
      <SectionCard title="Keluhan &amp; Gejala">
        <FieldWrap>
          <FieldLabel htmlFor="keluhan">
            Keluhan
            <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 400, marginLeft: 4 }}>(minimal salah satu)</span>
          </FieldLabel>
          <textarea
            id="keluhan"
            placeholder="Keluhan yang dilaporkan pemilik / petugas kandang…"
            value={keluhan}
            onChange={(e) => setKeluhan(e.target.value)}
            style={errKeluhanGejala ? TEXTAREA_ERR_STYLE : TEXTAREA_STYLE}
          />
        </FieldWrap>
        <Divider />
        <FieldWrap>
          <FieldLabel htmlFor="gejala">
            Gejala
            <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 400, marginLeft: 4 }}>(minimal salah satu)</span>
          </FieldLabel>
          <textarea
            id="gejala"
            placeholder="Gejala klinis yang diamati saat pemeriksaan…"
            value={gejala}
            onChange={(e) => setGejala(e.target.value)}
            style={errKeluhanGejala ? TEXTAREA_ERR_STYLE : TEXTAREA_STYLE}
          />
          {errKeluhanGejala && <ErrorHint msg="Isi minimal salah satu: Keluhan atau Gejala." />}
        </FieldWrap>
        <div style={{ height: 14 }} />
      </SectionCard>

      {/* ── Pemeriksaan Klinis ────────────────────────────────────────────────── */}
      <SectionCard title="Pemeriksaan Klinis">
        {/* Suhu Tubuh */}
        <FieldWrap>
          <FieldLabel htmlFor="suhu" optional>Suhu Tubuh</FieldLabel>
          <div style={{ position: 'relative' }}>
            <input
              id="suhu" type="number" step="0.1" min="30" max="45"
              placeholder="38.5"
              value={suhuTubuh}
              onChange={(e) => setSuhuTubuh(e.target.value)}
              style={{ ...INPUT_STYLE, paddingRight: 40 }}
            />
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--color-muted)', pointerEvents: 'none' }}>
              °C
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4, marginBottom: 8 }}>
            Normal: Sapi 38–39 °C · Kambing/Domba 38.5–40 °C · Babi 38.5–39.5 °C
          </div>
        </FieldWrap>
        <Divider />

        {/* Nafsu Makan */}
        <FieldWrap>
          <FieldLabel optional>Nafsu Makan</FieldLabel>
          <ChipSelect<NafsuMakan>
            options={NAFSU_OPTS}
            value={nafsuMakan}
            onChange={setNafsuMakan}
          />
          <div style={{ height: 10 }} />
        </FieldWrap>
        <Divider />

        {/* Aktivitas */}
        <FieldWrap>
          <FieldLabel optional>Aktivitas</FieldLabel>
          <ChipSelect<AktivitasTernak>
            options={AKTIVITAS_OPTS}
            value={aktivitas}
            onChange={setAktivitas}
          />
          <div style={{ height: 10 }} />
        </FieldWrap>
        <Divider />

        {/* Kondisi Feses */}
        <FieldWrap>
          <FieldLabel optional>Kondisi Feses</FieldLabel>
          <ChipSelect<KondisiFeses>
            options={FESES_OPTS}
            value={kondisiFeses}
            onChange={setKondisiFeses}
          />
          <div style={{ height: 10 }} />
        </FieldWrap>
        <Divider />

        {/* BCS */}
        <FieldWrap>
          <FieldLabel optional>Body Condition Score (BCS)</FieldLabel>
          <BcsSelect value={bcs} onChange={setBcs} />
          <div style={{ height: 10 }} />
        </FieldWrap>
      </SectionCard>

      {/* ── Data Tambahan ─────────────────────────────────────────────────────── */}
      <SectionCard title="Data Tambahan">
        <FieldWrap>
          <FieldLabel htmlFor="bobot" optional>Bobot</FieldLabel>
          <div style={{ position: 'relative' }}>
            <input
              id="bobot" type="number" step="0.1" min="0"
              placeholder="0.0"
              value={bobot}
              onChange={(e) => setBobot(e.target.value)}
              style={{ ...INPUT_STYLE, paddingRight: 40 }}
            />
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--color-muted)', pointerEvents: 'none' }}>
              kg
            </span>
          </div>
        </FieldWrap>
        <div style={{ height: 14 }} />
      </SectionCard>

      {/* ── Catatan ───────────────────────────────────────────────────────────── */}
      <SectionCard title="Catatan">
        <FieldWrap>
          <FieldLabel htmlFor="catatan" optional>Catatan Tambahan</FieldLabel>
          <textarea
            id="catatan"
            placeholder="Observasi lain, instruksi perawatan, atau keterangan tambahan…"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            style={{ ...TEXTAREA_STYLE, minHeight: 96 }}
          />
        </FieldWrap>
        <div style={{ height: 14 }} />
      </SectionCard>

      {/* ── Global validation notice ──────────────────────────────────────────── */}
      {submitted && (!tanggal.trim() || !petugas.trim() || (!keluhan.trim() && !gejala.trim()) || noSelection) && (
        <div style={{
          background: '#ffebee', border: '1.5px solid var(--color-danger)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px',
          fontSize: 12.5, color: 'var(--color-danger)', fontWeight: 600, lineHeight: 1.6,
        }}>
          ⚠ Mohon lengkapi semua field yang wajib diisi sebelum menyimpan.
        </div>
      )}

      {/* ── Fixed bottom submit bar ───────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--color-surface)',
        borderTop: '1.5px solid var(--color-border)',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.10)',
        padding: '12px 16px calc(12px + env(safe-area-inset-bottom, 0px))',
        display: 'flex', alignItems: 'center', gap: 10, zIndex: 200,
        maxWidth: 480, margin: '0 auto',
      }}>
        {/* Status badge preview */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>Status setelah simpan</div>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: '#2e7d32', marginTop: 2 }}>Draft → Siap Diagnosa</div>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          style={{
            padding: '12px 22px', fontSize: 13.5, fontWeight: 800,
            border: 'none', borderRadius: 'var(--radius-sm)',
            background: saving ? 'var(--color-muted)' : 'var(--color-primary)',
            color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          {saving ? 'Menyimpan…' : '💾 Simpan Pemeriksaan'}
        </button>
      </div>
    </div>
  );
}
