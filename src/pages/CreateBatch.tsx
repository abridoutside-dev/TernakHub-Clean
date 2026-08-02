import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import { useLivestock } from '../hooks/useLivestock';
import { createBatch as createBatchService } from '../services/livestockService';
import { recordBatchHistoryEvent } from '../services/batchService';
import { type BatchStatus } from '../data/batchData';

// ─── Shared UI primitives (same style as AddLivestock.tsx) ────────────────────

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
        <span style={{
          fontSize: 13, fontWeight: 700,
          color: 'var(--color-primary)',
          textTransform: 'uppercase', letterSpacing: 0.6,
        }}>
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
    <label
      htmlFor={htmlFor}
      style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}
    >
      {children}
    </label>
  );
}

function Opt() {
  return <span style={{ fontWeight: 400, color: 'var(--color-muted)', fontSize: 12 }}> (Opsional)</span>;
}

function HelperText({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.5 }}>
      {children}
    </p>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--color-danger)', lineHeight: 1.5, fontWeight: 600 }}>
      {children}
    </p>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Users can type any label they want — these are suggestions only.
const LABEL_SUGGESTIONS = [
  'Fattening', 'Breeding', 'Kontes', 'Karantina',
  'Replacement', 'Premium', 'Qurban', 'Seleksi', 'Lainnya',
];

