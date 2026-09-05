// ─── KlinikHewanOperational — VET-OPS-002 ─────────────────────────────────────
// Dashboard Operasional Workspace Klinik Hewan.
// Dipilih oleh workspaceOperationalRegistry.tsx — tidak di-hardcode di App.tsx.
//
// Sumber data (semua LIVE dari Supabase via veterinaryRepository):
//   health_checkups          → Kunjungan, Pemeriksaan, Diagnosis
//   health_treatments        → Tindakan, Resep, Obat, Transaksi
//   health_control_schedules → Jadwal
//   layanan_klinik_hewan     → Katalog Layanan Klinik
//   activity_log             → Aktivitas workspace
//
// Fitur:
//   - Ringkasan data live
//   - Daftar layanan klinik dengan CRUD
//   - Daftar kunjungan/pemeriksaan dengan create
//   - Daftar tindakan dengan create
//   - Daftar jadwal dengan create & status update

import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getWorkspaceOperationalConfig } from '../../config/workspaceOperationalRegistry';
import { getWorkspaceDashboardConfig } from '../../config/workspaceDashboardRegistry';
import {
  useVeterinaryDashboardData,
  getUniquePasienCount,
  formatNumber,
  formatRupiah,
  formatTanggal,
} from '../../hooks/useVeterinaryDashboardData';
import {
  WorkspaceCard,
  WorkspaceSectionTitle,
  WorkspacePageHeader,
  WorkspaceQuickActions,
} from '../../components/workspace/WorkspacePageHelpers';
import {
  repoGetClinicServicesByWorkspace,
  repoInsertClinicService,
  repoPatchClinicService,
  repoDeleteClinicService,
  repoInsertVetCheckup,
  repoInsertVetTreatment,
  repoInsertVetSchedule,
} from '../../repositories/veterinaryRepository';
import type {
  ClinicServiceDbRow,
  ClinicServiceCreateInput,
} from '../../types/veterinary';
import type {
  HealthCheckupDbRow,
  HealthCheckupCreateInput,
  HealthTreatmentDbRow,
  HealthTreatmentCreateInput,
  HealthControlScheduleDbRow,
  HealthControlScheduleCreateInput,
} from '../../types/health';
import type { VetActivityLogDbRow } from '../../types/veterinary';

// ─── Tema warna Klinik Hewan ──────────────────────────────────────────────────

const COLORS = {
  primary:      '#7b1fa2',
  bg:           '#f3e5f5',
  text:         '#4a148c',
  border:       '#ce93d8',
} as const;

// ─── Styles ───────────────────────────────────────────────────────────────────

const btnStyle: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-border)',
  fontSize: 13, background: '#fff', color: 'var(--color-text)',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 4,
};
const cardStyle: React.CSSProperties = {
  border: `1.5px solid ${COLORS.border}`, borderRadius: 'var(--radius-md)',
  background: 'var(--color-surface)', padding: 14, marginBottom: 14,
};

// ─── Modal Base ───────────────────────────────────────────────────────────────

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 22, width: '100%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ─── Clinic Service Form Modal ────────────────────────────────────────────────

