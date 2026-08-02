/**
 * TindakanKesehatan.tsx  (KH-004)
 * ─────────────────────────────────────────────────────────────────
 * Tindakan page — third step in the health workflow.
 * Route: /kesehatan-hewan/tindakan/:id  (id = diagnosaId)
 *
 * Workflow: Pemeriksaan → Diagnosa → [Tindakan] → Pengobatan / Kontrol → Selesai
 *
 * Features:
 *  - Add multiple tindakan items (from master list or custom)
 *  - Each item: nama, catatan, dilakukan oleh, tanggal, jam
 *  - After ≥1 item: prompt "Apakah menggunakan obat?"
 *  - On selesai → navigate to KH-005 (Ya) or KH-007 (Tidak)
 */

import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate }        from 'react-router-dom';
import { useLivestock }                  from '../hooks/useLivestock';
import { useWorkspace }                  from '../contexts/WorkspaceContext';
import { getTodayISO, getNowHHMM }       from '../utils/dateUtils';
import { recordTreatments }              from '../services/healthService';

import { getDiagnosa }          from '../data/diagnosaKesehatanData';
import { getPemeriksaan }       from '../data/pemeriksaanKesehatanData';
import {
  MASTER_TINDAKAN,
  createTindakanSesi,
  getTindakanSesiByDiagnosa,
  addTindakanItem,
  removeTindakanItem,
  setPakaiObat,
  finishTindakanSesi,
  getTindakanItemsBySesi,
  type TindakanItem,
  type TindakanSesi,
} from '../data/tindakanKesehatanData';

// ─── Style constants ──────────────────────────────────────────────────────────

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
  background: 'var(--color-bg)', color: 'var(--color-text)',
  fontSize: 13, fontWeight: 500, outline: 'none', boxSizing: 'border-box',
};
const INPUT_ERR: React.CSSProperties = { ...INPUT_STYLE, border: '1.5px solid var(--color-danger)' };
const TEXTAREA_STYLE: React.CSSProperties = { ...INPUT_STYLE, minHeight: 72, resize: 'vertical', lineHeight: 1.6 };
const SELECT_STYLE: React.CSSProperties = { ...INPUT_STYLE, cursor: 'pointer', appearance: 'none' as const };
const SELECT_ERR: React.CSSProperties  = { ...SELECT_STYLE, border: '1.5px solid var(--color-danger)' };

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', margin: '0 0 10px' }}>
        {title}
      </h2>
      <div style={{
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)',
      }}>
        {children}
      </div>
    </section>
  );
}

function FieldWrap({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '14px 16px 4px' }}>{children}</div>;
}

function FieldLabel({ children, htmlFor, optional, required }: {
  children: React.ReactNode; htmlFor?: string; optional?: boolean; required?: boolean;
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

// ─── Context banner ───────────────────────────────────────────────────────────

function ContextBanner({
  tanggal, petugas, diagnosaNama, mode,
}: {
  tanggal: string; petugas: string; diagnosaNama: string; mode: string;
}) {
  return (
    <div style={{
      background: 'var(--color-primary-light)', border: '1.5px solid var(--color-primary)',
      borderRadius: 'var(--radius-lg)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>🩺</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>Tindak Lanjut Diagnosa</span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
          background: 'var(--color-primary)', color: '#fff', marginLeft: 'auto',
        }}>
          {mode === 'individu' ? 'Individu' : 'Batch'}
        </span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
        {diagnosaNama}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
        <span style={{ fontSize: 12, color: 'var(--color-text)' }}>📅 <strong>{tanggal}</strong></span>
        <span style={{ fontSize: 12, color: 'var(--color-text)' }}>👤 <strong>{petugas}</strong></span>
      </div>
    </div>
  );
}

// ─── Added item card ──────────────────────────────────────────────────────────

function TindakanCard({
  item, index, onRemove,
}: {
  item: TindakanItem; index: number; onRemove: () => void;
}) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', padding: '12px 14px',
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      {/* Number badge */}
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{index + 1}</span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
          {item.namaTindakan}
        </div>
        {item.catatan && (
          <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: '0 0 4px', lineHeight: 1.5 }}>
            {item.catatan}
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 12px', marginTop: 4 }}>
          <span style={{ fontSize: 11.5, color: 'var(--color-text)' }}>
            👤 {item.dilakukanOleh}
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>
            📅 {item.tanggal} · ⏰ {item.jam}
          </span>
        </div>
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: '#ffebee', border: '1.5px solid #ef9a9a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 14, color: 'var(--color-danger)',
        }}
        title="Hapus tindakan"
      >
        ×
      </button>
    </div>
  );
}

