import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLivestock } from '../hooks/useLivestock';
import { recordWeight as recordWeightToSupabase } from '../services/livestockService';
import { useDebounce } from '../utils/useDebounce';
import {
  LIVESTOCK_DB, getWeightHistory, addWeightRecord, getRecentWeightEvents,
  getAdgThresholds, calculateAdg, isAdgOutsideNormal, type AdgThresholds,
} from '../data/livestockData';
import { getLivestockStatus, getOutsideEntry } from '../data/transferData';
import { BATCH_DB, getActiveBatchMembersWithLivestock, type BatchStatus } from '../data/batchData';
import { distributeBatchAverageWeight } from '../utils/weightDistribution';
import { paginateItems } from '../utils/livestockUtils';
import {
  Filters, DEFAULT_FILTERS, countActiveFilters,
  SegmentedControl, FilterSheet, FilterChips, SearchFilterBar,
} from '../components/LivestockFilterSheet';
import { generateBobotInsights, getBobotAnalytics } from '../data/aiInsightBobotData';
import { SectionLabel, Card, InsightCard } from '../components/InsightCard';

// ─── Data Builders (live registry reads — never memoized) ────────────────────

type IndividuRow = {
  id: string;
  name: string | null;
  type: string;
  icon: string;
  typeBg: string;
  ras: string;
  program: string;
  gender: string;
  batchId: string | undefined;
  blok: string;        // extracted from location (Di Kandang only)
  kandang: string;     // extracted from location (Di Kandang only)
  lokasiLuar: string;  // reason from OUTSIDE_LIVESTOCK_DB (Luar Kandang only)
  lastWeight: string;
  lastWeightUnit: string;
  hasWeightHistory: boolean;
  lastRecordedDate: string | null;
  locationStatus: 'Aktif' | 'Luar Kandang';
};

function extractBlok(location: string): string {
  const parts = location.split(', ');
  const blokPart = parts.find((p) => /blok/i.test(p));
  return blokPart ?? '';
}

function extractKandang(location: string): string {
  const parts = location.split(', ');
  const kandangPart = parts.find((p) => /kandang/i.test(p));
  return kandangPart ?? parts[0] ?? '';
}

function buildCatatBobotIndividuList(): IndividuRow[] {
  return Object.values(LIVESTOCK_DB)
    .filter((lv) => getLivestockStatus(lv.id) !== 'Arsip')
    .map((lv) => {
      const statusRaw = getLivestockStatus(lv.id);
      const isLuar = statusRaw === 'Luar Kandang';
      const history = getWeightHistory(lv.id);
      const latest = history[0] ?? null;
      const outsideEntry = isLuar ? getOutsideEntry(lv.id) : undefined;
      return {
        id: lv.id,
        name: lv.name,
        type: lv.type,
        icon: lv.typeIcon,
        typeBg: lv.typeBg,
        ras: lv.ras,
        program: lv.program,
        gender: lv.kelamin,
        batchId: lv.batch?.id ?? undefined,
        blok: isLuar ? '' : extractBlok(lv.location),
        kandang: isLuar ? '' : extractKandang(lv.location),
        lokasiLuar: outsideEntry?.reason ?? '',
        lastWeight: latest ? latest.weight : lv.weight,
        lastWeightUnit: latest ? latest.unit : lv.weightUnit,
        hasWeightHistory: latest !== null,
        lastRecordedDate: latest ? latest.date : null,
        locationStatus: isLuar ? 'Luar Kandang' : 'Aktif',
      };
    });
}

/**
 * Per-member data used ONLY for filter matching in Batch mode (not rendered).
 * Mirrors the same fields IndividuRow exposes so the Batch filter can be
 * evaluated with identical semantics — a batch matches a filter value when
 * at least one of its active members matches ("any member" semantics).
 */
type BatchMemberFilterInfo = {
  ras: string;
  gender: string;
  blok: string;         // '' when member is Luar Kandang
  kandang: string;       // '' when member is Luar Kandang
  lokasiLuar: string;    // '' when member is Aktif
  locationStatus: 'Aktif' | 'Luar Kandang';
};

type BatchRow = {
  id: string;
  name: string | null;
  type: string;
  icon: string;
  typeBg: string;
  program: string;
  status: BatchStatus;   // from BatchStatus enum in batchData.ts
  total: number;
  avgWeight: string;
  unit: string;
  members: BatchMemberFilterInfo[]; // internal — filter matching only, never rendered
};

