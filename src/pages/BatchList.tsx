import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLivestock } from '../hooks/useLivestock';
import { useBatch } from '../hooks/useBatch';
import { HeaderActionPortal } from '../components/TopAppBar';
import {
  BATCH_DB,
  MEMBERSHIP_DB,
  getActiveBatchMemberships,
  type BatchRecord,
  type BatchStatus,
} from '../data/batchData';
import { LIVESTOCK_DB } from '../data/livestockData';
import { getLivestockStatus } from '../data/transferData';
import {
  generateBatchInsights,
  type InsightLevel as BtInsightLevel,
  type InsightCategory as BtInsightCategory,
  type InsightItem as BtInsightItem,
} from '../data/aiInsightBatchData';
import {
  getBatchAnalytics,
  getBatchGrowthTrend,
  getOperationTypeDataset,
  getMembersPerBatchDataset,
} from '../data/batchAnalyticsData';
import {
  getAllBatchHistory,
  HISTORY_EVENT_LABELS,
  HISTORY_EVENT_ICONS,
  type BatchHistoryEvent,
} from '../data/batchHistoryData';

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = 'individu' | 'batch';

// ─── Display Config ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  Aktif:      { bg: '#e8f5e9', color: '#2e7d32' },
  Selesai:    { bg: '#eceff1', color: '#546e7a' },
  Dibatalkan: { bg: '#ffebee', color: '#c62828' },
  Diarsipkan: { bg: '#f3e5f5', color: '#6a1b9a' },
};

const PAGE_SIZE = 5;

// ─── Shared UI Primitives ─────────────────────────────────────────────────────

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

// ─── AI Insight ───────────────────────────────────────────────────────────────
// Rule-based, read-only. Mirrors Mutasi.tsx AiInsightCard pattern 1:1.

const BT_LEVEL_CFG: Record<BtInsightLevel, { border: string; bg: string; color: string; badge: string }> = {
  critical: { border: '#c62828', bg: '#fff5f5', color: '#c62828', badge: '🔴 Kritis' },
  warning:  { border: '#e65100', bg: '#fff8f0', color: '#e65100', badge: '🟠 Peringatan' },
  info:     { border: '#1565c0', bg: '#f0f4ff', color: '#1565c0', badge: '🔵 Info' },
};

const BT_CAT_LABELS: Record<BtInsightCategory, string> = {
  ringkasan:   '📊 Ringkasan',
  analisis:    '🔁 Analisis',
  peringatan:  '⚠️ Peringatan',
  rekomendasi: '💡 Rekomendasi',
  prediksi:    '📈 Prediksi',
};

function BtInsightItemRow({ item }: { item: BtInsightItem }) {
  const cfg = BT_LEVEL_CFG[item.level];
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

function AiInsightCard({ tick }: { tick: number }) {
  const report = useMemo(() => generateBatchInsights(), [tick]);
  const [selectedCat, setSelectedCat] = useState<BtInsightCategory | 'all'>('all');

  const categories = useMemo((): BtInsightCategory[] => {
    const seen = new Set<BtInsightCategory>();
    report.items.forEach((i) => seen.add(i.category));
    return Array.from(seen);
  }, [report.items]);

  const filteredItems = useMemo(
    () => selectedCat === 'all' ? report.items : report.items.filter((i) => i.category === selectedCat),
    [report.items, selectedCat],
  );

  const topLevel: BtInsightLevel = report.items.some((i) => i.level === 'critical')
    ? 'critical'
    : report.items.some((i) => i.level === 'warning')
      ? 'warning'
      : 'info';
  const topCfg = BT_LEVEL_CFG[topLevel];

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
          <span style={{ fontSize: 16 }}>📦</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Insight Batch</span>
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
                  {BT_CAT_LABELS[cat]} ({count})
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
            filteredItems.map((item) => <BtInsightItemRow key={item.id} item={item} />)
          )}
        </div>

        {/* AI Constitution footer */}
        <div style={{ padding: '10px 14px 12px', borderTop: '1px solid var(--color-border)', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontSize: 10, color: 'var(--color-muted)', textAlign: 'right' }}>
            🤖 Dianalisis {analyzedAt}
          </div>
          <div style={{ fontSize: 9.5, color: 'var(--color-muted)', textAlign: 'right' }}>
            Sumber: {report.dataSource.length} modul batch · Status: {report.confidenceStatus} ({report.version})
          </div>
        </div>
      </Card>
    </section>
  );
}

// ─── Summary ──────────────────────────────────────────────────────────────────
// Calculated from live batch data. No hardcoded values.

