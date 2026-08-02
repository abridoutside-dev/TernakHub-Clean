// ─── RP-001 … RP-007: Modul Reproduksi ──────────────────────────────────────
// RP-001 membangun struktur halaman (Header → AI Insight → Ringkasan → Mode →
// Search & Filter → Program Reproduksi → Riwayat Reproduksi).
// RP-002 mengimplementasikan Program Reproduksi sebagai induk seluruh aktivitas
// reproduksi: CRUD Program (create/edit/batalkan), peserta Pejantan/Betina,
// Data IB, dan validasi minimal peserta.
// RP-003 mengimplementasikan Pelaksanaan Program Reproduksi: satu Program dapat
// memiliki satu atau banyak Pelaksanaan (aktivitas nyata di lapangan). Peserta
// selalu dibaca dari Program induknya (read-only) — tidak dapat diubah dari
// Pelaksanaan.
// RP-004 mengimplementasikan Monitoring Program Reproduksi: pusat pencatatan
// seluruh kejadian (event) selama Program berlangsung, ditampilkan sebagai
// Timeline (per-Program di dalam Program Detail Sheet, dan lintas-Program di
// section Monitoring dengan Search & Filter). Monitoring tidak menentukan
// status bunting, tidak mengubah Program, dan tidak mengubah Pelaksanaan.
// RP-005 mengimplementasikan Pemeriksaan Kebuntingan sebagai modul tersendiri
// (kebuntinganData.ts dilewati; lihat pemeriksaanKebuntinganData.ts): hasilnya
// "Bunting" / "Tidak Bunting" / "Tidak Pasti" / "Perlu Pemeriksaan Ulang",
// ditampilkan di PemeriksaanKebuntinganSection dalam Program Detail Sheet.
// RP-006 mengimplementasikan Kebuntingan (Pregnancy Management) sebagai modul
// tersendiri (kebuntinganData.ts): mengelola satu kebuntingan terkonfirmasi
// (dari Pemeriksaan dengan hasil "Bunting") hingga Selesai/Keguguran — TIDAK
// mencatat Kelahiran dan TIDAK membuat data anak (roadmap RP-007 selanjutnya).
// KebuntinganSection berada di dalam Program Detail Sheet, setelah
// PemeriksaanKebuntinganSection dan sebelum MonitoringSection.
// RP-007 mengimplementasikan Kelahiran (Birth Management) sebagai modul
// tersendiri (kelahiranData.ts): mencatat proses kelahiran dari Kebuntingan
// berstatus "Selesai" beserta data setiap Anak (AnakRecord) — hidup, lahir mati,
// atau mati setelah lahir. TIDAK membuat Livestock permanen (roadmap RP-008).
// KelahiranSection berada di dalam Program Detail Sheet, setelah
// KebuntinganSection dan sebelum MonitoringSection.
// RP-008 mengimplementasikan Registrasi Anak (registrasiAnakData.ts): mengubah
// AnakRecord (RP-007) menjadi LivestockRecord permanen lewat
// addLivestock/addPedigreeLink (livestockData.ts) — tidak menulis
// LIVESTOCK_DB/PEDIGREE_DB langsung di sini. getFullTimelineForProgram kini
// diimpor dari registrasiAnakData.ts (yang membungkus kelahiranData.ts, yang
// sendiri menggabungkan seluruh chain RP-004..007) — tidak diimpor lagi dari
// kelahiranData.ts langsung.

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLivestock }    from '../hooks/useLivestock';
import { useReproduksi }  from '../hooks/useReproduksi';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth }      from '../contexts/AuthContext';
import {
  recordProgram,
  recordPelaksanaan,
  recordMonitoring,
  recordKebuntingan,
  recordKelahiran,
  recordRegistrasiAnak,
  recordSapih,
  recordPemeriksaanKebuntingan,
  recordKebuntinganMonitoring,
  updateKebuntinganStatusInDb,
  updateProgramStatusInDb,
  updateProgramInDb,
} from '../services/reproduksiService';
import { LIVESTOCK_DB, getPedigree, type LivestockRecord } from '../data/livestockData';
import { BATCH_DB, getActiveBatchMemberships } from '../data/batchData';
import { getLivestockStatus } from '../data/transferData';
import {
  Filters, DEFAULT_FILTERS, countActiveFilters,
  FilterSheet, FilterChips, SearchFilterBar, SegmentedControl,
  handleRemoveFilterChip as sharedRemoveChip,
  type FilterableIndividu, type FilterableBatch,
} from '../components/LivestockFilterSheet';
import {
  METODE_REPRODUKSI_LIST,
  STATUS_PROGRAM_LIST,
  progressForStatus,
  hasValidDataIB,
  validateProgramPeserta,
  getProgramList,
  getProgramById,
  addProgram,
  updateProgram,
  cancelProgram,
  type MetodeReproduksi,
  type StatusProgram,
  type DataIB,
  type ReproduksiProgramRecord,
  type ProgramInput,
} from '../data/reproduksiProgramData';
import {
  STATUS_PELAKSANAAN_LIST,
  JENIS_LAMPIRAN_LIST,
  isProgramAktifUntukPelaksanaan,
  getPelaksanaanListByProgram,
  getPelaksanaanById,
  addPelaksanaan,
  updatePelaksanaan,
  cancelPelaksanaan,
  type StatusPelaksanaan,
  type JenisLampiran,
  type LampiranPelaksanaan,
  type PelaksanaanRecord,
  type PelaksanaanInput,
} from '../data/pelaksanaanReproduksiData';
import {
  EVENT_TYPE_LIST,
  MONITORING_EVENT_TYPE_LIST,
  KONDISI_LIST,
  STATUS_MONITORING_LIST,
  eventTypeIcon,
  addMonitoring,
  updateMonitoring,
  getMonitoringList,
  getMonitoringListByProgram,
  buildProgramLifecycleEvents,
  type EventType,
  type KondisiMonitoring,
  type StatusMonitoring,
  type LampiranMonitoring,
  type MonitoringRecord,
  type MonitoringInput,
  type ReproduksiEvent,
} from '../data/monitoringReproduksiData';
import {
  METODE_PEMERIKSAAN_LIST,
  HASIL_PEMERIKSAAN_LIST,
  followUpMessageForHasil,
  getPemeriksaanListByProgram,
  addPemeriksaanKebuntingan,
  updatePemeriksaanKebuntingan,
  type MetodePemeriksaan,
  type HasilPemeriksaan,
  type LampiranPemeriksaan,
  type PemeriksaanKebuntinganRecord,
  type PemeriksaanKebuntinganInput,
} from '../data/pemeriksaanKebuntinganData';
import {
  RISK_LEVEL_LIST,
  STATUS_KEBUNTINGAN_LIST,
  EDITABLE_STATUS_LIST,
  followUpMessageForStatus,
  isStatusFinal,
  getPregnancyListByProgram,
  getPregnancyByExaminationId,
  addKebuntingan,
  updateKebuntingan,
  abortKebuntingan,
  completeKebuntingan,
  getKebuntinganMonitoringList,
  addKebuntinganMonitoring,
  type RiskLevel,
  type StatusKebuntingan,
  type KebuntinganRecord,
  type KebuntinganInput,
  type KebuntinganMonitoringRecord,
  type KebuntinganMonitoringInput,
  type LampiranKebuntinganMonitoring,
} from '../data/kebuntinganData';
import {
  METODE_KELAHIRAN_LIST,
  JENIS_KELAMIN_ANAK_LIST,
  JENIS_ANAK_LIST,
  KONDISI_AWAL_LIST,
  getKelahiranByKebuntinganId,
  getKelahiranListByProgram,
  getKelahiranById,
  getAnakListByKelahiran,
  getKelahiranHasil,
  addKelahiran,
  completeKelahiran,
  addAnak,
  type MetodeKelahiran,
  type StatusKelahiran,
  type JenisKelaminAnak,
  type JenisAnak,
  type KondisiAwal,
  type KelahiranRecord,
  type KelahiranInput,
  type AnakRecord,
  type AnakInput,
} from '../data/kelahiranData';
import {
  getRegistrableAnak,
  getRegistrasiAutoFill,
  registerAnak,
  registerAllAnak,
  STATUS_KESEHATAN_REGISTRASI_LIST,
  type RegistrasiAnakInput,
  type StatusKesehatanRegistrasi,
} from '../data/registrasiAnakData';
import {
  addSapih,
  startSapih,
  completeSapih,
  cancelSapih,
  recordPascaSapih,
  getSapihListByLivestock,
  formatUmurSaatSapih,
  umurSaatSapihHari,
  getFullTimelineForProgram,
  METODE_SAPIH_LIST,
  KONDISI_PERTUMBUHAN_LIST,
  ADAPTASI_PAKAN_LIST,
  OBSERVASI_KESEHATAN_LIST,
  type WeaningRecord,
  type SapihInput,
  type MetodeSapih,
  type KondisiPertumbuhan,
  type AdaptasiPakan,
  type ObservasiKesehatan,
} from '../data/sapihData';
import {
  getAllReproduksiHistory,
  emptyRiwayatFilters,
  matchesRiwayatFilters,
  type ReproduksiHistoryEntry,
  type RiwayatFilters,
} from '../data/riwayatReproduksiData';
import {
  generateReproduksiInsights,
  type InsightItem,
  type InsightCategory,
  type InsightLevel,
} from '../data/aiInsightReproduksiData';

// ─── Types ──────────────────────────────────────────────────────────────────

type Mode = 'individu' | 'batch';

// ─── Shared Bits ────────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  return (
    <h2 style={{
      margin: '0 0 10px', fontSize: 12, fontWeight: 700,
      color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase',
    }}>
      {title}
    </h2>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function FieldLabel({ label }: { label: string }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>
      {label}
    </div>
  );
}

function SheetShell({ title, subtitle, onClose, children, footer, zIndex = 300 }: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  zIndex?: number;
}) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.30)', zIndex }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--color-surface)',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.13)',
        zIndex: zIndex + 1, maxHeight: '88vh',
        display: 'flex', flexDirection: 'column',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 20px 14px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>{title}</div>
            {subtitle && (
              <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>{subtitle}</div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            style={{
              background: 'var(--color-bg)', border: 'none',
              borderRadius: '50%', width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, color: 'var(--color-muted)', cursor: 'pointer', flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '18px 20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {children}
        </div>

        {footer && (
          <div style={{ padding: '12px 20px 20px', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

// ─── AI Insight (Placeholder) ───────────────────────────────────────────────

const RP_LEVEL_CFG: Record<InsightLevel, { border: string; bg: string; color: string; badge: string }> = {
  critical: { border: '#c62828', bg: '#fff5f5', color: '#c62828', badge: '🔴 Kritis' },
  warning:  { border: '#e65100', bg: '#fff8f0', color: '#e65100', badge: '🟠 Peringatan' },
  info:     { border: '#1565c0', bg: '#f0f4ff', color: '#1565c0', badge: '🔵 Info' },
};

const RP_CAT_LABELS: Record<InsightCategory, string> = {
  ringkasan:   '📊 Ringkasan',
  analisis:    '🔁 Analisis',
  peringatan:  '⚠️ Peringatan',
  rekomendasi: '💡 Rekomendasi',
  prediksi:    '📦 Prediksi',
};

function RpInsightItemRow({ item }: { item: InsightItem }) {
  const cfg = RP_LEVEL_CFG[item.level];
  return (
    <div style={{ borderLeft: `3px solid ${cfg.border}`, background: cfg.bg, borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', padding: '9px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        <span style={{ fontSize: 14 }}>{item.icon}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: cfg.color, flex: 1 }}>{item.title}</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: cfg.color, opacity: 0.8, flexShrink: 0 }}>{cfg.badge}</span>
      </div>
      <p style={{ margin: 0, fontSize: 11.5, color: 'var(--color-text)', lineHeight: 1.55 }}>{item.message}</p>
    </div>
  );
}

// ─── AI Insight — RP-011 (rule-based, read-only) ────────────────────────────

function AiInsightCard({ tick }: { tick: number }) {
  const report = useMemo(() => generateReproduksiInsights(), [tick]);
  const [selectedCat, setSelectedCat] = useState<InsightCategory | 'all'>('all');

  const categories = useMemo((): InsightCategory[] => {
    const seen = new Set<InsightCategory>();
    report.items.forEach((i) => seen.add(i.category));
    return Array.from(seen);
  }, [report.items]);

  const filteredItems = useMemo(
    () => selectedCat === 'all' ? report.items : report.items.filter((i) => i.category === selectedCat),
    [report.items, selectedCat],
  );

  const topLevel: InsightLevel = report.items.some((i) => i.level === 'critical')
    ? 'critical'
    : report.items.some((i) => i.level === 'warning')
      ? 'warning'
      : 'info';
  const topCfg = RP_LEVEL_CFG[topLevel];

  const analyzedAt = useMemo(() => {
    const d = new Date(report.analyzedAt);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
      ' · ' + d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }, [report.analyzedAt]);

  return (
    <section>
      <SectionLabel title="🤖 AI Insight" />
      <Card style={{ overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🧬</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Insight Reproduksi</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, background: topCfg.bg, color: topCfg.color, border: `1px solid ${topCfg.border}`, borderRadius: 20, padding: '2px 8px' }}>
            {topCfg.badge}
          </span>
        </div>

        {/* Category filter chips */}
        {categories.length > 1 && (
          <div style={{ display: 'flex', gap: 5, overflowX: 'auto', padding: '10px 14px 0', scrollbarWidth: 'none' }}>
            <button type="button" onClick={() => setSelectedCat('all')} style={{ flexShrink: 0, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', border: selectedCat === 'all' ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)', background: selectedCat === 'all' ? 'var(--color-primary)' : 'var(--color-bg)', color: selectedCat === 'all' ? '#fff' : 'var(--color-text)' }}>
              Semua ({report.items.length})
            </button>
            {categories.map((cat) => {
              const count = report.items.filter((i) => i.category === cat).length;
              const isActive = selectedCat === cat;
              return (
                <button key={cat} type="button" onClick={() => setSelectedCat(cat)} style={{ flexShrink: 0, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', border: isActive ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)', background: isActive ? 'var(--color-primary)' : 'var(--color-bg)', color: isActive ? '#fff' : 'var(--color-text)' }}>
                  {RP_CAT_LABELS[cat]} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Insight items */}
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filteredItems.length === 0 ? (
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '8px 0' }}>Tidak ada insight untuk kategori ini.</p>
          ) : (
            filteredItems.map((item) => <RpInsightItemRow key={item.id} item={item} />)
          )}
        </div>

        {/* AI Constitution — timestamp, data source, confidence status */}
        <div style={{ padding: '10px 14px 12px', borderTop: '1px solid var(--color-border)', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontSize: 10, color: 'var(--color-muted)', textAlign: 'right' }}>
            🤖 Dianalisis {analyzedAt}
          </div>
          <div style={{ fontSize: 9.5, color: 'var(--color-muted)', textAlign: 'right' }}>
            Sumber: {report.dataSource.length} modul reproduksi · Status: {report.confidenceStatus} ({report.version})
          </div>
        </div>
      </Card>
    </section>
  );
}

// ─── Ringkasan (live-derived) ────────────────────────────────────────────────
// Setiap angka diturunkan secara langsung dari registry data — tidak ada nilai
// yang di-hardcode (sesuai Project Constitution: "honest data").
// - Program Aktif    : Program berstatus 'Berjalan'.
// - Betina Bunting   : Kebuntingan dengan status aktif (bukan Keguguran/Selesai).
// - Total Kelahiran  : Semua KelahiranRecord lintas Program.
// - Jadwal Pemeriksaan: reminders belum diimplementasikan (RP-008 scope = 0).

function RingkasanCards() {
  const programs = getProgramList();
  const programAktif = programs.filter((p) => p.status === 'Berjalan').length;
  const betinaBunting = programs
    .flatMap((p) => getPregnancyListByProgram(p.id))
    .filter((k) => !isStatusFinal(k.status))
    .length;
  const totalKelahiran = programs
    .flatMap((p) => getKelahiranListByProgram(p.id))
    .length;

  const items: Array<{ key: string; label: string; icon: string; value: number; color: string; bg: string }> = [
    { key: 'programAktif',      label: 'Program Aktif',      icon: '🗂️', value: programAktif,   color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
    { key: 'betinaBunting',     label: 'Betina Bunting',     icon: '🤰', value: betinaBunting,  color: '#c2185b',              bg: '#fce4ec' },
    { key: 'jadwalPemeriksaan', label: 'Jadwal Pemeriksaan', icon: '🗓️', value: 0,              color: '#ef6c00',              bg: '#fff3e0' },
    { key: 'totalKelahiran',    label: 'Total Kelahiran',    icon: '🐣', value: totalKelahiran, color: '#2e7d32',              bg: '#e8f5e9' },
  ];

  return (
    <section>
      <SectionLabel title="Ringkasan" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {items.map(({ key, label, icon, value, color, bg }) => (
          <div
            key={key}
            style={{
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-sm)',
              padding: '14px 14px 12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.3 }}>
                {label}
              </span>
            </div>
            <div style={{
              fontSize: 26, fontWeight: 800,
              color, background: bg,
              borderRadius: 'var(--radius-sm)',
              padding: '4px 10px',
              display: 'inline-block',
              minWidth: 40,
              textAlign: 'center',
            }}>
              {value}
            </div>
          </div>
        ))}

        {/* Riwayat Terakhir — full width card */}
        <div style={{
          gridColumn: '1 / -1',
          background: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          padding: '14px 14px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>🕒</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.3 }}>
              Riwayat Terakhir
            </span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', fontStyle: 'italic' }}>
            Belum ada data
          </span>
        </div>
      </div>
    </section>
  );
}

// ─── Search & Filter ────────────────────────────────────────────────────────

// (SearchFilterBar, FilterSheet, FilterChips imported from LivestockFilterSheet)

// ─── Program Reproduksi: badges ─────────────────────────────────────────────

const METODE_BADGE_CFG: Record<MetodeReproduksi, { bg: string; color: string }> = {
  'Kawin Alami':             { bg: '#e8f5e9', color: '#2e7d32' },
  'Kawin Koloni':            { bg: '#e3f2fd', color: '#0277bd' },
  'Titip Kawin':             { bg: '#f3e5f5', color: '#6a1b9a' },
  'Inseminasi Buatan (IB)':  { bg: '#fff8e1', color: '#f57f17' },
  'Embryo Transfer':         { bg: '#fce4ec', color: '#c2185b' },
  'IVF':                     { bg: '#ede7f6', color: '#4527a0' },
  'Lainnya':                 { bg: '#eceff1', color: '#546e7a' },
};

const STATUS_PROGRAM_CFG: Record<StatusProgram, { bg: string; color: string }> = {
  Draft:      { bg: '#eceff1', color: '#546e7a' },
  Berjalan:   { bg: '#e3f2fd', color: '#0277bd' },
  Selesai:    { bg: '#e8f5e9', color: '#2e7d32' },
  Dibatalkan: { bg: '#ffebee', color: '#c62828' },
};

function MetodeBadge({ metode }: { metode: MetodeReproduksi }) {
  const cfg = METODE_BADGE_CFG[metode];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: '2px 8px' }}>
      {metode}
    </span>
  );
}

function StatusProgramBadge({ status }: { status: StatusProgram }) {
  const cfg = STATUS_PROGRAM_CFG[status];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: '2px 8px' }}>
      {status}
    </span>
  );
}

function ProgressBar({ status }: { status: StatusProgram }) {
  const pct = progressForStatus(status);
  const barColor = status === 'Dibatalkan' ? 'var(--color-border)' : 'var(--color-primary)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)' }}>Progress</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)' }}>
          {status === 'Dibatalkan' ? 'Dibatalkan' : `${pct}%`}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 4, background: 'var(--color-bg)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 4 }} />
      </div>
    </div>
  );
}

// ─── Program Card ───────────────────────────────────────────────────────────

function ProgramCard({ program, onDetail, onEdit, onCancel }: {
  program: ReproduksiProgramRecord;
  onDetail: () => void;
  onEdit: () => void;
  onCancel: () => void;
}) {
  const canCancel = program.status === 'Draft' || program.status === 'Berjalan';

  return (
    <Card style={{ padding: '14px 14px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.25 }}>
            {program.namaProgram}
          </div>
          <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace', marginTop: 2 }}>
            {program.nomorProgram}
          </div>
        </div>
        <StatusProgramBadge status={program.status} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        <MetodeBadge metode={program.metode} />
        <span style={{ fontSize: 10, color: 'var(--color-border)' }}>·</span>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text)' }}>
          ♂ {program.pejantanIds.length} pejantan
        </span>
        <span style={{ fontSize: 10, color: 'var(--color-border)' }}>·</span>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text)' }}>
          ♀ {program.betinaIds.length} betina
        </span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <ProgressBar status={program.status} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onDetail} style={{
          flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 700,
          border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
          background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer',
        }}>
          Detail
        </button>
        <button type="button" onClick={onEdit} style={{
          flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 700,
          border: '1.5px solid var(--color-primary)', borderRadius: 'var(--radius-sm)',
          background: 'var(--color-surface)', color: 'var(--color-primary)', cursor: 'pointer',
        }}>
          Edit
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={!canCancel}
          style={{
            flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 700,
            border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)',
            color: canCancel ? 'var(--color-danger)' : 'var(--color-border)',
            cursor: canCancel ? 'pointer' : 'not-allowed',
          }}
        >
          Batalkan
        </button>
      </div>
    </Card>
  );
}