function buildCatatBobotBatchList(): BatchRow[] {
  // No hard status filter here — all batches are included regardless of BatchStatus
  // (the Batch mode filter chain no longer has a Status Batch dimension; it now
  // mirrors Individu mode exactly).
  return Object.values(BATCH_DB)
    .map((b) => {
      const members = getActiveBatchMembersWithLivestock(b.id);
      const totalWeight = members.reduce((sum, m) => sum + (parseFloat(m.lv.weight) || 0), 0);
      const avgWeightNum = members.length > 0 ? totalWeight / members.length : 0;
      const memberFilterInfo: BatchMemberFilterInfo[] = members.map(({ lv }) => {
        const statusRaw = getLivestockStatus(lv.id);
        const isLuar = statusRaw === 'Luar Kandang';
        const outsideEntry = isLuar ? getOutsideEntry(lv.id) : undefined;
        return {
          ras: lv.ras,
          gender: lv.kelamin,
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
        avgWeight: avgWeightNum > 0 ? avgWeightNum.toFixed(0) : '—',
        unit: 'Kg',
        members: memberFilterInfo,
      };
    });
}

const ROWS_PER_PAGE_OPTS = [6, 12, 24];

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

// ─── Extended Filters ─────────────────────────────────────────────────────────

type Mode = 'individu' | 'batch';

// ─── Shared Bits ──────────────────────────────────────────────────────────────
// SectionLabel / Card / InsightCard now live in src/components/InsightCard.tsx
// (CB-SYNC-002 — removes duplication with RiwayatBobot.tsx, see CB-M1).

function ProgramBadge({ program }: { program: string }) {
  const cfg = PROGRAM_CONFIG[program] ?? PROGRAM_CONFIG['Lainnya'];
  return (
    <span style={{
      fontSize: 10, fontWeight: 700,
      color: cfg.color, background: cfg.bg,
      borderRadius: 20, padding: '2px 8px',
    }}>
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

// ─── AI Insight Card ──────────────────────────────────────────────────────────
// Real rule-based engine now lives in aiInsightBobotData.ts (CB-SYNC-002);
// rendering uses the shared InsightCard component (see src/components/InsightCard.tsx),
// no local placeholder/Pro-Free gate.

// ─── Summary ──────────────────────────────────────────────────────────────────

function SummarySection() {
  const a = getBobotAnalytics();
  return (
    <section>
      <SectionLabel title="Ringkasan Bobot" />
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '18px 16px 14px', gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>Ditimbang Hari Ini</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}>{a.ditimbangHariIni}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>Rata-rata Bobot</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--color-primary)', lineHeight: 1 }}>
              {a.rataRataBobot !== null ? <>{a.rataRataBobot.toFixed(1)} <span style={{ fontSize: 13, fontWeight: 700 }}>kg</span></> : '—'}
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--color-border)', margin: '0 16px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>🔼</span>
            <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
              Tertinggi: <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{a.beratTertinggi ? `${a.beratTertinggi.weight.toFixed(1)} kg` : '—'}</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>🔽</span>
            <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
              Terendah: <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{a.beratTerendah ? `${a.beratTerendah.weight.toFixed(1)} kg` : '—'}</span>
            </span>
          </div>
        </div>
      </Card>
    </section>
  );
}

// ─── Riwayat Terbaru (module-level history) ────────────────────────────────────

function RiwayatTerbaruSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const events = getRecentWeightEvents(5);
  return (
    <section>
      <SectionLabel title="Riwayat Terbaru" />
      {events.length === 0 ? (
        <Card style={{ padding: '24px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⚖️</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Belum ada riwayat pencatatan bobot.</div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.5 }}>Riwayat akan muncul setelah pencatatan bobot pertama dilakukan.</div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {events.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => navigate(`/livestock/${e.livestockId}/bobot`)}
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
              }}>⚖️</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>
                  {e.livestockName ?? e.livestockId}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                  {e.weight} {e.unit} · {e.date}
                </div>
              </div>
              {e.diff && (
                <span style={{ fontSize: 11, fontWeight: 700, color: e.diff.startsWith('+') ? 'var(--color-primary)' : 'var(--color-danger)' }}>
                  {e.diff} {e.unit}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Individual Card ──────────────────────────────────────────────────────────

function IndividuCard({
  item, selected, onToggleSelect, onCatatBobot,
}: {
  item: IndividuRow;
  selected: boolean;
  onToggleSelect: () => void;
  onCatatBobot: () => void;
}) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: selected ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      padding: '13px 14px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggleSelect}
        aria-label={`Pilih ${item.name ?? item.id}`}
        style={{ width: 18, height: 18, flexShrink: 0, cursor: 'pointer', accentColor: 'var(--color-primary)' }}
      />

      <div style={{
        width: 52, height: 52, borderRadius: 'var(--radius-sm)', flexShrink: 0,
        background: item.typeBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
      }}>
        {item.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
              {item.name ?? <span style={{ color: 'var(--color-muted)', fontStyle: 'italic', fontWeight: 400 }}>Tanpa Nama</span>}
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace', letterSpacing: 0.3, marginTop: 1 }}>
              {item.id}
            </div>
          </div>
          <StatusBadge status={item.locationStatus} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>
            {item.lastWeight} <span style={{ fontSize: 10, fontWeight: 600 }}>{item.lastWeightUnit}</span>
          </span>
          <span style={{ fontSize: 10, color: 'var(--color-border)' }}>·</span>
          <ProgramBadge program={item.program} />
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--color-muted)', marginTop: 4 }}>
          {item.hasWeightHistory
            ? `Dicatat terakhir: ${item.lastRecordedDate}`
            : 'Belum pernah dicatat'}
        </div>
      </div>

      <button
        type="button"
        onClick={onCatatBobot}
        style={{
          flexShrink: 0,
          background: 'var(--color-primary)', color: '#fff',
          border: 'none', borderRadius: 'var(--radius-sm)',
          padding: '9px 12px',
          fontSize: 12, fontWeight: 700,
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        Catat Bobot
      </button>
    </div>
  );
}

// ─── Batch Card ───────────────────────────────────────────────────────────────

function BatchListCard({ item, selected, onToggleSelect, onCatatBobot }: {
  item: BatchRow;
  selected: boolean;
  onToggleSelect: () => void;
  onCatatBobot: () => void;
}) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: selected ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      padding: '13px 14px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggleSelect}
        aria-label={`Pilih batch ${item.name ?? item.id}`}
        style={{ width: 18, height: 18, flexShrink: 0, cursor: 'pointer', accentColor: 'var(--color-primary)' }}
      />

      <div style={{
        width: 48, height: 48, borderRadius: 'var(--radius-sm)', flexShrink: 0,
        background: item.typeBg || 'var(--color-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
      }}>
        {item.icon || '📦'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', fontFamily: 'monospace', marginBottom: 5 }}>
          {item.id}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <ProgramBadge program={item.program} />
          <span style={{ fontSize: 10, color: 'var(--color-border)' }}>·</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>
            {item.total} <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-muted)' }}>ekor</span>
          </span>
          <span style={{ fontSize: 10, color: 'var(--color-border)' }}>·</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>
            ~{item.avgWeight} <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-muted)' }}>{item.unit}/ekor</span>
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onCatatBobot}
        style={{
          flexShrink: 0,
          background: 'var(--color-primary)', color: '#fff',
          border: 'none', borderRadius: 'var(--radius-sm)',
          padding: '9px 12px',
          fontSize: 12, fontWeight: 700,
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        Catat Bobot
      </button>
    </div>
  );
}

// ─── Multi-Select Toolbar ─────────────────────────────────────────────────────

function SelectionToolbar({
  allSelected, someSelected, onToggleAll, count,
}: {
  allSelected: boolean;
  someSelected: boolean;
  onToggleAll: () => void;
  count: number;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => { if (el) el.indeterminate = someSelected; }}
          onChange={onToggleAll}
          style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--color-primary)' }}
        />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Pilih Semua (halaman ini)</span>
      </label>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, letterSpacing: 0.3 }}>Dipilih</div>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-primary)' }}>{count} ekor</div>
      </div>
    </div>
  );
}

// ─── Sticky Selection Action Bar ──────────────────────────────────────────────

