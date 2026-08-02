import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLivestock } from '../hooks/useLivestock';
import { buildCountMap, paginateItems } from '../utils/livestockUtils';
import {
  buildArchiveList,
  ARCHIVE_REASON_CONFIG as REASON_CONFIG,
} from '../utils/livestockSummary';
import type { ArchiveItem, ArchiveReason } from '../utils/livestockSummary';
import {
  Filters, DEFAULT_FILTERS, countActiveFilters,
  FilterSheet, FilterChips, SearchFilterBar, handleRemoveFilterChip,
  type FilterableIndividu,
} from '../components/LivestockFilterSheet';

// ─── Archive tab config ────────────────────────────────────────────────────────

// FINAL — exactly 3 categories. No fallback tab.
const VALID_CATEGORIES = ['Semua', 'Mati', 'Terjual', 'Hibah'] as const;
type CategoryTab = typeof VALID_CATEGORIES[number];

// (Filters, DEFAULT_FILTERS imported from LivestockFilterSheet)

const PAGE_SIZE = 6;

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

// ─── Archive Card ─────────────────────────────────────────────────────────────

function ArchiveCard({ item, onOpen }: { item: ArchiveItem; onOpen: () => void }) {
  const cfg   = REASON_CONFIG[item.reason];
  const label = item.reason;
  return (
    <div onClick={onOpen} style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
      padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12,
      opacity: 0.92, cursor: 'pointer',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 'var(--radius-sm)', flexShrink: 0,
        background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 27,
      }}>
        {item.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
              {item.name ?? <span style={{ color: 'var(--color-muted)', fontStyle: 'italic', fontWeight: 400 }}>Tanpa Nama</span>}
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace', letterSpacing: 0.4, marginTop: 1 }}>{item.id}</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, flexShrink: 0, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: '3px 9px' }}>
            {cfg.icon} {label}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
          {item.type} · {item.ras}
          {item.date ? ` · ${item.date}` : ''}
        </div>
        {item.notes && (
          <div style={{ fontSize: 11, color: 'var(--color-text)', marginTop: 2, fontWeight: 600 }}>{item.notes}</div>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 24px', textAlign: 'center', gap: 10 }}>
      <span style={{ fontSize: 40 }}>🗂️</span>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>Belum Ada Arsip</div>
      <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6, maxWidth: 220 }}>
        Ternak yang terjual, mati, atau dihibahkan akan muncul di sini.
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArchiveLivestock() {
  const navigate = useNavigate();
  // Populates LIVESTOCK_DB, LIVESTOCK_STATUS_DB from Supabase
  const { isLoading, error, refresh } = useLivestock();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab  = searchParams.get('category') ?? 'Semua';
  const tab: CategoryTab = (VALID_CATEGORIES as readonly string[]).includes(rawTab)
    ? (rawTab as CategoryTab)
    : 'Semua';
  const rawPage = parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const search = searchParams.get('q') ?? '';
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

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

  // ── Build archive list from real data ───────────────────────────────────────
  // A3.1: Call directly (no useMemo) so the count always stays in sync with
  // Livestock.tsx which also calls buildArchiveList() directly each render.
  const ALL_ARCHIVE = buildArchiveList();

  // ── Adapted lists for shared FilterSheet option builders ─────────────────────
  // Archived items have no program/blok/kandang — those chip groups show empty state.
  const adaptedIndividuList: FilterableIndividu[] = ALL_ARCHIVE.map((item) => ({
    blok: undefined,
    kandang: undefined,
    program: undefined,
    batchId: undefined,
  }));

  // ── Reason counts — reason is always a valid ArchiveReason, never null ───────
  const categoryCounts = useMemo(
    () => buildCountMap(ALL_ARCHIVE, (item) => item.reason),
    [ALL_ARCHIVE],
  );

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    return ALL_ARCHIVE.filter((item) => {
      if (tab !== 'Semua' && item.reason !== (tab as ArchiveReason)) return false;
      if (filters.jenis !== 'Semua Jenis' && item.type !== filters.jenis) return false;
      if (filters.ras   && item.ras !== filters.ras)                       return false;
      // Archived animals have no program/location — ignore those filter fields
      if (search) {
        const q = search.toLowerCase();
        if (!item.id.toLowerCase().includes(q) && !(item.name ?? '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [ALL_ARCHIVE, tab, filters, search]);

  const { pagedItems, totalPages } = paginateItems(filteredItems, page, PAGE_SIZE);

  const activeFilterCount = countActiveFilters(filters);

  function handleRemoveChip(key: keyof Filters) {
    setFilters((prev) => ({ ...prev, ...handleRemoveFilterChip(key, prev) }));
  }

  // ── Supabase loading / error guard ──────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 36 }}>⏳</span>
        <div style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 600 }}>Memuat data arsip ternak...</div>
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
    <div style={{ padding: '14px 16px 80px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Info banner ───────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff8e1', border: '1px solid #f5e2a0', borderRadius: 'var(--radius-sm)',
        padding: '10px 12px', fontSize: 11, color: '#8a6d1f', fontWeight: 600, lineHeight: 1.5,
        display: 'flex', gap: 8, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 14 }}>ℹ️</span>
        <span>Data arsip bersifat baca-saja. Ternak tidak pernah dihapus permanen — Identitas Digital tetap tersimpan selamanya.</span>
      </div>

      {/* ── Summary ───────────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '14px 16px',
      }}>
        <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>Total Arsip</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>
          {ALL_ARCHIVE.length} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-muted)' }}>ekor</span>
        </div>
        {/* Reason breakdown — Mati / Terjual / Hibah only */}
        <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
          {Object.entries(REASON_CONFIG).map(([reason, cfg]) => {
            const count = categoryCounts[reason] ?? 0;
            if (count === 0) return null;
            return (
              <div key={reason} style={{ fontSize: 11, color: cfg.color }}>
                {cfg.icon} {reason}: <strong>{count}</strong>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Category tabs ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {VALID_CATEGORIES.map((t) => {
          const active = tab === t;
          const count  = t === 'Semua' ? ALL_ARCHIVE.length : (categoryCounts[t] ?? 0);
          const tabIcon = t === 'Semua' ? null : REASON_CONFIG[t as ArchiveReason]?.icon;
          return (
            <button key={t} type="button"
              onClick={() => setParam({ category: t !== 'Semua' ? t : null, page: null })}
              style={{
                flexShrink: 0, padding: '7px 14px', fontSize: 12, fontWeight: 700,
                border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                borderRadius: 20,
                background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                color: active ? '#fff' : 'var(--color-muted)',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {tabIcon} {t}
              {count > 0 && <span style={{ marginLeft: 4, opacity: 0.8 }}>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* ── Search + Filter ───────────────────────────────────────────────── */}
      <div>
        <SearchFilterBar
          query={search}
          onSearch={(q) => { setParam({ q: q || null, page: null }); }}
          onFilter={() => setFilterOpen(true)}
          activeFilterCount={activeFilterCount}
          mode="individu"
        />
        <FilterChips filters={filters} mode="individu" onRemove={handleRemoveChip} />
      </div>

      {/* ── List ──────────────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
            Daftar Arsip
          </h2>
          <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>{filteredItems.length} data</span>
        </div>

        {pagedItems.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pagedItems.map((item) => (
              <ArchiveCard key={item.id} item={item} onOpen={() => navigate(`/livestock/${item.id}`)} />
            ))}
          </div>
        )}

        {/* ── Pagination (always visible) ───────────────────────────────── */}
        <Pagination page={page} total={totalPages} onChange={(p) => { setParam({ page: p > 1 ? String(p) : null }); }} />
      </div>

      {/* ── Filter sheet ──────────────────────────────────────────────────── */}
      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        mode="individu"
        filters={filters}
        onChangeFilters={(f) => { setFilters(f); setParam({ page: null }); }}
        onReset={() => { setFilters(DEFAULT_FILTERS); setFilterOpen(false); }}
        individuList={adaptedIndividuList}
        batchList={[]}
      />
    </div>
  );
}
