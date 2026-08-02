import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLivestock } from '../hooks/useLivestock';
import { useStokInventaris } from '../hooks/useStokInventaris';
import { LIVESTOCK_DB } from '../data/livestockData';
import { getLivestockStatus, getOutsideEntry } from '../data/transferData';
import { BATCH_DB, getActiveBatchMembersWithLivestock, type BatchStatus } from '../data/batchData';
import { getInventarisList, type InventarisItem } from '../data/stokInventarisData';
import {
  Filters, DEFAULT_FILTERS, countActiveFilters,
  FilterSheet, FilterChips, SearchFilterBar, SegmentedControl,
} from '../components/LivestockFilterSheet';
import {
  addPemberianPakan, getPemberianPakanList, getPemberianPakanById,
  selesaikanPemberianPakan,
  type PemberianPakanStatus, type PemberianPakanRecord, type PemberianPakanItem,
} from '../data/pemberianPakanData';
import { useWorkspace }      from '../contexts/WorkspaceContext';
import { recordFeedSession } from '../services/pemberianPakanService';
import { getInventarisById } from '../data/stokInventarisData';
import { recordPemberianPakanTransaction } from '../services/stokInventarisService';
import {
  markJadwalDilaksanakan, getJadwalBerikutnya,
  getJadwalList, getJadwalHariIni, getEffectiveStatus,
} from '../data/jadwalPemberianPakanData';
import {
  generatePakanInsights,
  type InsightLevel,
  type InsightCategory,
  type InsightItem,
  type PrediksiStokItem,
  type NutrisiEstimate,
  type KondisiPakan,
  type PakanInsightReport,
} from '../data/aiInsightPakanData';
import { useSubscription } from '../contexts/SubscriptionContext';
import { getTodayISO as todayIso } from '../utils/dateUtils';

// ─── LP-004 integration: payload used to prefill BeriPakanSheet from a Jadwal ──
// Navigated in via `navigate('/pemberian-pakan', { state: { prefillFromJadwal } })`
// from the Jadwal Pemberian Pakan page. Jadwal itself never touches stock or
// Riwayat — this only pre-fills the existing LP-002 form for the user to review.
export type PrefillFromJadwal = {
  jadwalId: string;
  targetKind: 'individu' | 'batch';
  targetId: string;
  items: { inventarisId: string; jumlah: string }[];
  jam: string;
  catatan?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isExpired(kadaluarsa?: string): boolean {
  if (!kadaluarsa) return false;
  return kadaluarsa < todayIso();
}

function formatIsoDate(iso?: string): string {
  if (!iso) return '—';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// ─── Data Builders (live registry reads — never memoized) ────────────────────

export type IndividuRow = {
  id: string;
  name: string | null;
  type: string;
  icon: string;
  typeBg: string;
  program: string;
  gender: string;
  batchId: string | null;
  blok: string;
  kandang: string;
  lokasiLuar: string;
  locationStatus: 'Aktif' | 'Luar Kandang';
};

type BatchMemberFilterInfo = {
  blok: string;
  kandang: string;
  lokasiLuar: string;
  locationStatus: 'Aktif' | 'Luar Kandang';
};

export type BatchRow = {
  id: string;
  name: string | null;
  type: string;
  icon: string;
  typeBg: string;
  program: string;
  status: BatchStatus;
  total: number;
  members: BatchMemberFilterInfo[];
};

function extractBlok(location: string): string {
  const parts = location.split(', ');
  return parts.find((p) => /blok/i.test(p)) ?? '';
}

function extractKandang(location: string): string {
  const parts = location.split(', ');
  return parts.find((p) => /kandang/i.test(p)) ?? parts[0] ?? '';
}

export function buildIndividuList(): IndividuRow[] {
  return Object.values(LIVESTOCK_DB)
    .filter((lv) => getLivestockStatus(lv.id) !== 'Arsip')
    .map((lv) => {
      const statusRaw = getLivestockStatus(lv.id);
      const isLuar = statusRaw === 'Luar Kandang';
      const outsideEntry = isLuar ? getOutsideEntry(lv.id) : undefined;
      return {
        id: lv.id,
        name: lv.name,
        type: lv.type,
        icon: lv.typeIcon,
        typeBg: lv.typeBg,
        program: lv.program,
        gender: lv.kelamin,
        batchId: lv.batch?.id ?? null,
        blok: isLuar ? '' : extractBlok(lv.location),
        kandang: isLuar ? '' : extractKandang(lv.location),
        lokasiLuar: outsideEntry?.reason ?? '',
        locationStatus: isLuar ? 'Luar Kandang' : 'Aktif',
      };
    });
}

export function buildBatchList(): BatchRow[] {
  return Object.values(BATCH_DB).map((b) => {
    const members = getActiveBatchMembersWithLivestock(b.id);
    const memberFilterInfo: BatchMemberFilterInfo[] = members.map(({ lv }) => {
      const statusRaw = getLivestockStatus(lv.id);
      const isLuar = statusRaw === 'Luar Kandang';
      const outsideEntry = isLuar ? getOutsideEntry(lv.id) : undefined;
      return {
        blok: isLuar ? '' : extractBlok(lv.location),
        kandang: isLuar ? '' : extractKandang(lv.location),
        lokasiLuar: outsideEntry?.reason ?? '',
        locationStatus: isLuar ? 'Luar Kandang' : 'Aktif',
      };
    });
    return {
      id: b.id,
      name: b.name,
      type: b.livestockType,
      icon: b.livestockIcon,
      typeBg: b.livestockTypeBg,
      program: b.label,
      status: b.status,
      total: members.length,
      members: memberFilterInfo,
    };
  });
}

// ─── Filter types ─────────────────────────────────────────────────────────────

export type Mode = 'individu' | 'batch';

// ─── Badge configs ────────────────────────────────────────────────────────────

const PROGRAM_CONFIG: Record<string, { bg: string; color: string }> = {
  Fattening:   { bg: '#e3f2fd', color: '#0277bd' },
  Breeding:    { bg: '#fce4ec', color: '#c2185b' },
  Kontes:      { bg: '#fff8e1', color: '#f57f17' },
  Karantina:   { bg: '#ffebee', color: '#c62828' },
  Replacement: { bg: '#f3e5f5', color: '#6a1b9a' },
  Lainnya:     { bg: '#eceff1', color: '#546e7a' },
};

const LOCATION_STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  'Aktif':        { bg: '#e8f5e9', color: '#2e7d32' },
  'Luar Kandang': { bg: '#fff8e1', color: '#f57f17' },
};

// ─── Shared Bits ──────────────────────────────────────────────────────────────

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

function ProgramBadge({ program }: { program: string }) {
  const cfg = PROGRAM_CONFIG[program] ?? PROGRAM_CONFIG['Lainnya'];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: '2px 8px' }}>
      {program}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = LOCATION_STATUS_CONFIG[status] ?? LOCATION_STATUS_CONFIG['Aktif'];
  return (
    <span style={{ fontSize: 11, fontWeight: 700, flexShrink: 0, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: '3px 9px' }}>
      {status}
    </span>
  );
}

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{label}</div>
      {hint && <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>{hint}</div>}
    </div>
  );
}

// ─── AI Insight Card — LP-006 ─────────────────────────────────────────────────

const PAKAN_LEVEL_CFG: Record<InsightLevel, { border: string; bg: string; color: string; badge: string }> = {
  critical: { border: '#c62828', bg: '#fff5f5', color: '#c62828', badge: '🔴 Kritis' },
  warning:  { border: '#e65100', bg: '#fff8f0', color: '#e65100', badge: '🟠 Peringatan' },
  info:     { border: '#1565c0', bg: '#f0f4ff', color: '#1565c0', badge: '🔵 Info' },
};

const KONDISI_PAKAN_CFG: Record<KondisiPakan, { bg: string; color: string; border: string; icon: string }> = {
  'Normal':           { bg: '#e8f5e9', color: '#2e7d32', border: '#4caf50', icon: '✅' },
  'Meningkat':        { bg: '#e3f2fd', color: '#1565c0', border: '#42a5f5', icon: '📈' },
  'Menurun':          { bg: '#ffebee', color: '#c62828', border: '#ef5350', icon: '📉' },
  'Tidak Konsisten':  { bg: '#fff8e1', color: '#e65100', border: '#ffb300', icon: '⚠️' },
  'Belum Cukup Data': { bg: '#f5f5f5', color: '#757575', border: '#bdbdbd', icon: '📋' },
};

const PAKAN_CAT_LABELS: Record<InsightCategory, string> = {
  ringkasan:    '📊 Ringkasan',
  perkembangan: '🔁 Analisis',
  rekomendasi:  '💡 Rekomendasi',
  peringatan:   '⚠️ Peringatan',
  prediksi:     '📦 Prediksi',
};

