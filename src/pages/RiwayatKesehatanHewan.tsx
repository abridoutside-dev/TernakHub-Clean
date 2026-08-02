/**
 * RiwayatKesehatanHewan.tsx  (KH-008 — List)
 * ─────────────────────────────────────────────────────────────────
 * Timeline seluruh kasus kesehatan (KH-002 hingga KH-007).
 * Route: /kesehatan-hewan/riwayat
 *
 * Setiap baris = satu TindakanSesi (satu kasus medis).
 * Data di-aggregate dari: Pemeriksaan, Diagnosa, Tindakan, Pengobatan, Kontrol.
 */

import { useState, useMemo } from 'react';
import { useNavigate }       from 'react-router-dom';
import { useLivestock } from '../hooks/useLivestock';

import { TINDAKAN_SESI_DB, getTindakanItemsBySesi } from '../data/tindakanKesehatanData';
import { getPemeriksaan }                            from '../data/pemeriksaanKesehatanData';
import { getDiagnosa }                               from '../data/diagnosaKesehatanData';
import { getPengobatanSesiByTindakan, getPengobatanItemsBySesi } from '../data/pengobatanKesehatanData';
import {
  getKasusStatus,
  getJadwalTerakhir,
  type StatusKasus,
  type JadwalKontrol,
} from '../data/kontrolKesehatanData';
import { getLivestock }     from '../data/livestockData';
import { getBatch, BATCH_DB } from '../data/batchData';

// ─── Aggregated row type ──────────────────────────────────────────────────────

type KasusRow = {
  tindakanSesiId: string;
  tanggal:        string;   // YYYY-MM-DD from pemeriksaan
  petugas:        string;
  mode:           'individu' | 'batch';
  livestockId:    string | null;
  batchId:        string | null;
  subjectLabel:   string;
  subjectIcon:    string;
  subjectTypeBg:  string;
  location:       string;   // livestock.location or ''
  diagnosaLabel:  string;
  kasusStatus:    StatusKasus;
  jumlahTindakan: number;
  jumlahObat:     number;
  jadwal:         JadwalKontrol | null;
};

function buildKasusRows(): KasusRow[] {
  const rows: KasusRow[] = [];
  for (const sesi of TINDAKAN_SESI_DB) {
    const pemeriksaan = getPemeriksaan(sesi.pemeriksaanId);
    if (!pemeriksaan) continue;

    const diagnosa = sesi.diagnosaId ? getDiagnosa(sesi.diagnosaId) : null;
    const diagnosaLabel = diagnosa
      ? (diagnosa.sumber === 'master_penyakit'
          ? (diagnosa.namaPenyakit ?? 'Dari Master Penyakit')
          : (diagnosa.namaDiagnosa ?? 'Manual'))
      : 'Tanpa Diagnosa';

    const tindakanItems   = getTindakanItemsBySesi(sesi.id);
    const pengobatanSesi  = getPengobatanSesiByTindakan(sesi.id);
    const pengobatanItems = pengobatanSesi ? getPengobatanItemsBySesi(pengobatanSesi.id) : [];

    const kasusStatus = getKasusStatus(sesi.id);
    const jadwal      = kasusStatus === 'Aktif' ? getJadwalTerakhir(sesi.id) : null;

    // Resolve subject
    let subjectLabel  = 'Tidak Diketahui';
    let subjectIcon   = '❓';
    let subjectTypeBg = '#f5f5f5';
    let location      = '';

    if (pemeriksaan.mode === 'individu' && pemeriksaan.livestockId) {
      const lv = getLivestock(pemeriksaan.livestockId);
      subjectLabel  = lv.name ?? lv.id;
      subjectIcon   = lv.typeIcon ?? '🐄';
      subjectTypeBg = lv.typeBg   ?? '#e8f5e9';
      location      = lv.location ?? '';
    } else if (pemeriksaan.mode === 'batch' && pemeriksaan.batchId) {
      const b = getBatch(pemeriksaan.batchId);
      subjectLabel  = b?.label ?? b?.name ?? 'Batch';
      subjectIcon   = b?.livestockIcon ?? '🐑';
      subjectTypeBg = b?.livestockTypeBg ?? '#e8f5e9';
    }

    rows.push({
      tindakanSesiId: sesi.id,
      tanggal:        pemeriksaan.tanggal,
      petugas:        pemeriksaan.petugas,
      mode:           pemeriksaan.mode,
      livestockId:    pemeriksaan.livestockId,
      batchId:        pemeriksaan.batchId,
      subjectLabel,
      subjectIcon,
      subjectTypeBg,
      location,
      diagnosaLabel,
      kasusStatus,
      jumlahTindakan: tindakanItems.length,
      jumlahObat:     pengobatanItems.length,
      jadwal,
    });
  }
  // Newest first
  return rows.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

// ─── Status config ────────────────────────────────────────────────────────────

const KASUS_STATUS_CFG: Record<StatusKasus, { bg: string; color: string; label: string }> = {
  Aktif:   { bg: '#fff3e0', color: '#e65100', label: 'Aktif' },
  Selesai: { bg: '#e8f5e9', color: '#2e7d32', label: 'Selesai' },
  Ditutup: { bg: '#ffebee', color: '#c62828', label: 'Ditutup' },
};

// ─── Date presets ─────────────────────────────────────────────────────────────

type DatePreset = 'all' | 'today' | '7d' | '30d' | 'custom';

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'all',    label: 'Semua' },
  { key: 'today',  label: 'Hari Ini' },
  { key: '7d',     label: '7 Hari' },
  { key: '30d',    label: '30 Hari' },
  { key: 'custom', label: 'Kustom' },
];

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getPresetRange(preset: DatePreset): { from: string; to: string } | null {
  if (preset === 'today') return { from: todayStr(), to: todayStr() };
  if (preset === '7d')    return { from: daysAgoStr(6), to: todayStr() };
  if (preset === '30d')   return { from: daysAgoStr(29), to: todayStr() };
  return null;
}