function SelectionActionBar({
  count, onCatatBobot, onClear,
}: {
  count: number;
  onCatatBobot: () => void;
  onClear: () => void;
}) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--color-surface)',
      borderTop: '1.5px solid var(--color-border)',
      boxShadow: '0 -4px 16px rgba(0,0,0,0.10)',
      padding: '12px 16px calc(12px + env(safe-area-inset-bottom, 0px))',
      display: 'flex', alignItems: 'center', gap: 10,
      zIndex: 250,
    }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)', flexShrink: 0 }}>
        {count} ekor dipilih
      </div>
      <div style={{ flex: 1 }} />
      <button
        type="button"
        onClick={onClear}
        style={{
          padding: '10px 14px', fontSize: 12.5, fontWeight: 700,
          border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
          background: 'var(--color-surface)', color: 'var(--color-muted)', cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        Batal / Clear Selection
      </button>
      <button
        type="button"
        onClick={onCatatBobot}
        style={{
          padding: '10px 18px', fontSize: 12.5, fontWeight: 700,
          border: 'none', borderRadius: 'var(--radius-sm)',
          background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        Catat Bobot
      </button>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page, totalPages, onPageChange, rowsPerPage, onRowsPerPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  rowsPerPage: number;
  onRowsPerPageChange: (n: number) => void;
}) {
  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    const end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    const arr: number[] = [];
    for (let p = start; p <= end; p++) arr.push(p);
    return arr;
  }, [page, totalPages]);

  const navBtn = (disabled: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--color-border)',
    background: disabled ? 'var(--color-bg)' : 'var(--color-surface)',
    color: disabled ? 'var(--color-border)' : 'var(--color-text)',
    fontSize: 12, fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} style={navBtn(page <= 1)}>‹ Prev</button>
        {pageNumbers.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              border: p === page ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
              background: p === page ? 'var(--color-primary)' : 'var(--color-surface)',
              color: p === page ? '#fff' : 'var(--color-text)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {p}
          </button>
        ))}
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} style={navBtn(page >= totalPages)}>Next ›</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>Baris per halaman</span>
        <select
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
          style={{
            padding: '5px 8px', fontSize: 12, fontWeight: 700,
            border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer',
          }}
        >
          {ROWS_PER_PAGE_OPTS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', textAlign: 'center', gap: 12 }}>
      <span style={{ fontSize: 48 }}>🐑</span>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>Tidak Ada Data</div>
      <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6, maxWidth: 240 }}>
        Tidak ada ternak/batch yang sesuai dengan pencarian atau filter yang dipilih.
      </div>
    </div>
  );
}

// ─── Weight Input Bottom Sheet ────────────────────────────────────────────────

type SheetTarget =
  | { kind: 'individu'; item: IndividuRow }
  | { kind: 'individu-multi'; items: IndividuRow[] }
  | { kind: 'batch'; item: BatchRow }
  | { kind: 'batch-multi'; items: BatchRow[] };

function FieldLabel({ label }: { label: string }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>
      {label}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastState = { message: string; type: 'success' | 'error' };

function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 3000);
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [onDismiss]);

  const isSuccess = toast.type === 'success';

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 18px',
        borderRadius: 'var(--radius-sm)',
        background: isSuccess ? '#1a7a4a' : '#c0392b',
        color: '#fff',
        fontSize: 13,
        fontWeight: 600,
        boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
        maxWidth: 'calc(100vw - 40px)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}
    >
      <span style={{ fontSize: 16 }}>{isSuccess ? '✓' : '✕'}</span>
      {toast.message}
    </div>
  );
}

// ─── ADG (Average Daily Gain) Soft Validation ────────────────────────────────
//
// Architecture note (CB-SYNC-002):
//   getAdgThresholds/calculateAdg/isAdgOutsideNormal/AdgThresholds now live in
//   livestockData.ts (imported above) so this soft-validation path and
//   aiInsightBobotData.ts's rule-based engine always use identical thresholds
//   — no duplicated business logic between the two.

