import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLivestock } from '../hooks/useLivestock';
import { useBatch } from '../hooks/useBatch';
import { HeaderActionPortal } from '../components/TopAppBar';
import {
  recordAddBatchMember,
  recordRemoveBatchMember,
  recordFinishBatch,
  recordArchiveBatch,
  recordUpdateBatch,
  recordBatchHistoryEvent,
} from '../services/batchService';
import {
  getBatch,
  getBatchMembersWithLivestock,
  getBatchMemberships,
  getActiveBatchMembersWithLivestock,
  addBatchMember,
  removeBatchMember,
  finishBatch,
  archiveBatch,
  updateBatch,
  activateBatch,
  moveBatchMember,
  getBatchTimeline,
  addBatchTimelineEvent,
  MEMBERSHIP_DB,
  BATCH_DB,
  type BatchStatus,
  type MembershipWithLivestock,
  type BatchTimelineEvent,
} from '../data/batchData';
import { LIVESTOCK_DB, type LivestockRecord } from '../data/livestockData';
import { getLivestockStatus } from '../data/transferData';

// ─── Style Configs ────────────────────────────────────────────────────────────

const BATCH_STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  Aktif:      { bg: '#e8f5e9', color: '#2e7d32' },
  Selesai:    { bg: '#eceff1', color: '#546e7a' },
  Dibatalkan: { bg: '#ffebee', color: '#c62828' },
  Diarsipkan: { bg: '#f3e5f5', color: '#6a1b9a' },
};

const HEALTH_STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  Sehat:      { bg: '#e8f5e9', color: '#2e7d32' },
  Pemantauan: { bg: '#fff8e1', color: '#f57f17' },
  Sakit:      { bg: '#ffebee', color: '#c62828' },
};

const PROGRAM_CONFIG: Record<string, { bg: string; color: string }> = {
  Fattening:   { bg: '#e3f2fd', color: '#0277bd' },
  Breeding:    { bg: '#fce4ec', color: '#c2185b' },
  Kontes:      { bg: '#fff8e1', color: '#f57f17' },
  Karantina:   { bg: '#ffebee', color: '#c62828' },
  Replacement: { bg: '#f3e5f5', color: '#6a1b9a' },
  Lainnya:     { bg: '#eceff1', color: '#546e7a' },
};

const HISTORY_TYPE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  // Membership-derived events
  joined:          { icon: '➕', label: 'Bergabung ke batch',            color: '#2e7d32' },
  removed:         { icon: '➖', label: 'Dikeluarkan dari batch',        color: '#c62828' },
  finished:        { icon: '📦', label: 'Keanggotaan selesai',           color: '#546e7a' },
  moved:           { icon: '↗️', label: 'Ternak dipindahkan ke batch lain', color: '#0277bd' },
  // Batch-level timeline events
  batch_created:   { icon: '🆕', label: 'Batch dibuat',                  color: '#4caf50' },
  batch_activated: { icon: '✅', label: 'Batch diaktifkan',              color: '#2e7d32' },
  batch_closed:    { icon: '📦', label: 'Batch diselesaikan',            color: '#546e7a' },
  batch_archived:  { icon: '🗃️', label: 'Batch diarsipkan',             color: '#6a1b9a' },
  member_moved_out: { icon: '↗️', label: 'Ternak dipindah ke batch lain', color: '#0277bd' },
  member_moved_in:  { icon: '↙️', label: 'Ternak masuk dari batch lain', color: '#0288d1' },
  // BT-004: Batch Operations execution lifecycle
  operation_started:   { icon: '▶️', label: 'Operasi batch dimulai',        color: '#0277bd' },
  operation_completed: { icon: '✅', label: 'Operasi batch selesai',        color: '#2e7d32' },
  operation_partial:   { icon: '⚠️', label: 'Operasi batch selesai sebagian', color: '#f57f17' },
  operation_failed:    { icon: '❌', label: 'Operasi batch gagal',          color: '#c62828' },
};

const PAGE_SIZE = 5;

const SORT_OPTIONS: { key: string; label: string }[] = [
  { key: 'latest',     label: 'Terbaru Ditambahkan' },
  { key: 'oldest',     label: 'Terlama Ditambahkan'  },
  { key: 'nameAZ',     label: 'Nama A–Z'             },
  { key: 'nameZA',     label: 'Nama Z–A'             },
  { key: 'weightHigh', label: 'Bobot Tertinggi'       },
  { key: 'weightLow',  label: 'Bobot Terendah'        },
];

const MEMBER_PROGRAMS = ['Semua Program', 'Fattening', 'Breeding', 'Kontes', 'Karantina', 'Replacement', 'Lainnya'];
const MEMBER_SEX      = ['Semua', 'Jantan', 'Betina'];

// ─── Date Helpers ─────────────────────────────────────────────────────────────

const MONTH_MAP: Record<string, number> = {
  'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5,
  'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11,
};

function parseDateLabel(label: string): Date | null {
  const parts = label.trim().split(' ');
  if (parts.length < 3) return null;
  const day = parseInt(parts[0], 10);
  const month = MONTH_MAP[parts[1]];
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || month === undefined || isNaN(year)) return null;
  return new Date(year, month, day);
}

function batchDuration(createdDate: string): string {
  const start = parseDateLabel(createdDate);
  if (!start) return '—';
  const diffMs = Date.now() - start.getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days < 0) return '—';
  if (days === 0) return 'Hari ini';
  if (days < 30) return `${days} hari`;
  const months = Math.floor(days / 30);
  const rem = days % 30;
  return rem === 0 ? `${months} bulan` : `${months} bulan ${rem} hari`;
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

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

function Pagination({ page, totalPages, onChange }: {
  page: number; totalPages: number; onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
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
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)' }}>
        Halaman {page} dari {totalPages}
      </span>
      <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)} style={btn(page >= totalPages)}>›</button>
    </div>
  );
}

// ─── Header Actions ───────────────────────────────────────────────────────────

