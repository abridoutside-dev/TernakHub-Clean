// ─── LP-005: Riwayat Pemberian Pakan — List Page ──────────────────────────────
// Read-only audit trail untuk seluruh aktivitas pemberian pakan.
// Data bersumber dari LP-002/LP-003 (pemberianPakanData.ts). Tidak ada mutasi.

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLivestock } from '../hooks/useLivestock';
import { usePemberianPakan } from '../hooks/usePemberianPakan';
import { getPemberianPakanList, type PemberianPakanRecord } from '../data/pemberianPakanData';
import { LIVESTOCK_DB } from '../data/livestockData';
import { BATCH_DB } from '../data/batchData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function totalBerat(record: PemberianPakanRecord): { jumlah: number; satuan: string } {
  if (record.items.length === 0) return { jumlah: 0, satuan: '' };
  const total = record.items.reduce((s, i) => s + i.jumlah, 0);
  const satuans = [...new Set(record.items.map((i) => i.satuan))];
  return { jumlah: total, satuan: satuans.length === 1 ? satuans[0] : 'campuran' };
}

/** Extract kandang/blok from livestock location string (matches PemberianPakan.tsx pattern). */
function extractKandang(location: string): string {
  const parts = location.split(', ');
  return parts.find((p) => /kandang/i.test(p)) ?? parts[0] ?? '';
}

/** Build a map of targetId → lokasi label for quick lookup. */
function buildLokasiMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const lv of Object.values(LIVESTOCK_DB)) {
    const kandang = extractKandang(lv.location);
    if (kandang) map.set(lv.id, kandang);
  }
  for (const b of Object.values(BATCH_DB)) {
    // Use the most common kandang among active members
    map.set(b.id, 'Batch');
  }
  return map;
}

/** Distinct kandang options from all livestock. */
function buildLokasiOptions(): string[] {
  const set = new Set<string>();
  for (const lv of Object.values(LIVESTOCK_DB)) {
    const k = extractKandang(lv.location);
    if (k) set.add(k);
  }
  return ['Semua Lokasi', ...Array.from(set).sort()];
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'Draft':                    { label: 'Draft',    color: '#78909c', bg: '#eceff1' },
  'Siap Diproses':            { label: 'Siap',     color: '#0277bd', bg: '#e1f5fe' },
  'Pemberian Pakan Selesai':  { label: 'Selesai',  color: '#1b7a43', bg: '#e8f5ee' },
};

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  return (
    <h2 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
      {title}
    </h2>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: '#555', bg: '#eee' };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: '3px 8px', whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  );
}

// ─── Record Card ──────────────────────────────────────────────────────────────

function RecordCard({ record, onClick }: { record: PemberianPakanRecord; onClick: () => void }) {
  const berat = totalBerat(record);
  const isSelesai = record.status === 'Pemberian Pakan Selesai';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
        display: 'flex',
        overflow: 'hidden',
        outline: 'none',
        transition: 'box-shadow 0.15s',
      }}
    >
      {/* Left accent */}
      <div style={{ width: 4, background: isSelesai ? '#1b7a43' : record.status === 'Siap Diproses' ? '#0277bd' : '#b0bec5', flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0, padding: '13px 14px 11px' }}>

        {/* Row 1: tanggal + jam + status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 9 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>📅</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
              {formatDate(record.tanggal)}
            </span>
            <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>
              · {record.waktuPemberian}
            </span>
          </div>
          <StatusBadge status={record.status} />
        </div>

        {/* Row 2: target info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--radius-sm)', flexShrink: 0,
            background: record.targetTypeBg || 'var(--color-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
          }}>
            {record.targetIcon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {record.targetName ?? record.targetId}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
              <span style={{
                fontSize: 9, fontWeight: 700,
                color: record.targetKind === 'batch' ? '#5d4037' : '#1b5e20',
                background: record.targetKind === 'batch' ? '#efebe9' : '#e8f5e9',
                borderRadius: 20, padding: '2px 6px',
              }}>
                {record.targetKind === 'batch' ? '📦 Batch' : '🐑 Individu'}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--color-border)', margin: '8px 0' }} />

        {/* Row 3: stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11 }}>🌾</span>
            <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>
              {record.items.length} item pakan
            </span>
          </div>
          {berat.jumlah > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11 }}>⚖️</span>
              <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>
                {berat.jumlah.toLocaleString('id-ID')} {berat.satuan}
              </span>
            </div>
          )}
          {record.petugas && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
              <span style={{ fontSize: 11 }}>👤</span>
              <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>
                {record.petugas}
              </span>
            </div>
          )}
        </div>

        {/* Arrow hint */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>
            Lihat Detail ›
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 16 }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
        📋
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          {hasFilter ? 'Tidak Ada Hasil' : 'Belum Ada Riwayat'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
          {hasFilter
            ? 'Tidak ada riwayat yang cocok dengan filter yang dipilih.'
            : 'Riwayat pemberian pakan akan muncul di sini setelah pencatatan pertama dilakukan.'}
        </div>
      </div>
    </div>
  );
}

