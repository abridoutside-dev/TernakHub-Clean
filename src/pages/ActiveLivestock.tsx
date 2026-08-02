import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLivestock } from '../hooks/useLivestock';
import { buildCountMap, paginateItems } from '../utils/livestockUtils';
import { buildIndividuList } from '../utils/livestockSummary';
import type { IndividuItem } from '../utils/livestockSummary';
import { BATCH_DB, getActiveBatchMembersWithLivestock } from '../data/batchData';
import { LIVESTOCK_DB } from '../data/livestockData';
import {
  Filters, DEFAULT_FILTERS, countActiveFilters,
  FilterSheet, FilterChips, SearchFilterBar, handleRemoveFilterChip,
  buildFatteningBatchOptions,
  type FilterableIndividu, type FilterableBatch,
} from '../components/LivestockFilterSheet';

// ─── Batch item type ──────────────────────────────────────────────────────────

type BatchItem = {
  id: string;
  name: string | null;
  type: string;
  icon: string;
  typeColor: string;
  typeBg: string;
  program: string;
  total: number;
  avgWeight: string;
  avgWeightNum: number;
  unit: string;
  status: string;
};

/** Build the batch list from BATCH_DB at call time so mutations are always reflected. */
function buildBatchList(): BatchItem[] {
  return Object.values(BATCH_DB).map((b) => {
    const members     = getActiveBatchMembersWithLivestock(b.id);
    const totalWeight = members.reduce((sum, m) => sum + parseFloat(m.lv.weight || '0'), 0);
    const avgWeightNum = members.length > 0 ? totalWeight / members.length : 0;
    return {
      id:            b.id,
      name:          b.name,
      type:          b.livestockType,
      icon:          b.livestockIcon,
      typeColor:     b.livestockTypeColor,
      typeBg:        b.livestockTypeBg,
      program:       b.label,
      total:         members.length,
      avgWeight:     avgWeightNum > 0 ? avgWeightNum.toFixed(0) : '—',
      avgWeightNum,
      unit:          'Kg',
      status:        b.status,
    };
  });
}


const TYPE_META: Record<string, { icon: string; typeColor: string; typeBg: string }> = {
  Domba:   { icon: '🐑', typeColor: '#1b7a43', typeBg: '#e8f5ee' },
  Kambing: { icon: '🐐', typeColor: '#5d4037', typeBg: '#efebe9' },
  Sapi:    { icon: '🐄', typeColor: '#0277bd', typeBg: '#e1f5fe' },
};

const STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  Sehat:      { bg: '#e8f5e9', color: '#2e7d32' },
  Pemantauan: { bg: '#fff8e1', color: '#f57f17' },
  Sakit:      { bg: '#ffebee', color: '#c62828' },
  Aktif:      { bg: '#e8f5e9', color: '#2e7d32' },
  Selesai:    { bg: '#eceff1', color: '#546e7a' },
};

const PROGRAM_CONFIG: Record<string, { bg: string; color: string }> = {
  Fattening:   { bg: '#e3f2fd', color: '#0277bd' },
  Breeding:    { bg: '#fce4ec', color: '#c2185b' },
  Kontes:      { bg: '#fff8e1', color: '#f57f17' },
  Karantina:   { bg: '#ffebee', color: '#c62828' },
  Replacement: { bg: '#f3e5f5', color: '#6a1b9a' },
  Lainnya:     { bg: '#eceff1', color: '#546e7a' },
};

const PAGE_SIZE = 6;

type Mode = 'individu' | 'batch';

// ─── Location helpers ─────────────────────────────────────────────────────────

function extractKandang(location: string): string {
  const parts = location.split(', ');
  return parts.find((p) => /kandang/i.test(p)) ?? parts[0] ?? '';
}

function extractBlokFromLocation(location: string): string {
  const parts = location.split(', ');
  return parts.find((p) => /blok/i.test(p)) ?? '';
}

// ─── Shared UI pieces ─────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  return (
    <h2 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
      {title}
    </h2>
  );
}

// ─── Individual Card ──────────────────────────────────────────────────────────