function HeaderActions({
  batchStatus,
  onEdit,
  onAddMember,
  onFinish,
  onArchive,
  onActivate,
  onOperasi,
}: {
  batchStatus: BatchStatus;
  onEdit: () => void;
  onAddMember: () => void;
  onFinish: () => void;
  onArchive: () => void;
  onActivate: () => void;
  onOperasi: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  // Build context-aware menu items
  type MenuItem = { icon: string; label: string; danger: boolean; action: () => void };
  const menuItems: MenuItem[] = [];

  if (batchStatus === 'Draft') {
    menuItems.push({ icon: '✅', label: 'Aktifkan Batch',   danger: false, action: onActivate });
    menuItems.push({ icon: '🗃️', label: 'Arsipkan Batch',   danger: false, action: onArchive  });
  } else if (batchStatus === 'Aktif') {
    menuItems.push({ icon: '⚙️', label: 'Operasi Batch',    danger: false, action: onOperasi  });
    menuItems.push({ icon: '➕', label: 'Tambah Anggota',   danger: false, action: onAddMember });
    menuItems.push({ icon: '📦', label: 'Selesaikan Batch', danger: false, action: onFinish   });
    menuItems.push({ icon: '🗃️', label: 'Arsipkan Batch',   danger: false, action: onArchive  });
  } else if (batchStatus === 'Selesai') {
    menuItems.push({ icon: '🗃️', label: 'Arsipkan Batch',   danger: false, action: onArchive  });
  }
  // Diarsipkan / Dibatalkan → no actions (read-only)

  const showEdit = batchStatus === 'Aktif' || batchStatus === 'Draft';
  const showMenu = menuItems.length > 0;

  useEffect(() => {
    if (!menuOpen) return;
    function closeOnOutsideClick(event: MouseEvent) {
      if (!anchorRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [menuOpen]);

  if (!showEdit && !showMenu) return null; // read-only: no header buttons

  return (
    <HeaderActionPortal>
      <div ref={anchorRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {showEdit && (
          <button
            type="button"
            aria-label="Edit Batch"
            onClick={onEdit}
            style={{
              background: 'none', border: 'none',
              minWidth: 44, minHeight: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Edit
          </button>
        )}
        {showMenu && (
          <button
            type="button"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Menu lainnya"
            style={{
              background: 'none', border: 'none',
              minWidth: 44, minHeight: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, lineHeight: 1, color: 'var(--color-primary)', cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            ⋮
          </button>
        )}
        {menuOpen && (
          <div style={{
            position: 'absolute', top: '100%', right: 4, zIndex: 112,
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)',
            minWidth: 200, overflow: 'hidden',
          }}>
            {menuItems.map((item, i) => (
              <button
                key={item.label}
                type="button"
                onClick={() => { setMenuOpen(false); item.action(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '12px 16px',
                  background: 'none', border: 'none',
                  borderBottom: i < menuItems.length - 1 ? '1px solid var(--color-border)' : 'none',
                  textAlign: 'left', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600,
                  color: item.danger ? 'var(--color-danger)' : 'var(--color-text)',
                }}
              >
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </HeaderActionPortal>
  );
}

// ─── Livestock Member Card ────────────────────────────────────────────────────

function LivestockMemberCard({
  lv,
  selectMode,
  selected,
  isBatchActive,
  onToggleSelect,
  onNavigate,
  onRemove,
  onMove,
  onLongPress,
}: {
  lv: LivestockRecord;
  selectMode: boolean;
  selected: boolean;
  isBatchActive: boolean;
  onToggleSelect: () => void;
  onNavigate: () => void;
  onRemove: () => void;
  onMove: () => void;
  onLongPress: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const timerRef     = useRef<number | null>(null);
  const longFiredRef = useRef(false);

  const health  = HEALTH_STATUS_CONFIG[lv.status] ?? HEALTH_STATUS_CONFIG['Sehat'];
  const program = PROGRAM_CONFIG[lv.program] ?? PROGRAM_CONFIG['Lainnya'];

  // Clear timer on unmount to avoid firing after component is gone
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function clearTimer() {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }

  function handlePointerDown() {
    longFiredRef.current = false;
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      longFiredRef.current = true;
      onLongPress();
    }, 550);
  }
  function handlePointerUp()     { clearTimer(); }
  function handlePointerLeave()  { clearTimer(); }
  function handlePointerCancel() { clearTimer(); }

  function handleClick() {
    if (longFiredRef.current) { longFiredRef.current = false; return; }
    if (selectMode) { onToggleSelect(); } else { onNavigate(); }
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Card */}
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerCancel}
        onClick={handleClick}
        style={{
          background: 'var(--color-surface)',
          border: selected ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ padding: '12px 14px 11px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>

          {/* Checkbox or photo */}
          {selectMode ? (
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 15,
              border: selected ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
              background: selected ? 'var(--color-primary)' : 'var(--color-surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {selected && <span style={{ color: '#fff', fontSize: 12, lineHeight: 1 }}>✓</span>}
            </div>
          ) : (
            <div style={{
              width: 52, height: 52, borderRadius: 'var(--radius-sm)', flexShrink: 0,
              background: lv.typeBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30,
            }}>
              {lv.typeIcon}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name + health badge */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
                  {lv.name ?? (
                    <span style={{ color: 'var(--color-muted)', fontStyle: 'italic', fontWeight: 400 }}>Tanpa Nama</span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace', letterSpacing: 0.4, marginTop: 1 }}>
                  {lv.id}
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, flexShrink: 0,
                color: health.color, background: health.bg, borderRadius: 20, padding: '3px 9px',
              }}>
                {lv.status}
              </span>
            </div>

            {/* Species + breed */}
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 3, lineHeight: 1.3 }}>
              {lv.typeIcon} {lv.type} · {lv.ras}
            </div>

            {/* Weight + program + action button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>
                {lv.weight} <span style={{ fontSize: 10, fontWeight: 600 }}>{lv.weightUnit}</span>
              </span>
              <span style={{ fontSize: 10, color: 'var(--color-border)' }}>·</span>
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: program.color, background: program.bg,
                borderRadius: 20, padding: '2px 8px',
              }}>
                {lv.program}
              </span>
              <div style={{ flex: 1 }} />
              {!selectMode && (
                isBatchActive ? (
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <button
                      type="button"
                      aria-label="Menu lainnya"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
                      style={{
                        background: 'none', border: 'none', padding: '4px 8px',
                        fontSize: 18, color: 'var(--color-muted)', cursor: 'pointer',
                        lineHeight: 1,
                      }}
                    >
                      ⋮
                    </button>
                    {menuOpen && (
                      <div style={{
                        position: 'absolute', top: '100%', right: 0, zIndex: 51,
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-md)',
                        minWidth: 180,
                        overflow: 'hidden',
                      }}>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onNavigate(); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            width: '100%', padding: '12px 16px',
                            background: 'none', border: 'none',
                            borderBottom: '1px solid var(--color-border)',
                            textAlign: 'left', cursor: 'pointer',
                            fontSize: 13, fontWeight: 600, color: 'var(--color-text)',
                          }}
                        >
                          <span>👤</span> Lihat Profil
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onMove(); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            width: '100%', padding: '12px 16px',
                            background: 'none', border: 'none',
                            borderBottom: '1px solid var(--color-border)',
                            textAlign: 'left', cursor: 'pointer',
                            fontSize: 13, fontWeight: 600, color: '#0277bd',
                          }}
                        >
                          <span>↗️</span> Pindahkan ke Batch Lain
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onRemove(); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            width: '100%', padding: '12px 16px',
                            background: 'none', border: 'none',
                            textAlign: 'left', cursor: 'pointer',
                            fontSize: 13, fontWeight: 600, color: 'var(--color-danger)',
                          }}
                        >
                          <span>➖</span> Keluarkan dari Batch
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <span style={{ fontSize: 16, color: 'var(--color-muted)', fontWeight: 300 }}>›</span>
                )
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─── Skeleton Card (loading state) ────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      padding: '12px 14px 14px',
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 'var(--radius-sm)', flexShrink: 0,
        background: 'var(--color-border)', opacity: 0.5,
      }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 14, width: '55%', borderRadius: 6, background: 'var(--color-border)', opacity: 0.5 }} />
        <div style={{ height: 10, width: '38%', borderRadius: 6, background: 'var(--color-border)', opacity: 0.35 }} />
        <div style={{ height: 10, width: '45%', borderRadius: 6, background: 'var(--color-border)', opacity: 0.35 }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          <div style={{ height: 13, width: 48, borderRadius: 6, background: 'var(--color-border)', opacity: 0.5 }} />
          <div style={{ height: 13, width: 64, borderRadius: 20, background: 'var(--color-border)', opacity: 0.4 }} />
        </div>
      </div>
    </div>
  );
}

// ─── Member Filter Sheet ──────────────────────────────────────────────────────

type MemberFilters = {
  species: string;
  breed: string;
  program: string;
  sex: string;
};

function MemberFilterChipGroup({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              style={{
                padding: '7px 13px', fontSize: 12, fontWeight: 700,
                border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                borderRadius: 20,
                background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                color: active ? '#fff' : 'var(--color-muted)',
                cursor: 'pointer',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MemberFilterSheet({
  open, onClose,
  filters, setFilters, onReset,
  speciesOptions, breedOptions,
}: {
  open: boolean;
  onClose: () => void;
  filters: MemberFilters;
  setFilters: (f: MemberFilters) => void;
  onReset: () => void;
  speciesOptions: string[];
  breedOptions: string[];
}) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }} />
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 201,
        maxWidth: 480, margin: '0 auto',
        background: 'var(--color-surface)', borderRadius: '16px 16px 0 0',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)' }}>Filter Anggota</span>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 18, color: 'var(--color-muted)', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {speciesOptions.length > 2 && (
            <MemberFilterChipGroup
              label="Jenis"
              options={speciesOptions}
              value={filters.species}
              onChange={(v) => setFilters({ ...filters, species: v, breed: 'Semua' })}
            />
          )}
          {breedOptions.length > 2 && (
            <MemberFilterChipGroup
              label="Ras"
              options={breedOptions}
              value={filters.breed}
              onChange={(v) => setFilters({ ...filters, breed: v })}
            />
          )}
          <MemberFilterChipGroup
            label="Program"
            options={MEMBER_PROGRAMS}
            value={filters.program}
            onChange={(v) => setFilters({ ...filters, program: v })}
          />
          <MemberFilterChipGroup
            label="Jenis Kelamin"
            options={MEMBER_SEX}
            value={filters.sex}
            onChange={(v) => setFilters({ ...filters, sex: v })}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
          <button type="button" onClick={onReset} style={{ flex: 1, padding: '11px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Reset
          </button>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Terapkan
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Sort Picker Sheet ────────────────────────────────────────────────────────

function SortPickerSheet({
  open, onClose, sortBy, onSelect,
}: {
  open: boolean;
  onClose: () => void;
  sortBy: string;
  onSelect: (key: string) => void;
}) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }} />
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 201,
        maxWidth: 480, margin: '0 auto',
        background: 'var(--color-surface)', borderRadius: '16px 16px 0 0',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)' }}>Urutkan</span>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 18, color: 'var(--color-muted)', cursor: 'pointer' }}>✕</button>
        </div>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => { onSelect(opt.key); onClose(); }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '14px 16px',
              background: 'none', border: 'none',
              borderBottom: '1px solid var(--color-border)',
              textAlign: 'left', cursor: 'pointer',
              fontSize: 13, fontWeight: sortBy === opt.key ? 800 : 500,
              color: sortBy === opt.key ? 'var(--color-primary)' : 'var(--color-text)',
            }}
          >
            {opt.label}
            {sortBy === opt.key && <span style={{ fontSize: 14, color: 'var(--color-primary)' }}>✓</span>}
          </button>
        ))}
      </div>
    </>
  );
}

// ─── Remove Confirmation Dialog ───────────────────────────────────────────────

function RemoveDialog({
  targets,
  reason,
  onReasonChange,
  onConfirm,
  onCancel,
}: {
  targets: MembershipWithLivestock[];
  reason: string;
  onReasonChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 16px',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)', width: '100%', maxWidth: 440,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ padding: '18px 18px 14px' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', marginBottom: 6 }}>
              Keluarkan {targets.length > 1 ? `${targets.length} ternak` : 'ternak'} dari batch?
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
              Ternak yang dikeluarkan tidak lagi menjadi anggota aktif batch ini.
              Riwayat keanggotaan tetap tersimpan.
            </div>
          </div>

          {/* Target list */}
          <div style={{
            borderTop: '1px solid var(--color-border)',
            borderBottom: '1px solid var(--color-border)',
            maxHeight: 160, overflowY: 'auto',
          }}>
            {targets.map(({ lv }, i) => (
              <div key={lv.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 18px',
                borderBottom: i < targets.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                  background: lv.typeBg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 20,
                }}>
                  {lv.typeIcon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                    {lv.name ?? <span style={{ fontStyle: 'italic', color: 'var(--color-muted)' }}>Tanpa Nama</span>}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace' }}>{lv.id}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Reason */}
          <div style={{ padding: '14px 18px 0' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: 6 }}>
              Alasan <span style={{ fontWeight: 400, color: 'var(--color-muted)' }}>(Opsional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Contoh: Dipindahkan ke batch lain, terjual, dll."
              rows={2}
              style={{ fontSize: 13 }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, padding: '14px 18px 18px' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-surface)', color: 'var(--color-muted)',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              style={{
                flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)',
                border: 'none', background: 'var(--color-danger)', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Keluarkan
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Add Members Sheet ────────────────────────────────────────────────────────

type AddMode = 'individual' | 'multi';

function candidateDisabledReason(
  lv: LivestockRecord,
  activeMemberIds: Set<string>,
): string | null {
  if (getLivestockStatus(lv.id) === 'Arsip') return 'Ternak diarsipkan';
  // Prevent sold livestock
  if (
    lv.status === 'Terjual' ||
    lv.location.toLowerCase().includes('terjual') ||
    lv.location.toLowerCase().includes('dijual')
  ) return 'Ternak sudah terjual';
  // Prevent inactive livestock
  if (lv.status === 'Inaktif' || lv.status === 'Mati') return 'Ternak tidak aktif';
  const hasActiveBatch = MEMBERSHIP_DB.some(
    (m) => m.livestockId === lv.id && m.status === 'Aktif',
  );
  if (hasActiveBatch) return 'Sudah berada di Batch Aktif';
  return null;
}

function AddMembersSheet({
  batchId,
  activeMemberIds,
  onClose,
  onAdded,
}: {
  batchId: string;
  activeMemberIds: Set<string>;
  onClose: () => void;
  onAdded: () => void;
}) {
  const { userId } = useBatch();
  const [mode, setMode] = useState<AddMode>('individual');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allLivestock = Object.values(LIVESTOCK_DB)
    .filter((lv) => !activeMemberIds.has(lv.id));

  const q = search.trim().toLowerCase();
  const displayList = allLivestock.filter((lv) => {
    if (!q) return true;
    return (
      (lv.name?.toLowerCase().includes(q) ?? false) ||
      lv.id.toLowerCase().includes(q) ||
      lv.type.toLowerCase().includes(q) ||
      lv.ras.toLowerCase().includes(q)
    );
  });

  function handleIndividualAdd(lv: LivestockRecord) {
    try {
      addBatchMember(batchId, lv.id);
      void recordAddBatchMember(batchId, lv.id).catch((err) =>
        console.error('[BatchProfile] recordAddBatchMember failed:', err),
      );
      void recordBatchHistoryEvent(batchId, 'member_added', { livestockId: lv.id, livestockName: lv.name }, userId).catch((err) =>
        console.error('[BatchProfile] recordBatchHistoryEvent(member_added) failed:', err),
      );
      onAdded();
    } catch { /* already member — UI prevents this */ }
  }

  function toggleMulti(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleMultiConfirm() {
    for (const id of selectedIds) {
      try {
        const lv = LIVESTOCK_DB[id];
        addBatchMember(batchId, id);
        void recordAddBatchMember(batchId, id).catch((err) =>
          console.error('[BatchProfile] recordAddBatchMember failed:', err),
        );
        void recordBatchHistoryEvent(batchId, 'member_added', { livestockId: id, livestockName: lv?.name ?? null }, userId).catch((err) =>
          console.error('[BatchProfile] recordBatchHistoryEvent(member_added_multi) failed:', err),
        );
      } catch { /* skip */ }
    }
    onAdded();
    onClose();
  }

  const selectable = selectedIds.filter((id) => {
    const lv = LIVESTOCK_DB[id];
    return lv && !candidateDisabledReason(lv, activeMemberIds);
  });

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200 }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
        background: 'var(--color-surface)',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
        maxHeight: '88vh',
      }}>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 18px 12px',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>
            Tambah Anggota
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none', border: 'none', fontSize: 20,
              color: 'var(--color-muted)', cursor: 'pointer', padding: '4px 6px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Mode toggle */}
        <div style={{ padding: '12px 18px 0', display: 'flex', gap: 8 }}>
          {(['individual', 'multi'] as AddMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setSelectedIds([]); }}
              style={{
                flex: 1, padding: '9px', borderRadius: 'var(--radius-sm)',
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
                border: mode === m ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                background: mode === m ? 'var(--color-primary)' : 'var(--color-surface)',
                color: mode === m ? '#fff' : 'var(--color-muted)',
              }}
            >
              {m === 'individual' ? 'Individual' : 'Multi Pilih'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ padding: '12px 18px 10px', position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 30, top: '50%', transform: 'translateY(-50%)',
            fontSize: 15, color: 'var(--color-muted)', pointerEvents: 'none',
          }}>🔍</span>
          <input
            type="search"
            placeholder="Cari nama, ID, jenis, atau ras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36, fontSize: 13 }}
          />
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px' }}>
          {displayList.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
              {q ? 'Tidak ada ternak yang cocok.' : 'Semua ternak sudah menjadi anggota.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 16 }}>
              {displayList.map((lv) => {
                const disabledReason = candidateDisabledReason(lv, activeMemberIds);
                const disabled = !!disabledReason;
                const isSelected = selectedIds.includes(lv.id);
                const health = HEALTH_STATUS_CONFIG[lv.status] ?? HEALTH_STATUS_CONFIG['Sehat'];

                function handleTap() {
                  if (disabled) return;
                  if (mode === 'individual') {
                    handleIndividualAdd(lv);
                  } else {
                    toggleMulti(lv.id);
                  }
                }

                return (
                  <div
                    key={lv.id}
                    onClick={handleTap}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 12px',
                      border: isSelected
                        ? '2px solid var(--color-primary)'
                        : '1.5px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      background: disabled ? 'var(--color-bg)' : 'var(--color-surface)',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.65 : 1,
                    }}
                  >
                    {/* Checkbox (multi mode only) */}
                    {mode === 'multi' && (
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        border: isSelected ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                        background: isSelected ? 'var(--color-primary)' : 'var(--color-surface)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSelected && <span style={{ color: '#fff', fontSize: 11 }}>✓</span>}
                      </div>
                    )}

                    {/* Icon */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                      background: lv.typeBg, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 26,
                    }}>
                      {lv.typeIcon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>
                        {lv.name ?? <span style={{ fontStyle: 'italic', color: 'var(--color-muted)' }}>Tanpa Nama</span>}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace', marginTop: 1 }}>
                        {lv.id}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
                        {lv.type} · {lv.ras} · {lv.weight} {lv.weightUnit}
                      </div>
                      {disabledReason && (
                        <div style={{
                          marginTop: 4, fontSize: 10, fontWeight: 700,
                          color: '#c62828', background: '#ffebee',
                          borderRadius: 20, padding: '2px 8px', display: 'inline-block',
                        }}>
                          {disabledReason}
                        </div>
                      )}
                    </div>

                    {!disabled && (
                      <span style={{
                        fontSize: 11, fontWeight: 700, flexShrink: 0,
                        color: health.color, background: health.bg,
                        borderRadius: 20, padding: '2px 8px',
                      }}>
                        {lv.status}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Multi-select confirm bar */}
        {mode === 'multi' && (
          <div style={{
            padding: '12px 18px 24px',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
          }}>
            <button
              type="button"
              onClick={handleMultiConfirm}
              disabled={selectable.length === 0}
              style={{
                width: '100%', padding: '13px',
                borderRadius: 'var(--radius-sm)', border: 'none',
                background: selectable.length > 0 ? 'var(--color-primary)' : 'var(--color-border)',
                color: selectable.length > 0 ? '#fff' : 'var(--color-muted)',
                fontSize: 14, fontWeight: 700, cursor: selectable.length > 0 ? 'pointer' : 'default',
              }}
            >
              {selectable.length > 0
                ? `Tambahkan ${selectable.length} Anggota`
                : 'Pilih ternak terlebih dahulu'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Selection Bar (multi-remove) ─────────────────────────────────────────────

function SelectionBar({
  count,
  onRemove,
  onMove,
  onCancel,
}: {
  count: number;
  onRemove: () => void;
  onMove: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 150,
      background: 'var(--color-surface)',
      borderTop: '1.5px solid var(--color-border)',
      boxShadow: '0 -4px 16px rgba(0,0,0,0.10)',
      padding: '12px 16px 28px',
      display: 'flex', gap: 10,
    }}>
      <button
        type="button"
        onClick={onCancel}
        style={{
          flex: 1, padding: '12px',
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-surface)', color: 'var(--color-muted)',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}
      >
        Batal
      </button>
      <button
        type="button"
        onClick={onMove}
        disabled={count === 0}
        style={{
          flex: 2, padding: '12px',
          border: 'none', borderRadius: 'var(--radius-sm)',
          background: count > 0 ? '#0277bd' : 'var(--color-border)',
          color: count > 0 ? '#fff' : 'var(--color-muted)',
          fontSize: 13, fontWeight: 700, cursor: count > 0 ? 'pointer' : 'default',
        }}
      >
        Pindahkan {count > 0 ? `(${count})` : ''}
      </button>
      <button
        type="button"
        onClick={onRemove}
        disabled={count === 0}
        style={{
          flex: 2, padding: '12px',
          border: 'none', borderRadius: 'var(--radius-sm)',
          background: count > 0 ? 'var(--color-danger)' : 'var(--color-border)',
          color: count > 0 ? '#fff' : 'var(--color-muted)',
          fontSize: 13, fontWeight: 700, cursor: count > 0 ? 'pointer' : 'default',
        }}
      >
        Keluarkan {count > 0 ? `(${count})` : ''}
      </button>
    </div>
  );
}

// ─── History Event List ───────────────────────────────────────────────────────

type HistoryEvent = {
  id: string;
  type: string;              // widened: includes batch-level event types
  date: string;
  parsedDate: Date | null;
  livestockName: string | null;  // null for batch-level events (no livestock)
  livestockId: string | null;    // null for batch-level events
  notes: string | null;
  relatedBatchId?: string | null;
};

function deriveHistoryEvents(batchId: string): HistoryEvent[] {
  const allMembers = getBatchMembersWithLivestock(batchId);
  const events: HistoryEvent[] = [];

  for (const { membership, lv } of allMembers) {
    // Joined event
    events.push({
      id: `${membership.id}-join`,
      type: 'joined',
      date: membership.joinDate,
      parsedDate: parseDateLabel(membership.joinDate),
      livestockName: lv.name ?? lv.id,
      livestockId: lv.id,
      notes: null,
    });
    // Left / moved event
    if (membership.leaveDate) {
      const leaveType =
        membership.status === 'Keluar'       ? 'removed'  :
        membership.status === 'Dipindahkan'  ? 'moved'    : 'finished';
      events.push({
        id: `${membership.id}-leave`,
        type: leaveType,
        date: membership.leaveDate,
        parsedDate: parseDateLabel(membership.leaveDate),
        livestockName: lv.name ?? lv.id,
        livestockId: lv.id,
        notes: membership.notes,
      });
    }
  }

  // Merge batch-level timeline events (batch_created, batch_activated, batch_closed, batch_archived, member_moved_*)
  for (const ev of getBatchTimeline(batchId)) {
    events.push({
      id: ev.id,
      type: ev.type,
      date: ev.date,
      parsedDate: parseDateLabel(ev.date),
      livestockName: ev.livestockName,
      livestockId: ev.livestockId,
      notes: ev.notes,
      relatedBatchId: ev.relatedBatchId,
    });
  }

  // Sort newest → oldest
  events.sort((a, b) => {
    const ta = a.parsedDate?.getTime() ?? 0;
    const tb = b.parsedDate?.getTime() ?? 0;
    return tb - ta;
  });

  return events;
}

function HistorySection({ batchId }: { batchId: string }) {
  const events = deriveHistoryEvents(batchId);

  return (
    <section>
      <SectionLabel title={`Riwayat Batch (${events.length})`} />
      <Card style={{ overflow: 'hidden' }}>
        {events.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
            Belum ada riwayat aktivitas batch.
          </div>
        ) : (
          events.map((ev, i) => {
            const cfg = HISTORY_TYPE_CONFIG[ev.type];
            return (
              <div
                key={ev.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '11px 14px',
                  borderBottom: i < events.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--color-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, marginTop: 1,
                }}>
                  {cfg.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: cfg.color }}>
                    {cfg.label}
                  </div>
                  {ev.livestockId && (
                    <div style={{ fontSize: 12, color: 'var(--color-text)', marginTop: 1 }}>
                      {ev.livestockName}{' '}
                      <span style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace' }}>
                        ({ev.livestockId})
                      </span>
                    </div>
                  )}
                  {ev.relatedBatchId && (
                    <div style={{ fontSize: 11, color: '#0277bd', marginTop: 2, fontFamily: 'monospace' }}>
                      → {ev.relatedBatchId}
                    </div>
                  )}
                  {ev.notes && (
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2, fontStyle: 'italic', lineHeight: 1.4 }}>
                      {ev.notes}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)', flexShrink: 0, marginTop: 2 }}>
                  {ev.date}
                </div>
              </div>
            );
          })
        )}
      </Card>
      <div style={{
        marginTop: 8, padding: '9px 12px',
        background: 'var(--color-bg)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'flex-start', gap: 8,
      }}>
        <span style={{ fontSize: 13, flexShrink: 0 }}>ℹ️</span>
        <span style={{ fontSize: 11.5, color: 'var(--color-muted)', lineHeight: 1.5 }}>
          Riwayat keanggotaan tidak dapat dihapus.
        </span>
      </div>
    </section>
  );
}

// ─── Edit Batch Sheet ─────────────────────────────────────────────────────────

function EditBatchSheet({
  currentName,
  currentDescription,
  currentPurpose,
  currentLocation,
  currentStartDate,
  currentEndDate,
  onSave,
  onClose,
}: {
  currentName: string | null;
  currentDescription: string | null;
  currentPurpose: string | null;
  currentLocation: string | null;
  currentStartDate: string | null;
  currentEndDate: string | null;
  onSave: (
    name: string | null, description: string | null,
    purpose: string | null, location: string | null,
    startDate: string | null, endDate: string | null,
  ) => void;
  onClose: () => void;
}) {
  const [name,        setName]        = useState(currentName        ?? '');
  const [description, setDescription] = useState(currentDescription ?? '');
  const [purpose,     setPurpose]     = useState(currentPurpose     ?? '');
  const [location,    setLocation]    = useState(currentLocation    ?? '');
  const [startDate,   setStartDate]   = useState(currentStartDate   ?? '');
  const [endDate,     setEndDate]     = useState(currentEndDate     ?? '');

  function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) return; // name required
    onSave(
      trimmedName,
      description.trim() || null,
      purpose.trim()     || null,
      location.trim()    || null,
      startDate.trim()   || null,
      endDate.trim()     || null,
    );
  }

  const isValid = name.trim().length > 0;

  const fieldLabel = (text: string, optional = false) => (
    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: 6 }}>
      {text}{optional && <span style={{ fontWeight: 400, color: 'var(--color-muted)', marginLeft: 4 }}>(Opsional)</span>}
    </label>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
        background: 'var(--color-surface)', borderRadius: '20px 20px 0 0',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', maxHeight: '88vh',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px 14px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>Edit Batch</div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--color-muted)', cursor: 'pointer', padding: '4px 6px' }}>✕</button>
        </div>
        {/* Form */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 0' }}>
          {/* Nama Batch */}
          <div style={{ marginBottom: 14 }}>
            {fieldLabel('Nama Batch')}
            <span style={{ color: 'var(--color-danger)', fontSize: 11 }}>*</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Penggemukan Juli 2026" style={{ fontSize: 13, marginTop: 4 }} />
            {name.trim() === '' && <div style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: 4 }}>Nama batch tidak boleh kosong.</div>}
          </div>
          {/* Deskripsi */}
          <div style={{ marginBottom: 14 }}>
            {fieldLabel('Deskripsi', true)}
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tulis deskripsi batch..." rows={2} style={{ fontSize: 13 }} />
          </div>
          {/* Tujuan */}
          <div style={{ marginBottom: 14 }}>
            {fieldLabel('Tujuan', true)}
            <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Contoh: Persiapan Idul Adha 2026" style={{ fontSize: 13 }} />
          </div>
          {/* Lokasi */}
          <div style={{ marginBottom: 14 }}>
            {fieldLabel('Lokasi', true)}
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Contoh: Kandang B, Blok 3" style={{ fontSize: 13 }} />
          </div>
          {/* Tanggal Mulai */}
          <div style={{ marginBottom: 14 }}>
            {fieldLabel('Tanggal Mulai', true)}
            <input type="text" value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="Contoh: 1 Juli 2026" style={{ fontSize: 13 }} />
          </div>
          {/* Tanggal Selesai */}
          <div style={{ marginBottom: 14 }}>
            {fieldLabel('Tanggal Selesai', true)}
            <input type="text" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="Contoh: 31 Agustus 2026" style={{ fontSize: 13 }} />
          </div>
          {/* Info: non-editable fields */}
          <div style={{ padding: '9px 12px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 13, flexShrink: 0 }}>ℹ️</span>
            <span style={{ fontSize: 11.5, color: 'var(--color-muted)', lineHeight: 1.5 }}>
              Tanggal dibuat, status, dan riwayat anggota tidak dapat diubah di sini.
            </span>
          </div>
        </div>
        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, padding: '12px 18px 32px' }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Batal
          </button>
          <button type="button" onClick={handleSave} disabled={!isValid} style={{ flex: 2, padding: '12px', borderRadius: 'var(--radius-sm)', border: 'none', background: isValid ? 'var(--color-primary)' : 'var(--color-border)', color: isValid ? '#fff' : 'var(--color-muted)', fontSize: 13, fontWeight: 700, cursor: isValid ? 'pointer' : 'default' }}>
            Simpan
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Finish Batch Dialog ──────────────────────────────────────────────────────

function FinishBatchDialog({
  batchName,
  activeMemberCount,
  onConfirm,
  onCancel,
}: {
  batchName: string;
  activeMemberCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', width: '100%', maxWidth: 440, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 18px 14px' }}>
          <div style={{ fontSize: 20, marginBottom: 10 }}>📦</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>
            Selesaikan Batch?
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 10, fontFamily: 'monospace' }}>
            {batchName}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Batch akan ditandai <strong>Selesai</strong> dan tanggal selesai akan dicatat hari ini.
            {activeMemberCount > 0 && (
              <> <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>{activeMemberCount} anggota aktif</span> akan otomatis diselesaikan.</>
            )}
          </div>
        </div>
        {/* Info note */}
        <div style={{ margin: '0 18px 14px', padding: '9px 12px', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ fontSize: 13, flexShrink: 0 }}>ℹ️</span>
          <span style={{ fontSize: 11.5, color: '#795548', lineHeight: 1.5 }}>
            Riwayat keanggotaan tetap tersimpan. Batch tidak dapat diaktifkan kembali setelah selesai.
          </span>
        </div>
        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, padding: '0 18px 18px' }}>
          <button type="button" onClick={onCancel} style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Batal
          </button>
          <button type="button" onClick={onConfirm} style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', border: 'none', background: '#546e7a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Selesaikan
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Archive Batch Dialog ─────────────────────────────────────────────────────

function ArchiveBatchDialog({
  batchName,
  isCurrentlyActive,
  activeMemberCount,
  onConfirm,
  onCancel,
}: {
  batchName: string;
  isCurrentlyActive: boolean;
  activeMemberCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', width: '100%', maxWidth: 440, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 18px 14px' }}>
          <div style={{ fontSize: 20, marginBottom: 10 }}>🗃️</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>
            Arsipkan Batch?
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 10, fontFamily: 'monospace' }}>
            {batchName}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Batch akan dipindahkan ke arsip dan tidak tampil di daftar aktif.
            {isCurrentlyActive && activeMemberCount > 0 && (
              <> <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>{activeMemberCount} anggota aktif</span> akan otomatis diselesaikan terlebih dahulu.</>
            )}
          </div>
        </div>
        {/* Info note */}
        <div style={{ margin: '0 18px 14px', padding: '9px 12px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ fontSize: 13, flexShrink: 0 }}>ℹ️</span>
          <span style={{ fontSize: 11.5, color: 'var(--color-muted)', lineHeight: 1.5 }}>
            Data dan riwayat batch tetap tersimpan. Batch arsip bisa dilihat melalui filter Diarsipkan.
          </span>
        </div>
        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, padding: '0 18px 18px' }}>
          <button type="button" onClick={onCancel} style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Batal
          </button>
          <button type="button" onClick={onConfirm} style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', border: 'none', background: '#6a1b9a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Arsipkan
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Move Members Sheet ───────────────────────────────────────────────────────

function MoveMemberSheet({
  batchId,
  targets,
  onClose,
  onMoved,
}: {
  batchId: string;
  targets: MembershipWithLivestock[];
  onClose: () => void;
  onMoved: () => void;
}) {
  const [targetBatchId, setTargetBatchId] = useState('');
  const [notes,         setNotes]         = useState('');

  // Active batches excluding current batch
  const targetBatches = Object.values(BATCH_DB).filter(
    (b) => b.status === 'Aktif' && b.id !== batchId,
  );

  function handleConfirm() {
    if (!targetBatchId || targetBatches.length === 0) return;
    for (const { membership } of targets) {
      try { moveBatchMember(membership.id, targetBatchId, notes || null); }
      catch { /* skip if already moved or guard failed */ }
    }
    onMoved();
    onClose();
  }

  const isValid = targetBatchId !== '' && targetBatches.length > 0;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
        background: 'var(--color-surface)', borderRadius: '20px 20px 0 0',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', maxHeight: '88vh',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px 14px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>Pindahkan ke Batch Lain</div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--color-muted)', cursor: 'pointer', padding: '4px 6px' }}>✕</button>
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 0' }}>

          {/* Livestock being moved */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
              Ternak yang Dipindahkan ({targets.length})
            </div>
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              {targets.slice(0, 5).map(({ lv }, i) => {
                const isLastShown = i === Math.min(targets.length, 5) - 1;
                return (
                  <div key={lv.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: isLastShown ? 'none' : '1px solid var(--color-border)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', flexShrink: 0, background: lv.typeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      {lv.typeIcon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                        {lv.name ?? <span style={{ fontStyle: 'italic', color: 'var(--color-muted)' }}>Tanpa Nama</span>}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace' }}>{lv.id}</div>
                    </div>
                  </div>
                );
              })}
              {targets.length > 5 && (
                <div style={{ padding: '8px 14px', fontSize: 11, color: 'var(--color-muted)', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>
                  +{targets.length - 5} ternak lainnya
                </div>
              )}
            </div>
          </div>

          {/* Target batch selector */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
              Pindahkan ke Batch
            </div>
            {targetBatches.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>📦</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Tidak ada batch aktif lain</div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>Buat batch aktif terlebih dahulu sebelum memindahkan anggota.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {targetBatches.map((b) => {
                  const activeCount = MEMBERSHIP_DB.filter((m) => m.batchId === b.id && m.status === 'Aktif').length;
                  const chosen = targetBatchId === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setTargetBatchId(b.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                        border: chosen ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        background: chosen ? 'var(--color-primary-light)' : 'var(--color-surface)',
                        cursor: 'pointer', textAlign: 'left', width: '100%',
                      }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', flexShrink: 0, background: b.livestockTypeBg || '#eceff1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                        {b.livestockIcon || '📦'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: chosen ? 'var(--color-primary)' : 'var(--color-text)', lineHeight: 1.2 }}>
                          {b.name ?? b.id}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace', marginTop: 1 }}>{b.id}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>{activeCount} anggota aktif · {b.label}</div>
                      </div>
                      {chosen && <span style={{ fontSize: 16, color: 'var(--color-primary)', flexShrink: 0 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: 6 }}>
              Alasan Pemindahan <span style={{ fontWeight: 400, color: 'var(--color-muted)' }}>(Opsional)</span>
            </label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Contoh: Seleksi bobot, program khusus, dll." rows={2} style={{ fontSize: 13 }} />
          </div>

          {/* Info */}
          <div style={{ padding: '9px 12px', background: '#e3f2fd', border: '1px solid #bbdefb', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 13, flexShrink: 0 }}>ℹ️</span>
            <span style={{ fontSize: 11.5, color: '#0d47a1', lineHeight: 1.5 }}>
              Keanggotaan lama ditutup dengan status <strong>Dipindahkan</strong>. Riwayat keanggotaan di batch ini tetap tersimpan.
            </span>
          </div>
        </div>
        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, padding: '12px 18px 32px' }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isValid}
            style={{ flex: 2, padding: '12px', borderRadius: 'var(--radius-sm)', border: 'none', background: isValid ? '#0277bd' : 'var(--color-border)', color: isValid ? '#fff' : 'var(--color-muted)', fontSize: 13, fontWeight: 700, cursor: isValid ? 'pointer' : 'default' }}
          >
            Pindahkan {targets.length > 0 ? `(${targets.length})` : ''}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Statistics Placeholder Section ──────────────────────────────────────────

const STAT_CARDS = [
  { icon: '⚖️', label: 'Rata-rata Bobot' },
  { icon: '📈', label: 'Rata-rata ADG'   },
  { icon: '🌾', label: 'Feed Conversion' },
  { icon: '💀', label: 'Mortalitas'      },
  { icon: '🎯', label: 'Target Progress' },
];

function StatisticsSection() {
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
          Statistik
        </h2>
        <span style={{
          fontSize: 10, fontWeight: 700,
          color: '#f57f17', background: '#fff8e1',
          borderRadius: 20, padding: '3px 9px',
        }}>
          🚧 Segera Hadir
        </span>
      </div>
      <Card style={{ padding: '14px 14px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          {STAT_CARDS.map((s) => (
            <div
              key={s.label}
              style={{
                padding: '10px 12px',
                background: 'var(--color-bg)',
                border: '1px dashed var(--color-border)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-border)', lineHeight: 1 }}>—</div>
              <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
          {/* 5th card + empty filler to keep grid symmetric — use full width for 5th */}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--color-muted)', lineHeight: 1.55 }}>
          Statistik performa akan tersedia setelah data bobot anggota dicatat secara berkala.
        </div>
      </Card>
    </section>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyMembersState({ onAdd, isBatchActive }: { onAdd: () => void; isBatchActive: boolean }) {
  return (
    <Card style={{ padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>📦</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
        Belum ada anggota batch.
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6, maxWidth: 240, margin: '0 auto 20px' }}>
        {isBatchActive
          ? 'Tambahkan ternak ke batch ini untuk mulai memantau performanya secara berkelompok.'
          : 'Batch ini tidak memiliki anggota.'}
      </div>
      {isBatchActive && (
        <button
          type="button"
          onClick={onAdd}
          style={{
            padding: '11px 24px', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-primary)', border: 'none',
            color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Tambah Anggota
        </button>
      )}
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: MemberFilters = {
  species: 'Semua',
  breed:   'Semua',
  program: 'Semua Program',
  sex:     'Semua',
};

export default function BatchProfile() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const batchId = paramId ?? 'BTH-001';

  // Populates BATCH_DB, MEMBERSHIP_DB, LIVESTOCK_DB from Supabase so
  // deep-link / hard-refresh navigations get live data.
  const { isLoading: supabaseLoading, error: supabaseError, refresh: supabaseRefresh } = useLivestock();
  const { userId } = useBatch();

  // Tick forces re-render after in-memory mutations (addBatchMember, removeBatchMember, etc.)
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  // ── Member list state ──
  const [search, setSearch]               = useState('');
  const [memberFilters, setMemberFilters] = useState<MemberFilters>(DEFAULT_FILTERS);
  const [sortBy, setSortBy]               = useState('latest');
  const [page, setPage]                   = useState(1);
  const [selectMode, setSelectMode]       = useState(false);
  const [selectedMbrIds, setSelectedMbrIds] = useState<Set<string>>(new Set());

  // ── Toolbar sheet state ──
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showSortSheet,   setShowSortSheet]   = useState(false);

  // ── Add sheet state ──
  const [showAddSheet, setShowAddSheet] = useState(false);

  // ── Remove dialog state ──
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [removeTargets, setRemoveTargets]       = useState<MembershipWithLivestock[]>([]);
  const [removeReason, setRemoveReason]         = useState('');

  // ── Lifecycle dialog / sheet state ──
  const [showFinishDialog,  setShowFinishDialog]  = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showEditSheet,     setShowEditSheet]     = useState(false);

  // ── Move sheet state ──
  const [showMoveSheet, setShowMoveSheet] = useState(false);
  const [moveTargets,   setMoveTargets]   = useState<MembershipWithLivestock[]>([]);

  // ── Supabase loading / error guard ──────────────────────────────────────
  if (supabaseLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 36 }}>⏳</span>
        <div style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 600 }}>Memuat profil batch...</div>
      </div>
    );
  }
  if (supabaseError) {
    return (
      <div style={{ padding: '24px 16px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>⚠️</span>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Gagal Memuat Data</div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: 16 }}>{supabaseError}</div>
        <button type="button" onClick={supabaseRefresh}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Coba Lagi
        </button>
      </div>
    );
  }

  // ── Data (recomputed fresh on every render / tick) ──
  const batch         = getBatch(batchId);
  const activeMembers = getActiveBatchMembersWithLivestock(batchId);

  // Guard: unknown batch ID
  if (!batch) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-muted)' }}>
        <p style={{ fontSize: 40 }}>🐄</p>
        <p style={{ fontWeight: 600 }}>Batch tidak ditemukan</p>
        <p style={{ fontSize: 14 }}>ID batch <code>{batchId}</code> tidak ada.</p>
      </div>
    );
  }

  const isBatchActive = batch.status === 'Aktif';
  const allTimeMemberCount = getBatchMemberships(batchId).length;

  // ── Summary stats ──
  const totalCount  = activeMembers.length;
  const totalWeight = activeMembers.reduce((s, { lv }) => s + parseFloat(lv.weight || '0'), 0);
  const avgWeight   = totalCount > 0 ? Math.round(totalWeight / totalCount) : 0;
  const weightUnit  = activeMembers[0]?.lv.weightUnit ?? 'Kg';
  const speciesSet  = [...new Set(activeMembers.map((m) => m.lv.type))];
  const speciesText = speciesSet.length > 0 ? speciesSet.join(', ') : '—';
  const duration    = batchDuration(batch.createdDate);

  const batchStatusCfg = BATCH_STATUS_CONFIG[batch.status] ?? BATCH_STATUS_CONFIG['Aktif'];

  // ── Filter option lists (derived from active members) ──
  const speciesOptions = ['Semua', ...new Set(activeMembers.map((m) => m.lv.type))];
  const speciesFiltered = memberFilters.species === 'Semua'
    ? activeMembers
    : activeMembers.filter((m) => m.lv.type === memberFilters.species);
  const breedOptions = ['Semua', ...new Set(speciesFiltered.map((m) => m.lv.ras))];

  // ── Filter + Sort pipeline ──
  const filtered = activeMembers.filter(({ lv }) => {
    if (memberFilters.species !== 'Semua' && lv.type !== memberFilters.species) return false;
    if (memberFilters.breed   !== 'Semua' && lv.ras  !== memberFilters.breed)   return false;
    if (memberFilters.program !== 'Semua Program' && lv.program !== memberFilters.program) return false;
    if (memberFilters.sex     !== 'Semua' && lv.kelamin !== memberFilters.sex)  return false;
    const q = search.trim().toLowerCase();
    if (q) {
      const matchName = lv.name?.toLowerCase().includes(q) ?? false;
      const matchId   = lv.id.toLowerCase().includes(q);
      const matchRas  = lv.ras.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchRas) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'nameAZ':     return (a.lv.name ?? a.lv.id).localeCompare(b.lv.name ?? b.lv.id);
      case 'nameZA':     return (b.lv.name ?? b.lv.id).localeCompare(a.lv.name ?? a.lv.id);
      case 'latest':     return (parseDateLabel(b.membership.joinDate)?.getTime() ?? 0) - (parseDateLabel(a.membership.joinDate)?.getTime() ?? 0);
      case 'oldest':     return (parseDateLabel(a.membership.joinDate)?.getTime() ?? 0) - (parseDateLabel(b.membership.joinDate)?.getTime() ?? 0);
      case 'weightHigh': return parseFloat(b.lv.weight) - parseFloat(a.lv.weight);
      case 'weightLow':  return parseFloat(a.lv.weight) - parseFloat(b.lv.weight);
      default:           return 0;
    }
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageItems  = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Active filter count (for badge on Filter button)
  const activeFilterCount = [
    memberFilters.species !== 'Semua',
    memberFilters.breed   !== 'Semua',
    memberFilters.program !== 'Semua Program',
    memberFilters.sex     !== 'Semua',
  ].filter(Boolean).length;

  const currentSortLabel = SORT_OPTIONS.find((o) => o.key === sortBy)?.label ?? '';

  function handleSearch(v: string) { setSearch(v); setPage(1); }
  function handleFilters(f: MemberFilters) { setMemberFilters(f); setPage(1); }
  function handleSort(key: string) { setSortBy(key); setPage(1); }
  function handleResetFilters() {
    setMemberFilters(DEFAULT_FILTERS);
    setPage(1);
  }

  // ── Select mode helpers ──
  function toggleSelect(membershipId: string) {
    setSelectedMbrIds((prev) => {
      const next = new Set(prev);
      if (next.has(membershipId)) next.delete(membershipId);
      else next.add(membershipId);
      return next;
    });
  }

  function enterSelectMode() {
    setSelectMode(true);
    setSelectedMbrIds(new Set());
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedMbrIds(new Set());
  }

  // ── Remove flow ──
  function openRemoveSingle(mwl: MembershipWithLivestock) {
    setRemoveTargets([mwl]);
    setRemoveReason('');
    setShowRemoveDialog(true);
  }

  function openRemoveMulti() {
    const targets = activeMembers.filter((m) => selectedMbrIds.has(m.membership.id));
    setRemoveTargets(targets);
    setRemoveReason('');
    setShowRemoveDialog(true);
  }

  function confirmRemove() {
    for (const { membership } of removeTargets) {
      removeBatchMember(membership.id, removeReason || null);
      void recordRemoveBatchMember(
        membership,
        membership.batchId,
        membership.livestockId,
        removeReason || null,
      ).catch((err) => console.error('[BatchProfile] recordRemoveBatchMember failed:', err));
      void recordBatchHistoryEvent(
        membership.batchId,
        'member_removed',
        { livestockId: membership.livestockId, reason: removeReason || null },
        userId,
      ).catch((err) => console.error('[BatchProfile] recordBatchHistoryEvent(member_removed) failed:', err));
    }
    setShowRemoveDialog(false);
    setRemoveTargets([]);
    setRemoveReason('');
    exitSelectMode();
    refresh();
  }

  const activeMemberIds = new Set(activeMembers.map((m) => m.membership.livestockId));

  // ── Lifecycle handlers ──
  function handleFinishBatch() {
    finishBatch(batchId);
    const updated = getBatch(batchId);
    void recordFinishBatch(
      batchId,
      updated?.finishedDate ?? null,
    ).catch((err) => console.error('[BatchProfile] recordFinishBatch failed:', err));
    void recordBatchHistoryEvent(
      batchId, 'batch_closed', { finishedDate: updated?.finishedDate ?? null }, userId,
    ).catch((err) => console.error('[BatchProfile] recordBatchHistoryEvent(batch_closed) failed:', err));
    setShowFinishDialog(false);
    refresh();
  }

  function handleArchiveBatch() {
    archiveBatch(batchId);
    void recordArchiveBatch(batchId).catch((err) =>
      console.error('[BatchProfile] recordArchiveBatch failed:', err),
    );
    void recordBatchHistoryEvent(
      batchId, 'batch_archived', null, userId,
    ).catch((err) => console.error('[BatchProfile] recordBatchHistoryEvent(batch_archived) failed:', err));
    setShowArchiveDialog(false);
    refresh();
  }

  function handleActivateBatch() {
    activateBatch(batchId);
    void recordUpdateBatch(batchId, { status: 'Aktif' }).catch((err) =>
      console.error('[BatchProfile] recordUpdateBatch (activate) failed:', err),
    );
    void recordBatchHistoryEvent(
      batchId, 'batch_activated', null, userId,
    ).catch((err) => console.error('[BatchProfile] recordBatchHistoryEvent(batch_activated) failed:', err));
    refresh();
  }

  function handleUpdateBatch(
    name: string | null, description: string | null,
    purpose: string | null, location: string | null,
    startDate: string | null, endDate: string | null,
  ) {
    updateBatch(batchId, { name, description, purpose, location, startDate, endDate });
    void recordUpdateBatch(batchId, {
      label:       name       || undefined,
      description: description ?? null,
    }).catch((err) => console.error('[BatchProfile] recordUpdateBatch failed:', err));
    void recordBatchHistoryEvent(
      batchId, 'batch_updated', { name, description, purpose, location, startDate, endDate }, userId,
    ).catch((err) => console.error('[BatchProfile] recordBatchHistoryEvent(batch_updated) failed:', err));
    setShowEditSheet(false);
    refresh();
  }

  // ── Move handlers ──
  function openMoveSingle(mwl: MembershipWithLivestock) {
    setMoveTargets([mwl]);
    setShowMoveSheet(true);
  }

  function openMoveMulti() {
    const targets = activeMembers.filter((m) => selectedMbrIds.has(m.membership.id));
    if (targets.length === 0) return;
    setMoveTargets(targets);
    setShowMoveSheet(true);
  }

  // ── Summary cards ──
  const SUMMARY = [
    { icon: '📋', label: 'Total Anggota',   value: `${totalCount}`,                                                    sub: 'ekor aktif'       },
    { icon: '⚖️', label: 'Total Bobot',     value: totalCount > 0 ? `${Math.round(totalWeight)} ${weightUnit}` : '—', sub: 'seluruh anggota'  },
    { icon: '📊', label: 'Rata-rata Bobot', value: totalCount > 0 ? `${avgWeight} ${weightUnit}` : '—',               sub: 'per ekor'         },
    { icon: '🐑', label: 'Jenis Ternak',    value: speciesText,                                                         sub: speciesSet.length > 1 ? 'campuran' : 'tunggal' },
    { icon: '📅', label: 'Tanggal Dibuat',  value: batch.createdDate,                                                   sub: ''                 },
    { icon: '⏱️', label: 'Lama Berjalan',   value: duration,                                                            sub: 'sejak dibuat'     },
  ];

  return (
    <>
      <div style={{
        padding: `16px 16px ${selectMode ? 120 : 40}px`,
        maxWidth: 480, margin: '0 auto',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        <HeaderActions
          batchStatus={batch.status}
          onEdit={() => setShowEditSheet(true)}
          onAddMember={() => setShowAddSheet(true)}
          onFinish={() => setShowFinishDialog(true)}
          onArchive={() => setShowArchiveDialog(true)}
          onActivate={handleActivateBatch}
          onOperasi={() => navigate(`/batch/${batchId}/operasi`)}
        />

        {/* ── Informasi Batch ─────────────────────────────────────────────── */}
        <section>
          <SectionLabel title="Informasi Batch" />
          <Card>
            {/* ── Name + badges header ── */}
            <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {batch.name ?? batch.id}
                  </div>
                  {batch.name && (
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2, fontFamily: 'monospace' }}>
                      {batch.id}
                    </div>
                  )}
                  {batch.livestockIcon && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: batch.livestockTypeBg || '#eceff1', borderRadius: 20, marginTop: 8 }}>
                      <span style={{ fontSize: 13 }}>{batch.livestockIcon}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: batch.livestockTypeColor || '#546e7a' }}>
                        {batch.livestockType || 'Belum ditentukan'}
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: (PROGRAM_CONFIG[batch.label] ?? PROGRAM_CONFIG['Lainnya']).color, background: (PROGRAM_CONFIG[batch.label] ?? PROGRAM_CONFIG['Lainnya']).bg, borderRadius: 20, padding: '3px 10px' }}>
                    {batch.label || 'Lainnya'}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: batchStatusCfg.color, background: batchStatusCfg.bg, borderRadius: 20, padding: '3px 10px' }}>
                    {batch.status}
                  </span>
                </div>
              </div>
            </div>
            {/* ── Info rows ── */}
            {([
              { label: 'Nama Batch',        value: batch.name ?? batch.id },
              { label: 'Tipe Batch',        value: batch.label || 'Lainnya' },
              { label: 'Status',            value: batch.status },
              { label: 'Tujuan',            value: (batch as { purpose?: string | null }).purpose ?? '—' },
              { label: 'Lokasi',            value: (batch as { location?: string | null }).location ?? '—' },
              { label: 'Tanggal Mulai',     value: (batch as { startDate?: string | null }).startDate ?? '—' },
              { label: 'Tanggal Dibuat',    value: batch.createdDate },
              { label: 'Target Selesai',    value: (batch as { endDate?: string | null }).endDate ?? '—' },
              { label: 'Tanggal Selesai',   value: batch.finishedDate ?? '—' },
              { label: 'Deskripsi',         value: batch.description ?? '—' },
              { label: 'Total Anggota',     value: `${allTimeMemberCount} ekor (semua waktu)` },
              { label: 'Anggota Aktif',     value: `${totalCount} ekor` },
            ] as { label: string; value: string }[]).map(({ label, value }, i, arr) => (
              <div key={label} style={{ display: 'flex', gap: 12, padding: '10px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, flexShrink: 0, width: 120 }}>{label}</span>
                <span style={{ fontSize: 12.5, color: 'var(--color-text)', fontWeight: 500, flex: 1, lineHeight: 1.4 }}>{value}</span>
              </div>
            ))}
          </Card>
        </section>

        {/* ── Ringkasan ────────────────────────────────────────────────────── */}
        <section>
          <SectionLabel title="Ringkasan" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {SUMMARY.map((card) => (
              <Card key={card.label} style={{ padding: '14px 14px 12px' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{card.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>{card.value}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text)', fontWeight: 600, marginTop: 4 }}>{card.label}</div>
                {card.sub && <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 1 }}>{card.sub}</div>}
              </Card>
            ))}
          </div>
        </section>

        {/* ── Statistik ───────────────────────────────────────────────────── */}
        <StatisticsSection />

        {/* ── Daftar Anggota ───────────────────────────────────────────────── */}
        <section>
          {/* ── Section header: label + Pilih + Tambah ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
              Daftar Anggota ({totalCount})
            </h2>
            <div style={{ display: 'flex', gap: 6 }}>
              {totalCount > 0 && isBatchActive && (
                <button
                  type="button"
                  onClick={() => { selectMode ? exitSelectMode() : enterSelectMode(); }}
                  style={{
                    padding: '5px 12px', fontSize: 11, fontWeight: 700, borderRadius: 20, cursor: 'pointer',
                    border: selectMode ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                    background: selectMode ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: selectMode ? '#fff' : 'var(--color-muted)',
                  }}
                >
                  Pilih
                </button>
              )}
              {isBatchActive && (
                <button
                  type="button"
                  onClick={() => setShowAddSheet(true)}
                  style={{
                    padding: '5px 12px', fontSize: 11, fontWeight: 700, borderRadius: 20, cursor: 'pointer',
                    border: 'none', background: 'var(--color-primary)', color: '#fff',
                  }}
                >
                  + Tambah
                </button>
              )}
            </div>
          </div>

          {/* Empty state (no members at all) */}
          {totalCount === 0 ? (
            <EmptyMembersState onAdd={() => setShowAddSheet(true)} isBatchActive={isBatchActive} />
          ) : (
            <>
              {/* ── Toolbar: search + filter + sort ── */}
              <div style={{ marginBottom: 10 }}>
                {/* Row 1: search + filter + sort buttons */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  {/* Search */}
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      type="search"
                      placeholder="Cari nama, ID, atau ras..."
                      value={search}
                      onChange={(e) => handleSearch(e.target.value)}
                      style={{ paddingLeft: 36, fontSize: 13 }}
                    />
                    <span style={{
                      position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 15, color: 'var(--color-muted)', pointerEvents: 'none',
                    }}>🔍</span>
                  </div>
                  {/* Filter button */}
                  <button
                    type="button"
                    onClick={() => setShowFilterSheet(true)}
                    style={{
                      flexShrink: 0, padding: '0 12px', height: 40, borderRadius: 'var(--radius-sm)',
                      border: activeFilterCount > 0 ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                      background: activeFilterCount > 0 ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: activeFilterCount > 0 ? '#fff' : 'var(--color-muted)',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    ⚙️
                    {activeFilterCount > 0 && (
                      <span style={{
                        background: '#fff', color: 'var(--color-primary)',
                        borderRadius: '50%', width: 16, height: 16,
                        fontSize: 10, fontWeight: 900,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                  {/* Sort button */}
                  <button
                    type="button"
                    onClick={() => setShowSortSheet(true)}
                    style={{
                      flexShrink: 0, padding: '0 12px', height: 40, borderRadius: 'var(--radius-sm)',
                      border: '1.5px solid var(--color-border)',
                      background: 'var(--color-surface)', color: 'var(--color-muted)',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    ↕
                  </button>
                </div>
                {/* Row 2: count + active sort label */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>
                    {sorted.length} anggota{activeFilterCount > 0 ? ' (difilter)' : ''}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                    ↕ {currentSortLabel}
                  </span>
                </div>
              </div>

              {/* ── Member list / empty state ── */}
              {sorted.length === 0 ? (
                /* ── No search/filter result ── */
                <Card style={{ padding: '36px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
                    Tidak ada ternak yang ditemukan.
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                    Coba ubah kata kunci atau sesuaikan filter.
                  </div>
                </Card>
              ) : (
                /* ── Cards ── */
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {pageItems.map(({ membership, lv }) => (
                      <LivestockMemberCard
                        key={membership.id}
                        lv={lv}
                        selectMode={selectMode && isBatchActive}
                        selected={selectedMbrIds.has(membership.id)}
                        isBatchActive={isBatchActive}
                        onToggleSelect={() => toggleSelect(membership.id)}
                        onNavigate={() => navigate(`/livestock/${lv.id}`)}
                        onRemove={() => openRemoveSingle({ membership, lv })}
                        onMove={() => openMoveSingle({ membership, lv })}
                        onLongPress={() => { if (isBatchActive) enterSelectMode(); }}
                      />
                    ))}
                  </div>
                  <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
                </>
              )}
            </>
          )}
        </section>

        {/* ── Riwayat Batch ────────────────────────────────────────────────── */}
        <HistorySection batchId={batchId} />

        {/* ── View All Members link ─────────────────────────────────────────── */}
        {totalCount > 0 && (
          <button
            type="button"
            onClick={() => navigate(`/batch/${batchId}/members`)}
            style={{
              width: '100%', padding: '13px 16px',
              background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, color: 'var(--color-primary)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            Lihat Semua Anggota (Termasuk Riwayat) ›
          </button>
        )}
      </div>

      {/* ── Multi-select bottom bar ─────────────────────────────────────────── */}
      {selectMode && (
        <SelectionBar
          count={selectedMbrIds.size}
          onRemove={openRemoveMulti}
          onMove={openMoveMulti}
          onCancel={exitSelectMode}
        />
      )}

      {/* ── Member Filter Sheet ─────────────────────────────────────────────── */}
      <MemberFilterSheet
        open={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        filters={memberFilters}
        setFilters={handleFilters}
        onReset={handleResetFilters}
        speciesOptions={speciesOptions}
        breedOptions={breedOptions}
      />

      {/* ── Sort Picker Sheet ───────────────────────────────────────────────── */}
      <SortPickerSheet
        open={showSortSheet}
        onClose={() => setShowSortSheet(false)}
        sortBy={sortBy}
        onSelect={handleSort}
      />

      {/* ── Add Members Sheet ───────────────────────────────────────────────── */}
      {showAddSheet && (
        <AddMembersSheet
          batchId={batchId}
          activeMemberIds={activeMemberIds}
          onClose={() => setShowAddSheet(false)}
          onAdded={() => { refresh(); }}
        />
      )}

      {/* ── Remove Confirmation Dialog ─────────────────────────────────────── */}
      {showRemoveDialog && (
        <RemoveDialog
          targets={removeTargets}
          reason={removeReason}
          onReasonChange={setRemoveReason}
          onConfirm={confirmRemove}
          onCancel={() => { setShowRemoveDialog(false); setRemoveTargets([]); setRemoveReason(''); }}
        />
      )}

      {/* ── Finish Batch Dialog ─────────────────────────────────────────────── */}
      {showFinishDialog && (
        <FinishBatchDialog
          batchName={batch.name ?? batch.id}
          activeMemberCount={totalCount}
          onConfirm={handleFinishBatch}
          onCancel={() => setShowFinishDialog(false)}
        />
      )}

      {/* ── Archive Batch Dialog ────────────────────────────────────────────── */}
      {showArchiveDialog && (
        <ArchiveBatchDialog
          batchName={batch.name ?? batch.id}
          isCurrentlyActive={isBatchActive}
          activeMemberCount={totalCount}
          onConfirm={handleArchiveBatch}
          onCancel={() => setShowArchiveDialog(false)}
        />
      )}

      {/* ── Edit Batch Sheet ────────────────────────────────────────────────── */}
      {showEditSheet && (
        <EditBatchSheet
          currentName={batch.name}
          currentDescription={batch.description}
          currentPurpose={(batch as { purpose?: string | null }).purpose ?? null}
          currentLocation={(batch as { location?: string | null }).location ?? null}
          currentStartDate={(batch as { startDate?: string | null }).startDate ?? null}
          currentEndDate={(batch as { endDate?: string | null }).endDate ?? null}
          onSave={handleUpdateBatch}
          onClose={() => setShowEditSheet(false)}
        />
      )}

      {/* ── Move Members Sheet ──────────────────────────────────────────────── */}
      {showMoveSheet && (
        <MoveMemberSheet
          batchId={batchId}
          targets={moveTargets}
          onClose={() => { setShowMoveSheet(false); setMoveTargets([]); }}
          onMoved={() => { exitSelectMode(); refresh(); }}
        />
      )}
    </>
  );
}
