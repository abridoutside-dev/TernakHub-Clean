import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLivestock } from '../hooks/useLivestock';
import { SectionLabel, InsightCard } from '../components/InsightCard';
import { countByStatus } from '../data/transferData';
import {
  ARCHIVE_REASON_CONFIG,
  buildArchiveList,
  buildIndividuList,
  buildOutsideIndividu,
  type IndividuItem,
  type OutsideIndividuItem,
} from '../utils/livestockSummary';
import { LIVESTOCK_DB } from '../data/livestockData';
import {
  BATCH_DB,
  getActiveBatchMemberships,
  type BatchRecord,
  type BatchStatus,
} from '../data/batchData';
import { getInventarisList, type InventarisItem } from '../data/stokInventarisData';
import { STOK_OBAT_ITEMS, getStatusStok, type StokObatItem } from '../data/stokObatData';
import { generateLivestockInsights } from '../data/aiInsightLivestockData';
import {
  Filters, DEFAULT_FILTERS, countActiveFilters,
  SegmentedControl, FilterSheet, FilterChips, SearchFilterBar,
  handleRemoveFilterChip,
  type FilterableIndividu,
} from '../components/LivestockFilterSheet';

// ─── Types ───────────────────────────────────────────────────────────────────

type Mode = 'individu' | 'batch';

// ─── UI Config ────────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: '⚖️', label: 'Catat\nBobot',       to: '/catat-bobot'     },
  { icon: '🌿', label: 'Pemberian\nPakan',    to: '/pemberian-pakan' },
  { icon: '❤️', label: 'Kesehatan\nHewan',    to: '/kesehatan-hewan' },
  { icon: '🧬', label: 'Reproduksi',          to: '/reproduksi'      },
  { icon: '🔄', label: 'Mutasi',              to: '/mutasi'          },
  { icon: '📦', label: 'Batch',               to: '/batch'           },
];

const STATUS_CFG: Record<string, { bg: string; color: string }> = {
  Sehat:      { bg: '#e8f5e9', color: '#2e7d32' },
  Pemantauan: { bg: '#fff8e1', color: '#f57f17' },
  Sakit:      { bg: '#ffebee', color: '#c62828' },
};

const PROGRAM_CFG: Record<string, { bg: string; color: string }> = {
  Fattening:   { bg: '#e3f2fd', color: '#0277bd' },
  Breeding:    { bg: '#fce4ec', color: '#c2185b' },
  Kontes:      { bg: '#fff8e1', color: '#f57f17' },
  Karantina:   { bg: '#ffebee', color: '#c62828' },
  Replacement: { bg: '#f3e5f5', color: '#6a1b9a' },
  Lainnya:     { bg: '#eceff1', color: '#546e7a' },
};

const REASON_CFG: Record<string, { bg: string; color: string }> = {
  'Antar Kandang':  { bg: '#e8f5e9', color: '#2e7d32'  },
  'Penitipan Farm': { bg: '#e8f5e9', color: '#388e3c'  },
  'Dokter Hewan':   { bg: '#ffebee', color: '#c62828'  },
  'Layanan Kawin':  { bg: '#fce4ec', color: '#c2185b'  },
  'Kontes':         { bg: '#fff8e1', color: '#f57f17'  },
  'Karantina':      { bg: '#ffebee', color: '#b71c1c'  },
  'Transportasi':   { bg: '#e3f2fd', color: '#0277bd'  },
  'Lainnya':        { bg: '#eceff1', color: '#546e7a'  },
};

const BATCH_STATUS_CFG: Record<BatchStatus, { bg: string; color: string }> = {
  Aktif:      { bg: '#e8f5e9', color: '#2e7d32' },
  Selesai:    { bg: '#e3f2fd', color: '#0277bd' },
  Diarsipkan: { bg: '#eceff1', color: '#546e7a' },
  Draft:      { bg: '#fff8e1', color: '#f57f17' },
  Dibatalkan: { bg: '#ffebee', color: '#c62828' },
};

const INVENTARIS_STATUS_CFG: Record<string, { bg: string; color: string }> = {
  Normal:  { bg: '#e8f5e9', color: '#2e7d32' },
  Menipis: { bg: '#fff8e1', color: '#f57f17' },
  Habis:   { bg: '#ffebee', color: '#c62828' },
};