function SummaryGrid() {
  const batches = Object.values(BATCH_DB);
  const total      = batches.length;
  const aktif      = batches.filter((b) => b.status === 'Aktif').length;
  const tertutup   = batches.filter((b) => b.status === 'Selesai' || b.status === 'Dibatalkan').length;
  const totalLivestock = MEMBERSHIP_DB.filter((m) => m.status === 'Aktif').length;

  const cards = [
    { icon: '📋', label: 'Total Batch',    value: total,         color: '#1b7a43', bg: '#e8f5ee' },
    { icon: '✅', label: 'Batch Aktif',    value: aktif,         color: '#2e7d32', bg: '#e8f5e9' },
    { icon: '📦', label: 'Batch Tertutup', value: tertutup,      color: '#546e7a', bg: '#eceff1' },
    { icon: '🐄', label: 'Total Ternak',   value: totalLivestock, color: '#0277bd', bg: '#e3f2fd' },
  ];

  return (
    <section>
      <SectionLabel title="Summary" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {cards.map((card) => (
          <div
            key={card.label}
            style={{
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-sm)',
              padding: '14px 14px 12px',
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 'var(--radius-sm)',
              background: card.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, marginBottom: 8,
            }}>
              {card.icon}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>
              {card.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginTop: 3 }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Mode ─────────────────────────────────────────────────────────────────────
// Reuses SegmentedControl pattern from Mutasi.tsx.

function SegmentedControl({ value, onChange }: { value: Mode; onChange: (v: Mode) => void }) {
  return (
    <div style={{
      display: 'flex',
      background: 'var(--color-bg)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: 3, gap: 3,
    }}>
      {(['individu', 'batch'] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          style={{
            flex: 1, padding: '9px',
            border: 'none', borderRadius: 'calc(var(--radius-md) - 3px)',
            background: value === m ? 'var(--color-primary)' : 'transparent',
            color: value === m ? '#fff' : 'var(--color-muted)',
            fontSize: 13, fontWeight: 700,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {m === 'individu' ? 'Individu' : 'Batch'}
        </button>
      ))}
    </div>
  );
}

// ─── Search & Filter ──────────────────────────────────────────────────────────
// Supports: Search, Batch Name (via search), Location (placeholder), Status.

const LOKASI_OPTIONS  = ['Semua Lokasi', 'Di Kandang', 'Luar Kandang'];
const STATUS_OPTIONS  = ['Semua Status', 'Aktif', 'Selesai', 'Dibatalkan', 'Diarsipkan'];

function SelectRow({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 6, letterSpacing: 0.3 }}>
        {label}
      </div>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%', padding: '10px 32px 10px 12px',
            border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)', color: 'var(--color-text)',
            fontSize: 13, fontWeight: 600,
            appearance: 'none', outline: 'none', cursor: 'pointer',
          }}
        >
          {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <span style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          fontSize: 11, color: 'var(--color-muted)', pointerEvents: 'none',
        }}>▾</span>
      </div>
    </div>
  );
}

function SearchFilterSection({
  mode, query, onQueryChange, lokasi, onLokasiChange, status, onStatusChange,
}: {
  mode: Mode;
  query: string;
  onQueryChange: (v: string) => void;
  lokasi: string;
  onLokasiChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
}) {
  return (
    <section>
      <SectionLabel title="Pencarian & Filter" />

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
        background: 'var(--color-surface)', padding: '10px 12px',
        marginBottom: 12,
      }}>
        <span style={{ fontSize: 15, color: 'var(--color-muted)', flexShrink: 0 }}>🔍</span>
        <input
          type="text"
          placeholder={mode === 'individu' ? 'Cari ID ternak atau nama...' : 'Cari nama atau kode batch...'}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          style={{
            border: 'none', outline: 'none', flex: 1,
            fontSize: 13, color: 'var(--color-text)', background: 'transparent',
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: 0, flexShrink: 0 }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter dropdowns */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SelectRow label="Lokasi" value={lokasi} options={LOKASI_OPTIONS} onChange={onLokasiChange} />
        <SelectRow label="Status" value={status} options={STATUS_OPTIONS} onChange={onStatusChange} />
      </div>
    </section>
  );
}

// ─── Batch Card ───────────────────────────────────────────────────────────────
// Displays: Batch Name, Batch Code, Total Livestock, Current Location, Status, Last Updated.

function deriveBatchLocation(batchId: string): string {
  const members = getActiveBatchMemberships(batchId);
  if (members.length === 0) return '—';
  let diKandang = 0;
  let luarKandang = 0;
  for (const m of members) {
    const loc = getLivestockStatus(m.livestockId);
    if (loc === 'Di Kandang') diKandang++;
    else if (loc === 'Luar Kandang') luarKandang++;
  }
  if (diKandang > 0 && luarKandang > 0) return `Di Kandang ${diKandang}, Luar ${luarKandang}`;
  if (diKandang > 0) return `Di Kandang ${diKandang}`;
  if (luarKandang > 0) return `Luar Kandang ${luarKandang}`;
  return '—';
}

