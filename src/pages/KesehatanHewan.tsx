import { useState, useMemo, useRef } from 'react';
import { SectionLabel } from '../components/InsightCard';
import { useNavigate } from 'react-router-dom';
import { useLivestock } from '../hooks/useLivestock';
import { useHealth }    from '../hooks/useHealth';
import { useDebounce } from '../utils/useDebounce';
import { LIVESTOCK_DB, getLivestock } from '../data/livestockData';
import { getLivestockStatus, getOutsideEntry } from '../data/transferData';
import { BATCH_DB, getActiveBatchMembersWithLivestock, getBatch, type BatchStatus } from '../data/batchData';
import {
  Filters, DEFAULT_FILTERS, countActiveFilters,
  FilterSheet, FilterChips, SearchFilterBar, SegmentedControl,
} from '../components/LivestockFilterSheet';
import { TINDAKAN_SESI_DB, getTindakanItemsBySesi } from '../data/tindakanKesehatanData';
import { getPemeriksaan } from '../data/pemeriksaanKesehatanData';
import { getDiagnosa } from '../data/diagnosaKesehatanData';
import { getPengobatanSesiByTindakan, getPengobatanItemsBySesi } from '../data/pengobatanKesehatanData';
import { getKasusStatus, getKontrolBySesi, getJadwalTerakhir, type StatusKasus, type JadwalKontrol } from '../data/kontrolKesehatanData';
import { getPemeriksaanList } from '../data/pemeriksaanKesehatanData';
import { getDiagnosaList } from '../data/diagnosaKesehatanData';
import { getRiwayatKesehatanList } from '../data/riwayatKesehatanData';
import { getObatByUuid } from '../data/obatData';
import {
  generateInsights,
  type InsightLevel,
  type InsightCategory,
  type InsightItem,
  type PrediksiObatItem,
  type InsightReport,
  type OverallKondisi,
} from '../data/aiInsightKesehatanData';

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = 'individu' | 'batch';

type StatusKesehatan = 'Sehat' | 'Sedang Perawatan' | 'Sembuh' | 'Perlu Kontrol';

// ─── Ringkasan (live, computed each render — KH-010) ──────────────────────────

type RingkasanData = {
  totalPemeriksaan: number;
  kasusAktif:       number;
  sedangPengobatan: number;
  perluKontrol:     number;
  sembuh:           number;
  meninggal:        number;
};

/**
 * Computes the 6 Ringkasan metrics live from the KH-002..KH-007 registries.
 * Never memoized — must reflect in-memory mutations immediately (see
 * livestock-list-patterns / dashboard-livestock-arch memory conventions).
 */
function computeRingkasan(): RingkasanData {
  let kasusAktif = 0;
  let sedangPengobatan = 0;
  let perluKontrol = 0;
  let sembuh = 0;
  let meninggal = 0;

  for (const sesi of TINDAKAN_SESI_DB) {
    const status = getKasusStatus(sesi.id);
    if (status === 'Aktif') {
      kasusAktif++;
      const pengobatanSesi = getPengobatanSesiByTindakan(sesi.id);
      if (pengobatanSesi && pengobatanSesi.status === 'Pengobatan Selesai') sedangPengobatan++;
      if (getJadwalTerakhir(sesi.id)) perluKontrol++;
    } else if (status === 'Selesai') {
      sembuh++;
    } else if (status === 'Ditutup') {
      meninggal++;
    }
  }

  return {
    totalPemeriksaan: getPemeriksaanList().length,
    kasusAktif, sedangPengobatan, perluKontrol, sembuh, meninggal,
  };
}

// ─── Data Builders (live registry reads — never memoized) ─────────────────────

type IndividuRow = {
  id: string;
  name: string | null;
  type: string;
  icon: string;
  typeBg: string;
  ras: string;
  program: string;
  locationStatus: 'Aktif' | 'Luar Kandang';
  location: string;
  status: string; // health status: Sehat | Sakit | Pemantauan
  blok: string;
  kandang: string;
  lokasiLuar: string;
  batchId: string | undefined;
};

type BatchMemberFilter = {
  blok: string;
  kandang: string;
  lokasiLuar: string;
  locationStatus: 'Aktif' | 'Luar Kandang';
};

type BatchRow = {
  id: string;
  name: string | null;
  type: string;
  icon: string;
  typeBg: string;
  program: string;
  status: BatchStatus;
  total: number;
  members: BatchMemberFilter[];
};

function extractBlok(location: string): string {
  const parts = location.split(', ');
  return parts.find((p) => /blok/i.test(p)) ?? '';
}

function extractKandang(location: string): string {
  const parts = location.split(', ');
  return parts.find((p) => /kandang/i.test(p)) ?? parts[0] ?? '';
}

function buildIndividuList(): IndividuRow[] {
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
        ras: lv.ras,
        program: lv.program,
        locationStatus: isLuar ? 'Luar Kandang' : 'Aktif',
        location: lv.location,
        status: lv.status,
        blok: isLuar ? '' : extractBlok(lv.location),
        kandang: isLuar ? '' : extractKandang(lv.location),
        lokasiLuar: outsideEntry?.reason ?? '',
        batchId: lv.batch?.id ?? undefined,
      };
    });
}

function buildBatchList(): BatchRow[] {
  return Object.values(BATCH_DB).filter((b) => b.status !== 'Diarsipkan').map((b) => {
    const members = getActiveBatchMembersWithLivestock(b.id);
    const memberFilters: BatchMemberFilter[] = members.map(({ lv }) => {
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
      members: memberFilters,
    };
  });
}


// ─── Style configs ────────────────────────────────────────────────────────────

const PROGRAM_CONFIG: Record<string, { bg: string; color: string }> = {
  Fattening:   { bg: '#e3f2fd', color: '#0277bd' },
  Breeding:    { bg: '#fce4ec', color: '#c2185b' },
  Kontes:      { bg: '#fff8e1', color: '#f57f17' },
  Karantina:   { bg: '#ffebee', color: '#c62828' },
  Replacement: { bg: '#f3e5f5', color: '#6a1b9a' },
  Lainnya:     { bg: '#eceff1', color: '#546e7a' },
};

const LOC_STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  Aktif:          { bg: '#e8f5e9', color: '#2e7d32' },
  'Luar Kandang': { bg: '#fff8e1', color: '#f57f17' },
};