const OBAT_STATUS_CFG: Record<string, { bg: string; color: string }> = {
  Tersedia:    { bg: '#e8f5e9', color: '#2e7d32' },
  'Hampir Habis': { bg: '#fff8e1', color: '#f57f17' },
  Habis:       { bg: '#ffebee', color: '#c62828' },
  Expired:     { bg: '#f3e5f5', color: '#6a1b9a' },
};

// ─── Location helpers ─────────────────────────────────────────────────────────
// Mirrors the same helpers in ActiveLivestock.tsx so FilterSheet option builders
// receive the correct kandang value from each livestock's location string.

function extractKandang(location: string): string {
  const parts = location.split(', ');
  return parts.find((p) => /kandang/i.test(p)) ?? parts[0] ?? '';
}

// ─── Sheep Illustration ───────────────────────────────────────────────────────

function SheepIllustration() {
  return (
    <svg width="120" height="100" viewBox="0 0 140 120" fill="none" aria-hidden="true">
      <ellipse cx="70" cy="62" rx="38" ry="28" fill="#e8f0e8" />
      <circle cx="48" cy="58" r="18" fill="#f0f4f0" />
      <circle cx="62" cy="50" r="20" fill="#f0f4f0" />
      <circle cx="78" cy="50" r="20" fill="#f0f4f0" />
      <circle cx="93" cy="57" r="17" fill="#f0f4f0" />
      <circle cx="70" cy="62" r="20" fill="#f0f4f0" />
      <circle cx="56" cy="64" r="16" fill="#f0f4f0" />
      <circle cx="84" cy="63" r="16" fill="#f0f4f0" />
      <ellipse cx="70" cy="36" rx="13" ry="12" fill="#d4c5b0" />
      <ellipse cx="57" cy="33" rx="5" ry="7" fill="#c4b09a" transform="rotate(-20 57 33)" />
      <ellipse cx="83" cy="33" rx="5" ry="7" fill="#c4b09a" transform="rotate(20 83 33)" />
      <circle cx="64" cy="34" r="2.5" fill="#3a2e1e" />
      <circle cx="76" cy="34" r="2.5" fill="#3a2e1e" />
      <rect x="51" y="84" width="8" height="22" rx="4" fill="#c4b09a" />
      <rect x="63" y="84" width="8" height="22" rx="4" fill="#c4b09a" />
      <rect x="75" y="84" width="8" height="22" rx="4" fill="#c4b09a" />
      <rect x="87" y="84" width="8" height="22" rx="4" fill="#c4b09a" />
    </svg>
  );
}

// ─── Empty States ─────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px', textAlign: 'center', gap: 12 }}>
      <SheepIllustration />
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginTop: 4 }}>Belum Ada Data</div>
      <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6, maxWidth: 220 }}>{message}</div>
    </div>
  );
}

function InventoryEmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
      padding: '24px 20px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Belum ada data</div>
      <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>{message}</div>
    </div>
  );
}

// ─── Ringkasan Cards (MIN-001) ────────────────────────────────────────────────

function RingkasanCards({ diKandang, luarKandang, totalArchive, activeBatchCount }: {
  diKandang: number; luarKandang: number; totalArchive: number; activeBatchCount: number;
}) {
  const cards = [
    { label: 'Di Kandang',   value: diKandang,       unit: 'ekor', bg: '#e8f5e9', color: '#2e7d32', icon: '🏠' },
    { label: 'Luar Kandang', value: luarKandang,      unit: 'ekor', bg: '#fff8e1', color: '#f57f17', icon: '📍' },
    { label: 'Arsip',        value: totalArchive,     unit: 'ekor', bg: '#eceff1', color: '#546e7a', icon: '📁' },
    { label: 'Batch Aktif',  value: activeBatchCount, unit: 'batch', bg: '#e3f2fd', color: '#0277bd', icon: '📦' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
            padding: '12px 14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{
              width: 28, height: 28, borderRadius: '50%',
              background: card.bg, color: card.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              flexShrink: 0,
            }}>
              {card.icon}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)' }}>{card.label}</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}>
            {card.value}
          </div>
          <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>{card.unit}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Individual Livestock Card ────────────────────────────────────────────────