function BatchCard({ batch, memberCount, onClick }: {
  batch: BatchRecord;
  memberCount: number;
  onClick: () => void;
}) {
  const status   = STATUS_CONFIG[batch.status] ?? STATUS_CONFIG['Aktif'];
  const location = deriveBatchLocation(batch.id);

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '13px 14px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Livestock type icon */}
        <div style={{
          width: 50, height: 50, borderRadius: 'var(--radius-sm)', flexShrink: 0,
          background: batch.livestockTypeBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28,
        }}>
          {batch.livestockIcon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Batch Name + Status badge */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
                {batch.name ?? (
                  <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{batch.id}</span>
                )}
              </div>
              {/* Batch Code */}
              <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace', letterSpacing: 0.4, marginTop: 1 }}>
                {batch.id}
              </div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, flexShrink: 0,
              color: status.color, background: status.bg,
              borderRadius: 20, padding: '3px 9px',
            }}>
              {batch.status}
            </span>
          </div>

          {/* Description */}
          {batch.description && (
            <div style={{
              fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.45, marginBottom: 4,
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
            }}>
              {batch.description}
            </div>
          )}

          {/* Meta row: Total Livestock · Location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)' }}>
              {memberCount}{' '}
              <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-muted)' }}>ekor aktif</span>
            </span>
            <span style={{ fontSize: 10, color: 'var(--color-border)' }}>·</span>
            <span style={{ fontSize: 11, color: 'var(--color-muted)', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              📍 {location}
            </span>
            <span style={{ fontSize: 16, color: 'var(--color-muted)', fontWeight: 300, flexShrink: 0 }}>›</span>
          </div>

          {/* Last Updated */}
          <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>
            Diperbarui: {batch.updatedDate}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Individu View ────────────────────────────────────────────────────────────
// Shows individual livestock that are currently in any active batch.

function IndividuCard({ membershipId, livestockId, batchId, joinDate }: {
  membershipId: string; livestockId: string; batchId: string; joinDate: string;
}) {
  const navigate = useNavigate();
  const lv    = LIVESTOCK_DB[livestockId];
  const batch = BATCH_DB[batchId];

  if (!lv || !batch) return null;

  const locStatus = getLivestockStatus(livestockId);
  const locCfg = locStatus === 'Di Kandang'
    ? { color: '#2e7d32', bg: '#e8f5e9' }
    : locStatus === 'Luar Kandang'
    ? { color: '#f57f17', bg: '#fff8e1' }
    : { color: '#546e7a', bg: '#eceff1' };

  return (
    <div
      onClick={() => navigate(`/batch/${batchId}`)}
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        padding: '12px 14px',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 'var(--radius-sm)', flexShrink: 0,
        background: lv.typeBg ?? '#e8f0e8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24,
      }}>
        {lv.typeIcon ?? '🐄'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
              {lv.name ?? lv.id}
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace', marginTop: 1 }}>{lv.id}</div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, flexShrink: 0,
            color: locCfg.color, background: locCfg.bg,
            borderRadius: 20, padding: '2px 8px',
          }}>
            {locStatus}
          </span>
        </div>
        <div style={{ marginTop: 4, fontSize: 11, color: 'var(--color-muted)' }}>
          Batch: <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{batch.name ?? batch.id}</span>
          {' · '}Bergabung: {joinDate}
        </div>
      </div>
    </div>
  );
}

// ─── Individu Section ─────────────────────────────────────────────────────────

