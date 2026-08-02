// ─── Riwayat Obat Tab (SO-006) ────────────────────────────────────────────────
// Timeline read-only pergerakan stok obat.
// Dirender di dalam StokObat.tsx saat mode === 'riwayat'.

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getRiwayatObatList,
  AKTIVITAS_CONFIG,
  JENIS_AKTIVITAS_LIST,
  type RiwayatObatRecord,
  type JenisAktivitas,
} from '../data/riwayatObatData';
import { getActiveStokObatList } from '../data/stokObatData';

// ─── Date-range presets ───────────────────────────────────────────────────────

type DatePreset = 'today' | '7d' | '30d' | 'custom' | 'all';

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'all',    label: 'Semua' },
  { key: 'today',  label: 'Hari Ini' },
  { key: '7d',     label: '7 Hari' },
  { key: '30d',    label: '30 Hari' },
  { key: 'custom', label: 'Kustom' },
];

function getPresetRange(preset: DatePreset): { from: Date | null; to: Date | null } {
  const now = new Date();
  if (preset === 'today') {
    const s = new Date(now); s.setHours(0, 0, 0, 0);
    const e = new Date(now); e.setHours(23, 59, 59, 999);
    return { from: s, to: e };
  }
  if (preset === '7d') {
    const s = new Date(now); s.setDate(now.getDate() - 6); s.setHours(0, 0, 0, 0);
    return { from: s, to: new Date(now) };
  }
  if (preset === '30d') {
    const s = new Date(now); s.setDate(now.getDate() - 29); s.setHours(0, 0, 0, 0);
    return { from: s, to: new Date(now) };
  }
  return { from: null, to: null };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ─── Filter Sheet ─────────────────────────────────────────────────────────────

interface FilterState {
  aktifitas: JenisAktivitas | 'all';
  produkKomersialUuid: string;  // '' = semua produk; filter by produk bukan batch spesifik
  customFrom: string;
  customTo: string;
}

function FilterSheet({
  filter,
  onApply,
  onClose,
}: {
  filter: FilterState;
  onApply: (f: FilterState) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<FilterState>(filter);

  const produkOptions = useMemo(() => {
    const seen = new Set<string>();
    return getActiveStokObatList().filter((i) => {
      if (seen.has(i.produkKomersialUuid)) return false;
      seen.add(i.produkKomersialUuid);
      return true;
    });
  }, []);

  function reset() {
    setLocal({ aktifitas: 'all', produkKomersialUuid: '', customFrom: '', customTo: '' });
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.4)' }}
      />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 400,
        background: 'var(--color-surface)', borderRadius: '20px 20px 0 0',
        padding: '20px 16px 40px', boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
        maxWidth: 480, margin: '0 auto', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--color-border)', margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>Filter Riwayat</span>
          <button type="button" onClick={onClose}
            style={{ border: 'none', background: 'none', fontSize: 18, color: 'var(--color-muted)', cursor: 'pointer', padding: 4 }}>✕</button>
        </div>

        {/* Jenis Aktivitas */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
            Jenis Aktivitas
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {(['all', ...JENIS_AKTIVITAS_LIST] as const).map((a) => {
              const active = local.aktifitas === a;
              const cfg = a !== 'all' ? AKTIVITAS_CONFIG[a] : null;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setLocal((p) => ({ ...p, aktifitas: a }))}
                  style={{
                    padding: '9px 10px', textAlign: 'left', fontSize: 12, fontWeight: 700,
                    border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    background: active ? 'var(--color-primary)' : (cfg ? cfg.bg : 'var(--color-bg)'),
                    color: active ? '#fff' : (cfg ? cfg.color : 'var(--color-muted)'),
                    cursor: 'pointer',
                  }}
                >
                  {cfg ? `${cfg.icon} ` : ''}{a === 'all' ? 'Semua' : a}
                </button>
              );
            })}
          </div>
        </div>

        {/* Produk */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
            Produk Obat
          </div>
          <select
            value={local.produkKomersialUuid}
            onChange={(e) => setLocal((p) => ({ ...p, produkKomersialUuid: e.target.value }))}
            style={{
              width: '100%', padding: '11px 12px', fontSize: 13,
              border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
              background: 'var(--color-bg)', color: 'var(--color-text)',
              outline: 'none', appearance: 'none', cursor: 'pointer',
            }}
          >
            <option value="">Semua Produk</option>
            {produkOptions.map((item) => (
              <option key={item.uuid} value={item.uuid}>
                {item.namaProduk} — {item.brand}
              </option>
            ))}
          </select>
        </div>

        {/* Rentang Tanggal Kustom */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
            Rentang Tanggal Kustom
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>Dari</div>
              <input
                type="date"
                value={local.customFrom}
                onChange={(e) => setLocal((p) => ({ ...p, customFrom: e.target.value }))}
                style={{
                  width: '100%', padding: '10px', fontSize: 13,
                  border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-bg)', color: 'var(--color-text)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>Sampai</div>
              <input
                type="date"
                value={local.customTo}
                onChange={(e) => setLocal((p) => ({ ...p, customTo: e.target.value }))}
                style={{
                  width: '100%', padding: '10px', fontSize: 13,
                  border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-bg)', color: 'var(--color-text)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={reset} style={{
            flex: 1, padding: 13, fontSize: 14, fontWeight: 700,
            border: '1.5px solid var(--color-primary)', borderRadius: 'var(--radius-sm)',
            background: 'none', color: 'var(--color-primary)', cursor: 'pointer',
          }}>Reset</button>
          <button type="button" onClick={() => { onApply(local); onClose(); }} style={{
            flex: 2, padding: 13, fontSize: 14, fontWeight: 700,
            border: 'none', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-primary)', color: '#fff', cursor: 'pointer',
          }}>Terapkan Filter</button>
        </div>
      </div>
    </>
  );
}

// ─── Timeline Card ────────────────────────────────────────────────────────────

function TimelineCard({ item }: { item: RiwayatObatRecord }) {
  const navigate = useNavigate();
  const cfg = AKTIVITAS_CONFIG[item.jenisAktivitas];
  const absQty = Math.abs(item.jumlahPerubahan);

  return (
    <button
      type="button"
      onClick={() => navigate(`/stok-obat/riwayat/${item.uuid}`)}
      style={{
        width: '100%', textAlign: 'left',
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
        display: 'flex', overflow: 'hidden', cursor: 'pointer', padding: 0,
      }}
    >
      {/* Left accent bar */}
      <div style={{ width: 4, background: cfg.accent, flexShrink: 0 }} />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, padding: '13px 14px 11px' }}>

        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          {/* Icon badge */}
          <div style={{
            width: 38, height: 38, borderRadius: 'var(--radius-sm)', flexShrink: 0,
            background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19,
          }}>
            {cfg.icon}
          </div>

          {/* Name + timestamp */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2, lineHeight: 1.2 }}>
              {item.namaProduk}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
              {formatTimestamp(item.timestamp)}
            </div>
          </div>

          {/* Qty + remaining */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1, color: cfg.color, marginBottom: 3 }}>
              {item.jumlahPerubahan === 0 ? '—' : `${cfg.sign}${absQty}`}{' '}
              <span style={{ fontSize: 10, fontWeight: 600 }}>{item.satuan}</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>
              Sisa: {item.jumlahSesudah.toLocaleString('id-ID')} {item.satuan}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--color-border)', margin: '10px 0 8px' }} />

        {/* Bottom row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {/* Activity chip */}
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: cfg.color, background: cfg.bg,
            borderRadius: 20, padding: '3px 8px',
          }}>
            {cfg.label}
          </span>

          {/* Alasan */}
          <span style={{
            fontSize: 11, color: 'var(--color-muted)', fontWeight: 500,
            borderLeft: '1px solid var(--color-border)', paddingLeft: 6,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120,
          }}>
            {item.alasan}
          </span>

          <div style={{ flex: 1 }} />

          {/* Operator */}
          <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>
            Oleh: <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{item.pengguna}</span>
          </span>
        </div>

        {/* Detail caret */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)' }}>
            Lihat Detail ›
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 16 }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%', background: 'var(--color-primary-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
      }}>📋</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          {hasFilter ? 'Tidak Ada Hasil' : 'Belum Ada Riwayat'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
          {hasFilter
            ? 'Coba ubah filter atau kata kunci pencarian.'
            : 'Setiap pergerakan stok obat akan tercatat di sini.'}
        </div>
      </div>
    </div>
  );
}