function IndividuCard({ item, onOpen }: { item: IndividuItem; onOpen: () => void }) {
  const status  = STATUS_CFG[item.status]   ?? { bg: '#e8f5e9', color: '#2e7d32' };
  const program = PROGRAM_CFG[item.program] ?? PROGRAM_CFG['Lainnya'];

  return (
    <div
      onClick={onOpen}
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer', overflow: 'hidden', userSelect: 'none',
      }}
    >
      <div style={{ padding: '13px 14px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 'var(--radius-sm)', flexShrink: 0,
          background: item.typeBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
        }}>
          {item.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
                {item.name ?? <span style={{ color: 'var(--color-muted)', fontStyle: 'italic', fontWeight: 400 }}>Tanpa Nama</span>}
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace', letterSpacing: 0.4, marginTop: 1 }}>
                {item.id}
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, flexShrink: 0, color: status.color, background: status.bg, borderRadius: 20, padding: '3px 9px' }}>
              {item.status}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>
              {item.weight} <span style={{ fontSize: 10, fontWeight: 600 }}>{item.unit}</span>
            </span>
            <span style={{ fontSize: 10, color: 'var(--color-border)' }}>·</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: program.color, background: program.bg, borderRadius: 20, padding: '2px 8px' }}>
              {item.program}
            </span>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 16, color: 'var(--color-muted)', fontWeight: 300 }}>›</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Outside Livestock Card ───────────────────────────────────────────────────

function OutsideCard({ item, onOpen }: { item: OutsideIndividuItem; onOpen: () => void }) {
  const status = STATUS_CFG[item.status] ?? { bg: '#e8f5e9', color: '#2e7d32' };
  const rsn    = REASON_CFG[item.reason] ?? { bg: '#eceff1', color: '#546e7a' };

  return (
    <div
      onClick={onOpen}
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer', overflow: 'hidden',
      }}
    >
      <div style={{ padding: '13px 14px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 'var(--radius-sm)', flexShrink: 0,
          background: item.typeBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 27,
        }}>
          {item.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
                {item.name ?? <span style={{ color: 'var(--color-muted)', fontStyle: 'italic', fontWeight: 400 }}>Tanpa Nama</span>}
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace', letterSpacing: 0.4, marginTop: 1 }}>
                {item.id}
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, flexShrink: 0, color: status.color, background: status.bg, borderRadius: 20, padding: '3px 9px' }}>
              {item.status}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#f57f17' }}>
              📍 {item.reason}
            </span>
            <span style={{ fontSize: 10, color: 'var(--color-border)' }}>·</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: rsn.color, background: rsn.bg, borderRadius: 20, padding: '2px 8px' }}>
              {item.daysOut} hari
            </span>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 16, color: 'var(--color-muted)', fontWeight: 300 }}>›</span>
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--color-border)', padding: '9px 14px', background: 'var(--color-bg)' }}>
        <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
          Lokasi: <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{item.currentLocation}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Batch Card (MIN-004 / MAJ-003) ──────────────────────────────────────────

function BatchCard({ batch, onOpen }: { batch: BatchRecord; onOpen: () => void }) {
  const memberCount = getActiveBatchMemberships(batch.id).length;
  const statusCfg   = BATCH_STATUS_CFG[batch.status] ?? { bg: '#eceff1', color: '#546e7a' };

  return (
    <div
      onClick={onOpen}
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer', overflow: 'hidden',
      }}
    >
      <div style={{ padding: '13px 14px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 'var(--radius-sm)', flexShrink: 0,
          background: batch.livestockTypeBg || '#e8f0e8',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
        }}>
          {batch.livestockIcon || '📦'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {batch.name ?? batch.label}
              </div>
              {batch.name && (
                <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {batch.label}
                </div>
              )}
              <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace', letterSpacing: 0.4, marginTop: 1 }}>
                {batch.id.slice(0, 8)}…
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, flexShrink: 0, color: statusCfg.color, background: statusCfg.bg, borderRadius: 20, padding: '3px 9px' }}>
              {batch.status}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>
              {memberCount} anggota aktif
            </span>
            {batch.livestockType && (
              <>
                <span style={{ fontSize: 10, color: 'var(--color-border)' }}>·</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)' }}>
                  {batch.livestockType}
                </span>
              </>
            )}
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 16, color: 'var(--color-muted)', fontWeight: 300 }}>›</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stok Item Row ────────────────────────────────────────────────────────────

function StokPakanRow({ item }: { item: InventarisItem }) {
  const cfg = INVENTARIS_STATUS_CFG[item.status] ?? { bg: '#eceff1', color: '#546e7a' };
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      padding: '10px 14px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.nama}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
          {item.kategori}{item.brand ? ` · ${item.brand}` : ''}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>
          {item.jumlahStok} {item.satuan}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: '2px 8px' }}>
          {item.status}
        </span>
      </div>
    </div>
  );
}