function ClinicServiceFormModal({ onClose, onSave, initial }: {
  onClose: () => void; onSave: (data: ClinicServiceCreateInput) => void; initial?: ClinicServiceDbRow | null;
}) {
  const [namaKlinik, setNamaKlinik] = useState(initial?.nama_klinik ?? '');
  const [nomorIzin, setNomorIzin] = useState(initial?.nomor_izin ?? '');
  const [fasilitas, setFasilitas] = useState(initial?.fasilitas.join(', ') ?? '');
  const [hewan, setHewan] = useState(initial?.hewan_ditangani.join(', ') ?? '');
  const [lokasi, setLokasi] = useState(initial?.lokasi ?? '');
  const [jam, setJam] = useState(initial?.jam_operasional ? JSON.stringify(initial.jam_operasional) : '{}');
  const [status, setStatus] = useState(initial?.status ?? 'Aktif');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit() {
    setError('');
    if (!namaKlinik.trim()) { setError('Nama klinik wajib diisi.'); return; }
    let parsedJam: Record<string, unknown> | null = null;
    try { parsedJam = JSON.parse(jam); } catch { /* ignore */ }
    setSaving(true);
    try {
      onSave({
        workspace_id: initial?.workspace_id ?? '',
        nama_klinik: namaKlinik.trim(),
        nomor_izin: nomorIzin.trim() || null,
        fasilitas: fasilitas.split(',').map(s => s.trim()).filter(Boolean),
        hewan_ditangani: hewan.split(',').map(s => s.trim()).filter(Boolean),
        jam_operasional: parsedJam,
        lokasi: lokasi.trim() || null,
        status,
        description: initial?.description ?? null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <p style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>{initial ? 'Edit Klinik' : 'Klinik Baru'}</p>
      {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={labelStyle}>Nama Klinik *<input style={inputStyle} value={namaKlinik} onChange={e => setNamaKlinik(e.target.value)} /></label>
        <label style={labelStyle}>Nomor Izin<input style={inputStyle} value={nomorIzin} onChange={e => setNomorIzin(e.target.value)} /></label>
        <label style={labelStyle}>Fasilitas (pisah koma)<input style={inputStyle} value={fasilitas} onChange={e => setFasilitas(e.target.value)} /></label>
        <label style={labelStyle}>Hewan Ditangani (pisah koma)<input style={inputStyle} value={hewan} onChange={e => setHewan(e.target.value)} /></label>
        <label style={labelStyle}>Jam Operasional (JSON)<textarea style={{ ...inputStyle, minHeight: 60, fontFamily: 'monospace' }} value={jam} onChange={e => setJam(e.target.value)} /></label>
        <label style={labelStyle}>Lokasi<input style={inputStyle} value={lokasi} onChange={e => setLokasi(e.target.value)} /></label>
        <label style={labelStyle}>Status<select style={inputStyle} value={status} onChange={e => setStatus(e.target.value)}><option value="Aktif">Aktif</option><option value="Nonaktif">Nonaktif</option><option value="Ditutup">Ditutup</option><option value="Diarsipkan">Diarsipkan</option></select></label>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button onClick={onClose} style={{ ...btnStyle, background: '#f1f5f9', color: '#374151' }}>Batal</button>
        <button onClick={handleSubmit} disabled={saving} style={{ ...btnStyle, background: COLORS.primary, color: '#fff' }}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
      </div>
    </ModalOverlay>
  );
}

// ─── Checkup Form Modal ───────────────────────────────────────────────────────

function CheckupFormModal({ onClose, onSave, livestockId }: {
  onClose: () => void; onSave: (data: HealthCheckupCreateInput) => void; livestockId?: string;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [examiner, setExaminer] = useState('');
  const [temperature, setTemperature] = useState('');
  const [weight, setWeight] = useState('');
  const [bcs, setBcs] = useState('');
  const [healthStatus, setHealthStatus] = useState('Sehat');
  const [findings, setFindings] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit() {
    setError('');
    if (!livestockId) { setError('Livestock ID wajib diisi.'); return; }
    setSaving(true);
    try {
      onSave({
        livestock_id: livestockId,
        workspace_id: '',
        checkup_date: date,
        examiner: examiner.trim() || null,
        examiner_type: 'Dokter Hewan',
        temperature: temperature ? parseFloat(temperature) : null,
        weight_kg: weight ? parseFloat(weight) : null,
        body_condition_score: bcs ? parseInt(bcs, 10) : null,
        health_status: healthStatus,
        findings: findings.trim() || null,
        diagnosis: diagnosis.trim() || null,
        recommendations: recommendations.trim() || null,
        follow_up_date: followUp || null,
        notes: notes.trim() || null,
        recorded_by: null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <p style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>Pemeriksaan Baru</p>
      {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={labelStyle}>Tanggal<input type="date" style={inputStyle} value={date} onChange={e => setDate(e.target.value)} /></label>
        <label style={labelStyle}>Pemeriksa<input style={inputStyle} value={examiner} onChange={e => setExaminer(e.target.value)} /></label>
        <label style={labelStyle}>Suhu (°C)<input type="number" style={inputStyle} value={temperature} onChange={e => setTemperature(e.target.value)} /></label>
        <label style={labelStyle}>Berat (kg)<input type="number" style={inputStyle} value={weight} onChange={e => setWeight(e.target.value)} /></label>
        <label style={labelStyle}>BCS<input type="number" style={inputStyle} value={bcs} onChange={e => setBcs(e.target.value)} /></label>
        <label style={labelStyle}>Status Kesehatan<select style={inputStyle} value={healthStatus} onChange={e => setHealthStatus(e.target.value)}><option value="Sehat">Sehat</option><option value="Sakit">Sakit</option><option value="Dalam Perawatan">Dalam Perawatan</option><option value="Karantina">Karantina</option><option value="Pemantauan">Pemantauan</option></select></label>
        <label style={labelStyle}>Temuan Klinis<textarea style={{ ...inputStyle, minHeight: 60 }} value={findings} onChange={e => setFindings(e.target.value)} /></label>
        <label style={labelStyle}>Diagnosis<textarea style={{ ...inputStyle, minHeight: 60 }} value={diagnosis} onChange={e => setDiagnosis(e.target.value)} /></label>
        <label style={labelStyle}>Rekomendasi<textarea style={{ ...inputStyle, minHeight: 60 }} value={recommendations} onChange={e => setRecommendations(e.target.value)} /></label>
        <label style={labelStyle}>Tindak Lanjut<textarea style={{ ...inputStyle, minHeight: 40 }} value={followUp} onChange={e => setFollowUp(e.target.value)} /></label>
        <label style={labelStyle}>Catatan<textarea style={{ ...inputStyle, minHeight: 40 }} value={notes} onChange={e => setNotes(e.target.value)} /></label>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button onClick={onClose} style={{ ...btnStyle, background: '#f1f5f9', color: '#374151' }}>Batal</button>
        <button onClick={handleSubmit} disabled={saving} style={{ ...btnStyle, background: COLORS.primary, color: '#fff' }}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
      </div>
    </ModalOverlay>
  );
}

// ─── Treatment Form Modal ─────────────────────────────────────────────────────

function TreatmentFormModal({ onClose, onSave }: {
  onClose: () => void; onSave: (data: HealthTreatmentCreateInput) => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState('Tindakan Medis');
  const [drugName, setDrugName] = useState('');
  const [dosage, setDosage] = useState('');
  const [route, setRoute] = useState('');
  const [duration, setDuration] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [cost, setCost] = useState('');
  const [vet, setVet] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit() {
    setError('');
    setSaving(true);
    try {
      onSave({
        livestock_id: '',
        workspace_id: '',
        checkup_id: null,
        treatment_date: date,
        treatment_type: type,
        drug_id: null,
        drug_name: drugName.trim() || null,
        dosage: dosage.trim() || null,
        route: route.trim() || null,
        duration_days: duration ? parseInt(duration, 10) : null,
        next_treatment_date: nextDate || null,
        cost: cost ? parseInt(cost, 10) : null,
        veterinarian: vet.trim() || null,
        notes: notes.trim() || null,
        recorded_by: null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <p style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>Tindakan Baru</p>
      {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={labelStyle}>Tanggal<input type="date" style={inputStyle} value={date} onChange={e => setDate(e.target.value)} /></label>
        <label style={labelStyle}>Jenis<select style={inputStyle} value={type} onChange={e => setType(e.target.value)}><option value="Vaksinasi">Vaksinasi</option><option value="Pengobatan">Pengobatan</option><option value="Tindakan Medis">Tindakan Medis</option><option value="Pencegahan">Pencegahan</option><option value="Suplemen">Suplemen</option><option value="Lainnya">Lainnya</option></select></label>
        <label style={labelStyle}>Nama Obat/Tindakan<input style={inputStyle} value={drugName} onChange={e => setDrugName(e.target.value)} /></label>
        <label style={labelStyle}>Dosis<input style={inputStyle} value={dosage} onChange={e => setDosage(e.target.value)} /></label>
        <label style={labelStyle}>Rute<select style={inputStyle} value={route} onChange={e => setRoute(e.target.value)}><option value="">—</option><option value="Oral">Oral</option><option value="Injeksi Intramuskular">Injeksi Intramuskular</option><option value="Injeksi Subkutan">Injeksi Subkutan</option><option value="Topikal">Topikal</option></select></label>
        <label style={labelStyle}>Durasi (hari)<input type="number" style={inputStyle} value={duration} onChange={e => setDuration(e.target.value)} /></label>
        <label style={labelStyle}>Tindak Lanjut<input type="date" style={inputStyle} value={nextDate} onChange={e => setNextDate(e.target.value)} /></label>
        <label style={labelStyle}>Biaya (Rp)<input type="number" style={inputStyle} value={cost} onChange={e => setCost(e.target.value)} /></label>
        <label style={labelStyle}>Dokter<input style={inputStyle} value={vet} onChange={e => setVet(e.target.value)} /></label>
        <label style={labelStyle}>Catatan<textarea style={{ ...inputStyle, minHeight: 40 }} value={notes} onChange={e => setNotes(e.target.value)} /></label>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button onClick={onClose} style={{ ...btnStyle, background: '#f1f5f9', color: '#374151' }}>Batal</button>
        <button onClick={handleSubmit} disabled={saving} style={{ ...btnStyle, background: COLORS.primary, color: '#fff' }}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
      </div>
    </ModalOverlay>
  );
}

// ─── Schedule Form Modal ──────────────────────────────────────────────────────

function ScheduleFormModal({ onClose, onSave }: {
  onClose: () => void; onSave: (data: HealthControlScheduleCreateInput) => void;
}) {
  const [date, setDate] = useState('');
  const [type, setType] = useState('Kontrol Rutin');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit() {
    setError('');
    if (!date) { setError('Tanggal wajib diisi.'); return; }
    setSaving(true);
    try {
      onSave({
        workspace_id: '',
        livestock_id: null,
        batch_id: null,
        schedule_type: type,
        scheduled_date: date,
        status: 'Terjadwal',
        notes: notes.trim() || null,
        created_by: null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <p style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>Jadwal Baru</p>
      {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={labelStyle}>Tanggal<input type="date" style={inputStyle} value={date} onChange={e => setDate(e.target.value)} /></label>
        <label style={labelStyle}>Jenis<select style={inputStyle} value={type} onChange={e => setType(e.target.value)}><option value="Kontrol Rutin">Kontrol Rutin</option><option value="Kontrol Pasca Pengobatan">Kontrol Pasca Pengobatan</option><option value="Vaksinasi">Vaksinasi</option><option value="Pemeriksaan Berkala">Pemeriksaan Berkala</option><option value="Lainnya">Lainnya</option></select></label>
        <label style={labelStyle}>Catatan<textarea style={{ ...inputStyle, minHeight: 60 }} value={notes} onChange={e => setNotes(e.target.value)} /></label>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button onClick={onClose} style={{ ...btnStyle, background: '#f1f5f9', color: '#374151' }}>Batal</button>
        <button onClick={handleSubmit} disabled={saving} style={{ ...btnStyle, background: COLORS.primary, color: '#fff' }}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
      </div>
    </ModalOverlay>
  );
}

// ─── Detail Table Component ───────────────────────────────────────────────────

function DetailTable({ title, rows, columns, empty, onRefresh }: {
  title: string; rows: unknown[]; columns: { key: string; label: string; render?: (row: unknown) => React.ReactNode }[];
  empty: string; onRefresh: () => void;
}) {
  if (rows.length === 0) {
    return (
      <div style={cardStyle}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{title}</p>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>{empty}</p>
      </div>
    );
  }
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{title} ({rows.length})</p>
        <button onClick={onRefresh} style={{ ...btnStyle, background: '#fff', border: `1px solid ${COLORS.border}`, color: COLORS.text, fontSize: 11 }}>Refresh</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              {columns.map(c => <th key={c.key} style={{ textAlign: 'left', padding: '6px 8px', fontSize: 11, fontWeight: 700, color: COLORS.text }}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                {columns.map(c => <td key={c.key} style={{ padding: '6px 8px', verticalAlign: 'top' }}>{c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '-')}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function KlinikHewanOperational(): React.ReactElement {
  const { id: workspaceId = '' } = useParams<{ id: string }>();

  const config = getWorkspaceOperationalConfig('KlinikHewan');
  const dashboardConfig = getWorkspaceDashboardConfig('KlinikHewan');
  const { data, loading, error, refresh } = useVeterinaryDashboardData(workspaceId);

  // Live data from hook
  const checkups = data.checkups;
  const treatments = data.treatments;
  const schedules = data.schedules;
  const activities = data.activities;

  // Additional live data via repository
  const [services, setServices] = useState<ClinicServiceDbRow[]>([]);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [servicesError, setServicesError] = useState('');

  const loadServices = useCallback(async () => {
    if (!workspaceId) return;
    setServiceLoading(true);
    setServicesError('');
    try {
      const rows = await repoGetClinicServicesByWorkspace(workspaceId);
      setServices(rows);
    } catch (e) {
      setServicesError(e instanceof Error ? e.message : 'Gagal memuat layanan.');
    } finally {
      setServiceLoading(false);
    }
  }, [workspaceId]);

  // Load services on mount / workspace change
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { void loadServices(); }, [loadServices]);

  // ── Modal states ───────────────────────────────────────────────────────────
  const [serviceModal, setServiceModal] = useState<{ mode: 'create' | 'edit'; initial?: ClinicServiceDbRow } | null>(null);
  const [checkupModal, setCheckupModal] = useState(false);
  const [treatmentModal, setTreatmentModal] = useState(false);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleSaveService(input: ClinicServiceCreateInput) {
    if (serviceModal?.mode === 'edit' && serviceModal.initial) {
      await repoPatchClinicService(serviceModal.initial.id, input);
    } else {
      await repoInsertClinicService({ ...input, workspace_id: workspaceId });
    }
    setServiceModal(null);
    void loadServices();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  }

  async function handleDeleteService(id: string) {
    await repoDeleteClinicService(id);
    void loadServices();
  }

  async function handleSaveCheckup(input: HealthCheckupCreateInput) {
    await repoInsertVetCheckup({ ...input, workspace_id: workspaceId });
    setCheckupModal(false);
    void refresh();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  }

  async function handleSaveTreatment(input: HealthTreatmentCreateInput) {
    await repoInsertVetTreatment({ ...input, workspace_id: workspaceId });
    setTreatmentModal(false);
    void refresh();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  }

  async function handleSaveSchedule(input: HealthControlScheduleCreateInput) {
    await repoInsertVetSchedule({ ...input, workspace_id: workspaceId });
    setScheduleModal(false);
    void refresh();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  }

  // ── Counts ─────────────────────────────────────────────────────────────────
  const pasienCount = getUniquePasienCount(checkups);
  const checkupCount = checkups.length;
  const treatmentCount = treatments.length;

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '18px 16px 24px', background: 'var(--color-bg)' }}>

      {/* ── Header ── */}
      <WorkspacePageHeader
        icon={config.icon}
        label="Dashboard Operasional"
        title={data.workspace?.workspace_name ?? config.title}
        subtitle={config.subtitle}
        accentColor={COLORS.primary}
        iconBg={COLORS.bg}
      />

      {/* ── Success Banner ── */}
      {saveSuccess && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#166534' }}>✓ Perubahan berhasil disimpan.</p>
        </div>
      )}

      {/* ── Error Banner ── */}
      {(error !== null || servicesError) && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#991b1b' }}>
            ⚠️ Gagal memuat sebagian data: {error ?? servicesError}
          </p>
        </div>
      )}

      {/* ── Quick Action ── */}
      {dashboardConfig.quickActions.length > 0 && (
        <section style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#3b0764' }}>Quick Action</p>
              <p style={{ margin: '3px 0 0', fontSize: 11, color: COLORS.text }}>Akses cepat operasional klinik</p>
            </div>
            <span style={{ fontSize: 21 }}>{dashboardConfig.icon}</span>
          </div>
          <WorkspaceQuickActions
            actions={dashboardConfig.quickActions}
            workspaceId={workspaceId}
            cols={Math.min(dashboardConfig.quickActions.length, 4)}
            colors={{ bg: '#fff', border: COLORS.border, text: COLORS.text, accent: COLORS.primary }}
          />
        </section>
      )}

      {/* ── Ringkasan Cepat ── */}
      {!loading && (
        <WorkspaceCard style={{ marginBottom: 14 }}>
          <WorkspaceSectionTitle title="Ringkasan Data" action="Live" accentColor={COLORS.primary} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            {[
              { label: 'Pasien unik', value: formatNumber(pasienCount), icon: '🐄', color: COLORS.text, bg: COLORS.bg },
              { label: 'Kunjungan', value: formatNumber(checkupCount), icon: '🏥', color: '#1d4ed8', bg: '#eff6ff' },
              { label: 'Tindakan', value: formatNumber(treatmentCount), icon: '💉', color: '#166534', bg: '#f0fdf4' },
            ].map((item) => (
              <div key={item.label} style={{ background: item.bg, borderRadius: 12, padding: '11px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 18 }}>{item.icon}</div>
                <div style={{ marginTop: 3, fontSize: 17, fontWeight: 800, color: item.color }}>{item.value}</div>
                <div style={{ marginTop: 2, fontSize: 10, color: item.color, fontWeight: 600 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </WorkspaceCard>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[72, 120, 110].map((h) => (
            <div key={h} style={{ height: h, background: '#f3f4f6', borderRadius: 10, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      )}

      {/* ── Detail Sections ── */}
      {!loading && (
        <>
          {/* Layanan Klinik */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>🏥 Katalog Layanan Klinik</p>
              <button onClick={() => setServiceModal({ mode: 'create' })} style={{ ...btnStyle, background: COLORS.primary, color: '#fff' }}>+ Klinik</button>
            </div>
            {serviceLoading ? <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Memuat layanan...</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                {services.map(s => (
                  <div key={s.id} style={{ background: 'var(--color-surface)', border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 12 }}>
                    <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700 }}>{s.nama_klinik}</p>
                    <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--color-muted)' }}>{s.nomor_izin ?? '-'} · {s.status}</p>
                    <p style={{ margin: '0 0 8px', fontSize: 10, color: 'var(--color-muted)' }}>{s.hewan_ditangani.join(', ') || '-'} · {s.fasilitas.join(', ') || '-'}</p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setServiceModal({ mode: 'edit', initial: s })} style={{ ...btnStyle, background: '#fff', border: `1px solid ${COLORS.border}`, color: COLORS.text, fontSize: 11 }}>Edit</button>
                      <button onClick={() => { if (confirm('Hapus klinik ini?')) handleDeleteService(s.id); }} style={{ ...btnStyle, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: 11 }}>Hapus</button>
                    </div>
                  </div>
                ))}
                {services.length === 0 && <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Belum ada klinik. Klik "+ Klinik" untuk menambahkan.</p>}
              </div>
            )}
          </div>

          {/* Kunjungan / Pemeriksaan */}
          <DetailTable
            title="🏥 Kunjungan Terbaru"
            rows={checkups.slice(0, 20)}
            columns={[
              { key: 'checkup_date', label: 'Tanggal', render: (r) => formatTanggal((r as HealthCheckupDbRow).checkup_date) },
              { key: 'livestock_id', label: 'Livestock ID', render: (r) => (r as HealthCheckupDbRow).livestock_id?.slice(0, 8) },
              { key: 'health_status', label: 'Status', render: (r) => (r as HealthCheckupDbRow).health_status },
              { key: 'diagnosis', label: 'Diagnosis', render: (r) => (r as HealthCheckupDbRow).diagnosis ?? '-' },
              { key: 'examiner', label: 'Pemeriksa', render: (r) => (r as HealthCheckupDbRow).examiner ?? '-' },
            ]}
            empty="Belum ada kunjungan."
            onRefresh={refresh}
          />
          <button onClick={() => setCheckupModal(true)} style={{ ...btnStyle, background: COLORS.primary, color: '#fff', marginBottom: 16 }}>+ Kunjungan Baru</button>

          {/* Tindakan */}
          <DetailTable
            title="💉 Tindakan Terbaru"
            rows={treatments.slice(0, 20)}
            columns={[
              { key: 'treatment_date', label: 'Tanggal', render: (r) => formatTanggal((r as HealthTreatmentDbRow).treatment_date) },
              { key: 'treatment_type', label: 'Jenis', render: (r) => (r as HealthTreatmentDbRow).treatment_type },
              { key: 'drug_name', label: 'Obat/Tindakan', render: (r) => (r as HealthTreatmentDbRow).drug_name ?? '-' },
              { key: 'cost', label: 'Biaya', render: (r) => formatRupiah((r as HealthTreatmentDbRow).cost ?? 0) },
              { key: 'veterinarian', label: 'Dokter', render: (r) => (r as HealthTreatmentDbRow).veterinarian ?? '-' },
            ]}
            empty="Belum ada tindakan."
            onRefresh={refresh}
          />
          <button onClick={() => setTreatmentModal(true)} style={{ ...btnStyle, background: COLORS.primary, color: '#fff', marginBottom: 16 }}>+ Tindakan Baru</button>

          {/* Jadwal */}
          <DetailTable
            title="📅 Jadwal"
            rows={schedules.slice(0, 20)}
            columns={[
              { key: 'scheduled_date', label: 'Tanggal', render: (r) => formatTanggal((r as HealthControlScheduleDbRow).scheduled_date) },
              { key: 'schedule_type', label: 'Jenis', render: (r) => (r as HealthControlScheduleDbRow).schedule_type ?? '-' },
              { key: 'status', label: 'Status', render: (r) => (r as HealthControlScheduleDbRow).status ?? '-' },
              { key: 'notes', label: 'Catatan', render: (r) => (r as HealthControlScheduleDbRow).notes ?? '-' },
            ]}
            empty="Belum ada jadwal."
            onRefresh={refresh}
          />
          <button onClick={() => setScheduleModal(true)} style={{ ...btnStyle, background: COLORS.primary, color: '#fff', marginBottom: 16 }}>+ Jadwal Baru</button>

          {/* Aktivitas */}
          <DetailTable
            title="📋 Aktivitas Terbaru"
            rows={activities.slice(0, 10)}
            columns={[
              { key: 'action', label: 'Aksi', render: (r) => (r as VetActivityLogDbRow).action },
              { key: 'entity_type', label: 'Tipe', render: (r) => (r as VetActivityLogDbRow).entity_type ?? '-' },
              { key: 'description', label: 'Deskripsi', render: (r) => (r as VetActivityLogDbRow).description ?? '-' },
              { key: 'created_at', label: 'Waktu', render: (r) => new Date((r as VetActivityLogDbRow).created_at).toLocaleString('id-ID') },
            ]}
            empty="Belum ada aktivitas."
            onRefresh={refresh}
          />
        </>
      )}

      {/* ── Modals ── */}
      {serviceModal && (
        <ClinicServiceFormModal
          onClose={() => setServiceModal(null)}
          onSave={handleSaveService}
          initial={serviceModal.initial ?? null}
        />
      )}
      {checkupModal && (
        <CheckupFormModal
          onClose={() => setCheckupModal(false)}
          onSave={handleSaveCheckup}
        />
      )}
      {treatmentModal && (
        <TreatmentFormModal
          onClose={() => setTreatmentModal(false)}
          onSave={handleSaveTreatment}
        />
      )}
      {scheduleModal && (
        <ScheduleFormModal
          onClose={() => setScheduleModal(false)}
          onSave={handleSaveSchedule}
        />
      )}
    </main>
  );
}