function IndividuSection({ query, status, lokasi }: { query: string; status: string; lokasi: string }) {
  const navigate = useNavigate();

  const activeMembers = MEMBERSHIP_DB.filter((m) => m.status === 'Aktif');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activeMembers.filter((m) => {
      const lv    = LIVESTOCK_DB[m.livestockId];
      const batch = BATCH_DB[m.batchId];
      if (!lv || !batch) return false;

      const locStatus = getLivestockStatus(m.livestockId);

      // Status filter applies to livestock location
      if (status !== 'Semua Status') {
        if (status === 'Di Kandang' && locStatus !== 'Di Kandang') return false;
        if (status === 'Luar Kandang' && locStatus !== 'Luar Kandang') return false;
      }

      // Lokasi filter — direct location match
      if (lokasi !== 'Semua Lokasi' && locStatus !== lokasi) return false;

      if (!q) return true;
      return (
        lv.id.toLowerCase().includes(q) ||
        (lv.name?.toLowerCase().includes(q) ?? false) ||
        batch.id.toLowerCase().includes(q) ||
        (batch.name?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [query, status, lokasi]);

  if (filtered.length === 0) {
    const hasFilter = query.trim() !== '' || status !== 'Semua Status';
    return (
      <Card style={{ padding: '32px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          {hasFilter ? 'Tidak Ada Ternak Ditemukan' : 'Belum Ada Anggota Batch'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
          {hasFilter
            ? 'Coba ubah filter atau kata kunci pencarian.'
            : 'Belum ada ternak yang terdaftar dalam batch manapun.'}
        </div>
        {!hasFilter && (
          <button
            type="button"
            onClick={() => navigate('/batch/add')}
            style={{
              marginTop: 12, padding: '10px 20px',
              background: 'var(--color-primary)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-sm)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            + Buat Batch
          </button>
        )}
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {filtered.map((m) => (
        <IndividuCard
          key={m.id}
          membershipId={m.id}
          livestockId={m.livestockId}
          batchId={m.batchId}
          joinDate={m.joinDate}
        />
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function BatchIllustration() {
  return (
    <svg width="110" height="90" viewBox="0 0 120 100" fill="none" aria-hidden="true">
      <rect x="10" y="30" width="40" height="50" rx="5" fill="#e8f0e8" />
      <rect x="18" y="38" width="24" height="6" rx="2" fill="#c8d8c8" />
      <rect x="18" y="50" width="18" height="4" rx="2" fill="#c8d8c8" />
      <rect x="18" y="60" width="20" height="4" rx="2" fill="#c8d8c8" />
      <rect x="30" y="20" width="40" height="50" rx="5" fill="#d4e4d4" />
      <rect x="38" y="28" width="24" height="6" rx="2" fill="#b4c8b4" />
      <rect x="38" y="40" width="18" height="4" rx="2" fill="#b4c8b4" />
      <rect x="38" y="50" width="20" height="4" rx="2" fill="#b4c8b4" />
      <rect x="50" y="10" width="60" height="70" rx="7" fill="#f0f4f0" stroke="#d4dcd4" strokeWidth="1.5" />
      <rect x="62" y="22" width="36" height="8" rx="3" fill="#c8d8c8" />
      <rect x="62" y="36" width="28" height="5" rx="2.5" fill="#d8e4d8" />
      <rect x="62" y="47" width="32" height="5" rx="2.5" fill="#d8e4d8" />
      <rect x="62" y="58" width="24" height="5" rx="2.5" fill="#d8e4d8" />
    </svg>
  );
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  const navigate = useNavigate();
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '48px 24px', textAlign: 'center', gap: 12,
    }}>
      <BatchIllustration />
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginTop: 8 }}>
        {hasFilter ? 'Tidak Ada Batch Ditemukan' : 'Belum Ada Batch'}
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6, maxWidth: 240 }}>
        {hasFilter
          ? 'Coba ubah filter atau kata kunci pencarian.'
          : 'Belum ada batch yang dibuat. Buat batch pertama untuk mulai mengelola ternak secara berkelompok.'}
      </div>
      {!hasFilter && (
        <button
          type="button"
          onClick={() => navigate('/batch/add')}
          style={{
            marginTop: 8, padding: '11px 24px',
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-sm)',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          + Buat Batch
        </button>
      )}
    </div>
  );
}

// ─── Batch List Section ───────────────────────────────────────────────────────

function BatchListSection({
  query, status, lokasi, tick,
}: {
  query: string; status: string; lokasi: string; tick: number;
}) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const allBatches = Object.values(BATCH_DB);

  // Pre-compute active member counts (not memoized — reads mutable MEMBERSHIP_DB)
  const memberCounts: Record<string, number> = {};
  for (const b of allBatches) {
    memberCounts[b.id] = getActiveBatchMemberships(b.id).length;
  }

  // Active batches for the list section (history has closed ones)
  const ACTIVE_STATUSES: BatchStatus[] = ['Aktif'];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allBatches
      .filter((b) => {
        // In the list section show only active batches; history handles closed ones
        const matchActive = ACTIVE_STATUSES.includes(b.status as BatchStatus);
        const matchStatus = status === 'Semua Status' || b.status === status;
        const matchSearch = !q || (b.name?.toLowerCase().includes(q) ?? false) || b.id.toLowerCase().includes(q);
        // Lokasi filter: match batches that have ≥1 member at the selected location
        let matchLokasi = true;
        if (lokasi !== 'Semua Lokasi') {
          const members = getActiveBatchMemberships(b.id);
          matchLokasi = members.some((m) => getLivestockStatus(m.livestockId) === lokasi);
        }
        return matchActive && matchStatus && matchSearch && matchLokasi;
      })
      .sort((a, b) => (a.updatedDate < b.updatedDate ? 1 : -1));
  }, [allBatches, query, status, lokasi]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hasFilter = query.trim() !== '' || status !== 'Semua Status';

  // Reset page when filters change
  useMemo(() => { setPage(1); }, [query, status]);

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <SectionLabel title={`Daftar Batch (${filtered.length})`} />
        <button
          type="button"
          onClick={() => navigate('/batch/add')}
          style={{
            padding: '6px 14px', fontSize: 12, fontWeight: 700,
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          }}
        >
          + Buat Batch
        </button>
      </div>

      {paged.length === 0 ? (
        <EmptyState hasFilter={hasFilter} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {paged.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              memberCount={memberCounts[batch.id] ?? 0}
              onClick={() => navigate(`/batch/${batch.id}`)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 14 }}>
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              border: '1.5px solid var(--color-border)',
              background: safePage <= 1 ? 'var(--color-bg)' : 'var(--color-surface)',
              color: safePage <= 1 ? 'var(--color-border)' : 'var(--color-text)',
              fontSize: 14, cursor: safePage <= 1 ? 'default' : 'pointer',
            }}
          >‹</button>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)' }}>
            Halaman {safePage} dari {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage(safePage + 1)}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              border: '1.5px solid var(--color-border)',
              background: safePage >= totalPages ? 'var(--color-bg)' : 'var(--color-surface)',
              color: safePage >= totalPages ? 'var(--color-border)' : 'var(--color-text)',
              fontSize: 14, cursor: safePage >= totalPages ? 'default' : 'pointer',
            }}
          >›</button>
        </div>
      )}
    </section>
  );
}

// ─── Batch History ─────────────────────────────────────────────────────────────
// Immutable. Shows closed batches (Selesai / Dibatalkan / Diarsipkan).
// Sorted: newest updatedDate → oldest.

const CLOSED_STATUSES: BatchStatus[] = ['Selesai', 'Dibatalkan', 'Diarsipkan'];

