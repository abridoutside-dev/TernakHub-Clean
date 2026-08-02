/**
 * LivestockFilterSheet — shared livestock filter components extracted from CatatBobot.tsx
 * as the authoritative source of truth (LS-FILTER-001).
 *
 * Exports:
 *   - Filters type + DEFAULT_FILTERS
 *   - Option constants (JENIS_OPTS, STATUS_OPTS, PROGRAM_OPTS, PROGRAM_SUB_MASTER, PROGRAM_SUB_OPTIONS)
 *   - Dynamic option builders (buildBlokOptions, buildKandangOptions, ...)
 *   - countActiveFilters() utility
 *   - ChipGroup, FilterSheet, FilterChips, SegmentedControl, SearchFilterBar components
 */

import { SPECIES_NAMES, RAS_OPTIONS } from '../data/speciesData';
import { BATCH_DB } from '../data/batchData';
import { OUTSIDE_LIVESTOCK_DB } from '../data/transferData';

// ─── Filter option constants ──────────────────────────────────────────────────

// Jenis Ternak options read from the Master Species registry — adding a new
// species there makes it appear here automatically.
export const JENIS_OPTS = ['Semua Jenis', ...SPECIES_NAMES];

export const PROGRAM_OPTS = [
  'Semua Program',
  'Fattening',
  'Breeding',
  'Kontes',
  'Karantina',
  'Replacement',
  'Lainnya',
];

export const STATUS_OPTS = ['Semua Status', 'Aktif', 'Luar Kandang'];

/** Programs that have a child sub-filter section. */
export const PROGRAM_SUB_MASTER: Record<string, { label: string; emptyLabel: string }> = {
  Fattening:   { label: 'Batch',            emptyLabel: 'Belum ada Batch' },
  Breeding:    { label: 'Peran',            emptyLabel: 'Belum ada data Breeding' },
  Kontes:      { label: 'Fase Kontes',      emptyLabel: 'Belum ada data Kontes' },
  Karantina:   { label: 'Status Karantina', emptyLabel: 'Belum ada data Karantina' },
  Replacement: { label: 'Kategori',         emptyLabel: 'Belum ada data Replacement' },
};

/**
 * Static sub-options per program.
 * Fattening is absent because its options come from BATCH_DB (dynamic).
 */
export const PROGRAM_SUB_OPTIONS: Record<string, string[]> = {
  Breeding:    ['Pejantan', 'Induk'],
  Kontes:      ['Persiapan', 'Event', 'Juara'],
  Replacement: ['Calon Induk', 'Calon Pejantan', 'Seleksi'],
  Karantina:   ['Masuk', 'Dalam Karantina', 'Selesai'],
};

/**
 * Master list of valid temporary-transfer reasons.
 * Runtime OUTSIDE_LIVESTOCK_DB can add new values on top of this list.
 */
const TEMP_TRANSFER_REASONS: string[] = [
  'Antar Kandang',
  'Penitipan Farm',
  'Dokter Hewan',
  'Layanan Kawin',
  'Kontes',
  'Karantina',
  'Lainnya',
];

// ─── Filters type ─────────────────────────────────────────────────────────────

export type Filters = {
  jenis: string;        // 'Semua Jenis' | livestock type
  ras: string;          // '' = all | specific ras — only shown when jenis is specific
  program: string;      // 'Semua Program' | program name
  programSub: string;   // '' = all | sub-value within chosen program
  status: string;       // 'Semua Status' | 'Aktif' | 'Luar Kandang'
  blok: string;         // '' = all | blok — only shown when status = 'Aktif'
  kandang: string;      // '' = all | kandang — only shown when status = 'Aktif'
  lokasiLuar: string;   // '' = all | reason — only shown when status = 'Luar Kandang'
  batchId: string;      // '' = all | batch id filter (used by KesehatanHewan individu mode)
};

export const DEFAULT_FILTERS: Filters = {
  jenis: 'Semua Jenis', ras: '',
  program: 'Semua Program', programSub: '',
  status: 'Semua Status',
  blok: '', kandang: '', lokasiLuar: '',
  batchId: '',
};

// ─── Minimal interfaces for option builders ───────────────────────────────────

export interface FilterableIndividu {
  blok?: string;
  kandang?: string;
  program?: string;
  batchId?: string;
}