const HEALTH_STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  Sehat:             { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  Sakit:             { bg: '#ffebee', color: 'var(--color-danger)' },
  Pemantauan:        { bg: '#fff3e0', color: 'var(--color-warning)' },
  'Perlu Perhatian': { bg: '#fff3e0', color: 'var(--color-warning)' },
};

const RINGKASAN_CONFIG: Array<{
  key: keyof RingkasanData;
  label: string;
  icon: string;
  color: string;
  bg: string;
}> = [
  { key: 'totalPemeriksaan', label: 'Total Pemeriksaan', icon: '🩺', color: 'var(--color-primary)',  bg: 'var(--color-primary-light)' },
  { key: 'kasusAktif',       label: 'Kasus Aktif',       icon: '🔄', color: '#e65100',               bg: '#fff3e0' },
  { key: 'sedangPengobatan', label: 'Sedang Pengobatan', icon: '💊', color: 'var(--color-danger)',   bg: '#ffebee' },
  { key: 'perluKontrol',     label: 'Perlu Kontrol',     icon: '⚠️', color: 'var(--color-warning)',  bg: '#fff8e1' },
  { key: 'sembuh',           label: 'Sembuh',            icon: '✅', color: '#2e7d32',               bg: '#e8f5e9' },
  { key: 'meninggal',        label: 'Meninggal',         icon: '🪦', color: '#c62828',               bg: '#ffebee' },
];

// ─── Shared UI Bits ───────────────────────────────────────────────────────────

// SectionLabel is imported from '../components/InsightCard' (MIN-001).

function ProgramBadge({ program }: { program: string }) {
  const cfg = PROGRAM_CONFIG[program] ?? PROGRAM_CONFIG['Lainnya'];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: '2px 8px' }}>
      {program}
    </span>
  );
}

function LocStatusBadge({ status }: { status: string }) {
  const cfg = LOC_STATUS_CONFIG[status] ?? LOC_STATUS_CONFIG['Aktif'];
  return (
    <span style={{ fontSize: 11, fontWeight: 700, flexShrink: 0, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: '3px 9px' }}>
      {status}
    </span>
  );
}

function HealthStatusBadge({ status }: { status: string }) {
  const cfg = HEALTH_STATUS_CONFIG[status] ?? HEALTH_STATUS_CONFIG['Sehat'];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: '2px 8px' }}>
      {status}
    </span>
  );
}

// ─── AI Insight Card (KH-009) ─────────────────────────────────────────────────

/** Visual config per insight level */
const LEVEL_CFG: Record<InsightLevel, { border: string; bg: string; color: string; badge: string }> = {
  critical: { border: '#c62828', bg: '#fff5f5', color: '#c62828', badge: '🔴 Kritis' },
  warning:  { border: '#e65100', bg: '#fff8f0', color: '#e65100', badge: '🟠 Peringatan' },
  info:     { border: '#1565c0', bg: '#f0f4ff', color: '#1565c0', badge: '🔵 Info' },
};

/** Visual config per overall kondisi */
const KONDISI_CFG: Record<OverallKondisi, { bg: string; color: string; border: string; icon: string }> = {
  'Membaik':          { bg: '#e8f5e9', color: '#2e7d32', border: '#4caf50', icon: '📈' },
  'Stabil':           { bg: '#e3f2fd', color: '#1565c0', border: '#42a5f5', icon: '📊' },
  'Memburuk':         { bg: '#ffebee', color: '#c62828', border: '#ef5350', icon: '📉' },
  'Belum Cukup Data': { bg: '#f5f5f5', color: '#757575', border: '#bdbdbd', icon: '📋' },
};

const CATEGORY_LABELS: Record<InsightCategory, string> = {
  ringkasan:    '📊 Ringkasan',
  perkembangan: '🔁 Perkembangan',
  rekomendasi:  '💡 Rekomendasi',
  peringatan:   '⚠️ Peringatan',
  prediksi:     '📦 Prediksi',
};

function InsightItemRow({ item }: { item: InsightItem }) {
  const cfg = LEVEL_CFG[item.level];
  return (
    <div style={{
      borderLeft: `3px solid ${cfg.border}`,
      background: cfg.bg,
      borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
      padding: '9px 12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        <span style={{ fontSize: 14 }}>{item.icon}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: cfg.color, flex: 1 }}>{item.title}</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: cfg.color, opacity: 0.8, flexShrink: 0 }}>
          {cfg.badge}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 11.5, color: 'var(--color-text)', lineHeight: 1.55 }}>
        {item.message}
      </p>
    </div>
  );
}

function PrediksiObatRow({ item }: { item: PrediksiObatItem }) {
  const sisaHari = item.sisaHari;
  let statusLabel: string;
  let statusColor: string;
  if (sisaHari === null)     { statusLabel = 'Tidak Terdeteksi'; statusColor = 'var(--color-muted)'; }
  else if (sisaHari < 0)     { statusLabel = `${Math.abs(sisaHari)}h lewat`;     statusColor = '#c62828'; }
  else if (sisaHari === 0)   { statusLabel = 'Hari ini habis';   statusColor = '#e65100'; }
  else if (sisaHari <= 3)    { statusLabel = `Sisa ${sisaHari}h`;statusColor = '#e65100'; }
  else                       { statusLabel = `Sisa ${sisaHari}h`;statusColor = '#2e7d32'; }
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '7px 0', borderBottom: '1px solid var(--color-border)', gap: 8,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.namaProduk}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>{item.subjectLabel} · {item.namaGenerik}</div>
      </div>
      <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: statusColor }}>{statusLabel}</span>
    </div>
  );
}

