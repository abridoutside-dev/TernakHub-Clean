import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLivestock } from '../hooks/useLivestock';
import { buildCountMap, paginateItems } from '../utils/livestockUtils';
import { buildOutsideIndividu } from '../utils/livestockSummary';
import type { OutsideIndividuItem } from '../utils/livestockSummary';
import { LIVESTOCK_DB } from '../data/livestockData';
import {
  Filters, DEFAULT_FILTERS, countActiveFilters,
  FilterSheet, FilterChips, SearchFilterBar, handleRemoveFilterChip,
  type FilterableIndividu, type FilterableBatch,
} from '../components/LivestockFilterSheet';

// No outside batch data source yet — batch mode shows empty state.
type OutsideBatchItem = {
  id: string; name: string | null;
  type: string; icon: string; typeColor: string; typeBg: string;
  program: string; status: string;
  total: number; avgWeight: string; avgWeightNum: number; unit: string;
  reason: string; since: string; daysOut: number; currentLocation: string;
};
const ALL_OUTSIDE_BATCH: OutsideBatchItem[] = [];

const TYPE_META: Record<string, { icon: string }> = {
  Domba:   { icon: '🐑' },
  Kambing: { icon: '🐐' },
  Sapi:    { icon: '🐄' },
};

const REASON_CONFIG: Record<string, { bg: string; color: string }> = {
  'Antar Kandang':  { bg: '#e8f5e9', color: '#2e7d32'  },
  'Penitipan Farm': { bg: '#e8f5e9', color: '#388e3c'  },
  'Dokter Hewan':   { bg: '#ffebee', color: '#c62828'  },
  'Layanan Kawin':  { bg: '#fce4ec', color: '#c2185b'  },
  'Kontes':         { bg: '#fff8e1', color: '#f57f17'  },
  'Karantina':      { bg: '#ffebee', color: '#b71c1c'  },
  'Lainnya':        { bg: '#eceff1', color: '#546e7a'  },
  'Transportasi':   { bg: '#e3f2fd', color: '#0277bd'  },
};

const STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  Aktif:   { bg: '#e8f5e9', color: '#2e7d32' },
  Selesai: { bg: '#eceff1', color: '#546e7a' },
};

const PAGE_SIZE = 6;

type Mode = 'individu' | 'batch';

// ─── Shared UI ────────────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  return (
    <h2 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
      {title}
    </h2>
  );
}

// ─── Individual Outside Card ──────────────────────────────────────────────────