function IndividuCard({ item, onOpen }: { item: IndividuItem; onOpen: () => void }) {
  const st = STATUS_CONFIG[item.status] ?? STATUS_CONFIG['Sehat'];
  return (
    <div onClick={onOpen} style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
      cursor: 'pointer', overflow: 'hidden', userSelect: 'none',
    }}>
      <div style={{ padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-sm)', flexShrink: 0, background: item.typeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>
          {item.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
                {item.name ?? <span style={{ color: 'var(--color-muted)', fontStyle: 'italic', fontWeight: 400 }}>Tanpa Nama</span>}
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace', letterSpacing: 0.4, marginTop: 1 }}>{item.id}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, flexShrink: 0, color: st.color, background: st.bg, borderRadius: 20, padding: '3px 9px' }}>{item.status}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#546e7a', background: '#eceff1', borderRadius: 20, padding: '2px 8px' }}>
              📍 {item.blok}
            </span>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 16, color: 'var(--color-muted)', fontWeight: 300 }}>›</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Batch Card ───────────────────────────────────────────────────────────────

function BatchCard({ item, onOpen }: { item: BatchItem; onOpen: () => void }) {
  const st = STATUS_CONFIG[item.status]  ?? STATUS_CONFIG['Aktif'];
  const pg = PROGRAM_CONFIG[item.program] ?? PROGRAM_CONFIG['Lainnya'];
  return (
    <div onClick={onOpen} style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
      cursor: 'pointer', padding: '13px 14px',
      display: 'flex', alignItems: 'center', gap: 12, userSelect: 'none',
    }}>
      <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', flexShrink: 0, background: item.typeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
        {item.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', fontFamily: 'monospace' }}>{item.id}</div>
            {item.name
              ? <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>{item.name}</div>
              : <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>{item.icon} {item.type}</div>
            }
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, flexShrink: 0, color: st.color, background: st.bg, borderRadius: 20, padding: '3px 9px' }}>{item.status}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: pg.color, background: pg.bg, borderRadius: 20, padding: '2px 8px' }}>{item.program}</span>
          <span style={{ fontSize: 10, color: 'var(--color-border)' }}>·</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{item.total} <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-muted)' }}>ekor</span></span>
          <span style={{ fontSize: 10, color: 'var(--color-border)' }}>·</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>~{item.avgWeight} <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-muted)' }}>{item.unit}/ekor</span></span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 16, color: 'var(--color-muted)', fontWeight: 300 }}>›</span>
        </div>
      </div>
    </div>
  );
}

// ─── Pagination (always rendered) ────────────────────────────────────────────

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const btn = (disabled: boolean): React.CSSProperties => ({
    width: 30, height: 30, borderRadius: '50%',
    border: '1.5px solid var(--color-border)',
    background: disabled ? 'var(--color-bg)' : 'var(--color-surface)',
    color: disabled ? 'var(--color-border)' : 'var(--color-text)',
    fontSize: 14, cursor: disabled ? 'default' : 'pointer',
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 14 }}>
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} style={btn(page <= 1)}>‹</button>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)' }}>Halaman {page} dari {total}</span>
      <button type="button" disabled={page >= total} onClick={() => onChange(page + 1)} style={btn(page >= total)}>›</button>
    </div>
  );
}