// ─── Peserta Picker (checklist Pejantan / Betina) ───────────────────────────

function PesertaPicker({ title, kelamin, allLivestock, selectedIds, onToggle }: {
  title: string;
  kelamin: 'Jantan' | 'Betina';
  allLivestock: LivestockRecord[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const options = allLivestock.filter((lv) => lv.kelamin === kelamin);

  return (
    <div>
      <FieldLabel label={`${title} (${selectedIds.length} dipilih)`} />
      {options.length === 0 ? (
        <div style={{
          border: '1.5px dashed var(--color-border)', borderRadius: 'var(--radius-sm)',
          padding: '14px 12px', textAlign: 'center', fontSize: 12, color: 'var(--color-muted)',
        }}>
          Belum ada ternak {kelamin.toLowerCase()} terdaftar.
        </div>
      ) : (
        <div style={{
          border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
          maxHeight: 180, overflowY: 'auto',
        }}>
          {options.map((lv, i) => (
            <label
              key={lv.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px',
                borderBottom: i < options.length - 1 ? '1px solid var(--color-border)' : 'none',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(lv.id)}
                onChange={() => onToggle(lv.id)}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>
                  {lv.name ?? <span style={{ fontStyle: 'italic', fontWeight: 400 }}>Tanpa Nama</span>}
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace' }}>{lv.id}</div>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Program Form Sheet (Tambah / Edit) ─────────────────────────────────────

function emptyFormState(): ProgramInput {
  return {
    namaProgram: '',
    metode: 'Kawin Alami',
    lokasi: '',
    petugas: '',
    tanggalMulai: '',
    targetSelesai: '',
    status: 'Draft',
    catatan: '',
    pejantanIds: [],
    betinaIds: [],
    dataIB: { kodeStraw: '', asalPejantan: '' },
  };
}

function formStateFromProgram(p: ReproduksiProgramRecord): ProgramInput {
  return {
    namaProgram: p.namaProgram,
    metode: p.metode,
    lokasi: p.lokasi,
    petugas: p.petugas,
    tanggalMulai: p.tanggalMulai,
    targetSelesai: p.targetSelesai,
    status: p.status,
    catatan: p.catatan ?? '',
    pejantanIds: [...p.pejantanIds],
    betinaIds: [...p.betinaIds],
    dataIB: p.dataIB ? { ...p.dataIB } : { kodeStraw: '', asalPejantan: '' },
  };
}

function ProgramFormSheet({ mode, programId, initial, allLivestock, onClose, onSaved }: {
  mode: 'create' | 'edit';
  programId?: string;
  initial: ProgramInput;
  allLivestock: LivestockRecord[];
  onClose: () => void;
  onSaved: (program: ReproduksiProgramRecord) => void;
}) {
  const [form, setForm]   = useState<ProgramInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const { activeWorkspace } = useWorkspace();

  function togglePejantan(id: string) {
    setForm((f) => ({
      ...f,
      pejantanIds: f.pejantanIds.includes(id)
        ? f.pejantanIds.filter((x) => x !== id)
        : [...f.pejantanIds, id],
    }));
  }

  function toggleBetina(id: string) {
    setForm((f) => ({
      ...f,
      betinaIds: f.betinaIds.includes(id)
        ? f.betinaIds.filter((x) => x !== id)
        : [...f.betinaIds, id],
    }));
  }

  const dataIBActive = form.pejantanIds.length === 0;
  const pesertaError = validateProgramPeserta(form.betinaIds, form.pejantanIds, form.dataIB);

  function handleSave() {
    try {
      const savedProgram = mode === 'create'
        ? addProgram(form)
        : updateProgram(programId ?? '', form);
      onSaved(savedProgram);

      // ── Supabase dual-write (fire-and-forget) ────────────────────────────
      if (activeWorkspace?.workspace_uuid) {
        if (mode === 'create') {
          void recordProgram(activeWorkspace.workspace_uuid, savedProgram).catch((err) =>
            console.error('[Reproduksi] recordProgram failed:', err),
          );
        } else {
          void updateProgramInDb(savedProgram).catch((err) =>
            console.error('[Reproduksi] updateProgramInDb failed:', err),
          );
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan Program Reproduksi.');
    }
  }

  return (
    <SheetShell
      title={mode === 'create' ? 'Program Reproduksi Baru' : 'Edit Program Reproduksi'}
      subtitle="Program Reproduksi adalah induk dari seluruh aktivitas reproduksi"
      onClose={onClose}
      footer={
        <button type="button" onClick={handleSave} style={{
          width: '100%', background: 'var(--color-primary)', color: '#fff',
          border: 'none', borderRadius: 'var(--radius-sm)', padding: '13px 0',
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}>
          Simpan Program
        </button>
      }
    >
      {error && (
        <div style={{ background: '#ffebee', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: 12.5, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <div>
        <FieldLabel label="Nama Program" />
        <input type="text" placeholder="contoh: Program Kawin Domba Blok A" value={form.namaProgram}
          onChange={(e) => setForm((f) => ({ ...f, namaProgram: e.target.value }))} />
      </div>

      <div>
        <FieldLabel label="Metode" />
        <div style={{ position: 'relative' }}>
          <select
            value={form.metode}
            onChange={(e) => setForm((f) => ({ ...f, metode: e.target.value as MetodeReproduksi }))}
            style={{
              width: '100%', padding: '10px 32px 10px 12px',
              border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              fontSize: 13, fontWeight: 600, appearance: 'none', outline: 'none', cursor: 'pointer',
            }}
          >
            {METODE_REPRODUKSI_LIST.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--color-muted)', pointerEvents: 'none' }}>▾</span>
        </div>
      </div>

      <div>
        <FieldLabel label="Lokasi" />
        <input type="text" placeholder="contoh: Kandang A, Blok 2" value={form.lokasi}
          onChange={(e) => setForm((f) => ({ ...f, lokasi: e.target.value }))} />
      </div>

      <div>
        <FieldLabel label="Petugas" />
        <input type="text" placeholder="Nama petugas penanggung jawab" value={form.petugas}
          onChange={(e) => setForm((f) => ({ ...f, petugas: e.target.value }))} />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel label="Tanggal Mulai" />
          <input type="date" value={form.tanggalMulai}
            onChange={(e) => setForm((f) => ({ ...f, tanggalMulai: e.target.value }))} />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel label="Target Selesai" />
          <input type="date" value={form.targetSelesai}
            onChange={(e) => setForm((f) => ({ ...f, targetSelesai: e.target.value }))} />
        </div>
      </div>

      <div>
        <FieldLabel label="Status" />
        <div style={{ position: 'relative' }}>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as StatusProgram }))}
            style={{
              width: '100%', padding: '10px 32px 10px 12px',
              border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              fontSize: 13, fontWeight: 600, appearance: 'none', outline: 'none', cursor: 'pointer',
            }}
          >
            {STATUS_PROGRAM_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--color-muted)', pointerEvents: 'none' }}>▾</span>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--color-border)' }} />

      <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
        Minimal 1 betina, dan minimal salah satu: 1 pejantan atau Data IB.
      </div>

      <PesertaPicker
        title="Pejantan"
        kelamin="Jantan"
        allLivestock={allLivestock}
        selectedIds={form.pejantanIds}
        onToggle={togglePejantan}
      />

      <PesertaPicker
        title="Betina"
        kelamin="Betina"
        allLivestock={allLivestock}
        selectedIds={form.betinaIds}
        onToggle={toggleBetina}
      />

      {/* Data IB — relevan ketika belum ada pejantan fisik terdaftar */}
      <div>
        <FieldLabel label={`Data IB${dataIBActive ? ' (wajib jika tanpa pejantan)' : ' (opsional)'}`} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="text"
            placeholder="Kode Straw"
            value={form.dataIB?.kodeStraw ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, dataIB: { kodeStraw: e.target.value, asalPejantan: f.dataIB?.asalPejantan ?? '' } }))}
          />
          <input
            type="text"
            placeholder="Asal Pejantan (donor)"
            value={form.dataIB?.asalPejantan ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, dataIB: { kodeStraw: f.dataIB?.kodeStraw ?? '', asalPejantan: e.target.value } }))}
          />
        </div>
        {form.dataIB && hasValidDataIB(form.dataIB) && (
          <div style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 600, marginTop: 6 }}>
            ✓ Data IB terisi
          </div>
        )}
      </div>

      {pesertaError && (
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-danger)' }}>
          {pesertaError}
        </div>
      )}

      <div>
        <FieldLabel label="Catatan (opsional)" />
        <textarea
          placeholder="Catatan tambahan tentang program ini..."
          value={form.catatan ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))}
          style={{ minHeight: 80 }}
        />
      </div>
    </SheetShell>
  );
}

// ─── Program Detail Sheet ───────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function ProgramDetailSheet({ program, allLivestock, onClose }: {
  program: ReproduksiProgramRecord;
  allLivestock: LivestockRecord[];
  onClose: () => void;
}) {
  const byId = new Map(allLivestock.map((lv) => [lv.id, lv]));
  const pejantanNames = program.pejantanIds.map((id) => byId.get(id)?.name ?? id);
  const betinaNames   = program.betinaIds.map((id) => byId.get(id)?.name ?? id);

  return (
    <SheetShell title={program.namaProgram} subtitle={program.nomorProgram} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <MetodeBadge metode={program.metode} />
        <StatusProgramBadge status={program.status} />
      </div>

      <ProgressBar status={program.status} />

      <div style={{ height: 1, background: 'var(--color-border)' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <DetailRow label="Lokasi" value={program.lokasi} />
        <DetailRow label="Petugas" value={program.petugas} />
        <DetailRow label="Tanggal Mulai" value={program.tanggalMulai || '—'} />
        <DetailRow label="Target Selesai" value={program.targetSelesai || '—'} />
      </div>

      <div style={{ height: 1, background: 'var(--color-border)' }} />

      <div>
        <FieldLabel label={`Pejantan (${program.pejantanIds.length})`} />
        {pejantanNames.length > 0 ? (
          <div style={{ fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.6 }}>
            {pejantanNames.join(', ')}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--color-muted)', fontStyle: 'italic' }}>Tidak ada pejantan fisik terdaftar</div>
        )}
      </div>

      <div>
        <FieldLabel label={`Betina (${program.betinaIds.length})`} />
        <div style={{ fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.6 }}>
          {betinaNames.join(', ')}
        </div>
      </div>

      {program.dataIB && (
        <div>
          <FieldLabel label="Data IB" />
          <div style={{ fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.6 }}>
            Kode Straw: {program.dataIB.kodeStraw}<br />
            Asal Pejantan: {program.dataIB.asalPejantan}
          </div>
        </div>
      )}

      {program.catatan && (
        <div>
          <FieldLabel label="Catatan" />
          <div style={{ fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.6 }}>{program.catatan}</div>
        </div>
      )}

      <div style={{ height: 1, background: 'var(--color-border)' }} />

      <PelaksanaanSection program={program} allLivestock={allLivestock} />

      <div style={{ height: 1, background: 'var(--color-border)' }} />

      <PemeriksaanKebuntinganSection program={program} />

      <div style={{ height: 1, background: 'var(--color-border)' }} />

      <KebuntinganSection program={program} allLivestock={allLivestock} />

      <div style={{ height: 1, background: 'var(--color-border)' }} />

      <KelahiranSection program={program} allLivestock={allLivestock} />

      <div style={{ height: 1, background: 'var(--color-border)' }} />

      <MonitoringSection program={program} />
    </SheetShell>
  );
}

// ─── Pelaksanaan Program Reproduksi (RP-003) ────────────────────────────────
// Satu Program dapat memiliki satu atau banyak Pelaksanaan. Peserta selalu
// dibaca dari Program (read-only) — tidak dapat diubah di sini.

const STATUS_PELAKSANAAN_CFG: Record<StatusPelaksanaan, { bg: string; color: string }> = {
  Direncanakan: { bg: '#e3f2fd', color: '#0277bd' },
  Dilaksanakan: { bg: '#e8f5e9', color: '#2e7d32' },
  Ditunda:      { bg: '#fff8e1', color: '#f57f17' },
  Dibatalkan:   { bg: '#ffebee', color: '#c62828' },
};

function StatusPelaksanaanBadge({ status }: { status: StatusPelaksanaan }) {
  const cfg = STATUS_PELAKSANAAN_CFG[status];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: '2px 8px' }}>
      {status}
    </span>
  );
}

function PelaksanaanCard({ pelaksanaan, onDetail, onEdit, onCancel }: {
  pelaksanaan: PelaksanaanRecord;
  onDetail: () => void;
  onEdit: () => void;
  onCancel: () => void;
}) {
  const canCancel = pelaksanaan.status === 'Direncanakan' || pelaksanaan.status === 'Ditunda';

  return (
    <div style={{
      border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
      padding: '11px 12px', display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--color-text)', fontFamily: 'monospace' }}>
            {pelaksanaan.nomorPelaksanaan}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 2 }}>
            {pelaksanaan.tanggal || '—'} · {pelaksanaan.jam || '—'}
          </div>
        </div>
        <StatusPelaksanaanBadge status={pelaksanaan.status} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <MetodeBadge metode={pelaksanaan.metode} />
        {pelaksanaan.lampiran.length > 0 && (
          <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>
            📎 {pelaksanaan.lampiran.length} lampiran
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button type="button" onClick={onDetail} style={{
          flex: 1, padding: '6px 0', fontSize: 11.5, fontWeight: 700,
          border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
          background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer',
        }}>
          Detail
        </button>
        <button type="button" onClick={onEdit} style={{
          flex: 1, padding: '6px 0', fontSize: 11.5, fontWeight: 700,
          border: '1.5px solid var(--color-primary)', borderRadius: 'var(--radius-sm)',
          background: 'var(--color-surface)', color: 'var(--color-primary)', cursor: 'pointer',
        }}>
          Edit
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={!canCancel}
          style={{
            flex: 1, padding: '6px 0', fontSize: 11.5, fontWeight: 700,
            border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)',
            color: canCancel ? 'var(--color-danger)' : 'var(--color-border)',
            cursor: canCancel ? 'pointer' : 'not-allowed',
          }}
        >
          Batalkan
        </button>
      </div>
    </div>
  );
}