// ─── Add Tindakan inline form ─────────────────────────────────────────────────

type TindakanDraft = {
  namaTindakan:  string;
  customNama:    string;
  catatan:       string;
  dilakukanOleh: string;
  tanggal:       string;
  jam:           string;
};

function emptyDraft(): TindakanDraft {
  return {
    namaTindakan:  '',
    customNama:    '',
    catatan:       '',
    dilakukanOleh: '',
    tanggal:       getTodayISO(),
    jam:           getNowHHMM(),
  };
}

function AddTindakanForm({
  onAdd,
  onCancel,
  showCancel,
}: {
  onAdd: (draft: TindakanDraft) => void;
  onCancel?: () => void;
  showCancel: boolean;
}) {
  const [draft,     setDraft]     = useState<TindakanDraft>(emptyDraft);
  const [submitted, setSubmitted] = useState(false);

  const isCustom = draft.namaTindakan === 'Tindakan Lainnya';
  const resolvedNama = isCustom ? draft.customNama.trim() : draft.namaTindakan;

  const errNama     = submitted && !resolvedNama;
  const errPetugas  = submitted && !draft.dilakukanOleh.trim();
  const errTanggal  = submitted && !draft.tanggal.trim();
  const errJam      = submitted && !draft.jam.trim();

  function handleAdd() {
    setSubmitted(true);
    if (!resolvedNama || !draft.dilakukanOleh.trim() || !draft.tanggal.trim() || !draft.jam.trim()) return;
    onAdd({ ...draft, namaTindakan: resolvedNama });
    setDraft(emptyDraft());
    setSubmitted(false);
  }

  const set = (k: keyof TindakanDraft) => (
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setDraft((d) => ({ ...d, [k]: e.target.value }))
  );

  return (
    <div style={{
      background: 'var(--color-bg)',
      border: '2px dashed var(--color-primary)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 16px',
        background: 'var(--color-primary-light)',
        borderBottom: '1.5px solid var(--color-primary)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 14 }}>➕</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>
          Tambah Tindakan
        </span>
      </div>

      {/* Nama Tindakan */}
      <div style={{ padding: '14px 16px 4px' }}>
        <FieldLabel htmlFor="nama-tindakan" required>Nama Tindakan</FieldLabel>
        <div style={{ position: 'relative' }}>
          <select
            id="nama-tindakan"
            value={draft.namaTindakan}
            onChange={set('namaTindakan')}
            style={errNama && !isCustom ? SELECT_ERR : SELECT_STYLE}
          >
            <option value="">— Pilih tindakan —</option>
            {MASTER_TINDAKAN.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <span style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            pointerEvents: 'none', fontSize: 11, color: 'var(--color-muted)',
          }}>▾</span>
        </div>
        {isCustom && (
          <input
            type="text"
            placeholder="Nama tindakan kustom…"
            value={draft.customNama}
            onChange={set('customNama')}
            style={{ ...( errNama ? INPUT_ERR : INPUT_STYLE), marginTop: 8 }}
          />
        )}
        {errNama && <ErrorHint msg="Nama tindakan wajib diisi." />}
      </div>

      <Divider />

      {/* Catatan */}
      <div style={{ padding: '14px 16px 4px' }}>
        <FieldLabel htmlFor="catatan-tindakan" optional>Catatan</FieldLabel>
        <textarea
          id="catatan-tindakan"
          value={draft.catatan}
          onChange={set('catatan')}
          placeholder="Deskripsi tindakan, temuan, atau keterangan tambahan…"
          style={TEXTAREA_STYLE}
        />
      </div>

      <Divider />

      {/* Dilakukan Oleh */}
      <div style={{ padding: '14px 16px 4px' }}>
        <FieldLabel htmlFor="dilakukan-oleh" required>Dilakukan Oleh</FieldLabel>
        <input
          id="dilakukan-oleh"
          type="text"
          value={draft.dilakukanOleh}
          onChange={set('dilakukanOleh')}
          placeholder="Nama petugas / dokter hewan…"
          style={errPetugas ? INPUT_ERR : INPUT_STYLE}
        />
        {errPetugas && <ErrorHint msg="Nama petugas wajib diisi." />}
      </div>

      <Divider />

      {/* Tanggal + Jam */}
      <div style={{ padding: '14px 16px 4px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <FieldLabel htmlFor="tanggal-tindakan" required>Tanggal</FieldLabel>
            <input
              id="tanggal-tindakan"
              type="date"
              value={draft.tanggal}
              onChange={set('tanggal')}
              style={errTanggal ? INPUT_ERR : INPUT_STYLE}
            />
            {errTanggal && <ErrorHint msg="Tanggal wajib." />}
          </div>
          <div>
            <FieldLabel htmlFor="jam-tindakan" required>Jam</FieldLabel>
            <input
              id="jam-tindakan"
              type="time"
              value={draft.jam}
              onChange={set('jam')}
              style={errJam ? INPUT_ERR : INPUT_STYLE}
            />
            {errJam && <ErrorHint msg="Jam wajib." />}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
        {showCancel && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1, padding: '10px', fontSize: 13, fontWeight: 700,
              background: 'var(--color-surface)', color: 'var(--color-muted)',
              border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
            }}
          >
            Batal
          </button>
        )}
        <button
          type="button"
          onClick={handleAdd}
          style={{
            flex: 2, padding: '10px', fontSize: 13, fontWeight: 700,
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
          }}
        >
          ✓ Tambah Tindakan
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TindakanKesehatan() {
  const { id: diagnosaId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();

  // M-001 fix: ensure LIVESTOCK_DB is hydrated for deep-link navigation.
  useLivestock();

  const diagnosa    = diagnosaId ? getDiagnosa(diagnosaId) : null;
  const pemeriksaan = diagnosa   ? getPemeriksaan(diagnosa.pemeriksaanId) : null;

  // ── Get-or-create sesi ────────────────────────────────────────────────────────
  const [sesi, setSesi] = useState<TindakanSesi | null>(null);

  useEffect(() => {
    if (!diagnosa || !pemeriksaan) return;
    const existing = getTindakanSesiByDiagnosa(diagnosa.id);
    if (existing) {
      setSesi(existing);
    } else {
      const created = createTindakanSesi({
        diagnosaId:    diagnosa.id,
        pemeriksaanId: pemeriksaan.id,
      });
      setSesi(created);
    }
  }, [diagnosa?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Live items list (re-render via tick) ──────────────────────────────────────
  const [tick,          setTick]          = useState(0);
  const [showAddForm,   setShowAddForm]   = useState(true);
  const [pakaiObat,     setPakaiObatState]= useState<boolean | null>(null);
  const [submitted,     setSubmitted]     = useState(false);
  const [saving,        setSaving]        = useState(false);

  const items = useMemo(
    () => (sesi ? getTindakanItemsBySesi(sesi.id) : []),
    [sesi, tick], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const hasItems  = items.length > 0;
  const errNoItem = submitted && !hasItems;
  const errNoObat = submitted && pakaiObat === null;

  // ── Add item ──────────────────────────────────────────────────────────────────
  function handleAddItem(draft: TindakanDraft) {
    if (!sesi) return;
    addTindakanItem({
      sesiId:        sesi.id,
      diagnosaId:    sesi.diagnosaId,
      pemeriksaanId: sesi.pemeriksaanId,
      namaTindakan:  draft.namaTindakan,
      catatan:       draft.catatan.trim(),
      dilakukanOleh: draft.dilakukanOleh.trim(),
      tanggal:       draft.tanggal.trim(),
      jam:           draft.jam.trim(),
    });
    setTick((t) => t + 1);
    setShowAddForm(false);
  }

  // ── Remove item ───────────────────────────────────────────────────────────────
  function handleRemoveItem(itemId: string) {
    removeTindakanItem(itemId);
    setTick((t) => t + 1);
    if (getTindakanItemsBySesi(sesi?.id ?? '').length === 0) {
      setShowAddForm(true);
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  function handleSelesai() {
    setSubmitted(true);
    if (!hasItems || pakaiObat === null || !sesi) return;

    setSaving(true);
    try {
      setPakaiObat(sesi.id, pakaiObat);
      finishTindakanSesi(sesi.id);

      // ── Supabase write (dual-write, fire-and-forget) ──────────────────────
      // Only individu mode has a livestock_id row in health_treatments.
      if (
        pemeriksaan?.mode === 'individu' &&
        pemeriksaan.livestockId &&
        activeWorkspace?.workspace_uuid &&
        items.length > 0
      ) {
        recordTreatments(
          activeWorkspace.workspace_uuid,
          items.map((item) => ({
            livestockId:  pemeriksaan.livestockId!,
            // Use supabaseCheckupId (server UUID) not local id — the DB row was
            // created with a server-generated UUID by repoInsertCheckup().
            checkupId:    pemeriksaan?.supabaseCheckupId ?? null,
            tanggal:      item.tanggal,
            tipe:         'Tindakan Medis',
            dokterHewan:  item.dilakukanOleh,
            catatan:      item.catatan || null,
          })),
        ).then((result) => {
          if (!result.ok) console.error('[KH-004] Supabase recordTreatments failed:', result.error);
        }).catch((err) => {
          console.error('[KH-004] Supabase recordTreatments error:', err);
        });
      }

      if (pakaiObat) {
        navigate(`/kesehatan-hewan/pengobatan/${sesi.id}`);
      } else {
        navigate(`/kesehatan-hewan/kontrol/${sesi.id}`);
      }
    } catch (err) {
      console.error('[KH-004] finishTindakanSesi failed:', err);
      setSaving(false);
    }
  }

  // ── Guard ─────────────────────────────────────────────────────────────────────
  if (!diagnosa || !pemeriksaan) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Data Diagnosa Tidak Ditemukan
        </h2>
        <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
          Pastikan Anda mengakses halaman ini melalui proses Diagnosa yang benar.
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

  const diagnosaNama = diagnosa.sumber === 'master_penyakit'
    ? (diagnosa.namaPenyakit ?? 'Penyakit tidak diketahui')
    : (diagnosa.namaDiagnosa ?? 'Diagnosa Manual');

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '20px 16px 110px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* ── Workflow breadcrumb ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', overflowX: 'auto', paddingBottom: 2 }}>
        {[
          { label: 'Pemeriksaan', done: true },
          { label: 'Diagnosa',    done: true },
          { label: 'Tindakan',    done: false, active: true },
          { label: 'Selesai',     done: false },
        ].map((step, i) => (
          <span key={step.label} style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
            {i > 0 && <span style={{ margin: '0 4px', color: 'var(--color-border)' }}>›</span>}
            <span style={{
              padding: '3px 10px', borderRadius: 20,
              background: step.active ? 'var(--color-primary)' : step.done ? 'var(--color-primary-light)' : 'transparent',
              color: step.active ? '#fff' : step.done ? 'var(--color-primary)' : 'var(--color-muted)',
            }}>
              {step.done ? '✓ ' : ''}{step.label}
            </span>
          </span>
        ))}
      </div>

      {/* ── Context banner ──────────────────────────────────────────────────────── */}
      <ContextBanner
        tanggal={pemeriksaan.tanggal}
        petugas={pemeriksaan.petugas}
        diagnosaNama={diagnosaNama}
        mode={pemeriksaan.mode}
      />

      {/* ── Added tindakan list ─────────────────────────────────────────────────── */}
      {hasItems && (
        <SectionCard title={`Tindakan Ditambahkan (${items.length})`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 10px' }}>
            {items.map((item, idx) => (
              <TindakanCard
                key={item.id}
                item={item}
                index={idx}
                onRemove={() => handleRemoveItem(item.id)}
              />
            ))}
          </div>

          {/* Add more button */}
          {!showAddForm && (
            <div style={{ padding: '0 12px 12px' }}>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                style={{
                  width: '100%', padding: '10px', fontSize: 13, fontWeight: 700,
                  background: 'var(--color-surface)', color: 'var(--color-primary)',
                  border: '2px dashed var(--color-primary)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                }}
              >
                + Tambah Tindakan Lain
              </button>
            </div>
          )}
        </SectionCard>
      )}

      {/* ── Validation: no items ────────────────────────────────────────────────── */}
      {errNoItem && <ErrorHint msg="Minimal satu tindakan harus ditambahkan." />}

      {/* ── Add form ────────────────────────────────────────────────────────────── */}
      {showAddForm && (
        <AddTindakanForm
          onAdd={handleAddItem}
          onCancel={hasItems ? () => setShowAddForm(false) : undefined}
          showCancel={hasItems}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          APAKAH MENGGUNAKAN OBAT? — shown only after ≥1 tindakan added
          ══════════════════════════════════════════════════════════════════════════ */}
      {hasItems && (
        <SectionCard title="Pengobatan">
          <FieldWrap>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 12px' }}>
              Apakah tindakan ini memerlukan penggunaan obat?
            </p>
            <div style={{ display: 'flex', gap: 10, paddingBottom: 6 }}>
              {/* Ya */}
              <button
                type="button"
                onClick={() => setPakaiObatState(true)}
                style={{
                  flex: 1, padding: '12px 8px', cursor: 'pointer',
                  border: pakaiObat === true ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  background: pakaiObat === true ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: pakaiObat === true ? '#fff' : 'var(--color-muted)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'background 0.1s',
                }}
              >
                <span style={{ fontSize: 22 }}>💊</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Ya</span>
                <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.8 }}>Lanjut ke Pengobatan</span>
              </button>

              {/* Tidak */}
              <button
                type="button"
                onClick={() => setPakaiObatState(false)}
                style={{
                  flex: 1, padding: '12px 8px', cursor: 'pointer',
                  border: pakaiObat === false ? '2px solid #2e7d32' : '1.5px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  background: pakaiObat === false ? '#e8f5e9' : 'var(--color-surface)',
                  color: pakaiObat === false ? '#2e7d32' : 'var(--color-muted)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'background 0.1s',
                }}
              >
                <span style={{ fontSize: 22 }}>🌿</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Tidak</span>
                <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.8 }}>Lanjut ke Kontrol</span>
              </button>
            </div>
            {errNoObat && <ErrorHint msg="Pilih apakah menggunakan obat atau tidak." />}
          </FieldWrap>
          <div style={{ height: 6 }} />
        </SectionCard>
      )}

      {/* ── Selesai button ──────────────────────────────────────────────────────── */}
      {hasItems && (
        <button
          type="button"
          onClick={handleSelesai}
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
          {saving
            ? 'Menyimpan…'
            : pakaiObat === true
              ? '💊 Selesai & Lanjut ke Pengobatan'
              : pakaiObat === false
                ? '✅ Selesai & Lanjut ke Kontrol'
                : '✅ Selesai Tindakan'}
        </button>
      )}

    </div>
  );
}