function formatDateShort(yyyymmdd: string): string {
  if (!yyyymmdd) return '—';
  const [y, m, d] = yyyymmdd.split('-');
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
}

// ─── Filter state ─────────────────────────────────────────────────────────────

interface FilterState {
  statusKasus: StatusKasus | 'all';
  petugas:     string;
  batchId:     string;
  lokasi:      string;
  customFrom:  string;
  customTo:    string;
}

const EMPTY_FILTER: FilterState = {
  statusKasus: 'all',
  petugas:     '',
  batchId:     '',
  lokasi:      '',
  customFrom:  '',
  customTo:    '',
};

// ─── Filter Sheet ─────────────────────────────────────────────────────────────

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
  background: 'var(--color-bg)', color: 'var(--color-text)',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
};

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

  const batchOptions = useMemo(() => Object.values(BATCH_DB), []);

  function reset() { setLocal(EMPTY_FILTER); }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.4)' }} />
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

        {/* Status Kasus */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
            Status Kasus
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['all', 'Aktif', 'Selesai', 'Ditutup'] as const).map((s) => (
              <button key={s} type="button"
                onClick={() => setLocal((p) => ({ ...p, statusKasus: s }))}
                style={{
                  padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: local.statusKasus === s ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                  background: local.statusKasus === s ? 'var(--color-primary)' : 'var(--color-bg)',
                  color: local.statusKasus === s ? '#fff' : 'var(--color-text)',
                }}>
                {s === 'all' ? 'Semua' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Petugas */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
            Petugas
          </div>
          <input
            type="text"
            placeholder="Nama petugas…"
            value={local.petugas}
            onChange={(e) => setLocal((p) => ({ ...p, petugas: e.target.value }))}
            style={INPUT_STYLE}
          />
        </div>

        {/* Batch */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
            Batch
          </div>
          <select
            value={local.batchId}
            onChange={(e) => setLocal((p) => ({ ...p, batchId: e.target.value }))}
            style={{ ...INPUT_STYLE, cursor: 'pointer', appearance: 'none' as const }}
          >
            <option value="">Semua Batch</option>
            {batchOptions.map((b) => (
              <option key={b.id} value={b.id}>{b.label ?? b.name ?? b.id}</option>
            ))}
          </select>
        </div>

        {/* Lokasi */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
            Lokasi
          </div>
          <input
            type="text"
            placeholder="Kandang, Blok…"
            value={local.lokasi}
            onChange={(e) => setLocal((p) => ({ ...p, lokasi: e.target.value }))}
            style={INPUT_STYLE}
          />
        </div>

        {/* Rentang Tanggal Kustom */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
            Rentang Tanggal Kustom
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>Dari</div>
              <input type="date" value={local.customFrom}
                onChange={(e) => setLocal((p) => ({ ...p, customFrom: e.target.value }))}
                style={{ ...INPUT_STYLE }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>Sampai</div>
              <input type="date" value={local.customTo}
                onChange={(e) => setLocal((p) => ({ ...p, customTo: e.target.value }))}
                style={{ ...INPUT_STYLE }} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={reset} style={{
            flex: 1, padding: '13px', fontSize: 14, fontWeight: 700,
            border: '1.5px solid var(--color-primary)', borderRadius: 'var(--radius-sm)',
            background: 'none', color: 'var(--color-primary)', cursor: 'pointer',
          }}>
            Reset
          </button>
          <button type="button" onClick={() => { onApply(local); onClose(); }} style={{
            flex: 2, padding: '13px', fontSize: 14, fontWeight: 700,
            border: 'none', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-primary)', color: '#fff', cursor: 'pointer',
          }}>
            Terapkan Filter
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Kasus Card ───────────────────────────────────────────────────────────────

function KasusCard({ row, onClick }: { row: KasusRow; onClick: () => void }) {
  const sCfg = KASUS_STATUS_CFG[row.kasusStatus];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', cursor: 'pointer', padding: 0,
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
      }}
    >
      {/* Top row: subject + date + status */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 14px 8px', borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{
            width: 30, height: 30, borderRadius: '50%',
            background: row.subjectTypeBg, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 16, flexShrink: 0,
          }}>
            {row.subjectIcon}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: 'var(--color-text)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {row.subjectLabel}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
              {formatDateShort(row.tanggal)} · {row.petugas}
            </div>
          </div>
        </div>
        <span style={{
          flexShrink: 0, marginLeft: 8, fontSize: 10, fontWeight: 700,
          background: sCfg.bg, color: sCfg.color,
          borderRadius: 20, padding: '3px 9px',
        }}>
          {sCfg.label}
        </span>
      </div>

      {/* Diagnosa */}
      <div style={{ padding: '8px 14px' }}>
        <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 3 }}>DIAGNOSA</div>
        <div style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 500, lineHeight: 1.4 }}>
          {row.diagnosaLabel}
        </div>
      </div>

      {/* Bottom chips */}
      <div style={{ padding: '0 14px 10px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 5 }}>
        <Chip icon="🩹" label={`${row.jumlahTindakan} tindakan`} />
        {row.jumlahObat > 0 && <Chip icon="💊" label={`${row.jumlahObat} obat`} />}
        {row.jadwal && (
          <Chip icon="📅" label={`Jadwal ${formatDateShort(row.jadwal.tanggal)}`} warn />
        )}
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: 'var(--color-primary)' }}>
          Lihat Detail ›
        </span>
      </div>
    </button>
  );
}