// AUDIT-LIVESTOCK-BATCH-001 MAJOR-002: Only Draft and Aktif are valid creation
// statuses. Selesai/Dibatalkan bypassed finishBatch() lifecycle — finishedDate
// would remain null, no batch_closed timeline event would fire, and AI Insight
// rec-closure check (which reads finishedDate) would silently skip the batch.
// Transition to terminal statuses must go through finishBatch()/archiveBatch().
const STATUS_OPTIONS: { value: BatchStatus; label: string; description: string }[] = [
  { value: 'Draft', label: 'Draft', description: 'Batch dipersiapkan, belum menerima anggota' },
  { value: 'Aktif', label: 'Aktif', description: 'Batch sedang berjalan'                      },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreateBatch() {
  const navigate = useNavigate();
  const { activeWorkspace }         = useWorkspace();
  const { currentUser }             = useAuth();
  // Populates BATCH_DB and provides batches list for duplicate-name check.
  const { batches, isLoading: livestockLoading, refresh } = useLivestock();

  const [name,        setName]        = useState('');
  const [label,       setLabel]       = useState('');
  const [description, setDescription] = useState('');
  const [purpose,     setPurpose]     = useState('');
  const [location,    setLocation]    = useState('');
  const [startDate,   setStartDate]   = useState('');
  const [status,      setStatus]      = useState<BatchStatus>('Aktif');
  const [submitted,   setSubmitted]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState<string | null>(null);

  // ── Validation ──────────────────────────────────────────────────────────────

  const nameEmpty     = name.trim() === '';
  const nameDuplicate = !nameEmpty && batches.some(
    b => b.label?.trim().toLowerCase() === name.trim().toLowerCase(),
  );

  const nameError = submitted && nameEmpty
    ? 'Nama batch wajib diisi.'
    : submitted && nameDuplicate
    ? 'Nama batch sudah digunakan. Pilih nama yang berbeda.'
    : '';

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (nameEmpty || nameDuplicate) return;

    if (!activeWorkspace) {
      setSaveError('Workspace tidak tersedia. Pilih workspace terlebih dahulu.');
      return;
    }

    // Combine optional planning fields into notes since the DB schema has a
    // single `notes` column. Core label (= batch name) is stored separately.
    const noteParts: string[] = [];
    if (label.trim())       noteParts.push(`Tipe: ${label.trim()}`);
    if (description.trim()) noteParts.push(description.trim());
    if (purpose.trim())     noteParts.push(`Tujuan: ${purpose.trim()}`);
    if (location.trim())    noteParts.push(`Lokasi: ${location.trim()}`);

    setSaving(true);
    setSaveError(null);

    try {
      const result = await createBatchService(
        activeWorkspace.workspace_uuid,
        currentUser?.id ?? '',
        {
          label:            name.trim(),
          species:          null,
          start_date:       startDate || null,
          target_weight_kg: null,
          notes:            noteParts.length > 0 ? noteParts.join('\n') : null,
        },
      );

      if (!result.ok) {
        setSaveError(result.error);
        setSaving(false);
        return;
      }

      // Fire batch_created history event — fire-and-forget dual-write (M18).
      void recordBatchHistoryEvent(
        result.data.id,
        'batch_created',
        { label: name.trim(), status },
        currentUser?.id ?? null,
      ).catch((err) =>
        console.error('[CreateBatch] recordBatchHistoryEvent failed:', err),
      );

      // Refresh hook so BATCH_DB is updated with the new Supabase row before navigating.
      refresh();
      // Navigate to the batch profile using the Supabase UUID.
      navigate(`/batch/${result.data.id}`, { replace: true });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.');
      setSaving(false);
    }
  }

  // ── Loading guard ────────────────────────────────────────────────────────────

  if (livestockLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 36 }}>⏳</span>
        <div style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 600 }}>Memuat data batch...</div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '16px 16px 40px', maxWidth: 480, margin: '0 auto' }}>
      <form onSubmit={handleSubmit} noValidate>

        {/* ══ Identitas Batch ═══════════════════════════════════════════════ */}
        <SectionCard title="Identitas Batch">

          {/* Nama Batch (required) */}
          <FieldGroup>
            <FieldLabel htmlFor="nama-batch">Nama Batch</FieldLabel>
            <input
              id="nama-batch"
              type="text"
              placeholder="Contoh: Penggemukan Juli 2026"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              style={nameError ? { borderColor: 'var(--color-danger)', outline: 'none' } : undefined}
            />
            {nameError
              ? <ErrorText>{nameError}</ErrorText>
              : <HelperText>Nama unik untuk mengidentifikasi batch ini di dalam workspace.</HelperText>}
          </FieldGroup>

          {/* Tipe Batch (free-form label, not limited) */}
          <FieldGroup>
            <FieldLabel htmlFor="label-batch">Tipe Batch<Opt /></FieldLabel>
            <input
              id="label-batch"
              type="text"
              placeholder="Ketik tipe sendiri atau pilih contoh..."
              value={label}
              onChange={e => setLabel(e.target.value)}
            />
            <HelperText>Kategori bebas. Tidak ada batasan tipe yang tersedia.</HelperText>

            {/* Suggestion chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {LABEL_SUGGESTIONS.map(s => {
                const active = label === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setLabel(active ? '' : s)}
                    style={{
                      padding: '5px 12px', fontSize: 12, fontWeight: 700,
                      borderRadius: 20, cursor: 'pointer',
                      border: active
                        ? '2px solid var(--color-primary)'
                        : '1.5px solid var(--color-border)',
                      background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: active ? '#fff' : 'var(--color-muted)',
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </FieldGroup>

          {/* Deskripsi (optional) */}
          <FieldGroup last>
            <FieldLabel htmlFor="deskripsi-batch">Deskripsi<Opt /></FieldLabel>
            <textarea
              id="deskripsi-batch"
              placeholder="Contoh: Program penggemukan domba untuk persiapan Idul Adha 2026."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </FieldGroup>
        </SectionCard>

        {/* ══ Perencanaan Batch ════════════════════════════════════════════ */}
        <SectionCard title="Perencanaan Batch">

          {/* Tujuan */}
          <FieldGroup>
            <FieldLabel htmlFor="purpose-batch">Tujuan<Opt /></FieldLabel>
            <input
              id="purpose-batch"
              type="text"
              placeholder="Contoh: Persiapan Idul Adha 2026"
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
            />
            <HelperText>Tujuan utama batch ini dijalankan.</HelperText>
          </FieldGroup>

          {/* Lokasi */}
          <FieldGroup>
            <FieldLabel htmlFor="location-batch">Lokasi<Opt /></FieldLabel>
            <input
              id="location-batch"
              type="text"
              placeholder="Contoh: Kandang B, Blok 3"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
            <HelperText>Lokasi fisik tempat ternak batch ini dikelola.</HelperText>
          </FieldGroup>

          {/* Tanggal Mulai */}
          <FieldGroup last>
            <FieldLabel htmlFor="startdate-batch">Tanggal Mulai<Opt /></FieldLabel>
            <input
              id="startdate-batch"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
            <HelperText>Tanggal rencana atau aktual dimulainya batch.</HelperText>
          </FieldGroup>
        </SectionCard>

        {/* ══ Status ════════════════════════════════════════════════════════ */}
        <SectionCard title="Status">
          <FieldGroup last>
            <FieldLabel>Status Batch</FieldLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {STATUS_OPTIONS.map(opt => {
                const checked = status === opt.value;
                return (
                  <label
                    key={opt.value}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: checked
                        ? '2px solid var(--color-primary)'
                        : '1.5px solid var(--color-border)',
                      background: checked ? 'var(--color-primary-light)' : 'var(--color-surface)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="status-batch"
                      value={opt.value}
                      checked={checked}
                      onChange={() => setStatus(opt.value)}
                      style={{ accentColor: 'var(--color-primary)', width: 16, height: 16, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: checked ? 700 : 500,
                        color: checked ? 'var(--color-primary)' : 'var(--color-text)',
                      }}>
                        {opt.label}
                        {opt.value === 'Aktif' && (
                          <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-muted)', marginLeft: 6 }}>
                            — Default
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>
                        {opt.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </FieldGroup>
        </SectionCard>

        {/* ══ Info card ═════════════════════════════════════════════════════ */}
        <div style={{
          background: '#eaf4ff',
          border: '1.5px solid #b3d6f5',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          marginBottom: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 16 }}>ℹ️</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1565c0' }}>Tentang Batch</span>
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              'Batch adalah kelompok pengelompokan ternak.',
              'Ternak ditambahkan ke batch setelah batch dibuat.',
              'Batch tidak menghapus identitas ternak individu.',
              'Satu ternak dapat menjadi anggota beberapa batch sekaligus.',
            ].map(text => (
              <li key={text} style={{ fontSize: 13, color: '#1a3a5c', lineHeight: 1.5 }}>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Error banner */}
        {saveError && (
          <div style={{
            background: '#ffebee', border: '1px solid #e57373',
            borderRadius: 8, padding: '12px 16px', marginBottom: 14,
            fontSize: 12, color: '#b71c1c', fontWeight: 600,
            display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <span>❌</span>
            <span>{saveError}</span>
          </div>
        )}

        {/* ══ Bottom buttons ════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              background: 'var(--color-surface)', color: 'var(--color-muted)',
              borderRadius: 'var(--radius-sm)', padding: '13px',
              fontSize: 15, fontWeight: 600,
              border: '1.5px solid var(--color-border)', cursor: 'pointer',
            }}
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              background: saving ? '#9e9e9e' : 'var(--color-primary)',
              color: '#fff',
              borderRadius: 'var(--radius-sm)', padding: '13px',
              fontSize: 15, fontWeight: 600, border: 'none',
              cursor: saving ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {saving ? <><span>⏳</span> Menyimpan...</> : 'Simpan Batch'}
          </button>
        </div>

      </form>
    </div>
  );
}