export interface FilterableBatch {
  members: Array<{ blok?: string; kandang?: string }>;
}

// ─── Dynamic option builders ──────────────────────────────────────────────────

export function buildBlokOptions(list: FilterableIndividu[]): string[] {
  const set = new Set<string>();
  list.forEach((item) => { if (item.blok) set.add(item.blok); });
  return Array.from(set).sort();
}

export function buildKandangOptions(list: FilterableIndividu[]): string[] {
  const set = new Set<string>();
  list.forEach((item) => { if (item.kandang) set.add(item.kandang); });
  return Array.from(set).sort();
}

export function buildBlokOptionsFromBatches(list: FilterableBatch[]): string[] {
  const set = new Set<string>();
  list.forEach((b) => b.members.forEach((m) => { if (m.blok) set.add(m.blok); }));
  return Array.from(set).sort();
}

export function buildKandangOptionsFromBatches(list: FilterableBatch[]): string[] {
  const set = new Set<string>();
  list.forEach((b) => b.members.forEach((m) => { if (m.kandang) set.add(m.kandang); }));
  return Array.from(set).sort();
}

export function buildLokasiLuarOptions(): string[] {
  // Always start from master list; runtime data can only ADD new values.
  const set = new Set<string>(TEMP_TRANSFER_REASONS);
  OUTSIDE_LIVESTOCK_DB.forEach((e) => { if (e.reason) set.add(e.reason); });
  return Array.from(set);
}

export function buildFatteningBatchOptions(list: FilterableIndividu[]): string[] {
  const set = new Set<string>();
  list.forEach((item) => {
    if (item.program === 'Fattening' && item.batchId) set.add(item.batchId);
  });
  // Also add non-archived batches from BATCH_DB even if no individu yet
  Object.values(BATCH_DB)
    .filter((b) => b.status !== 'Diarsipkan')
    .forEach((b) => set.add(b.id));
  return Array.from(set).sort();
}

// ─── Count active filters (for badge on Filter button) ────────────────────────

export function countActiveFilters(filters: Filters): number {
  return [
    filters.jenis !== 'Semua Jenis',
    !!filters.ras,
    filters.program !== 'Semua Program',
    !!filters.programSub,
    filters.status !== 'Semua Status',
    !!filters.blok,
    !!filters.kandang,
    !!filters.lokasiLuar,
    !!filters.batchId,
  ].filter(Boolean).length;
}

// ─── Handle remove chip — shared reset helper ─────────────────────────────────

export function handleRemoveFilterChip(
  key: keyof Filters,
  current: Filters,
): Partial<Filters> {
  if (key === 'jenis')       return { jenis: 'Semua Jenis', ras: '' };
  if (key === 'ras')         return { ras: '' };
  if (key === 'program')     return { program: 'Semua Program', programSub: '' };
  if (key === 'programSub')  return { programSub: '' };
  if (key === 'status')      return { status: 'Semua Status', blok: '', kandang: '', lokasiLuar: '' };
  if (key === 'blok')        return { blok: '' };
  if (key === 'kandang')     return { kandang: '' };
  if (key === 'lokasiLuar')  return { lokasiLuar: '' };
  return {};
}

// ─── ChipGroup ────────────────────────────────────────────────────────────────