/** Formats an ISO date string (YYYY-MM-DD) as DD/MM/YYYY for display. */
function formatDateDisplay(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function SoftValidationDialog({
  lastWeight, lastUnit, lastDate,
  newWeight,  newUnit,  newDate,
  onConfirm, onCancel,
}: {
  lastWeight: string;
  lastUnit: string;
  lastDate: string;
  newWeight: string;
  newUnit: string;
  newDate: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    // Default focus on "Periksa Lagi" — the safe choice per spec
    cancelRef.current?.focus();
  }, []);

  return (
    <>
      {/* Backdrop — tap to cancel (same as "Periksa Lagi") */}
      <div
        onClick={onCancel}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 400 }}
      />

      <div style={{
        position: 'fixed',
        left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 401,
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
        width: 'min(340px, calc(100vw - 32px))',
        maxHeight: 'calc(100vh - 48px)',
        overflowY: 'auto',
        padding: '24px 20px 20px',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {/* Title */}
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', textAlign: 'center' }}>
          ⚖️ Perubahan Bobot Perlu Diperiksa
        </div>

        {/* Weight + date comparison table */}
        <div style={{
          background: 'var(--color-bg)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {/* Last weight */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>Bobot terakhir</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)' }}>
              {lastWeight} <span style={{ fontSize: 11, fontWeight: 500 }}>{lastUnit}</span>
            </span>
          </div>
          {/* Last date */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>Tanggal terakhir</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>
              {formatDateDisplay(lastDate)}
            </span>
          </div>
          <div style={{ height: 1, background: 'var(--color-border)' }} />
          {/* New weight */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>Bobot baru</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-primary)' }}>
              {newWeight} <span style={{ fontSize: 11, fontWeight: 500 }}>{newUnit}</span>
            </span>
          </div>
          {/* New date */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>Tanggal pencatatan</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>
              {formatDateDisplay(newDate)}
            </span>
          </div>
        </div>

        {/* Neutral explanatory message */}
        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text)', lineHeight: 1.65, textAlign: 'center' }}>
          Terjadi perubahan bobot harian yang berada di luar kisaran normal.
        </p>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.65, textAlign: 'center' }}>
          Perubahan ini bisa saja benar, misalnya karena melahirkan, sakit, perubahan pakan, atau kondisi lainnya.
        </p>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.65, textAlign: 'center', fontWeight: 600 }}>
          Mohon pastikan hasil penimbangan sudah benar.
        </p>

        {/* Actions — "Periksa Lagi" is default-focused (the safe choice) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              border: '2px solid var(--color-primary)',
              background: 'var(--color-surface)',
              color: 'var(--color-primary)',
              fontSize: 13, fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Periksa Lagi
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'var(--color-primary)',
              color: '#fff',
              fontSize: 13, fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Tetap Simpan
          </button>
        </div>
      </div>
    </>
  );
}

// ─── ADG Multi-workflow Helpers ───────────────────────────────────────────────

/** Minimal data needed to run an ADG check on one animal. */
type AdgItem = {
  lastWeight: string;
  lastRecordedDate: string | null;
  type: string; // livestock species — used to look up thresholds
};

/**
 * Counts how many items have ADG outside their species normal range.
 * Items without a last date, an unknown species, or an un-computable
 * interval are not counted as abnormal (validation is silently skipped).
 * Used by the Individu-Multi workflow (per-animal input weight, unchanged
 * by CB-005). Batch workflows use countAbnormalAdgDistributed instead, since
 * each member gets its own post-distribution weight rather than the flat
 * batch-average input.
 */
function countAbnormalAdg(
  items: AdgItem[],
  newWeightStr: string,
  newDateStr: string,
): { total: number; abnormal: number } {
  let abnormal = 0;
  for (const item of items) {
    if (!item.lastRecordedDate) continue;
    const thresholds = getAdgThresholds(item.type);
    if (!thresholds) continue;
    const adg = calculateAdg(item.lastWeight, item.lastRecordedDate, newWeightStr, newDateStr);
    if (adg !== null && isAdgOutsideNormal(adg, thresholds)) abnormal++;
  }
  return { total: items.length, abnormal };
}

// ─── CB-005: Batch-average → per-individual distribution helpers ─────────────
//
// Per Business Rule CB-005: the weight a user types in Batch mode is the
// Batch's new AVERAGE weight, not a per-individual weight. The actual
// distribution math (delta-based, proportion-preserving) lives in
// `src/utils/weightDistribution.ts` so it stays UI-free and reusable.
// This section only wires that shared algorithm into Catat Bobot's batch
// workflows: computing each member's post-distribution weight, then running
// the existing CB-003 ADG check (unchanged) against that per-individual value
// instead of the flat average.

/** ADG item for a batch member, extended with the fields the distribution needs. */
type BatchAdgDistItem = AdgItem & { id: string; currentWeight: number };

/**
 * Builds distribution-ready ADG items for all active members of a batch.
 * `currentWeight` is the member's live base weight (same source
 * buildCatatBobotBatchList uses to compute the batch's displayed average),
 * used as the input to distributeBatchAverageWeight.
 */
function batchToAdgDistItems(batchId: string): BatchAdgDistItem[] {
  return getActiveBatchMembersWithLivestock(batchId).map(({ lv }) => {
    const history = getWeightHistory(lv.id);
    const latest  = history[0] ?? null;
    return {
      id:               lv.id,
      currentWeight:    parseFloat(lv.weight) || 0,
      lastWeight:       latest ? latest.weight : lv.weight,
      lastRecordedDate: latest ? latest.date   : null,
      type:             lv.type,
    };
  });
}

/** Result of distributing one batch's new average across its members. */
type BatchDistribution = {
  batchId: string;
  members: (BatchAdgDistItem & { newWeight: number })[];
};

/**
 * Applies CB-005 distribution to one batch's members for a given target
 * average weight.
 */
function distributeBatchMembers(batchId: string, targetAverage: number): BatchDistribution {
  const items      = batchToAdgDistItems(batchId);
  const distResult = distributeBatchAverageWeight(
    items.map((it) => ({ id: it.id, currentWeight: it.currentWeight })),
    targetAverage,
  );
  const newWeightById = new Map(distResult.map((r) => [r.id, r.newWeight]));
  return {
    batchId,
    members: items.map((it) => ({ ...it, newWeight: newWeightById.get(it.id) ?? it.currentWeight })),
  };
}

/**
 * Counts how many distributed members have ADG outside their species normal
 * range, using each member's OWN post-distribution weight (CB-005) rather
 * than the flat batch-average input. Uses the exact same calculateAdg /
 * getAdgThresholds / isAdgOutsideNormal used everywhere else (CB-003 is
 * unchanged) — only the per-member input weight differs.
 */
function countAbnormalAdgDistributed(
  distributions: BatchDistribution[],
  newDateStr: string,
): { total: number; abnormal: number } {
  let total    = 0;
  let abnormal = 0;
  for (const dist of distributions) {
    for (const member of dist.members) {
      total++;
      if (!member.lastRecordedDate) continue;
      const thresholds = getAdgThresholds(member.type);
      if (!thresholds) continue;
      const adg = calculateAdg(member.lastWeight, member.lastRecordedDate, String(member.newWeight), newDateStr);
      if (adg !== null && isAdgOutsideNormal(adg, thresholds)) abnormal++;
    }
  }
  return { total, abnormal };
}

// ─── Multi-Animal Soft Validation Dialog ──────────────────────────────────────

function MultiSoftValidationDialog({
  total, abnormal, onConfirm, onCancel,
}: {
  total: number;
  abnormal: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const normal = total - abnormal;

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 400 }}
      />

      <div style={{
        position: 'fixed',
        left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 401,
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
        width: 'min(340px, calc(100vw - 32px))',
        maxHeight: 'calc(100vh - 48px)',
        overflowY: 'auto',
        padding: '24px 20px 20px',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {/* Title */}
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', textAlign: 'center' }}>
          ⚖️ Perubahan Bobot Perlu Diperiksa
        </div>

        {/* Summary counts */}
        <div style={{
          background: 'var(--color-bg)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
            {total} ternak akan diperbarui.
          </div>
          <div style={{ height: 1, background: 'var(--color-border)' }} />
          <div style={{ fontSize: 12.5, color: 'var(--color-muted)' }}>
            {normal} ternak berada dalam kisaran normal.
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#c0392b' }}>
            {abnormal} ternak memiliki perubahan bobot harian di luar parameter.
          </div>
        </div>

        {/* Neutral message */}
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.65, textAlign: 'center' }}>
          Perubahan tersebut dapat terjadi karena berbagai kondisi (misalnya melahirkan, sakit, perubahan pakan, atau kondisi lainnya).
        </p>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-text)', fontWeight: 600, lineHeight: 1.65, textAlign: 'center' }}>
          Mohon pastikan hasil penimbangan sudah benar.
        </p>

        {/* Actions — "Periksa Lagi" is default-focused */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              border: '2px solid var(--color-primary)',
              background: 'var(--color-surface)',
              color: 'var(--color-primary)',
              fontSize: 13, fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Periksa Lagi
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'var(--color-primary)',
              color: '#fff',
              fontSize: 13, fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Tetap Simpan
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Weight Input Sheet ───────────────────────────────────────────────────────

/** Result passed to onSave after Simpan is tapped. */
type SaveResult = { success: boolean; error?: string };

function WeightInputSheet({ target, onClose, onSave }: {
  target: SheetTarget;
  onClose: () => void;
  /** Called when the user taps Simpan — receives save result and lets the page clear selection. */
  onSave: (result: SaveResult) => void;
}) {
  // Soft-validation state: null = none, 'single' = detail dialog, 'multi' = summary dialog
  type SoftValidationState =
    | { kind: 'single' }
    | { kind: 'multi'; total: number; abnormal: number };

  const [newWeight,      setNewWeight]      = useState('');
  const [date,           setDate]           = useState('');
  const [notes,          setNotes]          = useState('');
  const [loading,        setLoading]        = useState(false);
  const [softValidation, setSoftValidation] = useState<SoftValidationState | null>(null);
  const [weightError,    setWeightError]    = useState<string | null>(null);
  const [dateError,      setDateError]      = useState<string | null>(null);

  const weightRef = useRef<HTMLInputElement | null>(null);
  const dateRef   = useRef<HTMLInputElement | null>(null);

  // Needed to stamp the recorded_by field in livestock_weight_entries.
  const { currentUser } = useAuth();

  const isIndividu   = target.kind === 'individu';
  const isMulti      = target.kind === 'individu-multi';
  const isBatchMulti = target.kind === 'batch-multi';

  const currentWeightLabel = isIndividu ? 'Bobot Saat Ini' : 'Rata-rata Bobot Saat Ini';
  const newWeightLabel =
    isIndividu   ? 'Bobot Baru'
    : isMulti    ? 'Bobot Baru (untuk semua ekor terpilih)'
    : isBatchMulti ? 'Rata-rata Bobot Baru (untuk semua batch terpilih)'
    : 'Rata-rata Bobot Baru';

  const currentWeightValue =
    target.kind === 'individu' ? `${target.item.lastWeight} ${target.item.lastWeightUnit}`
    : target.kind === 'batch'  ? `${target.item.avgWeight} ${target.item.unit}`
    : null;

  const sheetSubtitle =
    isMulti      ? `${target.items.length} ekor dipilih`
    : isBatchMulti ? `${target.items.length} batch dipilih`
    : target.item.id;

  /**
   * Performs the actual write — Supabase first (durable), then the in-memory
   * localStorage bridge (immediate UI update within the session).
   *
   * Supabase writes use recordWeightToSupabase().  If no authenticated session
   * is available (currentUser is null) the write is skipped for Supabase but
   * still applied in-memory so the UI stays responsive while offline / dev.
   *
   * Write rules per workflow:
   *  - individu       → one write for the selected animal
   *  - individu-multi → one write per selected animal (same weight value)
   *  - batch          → one write per active member (proportion-preserving delta)
   *  - batch-multi    → same as batch, per each selected batch
   */
  async function doSave() {
    setSoftValidation(null);
    setLoading(true);
    try {
      const weightVal = newWeight.trim();
      const dateVal   = date.trim();
      const notesVal  = notes.trim() || null;
      const userId    = currentUser?.id ?? null;

      /**
       * Writes one weight entry to Supabase then to the in-memory bridge.
       * Throws on Supabase error so the caller surfaces it via the toast.
       */
      async function writeOne(
        animalId: string,
        weightStr: string,
        unit: string,
        recordDate: string,
        recordNotes: string | null,
      ) {
        if (userId) {
          const result = await recordWeightToSupabase(animalId, userId, {
            weight_kg: parseFloat(weightStr),
            date:      recordDate,
            notes:     recordNotes,
          });
          if (!result.ok) throw new Error(result.error);
        }
        // In-memory update for immediate display within the current session.
        addWeightRecord(animalId, weightStr, unit, recordDate, recordNotes);
      }

      if (target.kind === 'individu') {
        await writeOne(target.item.id, weightVal, target.item.lastWeightUnit, dateVal, notesVal);

      } else if (target.kind === 'individu-multi') {
        for (const item of target.items) {
          await writeOne(item.id, weightVal, item.lastWeightUnit, dateVal, notesVal);
        }

      } else if (target.kind === 'batch') {
        // CB-005: weightVal is the batch's new AVERAGE weight — distribute it
        // across members (proportion-preserving delta), never flatten to one value.
        const targetAverage = parseFloat(weightVal);
        const { members } = distributeBatchMembers(target.item.id, targetAverage);
        const membersById = new Map(
          getActiveBatchMembersWithLivestock(target.item.id).map(({ lv }) => [lv.id, lv]),
        );
        for (const member of members) {
          const lv = membersById.get(member.id);
          if (!lv) continue;
          // M-01 fix: clamp computed per-member weight to ≥ 0.1 kg.
          const safeWeight = Math.max(0.1, member.newWeight);
          await writeOne(lv.id, safeWeight.toFixed(1), lv.weightUnit, dateVal, notesVal);
        }

      } else if (target.kind === 'batch-multi') {
        // CB-005: same rule applies per selected batch.
        const targetAverage = parseFloat(weightVal);
        for (const batch of target.items) {
          const { members } = distributeBatchMembers(batch.id, targetAverage);
          const membersById = new Map(
            getActiveBatchMembersWithLivestock(batch.id).map(({ lv }) => [lv.id, lv]),
          );
          for (const member of members) {
            const lv = membersById.get(member.id);
            if (!lv) continue;
            // M-01 fix: same clamp as single-batch path above.
            const safeWeight = Math.max(0.1, member.newWeight);
            await writeOne(lv.id, safeWeight.toFixed(1), lv.weightUnit, dateVal, notesVal);
          }
        }
      }

      onSave({ success: true });
      onClose();
    } catch (err) {
      setLoading(false);
      const message = err instanceof Error ? err.message : String(err);
      onSave({ success: false, error: message });
    }
  }

  /**
   * Entry point for the Simpan button.
   * Runs ADG soft validation identically across all four workflows:
   *   - Single Individu    → detail dialog (shows last/new weight + dates)
   *   - Multi Individu     → summary dialog (counts normal vs. abnormal)
   *   - Single Batch       → summary dialog (checks all active members)
   *   - Multi Batch        → summary dialog (checks members of all selected batches)
   * If all animals are within normal ADG range, saves immediately.
   */
  function handleSave() {
    if (loading) return;

    // ── Field validation — in form order, before any business logic ──────────
    const weightTrimmed = newWeight.trim();
    const parsedWeight  = parseFloat(weightTrimmed);
    if (!weightTrimmed || isNaN(parsedWeight) || parsedWeight <= 0) {
      setWeightError('Bobot wajib diisi dengan angka yang valid.');
      weightRef.current?.focus();
      return;
    }
    setWeightError(null);

    const dateTrimmed = date.trim();
    if (!dateTrimmed) {
      setDateError('Tanggal Pencatatan wajib diisi.');
      dateRef.current?.focus();
      return;
    }
    // M-02 fix: reject future dates — a weight recorded in the future is invalid data
    // and also silently bypasses ADG soft validation (huge day-count → near-zero ADG).
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (dateTrimmed > todayIso) {
      setDateError('Tanggal tidak boleh melampaui hari ini.');
      dateRef.current?.focus();
      return;
    }
    setDateError(null);
    // ─────────────────────────────────────────────────────────────────────────

    if (target.kind === 'individu') {
      // ── Single individu ───────────────────────────────────────────────────
      // CB-003 MUST run for every IndividuRow regardless of batch membership.
      // target.item.batchId is intentionally NOT checked here — batch ownership
      // is irrelevant to per-animal ADG validation.  getAdgThresholds covers all
      // species (see its JSDoc) so a null return only happens for genuinely
      // unknown species, never because an animal belongs to a batch.
      if (target.item.lastRecordedDate && date) {
        const thresholds = getAdgThresholds(target.item.type);
        if (thresholds !== null) {
          const adg = calculateAdg(target.item.lastWeight, target.item.lastRecordedDate, newWeight, date);
          if (adg !== null && isAdgOutsideNormal(adg, thresholds)) {
            setSoftValidation({ kind: 'single' });
            return;
          }
        }
      }

    } else if (target.kind === 'individu-multi' && date) {
      // ── Multi individu ────────────────────────────────────────────────────
      const items: AdgItem[] = target.items.map((item) => ({
        lastWeight:       item.lastWeight,
        lastRecordedDate: item.lastRecordedDate,
        type:             item.type,
      }));
      const { total, abnormal } = countAbnormalAdg(items, newWeight, date);
      if (abnormal > 0) {
        setSoftValidation({ kind: 'multi', total, abnormal });
        return;
      }

    } else if (target.kind === 'batch' && date) {
      // ── Single batch — CB-005: distribute the entered average across all
      //    active members first, then run CB-003 ADG check per individual
      //    using its own post-distribution weight (not the flat average).
      const targetAverage = parseFloat(newWeight);
      const distribution = distributeBatchMembers(target.item.id, targetAverage);
      const { total, abnormal } = countAbnormalAdgDistributed([distribution], date);
      if (abnormal > 0) {
        setSoftValidation({ kind: 'multi', total, abnormal });
        return;
      }

    } else if (target.kind === 'batch-multi' && date) {
      // ── Multi batch — CB-005: each selected batch is distributed
      //    independently toward the same target average, then CB-003 checks
      //    every individual member across all selected batches.
      const targetAverage = parseFloat(newWeight);
      const distributions = target.items.map((b) => distributeBatchMembers(b.id, targetAverage));
      const { total, abnormal } = countAbnormalAdgDistributed(distributions, date);
      if (abnormal > 0) {
        setSoftValidation({ kind: 'multi', total, abnormal });
        return;
      }
    }

    doSave();
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.30)', zIndex: 300 }}
      />

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--color-surface)',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.13)',
        zIndex: 301,
        maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 20px 14px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>
              Catat Bobot
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
              {sheetSubtitle}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            style={{
              background: 'var(--color-bg)', border: 'none',
              borderRadius: '50%', width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, color: 'var(--color-muted)', cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '18px 20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {currentWeightValue !== null && (
            <div>
              <FieldLabel label={currentWeightLabel} />
              <input type="text" readOnly value={currentWeightValue} />
            </div>
          )}

          <div>
            <FieldLabel label={newWeightLabel} />
            <input
              ref={weightRef}
              type="number"
              min="0"
              step="0.1"
              placeholder="Contoh: 34.5"
              value={newWeight}
              onChange={(e) => { setNewWeight(e.target.value); setWeightError(null); }}
              style={weightError ? { borderColor: 'var(--color-danger, #c0392b)' } : undefined}
            />
            {weightError && (
              <div style={{ fontSize: 12, color: 'var(--color-danger, #c0392b)', marginTop: 4 }}>
                {weightError}
              </div>
            )}
          </div>

          <div>
            <FieldLabel label="Tanggal Pencatatan" />
            <input
              ref={dateRef}
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setDateError(null); }}
              style={dateError ? { borderColor: 'var(--color-danger, #c0392b)' } : undefined}
            />
            {dateError && (
              <div style={{ fontSize: 12, color: 'var(--color-danger, #c0392b)', marginTop: 4 }}>
                {dateError}
              </div>
            )}
          </div>

          <div>
            <FieldLabel label="Catatan (opsional)" />
            <textarea
              placeholder="Tambahkan catatan tentang penimbangan ini..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ minHeight: 80 }}
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? 'var(--color-muted)' : 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '13px 0',
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 4,
              opacity: loading ? 0.75 : 1,
              transition: 'background 0.15s, opacity 0.15s',
            }}
          >
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>

      {/* ── Single-individu Soft Validation Dialog ───────────────────────── */}
      {softValidation?.kind === 'single' && target.kind === 'individu' && target.item.lastRecordedDate && (
        <SoftValidationDialog
          lastWeight={target.item.lastWeight}
          lastUnit={target.item.lastWeightUnit}
          lastDate={target.item.lastRecordedDate}
          newWeight={newWeight}
          newUnit={target.item.lastWeightUnit}
          newDate={date}
          onConfirm={doSave}
          onCancel={() => setSoftValidation(null)}
        />
      )}

      {/* ── Multi-animal Summary Soft Validation Dialog ───────────────────── */}
      {softValidation?.kind === 'multi' && (
        <MultiSoftValidationDialog
          total={softValidation.total}
          abnormal={softValidation.abnormal}
          onConfirm={doSave}
          onCancel={() => setSoftValidation(null)}
        />
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CatatBobot() {
  const navigate = useNavigate();
  // Ensures LIVESTOCK_DB / BATCH_DB are populated from Supabase.
  const { isLoading, error, refresh: refreshLivestock } = useLivestock();
  const [mode,        setMode]        = useState<Mode>('individu');
  const [query,       setQuery]       = useState('');
  const debouncedQuery                = useDebounce(query, 300);
  const [filters,     setFilters]     = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen,  setFilterOpen]  = useState(false);
  const [page,        setPage]        = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTS[0]);
  const [sheetTarget, setSheetTarget] = useState<SheetTarget | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toast,       setToast]       = useState<ToastState | null>(null);

  // Live data — read directly each render so mutations are always reflected
  const ALL_INDIVIDU = buildCatatBobotIndividuList();
  const ALL_BATCH    = buildCatatBobotBatchList();

  // ── Filter logic ──────────────────────────────────────────────────────────
  const filteredIndividu = ALL_INDIVIDU.filter((item) => {
    // Jenis
    if (filters.jenis !== 'Semua Jenis' && item.type !== filters.jenis) return false;
    // Ras (dependent on Jenis)
    if (filters.ras && item.ras !== filters.ras) return false;
    // Program
    if (filters.program !== 'Semua Program' && item.program !== filters.program) return false;
    // Program sub-filter (only Fattening → batchId and Breeding → gender are evaluatable)
    if (filters.programSub) {
      if (filters.program === 'Fattening') {
        if (item.batchId !== filters.programSub) return false;
      } else if (filters.program === 'Breeding') {
        const sub = filters.programSub;
        if (sub === 'Pejantan' && !/jantan/i.test(item.gender)) return false;
        if (sub === 'Induk'    && !/betina/i.test(item.gender)) return false;
      }
      // Other programs have no data-backed sub-field — programSub is cleared by UI for them
    }
    // Status
    if (filters.status !== 'Semua Status' && item.locationStatus !== filters.status) return false;
    // Blok (dependent on Aktif)
    if (filters.blok && item.blok !== filters.blok) return false;
    // Kandang (dependent on Aktif)
    if (filters.kandang && item.kandang !== filters.kandang) return false;
    // Lokasi Luar (dependent on Luar Kandang)
    if (filters.lokasiLuar && item.lokasiLuar !== filters.lokasiLuar) return false;
    // Search (debounced — no filter per keystroke)
    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      if (!item.id.toLowerCase().includes(q) && !(item.name ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const filteredBatch = ALL_BATCH.filter((item) => {
    // Jenis
    if (filters.jenis !== 'Semua Jenis' && item.type !== filters.jenis) return false;
    // Ras (dependent on Jenis) — batch matches if any active member has this ras
    if (filters.ras && !item.members.some((m) => m.ras === filters.ras)) return false;
    // Program (batch label)
    if (filters.program !== 'Semua Program' && item.program !== filters.program) return false;
    // Program sub-filter — same shape as Individu: Fattening → specific batch, Breeding → member role
    if (filters.programSub) {
      if (filters.program === 'Fattening') {
        if (item.id !== filters.programSub) return false;
      } else if (filters.program === 'Breeding') {
        const sub = filters.programSub;
        if (sub === 'Pejantan' && !item.members.some((m) => /jantan/i.test(m.gender))) return false;
        if (sub === 'Induk'    && !item.members.some((m) => /betina/i.test(m.gender))) return false;
      }
      // Other programs have no data-backed sub-field — same no-op as Individu mode
    }
    // Status Lokasi — batch matches if any active member has this location status
    if (filters.status !== 'Semua Status' && !item.members.some((m) => m.locationStatus === filters.status)) return false;
    // Blok (dependent on Aktif)
    if (filters.blok && !item.members.some((m) => m.blok === filters.blok)) return false;
    // Kandang (dependent on Aktif)
    if (filters.kandang && !item.members.some((m) => m.kandang === filters.kandang)) return false;
    // Lokasi Luar (dependent on Luar Kandang)
    if (filters.lokasiLuar && !item.members.some((m) => m.lokasiLuar === filters.lokasiLuar)) return false;
    // Search (debounced — no filter per keystroke)
    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      if (!item.id.toLowerCase().includes(q) && !(item.name ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const currentFilteredList = mode === 'individu' ? filteredIndividu : filteredBatch;
  const { pagedItems, totalPages } = paginateItems(currentFilteredList as unknown[], page, rowsPerPage);
  const pagedIndividu = mode === 'individu' ? (pagedItems as IndividuRow[]) : [];
  const pagedBatch    = mode === 'batch'    ? (pagedItems as BatchRow[])    : [];

  // Keep page in range when filtered set shrinks
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset selection on mode switch or filter change.
  // Search (query), pagination (page, rowsPerPage) do NOT reset selection —
  // they narrow/navigate within the same dataset so existing picks stay valid.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [mode, filters.jenis, filters.ras, filters.program, filters.programSub,
      filters.status, filters.blok, filters.kandang, filters.lokasiLuar]);

  // allSelected / someSelected are computed against the CURRENT PAGE of whichever
  // mode is active, so the "Pilih Semua (halaman ini)" label stays accurate.
  const pagedCurrentItems = mode === 'individu' ? pagedIndividu : pagedBatch;
  const allSelected  = pagedCurrentItems.length > 0 && pagedCurrentItems.every((item) => selectedIds.has(item.id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  function handleModeChange(m: Mode) {
    setMode(m);
    setPage(1);
  }

  function handleQueryChange(v: string) {
    setQuery(v);
    setPage(1);
  }

  function handleChangeFilters(next: Filters) {
    setFilters(next);
    setPage(1);
  }

  function handleResetFilters() {
    setQuery('');
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }

  function handleRemoveFilterChip(key: keyof Filters) {
    const reset: Partial<Filters> = {};
    if (key === 'jenis')           { reset.jenis = 'Semua Jenis'; reset.ras = ''; }
    else if (key === 'ras')        { reset.ras = ''; }
    else if (key === 'program')    { reset.program = 'Semua Program'; reset.programSub = ''; }
    else if (key === 'programSub') { reset.programSub = ''; }
    else if (key === 'status')     { reset.status = 'Semua Status'; reset.blok = ''; reset.kandang = ''; reset.lokasiLuar = ''; }
    else if (key === 'blok')       { reset.blok = ''; }
    else if (key === 'kandang')    { reset.kandang = ''; }
    else if (key === 'lokasiLuar') { reset.lokasiLuar = ''; }
    handleChangeFilters({ ...filters, ...reset });
  }

  function handleRowsPerPageChange(n: number) {
    setRowsPerPage(n);
    setPage(1);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    // Operates on current-page items only, but accumulates across pages:
    //   - SELECT ALL  → UNION  current page IDs into the existing selection.
    //   - DESELECT ALL → REMOVE current page IDs from the existing selection.
    // This way selections from other pages are never lost.
    if (allSelected) {
      // Remove only the current-page items; preserve selections from other pages.
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pagedCurrentItems.forEach((item) => next.delete(item.id));
        return next;
      });
    } else {
      // Add current-page items to whatever is already selected (union, no duplicates).
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pagedCurrentItems.forEach((item) => next.add(item.id));
        return next;
      });
    }
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  // Called by WeightInputSheet when the user presses Simpan.
  function handleSaved(result: SaveResult) {
    if (result.success) {
      clearSelection();
      setToast({ message: 'Bobot berhasil disimpan.', type: 'success' });
    } else {
      const reason = result.error ? `: ${result.error}` : '.';
      setToast({ message: `Gagal menyimpan bobot${reason}`, type: 'error' });
    }
  }

  function dismissToast() {
    setToast(null);
  }

  function handleBulkCatatBobot() {
    // Collect from the FULL filtered list so cross-page selections are included.
    if (mode === 'individu') {
      const items = filteredIndividu.filter((item) => selectedIds.has(item.id));
      if (items.length === 0) return;
      setSheetTarget({ kind: 'individu-multi', items });
    } else {
      const items = filteredBatch.filter((item) => selectedIds.has(item.id));
      if (items.length === 0) return;
      setSheetTarget({ kind: 'batch-multi', items });
    }
  }

  // Count active filters (for badge on Filter button)
  const activeFilterCount = countActiveFilters(filters);

  const hasActiveFilters = activeFilterCount > 0 || !!query;

  const bobotInsightReport = generateBobotInsights();

  // ── Supabase loading / error guard ──────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 36 }}>⏳</span>
        <div style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 600 }}>Memuat data bobot ternak...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ padding: '24px 16px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>⚠️</span>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Gagal Memuat Data</div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: 16 }}>{error}</div>
        <button type="button" onClick={refreshLivestock}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <>

      {/* ── AI Insight ──────────────────────────────────────────────────── */}
      <InsightCard
        icon="⚖️"
        title="Insight Bobot"
        items={bobotInsightReport.items}
        analyzedAt={bobotInsightReport.analyzedAt}
        confidenceStatus={bobotInsightReport.confidenceStatus}
      />

      {/* ── Summary ─────────────────────────────────────────────────────── */}
      <SummarySection />

      {/* ── Mode ────────────────────────────────────────────────────────── */}
      <section>
        <SectionLabel title="Mode" />
        <SegmentedControl value={mode} onChange={handleModeChange} />
      </section>

      {/* ── Search + Filter (single row) ──────────────────────────────────
          [ 🔍 Search............... ] [ ⚙️ Filter (n) ]
          ──────────────────────────────────────────────────── */}
      <section>
        <SectionLabel title="Cari &amp; Filter" />

        <SearchFilterBar
          query={query}
          onSearch={handleQueryChange}
          onFilter={() => setFilterOpen(true)}
          activeFilterCount={activeFilterCount}
          mode={mode}
        />

        {/* Filter chips — shown below search row when any filter is active */}
        <FilterChips filters={filters} mode={mode} onRemove={handleRemoveFilterChip} />

        {/* Reset all — shown when search or filters are active */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              marginTop: 8,
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11.5, fontWeight: 700, color: 'var(--color-muted)',
              padding: 0,
            }}
          >
            ↺ Reset semua
          </button>
        )}
      </section>

      {/* ── List ─────────────────────────────────────────────────────────── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <SectionLabel title={mode === 'individu' ? 'Daftar Ternak' : 'Daftar Batch'} />
          <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 10 }}>
            {currentFilteredList.length} data
          </span>
        </div>

        {pagedCurrentItems.length > 0 && (
          <SelectionToolbar
            allSelected={allSelected}
            someSelected={someSelected}
            onToggleAll={toggleSelectAll}
            count={selectedIds.size}
          />
        )}

        {pagedItems.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mode === 'individu'
              ? pagedIndividu.map((item) => (
                  <IndividuCard
                    key={item.id}
                    item={item}
                    selected={selectedIds.has(item.id)}
                    onToggleSelect={() => toggleSelect(item.id)}
                    onCatatBobot={() => setSheetTarget({ kind: 'individu', item })}
                  />
                ))
              : pagedBatch.map((item) => (
                  <BatchListCard
                    key={item.id}
                    item={item}
                    selected={selectedIds.has(item.id)}
                    onToggleSelect={() => toggleSelect(item.id)}
                    onCatatBobot={() => setSheetTarget({ kind: 'batch', item })}
                  />
                ))}
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </section>

      {/* ── Riwayat Terbaru ─────────────────────────────────────────────── */}
      <RiwayatTerbaruSection navigate={navigate} />

      {/* ── Multi-Select Sticky Action Bar ─────────────────────────────── */}
      {selectedIds.size > 0 && (
        <SelectionActionBar
          count={selectedIds.size}
          onCatatBobot={handleBulkCatatBobot}
          onClear={clearSelection}
        />
      )}

      {/* ── Cascading Filter Sheet ──────────────────────────────────────── */}
      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        mode={mode}
        filters={filters}
        onChangeFilters={handleChangeFilters}
        onReset={handleResetFilters}
        individuList={ALL_INDIVIDU}
        batchList={ALL_BATCH}
      />

      {/* ── Weight Input Bottom Sheet ───────────────────────────────────── */}
      {sheetTarget && (
        <WeightInputSheet
          target={sheetTarget}
          onClose={() => setSheetTarget(null)}
          onSave={handleSaved}
        />
      )}

      {/* ── Save Feedback Toast ─────────────────────────────────────────── */}
      {toast && <Toast toast={toast} onDismiss={dismissToast} />}
    </>
  );
}