function PakanInsightItemRow({ item }: { item: InsightItem }) {
  const cfg = PAKAN_LEVEL_CFG[item.level];
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

function PrediksiStokRow({ item }: { item: PrediksiStokItem }) {
  const { estHabis, avgDailyUsage } = item;
  let statusLabel: string;
  let statusColor: string;
  if (avgDailyUsage === 0 || estHabis === null) {
    statusLabel = 'Tidak digunakan'; statusColor = 'var(--color-muted)';
  } else if (estHabis <= 0) {
    statusLabel = 'Habis';           statusColor = '#c62828';
  } else if (estHabis < 3) {
    statusLabel = `≈${estHabis}h`;   statusColor = '#c62828';
  } else if (estHabis < 7) {
    statusLabel = `≈${estHabis}h`;   statusColor = '#e65100';
  } else if (estHabis < 30) {
    statusLabel = `≈${estHabis}h`;   statusColor = '#2e7d32';
  } else {
    statusLabel = '>30 hari';        statusColor = '#2e7d32';
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--color-border)', gap: 8 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nama}</div>
        <div style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>
          {item.currentStock} {item.satuan} tersisa
          {avgDailyUsage > 0 ? ` · ${avgDailyUsage % 1 === 0 ? avgDailyUsage : avgDailyUsage.toFixed(1)} Kg/hari` : ''}
        </div>
      </div>
      <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: statusColor }}>{statusLabel}</span>
    </div>
  );
}

function NutrisiSection({ n }: { n: NutrisiEstimate }) {
  const rows = [
    { label: 'Bahan Kering (BK)', value: n.avgDailyBK,  unit: 'Kg DM/hari' },
    { label: 'Protein Kasar (PK)', value: n.avgDailyPK,  unit: 'Kg/hari' },
    { label: 'TDN',                value: n.avgDailyTDN, unit: 'Kg/hari' },
  ];
  const coveragePct = Math.round(n.coverageRatio * 100);
  return (
    <div style={{ padding: '10px 14px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
        🧪 Estimasi Nutrisi Harian (7 hari, DM basis)
      </div>
      <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
        {rows.map(({ label, value, unit }, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderBottom: i < rows.length - 1 ? '1px solid var(--color-border)' : undefined }}>
            <span style={{ fontSize: 11.5, color: 'var(--color-text)' }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>
              {value % 1 === 0 ? value : value.toFixed(2)} <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-muted)' }}>{unit}</span>
            </span>
          </div>
        ))}
      </div>
      {coveragePct < 100 && (
        <div style={{ marginTop: 6, fontSize: 10, color: 'var(--color-muted)' }}>
          ℹ️ Berdasarkan {coveragePct}% item yang memiliki data nutrisi referensi. Estimasi parsial.
        </div>
      )}
    </div>
  );
}

function ProPakanContent({ report }: { report: PakanInsightReport }) {
  const [selectedCat, setSelectedCat] = useState<InsightCategory | 'all'>('all');
  const kondisiCfg = KONDISI_PAKAN_CFG[report.kondisi];

  const categories = useMemo((): InsightCategory[] => {
    const seen = new Set<InsightCategory>();
    report.items.forEach((i) => seen.add(i.category));
    return Array.from(seen);
  }, [report.items]);

  const filteredItems = useMemo(
    () => selectedCat === 'all' ? report.items : report.items.filter((i) => i.category === selectedCat),
    [report.items, selectedCat],
  );

  const analyzedAt = useMemo(() => {
    const d = new Date(report.analyzedAt);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
      ' · ' + d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }, [report.analyzedAt]);

  // Prediksi stok: only show items with usage or non-normal stock
  const relevantStok = useMemo(
    () => report.prediksiStok.filter((s) => s.avgDailyUsage > 0 || s.currentStock === 0),
    [report.prediksiStok],
  );

  return (
    <div>
      {/* Kondisi Banner */}
      <div style={{ margin: '12px 14px 0', padding: '10px 12px', background: kondisiCfg.bg, border: `1.5px solid ${kondisiCfg.border}`, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>{kondisiCfg.icon}</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: kondisiCfg.color }}>Kondisi: {report.kondisi}</div>
          <div style={{ fontSize: 11, color: kondisiCfg.color, opacity: 0.85, lineHeight: 1.4 }}>{report.kondisiSummary}</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, margin: '10px 14px 0', background: 'var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
        {[
          { label: 'Total Sesi',  value: report.totalSesi,    color: 'var(--color-text)' },
          { label: 'Selesai',     value: report.totalSelesai, color: '#2e7d32' },
          { label: 'Hari Ini',    value: report.sesiHariIni,  color: '#0277bd' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'var(--color-bg)', padding: '8px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600 }}>{label}</div>
          </div>
        ))}
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
                {PAKAN_CAT_LABELS[cat]} ({count})
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
          filteredItems.map((item) => <PakanInsightItemRow key={item.id} item={item} />)
        )}
      </div>

      {/* Nutrisi estimate */}
      {report.nutrisiEstimate && (selectedCat === 'all' || selectedCat === 'perkembangan') && (
        <NutrisiSection n={report.nutrisiEstimate} />
      )}

      {/* Prediksi stok */}
      {relevantStok.length > 0 && (selectedCat === 'all' || selectedCat === 'prediksi') && (
        <div style={{ padding: '10px 14px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
            📦 Prediksi Stok Pakan
          </div>
          {relevantStok.map((s) => <PrediksiStokRow key={s.inventarisId} item={s} />)}
        </div>
      )}

      {/* Timestamp */}
      <div style={{ padding: '10px 14px 12px', borderTop: '1px solid var(--color-border)', marginTop: 10, fontSize: 10, color: 'var(--color-muted)', textAlign: 'right' }}>
        🤖 Dianalisis {analyzedAt}
      </div>
    </div>
  );
}

function AiInsightCard({ tick }: { tick: number }) {
  const report     = useMemo(() => generatePakanInsights(), [tick]);
  const kondisiCfg = KONDISI_PAKAN_CFG[report.kondisi];

  return (
    <section>
      <div style={{ marginBottom: 10 }}>
        <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', margin: 0 }}>🤖 AI Insight</h2>
      </div>

      <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        {/* Card header */}
        <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🌾</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Analisis Pakan</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, background: kondisiCfg.bg, color: kondisiCfg.color, border: `1px solid ${kondisiCfg.border}`, borderRadius: 20, padding: '2px 8px' }}>
            {kondisiCfg.icon} {report.kondisi}
          </span>
        </div>

        {/* Full content — always visible; no Pro/Free gate */}
        <ProPakanContent report={report} />
      </div>
    </section>
  );
}

// ─── Ringkasan Cards ──────────────────────────────────────────────────────────

const RINGKASAN_CONFIG = [
  { key: 'pemberianHariIni', label: 'Pemberian Hari Ini',     icon: '🌿', color: '#1a7a4a', bg: '#e8f5e9' },
  { key: 'totalKonsumsi',    label: 'Total Konsumsi Hari Ini', icon: '⚖️', color: '#0277bd', bg: '#e3f2fd' },
  { key: 'jadwalBerikutnya', label: 'Jadwal Berikutnya',       icon: '⏰', color: '#f57f17', bg: '#fff8e1' },
  { key: 'riwayatTerakhir',  label: 'Riwayat Terakhir',       icon: '📋', color: '#546e7a', bg: '#eceff1' },
] as const;

type RingkasanKey = typeof RINGKASAN_CONFIG[number]['key'];

function computeRingkasan(): Record<RingkasanKey, string> {
  const records = getPemberianPakanList();
  const today = todayIso();
  const todayRecords = records.filter((r) => r.tanggal === today);
  const lastRecord = records[0];
  const nextJadwal = getJadwalBerikutnya(today);

  // Sum kg from completed records today (uses the same toKgLocal already defined below)
  let kgHariIni = 0;
  for (const r of records) {
    if (r.tanggal !== today || r.status !== 'Pemberian Pakan Selesai') continue;
    for (const item of r.items) kgHariIni += toKgLocal(item.jumlah, item.satuan);
  }
  const totalKonsumsiLabel = kgHariIni > 0 ? `${kgHariIni % 1 === 0 ? kgHariIni : kgHariIni.toFixed(1)} Kg` : '—';

  return {
    pemberianHariIni: todayRecords.length > 0 ? `${todayRecords.length}x` : '—',
    totalKonsumsi:    totalKonsumsiLabel,
    jadwalBerikutnya: nextJadwal
      ? (nextJadwal.tanggal === today ? `Hari ini ${nextJadwal.record.jam}` : `${formatIsoDate(nextJadwal.tanggal)} ${nextJadwal.record.jam}`)
      : '—', // LP-004: diisi dari jadwalPemberianPakanData.ts
    riwayatTerakhir:  lastRecord ? lastRecord.waktuPemberian : '—',
  };
}