// ─── Active Filter Badge ──────────────────────────────────────────────────────

function ActiveFilterBadge({ count, onClear }: { count: number; onClear: () => void }) {
  if (count === 0) return null;
  return (
    <button type="button" onClick={onClear}
      style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
        padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
        border: '1.5px solid var(--color-primary)',
        background: 'var(--color-primary)', color: '#fff', cursor: 'pointer',
      }}>
      {count} filter aktif ✕
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RiwayatObatTab() {
  const [query,       setQuery]       = useState('');
  const [datePreset,  setDatePreset]  = useState<DatePreset>('all');
  const [showFilter,  setShowFilter]  = useState(false);
  const [filter, setFilter] = useState<FilterState>({
    aktifitas: 'all',
    produkKomersialUuid: '',
    customFrom: '',
    customTo: '',
  });

  // Resolve effective date range
  const { from: presetFrom, to: presetTo } = useMemo(
    () => getPresetRange(datePreset),
    [datePreset]
  );

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filter.aktifitas !== 'all') n++;
    if (filter.produkKomersialUuid) n++;
    if (filter.customFrom || filter.customTo) n++;
    return n;
  }, [filter]);

  // getRiwayatObatList() is called fresh inside filtered to avoid stale data after
  // in-memory mutations (addStokObatItem / applyPenyesuaianStok add to RIWAYAT_OBAT_RECORDS).
  const filtered = useMemo(() => {
    const allRecords = getRiwayatObatList();
    return allRecords.filter((item) => {
      // Search
      if (query) {
        const q = query.toLowerCase();
        const matchSearch =
          item.namaProduk.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q) ||
          item.jenisAktivitas.toLowerCase().includes(q) ||
          item.alasan.toLowerCase().includes(q) ||
          (item.pengguna && item.pengguna.toLowerCase().includes(q));
        if (!matchSearch) return false;
      }

      // Activity type filter
      if (filter.aktifitas !== 'all' && item.jenisAktivitas !== filter.aktifitas) return false;

      // Product filter — match by produkKomersialUuid so ALL batches of a product are shown
      if (filter.produkKomersialUuid && item.produkKomersialUuid !== filter.produkKomersialUuid) return false;

      // Date range — preset takes priority over custom
      const ts = new Date(item.timestamp);
      if (datePreset !== 'all' && datePreset !== 'custom') {
        if (presetFrom && ts < presetFrom) return false;
        if (presetTo   && ts > presetTo)   return false;
      } else if (datePreset === 'custom') {
        if (filter.customFrom) {
          const from = new Date(filter.customFrom);
          from.setHours(0, 0, 0, 0);
          if (ts < from) return false;
        }
        if (filter.customTo) {
          const to = new Date(filter.customTo);
          to.setHours(23, 59, 59, 999);
          if (ts > to) return false;
        }
      }

      return true;
    });
  }, [query, filter, datePreset, presetFrom, presetTo]);

  const hasAnyFilter = query.length > 0 || datePreset !== 'all' || activeFilterCount > 0;

  function clearAllFilters() {
    setQuery('');
    setDatePreset('all');
    setFilter({ aktifitas: 'all', produkKomersialUuid: '', customFrom: '', customTo: '' });
  }

  return (
    <>
      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 'var(--top-app-bar-height)', zIndex: 90,
        background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)',
        padding: '10px 16px 0',
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>

          {/* Search + Filter row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 8,
              border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)', padding: '10px 12px',
            }}>
              <span style={{ fontSize: 15 }}>🔍</span>
              <input
                type="text"
                placeholder="Cari nama obat, brand, aktivitas..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: 'var(--color-text)', background: 'transparent' }}
              />
              {query.length > 0 && (
                <button type="button" onClick={() => setQuery('')}
                  style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: 0 }}>✕</button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowFilter(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '10px 12px', flexShrink: 0,
                border: activeFilterCount > 0
                  ? '2px solid var(--color-primary)'
                  : '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                background: activeFilterCount > 0 ? 'var(--color-primary)' : 'var(--color-surface)',
                fontSize: 12, fontWeight: 700,
                color: activeFilterCount > 0 ? '#fff' : 'var(--color-text)',
                cursor: 'pointer',
              }}
            >
              <span>⚙️</span>
              <span>Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span>
            </button>
          </div>

          {/* Date-preset chips */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none', alignItems: 'center' }}>
            {DATE_PRESETS.map((p) => {
              const active = datePreset === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setDatePreset(p.key)}
                  style={{
                    flexShrink: 0, padding: '7px 14px', fontSize: 12, fontWeight: 700,
                    border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                    borderRadius: 20,
                    background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: active ? '#fff' : 'var(--color-muted)',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  {p.label}
                </button>
              );
            })}
            <ActiveFilterBadge count={activeFilterCount} onClear={() => setFilter({ aktifitas: 'all', produkKomersialUuid: '', customFrom: '', customTo: '' })} />
          </div>
        </div>
      </div>

      {/* ── List ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 32px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Result count + clear */}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>
              {filtered.length} transaksi ditemukan
            </div>
            {hasAnyFilter && (
              <button type="button" onClick={clearAllFilters}
                style={{ border: 'none', background: 'none', fontSize: 12, color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                Hapus Semua Filter
              </button>
            )}
          </div>
        )}

        {filtered.length === 0
          ? <EmptyState hasFilter={hasAnyFilter} />
          : filtered.map((item) => <TimelineCard key={item.uuid} item={item} />)
        }
      </div>

      {/* ── Filter Sheet ──────────────────────────────────────────────────── */}
      {showFilter && (
        <FilterSheet
          filter={filter}
          onApply={(f) => {
            setFilter(f);
            if (f.customFrom || f.customTo) setDatePreset('custom');
          }}
          onClose={() => setShowFilter(false)}
        />
      )}
    </>
  );
}