function LampiranEditor({ lampiran, onChange }: {
  lampiran: LampiranPelaksanaan[];
  onChange: (next: LampiranPelaksanaan[]) => void;
}) {
  const [jenis, setJenis]     = useState<JenisLampiran>('Foto');
  const [namaFile, setNamaFile] = useState('');

  function addItem() {
    if (!namaFile.trim()) return;
    onChange([...lampiran, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, jenis, namaFile: namaFile.trim() }]);
    setNamaFile('');
  }

  function removeItem(id: string) {
    onChange(lampiran.filter((l) => l.id !== id));
  }

  return (
    <div>
      <FieldLabel label={`Lampiran (${lampiran.length}) — Foto & Dokumen, belum mendukung video`} />

      {lampiran.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
          {lampiran.map((l) => (
            <div key={l.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
              border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
              padding: '7px 10px',
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {l.jenis === 'Foto' ? '🖼️' : '📄'} {l.namaFile}
              </span>
              <button type="button" onClick={() => removeItem(l.id)} style={{
                border: 'none', background: 'none', color: 'var(--color-muted)', fontSize: 13, cursor: 'pointer', flexShrink: 0,
              }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flexShrink: 0, width: 100 }}>
          <select
            value={jenis}
            onChange={(e) => setJenis(e.target.value as JenisLampiran)}
            style={{
              width: '100%', padding: '9px 26px 9px 10px',
              border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              fontSize: 12, fontWeight: 600, appearance: 'none', outline: 'none', cursor: 'pointer',
            }}
          >
            {JENIS_LAMPIRAN_LIST.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--color-muted)', pointerEvents: 'none' }}>▾</span>
        </div>
        <input
          type="text"
          placeholder={jenis === 'Foto' ? 'Nama file foto...' : 'Nama file dokumen...'}
          value={namaFile}
          onChange={(e) => setNamaFile(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="button" onClick={addItem} style={{
          flexShrink: 0, padding: '0 14px', fontSize: 12, fontWeight: 700,
          border: 'none', borderRadius: 'var(--radius-sm)',
          background: 'var(--color-primary)', color: '#fff', cursor: 'pointer',
        }}>
          + Tambah
        </button>
      </div>
    </div>
  );
}

function emptyPelaksanaanForm(defaultMetode: MetodeReproduksi): PelaksanaanInput {
  return {
    tanggal: '', jam: '', lokasi: '', petugas: '',
    metode: defaultMetode, status: 'Direncanakan', catatan: '', lampiran: [],
  };
}

function pelaksanaanFormFromRecord(p: PelaksanaanRecord): PelaksanaanInput {
  return {
    tanggal: p.tanggal, jam: p.jam, lokasi: p.lokasi, petugas: p.petugas,
    metode: p.metode, status: p.status, catatan: p.catatan ?? '', lampiran: [...p.lampiran],
  };
}

function PelaksanaanFormSheet({ mode, program, pelaksanaanId, initial, allLivestock, onClose, onSaved }: {
  mode: 'create' | 'edit';
  program: ReproduksiProgramRecord;
  pelaksanaanId?: string;
  initial: PelaksanaanInput;
  allLivestock: LivestockRecord[];
  onClose: () => void;
  onSaved: (p: PelaksanaanRecord) => void;
}) {
  const [form, setForm]   = useState<PelaksanaanInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const { activeWorkspace } = useWorkspace();

  const byId = new Map(allLivestock.map((lv) => [lv.id, lv]));
  const pejantanNames = program.pejantanIds.map((id) => byId.get(id)?.name ?? id);
  const betinaNames   = program.betinaIds.map((id) => byId.get(id)?.name ?? id);

  function handleSave() {
    try {
      const saved = mode === 'create'
        ? addPelaksanaan(program.id, form)
        : updatePelaksanaan(pelaksanaanId ?? '', form);
      onSaved(saved);

      // ── Supabase dual-write (fire-and-forget) ────────────────────────────
      if (mode === 'create' && activeWorkspace?.workspace_uuid) {
        void recordPelaksanaan(activeWorkspace.workspace_uuid, saved).catch((err) =>
          console.error('[Reproduksi] recordPelaksanaan failed:', err),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan Pelaksanaan.');
    }
  }

  return (
    <SheetShell
      title={mode === 'create' ? 'Pelaksanaan Baru' : 'Edit Pelaksanaan'}
      subtitle={`Program: ${program.namaProgram}`}
      onClose={onClose}
      zIndex={400}
      footer={
        <button type="button" onClick={handleSave} style={{
          width: '100%', background: 'var(--color-primary)', color: '#fff',
          border: 'none', borderRadius: 'var(--radius-sm)', padding: '13px 0',
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}>
          Simpan Pelaksanaan
        </button>
      }
    >
      {error && (
        <div style={{ background: '#ffebee', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: 12.5, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel label="Tanggal" />
          <input type="date" value={form.tanggal}
            onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))} />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel label="Jam" />
          <input type="time" value={form.jam}
            onChange={(e) => setForm((f) => ({ ...f, jam: e.target.value }))} />
        </div>
      </div>

      <div>
        <FieldLabel label="Lokasi" />
        <input type="text" placeholder="contoh: Kandang A, Blok 2" value={form.lokasi}
          onChange={(e) => setForm((f) => ({ ...f, lokasi: e.target.value }))} />
      </div>

      <div>
        <FieldLabel label="Petugas" />
        <input type="text" placeholder="Nama petugas pelaksana" value={form.petugas}
          onChange={(e) => setForm((f) => ({ ...f, petugas: e.target.value }))} />
      </div>

      <div>
        <FieldLabel label="Metode" />
        <div style={{ position: 'relative' }}>
          <select
            value={form.metode}
            onChange={(e) => setForm((f) => ({ ...f, metode: e.target.value as MetodeReproduksi }))}
            style={{
              width: '100%', padding: '10px 32px 10px 12px',
              border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              fontSize: 13, fontWeight: 600, appearance: 'none', outline: 'none', cursor: 'pointer',
            }}
          >
            {METODE_REPRODUKSI_LIST.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--color-muted)', pointerEvents: 'none' }}>▾</span>
        </div>
      </div>

      <div>
        <FieldLabel label="Status" />
        <div style={{ position: 'relative' }}>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as StatusPelaksanaan }))}
            style={{
              width: '100%', padding: '10px 32px 10px 12px',
              border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              fontSize: 13, fontWeight: 600, appearance: 'none', outline: 'none', cursor: 'pointer',
            }}
          >
            {STATUS_PELAKSANAAN_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--color-muted)', pointerEvents: 'none' }}>▾</span>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--color-border)' }} />

      {/* Peserta — dibaca dari Program, read-only. Hanya dapat diubah melalui Program Reproduksi. */}
      <div>
        <FieldLabel label={`Peserta Program (read-only)`} />
        <div style={{
          border: '1.5px dashed var(--color-border)', borderRadius: 'var(--radius-sm)',
          padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ fontSize: 12, color: 'var(--color-text)' }}>
            <strong>Pejantan ({program.pejantanIds.length}):</strong> {pejantanNames.length > 0 ? pejantanNames.join(', ') : 'Tidak ada pejantan fisik terdaftar'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text)' }}>
            <strong>Betina ({program.betinaIds.length}):</strong> {betinaNames.join(', ')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', fontStyle: 'italic' }}>
            Peserta hanya dapat diubah melalui Program Reproduksi.
          </div>
        </div>
      </div>

      <LampiranEditor lampiran={form.lampiran} onChange={(next) => setForm((f) => ({ ...f, lampiran: next }))} />

      <div>
        <FieldLabel label="Catatan (opsional)" />
        <textarea
          placeholder="Catatan pelaksanaan di lapangan..."
          value={form.catatan ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))}
          style={{ minHeight: 80 }}
        />
      </div>
    </SheetShell>
  );
}

function PelaksanaanDetailSheet({ pelaksanaan, program, allLivestock, onClose }: {
  pelaksanaan: PelaksanaanRecord;
  program: ReproduksiProgramRecord;
  allLivestock: LivestockRecord[];
  onClose: () => void;
}) {
  const byId = new Map(allLivestock.map((lv) => [lv.id, lv]));
  const pejantanNames = program.pejantanIds.map((id) => byId.get(id)?.name ?? id);
  const betinaNames   = program.betinaIds.map((id) => byId.get(id)?.name ?? id);

  return (
    <SheetShell title={pelaksanaan.nomorPelaksanaan} subtitle={`Program: ${program.namaProgram}`} onClose={onClose} zIndex={400}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <MetodeBadge metode={pelaksanaan.metode} />
        <StatusPelaksanaanBadge status={pelaksanaan.status} />
      </div>

      <div style={{ height: 1, background: 'var(--color-border)' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <DetailRow label="Tanggal" value={pelaksanaan.tanggal || '—'} />
        <DetailRow label="Jam" value={pelaksanaan.jam || '—'} />
        <DetailRow label="Lokasi" value={pelaksanaan.lokasi} />
        <DetailRow label="Petugas" value={pelaksanaan.petugas} />
      </div>

      <div style={{ height: 1, background: 'var(--color-border)' }} />

      <div>
        <FieldLabel label={`Peserta Program`} />
        <div style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>
          <strong>Pejantan ({program.pejantanIds.length}):</strong> {pejantanNames.length > 0 ? pejantanNames.join(', ') : 'Tidak ada pejantan fisik terdaftar'}<br />
          <strong>Betina ({program.betinaIds.length}):</strong> {betinaNames.join(', ')}
        </div>
      </div>

      <div>
        <FieldLabel label={`Lampiran (${pelaksanaan.lampiran.length})`} />
        {pelaksanaan.lampiran.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pelaksanaan.lampiran.map((l) => (
              <div key={l.id} style={{ fontSize: 12, color: 'var(--color-text)' }}>
                {l.jenis === 'Foto' ? '🖼️' : '📄'} {l.namaFile}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--color-muted)', fontStyle: 'italic' }}>Belum ada lampiran.</div>
        )}
      </div>

      {pelaksanaan.catatan && (
        <div>
          <FieldLabel label="Catatan" />
          <div style={{ fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.6 }}>{pelaksanaan.catatan}</div>
        </div>
      )}

      <div style={{ fontSize: 11, color: 'var(--color-muted)', fontStyle: 'italic' }}>
        Hasil (bunting/gagal) belum ditentukan di sini — pelaksanaan hanya mencatat bahwa aktivitas telah dilakukan.
      </div>
    </SheetShell>
  );
}

type PelaksanaanFormState = { kind: 'create' } | { kind: 'edit'; pelaksanaan: PelaksanaanRecord } | null;

function PelaksanaanSection({ program, allLivestock }: {
  program: ReproduksiProgramRecord;
  allLivestock: LivestockRecord[];
}) {
  const [tick, setTick] = useState(0);
  const [formSheet, setFormSheet] = useState<PelaksanaanFormState>(null);
  const [detailItem, setDetailItem] = useState<PelaksanaanRecord | null>(null);

  const list = getPelaksanaanListByProgram(program.id);
  const canAdd = isProgramAktifUntukPelaksanaan(program);

  function handleSaved() {
    setFormSheet(null);
    setTick((t) => t + 1);
  }

  function handleCancel(p: PelaksanaanRecord) {
    if (!window.confirm(`Batalkan Pelaksanaan "${p.nomorPelaksanaan}"?`)) return;
    try {
      cancelPelaksanaan(p.id);
      setTick((t) => t + 1);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Gagal membatalkan Pelaksanaan.');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <FieldLabel label={`Pelaksanaan (${list.length})`} />
        <button
          type="button"
          onClick={() => canAdd && setFormSheet({ kind: 'create' })}
          disabled={!canAdd}
          style={{
            fontSize: 11, fontWeight: 700,
            color: canAdd ? 'var(--color-primary)' : 'var(--color-border)',
            background: canAdd ? 'var(--color-primary-light)' : 'var(--color-bg)',
            border: 'none', borderRadius: 20, padding: '5px 12px',
            cursor: canAdd ? 'pointer' : 'not-allowed',
          }}
        >
          + Pelaksanaan Baru
        </button>
      </div>

      {!canAdd && (
        <div style={{ fontSize: 11.5, color: 'var(--color-muted)', fontStyle: 'italic', marginBottom: 10 }}>
          Program berstatus "{program.status}" — tidak dapat menambah Pelaksanaan baru.
        </div>
      )}

      {list.length === 0 ? (
        <div style={{
          border: '1.5px dashed var(--color-border)', borderRadius: 'var(--radius-sm)',
          padding: '18px 14px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Belum ada Pelaksanaan untuk program ini.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.map((p) => (
            <PelaksanaanCard
              key={p.id}
              pelaksanaan={p}
              onDetail={() => setDetailItem(p)}
              onEdit={() => setFormSheet({ kind: 'edit', pelaksanaan: p })}
              onCancel={() => handleCancel(p)}
            />
          ))}
        </div>
      )}

      {formSheet && (
        <PelaksanaanFormSheet
          mode={formSheet.kind}
          program={program}
          pelaksanaanId={formSheet.kind === 'edit' ? formSheet.pelaksanaan.id : undefined}
          initial={formSheet.kind === 'create' ? emptyPelaksanaanForm(program.metode) : pelaksanaanFormFromRecord(formSheet.pelaksanaan)}
          allLivestock={allLivestock}
          onClose={() => setFormSheet(null)}
          onSaved={handleSaved}
        />
      )}

      {detailItem && (
        <PelaksanaanDetailSheet
          pelaksanaan={detailItem}
          program={program}
          allLivestock={allLivestock}
          onClose={() => setDetailItem(null)}
        />
      )}
    </div>
  );
}

// ─── Pemeriksaan Kebuntingan / Pregnancy Examination (RP-005) ──────────────
// Pemeriksaan Kebuntingan mencatat HASIL PEMERIKSAAN sebuah Program — TIDAK
// mencatat kelahiran dan TIDAK membuat data anak (offspring). Satu Program
// dapat memiliki banyak Pemeriksaan (mis. pemeriksaan ulang). Setiap
// Pemeriksaan yang tersimpan otomatis muncul di Timeline Reproduksi (RP-004)
// via getFullTimelineForProgram — tidak mengubah data Monitoring itu sendiri.

const HASIL_PEMERIKSAAN_CFG: Record<HasilPemeriksaan, { bg: string; color: string }> = {
  'Bunting':                  { bg: '#e8f5e9', color: '#2e7d32' },
  'Tidak Bunting':            { bg: '#eceff1', color: '#546e7a' },
  'Tidak Pasti':              { bg: '#fff8e1', color: '#f57f17' },
  'Perlu Pemeriksaan Ulang':  { bg: '#ffebee', color: '#c62828' },
};

function HasilPemeriksaanBadge({ hasil }: { hasil: HasilPemeriksaan }) {
  const cfg = HASIL_PEMERIKSAAN_CFG[hasil];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: '2px 8px' }}>
      {hasil}
    </span>
  );
}

function PemeriksaanKebuntinganCard({ pemeriksaan, onDetail, onEdit }: {
  pemeriksaan: PemeriksaanKebuntinganRecord;
  onDetail: () => void;
  onEdit: () => void;
}) {
  return (
    <div style={{
      border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
      padding: '11px 12px', display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--color-text)' }}>
            🤰 {pemeriksaan.metode}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 2 }}>
            {pemeriksaan.tanggalPemeriksaan || '—'} · {pemeriksaan.petugas}
          </div>
        </div>
        <HasilPemeriksaanBadge hasil={pemeriksaan.hasil} />
      </div>

      {pemeriksaan.lampiran.length > 0 && (
        <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>
          📎 {pemeriksaan.lampiran.length} lampiran
        </span>
      )}

      <div style={{ display: 'flex', gap: 6 }}>
        <button type="button" onClick={onDetail} style={{
          flex: 1, padding: '6px 0', fontSize: 11.5, fontWeight: 700,
          border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
          background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer',
        }}>
          Detail
        </button>
        <button type="button" onClick={onEdit} style={{
          flex: 1, padding: '6px 0', fontSize: 11.5, fontWeight: 700,
          border: '1.5px solid var(--color-primary)', borderRadius: 'var(--radius-sm)',
          background: 'var(--color-surface)', color: 'var(--color-primary)', cursor: 'pointer',
        }}>
          Edit
        </button>
      </div>
    </div>
  );
}

function emptyPemeriksaanForm(): PemeriksaanKebuntinganInput {
  return {
    livestockId: null,
    tanggalPemeriksaan: '', petugas: '', metode: METODE_PEMERIKSAAN_LIST[0],
    perkiraanUsiaKebuntingan: '', hasil: HASIL_PEMERIKSAAN_LIST[0], catatan: '', lampiran: [],
  };
}

function pemeriksaanFormFromRecord(p: PemeriksaanKebuntinganRecord): PemeriksaanKebuntinganInput {
  return {
    livestockId: p.livestockId,
    tanggalPemeriksaan: p.tanggalPemeriksaan, petugas: p.petugas, metode: p.metode,
    perkiraanUsiaKebuntingan: p.perkiraanUsiaKebuntingan ?? '', hasil: p.hasil,
    catatan: p.catatan ?? '', lampiran: [...p.lampiran],
  };
}

type PemeriksaanFormState =
  | { kind: 'create' }
  | { kind: 'edit'; pemeriksaan: PemeriksaanKebuntinganRecord }
  | null;

function PemeriksaanKebuntinganFormSheet({ mode, program, pemeriksaanId, initial, onClose, onSaved }: {
  mode: 'create' | 'edit';
  program: ReproduksiProgramRecord;
  pemeriksaanId?: string;
  initial: PemeriksaanKebuntinganInput;
  onClose: () => void;
  onSaved: (p: PemeriksaanKebuntinganRecord) => void;
}) {
  const [form, setForm]   = useState<PemeriksaanKebuntinganInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const { activeWorkspace } = useWorkspace();

  function handleSave() {
    try {
      const saved = mode === 'create'
        ? addPemeriksaanKebuntingan(program.id, form)
        : updatePemeriksaanKebuntingan(pemeriksaanId ?? '', form);
      // ── Supabase dual-write (fire-and-forget, create only) ──────────────
      if (mode === 'create' && activeWorkspace?.workspace_uuid) {
        void recordPemeriksaanKebuntingan(activeWorkspace.workspace_uuid, saved)
          .catch((err) => console.error('[Reproduksi] recordPemeriksaanKebuntingan failed:', err));
      }
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan Pemeriksaan Kebuntingan.');
    }
  }

  return (
    <SheetShell
      title={mode === 'edit' ? 'Edit Pemeriksaan Kebuntingan' : 'Pemeriksaan Kebuntingan Baru'}
      subtitle={`Program: ${program.namaProgram}`}
      onClose={onClose}
      zIndex={400}
      footer={
        <button type="button" onClick={handleSave} style={{
          width: '100%', background: 'var(--color-primary)', color: '#fff',
          border: 'none', borderRadius: 'var(--radius-sm)', padding: '13px 0',
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}>
          Simpan Pemeriksaan
        </button>
      }
    >
      {error && (
        <div style={{ background: '#ffebee', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: 12.5, fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Betina picker — only shown when the program has known betina participants */}
      {program.betinaIds.length > 0 && (
        <div>
          <FieldLabel label="Betina yang Diperiksa" />
          <div style={{ position: 'relative' }}>
            <select
              value={form.livestockId ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, livestockId: e.target.value || null }))}
              style={{
                width: '100%', padding: '10px 32px 10px 12px',
                border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface)', color: 'var(--color-text)',
                fontSize: 13, fontWeight: 600, appearance: 'none', outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="">— Pilih betina —</option>
              {program.betinaIds.map((id) => (
                <option key={id} value={id}>{LIVESTOCK_DB[id]?.name ?? id}</option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--color-muted)', pointerEvents: 'none' }}>▾</span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel label="Tanggal Pemeriksaan" />
          <input type="date" value={form.tanggalPemeriksaan}
            onChange={(e) => setForm((f) => ({ ...f, tanggalPemeriksaan: e.target.value }))} />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel label="Petugas (Pemeriksa)" />
          <input type="text" placeholder="Nama pemeriksa" value={form.petugas}
            onChange={(e) => setForm((f) => ({ ...f, petugas: e.target.value }))} />
        </div>
      </div>

      <div>
        <FieldLabel label="Metode Pemeriksaan" />
        <div style={{ position: 'relative' }}>
          <select
            value={form.metode}
            onChange={(e) => setForm((f) => ({ ...f, metode: e.target.value as MetodePemeriksaan }))}
            style={{
              width: '100%', padding: '10px 32px 10px 12px',
              border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              fontSize: 13, fontWeight: 600, appearance: 'none', outline: 'none', cursor: 'pointer',
            }}
          >
            {METODE_PEMERIKSAAN_LIST.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--color-muted)', pointerEvents: 'none' }}>▾</span>
        </div>
      </div>

      <div>
        <FieldLabel label="Perkiraan Usia Kebuntingan (opsional)" />
        <input type="text" placeholder="Contoh: 6 minggu" value={form.perkiraanUsiaKebuntingan ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, perkiraanUsiaKebuntingan: e.target.value }))} />
      </div>

      <div>
        <FieldLabel label="Hasil Pemeriksaan" />
        <div style={{ position: 'relative' }}>
          <select
            value={form.hasil}
            onChange={(e) => setForm((f) => ({ ...f, hasil: e.target.value as HasilPemeriksaan }))}
            style={{
              width: '100%', padding: '10px 32px 10px 12px',
              border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              fontSize: 13, fontWeight: 600, appearance: 'none', outline: 'none', cursor: 'pointer',
            }}
          >
            {HASIL_PEMERIKSAAN_LIST.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--color-muted)', pointerEvents: 'none' }}>▾</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 6, lineHeight: 1.5, fontStyle: 'italic' }}>
          {followUpMessageForHasil(form.hasil)}
        </div>
      </div>

      <LampiranEditor lampiran={form.lampiran} onChange={(next) => setForm((f) => ({ ...f, lampiran: next as LampiranPemeriksaan[] }))} />

      <div>
        <FieldLabel label="Catatan (opsional)" />
        <textarea
          placeholder="Catatan hasil pemeriksaan..."
          value={form.catatan ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))}
          style={{ minHeight: 80 }}
        />
      </div>
    </SheetShell>
  );
}

function PemeriksaanKebuntinganDetailSheet({ pemeriksaan, program, onClose }: {
  pemeriksaan: PemeriksaanKebuntinganRecord;
  program: ReproduksiProgramRecord;
  onClose: () => void;
}) {
  return (
    <SheetShell title="Detail Pemeriksaan Kebuntingan" subtitle={`Program: ${program.namaProgram}`} onClose={onClose} zIndex={400}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <HasilPemeriksaanBadge hasil={pemeriksaan.hasil} />
      </div>

      <div style={{ height: 1, background: 'var(--color-border)' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <DetailRow label="Tanggal Pemeriksaan" value={pemeriksaan.tanggalPemeriksaan || '—'} />
        <DetailRow label="Petugas (Pemeriksa)" value={pemeriksaan.petugas} />
        <DetailRow label="Metode" value={pemeriksaan.metode} />
        <DetailRow label="Perkiraan Usia Kebuntingan" value={pemeriksaan.perkiraanUsiaKebuntingan ?? '—'} />
      </div>

      <div>
        <FieldLabel label={`Lampiran (${pemeriksaan.lampiran.length})`} />
        {pemeriksaan.lampiran.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pemeriksaan.lampiran.map((l) => (
              <div key={l.id} style={{ fontSize: 12, color: 'var(--color-text)' }}>
                {l.jenis === 'Foto' ? '🖼️' : '📄'} {l.namaFile}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--color-muted)', fontStyle: 'italic' }}>Belum ada lampiran.</div>
        )}
      </div>

      {pemeriksaan.catatan && (
        <div>
          <FieldLabel label="Catatan" />
          <div style={{ fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.6 }}>{pemeriksaan.catatan}</div>
        </div>
      )}

      <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 4 }}>Tindak Lanjut</div>
        <div style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.5 }}>{followUpMessageForHasil(pemeriksaan.hasil)}</div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--color-muted)', fontStyle: 'italic' }}>
        Pemeriksaan Kebuntingan tidak mencatat kelahiran dan tidak membuat data anak (offspring).
      </div>
    </SheetShell>
  );
}

function PemeriksaanKebuntinganSection({ program }: { program: ReproduksiProgramRecord }) {
  const [tick, setTick] = useState(0);
  const [formState, setFormState] = useState<PemeriksaanFormState>(null);
  const [detailItem, setDetailItem] = useState<PemeriksaanKebuntinganRecord | null>(null);

  const list = getPemeriksaanListByProgram(program.id);
  const canAdd = isProgramAktifUntukPelaksanaan(program);

  function handleSaved() {
    setFormState(null);
    setTick((t) => t + 1);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <FieldLabel label={`Pemeriksaan Kebuntingan (${list.length})`} />
        <button
          type="button"
          onClick={() => canAdd && setFormState({ kind: 'create' })}
          disabled={!canAdd}
          style={{
            fontSize: 11, fontWeight: 700,
            color: canAdd ? 'var(--color-primary)' : 'var(--color-border)',
            background: canAdd ? 'var(--color-primary-light)' : 'var(--color-bg)',
            border: 'none', borderRadius: 20, padding: '5px 12px',
            cursor: canAdd ? 'pointer' : 'not-allowed',
          }}
        >
          + Pemeriksaan
        </button>
      </div>

      {!canAdd && (
        <div style={{ fontSize: 11.5, color: 'var(--color-muted)', fontStyle: 'italic', marginBottom: 10 }}>
          Program berstatus "{program.status}" — tidak dapat menambah Pemeriksaan Kebuntingan baru.
        </div>
      )}

      {list.length === 0 ? (
        <div style={{
          border: '1.5px dashed var(--color-border)', borderRadius: 'var(--radius-sm)',
          padding: '18px 14px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Belum ada Pemeriksaan Kebuntingan untuk program ini.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.map((p) => (
            <PemeriksaanKebuntinganCard
              key={p.id}
              pemeriksaan={p}
              onDetail={() => setDetailItem(p)}
              onEdit={() => setFormState({ kind: 'edit', pemeriksaan: p })}
            />
          ))}
        </div>
      )}

      {formState && (
        <PemeriksaanKebuntinganFormSheet
          mode={formState.kind}
          program={program}
          pemeriksaanId={formState.kind === 'edit' ? formState.pemeriksaan.id : undefined}
          initial={formState.kind === 'create' ? emptyPemeriksaanForm() : pemeriksaanFormFromRecord(formState.pemeriksaan)}
          onClose={() => setFormState(null)}
          onSaved={handleSaved}
        />
      )}

      {detailItem && (
        <PemeriksaanKebuntinganDetailSheet
          pemeriksaan={detailItem}
          program={program}
          onClose={() => setDetailItem(null)}
        />
      )}
    </div>
  );
}

// ─── Kebuntingan / Pregnancy Management (RP-006) ────────────────────────────
// Kebuntingan mengelola satu kebuntingan yang sudah terkonfirmasi (dari
// Pemeriksaan Kebuntingan RP-005 dengan hasil "Bunting") hingga selesai —
// TIDAK mencatat Kelahiran dan TIDAK membuat data anak (offspring); itu adalah
// roadmap RP-007 (Kelahiran) selanjutnya. Setiap Kebuntingan/Monitoring yang
// tersimpan otomatis muncul di Timeline Reproduksi via getFullTimelineForProgram
// (kebuntinganData.ts) — tidak mengubah data RP-004/RP-005 itu sendiri.

const STATUS_KEBUNTINGAN_CFG: Record<StatusKebuntingan, { bg: string; color: string }> = {
  'Kebuntingan Aktif':  { bg: '#e8f5e9', color: '#2e7d32' },
  'Berisiko Tinggi':    { bg: '#ffebee', color: '#c62828' },
  'Dalam Observasi':    { bg: '#fff8e1', color: '#f57f17' },
  'Keguguran':          { bg: '#eceff1', color: '#546e7a' },
  'Selesai':            { bg: '#e3f2fd', color: '#1565c0' },
};

function StatusKebuntinganBadge({ status }: { status: StatusKebuntingan }) {
  const cfg = STATUS_KEBUNTINGAN_CFG[status];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: '2px 8px' }}>
      {status}
    </span>
  );
}

const RISK_LEVEL_CFG: Record<RiskLevel, { bg: string; color: string }> = {
  Rendah: { bg: '#e8f5e9', color: '#2e7d32' },
  Sedang: { bg: '#fff8e1', color: '#f57f17' },
  Tinggi: { bg: '#ffebee', color: '#c62828' },
};

function RiskLevelBadge({ riskLevel }: { riskLevel: RiskLevel }) {
  const cfg = RISK_LEVEL_CFG[riskLevel];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: '2px 8px' }}>
      Risiko: {riskLevel}
    </span>
  );
}