function Chip({ icon, label, warn }: { icon: string; label: string; warn?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 11, fontWeight: 600,
      background: warn ? '#fff8e1' : 'var(--color-bg)',
      color:      warn ? '#f57f17' : 'var(--color-muted)',
      border:     `1px solid ${warn ? '#ffe082' : 'var(--color-border)'}`,
      borderRadius: 20, padding: '2px 8px',
    }}>
      {icon} {label}
    </span>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 14 }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%', background: 'var(--color-primary-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
      }}>
        🩺
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          {hasFilter ? 'Tidak Ada Hasil' : 'Belum Ada Riwayat'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
          {hasFilter
            ? 'Coba ubah filter atau kata kunci pencarian.'
            : 'Seluruh kasus kesehatan akan tercatat di sini setelah proses Tindakan selesai.'}
        </div>
      </div>
    </div>
  );
}

// ─── Active Filter Badge ──────────────────────────────────────────────────────

function ActiveFilterBadge({ count, onClear }: { count: number; onClear: () => void }) {
  if (count === 0) return null;
  return (
    <button type="button" onClick={onClear} style={{
      flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      border: '1.5px solid var(--color-primary)',
      background: 'var(--color-primary)', color: '#fff', cursor: 'pointer',
    }}>
      {count} filter aktif ✕
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RiwayatKesehatanHewan() {
  const navigate = useNavigate();

  // Populates LIVESTOCK_DB and BATCH_DB from Supabase so deep-link /
  // hard-refresh navigations get live data instead of an empty in-memory store.
  const { isLoading, error, refresh } = useLivestock();
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 36 }}>⏳</span>
        <div style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 600 }}>Memuat riwayat kesehatan hewan...</div>
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

  const [query,      setQuery]      = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);

  // Build full list — called directly so new cases added in the same session appear immediately
  const allRows = buildKasusRows();

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filter.statusKasus !== 'all') n++;
    if (filter.petugas)   n++;
    if (filter.batchId)   n++;
    if (filter.lokasi)    n++;
    if (filter.customFrom || filter.customTo) n++;
    return n;
  }, [filter]);

  const hasAnyFilter = activeFilterCount > 0 || !!query || datePreset !== 'all';

  // Effective date range
  const effectiveRange = useMemo((): { from: string; to: string } | null => {
    if (datePreset === 'custom') {
      if (filter.customFrom || filter.customTo) return { from: filter.customFrom, to: filter.customTo };
      return null;
    }
    return getPresetRange(datePreset);
  }, [datePreset, filter.customFrom, filter.customTo]);

  // Filtered rows
  const filtered = useMemo(() => {
    return allRows.filter((row) => {
      // Search
      if (query) {
        const q = query.toLowerCase();
        const match =
          row.diagnosaLabel.toLowerCase().includes(q) ||
          row.petugas.toLowerCase().includes(q) ||
          row.subjectLabel.toLowerCase().includes(q) ||
          row.location.toLowerCase().includes(q);
        if (!match) return false;
      }
      // Status Kasus
      if (filter.statusKasus !== 'all' && row.kasusStatus !== filter.statusKasus) return false;
      // Petugas
      if (filter.petugas && !row.petugas.toLowerCase().includes(filter.petugas.toLowerCase())) return false;
      // Batch
      if (filter.batchId && row.batchId !== filter.batchId) return false;
      // Lokasi
      if (filter.lokasi && !row.location.toLowerCase().includes(filter.lokasi.toLowerCase())) return false;
      // Date range
      if (effectiveRange) {
        if (effectiveRange.from && row.tanggal < effectiveRange.from) return false;
        if (effectiveRange.to   && row.tanggal > effectiveRange.to)   return false;
      }
      return true;
    });
  }, [allRows, query, filter, effectiveRange]);

  function clearAllFilters() {
    setQuery('');
    setDatePreset('all');
    setFilter(EMPTY_FILTER);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--color-bg)' }}>

      {/* ── Search + Filter bar ─────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 'var(--top-app-bar-height)', zIndex: 10,
        background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)',
        padding: '10px 14px 10px',
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', maxWidth: 480, margin: '0 auto' }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)', padding: '10px 12px',
          }}>
            <span style={{ fontSize: 15, color: 'var(--color-muted)', flexShrink: 0 }}>🔍</span>
            <input
              type="search"
              placeholder="Diagnosa, petugas, nama ternak…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                flex: 1, border: 'none', background: 'transparent',
                fontSize: 13, color: 'var(--color-text)', outline: 'none',
              }}
            />
          </div>
          <button type="button" onClick={() => setShowFilter(true)} style={{
            flexShrink: 0, padding: '10px 13px',
            border: `1.5px solid ${activeFilterCount > 0 ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-sm)',
            background: activeFilterCount > 0 ? 'var(--color-primary)' : 'var(--color-surface)',
            color: activeFilterCount > 0 ? '#fff' : 'var(--color-text)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span>⚙</span>
            {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
          </button>
        </div>

        {/* Date presets */}
        <div style={{
          display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2,
          maxWidth: 480, margin: '8px auto 0',
        }}>
          {DATE_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setDatePreset(p.key)}
              style={{
                flexShrink: 0, padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap',
                border: datePreset === p.key ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                background: datePreset === p.key ? 'var(--color-primary)' : 'var(--color-bg)',
                color: datePreset === p.key ? '#fff' : 'var(--color-text)',
              }}
            >
              {p.label}
            </button>
          ))}
          <ActiveFilterBadge count={activeFilterCount} onClear={clearAllFilters} />
        </div>
      </div>

      {/* ── List ────────────────────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 80px', maxWidth: 480, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {filtered.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>
              {filtered.length} kasus ditemukan
            </div>
            {hasAnyFilter && (
              <button type="button" onClick={clearAllFilters} style={{
                border: 'none', background: 'none', fontSize: 12, color: 'var(--color-primary)',
                fontWeight: 700, cursor: 'pointer', padding: 0,
              }}>
                Hapus Semua Filter
              </button>
            )}
          </div>
        )}

        {filtered.length === 0
          ? <EmptyState hasFilter={hasAnyFilter} />
          : filtered.map((row) => (
              <KasusCard
                key={row.tindakanSesiId}
                row={row}
                onClick={() => navigate(`/kesehatan-hewan/riwayat/${row.tindakanSesiId}`)}
              />
            ))
        }
      </div>

      {/* ── Filter Sheet ─────────────────────────────────────────────────── */}
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
    </div>
  );
}
