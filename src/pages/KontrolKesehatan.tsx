/**
 * KontrolKesehatan.tsx  (KH-007)
 * ─────────────────────────────────────────────────────────────────
 * Kontrol page — sixth and final step in the health workflow.
 * Route: /kesehatan-hewan/kontrol/:id  (id = tindakanSesiId)
 *
 * Workflow: Pemeriksaan → Diagnosa → Tindakan → (Pengobatan → Integrasi →) Kontrol → Selesai
 *
 * Features:
 *  - View health case summary (subject, diagnosa, current kasus status)
 *  - Riwayat kontrol — timeline of all previous kontrol records
 *  - Form to add a new kontrol (blocked if kasus is Selesai/Ditutup)
 *  - Status hasil with conditional jadwal kontrol berikutnya
 *  - Closing workflow when Sembuh or Meninggal
 *
 * FLOW-003M7: Supabase dual-write for kontrol jadwal.
 *  - addKontrol() remains the authoritative in-memory write (UI reactivity).
 *  - scheduleControl() fires-and-forgets to Supabase when a jadwal is set.
 *  - completeControl() is deferred (requires tracking DB schedule IDs).
 */

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useHealth }    from '../hooks/useHealth';
import { scheduleControl, completeControl, cancelControl } from '../services/healthService';
import { getTodayISO, getNowHHMM } from '../utils/dateUtils';

import { getTindakanSesi }       from '../data/tindakanKesehatanData';
import { getPemeriksaan }        from '../data/pemeriksaanKesehatanData';
import { getDiagnosa }           from '../data/diagnosaKesehatanData';
import { getLivestock }          from '../data/livestockData';
import { getBatch }              from '../data/batchData';
import {
  addKontrol,
  canAddKontrol,
  getKasusStatus,
  getKontrolBySesi,
  getJadwalTerakhir,
  statusNeedsJadwal,
  setKontrolSupabaseScheduleId,
  type StatusHasilKontrol,
  type JadwalKontrol,
  type KontrolRecord,
} from '../data/kontrolKesehatanData';

// ─── Style constants ──────────────────────────────────────────────────────────

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
  background: 'var(--color-bg)', color: 'var(--color-text)',
  fontSize: 13, fontWeight: 500, outline: 'none', boxSizing: 'border-box',
};
const INPUT_ERR: React.CSSProperties = { ...INPUT_STYLE, border: '1.5px solid var(--color-danger)' };
const TEXTAREA_STYLE: React.CSSProperties = { ...INPUT_STYLE, minHeight: 80, resize: 'vertical', lineHeight: 1.6 };
const SELECT_STYLE: React.CSSProperties = { ...INPUT_STYLE, cursor: 'pointer', appearance: 'none' as const };
const SELECT_ERR: React.CSSProperties = { ...SELECT_STYLE, border: '1.5px solid var(--color-danger)' };

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_HASIL_CONFIG: Record<StatusHasilKontrol, { label: string; emoji: string; bg: string; border: string; color: string; desc: string }> = {
  'Sembuh':          { label: 'Sembuh',          emoji: '✅', bg: '#e8f5e9', border: '#2e7d32', color: '#2e7d32', desc: 'Workflow selesai' },
  'Masih Perawatan': { label: 'Masih Perawatan', emoji: '🩺', bg: '#e3f2fd', border: '#1565c0', color: '#1565c0', desc: 'Jadwal kontrol lanjutan' },
  'Perlu Kontrol':   { label: 'Perlu Kontrol',   emoji: '🔁', bg: '#fff3e0', border: '#e65100', color: '#e65100', desc: 'Jadwal kontrol lanjutan' },
  'Perlu Isolasi':   { label: 'Perlu Isolasi',   emoji: '⚠️', bg: '#fff8e1', border: '#f9a825', color: '#f57f17', desc: 'Tandai aktif, jadwal kontrol' },
  'Meninggal':       { label: 'Meninggal',       emoji: '🪦', bg: '#ffebee', border: '#c62828', color: '#c62828', desc: 'Tutup kasus' },
};