function KebuntinganCard({ kebuntingan, damName, onDetail }: {
  kebuntingan: KebuntinganRecord;
  damName: string;
  onDetail: () => void;
}) {
  return (
    <div style={{
      border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
      padding: '11px 12px', display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--color-text)' }}>
            🐄 {damName}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 2 }}>
            Estimasi Lahir: {kebuntingan.tanggalLahirPerkiraan || '—'}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <StatusKebuntinganBadge status={kebuntingan.status} />
          <RiskLevelBadge riskLevel={kebuntingan.riskLevel} />
        </div>
      </div>

      <button type="button" onClick={onDetail} style={{
        padding: '6px 0', fontSize: 11.5, fontWeight: 700,
        border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
        background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer',
      }}>
        Detail
      </button>
    </div>
  );
}

function emptyKebuntinganForm(defaultRisk: RiskLevel = 'Rendah'): KebuntinganInput {
  return {
    tanggalKawinPerkiraan: '', usiaKebuntinganPerkiraan: '', tanggalLahirPerkiraan: '',
    riskLevel: defaultRisk, status: 'Kebuntingan Aktif', catatan: '',
  };
}

function kebuntinganFormFromRecord(k: KebuntinganRecord): KebuntinganInput {
  return {
    tanggalKawinPerkiraan: k.tanggalKawinPerkiraan,
    usiaKebuntinganPerkiraan: k.usiaKebuntinganPerkiraan ?? '',
    tanggalLahirPerkiraan: k.tanggalLahirPerkiraan,
    riskLevel: k.riskLevel,
    status: EDITABLE_STATUS_LIST.includes(k.status) ? k.status : 'Kebuntingan Aktif',
    catatan: k.catatan ?? '',
  };
}

function KebuntinganCreateFormSheet({ program, allLivestock, eligible, onClose, onSaved }: {
  program: ReproduksiProgramRecord;
  allLivestock: LivestockRecord[];
  eligible: PemeriksaanKebuntinganRecord[];
  onClose: () => void;
  onSaved: (k: KebuntinganRecord) => void;
}) {
  const [pemeriksaanId, setPemeriksaanId] = useState(eligible[0]?.id ?? '');
  // When betinaIds is empty (e.g. DB-loaded program whose participant_ids haven't
  // been split yet), fall back to the first Betina from the workspace's full list.
  const [damId, setDamId] = useState(
    program.betinaIds[0] ?? allLivestock.find((lv) => lv.kelamin === 'Betina')?.id ?? '',
  );
  const [form, setForm] = useState<KebuntinganInput>(emptyKebuntinganForm());
  const [error, setError] = useState<string | null>(null);
  const { activeWorkspace } = useWorkspace();

  const byId = new Map(allLivestock.map((lv) => [lv.id, lv]));

  function handleSave() {
    try {
      const saved = addKebuntingan(program.id, pemeriksaanId, damId, form);
      onSaved(saved);

      // ── Supabase dual-write (fire-and-forget) ────────────────────────────
      if (activeWorkspace?.workspace_uuid) {
        void recordKebuntingan(activeWorkspace.workspace_uuid, saved).catch((err) =>
          console.error('[Reproduksi] recordKebuntingan failed:', err),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membuat Kebuntingan.');
    }
  }

  return (
    <SheetShell
      title="Kebuntingan Baru"
      subtitle={`Program: ${program.namaProgram}`}
      onClose={onClose}
      zIndex={400}
      footer={
        <button type="button" onClick={handleSave} style={{
          width: '100%', background: 'var(--color-primary)', color: '#fff',
          border: 'none', borderRadius: 'var(--radius-sm)', padding: '13px 0',
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}>
          Simpan Kebuntingan
        </button>
      }
    >
      {error && (
        <div style={{ background: '#ffebee', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: 12.5, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <div>
        <FieldLabel label="Berdasarkan Pemeriksaan Kebuntingan (hasil: Bunting)" />
        <div style={{ position: 'relative' }}>
          <select
            value={pemeriksaanId}
            onChange={(e) => setPemeriksaanId(e.target.value)}
            style={{
              width: '100%', padding: '10px 32px 10px 12px',
              border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              fontSize: 13, fontWeight: 600, appearance: 'none', outline: 'none', cursor: 'pointer',
            }}
          >
            {eligible.map((p) => (
              <option key={p.id} value={p.id}>{p.tanggalPemeriksaan} — {p.metode}</option>
            ))}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--color-muted)', pointerEvents: 'none' }}>▾</span>
        </div>
      </div>

      <div>
        <FieldLabel label="Dam (Betina)" />
        <div style={{ position: 'relative' }}>
          <select
            value={damId}
            onChange={(e) => setDamId(e.target.value)}
            style={{
              width: '100%', padding: '10px 32px 10px 12px',
              border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              fontSize: 13, fontWeight: 600, appearance: 'none', outline: 'none', cursor: 'pointer',
            }}
          >
            {(program.betinaIds.length > 0
              ? program.betinaIds
              : allLivestock.filter((lv) => lv.kelamin === 'Betina').map((lv) => lv.id)
            ).map((id) => (
              <option key={id} value={id}>{byId.get(id)?.name ?? id}</option>
            ))}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--color-muted)', pointerEvents: 'none' }}>▾</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel label="Estimasi Tanggal Kawin" />
          <input type="date" value={form.tanggalKawinPerkiraan}
            onChange={(e) => setForm((f) => ({ ...f, tanggalKawinPerkiraan: e.target.value }))} />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel label="Estimasi Tanggal Lahir" />
          <input type="date" value={form.tanggalLahirPerkiraan}
            onChange={(e) => setForm((f) => ({ ...f, tanggalLahirPerkiraan: e.target.value }))} />
        </div>
      </div>

      <div>
        <FieldLabel label="Estimasi Usia Kebuntingan (opsional)" />
        <input type="text" placeholder="Contoh: 8 minggu" value={form.usiaKebuntinganPerkiraan ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, usiaKebuntinganPerkiraan: e.target.value }))} />
      </div>

      <div>
        <FieldLabel label="Tingkat Risiko" />
        <div style={{ position: 'relative' }}>
          <select
            value={form.riskLevel}
            onChange={(e) => setForm((f) => ({ ...f, riskLevel: e.target.value as RiskLevel }))}
            style={{
              width: '100%', padding: '10px 32px 10px 12px',
              border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              fontSize: 13, fontWeight: 600, appearance: 'none', outline: 'none', cursor: 'pointer',
            }}
          >
            {RISK_LEVEL_LIST.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--color-muted)', pointerEvents: 'none' }}>▾</span>
        </div>
      </div>

      <div>
        <FieldLabel label="Catatan (opsional)" />
        <textarea
          placeholder="Catatan kebuntingan..."
          value={form.catatan ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))}
          style={{ minHeight: 80 }}
        />
      </div>
    </SheetShell>
  );
}

function KebuntinganEditFormSheet({ program, kebuntingan, onClose, onSaved }: {
  program: ReproduksiProgramRecord;
  kebuntingan: KebuntinganRecord;
  onClose: () => void;
  onSaved: (k: KebuntinganRecord) => void;
}) {
  const [form, setForm] = useState<KebuntinganInput>(kebuntinganFormFromRecord(kebuntingan));
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    try {
      const saved = updateKebuntingan(kebuntingan.id, form);
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan Kebuntingan.');
    }
  }

  return (
    <SheetShell
      title="Edit Kebuntingan"
      subtitle={`Program: ${program.namaProgram}`}
      onClose={onClose}
      zIndex={500}
      footer={
        <button type="button" onClick={handleSave} style={{
          width: '100%', background: 'var(--color-primary)', color: '#fff',
          border: 'none', borderRadius: 'var(--radius-sm)', padding: '13px 0',
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}>
          Simpan Perubahan
        </button>
      }
    >
      {error && (
        <div style={{ background: '#ffebee', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: 12.5, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel label="Estimasi Tanggal Kawin" />
          <input type="date" value={form.tanggalKawinPerkiraan}
            onChange={(e) => setForm((f) => ({ ...f, tanggalKawinPerkiraan: e.target.value }))} />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel label="Estimasi Tanggal Lahir" />
          <input type="date" value={form.tanggalLahirPerkiraan}
            onChange={(e) => setForm((f) => ({ ...f, tanggalLahirPerkiraan: e.target.value }))} />
        </div>
      </div>

      <div>
        <FieldLabel label="Estimasi Usia Kebuntingan (opsional)" />
        <input type="text" placeholder="Contoh: 8 minggu" value={form.usiaKebuntinganPerkiraan ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, usiaKebuntinganPerkiraan: e.target.value }))} />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel label="Status" />
          <div style={{ position: 'relative' }}>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as StatusKebuntingan }))}
              style={{
                width: '100%', padding: '10px 32px 10px 12px',
                border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface)', color: 'var(--color-text)',
                fontSize: 13, fontWeight: 600, appearance: 'none', outline: 'none', cursor: 'pointer',
              }}
            >
              {EDITABLE_STATUS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--color-muted)', pointerEvents: 'none' }}>▾</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel label="Tingkat Risiko" />
          <div style={{ position: 'relative' }}>
            <select
              value={form.riskLevel}
              onChange={(e) => setForm((f) => ({ ...f, riskLevel: e.target.value as RiskLevel }))}
              style={{
                width: '100%', padding: '10px 32px 10px 12px',
                border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface)', color: 'var(--color-text)',
                fontSize: 13, fontWeight: 600, appearance: 'none', outline: 'none', cursor: 'pointer',
              }}
            >
              {RISK_LEVEL_LIST.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--color-muted)', pointerEvents: 'none' }}>▾</span>
          </div>
        </div>
      </div>

      <div>
        <FieldLabel label="Catatan (opsional)" />
        <textarea
          placeholder="Catatan kebuntingan..."
          value={form.catatan ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))}
          style={{ minHeight: 80 }}
        />
      </div>
    </SheetShell>
  );
}

function emptyKebuntinganMonitoringForm(): KebuntinganMonitoringInput {
  return { tanggal: '', petugas: '', kondisi: KONDISI_LIST[0], beratBadan: null, bcs: null, catatan: '', lampiran: [] };
}

function KebuntinganMonitoringFormSheet({ kebuntingan, onClose, onSaved }: {
  kebuntingan: KebuntinganRecord;
  onClose: () => void;
  onSaved: (m: KebuntinganMonitoringRecord) => void;
}) {
  const [form, setForm] = useState<KebuntinganMonitoringInput>(emptyKebuntinganMonitoringForm());
  const [error, setError] = useState<string | null>(null);
  const { activeWorkspace } = useWorkspace();

  function handleSave() {
    try {
      const saved = addKebuntinganMonitoring(kebuntingan.id, form);
      // ── Supabase dual-write (fire-and-forget) ────────────────────────────
      if (activeWorkspace?.workspace_uuid) {
        void recordKebuntinganMonitoring(activeWorkspace.workspace_uuid, saved)
          .catch((err) => console.error('[Reproduksi] recordKebuntinganMonitoring failed:', err));
      }
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan Monitoring Kebuntingan.');
    }
  }

  return (
    <SheetShell
      title="Monitoring Kebuntingan Baru"
      onClose={onClose}
      zIndex={500}
      footer={
        <button type="button" onClick={handleSave} style={{
          width: '100%', background: 'var(--color-primary)', color: '#fff',
          border: 'none', borderRadius: 'var(--radius-sm)', padding: '13px 0',
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}>
          Simpan Monitoring
        </button>
      }
    >
      {error && (
        <div style={{ background: '#ffebee', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: 12.5, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel label="Tanggal" />
          <input type="date" value={form.tanggal}
            onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))} />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel label="Petugas" />
          <input type="text" placeholder="Nama petugas" value={form.petugas}
            onChange={(e) => setForm((f) => ({ ...f, petugas: e.target.value }))} />
        </div>
      </div>

      <div>
        <FieldLabel label="Kondisi" />
        <div style={{ position: 'relative' }}>
          <select
            value={form.kondisi}
            onChange={(e) => setForm((f) => ({ ...f, kondisi: e.target.value as KondisiMonitoring }))}
            style={{
              width: '100%', padding: '10px 32px 10px 12px',
              border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              fontSize: 13, fontWeight: 600, appearance: 'none', outline: 'none', cursor: 'pointer',
            }}
          >
            {KONDISI_LIST.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--color-muted)', pointerEvents: 'none' }}>▾</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel label="Berat Badan kg (opsional)" />
          <input type="number" min={0} placeholder="Contoh: 320" value={form.beratBadan ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, beratBadan: e.target.value === '' ? null : Number(e.target.value) }))} />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel label="BCS (opsional)" />
          <input type="number" min={0} step={0.5} placeholder="Contoh: 3" value={form.bcs ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, bcs: e.target.value === '' ? null : Number(e.target.value) }))} />
        </div>
      </div>

      <LampiranEditor lampiran={form.lampiran} onChange={(next) => setForm((f) => ({ ...f, lampiran: next as LampiranKebuntinganMonitoring[] }))} />

      <div>
        <FieldLabel label="Catatan (opsional)" />
        <textarea
          placeholder="Catatan kondisi kebuntingan..."
          value={form.catatan ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))}
          style={{ minHeight: 80 }}
        />
      </div>
    </SheetShell>
  );
}

function KebuntinganMonitoringCard({ monitoring }: { monitoring: KebuntinganMonitoringRecord }) {
  return (
    <div style={{
      border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
      padding: '9px 11px', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{monitoring.tanggal} · {monitoring.petugas}</span>
        <KondisiBadge kondisi={monitoring.kondisi} />
      </div>
      {(monitoring.beratBadan != null || monitoring.bcs != null) && (
        <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
          {monitoring.beratBadan != null && <>Berat: {monitoring.beratBadan} kg&nbsp;&nbsp;</>}
          {monitoring.bcs != null && <>BCS: {monitoring.bcs}</>}
        </div>
      )}
      {monitoring.catatan && (
        <div style={{ fontSize: 11.5, color: 'var(--color-text)', lineHeight: 1.5 }}>{monitoring.catatan}</div>
      )}
      {monitoring.lampiran.length > 0 && (
        <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>📎 {monitoring.lampiran.length} lampiran</span>
      )}
    </div>
  );
}

function KebuntinganDetailSheet({ kebuntingan, program, damName, onClose, onChanged }: {
  kebuntingan: KebuntinganRecord;
  program: ReproduksiProgramRecord;
  damName: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [tick, setTick] = useState(0);
  const [editing, setEditing] = useState(false);
  const [addingMonitoring, setAddingMonitoring] = useState(false);
  const [current, setCurrent] = useState(kebuntingan);
  const { activeWorkspace } = useWorkspace();

  const monitoringList = getKebuntinganMonitoringList(current.id);
  const canManage = !isStatusFinal(current.status);
  const followUp = followUpMessageForStatus(current.status);

  function refresh(next: KebuntinganRecord) {
    setCurrent(next);
    setTick((t) => t + 1);
    onChanged();
  }

  function handleAbort() {
    if (!window.confirm('Akhiri Kebuntingan ini sebagai Keguguran? Tindakan ini tidak dapat dibatalkan dan tidak membuat data Kelahiran.')) return;
    try {
      const updated = abortKebuntingan(current.id);
      refresh(updated);
      // ── Supabase dual-write (fire-and-forget) ────────────────────────────
      if (activeWorkspace?.workspace_uuid) {
        void updateKebuntinganStatusInDb(updated)
          .catch((err) => console.error('[Reproduksi] updateKebuntinganStatusInDb (abort) failed:', err));
      }
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Gagal mengakhiri Kebuntingan.');
    }
  }

  function handleComplete() {
    if (!window.confirm('Tandai Kebuntingan ini Selesai? Tindakan ini tidak dapat dibatalkan. Pencatatan Kelahiran akan tersedia pada roadmap berikutnya (RP-007).')) return;
    try {
      const updated = completeKebuntingan(current.id);
      refresh(updated);
      // ── Supabase dual-write (fire-and-forget) ────────────────────────────
      if (activeWorkspace?.workspace_uuid) {
        void updateKebuntinganStatusInDb(updated)
          .catch((err) => console.error('[Reproduksi] updateKebuntinganStatusInDb (complete) failed:', err));
      }
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Gagal menandai Kebuntingan selesai.');
    }
  }

  return (
    <SheetShell title="Detail Kebuntingan" subtitle={`Program: ${program.namaProgram}`} onClose={onClose} zIndex={400}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <StatusKebuntinganBadge status={current.status} />
        <RiskLevelBadge riskLevel={current.riskLevel} />
      </div>

      <div style={{ height: 1, background: 'var(--color-border)' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <DetailRow label="Dam (Betina)" value={damName} />
        <DetailRow label="Estimasi Tanggal Kawin" value={current.tanggalKawinPerkiraan || '—'} />
        <DetailRow label="Estimasi Usia Kebuntingan" value={current.usiaKebuntinganPerkiraan ?? '—'} />
        <DetailRow label="Estimasi Tanggal Lahir" value={current.tanggalLahirPerkiraan || '—'} />
      </div>

      {current.catatan && (
        <div>
          <FieldLabel label="Catatan" />
          <div style={{ fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.6 }}>{current.catatan}</div>
        </div>
      )}

      {followUp && (
        <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 4 }}>Tindak Lanjut</div>
          <div style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.5 }}>{followUp}</div>
        </div>
      )}

      <div style={{ height: 1, background: 'var(--color-border)' }} />

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <FieldLabel label={`Monitoring Kebuntingan (${monitoringList.length})`} />
          <button
            type="button"
            onClick={() => canManage && setAddingMonitoring(true)}
            disabled={!canManage}
            style={{
              fontSize: 11, fontWeight: 700,
              color: canManage ? 'var(--color-primary)' : 'var(--color-border)',
              background: canManage ? 'var(--color-primary-light)' : 'var(--color-bg)',
              border: 'none', borderRadius: 20, padding: '5px 12px',
              cursor: canManage ? 'pointer' : 'not-allowed',
            }}
          >
            + Monitoring
          </button>
        </div>

        {monitoringList.length === 0 ? (
          <div style={{
            border: '1.5px dashed var(--color-border)', borderRadius: 'var(--radius-sm)',
            padding: '16px 14px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Belum ada Monitoring Kebuntingan.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {monitoringList.map((m) => <KebuntinganMonitoringCard key={m.id} monitoring={m} />)}
          </div>
        )}
      </div>

      {canManage && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setEditing(true)} style={{
            flex: 1, padding: '10px 0', fontSize: 12.5, fontWeight: 700,
            border: '1.5px solid var(--color-primary)', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)', color: 'var(--color-primary)', cursor: 'pointer',
          }}>
            Edit
          </button>
          <button type="button" onClick={handleComplete} style={{
            flex: 1, padding: '10px 0', fontSize: 12.5, fontWeight: 700,
            border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer',
          }}>
            Selesai
          </button>
          <button type="button" onClick={handleAbort} style={{
            flex: 1, padding: '10px 0', fontSize: 12.5, fontWeight: 700,
            border: '1.5px solid var(--color-danger)', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)', color: 'var(--color-danger)', cursor: 'pointer',
          }}>
            Keguguran
          </button>
        </div>
      )}

      {editing && (
        <KebuntinganEditFormSheet
          program={program}
          kebuntingan={current}
          onClose={() => setEditing(false)}
          onSaved={(k) => { setEditing(false); refresh(k); }}
        />
      )}

      {addingMonitoring && (
        <KebuntinganMonitoringFormSheet
          kebuntingan={current}
          onClose={() => setAddingMonitoring(false)}
          onSaved={() => { setAddingMonitoring(false); setTick((t) => t + 1); onChanged(); }}
        />
      )}
    </SheetShell>
  );
}

function KebuntinganSection({ program, allLivestock }: { program: ReproduksiProgramRecord; allLivestock: LivestockRecord[] }) {
  const [tick, setTick] = useState(0);
  const [creating, setCreating] = useState(false);
  const [detailItem, setDetailItem] = useState<KebuntinganRecord | null>(null);

  const byId = new Map(allLivestock.map((lv) => [lv.id, lv]));
  const list = getPregnancyListByProgram(program.id);
  const eligible = getPemeriksaanListByProgram(program.id)
    .filter((p) => p.hasil === 'Bunting' && !getPregnancyByExaminationId(p.id));
  const canAdd = eligible.length > 0;

  function bump() {
    setTick((t) => t + 1);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <FieldLabel label={`Kebuntingan (${list.length})`} />
        <button
          type="button"
          onClick={() => canAdd && setCreating(true)}
          disabled={!canAdd}
          style={{
            fontSize: 11, fontWeight: 700,
            color: canAdd ? 'var(--color-primary)' : 'var(--color-border)',
            background: canAdd ? 'var(--color-primary-light)' : 'var(--color-bg)',
            border: 'none', borderRadius: 20, padding: '5px 12px',
            cursor: canAdd ? 'pointer' : 'not-allowed',
          }}
        >
          + Kebuntingan
        </button>
      </div>

      {!canAdd && (
        <div style={{ fontSize: 11.5, color: 'var(--color-muted)', fontStyle: 'italic', marginBottom: 10 }}>
          Kebuntingan baru hanya dapat dibuat dari Pemeriksaan Kebuntingan dengan hasil "Bunting" yang belum memiliki data Kebuntingan.
        </div>
      )}

      {list.length === 0 ? (
        <div style={{
          border: '1.5px dashed var(--color-border)', borderRadius: 'var(--radius-sm)',
          padding: '18px 14px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Belum ada Kebuntingan untuk program ini.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.map((k) => (
            <KebuntinganCard
              key={k.id}
              kebuntingan={k}
              damName={byId.get(k.damId)?.name ?? k.damId}
              onDetail={() => setDetailItem(k)}
            />
          ))}
        </div>
      )}

      {creating && (
        <KebuntinganCreateFormSheet
          program={program}
          allLivestock={allLivestock}
          eligible={eligible}
          onClose={() => setCreating(false)}
          onSaved={(k) => { setCreating(false); setDetailItem(k); bump(); }}
        />
      )}

      {detailItem && (
        <KebuntinganDetailSheet
          kebuntingan={detailItem}
          program={program}
          damName={byId.get(detailItem.damId)?.name ?? detailItem.damId}
          onClose={() => setDetailItem(null)}
          onChanged={bump}
        />
      )}
    </div>
  );
}