function IndividuCard({ item, onOpen }: { item: OutsideIndividuItem; onOpen: () => void }) {
  const rsn = REASON_CONFIG[item.reason] ?? { bg: '#eceff1', color: '#546e7a' };

  return (
    <div onClick={onOpen} style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
      cursor: 'pointer', overflow: 'hidden', userSelect: 'none',
    }}>
      {/* Main row */}
      <div style={{ padding: '13px 14px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
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
            {/* Jenis Mutasi badge — mutasi reason only, no program combination */}
            <span style={{
              fontSize: 11, fontWeight: 700, flexShrink: 0,
              color: rsn.color, background: rsn.bg,
              borderRadius: 20, padding: '3px 9px',
            }}>
              {item.reason}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#546e7a', background: '#eceff1', borderRadius: 20, padding: '2px 8px' }}>
              📍 {item.currentLocation}
            </span>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)' }}>
              {item.daysOut} hari
            </span>
            <span style={{ fontSize: 16, color: 'var(--color-muted)', fontWeight: 300 }}>›</span>
          </div>
        </div>
      </div>

      {/* Location footer */}
      <div style={{ borderTop: '1px solid var(--color-border)', padding: '9px 14px', background: 'var(--color-bg)', display: 'flex', gap: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
          Lokasi: <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{item.currentLocation}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
          Mutasi: <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{item.reason}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Batch Outside Card ───────────────────────────────────────────────────────

function BatchCard({ item, onOpen }: { item: typeof ALL_OUTSIDE_BATCH[number]; onOpen: () => void }) {
  const st  = STATUS_CONFIG[item.status] ?? STATUS_CONFIG['Aktif'];
  const rsn = REASON_CONFIG[item.reason] ?? { bg: '#eceff1', color: '#546e7a' };

  return (
    <div onClick={onOpen} style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
      cursor: 'pointer', overflow: 'hidden', userSelect: 'none',
    }}>
      <div style={{ padding: '13px 14px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', flexShrink: 0, background: item.typeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
          {item.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', fontFamily: 'monospace' }}>{item.id}</div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>{item.icon} {item.type}</div>
            </div>
            {/* Jenis Mutasi badge only */}
            <span style={{ fontSize: 11, fontWeight: 700, flexShrink: 0, color: rsn.color, background: rsn.bg, borderRadius: 20, padding: '3px 9px' }}>
              {item.reason}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#546e7a', background: '#eceff1', borderRadius: 20, padding: '2px 8px' }}>
              📍 {item.currentLocation}
            </span>
            <span style={{ fontSize: 10, color: 'var(--color-border)' }}>·</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{item.total} <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-muted)' }}>ekor</span></span>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)' }}>{item.daysOut} hari</span>
            <span style={{ fontSize: 16, color: 'var(--color-muted)', fontWeight: 300 }}>›</span>
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--color-border)', padding: '9px 14px', background: 'var(--color-bg)' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, borderRadius: 20, padding: '2px 8px' }}>{item.status}</span>
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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function OutsideLivestock() {
  const navigate = useNavigate();
  // Populates LIVESTOCK_DB, OUTSIDE_LIVESTOCK_DB from Supabase
  const { isLoading, error, refresh } = useLivestock();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Persistent state (lives in URL) ──────────────────────────────────────────
  const rawMode = searchParams.get('mode');
  const mode: Mode = rawMode === 'batch' ? 'batch' : 'individu';
  const typeFilter = searchParams.get('type') || null;
  const search     = searchParams.get('q') ?? '';
  const rawPage = parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters]       = useState<Filters>(DEFAULT_FILTERS);

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

  // ── Live outside list — called directly so in-memory mutations always reflect ──
  const ALL_OUTSIDE_INDIVIDU = buildOutsideIndividu();

  // ── Adapted lists for shared FilterSheet option builders ─────────────────────
  // Luar Kandang items have no blok/kandang — those chip groups show empty state.
  const adaptedIndividuList: FilterableIndividu[] = ALL_OUTSIDE_INDIVIDU.map((item) => ({
    program: item.program,
    batchId: LIVESTOCK_DB[item.id]?.batch?.id,
  }));
  const adaptedBatchList: FilterableBatch[] = [];

  // ── Type breakdown — each record counts as 1, never sums .total ──────────────
  const typeBreakdown = useMemo(
    () => buildCountMap(
      (mode === 'individu' ? ALL_OUTSIDE_INDIVIDU : ALL_OUTSIDE_BATCH) as Array<{ type: string }>,
      (a) => a.type,
    ),
    [mode, ALL_OUTSIDE_INDIVIDU],
  );

  const typeKeys = Object.keys(typeBreakdown);

  // ── Totals for mode tabs ──────────────────────────────────────────────────────
  const individuTotal = ALL_OUTSIDE_INDIVIDU.length;
  const batchTotal    = ALL_OUTSIDE_BATCH.length;
  const totalOutside  = individuTotal;

  // ── Base filtered (type + search) ────────────────────────────────────────────
  const baseIndividu = useMemo(() => ALL_OUTSIDE_INDIVIDU.filter((a) => {
    if (typeFilter && a.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!a.id.toLowerCase().includes(q) && !(a.name ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  }), [ALL_OUTSIDE_INDIVIDU, typeFilter, search]);

  const baseBatch = useMemo(() => ALL_OUTSIDE_BATCH.filter((b) => {
    if (typeFilter && b.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!b.id.toLowerCase().includes(q) && !(b.name ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  }), [typeFilter, search]);

  // ── Fully filtered list ───────────────────────────────────────────────────────
  const filteredIndividu = useMemo(() => baseIndividu.filter((a) => {
    if (filters.jenis !== 'Semua Jenis' && a.type !== filters.jenis) return false;
    if (filters.ras   && a.ras !== filters.ras)                       return false;
    if (filters.program !== 'Semua Program' && a.program !== filters.program) return false;
    if (filters.programSub && filters.program === 'Breeding') {
      if (filters.programSub === 'Pejantan' && !/jantan/i.test(a.gender)) return false;
      if (filters.programSub === 'Induk'    && !/betina/i.test(a.gender)) return false;
    }
    // Luar Kandang items are always Luar Kandang — 'Aktif' filter yields 0
    if (filters.status === 'Aktif') return false;
    // blok/kandang don't apply for Luar Kandang
    if (filters.blok || filters.kandang) return false;
    // lokasiLuar maps to reason
    if (filters.lokasiLuar && a.reason !== filters.lokasiLuar) return false;
    return true;
  }), [baseIndividu, filters]);

  const filteredBatch = useMemo(() => baseBatch.filter((b) => {
    if (filters.jenis !== 'Semua Jenis' && b.type !== filters.jenis) return false;
    if (filters.status === 'Aktif') return false;
    return true;
  }), [baseBatch, filters]);

  const currentList = mode === 'individu' ? filteredIndividu : filteredBatch;
  const { pagedItems, totalPages } = paginateItems(currentList as unknown[], page, PAGE_SIZE);

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
        <div style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 600 }}>Memuat data ternak luar kandang...</div>
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
          <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>Jumlah Ternak Luar Kandang</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>
            {totalOutside} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-muted)' }}>ekor</span>
          </div>
        </div>
      </section>

      {/* ── Livestock Type ────────────────────────────────────────────────── */}
      <section>
        <SectionLabel title="Jenis Ternak" />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {typeKeys.map((type) => {
            const meta = TYPE_META[type] ?? { icon: '🐾' };
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
        <div style={{ display: 'flex', background: 'var(--color-bg)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
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
          <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 10 }}>{currentList.length} data</span>
        </div>

        {pagedItems.length === 0 ? (
          mode === 'batch' ? (
            // Batch mode has no data source yet — give a contextual explanation
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', textAlign: 'center', gap: 12 }}>
              <span style={{ fontSize: 48 }}>📋</span>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>Data Batch Belum Tersedia</div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6, maxWidth: 240 }}>
                Pencatatan batch luar kandang belum didukung. Gunakan mode <strong>Individual</strong> untuk melihat ternak yang sedang berada di luar kandang.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', textAlign: 'center', gap: 12 }}>
              <span style={{ fontSize: 48 }}>🐑</span>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>Tidak Ada Ternak</div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6, maxWidth: 220 }}>Tidak ada ternak yang sesuai filter yang dipilih.</div>
            </div>
          )
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mode === 'individu'
              ? (pagedItems as OutsideIndividuItem[]).map((item) => (
                  <IndividuCard key={item.id} item={item} onOpen={() => navigate(`/livestock/${item.id}`)} />
                ))
              : (pagedItems as typeof ALL_OUTSIDE_BATCH).map((item) => (
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