// ─── Filter Sheet ─────────────────────────────────────────────────────────────

interface Filters {
  dateFrom: string;
  dateTo: string;
  petugas: string;
  targetKind: 'Semua' | 'individu' | 'batch';
  lokasi: string;
}

const DEFAULT_FILTERS: Filters = {
  dateFrom: '',
  dateTo: '',
  petugas: '',
  targetKind: 'Semua',
  lokasi: 'Semua Lokasi',
};

function FilterSheet({
  open, filters, petugasOptions, lokasiOptions, onClose, onChange, onReset,
}: {
  open: boolean;
  filters: Filters;
  petugasOptions: string[];
  lokasiOptions: string[];
  onClose: () => void;
  onChange: (f: Filters) => void;
  onReset: () => void;
}) {
  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 400,
        background: 'var(--color-surface)', borderRadius: '20px 20px 0 0',
        padding: '20px 16px 40px', boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
        maxWidth: 480, margin: '0 auto', maxHeight: '85vh', overflowY: 'auto',
      }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--color-border)', margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>Filter</span>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 18, color: 'var(--color-muted)', cursor: 'pointer', padding: 4 }}>✕</button>
        </div>

        {/* Rentang Tanggal */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
            Rentang Tanggal
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>Dari</div>
              <input type="date" value={filters.dateFrom} onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })} style={{ width: '100%', padding: '10px', fontSize: 13, border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>Sampai</div>
              <input type="date" value={filters.dateTo} onChange={(e) => onChange({ ...filters, dateTo: e.target.value })} style={{ width: '100%', padding: '10px', fontSize: 13, border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>

        {/* Petugas */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
            Petugas
          </div>
          <select
            value={filters.petugas}
            onChange={(e) => onChange({ ...filters, petugas: e.target.value })}
            style={{ width: '100%', padding: '11px 12px', fontSize: 13, border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none' }}
          >
            <option value="">Semua Petugas</option>
            {petugasOptions.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Individu / Batch */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
            Tipe Target
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['Semua', 'individu', 'batch'] as const).map((k) => {
              const active = filters.targetKind === k;
              const label = k === 'Semua' ? 'Semua' : k === 'individu' ? '🐑 Individu' : '📦 Batch';
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => onChange({ ...filters, targetKind: k })}
                  style={{
                    flex: 1, padding: '10px 8px', fontSize: 12, fontWeight: 700,
                    border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: active ? '#fff' : 'var(--color-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lokasi */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
            Lokasi
          </div>
          <select
            value={filters.lokasi}
            onChange={(e) => onChange({ ...filters, lokasi: e.target.value })}
            style={{ width: '100%', padding: '11px 12px', fontSize: 13, border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none' }}
          >
            {lokasiOptions.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onReset} style={{ flex: 1, padding: '13px', fontSize: 14, fontWeight: 700, border: '1.5px solid var(--color-primary)', borderRadius: 'var(--radius-sm)', background: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}>
            Reset
          </button>
          <button type="button" onClick={onClose} style={{ flex: 2, padding: '13px', fontSize: 14, fontWeight: 700, border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer' }}>
            Terapkan Filter
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Active Filter Chips ───────────────────────────────────────────────────────

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--color-primary-light)', border: '1.5px solid var(--color-primary)', borderRadius: 20, padding: '4px 10px', flexShrink: 0 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)' }}>{label}</span>
      <button type="button" onClick={onRemove} style={{ border: 'none', background: 'none', padding: 0, fontSize: 11, color: 'var(--color-primary)', cursor: 'pointer', lineHeight: 1, marginLeft: 2 }}>✕</button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RiwayatPemberianPakan() {
  const navigate = useNavigate();

  // Populates PEMBERIAN_PAKAN_DB from Supabase so hard-refresh navigations
  // get live history instead of an empty in-memory store.
  usePemberianPakan();

  // Populates LIVESTOCK_DB and BATCH_DB from Supabase so deep-link /
  // hard-refresh navigations get live data instead of an empty in-memory store.
  const { isLoading, error, refresh } = useLivestock();
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 36 }}>⏳</span>
        <div style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 600 }}>Memuat riwayat pemberian pakan...</div>
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

  const [query,       setQuery]       = useState('');
  const [filters,     setFilters]     = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen,  setFilterOpen]  = useState(false);

  // Build option lists (non-memoized — data is in-memory, cheap to recompute)
  const records = getPemberianPakanList(); // already newest-first
  const lokasiMap = buildLokasiMap();
  const lokasiOptions = buildLokasiOptions();

  const petugasOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) { if (r.petugas) set.add(r.petugas); }
    return Array.from(set).sort();
  }, [records.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filter logic ────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return records.filter((r) => {
      // Search
      if (query) {
        const q = query.toLowerCase();
        const matchTarget  = (r.targetName ?? r.targetId).toLowerCase().includes(q);
        const matchPetugas = (r.petugas ?? '').toLowerCase().includes(q);
        const matchPakan   = r.items.some((i) => i.namaPakan.toLowerCase().includes(q) || (i.brand ?? '').toLowerCase().includes(q));
        if (!matchTarget && !matchPetugas && !matchPakan) return false;
      }
      // Date from
      if (filters.dateFrom && r.tanggal < filters.dateFrom) return false;
      // Date to
      if (filters.dateTo && r.tanggal > filters.dateTo) return false;
      // Petugas
      if (filters.petugas && r.petugas !== filters.petugas) return false;
      // Target kind
      if (filters.targetKind !== 'Semua' && r.targetKind !== filters.targetKind) return false;
      // Lokasi
      if (filters.lokasi && filters.lokasi !== 'Semua Lokasi') {
        const loc = lokasiMap.get(r.targetId) ?? '';
        if (loc !== filters.lokasi) return false;
      }
      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records.length, query, filters]);

  const activeFilterCount = [
    !!filters.dateFrom,
    !!filters.dateTo,
    !!filters.petugas,
    filters.targetKind !== 'Semua',
    filters.lokasi !== 'Semua Lokasi',
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0 || !!query;

  function handleReset() {
    setQuery('');
    setFilters(DEFAULT_FILTERS);
  }

  return (
    <>
      {/* ── Sticky Search + Filter Bar ─────────────────────────────────── */}
      <div style={{ position: 'sticky', top: 'var(--top-app-bar-height)', zIndex: 100, background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', padding: '10px 16px 0' }}>

        {/* Search + Filter button */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)', padding: '10px 12px' }}>
            <span style={{ fontSize: 15 }}>🔍</span>
            <input
              type="text"
              placeholder="Cari nama ternak, petugas, pakan..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: 'var(--color-text)', background: 'transparent' }}
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: 0 }}>✕</button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', flexShrink: 0,
              border: activeFilterCount > 0 ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              background: activeFilterCount > 0 ? 'var(--color-primary)' : 'var(--color-surface)',
              fontSize: 13, fontWeight: 700,
              color: activeFilterCount > 0 ? '#fff' : 'var(--color-text)',
              cursor: 'pointer',
            }}
          >
            <span>⚙️</span> Filter
            {activeFilterCount > 0 && (
              <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 20, padding: '1px 6px', fontSize: 11, fontWeight: 800 }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingBottom: 10 }}>
            {filters.dateFrom && <FilterChip label={`Dari: ${formatDate(filters.dateFrom)}`} onRemove={() => setFilters((f) => ({ ...f, dateFrom: '' }))} />}
            {filters.dateTo   && <FilterChip label={`Sampai: ${formatDate(filters.dateTo)}`} onRemove={() => setFilters((f) => ({ ...f, dateTo: '' }))} />}
            {filters.petugas  && <FilterChip label={`Petugas: ${filters.petugas}`} onRemove={() => setFilters((f) => ({ ...f, petugas: '' }))} />}
            {filters.targetKind !== 'Semua' && <FilterChip label={filters.targetKind === 'individu' ? '🐑 Individu' : '📦 Batch'} onRemove={() => setFilters((f) => ({ ...f, targetKind: 'Semua' }))} />}
            {filters.lokasi !== 'Semua Lokasi' && <FilterChip label={`Lokasi: ${filters.lokasi}`} onRemove={() => setFilters((f) => ({ ...f, lokasi: 'Semua Lokasi' }))} />}
            <button type="button" onClick={handleReset} style={{ border: 'none', background: 'none', fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', cursor: 'pointer', padding: '4px 2px' }}>
              ↺ Reset semua
            </button>
          </div>
        )}

        {/* Bottom padding when no chips */}
        {!hasActiveFilters && <div style={{ height: 10 }} />}
      </div>

      {/* ── List ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 32px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {filtered.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 2 }}>
            {filtered.length} riwayat ditemukan
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState hasFilter={hasActiveFilters} />
        ) : (
          filtered.map((r) => (
            <RecordCard
              key={r.id}
              record={r}
              onClick={() => navigate(`/riwayat-pemberian-pakan/${r.id}`)}
            />
          ))
        )}
      </div>

      {/* ── Filter Sheet ──────────────────────────────────────────────────── */}
      <FilterSheet
        open={filterOpen}
        filters={filters}
        petugasOptions={petugasOptions}
        lokasiOptions={lokasiOptions}
        onClose={() => setFilterOpen(false)}
        onChange={setFilters}
        onReset={handleReset}
      />
    </>
  );
}