const STATUS_KASUS_CONFIG = {
  Aktif:   { label: 'Aktif',   bg: '#fff3e0', color: '#e65100' },
  Selesai: { label: 'Selesai', bg: '#e8f5e9', color: '#2e7d32' },
  Ditutup: { label: 'Ditutup', bg: '#ffebee', color: '#c62828' },
};

const STATUS_HASIL_LIST: StatusHasilKontrol[] = [
  'Sembuh', 'Masih Perawatan', 'Perlu Kontrol', 'Perlu Isolasi', 'Meninggal',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(yyyymmdd: string) {
  if (!yyyymmdd) return '-';
  const [y, m, d] = yyyymmdd.split('-');
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
}

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
    <p style={{ margin: '4px 0 8px', fontSize: 11.5, color: 'var(--color-danger)', fontWeight: 500 }}>
      ⚠ {msg}
    </p>
  );
}

// ─── Workflow Breadcrumb ──────────────────────────────────────────────────────

function WorkflowBreadcrumb({ withObat }: { withObat: boolean }) {
  const steps = withObat
    ? [
        { label: 'Pemeriksaan', done: true },
        { label: 'Diagnosa',    done: true },
        { label: 'Tindakan',    done: true },
        { label: 'Pengobatan',  done: true },
        { label: 'Integrasi',   done: true },
        { label: 'Kontrol',     active: true },
        { label: 'Selesai',     done: false },
      ]
    : [
        { label: 'Pemeriksaan', done: true },
        { label: 'Diagnosa',    done: true },
        { label: 'Tindakan',    done: true },
        { label: 'Kontrol',     active: true },
        { label: 'Selesai',     done: false },
      ];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0,
      fontSize: 11, fontWeight: 600, color: 'var(--color-muted)',
      overflowX: 'auto', paddingBottom: 2,
    }}>
      {steps.map((step, i) => (
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
  );
}

// ─── Kasus Summary Card ───────────────────────────────────────────────────────

function KasusSummaryCard({
  subjectLabel,
  subjectIcon,
  diagnosaLabel,
  kasusStatus,
  jadwal,
}: {
  subjectLabel: string;
  subjectIcon: string;
  diagnosaLabel: string;
  kasusStatus: ReturnType<typeof getKasusStatus>;
  jadwal: JadwalKontrol | null;
}) {
  const cfg = STATUS_KASUS_CONFIG[kasusStatus];
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{subjectIcon}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{subjectLabel}</span>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700,
          background: cfg.bg, color: cfg.color,
          borderRadius: 20, padding: '3px 10px',
        }}>
          {cfg.label}
        </span>
      </div>
      {/* Diagnosa */}
      <div style={{ padding: '10px 16px', borderBottom: jadwal ? '1px solid var(--color-border)' : undefined }}>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Diagnosa</p>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text)', fontWeight: 500 }}>{diagnosaLabel}</p>
      </div>
      {/* Jadwal berikutnya */}
      {jadwal && (
        <div style={{ padding: '10px 16px', background: '#fff8e1' }}>
          <p style={{ margin: 0, fontSize: 11, color: '#f57f17', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
            📅 Jadwal Kontrol Berikutnya
          </p>
          <p style={{ margin: 0, fontSize: 13, color: '#e65100', fontWeight: 600 }}>
            {formatDateShort(jadwal.tanggal)} · {jadwal.jam}
          </p>
          {jadwal.catatan && (
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#7f5a00' }}>{jadwal.catatan}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Riwayat Kontrol ──────────────────────────────────────────────────────────

function KontrolCard({ record, index }: { record: KontrolRecord; index: number }) {
  const cfg = STATUS_HASIL_CONFIG[record.statusHasil];
  return (
    <div style={{ padding: '14px 16px' }}>
      {/* Row: tanggal + status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)' }}>
            Kontrol #{index + 1}
          </span>
          <span style={{ fontSize: 11, color: 'var(--color-muted)', marginLeft: 6 }}>
            · {formatDateShort(record.tanggal)} · {record.petugas}
          </span>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700,
          background: cfg.bg, color: cfg.color,
          border: `1.5px solid ${cfg.border}`,
          borderRadius: 20, padding: '2px 9px', flexShrink: 0,
        }}>
          {cfg.emoji} {cfg.label}
        </span>
      </div>
      {/* Kondisi */}
      <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--color-text)', lineHeight: 1.5 }}>
        {record.kondisiSaatIni}
      </p>
      {/* Clinical chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
        <Chip label={`Nafsu: ${record.nafsuMakan}`} />
        <Chip label={`Aktivitas: ${record.aktivitas}`} />
        {record.suhuTubuh && <Chip label={`Suhu: ${record.suhuTubuh}°C`} />}
        {record.bcs && <Chip label={`BCS: ${record.bcs}`} />}
        {record.bobot && <Chip label={`Bobot: ${record.bobot} kg`} />}
      </div>
      {/* Catatan */}
      {record.catatanPerkembangan && (
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
          {record.catatanPerkembangan}
        </p>
      )}
      {/* Jadwal */}
      {record.jadwalKontrol && (
        <div style={{ marginTop: 8, padding: '7px 10px', background: '#fff8e1', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: 11.5, color: '#f57f17', fontWeight: 600 }}>
            📅 Jadwal berikutnya: {formatDateShort(record.jadwalKontrol.tanggal)} · {record.jadwalKontrol.jam}
          </span>
          {record.jadwalKontrol.catatan && (
            <span style={{ fontSize: 11, color: '#7f5a00', marginLeft: 6 }}>{record.jadwalKontrol.catatan}</span>
          )}
        </div>
      )}
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600,
      background: 'var(--color-bg)', color: 'var(--color-muted)',
      border: '1px solid var(--color-border)', borderRadius: 20, padding: '2px 8px',
    }}>
      {label}
    </span>
  );
}

// ─── Closed State ─────────────────────────────────────────────────────────────

function KasusTertutupBanner({
  status,
  onKembali,
}: {
  status: 'Selesai' | 'Ditutup';
  onKembali: () => void;
}) {
  const isSembuh = status === 'Selesai';
  return (
    <div style={{
      padding: '20px 16px', textAlign: 'center',
      background: isSembuh ? '#e8f5e9' : '#ffebee',
      border: `1.5px solid ${isSembuh ? '#2e7d32' : '#c62828'}`,
      borderRadius: 'var(--radius-lg)',
    }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>{isSembuh ? '✅' : '🪦'}</div>
      <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: isSembuh ? '#2e7d32' : '#c62828' }}>
        Kasus {isSembuh ? 'Selesai' : 'Ditutup'}
      </p>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--color-muted)' }}>
        {isSembuh
          ? 'Ternak dinyatakan sembuh. Workflow kesehatan selesai.'
          : 'Kasus ditutup karena ternak meninggal. Tidak dapat menambah kontrol lanjutan.'}
      </p>
      <button
        type="button"
        onClick={onKembali}
        style={{
          padding: '10px 24px',
          background: isSembuh ? '#2e7d32' : '#c62828',
          color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}
      >
        Kembali ke Kesehatan Hewan
      </button>
    </div>
  );
}

// ─── Form state ───────────────────────────────────────────────────────────────

type FormState = {
  tanggal: string;
  petugas: string;
  kondisiSaatIni: string;
  nafsuMakan: 'Normal' | 'Menurun' | 'Tidak Ada' | '';
  aktivitas: 'Normal' | 'Menurun' | 'Tidak Ada' | '';
  suhuTubuh: string;
  bcs: '1' | '2' | '3' | '4' | '5' | '';
  bobot: string;
  catatanPerkembangan: string;
  statusHasil: StatusHasilKontrol | '';
  // Jadwal
  jadwalTanggal: string;
  jadwalJam: string;
  jadwalCatatan: string;
};

function emptyForm(): FormState {
  return {
    tanggal: getTodayISO(),
    petugas: '',
    kondisiSaatIni: '',
    nafsuMakan: '',
    aktivitas: '',
    suhuTubuh: '',
    bcs: '',
    bobot: '',
    catatanPerkembangan: '',
    statusHasil: '',
    jadwalTanggal: '',
    jadwalJam: getNowHHMM(),
    jadwalCatatan: '',
  };
}

type Errors = Partial<Record<keyof FormState, string>>;

// ─── Form Component ───────────────────────────────────────────────────────────

function KontrolForm({
  tindakanSesiId,
  pemeriksaanId,
  workspaceId,
  livestockId,
  batchId,
  onSaved,
}: {
  tindakanSesiId: string;
  pemeriksaanId: string;
  /** Passed from page; null when workspace not yet resolved. */
  workspaceId: string | null;
  /** FK for scheduleControl — derived from pemeriksaan.livestockId. */
  livestockId: string | null;
  /** FK for scheduleControl — derived from pemeriksaan.batchId. */
  batchId: string | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const needsJadwal = form.statusHasil !== '' && statusNeedsJadwal(form.statusHasil as StatusHasilKontrol);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const e: Errors = {};
    if (!form.tanggal)         e.tanggal = 'Tanggal wajib diisi.';
    if (!form.petugas.trim())  e.petugas = 'Nama petugas wajib diisi.';
    if (!form.kondisiSaatIni.trim()) e.kondisiSaatIni = 'Kondisi saat ini wajib diisi.';
    if (!form.nafsuMakan)      e.nafsuMakan = 'Nafsu makan wajib dipilih.';
    if (!form.aktivitas)       e.aktivitas = 'Aktivitas wajib dipilih.';
    if (!form.catatanPerkembangan.trim()) e.catatanPerkembangan = 'Catatan perkembangan wajib diisi.';
    if (!form.statusHasil)     e.statusHasil = 'Status hasil wajib dipilih.';
    if (needsJadwal && !form.jadwalTanggal) e.jadwalTanggal = 'Tanggal jadwal wajib diisi.';
    if (needsJadwal && !form.jadwalJam)     e.jadwalJam = 'Jam jadwal wajib diisi.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSimpan() {
    if (!validate()) return;
    setSaving(true);

    const jadwal: JadwalKontrol | null = needsJadwal
      ? { tanggal: form.jadwalTanggal, jam: form.jadwalJam, catatan: form.jadwalCatatan }
      : null;

    // ── Capture previous schedule ID before Phase 1 adds the new record ────────
    // Used in Phase 2a to complete/cancel the schedule that this visit fulfills.
    const prevRiwayat  = getKontrolBySesi(tindakanSesiId); // newest first
    const prevScheduleId = prevRiwayat.length > 0 ? prevRiwayat[0].supabaseScheduleId : undefined;

    // ── Phase 1: in-memory write (authoritative for UI) ───────────────────────
    const newKontrol = addKontrol({
      tindakanSesiId,
      pemeriksaanId,
      tanggal:             form.tanggal,
      petugas:             form.petugas.trim(),
      kondisiSaatIni:      form.kondisiSaatIni.trim(),
      nafsuMakan:          form.nafsuMakan as 'Normal' | 'Menurun' | 'Tidak Ada',
      aktivitas:           form.aktivitas  as 'Normal' | 'Menurun' | 'Tidak Ada',
      suhuTubuh:           form.suhuTubuh,
      bcs:                 form.bcs,
      bobot:               form.bobot,
      catatanPerkembangan: form.catatanPerkembangan.trim(),
      statusHasil:         form.statusHasil as StatusHasilKontrol,
      jadwalKontrol:       jadwal,
    });

    // ── Phase 2: Supabase dual-write (fire-and-forget) ────────────────────────
    // UI is already updated by Phase 1; failures here are logged only.

    // 2a: Close out the previous scheduled control — this visit fulfills it.
    //     Use cancelControl for Meninggal (animal died), completeControl otherwise.
    if (prevScheduleId && workspaceId) {
      if (form.statusHasil === 'Meninggal') {
        void cancelControl(prevScheduleId, 'Ternak meninggal').then((result) => {
          if (!result.ok) console.warn('[KontrolKesehatan] cancelControl failed (non-blocking):', result.error);
        }).catch((err: unknown) => {
          console.warn('[KontrolKesehatan] cancelControl threw (non-blocking):', err);
        });
      } else {
        void completeControl(prevScheduleId).then((result) => {
          if (!result.ok) console.warn('[KontrolKesehatan] completeControl failed (non-blocking):', result.error);
        }).catch((err: unknown) => {
          console.warn('[KontrolKesehatan] completeControl threw (non-blocking):', err);
        });
      }
    }

    // 2b: Persist the new jadwal to health_control_schedules, then backfill
    //     the returned Supabase UUID so the next kontrol can close it.
    if (needsJadwal && jadwal && workspaceId && (livestockId ?? batchId)) {
      void scheduleControl(workspaceId, {
        livestockId: livestockId ?? null,
        batchId:     batchId ?? null,
        tipe:        'Kontrol Rutin',
        tanggal:     jadwal.tanggal,
        catatan:     jadwal.catatan || null,
      }).then((result) => {
        if (result.ok) {
          // Backfill DB schedule ID so the NEXT kontrol can complete/cancel it.
          setKontrolSupabaseScheduleId(newKontrol.uuid, result.data.id);
        } else {
          console.warn('[KontrolKesehatan] scheduleControl Supabase write failed (non-blocking):', result.error);
        }
      }).catch((err: unknown) => {
        console.warn('[KontrolKesehatan] scheduleControl threw (non-blocking):', err);
      });
    }

    setSaving(false);
    onSaved();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Tanggal & Petugas ──────────────────────────────────────────────── */}
      <SectionCard title="Informasi Kontrol">
        <FieldWrap>
          <FieldLabel htmlFor="kh-tanggal" required>Tanggal Kontrol</FieldLabel>
          <input
            id="kh-tanggal" type="date" value={form.tanggal}
            onChange={(e) => set('tanggal', e.target.value)}
            style={errors.tanggal ? INPUT_ERR : INPUT_STYLE}
          />
          {errors.tanggal && <ErrorHint msg={errors.tanggal} />}
        </FieldWrap>
        <Divider />
        <FieldWrap>
          <FieldLabel htmlFor="kh-petugas" required>Petugas</FieldLabel>
          <input
            id="kh-petugas" type="text" value={form.petugas}
            placeholder="Nama petugas pemeriksa"
            onChange={(e) => set('petugas', e.target.value)}
            style={errors.petugas ? INPUT_ERR : INPUT_STYLE}
          />
          {errors.petugas && <ErrorHint msg={errors.petugas} />}
        </FieldWrap>
        <div style={{ height: 10 }} />
      </SectionCard>

      {/* ── Kondisi & Observasi ────────────────────────────────────────────── */}
      <SectionCard title="Kondisi Saat Ini">
        <FieldWrap>
          <FieldLabel htmlFor="kh-kondisi" required>Kondisi Umum</FieldLabel>
          <textarea
            id="kh-kondisi" value={form.kondisiSaatIni}
            placeholder="Deskripsikan kondisi ternak saat ini…"
            onChange={(e) => set('kondisiSaatIni', e.target.value)}
            style={errors.kondisiSaatIni ? { ...TEXTAREA_STYLE, border: '1.5px solid var(--color-danger)' } : TEXTAREA_STYLE}
          />
          {errors.kondisiSaatIni && <ErrorHint msg={errors.kondisiSaatIni} />}
        </FieldWrap>
        <Divider />
        {/* Nafsu Makan */}
        <FieldWrap>
          <FieldLabel htmlFor="kh-nafsu" required>Nafsu Makan</FieldLabel>
          <select
            id="kh-nafsu" value={form.nafsuMakan}
            onChange={(e) => set('nafsuMakan', e.target.value as typeof form.nafsuMakan)}
            style={errors.nafsuMakan ? SELECT_ERR : SELECT_STYLE}
          >
            <option value="">-- Pilih --</option>
            <option value="Normal">Normal</option>
            <option value="Menurun">Menurun</option>
            <option value="Tidak Ada">Tidak Ada</option>
          </select>
          {errors.nafsuMakan && <ErrorHint msg={errors.nafsuMakan} />}
        </FieldWrap>
        <Divider />
        {/* Aktivitas */}
        <FieldWrap>
          <FieldLabel htmlFor="kh-aktivitas" required>Aktivitas</FieldLabel>
          <select
            id="kh-aktivitas" value={form.aktivitas}
            onChange={(e) => set('aktivitas', e.target.value as typeof form.aktivitas)}
            style={errors.aktivitas ? SELECT_ERR : SELECT_STYLE}
          >
            <option value="">-- Pilih --</option>
            <option value="Normal">Normal</option>
            <option value="Menurun">Menurun</option>
            <option value="Tidak Ada">Tidak Ada</option>
          </select>
          {errors.aktivitas && <ErrorHint msg={errors.aktivitas} />}
        </FieldWrap>
        <div style={{ height: 10 }} />
      </SectionCard>

      {/* ── Pengukuran Opsional ────────────────────────────────────────────── */}
      <SectionCard title="Pengukuran">
        {/* Suhu Tubuh */}
        <FieldWrap>
          <FieldLabel htmlFor="kh-suhu" optional>Suhu Tubuh (°C)</FieldLabel>
          <input
            id="kh-suhu" type="number" step="0.1" min="30" max="45"
            value={form.suhuTubuh}
            placeholder="Contoh: 38.5"
            onChange={(e) => set('suhuTubuh', e.target.value)}
            style={INPUT_STYLE}
          />
        </FieldWrap>
        <Divider />
        {/* BCS */}
        <FieldWrap>
          <FieldLabel optional>Body Condition Score (BCS)</FieldLabel>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['1','2','3','4','5'] as const).map((v) => (
              <button
                key={v} type="button"
                onClick={() => set('bcs', form.bcs === v ? '' : v)}
                style={{
                  flex: 1, padding: '9px 4px',
                  border: form.bcs === v ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: form.bcs === v ? 'var(--color-primary-light)' : 'var(--color-bg)',
                  color: form.bcs === v ? 'var(--color-primary)' : 'var(--color-muted)',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </FieldWrap>
        <Divider />
        {/* Bobot */}
        <FieldWrap>
          <FieldLabel htmlFor="kh-bobot" optional>Bobot (kg)</FieldLabel>
          <input
            id="kh-bobot" type="number" step="0.5" min="0"
            value={form.bobot}
            placeholder="Contoh: 45.0"
            onChange={(e) => set('bobot', e.target.value)}
            style={INPUT_STYLE}
          />
        </FieldWrap>
        <div style={{ height: 10 }} />
      </SectionCard>

      {/* ── Catatan Perkembangan ───────────────────────────────────────────── */}
      <SectionCard title="Catatan Perkembangan">
        <FieldWrap>
          <FieldLabel htmlFor="kh-catatan" required>Catatan</FieldLabel>
          <textarea
            id="kh-catatan" value={form.catatanPerkembangan}
            placeholder="Tuliskan perkembangan kondisi, respons terhadap pengobatan, dll."
            onChange={(e) => set('catatanPerkembangan', e.target.value)}
            style={errors.catatanPerkembangan ? { ...TEXTAREA_STYLE, border: '1.5px solid var(--color-danger)' } : TEXTAREA_STYLE}
          />
          {errors.catatanPerkembangan && <ErrorHint msg={errors.catatanPerkembangan} />}
        </FieldWrap>
        <div style={{ height: 10 }} />
      </SectionCard>

      {/* ── Status Hasil ───────────────────────────────────────────────────── */}
      <SectionCard title="Status Hasil">
        <FieldWrap>
          <FieldLabel required>Hasil Evaluasi</FieldLabel>
          {errors.statusHasil && <ErrorHint msg={errors.statusHasil} />}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
            {STATUS_HASIL_LIST.map((s) => {
              const cfg = STATUS_HASIL_CONFIG[s];
              const selected = form.statusHasil === s;
              return (
                <button
                  key={s} type="button"
                  onClick={() => {
                    set('statusHasil', s);
                    // Clear jadwal fields when switching to terminal states
                    if (!statusNeedsJadwal(s)) {
                      setForm((f) => ({ ...f, statusHasil: s, jadwalTanggal: '', jadwalJam: getNowHHMM(), jadwalCatatan: '' }));
                      setErrors((e) => ({ ...e, statusHasil: undefined, jadwalTanggal: undefined, jadwalJam: undefined }));
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 14px', cursor: 'pointer', textAlign: 'left',
                    border: selected ? `2px solid ${cfg.border}` : '1.5px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    background: selected ? cfg.bg : 'var(--color-bg)',
                    transition: 'background 0.1s',
                  }}
                >
                  <span style={{ fontSize: 20, lineHeight: 1 }}>{cfg.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: selected ? cfg.color : 'var(--color-text)' }}>
                      {cfg.label}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--color-muted)' }}>{cfg.desc}</p>
                  </div>
                  {selected && (
                    <span style={{ fontSize: 16, color: cfg.color, fontWeight: 700 }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </FieldWrap>
        <div style={{ height: 6 }} />
      </SectionCard>

      {/* ── Jadwal Kontrol Berikutnya ─────────────────────────────────────── */}
      {needsJadwal && (
        <SectionCard title="Jadwal Kontrol Berikutnya">
          <FieldWrap>
            <FieldLabel htmlFor="kh-jadwal-tanggal" required>Tanggal</FieldLabel>
            <input
              id="kh-jadwal-tanggal" type="date"
              value={form.jadwalTanggal}
              min={getTodayISO()}
              onChange={(e) => set('jadwalTanggal', e.target.value)}
              style={errors.jadwalTanggal ? INPUT_ERR : INPUT_STYLE}
            />
            {errors.jadwalTanggal && <ErrorHint msg={errors.jadwalTanggal} />}
          </FieldWrap>
          <Divider />
          <FieldWrap>
            <FieldLabel htmlFor="kh-jadwal-jam" required>Jam</FieldLabel>
            <input
              id="kh-jadwal-jam" type="time"
              value={form.jadwalJam}
              onChange={(e) => set('jadwalJam', e.target.value)}
              style={errors.jadwalJam ? INPUT_ERR : INPUT_STYLE}
            />
            {errors.jadwalJam && <ErrorHint msg={errors.jadwalJam} />}
          </FieldWrap>
          <Divider />
          <FieldWrap>
            <FieldLabel htmlFor="kh-jadwal-catatan" optional>Catatan</FieldLabel>
            <textarea
              id="kh-jadwal-catatan"
              value={form.jadwalCatatan}
              placeholder="Instruksi atau hal yang perlu diperhatikan saat kontrol berikutnya…"
              onChange={(e) => set('jadwalCatatan', e.target.value)}
              style={{ ...TEXTAREA_STYLE, minHeight: 60 }}
            />
          </FieldWrap>
          <div style={{ height: 10 }} />
        </SectionCard>
      )}

      {/* ── Submit ─────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleSimpan}
        disabled={saving}
        style={{
          width: '100%', padding: '14px',
          background: saving ? 'var(--color-muted)' : 'var(--color-primary)',
          color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
          fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s',
        }}
      >
        {saving ? 'Menyimpan…' : '✅ Simpan Kontrol'}
      </button>

    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KontrolKesehatan() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const [tick, setTick] = useState(0);

  // FLOW-003M7: workspace + health data for Supabase dual-write.
  const { activeWorkspace }        = useWorkspace();
  const { refresh: refreshHealth } = useHealth();
  const workspaceId = activeWorkspace?.workspace_uuid ?? null;

  // ── Load context ─────────────────────────────────────────────────────────────
  const sesi = useMemo(() => getTindakanSesi(id ?? ''), [id]);
  const pemeriksaan = useMemo(
    () => (sesi ? getPemeriksaan(sesi.pemeriksaanId) : null),
    [sesi],
  );
  const diagnosa = useMemo(
    () => (sesi?.diagnosaId ? getDiagnosa(sesi.diagnosaId) : null),
    [sesi],
  );

  // ── Subject label (re-run on tick changes) ────────────────────────────────
  const subjectInfo = useMemo(() => {
    if (!pemeriksaan) return { label: 'Tidak ditemukan', icon: '❓' };
    if (pemeriksaan.mode === 'individu' && pemeriksaan.livestockId) {
      const lv = getLivestock(pemeriksaan.livestockId);
      return { label: lv?.name ?? lv?.id ?? 'Ternak', icon: lv?.typeIcon ?? '🐄' };
    }
    if (pemeriksaan.mode === 'batch' && pemeriksaan.batchId) {
      const batch = getBatch(pemeriksaan.batchId);
      return { label: batch?.label ?? 'Batch', icon: '🐑' };
    }
    return { label: 'Tidak diketahui', icon: '❓' };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pemeriksaan, tick]);

  const diagnosaLabel = useMemo(() => {
    if (!diagnosa) return 'Tidak ada diagnosa';
    if (diagnosa.sumber === 'master_penyakit') return diagnosa.namaPenyakit ?? 'Dari master penyakit';
    return diagnosa.namaDiagnosa ?? 'Manual';
  }, [diagnosa]);

  // ── Reactive kasus status (re-derived after each save) ────────────────────
  const kasusStatus = useMemo(
    () => getKasusStatus(id ?? ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, tick],
  );

  const riwayat = useMemo(
    () => getKontrolBySesi(id ?? ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, tick],
  );

  const jadwal = useMemo(
    () => getJadwalTerakhir(id ?? ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, tick],
  );

  const isClosed = kasusStatus === 'Selesai' || kasusStatus === 'Ditutup';

  // FLOW-003M7: derive subject IDs for scheduleControl dual-write.
  const subjectLivestockId = pemeriksaan?.mode === 'individu' ? (pemeriksaan.livestockId ?? null) : null;
  const subjectBatchId     = pemeriksaan?.mode === 'batch'    ? (pemeriksaan.batchId     ?? null) : null;

  // ── Not found guard ───────────────────────────────────────────────────────
  if (!sesi) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--color-muted)' }}>
          Sesi tindakan tidak ditemukan. ID: <code>{id}</code>
        </p>
        <button
          type="button"
          onClick={() => navigate('/kesehatan-hewan')}
          style={{
            marginTop: 12, padding: '10px 20px',
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 16px 100px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <WorkflowBreadcrumb withObat={sesi.pakaiObat === true} />

      {/* ── Kasus Summary ───────────────────────────────────────────────────── */}
      <KasusSummaryCard
        subjectLabel={subjectInfo.label}
        subjectIcon={subjectInfo.icon}
        diagnosaLabel={diagnosaLabel}
        kasusStatus={kasusStatus}
        jadwal={kasusStatus === 'Aktif' ? jadwal : null}
      />

      {/* ── Riwayat Kontrol ─────────────────────────────────────────────────── */}
      {riwayat.length > 0 && (
        <SectionCard title={`Riwayat Kontrol (${riwayat.length})`}>
          {riwayat.map((rec, idx) => (
            <div key={rec.uuid}>
              <KontrolCard record={rec} index={riwayat.length - 1 - idx} />
              {idx < riwayat.length - 1 && <Divider />}
            </div>
          ))}
        </SectionCard>
      )}

      {/* ── Closed banner ───────────────────────────────────────────────────── */}
      {isClosed && (
        <KasusTertutupBanner
          status={kasusStatus as 'Selesai' | 'Ditutup'}
          onKembali={() => navigate('/kesehatan-hewan')}
        />
      )}

      {/* ── Form kontrol baru ────────────────────────────────────────────────── */}
      {!isClosed && sesi.pemeriksaanId && (
        <>
          <div style={{ borderTop: riwayat.length > 0 ? '2px dashed var(--color-border)' : undefined, paddingTop: riwayat.length > 0 ? 2 : 0 }}>
            {riwayat.length > 0 && (
              <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Tambah Kontrol
              </p>
            )}
          </div>
          <KontrolForm
            tindakanSesiId={id ?? ''}
            pemeriksaanId={sesi.pemeriksaanId}
            workspaceId={workspaceId}
            livestockId={subjectLivestockId}
            batchId={subjectBatchId}
            onSaved={() => {
              setTick((t) => t + 1);
              refreshHealth();
            }}
          />
        </>
      )}

      {/* ── Kembali button (fallback for active kasus) ───────────────────────── */}
      {!isClosed && (
        <button
          type="button"
          onClick={() => navigate('/kesehatan-hewan')}
          style={{
            width: '100%', padding: '12px',
            background: 'transparent', color: 'var(--color-muted)',
            border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Kembali ke Kesehatan Hewan
        </button>
      )}

    </div>
  );
}