function ProInsightContent({ report }: { report: InsightReport }) {
  const [selectedCat, setSelectedCat] = useState<InsightCategory | 'all'>('all');

  const kondisiCfg = KONDISI_CFG[report.kondisi];

  const categories = useMemo((): InsightCategory[] => {
    const seen = new Set<InsightCategory>();
    report.items.forEach((i) => seen.add(i.category));
    return Array.from(seen);
  }, [report.items]);

  const filteredItems = useMemo(() =>
    selectedCat === 'all' ? report.items : report.items.filter((i) => i.category === selectedCat),
    [report.items, selectedCat],
  );

  const analyzedAt = useMemo(() => {
    const d = new Date(report.analyzedAt);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
      ' · ' + d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }, [report.analyzedAt]);

  if (report.totalKasus === 0) {
    return (
      <div style={{ padding: '20px 14px', textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🩺</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
          Belum Ada Data Kasus
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--color-muted)', lineHeight: 1.6 }}>
          Insight akan tersedia setelah kasus kesehatan pertama selesai diproses melalui alur Tindakan.
        </div>
        <div style={{ marginTop: 10, fontSize: 10, color: 'var(--color-muted)' }}>
          Dianalisis {analyzedAt}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Kondisi Banner */}
      <div style={{
        margin: '12px 14px 0',
        padding: '10px 12px',
        background: kondisiCfg.bg,
        border: `1.5px solid ${kondisiCfg.border}`,
        borderRadius: 'var(--radius-sm)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 20 }}>{kondisiCfg.icon}</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: kondisiCfg.color }}>
            Kondisi: {report.kondisi}
          </div>
          <div style={{ fontSize: 11, color: kondisiCfg.color, opacity: 0.85, lineHeight: 1.4 }}>
            {report.kondisiSummary}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        gap: 1, margin: '10px 14px 0',
        background: 'var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden',
      }}>
        {[
          { label: 'Aktif',   value: report.aktivKasus,   color: '#e65100' },
          { label: 'Selesai', value: report.selesaiKasus,  color: '#2e7d32' },
          { label: 'Ditutup', value: report.ditutupKasus,  color: '#757575' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'var(--color-bg)', padding: '8px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Category filter chips */}
      {categories.length > 1 && (
        <div style={{
          display: 'flex', gap: 5, overflowX: 'auto', padding: '10px 14px 0',
          scrollbarWidth: 'none',
        }}>
          <button
            type="button"
            onClick={() => setSelectedCat('all')}
            style={{
              flexShrink: 0, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              cursor: 'pointer', whiteSpace: 'nowrap',
              border: selectedCat === 'all' ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
              background: selectedCat === 'all' ? 'var(--color-primary)' : 'var(--color-bg)',
              color: selectedCat === 'all' ? '#fff' : 'var(--color-text)',
            }}
          >
            Semua ({report.items.length})
          </button>
          {categories.map((cat) => {
            const count = report.items.filter((i) => i.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCat(cat)}
                style={{
                  flexShrink: 0, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  border: selectedCat === cat ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                  background: selectedCat === cat ? 'var(--color-primary)' : 'var(--color-bg)',
                  color: selectedCat === cat ? '#fff' : 'var(--color-text)',
                }}
              >
                {CATEGORY_LABELS[cat]} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Insight items */}
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filteredItems.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '8px 0' }}>
            Tidak ada insight untuk kategori ini.
          </p>
        ) : (
          filteredItems.map((item) => <InsightItemRow key={item.id} item={item} />)
        )}
      </div>

      {/* Prediksi Obat */}
      {report.prediksiObat.length > 0 && (selectedCat === 'all' || selectedCat === 'prediksi') && (
        <div style={{ padding: '0 14px 12px' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
            letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6,
          }}>
            📦 Detail Estimasi Pengobatan
          </div>
          {report.prediksiObat.map((item, idx) => (
            <PrediksiObatRow
              key={`${item.tindakanSesiId}-${item.namaProduk}-${idx}`}
              item={item}
            />
          ))}
        </div>
      )}

      {/* Timestamp */}
      <div style={{
        padding: '8px 14px',
        borderTop: '1px solid var(--color-border)',
        fontSize: 10, color: 'var(--color-muted)', textAlign: 'right',
      }}>
        🤖 Dianalisis {analyzedAt}
      </div>
    </div>
  );
}

/** Renders the AI Insight card. Receives a pre-computed report from the parent
 *  so the parent's useMemo([tick]) controls reactivity (MIN-002, MIN-003). */
function AiInsightCard({ report }: { report: InsightReport }) {
  const kondisiCfg = KONDISI_CFG[report.kondisi];

  return (
    <section>
      <div style={{ marginBottom: 10 }}>
        <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', margin: 0 }}>
          🤖 AI Insight
        </h2>
      </div>

      <div style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {/* Card header */}
        <div style={{
          padding: '12px 14px 10px', borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>🩺</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Analisis Kesehatan</span>
          {report.totalKasus > 0 && (
            <span style={{
              marginLeft: 'auto', fontSize: 10, fontWeight: 700,
              background: kondisiCfg.bg, color: kondisiCfg.color,
              border: `1px solid ${kondisiCfg.border}`, borderRadius: 20, padding: '2px 8px',
            }}>
              {kondisiCfg.icon} {report.kondisi}
            </span>
          )}
        </div>

        {/* Content — rendered unconditionally, no Pro/Free gate */}
        <ProInsightContent report={report} />
      </div>
    </section>
  );
}

// ─── Ringkasan Cards ──────────────────────────────────────────────────────────

function RingkasanCards() {
  // Live read each render — never memoized (mirrors dashboard-livestock-arch pattern).
  const ringkasan = computeRingkasan();
  return (
    <section>
      <SectionLabel title="Ringkasan" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {RINGKASAN_CONFIG.map(({ key, label, icon, color, bg }) => (
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
              color,
              background: bg,
              borderRadius: 'var(--radius-sm)',
              padding: '4px 10px',
              display: 'inline-block',
              minWidth: 40,
              textAlign: 'center',
            }}>
              {ringkasan[key]}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// (FilterSheet, FilterChips, SearchFilterBar imported from LivestockFilterSheet)

// ─── Empty State ──────────────────────────────────────────────────────────────

// ─── Riwayat Kesehatan Section (KH-008) ──────────────────────────────────────

const KH_STATUS_CFG: Record<StatusKasus, { bg: string; color: string }> = {
  Aktif:   { bg: '#fff3e0', color: '#e65100' },
  Selesai: { bg: '#e8f5e9', color: '#2e7d32' },
  Ditutup: { bg: '#ffebee', color: '#c62828' },
};

type MiniKasus = {
  tindakanSesiId: string;
  tanggal: string;
  petugas: string;
  subjectLabel: string;
  subjectIcon: string;
  subjectTypeBg: string;
  diagnosaLabel: string;
  kasusStatus: StatusKasus;
  jumlahTindakan: number;
  jumlahObat: number;
};

function buildMiniKasusList(mode: 'individu' | 'batch', query: string): MiniKasus[] {
  const rows: MiniKasus[] = [];
  for (const sesi of TINDAKAN_SESI_DB) {
    const p = getPemeriksaan(sesi.pemeriksaanId);
    if (!p) continue;
    if (p.mode !== mode) continue;
    if (query) {
      const d = sesi.diagnosaId ? getDiagnosa(sesi.diagnosaId) : null;
      const dLabel = d ? (d.namaPenyakit ?? d.namaDiagnosa ?? '') : '';
      const q = query.toLowerCase();
      if (!dLabel.toLowerCase().includes(q) && !p.petugas.toLowerCase().includes(q)) continue;
    }
    const d = sesi.diagnosaId ? getDiagnosa(sesi.diagnosaId) : null;
    const diagnosaLabel = d
      ? (d.sumber === 'master_penyakit' ? (d.namaPenyakit ?? 'Master Penyakit') : (d.namaDiagnosa ?? 'Manual'))
      : 'Tanpa Diagnosa';
    const kasusStatus = getKasusStatus(sesi.id);
    const tindakanItems = getTindakanItemsBySesi(sesi.id);
    const pengobatanSesi = getPengobatanSesiByTindakan(sesi.id);
    const pengobatanItems = pengobatanSesi ? getPengobatanItemsBySesi(pengobatanSesi.id) : [];

    let subjectLabel = 'Tidak Diketahui';
    let subjectIcon = '❓';
    let subjectTypeBg = '#f5f5f5';
    if (mode === 'individu' && p.livestockId) {
      const lv = getLivestock(p.livestockId);
      subjectLabel = lv.name ?? lv.id;
      subjectIcon = lv.typeIcon ?? '🐄';
      subjectTypeBg = lv.typeBg ?? '#e8f5e9';
    } else if (mode === 'batch' && p.batchId) {
      const b = getBatch(p.batchId);
      subjectLabel = b?.label ?? b?.name ?? 'Batch';
      subjectIcon = b?.livestockIcon ?? '🐑';
      subjectTypeBg = b?.livestockTypeBg ?? '#e8f5e9';
    }
    rows.push({
      tindakanSesiId: sesi.id,
      tanggal: p.tanggal,
      petugas: p.petugas,
      subjectLabel,
      subjectIcon,
      subjectTypeBg,
      diagnosaLabel,
      kasusStatus,
      jumlahTindakan: tindakanItems.length,
      jumlahObat: pengobatanItems.length,
    });
  }
  return rows.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

function formatDateShortKH(yyyymmdd: string): string {
  if (!yyyymmdd) return '—';
  const [y, m, d] = yyyymmdd.split('-');
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
}

function MiniKasusCard({ kasus, onClick }: { kasus: MiniKasus; onClick: () => void }) {
  const sCfg = KH_STATUS_CFG[kasus.kasusStatus];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', cursor: 'pointer',
        background: 'var(--color-bg)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)', padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}
    >
      <span style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: kasus.subjectTypeBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
      }}>
        {kasus.subjectIcon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {kasus.subjectLabel}
          </span>
          <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, background: sCfg.bg, color: sCfg.color, borderRadius: 20, padding: '1px 6px' }}>
            {kasus.kasusStatus}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
          {kasus.diagnosaLabel} · {formatDateShortKH(kasus.tanggal)}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--color-muted)', marginTop: 2 }}>
          {kasus.jumlahTindakan} tindakan{kasus.jumlahObat > 0 ? ` · ${kasus.jumlahObat} obat` : ''}
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', flexShrink: 0 }}>›</span>
    </button>
  );
}

function RiwayatSection({ navigate, mode, query }: {
  navigate: ReturnType<typeof import('react-router-dom').useNavigate>;
  mode: 'individu' | 'batch';
  query: string;
}) {
  const kasusList = buildMiniKasusList(mode, query);
  const shown = kasusList.slice(0, 5);
  const hasMore = kasusList.length > 5;

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
          Riwayat Kesehatan
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>{kasusList.length} kasus</span>
          {kasusList.length > 0 && (
            <button
              type="button"
              onClick={() => navigate('/kesehatan-hewan/riwayat')}
              style={{
                fontSize: 11, fontWeight: 700, color: 'var(--color-primary)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              Lihat Semua →
            </button>
          )}
        </div>
      </div>

      {kasusList.length === 0 ? (
        <div style={{
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
          padding: '28px 20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🩺</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
            Belum ada riwayat kasus
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Kasus akan muncul setelah proses Tindakan diselesaikan.
          </div>
        </div>
      ) : (
        <div style={{
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', gap: 1,
        }}>
          {shown.map((k) => (
            <MiniKasusCard
              key={k.tindakanSesiId}
              kasus={k}
              onClick={() => navigate(`/kesehatan-hewan/riwayat/${k.tindakanSesiId}`)}
            />
          ))}
          {hasMore && (
            <button
              type="button"
              onClick={() => navigate('/kesehatan-hewan/riwayat')}
              style={{
                width: '100%', padding: '11px', textAlign: 'center',
                background: 'var(--color-bg)', border: 'none', borderTop: '1px solid var(--color-border)',
                color: 'var(--color-primary)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Lihat {kasusList.length - 5} kasus lainnya →
            </button>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Kasus Aktif (KH-010) ─────────────────────────────────────────────────────
// Dedicated "active cases" list — narrower than Riwayat Kesehatan above (which
// shows every kasus regardless of status). Read-only; click → Detail Riwayat.

type KasusAktifRow = {
  tindakanSesiId: string;
  diagnosaLabel: string;
  statusHasil: string;
  tanggalPemeriksaan: string;
  petugas: string;
  jadwalKontrolBerikutnya: JadwalKontrol | null;
  subjectLabel: string;
  subjectIcon: string;
  subjectTypeBg: string;
};

function buildKasusAktifList(): KasusAktifRow[] {
  const rows: KasusAktifRow[] = [];
  for (const sesi of TINDAKAN_SESI_DB) {
    if (getKasusStatus(sesi.id) !== 'Aktif') continue;
    const p = getPemeriksaan(sesi.pemeriksaanId);
    if (!p) continue;
    const d = sesi.diagnosaId ? getDiagnosa(sesi.diagnosaId) : null;
    const diagnosaLabel = d
      ? (d.sumber === 'master_penyakit' ? (d.namaPenyakit ?? 'Master Penyakit') : (d.namaDiagnosa ?? 'Manual'))
      : 'Tanpa Diagnosa';
    const kontrolList = getKontrolBySesi(sesi.id);
    const statusHasil = kontrolList.length > 0 ? kontrolList[0].statusHasil : 'Belum Dikontrol';

    let subjectLabel = 'Tidak Diketahui';
    let subjectIcon = '❓';
    let subjectTypeBg = '#f5f5f5';
    if (p.mode === 'individu' && p.livestockId) {
      const lv = getLivestock(p.livestockId);
      subjectLabel = lv.name ?? lv.id;
      subjectIcon = lv.typeIcon ?? '🐄';
      subjectTypeBg = lv.typeBg ?? '#e8f5e9';
    } else if (p.mode === 'batch' && p.batchId) {
      const b = getBatch(p.batchId);
      subjectLabel = b?.label ?? b?.name ?? 'Batch';
      subjectIcon = b?.livestockIcon ?? '🐑';
      subjectTypeBg = b?.livestockTypeBg ?? '#e8f5e9';
    }

    rows.push({
      tindakanSesiId: sesi.id,
      diagnosaLabel,
      statusHasil,
      tanggalPemeriksaan: p.tanggal,
      petugas: p.petugas,
      jadwalKontrolBerikutnya: getJadwalTerakhir(sesi.id),
      subjectLabel, subjectIcon, subjectTypeBg,
    });
  }
  return rows.sort((a, b) => b.tanggalPemeriksaan.localeCompare(a.tanggalPemeriksaan));
}

function formatJadwal(j: JadwalKontrol | null): string {
  if (!j) return 'Belum dijadwalkan';
  return `${formatDateShortKH(j.tanggal)} · ${j.jam}`;
}

function KasusAktifCard({ kasus, onClick }: { kasus: KasusAktifRow; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', cursor: 'pointer',
        background: 'var(--color-bg)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)', padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}
    >
      <span style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: kasus.subjectTypeBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
      }}>
        {kasus.subjectIcon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {kasus.subjectLabel}
          </span>
          <span style={{
            flexShrink: 0, fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '1px 6px',
            background: (STATUS_HASIL_BADGE_CFG[kasus.statusHasil] ?? STATUS_HASIL_BADGE_CFG.default).bg,
            color: (STATUS_HASIL_BADGE_CFG[kasus.statusHasil] ?? STATUS_HASIL_BADGE_CFG.default).color,
          }}>
            {kasus.statusHasil}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
          {kasus.diagnosaLabel} · {formatDateShortKH(kasus.tanggalPemeriksaan)} · {kasus.petugas}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--color-muted)', marginTop: 2 }}>
          📅 Kontrol berikutnya: {formatJadwal(kasus.jadwalKontrolBerikutnya)}
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', flexShrink: 0 }}>›</span>
    </button>
  );
}

const STATUS_HASIL_BADGE_CFG: Record<string, { bg: string; color: string }> = {
  'Masih Perawatan': { bg: '#e3f2fd', color: '#1565c0' },
  'Perlu Kontrol':   { bg: '#fff3e0', color: '#e65100' },
  'Perlu Isolasi':   { bg: '#fff8e1', color: '#f57f17' },
  'Belum Dikontrol': { bg: '#f5f5f5', color: '#757575' },
  default:           { bg: '#f5f5f5', color: '#757575' },
};

function KasusAktifSection({ navigate, anchorRef }: {
  navigate: ReturnType<typeof import('react-router-dom').useNavigate>;
  anchorRef: React.RefObject<HTMLDivElement>;
}) {
  const list = buildKasusAktifList();
  return (
    <section ref={anchorRef}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <SectionLabel title="Kasus Aktif" />
        <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>{list.length} kasus</span>
      </div>
      {list.length === 0 ? (
        <div style={{
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
          padding: '22px 20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Tidak ada kasus aktif saat ini.</div>
        </div>
      ) : (
        <div style={{
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', gap: 1,
        }}>
          {list.map((k) => (
            <KasusAktifCard
              key={k.tindakanSesiId}
              kasus={k}
              onClick={() => navigate(`/kesehatan-hewan/riwayat/${k.tindakanSesiId}`)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Jadwal Kontrol (KH-010) ──────────────────────────────────────────────────
// Upcoming follow-up controls across all active cases, soonest → furthest.

type JadwalRow = {
  tindakanSesiId: string;
  jadwal: JadwalKontrol;
  subjectLabel: string;
  subjectIcon: string;
};

function buildJadwalKontrolList(): JadwalRow[] {
  const rows: JadwalRow[] = [];
  for (const sesi of TINDAKAN_SESI_DB) {
    if (getKasusStatus(sesi.id) !== 'Aktif') continue;
    const jadwal = getJadwalTerakhir(sesi.id);
    if (!jadwal) continue;
    const p = getPemeriksaan(sesi.pemeriksaanId);
    if (!p) continue;
    let subjectLabel = 'Tidak Diketahui';
    let subjectIcon = '❓';
    if (p.mode === 'individu' && p.livestockId) {
      const lv = getLivestock(p.livestockId);
      subjectLabel = lv.name ?? lv.id;
      subjectIcon = lv.typeIcon ?? '🐄';
    } else if (p.mode === 'batch' && p.batchId) {
      const b = getBatch(p.batchId);
      subjectLabel = b?.label ?? b?.name ?? 'Batch';
      subjectIcon = b?.livestockIcon ?? '🐑';
    }
    rows.push({ tindakanSesiId: sesi.id, jadwal, subjectLabel, subjectIcon });
  }
  return rows.sort((a, b) => `${a.jadwal.tanggal} ${a.jadwal.jam}`.localeCompare(`${b.jadwal.tanggal} ${b.jadwal.jam}`));
}

function JadwalKontrolSection({ navigate, anchorRef }: {
  navigate: ReturnType<typeof import('react-router-dom').useNavigate>;
  anchorRef: React.RefObject<HTMLDivElement>;
}) {
  const list = buildJadwalKontrolList();
  return (
    <section ref={anchorRef}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <SectionLabel title="Jadwal Kontrol" />
        <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>{list.length} terjadwal</span>
      </div>
      {list.length === 0 ? (
        <div style={{
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
          padding: '22px 20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Tidak ada kontrol yang terjadwal.</div>
        </div>
      ) : (
        <div style={{
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
        }}>
          {list.map((r, idx) => (
            <button
              key={r.tindakanSesiId}
              type="button"
              onClick={() => navigate(`/kesehatan-hewan/riwayat/${r.tindakanSesiId}`)}
              style={{
                width: '100%', textAlign: 'left', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                borderBottom: idx === list.length - 1 ? 'none' : '1px solid var(--color-border)',
                background: 'none', border: 'none',
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{r.subjectIcon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{r.subjectLabel}</div>
                {r.jadwal.catatan && (
                  <div style={{ fontSize: 10.5, color: 'var(--color-muted)', marginTop: 1 }}>{r.jadwal.catatan}</div>
                )}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', flexShrink: 0, textAlign: 'right' }}>
                {formatDateShortKH(r.jadwal.tanggal)}<br />
                <span style={{ fontWeight: 600, color: 'var(--color-muted)' }}>{r.jadwal.jam}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Penggunaan Obat (KH-010) ─────────────────────────────────────────────────
// Read-only summary sourced strictly from Riwayat Kesehatan (KH-006) + Stock
// Obat's master categorization (obatData.ts kategoriSlug) — never a new data
// mutation path.

type PenggunaanObatData = {
  totalPenggunaan: number;
  obatSedangDigunakan: number;
  antibiotikAktif: number;
  antiparasitAktif: number;
};

function computePenggunaanObat(): PenggunaanObatData {
  const records = getRiwayatKesehatanList();

  const aktifSesiIds = new Set(
    TINDAKAN_SESI_DB.filter((s) => getKasusStatus(s.id) === 'Aktif').map((s) => s.id),
  );

  const obatSedangDigunakanSet = new Set<string>();
  let antibiotikAktif = 0;
  let antiparasitAktif = 0;

  for (const r of records) {
    if (!aktifSesiIds.has(r.tindakanSesiId)) continue;
    obatSedangDigunakanSet.add(r.namaProduk);
    const master = getObatByUuid(r.masterObatUuid);
    if (master?.kategoriSlug === 'antibiotik') antibiotikAktif++;
    else if (master?.kategoriSlug === 'antiparasit') antiparasitAktif++;
  }

  return {
    totalPenggunaan: records.length,
    obatSedangDigunakan: obatSedangDigunakanSet.size,
    antibiotikAktif,
    antiparasitAktif,
  };
}

function PenggunaanObatSection() {
  const data = computePenggunaanObat();
  const items: Array<{ label: string; value: number; icon: string; color: string; bg: string }> = [
    { label: 'Total Penggunaan Obat',   value: data.totalPenggunaan,      icon: '📦', color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
    { label: 'Obat Sedang Digunakan',   value: data.obatSedangDigunakan,  icon: '💊', color: '#1565c0',              bg: '#e3f2fd' },
    { label: 'Antibiotik Aktif',        value: data.antibiotikAktif,      icon: '🧫', color: '#c62828',              bg: '#ffebee' },
    { label: 'Antiparasit Aktif',       value: data.antiparasitAktif,     icon: '🪱', color: '#8e24aa',              bg: '#f3e5f5' },
  ];
  return (
    <section>
      <SectionLabel title="Penggunaan Obat" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {items.map(({ label, value, icon, color, bg }) => (
          <div key={label} style={{
            background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 13 }}>{icon}</span>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.2, lineHeight: 1.3 }}>{label}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color, background: bg, borderRadius: 'var(--radius-sm)', padding: '3px 9px', display: 'inline-block' }}>
              {value}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 6, fontSize: 10, color: 'var(--color-muted)' }}>
        Data dibaca langsung dari Riwayat Kesehatan &amp; Stok Obat.
      </div>
    </section>
  );
}

// ─── Statistik (KH-010) ───────────────────────────────────────────────────────
// Simple inline-bar visualizations, matching the app's existing card language
// (no chart library installed — CatatBobot itself has no shared chart widget).

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text)' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{value}</span>
      </div>
      <div style={{ height: 6, background: 'var(--color-bg)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4 }} />
      </div>
    </div>
  );
}

function computeStatistik() {
  // Pemeriksaan per bulan (last 6 bulan)
  const pemeriksaan = getPemeriksaanList();
  const bulanLabels = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const perBulanMap = new Map<string, number>();
  for (const p of pemeriksaan) {
    const key = p.tanggal.slice(0, 7); // YYYY-MM
    perBulanMap.set(key, (perBulanMap.get(key) ?? 0) + 1);
  }
  const perBulan = Array.from(perBulanMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([key, count]) => {
      const [, m] = key.split('-');
      return { label: bulanLabels[parseInt(m, 10) - 1] ?? key, count };
    });

  // Penyakit terbanyak
  const diagnosaList = getDiagnosaList();
  const penyakitMap = new Map<string, number>();
  for (const d of diagnosaList) {
    const label = d.sumber === 'master_penyakit' ? (d.namaPenyakit ?? null) : (d.namaDiagnosa ?? null);
    if (!label) continue;
    penyakitMap.set(label, (penyakitMap.get(label) ?? 0) + 1);
  }
  const penyakitTerbanyak = Array.from(penyakitMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }));

  // Status kasus
  let aktif = 0, selesai = 0, ditutup = 0;
  for (const sesi of TINDAKAN_SESI_DB) {
    const s = getKasusStatus(sesi.id);
    if (s === 'Aktif') aktif++; else if (s === 'Selesai') selesai++; else ditutup++;
  }
  const statusKasus = [
    { label: 'Aktif',   count: aktif,   color: '#e65100' },
    { label: 'Selesai', count: selesai, color: '#2e7d32' },
    { label: 'Ditutup', count: ditutup, color: '#c62828' },
  ];

  // Tren kesembuhan: % Selesai dari total kasus yang sudah tertutup (Selesai+Ditutup)
  const totalTertutup = selesai + ditutup;
  const trenKesembuhan = totalTertutup > 0 ? Math.round((selesai / totalTertutup) * 100) : 0;

  return { perBulan, penyakitTerbanyak, statusKasus, trenKesembuhan, totalKasus: TINDAKAN_SESI_DB.length };
}

function StatistikSection() {
  const stat = computeStatistik();
  const maxPerBulan = Math.max(1, ...stat.perBulan.map((b) => b.count));
  const maxPenyakit = Math.max(1, ...stat.penyakitTerbanyak.map((p) => p.count));
  const maxStatus = Math.max(1, ...stat.statusKasus.map((s) => s.count));

  if (stat.totalKasus === 0) {
    return (
      <section>
        <SectionLabel title="Statistik" />
        <div style={{
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
          padding: '22px 20px', textAlign: 'center', color: 'var(--color-muted)', fontSize: 12,
        }}>
          Statistik akan tersedia setelah ada data pemeriksaan.
        </div>
      </section>
    );
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionLabel title="Statistik" />

      <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 10, letterSpacing: 0.3 }}>📊 Pemeriksaan per Bulan</div>
        {stat.perBulan.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Belum ada data.</div>
        ) : (
          stat.perBulan.map((b) => <BarRow key={b.label} label={b.label} value={b.count} max={maxPerBulan} color="var(--color-primary)" />)
        )}
      </div>

      <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 10, letterSpacing: 0.3 }}>🦠 Penyakit Terbanyak</div>
        {stat.penyakitTerbanyak.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Belum ada diagnosa tercatat.</div>
        ) : (
          stat.penyakitTerbanyak.map((p) => <BarRow key={p.label} label={p.label} value={p.count} max={maxPenyakit} color="#8e24aa" />)
        )}
      </div>

      <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 10, letterSpacing: 0.3 }}>📈 Status Kasus</div>
        {stat.statusKasus.map((s) => <BarRow key={s.label} label={s.label} value={s.count} max={maxStatus} color={s.color} />)}
      </div>

      <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 22 }}>📉</div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.3 }}>Tren Kesembuhan</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#2e7d32' }}>{stat.trenKesembuhan}%</div>
          <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>dari kasus yang sudah tertutup</div>
        </div>
      </div>
    </section>
  );
}

// ─── Quick Action Shortcuts (KH-010) ──────────────────────────────────────────
// Reuses existing KH-002/KH-007/KH-008 routes and in-page anchors — no new
// Quick Action is added to the Livestock page.

function QuickActionBar({ navigate, onScrollKontrol, onScrollKasusAktif }: {
  navigate: ReturnType<typeof import('react-router-dom').useNavigate>;
  onScrollKontrol: () => void;
  onScrollKasusAktif: () => void;
}) {
  const actions = [
    { label: 'Pemeriksaan Baru', icon: '➕', onClick: () => navigate('/kesehatan-hewan/pemeriksaan/baru') },
    { label: 'Riwayat',          icon: '📜', onClick: () => navigate('/kesehatan-hewan/riwayat') },
    { label: 'Kontrol',          icon: '📅', onClick: onScrollKontrol },
    { label: 'Kasus Aktif',      icon: '🔄', onClick: onScrollKasusAktif },
  ];
  return (
    <section>
      <SectionLabel title="Quick Action" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              padding: '12px 4px',
              background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 18 }}>{a.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text)', textAlign: 'center', lineHeight: 1.25 }}>{a.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

// ─── Dashboard Empty State (KH-010) ───────────────────────────────────────────

function DashboardEmptyState() {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
      padding: '36px 20px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>🩺</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
        Belum ada riwayat kesehatan.
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
        Kasus, jadwal kontrol, dan penggunaan obat akan tampil di sini setelah pemeriksaan pertama dicatat.
      </div>
    </div>
  );
}

// ─── Legacy empty state (kept for other usages) ───────────────────────────────
function EmptyState({ hasFilters, onReset }: { hasFilters: boolean; onReset: () => void }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      padding: '32px 20px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>🩺</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
        {hasFilters ? 'Tidak ada hasil' : 'Belum ada riwayat kesehatan.'}
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: hasFilters ? 16 : 0 }}>
        {hasFilters
          ? 'Coba ubah filter atau kata kunci pencarian.'
          : 'Riwayat pemeriksaan akan muncul setelah catatan pertama dibuat.'}
      </div>
      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          style={{
            padding: '8px 20px', fontSize: 12, fontWeight: 700,
            background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--color-text)',
          }}
        >
          Reset Filter
        </button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KesehatanHewan() {
  const navigate = useNavigate();

  // Populates LIVESTOCK_DB and BATCH_DB from Supabase so deep-link /
  // hard-refresh navigations get live data instead of an empty in-memory store.
  const { isLoading, error, refresh } = useLivestock();
  // m-004 fix: populate PEMERIKSAAN_DB from Supabase so computeRingkasan()
  // returns correct counts on hard-refresh instead of reading an empty store.
  useHealth();
  const [tick,        setTick]        = useState(0);        // MIN-003: forces AI re-evaluation
  const [mode,        setMode]        = useState<Mode>('individu');
  const [query,       setQuery]       = useState('');
  const debouncedQuery                = useDebounce(query, 300);
  const [filters,     setFilters]     = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen,  setFilterOpen]  = useState(false);

  // KH-010: Quick Action anchors for sections without a dedicated list route.
  const kontrolAnchorRef     = useRef<HTMLDivElement>(null);
  const kasusAktifAnchorRef  = useRef<HTMLDivElement>(null);
  const scrollToRef = (ref: React.RefObject<HTMLDivElement>) =>
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // AI Insight — recomputed when tick changes (MIN-003: consistent with Batch/Pakan pattern).
  const report = useMemo(() => generateInsights(), [tick]);

  // Live data — read directly each render so mutations are always reflected.
  // Must be declared before the isLoading/error guards so the useMemo calls
  // that depend on them are not placed after a conditional return (Rules of Hooks).
  const ALL_INDIVIDU = buildIndividuList();
  const ALL_BATCH    = buildBatchList();

  // ── Filter logic ────────────────────────────────────────────────────────────

  const filteredIndividu = useMemo(() => {
    return ALL_INDIVIDU.filter((item) => {
      if (filters.jenis !== 'Semua Jenis' && item.type !== filters.jenis) return false;
      if (filters.status !== 'Semua Status' && item.locationStatus !== filters.status) return false;
      if (filters.blok    && item.blok    !== filters.blok)    return false;
      if (filters.kandang && item.kandang !== filters.kandang) return false;
      if (filters.lokasiLuar && item.lokasiLuar !== filters.lokasiLuar) return false;
      if (filters.batchId && item.batchId !== filters.batchId) return false;
      if (debouncedQuery) {
        const q = debouncedQuery.toLowerCase();
        if (!item.id.toLowerCase().includes(q) && !(item.name ?? '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, debouncedQuery, ALL_INDIVIDU.length]);

  const filteredBatch = useMemo(() => {
    return ALL_BATCH.filter((item) => {
      if (filters.jenis !== 'Semua Jenis' && item.type !== filters.jenis) return false;
      if (filters.status !== 'Semua Status' && !item.members.some((m) => m.locationStatus === filters.status)) return false;
      if (filters.blok    && !item.members.some((m) => m.blok    === filters.blok))    return false;
      if (filters.kandang && !item.members.some((m) => m.kandang === filters.kandang)) return false;
      if (filters.lokasiLuar && !item.members.some((m) => m.lokasiLuar === filters.lokasiLuar)) return false;
      if (debouncedQuery) {
        const q = debouncedQuery.toLowerCase();
        if (!item.id.toLowerCase().includes(q) && !(item.name ?? '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, debouncedQuery, ALL_BATCH.length]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 36 }}>⏳</span>
        <div style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 600 }}>Memuat data kesehatan hewan...</div>
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

  // KH-010: dashboard-wide empty state when there is no health data at all yet.
  const hasAnyPemeriksaan = getPemeriksaanList().length > 0;

  const activeFilterCount = [
    filters.jenis !== 'Semua Jenis',
    filters.status !== 'Semua Status',
    !!filters.blok,
    !!filters.kandang,
    !!filters.lokasiLuar,
    !!filters.batchId,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0 || !!query;

  function handleModeChange(m: Mode) {
    setMode(m);
  }

  function handleResetFilters() {
    setQuery('');
    setFilters(DEFAULT_FILTERS);
  }

  function handleRemoveChip(key: keyof Filters) {
    const reset: Partial<Filters> = {};
    if      (key === 'jenis')      { reset.jenis = 'Semua Jenis'; }
    else if (key === 'status')     { reset.status = 'Semua Status'; reset.blok = ''; reset.kandang = ''; reset.lokasiLuar = ''; }
    else if (key === 'blok')       { reset.blok = ''; }
    else if (key === 'kandang')    { reset.kandang = ''; }
    else if (key === 'lokasiLuar') { reset.lokasiLuar = ''; }
    else if (key === 'batchId')    { reset.batchId = ''; }
    setFilters((f) => ({ ...f, ...reset }));
  }

  const currentList = mode === 'individu' ? filteredIndividu : filteredBatch;
  const isEmpty     = currentList.length === 0;

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* ── AI Insight ─────────────────────────────────────────────────── */}
      <AiInsightCard report={report} />

      {/* ── Ringkasan ──────────────────────────────────────────────────── */}
      <RingkasanCards />

      {/* ── KH-010 Dashboard sections ──────────────────────────────────── */}
      {hasAnyPemeriksaan ? (
        <>
          <KasusAktifSection navigate={navigate} anchorRef={kasusAktifAnchorRef} />
          <JadwalKontrolSection navigate={navigate} anchorRef={kontrolAnchorRef} />
          <PenggunaanObatSection />
          <StatistikSection />
        </>
      ) : (
        <DashboardEmptyState />
      )}

      {/* ── Quick Action ───────────────────────────────────────────────── */}
      <QuickActionBar
        navigate={navigate}
        onScrollKontrol={() => scrollToRef(kontrolAnchorRef)}
        onScrollKasusAktif={() => scrollToRef(kasusAktifAnchorRef)}
      />

      {/* ── Mode ───────────────────────────────────────────────────────── */}
      <section>
        <SectionLabel title="Mode" />
        <SegmentedControl value={mode} onChange={handleModeChange} />
      </section>

      {/* ── Search & Filter ────────────────────────────────────────────── */}
      <section>
        <SectionLabel title="Cari &amp; Filter" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Search */}
          <div style={{
            flex: 1,
            display: 'flex', alignItems: 'center', gap: 8,
            border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)', padding: '10px 12px',
          }}>
            <span style={{ fontSize: 15, color: 'var(--color-muted)', flexShrink: 0 }}>🔍</span>
            <input
              type="text"
              placeholder={mode === 'individu' ? 'Cari ID ternak atau nama...' : 'Cari ID batch atau nama...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                border: 'none', outline: 'none', flex: 1,
                fontSize: 13, color: 'var(--color-text)', background: 'transparent',
              }}
            />
            {query && (
              <button type="button" onClick={() => setQuery('')}
                style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                ✕
              </button>
            )}
          </div>

          {/* Filter button */}
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            style={{
              flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 14px',
              background: activeFilterCount > 0 ? 'var(--color-primary)' : 'var(--color-surface)',
              border: activeFilterCount > 0 ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13, fontWeight: 700,
              color: activeFilterCount > 0 ? '#fff' : 'var(--color-text)',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 14 }}>⚙️</span>
            Filter
            {activeFilterCount > 0 && (
              <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 20, padding: '1px 6px', fontSize: 11, fontWeight: 800 }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Active filter chips */}
        <FilterChips filters={filters} mode={mode} onRemove={handleRemoveChip} />

        {/* Reset all */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              marginTop: 8,
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11.5, fontWeight: 700, color: 'var(--color-muted)', padding: 0,
            }}
          >
            ↺ Reset semua
          </button>
        )}
      </section>

      {/* ── Daftar Riwayat Kesehatan ─────────────────────────────────────── */}
      <RiwayatSection navigate={navigate} mode={mode} query={query} />

      {/* ── Filter Sheet ────────────────────────────────────────────────── */}
      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        mode={mode}
        filters={filters}
        onChangeFilters={setFilters}
        onReset={handleResetFilters}
        individuList={ALL_INDIVIDU}
        batchList={ALL_BATCH}
      />

      {/* ── FAB: Pemeriksaan Baru (KH-002) ──────────────────────────────── */}
      <button
        type="button"
        onClick={() => navigate('/kesehatan-hewan/pemeriksaan/baru')}
        aria-label="Pemeriksaan Baru"
        style={{
          position: 'fixed', bottom: 24, right: 16,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '13px 18px',
          borderRadius: 28,
          background: 'var(--color-primary)', color: '#fff',
          boxShadow: 'var(--shadow-fab)',
          border: 'none', cursor: 'pointer', zIndex: 50,
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
        <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>Pemeriksaan Baru</span>
      </button>
    </div>
  );
}