export function ChipGroup({ label, options, value, onChange, indent, defaultValue = '', emptyLabel }: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  indent?: boolean;
  /** Value to revert to when the active chip is tapped again. Defaults to '' (clear). */
  defaultValue?: string;
  /**
   * Text shown when options is empty. When provided the section always renders.
   * When omitted AND options is empty, the section is hidden.
   */
  emptyLabel?: string;
}) {
  if (options.length === 0 && !emptyLabel) return null;
  return (
    <div style={{ paddingLeft: indent ? 12 : 0, borderLeft: indent ? '2px solid var(--color-border)' : 'none' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
        {label}
      </div>
      {options.length === 0 ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 12px',
          background: 'var(--color-bg)',
          border: '1.5px dashed var(--color-border)',
          borderRadius: 10,
          fontSize: 12, color: 'var(--color-muted)', fontStyle: 'italic',
        }}>
          <span style={{ fontSize: 14 }}>📭</span>
          {emptyLabel}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {options.map((opt) => {
            const active = value === opt;
            return (
              <button key={opt} type="button" onClick={() => onChange(active ? defaultValue : opt)} style={{
                padding: '7px 13px', fontSize: 12, fontWeight: 700,
                border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                borderRadius: 20,
                background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                color: active ? '#fff' : 'var(--color-muted)',
                cursor: 'pointer',
              }}>
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── FilterSheet (cascading chip-based bottom sheet) ──────────────────────────

export function FilterSheet({
  open, onClose, mode, filters, onChangeFilters, onReset, individuList, batchList,
}: {
  open: boolean;
  onClose: () => void;
  mode: 'individu' | 'batch';
  filters: Filters;
  onChangeFilters: (f: Filters) => void;
  onReset: () => void;
  individuList: FilterableIndividu[];
  batchList: FilterableBatch[];
}) {
  if (!open) return null;

  const rasOptions = filters.jenis !== 'Semua Jenis' ? (RAS_OPTIONS[filters.jenis] ?? []) : [];
  const fatteningBatchOpts = buildFatteningBatchOptions(individuList);
  // M-02 fix: buildBlokOptionsFromBatches/buildKandangOptionsFromBatches require a
  // FilterableBatch.members field that BatchRecord does not have. Calling them in
  // batch mode causes a TypeError ("Cannot read properties of undefined, 'forEach'")
  // the moment any batch exists and the filter sheet opens. Batch records carry no
  // per-member location data at this layer, so location-based options are empty.
  const blokOpts    = mode === 'individu' ? buildBlokOptions(individuList)    : [];
  const kandangOpts = mode === 'individu' ? buildKandangOptions(individuList) : [];
  const lokasiLuarOpts = buildLokasiLuarOptions();

  function changeJenis(v: string) {
    onChangeFilters({ ...filters, jenis: v, ras: '' });
  }
  function changeProgram(v: string) {
    onChangeFilters({ ...filters, program: v, programSub: '' });
  }
  function changeStatus(v: string) {
    onChangeFilters({ ...filters, status: v, blok: '', kandang: '', lokasiLuar: '' });
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }} />
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 201,
        maxWidth: 480, margin: '0 auto',
        background: 'var(--color-surface)', borderRadius: '16px 16px 0 0',
        maxHeight: '88vh', display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-md)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)' }}>Filter</span>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 18, color: 'var(--color-muted)', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Jenis Ternak */}
          <ChipGroup
            label="Jenis Ternak"
            options={JENIS_OPTS}
            value={filters.jenis}
            onChange={changeJenis}
            defaultValue="Semua Jenis"
          />

          {/* ── Ras (cascade from Jenis) */}
          {filters.jenis !== 'Semua Jenis' && (
            <ChipGroup
              label={`Ras ${filters.jenis}`}
              options={rasOptions}
              value={filters.ras}
              onChange={(v) => onChangeFilters({ ...filters, ras: v })}
              indent
              emptyLabel={`Belum ada data ras ${filters.jenis}`}
            />
          )}

          {/* ── Program */}
          <ChipGroup
            label="Program"
            options={PROGRAM_OPTS}
            value={filters.program}
            onChange={changeProgram}
            defaultValue="Semua Program"
          />

          {/* ── Program Sub-filter (cascade from Program) */}
          {filters.program !== 'Semua Program' && PROGRAM_SUB_MASTER[filters.program] && (() => {
            const meta = PROGRAM_SUB_MASTER[filters.program];
            const opts = filters.program === 'Fattening'
              ? fatteningBatchOpts
              : (PROGRAM_SUB_OPTIONS[filters.program] ?? []);
            return (
              <ChipGroup
                label={meta.label}
                options={opts}
                value={filters.programSub}
                onChange={(v) => onChangeFilters({ ...filters, programSub: v })}
                indent
                emptyLabel={meta.emptyLabel}
              />
            );
          })()}

          {/* ── Status Lokasi */}
          <ChipGroup
            label="Status Lokasi"
            options={STATUS_OPTS}
            value={filters.status}
            onChange={changeStatus}
            defaultValue="Semua Status"
          />

          {/* ── Blok (cascade from Aktif) */}
          {filters.status === 'Aktif' && (
            <ChipGroup
              label="Blok"
              options={blokOpts}
              value={filters.blok}
              onChange={(v) => onChangeFilters({ ...filters, blok: v })}
              indent
              emptyLabel="Belum ada Blok"
            />
          )}

          {/* ── Nomor Kandang (cascade from Aktif) */}
          {filters.status === 'Aktif' && (
            <ChipGroup
              label="Nomor Kandang"
              options={kandangOpts}
              value={filters.kandang}
              onChange={(v) => onChangeFilters({ ...filters, kandang: v })}
              indent
              emptyLabel="Belum ada Nomor Kandang"
            />
          )}

          {/* ── Lokasi Luar Kandang (cascade from Luar Kandang) */}
          {filters.status === 'Luar Kandang' && (
            <ChipGroup
              label="Lokasi"
              options={lokasiLuarOpts}
              value={filters.lokasiLuar}
              onChange={(v) => onChangeFilters({ ...filters, lokasiLuar: v })}
              indent
              emptyLabel="Belum ada Lokasi"
            />
          )}

        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
          <button type="button" onClick={onReset} style={{ flex: 1, padding: '11px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Reset</button>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Terapkan</button>
        </div>
      </div>
    </>
  );
}

// ─── FilterChips (active filters shown below search bar) ──────────────────────

type FilterChipDef = { key: keyof Filters; label: string };

export function FilterChips({
  filters, mode, onRemove,
}: {
  filters: Filters;
  mode: 'individu' | 'batch';
  onRemove: (key: keyof Filters) => void;
}) {
  const chips: FilterChipDef[] = [];

  if (filters.jenis !== 'Semua Jenis')    chips.push({ key: 'jenis',      label: filters.jenis });
  if (filters.ras)                         chips.push({ key: 'ras',        label: filters.ras });
  if (filters.program !== 'Semua Program') chips.push({ key: 'program',    label: filters.program });
  if (filters.programSub)                  chips.push({ key: 'programSub', label: filters.programSub });
  if (filters.status !== 'Semua Status')   chips.push({ key: 'status',     label: filters.status });
  if (filters.blok)                        chips.push({ key: 'blok',       label: filters.blok });
  if (filters.kandang)                     chips.push({ key: 'kandang',    label: filters.kandang });
  if (filters.lokasiLuar)                  chips.push({ key: 'lokasiLuar', label: filters.lokasiLuar });

  if (chips.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
      {chips.map(({ key, label }) => (
        <span
          key={key}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'var(--color-primary-light)',
            border: '1.5px solid var(--color-primary)',
            borderRadius: 20,
            padding: '4px 10px',
            fontSize: 11.5, fontWeight: 700, color: 'var(--color-primary)',
          }}
        >
          {label}
          <button
            type="button"
            onClick={() => onRemove(key)}
            aria-label={`Hapus filter ${label}`}
            style={{
              border: 'none', background: 'none', cursor: 'pointer',
              color: 'var(--color-primary)', fontSize: 12, fontWeight: 900,
              padding: 0, lineHeight: 1, display: 'flex', alignItems: 'center',
            }}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

// ─── SegmentedControl ─────────────────────────────────────────────────────────

export function SegmentedControl({ value, onChange }: {
  value: 'individu' | 'batch';
  onChange: (v: 'individu' | 'batch') => void;
}) {
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

// ─── SearchFilterBar ──────────────────────────────────────────────────────────

export function SearchFilterBar({ query, onSearch, onFilter, activeFilterCount, mode }: {
  query: string;
  onSearch: (q: string) => void;
  onFilter: () => void;
  activeFilterCount: number;
  mode: 'individu' | 'batch';
}) {
  return (
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
          onChange={(e) => onSearch(e.target.value)}
          style={{
            border: 'none', outline: 'none', flex: 1,
            fontSize: 13, color: 'var(--color-text)', background: 'transparent',
          }}
        />
        {query && (
          <button type="button" onClick={() => onSearch('')}
            style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
            ✕
          </button>
        )}
      </div>

      {/* Filter button */}
      <button
        type="button"
        onClick={onFilter}
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
          <span style={{
            background: 'rgba(255,255,255,0.25)', borderRadius: 20,
            padding: '1px 6px', fontSize: 11, fontWeight: 800,
          }}>
            {activeFilterCount}
          </span>
        )}
      </button>
    </div>
  );
}