function RingkasanCards() {
  const ringkasan = computeRingkasan();
  return (
    <section>
      <SectionLabel title="Ringkasan" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {RINGKASAN_CONFIG.map(({ key, label, icon, color, bg }) => (
          <div key={key} style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '14px 14px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.3 }}>{label}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color, background: bg, borderRadius: 'var(--radius-sm)', padding: '4px 10px', display: 'inline-block', minWidth: 40, textAlign: 'center' }}>
              {ringkasan[key]}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── LP-007: Dashboard Pakan ──────────────────────────────────────────────────

/** Local kg converter (mirrors aiInsightPakanData without importing) */
function toKgLocal(jumlah: number, satuan: string): number {
  switch (satuan.toLowerCase().trim()) {
    case 'kg':      return jumlah;
    case 'g':
    case 'gram':    return jumlah / 1000;
    case 'ton':     return jumlah * 1_000;
    case 'kwintal':
    case 'kw':      return jumlah * 100;
    default:        return 0;
  }
}

function fmt1Local(n: number): string {
  return Number.isFinite(n) ? (n % 1 === 0 ? String(n) : n.toFixed(1)) : '—';
}

// ─── Dashboard Ringkasan (6 cards) ────────────────────────────────────────────

const RINGKASAN_DASHBOARD_CONFIG = [
  { key: 'pemberianHariIni',  label: 'Pemberian Hari Ini',       icon: '🌿', color: '#1a7a4a', bg: '#e8f5e9' },
  { key: 'konsumsiHariIni',   label: 'Total Konsumsi Hari Ini',  icon: '⚖️', color: '#0277bd', bg: '#e3f2fd' },
  { key: 'jadwalHariIni',     label: 'Jadwal Hari Ini',          icon: '📅', color: '#6a1b9a', bg: '#f3e5f5' },
  { key: 'jadwalTerlewat',    label: 'Jadwal Terlewat',          icon: '⏰', color: '#c62828', bg: '#ffebee' },
  { key: 'konsumsBulanIni',   label: 'Total Konsumsi Bulan Ini', icon: '📊', color: '#e65100', bg: '#fff3e0' },
  { key: 'estimasiStokHabis', label: 'Estimasi Stok Habis',      icon: '📦', color: '#546e7a', bg: '#eceff1' },
] as const;

type RingkasanDashboardKey = typeof RINGKASAN_DASHBOARD_CONFIG[number]['key'];

function computeRingkasanDashboard(report: PakanInsightReport): Record<RingkasanDashboardKey, string> {
  const today        = todayIso();
  const currentMonth = today.slice(0, 7);
  const records      = getPemberianPakanList();
  const todayRecs    = records.filter((r) => r.tanggal === today);

  let kgHariIni = 0;
  for (const r of todayRecs.filter((r) => r.status === 'Pemberian Pakan Selesai')) {
    for (const item of r.items) kgHariIni += toKgLocal(item.jumlah, item.satuan);
  }

  let kgBulanIni = 0;
  for (const r of records.filter((r) => r.status === 'Pemberian Pakan Selesai' && r.tanggal.startsWith(currentMonth))) {
    for (const item of r.items) kgBulanIni += toKgLocal(item.jumlah, item.satuan);
  }

  const jadwalHariIniCount = getJadwalHariIni(today).length;
  const terlewatCount      = getJadwalList().filter((j) => getEffectiveStatus(j, today) === 'Terlewat').length;

  const activeStok = report.prediksiStok.filter((s) => s.avgDailyUsage > 0 && s.estHabis !== null);
  const nearest    = activeStok.reduce<number | null>(
    (min, s) => (s.estHabis === null ? min : min === null ? s.estHabis : Math.min(min, s.estHabis)),
    null,
  );

  return {
    pemberianHariIni:  todayRecs.length > 0 ? `${todayRecs.length}×` : '—',
    konsumsiHariIni:   kgHariIni  > 0 ? `${fmt1Local(kgHariIni)} Kg`  : '—',
    jadwalHariIni:     jadwalHariIniCount > 0 ? String(jadwalHariIniCount) : '—',
    jadwalTerlewat:    String(terlewatCount),
    konsumsBulanIni:   kgBulanIni > 0 ? `${fmt1Local(kgBulanIni)} Kg` : '—',
    estimasiStokHabis: nearest !== null ? `${nearest} hari` : '—',
  };
}

function DashboardRingkasanSection({ report }: { report: PakanInsightReport }) {
  const ringkasan = computeRingkasanDashboard(report);
  return (
    <section>
      <SectionLabel title="Ringkasan" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {RINGKASAN_DASHBOARD_CONFIG.map(({ key, label, icon, color, bg }) => (
          <div key={key} style={{
            background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '14px 14px 12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.3 }}>{label}</span>
            </div>
            <div style={{
              fontSize: 20, fontWeight: 800, color, background: bg,
              borderRadius: 'var(--radius-sm)', padding: '4px 10px',
              display: 'inline-block', minWidth: 40, textAlign: 'center',
            }}>
              {ringkasan[key]}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Dashboard AI Insight (top 3 priority) ────────────────────────────────────

function DashboardAiInsightSection({
  report,
}: {
  report: PakanInsightReport;
}) {
  const { hasFeature } = useSubscription();
  const isPro          = hasFeature('ai_unlimited');
  const kondisiCfg     = KONDISI_PAKAN_CFG[report.kondisi];
  const top3           = report.items.slice(0, 3);

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', margin: 0 }}>🤖 AI Insight</h2>
        {isPro && (
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', background: 'var(--color-primary-light)', borderRadius: 20, padding: '3px 10px', letterSpacing: 0.3 }}>
            Pro ✓
          </span>
        )}
      </div>
      <div style={{
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🌾</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Analisis Pakan</span>
          <span style={{
            marginLeft: 'auto', fontSize: 10, fontWeight: 700,
            background: kondisiCfg.bg, color: kondisiCfg.color,
            border: `1px solid ${kondisiCfg.border}`, borderRadius: 20, padding: '2px 8px',
          }}>
            {kondisiCfg.icon} {report.kondisi}
          </span>
        </div>
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {top3.length === 0 ? (
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '12px 0' }}>
              Belum cukup data untuk dianalisis.
            </p>
          ) : (
            top3.map((item) => <PakanInsightItemRow key={item.id} item={item} />)
          )}
        </div>
        {report.items.length > 3 && (
          <div style={{ padding: '0 14px 10px', fontSize: 10, color: 'var(--color-muted)', textAlign: 'center' }}>
            +{report.items.length - 3} insight lainnya tersedia dalam mode penuh.
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Jadwal Dashboard Section ─────────────────────────────────────────────────

function JadwalDashboardSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const today    = todayIso();
  const hariIni  = getJadwalHariIni(today).sort((a, b) => a.jam.localeCompare(b.jam));
  const berikut  = getJadwalBerikutnya(today);
  const nextOther = berikut && berikut.tanggal > today ? berikut : null;

  const allSlots = [
    ...hariIni.map((r) => ({ record: r, tanggal: today, isToday: true })),
    ...(nextOther ? [{ record: nextOther.record, tanggal: nextOther.tanggal, isToday: false }] : []),
  ];

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', margin: 0 }}>📅 Jadwal</h2>
        <button
          type="button"
          onClick={() => navigate('/jadwal-pemberian-pakan')}
          style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Lihat Semua →
        </button>
      </div>

      {allSlots.length === 0 ? (
        <div style={{
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
          padding: '20px', textAlign: 'center', color: 'var(--color-muted)', fontSize: 12,
        }}>
          Tidak ada jadwal hari ini atau jadwal berikutnya.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {allSlots.map(({ record, tanggal, isToday }, idx) => (
            <div key={`${record.id}-${idx}`} style={{
              background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
              padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                background: isToday ? 'var(--color-primary-light)' : '#f5f5f5',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
              }}>
                {record.targetIcon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {record.targetName ?? record.targetId}
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>
                  {isToday ? 'Hari ini' : formatIsoDate(tanggal)} · {record.jam} · {record.jenis}
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>
                  {record.items.length} item pakan
                </div>
              </div>
              <span style={{
                flexShrink: 0, fontSize: 9, fontWeight: 700,
                background: isToday ? 'var(--color-primary-light)' : '#f5f5f5',
                color: isToday ? 'var(--color-primary)' : '#757575',
                borderRadius: 20, padding: '2px 8px',
              }}>
                {isToday ? 'Hari Ini' : 'Berikutnya'}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Riwayat Terakhir Section ─────────────────────────────────────────────────

const STATUS_PAKAN_BADGE: Record<PemberianPakanStatus, { color: string; bg: string; label: string }> = {
  'Draft':                   { color: '#757575', bg: '#f5f5f5', label: 'Draft' },
  'Siap Diproses':           { color: '#e65100', bg: '#fff8e1', label: 'Siap Diproses' },
  'Pemberian Pakan Selesai': { color: '#2e7d32', bg: '#e8f5e9', label: 'Selesai' },
};

function RiwayatTerakhirSection({
  navigate,
}: {
  navigate: ReturnType<typeof useNavigate>;
}) {
  const last5 = getPemberianPakanList().slice(0, 5);

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', margin: 0 }}>📋 Riwayat Terakhir</h2>
        <button
          type="button"
          onClick={() => navigate('/riwayat-pemberian-pakan')}
          style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Lihat Semua →
        </button>
      </div>

      {last5.length === 0 ? (
        <div style={{
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
          padding: '28px 20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🌿</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Belum ada riwayat pemberian pakan.</div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.5 }}>Riwayat akan muncul setelah pencatatan pertama dilakukan.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {last5.map((record) => {
            const badge = STATUS_PAKAN_BADGE[record.status];
            return (
              <button
                key={record.id}
                type="button"
                onClick={() => navigate(`/riwayat-pemberian-pakan/${record.id}`)}
                style={{
                  width: '100%', textAlign: 'left', cursor: 'pointer',
                  background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
                  padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                }}>
                  {record.targetIcon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {record.targetName ?? record.targetId}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>
                    {formatIsoDate(record.tanggal)} · {record.waktuPemberian} · {record.items.length} item
                  </div>
                </div>
                <span style={{
                  flexShrink: 0, fontSize: 9, fontWeight: 700,
                  background: badge.bg, color: badge.color,
                  borderRadius: 20, padding: '2px 8px',
                }}>
                  {badge.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Konsumsi Nutrisi Section ─────────────────────────────────────────────────

function KonsumsiSection({ report }: { report: PakanInsightReport }) {
  const n = report.nutrisiEstimate;

  const rows: { label: string; value: string; unit: string }[] = n ? [
    { label: '🌾 Total BK',        value: fmt1Local(n.avgDailyBK  * 7), unit: 'Kg (7 hari)' },
    { label: '🥩 Total PK',        value: fmt1Local(n.avgDailyPK  * 7), unit: 'Kg (7 hari)' },
    { label: '⚡ Total TDN',       value: fmt1Local(n.avgDailyTDN * 7), unit: 'Kg (7 hari)' },
    { label: '🔋 Estimasi Energi', value: fmt1Local(n.avgDailyTDN * 7 * 3.6), unit: 'Mcal (est.)' },
  ] : [];

  return (
    <section>
      <SectionLabel title="Konsumsi Nutrisi" />
      <div style={{
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
      }}>
        {rows.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', fontSize: 12, color: 'var(--color-muted)' }}>
            Data nutrisi tersedia setelah pemberian pakan selesai dicatat dengan referensi Master Pakan.
          </div>
        ) : (
          rows.map(({ label, value, unit }, i) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '11px 14px',
              borderBottom: i < rows.length - 1 ? '1px solid var(--color-border)' : undefined,
            }}>
              <span style={{ fontSize: 12, color: 'var(--color-text)' }}>{label}</span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-primary)' }}>{value}</span>
                <span style={{ fontSize: 10, color: 'var(--color-muted)', marginLeft: 4 }}>{unit}</span>
              </div>
            </div>
          ))
        )}
        {n && n.coverageRatio < 1 && (
          <div style={{ padding: '8px 14px', borderTop: '1px solid var(--color-border)', fontSize: 10, color: 'var(--color-muted)' }}>
            ℹ️ Estimasi berdasarkan {Math.round(n.coverageRatio * 100)}% item yang memiliki data nutrisi referensi.
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Statistik Section ────────────────────────────────────────────────────────

function BarRowPakan({ label, value, max, color, unit = '' }: {
  label: string; value: number; max: number; color: string; unit?: string;
}) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text)' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{fmt1Local(value)}{unit}</span>
      </div>
      <div style={{ height: 6, background: 'var(--color-bg)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4 }} />
      </div>
    </div>
  );
}

function computeStatistikPakan() {
  const today    = todayIso();
  const records  = getPemberianPakanList();
  const selesai  = records.filter((r) => r.status === 'Pemberian Pakan Selesai');
  const HARI     = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  const BULAN    = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

  // Konsumsi harian: last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().slice(0, 10);
    let kg = 0;
    for (const r of selesai.filter((r) => r.tanggal === iso)) {
      for (const item of r.items) kg += toKgLocal(item.jumlah, item.satuan);
    }
    return { label: HARI[d.getDay()], kg };
  });

  // Konsumsi mingguan: last 4 weeks
  const last4Weeks = Array.from({ length: 4 }, (_, w) => {
    const endD   = new Date();
    endD.setDate(endD.getDate() - w * 7);
    const startD = new Date(endD);
    startD.setDate(startD.getDate() - 6);
    const startIso = startD.toISOString().slice(0, 10);
    const endIso   = endD.toISOString().slice(0, 10);
    let kg = 0;
    for (const r of selesai.filter((r) => r.tanggal >= startIso && r.tanggal <= endIso)) {
      for (const item of r.items) kg += toKgLocal(item.jumlah, item.satuan);
    }
    return { label: `M${4 - w}`, kg };
  }).reverse();

  // Konsumsi bulanan: last 6 months
  const last6Months = Array.from({ length: 6 }, (_, m) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - m));
    const ym = d.toISOString().slice(0, 7);
    let kg = 0;
    for (const r of selesai.filter((r) => r.tanggal.startsWith(ym))) {
      for (const item of r.items) kg += toKgLocal(item.jumlah, item.satuan);
    }
    return { label: BULAN[d.getMonth()], kg };
  });

  // Frekuensi pemberian (semua records, last 7 days)
  const startLast7 = new Date();
  startLast7.setDate(startLast7.getDate() - 6);
  const startLast7Iso = startLast7.toISOString().slice(0, 10);
  const last7All = records.filter((r) => r.tanggal >= startLast7Iso && r.tanggal <= today);
  const avgPerDay = last7All.length / 7;

  // Kepatuhan jadwal
  const allJadwal     = getJadwalList();
  const terlewatJ     = allJadwal.filter((j) => getEffectiveStatus(j, today) === 'Terlewat').length;
  const selesaiJ      = allJadwal.filter((j) => j.status === 'Selesai').length;
  const totalJ        = terlewatJ + selesaiJ;
  const kepatuhan     = totalJ > 0 ? Math.round((selesaiJ / totalJ) * 100) : null;

  return { last7Days, last4Weeks, last6Months, avgPerDay, kepatuhan };
}

function StatistikPakanSection() {
  const hasData = getPemberianPakanList().length > 0;
  if (!hasData) {
    return (
      <section>
        <SectionLabel title="Statistik" />
        <div style={{
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
          padding: '22px 20px', textAlign: 'center', color: 'var(--color-muted)', fontSize: 12,
        }}>
          Statistik akan tersedia setelah ada data pemberian pakan.
        </div>
      </section>
    );
  }

  const stat       = computeStatistikPakan();
  const maxDaily   = Math.max(1, ...stat.last7Days.map((d) => d.kg));
  const maxWeekly  = Math.max(1, ...stat.last4Weeks.map((w) => w.kg));
  const maxMonthly = Math.max(1, ...stat.last6Months.map((m) => m.kg));

  const kepatuhanColor = stat.kepatuhan === null
    ? 'var(--color-muted)'
    : stat.kepatuhan >= 80 ? '#2e7d32'
    : stat.kepatuhan >= 50 ? '#e65100'
    : '#c62828';

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionLabel title="Statistik" />

      <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 10, letterSpacing: 0.3 }}>📈 Konsumsi Harian (7 hari, Kg)</div>
        {stat.last7Days.every((d) => d.kg === 0)
          ? <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Belum ada data konsumsi selesai.</div>
          : stat.last7Days.map((d) => <BarRowPakan key={d.label} label={d.label} value={d.kg} max={maxDaily} color="var(--color-primary)" unit=" Kg" />)
        }
      </div>

      <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 10, letterSpacing: 0.3 }}>📊 Konsumsi Mingguan (4 minggu, Kg)</div>
        {stat.last4Weeks.every((w) => w.kg === 0)
          ? <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Belum ada data konsumsi selesai.</div>
          : stat.last4Weeks.map((w) => <BarRowPakan key={w.label} label={w.label} value={w.kg} max={maxWeekly} color="#0277bd" unit=" Kg" />)
        }
      </div>

      <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 10, letterSpacing: 0.3 }}>📅 Konsumsi Bulanan (6 bulan, Kg)</div>
        {stat.last6Months.every((m) => m.kg === 0)
          ? <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Belum ada data konsumsi selesai.</div>
          : stat.last6Months.map((m) => <BarRowPakan key={m.label} label={m.label} value={m.kg} max={maxMonthly} color="#6a1b9a" unit=" Kg" />)
        }
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '12px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 8, letterSpacing: 0.3 }}>🔁 Frekuensi Pemberian</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a7a4a' }}>
            {fmt1Local(stat.avgPerDay)}×
          </div>
          <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 4 }}>rata-rata/hari (7h)</div>
        </div>
        <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '12px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 8, letterSpacing: 0.3 }}>✅ Kepatuhan Jadwal</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: kepatuhanColor }}>
            {stat.kepatuhan !== null ? `${stat.kepatuhan}%` : '—'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 4 }}>dari jadwal dicatat</div>
        </div>
      </div>
    </section>
  );
}

// ─── Quick Action Bar (LP-007) ────────────────────────────────────────────────

function QuickActionBarPakan({
  onPemberianBaru, navigate, onGoToAiInsight,
}: {
  onPemberianBaru: () => void;
  navigate: ReturnType<typeof useNavigate>;
  onGoToAiInsight: () => void;
}) {
  const actions = [
    { label: 'Pemberian Baru', icon: '➕', onClick: onPemberianBaru },
    { label: 'Riwayat',        icon: '📋', onClick: () => navigate('/riwayat-pemberian-pakan') },
    { label: 'Jadwal',         icon: '📅', onClick: () => navigate('/jadwal-pemberian-pakan') },
    { label: 'AI Insight',     icon: '🤖', onClick: onGoToAiInsight },
  ];
  return (
    <section>
      <SectionLabel title="Quick Action" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {actions.map((a) => (
          <button key={a.label} type="button" onClick={a.onClick} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
            padding: '12px 4px',
            background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
          }}>
            <span style={{ fontSize: 18 }}>{a.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text)', textAlign: 'center', lineHeight: 1.25 }}>{a.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

// ─── Dashboard Tab (LP-007) ───────────────────────────────────────────────────

function DashboardPakanTab({
  tick, onGoToPemberian, navigate,
}: {
  tick: number;
  onGoToPemberian: () => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const report       = useMemo(() => generatePakanInsights(), [tick]);
  const aiInsightRef = useRef<HTMLDivElement>(null);

  function handleScrollToInsight() {
    aiInsightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, paddingTop: 20 }}>
      <DashboardRingkasanSection report={report} />
      <div ref={aiInsightRef}>
        <DashboardAiInsightSection report={report} />
      </div>
      <JadwalDashboardSection navigate={navigate} />
      <RiwayatTerakhirSection navigate={navigate} />
      <KonsumsiSection report={report} />
      <StatistikPakanSection />
      <QuickActionBarPakan
        onPemberianBaru={onGoToPemberian}
        navigate={navigate}
        onGoToAiInsight={handleScrollToInsight}
      />
    </div>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'pemberian' | 'riwayat';

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'pemberian', label: 'Pemberian' },
    { key: 'riwayat',  label: 'Riwayat' },
  ];
  return (
    <div style={{ display: 'flex', borderBottom: '2px solid var(--color-border)' }}>
      {tabs.map(({ key, label }) => {
        const isActive = active === key;
        return (
          <button key={key} type="button" onClick={() => onChange(key)} style={{
            flex: 1, padding: '11px 0', background: 'none', border: 'none',
            borderBottom: isActive ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
            marginBottom: -2, fontSize: 13, fontWeight: 700,
            color: isActive ? 'var(--color-primary)' : 'var(--color-muted)',
            cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s',
          }}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Individual / Batch Cards ─────────────────────────────────────────────────

function IndividuCard({ item, onBeriPakan }: { item: IndividuRow; onBeriPakan: () => void }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-sm)', flexShrink: 0, background: item.typeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
        {item.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
              {item.name ?? <span style={{ color: 'var(--color-muted)', fontStyle: 'italic', fontWeight: 400 }}>Tanpa Nama</span>}
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace', letterSpacing: 0.3, marginTop: 1 }}>{item.id}</div>
          </div>
          <StatusBadge status={item.locationStatus} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
          <ProgramBadge program={item.program} />
        </div>
      </div>
      <button type="button" onClick={onBeriPakan} style={{ flexShrink: 0, background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '9px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
        Beri Pakan
      </button>
    </div>
  );
}

function BatchListCard({ item, onBeriPakan }: { item: BatchRow; onBeriPakan: () => void }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', flexShrink: 0, background: item.typeBg || 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
        {item.icon || '📦'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', fontFamily: 'monospace', marginBottom: 5 }}>{item.name ?? item.id}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <ProgramBadge program={item.program} />
          <span style={{ fontSize: 10, color: 'var(--color-border)' }}>·</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{item.total} <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-muted)' }}>ekor</span></span>
        </div>
      </div>
      <button type="button" onClick={onBeriPakan} style={{ flexShrink: 0, background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '9px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
        Beri Pakan
      </button>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ emoji = '🌿', title = 'Tidak Ada Data', message }: { emoji?: string; title?: string; message?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', textAlign: 'center', gap: 12 }}>
      <span style={{ fontSize: 48 }}>{emoji}</span>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>{title}</div>
      {message && <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6, maxWidth: 260 }}>{message}</div>}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastState = { message: string; type: 'success' | 'error' };

function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 3500);
    return () => { if (timerRef.current !== null) clearTimeout(timerRef.current); };
  }, [onDismiss]);
  return (
    <div role="status" aria-live="polite" style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 500, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderRadius: 'var(--radius-sm)', background: toast.type === 'success' ? '#1a7a4a' : '#c0392b', color: '#fff', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,0.22)', maxWidth: 'calc(100vw - 40px)', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
      <span style={{ fontSize: 16 }}>{toast.type === 'success' ? '✓' : '✕'}</span>
      {toast.message}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── BERI PAKAN SHEET — Multi-step (LP-002) ───────────────────────────────────
// Step 1: Pilih Pakan (multi-select stock picker with search)
// Step 2: Isi Detail (jumlah per item + waktu + catatan)
// Step 3: Konfirmasi (review + status + save)
// ═══════════════════════════════════════════════════════════════════════════════

export type SheetTarget =
  | { kind: 'individu'; item: IndividuRow }
  | { kind: 'batch';    item: BatchRow };

type SheetStep = 1 | 2 | 3;

// Item detail state per selected inventory
type ItemDetail = { jumlah: string };  // string so the input is uncontrolled until blur

function getTargetLabel(target: SheetTarget): string {
  if (target.kind === 'individu') return target.item.name ?? target.item.id;
  return target.item.name ?? target.item.id;
}

// ─── Step 1: Stock Picker ──────────────────────────────────────────────────────

function StockRow({
  item, selected, disabled, disabledReason, onToggle,
}: {
  item: InventarisItem; selected: boolean; disabled: boolean;
  disabledReason?: string; onToggle: () => void;
}) {
  const expired = isExpired(item.kadaluarsa);
  const outOfStock = item.status === 'Habis';
  const isDisabled = disabled || expired || outOfStock;

  return (
    <div
      onClick={isDisabled ? undefined : onToggle}
      style={{
        background: selected ? 'var(--color-primary-light)' : 'var(--color-surface)',
        border: selected ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        cursor: isDisabled ? 'default' : 'pointer',
        opacity: isDisabled ? 0.55 : 1,
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}
    >
      {/* Checkbox */}
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        <div style={{
          width: 18, height: 18, borderRadius: 4,
          border: selected ? 'none' : '2px solid var(--color-border)',
          background: selected ? 'var(--color-primary)' : 'var(--color-surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {selected && <span style={{ fontSize: 11, color: '#fff', lineHeight: 1 }}>✓</span>}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Row 1: name + status badges */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>{item.nama}</div>
            {item.brand && <div style={{ fontSize: 10.5, color: 'var(--color-muted)', marginTop: 1 }}>{item.brand}</div>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
            {outOfStock && <span style={{ fontSize: 9, fontWeight: 800, color: '#c62828', background: '#ffebee', borderRadius: 10, padding: '2px 7px' }}>HABIS</span>}
            {expired    && <span style={{ fontSize: 9, fontWeight: 800, color: '#f57f17', background: '#fff8e1', borderRadius: 10, padding: '2px 7px' }}>KADALUARSA</span>}
            {item.status === 'Menipis' && !outOfStock && !expired && <span style={{ fontSize: 9, fontWeight: 800, color: '#e65100', background: '#fff3e0', borderRadius: 10, padding: '2px 7px' }}>MENIPIS</span>}
          </div>
        </div>

        {/* Row 2: meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
          <MetaRow icon="📦" label="Asal" value={item.sumber} />
          <MetaRow icon="⚖️" label="Stok" value={`${item.jumlahStok} ${item.satuan}`} highlight={item.jumlahStok > 0} />
          {item.kategori && <MetaRow icon="🏷️" label="Kategori" value={item.kategori} />}
          {item.lokasiPenyimpanan && <MetaRow icon="📍" label="Lokasi" value={item.lokasiPenyimpanan} />}
          {item.nomorBatch && <MetaRow icon="🔢" label="Batch" value={item.nomorBatch} />}
          {item.tanggalMasuk && <MetaRow icon="📅" label="Masuk" value={formatIsoDate(item.tanggalMasuk)} />}
          {item.kadaluarsa && <MetaRow icon="⏳" label="Expired" value={formatIsoDate(item.kadaluarsa)} warn={expired} />}
        </div>

        {/* Disabled reason */}
        {isDisabled && disabledReason && (
          <div style={{ marginTop: 6, fontSize: 11, color: '#c62828', fontStyle: 'italic' }}>⚠ {disabledReason}</div>
        )}
      </div>
    </div>
  );
}

function MetaRow({ icon, label, value, highlight, warn }: { icon: string; label: string; value: string; highlight?: boolean; warn?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 10 }}>{icon}</span>
      <span style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600 }}>{label}:</span>
      <span style={{ fontSize: 10, fontWeight: 700, color: warn ? '#e65100' : highlight ? 'var(--color-primary)' : 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

// ─── Main Sheet Component ──────────────────────────────────────────────────────

function BeriPakanSheet({
  target, onClose, onSaved,
  initialStep, initialSelectedIds, initialDetails, initialWaktu, initialCatatan, sumberJadwalId,
}: {
  target: SheetTarget;
  onClose: () => void;
  onSaved: (status: PemberianPakanStatus) => void;
  /** LP-004: dipakai saat sheet dibuka dari "Laksanakan Jadwal" — mengisi form otomatis, tetap dapat diubah pengguna. */
  initialStep?: SheetStep;
  initialSelectedIds?: string[];
  initialDetails?: Record<string, ItemDetail>;
  initialWaktu?: string;
  initialCatatan?: string;
  sumberJadwalId?: string;
}) {
  const [step, setStep]               = useState<SheetStep>(initialStep ?? 1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds ?? []));
  const [details, setDetails]         = useState<Record<string, ItemDetail>>(initialDetails ?? {}); // inventarisId → {jumlah}
  const [waktu, setWaktu]             = useState(initialWaktu ?? '');
  const [catatan, setCatatan]         = useState(initialCatatan ?? '');
  const [status, setStatus]           = useState<PemberianPakanStatus>('Siap Diproses');
  const [stockQuery, setStockQuery]   = useState('');
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [saveError, setSaveError]     = useState('');

  // Get live inventory list (non-expired items shown but flagged; habis shown but disabled)
  const allStock = getInventarisList();

  const filteredStock = useMemo(() => {
    const q = stockQuery.toLowerCase().trim();
    if (!q) return allStock;
    return allStock.filter((item) =>
      item.nama.toLowerCase().includes(q) ||
      (item.brand ?? '').toLowerCase().includes(q) ||
      (item.nomorBatch ?? '').toLowerCase().includes(q) ||
      (item.lokasiPenyimpanan ?? '').toLowerCase().includes(q)
    );
  }, [stockQuery, allStock]);

  // Items actually selected (in order of selection)
  const selectedItems = allStock.filter((i) => selectedIds.has(i.id));

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setDetails((d) => { const nd = { ...d }; delete nd[id]; return nd; });
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // ── Step 1 → 2 validation ────────────────────────────────────────────────
  function goToStep2() {
    if (selectedIds.size === 0) return;
    // Initialise detail map for newly selected items
    setDetails((prev) => {
      const next = { ...prev };
      for (const id of selectedIds) {
        if (!next[id]) next[id] = { jumlah: '' };
      }
      return next;
    });
    setErrors({});
    setStep(2);
  }

  // ── Step 2 → 3 validation ────────────────────────────────────────────────
  function goToStep3() {
    const newErrors: Record<string, string> = {};
    for (const item of selectedItems) {
      const raw = details[item.id]?.jumlah ?? '';
      const num = parseFloat(raw);
      if (!raw || isNaN(num) || num <= 0) {
        newErrors[item.id] = 'Jumlah harus lebih dari 0.';
      } else if (num > item.jumlahStok) {
        newErrors[item.id] = `Melebihi stok tersedia (${item.jumlahStok} ${item.satuan}).`;
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setStep(3);
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  function handleSave() {
    setSaveError('');
    try {
      const pakanItems: PemberianPakanItem[] = selectedItems.map((inv) => ({
        inventarisId: inv.id,
        namaPakan: inv.nama,
        brand: inv.brand,
        kategori: inv.kategori,
        sumber: inv.sumber,
        jumlah: parseFloat(details[inv.id]?.jumlah ?? '0'),
        satuan: inv.satuan,
        stokSebelum: inv.jumlahStok,
        nomorBatch: inv.nomorBatch,
        lokasiPenyimpanan: inv.lokasiPenyimpanan,
      }));

      const targetKind = target.kind;
      const targetId   = target.item.id;
      const targetName = target.item.name;
      const targetIcon = target.kind === 'individu' ? target.item.icon : (target.item.icon || '📦');
      const targetTypeBg = target.item.typeBg || 'var(--color-bg)';

      addPemberianPakan({
        targetKind,
        targetId,
        targetName,
        targetIcon,
        targetTypeBg,
        tanggal: todayIso(),
        waktuPemberian: waktu || '—',
        items: pakanItems,
        catatan: catatan || undefined,
        status,
        sumberJadwalId,
      });

      // LP-004: jika sesi ini berasal dari "Laksanakan Jadwal", tandai jadwal
      // (hanya jenis 'Sekali') selesai. Tidak menyentuh stok/riwayat — itu
      // tetap murni tanggung jawab addPemberianPakan di atas.
      if (sumberJadwalId) markJadwalDilaksanakan(sumberJadwalId);

      onClose();
      onSaved(status);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Gagal menyimpan.');
    }
  }

  // ── Sheet frame ───────────────────────────────────────────────────────────
  const stepLabel = step === 1 ? 'Pilih Pakan' : step === 2 ? 'Isi Detail' : 'Konfirmasi';

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 300 }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--color-surface)', borderRadius: '20px 20px 0 0', boxShadow: '0 -4px 24px rgba(0,0,0,0.13)', zIndex: 301, maxHeight: '92vh', display: 'flex', flexDirection: 'column', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>

        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 12px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {step > 1 && (
              <button type="button" onClick={() => setStep((s) => (s - 1) as SheetStep)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--color-muted)', padding: 0, lineHeight: 1 }}>‹</button>
            )}
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>{stepLabel}</div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>
                {getTargetLabel(target)} · Langkah {step}/3
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {step === 1 && selectedIds.size > 0 && (
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-primary)', background: 'var(--color-primary-light)', borderRadius: 20, padding: '3px 9px' }}>
                {selectedIds.size} dipilih
              </span>
            )}
            <button onClick={onClose} aria-label="Tutup" style={{ background: 'var(--color-bg)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'var(--color-muted)', cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 4, padding: '8px 20px 0', flexShrink: 0 }}>
          {([1, 2, 3] as const).map((s) => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? 'var(--color-primary)' : 'var(--color-border)', transition: 'background 0.2s' }} />
          ))}
        </div>

        {/* ── Step 1: Stock Picker ─────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <div style={{ padding: '12px 20px 8px', flexShrink: 0 }}>
              {/* Search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)', padding: '9px 12px' }}>
                <span style={{ fontSize: 14, color: 'var(--color-muted)' }}>🔍</span>
                <input type="text" placeholder="Cari nama pakan, batch, lokasi..." value={stockQuery} onChange={(e) => setStockQuery(e.target.value)} style={{ border: 'none', outline: 'none', flex: 1, fontSize: 13, color: 'var(--color-text)', background: 'transparent' }} />
                {stockQuery && <button type="button" onClick={() => setStockQuery('')} style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: 0 }}>✕</button>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 6 }}>
                {filteredStock.length} item tersedia · Pilih satu atau lebih pakan
              </div>
            </div>

            {/* Stock list */}
            <div style={{ overflowY: 'auto', padding: '0 20px 8px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {filteredStock.length === 0 ? (
                <EmptyState emoji="🔍" title="Tidak Ditemukan" message="Tidak ada item stok yang sesuai dengan pencarian." />
              ) : (
                filteredStock.map((item) => {
                  const expired    = isExpired(item.kadaluarsa);
                  const outOfStock = item.status === 'Habis';
                  const disabledReason = outOfStock ? 'Stok habis, tidak dapat dipilih.' : expired ? 'Stok sudah kadaluarsa.' : undefined;
                  return (
                    <StockRow
                      key={item.id}
                      item={item}
                      selected={selectedIds.has(item.id)}
                      disabled={outOfStock || expired}
                      disabledReason={disabledReason}
                      onToggle={() => toggleSelect(item.id)}
                    />
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
              <button type="button" onClick={goToStep2} disabled={selectedIds.size === 0} style={{ width: '100%', padding: '13px 0', borderRadius: 'var(--radius-sm)', border: 'none', background: selectedIds.size > 0 ? 'var(--color-primary)' : 'var(--color-border)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed' }}>
                Berikutnya — {selectedIds.size} item dipilih
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Detail per item ──────────────────────────────────────── */}
        {step === 2 && (
          <>
            <div style={{ overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>

              {/* Per-item quantity inputs */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Jumlah Per Pakan</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {selectedItems.map((item) => {
                    const err = errors[item.id];
                    const detail = details[item.id] ?? { jumlah: '' };
                    return (
                      <div key={item.id} style={{ background: 'var(--color-bg)', border: err ? '1.5px solid #c62828' : '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{item.nama}</div>
                            {item.brand && <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{item.brand}</div>}
                            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
                              Tersedia: <strong style={{ color: item.jumlahStok > 0 ? 'var(--color-primary)' : '#c62828' }}>{item.jumlahStok} {item.satuan}</strong>
                            </div>
                          </div>
                          <button type="button" onClick={() => toggleSelect(item.id)} style={{ border: 'none', background: 'none', fontSize: 16, color: 'var(--color-muted)', cursor: 'pointer', padding: 0 }} aria-label="Hapus item">✕</button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="number" min="0.1" step="0.1"
                            placeholder={`Jumlah (maks. ${item.jumlahStok})`}
                            value={detail.jumlah}
                            onChange={(e) => {
                              setDetails((d) => ({ ...d, [item.id]: { jumlah: e.target.value } }));
                              if (errors[item.id]) setErrors((er) => { const ne = { ...er }; delete ne[item.id]; return ne; });
                            }}
                            style={{ flex: 1, padding: '9px 12px', border: err ? '1.5px solid #c62828' : '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 13, background: 'var(--color-surface)', color: 'var(--color-text)' }}
                          />
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>{item.satuan}</span>
                        </div>
                        {err && <div style={{ marginTop: 5, fontSize: 11, color: '#c62828' }}>⚠ {err}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add more pakan */}
              <button type="button" onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '10px', border: '1.5px dashed var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'none', color: 'var(--color-primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                + Tambah Pakan Lain
              </button>

              {/* Waktu Pemberian */}
              <div>
                <FieldLabel label="Waktu Pemberian" hint="Waktu aktual pemberian pakan" />
                <input type="time" value={waktu} onChange={(e) => setWaktu(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 13, background: 'var(--color-surface)', color: 'var(--color-text)', boxSizing: 'border-box' }} />
              </div>

              {/* Catatan */}
              <div>
                <FieldLabel label="Catatan (opsional)" />
                <textarea placeholder="Tambahkan catatan tentang pemberian pakan ini..." value={catatan} onChange={(e) => setCatatan(e.target.value)} style={{ width: '100%', minHeight: 80, padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 13, background: 'var(--color-surface)', color: 'var(--color-text)', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>← Kembali</button>
              <button type="button" onClick={goToStep3} style={{ flex: 2, padding: '12px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Konfirmasi →</button>
            </div>
          </>
        )}

        {/* ── Step 3: Konfirmasi ─────────────────────────────────────────────── */}
        {step === 3 && (
          <>
            <div style={{ overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>

              {/* Target card */}
              <div style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Target</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: target.item.typeBg || 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    {target.item.icon || '📦'}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{getTargetLabel(target)}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace' }}>{target.kind === 'individu' ? 'Individu' : 'Batch'} · {target.item.id}</div>
                  </div>
                </div>
              </div>

              {/* Items summary */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Pakan ({selectedItems.length} item)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedItems.map((item) => (
                    <div key={item.id} style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{item.nama}</div>
                        <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 1 }}>{item.sumber}{item.brand ? ` · ${item.brand}` : ''}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-primary)' }}>{details[item.id]?.jumlah || '0'}</div>
                        <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>{item.satuan}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Waktu + Catatan summary */}
              <div style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>Waktu Pemberian</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{waktu || '—'}</span>
                </div>
                {catatan && (
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>Catatan</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.5 }}>{catatan}</div>
                  </div>
                )}
              </div>

              {/* Status picker */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Status Pencatatan</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {(['Draft', 'Siap Diproses'] as PemberianPakanStatus[]).map((s) => {
                    const isActive = status === s;
                    const color    = s === 'Draft' ? { active: '#546e7a', bg: '#eceff1', border: '#546e7a' } : { active: '#1a7a4a', bg: '#e8f5e9', border: '#1a7a4a' };
                    return (
                      <button key={s} type="button" onClick={() => setStatus(s)} style={{ flex: 1, padding: '12px 8px', borderRadius: 'var(--radius-md)', border: isActive ? `2px solid ${color.border}` : '1.5px solid var(--color-border)', background: isActive ? color.bg : 'var(--color-surface)', color: isActive ? color.active : 'var(--color-muted)', fontWeight: 700, fontSize: 12, cursor: 'pointer', textAlign: 'center' }}>
                        {s === 'Draft' ? '📝 Draft' : '✅ Siap Diproses'}
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                  {status === 'Draft' ? 'Disimpan sebagai draft, stok belum dikurangi.' : 'Siap diproses, stok akan dikurangi setelah LP-003 aktif.'}
                </div>
              </div>

              {/* Save error */}
              {saveError && <div style={{ padding: '10px 14px', background: '#ffebee', border: '1.5px solid #c62828', borderRadius: 'var(--radius-sm)', fontSize: 12, color: '#c62828', fontWeight: 600 }}>⚠ {saveError}</div>}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setStep(2)} style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>← Kembali</button>
              <button type="button" onClick={handleSave} style={{ flex: 2, padding: '12px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                💾 Simpan
              </button>
            </div>
          </>
        )}

      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── RIWAYAT TAB ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_BADGE: Record<PemberianPakanStatus, { color: string; bg: string; label: string }> = {
  'Draft':                    { color: '#546e7a', bg: '#eceff1', label: '📝 Draft' },
  'Siap Diproses':            { color: '#0277bd', bg: '#e3f2fd', label: '⏳ Siap Diproses' },
  'Pemberian Pakan Selesai':  { color: '#1a7a4a', bg: '#e8f5e9', label: '✅ Selesai' },
};

function RiwayatItem({
  record, onSelesaikan,
}: {
  record: PemberianPakanRecord;
  onSelesaikan: (id: string) => void;
}) {
  const badge     = STATUS_BADGE[record.status];
  const totalItem = record.items.length;
  const pakanNames = record.items.map((i) => i.namaPakan).join(', ');
  const isDone    = record.status === 'Pemberian Pakan Selesai';

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: isDone ? '1.5px solid #a5d6a7' : '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '13px 14px',
    }}>
      {/* Row 1: icon + name + status badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: record.targetTypeBg || 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
            {record.targetIcon}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>{record.targetName ?? record.targetId}</div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace', marginTop: 1 }}>{record.targetKind === 'individu' ? 'Individu' : 'Batch'} · {record.targetId}</div>
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: badge.color, background: badge.bg, borderRadius: 20, padding: '3px 9px', flexShrink: 0 }}>
          {badge.label}
        </span>
      </div>

      {/* Row 2: pakan names */}
      <div style={{ fontSize: 12, color: 'var(--color-text)', marginBottom: 6, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        🌿 {pakanNames}
      </div>

      {/* Row 3: meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: isDone ? 0 : 10 }}>
        <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>📦 {totalItem} item pakan</span>
        <span style={{ fontSize: 10, color: 'var(--color-border)' }}>·</span>
        <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>⏰ {record.waktuPemberian}</span>
        <span style={{ fontSize: 10, color: 'var(--color-border)' }}>·</span>
        <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>📅 {formatIsoDate(record.tanggal)}</span>
      </div>

      {/* LP-003 link info (when done) */}
      {isDone && record.riwayatStokIds && record.riwayatStokIds.length > 0 && (
        <div style={{ marginTop: 8, padding: '6px 10px', background: '#e8f5e9', borderRadius: 8, fontSize: 11, color: '#2e7d32' }}>
          🔗 {record.riwayatStokIds.length} entri Riwayat Stok terhubung
          {record.selesaiAt && (
            <span style={{ marginLeft: 8, color: '#4caf50' }}>
              · selesai {new Date(record.selesaiAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      )}

      {/* LP-003: Selesaikan trigger button (shown when not yet done) */}
      {!isDone && (
        <button
          type="button"
          onClick={() => onSelesaikan(record.id)}
          style={{
            width: '100%', marginTop: 2,
            padding: '10px', borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--color-primary)',
            background: 'var(--color-primary)', color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          ✅ Selesaikan Pemberian Pakan
        </button>
      )}
    </div>
  );
}

function RiwayatTab({
  tick, onSelesaikan,
}: {
  tick: number;
  onSelesaikan: (id: string) => void;
}) {
  // tick forces re-render after save / selesaikan
  const records = getPemberianPakanList();
  if (records.length === 0) {
    return (
      <EmptyState
        emoji="📋"
        title="Riwayat Belum Tersedia"
        message="Riwayat pemberian pakan akan muncul di sini setelah pencatatan pertama dilakukan."
      />
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {records.map((r) => (
        <RiwayatItem key={r.id} record={r} onSelesaikan={onSelesaikan} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PAGE ─────────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export default function PemberianPakan() {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const location = useLocation();

  // Populates LIVESTOCK_DB and BATCH_DB from Supabase so deep-link /
  // hard-refresh navigations get live data instead of an empty in-memory store.
  const { isLoading, error, refresh } = useLivestock();
  // Populates RAW_INVENTARIS from Supabase so inventory picker works on hard refresh.
  useStokInventaris();
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 36 }}>⏳</span>
        <div style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 600 }}>Memuat data pakan ternak...</div>
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
  const [tab,         setTab]         = useState<Tab>('dashboard');
  const [mode,        setMode]        = useState<Mode>('individu');
  const [query,       setQuery]       = useState('');
  const [filters,     setFilters]     = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen,  setFilterOpen]  = useState(false);
  const [sheetTarget, setSheetTarget] = useState<SheetTarget | null>(null);
  // LP-004: saat tidak null, sheet di atas dibuka dari "Laksanakan Jadwal" — form
  // sudah diisi otomatis tapi pengguna tetap bisa mengubah jumlah sebelum simpan.
  const [sheetPrefill, setSheetPrefill] = useState<PrefillFromJadwal | null>(null);
  const [toast,       setToast]       = useState<ToastState | null>(null);
  // tick causes Riwayat tab to re-read the store after a save
  const [tick, setTick] = useState(0);

  // ── LP-004: consume a "Laksanakan Jadwal" hand-off from the Jadwal page ─────
  useEffect(() => {
    const prefill = (location.state as { prefillFromJadwal?: PrefillFromJadwal } | null)?.prefillFromJadwal;
    if (!prefill) return;
    const list: (IndividuRow | BatchRow)[] = prefill.targetKind === 'individu' ? buildIndividuList() : buildBatchList();
    const found = list.find((it) => it.id === prefill.targetId);
    if (!found) {
      setToast({ message: 'Target jadwal tidak ditemukan — mungkin sudah diarsipkan atau dihapus.', type: 'error' });
    } else {
      setSheetTarget(
        prefill.targetKind === 'individu'
          ? { kind: 'individu', item: found as IndividuRow }
          : { kind: 'batch', item: found as BatchRow }
      );
      setSheetPrefill(prefill);
    }
    // Clear navigation state so refresh/back doesn't reopen the sheet.
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live data — read directly each render so mutations are always reflected
  const ALL_INDIVIDU = buildIndividuList();
  const ALL_BATCH    = buildBatchList();

  // ── Filter logic ──────────────────────────────────────────────────────────

  const filteredIndividu = useMemo(() => {
    return ALL_INDIVIDU.filter((item) => {
      if (filters.jenis !== 'Semua Jenis' && item.type !== filters.jenis) return false;
      const itemRas = (item as any).ras as string | undefined;
      if (filters.ras && itemRas !== undefined && itemRas !== filters.ras) return false;
      if (filters.program !== 'Semua Program' && item.program !== filters.program) return false;
      if (filters.program === 'Fattening' && filters.programSub && item.batchId !== filters.programSub) return false;
      if (filters.status !== 'Semua Status' && item.locationStatus !== filters.status) return false;
      const itemBlok = (item as any).blok as string | undefined;
      if (filters.blok && itemBlok !== undefined && itemBlok !== filters.blok) return false;
      const itemKandang = (item as any).kandang as string | undefined;
      if (filters.kandang && itemKandang !== undefined && itemKandang !== filters.kandang) return false;
      if (filters.lokasiLuar && item.lokasiLuar !== filters.lokasiLuar) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!item.id.toLowerCase().includes(q) && !(item.name ?? '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, query, ALL_INDIVIDU.length]);

  const filteredBatch = useMemo(() => {
    return ALL_BATCH.filter((item) => {
      if (filters.jenis !== 'Semua Jenis' && item.type !== filters.jenis) return false;
      if (filters.program === 'Fattening' && filters.programSub && item.id !== filters.programSub) return false;
      if (filters.status !== 'Semua Status' && !item.members.some((m) => m.locationStatus === filters.status)) return false;
      if (filters.blok && !item.members.some((m: any) => m.blok === filters.blok)) return false;
      if (filters.kandang && !item.members.some((m: any) => m.kandang === filters.kandang)) return false;
      if (filters.lokasiLuar && !item.members.some((m) => m.lokasiLuar === filters.lokasiLuar)) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!item.id.toLowerCase().includes(q) && !(item.name ?? '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, query, ALL_BATCH.length]);

  const currentList = mode === 'individu' ? filteredIndividu : filteredBatch;

  const activeFilterCount = countActiveFilters(filters);

  const hasActiveFilters = activeFilterCount > 0 || !!query;

  function handleRemoveChip(key: keyof Filters) {
    const reset: Partial<Filters> = {};
    if      (key === 'jenis')       { reset.jenis = 'Semua Jenis'; reset.ras = ''; }
    else if (key === 'ras')         { reset.ras = ''; }
    else if (key === 'program')     { reset.program = 'Semua Program'; reset.programSub = ''; }
    else if (key === 'programSub')  { reset.programSub = ''; }
    else if (key === 'status')      { reset.status = 'Semua Status'; reset.blok = ''; reset.kandang = ''; reset.lokasiLuar = ''; }
    else if (key === 'blok')        { reset.blok = ''; }
    else if (key === 'kandang')     { reset.kandang = ''; }
    else if (key === 'lokasiLuar')  { reset.lokasiLuar = ''; }
    setFilters((f) => ({ ...f, ...reset }));
  }

  function handleResetFilters() {
    setQuery('');
    setFilters(DEFAULT_FILTERS);
  }

  function handleSelesaikan(recordId: string) {
    const result = selesaikanPemberianPakan(recordId);
    setTick((t) => t + 1);
    if (result.success) {
      setToast({
        message: `✅ Pemberian pakan selesai — ${result.riwayatStokIds.length} stok dikurangi.`,
        type: 'success',
      });

      // ── Supabase dual-write (fire-and-forget) ─────────────────────────────
      // Phase 1 (in-memory) already executed above. Phase 2 persists the
      // completed session to pemberian_pakan in Supabase.
      // Failure is logged but never blocks UI.
      if (activeWorkspace?.workspace_uuid) {
        const wsId  = activeWorkspace.workspace_uuid;
        const rec   = getPemberianPakanById(recordId);
        if (rec) {
          const totalJumlah = rec.items.reduce((sum, it) => sum + it.jumlah, 0);
          const formulaId   = rec.items.find((it) => it.formulaUuid)?.formulaUuid ?? null;
          void (async () => {
            const feedResult = await recordFeedSession(wsId, {
              targetKind:     rec.targetKind,
              targetId:       rec.targetId,
              tanggal:        rec.tanggal,
              waktuPemberian: rec.waktuPemberian,
              totalJumlah:    totalJumlah > 0 ? totalJumlah : 1,
              jadwalId:       rec.sumberJadwalId ?? null,
              formulaId,
              catatan:        rec.catatan ?? null,
            });
            if (!feedResult.ok) {
              console.error('[PemberianPakan] recordFeedSession failed:', feedResult.error);
            } else {
              // Phase 2b: per-item stok_inventaris_transactions writes (fire-and-forget)
              // Deduction already applied in Phase 1 (in-memory), so stokSebelum = current + jumlah.
              for (const item of rec.items) {
                const invItem = getInventarisById(item.inventarisId);
                if (!invItem) continue;
                const stokSebelum = invItem.jumlahStok + item.jumlah;
                void recordPemberianPakanTransaction(wsId, {
                  itemId:            invItem.id,
                  itemName:          invItem.nama,
                  sumber:            invItem.sumber,
                  unit:              invItem.satuan,
                  jumlah:            item.jumlah,
                  jumlahStokSebelum: stokSebelum,
                  tanggal:           rec.tanggal,
                  referensiId:       invItem.referensiId,
                  kategori:          invItem.kategori,
                  pemberianPakanId:  feedResult.data.id,
                }).then((r) => { if (!r.ok) console.warn('[PemberianPakan] stok tx dual-write:', r.error); });
              }
            }
          })();
        }
      }
    } else {
      setToast({ message: result.error, type: 'error' });
    }
  }

  function handleSaved(savedStatus: PemberianPakanStatus) {
    setTick((t) => t + 1);
    setToast({
      message: savedStatus === 'Siap Diproses'
        ? 'Pemberian pakan disimpan — Siap Diproses.'
        : 'Pemberian pakan disimpan sebagai Draft.',
      type: 'success',
    });
  }

  return (
    <div style={{ padding: '20px 16px 40px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* ── Tab Bar ────────────────────────────────────────────────────── */}
      <section>
        <TabBar active={tab} onChange={setTab} />

        <div>

          {/* ── DASHBOARD TAB (LP-007) ────────────────────────────────── */}
          {tab === 'dashboard' && (
            <DashboardPakanTab
              tick={tick}
              onGoToPemberian={() => setTab('pemberian')}
              navigate={navigate}
            />
          )}

          {/* ── PEMBERIAN TAB ─────────────────────────────────────────── */}
          {tab === 'pemberian' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Mode */}
              <div>
                <SectionLabel title="Mode" />
                <SegmentedControl value={mode} onChange={setMode} />
              </div>

              {/* Search & Filter */}
              <div>
                <SectionLabel title="Cari &amp; Filter" />
                <SearchFilterBar
                  query={query}
                  onSearch={setQuery}
                  onFilter={() => setFilterOpen(true)}
                  activeFilterCount={activeFilterCount}
                  mode={mode}
                />
                <FilterChips filters={filters} mode={mode} onRemove={handleRemoveChip} />
                {hasActiveFilters && (
                  <button type="button" onClick={handleResetFilters} style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, color: 'var(--color-muted)', padding: 0 }}>
                    ↺ Reset semua
                  </button>
                )}
              </div>

              {/* List */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <SectionLabel title={mode === 'individu' ? 'Daftar Ternak' : 'Daftar Batch'} />
                  <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 10 }}>{currentList.length} data</span>
                </div>

                {currentList.length === 0 ? (
                  <EmptyState message="Tidak ada ternak/batch yang sesuai dengan pencarian atau filter yang dipilih." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {mode === 'individu'
                      ? filteredIndividu.map((item) => (
                          <IndividuCard key={item.id} item={item} onBeriPakan={() => setSheetTarget({ kind: 'individu', item })} />
                        ))
                      : filteredBatch.map((item) => (
                          <BatchListCard key={item.id} item={item} onBeriPakan={() => setSheetTarget({ kind: 'batch', item })} />
                        ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── RIWAYAT TAB ──────────────────────────────────────────── */}
          {tab === 'riwayat' && <RiwayatTab tick={tick} onSelesaikan={handleSelesaikan} />}

        </div>
      </section>

      {/* ── Filter Sheet ────────────────────────────────────────────────── */}
      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        mode={mode}
        filters={filters}
        onChangeFilters={setFilters}
        onReset={handleResetFilters}
        individuList={ALL_INDIVIDU as any[]}
        batchList={ALL_BATCH as any[]}
      />

      {/* ── Beri Pakan Sheet (multi-step) ────────────────────────────────── */}
      {sheetTarget && (
        <BeriPakanSheet
          target={sheetTarget}
          onClose={() => { setSheetTarget(null); setSheetPrefill(null); }}
          onSaved={handleSaved}
          initialStep={sheetPrefill ? 2 : undefined}
          initialSelectedIds={sheetPrefill ? sheetPrefill.items.map((i) => i.inventarisId) : undefined}
          initialDetails={sheetPrefill ? Object.fromEntries(sheetPrefill.items.map((i) => [i.inventarisId, { jumlah: i.jumlah }])) : undefined}
          initialWaktu={sheetPrefill?.jam}
          initialCatatan={sheetPrefill?.catatan}
          sumberJadwalId={sheetPrefill?.jadwalId}
        />
      )}

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