// ─── Kelahiran / Birth Management (RP-007) ───────────────────────────────────
// Kelahiran dicatat dari Kebuntingan berstatus "Selesai". Satu Kebuntingan
// memiliki tepat satu Kelahiran (1:1). Satu Kelahiran dapat memiliki banyak
// Anak (AnakRecord) — hidup, lahir mati, atau mati setelah lahir.
// TIDAK membuat Livestock permanen (RP-008). getFullTimelineForProgram kini
// diimpor dari kelahiranData.ts yang menggabungkan seluruh chain RP-004..007.

const METODE_KELAHIRAN_CFG: Record<MetodeKelahiran, string> = {
  'Kelahiran Normal':          '🐄',
  'Kelahiran dengan Bantuan':  '🤝',
  'Operasi Caesar':            '⚕️',
  'Lainnya':                   '📝',
};

const STATUS_KELAHIRAN_CFG: Record<StatusKelahiran, { bg: string; color: string }> = {
  'Berlangsung': { bg: '#fff8e1', color: '#f57f17' },
  'Selesai':     { bg: '#e8f5e9', color: '#2e7d32' },
};

function StatusKelahiranBadge({ status }: { status: StatusKelahiran }) {
  const { bg, color } = STATUS_KELAHIRAN_CFG[status] ?? { bg: '#f5f5f5', color: '#757575' };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, background: bg, color, borderRadius: 20, padding: '3px 10px' }}>
      {status}
    </span>
  );
}

function KelahiranCard({
  kelahiran, damName, hasil, onDetail,
}: {
  kelahiran: KelahiranRecord;
  damName: string;
  hasil: ReturnType<typeof getKelahiranHasil>;
  onDetail: () => void;
}) {
  return (
    <div
      onClick={onDetail}
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
          {METODE_KELAHIRAN_CFG[kelahiran.metode]} {kelahiran.metode}
        </span>
        <StatusKelahiranBadge status={kelahiran.status} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
        🐄 {damName} · 📅 {kelahiran.tanggalLahir} {kelahiran.jamLahir}
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-text)', display: 'flex', gap: 12 }}>
        <span>🐣 Total: {hasil.totalLahir}</span>
        <span>✅ Hidup: {hasil.hidup}</span>
        {hasil.lahirMati > 0 && <span>🕊️ Lahir Mati: {hasil.lahirMati}</span>}
        {hasil.matiSetelahLahir > 0 && <span>😢 Mati: {hasil.matiSetelahLahir}</span>}
      </div>
    </div>
  );
}

function emptyKelahiranForm(): KelahiranInput {
  const today = new Date().toISOString().slice(0, 10);
  const now   = new Date().toTimeString().slice(0, 5);
  return { tanggalLahir: today, jamLahir: now, lokasiLahir: '', petugas: '', metode: 'Kelahiran Normal', catatan: null };
}

function KelahiranCreateFormSheet({
  program, eligibleKebuntingan, allLivestock, onClose, onSaved,
}: {
  program: ReproduksiProgramRecord;
  eligibleKebuntingan: KebuntinganRecord[];
  allLivestock: LivestockRecord[];
  onClose: () => void;
  onSaved: (k: KelahiranRecord) => void;
}) {
  const byId = new Map(allLivestock.map((lv) => [lv.id, lv]));
  const [form, setForm]               = useState<KelahiranInput>(emptyKelahiranForm);
  const [kebuntinganId, setKbId]      = useState(eligibleKebuntingan[0]?.id ?? '');
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const { activeWorkspace }           = useWorkspace();

  function update<K extends keyof KelahiranInput>(k: K, v: KelahiranInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleSave() {
    setSaving(true); setError(null);
    try {
      const record = addKelahiran(kebuntinganId, form);
      onSaved(record);

      // ── Supabase dual-write (fire-and-forget) ────────────────────────────
      if (activeWorkspace?.workspace_uuid) {
        void recordKelahiran(activeWorkspace.workspace_uuid, record).catch((err) =>
          console.error('[Reproduksi] recordKelahiran failed:', err),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setSaving(false); }
  }

  return (
    <SheetShell title="Catat Kelahiran" subtitle={program.namaProgram} onClose={onClose} zIndex={500}>
      <FieldLabel label="Kebuntingan (Induk) *" />
      <select
        value={kebuntinganId} onChange={(e) => setKbId(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13 }}
      >
        {eligibleKebuntingan.map((kb) => (
          <option key={kb.id} value={kb.id}>
            {byId.get(kb.damId)?.name ?? kb.damId} — Est. {kb.tanggalLahirPerkiraan ?? '?'}
          </option>
        ))}
      </select>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <FieldLabel label="Tanggal Lahir *" />
          <input
            type="date" value={form.tanggalLahir}
            onChange={(e) => update('tanggalLahir', e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13 }}
          />
        </div>
        <div>
          <FieldLabel label="Jam Lahir *" />
          <input
            type="time" value={form.jamLahir}
            onChange={(e) => update('jamLahir', e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13 }}
          />
        </div>
      </div>

      <div>
        <FieldLabel label="Lokasi Kelahiran *" />
        <input
          type="text" placeholder="Cth. Kandang A" value={form.lokasiLahir}
          onChange={(e) => update('lokasiLahir', e.target.value)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13 }}
        />
      </div>

      <div>
        <FieldLabel label="Petugas *" />
        <input
          type="text" placeholder="Nama petugas" value={form.petugas}
          onChange={(e) => update('petugas', e.target.value)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13 }}
        />
      </div>

      <div>
        <FieldLabel label="Metode Kelahiran *" />
        <select
          value={form.metode} onChange={(e) => update('metode', e.target.value as MetodeKelahiran)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13 }}
        >
          {METODE_KELAHIRAN_LIST.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div>
        <FieldLabel label="Catatan" />
        <textarea
          rows={2} placeholder="Catatan tambahan…" value={form.catatan ?? ''}
          onChange={(e) => update('catatan', e.target.value || null)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13, resize: 'vertical' }}
        />
      </div>

      {error && (
        <div style={{ fontSize: 12, color: '#c62828', background: '#ffebee', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>{error}</div>
      )}

      <button
        type="button" onClick={handleSave} disabled={saving}
        style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}
      >
        {saving ? 'Menyimpan…' : 'Simpan Kelahiran'}
      </button>
    </SheetShell>
  );
}

// ─── Anak (Offspring) ────────────────────────────────────────────────────────

const JENIS_ANAK_CFG: Record<JenisAnak, { icon: string; color: string; bg: string }> = {
  'Hidup':              { icon: '🍼', color: '#2e7d32', bg: '#e8f5e9' },
  'Lahir Mati':         { icon: '🕊️', color: '#795548', bg: '#efebe9' },
  'Mati Setelah Lahir': { icon: '😢', color: '#b71c1c', bg: '#ffebee' },
};

function AnakCard({
  anak, onDaftarkan, onSapih,
}: {
  anak: AnakRecord;
  onDaftarkan?: () => void;
  onSapih?: () => void;
}) {
  const navigate = useNavigate();
  const cfg = JENIS_ANAK_CFG[anak.jenis] ?? { icon: '❓', color: '#757575', bg: '#f5f5f5' };
  const canRegister = !!onDaftarkan && anak.jenis === 'Hidup' && anak.statusRegistrasi === 'Belum Didaftarkan';
  const sapihList = anak.livestockId ? getSapihListByLivestock(anak.livestockId) : [];
  const sapihTerbaru = sapihList[0] ?? null;
  return (
    <div style={{
      background: cfg.bg, border: `1.5px solid ${cfg.color}30`,
      borderRadius: 'var(--radius-sm)', padding: '10px 12px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>{cfg.icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{anak.jenis}</span>
        <span style={{ fontSize: 11, color: 'var(--color-muted)', marginLeft: 'auto' }}>{anak.jenisKelamin}</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-text)', display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
        <span>Ras: {anak.ras}</span>
        {anak.beratLahir != null && <span>Berat: {anak.beratLahir} kg</span>}
        {anak.warna && <span>Warna: {anak.warna}</span>}
        <span>Kondisi: {anak.kondisiAwal}</span>
      </div>
      {anak.catatan && (
        <div style={{ fontSize: 11.5, color: 'var(--color-muted)', fontStyle: 'italic' }}>{anak.catatan}</div>
      )}
      {anak.statusRegistrasi === 'Sudah Didaftarkan' && anak.livestockId ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
          <button
            type="button"
            onClick={() => navigate(`/livestock/${anak.livestockId}`)}
            style={{
              fontSize: 10.5, color: '#2e7d32', background: '#e8f5e9', border: 'none',
              borderRadius: 10, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 4,
              cursor: 'pointer', fontWeight: 700,
            }}
          >
            ✅ Terdaftar ({anak.livestockId}) — Lihat Ternak →
          </button>
          {onSapih && (
            sapihTerbaru ? (
              <button
                type="button" onClick={onSapih}
                style={{
                  fontSize: 10.5, color: SAPIH_STATUS_COLOR[sapihTerbaru.status], background: SAPIH_STATUS_BG[sapihTerbaru.status],
                  border: 'none', borderRadius: 10, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 4,
                  cursor: 'pointer', fontWeight: 700,
                }}
              >
                🌾 Sapih: {sapihTerbaru.status} →
              </button>
            ) : (
              <button
                type="button" onClick={onSapih}
                style={{
                  fontSize: 10.5, color: '#00695c', background: '#e0f2f1', border: 'none',
                  borderRadius: 10, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 4,
                  cursor: 'pointer', fontWeight: 700,
                }}
              >
                🌾 Rencanakan Sapih →
              </button>
            )
          )}
        </div>
      ) : canRegister ? (
        <button
          type="button"
          onClick={onDaftarkan}
          style={{
            fontSize: 10.5, color: '#e65100', background: '#fff3e0', border: 'none',
            borderRadius: 10, padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: 4,
            alignSelf: 'flex-start', marginTop: 2, cursor: 'pointer', fontWeight: 700,
          }}
        >
          ⏳ Belum Didaftarkan — Daftarkan Anak →
        </button>
      ) : anak.statusRegistrasi === 'Belum Didaftarkan' ? (
        <div style={{
          fontSize: 10.5, color: '#e65100', background: '#fff3e0',
          borderRadius: 10, padding: '2px 8px',
          display: 'inline-flex', alignItems: 'center', gap: 4,
          alignSelf: 'flex-start', marginTop: 2,
        }}>
          ⏳ Belum Didaftarkan sebagai Ternak
        </div>
      ) : null}
    </div>
  );
}

const SAPIH_STATUS_COLOR: Record<WeaningRecord['status'], string> = {
  'Direncanakan': '#1565c0',
  'Berlangsung': '#00695c',
  'Selesai': '#2e7d32',
  'Dibatalkan': '#757575',
};
const SAPIH_STATUS_BG: Record<WeaningRecord['status'], string> = {
  'Direncanakan': '#e3f2fd',
  'Berlangsung': '#e0f2f1',
  'Selesai': '#e8f5e9',
  'Dibatalkan': '#f0f0f0',
};

function emptyAnakForm(): AnakInput {
  return { jenisKelamin: 'Jantan', jenis: 'Hidup', beratLahir: null, warna: null, ras: '', kondisiAwal: 'Sehat', catatan: null };
}

function AnakFormSheet({
  kelahiran, onClose, onSaved,
}: {
  kelahiran: KelahiranRecord;
  onClose: () => void;
  onSaved: (a: AnakRecord) => void;
}) {
  const [form, setForm]     = useState<AnakInput>(emptyAnakForm);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  function update<K extends keyof AnakInput>(k: K, v: AnakInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleSave() {
    setSaving(true); setError(null);
    try {
      const record = addAnak(kelahiran.id, form);
      onSaved(record);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setSaving(false); }
  }

  const btnRow = (
    label: string, selected: boolean, onClick: () => void,
  ) => (
    <button
      key={label} type="button" onClick={onClick}
      style={{
        padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
        border: '1.5px solid',
        borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)',
        background:  selected ? 'var(--color-primary)' : 'var(--color-surface)',
        color:       selected ? '#fff' : 'var(--color-text)',
        cursor: 'pointer',
      }}
    >{label}</button>
  );

  return (
    <SheetShell title="Tambah Anak" subtitle="Data sementara — belum menjadi Ternak permanen" onClose={onClose} zIndex={600}>
      <div>
        <FieldLabel label="Jenis Anak *" />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {JENIS_ANAK_LIST.map((j) => btnRow(j, form.jenis === j, () => update('jenis', j)))}
        </div>
      </div>

      <div>
        <FieldLabel label="Jenis Kelamin *" />
        <div style={{ display: 'flex', gap: 8 }}>
          {JENIS_KELAMIN_ANAK_LIST.map((j) => btnRow(j, form.jenisKelamin === j, () => update('jenisKelamin', j)))}
        </div>
      </div>

      <div>
        <FieldLabel label="Ras *" />
        <input
          type="text" placeholder="Cth. Etawa, Saanen, FH…" value={form.ras}
          onChange={(e) => update('ras', e.target.value)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13 }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <FieldLabel label="Berat Lahir (kg)" />
          <input
            type="number" min="0" step="0.1"
            value={form.beratLahir ?? ''}
            onChange={(e) => update('beratLahir', e.target.value ? Number(e.target.value) : null)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13 }}
          />
        </div>
        <div>
          <FieldLabel label="Warna" />
          <input
            type="text" placeholder="Cth. Hitam putih"
            value={form.warna ?? ''}
            onChange={(e) => update('warna', e.target.value || null)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13 }}
          />
        </div>
      </div>

      <div>
        <FieldLabel label="Kondisi Awal *" />
        <select
          value={form.kondisiAwal} onChange={(e) => update('kondisiAwal', e.target.value as KondisiAwal)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13 }}
        >
          {KONDISI_AWAL_LIST.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      <div>
        <FieldLabel label="Catatan" />
        <textarea
          rows={2} placeholder="Catatan…" value={form.catatan ?? ''}
          onChange={(e) => update('catatan', e.target.value || null)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13, resize: 'vertical' }}
        />
      </div>

      {error && (
        <div style={{ fontSize: 12, color: '#c62828', background: '#ffebee', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>{error}</div>
      )}

      <button
        type="button" onClick={handleSave} disabled={saving}
        style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}
      >
        {saving ? 'Menyimpan…' : 'Tambah Anak'}
      </button>
    </SheetShell>
  );
}

// ─── Registrasi Anak (RP-008) ────────────────────────────────────────────────
// Sheet ini TIDAK menduplikasi form Livestock (AddLivestock.tsx) — field yang
// sudah tersedia dari Kelahiran/Anak (Dam, Sire, Tanggal Lahir, Lokasi Lahir,
// Jenis Kelamin, Ras, Berat Lahir) ditampilkan sebagai pratinjau read-only;
// hanya field yang benar-benar belum ada (Nama, Lokasi Kandang saat ini,
// Status Kesehatan, Catatan tambahan) yang diminta di sini.

function emptyRegistrasiInput(anak: AnakRecord, lokasiLahir: string): RegistrasiAnakInput {
  return {
    nama: null,
    kelamin: anak.jenisKelamin === 'Tidak Diketahui' ? 'Jantan' : anak.jenisKelamin,
    lokasi: lokasiLahir,
    statusKesehatan: 'Sehat',
    catatan: null,
  };
}

function RegistrasiAnakFormSheet({
  anakId, onClose, onSaved,
}: {
  anakId: string;
  onClose: () => void;
  onSaved: (livestockId: string) => void;
}) {
  const { activeWorkspace } = useWorkspace();
  const { currentUser }     = useAuth();
  const autoFill = getRegistrasiAutoFill(anakId);
  const [form, setForm]     = useState<RegistrasiAnakInput>(() => emptyRegistrasiInput(autoFill.anak, autoFill.lokasiLahir));
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  function update<K extends keyof RegistrasiAnakInput>(k: K, v: RegistrasiAnakInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleSave() {
    setSaving(true); setError(null);
    try {
      const record = registerAnak(anakId, form);
      void recordRegistrasiAnak(activeWorkspace?.workspace_uuid ?? '', anakId)
        .catch((err) => console.error('[Reproduksi] recordRegistrasiAnak failed:', err));
      onSaved(record.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setSaving(false); }
  }

  return (
    <SheetShell title="Daftarkan Anak" subtitle="Menjadi Ternak permanen" onClose={onClose} zIndex={700}>
      <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
        Data di bawah ini terisi otomatis dari data Kelahiran &amp; Anak — tidak dapat diubah di sini.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
        <DetailRow label="Induk (Dam)"   value={autoFill.dam.name ?? autoFill.dam.id} />
        <DetailRow label="Pejantan (Sire)" value={autoFill.sire ? (autoFill.sire.name ?? autoFill.sire.id) : 'Tidak diketahui'} />
        <DetailRow label="Tanggal Lahir" value={autoFill.tanggalLahirLabel} />
        <DetailRow label="Jenis Kelamin" value={autoFill.anak.jenisKelamin} />
        <DetailRow label="Ras"           value={autoFill.anak.ras} />
        <DetailRow label="Berat Lahir"   value={autoFill.anak.beratLahir != null ? `${autoFill.anak.beratLahir} kg` : '—'} />
      </div>

      {autoFill.anak.jenisKelamin === 'Tidak Diketahui' && (
        <div>
          <FieldLabel label="Jenis Kelamin *" />
          <div style={{ display: 'flex', gap: 8 }}>
            {(['Jantan', 'Betina'] as const).map((k) => (
              <button
                key={k} type="button" onClick={() => update('kelamin', k)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: '1.5px solid',
                  borderColor: form.kelamin === k ? 'var(--color-primary)' : 'var(--color-border)',
                  background:  form.kelamin === k ? 'var(--color-primary)' : 'var(--color-surface)',
                  color:       form.kelamin === k ? '#fff' : 'var(--color-text)',
                  cursor: 'pointer',
                }}
              >{k}</button>
            ))}
          </div>
        </div>
      )}

      <div>
        <FieldLabel label="Nama Ternak" />
        <input
          type="text" placeholder="Opsional" value={form.nama ?? ''}
          onChange={(e) => update('nama', e.target.value || null)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13 }}
        />
      </div>

      <div>
        <FieldLabel label="Lokasi Kandang *" />
        <input
          type="text" value={form.lokasi}
          onChange={(e) => update('lokasi', e.target.value)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13 }}
        />
      </div>

      <div>
        <FieldLabel label="Status Kesehatan *" />
        <select
          value={form.statusKesehatan}
          onChange={(e) => update('statusKesehatan', e.target.value as StatusKesehatanRegistrasi)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13 }}
        >
          {STATUS_KESEHATAN_REGISTRASI_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <FieldLabel label="Catatan" />
        <textarea
          rows={2} placeholder="Catatan tambahan…" value={form.catatan ?? ''}
          onChange={(e) => update('catatan', e.target.value || null)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13, resize: 'vertical' }}
        />
      </div>

      {error && (
        <div style={{ fontSize: 12, color: '#c62828', background: '#ffebee', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>{error}</div>
      )}

      <button
        type="button" onClick={handleSave} disabled={saving}
        style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}
      >
        {saving ? 'Menyimpan…' : 'Daftarkan sebagai Ternak'}
      </button>
    </SheetShell>
  );
}

function RegistrasiSemuaFormSheet({
  kelahiran, onClose, onSaved,
}: {
  kelahiran: KelahiranRecord;
  onClose: () => void;
  onSaved: (count: number) => void;
}) {
  const eligible = getRegistrableAnak(kelahiran.id);
  const [lokasi, setLokasi]                 = useState(kelahiran.lokasiLahir);
  const [statusKesehatan, setStatusKesehatan] = useState<StatusKesehatanRegistrasi>('Sehat');
  const [catatan, setCatatan]               = useState('');
  const [saving, setSaving]                 = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  function handleSave() {
    setSaving(true); setError(null);
    try {
      const result = registerAllAnak(kelahiran.id, (anak) => ({
        nama: null,
        kelamin: anak.jenisKelamin === 'Tidak Diketahui' ? 'Jantan' : anak.jenisKelamin,
        lokasi,
        statusKesehatan,
        catatan: catatan.trim() || null,
      }));
      if (result.gagal.length > 0) {
        setError(`${result.berhasil.length} berhasil, ${result.gagal.length} gagal: ${result.gagal[0].pesan}`);
      }
      if (result.berhasil.length > 0) onSaved(result.berhasil.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setSaving(false); }
  }

  return (
    <SheetShell title="Daftarkan Semua Anak" subtitle={`${eligible.length} Anak akan menjadi Ternak permanen`} onClose={onClose} zIndex={700}>
      <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
        Jenis Kelamin, Ras, dan Berat Lahir tetap diambil dari data masing-masing Anak. Field di bawah berlaku sama untuk semua Anak yang didaftarkan.
      </div>

      <div>
        <FieldLabel label="Lokasi Kandang *" />
        <input
          type="text" value={lokasi} onChange={(e) => setLokasi(e.target.value)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13 }}
        />
      </div>

      <div>
        <FieldLabel label="Status Kesehatan *" />
        <select
          value={statusKesehatan} onChange={(e) => setStatusKesehatan(e.target.value as StatusKesehatanRegistrasi)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13 }}
        >
          {STATUS_KESEHATAN_REGISTRASI_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <FieldLabel label="Catatan" />
        <textarea
          rows={2} placeholder="Catatan tambahan…" value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13, resize: 'vertical' }}
        />
      </div>

      {error && (
        <div style={{ fontSize: 12, color: '#c62828', background: '#ffebee', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>{error}</div>
      )}

      <button
        type="button" onClick={handleSave} disabled={saving || eligible.length === 0}
        style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}
      >
        {saving ? 'Mendaftarkan…' : `Daftarkan ${eligible.length} Anak`}
      </button>
    </SheetShell>
  );
}