// (FilterSheet, FilterChips, SearchFilterBar imported from LivestockFilterSheet)

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', textAlign: 'center', gap: 12 }}>
      <span style={{ fontSize: 48 }}>🐑</span>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>Tidak Ada Ternak</div>
      <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6, maxWidth: 220 }}>
        Tidak ada ternak yang sesuai dengan filter yang dipilih.
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ActiveLivestock() {
  const navigate = useNavigate();
  // Populates LIVESTOCK_DB, LIVESTOCK_STATUS_DB, BATCH_DB, MEMBERSHIP_DB from Supabase
  const { isLoading, error, refresh } = useLivestock();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Persistent state (lives in URL) ──────────────────────────────────────────
  const rawMode = searchParams.get('mode');
  const mode: Mode = rawMode === 'batch' ? 'batch' : 'individu';
  const typeFilter = searchParams.get('type') || null;
  const search     = searchParams.get('q') ?? '';
  const rawPage = parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  // ── Ephemeral state ───────────────────────────────────────────────────────────
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  // ── URL param updater ─────────────────────────────────────────────────────────
  function setParam(updates: Record<string, string | null>) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === '') next.delete(k);
        else next.set(k, v);
      }
      return next;
    }, { replace: true });
  }

  // ── Live individu list — called directly (no useMemo) so transfer mutations ──
  // in LIVESTOCK_STATUS_DB are always reflected without a remount.
  const ALL_INDIVIDU = buildIndividuList();

  // ── Live batch list — called directly (no useMemo) so BATCH_DB mutations ──
  // (finishBatch, archiveBatch, updateBatch) are always reflected.
  const ALL_BATCH = buildBatchList();

  // ── Adapted lists for shared FilterSheet option builders ─────────────────────
  const adaptedIndividuList: FilterableIndividu[] = ALL_INDIVIDU.map((item) => {
    const lv = LIVESTOCK_DB[item.id];
    return {
      blok: item.blok,
      kandang: lv ? extractKandang(lv.location) : '',
      program: item.program,
      batchId: lv?.batch?.id,
    };
  });

  const adaptedBatchList: FilterableBatch[] = Object.values(BATCH_DB).map((b) => ({
    members: getActiveBatchMembersWithLivestock(b.id).map(({ lv }) => ({
      blok: extractBlokFromLocation(lv.location),
      kandang: extractKandang(lv.location),
    })),
  }));

  // ── Type breakdown — each record counts as 1, never sums .total ──────────────
  const typeBreakdown = useMemo(
    () => buildCountMap(
      (mode === 'individu' ? ALL_INDIVIDU : ALL_BATCH) as Array<{ type: string }>,
      (a) => a.type,
    ),
    [mode, ALL_INDIVIDU],
  );

  const typeKeys = Object.keys(typeBreakdown);

  // ── Base filtered items (type + search) ──────────────────────────────────────
  const baseIndividu = useMemo(() => ALL_INDIVIDU.filter((a) => {
    if (typeFilter && a.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!a.id.toLowerCase().includes(q) && !(a.name ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  }), [ALL_INDIVIDU, typeFilter, search]);

  // baseBatch: called directly (no useMemo) — ALL_BATCH is a fresh array each render
  // and depends on BATCH_DB which can be mutated; memoizing would produce stale results.
  const baseBatch = ALL_BATCH.filter((b) => {
    if (typeFilter && b.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!b.id.toLowerCase().includes(q) && !(b.name ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // ── Fully filtered list ───────────────────────────────────────────────────────
  const filteredIndividu = useMemo(() => baseIndividu.filter((a) => {
    if (filters.jenis !== 'Semua Jenis' && a.type !== filters.jenis) return false;
    if (filters.ras   && a.ras !== filters.ras)                       return false;
    if (filters.program !== 'Semua Program' && a.program !== filters.program) return false;
    if (filters.programSub) {
      const lv = LIVESTOCK_DB[a.id];
      if (filters.program === 'Fattening' && lv?.batch?.id !== filters.programSub) return false;
      if (filters.program === 'Breeding') {
        if (filters.programSub === 'Pejantan' && !/jantan/i.test(a.gender)) return false;
        if (filters.programSub === 'Induk'    && !/betina/i.test(a.gender)) return false;
      }
    }
    // Di Kandang items are always 'Aktif' — Luar Kandang filter yields 0
    if (filters.status === 'Luar Kandang') return false;
    if (filters.blok && a.blok !== filters.blok)  return false;
    if (filters.kandang) {
      const lv = LIVESTOCK_DB[a.id];
      if ((lv ? extractKandang(lv.location) : '') !== filters.kandang) return false;
    }
    if (filters.lokasiLuar) return false;
    return true;
  }), [baseIndividu, filters]);

  // filteredBatch: called directly for same reason as baseBatch
  const filteredBatch = baseBatch.filter((b) => {
    if (filters.jenis !== 'Semua Jenis' && b.type !== filters.jenis) return false;
    if (filters.program !== 'Semua Program' && b.program !== filters.program) return false;
    if (filters.programSub && filters.program === 'Fattening' && b.id !== filters.programSub) return false;
    if (filters.status === 'Luar Kandang') return false;
    if (filters.lokasiLuar) return false;
    return true;
  });

  const currentList = mode === 'individu' ? filteredIndividu : filteredBatch;
  const { pagedItems, totalPages } = paginateItems(currentList as unknown[], page, PAGE_SIZE);

  // ── Counts for mode tabs ──────────────────────────────────────────────────────
  const individuTotal = ALL_INDIVIDU.length;
  const batchTotal    = ALL_BATCH.length;
  const totalActive   = individuTotal;

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const switchMode = (m: Mode) => {
    setParam({ mode: m !== 'individu' ? m : null, page: null });
  };

  const toggleType = (t: string) => {
    setParam({ type: typeFilter === t ? null : t, page: null });
  };

  const activeFilterCount = countActiveFilters(filters);

  function handleRemoveChip(key: keyof Filters) {
    setFilters((prev) => ({ ...prev, ...handleRemoveFilterChip(key, prev) }));
  }

  // ── Supabase loading / error guard ──────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 36 }}>⏳</span>
        <div style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 600 }}>Memuat data ternak aktif...</div>
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
    <div style={{ padding: '16px 16px 80px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Summary ───────────────────────────────────────────────────────── */}
      <section>
        <SectionLabel title="Ringkasan" />
        <div style={{
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '14px 16px',
        }}>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>Jumlah Ternak Aktif</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>
            {totalActive} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-muted)' }}>ekor</span>
          </div>
        </div>
      </section>

      {/* ── Livestock Type ────────────────────────────────────────────────── */}
      <section>
        <SectionLabel title="Jenis Ternak" />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {typeKeys.map((type) => {
            const meta = TYPE_META[type] ?? { icon: '🐾', typeColor: '#546e7a', typeBg: '#eceff1' };
            const active = typeFilter === type;
            return (
              <button key={type} type="button" onClick={() => toggleType(type)} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
              }}>
                <span style={{ fontSize: 20 }}>{meta.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: active ? '#fff' : 'var(--color-text)' }}>{type}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: active ? 'rgba(255,255,255,0.85)' : 'var(--color-muted)',
                  background: active ? 'rgba(255,255,255,0.18)' : 'var(--color-bg)',
                  borderRadius: 20, padding: '2px 8px',
                }}>
                  {typeBreakdown[type]}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Mode ──────────────────────────────────────────────────────────── */}
      <section>
        <SectionLabel title="Mode" />
        <div style={{
          display: 'flex', background: 'var(--color-bg)',
          border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden',
        }}>
          {(['individu', 'batch'] as Mode[]).map((m) => {
            const active = mode === m;
            const label  = m === 'individu' ? 'Individual' : 'Batch';
            const count  = m === 'individu' ? individuTotal : batchTotal;
            return (
              <button key={m} type="button" onClick={() => switchMode(m)} style={{
                flex: 1, padding: '11px 8px',
                background: active ? 'var(--color-primary)' : 'transparent',
                border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                color: active ? '#fff' : 'var(--color-muted)',
              }}>
                {label} <span style={{ fontWeight: 600, opacity: 0.8 }}>({count})</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Search + Filter ───────────────────────────────────────────────── */}
      <section>
        <SearchFilterBar
          query={search}
          onSearch={(q) => { setParam({ q: q || null, page: null }); }}
          onFilter={() => setFilterOpen(true)}
          activeFilterCount={activeFilterCount}
          mode={mode}
        />
        <FilterChips filters={filters} mode={mode} onRemove={handleRemoveChip} />
      </section>

      {/* ── List ──────────────────────────────────────────────────────────── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <SectionLabel title={mode === 'individu' ? 'Daftar Individu' : 'Daftar Batch'} />
          <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 10 }}>
            {currentList.length} data
          </span>
        </div>

        {pagedItems.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mode === 'individu'
              ? (pagedItems as IndividuItem[]).map((item) => (
                  <IndividuCard key={item.id} item={item} onOpen={() => navigate(`/livestock/${item.id}`)} />
                ))
              : (pagedItems as BatchItem[]).map((item) => (
                  <BatchCard key={item.id} item={item} onOpen={() => navigate(`/batch/${item.id}`)} />
                ))
            }
          </div>
        )}

        {/* ── Pagination (always visible) ───────────────────────────────── */}
        <Pagination page={page} total={totalPages} onChange={(p) => { setParam({ page: p > 1 ? String(p) : null }); }} />
      </section>

      {/* ── Filter sheet ──────────────────────────────────────────────────── */}
      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        mode={mode}
        filters={filters}
        onChangeFilters={(f) => { setFilters(f); setParam({ page: null }); }}
        onReset={() => { setFilters(DEFAULT_FILTERS); setFilterOpen(false); }}
        individuList={adaptedIndividuList}
        batchList={adaptedBatchList}
      />
    </div>
  );
}