function StokObatRow({ item }: { item: StokObatItem }) {
  const statusStok = getStatusStok(item);
  const cfg = OBAT_STATUS_CFG[statusStok] ?? { bg: '#eceff1', color: '#546e7a' };
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      padding: '10px 14px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.namaProduk}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
          {item.brand} · {item.bentukSediaan}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>
          {item.jumlah} {item.satuan}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: '2px 8px' }}>
          {statusStok}
        </span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Livestock() {
  const navigate = useNavigate();

  // ── Supabase data loader — populates LIVESTOCK_DB, BATCH_DB, etc. ──────────
  const { isLoading, error, refresh } = useLivestock();

  // ── State ──────────────────────────────────────────────────────────────────
  const [mode,       setMode]       = useState<Mode>('individu');
  const [query,      setQuery]      = useState('');
  const [filters,    setFilters]    = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  // tick reserved for future hub mutations that need to refresh AI insight
  const [tick] = useState(0);

  // ── AI Insight — recomputed on tick (03_AI_CONSTITUTION.md pattern) ────────
  const report = useMemo(() => generateLivestockInsights(), [tick]);

  // ── Live data — called directly (MIN-003 fix: no stale useMemo) ────────────
  const { diKandang, luarKandang } = countByStatus();
  const liveIndividu  = buildIndividuList();
  const liveOutside   = buildOutsideIndividu();
  const archiveList   = buildArchiveList();
  const allBatch      = Object.values(BATCH_DB);
  const totalArchive  = archiveList.length;
  const activeBatchCount = allBatch.filter((b) => b.status === 'Aktif').length;

  // ── Inventory data — MAJ-004 fix: read from live registries ───────────────
  const pakanList = getInventarisList();
  const obatList  = STOK_OBAT_ITEMS;

  // ── AUDIT-LIVESTOCK-LIST-001 MAJOR-001: build proper FilterableIndividu[] ──
  // IndividuItem lacks kandang and batchId, so passing liveIndividu directly to
  // FilterSheet (as any[]) left the Kandang filter options always empty. Build
  // the adapter here the same way ActiveLivestock.tsx does.
  const adaptedIndividuList: FilterableIndividu[] = liveIndividu.map((item) => {
    const lv = LIVESTOCK_DB[item.id];
    return {
      blok:    item.blok,
      kandang: lv ? extractKandang(lv.location) : '',
      program: item.program,
      batchId: lv?.batch?.id,
    };
  });

  // ── Filter logic ──────────────────────────────────────────────────────────
  const q = query.toLowerCase();

  const filteredIndividu = liveIndividu.filter((item) => {
    if (filters.jenis !== 'Semua Jenis' && item.type !== filters.jenis) return false;
    if (filters.ras && item.ras !== filters.ras) return false;
    if (filters.program !== 'Semua Program' && item.program !== filters.program) return false;
    // AUDIT-LIVESTOCK-LIST-001 MAJOR-001: programSub was never applied here.
    if (filters.programSub) {
      if (filters.program === 'Fattening') {
        const lv = LIVESTOCK_DB[item.id];
        if (lv?.batch?.id !== filters.programSub) return false;
      }
      if (filters.program === 'Breeding') {
        if (filters.programSub === 'Pejantan' && !/jantan/i.test(item.gender)) return false;
        if (filters.programSub === 'Induk'    && !/betina/i.test(item.gender)) return false;
      }
    }
    if (filters.blok && item.blok !== filters.blok) return false;
    // AUDIT-LIVESTOCK-LIST-001 MAJOR-001: kandang filter was never applied here.
    if (filters.kandang) {
      const lv = LIVESTOCK_DB[item.id];
      if ((lv ? extractKandang(lv.location) : '') !== filters.kandang) return false;
    }
    if (q && !(item.name?.toLowerCase().includes(q) ?? false) && !item.id.toLowerCase().includes(q) && !item.type.toLowerCase().includes(q)) return false;
    return true;
  });

  // AUDIT-LIVESTOCK-LIST-001 MAJOR-002: OutsideIndividuItem already has .ras and .reason
  // fields — the (as any) casts were unnecessary and suppressed valid type-checking.
  const filteredOutside = liveOutside.filter((item) => {
    if (filters.jenis !== 'Semua Jenis' && item.type !== filters.jenis) return false;
    if (filters.ras && item.ras !== filters.ras) return false;
    if (filters.lokasiLuar && item.reason !== filters.lokasiLuar) return false;
    if (q && !(item.name?.toLowerCase().includes(q) ?? false) && !item.id.toLowerCase().includes(q) && !item.type.toLowerCase().includes(q)) return false;
    return true;
  });

  const filteredArchive = archiveList.filter((item) => {
    if (filters.jenis !== 'Semua Jenis' && item.type !== filters.jenis) return false;
    if (q && !(item.name?.toLowerCase().includes(q) ?? false) && !item.id.toLowerCase().includes(q) && !item.type.toLowerCase().includes(q)) return false;
    return true;
  });

  const filteredBatch = allBatch.filter((batch) => {
    if (filters.program === 'Fattening' && filters.programSub && batch.id !== filters.programSub) return false;
    if (q && !batch.label.toLowerCase().includes(q) && !(batch.name?.toLowerCase().includes(q) ?? false) && !batch.id.toLowerCase().includes(q)) return false;
    return true;
  });

  // ── Location section visibility (individu mode) ───────────────────────────
  const showDiKandang    = filters.status === 'Semua Status' || filters.status === 'Aktif';
  const showLuarKandang  = filters.status === 'Semua Status' || filters.status === 'Luar Kandang';
  const showArsip        = filters.status === 'Semua Status';

  // ── Archive slider — categories with live filtered counts ─────────────────
  const archiveSlider = (['Mati', 'Terjual', 'Hibah'] as const).map((key) => ({
    key, ...ARCHIVE_REASON_CONFIG[key],
    count: filteredArchive.filter((item) => item.reason === key).length,
  }));

  // ── Active filter count (for badge on filter button) ──────────────────────
  const activeFilterCount = countActiveFilters(filters);

  // AUDIT-LIVESTOCK-LIST-001: use the exported handleRemoveFilterChip instead of
  // duplicating its logic inline (Minor-001). Other list pages already do this.
  function handleRemoveChip(key: keyof Filters) {
    setFilters((f) => ({ ...f, ...handleRemoveFilterChip(key, f) }));
  }

  const viewMoreBtn: React.CSSProperties = {
    background: 'none', border: 'none',
    color: 'var(--color-primary)', fontSize: 13, fontWeight: 700,
    cursor: 'pointer', padding: '12px 0 0', width: '100%', textAlign: 'center', display: 'block',
  };

  const section: React.CSSProperties = { padding: '16px 16px 0' };

  // ── Supabase loading / error guard ──────────────────────────────────────
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

  return (
    <>

      {/* ── 2. AI Insight (MAJ-002) ───────────────────────────────────────── */}
      <div style={section}>
        <InsightCard
          icon="🐄"
          title="Analisis Populasi Ternak"
          items={report.items}
          analyzedAt={report.analyzedAt}
          confidenceStatus={report.confidenceStatus}
        />
      </div>

      {/* ── 3. Ringkasan / Summary Cards (MIN-001) ────────────────────────── */}
      <div style={section}>
        <SectionLabel title="Ringkasan" />
        <RingkasanCards
          diKandang={diKandang}
          luarKandang={luarKandang}
          totalArchive={totalArchive}
          activeBatchCount={activeBatchCount}
        />
      </div>

      {/* ── 4. Quick Actions ──────────────────────────────────────────────── */}
      <div style={section}>
        <SectionLabel title="Aksi Cepat" />
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => navigate(action.to)}
              style={{
                flexShrink: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '12px 14px',
                background: 'var(--color-surface)',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer', minWidth: 72,
              }}
            >
              <span style={{ fontSize: 26 }}>{action.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'pre-line', textAlign: 'center', lineHeight: 1.3 }}>
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 5. Mode Selector (MAJ-003) ────────────────────────────────────── */}
      <div style={section}>
        <SegmentedControl value={mode} onChange={(m) => { setMode(m); setQuery(''); setFilters(DEFAULT_FILTERS); }} />
      </div>

      {/* ── 6. Search & Filter (MAJ-003) ──────────────────────────────────── */}
      <div style={{ padding: '10px 16px 0' }}>
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
      </div>

      {/* ── 7. Main Content ───────────────────────────────────────────────── */}
      {mode === 'individu' ? (
        <>
          {/* Di Kandang */}
          {showDiKandang && (
            <div style={section}>
              <SectionLabel title="Di Kandang" count={filteredIndividu.length} />
              {filteredIndividu.length === 0 ? (
                <EmptyState message={query || activeFilterCount > 0 ? 'Tidak ada ternak yang cocok dengan filter.' : 'Belum ada ternak yang aktif di kandang.'} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filteredIndividu.slice(0, 4).map((item) => (
                    <IndividuCard key={item.id} item={item} onOpen={() => navigate(`/livestock/${item.id}`)} />
                  ))}
                </div>
              )}
              <button type="button" onClick={() => navigate('/livestock/active')} style={viewMoreBtn}>
                Lihat Selengkapnya &gt;&gt;
              </button>
            </div>
          )}

          {/* Luar Kandang */}
          {showLuarKandang && (
            <div style={section}>
              <SectionLabel title="Luar Kandang" count={filteredOutside.length} />
              {filteredOutside.length === 0 ? (
                <EmptyState message={query || activeFilterCount > 0 ? 'Tidak ada ternak yang cocok dengan filter.' : 'Belum ada ternak yang sedang di luar kandang.'} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filteredOutside.slice(0, 4).map((item) => (
                    <OutsideCard key={item.id} item={item} onOpen={() => navigate(`/livestock/${item.id}`)} />
                  ))}
                </div>
              )}
              <button type="button" onClick={() => navigate('/livestock/outside')} style={viewMoreBtn}>
                Lihat Selengkapnya &gt;&gt;
              </button>
            </div>
          )}

          {/* Arsip */}
          {showArsip && (
            <div style={section}>
              <SectionLabel title="Arsip" count={filteredArchive.length} />
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
                {archiveSlider.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => navigate('/livestock/archive')}
                    style={{
                      flexShrink: 0, minWidth: 128,
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
                      padding: '14px', textAlign: 'left',
                      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
                    }}
                  >
                    <span style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: cat.bg, color: cat.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                    }}>
                      {cat.icon}
                    </span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>{cat.key}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>{cat.count} ekor</div>
                    </div>
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => navigate('/livestock/archive')} style={viewMoreBtn}>
                Lihat Selengkapnya &gt;&gt;
              </button>
            </div>
          )}
        </>
      ) : (
        /* Batch mode (MIN-004 / MAJ-003) */
        <div style={section}>
          <SectionLabel title="Daftar Batch" count={filteredBatch.length} />
          {filteredBatch.length === 0 ? (
            <EmptyState message={query || activeFilterCount > 0 ? 'Tidak ada batch yang cocok dengan filter.' : 'Belum ada batch yang dibuat. Buat batch pertama melalui modul Batch.'} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredBatch.map((batch) => (
                <BatchCard
                  key={batch.id}
                  batch={batch}
                  onOpen={() => navigate(`/batch/${batch.id}`)}
                />
              ))}
            </div>
          )}
          <button type="button" onClick={() => navigate('/batch')} style={viewMoreBtn}>
            Kelola Batch &gt;&gt;
          </button>
        </div>
      )}

      {/* ── 8. Daftar Pakan (MAJ-004 fix: conditional on live data) ──────── */}
      <div style={section}>
        <SectionLabel title="Daftar Pakan" />
        {pakanList.length === 0 ? (
          <InventoryEmptyState icon="🌿" message="Belum ada stok pakan yang dicatat." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pakanList.slice(0, 3).map((item) => (
              <StokPakanRow key={item.id} item={item} />
            ))}
          </div>
        )}
        <button type="button" onClick={() => navigate('/stok-pakan')} style={viewMoreBtn}>
          Lihat Selengkapnya &gt;&gt;
        </button>
      </div>

      {/* ── 9. Daftar Obat (MAJ-004 fix: conditional on live data) ───────── */}
      <div style={{ padding: '16px 16px 24px' }}>
        <SectionLabel title="Daftar Obat" />
        {obatList.length === 0 ? (
          <InventoryEmptyState icon="💊" message="Belum ada stok obat yang dicatat." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {obatList.slice(0, 3).map((item) => (
              <StokObatRow key={item.uuid} item={item} />
            ))}
          </div>
        )}
        <button type="button" onClick={() => navigate('/stok-obat')} style={viewMoreBtn}>
          Lihat Selengkapnya &gt;&gt;
        </button>
      </div>

      {/* ── Filter Sheet ──────────────────────────────────────────────────── */}
      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        mode={mode}
        filters={filters}
        onChangeFilters={setFilters}
        onReset={() => { setFilters(DEFAULT_FILTERS); setQuery(''); }}
        individuList={adaptedIndividuList}
        batchList={[]}
      />

    </>
  );
}
