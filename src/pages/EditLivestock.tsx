/**
 * EditLivestock — Full edit page for a single livestock profile.
 *
 * Route: /livestock/:id/edit
 *
 * Rules:
 *  - Archived animals (Arsip) → read-only guard; edit form is NOT shown.
 *  - Di Kandang + Luar Kandang → full edit access.
 *  - Livestock UUID is never editable (shown read-only).
 *  - Weight/health/feeding/reproduction history is never editable here.
 *  - Batch changes go through the normal batchData.ts APIs.
 *  - Every save (even no-op) appends an immutable edit record.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLivestock } from '../hooks/useLivestock';
import { updateLivestockProfile, changeBatchMembership } from '../services/livestockService';
import type { DbHealthStatus, DbSex, LivestockPatchInput, LivestockExtendedMetadataCreateInput } from '../types/livestock';
import { getLivestock, getOwnershipHistory, LIVESTOCK_DB } from '../data/livestockData';
import { getLivestockStatus } from '../data/transferData';
import { getActiveLivestockBatches } from '../data/batchData';
import { MASTER_SPECIES, RAS_OPTIONS } from '../data/speciesData';
import {
  getExtendedMetadata,
  getEditHistory,
  updateLivestock,
  computeAge,
  type LivestockExtendedMetadata,
  type CoreLivestockUpdate,
} from '../data/livestockEditData';

import { PROGRAM_OPTIONS } from '../data/programData';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS    = ['Sehat', 'Sakit', 'Dalam Perawatan', 'Karantina', 'Pemantauan'];
const BREED_CAT_OPTIONS = ['Fullblood (FB)', 'Purebred (PB)', 'Cross', 'F1', 'F2', 'F3', 'F4', 'Lainnya'];
const HORN_OPTIONS      = ['Tidak Bertanduk', 'Bertanduk Kecil', 'Bertanduk Sedang', 'Bertanduk Besar', 'Lainnya'];
const TAIL_OPTIONS      = ['Ekor Tipis', 'Ekor Gemuk', 'Ekor Panjang', 'Ekor Pendek', 'Lainnya'];
const FREE_TEXT_BREEDS  = new Set(['Kerbau', 'Kuda', 'Babi']);
const EDITED_BY         = 'Pemilik';

// ── Shared form primitives (mirrors AddLivestock.tsx) ─────────────────────────

function SectionCard({ title, icon, children }: { title: string; icon?: string; children: React.ReactNode }) {
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
        display: 'flex', alignItems: 'center', gap: 7,
      }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '16px 16px 8px' }}>{children}</div>
    </div>
  );
}

function FG({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return <div style={{ marginBottom: last ? 12 : 18 }}>{children}</div>;
}

function FL({ children, htmlFor, required }: { children: React.ReactNode; htmlFor?: string; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>
      {children}
      {required && <span style={{ color: '#c62828', marginLeft: 3 }}>*</span>}
    </label>
  );
}

function Opt() {
  return <span style={{ fontWeight: 400, color: 'var(--color-muted)', fontSize: 12 }}> (Opsional)</span>;
}

function HT({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.5 }}>{children}</p>;
}

function ErrMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p style={{ margin: '5px 0 0', fontSize: 11, color: '#c62828', fontWeight: 600 }}>⚠ {msg}</p>;
}

// ── Shared input style ────────────────────────────────────────────────────────

const INPUT: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '10px 12px', borderRadius: 8,
  border: '1.5px solid var(--color-border)',
  fontSize: 13, color: 'var(--color-text)',
  background: 'var(--color-bg)',
};

const INPUT_ERR: React.CSSProperties = { ...INPUT, borderColor: '#c62828' };

const SELECT = INPUT;

const READONLY_INPUT: React.CSSProperties = {
  ...INPUT, background: '#f5f5f5', color: 'var(--color-muted)',
};

function formatTs(iso: string) {
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EditLivestock() {
  const { id = '' } = useParams();
  const navigate     = useNavigate();
  // Ensures LIVESTOCK_DB/BATCH_DB are populated from Supabase on hard-refresh / deep link.
  const { isLoading, batches } = useLivestock();

  // ── Initialise from data layer ───────────────────────────────────────────

  const lv          = getLivestock(id);
  const status      = getLivestockStatus(id);
  const isArchived  = status === 'Arsip';
  const ext         = getExtendedMetadata(id);
  const history     = getEditHistory(id);
  const ownership   = getOwnershipHistory(id);
  const activeBatch = getActiveLivestockBatches(id)[0] ?? null;
  const exists      = !!LIVESTOCK_DB[id];

  // ── Form state ───────────────────────────────────────────────────────────

  // Identity
  const [name,         setName]         = useState(lv.name ?? '');
  const [earTag,       setEarTag]       = useState(ext.earTag ?? '');
  const [internalCode, setInternalCode] = useState(ext.internalCode ?? '');
  const [notes,        setNotes]        = useState(ext.notes ?? '');

  // Classification
  const [type,          setType]          = useState(lv.type);
  const [ras,           setRas]           = useState(() => {
    const opts = RAS_OPTIONS[lv.type] ?? [];
    return opts.includes(lv.ras) ? lv.ras : (FREE_TEXT_BREEDS.has(lv.type) ? lv.ras : '');
  });
  const [rasCustom,    setRasCustom]     = useState(() => {
    const opts = RAS_OPTIONS[lv.type] ?? [];
    return opts.includes(lv.ras) ? '' : lv.ras;
  });
  const [breedCategory, setBreedCategory] = useState(ext.breedCategory ?? '');
  const [kelamin,       setKelamin]       = useState(lv.kelamin);
  const [program,       setProgram]       = useState(lv.program);

  // Birth
  const [birthDate,          setBirthDate]          = useState(() => {
    // Convert Indonesian date label to ISO if possible; keep raw if already ISO
    const d = lv.birthDate;
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    return ''; // non-ISO: leave blank so user fills it in
  });
  const [birthDateEstimated, setBirthDateEstimated] = useState(lv.birthDateEstimated);
  const [birthWeight,        setBirthWeight]        = useState(() => {
    const w = parseFloat(lv.birthWeight);
    return isNaN(w) ? '' : String(w);
  });

  // Physical
  const [color,        setColor]        = useState(ext.color ?? '');
  const [horn,         setHorn]         = useState(ext.horn ?? '');
  const [tail,         setTail]         = useState(ext.tail ?? '');
  const [specialMarks, setSpecialMarks] = useState(ext.specialMarks ?? '');

  // Location
  const [location, setLocation] = useState(lv.location !== '—' ? lv.location : '');

  // Purchase
  const [purchaseDate,  setPurchaseDate]  = useState(ext.purchaseDate ?? '');
  const [purchasePrice, setPurchasePrice] = useState(ext.purchasePrice ?? '');
  const [supplier,      setSupplier]      = useState(ext.supplier ?? '');
  const [originFarm,    setOriginFarm]    = useState(ext.originFarm ?? '');

  // Birth extras
  const [siblingCount,  setSiblingCount]  = useState(ext.siblingCount ?? '');

  // Cross breed
  const [crossBreed,    setCrossBreed]    = useState(ext.crossBreed ?? '');

  // Batch change
  // 'current' = no change, '' = remove, batchId = add/change to that batch
  const [batchAction, setBatchAction] = useState<'current' | 'remove' | string>('current');

  // Status
  const [healthStatus, setHealthStatus] = useState(lv.status);

  // Meta
  const [editReason,  setEditReason]  = useState('');
  const [saveState,   setSaveState]   = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveError,   setSaveError]   = useState<string | null>(null);
  const [isDirty,     setIsDirty]     = useState(false);
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [showHistory, setShowHistory] = useState(false);

  // Track dirty state
  const markDirty = useCallback(() => setIsDirty(true), []);

  // beforeunload warning
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // ── Derived values ────────────────────────────────────────────────────────

  const isFreeTextBreed = FREE_TEXT_BREEDS.has(type);
  const rasOptions      = RAS_OPTIONS[type] ?? [];
  const effectiveRas    = isFreeTextBreed
    ? rasCustom.trim()
    : (ras === 'Lainnya' ? rasCustom.trim() : ras);

  // Active batches excluding current for the "change batch" picker — sourced from hook (Supabase).
  const availableBatches = batches
    .filter((b) => b.status === 'Aktif' && b.id !== activeBatch?.batch.id);

  // ── Validation ────────────────────────────────────────────────────────────

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim() && name.trim() === '') {
      // name is optional — skip required check
    }
    if (!type) e.type = 'Jenis ternak wajib dipilih.';
    if (!kelamin) e.kelamin = 'Jenis kelamin wajib dipilih.';
    if (!effectiveRas) e.ras = 'Ras wajib diisi.';
    if (!program) e.program = 'Program wajib dipilih.';
    if (!healthStatus) e.healthStatus = 'Status kesehatan wajib dipilih.';

    if (birthDate) {
      const d = new Date(birthDate);
      if (isNaN(d.getTime())) {
        e.birthDate = 'Tanggal lahir tidak valid.';
      } else if (d > new Date()) {
        e.birthDate = 'Tanggal lahir tidak boleh di masa depan.';
      }
    }

    if (birthWeight) {
      const w = parseFloat(birthWeight);
      if (isNaN(w) || w <= 0) e.birthWeight = 'Berat lahir harus berupa angka positif.';
    }

    if (purchasePrice) {
      const p = Number(purchasePrice.replace(/[^\d]/g, ''));
      if (isNaN(p) || p < 0) e.purchasePrice = 'Harga beli harus berupa angka.';
    }

    if (purchaseDate) {
      const d = new Date(purchaseDate);
      if (isNaN(d.getTime())) e.purchaseDate = 'Tanggal beli tidak valid.';
    }

    if (earTag.length > 30) e.earTag = 'Tag telinga maks. 30 karakter.';
    if (internalCode.length > 30) e.internalCode = 'Kode internal maks. 30 karakter.';
    if (name.length > 60) e.name = 'Nama maks. 60 karakter.';
    if (location.length > 100) e.location = 'Lokasi maks. 100 karakter.';

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!validate()) return;

    setSaveState('saving');
    setSaveError(null);

    try {
      // ── Batch changes (persist to Supabase via service) ────────────────────
      if (batchAction === 'remove' && activeBatch) {
        const batchResult = await changeBatchMembership(
          id,
          activeBatch.batch.id,
          null,
          'Diperbarui melalui halaman Edit Ternak',
        );
        if (!batchResult.ok) throw new Error(batchResult.error);
      } else if (typeof batchAction === 'string' && batchAction !== 'current' && batchAction !== 'remove') {
        // Add/change batch
        const batchResult = await changeBatchMembership(
          id,
          activeBatch?.batch.id ?? null,
          batchAction,
          'Pindah batch melalui halaman Edit Ternak',
        );
        if (!batchResult.ok) throw new Error(batchResult.error);
      }

      // ── Core update ────────────────────────────────────────────────────────
      const core: CoreLivestockUpdate = {
        name:               name.trim() || null,
        type,
        ras:                effectiveRas,
        kelamin,
        birthDate:          birthDate || '—',
        birthDateEstimated,
        birthWeight:        birthWeight ? `${parseFloat(birthWeight)}` : '—',
        program,
        status:             healthStatus,
        location:           location.trim() || '—',
      };

      const extended: Partial<LivestockExtendedMetadata> = {
        earTag:        earTag.trim()        || null,
        internalCode:  internalCode.trim()  || null,
        notes:         notes.trim()         || null,
        breedCategory: breedCategory        || null,
        crossBreed:    crossBreed.trim()    || null,
        color:         color.trim()         || null,
        horn:          horn                 || null,
        tail:          tail                 || null,
        specialMarks:  specialMarks.trim()  || null,
        purchaseDate:  purchaseDate         || null,
        purchasePrice: purchasePrice.trim() || null,
        supplier:      supplier.trim()      || null,
        originFarm:    originFarm.trim()    || null,
        siblingCount:  siblingCount.trim()  || null,
      };

      // ── Supabase persist via service (primary SSOT) ──────────────────────
      const healthDb: DbHealthStatus =
        healthStatus === 'Sehat' ? 'Sehat'
        : healthStatus === 'Sakit' ? 'Sakit'
        : 'Pemantauan';
      const sexDb: DbSex | null =
        kelamin === 'Jantan' ? 'Jantan'
        : kelamin === 'Betina' ? 'Betina'
        : null;
      const patch: LivestockPatchInput = {
        name:                 name.trim() || null,
        breed:                effectiveRas || null,
        sex:                  sexDb,
        birth_date:           /^\d{4}-\d{2}-\d{2}$/.test(birthDate) ? birthDate : null,
        birth_date_estimated: birthDateEstimated,
        birth_weight_kg:      birthWeight ? (parseFloat(birthWeight) || null) : null,
        health_status:        healthDb,
        location_detail:      location.trim() || null,
        program:              program || null,
      };
      const extInput: LivestockExtendedMetadataCreateInput = {
        ear_tag:        earTag.trim()        || null,
        internal_code:  internalCode.trim()  || null,
        notes:          notes.trim()         || null,
        breed_category: breedCategory        || null,
        cross_breed:    crossBreed.trim()    || null,
        color:          color.trim()         || null,
        horn:           horn                 || null,
        tail:           tail                 || null,
        special_marks:  specialMarks.trim()  || null,
        purchase_date:  purchaseDate         || null,
        purchase_price: purchasePrice ? (parseFloat(purchasePrice) || null) : null,
        supplier:       supplier.trim()      || null,
        origin_farm:    originFarm.trim()    || null,
        sibling_count:  siblingCount ? (parseInt(siblingCount, 10) || null) : null,
      };
      const profileResult = await updateLivestockProfile(id, patch, extInput);
      if (!profileResult.ok) throw new Error(profileResult.error);

      // ── In-memory bridge update (immediate UI until next useLivestock fetch) ──
      updateLivestock(id, core, extended, EDITED_BY, editReason.trim() || null);

      setSaveState('success');
      setIsDirty(false);

      // Navigate back after brief success display
      setTimeout(() => navigate(`/livestock/${id}`, { replace: true }), 1500);

    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.');
      setSaveState('error');
    }
  }

  function handleCancel() {
    if (isDirty) {
      if (!window.confirm('Anda memiliki perubahan yang belum disimpan. Yakin ingin keluar?')) return;
    }
    navigate(`/livestock/${id}`);
  }

  // ── Species change handler ────────────────────────────────────────────────

  function handleTypeChange(newType: string) {
    setType(newType);
    setRas('');
    setRasCustom('');
    markDirty();
  }

  // ── Supabase loading guard ────────────────────────────────────────────────
  // On hard-refresh / deep-link to /livestock/:id/edit, isLoading stays true
  // until useLivestock() finishes populating LIVESTOCK_DB.
  if (isLoading && !exists) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 36 }}>⏳</span>
        <div style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 600 }}>Memuat data ternak...</div>
      </div>
    );
  }

  // ── Not found guard ───────────────────────────────────────────────────────

  if (!exists) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>❓</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Ternak Tidak Ditemukan
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 20 }}>
          ID: {id}
        </div>
        <button type="button" onClick={() => navigate('/livestock')}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Kembali ke Daftar Ternak
        </button>
      </div>
    );
  }

  // ── Archive guard ─────────────────────────────────────────────────────────

  if (isArchived) {
    const currentOwner = ownership.find((o) => o.isCurrent);
    return (
      <div style={{ padding: '16px 16px 40px', maxWidth: 480, margin: '0 auto' }}>
        {/* Livestock header */}
        <div style={{
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: lv.typeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
            {lv.typeIcon}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)' }}>
              {lv.name ?? <span style={{ fontStyle: 'italic', color: 'var(--color-muted)' }}>Tanpa Nama</span>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'monospace', marginTop: 2 }}>{lv.id}</div>
          </div>
        </div>

        {/* Archive notice */}
        <div style={{ background: '#fff3e0', border: '1.5px solid #ff9800', borderRadius: 'var(--radius-md)', padding: '16px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>🔒</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#e65100', marginBottom: 6 }}>
                Ternak Diarsipkan — Hanya Baca
              </div>
              <div style={{ fontSize: 12, color: '#8d4000', lineHeight: 1.5 }}>
                Ternak yang diarsipkan tidak dapat diedit. Semua data tersimpan dan dapat dilihat, tetapi tidak ada perubahan yang diizinkan.
              </div>
            </div>
          </div>
        </div>

        {/* Read-only data summary */}
        <SectionCard title="Data Ternak" icon="📋">
          {[
            ['Jenis Ternak', lv.type],
            ['Ras', lv.ras],
            ['Jenis Kelamin', lv.kelamin],
            ['Tanggal Lahir', lv.birthDate],
            ['Umur', lv.age],
            ['Program', lv.program],
            ['Status Kesehatan', lv.status],
            ['Lokasi Terakhir', lv.location],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
              <span style={{ color: 'var(--color-muted)' }}>{label}</span>
              <span style={{ fontWeight: 600, color: 'var(--color-text)', textAlign: 'right', maxWidth: '60%' }}>{val || '—'}</span>
            </div>
          ))}
          {currentOwner && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13 }}>
              <span style={{ color: 'var(--color-muted)' }}>Pemilik</span>
              <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{currentOwner.owner}</span>
            </div>
          )}
        </SectionCard>

        {/* Edit history */}
        {history.length > 0 && (
          <SectionCard title="Riwayat Perubahan" icon="📝">
            {history.slice(0, 5).map((rec) => (
              <div key={rec.id} style={{ paddingBottom: 12, borderBottom: '1px solid var(--color-border)', marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 4 }}>
                  {formatTs(rec.editedAt)} · {rec.editedBy}
                  {rec.reason && <> · <em>{rec.reason}</em></>}
                </div>
                {rec.changes.map((c, i) => (
                  <div key={i} style={{ fontSize: 11, color: 'var(--color-text)', lineHeight: 1.5 }}>
                    <strong>{c.field}:</strong> {c.before ?? '—'} → {c.after ?? '—'}
                  </div>
                ))}
                {rec.changes.length === 0 && (
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', fontStyle: 'italic' }}>Tidak ada perubahan</div>
                )}
              </div>
            ))}
          </SectionCard>
        )}

        <button type="button" onClick={() => navigate(`/livestock/${id}`)}
          style={{ width: '100%', padding: '13px', borderRadius: 8, border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          ← Kembali ke Profil
        </button>
      </div>
    );
  }

  // ── Edit form ─────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 12px 40px' }}>

      {/* Identity header card */}
      <div style={{
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ width: 46, height: 46, borderRadius: '50%', background: lv.typeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
          {lv.typeIcon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {lv.name ?? <span style={{ fontStyle: 'italic', color: 'var(--color-muted)', fontWeight: 400 }}>Tanpa Nama</span>}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'monospace', marginTop: 2 }}>{lv.id}</div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
          background: status === 'Di Kandang' ? '#e8f5ee' : '#fff8e1',
          color:      status === 'Di Kandang' ? '#1b7a43' : '#f57f17',
          flexShrink: 0,
        }}>
          {status}
        </span>
      </div>

      {/* Dirty warning banner */}
      {isDirty && saveState === 'idle' && (
        <div style={{ background: '#fff8e1', border: '1px solid #fbc02d', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#7a5500', fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>⚠️</span>
          <span>Anda memiliki perubahan yang belum disimpan.</span>
        </div>
      )}

      {/* Success banner */}
      {saveState === 'success' && (
        <div style={{ background: '#e8f5ee', border: '1px solid #66bb6a', borderRadius: 8, padding: '12px 16px', marginBottom: 12, fontSize: 13, color: '#1b5e20', fontWeight: 700, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>✅</span>
          <span>Data berhasil disimpan. Kembali ke profil...</span>
        </div>
      )}

      {/* Error banner */}
      {saveState === 'error' && saveError && (
        <div style={{ background: '#ffebee', border: '1px solid #e57373', borderRadius: 8, padding: '12px 16px', marginBottom: 12, fontSize: 12, color: '#b71c1c', fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>❌</span>
          <span>{saveError}</span>
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()} noValidate>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 1 — IDENTITAS
        ══════════════════════════════════════════════════════════════════ */}
        <SectionCard title="Identitas" icon="🏷️">

          {/* ID Ternak — read-only */}
          <FG>
            <FL htmlFor="edit-id">ID Ternak</FL>
            <input id="edit-id" type="text" value={lv.id} readOnly
              style={{ ...READONLY_INPUT, fontFamily: 'monospace' }} />
            <HT>ID Ternak tidak dapat diubah setelah pendaftaran.</HT>
          </FG>

          {/* Nama */}
          <FG>
            <FL htmlFor="edit-name">Nama / Panggilan<Opt /></FL>
            <input id="edit-name" type="text"
              value={name}
              maxLength={60}
              placeholder="Contoh: Si Putih, Sultan 2"
              style={errors.name ? INPUT_ERR : INPUT}
              onChange={(e) => { setName(e.target.value); markDirty(); }} />
            <ErrMsg msg={errors.name} />
          </FG>

          {/* Tag Telinga */}
          <FG>
            <FL htmlFor="edit-eartag">Tag Telinga (Ear Tag)<Opt /></FL>
            <input id="edit-eartag" type="text"
              value={earTag}
              maxLength={30}
              placeholder="Contoh: ET-2024-001"
              style={errors.earTag ? INPUT_ERR : INPUT}
              onChange={(e) => { setEarTag(e.target.value); markDirty(); }} />
            <ErrMsg msg={errors.earTag} />
          </FG>

          {/* Kode Internal */}
          <FG>
            <FL htmlFor="edit-intcode">Kode Internal<Opt /></FL>
            <input id="edit-intcode" type="text"
              value={internalCode}
              maxLength={30}
              placeholder="Contoh: F-2024-A-003"
              style={errors.internalCode ? INPUT_ERR : INPUT}
              onChange={(e) => { setInternalCode(e.target.value); markDirty(); }} />
            <HT>Kode peternakan internal untuk rekap sendiri.</HT>
            <ErrMsg msg={errors.internalCode} />
          </FG>

          {/* Catatan */}
          <FG last>
            <FL htmlFor="edit-notes">Catatan<Opt /></FL>
            <textarea id="edit-notes"
              value={notes} rows={3}
              placeholder="Catatan tambahan tentang ternak ini..."
              style={{ ...INPUT, resize: 'vertical', fontFamily: 'inherit' }}
              onChange={(e) => { setNotes(e.target.value); markDirty(); }} />
          </FG>
        </SectionCard>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 2 — KLASIFIKASI
        ══════════════════════════════════════════════════════════════════ */}
        <SectionCard title="Klasifikasi" icon="📂">

          {/* Jenis Ternak */}
          <FG>
            <FL required>Jenis Ternak</FL>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {MASTER_SPECIES.map((sp) => {
                const active = type === sp.value;
                return (
                  <button key={sp.value} type="button" onClick={() => handleTypeChange(sp.value)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      padding: '11px 6px', borderRadius: 'var(--radius-md)',
                      border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                      background: active ? 'var(--color-primary-light)' : 'var(--color-surface)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                    <span style={{ fontSize: 24, lineHeight: 1 }}>{sp.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? 'var(--color-primary)' : 'var(--color-muted)' }}>{sp.label}</span>
                  </button>
                );
              })}
            </div>
            <ErrMsg msg={errors.type} />
          </FG>

          {/* Ras */}
          <FG>
            <FL htmlFor="edit-ras" required>Ras</FL>
            {isFreeTextBreed ? (
              <input id="edit-ras" type="text"
                value={rasCustom} placeholder="Masukkan nama ras"
                style={errors.ras ? INPUT_ERR : INPUT}
                onChange={(e) => { setRasCustom(e.target.value); markDirty(); }} />
            ) : (
              <>
                <select id="edit-ras" value={ras}
                  style={errors.ras ? INPUT_ERR : SELECT}
                  onChange={(e) => { setRas(e.target.value); setRasCustom(''); markDirty(); }}>
                  <option value="">— Pilih Ras —</option>
                  {rasOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                {ras === 'Lainnya' && (
                  <input type="text" value={rasCustom} placeholder="Masukkan nama ras"
                    style={{ ...INPUT, marginTop: 8 }}
                    onChange={(e) => { setRasCustom(e.target.value); markDirty(); }} />
                )}
              </>
            )}
            <ErrMsg msg={errors.ras} />
          </FG>

          {/* Kategori Ras */}
          <FG>
            <FL htmlFor="edit-breed-cat">Kategori Ras<Opt /></FL>
            <select id="edit-breed-cat" value={breedCategory}
              style={SELECT}
              onChange={(e) => { setBreedCategory(e.target.value); markDirty(); }}>
              <option value="">— Pilih Kategori —</option>
              {BREED_CAT_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <HT>Contoh: Fullblood, Purebred, F1 Silangan, Cross.</HT>
          </FG>

          {/* Silangan Dengan */}
          <FG>
            <FL htmlFor="edit-crossbreed">Silangan Dengan<Opt /></FL>
            <input id="edit-crossbreed" type="text"
              value={crossBreed}
              placeholder="Contoh: Limousin, Boer, Saanen"
              style={INPUT}
              onChange={(e) => { setCrossBreed(e.target.value); markDirty(); }} />
            <HT>Diisi apabila ternak merupakan hasil persilangan dengan ras lain.</HT>
          </FG>

          {/* Jenis Kelamin */}
          <FG>
            <FL required>Jenis Kelamin</FL>
            <div style={{ display: 'flex', gap: 10 }}>
              {['Jantan', 'Betina'].map((opt) => {
                const active = kelamin === opt;
                return (
                  <button key={opt} type="button"
                    onClick={() => { setKelamin(opt); markDirty(); }}
                    style={{
                      flex: 1, padding: '12px 8px', borderRadius: 8,
                      border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                      background: active ? 'var(--color-primary-light)' : 'var(--color-surface)',
                      color: active ? 'var(--color-primary)' : 'var(--color-text)',
                      fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer',
                    }}>
                    {opt === 'Jantan' ? '♂ Jantan' : '♀ Betina'}
                  </button>
                );
              })}
            </div>
            <ErrMsg msg={errors.kelamin} />
          </FG>

          {/* Program */}
          <FG last>
            <FL htmlFor="edit-program" required>Program</FL>
            <select id="edit-program" value={program}
              style={errors.program ? INPUT_ERR : SELECT}
              onChange={(e) => { setProgram(e.target.value); markDirty(); }}>
              <option value="">— Pilih Program —</option>
              {PROGRAM_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <ErrMsg msg={errors.program} />
          </FG>
        </SectionCard>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 3 — KELAHIRAN
        ══════════════════════════════════════════════════════════════════ */}
        <SectionCard title="Kelahiran" icon="🐣">

          {/* Tanggal Lahir */}
          <FG>
            <FL htmlFor="edit-birthdate">Tanggal Lahir<Opt /></FL>
            <input id="edit-birthdate" type="date"
              value={birthDate}
              style={errors.birthDate ? INPUT_ERR : INPUT}
              onChange={(e) => { setBirthDate(e.target.value); markDirty(); }} />
            {birthDate && (
              <HT>Umur saat ini: {computeAge(birthDate).age}</HT>
            )}
            <ErrMsg msg={errors.birthDate} />
          </FG>

          {/* Perkiraan Tanggal */}
          <FG>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--color-text)' }}>
              <input type="checkbox" checked={birthDateEstimated}
                style={{ accentColor: 'var(--color-primary)', width: 16, height: 16 }}
                onChange={(e) => { setBirthDateEstimated(e.target.checked); markDirty(); }} />
              <span>Tanggal lahir ini adalah <strong>perkiraan</strong></span>
            </label>
          </FG>

          {/* Berat Lahir */}
          <FG>
            <FL htmlFor="edit-birthweight">Berat Lahir (kg)<Opt /></FL>
            <input id="edit-birthweight" type="number"
              value={birthWeight} min="0" step="0.1"
              placeholder="Contoh: 3.5"
              style={errors.birthWeight ? INPUT_ERR : INPUT}
              onChange={(e) => { setBirthWeight(e.target.value); markDirty(); }} />
            <ErrMsg msg={errors.birthWeight} />
          </FG>

          {/* Jumlah Saudara Lahir */}
          <FG last>
            <FL htmlFor="edit-siblingcount">Jumlah Saudara Lahir<Opt /></FL>
            <input id="edit-siblingcount" type="number"
              value={siblingCount} min="0" step="1"
              placeholder="Contoh: 2"
              style={INPUT}
              onChange={(e) => { setSiblingCount(e.target.value); markDirty(); }} />
            <HT>Jumlah anak yang lahir bersamaan dalam satu kelahiran.</HT>
          </FG>
        </SectionCard>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 4 — CIRI FISIK
        ══════════════════════════════════════════════════════════════════ */}
        <SectionCard title="Ciri Fisik" icon="🔍">

          {/* Warna */}
          <FG>
            <FL htmlFor="edit-color">Warna Tubuh<Opt /></FL>
            <input id="edit-color" type="text"
              value={color} placeholder="Contoh: Hitam, Putih, Coklat kemerahan"
              style={INPUT}
              onChange={(e) => { setColor(e.target.value); markDirty(); }} />
          </FG>

          {/* Tanduk */}
          <FG>
            <FL htmlFor="edit-horn">Tanduk<Opt /></FL>
            <select id="edit-horn" value={horn} style={SELECT}
              onChange={(e) => { setHorn(e.target.value); markDirty(); }}>
              <option value="">— Pilih —</option>
              {HORN_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </FG>

          {/* Ekor */}
          <FG>
            <FL htmlFor="edit-tail">Ekor<Opt /></FL>
            <select id="edit-tail" value={tail} style={SELECT}
              onChange={(e) => { setTail(e.target.value); markDirty(); }}>
              <option value="">— Pilih —</option>
              {TAIL_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </FG>

          {/* Tanda Khusus */}
          <FG last>
            <FL htmlFor="edit-specialmarks">Tanda Khusus<Opt /></FL>
            <textarea id="edit-specialmarks" value={specialMarks} rows={2}
              placeholder="Contoh: Bercak putih di telinga kanan, tanda lahir di punggung..."
              style={{ ...INPUT, resize: 'vertical', fontFamily: 'inherit' }}
              onChange={(e) => { setSpecialMarks(e.target.value); markDirty(); }} />
          </FG>
        </SectionCard>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 5 — LOKASI & KANDANG
        ══════════════════════════════════════════════════════════════════ */}
        <SectionCard title="Lokasi & Kandang" icon="🏡">
          <FG last>
            <FL htmlFor="edit-location">Lokasi Kandang<Opt /></FL>
            {status === 'Luar Kandang' && (
              <div style={{ background: '#fff8e1', border: '1px solid #fbc02d', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#7a5500' }}>
                ⚠️ Ternak sedang <strong>di luar kandang</strong>. Lokasi yang diatur di sini akan menjadi lokasi asal saat ternak kembali.
              </div>
            )}
            <input id="edit-location" type="text"
              value={location}
              maxLength={100}
              placeholder="Contoh: Kandang 3, Blok B"
              style={errors.location ? INPUT_ERR : INPUT}
              onChange={(e) => { setLocation(e.target.value); markDirty(); }} />
            <HT>Format: "Kandang N, Blok X" atau deskripsi bebas.</HT>
            <ErrMsg msg={errors.location} />
          </FG>
        </SectionCard>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 6 — INFORMASI PEMBELIAN
        ══════════════════════════════════════════════════════════════════ */}
        <SectionCard title="Informasi Pembelian" icon="🛒">

          {/* Pemasok / Penjual */}
          <FG>
            <FL htmlFor="edit-supplier">Pemasok / Penjual<Opt /></FL>
            <input id="edit-supplier" type="text"
              value={supplier}
              placeholder="Contoh: Pak Ahmad, UD Ternak Jaya"
              style={INPUT}
              onChange={(e) => { setSupplier(e.target.value); markDirty(); }} />
          </FG>

          {/* Asal Daerah / Peternakan */}
          <FG>
            <FL htmlFor="edit-originfarm">Asal Daerah / Peternakan<Opt /></FL>
            <input id="edit-originfarm" type="text"
              value={originFarm}
              placeholder="Contoh: Garut, Jawa Barat"
              style={INPUT}
              onChange={(e) => { setOriginFarm(e.target.value); markDirty(); }} />
            <HT>Asal biologis atau asal peternakan ternak (berbeda dengan penjual).</HT>
          </FG>

          {/* Tanggal Beli */}
          <FG>
            <FL htmlFor="edit-purchasedate">Tanggal Pembelian<Opt /></FL>
            <input id="edit-purchasedate" type="date"
              value={purchaseDate}
              style={errors.purchaseDate ? INPUT_ERR : INPUT}
              onChange={(e) => { setPurchaseDate(e.target.value); markDirty(); }} />
            <ErrMsg msg={errors.purchaseDate} />
          </FG>

          {/* Harga Beli */}
          <FG last>
            <FL htmlFor="edit-price">Harga Beli (Rp)<Opt /></FL>
            <input id="edit-price" type="text"
              value={purchasePrice}
              placeholder="Contoh: 3500000"
              style={errors.purchasePrice ? INPUT_ERR : INPUT}
              onChange={(e) => { setPurchasePrice(e.target.value.replace(/[^\d]/g, '')); markDirty(); }} />
            {purchasePrice && (
              <HT>Rp {Number(purchasePrice).toLocaleString('id-ID')}</HT>
            )}
            <ErrMsg msg={errors.purchasePrice} />
          </FG>
        </SectionCard>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 7 — BATCH
        ══════════════════════════════════════════════════════════════════ */}
        <SectionCard title="Batch / Kelompok" icon="📦">

          {/* Current batch display */}
          {activeBatch ? (
            <div style={{ background: '#f7faf8', border: '1px solid var(--color-border)', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>Batch Aktif</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{activeBatch.batch.label}</div>
              {activeBatch.batch.name && (
                <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>{activeBatch.batch.name}</div>
              )}
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 3 }}>Bergabung: {activeBatch.membership.joinDate}</div>
            </div>
          ) : (
            <div style={{ background: '#f5f5f5', border: '1px dashed var(--color-border)', borderRadius: 8, padding: '12px 14px', marginBottom: 14, textAlign: 'center', fontSize: 12, color: 'var(--color-muted)' }}>
              Tidak dalam batch aktif
            </div>
          )}

          {/* Batch action */}
          <FG last>
            <FL htmlFor="edit-batch">Ubah Batch<Opt /></FL>
            <select id="edit-batch" value={batchAction} style={SELECT}
              onChange={(e) => { setBatchAction(e.target.value); markDirty(); }}>
              <option value="current">— Tidak ada perubahan —</option>
              {activeBatch && <option value="remove">Hapus dari Batch Aktif</option>}
              {availableBatches.length > 0 && (
                <optgroup label="Pindah ke Batch Aktif">
                  {availableBatches.map((b) => (
                    <option key={b.id} value={b.id}>{b.label}{b.name ? ` — ${b.name}` : ''}</option>
                  ))}
                </optgroup>
              )}
              {!activeBatch && availableBatches.length === 0 && (
                <option disabled value="">Tidak ada batch aktif tersedia</option>
              )}
            </select>
            <HT>Untuk pengelolaan batch lebih lanjut, gunakan modul Batch.</HT>
          </FG>
        </SectionCard>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 8 — STATUS KESEHATAN
        ══════════════════════════════════════════════════════════════════ */}
        <SectionCard title="Status Kesehatan" icon="🩺">

          <FG>
            <FL required>Status</FL>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {STATUS_OPTIONS.map((opt) => {
                const active = healthStatus === opt;
                const CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
                  'Sehat':             { icon: '✅', color: '#1b7a43', bg: '#e8f5ee' },
                  'Sakit':             { icon: '🤒', color: '#c62828', bg: '#ffebee' },
                  'Dalam Perawatan':   { icon: '💊', color: '#0277bd', bg: '#e3f2fd' },
                  'Karantina':         { icon: '🔶', color: '#f57f17', bg: '#fff8e1' },
                  'Pemantauan':        { icon: '👁️', color: '#7b1fa2', bg: '#f3e5f5' },
                };
                const cfg = CONFIG[opt] ?? { icon: '•', color: 'var(--color-muted)', bg: 'var(--color-surface)' };
                return (
                  <button key={opt} type="button"
                    onClick={() => { setHealthStatus(opt); markDirty(); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 14px', borderRadius: 8, cursor: 'pointer',
                      border: active ? `2px solid ${cfg.color}` : '1.5px solid var(--color-border)',
                      background: active ? cfg.bg : 'var(--color-surface)',
                      textAlign: 'left',
                    }}>
                    <span style={{ fontSize: 18, lineHeight: 1 }}>{cfg.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? cfg.color : 'var(--color-text)' }}>{opt}</span>
                    {active && <span style={{ marginLeft: 'auto', fontSize: 14, color: cfg.color }}>✓</span>}
                  </button>
                );
              })}
            </div>
            <ErrMsg msg={errors.healthStatus} />
          </FG>

          {/* Current owner (read-only) */}
          {ownership.length > 0 && (() => {
            const owner = ownership.find((o) => o.isCurrent) ?? ownership[ownership.length - 1];
            return (
              <FG last>
                <FL>Kepemilikan Saat Ini</FL>
                <div style={{ background: '#f7faf8', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{owner.owner}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
                    Sejak {owner.startDate} · {owner.method}
                  </div>
                </div>
                <HT>Untuk mengubah kepemilikan, gunakan modul Mutasi / Transfer.</HT>
              </FG>
            );
          })()}
        </SectionCard>

        {/* ══════════════════════════════════════════════════════════════════
            ALASAN PERUBAHAN
        ══════════════════════════════════════════════════════════════════ */}
        <SectionCard title="Alasan Perubahan" icon="📝">
          <FG last>
            <FL htmlFor="edit-reason">Alasan Edit<Opt /></FL>
            <input id="edit-reason" type="text"
              value={editReason}
              placeholder="Contoh: Koreksi data, Pembaruan kondisi, Hasil pemeriksaan..."
              style={INPUT}
              onChange={(e) => { setEditReason(e.target.value); markDirty(); }} />
            <HT>Alasan akan tersimpan di riwayat perubahan.</HT>
          </FG>
        </SectionCard>

        {/* ── Bottom action buttons ────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          <button type="button"
            disabled={saveState === 'saving' || saveState === 'success'}
            onClick={handleSave}
            style={{
              background: saveState === 'saving' ? '#9e9e9e' : 'var(--color-primary)',
              color: '#fff', borderRadius: 'var(--radius-sm)',
              padding: '13px', fontSize: 15, fontWeight: 700,
              border: 'none', cursor: saveState === 'saving' ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            {saveState === 'saving' ? (
              <><span>⏳</span> Menyimpan...</>
            ) : saveState === 'success' ? (
              <><span>✅</span> Tersimpan!</>
            ) : (
              'Simpan Perubahan'
            )}
          </button>

          <button type="button" onClick={handleCancel}
            style={{
              background: 'var(--color-surface)', color: 'var(--color-muted)',
              borderRadius: 'var(--radius-sm)', padding: '13px',
              fontSize: 15, fontWeight: 600, border: '1.5px solid var(--color-border)',
              cursor: 'pointer',
            }}>
            Batal
          </button>
        </div>

      </form>

      {/* ══════════════════════════════════════════════════════════════════════
          EDIT HISTORY (collapsible)
      ══════════════════════════════════════════════════════════════════════ */}
      {history.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button type="button"
            onClick={() => setShowHistory((v) => !v)}
            style={{
              width: '100%', padding: '11px 16px', borderRadius: 8,
              border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
              color: 'var(--color-primary)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
            <span>📋 Riwayat Perubahan ({history.length} edit)</span>
            <span>{showHistory ? '▲' : '▼'}</span>
          </button>

          {showHistory && (
            <div style={{
              background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
              borderRadius: 8, overflow: 'hidden', marginTop: 4,
            }}>
              {history.map((rec, ri) => (
                <div key={rec.id} style={{
                  padding: '12px 16px',
                  borderBottom: ri < history.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#e8f5ee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                      ✏️
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>
                        {rec.editedBy}
                        {rec.reason && <span style={{ fontWeight: 400, color: 'var(--color-muted)' }}> · <em>{rec.reason}</em></span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>
                        {formatTs(rec.editedAt)}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                      background: rec.changes.length > 0 ? '#e3f2fd' : '#f5f5f5',
                      color: rec.changes.length > 0 ? '#0277bd' : '#9e9e9e',
                      flexShrink: 0,
                    }}>
                      {rec.changes.length} perubahan
                    </span>
                  </div>

                  {/* Changes list */}
                  {rec.changes.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {rec.changes.map((c, ci) => (
                        <div key={ci} style={{
                          fontSize: 11, background: '#f7faf8',
                          borderRadius: 6, padding: '6px 10px',
                          borderLeft: '3px solid var(--color-primary)',
                        }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{c.field}:</span>
                          {' '}
                          <span style={{ color: '#c62828', textDecoration: 'line-through' }}>{c.before ?? '—'}</span>
                          {' → '}
                          <span style={{ color: '#1b7a43', fontWeight: 600 }}>{c.after ?? '—'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', fontStyle: 'italic', paddingLeft: 4 }}>
                      Tidak ada perubahan data pada sesi ini.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Spacer */}
      <div style={{ height: 24 }} />
    </div>
  );
}