// ─── Sapih (RP-009 — Weaning Management) ─────────────────────────────────────
// Sheet ini mengelola siklus hidup Sapih untuk satu Livestock yang SUDAH
// terdaftar (RP-008): Direncanakan → Berlangsung → Selesai, atau dibatalkan
// dari Direncanakan/Berlangsung. Field Pasca Sapih (Kondisi Pertumbuhan,
// Adaptasi Pakan, Observasi Kesehatan) murni deskriptif — TIDAK membuat
// catatan Pemberian Pakan maupun Kesehatan.

function emptySapihForm(tanggalDefault: string): SapihInput {
  return { tanggalSapih: tanggalDefault, beratBadan: 0, bcs: null, metode: METODE_SAPIH_LIST[0], petugas: '', catatan: null };
}

function SapihPlanForm({ livestockId, kelahiran, onClose, onSaved }: {
  livestockId: string;
  kelahiran: KelahiranRecord;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { activeWorkspace } = useWorkspace();
  const { currentUser }     = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm]     = useState<SapihInput>(() => emptySapihForm(today));
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  function update<K extends keyof SapihInput>(k: K, v: SapihInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleSave() {
    setSaving(true); setError(null);
    try {
      const weaning = addSapih(livestockId, form);
      void recordSapih(activeWorkspace?.workspace_uuid ?? '', currentUser?.id ?? null, weaning)
        .catch((err) => console.error('[Reproduksi] recordSapih failed:', err));
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setSaving(false); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
        Lahir: {kelahiran.tanggalLahir} — Sapih hanya dapat direncanakan setelah tanggal ini.
      </div>

      <div>
        <FieldLabel label="Tanggal Sapih *" />
        <input
          type="date" value={form.tanggalSapih}
          onChange={(e) => update('tanggalSapih', e.target.value)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13 }}
        />
      </div>

      <div>
        <FieldLabel label="Metode Sapih *" />
        <select
          value={form.metode} onChange={(e) => update('metode', e.target.value as MetodeSapih)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13 }}
        >
          {METODE_SAPIH_LIST.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel label="Berat Badan (kg) *" />
          <input
            type="number" min={0} step={0.1} value={form.beratBadan || ''}
            onChange={(e) => update('beratBadan', parseFloat(e.target.value) || 0)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13 }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel label="BCS" />
          <input
            type="number" min={0} step={0.25} placeholder="Opsional" value={form.bcs ?? ''}
            onChange={(e) => update('bcs', e.target.value ? parseFloat(e.target.value) : null)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13 }}
          />
        </div>
      </div>

      <div>
        <FieldLabel label="Petugas *" />
        <input
          type="text" value={form.petugas} onChange={(e) => update('petugas', e.target.value)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13 }}
        />
      </div>

      <div>
        <FieldLabel label="Catatan" />
        <textarea
          rows={2} placeholder="Catatan tambahan…" value={form.catatan ?? ''}
          onChange={(e) => update('catatan', e.target.value || null)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13, resize: 'vertical' }}
        />
      </div>

      {error && (
        <div style={{ fontSize: 12, color: '#c62828', background: '#ffebee', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>{error}</div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button" onClick={onClose}
          style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', color: 'var(--color-text)', border: '1.5px solid var(--color-border)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          Batal
        </button>
        <button
          type="button" onClick={handleSave} disabled={saving}
          style={{ flex: 2, padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}
        >
          {saving ? 'Menyimpan…' : 'Rencanakan Sapih'}
        </button>
      </div>
    </div>
  );
}

function SapihCompleteForm({ sapih, onClose, onSaved }: {
  sapih: WeaningRecord;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [beratBadan, setBeratBadan] = useState(sapih.beratBadan || 0);
  const [bcs, setBcs]               = useState<number | null>(sapih.bcs);
  const [catatan, setCatatan]       = useState('');
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);

  function handleSave() {
    setSaving(true); setError(null);
    try {
      completeSapih(sapih.id, { beratBadan, bcs, catatan: catatan.trim() || null });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setSaving(false); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
      <FieldLabel label="Selesaikan Sapih — Data Akhir" />
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel label="Berat Badan (kg) *" />
          <input
            type="number" min={0} step={0.1} value={beratBadan || ''}
            onChange={(e) => setBeratBadan(parseFloat(e.target.value) || 0)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13 }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel label="BCS" />
          <input
            type="number" min={0} step={0.25} placeholder="Opsional" value={bcs ?? ''}
            onChange={(e) => setBcs(e.target.value ? parseFloat(e.target.value) : null)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13 }}
          />
        </div>
      </div>
      <textarea
        rows={2} placeholder="Catatan penyelesaian…" value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13, resize: 'vertical' }}
      />
      {error && (
        <div style={{ fontSize: 12, color: '#c62828', background: '#ffebee', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>{error}</div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button" onClick={onClose}
          style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', color: 'var(--color-text)', border: '1.5px solid var(--color-border)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          Batal
        </button>
        <button
          type="button" onClick={handleSave} disabled={saving}
          style={{ flex: 2, padding: '10px', borderRadius: 'var(--radius-md)', background: '#2e7d32', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}
        >
          {saving ? 'Menyimpan…' : '✅ Selesaikan Sapih'}
        </button>
      </div>
    </div>
  );
}

function PascaSapihForm({ sapih, onSaved }: { sapih: WeaningRecord; onSaved: () => void }) {
  const [kondisiPertumbuhan, setKondisiPertumbuhan] = useState<KondisiPertumbuhan | null>(sapih.kondisiPertumbuhan);
  const [adaptasiPakan, setAdaptasiPakan]           = useState<AdaptasiPakan | null>(sapih.adaptasiPakan);
  const [observasiKesehatan, setObservasiKesehatan] = useState<ObservasiKesehatan | null>(sapih.observasiKesehatan);
  const [catatan, setCatatan]                       = useState(sapih.catatanPascaSapih ?? '');
  const [saving, setSaving]                         = useState(false);
  const [error, setError]                           = useState<string | null>(null);

  function handleSave() {
    setSaving(true); setError(null);
    try {
      recordPascaSapih(sapih.id, { kondisiPertumbuhan, adaptasiPakan, observasiKesehatan, catatan: catatan.trim() || null });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setSaving(false); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <FieldLabel label="Pasca Sapih (opsional)" />
      <div style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>
        Hanya deskriptif — tidak membuat catatan Pemberian Pakan atau Kesehatan.
      </div>
      <div>
        <FieldLabel label="Kondisi Pertumbuhan" />
        <select
          value={kondisiPertumbuhan ?? ''} onChange={(e) => setKondisiPertumbuhan(e.target.value ? e.target.value as KondisiPertumbuhan : null)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13 }}
        >
          <option value="">— Belum dicatat —</option>
          {KONDISI_PERTUMBUHAN_LIST.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>
      <div>
        <FieldLabel label="Adaptasi Pakan" />
        <select
          value={adaptasiPakan ?? ''} onChange={(e) => setAdaptasiPakan(e.target.value ? e.target.value as AdaptasiPakan : null)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13 }}
        >
          <option value="">— Belum dicatat —</option>
          {ADAPTASI_PAKAN_LIST.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div>
        <FieldLabel label="Observasi Kesehatan" />
        <select
          value={observasiKesehatan ?? ''} onChange={(e) => setObservasiKesehatan(e.target.value ? e.target.value as ObservasiKesehatan : null)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13 }}
        >
          <option value="">— Belum dicatat —</option>
          {OBSERVASI_KESEHATAN_LIST.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <textarea
        rows={2} placeholder="Catatan pasca sapih…" value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 13, resize: 'vertical' }}
      />
      {error && (
        <div style={{ fontSize: 12, color: '#c62828', background: '#ffebee', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>{error}</div>
      )}
      <button
        type="button" onClick={handleSave} disabled={saving}
        style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: 'none', fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}
      >
        {saving ? 'Menyimpan…' : 'Simpan Pasca Sapih'}
      </button>
    </div>
  );
}

function SapihSheet({
  livestockId, kelahiran, onClose,
}: {
  livestockId: string;
  kelahiran: KelahiranRecord;
  onClose: () => void;
}) {
  const [tick, setTick]           = useState(0);
  const [completing, setCompleting] = useState(false);
  void tick;

  const list    = getSapihListByLivestock(livestockId);
  const current = list[0] ?? null;

  function bump() { setTick((t) => t + 1); }

  function handleStart() {
    if (!current) return;
    try { startSapih(current.id); bump(); }
    catch (e) { window.alert(e instanceof Error ? e.message : String(e)); }
  }

  function handleCancel() {
    if (!current) return;
    const alasan = window.prompt('Alasan pembatalan Sapih (opsional):') ?? null;
    try { cancelSapih(current.id, alasan); bump(); }
    catch (e) { window.alert(e instanceof Error ? e.message : String(e)); }
  }

  return (
    <SheetShell title="Sapih (Weaning)" subtitle={livestockId} onClose={onClose} zIndex={700}>
      {!current || current.status === 'Dibatalkan' ? (
        <>
          {current?.status === 'Dibatalkan' && (
            <div style={{ fontSize: 12, color: '#757575', background: '#f0f0f0', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
              🚫 Sapih sebelumnya dibatalkan{current.alasanBatal ? `: ${current.alasanBatal}` : '.'} Anda dapat merencanakan Sapih baru.
            </div>
          )}
          <SapihPlanForm livestockId={livestockId} kelahiran={kelahiran} onClose={onClose} onSaved={() => { bump(); }} />
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: SAPIH_STATUS_COLOR[current.status], background: SAPIH_STATUS_BG[current.status],
              borderRadius: 20, padding: '3px 10px',
            }}>
              {current.status}
            </span>
            <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{current.metode}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <DetailRow label="Tanggal Sapih"    value={current.tanggalSapih} />
            <DetailRow label="Umur Saat Sapih"  value={formatUmurSaatSapih(umurSaatSapihHari(kelahiran, current.status === 'Selesai' && current.completedDate ? current.completedDate : current.tanggalSapih))} />
            <DetailRow label="Berat Badan"      value={`${current.beratBadan} kg`} />
            {current.bcs != null && <DetailRow label="BCS" value={String(current.bcs)} />}
            <DetailRow label="Petugas"          value={current.petugas} />
            {current.catatan && <DetailRow label="Catatan" value={current.catatan} />}
          </div>

          {(current.kondisiPertumbuhan || current.adaptasiPakan || current.observasiKesehatan || current.catatanPascaSapih) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
              <FieldLabel label="Pasca Sapih" />
              {current.kondisiPertumbuhan && <DetailRow label="Kondisi Pertumbuhan" value={current.kondisiPertumbuhan} />}
              {current.adaptasiPakan && <DetailRow label="Adaptasi Pakan" value={current.adaptasiPakan} />}
              {current.observasiKesehatan && <DetailRow label="Observasi Kesehatan" value={current.observasiKesehatan} />}
              {current.catatanPascaSapih && <DetailRow label="Catatan" value={current.catatanPascaSapih} />}
            </div>
          )}

          {current.status === 'Direncanakan' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button" onClick={handleCancel}
                style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-md)', background: '#ffebee', color: '#c62828', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Batalkan
              </button>
              <button
                type="button" onClick={handleStart}
                style={{ flex: 2, padding: '12px', borderRadius: 'var(--radius-md)', background: '#00695c', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                🌾 Mulai Sapih
              </button>
            </div>
          )}

          {current.status === 'Berlangsung' && !completing && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button" onClick={handleCancel}
                style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-md)', background: '#ffebee', color: '#c62828', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Batalkan
              </button>
              <button
                type="button" onClick={() => setCompleting(true)}
                style={{ flex: 2, padding: '12px', borderRadius: 'var(--radius-md)', background: '#2e7d32', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                ✅ Selesaikan Sapih
              </button>
            </div>
          )}

          {current.status === 'Berlangsung' && completing && (
            <SapihCompleteForm sapih={current} onClose={() => setCompleting(false)} onSaved={() => { setCompleting(false); bump(); }} />
          )}

          {(current.status === 'Berlangsung' || current.status === 'Selesai') && (
            <>
              <div style={{ height: 1, background: 'var(--color-border)' }} />
              <PascaSapihForm sapih={current} onSaved={bump} />
            </>
          )}
        </>
      )}
    </SheetShell>
  );
}

// ─── KelahiranDetailSheet ────────────────────────────────────────────────────

function KelahiranDetailSheet({
  kelahiran, program, damName, onClose, onChanged,
}: {
  kelahiran: KelahiranRecord;
  program: ReproduksiProgramRecord;
  damName: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [tick, setTick]                 = useState(0);
  const [addingAnak, setAdding]         = useState(false);
  const [registeringAnakId, setRegAnak] = useState<string | null>(null);
  const [registeringSemua, setRegSemua] = useState(false);
  const [sapihLivestockId, setSapihLv]  = useState<string | null>(null);

  function bump() { setTick((t) => t + 1); onChanged(); }

  void tick;
  const current       = getKelahiranById(kelahiran.id) ?? kelahiran;
  const anakList      = getAnakListByKelahiran(current.id);
  const hasil         = getKelahiranHasil(current.id);
  const isBerlangsung = current.status === 'Berlangsung';
  const registrable   = getRegistrableAnak(current.id);

  function handleComplete() {
    if (!window.confirm('Tandai Kelahiran ini sebagai Selesai? Tindakan ini tidak dapat dibatalkan.')) return;
    try { completeKelahiran(current.id); bump(); }
    catch (e) { window.alert(e instanceof Error ? e.message : String(e)); }
  }

  return (
    <SheetShell title="Detail Kelahiran" subtitle={program.namaProgram} onClose={onClose} zIndex={500}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <StatusKelahiranBadge status={current.status} />
        <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
          {METODE_KELAHIRAN_CFG[current.metode]} {current.metode}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <DetailRow label="Induk (Dam)"   value={damName} />
        <DetailRow label="Tanggal Lahir" value={`${current.tanggalLahir} ${current.jamLahir}`} />
        <DetailRow label="Lokasi"        value={current.lokasiLahir} />
        <DetailRow label="Petugas"       value={current.petugas} />
        {current.catatan && <DetailRow label="Catatan" value={current.catatan} />}
      </div>

      {/* Ringkasan hasil kelahiran */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {(
          [
            { label: 'Total',      value: hasil.totalLahir,       color: 'var(--color-primary)' },
            { label: 'Hidup',      value: hasil.hidup,            color: '#2e7d32' },
            { label: 'Lahir Mati', value: hasil.lahirMati,        color: '#795548' },
            { label: 'Mati',       value: hasil.matiSetelahLahir, color: '#b71c1c' },
          ] as { label: string; value: number; color: string }[]
        ).map(({ label, value, color }) => (
          <div key={label} style={{
            textAlign: 'center', padding: '8px 4px',
            background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: 'var(--color-border)' }} />

      {/* Daftar Anak */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <FieldLabel label={`Anak (${anakList.length})`} />
        {isBerlangsung && (
          <button
            type="button" onClick={() => setAdding(true)}
            style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', background: 'var(--color-primary-light)', border: 'none', borderRadius: 20, padding: '5px 12px', cursor: 'pointer' }}
          >
            + Tambah Anak
          </button>
        )}
      </div>

      {anakList.length === 0 ? (
        <div style={{ border: '1.5px dashed var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
            Belum ada data anak. {isBerlangsung ? 'Gunakan tombol "+ Tambah Anak" di atas.' : ''}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {anakList.map((a) => (
            <AnakCard
              key={a.id} anak={a}
              onDaftarkan={a.jenis === 'Hidup' && a.statusRegistrasi === 'Belum Didaftarkan' ? () => setRegAnak(a.id) : undefined}
              onSapih={a.statusRegistrasi === 'Sudah Didaftarkan' && a.livestockId ? () => setSapihLv(a.livestockId as string) : undefined}
            />
          ))}
        </div>
      )}

      {/* Registrasi Anak (RP-008) */}
      {registrable.length > 1 && (
        <button
          type="button" onClick={() => setRegSemua(true)}
          style={{
            fontSize: 12, fontWeight: 700, color: '#e65100', background: '#fff3e0',
            border: '1.5px dashed #e6510050', borderRadius: 'var(--radius-sm)', padding: '10px 12px', cursor: 'pointer',
          }}
        >
          ⏳ Daftarkan Semua ({registrable.length} Anak) sebagai Ternak →
        </button>
      )}

      {/* Aksi Selesaikan */}
      {isBerlangsung && (
        <>
          <div style={{ height: 1, background: 'var(--color-border)' }} />
          <button
            type="button" onClick={handleComplete}
            style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', background: '#2e7d32', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            ✅ Selesaikan Kelahiran
          </button>
        </>
      )}

      {addingAnak && (
        <AnakFormSheet
          kelahiran={current}
          onClose={() => setAdding(false)}
          onSaved={() => { setAdding(false); bump(); }}
        />
      )}

      {registeringAnakId && (
        <RegistrasiAnakFormSheet
          anakId={registeringAnakId}
          onClose={() => setRegAnak(null)}
          onSaved={() => { setRegAnak(null); bump(); }}
        />
      )}

      {registeringSemua && (
        <RegistrasiSemuaFormSheet
          kelahiran={current}
          onClose={() => setRegSemua(false)}
          onSaved={() => { setRegSemua(false); bump(); }}
        />
      )}

      {sapihLivestockId && (
        <SapihSheet
          livestockId={sapihLivestockId}
          kelahiran={current}
          onClose={() => { setSapihLv(null); bump(); }}
        />
      )}
    </SheetShell>
  );
}

// ─── KelahiranSection (in ProgramDetailSheet) ────────────────────────────────

function KelahiranSection({ program, allLivestock }: { program: ReproduksiProgramRecord; allLivestock: LivestockRecord[] }) {
  const [tick, setTick]               = useState(0);
  const [creating, setCreating]       = useState(false);
  const [detailItem, setDetailItem]   = useState<KelahiranRecord | null>(null);

  const byId = new Map(allLivestock.map((lv) => [lv.id, lv]));
  const list = getKelahiranListByProgram(program.id);

  // Eligible = Kebuntingan berstatus 'Selesai' yang belum memiliki Kelahiran
  const eligible = getPregnancyListByProgram(program.id)
    .filter((kb) => kb.status === 'Selesai' && !getKelahiranByKebuntinganId(kb.id));
  const canAdd = eligible.length > 0;

  function bump() { setTick((t) => t + 1); }

  void tick;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <FieldLabel label={`Kelahiran (${list.length})`} />
        <button
          type="button"
          onClick={() => canAdd && setCreating(true)}
          disabled={!canAdd}
          style={{
            fontSize: 11, fontWeight: 700,
            color:      canAdd ? 'var(--color-primary)' : 'var(--color-border)',
            background: canAdd ? 'var(--color-primary-light)' : 'var(--color-bg)',
            border: 'none', borderRadius: 20, padding: '5px 12px',
            cursor: canAdd ? 'pointer' : 'not-allowed',
          }}
        >
          + Kelahiran
        </button>
      </div>

      {!canAdd && list.length === 0 && (
        <div style={{ fontSize: 11.5, color: 'var(--color-muted)', fontStyle: 'italic', marginBottom: 10 }}>
          Kelahiran hanya dapat dicatat dari Kebuntingan berstatus "Selesai" yang belum memiliki data Kelahiran.
        </div>
      )}

      {list.length === 0 ? (
        <div style={{ border: '1.5px dashed var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '18px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Belum ada Kelahiran untuk program ini.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.map((k) => (
            <KelahiranCard
              key={k.id}
              kelahiran={k}
              damName={byId.get(k.damId)?.name ?? k.damId}
              hasil={getKelahiranHasil(k.id)}
              onDetail={() => setDetailItem(k)}
            />
          ))}
        </div>
      )}

      {creating && (
        <KelahiranCreateFormSheet
          program={program}
          eligibleKebuntingan={eligible}
          allLivestock={allLivestock}
          onClose={() => setCreating(false)}
          onSaved={(k) => { setCreating(false); setDetailItem(k); bump(); }}
        />
      )}

      {detailItem && (
        <KelahiranDetailSheet
          kelahiran={detailItem}
          program={program}
          damName={byId.get(detailItem.damId)?.name ?? detailItem.damId}
          onClose={() => setDetailItem(null)}
          onChanged={bump}
        />
      )}
    </div>
  );
}

// ─── Monitoring Program Reproduksi (RP-004) ─────────────────────────────────
// Monitoring adalah pusat pencatatan seluruh kejadian (event) selama Program
// berlangsung. Tidak menentukan status bunting, tidak mengubah Program, tidak
// mengubah Pelaksanaan — hanya mencatat bahwa sebuah kejadian terjadi.

const KONDISI_CFG: Record<KondisiMonitoring, { bg: string; color: string }> = {
  Normal:              { bg: '#e8f5e9', color: '#2e7d32' },
  'Perlu Observasi':   { bg: '#fff8e1', color: '#f57f17' },
  'Perlu Pemeriksaan': { bg: '#ffebee', color: '#c62828' },
  'Selesai Monitoring': { bg: '#eceff1', color: '#546e7a' },
};

function KondisiBadge({ kondisi }: { kondisi: KondisiMonitoring }) {
  const cfg = KONDISI_CFG[kondisi];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: '2px 8px' }}>
      {kondisi}
    </span>
  );
}

const STATUS_MONITORING_CFG: Record<StatusMonitoring, { bg: string; color: string }> = {
  Draft:     { bg: '#eceff1', color: '#546e7a' },
  Tersimpan: { bg: '#e3f2fd', color: '#0277bd' },
};

function StatusMonitoringBadge({ status }: { status: StatusMonitoring }) {
  const cfg = STATUS_MONITORING_CFG[status];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: '2px 8px' }}>
      {status}
    </span>
  );
}

function EventTypeBadge({ eventType }: { eventType: EventType }) {
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 700, color: 'var(--color-text)', background: 'var(--color-bg)',
      border: '1.5px solid var(--color-border)', borderRadius: 20, padding: '2px 9px',
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      <span>{eventTypeIcon(eventType)}</span>{eventType}
    </span>
  );
}

// ─── Timeline item ───────────────────────────────────────────────────────────

function TimelineItem({ event, onClick, showProgramName, livestockLabel, forceClickable }: {
  event: ReproduksiEvent;
  onClick?: () => void;
  showProgramName?: string;
  livestockLabel?: string;
  /** RP-010 Riwayat Reproduksi shows a Detail Sheet for every Event regardless of source — bypasses the "only monitoring-sourced" restriction used by RP-004's own Timeline usages. */
  forceClickable?: boolean;
}) {
  const clickable = (forceClickable || event.source === 'monitoring') && !!onClick;
  return (
    <div
      onClick={clickable ? onClick : undefined}
      style={{
        display: 'flex', gap: 10, padding: '10px 4px',
        borderBottom: '1px solid var(--color-border)',
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      <div style={{
        flexShrink: 0, width: 30, height: 30, borderRadius: '50%',
        background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
      }}>
        {eventTypeIcon(event.eventType)}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--color-text)' }}>{event.eventType}</span>
          {event.source === 'monitoring' && event.monitoring && <StatusMonitoringBadge status={event.monitoring.status} />}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
          {event.timestamp || '—'}{event.jam ? ` · ${event.jam}` : ''} · {event.petugas}
          {showProgramName && ` · ${showProgramName}`}
          {livestockLabel && ` · ${livestockLabel}`}
        </div>
        {event.catatan && (
          <div style={{
            fontSize: 12, color: 'var(--color-text)', marginTop: 4, lineHeight: 1.5,
            overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
          }}>
            {event.catatan}
          </div>
        )}
        {event.source === 'monitoring' && event.monitoring && (
          <div style={{ marginTop: 4 }}>
            <KondisiBadge kondisi={event.monitoring.kondisi} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Monitoring Form Sheet ───────────────────────────────────────────────────

function emptyMonitoringForm(): MonitoringInput {
  return {
    pelaksanaanId: null, eventType: MONITORING_EVENT_TYPE_LIST[0],
    tanggal: '', jam: '', petugas: '', kondisi: 'Normal', status: 'Draft', catatan: '', lampiran: [],
  };
}

function monitoringFormFromRecord(m: MonitoringRecord): MonitoringInput {
  return {
    pelaksanaanId: m.pelaksanaanId, eventType: m.eventType,
    tanggal: m.tanggal, jam: m.jam, petugas: m.petugas,
    kondisi: m.kondisi, status: m.status, catatan: m.catatan ?? '', lampiran: [...m.lampiran],
  };
}

type MonitoringFormContext =
  | { kind: 'create'; program: ReproduksiProgramRecord }
  | { kind: 'create-global'; programs: ReproduksiProgramRecord[] }
  | { kind: 'edit'; monitoring: MonitoringRecord; program: ReproduksiProgramRecord };

function MonitoringFormSheet({ ctx, onClose, onSaved }: {
  ctx: MonitoringFormContext;
  onClose: () => void;
  onSaved: (m: MonitoringRecord) => void;
}) {
  const initialProgramId = ctx.kind === 'create-global'
    ? (ctx.programs.find(isProgramAktifUntukPelaksanaan)?.id ?? '')
    : ctx.kind === 'create' ? ctx.program.id : ctx.monitoring.programId;

  const [programId, setProgramId] = useState(initialProgramId);
  const [form, setForm] = useState<MonitoringInput>(ctx.kind === 'edit' ? monitoringFormFromRecord(ctx.monitoring) : emptyMonitoringForm());
  const [error, setError] = useState<string | null>(null);
  const { activeWorkspace } = useWorkspace();

  const selectedProgram = getProgramById(programId);
  const pelaksanaanOptions = programId ? getPelaksanaanListByProgram(programId) : [];
  const lockProgram = ctx.kind !== 'create-global';

  function handleSave() {
    try {
      const saved = ctx.kind === 'edit'
        ? updateMonitoring(ctx.monitoring.id, form)
        : addMonitoring(programId, form);
      onSaved(saved);

      // ── Supabase dual-write (fire-and-forget) ────────────────────────────
      if (ctx.kind !== 'edit' && activeWorkspace?.workspace_uuid) {
        void recordMonitoring(activeWorkspace.workspace_uuid, saved).catch((err) =>
          console.error('[Reproduksi] recordMonitoring failed:', err),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan Monitoring.');
    }
  }

  return (
    <SheetShell
      title={ctx.kind === 'edit' ? 'Edit Monitoring' : 'Monitoring Baru'}
      subtitle={selectedProgram ? `Program: ${selectedProgram.namaProgram}` : undefined}
      onClose={onClose}
      zIndex={400}
      footer={
        <button type="button" onClick={handleSave} style={{
          width: '100%', background: 'var(--color-primary)', color: '#fff',
          border: 'none', borderRadius: 'var(--radius-sm)', padding: '13px 0',
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}>
          Simpan Monitoring
        </button>
      }
    >
      {error && (
        <div style={{ background: '#ffebee', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: 12.5, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <div>
        <FieldLabel label="Program Reproduksi" />
        {lockProgram ? (
          <div style={{
            border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
            padding: '10px 12px', fontSize: 13, fontWeight: 700, color: 'var(--color-text)',
          }}>
            {selectedProgram ? `${selectedProgram.namaProgram} (${selectedProgram.nomorProgram})` : '—'}
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <select
              value={programId}
              onChange={(e) => { setProgramId(e.target.value); setForm((f) => ({ ...f, pelaksanaanId: null })); }}
              style={{
                width: '100%', padding: '10px 32px 10px 12px',
                border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface)', color: 'var(--color-text)',
                fontSize: 13, fontWeight: 600, appearance: 'none', outline: 'none', cursor: 'pointer',
              }}
            >
              {ctx.kind === 'create-global' && ctx.programs.filter(isProgramAktifUntukPelaksanaan).length === 0 && (
                <option value="">Tidak ada Program aktif</option>
              )}
              {ctx.kind === 'create-global' && ctx.programs.filter(isProgramAktifUntukPelaksanaan).map((p) => (
                <option key={p.id} value={p.id}>{p.namaProgram} ({p.nomorProgram})</option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--color-muted)', pointerEvents: 'none' }}>▾</span>
          </div>
        )}
      </div>

      <div>
        <FieldLabel label="Pelaksanaan Terkait (opsional)" />
        <div style={{ position: 'relative' }}>
          <select
            value={form.pelaksanaanId ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, pelaksanaanId: e.target.value || null }))}
            disabled={pelaksanaanOptions.length === 0}
            style={{
              width: '100%', padding: '10px 32px 10px 12px',
              border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              fontSize: 13, fontWeight: 600, appearance: 'none', outline: 'none',
              cursor: pelaksanaanOptions.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <option value="">Tidak terkait Pelaksanaan tertentu</option>
            {pelaksanaanOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.nomorPelaksanaan} — {p.tanggal}</option>
            ))}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--color-muted)', pointerEvents: 'none' }}>▾</span>
        </div>
      </div>

      <div>
        <FieldLabel label="Jenis Kejadian (Event Type)" />
        <div style={{ position: 'relative' }}>
          <select
            value={form.eventType}
            onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value as EventType }))}
            style={{
              width: '100%', padding: '10px 32px 10px 12px',
              border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              fontSize: 13, fontWeight: 600, appearance: 'none', outline: 'none', cursor: 'pointer',
            }}
          >
            {MONITORING_EVENT_TYPE_LIST.map((t) => <option key={t} value={t}>{eventTypeIcon(t)} {t}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--color-muted)', pointerEvents: 'none' }}>▾</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel label="Tanggal" />
          <input type="date" value={form.tanggal}
            onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))} />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel label="Jam" />
          <input type="time" value={form.jam}
            onChange={(e) => setForm((f) => ({ ...f, jam: e.target.value }))} />
        </div>
      </div>

      <div>
        <FieldLabel label="Petugas" />
        <input type="text" placeholder="Nama petugas pemantau" value={form.petugas}
          onChange={(e) => setForm((f) => ({ ...f, petugas: e.target.value }))} />
      </div>

      <div>
        <FieldLabel label="Kondisi" />
        <div style={{ position: 'relative' }}>
          <select
            value={form.kondisi}
            onChange={(e) => setForm((f) => ({ ...f, kondisi: e.target.value as KondisiMonitoring }))}
            style={{
              width: '100%', padding: '10px 32px 10px 12px',
              border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              fontSize: 13, fontWeight: 600, appearance: 'none', outline: 'none', cursor: 'pointer',
            }}
          >
            {KONDISI_LIST.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--color-muted)', pointerEvents: 'none' }}>▾</span>
        </div>
      </div>

      <div>
        <FieldLabel label="Status" />
        <div style={{ position: 'relative' }}>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as StatusMonitoring }))}
            style={{
              width: '100%', padding: '10px 32px 10px 12px',
              border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              fontSize: 13, fontWeight: 600, appearance: 'none', outline: 'none', cursor: 'pointer',
            }}
          >
            {STATUS_MONITORING_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--color-muted)', pointerEvents: 'none' }}>▾</span>
        </div>
      </div>

      <LampiranEditor lampiran={form.lampiran} onChange={(next) => setForm((f) => ({ ...f, lampiran: next as LampiranMonitoring[] }))} />

      <div>
        <FieldLabel label="Catatan (opsional)" />
        <textarea
          placeholder="Catatan hasil monitoring..."
          value={form.catatan ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))}
          style={{ minHeight: 80 }}
        />
      </div>
    </SheetShell>
  );
}

function MonitoringDetailSheet({ monitoring, program, onClose }: {
  monitoring: MonitoringRecord;
  program: ReproduksiProgramRecord;
  onClose: () => void;
}) {
  const pelaksanaan = monitoring.pelaksanaanId ? getPelaksanaanById(monitoring.pelaksanaanId) : null;

  return (
    <SheetShell title="Detail Monitoring" subtitle={`Program: ${program.namaProgram}`} onClose={onClose} zIndex={400}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <EventTypeBadge eventType={monitoring.eventType} />
        <KondisiBadge kondisi={monitoring.kondisi} />
        <StatusMonitoringBadge status={monitoring.status} />
      </div>

      <div style={{ height: 1, background: 'var(--color-border)' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <DetailRow label="Tanggal" value={monitoring.tanggal || '—'} />
        <DetailRow label="Jam" value={monitoring.jam || '—'} />
        <DetailRow label="Petugas" value={monitoring.petugas} />
        <DetailRow label="Pelaksanaan Terkait" value={pelaksanaan ? pelaksanaan.nomorPelaksanaan : 'Tidak terkait Pelaksanaan tertentu'} />
      </div>

      <div>
        <FieldLabel label={`Lampiran (${monitoring.lampiran.length})`} />
        {monitoring.lampiran.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {monitoring.lampiran.map((l) => (
              <div key={l.id} style={{ fontSize: 12, color: 'var(--color-text)' }}>
                {l.jenis === 'Foto' ? '🖼️' : '📄'} {l.namaFile}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--color-muted)', fontStyle: 'italic' }}>Belum ada lampiran.</div>
        )}
      </div>

      {monitoring.catatan && (
        <div>
          <FieldLabel label="Catatan" />
          <div style={{ fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.6 }}>{monitoring.catatan}</div>
        </div>
      )}

      <div style={{ fontSize: 11, color: 'var(--color-muted)', fontStyle: 'italic' }}>
        Monitoring tidak menentukan status bunting dan tidak mengubah data Program/Pelaksanaan — hanya mencatat kejadian.
      </div>
    </SheetShell>
  );
}

// ─── Monitoring Section (nested di dalam Program Detail Sheet) ─────────────

function MonitoringSection({ program }: { program: ReproduksiProgramRecord }) {
  const [formCtx, setFormCtx] = useState<MonitoringFormContext | null>(null);
  const [detailItem, setDetailItem] = useState<MonitoringRecord | null>(null);

  const timeline = getFullTimelineForProgram(program);
  const canAdd = isProgramAktifUntukPelaksanaan(program);

  function handleSaved() {
    setFormCtx(null);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <FieldLabel label={`Monitoring — Timeline (${timeline.length})`} />
        <button
          type="button"
          onClick={() => canAdd && setFormCtx({ kind: 'create', program })}
          disabled={!canAdd}
          style={{
            fontSize: 11, fontWeight: 700,
            color: canAdd ? 'var(--color-primary)' : 'var(--color-border)',
            background: canAdd ? 'var(--color-primary-light)' : 'var(--color-bg)',
            border: 'none', borderRadius: 20, padding: '5px 12px',
            cursor: canAdd ? 'pointer' : 'not-allowed',
          }}
        >
          + Monitoring
        </button>
      </div>

      {!canAdd && (
        <div style={{ fontSize: 11.5, color: 'var(--color-muted)', fontStyle: 'italic', marginBottom: 10 }}>
          Program berstatus "{program.status}" — tidak dapat menambah Monitoring baru.
        </div>
      )}

      {timeline.length === 0 ? (
        <div style={{
          border: '1.5px dashed var(--color-border)', borderRadius: 'var(--radius-sm)',
          padding: '18px 14px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Belum ada kejadian yang tercatat.</div>
        </div>
      ) : (
        <div>
          {timeline.map((ev) => (
            <TimelineItem
              key={ev.eventId}
              event={ev}
              onClick={ev.monitoring ? () => setDetailItem(ev.monitoring!) : undefined}
            />
          ))}
        </div>
      )}

      {formCtx && (
        <MonitoringFormSheet ctx={formCtx} onClose={() => setFormCtx(null)} onSaved={handleSaved} />
      )}

      {detailItem && (
        <MonitoringDetailSheet monitoring={detailItem} program={program} onClose={() => setDetailItem(null)} />
      )}
    </div>
  );
}

// ─── Program Reproduksi Section ─────────────────────────────────────────────

function ProgramReproduksiSection({ programs, onAdd, onDetail, onEdit, onCancel }: {
  programs: ReproduksiProgramRecord[];
  onAdd: () => void;
  onDetail: (p: ReproduksiProgramRecord) => void;
  onEdit: (p: ReproduksiProgramRecord) => void;
  onCancel: (p: ReproduksiProgramRecord) => void;
}) {
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <SectionLabel title="Program Reproduksi" />
        {programs.length > 0 && (
          <button
            type="button"
            onClick={onAdd}
            style={{
              fontSize: 11.5, fontWeight: 700, color: 'var(--color-primary)',
              background: 'var(--color-primary-light)', border: 'none',
              borderRadius: 20, padding: '5px 12px', cursor: 'pointer',
            }}
          >
            + Program Baru
          </button>
        )}
      </div>

      {programs.length === 0 ? (
        <Card style={{ padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🗂️</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
            Belum ada Program Reproduksi.
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: 16 }}>
            Program reproduksi akan tampil di sini setelah dibuat.
          </div>
          <button
            type="button"
            onClick={onAdd}
            style={{
              padding: '10px 20px', fontSize: 13, fontWeight: 700,
              background: 'var(--color-primary)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            }}
          >
            + Program Reproduksi Baru
          </button>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {programs.map((p) => (
            <ProgramCard
              key={p.id}
              program={p}
              onDetail={() => onDetail(p)}
              onEdit={() => onEdit(p)}
              onCancel={() => onCancel(p)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Monitoring Program Reproduksi — Search & Filter + Timeline global ─────

type MonitoringFilters = {
  search: string;
  programId: string;   // '' = Semua Program
  eventType: string;    // '' = Semua Event Type
  tanggal: string;      // '' = semua tanggal
  petugas: string;      // '' = semua petugas
  status: string;       // '' = Semua Status
};

function emptyMonitoringFilters(): MonitoringFilters {
  return { search: '', programId: '', eventType: '', tanggal: '', petugas: '', status: '' };
}

function MonitoringSearchFilterSection({ filters, onChange, programs }: {
  filters: MonitoringFilters;
  onChange: (next: MonitoringFilters) => void;
  programs: ReproduksiProgramRecord[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
        background: 'var(--color-surface)', padding: '10px 12px',
      }}>
        <span style={{ fontSize: 15, color: 'var(--color-muted)', flexShrink: 0 }}>🔍</span>
        <input
          type="text"
          placeholder="Cari catatan, petugas, atau program..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          style={{ border: 'none', outline: 'none', flex: 1, fontSize: 13, color: 'var(--color-text)', background: 'transparent' }}
        />
        {filters.search && (
          <button type="button" onClick={() => onChange({ ...filters, search: '' })}
            style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
            ✕
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 5 }}>Program</div>
          <div style={{ position: 'relative' }}>
            <select
              value={filters.programId}
              onChange={(e) => onChange({ ...filters, programId: e.target.value })}
              style={{
                width: '100%', padding: '9px 26px 9px 10px',
                border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface)', color: 'var(--color-text)',
                fontSize: 12, fontWeight: 600, appearance: 'none', outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="">Semua Program</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.namaProgram}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--color-muted)', pointerEvents: 'none' }}>▾</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 5 }}>Event Type</div>
          <div style={{ position: 'relative' }}>
            <select
              value={filters.eventType}
              onChange={(e) => onChange({ ...filters, eventType: e.target.value })}
              style={{
                width: '100%', padding: '9px 26px 9px 10px',
                border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface)', color: 'var(--color-text)',
                fontSize: 12, fontWeight: 600, appearance: 'none', outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="">Semua Event Type</option>
              {EVENT_TYPE_LIST.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--color-muted)', pointerEvents: 'none' }}>▾</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 5 }}>Tanggal</div>
          <input
            type="date"
            value={filters.tanggal}
            onChange={(e) => onChange({ ...filters, tanggal: e.target.value })}
            style={{ padding: '8px 10px', fontSize: 12 }}
          />
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 5 }}>Petugas</div>
          <input
            type="text"
            placeholder="Nama petugas..."
            value={filters.petugas}
            onChange={(e) => onChange({ ...filters, petugas: e.target.value })}
            style={{ padding: '8px 10px', fontSize: 12 }}
          />
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 5 }}>Status</div>
          <div style={{ position: 'relative' }}>
            <select
              value={filters.status}
              onChange={(e) => onChange({ ...filters, status: e.target.value })}
              style={{
                width: '100%', padding: '9px 26px 9px 10px',
                border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface)', color: 'var(--color-text)',
                fontSize: 12, fontWeight: 600, appearance: 'none', outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="">Semua Status</option>
              {STATUS_MONITORING_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--color-muted)', pointerEvents: 'none' }}>▾</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function matchesMonitoringFilters(event: ReproduksiEvent, filters: MonitoringFilters, programsById: Map<string, ReproduksiProgramRecord>): boolean {
  if (filters.programId && event.programId !== filters.programId) return false;
  if (filters.eventType && event.eventType !== filters.eventType) return false;
  if (filters.tanggal && event.timestamp !== filters.tanggal) return false;
  if (filters.petugas && !event.petugas.toLowerCase().includes(filters.petugas.toLowerCase())) return false;
  if (filters.status) {
    if (event.source !== 'monitoring' || !event.monitoring || event.monitoring.status !== filters.status) return false;
  }
  if (filters.search) {
    const program = programsById.get(event.programId);
    const haystack = [
      event.eventType, event.catatan ?? '', event.petugas,
      program?.namaProgram ?? '', program?.nomorProgram ?? '',
    ].join(' ').toLowerCase();
    if (!haystack.includes(filters.search.toLowerCase())) return false;
  }
  return true;
}

function GlobalMonitoringSection({ programs, filters, onFiltersChange, onAdd, onDetail }: {
  programs: ReproduksiProgramRecord[];
  filters: MonitoringFilters;
  onFiltersChange: (next: MonitoringFilters) => void;
  onAdd: () => void;
  onDetail: (m: MonitoringRecord, program: ReproduksiProgramRecord) => void;
}) {
  const programsById = new Map(programs.map((p) => [p.id, p]));
  const hasActiveProgram = programs.some(isProgramAktifUntukPelaksanaan);

  const allEvents = programs.flatMap((p) => getFullTimelineForProgram(p))
    .sort((a, b) => {
      const aKey = `${a.timestamp}T${a.jam ?? '00:00'}`;
      const bKey = `${b.timestamp}T${b.jam ?? '00:00'}`;
      return aKey === bKey ? 0 : (aKey < bKey ? 1 : -1);
    });

  const filtered = allEvents.filter((ev) => matchesMonitoringFilters(ev, filters, programsById));

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <SectionLabel title="Monitoring Program Reproduksi" />
        <button
          type="button"
          onClick={() => hasActiveProgram && onAdd()}
          disabled={!hasActiveProgram}
          style={{
            fontSize: 11.5, fontWeight: 700,
            color: hasActiveProgram ? 'var(--color-primary)' : 'var(--color-border)',
            background: hasActiveProgram ? 'var(--color-primary-light)' : 'var(--color-bg)',
            border: 'none', borderRadius: 20, padding: '5px 12px',
            cursor: hasActiveProgram ? 'pointer' : 'not-allowed',
          }}
        >
          + Monitoring Baru
        </button>
      </div>

      {programs.length === 0 ? (
        <Card style={{ padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🩺</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
            Belum ada Monitoring.
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Monitoring akan tampil di sini setelah ada Program Reproduksi dan kejadian tercatat.
          </div>
        </Card>
      ) : (
        <>
          <div style={{ marginBottom: 14 }}>
            <MonitoringSearchFilterSection filters={filters} onChange={onFiltersChange} programs={programs} />
          </div>

          {filtered.length === 0 ? (
            <Card style={{ padding: '28px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Tidak ada kejadian yang cocok dengan filter.</div>
            </Card>
          ) : (
            <Card style={{ padding: '4px 12px' }}>
              {filtered.map((ev) => (
                <TimelineItem
                  key={ev.eventId}
                  event={ev}
                  showProgramName={programsById.get(ev.programId)?.namaProgram}
                  onClick={ev.monitoring ? () => onDetail(ev.monitoring!, programsById.get(ev.programId)!) : undefined}
                />
              ))}
            </Card>
          )}
        </>
      )}
    </section>
  );
}

// ─── RP-010: Riwayat Reproduksi ──────────────────────────────────────────────
// Riwayat Reproduksi adalah timeline agregat READ-ONLY lintas SEMUA Program —
// gabungan seluruh Event RP-002..RP-009 (Program, Monitoring, Pemeriksaan
// Kebuntingan, Kebuntingan, Kelahiran, Registrasi Anak, Sapih), diperkaya
// dengan Program/Livestock/Anak terkait lewat riwayatReproduksiData.ts.
// Modul ini TIDAK memiliki aksi tambah/ubah/hapus apa pun.

function RiwayatSearchFilterSection({ filters, onChange, programs, allLivestock }: {
  filters: RiwayatFilters;
  onChange: (next: RiwayatFilters) => void;
  programs: ReproduksiProgramRecord[];
  allLivestock: LivestockRecord[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
        background: 'var(--color-surface)', padding: '10px 12px',
      }}>
        <span style={{ fontSize: 15, color: 'var(--color-muted)', flexShrink: 0 }}>🔍</span>
        <input
          type="text"
          placeholder="Cari catatan, petugas, program, atau ternak..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          style={{ border: 'none', outline: 'none', flex: 1, fontSize: 13, color: 'var(--color-text)', background: 'transparent' }}
        />
        {filters.search && (
          <button type="button" onClick={() => onChange({ ...filters, search: '' })}
            style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
            ✕
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 5 }}>Event Type</div>
          <div style={{ position: 'relative' }}>
            <select
              value={filters.eventType}
              onChange={(e) => onChange({ ...filters, eventType: e.target.value })}
              style={{
                width: '100%', padding: '9px 26px 9px 10px',
                border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface)', color: 'var(--color-text)',
                fontSize: 12, fontWeight: 600, appearance: 'none', outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="">Semua Event Type</option>
              {EVENT_TYPE_LIST.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--color-muted)', pointerEvents: 'none' }}>▾</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 5 }}>Program</div>
          <div style={{ position: 'relative' }}>
            <select
              value={filters.programId}
              onChange={(e) => onChange({ ...filters, programId: e.target.value })}
              style={{
                width: '100%', padding: '9px 26px 9px 10px',
                border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface)', color: 'var(--color-text)',
                fontSize: 12, fontWeight: 600, appearance: 'none', outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="">Semua Program</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.namaProgram}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--color-muted)', pointerEvents: 'none' }}>▾</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 5 }}>Ternak</div>
          <div style={{ position: 'relative' }}>
            <select
              value={filters.livestockId}
              onChange={(e) => onChange({ ...filters, livestockId: e.target.value })}
              style={{
                width: '100%', padding: '9px 26px 9px 10px',
                border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface)', color: 'var(--color-text)',
                fontSize: 12, fontWeight: 600, appearance: 'none', outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="">Semua Ternak</option>
              {allLivestock.map((lv) => <option key={lv.id} value={lv.id}>{lv.name ?? lv.id}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--color-muted)', pointerEvents: 'none' }}>▾</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 5 }}>Petugas</div>
          <input
            type="text"
            placeholder="Nama petugas..."
            value={filters.petugas}
            onChange={(e) => onChange({ ...filters, petugas: e.target.value })}
            style={{ padding: '8px 10px', fontSize: 12 }}
          />
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 5 }}>Status</div>
          <div style={{ position: 'relative' }}>
            <select
              value={filters.status}
              onChange={(e) => onChange({ ...filters, status: e.target.value })}
              style={{
                width: '100%', padding: '9px 26px 9px 10px',
                border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface)', color: 'var(--color-text)',
                fontSize: 12, fontWeight: 600, appearance: 'none', outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="">Semua Status</option>
              {STATUS_MONITORING_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--color-muted)', pointerEvents: 'none' }}>▾</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 5 }}>Dari Tanggal</div>
          <input
            type="date"
            value={filters.tanggalMulai}
            onChange={(e) => onChange({ ...filters, tanggalMulai: e.target.value })}
            style={{ padding: '8px 10px', fontSize: 12 }}
          />
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 5 }}>Sampai Tanggal</div>
          <input
            type="date"
            value={filters.tanggalSelesai}
            onChange={(e) => onChange({ ...filters, tanggalSelesai: e.target.value })}
            style={{ padding: '8px 10px', fontSize: 12 }}
          />
        </div>
      </div>
    </div>
  );
}

function RiwayatDetailSheet({ entry, onClose }: {
  entry: ReproduksiHistoryEntry;
  onClose: () => void;
}) {
  const { event, program, livestock, offspring } = entry;
  const pedigree = livestock ? getPedigree(livestock.id) : null;

  return (
    <SheetShell
      title="Detail Riwayat"
      subtitle={program ? `Program: ${program.namaProgram}` : undefined}
      onClose={onClose}
      zIndex={400}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <EventTypeBadge eventType={event.eventType} />
        {event.source === 'monitoring' && event.monitoring && <StatusMonitoringBadge status={event.monitoring.status} />}
      </div>

      <div style={{ height: 1, background: 'var(--color-border)' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <DetailRow label="Tanggal" value={event.timestamp || '—'} />
        <DetailRow label="Jam" value={event.jam || '—'} />
        <DetailRow label="Petugas" value={event.petugas} />
        <DetailRow label="Program Terkait" value={program ? program.namaProgram : `Tidak ditemukan (${event.programId})`} />
      </div>

      <div>
        <FieldLabel label="Ternak Terkait" />
        {livestock ? (
          <div style={{ fontSize: 12.5, color: 'var(--color-text)' }}>
            {livestock.typeIcon} {livestock.name ?? livestock.id} <span style={{ color: 'var(--color-muted)' }}>({livestock.id})</span>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--color-muted)', fontStyle: 'italic' }}>Tidak terkait Ternak tertentu.</div>
        )}
      </div>

      {livestock && pedigree && (
        <div>
          <FieldLabel label="Induk Terkait" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {pedigree.parents.map((rel) => (
              <div key={rel.role} style={{ fontSize: 12, color: 'var(--color-text)' }}>
                <span style={{ color: 'var(--color-muted)' }}>{rel.role}:</span>{' '}
                {rel.icon} {rel.name ?? 'Tidak Diketahui'}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <FieldLabel label={`Anak Terkait (${offspring.length})`} />
        {offspring.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {offspring.map((a) => (
              <div key={a.id} style={{ fontSize: 12, color: 'var(--color-text)' }}>
                {a.jenisKelamin === 'Betina' ? '♀️' : '♂️'} Ras: {a.ras} · {a.jenis}
                {a.livestockId && <span style={{ color: 'var(--color-muted)' }}> · Ternak: {a.livestockId}</span>}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--color-muted)', fontStyle: 'italic' }}>Tidak ada Anak terkait Event ini.</div>
        )}
      </div>

      <div>
        <FieldLabel label={`Lampiran (${event.lampiran?.length ?? 0})`} />
        {event.lampiran && event.lampiran.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {event.lampiran.map((l) => (
              <div key={l.id} style={{ fontSize: 12, color: 'var(--color-text)' }}>
                {l.jenis === 'Foto' ? '🖼️' : '📄'} {l.namaFile}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--color-muted)', fontStyle: 'italic' }}>Belum ada lampiran.</div>
        )}
      </div>

      {event.catatan && (
        <div>
          <FieldLabel label="Catatan" />
          <div style={{ fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.6 }}>{event.catatan}</div>
        </div>
      )}
    </SheetShell>
  );
}

function RiwayatReproduksiSection({ filters, onFiltersChange, programs, allLivestock, onDetail }: {
  filters: RiwayatFilters;
  onFiltersChange: (next: RiwayatFilters) => void;
  programs: ReproduksiProgramRecord[];
  allLivestock: LivestockRecord[];
  onDetail: (entry: ReproduksiHistoryEntry) => void;
}) {
  const history = getAllReproduksiHistory();
  const filtered = history.filter((entry) => matchesRiwayatFilters(entry, filters));

  return (
    <section>
      <SectionLabel title={`Riwayat Reproduksi (${history.length})`} />

      {history.length === 0 ? (
        <Card style={{ padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
            Belum ada riwayat reproduksi.
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Riwayat reproduksi akan muncul di sini setelah catatan pertama dibuat (Pelaksanaan,
            Pemeriksaan Kebuntingan, Kelahiran, Sapih).
          </div>
        </Card>
      ) : (
        <>
          <div style={{ marginBottom: 14 }}>
            <RiwayatSearchFilterSection filters={filters} onChange={onFiltersChange} programs={programs} allLivestock={allLivestock} />
          </div>

          {filtered.length === 0 ? (
            <Card style={{ padding: '28px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Tidak ada riwayat yang cocok dengan filter.</div>
            </Card>
          ) : (
            <Card style={{ padding: '4px 12px' }}>
              {filtered.map((entry) => (
                <TimelineItem
                  key={entry.event.eventId}
                  event={entry.event}
                  showProgramName={entry.program?.namaProgram}
                  livestockLabel={entry.livestock ? (entry.livestock.name ?? entry.livestock.id) : undefined}
                  forceClickable
                  onClick={() => onDetail(entry)}
                />
              ))}
            </Card>
          )}
        </>
      )}
    </section>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

type FormSheetState = { kind: 'create' } | { kind: 'edit'; program: ReproduksiProgramRecord } | null;

export default function Reproduksi() {
  // Populates LIVESTOCK_DB, PEDIGREE_DB, and BATCH_DB from Supabase so
  // deep-link / hard-refresh navigations get live data.
  const { isLoading, error, refresh } = useLivestock();
  // Populates all 7 reproduksi in-memory stores (PROGRAM_REPRODUKSI_DB,
  // PELAKSANAAN_REPRODUKSI_DB, MONITORING_REPRODUKSI_DB,
  // PEMERIKSAAN_KEBUNTINGAN_DB, KEBUNTINGAN_DB, KELAHIRAN_DB + ANAK_DB,
  // SAPIH_DB) from Supabase so hard-refresh navigations get live data.
  useReproduksi();
  const { activeWorkspace } = useWorkspace();
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 36 }}>⏳</span>
        <div style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 600 }}>Memuat data reproduksi...</div>
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

  const [mode,        setMode]        = useState<Mode>('individu');
  const [query,       setQuery]       = useState('');
  const [filters,     setFilters]     = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen,  setFilterOpen]  = useState(false);

  // In-memory PROGRAM_REPRODUKSI_DB mutations don't trigger React re-renders on
  // their own — bump `tick` after every add/update/cancel (mirrors batch-mutations-pattern).
  const [tick, setTick] = useState(0);
  const [formSheet,   setFormSheet]   = useState<FormSheetState>(null);
  const [detailProgram, setDetailProgram] = useState<ReproduksiProgramRecord | null>(null);

  // Monitoring (RP-004) — global search & filter state + create/detail sheets.
  const [monitoringFilters, setMonitoringFilters] = useState<MonitoringFilters>(emptyMonitoringFilters());
  const [monitoringFormCtx, setMonitoringFormCtx] = useState<MonitoringFormContext | null>(null);
  const [monitoringDetail, setMonitoringDetail] = useState<{ monitoring: MonitoringRecord; program: ReproduksiProgramRecord } | null>(null);

  // Riwayat Reproduksi (RP-010) — global read-only search & filter state + detail sheet.
  const [riwayatFilters, setRiwayatFilters] = useState<RiwayatFilters>(emptyRiwayatFilters());
  const [riwayatDetail, setRiwayatDetail] = useState<ReproduksiHistoryEntry | null>(null);

  const programs = getProgramList();
  // Exclude archived livestock — archived animals cannot participate in a new breeding program.
  // getLivestockStatus reads from transferData.ts (same guard used in every other module's
  // participant list: KesehatanHewan.tsx buildIndividuList(), PemberianPakan.tsx buildIndividuList(), etc.)
  const allLivestock = Object.values(LIVESTOCK_DB).filter((lv) => getLivestockStatus(lv.id) !== 'Arsip');

  // Adapted lists for shared FilterSheet option builders
  const ALL_INDIVIDU: FilterableIndividu[] = allLivestock
    .filter((lv) => getLivestockStatus(lv.id) !== 'Arsip')
    .map((lv) => ({
      blok:    lv.location.split(', ').find((p) => /blok/i.test(p)) ?? '',
      kandang: lv.location.split(', ').find((p) => /kandang/i.test(p)) ?? '',
      program: lv.program,
      batchId: lv.batch?.id,
    }));

  const ALL_BATCH: FilterableBatch[] = Object.values(BATCH_DB).map((b) => ({
    members: getActiveBatchMemberships(b.id).map((m) => {
      const lv = LIVESTOCK_DB[m.livestockId];
      return {
        blok:    lv?.location.split(', ').find((p) => /blok/i.test(p)) ?? '',
        kandang: lv?.location.split(', ').find((p) => /kandang/i.test(p)) ?? '',
      };
    }),
  }));

  const activeFilterCount = countActiveFilters(filters);

  function handleRemoveChip(key: keyof Filters) {
    setFilters((f) => ({ ...f, ...sharedRemoveChip(key, f) }));
  }

  // ── BT-003: Batch / livestock-participant filtering ─────────────────────────
  // ReproduksiProgramRecord has no batchId of its own — a program is
  // "in" a batch when at least one of its participants (pejantan/betina) is
  // currently an active member of that batch. Reuses batchData.ts membership
  // lookups; never duplicates batch membership logic here.
  const displayedPrograms = programs.filter((p) => {
    // Text search on program name
    if (query) {
      const q = query.toLowerCase();
      if (!p.namaProgram.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q)) return false;
    }
    const participantIds = [...p.pejantanIds, ...p.betinaIds];
    // If no active filter dimensions are set, show all programs
    const anyDimension = filters.jenis !== 'Semua Jenis' || filters.ras || (filters.program === 'Fattening' && filters.programSub);
    if (!anyDimension) return true;
    if (participantIds.length === 0) return true;

    const participants = participantIds.map((id) => LIVESTOCK_DB[id]).filter(Boolean);

    if (filters.jenis !== 'Semua Jenis') {
      if (!participants.some((lv) => lv.type === filters.jenis)) return false;
    }
    if (filters.ras) {
      if (!participants.some((lv) => lv.ras === filters.ras)) return false;
    }
    // Fattening batch sub-filter: program has a participant in the selected batch
    if (filters.program === 'Fattening' && filters.programSub) {
      const memberIds = new Set(getActiveBatchMemberships(filters.programSub).map((m) => m.livestockId));
      if (!participants.some((lv) => memberIds.has(lv.id))) return false;
    }
    return true;
  });

  function handleSaved(_saved: ReproduksiProgramRecord) {
    setFormSheet(null);
    setTick((t) => t + 1);
  }

  function handleCancel(program: ReproduksiProgramRecord) {
    if (!window.confirm(`Batalkan program "${program.namaProgram}"? Program tidak dapat dijalankan lagi setelah dibatalkan.`)) return;
    try {
      cancelProgram(program.id);
      setTick((t) => t + 1);
      // ── Supabase dual-write (fire-and-forget) ────────────────────────────
      const cancelled = getProgramById(program.id);
      if (cancelled && activeWorkspace?.workspace_uuid) {
        void updateProgramStatusInDb(cancelled)
          .catch((err) => console.error('[Reproduksi] updateProgramStatusInDb (cancel) failed:', err));
      }
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Gagal membatalkan program.');
    }
  }

  function handleMonitoringSaved() {
    setMonitoringFormCtx(null);
    setTick((t) => t + 1);
  }

  return (
    <>

      {/* ── AI Insight (RP-011) ──────────────────────────────────────────── */}
      <AiInsightCard tick={tick} />

      {/* ── Ringkasan (dummy data) ───────────────────────────────────────── */}
      <RingkasanCards />

      {/* ── Mode ──────────────────────────────────────────────────────────── */}
      <section>
        <SectionLabel title="Mode" />
        <SegmentedControl value={mode} onChange={setMode} />
      </section>

      {/* ── Search & Filter ──────────────────────────────────────────────── */}
      <section>
        <SearchFilterBar
          query={query}
          onSearch={setQuery}
          onFilter={() => setFilterOpen(true)}
          activeFilterCount={activeFilterCount}
          mode={mode}
        />
        <FilterChips filters={filters} mode={mode} onRemove={handleRemoveChip} />
        {(activeFilterCount > 0 || !!query) && (
          <button type="button" onClick={() => { setFilters(DEFAULT_FILTERS); setQuery(''); }}
            style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, color: 'var(--color-muted)', padding: 0 }}>
            ↺ Reset semua
          </button>
        )}
      </section>

      {/* ── Filter Sheet ─────────────────────────────────────────────────── */}
      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        mode={mode}
        filters={filters}
        onChangeFilters={setFilters}
        onReset={() => { setFilters(DEFAULT_FILTERS); setQuery(''); }}
        individuList={ALL_INDIVIDU}
        batchList={ALL_BATCH}
      />

      {/* ── Program Reproduksi ────────────────────────────────────────────── */}
      <ProgramReproduksiSection
        programs={displayedPrograms}
        onAdd={() => setFormSheet({ kind: 'create' })}
        onDetail={(p) => setDetailProgram(p)}
        onEdit={(p) => setFormSheet({ kind: 'edit', program: p })}
        onCancel={handleCancel}
      />

      {/* ── Monitoring Program Reproduksi ────────────────────────────────── */}
      <GlobalMonitoringSection
        programs={programs}
        filters={monitoringFilters}
        onFiltersChange={setMonitoringFilters}
        onAdd={() => setMonitoringFormCtx({ kind: 'create-global', programs })}
        onDetail={(m, program) => setMonitoringDetail({ monitoring: m, program })}
      />

      {/* ── Riwayat Reproduksi ────────────────────────────────────────────── */}
      <RiwayatReproduksiSection
        filters={riwayatFilters}
        onFiltersChange={setRiwayatFilters}
        programs={programs}
        allLivestock={allLivestock}
        onDetail={(entry) => setRiwayatDetail(entry)}
      />

      {/* ── Program Form Sheet (Tambah / Edit) ────────────────────────────── */}
      {formSheet && (
        <ProgramFormSheet
          mode={formSheet.kind}
          programId={formSheet.kind === 'edit' ? formSheet.program.id : undefined}
          initial={formSheet.kind === 'create'
            ? emptyFormState()
            : formStateFromProgram(formSheet.program)}
          allLivestock={allLivestock}
          onClose={() => setFormSheet(null)}
          onSaved={handleSaved}
        />
      )}

      {/* ── Program Detail Sheet ──────────────────────────────────────────── */}
      {detailProgram && (
        <ProgramDetailSheet
          program={detailProgram}
          allLivestock={allLivestock}
          onClose={() => setDetailProgram(null)}
        />
      )}

      {/* ── Monitoring Form Sheet (global "+ Monitoring Baru") ──────────── */}
      {monitoringFormCtx && (
        <MonitoringFormSheet
          ctx={monitoringFormCtx}
          onClose={() => setMonitoringFormCtx(null)}
          onSaved={handleMonitoringSaved}
        />
      )}

      {/* ── Monitoring Detail Sheet (global timeline) ────────────────────── */}
      {monitoringDetail && (
        <MonitoringDetailSheet
          monitoring={monitoringDetail.monitoring}
          program={monitoringDetail.program}
          onClose={() => setMonitoringDetail(null)}
        />
      )}

      {/* ── Riwayat Reproduksi Detail Sheet (RP-010) ─────────────────────── */}
      {riwayatDetail && (
        <RiwayatDetailSheet
          entry={riwayatDetail}
          onClose={() => setRiwayatDetail(null)}
        />
      )}
    </>
  );
}