function BatchHistorySection({ query, status, tick }: { query: string; status: string; tick: number }) {
  const navigate = useNavigate();

  const allBatches = Object.values(BATCH_DB);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allBatches
      .filter((b) => {
        if (!CLOSED_STATUSES.includes(b.status as BatchStatus)) return false;
        if (status !== 'Semua Status' && b.status !== status) return false;
        if (q && !(b.name?.toLowerCase().includes(q) ?? false) && !b.id.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => (a.updatedDate < b.updatedDate ? 1 : -1));
  }, [allBatches, query, status]);

  return (
    <section>
      <SectionLabel title={`Riwayat Batch (${list.length})`} />

      {list.length === 0 ? (
        <Card style={{ padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
            Belum Ada Riwayat Batch
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Riwayat batch akan muncul di sini setelah ada batch yang diselesaikan atau diarsipkan.
          </div>
        </Card>
      ) : (
        <Card style={{ overflow: 'hidden' }}>
          {list.map((batch, i) => {
            const status = STATUS_CONFIG[batch.status] ?? STATUS_CONFIG['Selesai'];
            const memberTotal = MEMBERSHIP_DB.filter((m) => m.batchId === batch.id).length;
            return (
              <div
                key={batch.id}
                onClick={() => navigate(`/batch/${batch.id}`)}
                style={{
                  padding: '13px 14px',
                  borderBottom: i < list.length - 1 ? '1px solid var(--color-border)' : 'none',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 20 }}>{batch.livestockIcon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>
                        {batch.name ?? batch.id}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace' }}>
                        {batch.id}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--color-muted)', lineHeight: 1.6 }}>
                    {memberTotal} total anggota
                    {batch.finishedDate ? ` · Selesai: ${batch.finishedDate}` : ` · Diperbarui: ${batch.updatedDate}`}
                  </div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, flexShrink: 0,
                  color: status.color, background: status.bg,
                  borderRadius: 20, padding: '3px 8px',
                }}>
                  {batch.status}
                </span>
              </div>
            );
          })}
        </Card>
      )}
    </section>
  );
}

// ─── Tab Bar (BT-007) ────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'daftar';

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: '📊 Dashboard' },
    { key: 'daftar',    label: '📋 Daftar' },
  ];
  return (
    <div style={{ display: 'flex', borderBottom: '2px solid var(--color-border)' }}>
      {tabs.map(({ key, label }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            style={{
              flex: 1, padding: '11px 0',
              background: 'none', border: 'none',
              borderBottom: isActive ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
              marginBottom: -2,
              fontSize: 13, fontWeight: 700,
              color: isActive ? 'var(--color-primary)' : 'var(--color-muted)',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Dashboard: Summary Section ───────────────────────────────────────────────
// 6-stat grid sourced live from getBatchAnalytics(). READ ONLY.

function DashboardSummarySection() {
  const a = getBatchAnalytics();

  // Empty batch = active batch with 0 members
  const emptyBatchCount = Object.values(BATCH_DB).filter(
    (b) => b.status === 'Aktif' && getActiveBatchMemberships(b.id).length === 0,
  ).length;

  const stats = [
    { icon: '📋', label: 'Total Batch',       value: String(a.totalBatchCount),  color: '#1b7a43', bg: '#e8f5ee' },
    { icon: '✅', label: 'Batch Aktif',        value: String(a.activeBatchCount), color: '#2e7d32', bg: '#e8f5e9' },
    { icon: '🐄', label: 'Total Anggota',      value: String(a.totalActiveMembers), color: '#0277bd', bg: '#e3f2fd' },
    { icon: '📊', label: 'Rata-rata/Batch',    value: `${a.averageMembersPerActiveBatch.toFixed(1)}`, color: '#6a1b9a', bg: '#f3e5f5' },
    { icon: '⚠️', label: 'Batch Kosong',       value: String(emptyBatchCount),   color: emptyBatchCount > 0 ? '#e65100' : '#546e7a', bg: emptyBatchCount > 0 ? '#fff8f0' : '#eceff1' },
    { icon: '📦', label: 'Batch Selesai',      value: String(a.closedBatchCount), color: '#546e7a', bg: '#eceff1' },
  ];

  return (
    <section>
      <SectionLabel title="Ringkasan" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {stats.map(({ icon, label, value, color, bg }) => (
          <div key={label} style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
            padding: '14px 14px 12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.3 }}>{label}</span>
            </div>
            <div style={{
              fontSize: 22, fontWeight: 800, color,
              background: bg, borderRadius: 'var(--radius-sm)',
              padding: '3px 10px', display: 'inline-block', minWidth: 36, textAlign: 'center',
            }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Dashboard: AI Insight (top 3) ───────────────────────────────────────────
// Reuses BT_LEVEL_CFG and BtInsightItemRow defined above. Max 3 cards.

function DashboardAiSection({ tick }: { tick: number }) {
  const report  = useMemo(() => generateBatchInsights(), [tick]);
  const top3    = report.items.slice(0, 3);
  const topLevel: BtInsightLevel = report.items.some((i) => i.level === 'critical')
    ? 'critical'
    : report.items.some((i) => i.level === 'warning') ? 'warning' : 'info';
  const topCfg = BT_LEVEL_CFG[topLevel];

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
          🤖 AI Insight
        </h2>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-muted)' }}>
          {report.confidenceStatus} · {report.version}
        </span>
      </div>
      <Card style={{ overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📦</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Insight Prioritas</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, background: topCfg.bg, color: topCfg.color, border: `1px solid ${topCfg.border}`, borderRadius: 20, padding: '2px 8px' }}>
            {topCfg.badge}
          </span>
        </div>
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {top3.length === 0 ? (
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '12px 0' }}>
              Belum cukup data untuk dianalisis.
            </p>
          ) : (
            top3.map((item) => <BtInsightItemRow key={item.id} item={item} />)
          )}
        </div>
        {report.items.length > 3 && (
          <div style={{ padding: '0 14px 10px', fontSize: 10, color: 'var(--color-muted)', textAlign: 'center' }}>
            +{report.items.length - 3} insight lainnya tersedia di tab Daftar.
          </div>
        )}
        <div style={{ padding: '8px 14px 10px', borderTop: '1px solid var(--color-border)', fontSize: 9.5, color: 'var(--color-muted)', textAlign: 'right' }}>
          Sumber: {report.dataSource.length} modul · Dianalisis {new Date(report.analyzedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </Card>
    </section>
  );
}

// ─── Dashboard: Active Batch Cards ────────────────────────────────────────────
// Compact batch cards with Name, Code, Location, Member Count, Status, Last Activity.

function DashboardActiveBatchSection({ tick }: { tick: number }) {
  const navigate   = useNavigate();
  const aktifList  = Object.values(BATCH_DB).filter((b) => b.status === 'Aktif');

  // Compute last activity date per batch from history (newest event per batch)
  const lastActivityByBatch = useMemo(() => {
    const history = getAllBatchHistory();
    const map = new Map<string, BatchHistoryEvent>();
    for (const ev of history) {
      if (!map.has(ev.batchId)) map.set(ev.batchId, ev);
    }
    return map;
  }, [tick]);

  if (aktifList.length === 0) {
    return (
      <section>
        <SectionLabel title="Batch Aktif" />
        <Card style={{ padding: '24px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Belum Ada Batch Aktif</div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>Buat batch pertama untuk mulai mengelola ternak.</div>
        </Card>
      </section>
    );
  }

  // Show up to 5 active batches, sorted by member count descending
  const sorted = aktifList
    .map((b) => ({ b, count: getActiveBatchMemberships(b.id).length }))
    .sort((x, y) => y.count - x.count)
    .slice(0, 5);

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <SectionLabel title={`Batch Aktif (${aktifList.length})`} />
        {aktifList.length > 5 && (
          <span style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600 }}>
            Menampilkan 5 dari {aktifList.length}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map(({ b, count }) => {
          const statusCfg = STATUS_CONFIG[b.status] ?? STATUS_CONFIG['Aktif'];
          const location  = deriveBatchLocation(b.id);
          const lastEv    = lastActivityByBatch.get(b.id);
          const lastLabel = lastEv
            ? `${HISTORY_EVENT_ICONS[lastEv.eventType]} ${HISTORY_EVENT_LABELS[lastEv.eventType]} · ${lastEv.displayDate}`
            : `Dibuat: ${b.createdDate}`;

          return (
            <div
              key={b.id}
              onClick={() => navigate(`/batch/${b.id}`)}
              style={{
                background: 'var(--color-surface)',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)',
                padding: '12px 14px',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              {/* Icon */}
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                background: b.livestockTypeBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
              }}>
                {b.livestockIcon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Name + Status */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
                      {b.name ?? b.id}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace', marginTop: 1 }}>{b.id}</div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, flexShrink: 0,
                    color: statusCfg.color, background: statusCfg.bg,
                    borderRadius: 20, padding: '2px 8px',
                  }}>{b.status}</span>
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)' }}>
                    {count} <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-muted)' }}>ekor aktif</span>
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--color-border)' }}>·</span>
                  <span style={{ fontSize: 11, color: 'var(--color-muted)', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    📍 {location}
                  </span>
                  <span style={{ fontSize: 16, color: 'var(--color-muted)', fontWeight: 300, flexShrink: 0 }}>›</span>
                </div>

                {/* Last activity */}
                <div style={{ fontSize: 10, color: 'var(--color-muted)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  ⏱ {lastLabel}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Dashboard: Recent Activity ───────────────────────────────────────────────
// Latest 5 history events from getAllBatchHistory(), newest → oldest.

function DashboardRecentActivitySection({ tick, navigate }: {
  tick: number;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const events = useMemo(() => getAllBatchHistory().slice(0, 5), [tick]);

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
          ⏱ Aktivitas Terbaru
        </h2>
        <button
          type="button"
          onClick={() => navigate('/batch/riwayat')}
          style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Lihat Semua →
        </button>
      </div>

      {events.length === 0 ? (
        <Card style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>📋</div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Belum ada aktivitas tercatat.</div>
        </Card>
      ) : (
        <Card style={{ overflow: 'hidden' }}>
          {events.map((ev, i) => {
            const batchLabel = BATCH_DB[ev.batchId]?.name ?? ev.batchId;
            return (
              <div
                key={ev.id}
                style={{
                  padding: '11px 14px',
                  borderBottom: i < events.length - 1 ? '1px solid var(--color-border)' : 'none',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>
                  {HISTORY_EVENT_ICONS[ev.eventType]}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3 }}>
                    {HISTORY_EVENT_LABELS[ev.eventType]}
                  </div>
                  <div style={{
                    fontSize: 10, color: 'var(--color-muted)',
                    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                  }}>
                    {batchLabel}
                    {ev.officer ? ` · ${ev.officer}` : ''}
                    {ev.affectedLivestockIds.length > 0 ? ` · ${ev.affectedLivestockIds.length} ekor` : ''}
                  </div>
                </div>
                <span style={{ fontSize: 10, color: 'var(--color-muted)', flexShrink: 0, marginTop: 2 }}>
                  {ev.displayDate}
                </span>
              </div>
            );
          })}
        </Card>
      )}
    </section>
  );
}

// ─── Dashboard: Upcoming Activity ─────────────────────────────────────────────
// Batch module has no dedicated scheduling layer yet — show informative placeholder.

function DashboardUpcomingSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const aktifList = Object.values(BATCH_DB).filter((b) => b.status === 'Aktif');

  // Derive "upcoming" from active batches: find batches whose endDate is approaching
  const today     = new Date();
  const upcoming  = aktifList
    .filter((b) => b.endDate)
    .map((b) => {
      const end = new Date(b.endDate!);
      const daysLeft = Math.ceil((end.getTime() - today.getTime()) / 86_400_000);
      return { b, daysLeft };
    })
    .filter(({ daysLeft }) => daysLeft >= 0 && daysLeft <= 30)
    .sort((a, z) => a.daysLeft - z.daysLeft)
    .slice(0, 3);

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
          📅 Jadwal Mendatang
        </h2>
        <button
          type="button"
          onClick={() => navigate('/batch/riwayat')}
          style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Riwayat →
        </button>
      </div>
      {upcoming.length === 0 ? (
        <Card style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>📅</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>Tidak Ada Jadwal Mendatang</div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Batch yang mendekati tanggal selesai (dalam 30 hari) akan muncul di sini.
            Gunakan operasi batch untuk mencatat pemantauan berkala.
          </div>
        </Card>
      ) : (
        <Card style={{ overflow: 'hidden' }}>
          {upcoming.map(({ b, daysLeft }, i) => (
            <div
              key={b.id}
              onClick={() => navigate(`/batch/${b.id}`)}
              style={{
                padding: '11px 14px',
                borderBottom: i < upcoming.length - 1 ? '1px solid var(--color-border)' : 'none',
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>{b.livestockIcon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{b.name ?? b.id}</div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>Selesai: {b.endDate}</div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, flexShrink: 0, borderRadius: 20, padding: '2px 10px',
                color: daysLeft <= 7 ? '#c62828' : daysLeft <= 14 ? '#e65100' : '#2e7d32',
                background: daysLeft <= 7 ? '#ffebee' : daysLeft <= 14 ? '#fff8f0' : '#e8f5e9',
              }}>
                {daysLeft} hari
              </span>
            </div>
          ))}
        </Card>
      )}
    </section>
  );
}

// ─── Dashboard: Statistics ────────────────────────────────────────────────────
// Inline bar charts — no chart library. Reuses chart datasets from BT-005.

function InlineBarChart({ title, labels, data, colors }: {
  title: string;
  labels: string[];
  data: number[];
  colors?: string[];
}) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {labels.map((label, i) => {
          const pct = (data[i] / max) * 100;
          const color = colors?.[i] ?? 'var(--color-primary)';
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 90, fontSize: 10, color: 'var(--color-muted)', flexShrink: 0, textAlign: 'right',
                overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {label}
              </div>
              <div style={{ flex: 1, height: 14, background: 'var(--color-border)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${pct}%`,
                  background: color,
                  borderRadius: 4,
                  transition: 'width 0.4s',
                  minWidth: data[i] > 0 ? 4 : 0,
                }} />
              </div>
              <div style={{ width: 22, fontSize: 10, fontWeight: 700, color: 'var(--color-text)', textAlign: 'right', flexShrink: 0 }}>
                {data[i]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DashboardStatisticsSection() {
  // Membership trend (last 6 months)
  const growthTrend = getBatchGrowthTrend().slice(-6);

  // Operation type breakdown
  const opDataset   = getOperationTypeDataset();
  const opData      = opDataset.datasets[0]?.data ?? [];
  const opColors    = ['#4caf50', '#2196f3', '#f44336', '#ff9800', '#9c27b0', '#00bcd4'];

  // Members per batch
  const memberDs    = getMembersPerBatchDataset();
  const memberData  = memberDs.datasets[0]?.data ?? [];

  return (
    <section>
      <SectionLabel title="Statistik" />
      <Card style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Membership Trend */}
        {growthTrend.length > 0 && (
          <InlineBarChart
            title="📈 Tren Keanggotaan (Masuk per Bulan)"
            labels={growthTrend.map((p) => p.label)}
            data={growthTrend.map((p) => p.memberAdds)}
            colors={growthTrend.map(() => '#4caf50')}
          />
        )}

        {/* Separator */}
        {growthTrend.length > 0 && opData.some((v) => v > 0) && (
          <div style={{ height: 1, background: 'var(--color-border)' }} />
        )}

        {/* Operations by type */}
        {opData.some((v) => v > 0) && (
          <InlineBarChart
            title="🔧 Operasi per Jenis"
            labels={opDataset.labels}
            data={opData}
            colors={opColors}
          />
        )}

        {/* Separator */}
        {opData.some((v) => v > 0) && memberData.some((v) => v > 0) && (
          <div style={{ height: 1, background: 'var(--color-border)' }} />
        )}

        {/* Members per batch */}
        {memberData.some((v) => v > 0) && (
          <InlineBarChart
            title="🐄 Anggota per Batch"
            labels={memberDs.labels}
            data={memberData}
            colors={memberDs.datasets[0]?.color ? [memberDs.datasets[0].color] : undefined}
          />
        )}

        {!growthTrend.length && !opData.some((v) => v > 0) && (
          <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '12px 0' }}>
            Belum cukup data untuk ditampilkan.
          </p>
        )}
      </Card>
    </section>
  );
}

// ─── Dashboard Tab (BT-007) ───────────────────────────────────────────────────

function DashboardTab({ tick }: { tick: number }) {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, paddingTop: 20 }}>
      <DashboardSummarySection />
      <DashboardAiSection tick={tick} />
      <DashboardActiveBatchSection tick={tick} />
      <DashboardRecentActivitySection tick={tick} navigate={navigate} />
      <DashboardUpcomingSection navigate={navigate} />
      <DashboardStatisticsSection />
    </div>
  );
}

// ─── Daftar Tab ───────────────────────────────────────────────────────────────
// Preserves all existing batch list / individu list content.

function DaftarTab({ tick, setTick }: { tick: number; setTick: (fn: (t: number) => number) => void }) {
  const [mode,   setMode]   = useState<Mode>('batch');
  const [query,  setQuery]  = useState('');
  const [lokasi, setLokasi] = useState(LOKASI_OPTIONS[0]);
  const [status, setStatus] = useState(STATUS_OPTIONS[0]);

  function handleModeChange(next: Mode) {
    setMode(next);
    setQuery('');
    setStatus(STATUS_OPTIONS[0]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, paddingTop: 20 }}>
      {/* AI Insight (full version) */}
      <AiInsightCard tick={tick} />

      {/* Summary */}
      <SummaryGrid />

      {/* Mode */}
      <section>
        <SectionLabel title="Mode" />
        <SegmentedControl value={mode} onChange={handleModeChange} />
      </section>

      {/* Search & Filter */}
      <SearchFilterSection
        mode={mode}
        query={query}
        onQueryChange={(v) => { setQuery(v); setTick((t) => t + 1); }}
        lokasi={lokasi}
        onLokasiChange={setLokasi}
        status={status}
        onStatusChange={(v) => { setStatus(v); setTick((t) => t + 1); }}
      />

      {/* Batch List / Individu List */}
      {mode === 'batch' ? (
        <BatchListSection query={query} status={status} lokasi={lokasi} tick={tick} />
      ) : (
        <section>
          <SectionLabel title={`Ternak dalam Batch (${MEMBERSHIP_DB.filter((m) => m.status === 'Aktif').length})`} />
          <IndividuSection query={query} status={status} lokasi={lokasi} />
        </section>
      )}

      {/* Batch History (closed) */}
      <BatchHistorySection query={query} status={status} tick={tick} />
    </div>
  );
}

// ─── Create Batch Button (fixed overlay) ─────────────────────────────────────

function CreateBatchButton() {
  const navigate = useNavigate();
  return (
    <HeaderActionPortal>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <button
        type="button"
        onClick={() => navigate('/batch/riwayat')}
        aria-label="Riwayat dan analitik batch"
        style={{
          background: 'none', border: 'none',
          minWidth: 44, minHeight: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, lineHeight: 1,
          color: 'var(--color-muted)',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        📋
      </button>
      <button
        type="button"
        onClick={() => navigate('/batch/add')}
        aria-label="Buat batch baru"
        style={{
          background: 'none', border: 'none',
          minWidth: 44, minHeight: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, lineHeight: 1,
          color: 'var(--color-primary)',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        + Buat
      </button>
      </div>
    </HeaderActionPortal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BatchList() {
  // Populates BATCH_DB, MEMBERSHIP_DB, LIVESTOCK_DB from Supabase so
  // deep-link / hard-refresh navigations get live data.
  const { isLoading, error, refresh } = useLivestock();

  // Hydrates BATCH_OPERATION_LOG from Supabase so the Dashboard analytics tab
  // reflects historical operation counts, not only the current session (M18).
  useBatch();
  const [tab,  setTab]  = useState<Tab>('dashboard');
  const [tick, setTick] = useState(0);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 36 }}>⏳</span>
        <div style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 600 }}>Memuat data batch...</div>
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

  return (
    <div style={{ paddingBottom: 40 }}>
      <CreateBatchButton />

      <div style={{ padding: '20px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* ── Tab Bar ─────────────────────────────────────────────────── */}
        <TabBar active={tab} onChange={setTab} />

        {/* ── Tab Content ─────────────────────────────────────────────── */}
        {tab === 'dashboard' ? (
          <DashboardTab tick={tick} />
        ) : (
          <DaftarTab tick={tick} setTick={setTick} />
        )}

      </div>
    </div>
  );
}
